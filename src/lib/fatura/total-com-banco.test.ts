import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { bancoTotalDoCiclo, statementTotalKey, totalComBanco } from "@/lib/fatura/total-com-banco"
import type { CreditCardStatementTotal } from "@/lib/supabase"

describe("totalComBanco", () => {
    it("sem total do banco, vale o calculado", () => {
        expect(totalComBanco(270, null)).toEqual({ total: 270, diferenca: null })
    })

    it("com total do banco, ele vale e a diferença é banco − calculado", () => {
        expect(totalComBanco(270, 333)).toEqual({ total: 333, diferenca: 63 })
    })

    it("quando bate, a diferença é zero", () => {
        expect(totalComBanco(270, 270).diferenca).toBe(0)
    })

    it("a diferença sai arredondada no centavo", () => {
        expect(totalComBanco(0.1 + 0.2, 0.5).diferenca).toBe(0.2)
    })
})

describe("statementTotalKey e bancoTotalDoCiclo", () => {
    it("a chave tem a forma da chave de pagamento do painel", () => {
        expect(statementTotalKey("card-1", "2026-09-10")).toBe("card-1:2026-09-10")
    })

    it("acha o total do cartão e do fechamento, ou null", () => {
        const totais = [
            { credit_card_id: "card-1", statement_close_date: "2026-09-10", bank_total: 333 },
            { credit_card_id: "card-2", statement_close_date: "2026-09-10", bank_total: 10 },
        ] as CreditCardStatementTotal[]
        expect(bancoTotalDoCiclo(totais, "card-1", "2026-09-10")).toBe(333)
        expect(bancoTotalDoCiclo(totais, "card-1", "2026-08-10")).toBeNull()
        expect(bancoTotalDoCiclo(undefined, "card-1", "2026-09-10")).toBeNull()
    })
})

describe("consumidores do total do banco", () => {
    it("o projetor de contas usa totalComBanco", () => {
        const fonte = semComentarios(lerFonte("src/lib/bills/credit-card-bill-projector.ts"))
        expect(fonte).toMatch(/totalComBanco\(/)
    })

    it("o KPI de faturas do painel usa o total do banco no ciclo fechado", () => {
        const fonte = semComentarios(lerFonte("src/components/dashboard/use-dashboard-data.ts"))
        expect(fonte).toMatch(/totalComBanco\(/)
        expect(fonte).toMatch(/status === "closed"/)
    })

    it("o painel da fatura mostra o total do banco só no ciclo passado", () => {
        const fonte = semComentarios(
            lerFonte("src/components/credit-cards/credit-card-invoice-analytics-panel.tsx"),
        )
        expect(fonte).toMatch(/Total do banco/)
        expect(fonte).toMatch(/cycleOffset < 0 && bancoCiclo/)
    })

    it("a leitura e a chave de React Query combinadas", () => {
        const leitura = semComentarios(lerFonte("src/lib/credit-cards-workspace-transactions.ts"))
        expect(leitura).toMatch(/export async function fetchStatementTotals\(\s*workspaceId: string/)
        const chaves = semComentarios(lerFonte("src/lib/queries/keys.ts"))
        expect(chaves).toMatch(/\["credit-card-statement-totals", workspaceId\]/)
    })
})
