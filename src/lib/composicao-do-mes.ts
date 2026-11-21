import { nomeDoMes, reaisInteiros } from "@/components/categories/detail/regua-do-mes-contas"
import { shiftYearMonth } from "@/lib/budget-month"
import { peso, type TipoDaCategoria } from "@/lib/categoria-detalhe"
import {
    transactionCountsInExpenseMonth,
    type CreditCardClosingLookup,
} from "@/lib/expense-month-attribution"
import { percentBR } from "@/lib/formatters"
import type { Transaction, WorkspaceInstallmentPlan, WorkspaceSubscription } from "@/lib/supabase"
import { transactionLocalYmd } from "@/lib/transaction-date"

export type ItemFixo = {
    /** O id do plano ou da assinatura. */
    id: string
    nome: string
    tipo: "parcela" | "assinatura"
    valor: number
    /** A data do lançamento deste mês (YYYY-MM-DD). */
    diaYmd: string
    atual?: number
    total?: number
    /** O mês em que começou, quando foi há até 3 meses (contando este). */
    novoDesdeYm?: string
}

export type GrupoVariavel = {
    chave: string
    nome: string
    /** Lançamentos de peso 1 (o estorno abate o valor, não conta). */
    vezes: number
    valor: number
    /** A média do grupo nos meses do histórico em que ele apareceu; null se não apareceu. */
    normal: number | null
    /** Fração contra o normal; null no grupo novo. */
    variacao: number | null
    novo: boolean
}

export type CasoDaComposicao = "semMedia" | "normal" | "novo" | "fixoPuxou" | "variavelPuxou"

export type ComposicaoDoMes = {
    fixo: { total: number; itens: ItemFixo[]; ultimaTerminaYm?: string; proximoMes: number }
    /** Os 3 maiores grupos; o resto vai para `outros`. */
    variavel: { total: number; grupos: GrupoVariavel[]; outros: { vezes: number; valor: number } | null }
    normais: { fixo: number | null; variavel: number | null }
    caso: CasoDaComposicao
    direcao: "acima" | "abaixo" | null
    variacaoTotal: number | null
    /**
     * novo: o fixo novo de maior valor (`desdeYm`). fixoPuxou: `nome` "parcelas" e a `variacao` do
     * variável contra o normal. variavelPuxou: o grupo, com `variacao` (null se novo) e `aMais` em reais
     * (negativo quando caiu).
     */
    destaque?: { nome: string; desdeYm?: string; variacao?: number | null; aMais?: number }
}

export type ParteDaFrase = { texto: string; forte?: boolean; tom?: "success" | "warning" }

const NORMAL = 0.02
const GRUPOS_A_MOSTRAR = 3
const centavos = (t: Pick<Transaction, "amount">) => Math.round(Number(t.amount || 0) * 100)
const ehFixo = (t: Transaction) => Boolean(t.installment_plan_id || t.subscription_id)
const variacao = (atual: number, normal: number | null) => (normal ? (atual - normal) / normal : null)

/** Sem o sufixo de parcela (" - 3/6", "(3/12)") e sem números e pontuação no fim, na grafia original. */
function semSufixo(descricao: string): string {
    return descricao
        .trim()
        .replace(/\s*-?\s*\(?\s*\d+\s*\/\s*\d+\s*\)?\s*$/, "")
        .replace(/[\s\d\p{P}\p{S}]+$/u, "")
}

/** A chave do grupo: minúsculas, sem acento, sem sufixo, a primeira palavra. */
export function chaveDoGrupo(descricao: string): string {
    const limpa = semSufixo(descricao)
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLocaleLowerCase("pt-BR")
    return limpa.split(/[^a-z0-9]+/).find(Boolean) ?? ""
}

/** Os meses do histórico: a janela de `mediaDosMeses` (até 6 inteiros antes, depois do mês de criação). */
function janela(yearMonth: string, criadaEm: string, meses = 6): string[] {
    const criada = (transactionLocalYmd(criadaEm) ?? criadaEm).slice(0, 7)
    const r: string[] = []
    for (let i = 1; i <= meses; i++) {
        const ym = shiftYearMonth(yearMonth, -i)
        if (ym > criada) r.push(ym)
    }
    return r
}

type Somas = { fixo: number; variavel: number; grupos: Map<string, number>; grafias: Map<string, Map<string, number>> }

/** Somas em centavos com o peso (o estorno abate); `vezes` conta por grupo os de peso 1. */
function somar(txs: Transaction[], tipo: TipoDaCategoria, vezes?: Map<string, number>): Somas {
    const s: Somas = { fixo: 0, variavel: 0, grupos: new Map(), grafias: new Map() }
    for (const t of txs) {
        const p = peso(t, tipo)
        if (p === 0) continue
        const c = p * centavos(t)
        if (ehFixo(t)) {
            s.fixo += c
            continue
        }
        s.variavel += c
        const k = chaveDoGrupo(t.description ?? "")
        s.grupos.set(k, (s.grupos.get(k) ?? 0) + c)
        const g = s.grafias.get(k) ?? new Map<string, number>()
        const grafia = semSufixo(t.description ?? "")
        g.set(grafia, (g.get(grafia) ?? 0) + 1)
        s.grafias.set(k, g)
        if (vezes && p === 1) vezes.set(k, (vezes.get(k) ?? 0) + 1)
    }
    return s
}

/** A grafia mais comum; empate fica com a mais curta. */
function nomeDoGrupo(grafias: Map<string, number> | undefined): string {
    const melhor = [...(grafias ?? [])].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0]?.[0]
    return melhor || "Sem descrição"
}

export function composicaoDoMes(args: {
    txsDoMes: Transaction[]
    historico: Transaction[]
    tipo: TipoDaCategoria
    yearMonth: string
    lookup: CreditCardClosingLookup
    parcelas: WorkspaceInstallmentPlan[]
    assinaturas: WorkspaceSubscription[]
    categoryId: string
    media: number | null
    /** `category.created_at`: corta a janela do histórico como a `mediaDosMeses`. */
    criadaEm: string
}): ComposicaoDoMes {
    const { txsDoMes, historico, tipo, yearMonth, lookup, parcelas, assinaturas, media, criadaEm } = args
    const desde3Meses = shiftYearMonth(yearMonth, -2)

    // O fixo: um item por plano ou assinatura.
    const porFonte = new Map<string, { item: ItemFixo; cents: number; proximo: number; terminaYm?: string }>()
    for (const t of txsDoMes) {
        const p = peso(t, tipo)
        if (p === 0 || !ehFixo(t)) continue
        const fonte = (t.installment_plan_id ?? t.subscription_id)!
        const atual = porFonte.get(fonte)
        if (atual) {
            atual.cents += p * centavos(t)
            continue
        }
        const diaYmd = transactionLocalYmd(t.date) ?? t.date.slice(0, 10)
        if (t.installment_plan_id) {
            const plano = parcelas.find((x) => x.id === t.installment_plan_id)
            const n = t.installment_sequence ?? undefined
            const total = plano?.total_installments
            const inicio = n != null ? shiftYearMonth(yearMonth, -(n - 1)) : plano?.created_at.slice(0, 7)
            const continua = n != null && total != null && n < total
            porFonte.set(fonte, {
                cents: p * centavos(t),
                item: {
                    id: fonte,
                    nome: plano?.description?.trim() || semSufixo(t.description ?? "") || "Compra parcelada",
                    tipo: "parcela",
                    valor: 0,
                    diaYmd,
                    atual: n,
                    total,
                    novoDesdeYm: inicio && inicio >= desde3Meses ? inicio : undefined,
                },
                terminaYm: n != null && total != null ? shiftYearMonth(yearMonth, total - n) : undefined,
                proximo: continua && plano ? Number(n + 1 === total ? plano.final_installment_amount : plano.installment_amount) : 0,
            })
        } else {
            const s = assinaturas.find((x) => x.id === t.subscription_id)
            const criada = s ? (transactionLocalYmd(s.created_at) ?? s.created_at).slice(0, 7) : undefined
            porFonte.set(fonte, {
                cents: p * centavos(t),
                item: {
                    id: fonte,
                    nome: s?.name?.trim() || semSufixo(t.description ?? "") || "Assinatura",
                    tipo: "assinatura",
                    valor: 0,
                    diaYmd,
                    novoDesdeYm: criada && criada >= desde3Meses ? criada : undefined,
                },
                // shortcut: só a mensal entra no mês seguinte; a semanal e a bimestral ficam de fora.
                proximo: s?.is_active && s.billing_interval === "monthly" ? Number(s.amount) : 0,
            })
        }
    }
    const fontes = [...porFonte.values()].filter((f) => f.cents > 0)
    const itens = fontes.map((f) => ({ ...f.item, valor: f.cents / 100 })).sort((a, b) => b.valor - a.valor)
    const terminos = fontes.map((f) => f.terminaYm).filter((x): x is string => !!x).sort()

    // O mês e o normal de cada parte.
    const vezes = new Map<string, number>()
    const mes = somar(txsDoMes, tipo, vezes)
    const meses = janela(yearMonth, criadaEm)
    const doHistorico = meses.map((ym) =>
        somar(
            historico.filter((t) => transactionCountsInExpenseMonth(t, ym, lookup)),
            tipo,
        ),
    )
    const temNormal = meses.length >= 2
    const normal = (f: (s: Somas) => number) =>
        temNormal ? Math.round(doHistorico.reduce((a, s) => a + f(s), 0) / meses.length) / 100 : null
    const normais = { fixo: normal((s) => s.fixo), variavel: normal((s) => s.variavel) }
    const normalDoGrupo = (k: string) => {
        if (!temNormal) return null
        const vals = doHistorico.map((s) => s.grupos.get(k) ?? 0).filter((c) => c > 0)
        return vals.length ? Math.round(vals.reduce((a, c) => a + c, 0) / vals.length) / 100 : null
    }

    const todos: GrupoVariavel[] = [...mes.grupos]
        .filter(([, c]) => c > 0)
        .map(([chave, c]) => {
            const valor = c / 100
            const n = normalDoGrupo(chave)
            return { chave, nome: nomeDoGrupo(mes.grafias.get(chave)), vezes: vezes.get(chave) ?? 0, valor, normal: n, variacao: variacao(valor, n), novo: n == null }
        })
        .sort((a, b) => b.valor - a.valor)
    const resto = todos.slice(GRUPOS_A_MOSTRAR)

    const fixoTotal = fontes.reduce((a, f) => a + f.cents, 0) / 100
    const variavelTotal = mes.variavel / 100
    const total = (Math.round(fixoTotal * 100) + mes.variavel) / 100
    const r: ComposicaoDoMes = {
        fixo: {
            total: fixoTotal,
            itens,
            ultimaTerminaYm: terminos.at(-1),
            proximoMes: Math.round(fontes.reduce((a, f) => a + f.proximo * 100, 0)) / 100,
        },
        variavel: {
            total: variavelTotal,
            grupos: todos.slice(0, GRUPOS_A_MOSTRAR),
            outros: resto.length
                ? { vezes: resto.reduce((a, g) => a + g.vezes, 0), valor: Math.round(resto.reduce((a, g) => a + g.valor * 100, 0)) / 100 }
                : null,
        },
        normais,
        caso: "semMedia",
        direcao: null,
        variacaoTotal: null,
    }
    if (media == null || media <= 0) return r
    const delta = (total - media) / media
    r.variacaoTotal = delta
    if (Math.abs(delta) < NORMAL) return { ...r, caso: "normal" }
    r.direcao = delta > 0 ? "acima" : "abaixo"

    const novo = itens.filter((i) => i.novoDesdeYm)[0]
    if (delta > 0 && novo) return { ...r, caso: "novo", destaque: { nome: novo.nome, desdeYm: novo.novoDesdeYm } }

    // Mais da metade da diferença (para cima ou para baixo) veio do fixo?
    const diferenca = total - media
    const doFixo = fixoTotal - (normais.fixo ?? 0)
    if (doFixo / diferenca > 0.5) {
        return { ...r, caso: "fixoPuxou", destaque: { nome: "parcelas", variacao: variacao(variavelTotal, normais.variavel) } }
    }

    // O grupo que mais subiu (ou caiu, incluindo o que sumiu) em reais.
    const chaves = new Set([...mes.grupos.keys(), ...doHistorico.flatMap((s) => [...s.grupos.keys()])])
    let melhor: { chave: string; aMais: number } | null = null
    for (const k of chaves) {
        const aMais = Math.max(0, mes.grupos.get(k) ?? 0) / 100 - (normalDoGrupo(k) ?? 0)
        if (aMais * diferenca > 0 && (!melhor || Math.abs(aMais) > Math.abs(melhor.aMais))) melhor = { chave: k, aMais }
    }
    if (!melhor) return { ...r, caso: "variavelPuxou" }
    const valor = Math.max(0, mes.grupos.get(melhor.chave) ?? 0) / 100
    const nome = nomeDoGrupo(mes.grafias.get(melhor.chave) ?? doHistorico.findLast((s) => s.grafias.has(melhor.chave))?.grafias.get(melhor.chave))
    return {
        ...r,
        caso: "variavelPuxou",
        destaque: { nome, variacao: variacao(valor, normalDoGrupo(melhor.chave)), aMais: Math.round(melhor.aMais * 100) / 100 },
    }
}

const porcento = (v: number) => percentBR(Math.abs(v), { maximumFractionDigits: 0 })

/** A frase do bloco, em partes; o tom só no "acima"/"abaixo", pela régua de despesa (receita inverte). */
export function fraseDaComposicao(c: ComposicaoDoMes, despesa: boolean): ParteDaFrase[] {
    const tomDe = (acima: boolean): ParteDaFrase["tom"] => (acima === despesa ? "warning" : "success")
    const forte = (texto: string): ParteDaFrase => ({ texto, forte: true })
    const fixos = despesa ? "parcelas" : "entradas fixas"

    if (c.caso === "semMedia") {
        return [
            forte(reaisInteiros(c.fixo.total)),
            { texto: despesa ? " fixos e " : " de entradas fixas e " },
            forte(reaisInteiros(c.variavel.total)),
            { texto: despesa ? " do dia a dia neste mês." : " avulsas neste mês." },
        ]
    }
    if (c.caso === "normal" || c.variacaoTotal == null || c.direcao == null) {
        const r: ParteDaFrase[] = [{ texto: "O mês está dentro do seu normal." }]
        if (c.fixo.total > 0) r.push({ texto: " " }, forte(reaisInteiros(c.fixo.total)), { texto: ` dele já eram ${fixos}.` })
        return r
    }
    const acima = c.direcao === "acima"
    const inicio: ParteDaFrase[] = [
        { texto: "O mês está " },
        { texto: `${porcento(c.variacaoTotal)} ${c.direcao}`, forte: true, tom: tomDe(acima) },
        { texto: " da média" },
    ]
    const d = c.destaque
    if (c.caso === "novo" && d) {
        return [...inicio, { texto: " por causa de " }, forte(d.nome), { texto: ", que começou em " }, forte(d.desdeYm ? nomeDoMes(d.desdeYm) : ""), { texto: "." }]
    }
    if (c.caso === "fixoPuxou") {
        const r: ParteDaFrase[] = [...inicio, { texto: " só por causa das " }, forte(fixos), { texto: "." }]
        const v = d?.variacao
        if (v == null) return r
        r.push({ texto: ` O que você controla, ` }, forte(reaisInteiros(c.variavel.total)), { texto: ", está " })
        if (Math.abs(v) < NORMAL) r.push({ texto: "dentro do seu normal." })
        else r.push({ texto: `${porcento(v)} ${v > 0 ? "acima" : "abaixo"}`, forte: true, tom: tomDe(v > 0) }, { texto: " do seu normal." })
        return r
    }
    if (!d || d.aMais == null) return [...inicio, { texto: "." }]
    if (d.variacao == null) {
        return [...inicio, { texto: ": " }, forte(d.nome), { texto: " é novo neste mês (" }, forte(reaisInteiros(d.aMais)), { texto: ")." }]
    }
    return [
        ...inicio,
        { texto: ": " },
        forte(d.nome),
        { texto: d.aMais > 0 ? " subiu " : " caiu " },
        forte(porcento(d.variacao)),
        { texto: " (" },
        forte(reaisInteiros(Math.abs(d.aMais))),
        { texto: d.aMais > 0 ? " a mais que o normal)." : " a menos que o normal)." },
    ]
}

/** Quem lançou quanto no mês (`user_id`), com o peso da categoria; do maior para o menor, sem quem fica em zero ou abaixo. */
export function quemGastou(txsDoMes: Transaction[], tipo: TipoDaCategoria): { userId: string; valor: number }[] {
    const porPessoa = new Map<string, number>()
    for (const t of txsDoMes) {
        const p = peso(t, tipo)
        if (p !== 0) porPessoa.set(t.user_id, (porPessoa.get(t.user_id) ?? 0) + p * centavos(t))
    }
    return [...porPessoa]
        .filter(([, c]) => c > 0)
        .map(([userId, c]) => ({ userId, valor: c / 100 }))
        .sort((a, b) => b.valor - a.valor)
}
