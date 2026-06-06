-- Add contact fields to companies (used by /auth/register brand application).
-- Previously only in docs/add-contact-fields.sql and applied to staging only,
-- which caused registration to fail on production ("Failed to create company
-- profile" / PGRST204 missing contact_name). Tracked here so every env gets it.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;
