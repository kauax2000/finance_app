/**
 * O caixa do mês do calendário (spec §10): o que entra, o que sai fora do crédito e as faturas que
 * **vencem** no mês. É a única fonte do "seguro para gastar" e da linha do tempo; toda tela lê daqui.
 * A soma é feita em centavos e devolvida em reais. O dia vem de `dados.hojeYmd`.
 */
import { computeNextBillInstanceDueYmd } from "@/lib/bills/recurrence"
import {
    buildGlobalInstallmentDedupeKeys,
    expandRemainingInstallmentCharges,
    isProjectedChargeAlreadyPosted,
} from "@/lib/credit-card-installment-projection"
import { estimatedDueDateForClose, firstCloseOnOrAfter } from "@/lib/credit-card-billing"
import { statementTotalKey } from "@/lib/fatura/total-com-banco"
import { compareYmd, localYmdFromDate, transactionLocalYmd } from "@/lib/transaction-date"
import { centavos, cobrancasLancadas, cobrancasPorLancar, faturaPrevista } from "./fatura-prevista"
import type { DadosDaPrevisao, FaturaDoMes, FluxoDoMes, MesDaLinha, Projecao, Seguro } from "./tipos"

function somarMeses(ym: string, n: number): string {
    const [y, m] = ym.split("-").map(Number)
    const t = y * 12 + (m - 1) + n
    return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`
}

function limitesDoMes(ym: string): { inicio: string; fim: string; dias: number } {
    const [y, m] = ym.split("-").map(Number)
    const dias = new Date(y, m, 0).getDate()
    return { inicio: `${ym}-01`, fim: `${ym}-${String(dias).padStart(2, "0")}`, dias }
}

export function fluxoDoMes(dados: DadosDaPrevisao, ym: string): FluxoDoMes {
    const { inicio, fim } = limitesDoMes(ym)
    const hoje = dados.hojeYmd
    const mesDeHoje = hoje.slice(0, 7)
    const noMes = (ymd: string) => compareYmd(ymd, inicio) >= 0 && compareYmd(ymd, fim) <= 0
    let recebidas = 0
    let receitasPrevistas = 0
    let pagas = 0
    let despesasPrevistas = 0

    // Lançamentos fora do cartão (o estorno no cartão abate a fatura, não é receita).
    for (const t of dados.transacoes) {
        if (t.payment_method === "credit_card") continue
        const ymd = transactionLocalYmd(t.date)
        if (!ymd || !noMes(ymd)) continue
        const passou = compareYmd(ymd, hoje) <= 0
        const v = centavos(t.amount)
        if (t.type === "income") {
            if (passou) recebidas += v
            else receitasPrevistas += v
        } else if (passou) pagas += v
        else despesasPrevistas += v
    }

    // Assinaturas e parcelas fora do cartão ainda não lançadas, num mês que não acabou. Elas partem
    // da próxima cobrança (o cron já lançou o que vem antes), mesmo que ela seja de ontem e o cron
    // esteja atrasado: o dinheiro ainda vai sair.
    if (compareYmd(hoje, fim) <= 0) {
        const lancadas = cobrancasLancadas(dados.transacoes)
        for (const sub of dados.assinaturas) {
            if (sub.payment_method === "credit_card") continue
            for (const v of cobrancasPorLancar(sub, inicio, fim, lancadas)) {
                if (sub.kind === "income") receitasPrevistas += centavos(v)
                else despesasPrevistas += centavos(v)
            }
        }
        const parcelasLancadas = buildGlobalInstallmentDedupeKeys(dados.transacoes)
        for (const p of dados.planos) {
            if (p.payment_method === "credit_card") continue
            for (const c of expandRemainingInstallmentCharges(p)) {
                const ymd = localYmdFromDate(c.chargeDate)
                if (!noMes(ymd)) continue
                if (isProjectedChargeAlreadyPosted(c, parcelasLancadas)) continue
                despesasPrevistas += centavos(c.amount)
            }
        }
    }

    // Contas a pagar (Decisão 3): a pendente sai no mês do vencimento, ou no de hoje se já venceu;
    // as ocorrências seguintes da mesma conta são projetadas pela recorrência dela, a partir da
    // pendente mais recente (duas pendentes da mesma conta não duplicam a projeção).
    const contasSemValor: string[] = []
    const semValor = new Set<string>()
    const somarConta = (valor: number | null | undefined, billId: string, nome: string) => {
        if (valor == null) {
            if (!semValor.has(billId)) contasSemValor.push(nome)
            semValor.add(billId)
            return
        }
        despesasPrevistas += centavos(valor)
    }
    const pendentes = dados.contasPendentes.filter((i) => i.status === "pending")
    const ultimaPendente = new Map<string, string>()
    for (const inst of pendentes) {
        const due = inst.due_date.slice(0, 10)
        const atual = ultimaPendente.get(inst.bill_id)
        if (!atual || compareYmd(due, atual) > 0) ultimaPendente.set(inst.bill_id, due)
    }
    for (const inst of pendentes) {
        const conta = dados.contas.find((b) => b.id === inst.bill_id) ?? inst.bill ?? null
        const nome = conta?.name ?? "Conta"
        const due = inst.due_date.slice(0, 10)
        const saiEm = compareYmd(due.slice(0, 7), mesDeHoje) < 0 ? mesDeHoje : due.slice(0, 7)
        if (saiEm === ym) somarConta(inst.amount ?? conta?.amount_estimated, inst.bill_id, nome)
        if (!conta || ultimaPendente.get(inst.bill_id) !== due) continue
        for (
            let prox = computeNextBillInstanceDueYmd(conta, due);
            prox && compareYmd(prox, fim) <= 0;
            prox = computeNextBillInstanceDueYmd(conta, prox)
        ) {
            if (compareYmd(prox, inicio) >= 0) somarConta(conta.amount_estimated, inst.bill_id, nome)
        }
    }

    // Faturas que vencem no mês: o vencimento cai no mês seguinte ao fechamento.
    const faturas: FaturaDoMes[] = []
    for (const card of dados.cartoes) {
        if (!card.is_active) continue
        for (const closeYm of [somarMeses(ym, -1), ym]) {
            const f = faturaPrevista(card, closeYm, dados)
            if (!noMes(f.dueYmd)) continue
            faturas.push({
                cardId: card.id,
                nome: card.name,
                closeYmd: f.closeYmd,
                dueYmd: f.dueYmd,
                total: f.total,
                paga: dados.faturasPagas.has(statementTotalKey(card.id, f.closeYmd)),
                usaTotalDoBanco: f.usaTotalDoBanco,
            })
        }
    }

    const entra = recebidas + receitasPrevistas
    const sai = pagas + despesasPrevistas + faturas.reduce((s, f) => s + centavos(f.total), 0)
    return {
        ym,
        receitas: { recebidas: recebidas / 100, previstas: receitasPrevistas / 100 },
        despesas: { pagas: pagas / 100, previstas: despesasPrevistas / 100 },
        faturas,
        contasSemValor,
        entra: entra / 100,
        sai: sai / 100,
        sobra: (entra - sai) / 100,
    }
}

export function seguroParaGastar(dados: DadosDaPrevisao, ym: string = dados.hojeYmd.slice(0, 7)): Seguro {
    const fluxo = fluxoDoMes(dados, ym)
    const reserva = dados.reserva ?? 0
    const seguro = centavos(fluxo.sobra) - centavos(reserva)
    const { fim, dias } = limitesDoMes(ym)
    const mesDeHoje = dados.hojeYmd.slice(0, 7)
    const diasRestantes =
        ym === mesDeHoje ? dias - Number(dados.hojeYmd.slice(8, 10)) + 1 : compareYmd(ym, mesDeHoje) > 0 ? dias : 0

    // A fatura aberta de cada cartão (a da compra de hoje) que vence depois deste mês.
    let comprometido = 0
    for (const card of dados.cartoes) {
        if (!card.is_active) continue
        for (const closeYm of [mesDeHoje, somarMeses(mesDeHoje, 1)]) {
            const f = faturaPrevista(card, closeYm, dados)
            if (f.status === "open" && compareYmd(f.dueYmd, fim) > 0) comprometido += centavos(f.total)
        }
    }

    return {
        ...fluxo,
        reserva,
        seguro: seguro / 100,
        diasRestantes,
        porDia: seguro > 0 && diasRestantes > 0 ? Math.round(seguro / diasRestantes) / 100 : 0,
        comprometidoNaProximaFatura: comprometido / 100,
    }
}

export function projecaoMensal(dados: DadosDaPrevisao, meses = 6): Projecao {
    // O fim de um parcelamento é o mês em que sai o dinheiro da última parcela: a data da cobrança
    // fora do cartão; no cartão, o vencimento da fatura que a contém (a linha do tempo é caixa).
    const fins = new Map<string, MesDaLinha["fimDeParcelamentos"]>()
    for (const p of dados.planos) {
        const ultima = expandRemainingInstallmentCharges(p).at(-1)
        if (!ultima) continue
        const card =
            p.payment_method === "credit_card"
                ? dados.cartoes.find((c) => c.id === p.payment_credit_card_id)
                : undefined
        const saida = card
            ? estimatedDueDateForClose(firstCloseOnOrAfter(ultima.chargeDate, card.closing_day), card.due_day)
            : ultima.chargeDate
        const ym = localYmdFromDate(saida).slice(0, 7)
        fins.set(ym, [...(fins.get(ym) ?? []), { planoId: p.id, descricao: p.description?.trim() || "Parcelada" }])
    }
    const inicio = dados.hojeYmd.slice(0, 7)
    const linha: MesDaLinha[] = Array.from({ length: meses }, (_, i) => {
        const ym = somarMeses(inicio, i)
        return { ...fluxoDoMes(dados, ym), fimDeParcelamentos: fins.get(ym) ?? [] }
    })
    return { meses: linha, primeiroMesNegativo: linha.find((m) => m.sobra < 0)?.ym ?? null }
}
