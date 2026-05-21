import { describe, it, expect, vi, beforeEach } from "vitest";
import { rateLimit, getIp } from "@/lib/rate-limit";

describe("rateLimit (in-memory)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("allows requests within limit", () => {
    const key = `test:${Math.random()}`;
    expect(rateLimit(key, 3, 60_000)).toBe(true);
    expect(rateLimit(key, 3, 60_000)).toBe(true);
    expect(rateLimit(key, 3, 60_000)).toBe(true);
  });

  it("blocks once limit is reached", () => {
    const key = `test:${Math.random()}`;
    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);
    expect(rateLimit(key, 2, 60_000)).toBe(false);
  });

  it("resets after the window expires", () => {
    const key = `test:${Math.random()}`;
    rateLimit(key, 1, 5_000);
    expect(rateLimit(key, 1, 5_000)).toBe(false);

    vi.advanceTimersByTime(6_000);
    expect(rateLimit(key, 1, 5_000)).toBe(true);
  });
});

describe("getIp", () => {
  it("extracts IP from x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    expect(getIp(req)).toBe("9.9.9.9");
  });

  it("returns unknown when no IP headers present", () => {
    const req = new Request("http://localhost");
    expect(getIp(req)).toBe("unknown");
  });
});
