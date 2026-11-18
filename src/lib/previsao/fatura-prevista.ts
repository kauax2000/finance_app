import {
    buildCardMonthlyInvoiceSnapshot,
    localNoonDate,
    type CardMonthlyInvoiceStatus,
} from "@/lib/credit-card-billing"
import { bancoTotalDoCiclo, totalComBanco } from "@/lib/fatura/total-com-banco"
import type { CreditCard, Transaction, WorkspaceSubscription } from "@/lib/supabase"
import {
    expandSubscriptionChargesInYmdRange,
    subscriptionAnchor,
} from "@/lib/subscription-billing-projection"
import { compareYmd, localYmdFromDate, transactionLocalYmd } from "@/lib/transaction-date"
import type { DadosDaPrevisao } from "./tipos"

export const centavos = (reais: number): number => Math.round(Number(reais) * 100)

/** "Hoje" ao meio-dia local, para os helpers que pedem `Date`. */
export function hojeDate(hojeYmd: string): Date {
    const [y, m, d] = hojeYmd.split("-").map(Number)
    return localNoonDate(y, m - 1, d)
}

/** `${assinatura}:${dia}` de cada lançamento que veio de uma assinatura. */
export function cobrancasLancadas(transacoes: Pick<Transaction, "subscription_id" | "date">[]): Set<string> {
    const out = new Set<string>()
    for (const t of transacoes) {
        const ymd = t.subscription_id ? transactionLocalYmd(t.date) : null
        if (ymd) out.add(`${t.subscription_id}:${ymd}`)
    }
    return out
}

/**
 * As cobranças de `sub` em `[inicioYmd, fimYmd]` ainda não lançadas. Nenhuma cai antes da próxima
 * cobrança da assinatura: o que vem antes dela o cron já lançou (ou a pessoa apagou).
 */
export function cobrancasPorLancar(
    sub: WorkspaceSubscription,
    inicioYmd: string,
    fimYmd: string,
    lancadas: Set<string>,
): number[] {
    const anchor = subscriptionAnchor(sub)
    const desde = anchor && compareYmd(localYmdFromDate(anchor), inicioYmd) > 0 ? localYmdFromDate(anchor) : inicioYmd
    return expandSubscriptionChargesInYmdRange(sub, desde, fimYmd)
        .filter((c) => !lancadas.has(`${sub.id}:${c.chargeYmd}`))
        .map((c) => c.amount)
}

/**
 * A fatura **prevista** do cartão que fecha em `closeYm`: a fatura do snapshot (compras, estornos e
 * parcelas projetadas) mais as assinaturas do cartão ainda não lançadas na janela; fechada e com o
 * total do banco, vale o do banco.
 */
export function faturaPrevista(
    card: CreditCard,
    closeYm: string,
    dados: DadosDaPrevisao,
): {
    total: number
    closeYmd: string
    dueYmd: string
    usaTotalDoBanco: boolean
    status: CardMonthlyInvoiceStatus
} {
    const snap = buildCardMonthlyInvoiceSnapshot(card, dados.transacoes, closeYm, hojeDate(dados.hojeYmd), {
        installmentPlans: dados.planos,
    })
    const inicioYmd = localYmdFromDate(snap.window.start)
    const closeYmd = localYmdFromDate(snap.close)
    const lancadas = cobrancasLancadas(dados.transacoes)

    let cents = centavos(snap.committedTotal)
    for (const sub of dados.assinaturas) {
        if (sub.kind === "income") continue
        if (sub.payment_method !== "credit_card" || sub.payment_credit_card_id !== card.id) continue
        for (const v of cobrancasPorLancar(sub, inicioYmd, closeYmd, lancadas)) cents += centavos(v)
    }

    const banco = snap.status === "closed" ? bancoTotalDoCiclo(dados.totaisDoBanco, card.id, closeYmd) : null
    return {
        total: totalComBanco(cents / 100, banco).total,
        closeYmd,
        dueYmd: localYmdFromDate(snap.dueEstimate),
        usaTotalDoBanco: banco != null,
        status: snap.status,
    }
}
