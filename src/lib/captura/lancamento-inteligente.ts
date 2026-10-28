/**
 * O lançamento inteligente (a paleta que lê a frase e a foto): o que a revisão
 * mostra e o que o "Lançar" decide, sem React. A leitura ao vivo mora no hook
 * `useLeituraDoLancamento`.
 */
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

/** Sem valor ou sem descrição de verdade, o parser não leu a frase: a IA tenta. */
export function precisaDeIA(c: CamposDaFrase): boolean {
    return c.duvidas.includes("valor") || c.duvidas.includes("descricao")
}

/**
 * O campo obrigatório que falta, ou `null`. O cartão só se pede quando há um
 * ativo: sem nenhum, o crédito não pode travar o "Lançar".
 */
export function faltaParaLancar(c: CamposDaFrase, cartoesAtivos: number): CampoDoLancamento | null {
    if (c.valor == null) return "valor"
    if (c.paymentMethod === "credit_card" && cartoesAtivos > 0 && !c.creditCardId) return "forma"
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
