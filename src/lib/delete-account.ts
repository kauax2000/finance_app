import { invokeEdgeJson } from './edge-invoke'

/**
 * Permanently deletes the authenticated user and related data via the delete-user Edge Function.
 * Call after `signInWithPassword` so the Supabase client session matches the fresh token used by invoke.
 */
export async function callDeleteUserAccount(password: string): Promise<void> {
    await invokeEdgeJson('delete-user', {
        method: 'POST',
        body: { password },
    })
}
