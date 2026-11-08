import {
    parseFilters,
    serializeFilters,
    type FilterField,
    type FilterValue,
} from "@/components/ui/filter-bar"
import { parseSort, parsePage, serializePage, serializeSort } from "@/lib/data-table/url-state"
import { PAYMENT_METHOD_VALUES } from "@/lib/payment-methods"
import { parseAmountFilter } from "./valor"
import { localYmdFromDate } from "@/lib/transaction-date"

export type CampoId =
    | "periodo" | "descricao" | "categoria" | "pagamento" | "cartao" | "valor" | "conferir" | "captura"
    | "pessoa" | "pagou" | "projeto" | "parcelada" | "plano" | "assinatura" | "recorrente"

export const SEM_CATEGORIA = "__none__"

/** Na ordem da spec §5.2; as opções chegam do controlador. */
export const CAMPOS_BASE: FilterField[] = [
    { id: "periodo", label: "Período", type: "period" },
    // A busca por descrição é um token: a paleta (⌘K) já procura em tudo, e o "Ver todas" dela chega aqui como `?q=`.
    { id: "descricao", label: "Descrição", type: "text" },
    { id: "categoria", label: "Categoria", type: "enum" },
    { id: "pagamento", label: "Pagamento", type: "enum" },
    { id: "cartao", label: "Cartão", type: "enum" },
    { id: "valor", label: "Valor", type: "money" },
    { id: "conferir", label: "A conferir", type: "boolean" },
    { id: "captura", label: "Entrou por", type: "enum" },
    { id: "pessoa", label: "Lançado por", type: "enum" },
    { id: "pagou", label: "Quem pagou", type: "enum" },
    { id: "projeto", label: "Projeto", type: "enum" },
    { id: "parcelada", label: "Parcelada", type: "boolean" },
    { id: "plano", label: "Compra parcelada", type: "enum", multiple: false },
    { id: "assinatura", label: "Assinatura", type: "enum", multiple: false },
    { id: "recorrente", label: "Recorrente", type: "boolean" },
]

export type EstadoDaLista = {
    type: "all" | "income" | "expense"
    q: string
    filtros: FilterValue[]
    sort: { key: "date" | "amount"; dir: "asc" | "desc" }
    page: number
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SORT_KEYS = ["date", "amount"] as const
const PRESETS_ANTIGOS: Record<string, string> = {
    last7: "ultimos-7",
    last30: "ultimos-30",
    monthToToday: "este-mes",
}
const PARAMS_ANTIGOS = [
    "preset", "from", "to", "cats", "uncat", "pm", "card", "min", "max", "inst", "plan", "sub", "conferir", "q",
] as const

const lista = (v: string | null) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean)
const uuids = (v: string | null) => lista(v).filter((s) => UUID_RE.test(s))
const uuidUnico = (v: string | null) => (v && UUID_RE.test(v) ? [v] : [])

function periodoAntigo(p: URLSearchParams, hoje: Date): string[] {
    const preset = p.get("preset")
    if (preset && Object.hasOwn(PRESETS_ANTIGOS, preset)) return [PRESETS_ANTIGOS[preset]]
    if (preset === "last15") {
        const ini = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 14)
        return [localYmdFromDate(ini), localYmdFromDate(hoje)]
    }
    const from = p.get("from")
    const to = p.get("to")
    if (!from && !to) return []
    return [from || "2000-01-01", to || localYmdFromDate(hoje)]
}

function valorAntigo(p: URLSearchParams): Pick<FilterValue, "operator" | "values"> | null {
    const min = parseAmountFilter(p.get("min") ?? "")
    const max = parseAmountFilter(p.get("max") ?? "")
    if (min != null && max != null) return { operator: "between", values: [String(min), String(max)] }
    if (min != null) return { operator: "gte", values: [String(min)] }
    if (max != null) return { operator: "lte", values: [String(max)] }
    return null
}

/** Os parâmetros antigos viram tokens, na ordem de `CAMPOS_BASE`; o que não vale some (a normalização é do `parseFilters`). */
function filtrosAntigos(p: URLSearchParams, hoje: Date): FilterValue[] {
    const is = (field: string, values: string[]): FilterValue[] =>
        values.length ? [{ field, operator: "is", values }] : []
    const sim = (field: string, ligado: boolean): FilterValue[] =>
        ligado ? [{ field, operator: "is", values: [] }] : []
    const valor = valorAntigo(p)
    const bruto: FilterValue[] = [
        ...is("periodo", periodoAntigo(p, hoje)),
        ...((p.get("q") ?? "").trim() ? [{ field: "descricao", operator: "contains" as const, values: [(p.get("q") ?? "").trim()] }] : []),
        ...is("categoria", p.get("uncat") === "1" ? [SEM_CATEGORIA] : uuids(p.get("cats"))),
        ...is("pagamento", lista(p.get("pm")).filter((v) => (PAYMENT_METHOD_VALUES as readonly string[]).includes(v))),
        ...is("cartao", uuids(p.get("card"))),
        ...(valor ? [{ field: "valor", ...valor }] : []),
        ...sim("conferir", p.get("conferir") === "1"),
        ...sim("parcelada", p.get("inst") === "1"),
        ...is("plano", uuidUnico(p.get("plan"))),
        ...is("assinatura", uuidUnico(p.get("sub"))),
    ]
    return parseFilters(serializeFilters(bruto), CAMPOS_BASE)
}

export function lerFiltrosDaUrl(
    p: URLSearchParams,
    hoje: Date = new Date()
): EstadoDaLista & { migrou: boolean } {
    const novos = parseFilters(p.get("f"), CAMPOS_BASE)
    const antigos = filtrosAntigos(p, hoje).filter((a) => !novos.some((n) => n.field === a.field))
    const filtros = [...novos, ...antigos]
    const temAntigo = PARAMS_ANTIGOS.some((k) => (p.get(k) ?? "").trim() !== "")
    const padrao = !p.has("f") && !temAntigo
    if (padrao) filtros.unshift({ field: "periodo", operator: "is", values: ["este-mes"] })

    const type = p.get("type")
    const [s] = parseSort(p.get("sort"), SORT_KEYS)
    return {
        type: type === "income" || type === "expense" ? type : "all",
        q: "",
        filtros,
        sort: s ? { key: s.id as "date" | "amount", dir: s.desc ? "desc" : "asc" } : { key: "date", dir: "desc" },
        page: parsePage(p.get("page")) + 1,
        migrou: temAntigo || padrao,
    }
}

export function escreverFiltrosNaUrl(estado: EstadoDaLista, base: URLSearchParams): URLSearchParams {
    const out = new URLSearchParams(base)
    for (const k of ["type", "q", "f", "sort", "page", ...PARAMS_ANTIGOS]) out.delete(k)
    if (estado.type !== "all") out.set("type", estado.type)
    // `f=` vazio é "sem filtro de propósito": a leitura não põe o período padrão.
    out.set("f", serializeFilters(estado.filtros) ?? "")
    if (!(estado.sort.key === "date" && estado.sort.dir === "desc")) {
        out.set("sort", serializeSort([{ id: estado.sort.key, desc: estado.sort.dir === "desc" }]))
    }
    const page = serializePage(estado.page - 1)
    if (page) out.set("page", page)
    return out
}
