import type { FilterField, FilterValue } from "@/components/ui/filter-bar"
import { monthRangeYmd } from "@/lib/period-range"
import { escreverFiltrosNaUrl, type EstadoDaLista } from "@/lib/transactions/filtros"

/** A lista do mês abre limpa: tudo, da data mais recente para trás, na primeira página. */
export function estadoDoMes(): EstadoDaLista {
    return { type: "all", q: "", filtros: [], sort: { key: "date", dir: "desc" }, page: 1 }
}

/** "Ver compras" de uma descrição: troca o filtro de descrição e mantém os outros. */
export function comDescricao(filtros: FilterValue[], nome: string): FilterValue[] {
    return [...filtros.filter((f) => f.field !== "descricao"), { field: "descricao", operator: "is", values: [nome] }]
}

/** A categoria e o período já são da tela: os dois campos não se oferecem. */
export function camposDaCategoria(campos: FilterField[]): FilterField[] {
    return campos.filter((c) => c.id !== "categoria" && c.id !== "periodo")
}

/** O "Ver em Transações": o mesmo formato do link de "Quem gastou" (JORNADAS, seção 9). */
export function hrefDeTransacoes(o: {
    categoryId: string
    yearMonth: string
    tipo: "income" | "expense"
    filtros: FilterValue[]
}): string {
    const [ano, mes] = o.yearMonth.split("-").map(Number)
    const p = monthRangeYmd({ year: ano, month: mes - 1 }, { year: ano, month: mes - 1 })
    const filtros: FilterValue[] = [
        { field: "periodo", operator: "is", values: [p.from, p.to] },
        { field: "categoria", operator: "is", values: [o.categoryId] },
        ...o.filtros,
    ]
    const qs = escreverFiltrosNaUrl({ ...estadoDoMes(), type: o.tipo, filtros }, new URLSearchParams())
    return `/transactions?${qs.toString()}`
}

/** A página que existe: com menos linhas (excluiu a última da página 2), volta à última. */
export function paginaValida(page: number, total: number, tamanho: number): number {
    return Math.min(page, Math.max(1, Math.ceil(total / tamanho)))
}
