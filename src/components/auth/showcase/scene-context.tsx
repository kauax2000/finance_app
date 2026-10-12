"use client"

import * as React from "react"

/**
 * O id de cada estado das telas de acesso que o painel de marca sabe mostrar.
 *
 * Quem decide o id é o **formulário** (só ele sabe em que passo está), e quem
 * desenha é o painel, que mora no layout de `(auth)` e por isso não remonta
 * entre as rotas. O formulário publica pelo `useAuthScene`, dentro do
 * `AuthShell`; sem publicação, vale `defaultSceneFor(pathname)`.
 */
export type AuthSceneId =
    | "login" | "login.session-expired" | "login.password-updated"
    | "register" | "register.confirm" | "register.confirm-invite"
    | "recovery.email" | "recovery.code" | "recovery.password"
    | "recovery.link-checking" | "recovery.link-expired" | "recovery.done"
    | "invite.loading" | "invite.idle" | "invite.gate" | "invite.accepted" | "invite.error"

/** A família da cena, na ordem do giro: login(0) → convite(1) → cadastro(2) → recuperação(3). */
export type SceneFamily = "login" | "invite" | "register" | "recovery"

export function sceneFamily(id: AuthSceneId): SceneFamily {
    return id.split(".")[0] as SceneFamily
}

const PADRAO: Record<string, AuthSceneId> = {
    "/login": "login",
    "/register": "register",
    "/forgot-password": "recovery.email",
    "/reset-password": "recovery.link-checking",
    "/invites/accept": "invite.loading",
}

/**
 * A cena antes de o formulário publicar a sua: no HTML do servidor e no quadro
 * do fallback do `Suspense`. Lê só o caminho — nunca a query, para o frame não
 * precisar de `useSearchParams` (e do `Suspense` que ele obrigaria).
 */
export function defaultSceneFor(pathname: string): AuthSceneId {
    return PADRAO[pathname.replace(/\/+$/, "")] ?? "login"
}

type Contexto = {
    scene: AuthSceneId | null
    setScene: (scene: AuthSceneId | null) => void
}

const AuthSceneContext = React.createContext<Contexto | null>(null)

export function AuthSceneProvider({ children }: { children: React.ReactNode }) {
    const [scene, setScene] = React.useState<AuthSceneId | null>(null)
    const value = React.useMemo(() => ({ scene, setScene }), [scene])
    return <AuthSceneContext value={value}>{children}</AuthSceneContext>
}

/** A cena publicada agora, ou `null` quando nenhum formulário publicou. */
export function usePublishedAuthScene(): AuthSceneId | null {
    return React.useContext(AuthSceneContext)?.scene ?? null
}

/**
 * Publica a cena deste estado do formulário e a limpa ao desmontar — o
 * mesmo contrato do `usePageChromeSlot`. Em layout effect, para o painel
 * trocar no mesmo quadro que a coluna. Fora do provider (o catálogo), não faz
 * nada.
 */
export function useAuthScene(id: AuthSceneId) {
    const setScene = React.useContext(AuthSceneContext)?.setScene
    React.useLayoutEffect(() => {
        if (!setScene) return
        setScene(id)
        return () => setScene(null)
    }, [setScene, id])
}
