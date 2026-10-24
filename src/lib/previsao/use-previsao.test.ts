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

    it("as contas vêm da consulta da tela de contas", () => {
        expect(previsao).toContain("useBillsPageBundleQuery(")
        expect(semComentarios(lerFonte("src/app/(app)/bills/page-client.tsx"), "tudo")).toContain(
            "useBillsPageBundleQuery(",
        )
    })

    it("não consulta o banco direto", () => {
        expect(previsao).not.toMatch(/supabase\s*\.from\(/)
        expect(previsao).not.toMatch(/queryKey\s*:/)
    })

    it("a janela parte de dois meses antes (a fatura que vence no mês fechou no anterior) e vai 6 à frente", () => {
        expect(previsao).toContain("shiftYearMonth(mes, -2)")
        expect(previsao).toContain("shiftYearMonth(mes, 6)")
    })

    it("só os cartões ativos e as faturas pagas pela chave do total do banco", () => {
        expect(previsao).toContain(".filter((c) => c.is_active)")
        expect(previsao).toContain("statementTotalKey(p.credit_card_id, p.statement_close_date)")
    })
})
