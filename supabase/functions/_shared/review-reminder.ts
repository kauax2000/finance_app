/** O lembrete das 20h (Bloco 3A, Decisão 13): quem lançou itens a conferir, por carteira. */

export const TITULO_DO_LEMBRETE = 'Itens a conferir'

export type PessoaParaLembrar = { userId: string; workspaceId: string; total: number }

/** Uma entrada por (pessoa, carteira), com quantos itens ela tem a conferir ali. */
export function pessoasParaLembrar(
  linhas: Array<{ user_id: string; workspace_id: string }>,
): PessoaParaLembrar[] {
  const grupos = new Map<string, PessoaParaLembrar>()
  for (const { user_id, workspace_id } of linhas) {
    const chave = `${user_id}:${workspace_id}`
    const g = grupos.get(chave)
    if (g) g.total += 1
    else grupos.set(chave, { userId: user_id, workspaceId: workspace_id, total: 1 })
  }
  return [...grupos.values()]
}

export function corpoDoLembrete(total: number): string {
  return total === 1
    ? 'Você tem 1 lançamento para conferir.'
    : `Você tem ${total} lançamentos para conferir.`
}
