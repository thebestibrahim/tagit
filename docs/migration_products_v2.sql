-- ============================================================
-- TAGIT — Products V2 Migration
-- Run in Supabase SQL Editor after schema.sql and
-- migration_certificates.sql
-- ============================================================

-- Fix ownership_claims expiry: 7 days → 24 hours
-- Only the *request* to claim expires; once approved the record
-- in ownership_records has no expiry (ended_at is set only when
-- superseded by a transfer, never by time).
ALTER TABLE ownership_claims
  ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '24 hours');

-- Add currency to transfer_requests (was absent from v1 schema).
-- Defaults to NGN so existing rows get a sensible value.
ALTER TABLE transfer_requests
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN';
