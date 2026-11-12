/**
 * O que uma compra parcelada faz aos próximos meses, **antes de salvar** (spec §10, P12). Nenhuma
 * conta própria: o "depois" é a mesma `projecaoMensal` e a mesma `faturaPrevista` rodando com um
 * plano sintético igual ao que `create_workspace_installment_plan` gravaria.
 */
import { shiftYearMonth } from "@/lib/budget-month"
import { buildCardMonthlyInvoiceSnapshot, firstCloseOnOrAfter } from "@/lib/credit-card-billing"
import {
    buildPostedInstallmentDedupeKeys,
    expandAllPlanCharges,
    expandRemainingInstallmentCharges,
    isProjectedChargeAlreadyPosted,
} from "@/lib/credit-card-installment-projection"
import { bancoTotalDoCiclo, statementTotalKey, totalComBanco } from "@/lib/fatura/total-com-banco"
import { currencyBRL } from "@/lib/formatters"
import type { CreditCard, WorkspaceInstallmentPlan } from "@/lib/supabase"
import { formatDatePtBr, formatMonthLongPtBr, localYmdFromDate, parseYmdLocal } from "@/lib/transaction-date"
import { centavos, faturaPrevista, hojeDate } from "./fatura-prevista"
import { projecaoMensal } from "./fluxo"
import type { DadosDaPrevisao } from "./tipos"

export type PlanoProposto = {
    valorParcela: number
    parcelas: number
    /** A parcela que leva a sobra dos centavos; sem ela, igual às outras. */
    ultimaParcela?: number
    primeiraYmd: string
    cardId: string | null
    descricao: string
}

export type Impacto = {
    /** O valor da parcela, o `YYYY-MM` da última cobrança e quantas são. */
    parcela: { valor: number; fim: string | null; meses: number }
    /** A maior soma mensal de parcelas (pelo mês da cobrança) daqui em diante; `mes` é `YYYY-MM`. */
    pico: { semEsta: number; comEsta: number; mes: string }
    /** 3, a partir da fatura que recebe a 1ª parcela (ou da aberta, se aquela já fechou). Só com cartão. */
    proximasFaturas: Array<{ closeYmd: string; antes: number; depois: number }> | null
    /** O pico com esta ÷ a receita recorrente mensal, em %; `null` sem receita. */
    percentualDaRenda: number | null
    /** `YYYY-MM` do 1º mês da linha do tempo com sobra negativa. */
    primeiroMesNegativo: { antes: string | null; depois: string | null }
    limite: { disponivel: number | null; cabe: boolean | null; motivo: "sem_cartao" | "sem_limite" | null }
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

/** "2027-06" → "jun/2027". */
export function mesCurto(ym: string): string {
    const [y, m] = ym.split("-").map(Number)
    return MESES[m - 1] ? `${MESES[m - 1]}/${y}` : ym
}

/** O aviso que o quadro mostra sempre à vista; o destrutivo vence, e o negativo que já existia no mesmo mês não conta. */
export function avisoDoImpacto(i: Impacto): { tom: "destructive" | "warning"; titulo: string; descricao: string | null } | null {
    if (i.limite.cabe === false) {
        return {
            tom: "destructive",
            titulo: "Não cabe no limite do cartão",
            descricao: i.limite.disponivel != null ? `Disponível: ${currencyBRL(i.limite.disponivel)}` : null,
        }
    }
    // Sem receita recorrente, todo mês futuro fica negativo com qualquer compra: o aviso seria ruído.
    if (i.percentualDaRenda == null) return null
    const { antes, depois } = i.primeiroMesNegativo
    if (depois && depois !== antes) {
        return { tom: "warning", titulo: `O seguro para gastar fica negativo em ${mesCurto(depois)}`, descricao: null }
    }
    return null
}

/** A sobrancelha do quadro: "Parcelas em novembro", o mês mais pesado. */
export function tituloDoImpacto(i: Impacto): string {
    const [y, m] = i.pico.mes.split("-").map(Number)
    return `Parcelas em ${formatMonthLongPtBr(new Date(y, m - 1, 1))}`
}

export type FraseDoImpacto = {
    chave: string
    icone: "repetir" | "cartao" | "seguro" | "limite"
    tom: "neutral" | "success" | "warning"
    titulo: string
    descricao: string | null
}

/** As frases do quadro, na ordem, só as que têm dado: até quando, as faturas, o seguro e o limite. */
export function frasesDoImpacto(i: Impacto): FraseDoImpacto[] {
    const frases: FraseDoImpacto[] = []
    const { parcela } = i
    if (parcela.fim) {
        frases.push({
            chave: "parcela",
            icone: "repetir",
            tom: "neutral",
            titulo: `${currencyBRL(parcela.valor)} a menos por mês até ${mesCurto(parcela.fim)}`,
            descricao: `${parcela.meses} ${parcela.meses === 1 ? "mês" : "meses"}`,
        })
    }
    for (const f of i.proximasFaturas ?? []) {
        frases.push({
            chave: `fatura:${f.closeYmd}`,
            icone: "cartao",
            tom: "neutral",
            titulo: `Fatura de ${formatDatePtBr(f.closeYmd)} vai a ${currencyBRL(f.depois)}`,
            descricao: `${currencyBRL(f.antes)} sem esta compra`,
        })
    }
    const { antes, depois } = i.primeiroMesNegativo
    // O negativo que já existia sem esta compra não é dela: só vale se ela o antecipa.
    if (antes) {
        if (depois && depois < antes) {
            frases.push({
                chave: "seguro",
                icone: "seguro",
                tom: "warning",
                titulo: `O seguro para gastar fica negativo em ${mesCurto(depois)}`,
                descricao: `sem esta compra, só em ${mesCurto(antes)}`,
            })
        }
    } else if (depois) {
        frases.push({
            chave: "seguro",
            icone: "seguro",
            tom: "warning",
            titulo: `O seguro para gastar fica negativo em ${mesCurto(depois)}`,
            descricao: null,
        })
    } else {
        frases.push({
            chave: "seguro",
            icone: "seguro",
            tom: "success",
            titulo: "O seguro para gastar continua positivo",
            descricao: "nenhum mês fica negativo",
        })
    }
    if (i.limite.disponivel != null) {
        frases.push({
            chave: "limite",
            icone: "limite",
            tom: "neutral",
            titulo: `Limite disponível: ${currencyBRL(i.limite.disponivel)}`,
            descricao: null,
        })
    }
    return frases
}

const ID_PROPOSTO = "__proposto__"

/** O plano como o banco o gravaria: nada lançado, a âncora no dia da 1ª parcela (o trigger). */
function planoSintetico(p: PlanoProposto): WorkspaceInstallmentPlan {
    return {
        id: ID_PROPOSTO,
        workspace_id: "",
        user_id: "",
        category_id: null,
        description: p.descricao.trim() || null,
        // Fora do cartão a previsão só pergunta se é cartão: a forma exata não muda a conta.
        payment_method: p.cardId ? "credit_card" : "pix",
        payment_credit_card_id: p.cardId,
        total_installments: p.parcelas,
        generated_count: 0,
        installment_amount: p.valorParcela,
        final_installment_amount: p.ultimaParcela ?? p.valorParcela,
        next_billing_date: p.primeiraYmd,
        billing_anchor_day: Number(p.primeiraYmd.slice(8, 10)),
        is_active: true,
        created_at: "",
        updated_at: "",
    }
}

const ymDoFechamento = (ymd: string, card: CreditCard) =>
    localYmdFromDate(firstCloseOnOrAfter(parseYmdLocal(ymd)!, card.closing_day)).slice(0, 7)

/** Por mês de cobrança, de hoje em diante: a soma das parcelas dos planos ativos. */
function picoDasParcelas(planos: WorkspaceInstallmentPlan[], mesDeHoje: string): { valor: number; mes: string } {
    const porMes = new Map<string, number>()
    for (const p of planos) {
        for (const c of expandAllPlanCharges(p)) {
            const ym = localYmdFromDate(c.chargeDate).slice(0, 7)
            if (ym < mesDeHoje) continue
            porMes.set(ym, (porMes.get(ym) ?? 0) + centavos(c.amount))
        }
    }
    let pico = { valor: 0, mes: mesDeHoje }
    for (const [mes, v] of [...porMes].sort(([a], [b]) => a.localeCompare(b))) {
        if (v > pico.valor) pico = { valor: v, mes }
    }
    return { valor: pico.valor / 100, mes: pico.mes }
}

/** A receita recorrente por mês, em centavos. */
function rendaMensal(dados: DadosDaPrevisao): number {
    const porMes = { weekly: 52 / 12, monthly: 1, bimonthly: 1 / 2, yearly: 1 / 12 }
    return dados.assinaturas
        .filter((s) => s.kind === "income" && s.is_active)
        .reduce((s, a) => s + centavos(a.amount) * porMes[a.billing_interval], 0)
}

/** Quantas fechadas não pagas o limite procura para trás (uma em dia; mais é fatura atrasada). */
const FECHADAS_NAO_PAGAS = 3

/**
 * O limite como o banco calcula: menos (A) as fechadas não pagas, pelo total do banco quando houver;
 * (B) o lançado na aberta (compras menos estornos); (C) toda parcela ainda não lançada dos planos do
 * cartão, até o fim de cada um, porque a compra parcelada ocupa o limite inteira. Assinatura
 * projetada não ocupa limite. A procura das fechadas para na primeira paga ou em
 * `FECHADAS_NAO_PAGAS` ciclos.
 */
function limiteDisponivel(card: CreditCard, dados: DadosDaPrevisao): number {
    const hoje = hojeDate(dados.hojeYmd)
    const lancado = (ym: string) => buildCardMonthlyInvoiceSnapshot(card, dados.transacoes, ym, hoje)
    const aberto = ymDoFechamento(dados.hojeYmd, card)
    let usado = centavos(lancado(aberto).postedTotal)
    for (let i = 1; i <= FECHADAS_NAO_PAGAS; i++) {
        const snap = lancado(shiftYearMonth(aberto, -i))
        const closeYmd = localYmdFromDate(snap.close)
        if (dados.faturasPagas.has(statementTotalKey(card.id, closeYmd))) break
        const banco = bancoTotalDoCiclo(dados.totaisDoBanco, card.id, closeYmd)
        usado += centavos(totalComBanco(snap.postedTotal, banco).total)
    }
    const lancadas = buildPostedInstallmentDedupeKeys(card.id, dados.transacoes)
    for (const p of dados.planos) {
        if (p.payment_method !== "credit_card" || p.payment_credit_card_id !== card.id) continue
        for (const c of expandRemainingInstallmentCharges(p)) {
            if (!isProjectedChargeAlreadyPosted(c, lancadas)) usado += centavos(c.amount)
        }
    }
    return (centavos(card.credit_limit ?? 0) - usado) / 100
}

export function impactoDaParcela(plano: PlanoProposto, dados: DadosDaPrevisao): Impacto {
    const sintetico = planoSintetico(plano)
    const depois: DadosDaPrevisao = { ...dados, planos: [...dados.planos, sintetico] }
    const mesDeHoje = dados.hojeYmd.slice(0, 7)
    const card = plano.cardId ? dados.cartoes.find((c) => c.id === plano.cardId) : undefined

    const ultima = expandAllPlanCharges(sintetico).at(-1)
    const fim = ultima ? localYmdFromDate(ultima.chargeDate).slice(0, 7) : null

    const sem = picoDasParcelas(dados.planos, mesDeHoje)
    const com = picoDasParcelas(depois.planos, mesDeHoje)

    let proximasFaturas: Impacto["proximasFaturas"] = null
    if (card) {
        const daPrimeira = ymDoFechamento(plano.primeiraYmd, card)
        const aberto = ymDoFechamento(dados.hojeYmd, card)
        const inicio = daPrimeira > aberto ? daPrimeira : aberto
        proximasFaturas = [0, 1, 2].map((i) => {
            const ym = shiftYearMonth(inicio, i)
            const antes = faturaPrevista(card, ym, dados)
            return { closeYmd: antes.closeYmd, antes: antes.total, depois: faturaPrevista(card, ym, depois).total }
        })
    }

    const renda = rendaMensal(dados)
    const total = (centavos(plano.valorParcela) * (plano.parcelas - 1) + centavos(plano.ultimaParcela ?? plano.valorParcela)) / 100
    const disponivel = card?.credit_limit != null ? limiteDisponivel(card, dados) : null

    return {
        parcela: { valor: plano.valorParcela, fim, meses: plano.parcelas },
        pico: { semEsta: sem.valor, comEsta: com.valor, mes: com.mes },
        proximasFaturas,
        percentualDaRenda: renda > 0 ? Math.round((centavos(com.valor) / renda) * 1000) / 10 : null,
        primeiroMesNegativo: {
            antes: projecaoMensal(dados).primeiroMesNegativo,
            depois: projecaoMensal(depois).primeiroMesNegativo,
        },
        limite: {
            disponivel,
            cabe: disponivel != null ? disponivel >= total : null,
            motivo: !card ? "sem_cartao" : disponivel == null ? "sem_limite" : null,
        },
    }
}

/**
 * O detalhe de um parcelado salvo: o "antes" é a carteira sem o plano e sem as parcelas que ele já
 * lançou, e o plano volta como proposto desde a 1ª parcela, o que reconstrói o "depois" de hoje.
 */
export function impactoDoPlano(plano: WorkspaceInstallmentPlan, dados: DadosDaPrevisao): Impacto {
    const todas = expandAllPlanCharges({ ...plano, is_active: true })
    const semEle: DadosDaPrevisao = {
        ...dados,
        planos: dados.planos.filter((p) => p.id !== plano.id),
        transacoes: dados.transacoes.filter((t) => t.installment_plan_id !== plano.id),
    }
    return impactoDaParcela(
        {
            valorParcela: Number(plano.installment_amount),
            parcelas: plano.total_installments,
            ultimaParcela: Number(plano.final_installment_amount),
            primeiraYmd: todas[0] ? localYmdFromDate(todas[0].chargeDate) : plano.next_billing_date.slice(0, 10),
            cardId: plano.payment_method === "credit_card" ? plano.payment_credit_card_id : null,
            descricao: plano.description ?? "",
        },
        semEle,
    )
}
