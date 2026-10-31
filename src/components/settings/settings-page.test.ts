import { describe, expect, it, vi } from "vitest"
import { NOTIFICATION_PREFERENCES_HREF } from "@/components/layout/notifications-panel-empty"
import { rolarAteAncora } from "@/components/settings/settings-section"
import { lerFonte } from "@/test/fonte"

describe("Configurações: página única", () => {
    it("a página não tem abas, nem lê a query, e rola até a âncora", () => {
        const fonte = lerFonte("src/app/(app)/settings/page-client.tsx")
        for (const proibido of ["Tabs", "useSearchParams", "useTelaLarga"]) expect(fonte).not.toContain(proibido)
        expect(fonte).toContain("rolarAteAncora")
    })

    it("Configurar notificações aponta para a âncora", () => {
        expect(NOTIFICATION_PREFERENCES_HREF).toBe("/settings#notificacoes")
    })

    it("rolarAteAncora rola até o elemento do hash", () => {
        const scrollIntoView = vi.fn()
        const doc = { getElementById: (id: string) => (id === "x" ? { scrollIntoView } : null) } as unknown as Document
        rolarAteAncora("#x", doc)
        expect(scrollIntoView).toHaveBeenCalledOnce()
    })

    it("rolarAteAncora não lança sem elemento ou sem hash", () => {
        const doc = { getElementById: () => null } as unknown as Document
        expect(() => rolarAteAncora("#nao-existe", doc)).not.toThrow()
        expect(() => rolarAteAncora("", doc)).not.toThrow()
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
