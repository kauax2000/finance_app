"use client"

import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateGhost,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { useConfirmDialog } from "@/components/use-confirm-dialog"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { CategoriesGridLoading, CategoriesPageGridSkeleton } from "@/components/categories/categories-page-grid-skeleton"
import {
    CATEGORY_COLORS,
    CATEGORY_ICONS,
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
import { CustomForm, FormCancel, FormSubmit } from "@/components/ui/form"
import { CategoryFormFields } from "@/components/categories/category-form-fields"
import { Button } from "@/components/ui/button"
import { CategoryDeleteAlertBody } from "@/components/categories/category-delete-alert-body"
import { CategoriesToolbar, useMonthInHeader } from "@/components/categories/categories-toolbar"
import { useDashboardCategoriesSubrouteLabels } from "@/components/layout/dashboard-category-subroute-title"
import { usePageChromeSlot } from "@/components/layout/page-chrome-provider"
import { ExpenseCategoryCard } from "@/components/categories/expense-category-card"
import { IncomeCategoryCard } from "@/components/categories/income-category-card"
import { receitasDoMesPorCategoria, type ReceitaDoMes } from "@/lib/categoria-receitas-do-mes"
import { dividirDoMes, ritmoDoMes, type CriterioDeOrdem } from "@/lib/categoria-situacao"
import { useSerieDasCategorias } from "@/hooks/use-serie-das-categorias"
import {
    OrdemDasCategorias,
    SemMovimentoNoMes,
    mesNaFrase,
} from "@/components/categories/categorias-do-mes"
import { ChartPieIcon, ReceiptPercentIcon, TagIcon } from "@heroicons/react/24/outline"
import { useHojeYmd } from "@/hooks/use-hoje-ymd"
import { localYmdFromDate } from "@/lib/transaction-date"
import { type TransactionFilterType } from "@/components/transactions/transaction-type-segment"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PlusIcon } from "@heroicons/react/16/solid"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    PageHeader,
    PageHeaderActions,
    PageHeaderTitle,
    PageHeaderTitleRow,
} from "@/components/ui/page-header"
import { upsertCategoryBudget, deleteCategoryBudgetById, definirRepeticao } from "@/lib/category-budget-ops"
import { useGarantirOrcamentosDoMes } from "@/hooks/use-garantir-orcamentos-do-mes"
import { deleteCategoryById, saveCategory } from "@/lib/categories/mutations"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { parseMoneyBrl, formatMoneyBrlInput, roundCents } from "@/lib/money-brl"
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
        isAdulto,
    } = useWorkspace()
    // O convidado (Bloco 7A) só lê: sem criar, editar, apagar nem orçamento.
    const podeEscrever = isAdulto
    const isMobile = useIsMobile()
    const categoriesQuery = useCategoriesQuery(
        !authLoading && !workspaceLoading && currentWorkspaceId
            ? currentWorkspaceId
            : null,
    )
    const categories = categoriesQuery.data ?? []
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [postedByCategoryId, setPostedByCategoryId] = useState<Record<string, number>>({})
    const [projectedInstallmentsByCategoryId, setProjectedInstallmentsByCategoryId] =
        useState<Record<string, number>>({})
    const [projectedSubscriptionsByCategoryId, setProjectedSubscriptionsByCategoryId] =
        useState<Record<string, number>>({})
    const [prevSpendByCategoryId, setPrevSpendByCategoryId] = useState<Record<string, number>>({})
    const [incomeByCategoryId, setIncomeByCategoryId] = useState<Record<string, ReceitaDoMes>>({})
    const [prevIncomeByCategoryId, setPrevIncomeByCategoryId] = useState<Record<string, ReceitaDoMes>>({})
    const [criterio, setCriterio] = useState<CriterioDeOrdem>("maior")
    const listLoading = categoriesQuery.isPending && !categoriesQuery.data
    // O mês cujos números já chegaram. Até chegarem, a grade espera no esqueleto:
    // com os totais ainda zerados, toda categoria cairia em "sem movimento" e a
    // tela mostrava o vazio antes das categorias.
    const [mesCarregado, setMesCarregado] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(() => shouldOpenNew)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [filterType, setFilterType] = useState<TransactionFilterType>("expense")
    const [budgetMonthYm, setBudgetMonthYm] = useState(() => formatYearMonth(new Date()))
    const hojeYmd = useHojeYmd()
    // Memorizado: a série refaz as contas quando a identidade da lista muda.
    const categoriasDaSerie = useMemo(
        () => (categoriesQuery.data ?? []).map((c) => ({ id: c.id, type: c.type })),
        [categoriesQuery.data],
    )
    const { historico } = useSerieDasCategorias(currentWorkspaceId, budgetMonthYm, categoriasDaSerie)
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
    const [editBudgetRepeats, setEditBudgetRepeats] = useState(true)
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
    // No telefone o mês mora no cabeçalho, colado à lupa.
    useMonthInHeader({
        budgetMonthYm,
        onBudgetMonthYmChange: handleBudgetMonthYmChange,
    })
    const resetForm = useCallback(() => {
        setName("")
        setType("expense")
        setColor(CATEGORY_COLORS[0])
        setIcon(CATEGORY_ICONS[0])
        setEditingCategory(null)
        setEditBudgetAmount("")
        setEditBudgetRepeats(true)
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
                    setEditBudgetRepeats(bud?.repeats ?? true)
                } else {
                    setEditBudgetAmount("")
                    setEditBudgetRepeats(true)
                }
            } else {
                resetForm()
            }
            setDialogOpen(true)
        },
        [resetForm, budgets],
    )

    const bumpCategories = useCallback(() => {
        if (!currentWorkspaceId) return
        void queryClient.invalidateQueries({
            queryKey: categoriesKeys.list(currentWorkspaceId),
        })
    }, [currentWorkspaceId, queryClient])

    const fetchBudgetsAndSpendRef = useRef<() => void>(() => {})
    useGarantirOrcamentosDoMes(currentWorkspaceId, () => fetchBudgetsAndSpendRef.current())

    const fetchBudgetsAndSpend = useCallback(async () => {
        if (!user || !currentWorkspaceId) return
        if (!parseYearMonthParam(budgetMonthYm)) return
        try {
            const { period_start } = periodBoundsFromYearMonth(budgetMonthYm)
            const prevYm = shiftYearMonth(budgetMonthYm, -1)
            const nextYm = shiftYearMonth(budgetMonthYm, 1)
            const padStart = periodBoundsFromYearMonth(prevYm).period_start
            const padEnd = periodBoundsFromYearMonth(nextYm).period_end

            const [budRes, txRes, plansRes, subsRes, cardsRes] = await Promise.all([
                supabase
                    .from("budgets")
                    .select("amount, category_id, created_at, id, month, period_end, period_start, threshold_100_sent_at, threshold_80_sent_at, threshold_over_sent_at, updated_at, user_id, workspace_id, year, repeats")
                    .eq("workspace_id", currentWorkspaceId)
                    .eq("period_start", period_start),
                supabase
                    .from("transactions")
                    .select(
                        "type,amount,date,category_id,subscription_id,installment_plan_id,installment_sequence,payment_method,payment_credit_card_id",
                    )
                    .eq("workspace_id", currentWorkspaceId)
                    // O estorno no cartão (uma receita) abate a categoria dele.
                    .in("type", ["expense", "income"])
                    .gte("date", `${padStart}T00:00:00.000Z`)
                    .lte("date", `${padEnd}T23:59:59.999Z`),
                supabase
                    .from("workspace_installment_plans")
                    .select("billing_anchor_day, category_id, created_at, description, final_installment_amount, generated_count, id, installment_amount, is_active, next_billing_date, payment_credit_card_id, payment_method, total_installments, updated_at, user_id, workspace_id")
                    .eq("workspace_id", currentWorkspaceId)
                    .order("next_billing_date", { ascending: true }),
                supabase
                    .from("workspace_subscriptions")
                    .select("amount, billing_anchor_day, billing_interval, category_id, created_at, currency, day_of_month, id, is_active, kind, name, next_billing_date, notes, payment_credit_card_id, payment_method, start_date, updated_at, user_id, workspace_id")
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
                setPostedByCategoryId({})
                setProjectedInstallmentsByCategoryId({})
                setProjectedSubscriptionsByCategoryId({})
                setPrevSpendByCategoryId({})
                setIncomeByCategoryId({})
                setPrevIncomeByCategoryId({})
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

                const posted: Record<string, number> = {}
                const projInst: Record<string, number> = {}
                const projSubs: Record<string, number> = {}
                for (const [cid, t] of Object.entries(commitments)) {
                    posted[cid] = t.postedTotal
                    projInst[cid] = t.projectedInstallmentsTotal
                    projSubs[cid] = t.projectedSubscriptionsTotal
                }
                setPostedByCategoryId(posted)
                setProjectedInstallmentsByCategoryId(projInst)
                setProjectedSubscriptionsByCategoryId(projSubs)

                const prevCommitted: Record<string, number> = {}
                for (const [cid, t] of Object.entries(prevCommitments)) {
                    prevCommitted[cid] = t.committedTotal
                }
                setPrevSpendByCategoryId(prevCommitted)
                setIncomeByCategoryId(
                    receitasDoMesPorCategoria({
                        yearMonth: budgetMonthYm,
                        hojeYmd: localYmdFromDate(new Date()),
                        transactions: monthTx,
                        subscriptions: subs,
                    }),
                )
                setPrevIncomeByCategoryId(
                    receitasDoMesPorCategoria({
                        yearMonth: prevYm,
                        hojeYmd: localYmdFromDate(new Date()),
                        transactions: monthTx,
                        subscriptions: subs,
                    }),
                )
            }
        } catch (error) {
            console.error(error)
        } finally {
            setMesCarregado(budgetMonthYm)
        }
    }, [user, currentWorkspaceId, budgetMonthYm])

    useEffect(() => {
        fetchBudgetsAndSpendRef.current = () => void fetchBudgetsAndSpend()
    }, [fetchBudgetsAndSpend])

    useEffect(() => {
        if (authLoading || !user || !currentWorkspaceId || !currentWorkspace) return
        void fetchBudgetsAndSpend()
    }, [
        authLoading,
        user,
        currentWorkspaceId,
        currentWorkspace,
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
            const savedBudget = budgets.find((b) => b.category_id === categoryId)
            if (raw.length === 0) {
                // Sem valor novo o upsert não roda: só a repetição do orçamento já salvo muda.
                if (savedBudget && savedBudget.repeats !== editBudgetRepeats) {
                    const r = await definirRepeticao(savedBudget.id, editBudgetRepeats)
                    if (!r.ok) {
                        toastError(r.erro ?? "Não foi possível salvar o orçamento", { id: "salvar-categoria" })
                        return false
                    }
                }
                return true
            }
            const amt = parseMoneyBrl(editBudgetAmount)
            if (amt === null || amt <= 0) {
                toastError("Informe um valor válido em reais, maior que zero", { id: "salvar-categoria" })
                return false
            }
            const { error: budErr } = await upsertCategoryBudget({
                userId: user.id,
                workspaceId: currentWorkspaceId,
                categoryId,
                yearMonth: budgetMonthYm,
                amount: amt,
                previousAmount: savedBudget ? Number(savedBudget.amount) : null,
                repeats: editBudgetRepeats,
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
        // Sem `resetForm` aqui: o `openDialog` limpa ao abrir, e limpar agora trocaria
        // o conteúdo durante a animação de saída.
        setDialogOpen(false)
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

    const ritmo = ritmoDoMes(budgetMonthYm, hojeYmd)
    const mesDaGrade = mesNaFrase(budgetMonthYm, Number(hojeYmd.slice(0, 4)))

    const despesas = dividirDoMes(
        expenseFiltered.map((category) => {
            const lancado = postedByCategoryId[category.id] ?? 0
            const previsto =
                (projectedInstallmentsByCategoryId[category.id] ?? 0) +
                (projectedSubscriptionsByCategoryId[category.id] ?? 0)
            return {
                category,
                nome: category.name,
                lancado,
                previsto,
                total: Math.max(0, roundCents(lancado + previsto)),
                anterior: prevSpendByCategoryId[category.id] ?? 0,
            }
        }),
        criterio,
    )
    const receitas = dividirDoMes(
        incomeCategories.map((category) => {
            const mes = incomeByCategoryId[category.id]
            const antes = prevIncomeByCategoryId[category.id]
            const recebido = mes?.recebido ?? 0
            const previsto = mes?.previsto ?? 0
            return {
                category,
                nome: category.name,
                recebido,
                previsto,
                total: Math.max(0, roundCents(recebido + previsto)),
                anterior: (antes?.recebido ?? 0) + (antes?.previsto ?? 0),
            }
        }),
        criterio,
    )

    const dialogExistingBudget =
        editingCategory && type === "expense" ? budgetForCategory(editingCategory.id) : null

    const sheetTitle = editingCategory ? "Editar categoria" : "Nova categoria"
    const sheetDescription = editingCategory
        ? type === "expense"
            ? "Atualize os dados da categoria e o orçamento do mês selecionado na barra."
            : "Atualize os dados da categoria"
        : type === "expense"
          ? "Adicione uma categoria. Se for despesa, você pode já definir o limite do mês selecionado."
          : "Adicione uma nova categoria"

    const categoryFormFields = (
        <CategoryFormFields
            idPrefix="category"
            name={name}
            onNameChange={setName}
            type={type}
            onTypeChange={setType}
            color={color}
            onColorChange={setColor}
            icon={icon}
            onIconChange={setIcon}
            budget={
                type === "expense"
                    ? {
                          ym: budgetMonthYm,
                          amount: editBudgetAmount,
                          onAmountChange: setEditBudgetAmount,
                          repeats: editBudgetRepeats,
                          onRepeatsChange: setEditBudgetRepeats,
                          defaultOpen: Boolean(dialogExistingBudget),
                      }
                    : undefined
            }
        />
    )

    const numerosProntos = mesCarregado === budgetMonthYm

    if (listLoading) {
        return (
            <CategoriesPageGridSkeleton
                screenReaderLabel="Carregando categorias"
                variant={filterType === "income" ? "income" : "expense"}
            />
        )
    }

    const doMes = filterType === "income" ? receitas : despesas
    const mostrarOrdem = numerosProntos && doMes.comMovimento.length > 0

    return (
        <div className="flex min-w-0 max-w-full flex-col gap-4">
            {confirmDialog}
            {/* No telefone a tela de aba não tem título, e a barra leva o Nova categoria. */}
            {isMobile ? null : (
                <PageHeader collapse>
                    <PageHeaderTitleRow>
                        <PageHeaderTitle asChild>
                            {/* O `<h1>` da página é o da barra do topo. */}
                            <p aria-hidden="true">Categorias</p>
                        </PageHeaderTitle>
                    </PageHeaderTitleRow>
                    {podeEscrever ? (
                        <PageHeaderActions>
                            <Button type="button" variant="tertiary" onClick={() => openDialog()}>
                                <PlusIcon aria-hidden />
                                Nova categoria
                            </Button>
                        </PageHeaderActions>
                    ) : null}
                </PageHeader>
            )}
            <CategoriesToolbar
                filterType={filterType}
                onFilterTypeChange={setFilterType}
                onNewCategory={podeEscrever && isMobile ? () => openDialog() : undefined}
                includeAll={false}
                showMonthControls
                budgetMonthYm={budgetMonthYm}
                onBudgetMonthYmChange={handleBudgetMonthYmChange}
                contagem={mostrarOrdem ? doMes.comMovimento.length : undefined}
                ordem={
                    mostrarOrdem ? (
                        <OrdemDasCategorias
                            tipo={filterType === "income" ? "income" : "expense"}
                            criterio={criterio}
                            onCriterioChange={setCriterio}
                            compacta={isMobile}
                        />
                    ) : undefined
                }
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
                        <DialogFooter
                            start={
                                dialogExistingBudget ? (
                                    <Button
                                        type="button"
                                        variant="tertiary"
                                        className="text-destructive"
                                        disabled={saving || editBudgetRemoving}
                                        onClick={() => void handleDialogBudgetRemove()}
                                    >
                                        Remover limite
                                    </Button>
                                ) : undefined
                            }
                        >
                            <DialogClose asChild>
                                <FormCancel>Cancelar</FormCancel>
                            </DialogClose>
                            <FormSubmit disabled={editBudgetRemoving}>Salvar</FormSubmit>
                        </DialogFooter>
                    </CustomForm>
                </DialogContent>
            </Dialog>

            {filterType === "income" ? (
                <>
                    {incomeCategories.length > 0 ? (
                        !numerosProntos ? (
                            <CategoriesGridLoading />
                        ) : (
                        <>
                            {receitas.comMovimento.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
                                        {receitas.comMovimento.map(({ category, recebido, previsto, anterior }) => (
                                            <IncomeCategoryCard
                                                key={category.id}
                                                category={category}
                                                recebido={recebido}
                                                previsto={previsto}
                                                anterior={anterior}
                                                totalDoMes={receitas.totalDoMes}
                                                maiorTotal={receitas.maiorTotal}
                                                mesYm={budgetMonthYm}
                                                historico={historico?.[category.id]}
                                                href={categoryDetailPath(category.id, { type: "income" })}
                                                onEdit={podeEscrever ? () => openDialog(category) : undefined}
                                                onDelete={
                                                    podeEscrever
                                                        ? () => setPendingDelete({ id: category.id, name: category.name })
                                                        : undefined
                                                }
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <EmptyState>
                                    <EmptyStateIcon variant="stack">
                                        <TagIcon aria-hidden />
                                        <ChartPieIcon aria-hidden />
                                        <ReceiptPercentIcon aria-hidden />
                                    </EmptyStateIcon>
                                    <EmptyStateTitle>Nenhuma receita em {mesDaGrade}</EmptyStateTitle>
                                </EmptyState>
                            )}
                            <SemMovimentoNoMes
                                categorias={receitas.semMovimento.map(({ category }) => ({
                                    id: category.id,
                                    name: category.name,
                                    href: categoryDetailPath(category.id, { type: "income" }),
                                }))}
                                mesYm={budgetMonthYm}
                                tipo="income"
                            />
                        </>
                        )
                    ) : (
                        <EmptyState variant="plain" size="sm">
                            <EmptyStateTitle>Nenhuma categoria de receita</EmptyStateTitle>
                        </EmptyState>
                    )}
                </>
            ) : (
                <>
                    {expenseFiltered.length > 0 ? (
                        !numerosProntos ? (
                            <CategoriesGridLoading />
                        ) : (
                        <>
                            {despesas.comMovimento.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
                                        {despesas.comMovimento.map(({ category, lancado, previsto, anterior }) => {
                                            const bud = budgetForCategory(category.id)
                                            return (
                                                <ExpenseCategoryCard
                                                    key={category.id}
                                                    category={category}
                                                    lancado={lancado}
                                                    previsto={previsto}
                                                    anterior={anterior}
                                                    limite={bud ? Number(bud.amount) : 0}
                                                    totalDoMes={despesas.totalDoMes}
                                                    maiorTotal={despesas.maiorTotal}
                                                    ritmo={ritmo}
                                                    mesYm={budgetMonthYm}
                                                    historico={historico?.[category.id]}
                                                    href={categoryDetailPath(category.id, {
                                                        type: "expense",
                                                        month: budgetMonthYm,
                                                    })}
                                                    onEdit={podeEscrever ? () => openDialog(category) : undefined}
                                                    onDelete={
                                                        podeEscrever
                                                            ? () => setPendingDelete({ id: category.id, name: category.name })
                                                            : undefined
                                                    }
                                                />
                                            )
                                        })}
                                    </div>
                                </>
                            ) : (
                                <EmptyState>
                                    <EmptyStateIcon variant="stack">
                                        <TagIcon aria-hidden />
                                        <ChartPieIcon aria-hidden />
                                        <ReceiptPercentIcon aria-hidden />
                                    </EmptyStateIcon>
                                    <EmptyStateTitle>Nenhum gasto em {mesDaGrade}</EmptyStateTitle>
                                </EmptyState>
                            )}
                            <SemMovimentoNoMes
                                categorias={despesas.semMovimento.map(({ category }) => ({
                                    id: category.id,
                                    name: category.name,
                                    href: categoryDetailPath(category.id, {
                                        type: "expense",
                                        month: budgetMonthYm,
                                    }),
                                }))}
                                mesYm={budgetMonthYm}
                                tipo="expense"
                            />
                        </>
                        )
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
                            <EmptyStateTitle>
                                {podeEscrever ? "Crie suas categorias" : "Nenhuma categoria ainda"}
                            </EmptyStateTitle>
                            <EmptyStateDescription>
                                {podeEscrever
                                    ? "Categorias agrupam receitas e despesas, e é nelas que os orçamentos do mês se apoiam."
                                    : "Quem administra a carteira cria as categorias. Elas aparecem aqui."}
                            </EmptyStateDescription>
                            {podeEscrever ? (
                                <EmptyStateActions>
                                    <Button type="button" onClick={() => openDialog()}>
                                        <PlusIcon aria-hidden />
                                        Criar primeira categoria
                                    </Button>
                                </EmptyStateActions>
                            ) : null}
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
