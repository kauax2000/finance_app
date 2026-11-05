export type LinhaDeLink = {
  id: string
  role: 'member' | 'guest'
  expires_at: string
  created_at: string
  token_hash: string
}

/** Por papel, o link pendente mais recente que ainda não venceu. */
export function escolherLinksAtivos(
  linhas: LinhaDeLink[],
  agora: Date
): { member: LinhaDeLink | null; guest: LinhaDeLink | null } {
  const ativos = linhas
    .filter((l) => new Date(l.expires_at) > agora)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  return {
    member: ativos.find((l) => l.role === 'member') ?? null,
    guest: ativos.find((l) => l.role === 'guest') ?? null,
  }
}
