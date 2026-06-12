import { describe, it, expect } from "vitest";
import { chipScanLink, sortChips, toDisplayChips } from "@/lib/batch-chips";

describe("chipScanLink", () => {
  it("builds ${base}/v/${token} with no ?sig param", () => {
    expect(chipScanLink("abc", "https://staging.tagitlux.com")).toBe("https://staging.tagitlux.com/v/abc");
  });

  it("strips trailing slashes from the base", () => {
    expect(chipScanLink("abc", "https://tagitlux.com/")).toBe("https://tagitlux.com/v/abc");
  });

  it("falls back to a relative link when base is empty", () => {
    expect(chipScanLink("abc", "")).toBe("/v/abc");
  });
});

describe("sortChips", () => {
  it("orders tags before cards, then by short_id", () => {
    const out = sortChips([
      { medium: "card", short_id: "B" },
      { medium: "tag", short_id: "Z" },
      { medium: "tag", short_id: "A" },
      { medium: "card", short_id: "A" },
    ]);
    expect(out.map((c) => `${c.medium}:${c.short_id}`)).toEqual([
      "tag:A",
      "tag:Z",
      "card:A",
      "card:B",
    ]);
  });

  it("does not mutate the input array", () => {
    const input = [
      { medium: "card", short_id: "B" },
      { medium: "tag", short_id: "A" },
    ];
    const before = JSON.stringify(input);
    sortChips(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});

describe("toDisplayChips", () => {
  it("resolves working links from tokens and sorts tags-first", () => {
    const out = toDisplayChips(
      [
        { id: "1", short_id: "ZZ", medium: "tag", token: "tok1", status: "created" },
        { id: "2", short_id: "AA", medium: "card", token: "tok2", status: "created" },
      ],
      "https://tagitlux.com"
    );
    expect(out[0]).toMatchObject({ short_id: "ZZ", url: "https://tagitlux.com/v/tok1" });
    expect(out[1]).toMatchObject({ short_id: "AA", url: "https://tagitlux.com/v/tok2" });
  });
});
