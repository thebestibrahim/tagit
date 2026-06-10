import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Canonical form of an email for use as a lookup/rate-limit key. Without this,
 * `User@x.com` and `user@x.com` are treated as different keys — letting a caller
 * bypass per-email OTP rate limits (and email-bomb a victim) by varying case.
 * Always normalize before counting, inserting, or matching otp_codes by email.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
