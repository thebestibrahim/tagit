import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockTrialingSelect = vi.fn();
const mockActiveSelect = vi.fn();
const mockSubscriptionUpdate = vi.fn();
const mockExistingInvoiceSelect = vi.fn();
const mockOverdueInvoicesSelect = vi.fn();
const mockInvoiceUpdate = vi.fn();

const mockCreateSubscriptionInvoice = vi.fn();
const mockSendInvoiceEmail = vi.fn(() => Promise.resolve());
const mockSendTrialEndedInvoice = vi.fn(() => Promise.resolve());
const mockInvoiceNumber = vi.fn(() => "INV-0001");
const mockInvoicePayUrl = vi.fn(() => "http://localhost:3000/api/billing/pay/inv-1");

const mockSendTrialEnding7Email = vi.fn(() => Promise.resolve());
const mockSendTrialEndingTomorrowEmail = vi.fn(() => Promise.resolve());
const mockSendInvoiceReminderEmail = vi.fn(() => Promise.resolve());
const mockSendAccountSuspendedEmail = vi.fn(() => Promise.resolve());

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "subscriptions") {
        return {
          select: vi.fn((cols: string) => {
            if (cols.includes("plans")) {
              return { eq: vi.fn(() => Promise.resolve(mockTrialingSelect())) };
            }
            return { eq: vi.fn(() => Promise.resolve(mockActiveSelect())) };
          }),
          update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve(mockSubscriptionUpdate())) })),
        };
      }
      if (table === "invoices") {
        return {
          select: vi.fn((cols: string) => {
            if (cols.includes("companies")) {
              return {
                eq: vi.fn(() => ({
                  lt: vi.fn(() => Promise.resolve(mockOverdueInvoicesSelect())),
                })),
              };
            }
            return {
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  maybeSingle: vi.fn(() => Promise.resolve(mockExistingInvoiceSelect())),
                })),
              })),
            };
          }),
          update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve(mockInvoiceUpdate())) })),
        };
      }
      return {};
    }),
  })),
}));

vi.mock("@/lib/billing/invoices", () => ({
  createSubscriptionInvoice: mockCreateSubscriptionInvoice,
  sendInvoiceEmail: mockSendInvoiceEmail,
  sendTrialEndedInvoice: mockSendTrialEndedInvoice,
  invoiceNumber: mockInvoiceNumber,
  invoicePayUrl: mockInvoicePayUrl,
}));

vi.mock("@/lib/email", () => ({
  sendTrialEnding7Email: mockSendTrialEnding7Email,
  sendTrialEndingTomorrowEmail: mockSendTrialEndingTomorrowEmail,
  sendInvoiceReminderEmail: mockSendInvoiceReminderEmail,
  sendAccountSuspendedEmail: mockSendAccountSuspendedEmail,
}));

const { GET } = await import("@/app/api/cron/billing/route");

const TODAY = new Date("2026-06-29T08:00:00.000Z");

function cronRequest() {
  return new Request("http://localhost/api/cron/billing", {
    headers: { authorization: "Bearer test-cron-secret" },
  });
}

function daysFromToday(days: number): string {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

describe("GET /api/cron/billing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(TODAY);
    process.env.CRON_SECRET = "test-cron-secret";

    mockTrialingSelect.mockReturnValue({ data: [], error: null });
    mockActiveSelect.mockReturnValue({ data: [], error: null });
    mockSubscriptionUpdate.mockReturnValue({ error: null });
    mockExistingInvoiceSelect.mockReturnValue({ data: null, error: null });
    mockOverdueInvoicesSelect.mockReturnValue({ data: [], error: null });
    mockInvoiceUpdate.mockReturnValue({ error: null });
    mockCreateSubscriptionInvoice.mockResolvedValue({ id: "invoice-uuid" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 401 without a valid CRON_SECRET", async () => {
    const res = await GET(new Request("http://localhost/api/cron/billing", { headers: { authorization: "Bearer wrong" } }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when CRON_SECRET is unset", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(cronRequest());
    expect(res.status).toBe(401);
  });

  it("sends the 7-day trial reminder", async () => {
    mockTrialingSelect.mockReturnValue({
      data: [
        {
          id: "sub-1",
          trial_ends_at: daysFromToday(7),
          custom_monthly_price: null,
          billing_interval: "monthly",
          plans: { name: "Pro", monthly_price: 50000 },
          companies: { name: "Studio Noir", email: "brand@example.com" },
        },
      ],
      error: null,
    });
    const res = await GET(cronRequest());
    expect(res.status).toBe(200);
    expect(mockSendTrialEnding7Email).toHaveBeenCalledWith(
      "brand@example.com",
      expect.objectContaining({ companyName: "Studio Noir" })
    );
    expect(mockSendTrialEndingTomorrowEmail).not.toHaveBeenCalled();
    expect(mockCreateSubscriptionInvoice).not.toHaveBeenCalled();
  });

  it("sends the trial-ends-tomorrow reminder", async () => {
    mockTrialingSelect.mockReturnValue({
      data: [
        {
          id: "sub-1",
          trial_ends_at: daysFromToday(1),
          custom_monthly_price: null,
          billing_interval: "monthly",
          plans: { name: "Pro", monthly_price: 50000 },
          companies: { name: "Studio Noir", email: "brand@example.com" },
        },
      ],
      error: null,
    });
    const res = await GET(cronRequest());
    expect(res.status).toBe(200);
    expect(mockSendTrialEndingTomorrowEmail).toHaveBeenCalledTimes(1);
  });

  it("issues the first invoice and demotes the subscription to past_due when a trial has ended", async () => {
    mockTrialingSelect.mockReturnValue({
      data: [
        {
          id: "sub-1",
          trial_ends_at: daysFromToday(-1),
          custom_monthly_price: null,
          billing_interval: "monthly",
          plans: { name: "Pro", monthly_price: 50000 },
          companies: { name: "Studio Noir", email: "brand@example.com" },
        },
      ],
      error: null,
    });
    const res = await GET(cronRequest());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(mockCreateSubscriptionInvoice).toHaveBeenCalledWith(expect.anything(), "sub-1");
    expect(mockSendTrialEndedInvoice).toHaveBeenCalledWith(expect.anything(), "invoice-uuid");
    expect(mockSubscriptionUpdate).toHaveBeenCalled();
    expect(body.trials).toBe(1);
    expect(body.invoices).toBe(1);
  });

  it("skips trials that aren't at a 7-day, 1-day, or ended boundary", async () => {
    mockTrialingSelect.mockReturnValue({
      data: [
        {
          id: "sub-1",
          trial_ends_at: daysFromToday(3),
          custom_monthly_price: null,
          billing_interval: "monthly",
          plans: { name: "Pro", monthly_price: 50000 },
          companies: { name: "Studio Noir", email: "brand@example.com" },
        },
      ],
      error: null,
    });
    await GET(cronRequest());
    expect(mockSendTrialEnding7Email).not.toHaveBeenCalled();
    expect(mockSendTrialEndingTomorrowEmail).not.toHaveBeenCalled();
    expect(mockCreateSubscriptionInvoice).not.toHaveBeenCalled();
  });

  it("creates and sends a subscription invoice due today", async () => {
    mockActiveSelect.mockReturnValue({
      data: [{ id: "sub-2", current_period_end: TODAY.toISOString() }],
      error: null,
    });
    const res = await GET(cronRequest());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(mockCreateSubscriptionInvoice).toHaveBeenCalledWith(expect.anything(), "sub-2");
    expect(mockSendInvoiceEmail).toHaveBeenCalledWith(expect.anything(), "invoice-uuid", "subscription");
    expect(body.invoices).toBe(1);
  });

  it("does not double-invoice a subscription that already has an invoice today", async () => {
    mockActiveSelect.mockReturnValue({
      data: [{ id: "sub-2", current_period_end: TODAY.toISOString() }],
      error: null,
    });
    mockExistingInvoiceSelect.mockReturnValue({ data: { id: "existing-invoice" }, error: null });
    const res = await GET(cronRequest());
    const body = await res.json();
    expect(mockCreateSubscriptionInvoice).not.toHaveBeenCalled();
    expect(body.invoices).toBe(0);
  });

  it("suspends the account once an invoice passes the suspension threshold", async () => {
    mockOverdueInvoicesSelect.mockReturnValue({
      data: [
        {
          id: "inv-1",
          company_id: "company-1",
          due_date: daysFromToday(-21).slice(0, 10),
          amount: 50000,
          suspended_at: null,
          reminder_3_sent_at: null,
          reminder_7_sent_at: null,
          reminder_14_sent_at: null,
          companies: { name: "Studio Noir", email: "brand@example.com" },
        },
      ],
      error: null,
    });
    const res = await GET(cronRequest());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(mockSendAccountSuspendedEmail).toHaveBeenCalledWith(
      "brand@example.com",
      expect.objectContaining({ companyName: "Studio Noir" })
    );
    expect(body.suspensions).toBe(1);
    // Suspension is terminal for that invoice this run — no reminder also fires.
    expect(mockSendInvoiceReminderEmail).not.toHaveBeenCalled();
  });

  it("sends the final warning at day 14 overdue", async () => {
    mockOverdueInvoicesSelect.mockReturnValue({
      data: [
        {
          id: "inv-1",
          company_id: "company-1",
          due_date: daysFromToday(-14).slice(0, 10),
          amount: 50000,
          suspended_at: null,
          reminder_3_sent_at: daysFromToday(-11),
          reminder_7_sent_at: daysFromToday(-7),
          reminder_14_sent_at: null,
          companies: { name: "Studio Noir", email: "brand@example.com" },
        },
      ],
      error: null,
    });
    const res = await GET(cronRequest());
    const body = await res.json();
    expect(mockSendInvoiceReminderEmail).toHaveBeenCalledWith(
      "brand@example.com",
      expect.objectContaining({ finalWarning: true })
    );
    expect(body.reminders).toBe(1);
  });

  it("does not re-send a reminder that was already sent", async () => {
    mockOverdueInvoicesSelect.mockReturnValue({
      data: [
        {
          id: "inv-1",
          company_id: "company-1",
          due_date: daysFromToday(-7).slice(0, 10),
          amount: 50000,
          suspended_at: null,
          reminder_3_sent_at: daysFromToday(-4),
          reminder_7_sent_at: daysFromToday(-1),
          reminder_14_sent_at: null,
          companies: { name: "Studio Noir", email: "brand@example.com" },
        },
      ],
      error: null,
    });
    const res = await GET(cronRequest());
    const body = await res.json();
    expect(mockSendInvoiceReminderEmail).not.toHaveBeenCalled();
    expect(body.reminders).toBe(0);
  });

  it("keeps running the remaining tasks if one task throws", async () => {
    mockTrialingSelect.mockReturnValue({
      data: [
        {
          id: "sub-1",
          trial_ends_at: daysFromToday(-1),
          custom_monthly_price: null,
          billing_interval: "monthly",
          plans: { name: "Pro", monthly_price: 50000 },
          companies: { name: "Studio Noir", email: "brand@example.com" },
        },
      ],
      error: null,
    });
    mockCreateSubscriptionInvoice.mockRejectedValueOnce(new Error("db exploded"));
    mockOverdueInvoicesSelect.mockReturnValue({
      data: [
        {
          id: "inv-1",
          company_id: "company-1",
          due_date: daysFromToday(-21).slice(0, 10),
          amount: 50000,
          suspended_at: null,
          reminder_3_sent_at: null,
          reminder_7_sent_at: null,
          reminder_14_sent_at: null,
          companies: { name: "Studio Noir", email: "brand@example.com" },
        },
      ],
      error: null,
    });

    const res = await GET(cronRequest());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    // Task 1 blew up before recording a trial, but task 3/4 still ran.
    expect(body.suspensions).toBe(1);
  });
});
