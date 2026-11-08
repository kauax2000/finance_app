import { supabase, type CreditCard, type Transaction } from "@/lib/supabase"
import { filterPeriodRange } from "@/components/ui/filter-bar"
import { ehEstornoNoCartao } from "../../../supabase/functions/_shared/credit-card-cycle"
import { filterRangeEndIso, filterRangeStartIso } from "@/lib/transaction-date"
import { attachPaymentCards } from "@/lib/transactions-detail-sheet-query"
import { SEM_CATEGORIA, type EstadoDaLista } from "@/lib/transactions/filtros"
import { POSTGREST_MAX_ROWS } from "./fetch-all-rows"
import { executarComFallbackDeEmbed, PAGE_SIZE } from "./fetch-transactions-list-page"

// shortcut: soma no cliente até 10.000 linhas; trocar por RPC de agregação quando uma carteira passar disso
export const LIMITE_DE_SOMA = 10_000

/** Os ids de "Entrou por" e as origens do banco que cada um cobre. */
const ORIGENS: Record<string, string[]> = {
    importacao: ["import_pdf", "import_sheet", "import_statement"],
    mcp: ["ia_externa"],
}

const COLUNA_DE_LISTA: Record<string, string> = {
    pagamento: "payment_method",
    cartao: "payment_credit_card_id",
    pessoa: "user_id",
    pagou: "paid_by",
    projeto: "project_id",
}

/** Os valores do `FilterBar` são decimais com ponto ("1234.56"), não o texto digitado em pt-BR. */
const numero = (v: string | undefined) => (v && Number.isFinite(Number(v)) ? Number(v) : null)

/** Só os métodos do builder do PostgREST que a consulta usa. */
type Q = {
    eq(c: string, v: unknown): Q
    in(c: string, v: unknown[]): Q
    not(c: string, op: string, v: unknown): Q
    is(c: string, v: null): Q
    or(f: string): Q
    gte(c: string, v: unknown): Q
    lte(c: string, v: unknown): Q
    ilike(c: string, v: string): Q
}

/** Uma regra de filtro, três leitores: a página, o resumo e a exportação. */
export function aplicarFiltros<B>(q: B, estado: Pick<EstadoDaLista, "type" | "q" | "filtros">): B {
    let b = q as unknown as Q
    if (estado.type !== "all") b = b.eq("type", estado.type)

    const contem = (texto: string) => {
        const seguro = texto.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")
        b = b.ilike("description", `%${seguro}%`)
    }
    if (estado.q.trim()) contem(estado.q.trim())

    for (const { field, operator, values } of estado.filtros) {
        const nega = operator === "is-not"
        switch (field) {
            case "descricao": {
                if (values[0]?.trim()) contem(values[0].trim())
                break
            }
            case "periodo": {
                const r = filterPeriodRange(values)
                if (r) b = b.gte("date", filterRangeStartIso(r.from)).lte("date", filterRangeEndIso(r.to))
                break
            }
            case "categoria": {
                const ids = values.filter((v) => v !== SEM_CATEGORIA)
                const semCat = ids.length !== values.length
                if (nega) {
                    if (ids.length) b = b.not("category_id", "in", `(${ids.join(",")})`)
                    if (semCat) b = b.not("category_id", "is", null)
                } else if (ids.length && semCat) {
                    b = b.or(`category_id.in.(${ids.join(",")}),category_id.is.null`)
                } else if (semCat) {
                    b = b.is("category_id", null)
                } else if (ids.length) {
                    b = b.in("category_id", ids)
                }
                break
            }
            case "captura": {
                const v = values.flatMap((x) => ORIGENS[x] ?? [x])
                b = nega ? b.not("source", "in", `(${v.join(",")})`) : b.in("source", v)
                break
            }
            case "pagamento":
            case "cartao":
            case "pessoa":
            case "pagou":
            case "projeto":
                if (values.length) {
                    const col = COLUNA_DE_LISTA[field]
                    b = nega ? b.not(col, "in", `(${values.join(",")})`) : b.in(col, values)
                }
                break
            case "valor": {
                const [x, y] = values.map(numero)
                if (operator === "between") {
                    if (x != null) b = b.gte("amount", x)
                    if (y != null) b = b.lte("amount", y)
                } else if (operator === "gte" && x != null) b = b.gte("amount", x)
                else if (operator === "lte" && x != null) b = b.lte("amount", x)
                break
            }
            case "conferir":
                b = b.eq("needs_review", true)
                break
            case "parcelada":
                b = b.not("installment_plan_id", "is", null)
                break
            case "recorrente":
                b = b.eq("is_recurring", true)
                break
            case "plano":
                if (values[0]) b = b.eq("installment_plan_id", values[0])
                break
            case "assinatura":
                if (values[0]) b = b.eq("subscription_id", values[0])
                break
        }
    }
    return b as unknown as B
}

type Args = { workspaceId: string; estado: EstadoDaLista }

type Ordenavel = { order(c: string, o: { ascending: boolean }): Ordenavel }
function ordenar<B>(q: B, sort: EstadoDaLista["sort"]): B {
    const ascending = sort.dir === "asc"
    let b = (q as unknown as Ordenavel).order(sort.key, { ascending })
    if (sort.key === "date") b = b.order("created_at", { ascending })
    return b.order("id", { ascending }) as unknown as B
}

export async function fetchTransacoesPagina({
    workspaceId,
    estado,
    cartoes = [],
}: Args & { cartoes?: CreditCard[] }): Promise<{ transactions: Transaction[]; totalCount: number }> {
    const from = (estado.page - 1) * PAGE_SIZE
    const { data, count } = await executarComFallbackDeEmbed((select) =>
        ordenar(
            aplicarFiltros(
                supabase.from("transactions").select(select, { count: "exact" }).eq("workspace_id", workspaceId),
                estado,
            ),
            estado.sort,
        ).range(from, from + PAGE_SIZE - 1),
    )
    return {
        transactions: attachPaymentCards((data ?? []) as unknown as Transaction[], cartoes),
        totalCount: count ?? 0,
    }
}

/** Páginas de 1000 até passar do teto em 1 linha, o que denuncia o corte. */
async function lerAteOLimite<T>(pagina: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
    const rows: T[] = []
    for (let from = 0; rows.length <= LIMITE_DE_SOMA; from += POSTGREST_MAX_ROWS) {
        const { data, error } = await pagina(from, from + POSTGREST_MAX_ROWS - 1)
        if (error) throw new Error(error.message)
        rows.push(...(data ?? []))
        if (!data || data.length < POSTGREST_MAX_ROWS) break
    }
    const truncado = rows.length > LIMITE_DE_SOMA
    return { rows: truncado ? rows.slice(0, LIMITE_DE_SOMA) : rows, truncado }
}

export type Resumo = { saidas: number; entradas: number; resultado: number; quantidade: number; truncado: boolean }

type LinhaDoResumo = { type: string; amount: number; payment_method: string | null; payment_credit_card_id: string | null }

export async function fetchResumoTransacoes({ workspaceId, estado }: Args): Promise<Resumo> {
    const { rows, truncado } = await lerAteOLimite<LinhaDoResumo>((from, to) =>
        ordenar(
            aplicarFiltros(
                supabase
                    .from("transactions")
                    // payment_credit_card_id: sem ele o estorno no cartão (ehEstornoNoCartao) nunca casa.
                    .select("type, amount, payment_method, payment_credit_card_id, category:categories(type)")
                    .eq("workspace_id", workspaceId),
                estado,
            ),
            { key: "date", dir: "desc" },
        ).range(from, to) as unknown as PromiseLike<{ data: LinhaDoResumo[] | null; error: { message: string } | null }>,
    )
    let centavosSaida = 0
    let centavosEntrada = 0
    for (const r of rows) {
        const c = Math.round(Number(r.amount || 0) * 100)
        if (r.type === "expense") centavosSaida += c
        else if (ehEstornoNoCartao(r)) centavosSaida -= c
        else if (r.type === "income") centavosEntrada += c
    }
    return {
        saidas: centavosSaida / 100,
        entradas: centavosEntrada / 100,
        resultado: (centavosEntrada - centavosSaida) / 100,
        quantidade: rows.length,
        truncado,
    }
}

export async function fetchTransacoesParaExportar({
    workspaceId,
    estado,
    cartoes = [],
}: Args & { cartoes?: CreditCard[] }): Promise<{ transactions: Transaction[]; truncado: boolean }> {
    const { rows, truncado } = await lerAteOLimite<Transaction>(async (from, to) => {
        const { data, error } = await executarComFallbackDeEmbed((select) =>
            ordenar(
                aplicarFiltros(supabase.from("transactions").select(select).eq("workspace_id", workspaceId), estado),
                estado.sort,
            ).range(from, to),
        ).then((r) => ({ data: r.data as unknown as Transaction[], error: null }), (e: Error) => ({ data: null, error: e }))
        return { data, error }
    })
    return { transactions: attachPaymentCards(rows, cartoes), truncado }
}
