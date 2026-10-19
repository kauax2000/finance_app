"use client"

import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateGhost,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { useConfirmDialog } from "@/components/use-confirm-dialog"
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
import { Card, CardContent, CardMessage } from "@/components/ui/card"
import { CustomForm, FormInput, FormSubmit } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { CategoryDeleteAlertBody } from "@/components/categories/category-delete-alert-body"
import { CategoriesToolbar, useMonthInHeader } from "@/components/categories/categories-toolbar"
import { useDashboardCategoriesSubrouteLabels } from "@/components/layout/dashboard-category-subroute-title"
import { usePageChromeSlot } from "@/components/layout/page-chrome-provider"
import { ExpenseCategoryCard } from "@/components/categories/expense-category-card"
import { Field, FieldTitle } from "@/components/ui/field"
import { IncomeCategoryCard } from "@/components/categories/income-category-card"
import {
    TransactionFormTypeSegment,
    type TransactionFilterType,
} from "@/components/transactions/transaction-type-segment"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PlusIcon } from "@heroicons/react/16/solid"
import { upsertCategoryBudget, deleteCategoryBudgetById } from "@/lib/category-budget-ops"
import { deleteCategoryById, saveCategory } from "@/lib/categories/mutations"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { parseMoneyBrl, formatMoneyBrlInput } from "@/lib/money-brl"
import { toastError, toastSuccess } from "@/lib/toast"
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
    parseYearMonthParam,
    periodBoundsFromYearMonth,
    shiftYearMonth,
} from "@/lib/budget-month"
import { buildCategoryCommitmentsForMonth } from "@/lib/category-commitments"

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
    const listLoading = categoriesQuery.isPending && !categoriesQuery.data
    const [, setBudgetsLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(() => shouldOpenNew)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [filterType, setFilterType] = useState<TransactionFilterType>("expense")
    const [budgetMonthYm, setBudgetMonthYm] = useState(() => formatYearMonth(new Date()))
    useEffect(() => {
        const ym = parseYearMonthParam(searchParams?.get("month") ?? null)
        if (ym) {
            setBudgetMonthYm((prev) => (prev === ym ? prev : ym))
        }
    }, [searchParams])
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
    const { confirm: confirmAction, dialog: confirmDialog } = useConfirmDialog()
    const [saving, setSaving] = useState(false)
    const subrouteLabels = useDashboardCategoriesSubrouteLabels(pathname)
    const categoriesChrome = useMemo(
        () => ({
            title: subrouteLabels?.titleLabel,
            backHref: subrouteLabels ? ROUTES.DASHBOARD_CATEGORIES : undefined,
        }),
        [subrouteLabels?.titleLabel, subrouteLabels?.kind],
    )
    usePageChromeSlot(categoriesChrome)
    // No telefone o mês (só das despesas) mora no cabeçalho, colado à lupa.
    useMonthInHeader({
        budgetMonthYm,
        onBudgetMonthYmChange: handleBudgetMonthYmChange,
        enabled: filterType === "expense",
    })
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
        if (!parseYearMonthParam(budgetMonthYm)) return
        setBudgetsLoading(true)
        try {
            const { period_start } = periodBoundsFromYearMonth(budgetMonthYm)
            const prevYm = shiftYearMonth(budgetMonthYm, -1)
            const nextYm = shiftYearMonth(budgetMonthYm, 1)
            const padStart = periodBoundsFromYearMonth(prevYm).period_start
            const padEnd = periodBoundsFromYearMonth(nextYm).period_end

            const [budRes, txRes, plansRes, subsRes, cardsRes] = await Promise.all([
                supabase
                    .from("budgets")
                    .select("amount, category_id, created_at, id, month, period_end, period_start, threshold_100_sent_at, threshold_80_sent_at, threshold_over_sent_at, updated_at, user_id, workspace_id, year")
                    .eq("workspace_id", currentWorkspaceId)
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
                    .select("billing_anchor_day, category_id, created_at, description, final_installment_amount, generated_count, id, installment_amount, is_active, next_billing_date, payment_credit_card_id, payment_method, total_installments, updated_at, user_id, workspace_id")
                    .eq("workspace_id", currentWorkspaceId)
                    .order("next_billing_date", { ascending: true }),
                supabase
                    .from("workspace_subscriptions")
                    .select("amount, billing_anchor_day, billing_interval, category_id, created_at, currency, day_of_month, id, is_active, name, next_billing_date, notes, payment_credit_card_id, payment_method, start_date, updated_at, user_id, workspace_id")
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
        } catch (error) {
            console.error(error)
        } finally {
            setBudgetsLoading(false)
        }
    }, [user, currentWorkspaceId, budgetMonthYm])

    useEffect(() => {
        if (authLoading || !user || !currentWorkspaceId || !currentWorkspace) return
        if (showOnboarding) return
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
                <CardMessage tone="destructive">{workspaceError}</CardMessage>
            </Card>
        )
    }

    if (authLoading) {
        return <CategoriesPageGridSkeleton screenReaderLabel="Carregando sessão" />
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

    if (user && currentWorkspaceId && workspaceLoading) {
        return <CategoriesPageGridSkeleton screenReaderLabel="Carregando carteira" />
    }

    if (categoriesQuery.isError) {
        return (
            <Card>
                <CardMessage tone="destructive">
                    Não foi possível carregar as categorias. Tente recarregar a página.
                </CardMessage>
            </Card>
        )
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
                toastError("Informe um valor válido em reais, maior que zero", { id: "salvar-categoria" })
                return false
            }
            const savedBudget = budgets.find((b) => b.category_id === categoryId)
            const { error: budErr } = await upsertCategoryBudget({
                userId: user.id,
                workspaceId: currentWorkspaceId,
                categoryId,
                yearMonth: budgetMonthYm,
                amount: amt,
                previousAmount: savedBudget ? Number(savedBudget.amount) : null,
            })
            if (budErr) {
                toastError(
                    formatSupabasePostgrestError(budErr) ?? "Não foi possível salvar o orçamento",
                    { id: "salvar-categoria" },
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
                toastError(saveResult.errorMessage, { id: "salvar-categoria" })
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
                toastError(saveResult.errorMessage, { id: "salvar-categoria" })
                return
            }

            const budgetOk = await saveExpenseBudgetForCategory(saveResult.categoryId)
            if (!budgetOk) {
                setSaving(false)
                bumpCategories()
                void fetchBudgetsAndSpend()
                return
            }

            toastSuccess("Categoria criada", {
                id: "salvar-categoria",
                description: name,
                action: saveResult.queued
                    ? undefined
                    : { label: "Ver", href: categoryDetailPath(saveResult.categoryId, { type }) },
            })
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
            toastError(result.errorMessage, { id: `excluir-categoria:${id}` })
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
        const ok = await confirmAction({
            title: "Remover o orçamento?",
            description: "O orçamento desta categoria para este período deixa de existir.",
            actionLabel: "Remover",
        })
        if (!ok) return
        setEditBudgetRemoving(true)
        const { error: delErr } = await deleteCategoryBudgetById(
            existing.id,
            currentWorkspaceId!
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

    const categoryFormFields = (
        <div className="space-y-4 py-4">
            <FormInput
                id="name"
                label="Nome"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setName(e.target.value)
                }
                placeholder="Ex: Alimentação"
                required
            />

            <Field>
                <FieldTitle>Tipo</FieldTitle>
                <TransactionFormTypeSegment
                    aria-label="Tipo"
                    value={type}
                    onChange={setType}
                />
            </Field>

            <CategoryAppearanceFields
                color={color}
                onColorChange={setColor}
                icon={icon}
                onIconChange={setIcon}
            />

            {type === "expense" ? (
                <Card variant="muted" padding="sm" className="px-3">
                    <p className="text-xs text-muted-foreground">
                        Limite de despesas para {dialogBudgetPeriod.period_start} a{" "}
                        {dialogBudgetPeriod.period_end}.
                    </p>
                    <FormInput
                        money
                        label="Valor limite (R$)"
                        placeholder="Ex: 1.500,00"
                        value={editBudgetAmount}
                        onValueChange={setEditBudgetAmount}
                    />
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
                </Card>
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
            {confirmDialog}
            <CategoriesToolbar
                filterType={filterType}
                onFilterTypeChange={setFilterType}
                onNewCategory={() => openDialog()}
                includeAll={false}
                showMonthControls={filterType === "expense"}
                budgetMonthYm={budgetMonthYm}
                onBudgetMonthYmChange={handleBudgetMonthYmChange}
            />
            {/* Diálogo no desktop, gaveta alta no telefone (`surface="auto"`).
                Enquanto salva ou remove o orçamento, nada fecha. */}
            <Dialog
                surface="auto"
                pending={saving || editBudgetRemoving}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            >
                <DialogContent layout="fixed">
                    <DialogHeader>
                        <DialogTitle>{sheetTitle}</DialogTitle>
                        <DialogDescription>{sheetDescription}</DialogDescription>
                    </DialogHeader>
                    <CustomForm
                        pending={saving}
                        onSubmit={handleSubmit}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <DialogBody className="pb-2">
                            {categoryFormFields}
                        </DialogBody>
                        <DialogFooter>
                            <FormSubmit
                                size="sm"
                                disabled={editBudgetRemoving}
                            >
                                Salvar
                            </FormSubmit>
                        </DialogFooter>
                    </CustomForm>
                </DialogContent>
            </Dialog>

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
                        <EmptyState variant="plain" size="sm">
                            <EmptyStateTitle>Nenhuma categoria de receita</EmptyStateTitle>
                        </EmptyState>
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
                        <EmptyState variant="plain" size="sm">
                            <EmptyStateTitle>Nenhuma categoria de despesa</EmptyStateTitle>
                        </EmptyState>
                    )}
                </>
            )}

            {categories.length === 0 && (
                <Card padding="none">
                    <CardContent role="status" aria-live="polite">
                        <EmptyState variant="plain" size="lg">
                            <EmptyStateGhost leading="tile" trailing="amount" />
                            <EmptyStateTitle>Crie suas categorias</EmptyStateTitle>
                            <EmptyStateDescription>
                                Categorias agrupam receitas e despesas, e é nelas que os
                                orçamentos do mês se apoiam.
                            </EmptyStateDescription>
                            <EmptyStateActions>
                                <Button type="button" onClick={() => openDialog()}>
                                    <PlusIcon aria-hidden />
                                    Criar primeira categoria
                                </Button>
                            </EmptyStateActions>
                        </EmptyState>
                    </CardContent>
                </Card>
            )}

            <AlertDialog
                pending={deleteDeleting}
                open={Boolean(pendingDelete)}
                onOpenChange={(open) => {
                    if (!open && !deleteDeleting) setPendingDelete(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingDelete ? (
                                <CategoryDeleteAlertBody categoryName={pendingDelete.name} />
                            ) : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel type="button">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            pendingLabel="Excluindo…"
                            type="button"
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
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
