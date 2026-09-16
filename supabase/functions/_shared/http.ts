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

/**
 * A mensagem que volta quando o guarda de sessão barra a chamada.
 *
 * Só o 5xx carrega erro do banco e é mascarado. O 4xx é do próprio guarda, e o
 * cliente depende do texto: `src/lib/sessions.ts` reconhece uma sessão revogada
 * por "Session expired or invalidated" e faz logout. Mascarar tudo com
 * `internalError` trocava esse texto por "Erro interno", e encerrar uma sessão
 * noutro aparelho deixava de derrubá-la.
 */
export function sessionGuardMessage(
  context: string,
  result: { status: number; message: string }
): string {
  return result.status >= 500 ? internalError(context, result) : result.message
}
