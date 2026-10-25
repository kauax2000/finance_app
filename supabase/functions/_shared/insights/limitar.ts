/**
 * O teto de achados por carteira em cada execução do `insights-daily`. **Sem
 * nenhum import**, como os outros módulos de `insights/`.
 */

/** A ordem no mesmo dia: o que mais vale primeiro (também na fila do push). */
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
 * Os `max` primeiros pela data da evidência, do mais recente ao mais antigo
 * (quem chama põe hoje no achado sem data), e no mesmo dia pela prioridade do
 * tipo. Não mexe no array recebido.
 */
export function limitarAchados<T extends { kind: string; dataYmd: string }>(achados: T[], max: number): T[] {
  return [...achados]
    .sort((a, b) => (a.dataYmd === b.dataYmd ? posicao(a.kind) - posicao(b.kind) : a.dataYmd < b.dataYmd ? 1 : -1))
    .slice(0, max)
}
