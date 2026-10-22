/**
 * A frase rápida no formulário de lançamento (Bloco 3A, Decisão 14): o parser
 * da captura preenche os campos, e quem salva é a pessoa. As regras são as da
 * Edge `capture` (`_shared/captura.ts`), sem a parte de carteira: no app o
 * cartão e o histórico já são da carteira aberta.
 */
import { onlineManager, type QueryClient } from "@tanstack/react-query"
import {
    casarCartao,
    interpretarFrase,
    preencherPeloHistorico,
    type CartaoParaCasar,
    type FormaDePagamento,
    type FraseInterpretada,
    type LinhaHistorico,
} from "@/lib/captura/frase"
import type { CamposIA } from "@/lib/ia/ler"
import { fraseHistoricoKeys } from "@/lib/queries/keys"
import type { PaymentMethod } from "@/lib/payment-methods"
import { supabase, type TransactionSource } from "@/lib/supabase"
import { formatMoneyBrlInput } from "@/lib/money-brl"
import { DEFAULT_INSTALLMENT_COUNT } from "@/components/transactions/transaction-form-types"
import type { TransactionFormKind } from "@/components/transactions/transaction-type-segment"

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
    /** "valor", "data", "cartao", "parcelas", "descricao"; "ia" quando a IA leu. */
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
    // A dúvida "ia" é a marca de conferir, e o aviso da IA já a diz.
    const lista = [...c.duvidas.filter((d) => d !== "ia"), ...(c.categoryId ? [] : ["categoria"])]
    return lista.length ? `Confira: ${lista.map((d) => NOME_DA_DUVIDA[d] ?? d).join(", ")}` : null
}

/** "Lido pela IA. Confira e salve.", com as dúvidas no lugar do "Confira e salve." quando houver. */
export function avisoDaIA(c: Pick<CamposDaFrase, "duvidas" | "categoryId">): string {
    return `Lido pela IA. ${textoDasDuvidas(c) ?? "Confira e salve."}`
}

/** `historico` em ordem de `date` desc, `created_at` desc (a mais recente vence o empate). */
export function camposDaFrase(
    texto: string,
    hoje: string,
    cartoes: CartaoParaCasar[],
    historico: LinhaHistorico[],
): CamposDaFrase {
    return camposDaInterpretacao(interpretarFrase(texto, hoje), cartoes, historico)
}

/**
 * Os campos lidos pela IA (frase ou foto) pelas mesmas regras da frase, como a
 * Edge `capture` faz com a IA e um texto vazio: tipo nulo é despesa, data nula
 * é hoje, e pix, débito ou dinheiro não têm cartão. Sempre fica a conferir.
 */
export function camposDaIA(
    c: CamposIA,
    hoje: string,
    cartoes: CartaoParaCasar[],
    historico: LinhaHistorico[],
): CamposDaFrase {
    const vazia = interpretarFrase("", hoje)
    const forma = c.forma
    const campos = camposDaInterpretacao(
        {
            ...vazia,
            valor: c.valor,
            data: c.data ?? vazia.data,
            tipo: c.tipo ?? vazia.tipo,
            descricao: c.descricao || vazia.descricao,
            duvidas: c.descricao ? [] : ["descricao"],
            forma,
            cartaoTexto: forma == null || forma === "credit_card" ? c.cartao : null,
            parcelas: c.parcelas,
        },
        cartoes,
        historico,
    )
    return { ...campos, duvidas: [...campos.duvidas, "ia"] }
}

function camposDaInterpretacao(
    f: FraseInterpretada,
    cartoes: CartaoParaCasar[],
    historico: LinhaHistorico[],
): CamposDaFrase {
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

/**
 * Os campos do formulário que a frase escreve, todos a cada aplicar: nada de
 * uma frase anterior sobra. O valor vai ao simples e ao total da Parcelada,
 * para a troca de modo não o perder.
 */
export function rascunhoDaFrase(c: CamposDaFrase): {
    formKind: TransactionFormKind
    type: "expense" | "income"
    amount: string
    installmentValueMode: "total"
    installmentTotal: string
    installmentCount: string
    description: string
    date: string
    categoryId: string
    paymentMethod: PaymentMethod | null
    paymentCreditCardId: string
    estornoCartaoId: string | null
} {
    const parcelada = c.tipo === "expense" && c.parcelas != null && c.parcelas > 1
    const valor = c.valor != null ? formatMoneyBrlInput(c.valor) : ""
    const despesa = c.tipo === "expense"
    return {
        formKind: parcelada ? "installment" : c.tipo,
        type: c.tipo,
        amount: valor,
        installmentValueMode: "total",
        installmentTotal: valor,
        installmentCount: parcelada ? String(c.parcelas) : DEFAULT_INSTALLMENT_COUNT,
        description: c.descricao,
        date: c.data,
        categoryId: c.categoryId ?? "",
        paymentMethod: despesa ? c.paymentMethod : null,
        paymentCreditCardId: despesa ? (c.creditCardId ?? "") : "",
        estornoCartaoId: c.estorno ? c.creditCardId : null,
    }
}

/**
 * A origem e a marca que o salvar leva: só na criação com frase aplicada.
 * Dúvida do parser ou categoria vazia no salvar ficam a conferir.
 */
export function origemDaFrase(
    duvidas: string[] | null,
    editing: boolean,
    categoryId: string,
    /** `share` quando quem preencheu foi a foto do recibo. */
    source: TransactionSource = "quick_text",
): { source?: TransactionSource; needsReview?: boolean } {
    if (editing || duvidas == null) return {}
    return { source, needsReview: duvidas.length > 0 || !categoryId }
}

/** O histórico é ajuda: depois disso a frase preenche sem ele. */
const ESPERA_DO_HISTORICO_MS = 4000

/**
 * O histórico pelo cache do react-query, carregado só quando a frase (ou a
 * foto) é aplicada. Offline, falhando ou demorando, a frase preenche sem ele.
 */
export async function historicoDaFraseEmCache(
    queryClient: QueryClient,
    workspaceId: string | null,
): Promise<LinhaHistorico[]> {
    if (!workspaceId || !onlineManager.isOnline()) return []
    try {
        return await queryClient.fetchQuery({
            queryKey: fraseHistoricoKeys.list(workspaceId),
            queryFn: () => carregarHistoricoDaFrase(workspaceId, AbortSignal.timeout(ESPERA_DO_HISTORICO_MS)),
            staleTime: 5 * 60_000,
            networkMode: "always",
            retry: false,
            meta: { errorToast: false },
        })
    } catch {
        return []
    }
}

/** As últimas 300 linhas da carteira, as colunas que o histórico lê. */
export async function carregarHistoricoDaFrase(
    workspaceId: string,
    signal?: AbortSignal,
): Promise<LinhaHistorico[]> {
    let consulta = supabase
        .from("transactions")
        .select("description, category_id, payment_method, payment_credit_card_id, date, type")
        .eq("workspace_id", workspaceId)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(300)
    if (signal) consulta = consulta.abortSignal(signal)
    const { data, error } = await consulta
    if (error) throw error
    return (data ?? []) as LinhaHistorico[]
}
