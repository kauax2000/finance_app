import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const folha = semComentarios(lerFonte("src/components/layout/notifications-sheet.tsx"))
// O painel é a folha, a lista, a linha e o vazio, lidos juntos.
const painel = [
    "src/components/layout/notifications-sheet.tsx",
    "src/components/layout/notifications-panel.tsx",
    "src/components/layout/notification-row.tsx",
    "src/components/layout/notifications-panel-empty.tsx",
]
    .filter((p) => existsSync(p))
    .map((p) => semComentarios(lerFonte(p)))
    .join("\n")

describe("painel de notificações (fonte)", () => {
    it("é a placa flutuante md, com o título do cabeçalho", () => {
        expect(folha).toContain('variant="floating"')
        expect(folha).toContain('size="md"')
        expect(folha).not.toContain('variant="flush"')
        expect(folha).not.toMatch(/sr-only/)
    })

    it("veste a cromagem do Dialog e as peças do Item", () => {
        expect(painel).toContain("DialogHeaderRow")
        expect(painel).toContain("DialogBody")
        expect(painel).toContain("DialogCloseButton")
        expect(painel).toContain('variant="segmented"')
        expect(painel).toContain("groupByLocalDay(")
        expect(painel).toContain("ItemGroupLabel")
        expect(painel).toContain('variant="tile"')
        expect(painel).toContain("ItemLink")
    })

    it("tem as ações e os estados do desenho", () => {
        expect(painel).toContain("Marcar todas como lidas")
        expect(painel).toContain("Preferências de notificação")
        expect(painel).toContain("#notificacoes")
        expect(painel).toContain("Limpar todas")
        expect(painel).toContain("Marcar como não lida")
        expect(painel).toContain("Não deu para carregar as notificações.")
        expect(painel).toContain("Tentar de novo")
        expect(painel).toContain("Tudo lido")
        expect(painel).toContain("Mostrando as 100 mais recentes")
    })

    it("não volta ao que saiu", () => {
        expect(painel).not.toContain("formatRelativeTime")
        expect(painel).not.toMatch(/setUnreadCount\(\s*rows/)
        expect(painel).not.toContain("toastPageFetchError")
    })

    it("a seção de preferências é a âncora do menu", () => {
        expect(lerFonte("src/components/settings/notification-preferences.tsx")).toContain('id="notificacoes"')
    })
})
