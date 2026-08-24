/**
 * Structural stand-in for the supabase-js service-role client.
 *
 * The esm.sh `SupabaseClient` type resolves to different generic
 * instantiations across modules (version drift), so nominal typing makes
 * perfectly valid client instances unassignable between files. Shared
 * helpers accept this structural shape instead.
 */
export type SupabaseAdminClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
  auth?: unknown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpc?: (fn: string, args?: Record<string, unknown>) => any
}
