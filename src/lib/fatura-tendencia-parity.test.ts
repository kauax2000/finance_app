/**
 * O alerta de fatura alta (Edge `credit-card-calendar-alerts`) projeta as
 * parcelas da fatura em aberto pela mesma regra do cliente: o
 * `sumProjectedCreditCardInstallmentsInWindow`. Os vetores são os mesmos do teste
 * Deno (supabase/functions/_shared/fatura-tendencia.test.ts).
 */
// antes de qualquer Date: a hora local do teste é a de São Paulo
process.env.TZ = "America/Sao_Paulo"

import { describe, expect, it } from "vitest"
import vectors from "@/lib/fixtures/fatura-tendencia-vectors.json"
import { sumProjectedCreditCardInstallmentsInWindow } from "@/lib/credit-card-installment-projection"
import type { WorkspaceInstallmentPlan } from "@/lib/supabase"
import { parseYmdLocal } from "@/lib/transaction-date"
import { lerFonte, semComentarios } from "@/test/fonte"
import { isoPrefixYmd } from "../../supabase/functions/_shared/credit-card-cycle"
import { parcelasProjetadasNaJanela } from "../../supabase/functions/_shared/fatura-tendencia"

describe("parcelas projetadas na fatura (paridade com o cliente)", () => {
    it.each(vectors.parcelas)("$name", (v) => {
        const cliente = sumProjectedCreditCardInstallmentsInWindow(
            v.card_id,
            parseYmdLocal(v.window.start)!,
            parseYmdLocal(v.window.end)!,
            v.plans as unknown as WorkspaceInstallmentPlan[],
            v.rows as never,
        )
        expect(cliente).toBe(v.expected)
        const janela = { start: isoPrefixYmd(v.window.start)!, end: isoPrefixYmd(v.window.end)! }
        expect(parcelasProjetadasNaJanela(v.card_id, janela, v.plans, v.rows)).toBe(v.expected)
    })
})

describe("o cron avisa a fatura alta", () => {
    const fonte = semComentarios(
        lerFonte("supabase/functions/credit-card-calendar-alerts/index.ts"),
        "tudo",
    )

    it("uma vez por ciclo, pelo fechamento da fatura em aberto", () => {
        expect(fonte).toContain("cal:trending_high:")
        expect(fonte).toContain("kind: 'cc_invoice_trending_high'")
        expect(fonte).toContain("href: '/previsao'")
    })

    it("pela preferência de cartões, não pela do calendário", () => {
        expect(fonte).toMatch(/trending_high'\s*\?\s*prefs\.notify_credit_cards/)
    })
    const corpo = (inicio: string, fim: string) => fonte.slice(fonte.indexOf(inicio), fonte.indexOf(fim))

    it("a consulta da fatura alta é própria, do cartão e paginada", () => {
        const tendencia = corpo("async function trendingCopy(", "async function resolveCardEvents(")
        expect(tendencia).toContain(".from('transactions')")
        expect(tendencia).toContain(".eq('payment_credit_card_id', ev.cardId)")
        expect(tendencia.match(/\.order\('id', \{ ascending: true \}\)\s*\.range\(a, b\)/g)).toHaveLength(2)
        expect(fonte).toContain("const PAGE_SIZE = 1000")
    })

    it("só a fechada positiva entra na média (a de estorno não afrouxa os 120%)", () => {
        const tendencia = corpo("async function trendingCopy(", "async function resolveCardEvents(")
        expect(tendencia).toContain(".filter((v) => v > 0)")
        expect(tendencia).not.toContain("v !== 0")
    })

    it("a consulta dos avisos do calendário lê a mesma faixa de antes", () => {
        const calendario = corpo("async function resolveCardEvents(", "Deno.serve(")
        expect(calendario).toContain(
            "const from = events.reduce((m, e) => (compareYmd(e.win.start, m) < 0 ? e.win.start : m), events[0].win.start)",
        )
        expect(calendario).toContain(
            "const to = events.reduce((m, e) => (compareYmd(e.win.end, m) > 0 ? e.win.end : m), events[0].win.end)",
        )
        expect(calendario).not.toContain("fechadas")
        expect(calendario).not.toContain("trending")
        expect(corpo("function buildCardEvents(", "function buildTrendingEvent(")).not.toContain("trending")
    })
})
