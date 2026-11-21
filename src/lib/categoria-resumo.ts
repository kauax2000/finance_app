import { labelYearMonthPt, parseYearMonth, shiftYearMonth } from "@/lib/budget-month"
import {
    descricoesRepetidas,
    maioresLancamentos,
    peso,
    type TipoDaCategoria,
    type LinhaDeValor,
} from "@/lib/categoria-detalhe"
import {
    transactionCountsInExpenseMonth,
    type CreditCardClosingLookup,
} from "@/lib/expense-month-attribution"
import { currencyBRL } from "@/lib/formatters"
import type { Transaction, WorkspaceInstallmentPlan, WorkspaceSubscription } from "@/lib/supabase"
import { transactionLocalYmd } from "@/lib/transaction-date"

/** `lancamento` marca o nome do lançamento que puxou o mês (a tela o torna clicável). */
type Parte = { texto: string; forte?: boolean }

const reais = (n: number) => Math.round(n * 100) / 100
const centavos = (t: Pick<Transaction, "amount">) => Math.round(Number(t.amount || 0) * 100)
const ultimoDia = (ym: string) => {
    const { y, m } = parseYearMonth(ym)
    return new Date(y, m, 0).getDate()
}
const diasEntre = (a: string, b: string) =>
    Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 86_400_000)

export type PontoDoRitmo = {
    dia: number
    atual: number | null
    anterior: number
    /** O véu entre as duas linhas, `[baixo, alto]`, só até hoje. */
    faixa: [number, number] | null
    /** Só com o mês aberto: de hoje (o atual de hoje) em reta até o lançado + previsto no último dia. */
    projecao: number | null
}

/** Gasto acumulado dia a dia do mês aberto e do anterior; `atual` fica null depois de hoje. `previsto` é o restante previsto do mês. */
export function ritmoDoMes(args: {
    rows: LinhaDeValor[]
    tipo: TipoDaCategoria
    yearMonth: string
    hojeYmd: string
    lookup: CreditCardClosingLookup
    previsto?: number
}): PontoDoRitmo[] {
    const { rows, tipo, yearMonth, hojeYmd, lookup, previsto = 0 } = args
    const acumulado = (ym: string) => {
        const n = ultimoDia(ym)
        const porDia = new Array<number>(n + 1).fill(0)
        for (const t of rows) {
            const p = peso(t, tipo)
            if (p === 0 || !transactionCountsInExpenseMonth(t, ym, lookup)) continue
            const ymd = transactionLocalYmd(t.date)
            if (!ymd) continue
            // compra do cartão feita no mês anterior ao do fechamento cai no dia 1
            const dia = ymd.slice(0, 7) === ym ? Number(ymd.slice(8, 10)) : ymd < ym ? 1 : n
            porDia[dia] += p * centavos(t)
        }
        let soma = 0
        return porDia.map((c) => (soma += c) / 100)
    }
    const atual = acumulado(yearMonth)
    const anterior = acumulado(shiftYearMonth(yearMonth, -1))
    const n = ultimoDia(yearMonth)
    const aberto = hojeYmd.slice(0, 7) === yearMonth
    const ate = aberto ? Number(hojeYmd.slice(8, 10)) : n
    const deHoje = atual[ate]
    return Array.from({ length: n }, (_, i) => {
        const dia = i + 1
        const a = dia <= ate ? atual[dia] : null
        // o anterior mais longo que o atual: o último dia mostrado leva o total final dele
        const ant = anterior[dia === n ? anterior.length - 1 : Math.min(dia, anterior.length - 1)]
        // hoje no último dia: a reta não tem dias, e o previsto cai inteiro nele
        const projecao = !aberto || dia < ate ? null : reais(deHoje + (n === ate ? previsto : (previsto * (dia - ate)) / (n - ate)))
        return {
            dia,
            atual: a,
            anterior: ant,
            faixa: a == null ? null : [Math.min(a, ant), Math.max(a, ant)],
            projecao,
        }
    })
}

/** Os números do cartão do ritmo: o dia de hoje, a diferença contra o anterior no mesmo dia, onde o mês fecha e onde o anterior fechou. */
export function resumoDoRitmo(
    ritmo: PontoDoRitmo[],
    { aberto }: { aberto: boolean },
): { hoje: number; diferenca: number | null; fechamento: number; anteriorFinal: number | null } {
    const deHoje = ritmo.filter((d) => d.atual != null).at(-1)
    const ultimo = ritmo.at(-1)
    const semAnterior = ritmo.every((d) => d.anterior === 0)
    return {
        hoje: deHoje?.dia ?? 0,
        diferenca: semAnterior || !deHoje ? null : reais((deHoje.atual ?? 0) - deHoje.anterior),
        fechamento: (aberto ? ultimo?.projecao : ultimo?.atual) ?? 0,
        anteriorFinal: semAnterior ? null : (ultimo?.anterior ?? null),
    }
}

const NOMES_DA_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

/** Soma por dia da semana (0 = seg … 6 = dom), pela data da compra. */
export function porDiaDaSemana(
    txs: Transaction[],
    tipo: TipoDaCategoria,
): { dia: number; nome: string; total: number }[] {
    const cents = new Array<number>(7).fill(0)
    for (const t of txs) {
        const p = peso(t, tipo)
        const ymd = transactionLocalYmd(t.date)
        if (p === 0 || !ymd) continue
        const dia = (new Date(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10)).getDay() + 6) % 7
        cents[dia] += p * centavos(t)
    }
    return NOMES_DA_SEMANA.map((nome, dia) => ({ dia, nome, total: cents[dia] / 100 }))
}

const FAIXAS = [
    { faixa: "até R$ 50", ate: 50 },
    { faixa: "R$ 50–200", ate: 200 },
    { faixa: "R$ 200–500", ate: 500 },
    { faixa: "R$ 500+", ate: Infinity },
]

/** Quantas compras em cada faixa de valor (estorno não é compra). */
export function porFaixaDeValor(
    txs: Transaction[],
    tipo: TipoDaCategoria,
): { faixa: string; quantidade: number; total: number }[] {
    const r = FAIXAS.map((f) => ({ faixa: f.faixa, quantidade: 0, total: 0 }))
    for (const t of txs) {
        if (peso(t, tipo) !== 1) continue
        const v = Number(t.amount || 0)
        const i = FAIXAS.findIndex((f) => v <= f.ate)
        r[i].quantidade += 1
        r[i].total = reais(r[i].total + v)
    }
    return r
}

/** A mediana dos valores das compras (null sem lançamentos). */
export function compraTipica(txs: Transaction[], tipo: TipoDaCategoria): number | null {
    const v = txs
        .filter((t) => peso(t, tipo) === 1)
        .map((t) => Number(t.amount || 0))
        .sort((a, b) => a - b)
    if (v.length === 0) return null
    const meio = Math.floor(v.length / 2)
    return reais(v.length % 2 ? v[meio] : (v[meio - 1] + v[meio]) / 2)
}

/** A descrição que mais aparece (≥ 2 vezes), ou null. */
export function maisFrequente(
    txs: Transaction[],
    tipo: TipoDaCategoria,
): { descricao: string; vezes: number; total: number } | null {
    return descricoesRepetidas(txs, tipo, 1)[0] ?? null
}

/** O dia com maior soma, ou null sem lançamentos. */
export function diaDeMaisGasto(
    txs: Transaction[],
    tipo: TipoDaCategoria,
): { ymd: string; total: number; quantidade: number } | null {
    const dias = new Map<string, { cents: number; quantidade: number }>()
    for (const t of txs) {
        const p = peso(t, tipo)
        const ymd = transactionLocalYmd(t.date)
        if (p === 0 || !ymd) continue
        const d = dias.get(ymd) ?? { cents: 0, quantidade: 0 }
        d.cents += p * centavos(t)
        if (p === 1) d.quantidade += 1
        dias.set(ymd, d)
    }
    let melhor: { ymd: string; total: number; quantidade: number } | null = null
    for (const [ymd, d] of dias) {
        if (!melhor || d.cents / 100 > melhor.total) melhor = { ymd, total: d.cents / 100, quantidade: d.quantidade }
    }
    return melhor
}

const MESES_POR_COBRANCA = { weekly: 12 / 52, monthly: 1, bimonthly: 2, yearly: 12 } as const

export type Compromissos = {
    itens: {
        id: string
        nome: string
        tipo: "parcela" | "assinatura"
        valor: number
        proximaYmd: string | null
        atual?: number
        total?: number
        terminaYm?: string | null
    }[]
    porMes: number
    ateAcabar: number
}

/** Parcelas ativas da categoria (n de N, o que falta) e assinaturas ativas com a próxima cobrança. */
export function compromissos(args: {
    categoryId: string
    parcelas: WorkspaceInstallmentPlan[]
    assinaturas: WorkspaceSubscription[]
    hojeYmd: string
}): Compromissos {
    const { categoryId, parcelas, assinaturas, hojeYmd } = args
    const itens: Compromissos["itens"] = []
    let porMes = 0
    let ateAcabar = 0
    for (const p of parcelas) {
        if (!p.is_active || p.category_id !== categoryId) continue
        const falta = Math.max(0, p.total_installments - p.generated_count)
        const valor = Number(p.installment_amount)
        itens.push({
            id: p.id,
            nome: p.description?.trim() || "Compra parcelada",
            tipo: "parcela",
            valor,
            proximaYmd: falta > 0 ? p.next_billing_date : null,
            atual: p.generated_count,
            total: p.total_installments,
            terminaYm: falta > 0 ? shiftYearMonth(p.next_billing_date.slice(0, 7), falta - 1) : hojeYmd.slice(0, 7),
        })
        if (falta > 0) {
            porMes += valor
            ateAcabar += (falta - 1) * valor + Number(p.final_installment_amount)
        }
    }
    for (const s of assinaturas) {
        if (!s.is_active || s.category_id !== categoryId) continue
        const valor = Number(s.amount)
        itens.push({ id: s.id, nome: s.name, tipo: "assinatura", valor, proximaYmd: s.next_billing_date })
        porMes += valor / (MESES_POR_COBRANCA[s.billing_interval] ?? 1)
    }
    return { itens, porMes: reais(porMes), ateAcabar: reais(ateAcabar) }
}

/** As repetidas do mês, a cadência média em dias e a projeção até o fim do mês (só no mês aberto). */
export function repeticoes(args: {
    txs: Transaction[]
    tipo: TipoDaCategoria
    yearMonth: string
    hojeYmd: string
}): { descricao: string; vezes: number; total: number; aCadaDias: number | null; projecaoNoMes: number | null }[] {
    const { txs, tipo, yearMonth, hojeYmd } = args
    const aberto = hojeYmd.slice(0, 7) === yearMonth
    const faltam = ultimoDia(yearMonth) - Number(hojeYmd.slice(8, 10))
    return descricoesRepetidas(txs, tipo, Infinity).map((r) => {
        const chave = r.descricao.toLocaleLowerCase("pt-BR")
        const datas = txs
            .filter((t) => peso(t, tipo) === 1 && (t.description ?? "").trim().toLocaleLowerCase("pt-BR") === chave)
            .map((t) => transactionLocalYmd(t.date))
            .filter((d): d is string => !!d)
            .sort()
        const cadencia = datas.length > 1 ? Math.round(diasEntre(datas[0], datas[datas.length - 1]) / (datas.length - 1)) : 0
        const aCadaDias = cadencia > 0 ? cadencia : null
        return {
            ...r,
            aCadaDias,
            projecaoNoMes:
                aberto && aCadaDias ? reais(Math.floor(faltam / aCadaDias) * (r.total / r.vezes)) : null,
        }
    })
}

/** O mês sem o ano, com maiúscula ("Novembro"). */
export const nomeDoMes = (ym: string) => {
    const n = labelYearMonthPt(ym).split(" ")[0]
    return n.charAt(0).toLocaleUpperCase("pt-BR") + n.slice(1)
}

/** Tira o sufixo de parcela ("- 3/6", "– 3/6", "(3/6)", " 3/6") do fim; vazio vira null. */
export function descricaoSemParcela(descricao: string | null | undefined): string | null {
    const t = (descricao ?? "").replace(/\s*(?:[-–]\s*\d+\/\d+|\(\d+\/\d+\)|\d+\/\d+)\s*$/, "").trim()
    return t || null
}

/** O lançamento que puxou o mês: 2 compras ou mais, e o maior acima de 40% do lançado. */
const puxouOMes = (maior: Transaction | null, lancado: number, compras: number) =>
    !!maior && lancado > 0 && compras >= 2 && Number(maior.amount) / lancado > 0.4


/** Os até três fatos do mês (puxou, já previsto, total), na ordem em que aparecem. */
export function fatosDoMes(args: {
    tipo: TipoDaCategoria
    yearMonth: string
    lancado: number
    media: number | null
    maior: Transaction | null
    compras: number
    proximoMes: number
}): { id: "puxou" | "previsto" | "total"; rotulo: string; titulo: string; valor: number; acao?: "lancamento" | "comprometido" }[] {
    const { yearMonth, lancado, media, maior, compras, proximoMes } = args
    if (lancado <= 0) return []
    const r: ReturnType<typeof fatosDoMes> = []
    if (maior && puxouOMes(maior, lancado, compras)) {
        r.push({
            id: "puxou",
            rotulo: "Puxou o mês",
            titulo: descricaoSemParcela(maior.description) ?? "O maior lançamento",
            valor: Number(maior.amount),
            acao: "lancamento",
        })
    }
    if (proximoMes > 0) {
        r.push({
            id: "previsto",
            rotulo: "Já previsto",
            titulo: nomeDoMes(shiftYearMonth(yearMonth, 1)),
            valor: proximoMes,
            acao: "comprometido",
        })
    }
    r.push({
        id: "total",
        rotulo: "Total do mês",
        titulo: media != null && media > 0 ? `média ${currencyBRL(media)}` : nomeDoMes(yearMonth).toLocaleLowerCase("pt-BR"),
        valor: lancado,
    })
    return r
}

/** Até 3 insights, na ordem de utilidade. */
export function insights(args: {
    tipo: TipoDaCategoria
    lancado: number
    media: number | null
    limite: number | null
    txs: Transaction[]
    compromissos: Compromissos
}): { id: string; tom: "success" | "warning" | "info"; texto: Parte[]; acao?: "previsao" | "limite" }[] {
    const { tipo, lancado, media, limite, txs, compromissos: c } = args
    const r: ReturnType<typeof insights> = []
    const termina = c.itens
        .filter((i) => i.tipo === "parcela" && i.terminaYm)
        .sort((a, b) => a.terminaYm!.localeCompare(b.terminaYm!))[0]
    if (termina) {
        const apos = labelYearMonthPt(shiftYearMonth(termina.terminaYm!, 1)).toLocaleLowerCase("pt-BR")
        r.push({
            id: "parcela-termina",
            tom: "success",
            acao: "previsao",
            texto: [
                { texto: `${termina.nome} termina em ${labelYearMonthPt(termina.terminaYm!).toLocaleLowerCase("pt-BR")}: libera ` },
                { texto: `${currencyBRL(termina.valor)}/mês`, forte: true },
                { texto: ` a partir de ${apos}.` },
            ],
        })
    }
    const maiores = maioresLancamentos(txs, tipo, 2)
    const dois = maiores.reduce((s, t) => s + Number(t.amount || 0), 0)
    if (lancado > 0 && txs.filter((t) => peso(t, tipo) === 1).length >= 3 && maiores.length === 2 && dois <= lancado && dois / lancado > 0.7) {
        r.push({
            id: "concentracao",
            tom: "warning",
            texto: [
                { texto: `Os 2 maiores lançamentos são ${Math.round((dois / lancado) * 100)}% do mês; sem eles ficaria em ` },
                { texto: currencyBRL(lancado - dois), forte: true },
                { texto: "." },
            ],
        })
    }
    if (tipo === "expense" && limite == null && media != null && media > 0) {
        r.push({
            id: "limite",
            tom: "info",
            acao: "limite",
            texto: [
                { texto: "Sem limite definido. Pela média, " },
                { texto: currencyBRL(Math.ceil(media / 100) * 100), forte: true },
                { texto: " por mês seria um bom limite." },
            ],
        })
    }
    return r.slice(0, 3)
}

/**
 * Para onde a categoria está indo: do primeiro ao último mês inteiro da série.
 * Fica de fora o mês aberto (ainda vai crescer) e o primeiro quando é pela
 * metade (o mês em que a categoria começou a ser usada). Com menos de dois
 * meses inteiros, ou começando do zero, não há tendência.
 */
export function tendenciaDosMeses(
    meses: { yearMonth: string; total: number }[],
    { aberto, primeiroPelaMetade }: { aberto: boolean; primeiroPelaMetade: boolean },
): { variacao: number; desde: string } | null {
    const inteiros = meses.slice(primeiroPelaMetade ? 1 : 0, aberto ? -1 : undefined)
    if (inteiros.length < 2) return null
    const inicio = inteiros[0]
    const fim = inteiros[inteiros.length - 1]
    if (inicio.total <= 0) return null
    return { variacao: (fim.total - inicio.total) / inicio.total, desde: inicio.yearMonth }
}
