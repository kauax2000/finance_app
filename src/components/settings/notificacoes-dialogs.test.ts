import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

const CANAIS = lerFonte("src/components/settings/notificacoes-canais-dialog.tsx")
const TEMAS = lerFonte("src/components/settings/notificacoes-temas-dialog.tsx")

describe("Notificações: diálogos de canais e temas", () => {
    it("as duas superfícies são o diálogo que vira gaveta, e mostram o erro de salvar", () => {
        for (const f of [CANAIS, TEMAS]) {
            expect(f).toContain('surface="auto"')
            expect(f).toContain('<Alert tone="destructive" size="sm">')
        }
    })
    it("só os temas têm altura fixa; os canais ficam no layout automático sem DialogBody", () => {
        expect(TEMAS).toContain('layout="fixed"')
        expect(CANAIS).not.toContain('layout="fixed"')
        expect(CANAIS).not.toContain("DialogBody")
    })
    it("os temas vêm em três grupos, com os nomes novos", () => {
        for (const t of ["Carteira", "Cartões", "Rotina", "Despesas de outros membros", "Orçamento", "Contas a pagar", "Limite e categorias", "Fatura e vencimento", "Itens a conferir", "Às 20h.", "Insights", "No máximo 3 push por semana."]) expect(TEMAS).toContain(t)
        expect(TEMAS).toContain("temaLigado(prefs, ")
    })
    it("o push mantém o tratamento de hoje e não trava o fechamento", () => {
        expect(CANAIS).not.toContain("pending={pushBusy}")
        for (const t of ["Push neste aparelho", "No sino do Finance.", "subscribeToPush", "unsubscribeFromPush", "abrirInstalacao", "catch (e)", "Desligar remove este aparelho de todas as carteiras.", "Não disponível neste navegador", "InstallPwaSheet", "Como instalar", "isIos && !isStandalone", "Ajustes", "configurações do site"]) expect(CANAIS).toContain(t)
    })
})
