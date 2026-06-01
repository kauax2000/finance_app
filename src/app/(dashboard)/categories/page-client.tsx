"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { CategoriesOnboardingLoadingShell } from "@/components/categories/categories-onboarding-loading-shell"
import { CategoriesOnboardingWizard } from "@/components/categories/categories-onboarding-wizard"
import { CategoriesPageGridSkeleton } from "@/components/categories/categories-page-grid-skeleton"
import {
    CATEGORY_COLORS,
    CATEGORY_ICONS,
    CategoryAppearanceFields,
    normalizeCategoryIcon,
    type CategoryIconId,
} from "@/components/categories/category-appearance-fields"
import {
    supabase,
    type Budget,
    type Category,
    type Transaction,
    type WorkspaceInstallmentPlan,
    type WorkspaceSubscription,
} from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { CustomForm } from "@/components/ui/form"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CategoryDeleteAlertBody } from "@/components/categories/category-delete-alert-body"
import { CategoriesToolbar, MonthNav } from "@/components/categories/categories-toolbar"
import { useDashboardCategoriesSubrouteLabels } from "@/components/layout/dashboard-category-subroute-title"
import { usePageChromeSlot } from "@/components/layout/page-chrome-provider"
import { ExpenseCategoryCard } from "@/components/categories/expense-category-card"
import { IncomeCategoryCard } from "@/components/categories/income-category-card"
import {
    TransactionFormTypeSegment,
    type TransactionFilterType,
} from "@/components/transactions/transaction-type-segment"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import {
    MobileSheetFormDragStrip,
    MobileSheetFormStickyHeader,
    mobileFormSheetContentClassName,
} from "@/components/ui/mobile-sheet-form-chrome"
import { PlusIcon, ChartPieIcon } from "@heroicons/react/24/outline"
import { invokeEdgeJson } from "@/lib/edge-invoke"
import { upsertCategoryBudget, deleteCategoryBudgetById } from "@/lib/category-budget-ops"
import { deleteCategoryById, saveCategory } from "@/lib/categories/mutations"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { parseMoneyBrl, formatMoneyBrlInput, formatMoneyBrlTyping } from "@/lib/money-brl"
import { toastError } from "@/lib/toast"
import { FINANCE_CATEGORIES_MUTATED_EVENT } from "@/lib/workspace-data-events"
import { ROUTES, categoryDetailPath } from "@/config/navigation"
import { categoriesKeys } from "@/lib/queries/keys"
import { useCategoriesQuery } from "@/lib/queries/use-categories"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    formatYearMonth,
    periodBoundsFromYearMonth,
    shiftYearMonth,
} from "@/lib/budget-month"
import { buildCategoryCommitmentsForMonth } from "@/lib/category-commitments"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

export default function CategoriesPage({ shouldOpenNew = false }: { shouldOpenNew?: boolean }) {
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()
    const queryClient = useQueryClient()
    const { user, loading: authLoading } = useAuth()
    const {
        currentWorkspace,
        currentWorkspaceId,
        loading: workspaceLoading,
        error: workspaceError,
        refreshWorkspaces,
    } = useWorkspace()
    const categoriesQuery = useCategoriesQuery(
        !authLoading && !workspaceLoading && currentWorkspaceId
            ? currentWorkspaceId
            : null,
    )
    const categories = categoriesQuery.data ?? []
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [spendByCategoryId, setSpendByCategoryId] = useState<Record<string, number>>({})
    const [postedByCategoryId, setPostedByCategoryId] = useState<Record<string, number>>({})
    const [projectedInstallmentsByCategoryId, setProjectedInstallmentsByCategoryId] =
        useState<Record<string, number>>({})
    const [projectedSubscriptionsByCategoryId, setProjectedSubscriptionsByCategoryId] =
        useState<Record<string, number>>({})
    const [prevSpendByCategoryId, setPrevSpendByCategoryId] = useState<Record<string, number>>({})
    const listLoading = categoriesQuery.isPending
    const [budgetsLoading, setBudgetsLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(() => shouldOpenNew)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [filterType, setFilterType] = useState<TransactionFilterType>("expense")
    const [budgetMonthYm, setBudgetMonthYm] = useState(() => formatYearMonth(new Date()))
    const monthParam = searchParams.get("month")
    useEffect(() => {
        if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
            setBudgetMonthYm((prev) => (prev === monthParam ? prev : monthParam))
        }
    }, [monthParam])
    const handleBudgetMonthYmChange = useCallback(
        (ym: string) => {
            setBudgetMonthYm(ym)
            const p = new URLSearchParams()
            p.set("month", ym)
            router.replace(`${ROUTES.DASHBOARD_CATEGORIES}?${p.toString()}`, { scroll: false })
        },
        [router],
    )
    const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
    const [deleteDeleting, setDeleteDeleting] = useState(false)

    const [name, setName] = useState("")
    const [type, setType] = useState<"income" | "expense">("expense")
    const [color, setColor] = useState<string>(CATEGORY_COLORS[0])
    const [icon, setIcon] = useState<CategoryIconId>(CATEGORY_ICONS[0])
    const [editBudgetAmount, setEditBudgetAmount] = useState("")
    const [editBudgetRemoving, setEditBudgetRemoving] = useState(false)
    const [saving, setSaving] = useState(false)
    const isMobile = useIsMobile()
    const subrouteLabels = useDashboardCategoriesSubrouteLabels(pathname)
    const categoriesChrome = useMemo(
        () => ({
            title: subrouteLabels?.titleLabel,
            backHref: subrouteLabels ? ROUTES.DASHBOARD_CATEGORIES : undefined,
            dateFilter:
                filterType === "expense" ? (
                    <MonthNav
                        budgetMonthYm={budgetMonthYm}
                        onBudgetMonthYmChange={handleBudgetMonthYmChange}
                        dense
                    />
                ) : undefined,
        }),
        [
            subrouteLabels?.titleLabel,
            subrouteLabels?.kind,
            filterType,
            budgetMonthYm,
            handleBudgetMonthYmChange,
        ],
    )
    usePageChromeSlot(categoriesChrome)
    const resetForm = useCallback(() => {
        setName("")
        setType("expense")
        setColor(CATEGORY_COLORS[0])
        setIcon(CATEGORY_ICONS[0])
        setEditingCategory(null)
        setEditBudgetAmount("")
        setEditBudgetRemoving(false)
    }, [])

    const openDialog = useCallback(
        (category?: Category) => {
            setEditBudgetRemoving(false)
            if (category) {
                setEditingCategory(category)
                setName(category.name)
                setType(category.type)
                setColor(category.color || CATEGORY_COLORS[0])
                setIcon(normalizeCategoryIcon(category.icon))
                if (category.type === "expense") {
                    const bud = budgets.find((b) => b.category_id === category.id) ?? null
                    setEditBudgetAmount(
                        bud ? formatMoneyBrlInput(Number(bud.amount)) : "",
                    )
                } else {
                    setEditBudgetAmount("")
                }
            } else {
                resetForm()
            }
            setDialogOpen(true)
        },
        [resetForm, budgets],
    )

    const showOnboarding =
        Boolean(user && currentWorkspace && !currentWorkspace.categories_onboarding_completed_at)

    const bumpCategories = useCallback(() => {
        if (!currentWorkspaceId) return
        void queryClient.invalidateQueries({
            queryKey: categoriesKeys.list(currentWorkspaceId),
        })
    }, [currentWorkspaceId, queryClient])

    const fetchBudgetsAndSpend = useCallback(async () => {
        if (!user || !currentWorkspaceId) return
        setBudgetsLoading(true)
        const { period_start } = periodBoundsFromYearMonth(budgetMonthYm)
        const prevYm = shiftYearMonth(budgetMonthYm, -1)
        const nextYm = shiftYearMonth(budgetMonthYm, 1)
        const padStart = periodBoundsFromYearMonth(prevYm).period_start
        const padEnd = periodBoundsFromYearMonth(nextYm).period_end

        const [budRes, txRes, plansRes, subsRes, cardsRes] = await Promise.all([
            supabase
                .from("budgets")
                .select("*")
                .eq("workspace_id", currentWorkspaceId)
                .eq("user_id", user.id)
                .eq("period_start", period_start),
            supabase
                .from("transactions")
                .select(
                    "type,amount,date,category_id,subscription_id,installment_plan_id,installment_sequence,payment_method,payment_credit_card_id",
                )
                .eq("workspace_id", currentWorkspaceId)
                .eq("type", "expense")
                .gte("date", `${padStart}T00:00:00.000Z`)
                .lte("date", `${padEnd}T23:59:59.999Z`),
            supabase
                .from("workspace_installment_plans")
                .select("*")
                .eq("workspace_id", currentWorkspaceId)
                .order("next_billing_date", { ascending: true }),
            supabase
                .from("workspace_subscriptions")
                .select("*")
                .eq("workspace_id", currentWorkspaceId)
                .order("name", { ascending: true }),
            supabase
                .from("credit_cards")
                .select("id, closing_day")
                .eq("workspace_id", currentWorkspaceId),
        ])

        const creditCards =
            (cardsRes.data as { id: string; closing_day: number }[] | null) ?? []

        if (budRes.error) {
            console.error(budRes.error)
        } else if (budRes.data) {
            setBudgets(budRes.data as Budget[])
        }

        if (txRes.error) {
            console.error(txRes.error)
            setSpendByCategoryId({})
            setPostedByCategoryId({})
            setProjectedInstallmentsByCategoryId({})
            setProjectedSubscriptionsByCategoryId({})
            setPrevSpendByCategoryId({})
        } else {
            const monthTx = (txRes.data ?? []) as Pick<
                Transaction,
                | "type"
                | "amount"
                | "date"
                | "category_id"
                | "subscription_id"
                | "installment_plan_id"
                | "installment_sequence"
                | "payment_method"
                | "payment_credit_card_id"
            >[]
            const plans = (plansRes.data ?? []) as WorkspaceInstallmentPlan[]
            const subs = (subsRes.data ?? []) as WorkspaceSubscription[]
            const commitments = buildCategoryCommitmentsForMonth({
                yearMonth: budgetMonthYm,
                transactions: monthTx,
                installmentPlans: plans,
                subscriptions: subs,
                creditCards,
            })
            const prevCommitments = buildCategoryCommitmentsForMonth({
                yearMonth: prevYm,
                transactions: monthTx,
                installmentPlans: plans,
                subscriptions: subs,
                creditCards,
            })

            const committed: Record<string, number> = {}
            const posted: Record<string, number> = {}
            const projInst: Record<string, number> = {}
            const projSubs: Record<string, number> = {}
            for (const [cid, t] of Object.entries(commitments)) {
                committed[cid] = t.committedTotal
                posted[cid] = t.postedTotal
                projInst[cid] = t.projectedInstallmentsTotal
                projSubs[cid] = t.projectedSubscriptionsTotal
            }
            setSpendByCategoryId(committed)
            setPostedByCategoryId(posted)
            setProjectedInstallmentsByCategoryId(projInst)
            setProjectedSubscriptionsByCategoryId(projSubs)

            const prevCommitted: Record<string, number> = {}
            for (const [cid, t] of Object.entries(prevCommitments)) {
                prevCommitted[cid] = t.committedTotal
            }
            setPrevSpendByCategoryId(prevCommitted)
        }

        setBudgetsLoading(false)
    }, [user, currentWorkspaceId, budgetMonthYm])

    useEffect(() => {
        if (authLoading || !user || !currentWorkspaceId || !currentWorkspace) return
        if (showOnboarding) return
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch updates local page state
        void fetchBudgetsAndSpend()
    }, [
        authLoading,
        user,
        currentWorkspaceId,
        currentWorkspace,
        showOnboarding,
        fetchBudgetsAndSpend,
    ])

    useEffect(() => {
        const onMutated = () => {
            bumpCategories()
            void fetchBudgetsAndSpend()
        }
        window.addEventListener(FINANCE_CATEGORIES_MUTATED_EVENT, onMutated)
        return () =>
            window.removeEventListener(FINANCE_CATEGORIES_MUTATED_EVENT, onMutated)
    }, [bumpCategories, fetchBudgetsAndSpend])

    if (workspaceError) {
        return (
            <Card>
                <CardContent className="py-8 text-sm text-red-500">{workspaceError}</CardContent>
            </Card>
        )
    }

    if (authLoading) {
        return <CategoriesPageGridSkeleton screenReaderLabel="Carregando sessão" />
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

    if (user && currentWorkspaceId && workspaceLoading) {
        return <CategoriesPageGridSkeleton screenReaderLabel="Carregando carteira" />
    }

    if (showOnboarding && user && currentWorkspaceId && currentWorkspace) {
        if (listLoading) {
            return <CategoriesOnboardingLoadingShell />
        }
        return (
            <CategoriesOnboardingWizard
                user={user}
                workspaceId={currentWorkspaceId}
                categories={categories}
                onFinished={() => void refreshWorkspaces()}
                onCategoriesUpdated={() => bumpCategories()}
            />
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !currentWorkspaceId) return

        setSaving(true)

        const categoryData = {
            user_id: user.id,
            workspace_id: currentWorkspaceId,
            name,
            type,
            color,
            icon,
        }

        const saveExpenseBudgetForCategory = async (categoryId: string): Promise<boolean> => {
            if (type !== "expense") return true
            const raw = editBudgetAmount.trim()
            if (raw.length === 0) return true
            const amt = parseMoneyBrl(editBudgetAmount)
            if (amt === null || amt <= 0) {
                toastError("Informe um valor válido em reais, maior que zero.")
                return false
            }
            const { error: budErr } = await upsertCategoryBudget({
                userId: user.id,
                workspaceId: currentWorkspaceId,
                categoryId,
                yearMonth: budgetMonthYm,
                amount: amt,
            })
            if (budErr) {
                toastError(
                    formatSupabasePostgrestError(budErr) ?? "Não foi possível salvar o orçamento.",
                )
                return false
            }
            return true
        }

        if (editingCategory) {
            const saveResult = await saveCategory({
                ...categoryData,
                editingId: editingCategory.id,
            })
            if (!saveResult.ok) {
                setSaving(false)
                toastError(saveResult.errorMessage)
                return
            }
            const budgetOk = await saveExpenseBudgetForCategory(editingCategory.id)
            if (!budgetOk) {
                setSaving(false)
                return
            }
        } else {
            const saveResult = await saveCategory(categoryData)
            if (!saveResult.ok) {
                setSaving(false)
                toastError(saveResult.errorMessage)
                return
            }

            const budgetOk = await saveExpenseBudgetForCategory(saveResult.categoryId)
            if (!budgetOk) {
                setSaving(false)
                bumpCategories()
                void fetchBudgetsAndSpend()
                return
            }

            if (!saveResult.queued) {
            void invokeEdgeJson("dispatch-notifications", {
                body: {
                    workspace_id: currentWorkspaceId,
                    type: "system",
                    title: "Categoria criada",
                    body: `Você criou a categoria “${name}”.`,
                    metadata: {
                        kind: "category_created",
                        critical: false,
                    },
                },
            }).catch(() => {
                /* non-blocking */
            })
            }
        }

        setSaving(false)
        setDialogOpen(false)
        resetForm()
        bumpCategories()
        void fetchBudgetsAndSpend()
    }

    const handleDeleteConfirmed = async (id: string): Promise<boolean> => {
        if (!currentWorkspaceId) return false
        const result = await deleteCategoryById(id, currentWorkspaceId)
        if (!result.ok) {
            toastError(result.errorMessage)
            return false
        }

        bumpCategories()
        void fetchBudgetsAndSpend()
        return true
    }

    const filteredCategories = categories.filter((c) => {
        if (filterType !== "all" && c.type !== filterType) return false
        return true
    })

    const incomeCategories = filteredCategories.filter((c) => c.type === "income")
    const expenseFiltered = filteredCategories.filter((c) => c.type === "expense")

    const budgetForCategory = (categoryId: string) =>
        budgets.find((b) => b.category_id === categoryId) ?? null

    const handleDialogBudgetRemove = async () => {
        if (!user || !editingCategory) return
        const existing = budgetForCategory(editingCategory.id)
        if (!existing) return
        if (!confirm("Remover o orçamento desta categoria para este período?")) return
        setEditBudgetRemoving(true)
        const { error: delErr } = await deleteCategoryBudgetById(
            existing.id,
            currentWorkspaceId!
        )
        setEditBudgetRemoving(false)
        if (delErr) {
            toastError(
                formatSupabasePostgrestError(delErr) ?? "Não foi possível remover o orçamento.",
            )
            return
        }
        setEditBudgetAmount("")
        void fetchBudgetsAndSpend()
    }

    const totalMonthSpend = Object.values(spendByCategoryId).reduce((sum, v) => sum + v, 0)

    const expenseSpendRankById = (() => {
        const rows = expenseFiltered.map((c) => ({
            id: c.id,
            spent: spendByCategoryId[c.id] ?? 0,
        }))
        rows.sort((a, b) => b.spent - a.spent)
        const m: Record<string, number> = {}
        rows.forEach((r, i) => {
            m[r.id] = i + 1
        })
        return m
    })()
    const categoriesWithPositiveSpend = expenseFiltered.filter(
        (c) => (spendByCategoryId[c.id] ?? 0) > 0,
    ).length

    const dialogBudgetPeriod = periodBoundsFromYearMonth(budgetMonthYm)
    const dialogExistingBudget =
        editingCategory && type === "expense" ? budgetForCategory(editingCategory.id) : null

    const sheetTitle = editingCategory ? "Editar Categoria" : "Nova Categoria"
    const sheetDescription = editingCategory
        ? type === "expense"
            ? "Atualize os dados da categoria e o orçamento do mês selecionado na barra."
            : "Atualize os dados da categoria"
        : type === "expense"
          ? "Adicione uma categoria. Se for despesa, você pode já definir o limite do mês selecionado."
          : "Adicione uma nova categoria"

    const onSheetOpenChange = (next: boolean) => {
        if (!next && (saving || editBudgetRemoving)) return
        setDialogOpen(next)
    }

    const categoryFormFields = (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setName(e.target.value)
                    }
                    placeholder="Ex: Alimentação"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>Tipo</Label>
                <TransactionFormTypeSegment
                    value={type}
                    onChange={setType}
                    fullWidth
                />
            </div>

            <CategoryAppearanceFields
                color={color}
                onColorChange={setColor}
                icon={icon}
                onIconChange={setIcon}
            />

            {type === "expense" ? (
                <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">
                        Limite de despesas para {dialogBudgetPeriod.period_start} a{" "}
                        {dialogBudgetPeriod.period_end}.
                    </p>
                    <div className="space-y-2">
                        <Label htmlFor="grid-category-budget-amount">
                            Valor limite (R$)
                        </Label>
                        <Input
                            id="grid-category-budget-amount"
                            inputMode="decimal"
                            placeholder="Ex: 1.500,00"
                            value={editBudgetAmount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setEditBudgetAmount(formatMoneyBrlTyping(e.target.value))
                            }
                        />
                    </div>
                    {dialogExistingBudget ? (
                        <Button
                            type="button"
                            variant="destructive"
                            className="w-full sm:w-auto"
                            disabled={saving || editBudgetRemoving}
                            onClick={() => void handleDialogBudgetRemove()}
                        >
                            {editBudgetRemoving ? "Removendo…" : "Remover orçamento"}
                        </Button>
                    ) : null}
                </div>
            ) : null}
        </div>
    )

    if (listLoading) {
        return (
            <CategoriesPageGridSkeleton
                screenReaderLabel="Carregando categorias"
                variant={filterType === "income" ? "income" : "expense"}
            />
        )
    }

    return (
        <div className="min-w-0 max-w-full space-y-3">
            <CategoriesToolbar
                filterType={filterType}
                onFilterTypeChange={setFilterType}
                onNewCategory={() => openDialog()}
                includeAll={false}
                showMonthControls={filterType === "expense"}
                budgetMonthYm={budgetMonthYm}
                onBudgetMonthYmChange={handleBudgetMonthYmChange}
            />
            {isMobile ? (
                <Sheet open={dialogOpen} onOpenChange={onSheetOpenChange}>
                    <SheetContent
                        side="bottom"
                        fillMobileViewport
                        showCloseButton
                        className={cn(
                            mobileFormSheetContentClassName,
                            "sm:mx-auto sm:max-w-lg",
                        )}
                    >
                        <MobileSheetFormDragStrip />
                        <MobileSheetFormStickyHeader
                            title={sheetTitle}
                            description={sheetDescription}
                        />
                        <CustomForm
                            onSubmit={handleSubmit}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="min-h-0 flex-1 overflow-y-auto px-4">
                                {categoryFormFields}
                            </div>
                            <SheetFooter className="mt-0 shrink-0 gap-2 border-t border-border/60 px-4 pt-4">
                                <Button
                                    type="submit"
                                    disabled={saving || editBudgetRemoving}
                                    size="sm"
                                    className="h-10 w-full"
                                >
                                    {saving ? "Salvando..." : "Salvar"}
                                </Button>
                            </SheetFooter>
                        </CustomForm>
                    </SheetContent>
                </Sheet>
            ) : (
                <Dialog open={dialogOpen} onOpenChange={onSheetOpenChange}>
                    <DialogContent className="flex max-h-[min(90dvh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
                        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
                            <DialogTitle>{sheetTitle}</DialogTitle>
                            <DialogDescription>{sheetDescription}</DialogDescription>
                        </DialogHeader>
                        <CustomForm
                            onSubmit={handleSubmit}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2">
                                {categoryFormFields}
                            </div>
                            <DialogFooter className="mx-0 mb-0 mt-0 shrink-0 flex-row flex-wrap justify-end gap-2 rounded-b-xl border-t border-border/60 bg-background px-6 pt-4 pb-5">
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={saving || editBudgetRemoving}
                                >
                                    {saving ? "Salvando..." : "Salvar"}
                                </Button>
                            </DialogFooter>
                        </CustomForm>
                    </DialogContent>
                </Dialog>
            )}

            {filterType === "income" ? (
                <>
                    {incomeCategories.length > 0 ? (
                        <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {incomeCategories.map((category) => (
                                <IncomeCategoryCard
                                    key={category.id}
                                    category={category}
                                    href={categoryDetailPath(category.id, { type: "income" })}
                                    onEdit={() => openDialog(category)}
                                    onDelete={() =>
                                        setPendingDelete({
                                            id: category.id,
                                            name: category.name,
                                        })
                                    }
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">Nenhuma categoria de receita</p>
                    )}
                </>
            ) : (
                <>
                    {expenseFiltered.length > 0 ? (
                        <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {expenseFiltered.map((category) => {
                                const bud = budgetForCategory(category.id)
                                const spent = spendByCategoryId[category.id] ?? 0
                                const posted = postedByCategoryId[category.id] ?? 0
                                const projectedInstallments =
                                    projectedInstallmentsByCategoryId[category.id] ?? 0
                                const projectedSubscriptions =
                                    projectedSubscriptionsByCategoryId[category.id] ?? 0
                                const limit = bud ? Number(bud.amount) : 0
                                return (
                                    <ExpenseCategoryCard
                                        key={category.id}
                                        category={category}
                                        spent={spent}
                                        posted={posted}
                                        projectedInstallments={projectedInstallments}
                                        projectedSubscriptions={projectedSubscriptions}
                                        previousSpent={prevSpendByCategoryId[category.id] ?? 0}
                                        limit={limit}
                                        totalMonthSpend={totalMonthSpend}
                                        spendRank={expenseSpendRankById[category.id] ?? 1}
                                        categoriesWithPositiveSpend={categoriesWithPositiveSpend}
                                        href={categoryDetailPath(category.id, {
                                            type: "expense",
                                            month: budgetMonthYm,
                                        })}
                                        onEdit={() => openDialog(category)}
                                        onDelete={() =>
                                            setPendingDelete({
                                                id: category.id,
                                                name: category.name,
                                            })
                                        }
                                    />
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">Nenhuma categoria de despesa</p>
                    )}
                </>
            )}

            {categories.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <ChartPieIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">Nenhuma categoria encontrada</p>
                        <Button onClick={() => openDialog()}>
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Criar Primeira Categoria
                        </Button>
                    </CardContent>
                </Card>
            )}

            <AlertDialog
                open={Boolean(pendingDelete)}
                onOpenChange={(open) => {
                    if (!open && !deleteDeleting) setPendingDelete(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div>
                                {pendingDelete ? (
                                    <CategoryDeleteAlertBody categoryName={pendingDelete.name} />
                                ) : null}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel type="button" disabled={deleteDeleting}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            type="button"
                            className={buttonVariants({ variant: "destructive" })}
                            disabled={deleteDeleting}
                            onClick={(e) => {
                                e.preventDefault()
                                if (!pendingDelete) return
                                void (async () => {
                                    setDeleteDeleting(true)
                                    const ok = await handleDeleteConfirmed(pendingDelete.id)
                                    setDeleteDeleting(false)
                                    if (ok) setPendingDelete(null)
                                })()
                            }}
                        >
                            {deleteDeleting ? "Excluindo…" : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
