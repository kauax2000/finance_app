"use client"

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { useGlobalShellDialogsOptional } from "@/components/layout/global-shell-dialogs-provider"
import type { NewTransactionMode } from "@/components/transactions/transactions-toolbar"
import { isProjectedTransactionRow } from "@/lib/category-expense-month-rows"
import { supabase, type Transaction } from "@/lib/supabase"
import { deleteTransactionsByIds } from "@/lib/transaction-detail-sheet-mutations"
import { attachPaymentCards } from "@/lib/transactions-detail-sheet-query"
import {
    PARAMETROS_DA_FRASE,
    PARAMETROS_DO_COMPARTILHADO,
    consumirParametroCompartilhado,
    consumirParametroFrase,
    consumirParametroImportar,
} from "@/lib/transactions-list-search-params"
import { escreverFiltrosNaUrl, lerFiltrosDaUrl, type EstadoDaLista } from "@/lib/transactions/filtros"
import { fetchResumoTransacoes, fetchTransacoesPagina, type Resumo } from "@/lib/queries/transacoes-filtradas"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { transacoesKeys } from "@/lib/queries/keys"
import { useCategoriesQuery } from "@/lib/queries/use-categories"
import { useCreditCardsQuery } from "@/lib/queries/use-credit-cards"
import { useTransactionsWorkspaceAuxQuery } from "@/lib/queries/use-transactions-workspace-aux-query"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type Criar = "despesa" | "receita" | "parcelada"
const CRIAR_DO_NEW: Record<string, Criar> = { "1": "despesa", receita: "receita", parcelada: "parcelada" }
const MODO_DO_CRIAR: Record<Criar, NewTransactionMode> = {
    despesa: "expense",
    receita: "income",
    parcelada: "installment",
}

export type Vizinhos = { anterior?: Transaction; seguinte?: Transaction }

/** O anterior e o seguinte na ordem da lista, sem as linhas projetadas ("Previsto"). */
export function vizinhosDe(lista: Transaction[], id: string): Vizinhos {
    const reais = lista.filter((t) => !isProjectedTransactionRow(t))
    const i = reais.findIndex((t) => t.id === id)
    if (i < 0) return {}
    const out: Vizinhos = {}
    if (i > 0) out.anterior = reais[i - 1]
    if (i < reais.length - 1) out.seguinte = reais[i + 1]
    return out
}

/** Página (1-based) depois de excluir: a que esvaziou volta uma. */
export function paginaDepoisDeExcluir(pagina: number, excluidas: number, naPagina: number): number {
    return excluidas >= naPagina && pagina > 1 ? pagina - 1 : pagina
}

export type PedidoCompartilhado =
    | { chave: string; tipo?: "pdf" }
    | { erro: true; motivo: "recusado" | "indisponivel" }

export type TelaDeTransacoes = ReturnType<typeof useTransacoesDaTela>

/** O controlador da página de Transações (só da página; Categorias segue no antigo). */
export function useTransacoesDaTela() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const queryClient = useQueryClient()
    const shell = useGlobalShellDialogsOptional()
    const { user, loading: authLoading } = useAuth()
    const { currentWorkspaceId, loading: workspaceLoading } = useWorkspace()
    const pronto = Boolean(user) && !authLoading && !workspaceLoading && Boolean(currentWorkspaceId)
    const workspaceId = pronto ? currentWorkspaceId : null

    const categoriesQuery = useCategoriesQuery(workspaceId)
    const creditCardsQuery = useCreditCardsQuery(workspaceId)
    const auxQuery = useTransactionsWorkspaceAuxQuery(workspaceId, pronto)
    const creditCards = useMemo(() => creditCardsQuery.data ?? [], [creditCardsQuery.data])

    // --- Estado: a URL é a fonte; o otimista cobre o vão até o `replace` chegar.
    const qs = searchParams?.toString() ?? ""
    const lido = useMemo(() => lerFiltrosDaUrl(new URLSearchParams(qs)), [qs])
    const [otimista, setOtimista] = useState<{ de: string; estado: EstadoDaLista } | null>(null)
    const estado: EstadoDaLista = otimista?.de === qs ? otimista.estado : lido
    const estadoRef = useRef(estado)
    useLayoutEffect(() => {
        estadoRef.current = estado
    })

    const substituir = useCallback(
        (p: URLSearchParams) => {
            const s = p.toString()
            router.replace(s ? `${pathname}?${s}` : pathname)
        },
        [router, pathname],
    )

    const setEstado = useCallback(
        (parcial: Partial<EstadoDaLista>) => {
            const base = estadoRef.current
            const volta = ("type" in parcial || "q" in parcial || "filtros" in parcial) && !("page" in parcial)
            const novo: EstadoDaLista = { ...base, ...parcial, ...(volta ? { page: 1 } : {}) }
            estadoRef.current = novo
            setOtimista({ de: qs, estado: novo })
            substituir(escreverFiltrosNaUrl(novo, new URLSearchParams(qs)))
        },
        [qs, substituir],
    )

    // Parâmetros antigos (ou nenhum filtro) viram o formato novo, uma vez.
    useEffect(() => {
        if (lido.migrou) substituir(escreverFiltrosNaUrl(lido, new URLSearchParams(qs)))
    }, [lido, qs, substituir])

    // --- Consultas
    // Só os campos do estado: o `migrou` da leitura não entra na chave.
    const estadoDoResumo = { type: estado.type, q: estado.q, filtros: estado.filtros }
    const estadoDaChave: EstadoDaLista = { ...estadoDoResumo, sort: estado.sort, page: estado.page }

    const paginaQuery = useQuery({
        queryKey: transacoesKeys.pagina(workspaceId ?? "__none__", estadoDaChave),
        queryFn: () => fetchTransacoesPagina({ workspaceId: workspaceId!, estado: estadoDaChave }),
        enabled: workspaceId != null,
        placeholderData: keepPreviousData,
        staleTime: 60_000,
    })
    const resumoQuery = useQuery({
        queryKey: transacoesKeys.resumo(workspaceId ?? "__none__", estadoDoResumo),
        queryFn: () => fetchResumoTransacoes({ workspaceId: workspaceId!, estado: estadoDaChave }),
        enabled: workspaceId != null,
        placeholderData: keepPreviousData,
        staleTime: 60_000,
    })
    const aConferirQuery = useQuery({
        queryKey: transacoesKeys.aConferir(workspaceId ?? "__none__"),
        queryFn: async () => {
            const { count, error } = await supabase
                .from("transactions")
                .select("id", { count: "exact", head: true })
                .eq("workspace_id", workspaceId!)
                .eq("needs_review", true)
            if (error) throw error
            return count ?? 0
        },
        enabled: workspaceId != null,
        placeholderData: keepPreviousData,
        staleTime: 60_000,
    })

    // Os cartões chegam depois da página às vezes: o anexo é refeito aqui.
    const transactions = useMemo(
        () => attachPaymentCards(paginaQuery.data?.transactions ?? [], creditCards),
        [paginaQuery.data, creditCards],
    )

    const carregando =
        authLoading ||
        workspaceLoading ||
        (pronto && (categoriesQuery.isPending || creditCardsQuery.isPending || auxQuery.isPending || paginaQuery.isPending))

    const invalidar = useCallback(async () => {
        if (!currentWorkspaceId) return
        await invalidateWorkspaceData(queryClient, currentWorkspaceId, {
            domains: ["transactions", "categories", "credit_cards", "credit_card_expense_rows", "bills", "installment_plans"],
        })
    }, [queryClient, currentWorkspaceId])

    // --- Detalhe
    const [detalheEstado, setDetalheEstado] = useState<{ t: Transaction | null; aberto: boolean; editar: boolean }>({
        t: null,
        aberto: false,
        editar: false,
    })
    // A folha lê a linha da lista recarregada, e não o retrato de quando abriu:
    // com o retrato, a segunda edição regravava o valor velho por cima da primeira.
    const detalheAoVivo = useMemo(
        () => (detalheEstado.t && transactions.find((t) => t.id === detalheEstado.t!.id)) ?? detalheEstado.t,
        [detalheEstado.t, transactions],
    )
    const abrirDetalhe = useCallback((t: Transaction, opts?: { editar?: boolean }) => {
        setDetalheEstado({ t, aberto: true, editar: opts?.editar === true })
    }, [])
    const fecharDetalhe = useCallback(() => setDetalheEstado((d) => ({ ...d, aberto: false, editar: false })), [])
    const consumirEditar = useCallback(() => setDetalheEstado((d) => ({ ...d, editar: false })), [])
    const vizinhos = useMemo(
        () => (detalheAoVivo ? vizinhosDe(transactions, detalheAoVivo.id) : {}),
        [detalheAoVivo, transactions],
    )

    // `?txn=<id>`: a linha da página, ou do banco; o parâmetro sai da URL.
    const [txnLido, setTxnLido] = useState(false)
    const txnNaUrl = searchParams?.get("txn")?.trim() ?? ""
    // Com o `txn` consumido, o próximo `?txn=` (o "Ver" do toast) abre de novo.
    if (txnLido && !txnNaUrl) setTxnLido(false)
    useEffect(() => {
        if (txnLido || carregando || !currentWorkspaceId || detalheEstado.aberto) return
        if (!txnNaUrl || !UUID_RE.test(txnNaUrl)) return
        let cancelado = false
        void (async () => {
            const naPagina = transactions.find((t) => t.id === txnNaUrl)
            if (naPagina) {
                setTxnLido(true)
                abrirDetalhe(naPagina)
            } else {
                const { data, error } = await supabase
                    .from("transactions")
                    .select("*")
                    .eq("id", txnNaUrl)
                    .eq("workspace_id", currentWorkspaceId)
                    .maybeSingle()
                if (cancelado) return
                setTxnLido(true)
                if (error || !data) return
                abrirDetalhe(data as Transaction)
            }
            const resto = new URLSearchParams(qs)
            resto.delete("txn")
            substituir(resto)
        })()
        return () => {
            cancelado = true
        }
    }, [txnLido, carregando, currentWorkspaceId, detalheEstado.aberto, txnNaUrl, transactions, abrirDetalhe, qs, substituir])

    // --- Pedidos de abertura vindos da URL
    const [importar, setImportar] = useState(false)
    const [criar, setCriar] = useState<Criar | null>(null)
    const [frase, setFrase] = useState<string | undefined>()
    const [compartilhado, setCompartilhado] = useState<PedidoCompartilhado | undefined>()

    // `?importar=1` abre o importar e sai da URL.
    useEffect(() => {
        const resto = consumirParametroImportar(searchParams)
        if (resto == null) return
        setImportar(true)
        substituir(new URLSearchParams(resto))
    }, [searchParams, substituir])

    // `?new=1|receita|parcelada` abre a criação pela casca e sai da URL.
    const newNaUrl = searchParams?.get("new") ?? null
    useEffect(() => {
        const pedido = newNaUrl != null ? CRIAR_DO_NEW[newNaUrl] : undefined
        if (!pedido || carregando || !shell) return
        setCriar(pedido)
        shell.openTransactionCreate(MODO_DO_CRIAR[pedido])
        const resto = new URLSearchParams(qs)
        resto.delete("new")
        substituir(resto)
    }, [newNaUrl, carregando, shell, qs, substituir])

    // `?frase=` (o compartilhar do Android) abre a criação com a frase escrita, sem aplicar.
    useEffect(() => {
        const texto = consumirParametroFrase(searchParams)
        if (texto == null || !shell) return
        setFrase(texto)
        shell.openTransactionCreate("expense", { frase: texto })
        const resto = new URLSearchParams(qs)
        for (const k of PARAMETROS_DA_FRASE) resto.delete(k)
        substituir(resto)
    }, [searchParams, shell, qs, substituir])

    // `?compartilhado=` / `?compartilhado_erro=1`: só lê e tira da URL. A leitura
    // do Cache Storage (que apaga o arquivo) é da tela, pelo pedido.
    useEffect(() => {
        const naUrl = searchParams?.get("compartilhado") ?? null
        const recusado = searchParams?.has("compartilhado_erro") ?? false
        if (naUrl == null && !recusado) return
        const pedido = consumirParametroCompartilhado(searchParams)
        setCompartilhado(
            naUrl == null
                ? { erro: true, motivo: "recusado" }
                : !pedido
                  ? { erro: true, motivo: "indisponivel" }
                  : pedido.tipo === "pdf"
                    ? { chave: pedido.chave, tipo: "pdf" }
                    : { chave: pedido.chave },
        )
        const resto = new URLSearchParams(qs)
        for (const k of PARAMETROS_DO_COMPARTILHADO) resto.delete(k)
        substituir(resto)
    }, [searchParams, qs, substituir])

    // --- Excluir: abre a confirmação; confirmar exclui, volta a página vazia e recarrega.
    const [pendente, setPendente] = useState<{ ids: string[]; linhas: Transaction[] } | null>(null)
    const [excluindo, setExcluindo] = useState(false)
    const excluir = useCallback(
        (ids: string[]) => {
            if (!ids.length) return
            setPendente({ ids, linhas: transactions.filter((t) => ids.includes(t.id)) })
        },
        [transactions],
    )
    const confirmarExclusao = useCallback(async () => {
        if (!pendente || !currentWorkspaceId) return false
        setExcluindo(true)
        try {
            const rows = pendente.ids.map((id) => ({
                id,
                installment_plan_id: pendente.linhas.find((t) => t.id === id)?.installment_plan_id ?? null,
            }))
            const ok = await deleteTransactionsByIds(supabase, pendente.ids, currentWorkspaceId, { rows })
            if (!ok) return false
            setPendente(null)
            if (detalheEstado.t && pendente.ids.includes(detalheEstado.t.id)) fecharDetalhe()
            const pagina = paginaDepoisDeExcluir(estadoRef.current.page, pendente.ids.length, transactions.length)
            if (pagina !== estadoRef.current.page) setEstado({ page: pagina })
            await invalidar()
            return true
        } finally {
            setExcluindo(false)
        }
    }, [pendente, currentWorkspaceId, detalheEstado.t, fecharDetalhe, transactions.length, setEstado, invalidar])
    const cancelarExclusao = useCallback(() => {
        if (!excluindo) setPendente(null)
    }, [excluindo])

    return {
        estado,
        setEstado,
        carregando,
        categories: categoriesQuery.data ?? [],
        creditCards,
        workspaceAux: auxQuery.data,
        pagina: {
            transactions,
            totalCount: paginaQuery.data?.totalCount ?? 0,
            isLoading: paginaQuery.isLoading,
            isFetching: paginaQuery.isFetching,
            error: paginaQuery.error,
            refetch: paginaQuery.refetch,
        },
        resumo: { data: resumoQuery.data as Resumo | undefined, isFetching: resumoQuery.isFetching },
        contagemAConferir: aConferirQuery.data ?? 0,
        detalhe: {
            aberto: detalheEstado.aberto ? detalheAoVivo : null,
            /** A última aberta, para a folha não esvaziar enquanto fecha. */
            transacao: detalheAoVivo,
            editarAoAbrir: detalheEstado.editar,
            consumirEditar,
            abrir: abrirDetalhe,
            fechar: fecharDetalhe,
            vizinhos,
        },
        pedidosDeAbertura: {
            importar,
            setImportar,
            /** Já aberto pela casca; fica para leitura. */
            criar,
            /** Já aberta na criação pela casca; fica para leitura. */
            frase,
            compartilhado,
            dispensarCompartilhado: () => setCompartilhado(undefined),
        },
        excluir,
        exclusao: { pendente, excluindo, confirmar: confirmarExclusao, cancelar: cancelarExclusao },
        invalidar,
    }
}
