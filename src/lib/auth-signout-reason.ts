/**
 * Por que a pessoa foi parar no login.
 *
 * Quando a sessão é revogada em outro aparelho, o app limpa tudo e deixa o
 * `AuthGuard` redirecionar. Funcionava — e devolvia uma tela de login sem
 * explicação nenhuma no lugar da página em que a pessoa estava, que é a versão
 * mais confusa possível de "você foi desconectado".
 *
 * É uma variável de módulo e não `sessionStorage` porque o percurso inteiro
 * acontece no mesmo contexto de JavaScript: o `signOut` muda o estado do
 * React, o `AuthGuard` reage e chama `router.replace`. Não há recarga de página
 * no meio, então não há nada a persistir — e `sessionStorage` ainda por cima
 * pode lançar numa janela anônima.
 *
 * `take` limpa ao ler: o motivo vale para **um** redirecionamento. Sem isso,
 * sair voluntariamente depois de uma sessão revogada mostraria o aviso de novo.
 */
export type AuthSignOutReason = "session-expired"

let pending: AuthSignOutReason | null = null

export function setAuthSignOutReason(reason: AuthSignOutReason): void {
    pending = reason
}

export function takeAuthSignOutReason(): AuthSignOutReason | null {
    const reason = pending
    pending = null
    return reason
}
