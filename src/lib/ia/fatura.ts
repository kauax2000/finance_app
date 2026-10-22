import { completude } from "@/lib/import/fatura-texto"
import type { ItemBanco, LeituraFatura } from "@/lib/import/tipos"
import type { ItemFaturaIA } from "./ler"

const VALOR_MAXIMO = 1_000_000

/** A mesma régua de `ehDataValida` da Edge (`_shared/ia.ts`). */
const ehDataValida = (s: unknown): s is string => {
    if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
    const d = new Date(`${s}T00:00:00Z`)
    return s >= "2000-01-01" && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

/**
 * Os itens da IA como itens do banco. A Edge já validou; aqui a mesma régua
 * roda de novo, por defesa: data válida, valor positivo até 1.000.000 em
 * centavos, descrição não vazia, parcela 1 ≤ k ≤ n ≤ 48 (senão nula).
 */
export function itensDaIA(itens: ItemFaturaIA[]): ItemBanco[] {
    return itens.flatMap((i) => {
        const valor = typeof i.valor === "number" && Number.isFinite(i.valor) ? Math.round(i.valor * 100) / 100 : 0
        const descricao = typeof i.descricao === "string" ? i.descricao.trim().slice(0, 120) : ""
        if (!ehDataValida(i.data) || valor <= 0 || valor > VALOR_MAXIMO || !descricao) return []
        const p = i.parcela
        const parcelaOk = !!p && Number.isInteger(p.k) && Number.isInteger(p.n) && p.k >= 1 && p.k <= p.n && p.n <= 48
        return [{ data: i.data, descricao, valor, estorno: i.estorno === true, parcela: parcelaOk ? { k: p.k, n: p.n } : null }]
    })
}

/** A conferência de novo com os itens da IA e o total do leitor determinístico (Decisão 7). */
export function releitura(totalDeterministico: number | null, itens: ItemBanco[]): Pick<LeituraFatura, "completa" | "diferenca"> {
    return completude(totalDeterministico, itens)
}
