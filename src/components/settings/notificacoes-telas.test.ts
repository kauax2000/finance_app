import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

const secao = lerFonte("src/components/settings/notification-preferences.tsx")
const canais = lerFonte("src/components/settings/notificacoes-canais.tsx")
const temas = lerFonte("src/components/settings/notificacoes-temas.tsx")

describe("Notificações: as chaves moram na seção de Configurações", () => {
    it("as chaves moram na seção, sem rota própria", () => {
        expect(existsSync("src/app/(app)/settings/notificacoes")).toBe(false)
        expect(lerFonte("src/config/navigation.ts")).not.toContain("SETTINGS_NOTIFICACOES")
        expect(secao).toContain("<NotificacoesCanais")
        expect(secao).toContain("<NotificacoesTemas")
    })
    it("o layout C: dois subtítulos e três cartões de tema", () => {
        expect(canais).toContain(">Canais<")
        expect(temas).toContain(">O que receber<")
        expect(temas).not.toContain("CardToolbar")
        for (const grupo of ["Carteira", "Cartões", "Rotina"]) expect(temas).toContain(`titulo: "${grupo}"`)
    })
    it("o aviso vem antes das chaves, sem botão de ação", () => {
        expect(secao.indexOf("Este aparelho bloqueou os avisos.")).toBeLessThan(secao.indexOf("<NotificacoesCanais"))
        expect(secao).not.toContain("Nenhum canal ligado.")
        expect(secao).not.toContain("AlertAction")
        expect(secao).toContain('storageKey="push-bloqueado"')
    })
    it("sem Ver histórico, e o push segue na seção", () => {
        expect(secao).not.toContain("Ver histórico")
        expect(secao).not.toContain("useNotificationsUi")
        for (const t of ["pref-push", "InstallPwaSheet", "subscribeToPush", "Como instalar"]) expect(canais).toContain(t)
    })
    it("as peças não abrem rota, não leem a carteira nem o erro: a seção é dona deles", () => {
        for (const f of [canais, temas]) {
            expect(f).not.toContain("useWorkspaceNotificationPrefs()")
            expect(f).not.toContain("PageHeader ")
            expect(f).toContain('<PageSection size="sm">')
        }
    })
    it("os temas vêm com os nomes novos e leem pelo `temaLigado`", () => {
        for (const t of ["Despesas de outros membros", "Orçamento", "Contas a pagar", "Limite e categorias", "Fatura e vencimento", "Itens a conferir", "Às 20h.", "Insights", "No máximo 3 push por semana."]) expect(temas).toContain(t)
        expect(temas).toContain("temaLigado(prefs, ")
    })
})
