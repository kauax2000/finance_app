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

type Parte = { texto: string; forte?: boolean }

const reais = (n: number) => Math.round(n * 100) / 100
const centavos = (t: Pick<Transaction, "amount">) => Math.round(Number(t.amount || 0) * 100)
const ultimoDia = (ym: string) => {
    const { y, m } = parseYearMonth(ym)
    return new Date(y, m, 0).getDate()
}
const diasEntre = (a: string, b: string) =>
    Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 86_400_000)

/** Gasto acumulado dia a dia do mês aberto e do anterior; `atual` fica null depois de hoje. */
export function ritmoDoMes(args: {
    rows: LinhaDeValor[]
    tipo: TipoDaCategoria
    yearMonth: string
    hojeYmd: string
    lookup: CreditCardClosingLookup
}): { dia: number; atual: number | null; anterior: number }[] {
    const { rows, tipo, yearMonth, hojeYmd, lookup } = args
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
    const ate = hojeYmd.slice(0, 7) === yearMonth ? Number(hojeYmd.slice(8, 10)) : n
    return Array.from({ length: n }, (_, i) => ({
        dia: i + 1,
        atual: i + 1 <= ate ? atual[i + 1] : null,
        // o anterior mais longo que o atual: o último dia mostrado leva o total final dele
        anterior: anterior[i + 1 === n ? anterior.length - 1 : Math.min(i + 1, anterior.length - 1)],
    }))
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

/** A frase de resumo, sem IA. */
export function fraseDoResumo(args: {
    nomeDaCategoria: string
    tipo: TipoDaCategoria
    yearMonth: string
    aberto: boolean
    lancado: number
    previsto: number
    media: number | null
    maior: Transaction | null
    /** Quantas compras o mês tem (o "puxou o mês" pede 2 ou mais). */
    compras: number
    proximoMes: number
}): { partes: Parte[] } {
    const { nomeDaCategoria: nome, tipo, yearMonth, aberto, lancado, previsto, media, maior, compras, proximoMes } = args
    const mes = labelYearMonthPt(yearMonth).toLocaleLowerCase("pt-BR")
    const despesa = tipo === "expense"
    if (lancado === 0 && previsto === 0) {
        return {
            partes: [
                {
                    texto: `${despesa ? "Nenhum gasto com" : "Nenhuma entrada em"} ${nome} em ${mes}${aberto ? " até agora" : ""}.`,
                },
            ],
        }
    }
    const partes: Parte[] = [
        { texto: `Em ${mes} ${despesa ? "você gastou" : "entrou"} ` },
        { texto: currencyBRL(lancado), forte: true },
        { texto: despesa ? ` com ${nome}` : ` em ${nome}` },
    ]
    if (lancado > 0 && media != null && media > 0) {
        // Com o que vem pela frente, o veredito é da projeção e a frase diz isso.
        const projeta = aberto && previsto - lancado > 0.005
        const razao = (projeta ? previsto : lancado) / media
        const veredito = razao > 1.1 ? "acima da" : razao < 0.9 ? "abaixo da" : "em linha com a"
        partes.push({ texto: `${projeta ? ", e deve fechar" : ","} ${veredito} média de ${currencyBRL(media)}.` })
    } else partes.push({ texto: "." })
    if (maior && lancado > 0 && compras >= 2 && Number(maior.amount) / lancado > 0.4) {
        partes.push({ texto: ` ${maior.description?.trim() || "O maior lançamento"} (` })
        partes.push({ texto: currencyBRL(Number(maior.amount)), forte: true })
        partes.push({ texto: ") puxou o mês." })
    }
    if (aberto && previsto - lancado > 0.005) {
        partes.push({ texto: " Ainda vêm " })
        partes.push({ texto: currencyBRL(previsto - lancado), forte: true })
        partes.push({ texto: " neste mês." })
    }
    if (proximoMes > 0) {
        partes.push({ texto: " No mês seguinte já há " })
        partes.push({ texto: currencyBRL(proximoMes), forte: true })
        partes.push({ texto: " previstos." })
    }
    return { partes }
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
