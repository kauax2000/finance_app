/**
 * A frase rápida no formulário de lançamento (Bloco 3A, Decisão 14): o parser
 * da captura preenche os campos, e quem salva é a pessoa. As regras são as da
 * Edge `capture` (`_shared/captura.ts`), sem a parte de carteira: no app o
 * cartão e o histórico já são da carteira aberta.
 */
import { onlineManager, type QueryClient } from "@tanstack/react-query"
import {
    cartaoDoCredito,
    casarCartao,
    casarCategoria,
    interpretarFrase,
    preencherPeloHistorico,
    type CartaoParaCasar,
    type CategoriaParaCasar,
    type FormaDePagamento,
    type FraseInterpretada,
    type LinhaHistorico,
    type MotivoDaCategoria,
} from "@/lib/captura/frase"
import type { CamposIA } from "@/lib/ia/ler"
import { tipoDaCategoria } from "@/lib/expense-month-attribution"
import { fraseHistoricoKeys } from "@/lib/queries/keys"
import { paymentMethodLabel, type PaymentMethod } from "@/lib/payment-methods"
import { currencyBRL } from "@/lib/formatters"
import { formatDatePtBr } from "@/lib/transaction-date"
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
    /** Por que essa categoria (o resumo "Entendi" o diz). */
    motivoDaCategoria: MotivoDaCategoria | null
    /** A palavra que decidiu o tipo ("ganhei", "estorno", "em 10x"); `null` quando nada decidiu. */
    motivoDoTipo: string | null
    /** "frase": o cartão foi nomeado; "ultimo": o do crédito sem nome; "historico": o da mesma descrição. */
    origemDoCartao: "frase" | "ultimo" | "historico" | null
}

/**
 * O que a frase consulta além dela mesma. Sem `categorias`, a categoria é só a
 * do histórico (a regra da Edge `capture`); `cartaoAberto` é o que o formulário
 * pré-escolhe ao tocar em Crédito (`cartaoPreEscolhido`).
 */
export type ContextoDaFrase = {
    categorias?: CategoriaParaCasar[]
    cartaoAberto?: string | null
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
    ctx: ContextoDaFrase = {},
): CamposDaFrase {
    return camposDaInterpretacao(interpretarFrase(texto, hoje), cartoes, historico, ctx)
}

/**
 * Os campos lidos pela IA (frase ou foto) pelas mesmas regras da frase, como a
 * Edge `capture` (Decisão 9): a IA vence e o texto da pessoa completa — o
 * valor escrito vence o lido, e forma, parcelas e estorno ditos ficam quando a
 * IA não os leu. Tipo nulo é despesa, data nula é a do texto (hoje), pix,
 * débito ou dinheiro não têm cartão, e data depois de hoje fica hoje, a
 * conferir. Sempre fica a conferir (a dúvida "ia").
 */
export function camposDaIA(
    c: CamposIA,
    hoje: string,
    cartoes: CartaoParaCasar[],
    historico: LinhaHistorico[],
    /** A frase que a pessoa escreveu; a foto não tem. */
    texto = "",
    ctx: ContextoDaFrase = {},
): CamposDaFrase {
    const f = interpretarFrase(texto, hoje)
    const forma = c.forma ?? f.forma
    let data = c.data ?? f.data
    const duvidas = c.descricao || !f.duvidas.includes("descricao") ? [] : ["descricao"]
    if (data > hoje) {
        data = hoje
        duvidas.push("data")
    }
    const tipo = f.estorno ? "income" : (c.tipo ?? f.tipo)
    const campos = camposDaInterpretacao(
        {
            ...f,
            valor: f.valor ?? c.valor,
            data,
            tipo,
            // O motivo é do texto: quando a IA trocou o tipo, a palavra não o decidiu.
            motivoDoTipo: tipo === f.tipo ? f.motivoDoTipo : null,
            descricao: c.descricao || f.descricao,
            duvidas,
            forma,
            cartaoTexto: forma == null || forma === "credit_card" ? (c.cartao ?? f.cartaoTexto) : null,
            parcelas: c.parcelas ?? f.parcelas,
        },
        cartoes,
        historico,
        ctx,
    )
    return { ...campos, duvidas: [...campos.duvidas, "ia"] }
}

/**
 * As regras da frase no formulário (docs/JORNADAS.md, "Frase rápida"):
 * - **Forma e cartão**, nesta ordem: o cartão nomeado ("nubank") é crédito nele;
 *   a forma dita ("pix", "débito"); "crédito"/"cartão" sem nome é o cartão que o
 *   formulário pré-escolhe ao tocar em Crédito, senão o do último crédito do
 *   histórico (`cartaoDoCredito`); parcelas ("em 3x") sem forma dita são crédito
 *   nesse mesmo cartão, quando há um; por último, a forma e o cartão da mesma
 *   descrição no histórico.
 * - **Categoria**: `casarCategoria` (histórico exato, nome da categoria, palavra
 *   do histórico, palavra comum).
 * - Um nome de cartão que não casa nenhum volta à descrição e, no crédito, fica
 *   a conferir sem cartão: palpitar outro cartão ali erraria de propósito.
 */
function camposDaInterpretacao(
    f: FraseInterpretada,
    cartoes: CartaoParaCasar[],
    historico: LinhaHistorico[],
    ctx: ContextoDaFrase = {},
): CamposDaFrase {
    let { descricao } = f
    // A dúvida "cartao" só vale no crédito ("30 uber casa" não é cartão).
    let duvidas = f.duvidas.filter((d) => d !== "cartao" || f.forma === "credit_card")
    const duvida = (d: string) => {
        if (!duvidas.includes(d)) duvidas.push(d)
    }

    const cartao = casarCartao(f.cartaoTexto, cartoes)
    if (f.cartaoTexto && !cartao) {
        // A palavra volta ao fim da descrição, como foi escrita.
        const palavra = f.cartaoPalavra || f.cartaoTexto
        descricao = duvidas.includes("descricao")
            ? palavra.charAt(0).toUpperCase() + palavra.slice(1)
            : `${descricao} ${palavra}`
        if (f.forma === "credit_card") duvida("cartao")
    }
    if (f.estorno && !cartao) duvida("cartao")
    if (f.valor == null) duvida("valor")
    // A receita não é parcelada: o número fica para a pessoa conferir.
    if (f.tipo === "income" && f.parcelas != null && f.parcelas > 1) duvida("parcelas")

    // Sem descrição de verdade, o histórico não tem o que casar.
    const semDescricao = duvidas.includes("descricao")
    // O estorno no cartão busca a categoria da compra, no histórico de despesa.
    const tipoCategoria = tipoDaCategoria(f.tipo, f.estorno ? (cartao?.id ?? null) : null)
    const doHistorico = semDescricao ? null : preencherPeloHistorico(descricao, tipoCategoria, historico)
    const categoria =
        semDescricao || !ctx.categorias
            ? null
            : casarCategoria(descricao, tipoCategoria, ctx.categorias, historico)

    let paymentMethod: PaymentMethod | null = null
    let creditCardId: string | null = null
    let origemDoCartao: CamposDaFrase["origemDoCartao"] = null
    const doCredito = () => cartaoDoCredito(cartoes, historico, ctx.cartaoAberto ?? null)
    if (f.tipo === "income") {
        creditCardId = f.estorno ? (cartao?.id ?? null) : null
        if (creditCardId) origemDoCartao = "frase"
    } else if (cartao) {
        paymentMethod = "credit_card"
        creditCardId = cartao.id
        origemDoCartao = "frase"
    } else if (f.forma) {
        paymentMethod = FORMA_NO_BANCO[f.forma]
        // "crédito" sem nome: o cartão de sempre, e não há o que conferir.
        if (f.forma === "credit_card" && !f.cartaoTexto) {
            creditCardId = doCredito()?.id ?? null
            if (creditCardId) {
                origemDoCartao = "ultimo"
                duvidas = duvidas.filter((d) => d !== "cartao")
            }
        }
    } else if (f.parcelas != null && f.parcelas > 1 && doCredito()) {
        paymentMethod = "credit_card"
        creditCardId = doCredito()!.id
        origemDoCartao = "ultimo"
    } else if (doHistorico?.paymentMethod) {
        paymentMethod = doHistorico.paymentMethod as PaymentMethod
        // O cartão do histórico só se ainda ativo.
        if (paymentMethod === "credit_card") {
            creditCardId =
                cartoes.find((c) => c.id === doHistorico.creditCardId && c.is_active)?.id ?? null
            if (creditCardId) origemDoCartao = "historico"
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
        categoryId: ctx.categorias ? (categoria?.categoryId ?? null) : (doHistorico?.categoryId ?? null),
        parcelas: f.parcelas,
        duvidas,
        motivoDaCategoria: ctx.categorias ? (categoria?.motivo ?? null) : doHistorico?.categoryId ? "historico" : null,
        motivoDoTipo: f.motivoDoTipo,
        origemDoCartao,
    }
}

const MOTIVO_DA_CATEGORIA: Record<MotivoDaCategoria, string> = {
    historico: "como da última vez",
    nome: "pelo nome",
    palavra: "como uma parecida",
    comum: "palavra comum",
}

const ORIGEM_DO_CARTAO: Record<"ultimo" | "historico", string> = {
    ultimo: "último usado",
    historico: "como da última vez",
}

/**
 * O que a frase entendeu, campo a campo, para a pessoa ver antes de preencher:
 * "R$ 42,00", "Mercado", "categoria Mercado (pelo nome)", "Crédito · Nubank (último usado)".
 */
export function resumoDaFrase(
    c: CamposDaFrase,
    hoje: string,
    categorias: { id: string; name: string }[],
    cartoes: { id: string; name: string }[],
): string[] {
    const itens: string[] = []
    itens.push(c.valor != null ? currencyBRL(c.valor) : "sem valor")
    if (c.estorno) itens.push("estorno")
    else if (c.tipo === "income") itens.push("receita")
    itens.push(c.duvidas.includes("descricao") ? "sem descrição" : c.descricao)
    const categoria = categorias.find((x) => x.id === c.categoryId)
    itens.push(
        categoria
            ? `categoria ${categoria.name}${c.motivoDaCategoria ? ` (${MOTIVO_DA_CATEGORIA[c.motivoDaCategoria]})` : ""}`
            : "sem categoria",
    )
    const cartao = cartoes.find((x) => x.id === c.creditCardId)
    const origem = c.origemDoCartao === "ultimo" || c.origemDoCartao === "historico" ? ` (${ORIGEM_DO_CARTAO[c.origemDoCartao]})` : ""
    if (c.estorno) itens.push(cartao ? `no cartão ${cartao.name}` : "cartão a escolher")
    else if (c.paymentMethod === "credit_card") itens.push(`Crédito · ${cartao ? `${cartao.name}${origem}` : "cartão a escolher"}`)
    else if (c.paymentMethod) itens.push(paymentMethodLabel(c.paymentMethod))
    if (c.parcelas != null && c.parcelas > 1 && c.tipo === "expense") {
        // A parcela arredondada, como o resumo do plano no formulário.
        const parcela = c.valor != null ? ` de ${currencyBRL(Math.round((c.valor * 100) / c.parcelas) / 100)}` : ""
        itens.push(`em ${c.parcelas}x${parcela}`)
    }
    if (c.data !== hoje) itens.push(formatDatePtBr(c.data))
    return itens
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
