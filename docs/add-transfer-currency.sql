-- Add currency to transfer_requests so the selected sale currency is preserved
ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN';
