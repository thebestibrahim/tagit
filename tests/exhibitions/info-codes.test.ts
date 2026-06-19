import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Shared in-memory store + a minimal stateful Supabase mock ────────────────
// One store backs every createAdminClient() call so a write in one route is
// visible to the next read (used by the toggle-then-scan integration tests).
const h = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Row = Record<string, any>;
  const store: Record<string, Row[]> & { __id: number } = { __id: 0 } as never;

  function rows(table: string): Row[] {
    if (!store[table]) store[table] = [];
    return store[table];
  }

  function matches(row: Row, filters: Record<string, unknown>): boolean {
    return Object.entries(filters).every(([k, v]) => {
      if (k.startsWith("__neq_")) return row[k.slice(6)] !== v;
      if (Array.isArray(v)) return (v as unknown[]).includes(row[k]);
      return row[k] === v;
    });
  }

  function builder(table: string) {
    const filters: Record<string, unknown> = {};
    let op: "select" | "insert" | "update" | "delete" = "select";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payload: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b: any = {};
    b.select = () => b;
    b.insert = (p: unknown) => { op = "insert"; payload = p; return b; };
    b.update = (p: unknown) => { op = "update"; payload = p; return b; };
    b.delete = () => { op = "delete"; return b; };
    b.eq = (c: string, v: unknown) => { filters[c] = v; return b; };
    b.neq = (c: string, v: unknown) => { filters["__neq_" + c] = v; return b; };
    b.in = (c: string, v: unknown) => { filters[c] = v; return b; };
    b.order = () => b;

    function doInsert() {
      const arr = Array.isArray(payload) ? payload : [payload];
      const inserted = arr.map((p: Record<string, unknown>) => ({
        id: "gen-" + (++store.__id),
        scan_count: 0,
        status: "active",
        ...p,
      }));
      rows(table).push(...inserted);
      return inserted;
    }
    function doUpdate() {
      for (const r of rows(table)) if (matches(r, filters)) Object.assign(r, payload);
    }
    function doDelete() {
      store[table] = rows(table).filter((r) => !matches(r, filters));
    }

    b.single = () => {
      if (op === "insert") return Promise.resolve({ data: doInsert()[0], error: null });
      const found = rows(table).find((r) => matches(r, filters));
      return Promise.resolve({ data: found ?? null, error: found ? null : { message: "not found" } });
    };
    b.maybeSingle = () => {
      if (op === "insert") return Promise.resolve({ data: doInsert()[0], error: null });
      const found = rows(table).find((r) => matches(r, filters));
      return Promise.resolve({ data: found ?? null, error: null });
    };
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => {
      let out;
      if (op === "insert") out = { data: doInsert(), error: null };
      else if (op === "update") { doUpdate(); out = { data: null, error: null }; }
      else if (op === "delete") { doDelete(); out = { data: null, error: null }; }
      else out = { data: rows(table).filter((r) => matches(r, filters)), error: null };
      return Promise.resolve(out).then(res, rej);
    };
    return b;
  }

  const admin = { from: (t: string) => builder(t) };
  const state: { userId: string | null } = { userId: "brand-1" };
  const server = { auth: { getUser: () => Promise.resolve({ data: { user: state.userId ? { id: state.userId } : null } }) } };

  // Capture the system prompt sent to the model.
  const groqState: { lastSystem: string | null } = { lastSystem: null };
  const groqCreate = vi.fn((args: { messages: { role: string; content: string }[] }) => {
    groqState.lastSystem = args.messages.find((m) => m.role === "system")?.content ?? null;
    return Promise.resolve({ choices: [{ message: { content: "ok" } }] });
  });

  function reset() {
    for (const k of Object.keys(store)) if (k !== "__id") delete (store as Record<string, unknown>)[k];
    store.__id = 0;
    state.userId = "brand-1";
    groqState.lastSystem = null;
  }

  return { store, admin, server, state, groqState, groqCreate, reset, rows };
});

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.admin }));
vi.mock("@/lib/supabase/server", () => ({ createClient: () => Promise.resolve(h.server) }));
vi.mock("@/lib/rate-limit", () => ({ rateLimitAsync: () => Promise.resolve(true), getIp: () => "1.1.1.1" }));
vi.mock("@/lib/feature-flags/server", () => ({ isBrandFlagEnabled: () => Promise.resolve(true) }));
vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Map([["x-forwarded-for", "9.9.9.9"], ["user-agent", "vitest"]])),
}));
// Lightweight label renderer so the bulk-zip test never touches @react-pdf.
vi.mock("@/lib/exhibition-label", () => ({
  renderInfoLabel: ({ token }: { token: string }) => Promise.resolve(Buffer.from("pdf-" + token)),
  labelFileName: (name: string, ext = "pdf") => `${name}.${ext}`,
}));
vi.mock("@/lib/certificate", () => ({ fetchLogoDataUrl: () => Promise.resolve(null) }));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
vi.mock("groq-sdk", () => ({ default: class { chat = { completions: { create: h.groqCreate } } } as any }));

import { generateInfoToken, buildInfoSystemPrompt, shapeInfoProduct } from "@/lib/exhibitions";
import { unzipSync } from "fflate";

const { GET: infoGet } = await import("@/app/api/info/[token]/route");
const { POST: chatPost } = await import("@/app/api/info/[token]/chat/route");
const { PATCH: togglePatch } = await import("@/app/api/company/exhibitions/codes/[codeId]/route");
const { POST: regenPost } = await import("@/app/api/company/exhibitions/codes/[codeId]/regenerate/route");
const { POST: bulkGenPost } = await import("@/app/api/company/exhibitions/[id]/codes/bulk/route");
const { POST: genPost } = await import("@/app/api/company/exhibitions/[id]/codes/route");
const { GET: bulkLabelGet } = await import("@/app/api/company/exhibitions/[id]/labels/bulk/route");

const COMPANY = "brand-1";

function req(body?: unknown, method = "POST") {
  return new Request("http://localhost/x", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

// Seed an exhibition with one active code on an arts product.
function seedActiveCode(opts: { token?: string; status?: string } = {}) {
  h.store.exhibitions = [{ id: "exh-1", company_id: COMPANY, name: "Lagos Contemporary" }];
  h.store.products = [{
    id: "prod-1",
    company_id: COMPANY,
    name: "Lagos Shadow No. 7",
    industry_fields: {
      title: "Lagos Shadow No. 7",
      artist_name: "Bushua",
      medium: "Oil on canvas",
      dimensions: "90cm x 120cm",
      artist_statement: "A meditation on the city at dusk.",
    },
    photos: ["https://img/1.jpg"],
  }];
  h.store.companies = [{
    id: COMPANY,
    name: "Bushua Art",
    logo_url: null,
    slug: "bushuaart",
    page_enabled: true,
    contact_phone: "+2348012345678",
    ai_enabled: true,
    ai_persona_name: "Guide",
  }];
  h.store.info_codes = [{
    id: "code-1",
    exhibition_id: "exh-1",
    product_id: "prod-1",
    company_id: COMPANY,
    token: opts.token ?? "tok-active-1",
    status: opts.status ?? "active",
    scan_count: 0,
  }];
  // Ownership data exists in the DB but must NEVER reach an info page.
  h.store.ownership_records = [{ id: "own-1", tag_id: "t1", owner_name: "Secret Owner", owner_email: "owner@secret.com", is_current: true }];
}

beforeEach(() => {
  vi.clearAllMocks();
  h.reset();
});

describe("info token generation", () => {
  it("generates a unique, unguessable token on creation", () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const t = generateInfoToken();
      expect(t).toHaveLength(21);
      expect(t).toMatch(/^[A-Za-z0-9_-]{21}$/);
      tokens.add(t);
    }
    expect(tokens.size).toBe(200);
  });

  it("generate route issues a fresh 21-char token", async () => {
    seedActiveCode();
    // remove the seeded code so the product has none, then attach link
    h.store.info_codes = [];
    h.store.exhibition_products = [{ id: "ep-1", exhibition_id: "exh-1", product_id: "prod-1" }];
    const res = await genPost(req({ product_id: "prod-1" }), { params: Promise.resolve({ id: "exh-1" }) });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.code.token).toHaveLength(21);
    expect(json.url).toContain(`/info/${json.code.token}`);
  });
});

describe("public GET /api/info/[token]", () => {
  it("returns the product registration fields for an active code", async () => {
    seedActiveCode();
    const res = await infoGet(req(undefined, "GET"), { params: Promise.resolve({ token: "tok-active-1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("active");
    expect(json.product.name).toBe("Lagos Shadow No. 7");
    const specValues = json.product.specs.map((s: { value: string }) => s.value);
    expect(specValues).toContain("Oil on canvas");
    expect(specValues).toContain("90cm x 120cm");
    expect(json.brand.name).toBe("Bushua Art");
  });

  it("never returns ownership data of any kind", async () => {
    seedActiveCode();
    const res = await infoGet(req(undefined, "GET"), { params: Promise.resolve({ token: "tok-active-1" }) });
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain("owner");
    expect(text).not.toContain("Secret Owner");
    expect(text).not.toContain("owner@secret.com");
  });

  it("rejects an inactive code immediately", async () => {
    seedActiveCode({ status: "inactive" });
    const res = await infoGet(req(undefined, "GET"), { params: Promise.resolve({ token: "tok-active-1" }) });
    const json = await res.json();
    expect(json.status).toBe("expired");
    expect(json.product).toBeUndefined();
  });

  it("rejects a revoked code immediately", async () => {
    seedActiveCode({ status: "revoked" });
    const res = await infoGet(req(undefined, "GET"), { params: Promise.resolve({ token: "tok-active-1" }) });
    const json = await res.json();
    expect(json.status).toBe("expired");
  });

  it("expired response includes the brand slug when the brand has a public page", async () => {
    seedActiveCode({ status: "inactive" });
    const res = await infoGet(req(undefined, "GET"), { params: Promise.resolve({ token: "tok-active-1" }) });
    const json = await res.json();
    expect(json.brand_slug).toBe("bushuaart");
    expect(json.brand_name).toBe("Bushua Art");
  });

  it("omits the brand slug when the brand has no public page", async () => {
    seedActiveCode({ status: "inactive" });
    h.store.companies[0].page_enabled = false;
    const res = await infoGet(req(undefined, "GET"), { params: Promise.resolve({ token: "tok-active-1" }) });
    const json = await res.json();
    expect(json.brand_slug).toBeNull();
  });

  it("increments scan_count and logs the scan with source qr_exhibition", async () => {
    seedActiveCode();
    await infoGet(req(undefined, "GET"), { params: Promise.resolve({ token: "tok-active-1" }) });
    // recordInfoScan is fire-and-forget; let microtasks settle.
    await new Promise((r) => setTimeout(r, 0));
    expect(h.store.info_codes[0].scan_count).toBe(1);
    expect(h.store.scan_logs).toHaveLength(1);
    expect(h.store.scan_logs[0].source).toBe("qr_exhibition");
    expect(h.store.scan_logs[0].info_code_id).toBe("code-1");
    expect(h.store.scan_logs[0].tag_id).toBeNull();
  });
});

describe("toggle", () => {
  it("turning a code off takes effect on the very next public request", async () => {
    seedActiveCode();
    // Sanity: active first.
    const before = await (await infoGet(req(undefined, "GET"), { params: Promise.resolve({ token: "tok-active-1" }) })).json();
    expect(before.status).toBe("active");

    const toggleRes = await togglePatch(req({ status: "inactive" }, "PATCH"), { params: Promise.resolve({ codeId: "code-1" }) });
    expect(toggleRes.status).toBe(200);

    const after = await (await infoGet(req(undefined, "GET"), { params: Promise.resolve({ token: "tok-active-1" }) })).json();
    expect(after.status).toBe("expired");
  });

  it("refuses to toggle a revoked code", async () => {
    seedActiveCode({ status: "revoked" });
    const res = await togglePatch(req({ status: "active" }, "PATCH"), { params: Promise.resolve({ codeId: "code-1" }) });
    expect(res.status).toBe(409);
  });
});

describe("regenerate", () => {
  it("revokes the old token and issues a new one, signalling label redownload", async () => {
    seedActiveCode();
    const res = await regenPost(req(undefined, "POST"), { params: Promise.resolve({ codeId: "code-1" }) });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.prompt_label_redownload).toBe(true);
    expect(json.code.token).not.toBe("tok-active-1");

    const old = h.store.info_codes.find((c) => c.id === "code-1");
    expect(old?.status).toBe("revoked");
    const fresh = h.store.info_codes.find((c) => c.token === json.code.token);
    expect(fresh?.status).toBe("active");

    // The old token is dead on the very next public request.
    const after = await (await infoGet(req(undefined, "GET"), { params: Promise.resolve({ token: "tok-active-1" }) })).json();
    expect(after.status).toBe("expired");
  });
});

describe("bulk generate", () => {
  it("skips products that already have an active code", async () => {
    h.store.exhibitions = [{ id: "exh-1", company_id: COMPANY, name: "Show" }];
    h.store.exhibition_products = [
      { id: "ep-1", exhibition_id: "exh-1", product_id: "prod-A" },
      { id: "ep-2", exhibition_id: "exh-1", product_id: "prod-B" },
    ];
    h.store.info_codes = [
      { id: "code-A", exhibition_id: "exh-1", product_id: "prod-A", company_id: COMPANY, token: "tA", status: "active", scan_count: 0 },
    ];
    const res = await bulkGenPost(req(undefined, "POST"), { params: Promise.resolve({ id: "exh-1" }) });
    const json = await res.json();
    expect(json.count).toBe(1);
    expect(json.generated[0].product_id).toBe("prod-B");
    // prod-A keeps exactly its one code; prod-B gains one.
    expect(h.store.info_codes.filter((c) => c.product_id === "prod-A")).toHaveLength(1);
    expect(h.store.info_codes.filter((c) => c.product_id === "prod-B" && c.status === "active")).toHaveLength(1);
  });
});

describe("bulk labels", () => {
  it("zips one file per active code", async () => {
    h.store.exhibitions = [{ id: "exh-1", company_id: COMPANY, name: "Show" }];
    h.store.companies = [{ id: COMPANY, name: "Bushua Art", logo_url: null }];
    h.store.info_codes = [
      { id: "c1", exhibition_id: "exh-1", company_id: COMPANY, token: "t1", status: "active", products: { name: "Piece One" } },
      { id: "c2", exhibition_id: "exh-1", company_id: COMPANY, token: "t2", status: "active", products: { name: "Piece Two" } },
      { id: "c3", exhibition_id: "exh-1", company_id: COMPANY, token: "t3", status: "inactive", products: { name: "Hidden" } },
    ];
    const res = await bulkLabelGet(req(undefined, "GET"), { params: Promise.resolve({ id: "exh-1" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/zip");
    const buf = new Uint8Array(await res.arrayBuffer());
    const entries = Object.keys(unzipSync(buf));
    expect(entries).toHaveLength(2); // only the two active codes
  });
});

describe("AI chat grounding", () => {
  it("builds a system prompt restricted to the registration fields", () => {
    const product = shapeInfoProduct(
      {
        name: "Lagos Shadow No. 7",
        industry_fields: { medium: "Oil on canvas", dimensions: "90cm x 120cm", artist_statement: "Dusk over the city." },
        photos: [],
      },
      ""
    );
    const prompt = buildInfoSystemPrompt({ brandName: "Bushua Art", personaName: "Guide", product });
    expect(prompt).toContain("Oil on canvas");
    expect(prompt).toContain("90cm x 120cm");
    // Answers must be confined to the provided facts.
    expect(prompt).toContain("Answer ONLY using the information above");
  });

  it("system prompt forbids price, owner and availability answers", () => {
    const product = shapeInfoProduct({ name: "Piece", industry_fields: { medium: "Bronze" }, photos: [] }, "");
    const prompt = buildInfoSystemPrompt({ brandName: "Brand", personaName: "Guide", product });
    expect(prompt.toLowerCase()).toContain("price");
    expect(prompt.toLowerCase()).toContain("owner");
    expect(prompt.toLowerCase()).toContain("availability");
    // No ownership data is ever part of the grounded facts.
    expect(prompt).not.toContain("owner@");
  });

  it("chat route feeds the grounded, registration-only prompt to the model", async () => {
    seedActiveCode();
    const res = await chatPost(req({ message: "What is this piece made of?" }), { params: Promise.resolve({ token: "tok-active-1" }) });
    expect(res.status).toBe(200);
    expect(h.groqState.lastSystem).toContain("Oil on canvas");
    expect(h.groqState.lastSystem).toContain("Answer ONLY using the information above");
    // The model never receives ownership data.
    expect(h.groqState.lastSystem).not.toContain("Secret Owner");
  });

  it("chat route is rejected when the code is not active", async () => {
    seedActiveCode({ status: "inactive" });
    const res = await chatPost(req({ message: "hi" }), { params: Promise.resolve({ token: "tok-active-1" }) });
    expect(res.status).toBe(404);
  });
});
