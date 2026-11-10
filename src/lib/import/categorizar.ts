import type { CategoriaParaCasar } from "@/lib/captura/frase"
import type { CategoriasPorTipo, ItemParaCategorizar, Sugestao } from "@/lib/ia/ler"
import { type DestinoImportacao, type ItemImportavel, tipoDoItem } from "./importar"
import { normalizarDescricao } from "./normalizar"

/** Espelha `MAX_CATEGORIZAR` de `supabase/functions/_shared/ia.ts`; aqui, sem puxar o cliente do Supabase. */
export const MAX_CATEGORIZAR = 200

export type PedidoDaIA = {
    itens: ItemParaCategorizar[]
    categorias: CategoriasPorTipo
    clientIds: string[]
    ficaram: number
}

/**
 * As linhas sem categoria, de tipos com pelo menos uma categoria, até `MAX_CATEGORIZAR`,
 * com índice local. Só vão descrição e tipo: nem valor, nem data, nem id.
 */
export function pedidoDaIA(
    itens: ItemImportavel[],
    categoriaDe: (id: string) => string | null,
    categorias: CategoriaParaCasar[],
    destino: DestinoImportacao,
): PedidoDaIA {
    const nomes: CategoriasPorTipo = {
        expense: categorias.filter((c) => c.type === "expense").map((c) => c.name),
        income: categorias.filter((c) => c.type === "income").map((c) => c.name),
    }
    const pedido: PedidoDaIA = { itens: [], categorias: nomes, clientIds: [], ficaram: 0 }
    for (const item of itens) {
        if (categoriaDe(item.clientId) != null) continue
        const tipo = tipoDoItem(item, destino)
        if (!nomes[tipo].length) continue
        if (pedido.itens.length >= MAX_CATEGORIZAR) {
            pedido.ficaram++
            continue
        }
        pedido.itens.push({ i: pedido.itens.length, descricao: item.descricao, tipo })
        pedido.clientIds.push(item.clientId)
    }
    return pedido
}

/** clientId → categoryId, pelo nome devolvido e o tipo da linha. Índice sem linha ou nome sem categoria saem. */
export function aplicarSugestoes(
    sugestoes: Sugestao[],
    pedido: PedidoDaIA,
    categorias: CategoriaParaCasar[],
): Map<string, string> {
    const porNome = new Map<string, string>()
    for (const c of categorias) {
        const k = `${c.type}:${normalizarDescricao(c.name)}`
        if (!porNome.has(k)) porNome.set(k, c.id)
    }
    const out = new Map<string, string>()
    for (const s of sugestoes) {
        const clientId = pedido.clientIds[s.i]
        const item = pedido.itens[s.i]
        if (!clientId || !item) continue
        const id = porNome.get(`${item.tipo}:${normalizarDescricao(s.categoria)}`)
        if (id) out.set(clientId, id)
    }
    return out
}
