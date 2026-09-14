/** BRL currency formatting for notification copy (mirrors src/lib/formatters.ts). */
export function currencyBRL(value: number): string {
  if (!Number.isFinite(value)) return '—'
  // U+2212, como src/lib/formatters.ts: o hífen quebra linha e lê menor.
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace('-', '\u2212')
}

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
