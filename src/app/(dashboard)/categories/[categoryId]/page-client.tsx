"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { useTransactionsListController } from "@/components/transactions/use-transactions-list-controller"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import {
    CATEGORY_COLORS,
    CATEGORY_ICONS,
    normalizeCategoryIcon,
    type CategoryIconId,
} from "@/components/categories/category-appearance-fields"
import { formatYearMonth, periodBoundsFromYearMonth } from "@/lib/budget-month"
import { upsertCategoryBudget, deleteCategoryBudgetById } from "@/lib/category-budget-ops"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { parseMoneyBrl, formatMoneyBrlInput } from "@/lib/money-brl"
import { toastError } from "@/lib/toast"
import { CategoryDetailSkeleton } from "@/components/categories/detail/category-detail-skeleton"
import { CategoryDetailHero } from "@/components/categories/detail/category-detail-hero"
import { CategoryDetailSummarySection } from "@/components/categories/detail/category-detail-summary-section"
import { CategoryDetailTrends } from "@/components/categories/detail/category-detail-trends"
import { CategoryEmbeddedTransactions } from "@/components/categories/detail/category-embedded-transactions"
import { CategoryDetailDialogs } from "@/components/categories/detail/category-detail-dialogs"
import { MonthNav } from "@/components/categories/categories-toolbar"
import { usePageChromeSlot } from "@/components/layout/page-chrome-provider"
import { ROUTES } from "@/config/navigation"
import { computeAmountStats } from "@/components/categories/detail/category-detail-utils"
import { buildCategoryCommitmentsForMonth } from "@/lib/category-commitments"
import { categoryDetailBundleKeys } from "@/lib/queries/keys"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { useCategoryDetailBundleQuery } from "@/lib/queries/use-category-detail-bundle"

export default function CategoryDetailPageClient({ categoryId }: { categoryId: string }) {
    const queryClient = useQueryClient()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, loading: authLoading } = useAuth()
    const { currentWorkspaceId, loading: workspaceLoading, error: workspaceError } = useWorkspace()

    const [yearMonth, setYearMonth] = React.useState(() => formatYearMonth(new Date()))

    const monthParam = searchParams.get("month")
    React.useEffect(() => {
        if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
            setYearMonth(monthParam)
        }
    }, [monthParam])

    const detailEnabled =
        !authLoading && !workspaceLoading && Boolean(user && currentWorkspaceId)

    const detailQuery = useCategoryDetailBundleQuery({
        workspaceId: currentWorkspaceId,
        userId: user?.id ?? null,
        categoryId,
        yearMonth,
        enabled: detailEnabled,
    })

    const bundle = detailQuery.data
    const category = bundle?.category ?? null
    const budget = bundle?.budget ?? null
    const txs = React.useMemo(() => bundle?.txs ?? [], [bundle?.txs])
    const seriesSource = React.useMemo(
        () => bundle?.seriesSource ?? [],
        [bundle?.seriesSource],
    )
    const workspaceMonthSums = bundle?.workspaceMonthSums ?? { income: 0, expense: 0 }
    const prevMonthCategoryTotal = bundle?.prevMonthCategoryTotal ?? 0
    const installmentPlans = React.useMemo(
        () => bundle?.installmentPlans ?? [],
        [bundle?.installmentPlans],
    )
    const subscriptions = React.useMemo(
        () => bundle?.subscriptions ?? [],
        [bundle?.subscriptions],
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

    const categoryDetailDateFilter = React.useMemo(
        () => (
            <MonthNav
                budgetMonthYm={yearMonth}
                onBudgetMonthYmChange={handleMonthChange}
                dense
            />
        ),
        [yearMonth, handleMonthChange],
    )
    usePageChromeSlot({
        title: "Detalhes da categoria",
        backHref: category ? ROUTES.DASHBOARD_CATEGORIES : undefined,
        dateFilter: category ? categoryDetailDateFilter : undefined,
    })

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
    const [editBudgetRemoving, setEditBudgetRemoving] = React.useState(false)

    const openEditDialog = React.useCallback(() => {
        if (!category) return
        setEditBudgetRemoving(false)
        setEditName(category.name)
        setEditType(category.type)
        setEditColor(category.color || CATEGORY_COLORS[0])
        setEditIcon(normalizeCategoryIcon(category.icon))
        setEditBudgetAmount(
            category.type === "expense" && budget
                ? formatMoneyBrlInput(Number(budget.amount))
                : "",
        )
        setEditDialogOpen(true)
    }, [category, budget])

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
        expenseMonthAttribution:
            category?.type === "expense" ? { yearMonth } : undefined,
        onWorkspaceDataChanged: () => {
            if (!currentWorkspaceId) return
            void invalidateWorkspaceData(queryClient, currentWorkspaceId, {
                domains: ["transactions"],
            })
        },
    })

    const handleEditSubmit = React.useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault()
            if (!user || !currentWorkspaceId) return
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
                    formatSupabasePostgrestError(error) ??
                        "Não foi possível salvar a categoria. Tente novamente.",
                )
                return
            }

            if (editType === "expense") {
                const raw = editBudgetAmount.trim()
                if (raw.length > 0) {
                    const amt = parseMoneyBrl(editBudgetAmount)
                    if (amt === null || amt <= 0) {
                        setEditSaving(false)
                        toastError("Informe um valor válido em reais, maior que zero.")
                        return
                    }
                    const { error: budErr } = await upsertCategoryBudget({
                        userId: user.id,
                        workspaceId: currentWorkspaceId,
                        categoryId,
                        yearMonth,
                        amount: amt,
                    })
                    if (budErr) {
                        setEditSaving(false)
                        toastError(
                            formatSupabasePostgrestError(budErr) ??
                                "Não foi possível salvar o orçamento.",
                        )
                        return
                    }
                }
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
            editBudgetAmount,
            yearMonth,
            invalidateDetail,
        ],
    )

    const handleEditBudgetRemove = React.useCallback(async () => {
        if (!budget || !user) return
        if (!confirm("Remover o orçamento desta categoria para este período?")) return
        setEditBudgetRemoving(true)
        if (!currentWorkspaceId) return
        const { error: delErr } = await deleteCategoryBudgetById(
            budget.id,
            currentWorkspaceId
        )
        setEditBudgetRemoving(false)
        if (delErr) {
            toastError(
                formatSupabasePostgrestError(delErr) ?? "Não foi possível remover o orçamento.",
            )
            return
        }
        setEditBudgetAmount("")
        setEditDialogOpen(false)
        invalidateDetail()
    }, [budget, user, invalidateDetail])

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
                formatSupabasePostgrestError(error) ??
                    "Não foi possível excluir a categoria. Tente novamente.",
            )
            return
        }
        setDeleteDialogOpen(false)
        router.push("/categories")
    }, [categoryId, router])

    React.useEffect(() => {
        if (!category?.name) return
        document.title = `${category.name} · Categorias · Finance App`
        return () => {
            document.title = "Finance App - Controle de Finanças"
        }
    }, [category?.name])

    const typeFilter: "income" | "expense" | null = category?.type ?? null
    const postedMonthTotal = txs
        .filter((t) => (typeFilter ? t.type === typeFilter : true))
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const commitment = React.useMemo(() => {
        if (!category || category.type !== "expense") {
            return {
                postedTotal: postedMonthTotal,
                projectedInstallmentsTotal: 0,
                projectedSubscriptionsTotal: 0,
                committedTotal: postedMonthTotal,
            }
        }
        const m = buildCategoryCommitmentsForMonth({
            yearMonth,
            transactions: txs,
            installmentPlans,
            subscriptions,
        })
        return (
            m[categoryId] ?? {
                postedTotal: postedMonthTotal,
                projectedInstallmentsTotal: 0,
                projectedSubscriptionsTotal: 0,
                committedTotal: postedMonthTotal,
            }
        )
    }, [category, categoryId, installmentPlans, subscriptions, txs, yearMonth, postedMonthTotal])

    const monthTotal = commitment.committedTotal
    const limit = budget ? Number(budget.amount) : 0
    const remaining = limit > 0 ? limit - monthTotal : 0
    const overBudget = limit > 0 && monthTotal > limit

    const accentColor = category?.color || (category?.type === "income" ? "#10B981" : "#EF4444")

    const amounts = txs
        .filter((t) => (typeFilter ? t.type === typeFilter : true))
        .map((t) => Number(t.amount))
        .filter((n) => Number.isFinite(n))
    const stats = computeAmountStats(amounts)

    const workspaceTypeTotal =
        category?.type === "income" ? workspaceMonthSums.income : workspaceMonthSums.expense

    if (workspaceError) {
        return (
            <Card>
                <CardContent className="py-8 text-sm text-red-500">{workspaceError}</CardContent>
            </Card>
        )
    }

    if (!authLoading && !workspaceLoading && !currentWorkspaceId) {
        return (
            <Card>
                <CardContent className="py-8 text-sm text-muted-foreground">
                    Nenhuma carteira selecionada. Escolha uma carteira no menu lateral para continuar.
                </CardContent>
            </Card>
        )
    }

    const pageReady = !initialLoading && !txController.loading

    if (!pageReady) {
        const hint = searchParams.get("type")
        const typeHint = hint === "income" || hint === "expense" ? hint : null
        return <CategoryDetailSkeleton categoryType={category?.type ?? typeHint ?? null} />
    }

    if (!category) {
        return (
            <Card>
                <CardContent className="py-8 text-sm text-muted-foreground">
                    Categoria não encontrada.
                </CardContent>
            </Card>
        )
    }

    if (!user || !currentWorkspaceId) {
        return null
    }

    return (
        <div className="min-w-0 max-w-full space-y-5">
            <CategoryDetailHero
                category={category}
                accentColor={accentColor}
                onEdit={openEditDialog}
                onDelete={() => setDeleteDialogOpen(true)}
                monthToolbar={
                    <div className="hidden md:contents">
                        <MonthNav
                            budgetMonthYm={yearMonth}
                            onBudgetMonthYmChange={handleMonthChange}
                            dense
                        />
                    </div>
                }
            />

            <div className="space-y-5">
                <CategoryDetailSummarySection
                    category={category}
                    monthTotal={monthTotal}
                    postedMonthTotal={commitment.postedTotal}
                    projectedMonthTotal={
                        commitment.projectedInstallmentsTotal +
                        commitment.projectedSubscriptionsTotal
                    }
                    projectedInstallmentsTotal={commitment.projectedInstallmentsTotal}
                    projectedSubscriptionsTotal={commitment.projectedSubscriptionsTotal}
                    stats={stats}
                    limit={limit}
                    remaining={remaining}
                    overBudget={overBudget}
                    workspaceTypeTotal={workspaceTypeTotal}
                    prevMonthCategoryTotal={prevMonthCategoryTotal}
                />

                <CategoryDetailTrends
                    category={category}
                    categoryId={categoryId}
                    yearMonth={yearMonth}
                    seriesSource={seriesSource}
                    accentColor={accentColor}
                />

                <CategoryEmbeddedTransactions
                    categoryType={category.type}
                    controller={txController}
                />
            </div>

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
                editSaving={editSaving}
                editBudgetRemoving={editBudgetRemoving}
                onEditBudgetRemove={handleEditBudgetRemove}
                onEditSubmit={handleEditSubmit}
                deleteDialogOpen={deleteDialogOpen}
                onDeleteDialogOpenChange={handleDeleteDialogOpenChange}
                deleteDeleting={deleteDeleting}
                onDeleteConfirm={handleDeleteConfirmed}
            />
        </div>
    )
}
