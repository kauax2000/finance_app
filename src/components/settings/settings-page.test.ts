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

    it("Carteira: Editar à vista, sem ⋯, e a linha final respeita o papel", () => {
        const fonte = lerFonte("src/components/settings/workspace-appearance-settings.tsx")
        expect(fonte).not.toContain("EllipsisVerticalIcon")
        expect(fonte).not.toContain("DropdownMenu")
        for (const texto of ["Editar", "Sair da carteira", "Excluir carteira"]) expect(fonte).toContain(texto)
        // Editar só sob `owner`; a linha final: excluir com canDeleteProject, sair com !owner, senão nada.
        expect(fonte).toMatch(/owner \? \(\s*<Button[^>]*onClick=\{openEdit\}/)
        expect(fonte.match(/openEdit/g)).toHaveLength(2) // a definição e o único uso
        // Excluir só com canDeleteProject; sair só com !owner; dono pessoal: nada.
        expect(fonte).toMatch(/canDeleteProject\s*\?/)
        expect(fonte).toMatch(/!owner\s*\?/)
        expect(fonte).toMatch(/: null/)
    })

    it("a página entrega os formulários da Carteira por children", () => {
        const fonte = lerFonte("src/app/(app)/settings/page-client.tsx")
        expect(fonte).toMatch(/<WorkspaceAppearanceSettings>[\s\S]*DatasDaCarteiraProjetoWireframe[\s\S]*<\/WorkspaceAppearanceSettings>/)
    })
})
