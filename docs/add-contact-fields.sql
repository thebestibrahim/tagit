-- Add contact fields to companies table
-- Run in Supabase SQL editor

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;
