"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase, type Transaction } from "@/lib/supabase"
import { transactionsSearchKeys } from "@/lib/queries/keys"
import { buscaPronta, type BuscaTransacoes } from "@/lib/transaction-search"
import { filterRangeEndIso, filterRangeStartIso } from "@/lib/transaction-date"

export type TransacaoEncontrada = Pick<
    Transaction,
    | "id"
    | "description"
    | "amount"
    | "type"
    | "date"
    | "category_id"
    | "payment_credit_card_id"
>

const COLUNAS =
    "id, description, amount, type, date, category_id, payment_credit_card_id"

/** O padrão do `ilike` entre aspas quando o texto traz o que quebraria o `or=`. */
function padraoIlike(texto: string): string {
    // % _ \ são curingas/escape do LIKE: a barra os torna literais (como na lista).
    const seguro = texto
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_")
    const padrao = `%${seguro}%`
    // a decisão olha o texto cru: "50%" pede aspas, "mercado" não
    if (!/[,()"%\\]/.test(texto) && texto === texto.trim()) return padrao
    // entre aspas o PostgREST lê `\` e `\"` como escape: a barra do LIKE dobra
    return `"${padrao.replace(/[\\"]/g, "\\$&")}"`
}

/** O `or=` do PostgREST: descrição OU categoria OU cartão. `null` sem texto. */
export function filtroOuTransacoes(
    texto: string,
    categoriaIds: string[],
    cartaoIds: string[],
): string | null {
    if (!texto) return null
    const partes = [`description.ilike.${padraoIlike(texto)}`]
    if (categoriaIds.length > 0) {
        partes.push(`category_id.in.(${categoriaIds.join(",")})`)
    }
    if (cartaoIds.length > 0) {
        partes.push(`payment_credit_card_id.in.(${cartaoIds.join(",")})`)
    }
    return partes.join(",")
}

export function useTransactionsSearchQuery({
    workspaceId,
    busca,
    categoriaIds,
    cartaoIds,
}: {
    workspaceId: string | null
    busca: BuscaTransacoes
    categoriaIds: string[]
    cartaoIds: string[]
}) {
    return useQuery({
        queryKey: transactionsSearchKeys.list(
            workspaceId ?? "__none__",
            busca,
            categoriaIds,
            cartaoIds,
        ),
        queryFn: async ({ signal }): Promise<TransacaoEncontrada[]> => {
            if (!workspaceId) return []
            let qb = supabase
                .from("transactions")
                .select(COLUNAS)
                .eq("workspace_id", workspaceId)

            const filtro = filtroOuTransacoes(busca.texto, categoriaIds, cartaoIds)
            if (filtro) qb = qb.or(filtro)

            const { valor, periodo } = busca
            if (valor) {
                qb = valor.exato
                    ? qb.eq("amount", valor.min)
                    : qb.gte("amount", valor.min).lt("amount", valor.max)
            }
            if (periodo) {
                qb = qb
                    .gte("date", filterRangeStartIso(periodo.de))
                    .lte("date", filterRangeEndIso(periodo.ate))
            }

            const { data, error } = await qb
                .order("date", { ascending: false })
                .limit(8)
                .abortSignal(signal)
            if (error) throw new Error(error.message)
            return (data as TransacaoEncontrada[]) ?? []
        },
        enabled: Boolean(workspaceId) && buscaPronta(busca),
        staleTime: 30_000,
    })
}
