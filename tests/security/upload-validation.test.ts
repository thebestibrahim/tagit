import { describe, it, expect } from "vitest";
import { validateImageBytes } from "@/lib/upload";

// Minimal valid headers for each format we accept.
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const GIF = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0]);
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
]);
// Windows PE executable ("MZ"), i.e. malware renamed to logo.png.
const EXE = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0, 0, 0]);
// SVG is text, starts with "<svg" or "<?xml".
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

describe("validateImageBytes — accepts real images", () => {
  it.each([
    ["png", PNG, "image/png"],
    ["jpeg", JPEG, "image/jpeg"],
    ["gif", GIF, "image/gif"],
    ["webp", WEBP, "image/webp"],
  ] as const)("accepts a real %s and derives ext from content", (kind, bytes, mime) => {
    const r = validateImageBytes(bytes, mime);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.image.kind).toBe(kind);
      expect(r.image.ext).toBe(kind); // ext comes from detection, not filename
      expect(r.image.mime).toBe(mime);
    }
  });
});

describe("validateImageBytes — blocks disguised payloads", () => {
  it("rejects an executable declared as image/png (malware-as-image)", () => {
    const r = validateImageBytes(EXE, "image/png");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("content_mismatch");
  });

  it("rejects SVG even though it is a common image MIME (stored-XSS vector)", () => {
    const r = validateImageBytes(SVG, "image/svg+xml");
    expect(r.ok).toBe(false);
  });

  it("rejects SVG bytes smuggled under an image/png content type", () => {
    const r = validateImageBytes(SVG, "image/png");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("content_mismatch");
  });

  it("respects a narrower allow-list (signature route: no GIF)", () => {
    const r = validateImageBytes(GIF, "image/gif", { allow: ["png", "jpeg", "webp"] });
    expect(r.ok).toBe(false);
  });

  it("rejects oversize files before sniffing", () => {
    const big = new Uint8Array(3 * 1024 * 1024);
    big.set(PNG, 0);
    const r = validateImageBytes(big, "image/png", { maxBytes: 2 * 1024 * 1024 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("too_large");
  });

  it("rejects an empty upload", () => {
    const r = validateImageBytes(new Uint8Array(0), "image/png");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("no_file");
  });
});
