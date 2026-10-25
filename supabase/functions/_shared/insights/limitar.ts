/**
 * O teto de achados por carteira em cada execução do `insights-daily`. **Sem
 * nenhum import**, como os outros módulos de `insights/`.
 */

/** O que mais vale primeiro (também na fila do push). */
export const PRIORIDADE_DOS_TIPOS = [
  'fatura_fechou',
  'relatorio_mes',
  'a_conferir',
  'duplicidade',
  'preco_assinatura',
  'parcelas_acabando',
  'recorrencia',
  'gasto_atipico',
  'sazonal',
] as const

const posicao = (kind: string) => {
  const i = (PRIORIDADE_DOS_TIPOS as readonly string[]).indexOf(kind)
  return i < 0 ? PRIORIDADE_DOS_TIPOS.length : i
}

/**
 * Os `max` primeiros pela prioridade do tipo, e no mesmo tipo pela data da
 * evidência, do mais recente ao mais antigo (quem chama põe hoje no achado sem
 * data). A prioridade vem antes da data: a fatura que fechou ontem perderia a
 * vaga para os achados datados de hoje, e depois de anteontem ela não volta.
 * Não mexe no array recebido.
 */
export function limitarAchados<T extends { kind: string; dataYmd: string }>(achados: T[], max: number): T[] {
  return [...achados]
    .sort((a, b) => posicao(a.kind) - posicao(b.kind) || (a.dataYmd === b.dataYmd ? 0 : a.dataYmd < b.dataYmd ? 1 : -1))
    .slice(0, max)
}
