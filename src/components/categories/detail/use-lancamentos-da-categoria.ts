"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"
import { useCamposDeFiltro } from "@/components/transactions/use-campos-de-filtro"
import type { FonteDaTabela } from "@/components/transactions/transacoes-tabela"
import type { FilterField } from "@/components/ui/filter-bar"
import { useWorkspace } from "@/components/workspace-provider"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import type { Category, Transaction } from "@/lib/supabase"
import { filtrarNaMemoria, ordenarNaMemoria, paginarNaMemoria } from "@/lib/transactions/filtrar-na-memoria"
import type { EstadoDaLista } from "@/lib/transactions/filtros"
import { PAGE_SIZE } from "@/lib/queries/fetch-transactions-list-page"
import { camposDaCategoria, comDescricao, estadoDoMes, paginaValida } from "./lancamentos-da-categoria-regras"

/** A fonte em memória da lista de lançamentos do mês da categoria (as linhas já vieram no pacote). */
export function useLancamentosDaCategoria(o: {
    linhas: Transaction[]
    tipo: "income" | "expense"
    yearMonth: string
    carregando: boolean
    categories: Category[]
    invoicePayments: NonNullable<FonteDaTabela["workspaceAux"]>["invoicePayments"]
    abrirDetalhe: (t: Transaction, o?: { editar?: boolean }) => void
}): {
    fonte: FonteDaTabela
    campos: FilterField[]
    filtrarPorDescricao: (nome: string) => void
    ordenarPorValor: () => void
} {
    const { linhas, tipo, yearMonth, carregando, categories, invoicePayments, abrirDetalhe } = o
    const queryClient = useQueryClient()
    const { currentWorkspaceId } = useWorkspace()
    const { campos: todos } = useCamposDeFiltro(tipo)
    const campos = useMemo(() => camposDaCategoria(todos), [todos])

    // Troca de mês volta ao estado limpo (ajuste no render, sem efeito).
    const [estado, setEstadoBruto] = useState<{ mes: string; e: EstadoDaLista }>({ mes: yearMonth, e: estadoDoMes() })
    // Ajuste no render: voltar a um mês (A -> B -> A) não traz os filtros antigos de volta.
    if (estado.mes !== yearMonth) setEstadoBruto({ mes: yearMonth, e: estadoDoMes() })
    const atual = estado.mes === yearMonth ? estado.e : estadoDoMes()
    const setEstado = useCallback(
        (parcial: Partial<EstadoDaLista>) =>
            setEstadoBruto((s) => {
                const base = s.mes === yearMonth ? s.e : estadoDoMes()
                // Mesma regra da tela de Transações: filtro, busca ou tipo novo voltam à página 1.
                const volta = ("type" in parcial || "q" in parcial || "filtros" in parcial) && !("page" in parcial)
                return { mes: yearMonth, e: { ...base, ...parcial, ...(volta ? { page: 1 } : {}) } }
            }),
        [yearMonth],
    )

    const filtradas = useMemo(() => ordenarNaMemoria(filtrarNaMemoria(linhas, atual), atual.sort), [linhas, atual])
    const page = paginaValida(atual.page, filtradas.length, PAGE_SIZE)
    const transactions = useMemo(() => paginarNaMemoria(filtradas, page), [filtradas, page])

    const invalidar = useCallback(async () => {
        if (!currentWorkspaceId) return
        await invalidateWorkspaceData(queryClient, currentWorkspaceId, { domains: ["transactions"] })
    }, [queryClient, currentWorkspaceId])

    const fonte = useMemo<FonteDaTabela>(
        () => ({
            estado: page === atual.page ? atual : { ...atual, page },
            setEstado,
            pagina: {
                transactions,
                totalCount: filtradas.length,
                isLoading: carregando,
                isFetching: false,
                error: null,
                refetch: invalidar as unknown as FonteDaTabela["pagina"]["refetch"],
            },
            // O vazio do mês é do bloco, não da tabela.
            workspaceAux: { invoicePayments, workspaceHasTransactions: true },
            categories,
            detalhe: { abrir: abrirDetalhe },
            invalidar,
        }),
        [atual, page, setEstado, transactions, filtradas.length, carregando, invalidar, invoicePayments, categories, abrirDetalhe],
    )

    const filtrarPorDescricao = useCallback(
        (nome: string) => setEstado({ filtros: comDescricao(atual.filtros, nome), page: 1 }),
        [setEstado, atual.filtros],
    )
    const ordenarPorValor = useCallback(() => setEstado({ sort: { key: "amount", dir: "desc" }, page: 1 }), [setEstado])

    return { fonte, campos, filtrarPorDescricao, ordenarPorValor }
}
