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
