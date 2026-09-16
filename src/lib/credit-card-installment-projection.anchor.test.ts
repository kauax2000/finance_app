import { describe, expect, it } from "vitest"
import {
    expandAllPlanCharges,
    expandRemainingInstallmentCharges,
} from "@/lib/credit-card-installment-projection"
import { localYmdFromDate } from "@/lib/transaction-date"
import type { WorkspaceInstallmentPlan } from "@/lib/supabase"

// Parcela do dia 31, já cobrada em 31/01: a próxima cai no último dia de fevereiro
// e as seguintes voltam ao dia 31 (a mesma regra do banco, billing_anchor_day).
const plan = {
    id: "p1",
    is_active: true,
    total_installments: 4,
    generated_count: 1,
    installment_amount: 25,
    final_installment_amount: 25,
    next_billing_date: "2026-02-28",
    billing_anchor_day: 31,
} as WorkspaceInstallmentPlan

const datas = (xs: { chargeDate: Date }[]) => xs.map((x) => localYmdFromDate(x.chargeDate))

describe("projeção de parcelas ancorada no dia", () => {
    it("parcelas restantes voltam ao dia 31", () => {
        expect(datas(expandRemainingInstallmentCharges(plan))).toEqual([
            "2026-02-28",
            "2026-03-31",
            "2026-04-30",
        ])
    })

    it("o calendário inteiro reconstrói a primeira parcela em 31/01", () => {
        expect(datas(expandAllPlanCharges(plan))).toEqual([
            "2026-01-31",
            "2026-02-28",
            "2026-03-31",
            "2026-04-30",
        ])
    })
})
