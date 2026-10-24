import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

const previsao = semComentarios(lerFonte("src/lib/previsao/use-previsao.ts"), "tudo")
const painel = semComentarios(lerFonte("src/components/dashboard/use-dashboard-data.ts"), "tudo")

describe("usePrevisao", () => {
    it.each([
        "useTransactionsRangeQuery(",
        "useCreditCardsQuery(",
        "useSubscriptionsQuery(",
        "useInstallmentPlansQuery(",
        "useStatementTotalsQuery(",
        "useTransactionsWorkspaceAuxQuery(",
        "usePendingBillsDashboardQuery(",
    ])("reusa o hook do Painel %s (mesmo queryKey, sem consulta duplicada)", (hook) => {
        expect(painel).toContain(hook)
        expect(previsao).toContain(hook)
    })

    it("as contas vêm de uma consulta leve, só das ativas e das colunas que o fluxo lê", () => {
        expect(previsao).not.toContain("useBillsPageBundleQuery")
        expect(previsao).toContain('queryKey: ["previsaoContas", workspaceId]')
        expect(previsao).toContain('.from("bills")')
        expect(previsao).toContain('.eq("is_active", true)')
        expect(previsao).toContain('"id, name, amount_estimated, frequency, due_day_of_month, end_date, is_active"')
        expect(semComentarios(lerFonte("src/lib/queries/invalidate-workspace-data.ts"), "tudo")).toContain(
            '["previsaoContas", workspaceId]',
        )
    })

    it("não consulta transações direto, e a única chave própria é a das contas", () => {
        expect(previsao).not.toMatch(/\.from\(\s*["']transactions["']/)
        expect(previsao.match(/queryKey\s*:/g)).toHaveLength(1)
    })

    it("a janela parte de dois meses antes (a fatura que vence no mês fechou no anterior) e vai 6 à frente", () => {
        expect(previsao).toContain("shiftYearMonth(mes, -2)")
        expect(previsao).toContain("shiftYearMonth(mes, 6)")
    })

    it("só os cartões ativos e as faturas pagas pela chave do total do banco", () => {
        expect(previsao).toContain(".filter((c) => c.is_active)")
        expect(previsao).toContain("chavesDeFaturasPagas(aux.data.invoicePayments)")
        expect(painel).toContain("chavesDeFaturasPagas(invoicePaymentsFromQuery)")
    })

    it("a conta pendente traz o valor da própria instância (o do fluxo vence a estimativa)", () => {
        const contas = semComentarios(lerFonte("src/lib/queries/fetch-bills-dashboard.ts"), "tudo")
        const primeira = contas.match(/\.from\("bill_instances"\)\s*\.select\(\s*"([^"]+)"/)?.[1] ?? ""
        expect(primeira.split(",")).toContain("amount")
    })
})
