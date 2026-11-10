import type { CategoriaParaCasar } from "@/lib/captura/frase"
import type { CategoriasPorTipo, ItemParaCategorizar, Sugestao } from "@/lib/ia/ler"
import { type DestinoImportacao, type ItemImportavel, tipoDoItem } from "./importar"
import { normalizarDescricao } from "./normalizar"

/** Espelha `MAX_CATEGORIZAR` de `supabase/functions/_shared/ia.ts`; aqui, sem puxar o cliente do Supabase. */
export const MAX_CATEGORIZAR = 200
/** O teto de nomes por tipo que a `ia-ler` aceita (`lerPedidoCategorizar`); acima, a IA escolhe entre os primeiros. */
export const MAX_NOMES_POR_TIPO = 100
/** Os tetos de texto de `lerPedidoCategorizar`: acima deles o servidor recusa o pedido inteiro. */
export const MAX_DESCRICAO_IA = 200
export const MAX_NOME_IA = 60

const nomesPara = (categorias: CategoriaParaCasar[], tipo: "expense" | "income") =>
    categorias
        .filter((c) => c.type === tipo && c.name.length <= MAX_NOME_IA && normalizarDescricao(c.name))
        .map((c) => c.name)
        .slice(0, MAX_NOMES_POR_TIPO)

export type PedidoDaIA = {
    itens: ItemParaCategorizar[]
    categorias: CategoriasPorTipo
    clientIds: string[]
    ficaram: number
}

/**
 * As linhas sem categoria, de tipos com pelo menos uma categoria, até `MAX_CATEGORIZAR`,
 * com índice local. Só vão descrição e tipo: nem valor, nem data, nem id. A linha da planilha
 * cuja categoria nasce ao gravar não vai: a IA brigaria com a categoria da própria planilha.
 */
export function pedidoDaIA(
    itens: ItemImportavel[],
    categoriaDe: (id: string) => string | null,
    categorias: CategoriaParaCasar[],
    destino: DestinoImportacao,
): PedidoDaIA {
    const nomes: CategoriasPorTipo = {
        expense: nomesPara(categorias, "expense"),
        income: nomesPara(categorias, "income"),
    }
    const pedido: PedidoDaIA = { itens: [], categorias: nomes, clientIds: [], ficaram: 0 }
    for (const item of itens) {
        if (categoriaDe(item.clientId) != null) continue
        if (normalizarDescricao(item.categoria ?? "")) continue
        const tipo = tipoDoItem(item, destino)
        if (!nomes[tipo].length) continue
        if (pedido.itens.length >= MAX_CATEGORIZAR) {
            pedido.ficaram++
            continue
        }
        pedido.itens.push({ i: pedido.itens.length, descricao: item.descricao.slice(0, MAX_DESCRICAO_IA), tipo })
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
