import { describe, expect, it } from "vitest"
import { APP_SUB_PAGE_TITLES, ROUTES } from "@/config/navigation"
import { rotaPermitidaAoConvidado } from "@/lib/papeis/rotas-do-convidado"
import { lerFonte } from "@/test/fonte"

const CANAIS = lerFonte("src/components/settings/notificacoes-canais-tela.tsx")
const TEMAS = lerFonte("src/components/settings/notificacoes-temas-tela.tsx")

describe("Notificações: telas de canais e temas", () => {
    it("as rotas têm título e voltam à seção", () => {
        expect(APP_SUB_PAGE_TITLES[ROUTES.SETTINGS_NOTIFICACOES_CANAIS]).toEqual({ parent: `${ROUTES.SETTINGS}#notificacoes`, parentTitle: "Configurações", title: "Onde chega" })
        expect(APP_SUB_PAGE_TITLES[ROUTES.SETTINGS_NOTIFICACOES_TEMAS]).toEqual({ parent: `${ROUTES.SETTINGS}#notificacoes`, parentTitle: "Configurações", title: "Sobre o quê" })
    })
    it("o convidado abre as duas telas", () => {
        expect(rotaPermitidaAoConvidado(ROUTES.SETTINGS_NOTIFICACOES_CANAIS)).toBe(true)
        expect(rotaPermitidaAoConvidado(ROUTES.SETTINGS_NOTIFICACOES_TEMAS)).toBe(true)
    })
    it("as telas não são diálogos, leem as próprias preferências e mostram o erro de salvar", () => {
        for (const f of [CANAIS, TEMAS]) {
            expect(f).not.toContain("<Dialog")
            expect(f).toContain("useWorkspaceNotificationPrefs()")
            expect(f).toContain('<Alert tone="destructive" size="sm">')
            expect(f).toContain("Vale para você em {currentWorkspace.name}.")
            expect(f).toContain("NotificacoesTelaSkeleton")
            expect(f).toContain('<div className="min-w-0 space-y-4">')
            expect(f).toContain("isMobile ? null : (")
            expect(f).toContain("back={`${ROUTES.SETTINGS}#notificacoes`}")
            expect(f).toContain("backHistory={false}")
        }
    })
    it("a falha de carga não deixa o esqueleto para sempre: só `loading` o mostra", () => {
        for (const f of [CANAIS, TEMAS]) {
            expect(f).toContain("if (loading) return <NotificacoesTelaSkeleton")
            expect(f).not.toContain("loading || !prefs")
            expect(f).toContain("Não foi possível carregar as preferências.")
            expect(f).toContain("if (!prefs || !currentWorkspace)")
        }
    })
    it("os temas vêm em três grupos, com os nomes novos", () => {
        for (const t of ["Carteira", "Cartões", "Rotina", "Despesas de outros membros", "Orçamento", "Contas a pagar", "Limite e categorias", "Fatura e vencimento", "Itens a conferir", "Às 20h.", "Insights", "No máximo 3 push por semana."]) expect(TEMAS).toContain(t)
        expect(TEMAS).toContain("temaLigado(prefs, ")
    })
    it("o push mantém o tratamento de hoje e Como instalar só abre a folha", () => {
        expect(CANAIS).not.toContain("pending={pushBusy}")
        expect(CANAIS).not.toContain("abrirInstalacao")
        expect(CANAIS).toContain("setInstallPwaOpen(true)")
        for (const t of ["Push neste aparelho", "No sino do Finance.", "subscribeToPush", "unsubscribeFromPush", "catch (e)", "Desligar remove este aparelho de todas as carteiras.", "Não disponível neste navegador", "InstallPwaSheet", "Como instalar", "isIos && !isStandalone", "Ajustes", "configurações do site", '<Caption role="status">']) expect(CANAIS).toContain(t)
    })
})
