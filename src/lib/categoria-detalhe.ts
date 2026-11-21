import { parseYearMonth, shiftYearMonth } from "@/lib/budget-month"
import {
    sinalNaDespesa,
    transactionCountsInExpenseMonth,
    type CreditCardClosingLookup,
} from "@/lib/expense-month-attribution"
import { paymentMethodLabel } from "@/lib/payment-methods"
import type { CreditCard, Transaction } from "@/lib/supabase"
import { transactionLocalYmd } from "@/lib/transaction-date"

export type LinhaDeValor = Pick<
    Transaction,
    "date" | "amount" | "type" | "payment_method" | "payment_credit_card_id"
>
export type TipoDaCategoria = "expense" | "income"
/** `compras` conta os lançamentos de peso 1 (o estorno abate o valor, não conta). */
export type Fatia = { chave: string; nome: string; valor: number; compras: number }
/** A fatia de forma de pagamento: `forma` é o `payment_method` (ou "sem-forma"), `cardId` acha a bandeira. */
export type FatiaDePagamento = Fatia & { forma: string; cardId: string | null }
export type Comparacao = {
    mesAnterior: string
    anterior: number
    atual: number
    /** Fração; null quando o mês anterior é 0. */
    variacao: number | null
    mesmoPonto: boolean
}

/** Despesa: estorno no cartão abate (−1). Receita: só a que não é do cartão. */
export function peso(t: LinhaDeValor, tipo: TipoDaCategoria): number {
    if (tipo === "expense") return sinalNaDespesa(t)
    return t.type === "income" && t.payment_method !== "credit_card" ? 1 : 0
}

const reais = (n: number) => Math.round(n * 100) / 100

/** Soma com sinal (estorno abate na despesa); `ateYmd` corta pela data inteira da compra (YYYY-MM-DD ≤ ateYmd). */
export function totalNoMes(
    rows: LinhaDeValor[],
    tipo: TipoDaCategoria,
    yearMonth: string,
    lookup: CreditCardClosingLookup,
    ateYmd?: string,
): number {
    let cents = 0
    for (const t of rows) {
        const p = peso(t, tipo)
        if (p === 0 || !transactionCountsInExpenseMonth(t, yearMonth, lookup)) continue
        if (ateYmd != null) {
            const ymd = transactionLocalYmd(t.date)
            if (!ymd || ymd > ateYmd) continue
        }
        cents += p * Math.round(Number(t.amount || 0) * 100)
    }
    return cents / 100
}

export function serieDosMeses(
    rows: LinhaDeValor[],
    tipo: TipoDaCategoria,
    yearMonth: string,
    lookup: CreditCardClosingLookup,
    meses = 12,
): { yearMonth: string; total: number }[] {
    return Array.from({ length: meses }, (_, i) => {
        const ym = shiftYearMonth(yearMonth, i - (meses - 1))
        return { yearMonth: ym, total: totalNoMes(rows, tipo, ym, lookup) }
    })
}

export function comparacaoComMesAnterior(args: {
    rows: LinhaDeValor[]
    tipo: TipoDaCategoria
    yearMonth: string
    hojeYmd: string
    lookup: CreditCardClosingLookup
}): Comparacao {
    const { rows, tipo, yearMonth, hojeYmd, lookup } = args
    const mesAnterior = shiftYearMonth(yearMonth, -1)
    const mesmoPonto = hojeYmd.slice(0, 7) === yearMonth
    const { y, m } = parseYearMonth(mesAnterior)
    const diaAnterior = Math.min(Number(hojeYmd.slice(8, 10)), new Date(y, m, 0).getDate())
    const atual = totalNoMes(rows, tipo, yearMonth, lookup, mesmoPonto ? hojeYmd : undefined)
    const anterior = totalNoMes(
        rows,
        tipo,
        mesAnterior,
        lookup,
        mesmoPonto ? `${mesAnterior}-${String(diaAnterior).padStart(2, "0")}` : undefined,
    )
    return {
        mesAnterior,
        anterior,
        atual,
        variacao: anterior === 0 ? null : (atual - anterior) / anterior,
        mesmoPonto,
    }
}

/** Média dos meses completos antes de `yearMonth`; o mês de criação é parcial e fica fora. */
export function mediaDosMeses(args: {
    rows: LinhaDeValor[]
    tipo: TipoDaCategoria
    yearMonth: string
    lookup: CreditCardClosingLookup
    criadaEm: string
    meses?: number
}): number | null {
    const { rows, tipo, yearMonth, lookup, criadaEm, meses = 6 } = args
    const criada = (transactionLocalYmd(criadaEm) ?? criadaEm).slice(0, 7)
    const elegiveis: string[] = []
    for (let i = 1; i <= meses; i++) {
        const ym = shiftYearMonth(yearMonth, -i)
        if (ym > criada) elegiveis.push(ym)
    }
    if (elegiveis.length < 2) return null
    const soma = elegiveis.reduce((s, ym) => s + totalNoMes(rows, tipo, ym, lookup), 0)
    return reais(soma / elegiveis.length)
}

function dividir<T extends LinhaDeValor, E extends { chave: string; nome: string }>(
    txs: T[],
    tipo: TipoDaCategoria,
    chaveENome: (t: T) => E,
): (Omit<E, "chave" | "nome"> & Fatia)[] {
    const mapa = new Map<string, E & { valor: number; compras: number }>()
    for (const t of txs) {
        const p = peso(t, tipo)
        if (p === 0) continue
        const e = chaveENome(t)
        const f = mapa.get(e.chave) ?? { ...e, valor: 0, compras: 0 }
        f.valor += p * Number(t.amount || 0)
        if (p === 1) f.compras += 1
        mapa.set(e.chave, f)
    }
    return [...mapa.values()]
        .map((f) => ({ ...f, valor: reais(f.valor) }))
        .filter((f) => f.valor > 0)
        .sort((a, b) => b.valor - a.valor)
}

export function divisaoPorPagamento(
    txs: LinhaDeValor[],
    tipo: TipoDaCategoria,
    cartoes: Pick<CreditCard, "id" | "name">[],
): FatiaDePagamento[] {
    return dividir(txs, tipo, (t) => {
        if (t.payment_method === "credit_card") {
            const card = cartoes.find((c) => c.id === t.payment_credit_card_id)
            return {
                chave: t.payment_credit_card_id ?? "credit_card",
                nome: card?.name ?? "Cartão",
                forma: "credit_card",
                cardId: t.payment_credit_card_id ?? null,
            }
        }
        if (!t.payment_method) return { chave: "sem-forma", nome: "Sem forma", forma: "sem-forma", cardId: null }
        return { chave: t.payment_method, nome: paymentMethodLabel(t.payment_method), forma: t.payment_method, cardId: null }
    })
}

/** Chave → `atual − anterior` em reais; null quando a forma não existia no anterior. */
export function diferencaPorForma(atual: Fatia[], anterior: Fatia[]): Record<string, number | null> {
    const antes = new Map(anterior.map((f) => [f.chave, f.valor]))
    return Object.fromEntries(
        atual.map((f) => {
            const a = antes.get(f.chave)
            return [f.chave, a == null ? null : reais(f.valor - a)]
        }),
    )
}

export function maioresLancamentos(txs: Transaction[], tipo: TipoDaCategoria, n = 5): Transaction[] {
    return txs
        .filter((t) => peso(t, tipo) === 1)
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, n)
}

export function descricoesRepetidas(
    txs: Transaction[],
    tipo: TipoDaCategoria,
    n = 3,
): { descricao: string; vezes: number; total: number }[] {
    const grupos = new Map<string, { grafias: Map<string, number>; vezes: number; total: number }>()
    for (const t of txs) {
        if (peso(t, tipo) !== 1) continue
        const grafia = (t.description ?? "").trim()
        if (!grafia) continue
        const k = grafia.toLocaleLowerCase("pt-BR")
        const g = grupos.get(k) ?? { grafias: new Map(), vezes: 0, total: 0 }
        g.grafias.set(grafia, (g.grafias.get(grafia) ?? 0) + 1)
        g.vezes += 1
        g.total += Number(t.amount || 0)
        grupos.set(k, g)
    }
    return [...grupos.values()]
        .filter((g) => g.vezes >= 2)
        .map((g) => ({
            descricao: [...g.grafias].sort((a, b) => b[1] - a[1])[0][0],
            vezes: g.vezes,
            total: reais(g.total),
        }))
        .sort((a, b) => b.vezes - a.vezes || b.total - a.total)
        .slice(0, n)
}
