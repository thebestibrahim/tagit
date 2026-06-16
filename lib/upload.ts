// Server-side image upload validation.
//
// The browser-declared `file.type` and the filename extension are both
// attacker-controlled: anything can be POSTed as `image/png`. So we never trust
// them for what the file IS. Instead we sniff the leading bytes (magic numbers)
// and only accept files whose real content matches a known raster image format.
// This stops "malware.exe renamed to logo.png" and keeps the storage key free
// of any user-supplied string.
//
// SVG is intentionally unsupported: it is XML, executes script when rendered as
// a document, and has no reliable magic signature. Brand SVG assets live in
// /public, not in user uploads.

export type ImageKind = "png" | "jpeg" | "webp" | "gif";

const SIGNATURES: { kind: ImageKind; mime: string; match: (b: Uint8Array) => boolean }[] = [
  {
    kind: "png",
    mime: "image/png",
    match: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    kind: "jpeg",
    mime: "image/jpeg",
    // SOI marker FF D8 FF
    match: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    kind: "gif",
    mime: "image/gif",
    // "GIF87a" / "GIF89a"
    match: (b) =>
      b.length >= 6 &&
      b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 &&
      (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61,
  },
  {
    kind: "webp",
    mime: "image/webp",
    // "RIFF"...."WEBP"
    match: (b) =>
      b.length >= 12 &&
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
];

export type ValidatedImage = { kind: ImageKind; mime: string; ext: ImageKind };

export type ImageValidationError =
  | "no_file"
  | "too_large"
  | "type_not_allowed"
  | "content_mismatch";

export interface ValidateImageOptions {
  /** Subset of kinds the caller accepts. Defaults to all raster kinds. */
  allow?: ImageKind[];
  /** Max byte size. Defaults to 2 MB. */
  maxBytes?: number;
}

/**
 * Validate a raw upload buffer by its real bytes.
 * Returns the detected, allow-listed image kind — never echoes user input.
 */
export function validateImageBytes(
  bytes: Uint8Array,
  declaredType: string | undefined,
  opts: ValidateImageOptions = {}
): { ok: true; image: ValidatedImage } | { ok: false; error: ImageValidationError } {
  const allow = new Set(opts.allow ?? (["png", "jpeg", "webp", "gif"] as ImageKind[]));
  const maxBytes = opts.maxBytes ?? 2 * 1024 * 1024;

  if (bytes.length === 0) return { ok: false, error: "no_file" };
  if (bytes.length > maxBytes) return { ok: false, error: "too_large" };

  // Cheap pre-filter on the declared type, then the authoritative byte check.
  const detected = SIGNATURES.find((s) => s.match(bytes));
  if (!detected || !allow.has(detected.kind)) {
    // Distinguish "you claimed an allowed type but the bytes are something else"
    // (likely a disguised payload) from "you asked for a type we don't accept".
    const claimedKind = SIGNATURES.find((s) => s.mime === declaredType)?.kind;
    if (claimedKind && allow.has(claimedKind)) {
      return { ok: false, error: "content_mismatch" };
    }
    return { ok: false, error: detected ? "type_not_allowed" : "content_mismatch" };
  }

  return { ok: true, image: { kind: detected.kind, mime: detected.mime, ext: detected.kind } };
}

const ERROR_MESSAGES: Record<ImageValidationError, string> = {
  no_file: "No file provided.",
  too_large: "File too large.",
  type_not_allowed: "Unsupported image type. Use PNG, JPG, WebP, or GIF.",
  content_mismatch: "This file is not a valid image. Upload a real PNG, JPG, WebP, or GIF.",
};

const ERROR_STATUS: Record<ImageValidationError, number> = {
  no_file: 400,
  too_large: 413,
  type_not_allowed: 400,
  content_mismatch: 400,
};

export function imageErrorResponse(error: ImageValidationError): { message: string; status: number } {
  return { message: ERROR_MESSAGES[error], status: ERROR_STATUS[error] };
}
