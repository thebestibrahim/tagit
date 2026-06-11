import crypto from "crypto";
import { log } from "@/lib/logger";

// ── Paystack integration ──────────────────────────────────────────────────────
// Uses TEST keys until explicitly swapped to live. The code never changes when
// keys are swapped, only the PAYSTACK_SECRET_KEY / PAYSTACK_PUBLIC_KEY env vars.
//
// Paystack works in kobo (the smallest NGN unit), which is exactly how amounts
// are stored throughout the billing engine, so no conversion is needed here.

const PAYSTACK_BASE = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

export interface InitializeTransactionParams {
  email: string;
  amount: number; // kobo
  reference: string;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
}

export interface InitializeTransactionResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

// Initialize a transaction and return the hosted payment link.
export async function initializeTransaction(
  params: InitializeTransactionParams
): Promise<InitializeTransactionResult> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      currency: "NGN",
      metadata: params.metadata ?? {},
      ...(params.callbackUrl ? { callback_url: params.callbackUrl } : {}),
    }),
  });

  const json = (await res.json()) as {
    status: boolean;
    message: string;
    data?: InitializeTransactionResult;
  };

  if (!res.ok || !json.status || !json.data) {
    log.error("paystack", "initializeTransaction failed", json);
    throw new Error(`Paystack initialize failed: ${json.message}`);
  }

  return json.data;
}

// Verify a transaction by reference via the Paystack API. Used by the payment
// callback as a synchronous fallback so payment feedback never depends on the
// dashboard webhook being configured.
export async function verifyTransaction(
  reference: string
): Promise<{ status: string; amount: number } | null> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });
  const json = (await res.json()) as {
    status: boolean;
    data?: { status: string; amount: number };
  };
  if (!res.ok || !json.status || !json.data) {
    log.error("paystack", "verifyTransaction failed", json);
    return null;
  }
  return { status: json.data.status, amount: json.data.amount };
}

// Verify a Paystack webhook signature. Paystack signs the raw request body with
// HMAC SHA512 using the secret key; the digest is sent in x-paystack-signature.
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const hash = crypto
    .createHmac("sha512", secretKey())
    .update(rawBody)
    .digest("hex");
  // Constant-time compare; lengths must match or timingSafeEqual throws.
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Generate a unique, human-traceable payment reference for an invoice. The
// random suffix guarantees uniqueness even for two references minted in the
// same millisecond (e.g. a re-issued invoice link).
export function buildReference(invoiceId: string): string {
  const rand = crypto.randomBytes(4).toString("hex");
  return `tgt_${invoiceId.replace(/-/g, "").slice(0, 16)}_${Date.now().toString(36)}${rand}`;
}
