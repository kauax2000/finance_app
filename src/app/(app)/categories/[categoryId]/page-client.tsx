"use client"

import { useConfirmDialog } from "@/components/use-confirm-dialog"
import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { useTransactionsListController } from "@/components/transactions/use-transactions-list-controller"
import { supabase } from "@/lib/supabase"
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
import { BanknotesIcon, ChevronRightIcon, EllipsisHorizontalIcon, PencilIcon, TrashIcon } from "@heroicons/react/16/solid"
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
import { toastError } from "@/lib/toast"
import { CategoryDetailSkeleton } from "@/components/categories/detail/category-detail-skeleton"
import { CategoryDetailLayout } from "@/components/categories/detail/category-detail-layout"
import { ResumoDoMes } from "@/components/categories/detail/resumo-do-mes"
import { FaixaDoMes } from "@/components/categories/detail/faixa-do-mes"
import { UltimosSeisMeses } from "@/components/categories/detail/resumo/ultimos-seis-meses"
import { InsightDaCategoria } from "@/components/categories/detail/resumo/insight-da-categoria"
import { DoQueEFeitoOMes } from "@/components/categories/detail/do-que-e-feito-o-mes"
import { QuemGastou } from "@/components/categories/detail/quem-gastou"
import { composicaoDoMes, fraseDaComposicao, quemGastou } from "@/lib/composicao-do-mes"
import { useAdultos } from "@/lib/divisao/use-adultos"
import { useMemberDirectoryQuery } from "@/lib/queries/use-member-directory"
import { useHistoricoDaComposicaoQuery } from "@/lib/queries/use-historico-da-composicao"
import { PARA_ONDE_VAI_ID } from "@/components/dashboard/dashboard-para-onde-vai"
import { CategoryEmbeddedTransactions } from "@/components/categories/detail/category-embedded-transactions"
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
import { compromissos, insights } from "@/lib/categoria-resumo"
import { receitasDoMesPorCategoria } from "@/lib/categoria-receitas-do-mes"
import { buildCategoryCommitmentsForMonth } from "@/lib/category-commitments"
import { buildCategoryEmbeddedExpenseRows } from "@/lib/category-expense-month-rows"
import { buildCreditCardClosingLookup } from "@/lib/expense-month-attribution"
import { localYmdFromDate } from "@/lib/transaction-date"
import { attachPaymentCards } from "@/lib/transactions-detail-sheet-query"
import { categoryDetailBundleKeys } from "@/lib/queries/keys"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { useCategoryDetailBundleQuery } from "@/lib/queries/use-category-detail-bundle"
import {
    TILE_EXPENSE_DEFAULT,
    TILE_INCOME_DEFAULT,
    tileColorFor,
    tileVividColor,
} from "@/lib/tile-palette"

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
    const openLimitDialog = React.useCallback(() => {
        preencherLimite()
        setLimitDialogOpen(true)
    }, [preencherLimite])
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
        skipListQuery: category == null || category.type === "expense",
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

    const analise = React.useMemo(() => {
        if (!category) return null
        const media = mediaDosMeses({ rows: seriesSource, tipo, yearMonth, lookup, criadaEm: category.created_at })
        const c = compromissos({ categoryId, parcelas: installmentPlans, assinaturas: subscriptions, hojeYmd })
        // Um insight só: o primeiro que leva a uma ação (definir limite, ou a parcela que termina).
        const insight = insights({ tipo, lancado: mes.lancado, media, limite, txs, compromissos: c }).find((i) => i.acao) ?? null
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
            frase: composicao ? fraseDaComposicao(composicao, tipo === "expense") : [],
            quem: quemGastou(txs, tipo),
            comparacao: comparacaoComMesAnterior({ rows: seriesSource, tipo, yearMonth, hojeYmd, lookup }),
            media,
            maior: maioresLancamentos(txs, tipo, 1)[0] ?? null,
            serie: serieDosMeses(seriesSource, tipo, yearMonth, lookup),
            // O convidado não mexe no limite: a sugestão fica, sem o botão.
            insight: insight?.acao === "limite" && !podeEscrever ? { ...insight, acao: undefined } : insight,
        }
    }, [
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
                    <DropdownMenuItem onSelect={openLimitDialog}>
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

    const totalLancamentos = expenseMonthRows?.length ?? txController.totalCount ?? 0

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
                            quantidade={totalLancamentos}
                            maior={analise.maior}
                        />
                    )
                }
                composicao={
                    analise?.composicao && txs.length > 0 ? (
                        <DoQueEFeitoOMes
                            composicao={analise.composicao}
                            frase={analise.frase}
                            despesa={tipo === "expense"}
                            yearMonth={yearMonth}
                            corDaSerie={tileVividColor(
                                tileColorFor(category.color) ?? (tipo === "income" ? TILE_INCOME_DEFAULT : TILE_EXPENSE_DEFAULT),
                            )}
                        />
                    ) : null
                }
                quem={
                    analise && comVariosAdultos ? (
                        <QuemGastou pessoas={analise.quem} diretorio={diretorio} despesa={tipo === "expense"} />
                    ) : null
                }
                meses={
                    analise ? (
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
                }
                insight={
                    analise?.insight ? (
                        <InsightDaCategoria insight={analise.insight} onDefinirLimite={openLimitDialog} />
                    ) : null
                }
                lancamentos={
                    <CategoryEmbeddedTransactions
                        categoryType={category.type}
                        controller={txController}
                        expenseMonthRows={expenseMonthRows}
                        yearMonth={yearMonth}
                        forma="tabela"
                    />
                }
                analise={
                    // A análise da carteira mora no Painel: a ponte abre a seção já filtrada. Só despesa, só o adulto.
                    tipo === "expense" && isAdulto ? (
                        <Button asChild variant="link">
                            <Link href={`${ROUTES.DASHBOARD}?categoria=${encodeURIComponent(categoryId)}&month=${yearMonth}#${PARA_ONDE_VAI_ID}`}>
                                <span>Ver a análise de {category.name} no Painel</span>
                                <ChevronRightIcon aria-hidden />
                            </Link>
                        </Button>
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
        </div>
    )
}
