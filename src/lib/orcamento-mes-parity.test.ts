/**
 * O aviso de orçamento (Edge `evaluate-budgets`) soma a categoria no mês pela
 * mesma regra da tela de Categorias: o `postedTotal` de
 * `buildCategoryCommitmentsForMonth`. Os vetores são os mesmos do teste Deno
 * (supabase/functions/_shared/orcamento-mes.test.ts).
 */
import { describe, expect, it } from "vitest"
import vectors from "@/lib/fixtures/orcamento-mes-vectors.json"
import { buildCategoryCommitmentsForMonth } from "@/lib/category-commitments"
import type { Transaction } from "@/lib/supabase"
import { gastoDaCategoriaNoMes } from "../../supabase/functions/_shared/orcamento-mes"

type Caso = (typeof vectors.cases)[number]

function postedDaTela(v: Caso): number {
    const commitments = buildCategoryCommitmentsForMonth({
        yearMonth: v.ym,
        transactions: v.rows.map((r) => ({
            ...r,
            subscription_id: null,
            installment_plan_id: null,
            installment_sequence: null,
        })) as unknown as Transaction[],
        installmentPlans: [],
        subscriptions: [],
        creditCards: Object.entries(v.cards as Record<string, number>).map(([id, closing_day]) => ({
            id,
            closing_day,
        })),
    })
    return commitments[v.category_id]?.postedTotal ?? 0
}

describe("gasto da categoria no mês (paridade com a tela de Categorias)", () => {
    it.each(vectors.cases)("$name", (v) => {
        expect(postedDaTela(v)).toBe(v.expected)
        expect(
            gastoDaCategoriaNoMes(v.rows, v.category_id, v.ym, v.cards as Record<string, number>),
        ).toBe(v.expected)
    })
})
