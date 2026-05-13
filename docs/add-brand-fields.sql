-- Add brand_text_color and brand_template to companies
-- Run in Supabase SQL editor

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS brand_text_color TEXT DEFAULT '#FAFAF8',
  ADD COLUMN IF NOT EXISTS brand_template   TEXT DEFAULT 'classic'
    CHECK (brand_template IN ('classic', 'minimal', 'editorial'));
