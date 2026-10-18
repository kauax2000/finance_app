import { moneyBRL } from './notification-copy.ts'

/** BRL para os textos de notificação, sem depender do `Intl` do runtime (ver `moneyBRL`). */
export const currencyBRL = moneyBRL

export function displayActorName(profile: {
  full_name?: string | null
  email?: string | null
} | null): string {
  const name = profile?.full_name?.trim()
  if (name) return name
  const email = profile?.email?.trim()
  if (email) return email.split('@')[0] ?? email
  return 'Um membro'
}
