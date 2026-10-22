/**
 * A frase rápida no formulário de lançamento (Bloco 3A, Decisão 14): o parser
 * da captura preenche os campos, e quem salva é a pessoa. As regras são as da
 * Edge `capture` (`_shared/captura.ts`), sem a parte de carteira: no app o
 * cartão e o histórico já são da carteira aberta.
 */
import {
    casarCartao,
    interpretarFrase,
    preencherPeloHistorico,
    type CartaoParaCasar,
    type FormaDePagamento,
    type LinhaHistorico,
} from "@/lib/captura/frase"
import type { PaymentMethod } from "@/lib/payment-methods"
import { supabase } from "@/lib/supabase"

export type CamposDaFrase = {
    tipo: "expense" | "income"
    /** Receita que abate a fatura de `creditCardId`. */
    estorno: boolean
    valor: number | null
    /** `YYYY-MM-DD`. */
    data: string
    descricao: string
    paymentMethod: PaymentMethod | null
    creditCardId: string | null
    categoryId: string | null
    parcelas: number | null
    /** "valor", "data", "cartao", "parcelas", "descricao". */
    duvidas: string[]
}

/** A forma do parser no vocabulário de `transactions.payment_method`. */
const FORMA_NO_BANCO: Record<FormaDePagamento, PaymentMethod> = {
    pix: "pix",
    debit: "debit_card",
    credit_card: "credit_card",
    cash: "cash",
}

const NOME_DA_DUVIDA: Record<string, string> = {
    valor: "valor",
    data: "data",
    cartao: "cartão",
    parcelas: "parcelas",
    descricao: "descrição",
    categoria: "categoria",
}

/** "Confira: cartão, categoria", ou `null` quando não há o que conferir. */
export function textoDasDuvidas(c: Pick<CamposDaFrase, "duvidas" | "categoryId">): string | null {
    const lista = [...c.duvidas, ...(c.categoryId ? [] : ["categoria"])]
    return lista.length ? `Confira: ${lista.map((d) => NOME_DA_DUVIDA[d] ?? d).join(", ")}` : null
}

/** `historico` em ordem de `date` desc, `created_at` desc (a mais recente vence o empate). */
export function camposDaFrase(
    texto: string,
    hoje: string,
    cartoes: CartaoParaCasar[],
    historico: LinhaHistorico[],
): CamposDaFrase {
    const f = interpretarFrase(texto, hoje)
    let { descricao } = f
    // A dúvida "cartao" só vale no crédito ("30 uber casa" não é cartão).
    const duvidas = f.duvidas.filter((d) => d !== "cartao" || f.forma === "credit_card")
    const duvida = (d: string) => {
        if (!duvidas.includes(d)) duvidas.push(d)
    }

    const cartao = casarCartao(f.cartaoTexto, cartoes)
    if (f.cartaoTexto && !cartao) {
        // A palavra volta ao fim da descrição.
        descricao = duvidas.includes("descricao")
            ? f.cartaoTexto.charAt(0).toUpperCase() + f.cartaoTexto.slice(1)
            : `${descricao} ${f.cartaoTexto}`
        if (f.forma === "credit_card") duvida("cartao")
    }
    if (f.estorno && !cartao) duvida("cartao")
    if (f.valor == null) duvida("valor")
    // A receita não é parcelada: o número fica para a pessoa conferir.
    if (f.tipo === "income" && f.parcelas != null && f.parcelas > 1) duvida("parcelas")

    // Sem descrição de verdade, o histórico não tem o que casar.
    const doHistorico = duvidas.includes("descricao")
        ? null
        : preencherPeloHistorico(descricao, f.tipo, historico)

    let paymentMethod: PaymentMethod | null = null
    let creditCardId: string | null = null
    if (f.tipo === "income") {
        creditCardId = f.estorno ? (cartao?.id ?? null) : null
    } else if (cartao) {
        paymentMethod = "credit_card"
        creditCardId = cartao.id
    } else if (f.forma) {
        paymentMethod = FORMA_NO_BANCO[f.forma]
    } else if (doHistorico?.paymentMethod) {
        paymentMethod = doHistorico.paymentMethod as PaymentMethod
        // O cartão do histórico só se ainda ativo.
        if (paymentMethod === "credit_card") {
            creditCardId =
                cartoes.find((c) => c.id === doHistorico.creditCardId && c.is_active)?.id ?? null
        }
    }

    return {
        tipo: f.tipo,
        estorno: f.estorno,
        valor: f.valor,
        data: f.data,
        descricao,
        paymentMethod,
        creditCardId,
        categoryId: doHistorico?.categoryId ?? null,
        parcelas: f.parcelas,
        duvidas,
    }
}

/** As últimas 300 linhas da carteira, as colunas que o histórico lê. */
export async function carregarHistoricoDaFrase(workspaceId: string): Promise<LinhaHistorico[]> {
    const { data, error } = await supabase
        .from("transactions")
        .select("description, category_id, payment_method, payment_credit_card_id, date, type")
        .eq("workspace_id", workspaceId)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(300)
    if (error) throw error
    return (data ?? []) as LinhaHistorico[]
}
