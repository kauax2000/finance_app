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
    it("é a folha padrão (flutuante, sm), com o título do cabeçalho", () => {
        // A versão padrão do `SheetContent`: nenhum eixo escrito (pedido do dono).
        expect(folha).not.toMatch(/<SheetContent[^>]*\b(side|variant|size)=/)
        expect(folha).not.toMatch(/sr-only/)
    })

    it("veste a cromagem do Dialog e as peças do Item", () => {
        expect(painel).toContain("DialogHeaderRow")
        expect(painel).toContain("DialogBody")
        expect(painel).toContain("DialogCloseButton")
        // O filtro é o Tabs na versão padrão, sem variant nem size (pedido do dono).
        expect(painel).toContain('<TabsList aria-label="Filtrar notificações">')
        expect(painel).not.toContain("ToggleGroup")
        expect(painel).not.toMatch(/<Tabs[^>]*\b(variant|size)=/)
        // "Não lidas" abre primeiro e vem antes de "Todas"; a contagem some no zero.
        expect(painel).toContain('useState<Filtro>("nao-lidas")')
        expect(painel.indexOf('value="nao-lidas"')).toBeLessThan(painel.indexOf('value="todas"'))
        expect(painel).toMatch(/naoLidas > 0 \? \(\s*<Badge/)
        expect(painel).toContain("groupByLocalDay(")
        expect(painel).toContain("ItemGroupLabel")
        expect(painel).toContain('variant="tile"')
        expect(painel).toContain("ItemLink")
    })

    it("tem as ações e os estados do desenho", () => {
        expect(painel).toContain("Marcar todas como lidas")
        expect(painel).toContain("Configurar notificações")
        expect(painel).toContain("#notificacoes")
        expect(painel).toContain("Limpar notificações")
        // Sem reticências: a confirmação vem logo depois (pedido do dono).
        expect(painel).not.toContain("Limpar notificações…")
        expect(painel).toContain("Marcar como não lida")
        expect(painel).toContain("Não deu para carregar as notificações.")
        expect(painel).toContain("Tentar de novo")
        expect(painel).toContain("Tudo lido")
        expect(painel).toContain("Mostrando as 100 mais recentes")
    })

    it("o erro nunca vira o vazio, e só a linha com destino tem a seta", () => {
        expect(painel).toMatch(/error && lista\.length === 0 \?/)
        expect(painel).toMatch(/!error && lista\.length === 0 \?/)
        expect(painel).not.toMatch(/error && notifications === null \?/)
        expect(painel).toMatch(/action \? <ItemChevron \/> : null/)
    })

    it("o foco não cai no body, o ⋯ nomeia a linha e o painel pede a folha", () => {
        const linha = semComentarios(lerFonte("src/components/layout/notification-row.tsx"))
        expect(linha).toMatch(/maisRef\.current\?\.focus\(\)\s*onToggleRead\(n\)/)
        expect(linha).toContain("ref={maisRef}")
        expect(linha).toContain("aria-label={`Mais opções: ${n.title}`}")
        const lista = semComentarios(lerFonte("src/components/layout/notifications-panel.tsx"))
        expect(lista).toContain('<DropdownMenu mobile="sheet">')
    })

    it("o \"Tentar de novo\" espera enquanto recarrega", () => {
        const lista = semComentarios(lerFonte("src/components/layout/notifications-panel.tsx"))
        expect(lista).toMatch(/disabled=\{tentando\} aria-busy=\{tentando\}/)
        expect(lista).toContain("{tentando ? <Spinner /> : null}")
    })

    it("não volta ao que saiu", () => {
        expect(painel).not.toContain("formatRelativeTime")
        expect(painel).not.toMatch(/setUnreadCount\(\s*rows/)
        expect(painel).not.toContain("toastPageFetchError")
    })

    it("o sino só é refeito quando a última escrita em voo volta", () => {
        const lista = semComentarios(lerFonte("src/components/layout/notifications-panel.tsx"))
        expect(lista).toMatch(/escritasEmVoo\.current--\s*if \(escritasEmVoo\.current === 0\) invalidateUnreadBadge\(\)/)
        expect(lista).toMatch(/finally \{\s*escritasEmVoo\.current--/)
        expect(lista).toMatch(/seq !== fetchSeq\.current \|\| escritasEmVoo\.current > 0/)
    })

    it("a seção de preferências é a âncora do menu", () => {
        expect(lerFonte("src/components/settings/notification-preferences.tsx")).toContain('id="notificacoes"')
    })
})
