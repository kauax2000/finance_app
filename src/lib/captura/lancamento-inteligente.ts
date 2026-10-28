/**
 * O lançamento inteligente (a paleta que lê a frase e a foto): o que a revisão
 * mostra e o que o "Lançar" decide, sem React. A leitura ao vivo mora no hook
 * `useLeituraDoLancamento`.
 */
import { DEFAULT_INSTALLMENT_COUNT } from "@/components/transactions/transaction-form-types"
import type { CamposDaFrase } from "@/lib/captura/frase-no-form"
import { currencyBRL } from "@/lib/formatters"
import { splitTotalAcrossInstallments } from "@/lib/installment-amounts"
import type { PlanoProposto } from "@/lib/previsao/impacto-parcela"

/** As linhas do "Entendi", uma por campo que a pessoa pode editar. */
export type CampoDoLancamento = "tipo" | "valor" | "descricao" | "categoria" | "forma" | "data" | "parcelas"

export type TipoDoLancamento = "despesa" | "receita" | "parcelada" | "estorno"

/** A receita não é parcelada: as parcelas dela são dúvida, não plano. */
export function tipoDoLancamento(c: CamposDaFrase): TipoDoLancamento {
    if (c.tipo === "expense" && c.parcelas != null && c.parcelas >= 2) return "parcelada"
    if (c.estorno) return "estorno"
    return c.tipo === "income" ? "receita" : "despesa"
}

/** As parcelas da parcelada que a frase não disse: as do formulário. */
const PARCELAS_PADRAO = Number(DEFAULT_INSTALLMENT_COUNT)

/**
 * O que trocar o tipo na revisão muda: a parcelada precisa de parcelas (as
 * lidas, ou `parcelas` quando ela vem do campo de parcelas), as outras não;
 * a categoria do outro tipo não serve, e o estorno abate uma fatura (a forma
 * é o cartão).
 */
export function edicaoDoTipo(
    c: CamposDaFrase,
    novo: TipoDoLancamento,
    categorias: { id: string; type: "expense" | "income" }[],
    parcelas?: number
): Partial<CamposDaFrase> {
    const tipo = novo === "receita" || novo === "estorno" ? "income" : "expense"
    const parcial: Partial<CamposDaFrase> = {
        tipo,
        estorno: novo === "estorno",
        parcelas:
            novo === "parcelada"
                ? (parcelas ?? (c.parcelas != null && c.parcelas >= 2 ? c.parcelas : PARCELAS_PADRAO))
                : null,
    }
    const categoria = categorias.find((x) => x.id === c.categoryId)
    if (categoria && categoria.type !== tipo) parcial.categoryId = null
    if (novo === "estorno") parcial.paymentMethod = "credit_card"
    return parcial
}

/** A dúvida que cada campo editado resolve. */
const DUVIDA_DO_CAMPO: Partial<Record<keyof CamposDaFrase, string>> = {
    valor: "valor",
    data: "data",
    descricao: "descricao",
    parcelas: "parcelas",
    creditCardId: "cartao",
}

/**
 * Os campos da frase com os que a pessoa editou à mão por cima: reescrever a
 * frase não desfaz um campo editado, e o que ela conferiu deixa de ser dúvida.
 */
export function comTravas(c: CamposDaFrase, editados: Partial<CamposDaFrase>): CamposDaFrase {
    const resolvidas = new Set(
        Object.keys(editados).flatMap((k) => DUVIDA_DO_CAMPO[k as keyof CamposDaFrase] ?? [])
    )
    return { ...c, ...editados, duvidas: c.duvidas.filter((d) => !resolvidas.has(d)) }
}

/**
 * O convidado não lança receita (a RLS recusa, e o formulário esconde a
 * Receita): o que a frase leu como receita ou estorno vira despesa, e a
 * categoria de receita sai.
 */
export function soDespesa(c: CamposDaFrase, categorias: { id: string; type: "expense" | "income" }[]): CamposDaFrase {
    if (c.tipo === "expense" && !c.estorno) return c
    const categoria = categorias.find((x) => x.id === c.categoryId)
    return {
        ...c,
        tipo: "expense",
        estorno: false,
        motivoDoTipo: null,
        categoryId: categoria?.type === "expense" ? c.categoryId : null,
    }
}

/** Sem valor ou sem descrição de verdade, o parser não leu a frase: a IA tenta. */
export function precisaDeIA(c: CamposDaFrase): boolean {
    return c.duvidas.includes("valor") || c.duvidas.includes("descricao")
}

/**
 * O campo obrigatório que falta, ou `null`. O cartão só se pede quando há um
 * ativo: sem nenhum, o crédito (ou o estorno) não pode travar o "Lançar".
 */
export function faltaParaLancar(c: CamposDaFrase, cartoesAtivos: number): CampoDoLancamento | null {
    if (c.valor == null) return "valor"
    if (c.paymentMethod === "credit_card" && cartoesAtivos > 0 && !c.creditCardId) return "forma"
    // O estorno abate a fatura de um cartão: sem ele, sairia uma receita comum.
    if (c.estorno && cartoesAtivos > 0 && !c.creditCardId) return "forma"
    return null
}

/** "Lançar despesa · R$ 42,00"; a parcelada diz a parcela, dividida como o salvar divide. */
export function rotuloDaAcao(c: CamposDaFrase): string {
    const tipo = tipoDoLancamento(c)
    const verbo = `Lançar ${tipo}`
    if (c.valor == null) return verbo
    if (tipo === "parcelada") {
        const { installmentAmount } = splitTotalAcrossInstallments(c.valor, c.parcelas!)
        return `${verbo} · ${c.parcelas}× de ${currencyBRL(installmentAmount)}`
    }
    return `${verbo} · ${currencyBRL(c.valor)}`
}

/** O valor da frase é o total (`installmentValueMode: "total"`): dividido como o salvar divide. */
export function planoDaFrase(c: CamposDaFrase | null): PlanoProposto | null {
    if (!c || c.tipo !== "expense" || c.parcelas == null || c.parcelas < 2 || c.valor == null) return null
    const cardId = c.paymentMethod === "credit_card" ? c.creditCardId : null
    if (c.paymentMethod === "credit_card" && !cardId) return null
    const split = splitTotalAcrossInstallments(c.valor, c.parcelas)
    if (split.installmentAmount <= 0) return null
    return {
        valorParcela: split.installmentAmount,
        parcelas: c.parcelas,
        ultimaParcela: split.finalInstallmentAmount,
        primeiraYmd: c.data,
        cardId,
        descricao: c.descricao,
    }
}
