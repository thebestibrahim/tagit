-- Allow companies to request new tag batches (insert their own pending requests)
-- Run in Supabase SQL editor

CREATE POLICY "company_insert_batch_request" ON tag_batches
  FOR INSERT WITH CHECK (company_id = auth.uid());
