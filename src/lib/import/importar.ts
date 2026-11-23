import type { SupabaseClient } from "@supabase/supabase-js"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { tipoDaCategoria } from "@/lib/expense-month-attribution"
import {
    addDaysYmd,
    calendarYmdToStorageIso,
    filterRangeEndIso,
    filterRangeStartIso,
    localYmdFromDate,
    transactionLocalYmd,
} from "@/lib/transaction-date"
import type { TablesInsert } from "@/types/database"
import { type CategoriaParaCasar, casarCategoria, type LinhaHistorico } from "@/lib/captura/frase"
import { normalizarDescricao } from "./normalizar"
import type { ItemBanco } from "./tipos"

export type DestinoImportacao =
    | { tipo: "cartao"; cardId: string }
    | { tipo: "conta"; paymentMethod: "debit_card" | "pix" | "other" }

/** De onde veio a categoria da linha; `null` quando ela não tem categoria. */
export type OrigemDaCategoria = "planilha" | "historico" | "regra" | "ia" | "pessoa"

export type ItemImportavel = ItemBanco & {
    clientId: string
    categoryId: string | null
    origem: OrigemDaCategoria | null
}

export type SourceImportacao = "import_pdf" | "import_sheet" | "import_statement"

const FATIA = 500

/**
 * O `clientId` nasce aqui, uma vez por item: repetir o envio do mesmo lote cai no
 * `upsert` por `(workspace_id, client_id)` e não duplica (Foco 3).
 */
export function prepararItens(
    itens: ItemBanco[],
    historico: LinhaHistorico[],
    categorias: CategoriaParaCasar[],
    destino: DestinoImportacao,
): ItemImportavel[] {
    const hoje = localYmdFromDate(new Date())
    return itens.map((i) => {
        const r = casarCategoria(i.descricao, tipoDoItem(i, destino), categorias, historico, hoje)
        return {
            ...i,
            clientId: crypto.randomUUID(),
            categoryId: r?.categoryId ?? null,
            origem: r ? (r.motivo === "historico" || r.motivo === "aprendido" ? "historico" : "regra") : null,
        }
    })
}

type CategoriaPorNome = { id: string; name: string; type: "income" | "expense" }

/**
 * O tipo da categoria do item: na conta o crédito é receita; na fatura do cartão
 * o estorno escolhe a categoria de despesa da compra, que ele abate.
 */
export const tipoDoItem = (i: ItemBanco, destino: DestinoImportacao): "income" | "expense" =>
    tipoDaCategoria(i.estorno ? "income" : "expense", destino.tipo === "cartao" ? destino.cardId : null)
const chave = (nome: string, tipo: "income" | "expense") => `${tipo}:${normalizarDescricao(nome)}`

/**
 * A planilha traz a categoria por nome: ela vale sobre a do histórico quando casa
 * com uma categoria do tipo do sinal, sem acento nem caixa. O `clientId` fica.
 */
export function comCategoriaDaPlanilha(
    itens: ItemImportavel[],
    categorias: CategoriaPorNome[],
    destino: DestinoImportacao,
): ItemImportavel[] {
    const porChave = new Map(categorias.map((c) => [chave(c.name, c.type), c.id]))
    return itens.map((i) => {
        const id = i.categoria ? porChave.get(chave(i.categoria, tipoDoItem(i, destino))) : undefined
        return id ? { ...i, categoryId: id, origem: "planilha" as const } : i
    })
}

/** Os nomes da planilha sem categoria do tipo do sinal: a importação os cria. */
export function categoriasQueFaltam(
    itens: ItemBanco[],
    categorias: CategoriaPorNome[],
    destino: DestinoImportacao,
): Array<{ nome: string; tipo: "income" | "expense" }> {
    const vistas = new Set(categorias.map((c) => chave(c.name, c.type)))
    const faltam: Array<{ nome: string; tipo: "income" | "expense" }> = []
    for (const i of itens) {
        const nome = i.categoria?.trim()
        if (!nome || !normalizarDescricao(nome)) continue
        const tipo = tipoDoItem(i, destino)
        const k = chave(nome, tipo)
        if (vistas.has(k)) continue
        vistas.add(k)
        faltam.push({ nome, tipo })
    }
    return faltam
}

/**
 * O sinal do CSV pelo destino: no extrato da conta a saída é negativa; na
 * fatura do cartão a compra é positiva e o crédito é negativo.
 */
export function negativoEhDespesaPadrao(destino: DestinoImportacao): boolean {
    return destino.tipo === "conta"
}

/** Parcela importada é despesa simples com "(k/n)" na descrição (Decisão 4). */
export function linhasDeImportacao(
    ctx: { userId: string; workspaceId: string; batchId: string },
    itens: ItemImportavel[],
    destino: DestinoImportacao,
    source: SourceImportacao,
): TablesInsert<"transactions">[] {
    const cartao = destino.tipo === "cartao"
    return itens.map((i) => ({
        user_id: ctx.userId,
        workspace_id: ctx.workspaceId,
        type: i.estorno ? "income" : "expense",
        amount: i.valor,
        description: i.parcela ? `${i.descricao} (${i.parcela.k}/${i.parcela.n})` : i.descricao,
        date: calendarYmdToStorageIso(i.data),
        category_id: i.categoryId,
        payment_method: cartao ? "credit_card" : destino.paymentMethod,
        payment_credit_card_id: cartao ? destino.cardId : null,
        needs_review: true,
        import_batch_id: ctx.batchId,
        source,
        client_id: i.clientId,
    }))
}

/** Não chama `evaluate-budgets` nem os alertas do cartão (Decisão 5). */
export async function importarLancamentos(
    supabase: SupabaseClient,
    ctx: { userId: string; workspaceId: string },
    itens: ItemImportavel[],
    destino: DestinoImportacao,
    source: SourceImportacao,
    batchId: string,
): Promise<{ ok: true; inseridos: number } | { ok: false; erro: string }> {
    const linhas = linhasDeImportacao({ ...ctx, batchId }, itens, destino, source)
    for (let n = 0; n < linhas.length; n += FATIA) {
        const { error } = await supabase
            .from("transactions")
            .upsert(linhas.slice(n, n + FATIA), { onConflict: "workspace_id,client_id" })
        if (error) {
            return {
                ok: false,
                erro: formatSupabasePostgrestError(error) ?? "Não foi possível importar os lançamentos.",
            }
        }
    }
    return { ok: true, inseridos: linhas.length }
}

export async function desfazerImportacao(
    supabase: SupabaseClient,
    workspaceId: string,
    batchId: string,
): Promise<{ ok: boolean; erro?: string }> {
    const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("import_batch_id", batchId)
    if (error) {
        return {
            ok: false,
            erro: formatSupabasePostgrestError(error) ?? "Não foi possível desfazer a importação.",
        }
    }
    return { ok: true }
}

export type Existente = { id: string; description: string; date: string }

const PAGINA = 1000
const TETO_DE_PAGINAS = 5

/**
 * Os itens do lote que já estão na carteira: mesmo dia local, valor, tipo e destino,
 * 1 para 1. `null`: não deu para conferir (a consulta falhou, ou a janela passou do
 * teto de páginas). A importação segue, e a conferência avisa.
 */
export async function buscarJaExistentes(
    db: SupabaseClient,
    workspaceId: string,
    destino: DestinoImportacao,
    itens: ItemImportavel[],
): Promise<Map<string, Existente> | null> {
    const achados = new Map<string, Existente>()
    if (itens.length === 0) return achados
    const dias = itens.map((i) => i.data).sort()
    // Uma consulta nova por página: o construtor do PostgREST não se reaproveita.
    const pagina = (n: number) => {
        // um dia de folga de cada lado: o dia é conferido localmente depois
        const q = db
            .from("transactions")
            .select("id, description, date, amount, type, payment_method, payment_credit_card_id")
            .eq("workspace_id", workspaceId)
            .gte("date", filterRangeStartIso(addDaysYmd(dias[0], -1)))
            .lte("date", filterRangeEndIso(addDaysYmd(dias[dias.length - 1], 1)))
        return (
            destino.tipo === "cartao"
                ? q.eq("payment_credit_card_id", destino.cardId)
                : q.eq("payment_method", destino.paymentMethod).is("payment_credit_card_id", null)
        )
            .order("id")
            .range(n * PAGINA, (n + 1) * PAGINA - 1)
    }
    const data: Array<{ id: string; description: string; date: string; amount: number; type: string }> = []
    for (let n = 0; ; n++) {
        const r = await pagina(n)
        if (r.error || !r.data) return null
        data.push(...r.data)
        if (r.data.length < PAGINA) break
        if (n + 1 >= TETO_DE_PAGINAS) return null
    }

    const livres = new Map<string, Existente[]>()
    for (const t of data) {
        const dia = transactionLocalYmd(t.date)
        if (!dia) continue
        const k = `${dia}|${t.type}|${Math.round(Number(t.amount) * 100)}`
        livres.set(k, [...(livres.get(k) ?? []), { id: t.id, description: t.description, date: t.date }])
    }
    for (const i of itens) {
        const k = `${i.data}|${i.estorno ? "income" : "expense"}|${Math.round(i.valor * 100)}`
        const e = livres.get(k)?.shift()
        if (e) achados.set(i.clientId, e)
    }
    return achados
}
