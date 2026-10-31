import { describe, expect, it } from "vitest"
import { NOTIFICATION_PREFERENCES_HREF } from "@/components/layout/notifications-panel-empty"
import { SECOES, secaoDaUrl } from "@/components/settings/secoes"
import { lerFonte } from "@/test/fonte"

describe("Configurações: seção na URL", () => {
    it("as seções vêm na ordem e com os rótulos do desenho", () => {
        expect(SECOES.map((s) => s.label)).toEqual(["Carteira", "Notificações", "Este aparelho", "IA e privacidade"])
    })

    it("lê a seção, e ausente ou desconhecida abre Carteira", () => {
        expect(secaoDaUrl("notificacoes")).toBe("notificacoes")
        expect(secaoDaUrl(null)).toBe("carteira")
        expect(secaoDaUrl("xyz")).toBe("carteira")
    })

    it("a página é controlada pela URL, sem urlParam", () => {
        const fonte = lerFonte("src/app/(app)/settings/page-client.tsx")
        expect(fonte).toContain("useSearchParams")
        expect(fonte).not.toContain("urlParam")
    })

    it("Configurar notificações aponta para a seção", () => {
        expect(NOTIFICATION_PREFERENCES_HREF).toBe("/settings?secao=notificacoes")
    })
})
