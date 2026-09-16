/**
 * Mensagem de resposta 500 que não vaza o erro interno.
 *
 * A mensagem do Postgres ou do provedor diz nome de tabela, de coluna e de
 * restrição a quem chama; ela vai para o log da função, e a resposta leva só o
 * aviso genérico.
 */
export function internalError(context: string, error: unknown): string {
  console.error(`${context}:`, error)
  return 'Erro interno. Tente novamente.'
}
