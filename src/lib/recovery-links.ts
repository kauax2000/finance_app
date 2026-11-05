import { ROUTES } from "@/config/navigation"
import { getSafeInternalNextPath } from "@/lib/auth-return-path"

/** Os destinos da recuperação de senha, com o `next` seguro atravessando todos. */
export function recoveryLinks(next: string | null | undefined) {
    const safe = getSafeInternalNextPath(next ?? null)
    const q = safe ? `next=${encodeURIComponent(safe)}` : ""
    const com = (path: string, extra?: string) => {
        const params = [extra, q].filter(Boolean).join("&")
        return params ? `${path}?${params}` : path
    }
    return {
        login: com(ROUTES.LOGIN),
        loginUpdated: com(ROUTES.LOGIN, "reason=password-updated"),
        forgot: com(ROUTES.FORGOT_PASSWORD),
        resetPath: com(ROUTES.RESET_PASSWORD),
    }
}

export type LinkDeRecuperacao =
    | { tipo: "erro" }
    | { tipo: "tokens"; accessToken: string; refreshToken: string }
    | { tipo: "nada" }

/**
 * O que o endereço de `/reset-password` trouxe. Erro (`error` ou `error_code`,
 * no hash ou na query) vence o token: o Supabase pode mandar os dois juntos
 * num link vencido.
 */
export function lerLinkDeRecuperacao(hash: string, search: string): LinkDeRecuperacao {
    const h = new URLSearchParams(hash.replace(/^#/, ""))
    const q = new URLSearchParams(search.replace(/^\?/, ""))
    const pega = (k: string) => h.get(k) ?? q.get(k)
    if (pega("error") || pega("error_code")) return { tipo: "erro" }
    const accessToken = pega("access_token")
    if (!accessToken) return { tipo: "nada" }
    return { tipo: "tokens", accessToken, refreshToken: pega("refresh_token") ?? "" }
}
