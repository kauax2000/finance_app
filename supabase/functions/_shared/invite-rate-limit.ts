import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Convite é e-mail mandado em nome do app para um endereço qualquer: sem teto,
 * a edge vira relay. Conta os envios das últimas 24h pelo log de atividade,
 * que só é gravado depois de o e-mail sair.
 */
export const INVITE_EMAILS_PER_DAY = 20
export const INVITE_EMAILS_PER_RECIPIENT_PER_DAY = 3

type LogRow = { metadata: unknown }

export function inviteEmailLimitReached(rows: LogRow[], email: string): boolean {
  const sent = rows
    .map((r) => (r.metadata as { invited_email?: unknown } | null)?.invited_email)
    .filter((e): e is string => typeof e === 'string')
  return (
    sent.length >= INVITE_EMAILS_PER_DAY ||
    sent.filter((e) => e === email).length >= INVITE_EMAILS_PER_RECIPIENT_PER_DAY
  )
}

export function recentInviteLogs(admin: SupabaseClient, callerId: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  return admin
    .from('user_activity_logs')
    .select('metadata')
    .eq('user_id', callerId)
    .eq('type', 'family_member_invited')
    .gte('created_at', since)
    .limit(200)
}
