"use client"

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/components/providers"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useWorkspace } from "@/components/workspace-provider"
import { useGlobalShellDialogsOptional } from "@/components/layout/global-shell-dialogs-provider"
import type { NewTransactionMode } from "@/lib/transactions/new-transaction-mode"
import { isProjectedTransactionRow } from "@/lib/category-expense-month-rows"
import { supabase, type Transaction } from "@/lib/supabase"
import type {
    InstallmentPlanUpdatePayload,
    TransactionFormSavePayload,
    TransactionSaveResult,
} from "@/components/transactions/transaction-form-types"
import {
    deleteTransactionsByIds,
    persistInstallmentPlanUpdate,
    persistTransactionSave,
} from "@/lib/transaction-detail-sheet-mutations"
import { attachPaymentCards } from "@/lib/transactions-detail-sheet-query"
import {
    PARAMETROS_DA_FRASE,
    PARAMETROS_DO_COMPARTILHADO,
    consumirParametroCompartilhado,
    consumirParametroFrase,
    consumirParametroImportar,
} from "@/lib/transactions-list-search-params"
import { marcarTodosConferidos } from "@/lib/transactions/mutations"
import { escreverFiltrosNaUrl, lerFiltrosDaUrl, type EstadoDaLista } from "@/lib/transactions/filtros"
import { fetchTransacoesPagina } from "@/lib/queries/transacoes-filtradas"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { transacoesKeys } from "@/lib/queries/keys"
import { useCategoriesQuery } from "@/lib/queries/use-categories"
import { semCamposOcultos, useCamposDeFiltro } from "@/components/transactions/use-campos-de-filtro"
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

/**
 * Os vizinhos com memória: a linha aberta que saiu da lista (confirmada,
 * categorizada ou editada para fora do filtro) deixa o lugar dela, e o seguinte
 * passa a ser quem o ocupou — as setas não somem enquanto há vizinho.
 */
export function vizinhosNaLista(
    lista: Transaction[],
    id: string,
    ultimoIndice?: number,
): { vizinhos: Vizinhos; indice?: number } {
    const reais = lista.filter((t) => !isProjectedTransactionRow(t))
    const i = reais.findIndex((t) => t.id === id)
    if (i >= 0) return { vizinhos: vizinhosDe(lista, id), indice: i }
    if (ultimoIndice === undefined) return { vizinhos: {} }
    const lugar = Math.min(ultimoIndice, reais.length)
    const vizinhos: Vizinhos = {}
    if (lugar > 0) vizinhos.anterior = reais[lugar - 1]
    if (lugar < reais.length) vizinhos.seguinte = reais[lugar]
    return { vizinhos, indice: ultimoIndice }
}

/** Página (1-based) depois de excluir: a que esvaziou volta uma. */
export function paginaDepoisDeExcluir(pagina: number, excluidas: number, naPagina: number): number {
    return excluidas >= naPagina && pagina > 1 ? pagina - 1 : pagina
}

/**
 * A query atual sem `chaves`, partindo da URL mais nova: um `replace` anterior
 * pode ter chegado depois do render, e partir do `qs` velho devolveria o que já saiu.
 */
export function urlSem(atual: string, chaves: readonly string[]): URLSearchParams {
    const out = new URLSearchParams(atual)
    for (const k of chaves) out.delete(k)
    return out
}

/** Uma vez por valor: verdadeiro só na primeira vez que `valor` chega; `null` rearma. */
export function primeiraVez(ref: { current: string | null }, valor: string | null): boolean {
    if (valor == null) {
        ref.current = null
        return false
    }
    if (ref.current === valor) return false
    ref.current = valor
    return true
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
    // A URL andou: o otimista já cumpriu o papel (ou ficou velho) e sai.
    if (otimista && otimista.de !== qs) setOtimista(null)
    const estadoBruto: EstadoDaLista = otimista?.de === qs ? otimista.estado : lido
    // O token de um campo que a barra não mostra sai antes da chave e da contagem do cabeçalho.
    const { campos, prontos: camposProntos } = useCamposDeFiltro(estadoBruto.type)
    const filtrosVisiveis = useMemo(
        () => (camposProntos ? semCamposOcultos(estadoBruto.filtros, campos) : estadoBruto.filtros),
        [camposProntos, estadoBruto.filtros, campos],
    )
    const estado: EstadoDaLista = useMemo(
        () => (filtrosVisiveis === estadoBruto.filtros ? estadoBruto : { ...estadoBruto, filtros: filtrosVisiveis }),
        [estadoBruto, filtrosVisiveis],
    )
    const estadoRef = useRef(estado)
    useLayoutEffect(() => {
        estadoRef.current = estado
    })

    // A URL mais nova: a que chegou ou a última que escrevemos, o que vier depois.
    const urlRef = useRef(qs)
    useLayoutEffect(() => {
        urlRef.current = qs
    }, [qs])
    /** Escreve a partir da URL mais nova, nunca do `qs` do render. */
    const substituir = useCallback(
        (montar: (atual: string) => URLSearchParams) => {
            const s = montar(urlRef.current).toString()
            urlRef.current = s
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
            substituir((atual) => escreverFiltrosNaUrl(novo, new URLSearchParams(atual)))
        },
        [qs, substituir],
    )

    // Parâmetros antigos (ou nenhum filtro) viram o formato novo, uma vez.
    useEffect(() => {
        if (lido.migrou) substituir((atual) => escreverFiltrosNaUrl(lido, new URLSearchParams(atual)))
    }, [lido, substituir])

    // --- Consultas
    // Só os campos do estado: o `migrou` da leitura não entra na chave.
    // Com filtro ou busca pendentes a chave fica no último retrato coerente (sem pedido misto); página, ordem e tipo valem na hora.
    const estadoAtrasado = useDebouncedValue(estado, 250)
    const esperando = estadoAtrasado.filtros !== estado.filtros || estadoAtrasado.q !== estado.q
    const base = esperando ? estadoAtrasado : estado
    const estadoDaChave: EstadoDaLista = { type: base.type, q: base.q, filtros: base.filtros, sort: base.sort, page: base.page }

    const paginaQuery = useQuery({
        queryKey: transacoesKeys.pagina(workspaceId ?? "__none__", estadoDaChave),
        queryFn: () => fetchTransacoesPagina({ workspaceId: workspaceId!, estado: estadoDaChave }),
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
    // O último lugar da linha aberta entre as reais, para as setas sobreviverem à saída dela.
    const [lugarAberto, setLugarAberto] = useState<{ id: string; indice: number } | null>(null)
    const idAberto = detalheAoVivo?.id
    const naLista = useMemo(
        () =>
            idAberto
                ? vizinhosNaLista(transactions, idAberto, lugarAberto?.id === idAberto ? lugarAberto.indice : undefined)
                : { vizinhos: {} },
        [idAberto, transactions, lugarAberto],
    )
    if (idAberto && naLista.indice !== undefined && (lugarAberto?.id !== idAberto || lugarAberto.indice !== naLista.indice)) {
        setLugarAberto({ id: idAberto, indice: naLista.indice })
    }
    const vizinhos = naLista.vizinhos

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
            let linha: Transaction | null = naPagina ?? null
            if (!naPagina) {
                const { data, error } = await supabase
                    .from("transactions")
                    .select("*")
                    .eq("id", txnNaUrl)
                    .eq("workspace_id", currentWorkspaceId)
                    .maybeSingle()
                if (cancelado) return
                linha = error ? null : ((data as Transaction | null) ?? null)
            }
            setTxnLido(true)
            // Consumido mesmo sem linha: o parâmetro não fica na URL depois da falha.
            substituir((atual) => urlSem(atual, ["txn"]))
            if (linha) abrirDetalhe(linha)
        })()
        return () => {
            cancelado = true
        }
    }, [txnLido, carregando, currentWorkspaceId, detalheEstado.aberto, txnNaUrl, transactions, abrirDetalhe, substituir])

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
        substituir((atual) => urlSem(atual, ["importar"]))
    }, [searchParams, substituir])

    // `?new=1|receita|parcelada` abre a criação pela casca e sai da URL.
    // O ref segura o segundo efeito do modo estrito e o `new` que um `replace`
    // de outro efeito ainda carregava; rearma quando o `new` sai da URL.
    const newNaUrl = searchParams?.get("new") ?? null
    const newConsumido = useRef<string | null>(null)
    useEffect(() => {
        if (newNaUrl == null) {
            primeiraVez(newConsumido, null)
            return
        }
        const pedido = CRIAR_DO_NEW[newNaUrl]
        if (!pedido || carregando || !shell) return
        if (!primeiraVez(newConsumido, newNaUrl)) return
        setCriar(pedido)
        shell.openTransactionCreate(MODO_DO_CRIAR[pedido])
        substituir((atual) => urlSem(atual, ["new"]))
    }, [newNaUrl, carregando, shell, substituir])

    // `?frase=` (o compartilhar do Android) abre a criação com a frase escrita, sem aplicar.
    const fraseConsumida = useRef<string | null>(null)
    useEffect(() => {
        const texto = consumirParametroFrase(searchParams)
        if (texto == null) {
            primeiraVez(fraseConsumida, null)
            return
        }
        if (!shell || !primeiraVez(fraseConsumida, texto)) return
        setFrase(texto)
        shell.openTransactionCreate("expense", { frase: texto })
        substituir((atual) => urlSem(atual, PARAMETROS_DA_FRASE))
    }, [searchParams, shell, substituir])

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
        substituir((atual) => urlSem(atual, PARAMETROS_DO_COMPARTILHADO))
    }, [searchParams, substituir])
    const dispensarCompartilhado = useCallback(() => setCompartilhado(undefined), [])
    /** A tela leu `criar`/`frase` (a casca já abriu a criação): limpa os dois. */
    const consumirPedido = useCallback(() => {
        setCriar(null)
        setFrase(undefined)
    }, [])

    // --- Salvar (a edição no detalhe): o detalhe relê a linha da lista recarregada.
    const [salvando, setSalvando] = useState(false)
    const salvar = useCallback(
        async (payload: TransactionFormSavePayload): Promise<TransactionSaveResult> => {
            if (!user || !currentWorkspaceId) return false
            setSalvando(true)
            try {
                return await persistTransactionSave({
                    supabase,
                    user,
                    workspaceId: currentWorkspaceId,
                    payload,
                    resolveEditingTransaction: (id) =>
                        transactions.find((t) => t.id === id) ?? (detalheAoVivo?.id === id ? detalheAoVivo : null),
                    onAfterSuccess: invalidar,
                })
            } finally {
                // Se a persistência lançar, o botão não fica preso em "salvando".
                setSalvando(false)
            }
        },
        [user, currentWorkspaceId, transactions, detalheAoVivo, invalidar],
    )
    const atualizarParcelada = useCallback(
        async (planId: string, payload: InstallmentPlanUpdatePayload): Promise<boolean> => {
            if (!currentWorkspaceId) return false
            setSalvando(true)
            try {
                return await persistInstallmentPlanUpdate({ supabase, planId, payload, onAfterSuccess: invalidar })
            } finally {
                setSalvando(false)
            }
        },
        [currentWorkspaceId, invalidar],
    )

    /** O Confirmar todos do aviso: todos os "a conferir" da carteira; o erro sobe ao aviso. */
    const confirmarTodosAConferir = useCallback(async () => {
        if (!currentWorkspaceId) return
        await marcarTodosConferidos(currentWorkspaceId)
        await invalidar()
    }, [currentWorkspaceId, invalidar])

    // --- Excluir: abre a confirmação; confirmar exclui, volta a página vazia e recarrega.
    const [pendente, setPendente] = useState<{ ids: string[]; linhas: Transaction[] } | null>(null)
    const [excluindo, setExcluindo] = useState(false)
    const excluir = useCallback(
        (ids: string[]) => {
            if (!ids.length) return
            // A linha aberta no detalhe pode ter saído da página: sem ela, o cascade da parcelada se perdia.
            const linhas = ids.flatMap((id) => {
                const t = transactions.find((x) => x.id === id) ?? (detalheAoVivo?.id === id ? detalheAoVivo : null)
                return t ? [t] : []
            })
            setPendente({ ids, linhas })
        },
        [transactions, detalheAoVivo],
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
            const reais = transactions.filter((t) => !isProjectedTransactionRow(t)).length
            const pagina = paginaDepoisDeExcluir(estadoRef.current.page, pendente.ids.length, reais)
            if (pagina !== estadoRef.current.page) setEstado({ page: pagina })
            await invalidar()
            return true
        } finally {
            setExcluindo(false)
        }
    }, [pendente, currentWorkspaceId, detalheEstado.t, fecharDetalhe, transactions, setEstado, invalidar])
    const cancelarExclusao = useCallback(() => {
        if (!excluindo) setPendente(null)
    }, [excluindo])

    return {
        estado,
        setEstado,
        campos,
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
            dispensarCompartilhado,
            consumirPedido,
        },
        confirmarTodosAConferir,
        salvando,
        salvar,
        atualizarParcelada,
        excluir,
        exclusao: { pendente, excluindo, confirmar: confirmarExclusao, cancelar: cancelarExclusao },
        invalidar,
    }
}
