/**
 * Paridade de calendário (cliente) contra os vetores dourados compartilhados.
 *
 * Os mesmos vetores são validados no edge
 * (supabase/functions/_shared/credit-card-cycle.test.ts) e no SQL
 * (supabase/tests/database/billing_calendar_parity.test.sql). Divergência em
 * qualquer camada = cobrança/fatura no dia errado.
 */
import { describe, expect, it } from "vitest"
import vectors from "@/lib/fixtures/billing-calendar-vectors.json"
import { advanceBilling } from "@/lib/subscription-billing-projection"
import {
    estimatedDueDateForClose,
    statementCloseYmdForPurchaseDate,
} from "@/lib/credit-card-billing"
import { localYmdFromDate, parseYmdLocal } from "@/lib/transaction-date"
import type { SubscriptionBillingInterval } from "@/lib/supabase"

describe("billing calendar parity (client)", () => {
    it.each(vectors.subscription_stepping)(
        "advanceBilling($from, $interval) = $expected",
        ({ from, interval, expected }) => {
            const d = parseYmdLocal(from)
            expect(d).toBeDefined()
            const next = advanceBilling(d!, interval as SubscriptionBillingInterval)
            expect(localYmdFromDate(next)).toBe(expected)
        },
    )

    it.each(vectors.statement_close_for_purchase)(
        "statementClose($purchase, closing=$closing_day) = $expected_close",
        ({ purchase, closing_day, expected_close }) => {
            expect(
                statementCloseYmdForPurchaseDate(`${purchase}T12:00:00Z`, closing_day),
            ).toBe(expected_close)
        },
    )

    it.each(vectors.estimated_due_for_close)(
        "estimatedDue($close, dueDay=$due_day) = $expected_due",
        ({ close, due_day, expected_due }) => {
            const d = parseYmdLocal(close)
            expect(d).toBeDefined()
            expect(localYmdFromDate(estimatedDueDateForClose(d!, due_day))).toBe(
                expected_due,
            )
        },
    )
})
