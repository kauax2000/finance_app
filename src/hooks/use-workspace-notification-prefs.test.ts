import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { notificationPrefsKeys, queryRoot } from "@/lib/queries/keys"
import { shouldPersistQuery } from "@/lib/queries/persist"
import type { Query } from "@tanstack/react-query"

const GANCHO = semComentarios(lerFonte("src/hooks/use-workspace-notification-prefs.ts"))

describe("as preferências de notificação", () => {
    it("moram no cache: Configurações entra com elas, sem buscar de novo", () => {
        expect(GANCHO).toContain("useQuery({")
        expect(GANCHO).toContain("notificationPrefsKeys.detail(")
        expect(GANCHO).not.toContain("useState<WorkspaceMemberNotificationPrefs")
    })

    it("a chave separa pessoa e carteira", () => {
        expect(notificationPrefsKeys.detail("u", "w")).toEqual([queryRoot.notificationPrefs, "u", "w"])
    })

    it("sobrevivem a recarregar a página", () => {
        const query = { state: { status: "success" }, queryKey: notificationPrefsKeys.detail("u", "w") } as unknown as Query
        expect(shouldPersistQuery(query)).toBe(true)
    })

    it("a mudança aparece na hora, e volta atrás se o banco recusar", () => {
        expect(GANCHO).toContain("queryClient.setQueryData")
        expect(GANCHO).toContain("desfazerPatch(")
        expect(GANCHO).toContain("queryClient.cancelQueries")
    })

    it("o erro da carga aparece na tela, e não num toast", () => {
        expect(GANCHO).toContain("meta: { errorToast: false }")
    })
})
