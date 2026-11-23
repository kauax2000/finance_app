import { mesCurto } from "@/components/analise-do-mes/rotulos"
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
    /** O dia do último lançamento de peso 1 do grupo no mês (YYYY-MM-DD). */
    ultimaYmd?: string
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
    /**
     * O grupo de maior diferença em reais na direção do variável contra o normal (o que a frase diz
     * que puxou): `valor` no mês, `variacao` (null se novo) e `aMais` (negativo quando caiu).
     */
    puxouOVariavel?: { nome: string; valor: number; variacao: number | null; aMais: number }
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

/** Somas em centavos com o peso (o estorno abate); `vezes` conta por grupo os de peso 1, e `ultimas` guarda o dia do último. */
function somar(txs: Transaction[], tipo: TipoDaCategoria, vezes?: Map<string, number>, ultimas?: Map<string, string>): Somas {
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
        if (ultimas && p === 1) {
            const dia = transactionLocalYmd(t.date) ?? t.date.slice(0, 10)
            if (dia > (ultimas.get(k) ?? "")) ultimas.set(k, dia)
        }
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
    const ultimas = new Map<string, string>()
    const mes = somar(txsDoMes, tipo, vezes, ultimas)
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
            return {
                chave,
                nome: nomeDoGrupo(mes.grafias.get(chave)),
                vezes: vezes.get(chave) ?? 0,
                valor,
                normal: n,
                variacao: variacao(valor, n),
                novo: n == null,
                ultimaYmd: ultimas.get(chave),
            }
        })
        .sort((a, b) => b.valor - a.valor)
    const resto = todos.slice(GRUPOS_A_MOSTRAR)

    // O grupo que mais subiu (ou caiu, incluindo o que sumiu) em reais, na direção de `sinal`.
    const chaves = new Set([...mes.grupos.keys(), ...doHistorico.flatMap((s) => [...s.grupos.keys()])])
    const maiorDiferenca = (sinal: number) => {
        let melhor: { chave: string; aMais: number } | null = null
        for (const k of chaves) {
            const aMais = Math.max(0, mes.grupos.get(k) ?? 0) / 100 - (normalDoGrupo(k) ?? 0)
            if (aMais * sinal > 0 && (!melhor || Math.abs(aMais) > Math.abs(melhor.aMais))) melhor = { chave: k, aMais }
        }
        if (!melhor) return null
        const { chave, aMais } = melhor
        const valor = Math.max(0, mes.grupos.get(chave) ?? 0) / 100
        const nome = nomeDoGrupo(mes.grafias.get(chave) ?? doHistorico.findLast((s) => s.grafias.has(chave))?.grafias.get(chave))
        return { nome, valor, variacao: variacao(valor, normalDoGrupo(chave)), aMais: Math.round(aMais * 100) / 100 }
    }

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
    const puxou = normais.variavel != null ? maiorDiferenca(variavelTotal - normais.variavel) : null
    if (puxou) r.puxouOVariavel = puxou
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

    const melhor = maiorDiferenca(diferenca)
    if (!melhor) return { ...r, caso: "variavelPuxou" }
    return { ...r, caso: "variavelPuxou", destaque: { nome: melhor.nome, variacao: melhor.variacao, aMais: melhor.aMais } }
}

const porcento = (v: number) => percentBR(Math.abs(v), { maximumFractionDigits: 0 })

/** O variável e o fixo contam como "fora do normal" a partir de ±5% (o total, de ±2%). */
const PARTE_NORMAL = 0.05
/** Fora do normal pelo % que se escreve: 5,4% sai "5%" na frase, e um "caiu 5%" no limite lia como ruído. Exportado para a linha do grupo usar a mesma régua. */
export function foraDoNormal(v: number): boolean {
    return Math.round(Math.abs(v) * 100) > PARTE_NORMAL * 100
}

/**
 * A frase do bloco, em partes; o tom só na direção, pela régua de despesa (receita inverte).
 * Com o variável fora do normal ela começa por ele, quem o puxou, o fixo e o total; senão, o caso.
 */
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

    const normalVar = c.normais.variavel
    const vVar = variacao(c.variavel.total, normalVar)
    if (normalVar != null && vVar != null && foraDoNormal(vVar)) {
        const subiu = vVar > 0
        const verbo = despesa ? (subiu ? "subiu" : "caiu") : subiu ? "subiram" : "caíram"
        const r: ParteDaFrase[] = [
            { texto: despesa ? "O que você controla " : "As avulsas " },
            { texto: `${verbo} ${porcento(vVar)}`, forte: true, tom: tomDe(subiu) },
            { texto: ": " },
            forte(reaisInteiros(c.variavel.total)),
            { texto: `, ${reaisInteiros(Math.abs(c.variavel.total - normalVar))} ${subiu ? "acima" : "abaixo"} do seu normal` },
        ]
        const p = c.puxouOVariavel
        if (p) {
            const quanto = p.variacao == null ? `novo, ${reaisInteiros(p.valor)}` : `${p.variacao > 0 ? "↑" : "↓"} ${porcento(p.variacao)}`
            r.push({ texto: despesa ? ", puxado por " : ", puxadas por " }, forte(p.nome), { texto: ` (${quanto})` })
        }
        // O fixo, quando saiu do normal (o novo diz quem e desde quando); depois, o total.
        const dFixo = c.fixo.total - (c.normais.fixo ?? 0)
        const fixoMudou =
            c.normais.fixo != null && (c.normais.fixo ? foraDoNormal(dFixo / c.normais.fixo) : dFixo > 0)
        if (fixoMudou) {
            const Fixos = despesa ? "As parcelas" : "As entradas fixas"
            r.push({ texto: `. ${Fixos} ${dFixo > 0 ? "subiram" : "caíram"}` })
            const d = c.destaque
            if (c.caso === "novo" && d?.desdeYm) r.push({ texto: " com " }, forte(d.nome), { texto: ", que começou em " }, forte(nomeDoMes(d.desdeYm)))
        }
        r.push({ texto: "." })
        return r
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
        const r: ParteDaFrase[] = [...inicio, { texto: " por causa das " }, forte(fixos), { texto: "." }]
        // Aqui o variável já está dentro de ±5% (senão a frase começou por ele).
        if (d?.variacao == null) return r
        r.push({ texto: despesa ? " O que você controla, " : " As avulsas, " }, forte(reaisInteiros(c.variavel.total)), {
            texto: despesa ? ", está dentro do seu normal." : ", estão dentro do seu normal.",
        })
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

export type MotivoDoMes = {
    /** A chave do grupo; só no variável. */
    chave?: string
    nome: string
    /** "novo", "novo desde set". */
    detalhe?: string
    /** A diferença em reais contra o normal, com sinal. */
    delta: number
    parte: "variavel" | "fixo"
}

export type LeituraDoMes = {
    tom: "warning" | "success" | "info"
    manchete: ParteDaFrase[]
    apoio: ParteDaFrase[]
    motivos: MotivoDoMes[]
    /** "Com o dia a dia no seu normal, <mes> fecha perto de R$ <valor>"; `grupo` é o motivo principal do variável. */
    sugestao: { mes: string; valor: number; grupo?: { chave: string; nome: string } } | null
}

const MOTIVOS = 2

/**
 * A "Leitura do mês": a manchete (o variável fora de ±5%, senão o total fora de ±2%, senão o normal), o apoio,
 * até 2 motivos (as maiores diferenças em reais na direção da manchete, entre os grupos do variável e o fixo)
 * e a sugestão do mês seguinte, só com o mês aberto e o normal do variável conhecido. A receita inverte o tom.
 */
export function leituraDoMes(c: ComposicaoDoMes, despesa: boolean, yearMonth: string, aberto: boolean): LeituraDoMes {
    const tom = tomDoInsight(c, despesa)
    const tomDe = (acima: boolean): ParteDaFrase["tom"] => (acima === despesa ? "warning" : "success")
    const forte = (texto: string): ParteDaFrase => ({ texto, forte: true })
    const normalVar = c.normais.variavel
    const sugestao: LeituraDoMes["sugestao"] =
        aberto && normalVar != null && c.caso !== "semMedia"
            ? { mes: nomeDoMes(shiftYearMonth(yearMonth, 1)), valor: Math.round((c.fixo.proximoMes + normalVar) * 100) / 100 }
            : null

    if (c.caso === "semMedia") {
        return {
            tom,
            manchete: [{ texto: "Ainda não dá para comparar este mês" }],
            apoio: [
                forte(reaisInteiros(c.fixo.total)),
                { texto: despesa ? " fixos e " : " de entradas fixas e " },
                forte(reaisInteiros(c.variavel.total)),
                { texto: despesa ? " do dia a dia neste mês." : " avulsas neste mês." },
            ],
            motivos: [],
            sugestao: null,
        }
    }

    // A manchete e a diferença em reais que o apoio diz.
    const vVar = variacao(c.variavel.total, normalVar)
    let manchete: ParteDaFrase[]
    let diferenca: number
    if (normalVar != null && vVar != null && foraDoNormal(vVar)) {
        const subiu = vVar > 0
        const verbo = despesa ? (subiu ? "subiu" : "caiu") : subiu ? "subiram" : "caíram"
        manchete = [
            { texto: `${despesa ? "O que você controla" : "As avulsas"} ${verbo} ` },
            { texto: porcento(vVar), tom: tomDe(subiu) },
            { texto: " este mês" },
        ]
        diferenca = c.variavel.total - normalVar
    } else if (c.caso !== "normal" && c.variacaoTotal != null && c.direcao != null) {
        manchete = [
            { texto: "O mês está " },
            { texto: porcento(c.variacaoTotal), tom: tomDe(c.direcao === "acima") },
            { texto: ` ${c.direcao} da média` },
        ]
        const total = c.fixo.total + c.variavel.total
        diferenca = total - total / (1 + c.variacaoTotal)
    } else {
        const apoio: ParteDaFrase[] =
            c.fixo.total > 0 ? [forte(reaisInteiros(c.fixo.total)), { texto: ` dele já eram ${despesa ? "parcelas" : "entradas fixas"}.` }] : []
        return { tom, manchete: [{ texto: "O mês está dentro do seu normal" }], apoio, motivos: [], sugestao }
    }

    // Os motivos: o que andou na direção da manchete, do maior para o menor em reais.
    const sinal = Math.sign(diferenca)
    const candidatos: MotivoDoMes[] = c.variavel.grupos.map((g) => ({
        chave: g.chave,
        nome: g.nome,
        ...(g.novo ? { detalhe: "novo" } : null),
        delta: Math.round((g.valor - (g.normal ?? 0)) * 100) / 100,
        parte: "variavel" as const,
    }))
    if (c.normais.fixo != null) {
        const novo = c.fixo.itens.find((i) => i.novoDesdeYm)
        candidatos.push({
            nome: novo?.nome ?? (despesa ? "Parcelas" : "Entradas fixas"),
            ...(novo?.novoDesdeYm ? { detalhe: novo.novoDesdeYm === yearMonth ? "novo" : `novo desde ${mesCurto(novo.novoDesdeYm)}` } : null),
            delta: Math.round((c.fixo.total - c.normais.fixo) * 100) / 100,
            parte: "fixo",
        })
    }
    const motivos = candidatos
        .filter((m) => m.delta * sinal > 0)
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        .slice(0, MOTIVOS)

    const apoio: ParteDaFrase[] = [
        { texto: "São " },
        forte(`${reaisInteiros(Math.abs(diferenca))} ${diferenca > 0 ? "acima" : "abaixo"}`),
        {
            texto:
                motivos.length === 0
                    ? " do seu normal."
                    : motivos.length === 1
                      ? " do seu normal, e veio de um lugar:"
                      : " do seu normal, e quase tudo veio de dois lugares:",
        },
    ]
    const principal = motivos[0]
    if (sugestao && principal?.parte === "variavel" && principal.chave) sugestao.grupo = { chave: principal.chave, nome: principal.nome }
    return { tom, manchete, apoio, motivos, sugestao }
}

/** O tom do cartão de insight: a direção do variável quando saiu do normal; senão a do total; senão neutro (receita inverte). */
export function tomDoInsight(c: ComposicaoDoMes, despesa: boolean): "warning" | "success" | "info" {
    const normalVar = c.normais.variavel
    const vVar = normalVar == null ? null : variacao(c.variavel.total, normalVar)
    const acima = vVar != null && foraDoNormal(vVar) ? vVar > 0 : c.direcao == null ? null : c.direcao === "acima"
    if (acima == null) return "info"
    return acima === despesa ? "warning" : "success"
}

const FIXOS_A_MOSTRAR = 3

/**
 * O fixo compacto: as 3 linhas de maior valor (os itens já vêm do maior para o menor) e o resto somado,
 * com os nomes e se todos começaram neste mês.
 */
export function fixoEmLinhas(itens: ItemFixo[], yearMonth: string) {
    const resto = itens.slice(FIXOS_A_MOSTRAR)
    return {
        linhas: itens.slice(0, FIXOS_A_MOSTRAR),
        resto: resto.length
            ? {
                  n: resto.length,
                  nomes: resto.map((i) => i.nome),
                  valor: Math.round(resto.reduce((a, i) => a + i.valor * 100, 0)) / 100,
                  soParcelas: resto.every((i) => i.tipo === "parcela"),
                  todosNovos: resto.every((i) => i.novoDesdeYm === yearMonth),
              }
            : null,
    }
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
