import { describe, it, expect } from "vitest";
import { sanitizeSearch } from "@/lib/utils";

describe("sanitizeSearch", () => {
  it("passes through ordinary search terms", () => {
    expect(sanitizeSearch("Acme Couture")).toBe("Acme Couture");
    expect(sanitizeSearch("jane@example.com")).toBe("jane@example.com");
  });

  it("strips PostgREST filter-injection characters", () => {
    // A comma would start a new .or() condition; parens/colon/star are syntax.
    expect(sanitizeSearch("x,status.eq.approved")).toBe("xstatus.eq.approved");
    expect(sanitizeSearch("a(b)c")).toBe("abc");
    expect(sanitizeSearch("a*b:c\\d")).toBe("abcd");
  });

  it("trims and caps length", () => {
    expect(sanitizeSearch("   hi   ")).toBe("hi");
    expect(sanitizeSearch("a".repeat(500)).length).toBe(100);
  });
});
