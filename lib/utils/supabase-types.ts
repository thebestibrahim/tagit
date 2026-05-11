/**
 * Cast Supabase query result data when type inference fails due to missing
 * generated types. Replace with `supabase gen types` output once connected.
 */
export function cast<T>(data: unknown): T {
  return data as T;
}
