import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Deduplicated per-request — layout and page share the same getUser() call
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});
