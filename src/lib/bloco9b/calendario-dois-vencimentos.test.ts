import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const f = () => semComentarios(lerFonte("supabase/functions/credit-card-calendar-alerts/index.ts"))

describe("credit-card-calendar-alerts: duas faturas no mesmo vencimento (#94)", () => {
    it("avisa cada ciclo que vence, não só o primeiro", () => {
        expect(f()).toContain("dueCyclesOnOrAfter(today, closingDay, dueDay)")
        expect(f()).not.toContain("nextPaymentDueCycleOnOrAfter(")
    })

    it("o primeiro ciclo mantém a chave de antes; o segundo leva o fechamento", () => {
        expect(f()).toContain("cal:due_soon:${formatYmd(dueCycle.due)}:c:${card.id}${sufixo}")
        expect(f()).toContain("cal:due_today:${formatYmd(dueCycle.due)}:c:${card.id}${sufixo}")
        expect(f()).toContain("`:f:${formatYmd(dueCycle.close)}`")
    })
})
