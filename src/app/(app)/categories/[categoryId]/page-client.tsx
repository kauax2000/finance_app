"use client"

import { useConfirmDialog } from "@/components/use-confirm-dialog"
import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { useTransactionsListController } from "@/components/transactions/use-transactions-list-controller"
import { supabase, type Transaction } from "@/lib/supabase"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardMessage } from "@/components/ui/card"
import { ColorTile } from "@/components/ui/color-tile"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader, PageHeaderActions, PageHeaderTitle, PageHeaderTitleRow } from "@/components/ui/page-header"
import { BanknotesIcon, ChevronRightIcon, EllipsisHorizontalIcon, PencilIcon, PresentationChartLineIcon, TrashIcon } from "@heroicons/react/16/solid"
import {
    CATEGORY_COLORS,
    CATEGORY_ICONS,
    CategoryIconPreview,
    normalizeCategoryIcon,
    type CategoryIconId,
} from "@/components/categories/category-appearance-fields"
import { formatYearMonth, parseYearMonthParam, periodBoundsFromYearMonth } from "@/lib/budget-month"
import { upsertCategoryBudget, deleteCategoryBudgetById, definirRepeticao } from "@/lib/category-budget-ops"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { parseMoneyBrl, formatMoneyBrlInput } from "@/lib/money-brl"
import { toastError, toastSuccess } from "@/lib/toast"
import { CategoryDetailSkeleton } from "@/components/categories/detail/category-detail-skeleton"
import { CategoryDetailLayout } from "@/components/categories/detail/category-detail-layout"
import { ResumoDoMes } from "@/components/categories/detail/resumo-do-mes"
import { FaixaDoMes } from "@/components/categories/detail/faixa-do-mes"
import { UltimosSeisMeses } from "@/components/categories/detail/resumo/ultimos-seis-meses"
import { InsightsDaCategoria } from "@/components/categories/detail/resumo/insights-da-categoria"
import { DialogoDaRecorrencia } from "@/components/insights/dialogo-da-recorrencia"
import { DoQueEFeitoOMes } from "@/components/categories/detail/do-que-e-feito-o-mes"
import { QuemGastou } from "@/components/categories/detail/quem-gastou"
import { composicaoDoMes, leituraDoMes, quemGastou } from "@/lib/composicao-do-mes"
import { useAdultos } from "@/lib/divisao/use-adultos"
import { useMemberDirectoryQuery } from "@/lib/queries/use-member-directory"
import { useHistoricoDaComposicaoQuery } from "@/lib/queries/use-historico-da-composicao"
import { PARA_ONDE_VAI_ID } from "@/components/dashboard/dashboard-para-onde-vai"
import { CategoryEmbeddedTransactions, LANCAMENTOS_DO_MES_ID } from "@/components/categories/detail/category-embedded-transactions"
import { CategoryDetailDialogs } from "@/components/categories/detail/category-detail-dialogs"
import { MonthNav, useMonthInHeader } from "@/components/categories/categories-toolbar"
import { usePageChromeSlot } from "@/components/layout/page-chrome-provider"
import { ROUTES } from "@/config/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    comparacaoComMesAnterior,
    maioresLancamentos,
    mediaDosMeses,
    serieDosMeses,
} from "@/lib/categoria-detalhe"
import { compromissos } from "@/lib/categoria-resumo"
import {
    insightsDaCaixa,
    insightsLocais,
    ordenarInsights,
    paraQuemLe,
    type InsightDaCategoria,
} from "@/lib/insights-da-categoria"
import { atualizarPrecoDaAssinatura, marcarInsight, statusAoTocarOLink, type Insight } from "@/lib/insights/acoes"
import { useInsightsDaCaixa } from "@/lib/insights/use-insights-da-categoria"
import { receitasDoMesPorCategoria } from "@/lib/categoria-receitas-do-mes"
import { buildCategoryCommitmentsForMonth } from "@/lib/category-commitments"
import { buildCategoryEmbeddedExpenseRows } from "@/lib/category-expense-month-rows"
import { buildCreditCardClosingLookup } from "@/lib/expense-month-attribution"
import { localYmdFromDate } from "@/lib/transaction-date"
import { attachPaymentCards } from "@/lib/transactions-detail-sheet-query"
import { categoryDetailBundleKeys } from "@/lib/queries/keys"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { useCategoryDetailBundleQuery } from "@/lib/queries/use-category-detail-bundle"
import { useTransactionsWorkspaceAuxQuery } from "@/lib/queries/use-transactions-workspace-aux-query"
import { useLancamentosDaCategoria } from "@/components/categories/detail/use-lancamentos-da-categoria"
import { comACategoria } from "@/components/categories/detail/lancamentos-da-categoria-regras"
import {
    corDaCategoria,
    TILE_EXPENSE_DEFAULT,
    TILE_INCOME_DEFAULT,
    tileColorFor,
    tileVividColor,
} from "@/lib/tile-palette"
import { nomeDoMes } from "@/components/categories/detail/regua-do-mes-contas"

export default function CategoryDetailPageClient({ categoryId }: { categoryId: string }) {
    const queryClient = useQueryClient()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, loading: authLoading } = useAuth()
    const { currentWorkspaceId, loading: workspaceLoading, error: workspaceError, isAdulto } = useWorkspace()
    // O convidado (Bloco 7A) só lê: sem editar, excluir nem mexer no orçamento.
    const podeEscrever = isAdulto

    const [yearMonth, setYearMonth] = React.useState(() => formatYearMonth(new Date()))

    React.useEffect(() => {
        const ym = parseYearMonthParam(searchParams?.get("month") ?? null)
        if (ym) {
            setYearMonth((prev) => (prev === ym ? prev : ym))
        }
    }, [searchParams])

    const detailEnabled =
        !authLoading && !workspaceLoading && Boolean(user && currentWorkspaceId)

    const detailQuery = useCategoryDetailBundleQuery({
        workspaceId: currentWorkspaceId,
        userId: user?.id ?? null,
        categoryId,
        yearMonth,
        enabled: detailEnabled,
    })

    const historicoQuery = useHistoricoDaComposicaoQuery({
        workspaceId: currentWorkspaceId,
        categoryId,
        yearMonth,
        enabled: detailEnabled,
    })
    const historico = historicoQuery.data

    const bundle = detailQuery.data
    const category = bundle?.category ?? null
    const budget = bundle?.budget ?? null
    const txs = React.useMemo(() => bundle?.txs ?? [], [bundle?.txs])
    const seriesSource = React.useMemo(
        () => bundle?.seriesSource ?? [],
        [bundle?.seriesSource],
    )
    const workspaceMonthSums = bundle?.workspaceMonthSums ?? { income: 0, expense: 0 }
    const installmentPlans = React.useMemo(
        () => bundle?.installmentPlans ?? [],
        [bundle?.installmentPlans],
    )
    const subscriptions = React.useMemo(
        () => bundle?.subscriptions ?? [],
        [bundle?.subscriptions],
    )
    const creditCards = React.useMemo(
        () => bundle?.creditCards ?? [],
        [bundle?.creditCards],
    )

    const initialLoading = detailQuery.isPending
    const refreshing = detailQuery.isFetching && !detailQuery.isPending

    const handleMonthChange = React.useCallback(
        (nextYm: string) => {
            if (refreshing) return
            setYearMonth(nextYm)
        },
        [refreshing],
    )

    usePageChromeSlot({
        title: category?.name ?? "Detalhes da categoria",
        backHref: category
            ? `${ROUTES.DASHBOARD_CATEGORIES}?month=${encodeURIComponent(yearMonth)}`
            : undefined,
    })
    // No telefone o mês mora no cabeçalho, colado à lupa; no desktop, no `PageHeader`.
    useMonthInHeader({ budgetMonthYm: yearMonth, onBudgetMonthYmChange: handleMonthChange })

    const invalidateDetail = React.useCallback(() => {
        if (!currentWorkspaceId) return
        void queryClient.invalidateQueries({
            queryKey: categoryDetailBundleKeys.bundle(
                currentWorkspaceId,
                categoryId,
                yearMonth,
            ),
        })
    }, [categoryId, currentWorkspaceId, queryClient, yearMonth])

    const [editDialogOpen, setEditDialogOpen] = React.useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
    const [deleteDeleting, setDeleteDeleting] = React.useState(false)
    const [editSaving, setEditSaving] = React.useState(false)
    const [editName, setEditName] = React.useState("")
    const [editType, setEditType] = React.useState<"income" | "expense">("expense")
    const [editColor, setEditColor] = React.useState<string>(CATEGORY_COLORS[0])
    const [editIcon, setEditIcon] = React.useState<CategoryIconId>(CATEGORY_ICONS[0])
    const [editBudgetAmount, setEditBudgetAmount] = React.useState("")
    const [editBudgetRepeats, setEditBudgetRepeats] = React.useState(true)
    const [editBudgetRemoving, setEditBudgetRemoving] = React.useState(false)
    const { confirm: confirmAction, dialog: confirmDialog } = useConfirmDialog()

    const [limitDialogOpen, setLimitDialogOpen] = React.useState(false)
    const preencherLimite = React.useCallback(() => {
        setEditBudgetRemoving(false)
        setEditBudgetAmount(
            category?.type === "expense" && budget
                ? formatMoneyBrlInput(Number(budget.amount))
                : "",
        )
        setEditBudgetRepeats(budget?.repeats ?? true)
    }, [category?.type, budget])
    // Com valor (a sugestão de limite do insight), o campo abre já preenchido com ele.
    const openLimitDialog = React.useCallback(
        (valorInicial?: number) => {
            preencherLimite()
            if (valorInicial != null) setEditBudgetAmount(formatMoneyBrlInput(valorInicial))
            setLimitDialogOpen(true)
        },
        [preencherLimite],
    )
    const openEditDialog = React.useCallback(() => {
        if (!category) return
        preencherLimite()
        setEditName(category.name)
        setEditType(category.type)
        setEditColor(category.color || CATEGORY_COLORS[0])
        setEditIcon(normalizeCategoryIcon(category.icon))
        setEditDialogOpen(true)
    }, [category, preencherLimite])

    const { period_start: periodStart, period_end: periodEnd } = periodBoundsFromYearMonth(yearMonth)

    const txController = useTransactionsListController({
        mode: "embedded",
        lockedCategoryId: categoryId,
        defaultPeriod: {
            fullPeriod: false,
            from: periodStart,
            to: periodEnd,
        },
        initialFilterType: category?.type ?? "all",
        // A lista é a fonte em memória (useLancamentosDaCategoria); o controlador fica com os diálogos.
        skipListQuery: true,
        onWorkspaceDataChanged: () => {
            if (!currentWorkspaceId) return
            void invalidateWorkspaceData(queryClient, currentWorkspaceId, {
                domains: ["transactions"],
            })
        },
    })

    const expenseMonthRows = React.useMemo(() => {
        if (!category || category.type !== "expense") return null
        const posted = attachPaymentCards(txs, txController.creditCards)
        return buildCategoryEmbeddedExpenseRows({
            category,
            yearMonth,
            posted,
            installmentPlans,
            subscriptions,
            creditCards,
        })
    }, [
        category,
        creditCards,
        installmentPlans,
        subscriptions,
        txs,
        txController.creditCards,
        yearMonth,
    ])

    // Mesma chave do controlador: o cache já tem as faturas pagas, nada é buscado a mais.
    const auxQuery = useTransactionsWorkspaceAuxQuery(currentWorkspaceId, Boolean(currentWorkspaceId))
    const invoicePayments = React.useMemo(() => auxQuery.data?.invoicePayments ?? [], [auxQuery.data?.invoicePayments])
    const linhasDoMes = React.useMemo(
        () => comACategoria(expenseMonthRows ?? attachPaymentCards(txs, txController.creditCards), category),
        [expenseMonthRows, txs, txController.creditCards, category],
    )
    const { openTransactionDetail } = txController
    const abrirDetalhe = React.useCallback(
        (t: Transaction, o?: { editar?: boolean }) => openTransactionDetail(t, { edit: o?.editar }),
        [openTransactionDetail],
    )
    const lancamentos = useLancamentosDaCategoria({
        linhas: linhasDoMes,
        yearMonth,
        carregando: detailQuery.isPending,
        categories: txController.categories,
        invoicePayments,
        abrirDetalhe,
    })

    /** O orçamento do mês, o mesmo no editar e no diálogo do limite. Falhou: avisa e devolve `false`. */
    const salvarLimite = React.useCallback(async (): Promise<boolean> => {
        if (!user || !currentWorkspaceId) return false
        const raw = editBudgetAmount.trim()
        // Sem valor novo o upsert não roda: só a repetição do orçamento já salvo muda.
        if (raw.length === 0 && budget && budget.repeats !== editBudgetRepeats) {
            const r = await definirRepeticao(budget.id, editBudgetRepeats)
            if (!r.ok) {
                toastError(r.erro ?? "Não foi possível salvar o orçamento", { id: "salvar-categoria" })
                return false
            }
        }
        if (raw.length > 0) {
            const amt = parseMoneyBrl(editBudgetAmount)
            if (amt === null || amt <= 0) {
                toastError("Informe um valor válido em reais, maior que zero", { id: "salvar-categoria" })
                return false
            }
            const { error: budErr } = await upsertCategoryBudget({
                userId: user.id,
                workspaceId: currentWorkspaceId,
                categoryId,
                yearMonth,
                amount: amt,
                previousAmount: budget ? Number(budget.amount) : null,
                repeats: editBudgetRepeats,
            })
            if (budErr) {
                toastError(
                    formatSupabasePostgrestError(budErr) ?? "Não foi possível salvar o orçamento",
                    { id: "salvar-categoria" },
                )
                return false
            }
        }
        return true
    }, [user, currentWorkspaceId, editBudgetAmount, editBudgetRepeats, budget, categoryId, yearMonth])

    const handleLimitSubmit = React.useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault()
            setEditSaving(true)
            const ok = await salvarLimite()
            setEditSaving(false)
            if (!ok) return
            setLimitDialogOpen(false)
            invalidateDetail()
        },
        [salvarLimite, invalidateDetail],
    )

    const handleEditSubmit = React.useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault()
            if (!user || !currentWorkspaceId) return
            // Receita não tem orçamento: virar receita apaga os orçamentos da
            // categoria, que antes ficavam órfãos somando nos totais de despesa.
            const becomesIncome = category?.type === "expense" && editType === "income"
            if (becomesIncome) {
                const ok = await confirmAction({
                    title: "Transformar em receita?",
                    description: "Os orçamentos desta categoria são apagados.",
                    actionLabel: "Transformar",
                })
                if (!ok) return
            }
            setEditSaving(true)
            const { error } = await supabase
                .from("categories")
                .update({
                    name: editName,
                    type: editType,
                    color: editColor,
                    icon: editIcon,
                })
                .eq("id", categoryId)
            if (error) {
                setEditSaving(false)
                toastError(
                    formatSupabasePostgrestError(error) ?? "Não foi possível salvar a categoria",
                    { id: "salvar-categoria" },
                )
                return
            }

            if (becomesIncome) {
                const { error: budgetsError } = await supabase
                    .from("budgets")
                    .delete()
                    .eq("workspace_id", currentWorkspaceId)
                    .eq("category_id", categoryId)
                if (budgetsError) {
                    setEditSaving(false)
                    toastError(
                        "A categoria virou receita, mas os orçamentos antigos não foram apagados. Tente de novo.",
                        { id: "salvar-categoria" },
                    )
                    invalidateDetail()
                    return
                }
            }

            if (editType === "expense" && !(await salvarLimite())) {
                setEditSaving(false)
                return
            }

            setEditSaving(false)
            setEditDialogOpen(false)
            invalidateDetail()
        },
        [
            user,
            currentWorkspaceId,
            categoryId,
            editName,
            editType,
            editColor,
            editIcon,
            salvarLimite,
            invalidateDetail,
            category?.type,
            confirmAction,
        ],
    )

    const handleEditBudgetRemove = React.useCallback(async () => {
        // O guarda da carteira vinha depois do `setEditBudgetRemoving(true)` e
        // deixava o botão preso em "removendo".
        if (!budget || !user || !currentWorkspaceId) return
        const ok = await confirmAction({
            title: "Remover o orçamento?",
            description: "O orçamento desta categoria para este período deixa de existir.",
            actionLabel: "Remover",
        })
        if (!ok) return
        setEditBudgetRemoving(true)
        const { error: delErr } = await deleteCategoryBudgetById(
            budget.id,
            currentWorkspaceId
        )
        setEditBudgetRemoving(false)
        if (delErr) {
            toastError(
                formatSupabasePostgrestError(delErr) ?? "Não foi possível remover o orçamento",
                { id: "remover-orcamento" },
            )
            return
        }
        setEditBudgetAmount("")
        setEditDialogOpen(false)
        setLimitDialogOpen(false)
        invalidateDetail()
    }, [budget, user, currentWorkspaceId, confirmAction, invalidateDetail])

    const handleDeleteDialogOpenChange = React.useCallback((open: boolean) => {
        if (!open && deleteDeleting) return
        setDeleteDialogOpen(open)
    }, [deleteDeleting])

    const handleDeleteConfirmed = React.useCallback(async () => {
        setDeleteDeleting(true)
        const { error } = await supabase.from("categories").delete().eq("id", categoryId)
        setDeleteDeleting(false)
        if (error) {
            toastError(
                formatSupabasePostgrestError(error) ?? "Não foi possível excluir a categoria",
                { id: "excluir-categoria" },
            )
            return
        }
        setDeleteDialogOpen(false)
        router.push(ROUTES.DASHBOARD_CATEGORIES)
    }, [categoryId, router])

    React.useEffect(() => {
        if (!category?.name) return
        document.title = `${category.name} · Categorias · Finance App`
        return () => {
            document.title = "Finance App - Controle de Finanças"
        }
    }, [category?.name])

    const tipo = category?.type ?? "expense"
    const hojeYmd = localYmdFromDate(new Date())
    const aberto = yearMonth === hojeYmd.slice(0, 7)
    const lookup = React.useMemo(() => buildCreditCardClosingLookup(creditCards), [creditCards])

    // Despesa: o lançado e o previsto de `buildCategoryCommitmentsForMonth` (o mesmo
    // do aviso de orçamento). Receita: a conta da lista de Categorias.
    const mes = React.useMemo(() => {
        if (tipo === "income") {
            const r = receitasDoMesPorCategoria({ yearMonth, hojeYmd, transactions: txs, subscriptions })[categoryId]
            return { lancado: r?.recebido ?? 0, previsto: r?.previsto ?? 0 }
        }
        const m = buildCategoryCommitmentsForMonth({
            yearMonth,
            transactions: txs,
            installmentPlans,
            subscriptions,
            creditCards,
        })[categoryId]
        return {
            lancado: m?.postedTotal ?? 0,
            previsto: (m?.projectedInstallmentsTotal ?? 0) + (m?.projectedSubscriptionsTotal ?? 0),
        }
    }, [tipo, yearMonth, hojeYmd, txs, subscriptions, installmentPlans, creditCards, categoryId])

    const limite = tipo === "expense" && budget ? Number(budget.amount) : null
    const totalDaCarteira = tipo === "income" ? workspaceMonthSums.income : workspaceMonthSums.expense
    const pesoNoTotal = totalDaCarteira > 0 ? mes.lancado / totalDaCarteira : null

    const caixa = useInsightsDaCaixa(currentWorkspaceId)
    const [recorrencia, setRecorrencia] = React.useState<Insight | null>(null)

    const analise = React.useMemo(() => {
        if (!category) return null
        const media = mediaDosMeses({ rows: seriesSource, tipo, yearMonth, lookup, criadaEm: category.created_at })
        const c = compromissos({ categoryId, parcelas: installmentPlans, assinaturas: subscriptions, hojeYmd })
        // Os locais e os da caixa da carteira, só os desta categoria e só os que o leitor pode usar.
        const insights = ordenarInsights(
            paraQuemLe(
                [
                    ...insightsLocais({ tipo, categoryId, yearMonth, aberto, lancado: mes.lancado, previsto: mes.previsto, media, limite, txs, compromissos: c }),
                    ...insightsDaCaixa(caixa.linhas, { categoryId, assinaturas: subscriptions, txs }),
                ],
                podeEscrever,
            ),
        )
        // Sem o histórico (carregando ou falhou), o bloco espera: a frase sairia sem o normal.
        const composicao = historico
            ? composicaoDoMes({
                  txsDoMes: txs,
                  historico,
                  tipo,
                  yearMonth,
                  lookup,
                  parcelas: installmentPlans,
                  assinaturas: subscriptions,
                  categoryId,
                  media,
                  criadaEm: category.created_at,
              })
            : null
        return {
            composicao,
            leitura: composicao ? leituraDoMes(composicao, tipo === "expense", yearMonth, aberto) : null,
            quem: quemGastou(txs, tipo),
            comparacao: comparacaoComMesAnterior({ rows: seriesSource, tipo, yearMonth, hojeYmd, lookup }),
            media,
            maior: maioresLancamentos(txs, tipo, 1)[0] ?? null,
            serie: serieDosMeses(seriesSource, tipo, yearMonth, lookup),
            insights,
        }
    }, [
        aberto,
        caixa.linhas,
        category,
        categoryId,
        historico,
        hojeYmd,
        installmentPlans,
        limite,
        lookup,
        mes,
        podeEscrever,
        seriesSource,
        subscriptions,
        tipo,
        txs,
        yearMonth,
    ])

    const isMobile = useIsMobile()
    // "Quem gastou" só na carteira com dois adultos ou mais, e nunca para o convidado.
    const adultos = useAdultos(isAdulto && currentWorkspaceId ? currentWorkspaceId : "")
    const comVariosAdultos = adultos.lista.length >= 2
    const diretorio = useMemberDirectoryQuery(comVariosAdultos ? currentWorkspaceId : null).data ?? []

    const rolarParaLancamentos = React.useCallback(() => {
        document.getElementById(LANCAMENTOS_DO_MES_ID)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, [])
    const { filtrarPorDescricao, ordenarPorValor } = lancamentos
    const { linhas: linhasDaCaixa, recarregar: recarregarCaixa } = caixa
    // Cada ação liga ao que a página já tem; os links (Previsão, conferir) o cartão resolve sozinho.
    const onAcaoDoInsight = React.useCallback(
        (i: InsightDaCategoria): Promise<void> | void => {
            const a = i.acao
            const daCaixa = "insightId" in a ? linhasDaCaixa.find((l) => l.id === a.insightId) : undefined
            switch (a.tipo) {
                case "limite":
                    openLimitDialog(a.valor)
                    return
                case "filtrar":
                    filtrarPorDescricao(a.descricao)
                    rolarParaLancamentos()
                    return
                case "ordenar-por-valor":
                    ordenarPorValor()
                    rolarParaLancamentos()
                    return
                case "conta-a-pagar":
                    if (daCaixa) void marcarInsight(daCaixa.id, statusAoTocarOLink(daCaixa.kind))
                    router.push("/bills?new=1")
                    return
                case "recorrencia":
                    if (daCaixa) setRecorrencia(daCaixa)
                    return
                case "atualizar-preco": {
                    if (!daCaixa) return
                    // `atualizarPrecoDaAssinatura` já marca o insight `acted` depois de gravar.
                    return atualizarPrecoDaAssinatura(daCaixa).then(async (r) => {
                        if (!r.ok) {
                            if (r.erro) toastError(r.erro, { id: "insight-preco" })
                            return
                        }
                        toastSuccess("Valor da assinatura atualizado", { id: "insight-preco" })
                        await recarregarCaixa()
                    })
                }
            }
        },
        [linhasDaCaixa, openLimitDialog, recarregarCaixa, rolarParaLancamentos, router, filtrarPorDescricao, ordenarPorValor],
    )
    const categoriasDaRecorrencia = React.useMemo(
        () => txController.categories.filter((c) => c.type === "expense").map((c) => ({ id: c.id, name: c.name })),
        [txController.categories],
    )

    if (workspaceError) {
        return (
            <Card>
                <CardMessage tone="destructive">{workspaceError}</CardMessage>
            </Card>
        )
    }

    if (!authLoading && !workspaceLoading && !currentWorkspaceId) {
        return (
            <Card>
                <CardMessage>
                    Nenhuma carteira selecionada. Escolha uma carteira no menu lateral para continuar.
                </CardMessage>
            </Card>
        )
    }

    const pageReady = !initialLoading && !txController.loading

    if (!pageReady) {
        return <CategoryDetailSkeleton />
    }

    if (!category) {
        return (
            <Card>
                <CardMessage>
                    Categoria não encontrada.
                </CardMessage>
            </Card>
        )
    }

    if (!user || !currentWorkspaceId) {
        return null
    }

    const abrirMenu = podeEscrever ? (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {/* No desktop o ⋯ mora ao lado da pílula do mês (36): a mesma altura, sem fundo, para alinhar sem competir com ela. */}
                <Button
                    type="button"
                    variant="tertiary"
                    size={isMobile ? "icon-md" : "icon-lg"}
                    aria-label={`Opções da categoria ${category.name}`}
                >
                    <EllipsisHorizontalIcon aria-hidden />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" size="sm">
                <DropdownMenuItem onSelect={openEditDialog}>
                    <PencilIcon aria-hidden />
                    Editar
                </DropdownMenuItem>
                {category.type === "expense" ? (
                    <DropdownMenuItem onSelect={() => openLimitDialog()}>
                        <BanknotesIcon aria-hidden />
                        {budget ? "Editar limite" : "Definir limite"}
                    </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem variant="destructive" onSelect={() => setDeleteDialogOpen(true)}>
                    <TrashIcon aria-hidden />
                    Excluir
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    ) : null

    const comComposicao = Boolean(analise?.composicao) && txs.length > 0
    const mesesNode = analise ? (
        <UltimosSeisMeses
            tipo={tipo}
            cor={category.color}
            nomeDaCategoria={category.name}
            yearMonth={yearMonth}
            aberto={aberto}
            serie={analise.serie}
            media={analise.media}
            limite={limite}
        />
    ) : null

    return (
        <div className="flex min-w-0 max-w-full flex-col gap-6">
            {confirmDialog}
            {isMobile ? null : (
                <PageHeader collapse>
                    <PageHeaderTitleRow
                        back={`${ROUTES.DASHBOARD_CATEGORIES}?month=${encodeURIComponent(yearMonth)}`}
                        backLabel="Voltar para Categorias"
                        media={
                            <ColorTile color={tileColorFor(category.color) || (category.type === "income" ? TILE_INCOME_DEFAULT : TILE_EXPENSE_DEFAULT)}>
                                <CategoryIconPreview name={normalizeCategoryIcon(category.icon)} />
                            </ColorTile>
                        }
                    >
                        <PageHeaderTitle asChild>
                            {/* O `<h1>` da página é o da barra do topo. */}
                            <p aria-hidden="true">{category.name}</p>
                        </PageHeaderTitle>
                    </PageHeaderTitleRow>
                    <PageHeaderActions>
                        <MonthNav budgetMonthYm={yearMonth} onBudgetMonthYmChange={handleMonthChange} dense />
                        {abrirMenu}
                    </PageHeaderActions>
                </PageHeader>
            )}

            <CategoryDetailLayout
                resumo={
                    isMobile || !analise ? (
                        <ResumoDoMes
                            tipo={tipo}
                            yearMonth={yearMonth}
                            lancado={mes.lancado}
                            previsto={mes.previsto}
                            limite={limite}
                            pesoNoTotal={pesoNoTotal}
                            aberto={aberto}
                            acoes={isMobile ? abrirMenu : undefined}
                            destaque={!isMobile}
                        />
                    ) : (
                        <FaixaDoMes
                            tipo={tipo}
                            yearMonth={yearMonth}
                            aberto={aberto}
                            hojeYmd={hojeYmd}
                            lancado={mes.lancado}
                            previsto={mes.previsto}
                            limite={limite}
                            pesoNoTotal={pesoNoTotal}
                            comparacao={analise.comparacao}
                            media={analise.media}
                            maior={analise.maior}
                        />
                    )
                }
                composicao={
                    comComposicao && analise?.composicao && analise.leitura ? (
                        <DoQueEFeitoOMes
                            categoryId={categoryId}
                            composicao={analise.composicao}
                            leitura={analise.leitura}
                            despesa={tipo === "expense"}
                            yearMonth={yearMonth}
                            corDaSerie={tileVividColor(
                                tileColorFor(category.color) ?? (tipo === "income" ? TILE_INCOME_DEFAULT : TILE_EXPENSE_DEFAULT),
                            )}
                            aoLado={mesesNode}
                            onVer={(nome) => {
                                filtrarPorDescricao(nome)
                                rolarParaLancamentos()
                            }}
                        />
                    ) : null
                }
                quem={
                    analise && comVariosAdultos ? (
                        <QuemGastou
                            pessoas={analise.quem}
                            diretorio={diretorio}
                            despesa={tipo === "expense"}
                            categoryId={categoryId}
                            yearMonth={yearMonth}
                        />
                    ) : null
                }
                meses={comComposicao ? null : mesesNode}
                insight={
                    analise && analise.insights.length > 0 ? (
                        <InsightsDaCategoria
                            insights={analise.insights}
                            onAcao={onAcaoDoInsight}
                            linhasDaCaixa={linhasDaCaixa}
                            corDaSerie={tileVividColor(
                                tileColorFor(category.color) ?? (tipo === "income" ? TILE_INCOME_DEFAULT : TILE_EXPENSE_DEFAULT),
                            )}
                        />
                    ) : null
                }
                lancamentos={
                    <CategoryEmbeddedTransactions
                        categoryId={categoryId}
                        categoryName={category.name}
                        categoryType={category.type}
                        yearMonth={yearMonth}
                        linhas={linhasDoMes}
                        carregando={detailQuery.isPending}
                        controller={txController}
                        lancamentos={lancamentos}
                    />
                }
                analise={
                    // A análise da carteira mora no Painel: a ponte abre a seção já filtrada. Só despesa, só o adulto.
                    // O cartão diz o que tem do outro lado, para a pessoa saber por que abrir (25/11/2026; era um link solto).
                    tipo === "expense" && isAdulto ? (
                        <Card padding="sm">
                            {/* Uma linha só (25/11/2026): o título e, em cinza, o que tem lá; no telefone o cinza some
                                e o botão encurta para "Abrir", para a linha caber. */}
                            <div className="flex items-center gap-3 px-(--card-px)">
                                <ColorTile size="md" tint="tonal" color={corDaCategoria(category)}>
                                    <PresentationChartLineIcon aria-hidden />
                                </ColorTile>
                                <p className="min-w-0 flex-1 truncate text-sm">
                                    <span className="font-semibold text-foreground">
                                        Entenda {category.name}
                                        {/* No telefone o mês já está no cabeçalho, e a linha não cabia. */}
                                        <span className="max-md:hidden"> em {nomeDoMes(yearMonth)}</span>
                                    </span>
                                    <span className="text-muted-foreground max-md:hidden">
                                        {" "}
                                        · ritmo, pagamento, dias e tamanho das compras
                                    </span>
                                </p>
                                <Button asChild variant="secondary" size="md" className="shrink-0">
                                    <Link
                                        href={`${ROUTES.DASHBOARD}?categoria=${encodeURIComponent(categoryId)}&month=${yearMonth}#${PARA_ONDE_VAI_ID}`}
                                        aria-label={`Abrir a análise de ${category.name} no Painel`}
                                    >
                                        <span>
                                            Abrir<span className="max-md:hidden"> análise</span>
                                        </span>
                                        <ChevronRightIcon aria-hidden data-icon="inline-end" />
                                    </Link>
                                </Button>
                            </div>
                        </Card>
                    ) : null
                }
            />

            <CategoryDetailDialogs
                category={category}
                yearMonth={yearMonth}
                budget={budget}
                editDialogOpen={editDialogOpen}
                onEditDialogOpenChange={setEditDialogOpen}
                editName={editName}
                onEditNameChange={setEditName}
                editType={editType}
                onEditTypeChange={setEditType}
                editColor={editColor}
                onEditColorChange={setEditColor}
                editIcon={editIcon}
                onEditIconChange={setEditIcon}
                editBudgetAmount={editBudgetAmount}
                onEditBudgetAmountChange={setEditBudgetAmount}
                editBudgetRepeats={editBudgetRepeats}
                onEditBudgetRepeatsChange={setEditBudgetRepeats}
                editSaving={editSaving}
                editBudgetRemoving={editBudgetRemoving}
                onEditBudgetRemove={handleEditBudgetRemove}
                onEditSubmit={handleEditSubmit}
                limitDialogOpen={limitDialogOpen}
                onLimitDialogOpenChange={setLimitDialogOpen}
                onLimitSubmit={handleLimitSubmit}
                deleteDialogOpen={deleteDialogOpen}
                onDeleteDialogOpenChange={handleDeleteDialogOpenChange}
                deleteDeleting={deleteDeleting}
                onDeleteConfirm={handleDeleteConfirmed}
            />
            <DialogoDaRecorrencia
                insight={recorrencia}
                categorias={categoriasDaRecorrencia}
                onFechar={() => setRecorrencia(null)}
                onFeito={() => {
                    setRecorrencia(null)
                    void recarregarCaixa()
                }}
            />
        </div>
    )
}
