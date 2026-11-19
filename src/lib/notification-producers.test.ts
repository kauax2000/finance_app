import { existsSync, readdirSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = (caminho: string) => semComentarios(lerFonte(caminho))

describe("quem dispara notificação no cliente", () => {
    it.each([
        "src/app/(app)/categories/page-client.tsx",
        "src/components/categories/category-create-dialog.tsx",
    ])("%s não avisa a pessoa de uma categoria que ela mesma criou", (caminho) => {
        expect(fonte(caminho)).not.toContain("dispatch-notifications")
    })

    it("editar uma despesa avalia o orçamento, como criar", () => {
        const f = fonte("src/lib/transaction-detail-sheet-mutations.ts")
        expect(f.split('"evaluate-budgets"').length - 1).toBeGreaterThanOrEqual(2)
    })

    // O orçamento conta a compra no cartão pelo mês do fechamento: sem o cartão
    // no corpo, a Edge avalia o mês de todo cartão da carteira.
    it.each([
        ["src/components/transactions/transaction-form-persistence.ts", 1],
        ["src/lib/transaction-detail-sheet-mutations.ts", 2],
        ["src/lib/bills/pay-bill-flow.ts", 1],
        ["src/lib/offline/handlers/transactions.ts", 1],
        ["supabase/functions/capture/index.ts", 1],
    ])("%s manda o cartão da compra ao evaluate-budgets", (caminho, chamadas) => {
        const partes = fonte(caminho).split(/["']evaluate-budgets["']/).slice(1)
        expect(partes).toHaveLength(chamadas)
        for (const p of partes) {
            const corpo = p.slice(0, p.indexOf("})"))
            expect(corpo).toContain("payment_method:")
            expect(corpo).toContain("payment_credit_card_id:")
        }
    })

    it("evaluate-budgets: com o pagamento no corpo, um dia candidato só", () => {
        const f = fonte("supabase/functions/evaluate-budgets/index.ts")
        expect(f).toContain("'payment_method' in body")
        expect(f).toContain("diasCandidatos(day, closingDayByCard, pagamento)")
        const helper = fonte("supabase/functions/_shared/orcamento-mes.ts")
        expect(helper).toMatch(/if \(pagamento\) \{[\s\S]*?return \[cd == null \? dia : fechamento\(cd\)\]/)
    })

    it("a compra parcelada avalia os alertas do cartão", () => {
        expect(fonte("src/components/transactions/transaction-form-persistence.ts")).toContain(
            "scheduleEvaluateCreditCardAlerts(",
        )
    })

    it("o aviso de despesa nova é do banco, não do cliente", () => {
        const arquivos = (readdirSync("src", { recursive: true }) as string[])
            .filter((c) => /\.tsx?$/.test(c) && !c.includes(".test."))
            .map((c) => `src/${c}`)
        const infratores = arquivos.filter((c) => fonte(c).includes("notify-transaction-created"))
        expect(infratores).toEqual([])
        expect(existsSync("src/lib/transaction-notifications.ts")).toBe(false)
    })

    it("dispatch-notifications não existe mais", () => {
        expect(existsSync("supabase/functions/dispatch-notifications")).toBe(false)
        expect(lerFonte("supabase/config.toml")).not.toContain("dispatch-notifications")
        expect(lerFonte("package.json")).not.toContain("dispatch-notifications")
    })
})
