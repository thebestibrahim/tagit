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

/**
 * Sanitize a free-text search term before interpolating it into a PostgREST
 * `.or("col.ilike.%term%")` filter. PostgREST treats commas as condition
 * separators and parentheses/asterisks as syntax, so an unsanitized term like
 * `x,status.eq.approved` could inject additional filter branches. We strip the
 * filter-significant characters and cap the length. (RLS still scopes results,
 * so this is defense-in-depth — but it keeps the query well-formed and closes
 * the injection class entirely.)
 */
export function sanitizeSearch(input: string): string {
  return input.replace(/[,()*:\\]/g, "").trim().slice(0, 100)
}
