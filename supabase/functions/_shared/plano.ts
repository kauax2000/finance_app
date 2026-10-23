/**
 * Os valores fixos do plano. **Sem nenhum import**: roda igual no Deno (Edge
 * `billing-daily`) e no Node (o app re-exporta em `src/lib/planos/plano.ts`).
 */

/** 12x de R$ 29,90. */
export const PRECO_FAMILIA_CENTAVOS = 35880
/** 12x de R$ 19,90. */
export const PRECO_FUNDADOR_CENTAVOS = 23880
/** Até 31/01/2027, no horário de Brasília. */
export const FIM_FUNDADORES = '2027-02-01T03:00:00Z'
export const TESTE_DIAS = 14
export const AVISO_TESTE_DIA = 12
export const COBERTOS_MAX = 5

export type RelatorioDoTeste = { lancados_sozinho: number; a_conferir: number; avisos: number }

/** O aviso do dia 12: o que o app fez pela pessoa no teste. Parte zerada some. */
export function avisoDoTeste(r: RelatorioDoTeste): { titulo: string; corpo: string } {
  const partes: string[] = []
  if (r.lancados_sozinho > 0) {
    partes.push(`lançou ${r.lancados_sozinho} ${r.lancados_sozinho === 1 ? 'gasto' : 'gastos'} sozinho`)
  }
  if (r.a_conferir > 0) partes.push(`separou ${r.a_conferir} para conferir`)
  if (r.avisos > 0) partes.push(`mandou ${r.avisos} ${r.avisos === 1 ? 'aviso' : 'avisos'}`)

  const convite = 'Assine em Planos para continuar lançando.'
  const resumo =
    partes.length === 0
      ? ''
      : `Nestes dias o app ${partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`}. `
  return { titulo: 'Seu teste termina em 2 dias', corpo: resumo + convite }
}
