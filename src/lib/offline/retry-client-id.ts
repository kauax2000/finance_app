/**
 * O mesmo cadastro reenviado depois de uma falha reusa o `client_id` da
 * primeira tentativa. Se a resposta se perdeu com a linha já gravada, o upsert
 * por `(workspace_id, client_id)` devolve a linha existente em vez de criar
 * outra. `settle()` depois do sucesso libera o id.
 */
// ponytail: a chave é o conteúdo da linha — mudar um campo entre as tentativas
// gera outro id e pode duplicar. Id estável por formulário se isso aparecer.
const pendentes = new Map<string, string>()

export function retryStableClientId(row: Record<string, unknown>) {
    const key = JSON.stringify(row)
    let clientId = pendentes.get(key)
    if (!clientId) {
        clientId = crypto.randomUUID()
        pendentes.set(key, clientId)
    }
    return { clientId, settle: () => void pendentes.delete(key) }
}
