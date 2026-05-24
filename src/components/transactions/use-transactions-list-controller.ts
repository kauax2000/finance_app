"use client"

/* eslint-disable react-hooks/set-state-in-effect -- URL / embedded parent sync intentionally applies filters in effects */

import {
    keepPreviousData,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query"
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { supabase, type Transaction } from "@/lib/supabase"
import {
    deleteTransactionsByIds,
    persistInstallmentPlanUpdate,
    persistTransactionSave,
} from "@/lib/transaction-detail-sheet-mutations"
import { attachPaymentCards } from "@/lib/transactions-detail-sheet-query"
import { type PaymentMethod } from "@/lib/payment-methods"
import {
    PAYMENT_METHOD_VALUES,
    buildTransactionsListSearchParams,
    mergeTransactionsSearchParams,
} from "@/lib/transactions-list-search-params"
import type {
    InstallmentPlanFormSavePayload,
    InstallmentPlanUpdatePayload,
    TransactionFormSavePayload,
} from "@/components/transactions/transaction-form-dialog"
import { type TransactionFilterType } from "@/components/transactions/transaction-type-segment"
import {
    getTransactionsPresetRange,
    type TransactionsDatePresetKey,
} from "@/components/transactions/transactions-date-presets"
import type { TransactionsFiltersPanelBaseProps } from "@/components/transactions/transactions-filters-panel"
import type { NewTransactionMode } from "@/components/transactions/transactions-toolbar"
import { persistInstallmentPlanCreate } from "@/components/transactions/transaction-form-persistence"
import { useGlobalTransactionCreateOptional } from "@/components/transactions/global-transaction-create-provider"
import { ROUTES } from "@/config/navigation"
import { useCategoriesQuery } from "@/lib/queries/use-categories"
import { useCreditCardsQuery } from "@/lib/queries/use-credit-cards"
import { fetchTransactionsListPage } from "@/lib/queries/fetch-transactions-list-page"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { transactionsKeys } from "@/lib/queries/keys"
import { useTransactionsWorkspaceAuxQuery } from "@/lib/queries/use-transactions-workspace-aux-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { User } from "@supabase/supabase-js"

type SortKey = "date" | "amount"
type SortDir = "asc" | "desc"

type PendingDelete =
    | { mode: "single"; transaction: Transaction }
    | { mode: "bulk"; ids: string[] }

const CARD_QUERY_UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const TRANSACTIONS_PRESET_KEYS: TransactionsDatePresetKey[] = [
    "last7",
    "last15",
    "last30",
    "monthToToday",
]

export type UseTransactionsListControllerArgs = {
    mode?: "page" | "embedded"
    /** When set, the list query is always constrained to this category and the UI must hide category pickers. */
    lockedCategoryId?: string
    defaultPeriod?: { fullPeriod: boolean; from: string; to: string } | null
    userOverride?: User | null
    /** Called after any successful mutation that refreshes workspace lists + transactions. */
    onWorkspaceDataChanged?: () => void
    /**
     * Initialize the receita/despesa/todos filter. For embedded category views, pass the category type
     * so the list matches the category.
     */
    initialFilterType?: TransactionFilterType
}

export function useTransactionsListController(
    {
        mode = "page",
        lockedCategoryId,
        defaultPeriod,
        userOverride,
        onWorkspaceDataChanged,
        initialFilterType = "all",
    }: UseTransactionsListControllerArgs = {}
) {
    const isPage = mode === "page"
    const isEmbedded = mode === "embedded"
    const lockedId = lockedCategoryId ?? null
    const lockTransactionType =
        isEmbedded &&
        lockedId !== null &&
        (initialFilterType === "income" || initialFilterType === "expense")
    const filterTypeBaseline: TransactionFilterType = lockTransactionType
        ? initialFilterType
        : "all"
    /** Embedded list with a parent-supplied month window: period is not user-editable here. */
    const lockPeriodToDefault = isEmbedded && defaultPeriod != null

    const defaultPeriodKey = defaultPeriod
        ? `${defaultPeriod.fullPeriod ? 1 : 0}:${defaultPeriod.from}:${defaultPeriod.to}`
        : null

    const initialEmbeddedPeriod =
        isEmbedded && defaultPeriod ? defaultPeriod : null
    const initialFullPeriod = initialEmbeddedPeriod
        ? initialEmbeddedPeriod.fullPeriod
        : true
    const initialFilterDateFrom = initialEmbeddedPeriod
        ? initialEmbeddedPeriod.from
        : ""
    const initialFilterDateTo = initialEmbeddedPeriod
        ? initialEmbeddedPeriod.to
        : ""
    const initialPeriodDraftFrom = initialFilterDateFrom
    const initialPeriodDraftTo = initialFilterDateTo

    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { user: userFromAuth, loading: authLoading } = useAuth()
    const user = userOverride ?? userFromAuth
    const onWorkspaceDataChangedRef = useRef<(() => void) | undefined>(
        onWorkspaceDataChanged
    )
    useLayoutEffect(() => {
        onWorkspaceDataChangedRef.current = onWorkspaceDataChanged
    }, [onWorkspaceDataChanged])

    const emitWorkspaceDataChanged = useCallback(() => {
        try {
            onWorkspaceDataChangedRef.current?.()
        } catch {
            /* non-fatal: host listeners must not break transactions UX */
        }
    }, [])
    const {
        currentWorkspaceId,
        loading: workspaceLoading,
        error: workspaceError,
    } = useWorkspace()
    const queryClient = useQueryClient()
    const globalTransactionCreate = useGlobalTransactionCreateOptional()

    const workspaceBootstrap =
        Boolean(user) &&
        !authLoading &&
        !workspaceLoading &&
        Boolean(currentWorkspaceId)

    const categoriesQuery = useCategoriesQuery(
        workspaceBootstrap && currentWorkspaceId ? currentWorkspaceId : null,
    )
    const creditCardsQuery = useCreditCardsQuery(
        workspaceBootstrap && currentWorkspaceId ? currentWorkspaceId : null,
    )
    const workspaceAuxQuery = useTransactionsWorkspaceAuxQuery(
        workspaceBootstrap && currentWorkspaceId ? currentWorkspaceId : null,
        workspaceBootstrap,
    )

    const categories = useMemo(
        () => categoriesQuery.data ?? [],
        [categoriesQuery.data],
    )
    const creditCards = useMemo(
        () => creditCardsQuery.data ?? [],
        [creditCardsQuery.data],
    )
    const workspaceHasTransactions =
        workspaceAuxQuery.data?.workspaceHasTransactions ?? false
    const installmentPlansFromQuery =
        workspaceAuxQuery.data?.installmentPlans ?? []
    const subscriptionsFromQuery = workspaceAuxQuery.data?.subscriptions ?? []
    const invoicePaymentsFromQuery =
        workspaceAuxQuery.data?.invoicePayments ?? []

    const invoicePaidByCardClose = useMemo(() => {
        const next = new Set<string>()
        for (const p of invoicePaymentsFromQuery) {
            if (p.status === "paid") {
                next.add(`${p.credit_card_id}:${p.statement_close_date}`)
            }
        }
        return next
    }, [invoicePaymentsFromQuery])

    const [page, setPage] = useState(0)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingTransaction, setEditingTransaction] =
        useState<Transaction | null>(null)
    const [saving, setSaving] = useState(false)
    const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
        null
    )
    const [deleting, setDeleting] = useState(false)
    const [selectedIds, setSelectedIds] = useState(() => new Set<string>())

    const [filterType, setFilterType] =
        useState<TransactionFilterType>(initialFilterType)
    const [fullPeriod, setFullPeriod] = useState(initialFullPeriod)
    const [filterDateFrom, setFilterDateFrom] = useState<string>(initialFilterDateFrom)
    const [filterDateTo, setFilterDateTo] = useState<string>(initialFilterDateTo)
    const [datePreset, setDatePreset] = useState<TransactionsDatePresetKey | null>(
        null
    )
    const [filterPaymentMethods, setFilterPaymentMethods] = useState<
        PaymentMethod[]
    >([])
    const [filterCreditCardIds, setFilterCreditCardIds] = useState<string[]>([])
    const [filterCategoryIds, setFilterCategoryIds] = useState<string[]>([])
    const [filterUncategorizedOnly, setFilterUncategorizedOnly] =
        useState(false)
    const [filterAmountMin, setFilterAmountMin] = useState("")
    const [filterAmountMax, setFilterAmountMax] = useState("")
    const [filterDescriptionQuery, setFilterDescriptionQuery] = useState("")
    const [filterInstallmentsOnly, setFilterInstallmentsOnly] = useState(false)
    const [filterInstallmentPlanId, setFilterInstallmentPlanId] = useState<
        string | null
    >(null)
    const [filterSubscriptionId, setFilterSubscriptionId] = useState<
        string | null
    >(null)
    const [periodDraftFrom, setPeriodDraftFrom] = useState(initialPeriodDraftFrom)
    const [periodDraftTo, setPeriodDraftTo] = useState(initialPeriodDraftTo)
    const [periodDraftDirty, setPeriodDraftDirty] = useState(false)
    const suppressPeriodDraftDirtyRef = useRef(false)
    const [filtersSheetOpen, setFiltersSheetOpen] = useState(false)
    const installmentPlans = installmentPlansFromQuery
    const subscriptions = subscriptionsFromQuery
    const [sortKey, setSortKey] = useState<SortKey>("date")
    const [sortDir, setSortDir] = useState<SortDir>("desc")

    const transactionsRangeKey = useMemo(
        () =>
            fullPeriod
                ? { from: "__full__", to: "__full__" }
                : {
                      from: filterDateFrom || "__empty__",
                      to: filterDateTo || "__empty__",
                  },
        [fullPeriod, filterDateFrom, filterDateTo],
    )

    const transactionsFiltersKey = useMemo(
        () =>
            JSON.stringify({
                filterType,
                filterCreditCardIds: [...filterCreditCardIds].sort(),
                filterPaymentMethods: [...filterPaymentMethods].sort(),
                filterCategoryIds: [...filterCategoryIds].sort(),
                filterUncategorizedOnly,
                filterAmountMin,
                filterAmountMax,
                filterDescriptionQuery,
                filterInstallmentsOnly,
                filterInstallmentPlanId,
                filterSubscriptionId,
                lockedId,
                page,
                sortKey,
                sortDir,
            }),
        [
            filterType,
            filterCreditCardIds,
            filterPaymentMethods,
            filterCategoryIds,
            filterUncategorizedOnly,
            filterAmountMin,
            filterAmountMax,
            filterDescriptionQuery,
            filterInstallmentsOnly,
            filterInstallmentPlanId,
            filterSubscriptionId,
            lockedId,
            page,
            sortKey,
            sortDir,
        ],
    )

    const listQuery = useQuery({
        queryKey: transactionsKeys.list(
            currentWorkspaceId ?? "__none__",
            transactionsRangeKey,
            transactionsFiltersKey,
        ),
        queryFn: () =>
            fetchTransactionsListPage({
                workspaceId: currentWorkspaceId!,
                pageIndex: page,
                filterType,
                fullPeriod,
                filterDateFrom,
                filterDateTo,
                lockedCategoryId: lockedId,
                filterCreditCardIds,
                filterPaymentMethods,
                filterCategoryIds,
                filterUncategorizedOnly,
                filterAmountMin,
                filterAmountMax,
                filterDescriptionQuery,
                filterInstallmentsOnly,
                filterInstallmentPlanId,
                filterSubscriptionId,
                sortKey,
                sortDir,
            }),
        enabled: workspaceBootstrap,
        placeholderData: keepPreviousData,
        staleTime: 60_000,
    })

    const transactions = useMemo(
        () =>
            attachPaymentCards(
                listQuery.data?.transactions ?? [],
                creditCards,
            ),
        [creditCards, listQuery.data],
    )

    const totalCount =
        listQuery.data != null ? listQuery.data.totalCount : null

    const loading =
        authLoading ||
        workspaceLoading ||
        (workspaceBootstrap &&
            (categoriesQuery.isPending ||
                creditCardsQuery.isPending ||
                workspaceAuxQuery.isPending ||
                listQuery.isPending))

    const tableLoading = listQuery.isFetching && !listQuery.isPending

    const [didAutoOpen, setDidAutoOpen] = useState(false)
    const [didAutoOpenTxn, setDidAutoOpenTxn] = useState(false)
    const [detailTransaction, setDetailTransaction] =
        useState<Transaction | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [detailLaunchEdit, setDetailLaunchEdit] = useState(false)

    const skipUrlWriteRef = useRef(true)

    useLayoutEffect(() => {
        if (!lockedId) return
        setFilterCategoryIds((prev) =>
            prev.length === 1 && prev[0] === lockedId ? prev : [lockedId]
        )
        setFilterUncategorizedOnly(false)
    }, [lockedId])

    useLayoutEffect(() => {
        if (!lockTransactionType) return
        setFilterType(initialFilterType)
    }, [initialFilterType, lockTransactionType])

    useEffect(() => {
        if (!isEmbedded) return
        if (!defaultPeriodKey || !defaultPeriod) return
        // Embedded lists should not inherit the host route query string; the parent supplies the month window.
        setFullPeriod(defaultPeriod.fullPeriod)
        setDatePreset(null)
        setFilterDateFrom(defaultPeriod.from)
        setFilterDateTo(defaultPeriod.to)
        setPeriodDraftFrom(defaultPeriod.from)
        setPeriodDraftTo(defaultPeriod.to)
        setPeriodDraftDirty(false)
    }, [defaultPeriod, defaultPeriodKey, isEmbedded])

    const syncPeriodDraftToApplied = useCallback(() => {
        suppressPeriodDraftDirtyRef.current = true
        if (fullPeriod) {
            setPeriodDraftFrom("")
            setPeriodDraftTo("")
        } else {
            setPeriodDraftFrom(filterDateFrom || "")
            setPeriodDraftTo(filterDateTo || "")
        }
        setPeriodDraftDirty(false)
        requestAnimationFrame(() => {
            suppressPeriodDraftDirtyRef.current = false
        })
    }, [filterDateFrom, filterDateTo, fullPeriod])

    const handlePeriodDraftFromChange = useCallback((v: string) => {
        setPeriodDraftFrom(v)
        if (!suppressPeriodDraftDirtyRef.current) setPeriodDraftDirty(true)
    }, [])

    const handlePeriodDraftToChange = useCallback((v: string) => {
        setPeriodDraftTo(v)
        if (!suppressPeriodDraftDirtyRef.current) setPeriodDraftDirty(true)
    }, [])

    useEffect(() => {
        if (!isPage) return

        const typeParam = searchParams.get("type")
        if (typeParam === "income" || typeParam === "expense") {
            setFilterType(typeParam)
        } else {
            setFilterType("all")
        }

        const presetParam = searchParams.get("preset")
        if (
            presetParam &&
            TRANSACTIONS_PRESET_KEYS.includes(
                presetParam as TransactionsDatePresetKey
            )
        ) {
            const r = getTransactionsPresetRange(
                presetParam as TransactionsDatePresetKey
            )
            setFullPeriod(false)
            setFilterDateFrom(r.from)
            setFilterDateTo(r.to)
            setDatePreset(presetParam as TransactionsDatePresetKey)
        } else {
            const fromParam = searchParams.get("from")
            const toParam = searchParams.get("to")
            if (fromParam || toParam) {
                setFullPeriod(false)
                setDatePreset(null)
                setFilterDateFrom(fromParam ?? "")
                setFilterDateTo(toParam ?? "")
            } else {
                setFullPeriod(true)
                setFilterDateFrom("")
                setFilterDateTo("")
                setDatePreset(null)
            }
        }

        const pmParam = searchParams.get("pm")
        if (pmParam) {
            const values = pmParam
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            const valid = values.filter((v) =>
                (PAYMENT_METHOD_VALUES as readonly string[]).includes(v)
            ) as PaymentMethod[]
            setFilterPaymentMethods(valid)
        } else {
            setFilterPaymentMethods([])
        }

        const cardParam = searchParams.get("card")
        if (cardParam) {
            const ids = cardParam
                .split(",")
                .map((s) => s.trim())
                .filter((id) => CARD_QUERY_UUID_RE.test(id))
            setFilterCreditCardIds(ids)
        } else {
            setFilterCreditCardIds([])
        }

        if (lockedId) {
            setFilterCategoryIds([lockedId])
            setFilterUncategorizedOnly(false)
        } else {
            const catsParam = searchParams.get("cats")
            if (catsParam) {
                const ids = catsParam
                    .split(",")
                    .map((s) => s.trim())
                    .filter((id) => CARD_QUERY_UUID_RE.test(id))
                setFilterCategoryIds(ids)
            } else {
                setFilterCategoryIds([])
            }

            setFilterUncategorizedOnly(searchParams.get("uncat") === "1")
        }

        const minP = searchParams.get("min")
        setFilterAmountMin(minP ?? "")
        const maxP = searchParams.get("max")
        setFilterAmountMax(maxP ?? "")

        const qParam = searchParams.get("q")
        setFilterDescriptionQuery(qParam ?? "")

        setFilterInstallmentsOnly(searchParams.get("inst") === "1")

        const planParam = searchParams.get("plan")
        if (planParam && CARD_QUERY_UUID_RE.test(planParam)) {
            setFilterInstallmentPlanId(planParam)
        } else {
            setFilterInstallmentPlanId(null)
        }

        const subParam = searchParams.get("sub")
        if (subParam && CARD_QUERY_UUID_RE.test(subParam)) {
            setFilterSubscriptionId(subParam)
        } else {
            setFilterSubscriptionId(null)
        }
    }, [isPage, lockedId, searchParams])

    const creditCardPaymentSelected = useMemo(
        () => filterPaymentMethods.includes("credit_card"),
        [filterPaymentMethods]
    )

    useEffect(() => {
        if (creditCardPaymentSelected) return
        if (filterCreditCardIds.length === 0) return
        setFilterCreditCardIds([])
    }, [creditCardPaymentSelected, filterCreditCardIds.length])

    useEffect(() => {
        if (!isPage) return
        const id = requestAnimationFrame(() => {
            skipUrlWriteRef.current = false
        })
        return () => cancelAnimationFrame(id)
    }, [isPage])

    useEffect(() => {
        if (!isPage) return
        if (skipUrlWriteRef.current) return
        const next = buildTransactionsListSearchParams({
            filterType,
            filterInstallmentsOnly,
            fullPeriod,
            datePreset,
            filterDateFrom,
            filterDateTo,
            filterCreditCardIds,
            filterPaymentMethods,
            filterCategoryIds,
            filterUncategorizedOnly,
            filterAmountMin,
            filterAmountMax,
            filterDescriptionQuery,
            filterInstallmentPlanId,
            filterSubscriptionId,
            lockedCategoryId: lockedId,
        })
        const merged = mergeTransactionsSearchParams(searchParams, next)
        const qs = merged.toString()
        if (qs === searchParams.toString()) return
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }, [
        isPage,
        filterType,
        fullPeriod,
        datePreset,
        filterDateFrom,
        filterDateTo,
        filterCreditCardIds,
        filterPaymentMethods,
        filterCategoryIds,
        filterUncategorizedOnly,
        filterAmountMin,
        filterAmountMax,
        filterDescriptionQuery,
        filterInstallmentsOnly,
        filterInstallmentPlanId,
        filterSubscriptionId,
        lockedId,
        pathname,
        router,
        searchParams,
    ])

    useEffect(() => {
        setPage(0)
    }, [
        filterType,
        fullPeriod,
        filterDateFrom,
        filterDateTo,
        lockedId,
        datePreset,
        filterCreditCardIds,
        filterPaymentMethods,
        filterCategoryIds,
        filterUncategorizedOnly,
        filterAmountMin,
        filterAmountMax,
        filterDescriptionQuery,
        filterInstallmentsOnly,
        filterInstallmentPlanId,
        filterSubscriptionId,
    ])

    const refreshAll = useCallback(async () => {
        if (!user || !currentWorkspaceId) return
        await invalidateWorkspaceData(queryClient, currentWorkspaceId, {
            domains: [
                "transactions",
                "categories",
                "credit_cards",
                "credit_card_expense_rows",
                "bills",
            ],
        })
    }, [user, currentWorkspaceId, queryClient])

    const prevWorkspaceIdRef = useRef<string | null>(null)
    useEffect(() => {
        if (prevWorkspaceIdRef.current === currentWorkspaceId) return
        prevWorkspaceIdRef.current = currentWorkspaceId
        setPage(0)
    }, [currentWorkspaceId])

    const openDialog = useCallback(
        (transaction?: Transaction, mode?: NewTransactionMode) => {
            if (transaction) {
                setEditingTransaction(transaction)
                setDialogOpen(true)
                return
            }
            if (globalTransactionCreate) {
                globalTransactionCreate.openCreate(mode ?? "expense")
                return
            }
            const q =
                mode === "installment"
                    ? "parcelada"
                    : mode === "income"
                      ? "receita"
                      : "1"
            router.push(`${ROUTES.TRANSACTIONS}?new=${encodeURIComponent(q)}`)
        },
        [globalTransactionCreate, router]
    )

    const handleDialogOpenChange = useCallback((open: boolean) => {
        setDialogOpen(open)
        if (!open) {
            setEditingTransaction(null)
        }
    }, [])

    useEffect(() => {
        if (!isPage) return
        if (didAutoOpen) return
        if (loading) return
        if (dialogOpen) return

        const rawNew = searchParams?.get("new")
        const shouldOpen =
            rawNew === "1" || rawNew === "parcelada" || rawNew === "receita"
        if (!shouldOpen) return

        setDidAutoOpen(true)
        const mode: NewTransactionMode =
            rawNew === "parcelada"
                ? "installment"
                : rawNew === "receita"
                  ? "income"
                  : "expense"
        openDialog(undefined, mode)

        const nextParams = new URLSearchParams(searchParams.toString())
        nextParams.delete("new")
        const qs = nextParams.toString()
        router.replace(qs ? `${pathname}?${qs}` : pathname)
    }, [
        didAutoOpen,
        dialogOpen,
        isPage,
        loading,
        pathname,
        router,
        searchParams,
        openDialog,
    ])

    useEffect(() => {
        setSelectedIds(new Set())
    }, [
        page,
        filterType,
        fullPeriod,
        filterDateFrom,
        filterDateTo,
        lockedId,
        datePreset,
        filterCreditCardIds,
        filterPaymentMethods,
        filterCategoryIds,
        filterUncategorizedOnly,
        filterAmountMin,
        filterAmountMax,
        filterDescriptionQuery,
        filterInstallmentPlanId,
        filterSubscriptionId,
        sortKey,
        sortDir,
        currentWorkspaceId,
    ])

    const openTransactionDetail = useCallback(
        (t: Transaction, options?: { edit?: boolean }) => {
            setDetailTransaction(t)
            setDetailOpen(true)
            setDetailLaunchEdit(options?.edit === true)
        },
        []
    )

    useEffect(() => {
        if (!isPage) return
        if (didAutoOpenTxn) return
        if (loading) return
        if (!currentWorkspaceId) return
        if (detailOpen) return

        const txnParam = searchParams?.get("txn")?.trim() ?? ""
        if (!txnParam || !CARD_QUERY_UUID_RE.test(txnParam)) return

        let cancelled = false

        const openFromTxnParam = async () => {
            const inList = transactions.find((t) => t.id === txnParam) ?? null
            if (inList) {
                setDidAutoOpenTxn(true)
                openTransactionDetail(inList)
            } else {
                const { data, error } = await supabase
                    .from("transactions")
                    .select("*")
                    .eq("id", txnParam)
                    .eq("workspace_id", currentWorkspaceId)
                    .maybeSingle()

                if (cancelled) return
                if (error || !data) {
                    setDidAutoOpenTxn(true)
                    return
                }

                setDidAutoOpenTxn(true)
                openTransactionDetail(data as Transaction)
            }

            const nextParams = new URLSearchParams(searchParams.toString())
            nextParams.delete("txn")
            const qs = nextParams.toString()
            router.replace(qs ? `${pathname}?${qs}` : pathname)
        }

        void openFromTxnParam()

        return () => {
            cancelled = true
        }
    }, [
        currentWorkspaceId,
        detailOpen,
        didAutoOpenTxn,
        isPage,
        loading,
        openTransactionDetail,
        pathname,
        router,
        searchParams,
        transactions,
    ])

    const handleDetailLaunchEditConsumed = useCallback(() => {
        setDetailLaunchEdit(false)
    }, [])

    const handleSave = async (payload: TransactionFormSavePayload): Promise<boolean> => {
        if (!user || !currentWorkspaceId) return false

        setSaving(true)
        const ok = await persistTransactionSave({
            supabase,
            user,
            workspaceId: currentWorkspaceId,
            payload,
            resolveEditingTransaction: (editingId) =>
                editingTransaction?.id === editingId
                    ? editingTransaction
                    : (transactions.find((t) => t.id === editingId) ?? null),
            onAfterSuccess: async () => {
                await refreshAll()
                emitWorkspaceDataChanged()
            },
        })
        setSaving(false)
        return ok
    }

    const handleSaveInstallmentPlan = async (
        payload: InstallmentPlanFormSavePayload
    ): Promise<boolean> => {
        if (!user || !currentWorkspaceId) return false

        setSaving(true)
        const ok = await persistInstallmentPlanCreate({
            supabase,
            user,
            workspaceId: currentWorkspaceId,
            payload,
            onAfterSuccess: async () => {
                await refreshAll()
                emitWorkspaceDataChanged()
            },
        })
        setSaving(false)
        return ok
    }

    const handleUpdateInstallmentPlan = async (
        planId: string,
        payload: InstallmentPlanUpdatePayload
    ): Promise<boolean> => {
        if (!user || !currentWorkspaceId) return false

        setSaving(true)
        const ok = await persistInstallmentPlanUpdate({
            supabase,
            planId,
            payload,
            onAfterSuccess: async () => {
                await refreshAll()
                emitWorkspaceDataChanged()
            },
        })
        setSaving(false)
        return ok
    }

    const confirmDelete = async () => {
        if (!pendingDelete) return

        setDeleting(true)
        const mode = pendingDelete.mode
        const ids =
            mode === "single"
                ? [pendingDelete.transaction.id]
                : pendingDelete.ids

        if (!currentWorkspaceId) return
        const ok = await deleteTransactionsByIds(supabase, ids, currentWorkspaceId)
        if (!ok) {
            setDeleting(false)
            return
        }

        const deletedCount = ids.length
        setPendingDelete(null)
        setDeleting(false)
        setSelectedIds(new Set())

        const stepBack = deletedCount >= transactions.length && page > 0
        if (stepBack) {
            setPage(page - 1)
        } else {
            await refreshAll()
        }
        emitWorkspaceDataChanged()
    }

    const toggleSort = (key: SortKey) => {
        setPage(0)
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"))
        } else {
            setSortKey(key)
            setSortDir(key === "date" ? "desc" : "desc")
        }
    }

    const resetAllFilters = useCallback(() => {
        setFilterType(lockTransactionType ? initialFilterType : "all")
        if (isEmbedded && defaultPeriod) {
            setFullPeriod(defaultPeriod.fullPeriod)
            setDatePreset(null)
            setFilterDateFrom(defaultPeriod.from)
            setFilterDateTo(defaultPeriod.to)
            setPeriodDraftFrom(defaultPeriod.from)
            setPeriodDraftTo(defaultPeriod.to)
        } else {
            setFullPeriod(true)
            setFilterDateFrom("")
            setFilterDateTo("")
            setDatePreset(null)
            setPeriodDraftFrom("")
            setPeriodDraftTo("")
        }
        setFilterPaymentMethods([])
        setFilterCreditCardIds([])
        if (lockedId) {
            setFilterCategoryIds([lockedId])
        } else {
            setFilterCategoryIds([])
        }
        setFilterUncategorizedOnly(false)
        setFilterAmountMin("")
        setFilterAmountMax("")
        setFilterDescriptionQuery("")
        setFilterInstallmentsOnly(false)
        setFilterInstallmentPlanId(null)
        setFilterSubscriptionId(null)
        setSortKey("date")
        setSortDir("desc")
    }, [defaultPeriod, initialFilterType, isEmbedded, lockTransactionType, lockedId])

    const clearPeriodFilter = useCallback(() => {
        suppressPeriodDraftDirtyRef.current = true
        if (isEmbedded && defaultPeriod) {
            setFullPeriod(defaultPeriod.fullPeriod)
            setDatePreset(null)
            setFilterDateFrom(defaultPeriod.from)
            setFilterDateTo(defaultPeriod.to)
            setPeriodDraftFrom(defaultPeriod.from)
            setPeriodDraftTo(defaultPeriod.to)
        } else {
            setFullPeriod(true)
            setFilterDateFrom("")
            setFilterDateTo("")
            setDatePreset(null)
            setPeriodDraftFrom("")
            setPeriodDraftTo("")
        }
        setPeriodDraftDirty(false)
        requestAnimationFrame(() => {
            suppressPeriodDraftDirtyRef.current = false
        })
    }, [defaultPeriod, isEmbedded])

    const handleSelectFullPeriod = useCallback(() => {
        if (isEmbedded && defaultPeriod) {
            setFullPeriod(defaultPeriod.fullPeriod)
            setDatePreset(null)
            setFilterDateFrom(defaultPeriod.from)
            setFilterDateTo(defaultPeriod.to)
            setPeriodDraftFrom(defaultPeriod.from)
            setPeriodDraftTo(defaultPeriod.to)
            return
        }
        setFullPeriod(true)
        setFilterDateFrom("")
        setFilterDateTo("")
        setDatePreset(null)
    }, [defaultPeriod, isEmbedded])

    const toggleFilterCategory = useCallback(
        (id: string) => {
            if (lockedId) return
            setFilterCategoryIds((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
        },
        [lockedId]
    )

    const clearAllCategoryFilters = useCallback(() => {
        if (lockedId) return
        setFilterCategoryIds([])
    }, [lockedId])

    const handleUncategorizedOnlyChange = useCallback(
        (v: boolean) => {
            if (lockedId) return
            setFilterUncategorizedOnly(v)
            if (v) setFilterCategoryIds([])
        },
        [lockedId]
    )

    const advancedFiltersActive = useMemo(
        () =>
            filterPaymentMethods.length > 0 ||
            filterCreditCardIds.length > 0 ||
            (!lockedId && filterCategoryIds.length > 0) ||
            (!lockedId && filterUncategorizedOnly) ||
            filterAmountMin.trim() !== "" ||
            filterAmountMax.trim() !== "" ||
            filterDescriptionQuery.trim() !== "" ||
            filterInstallmentPlanId != null ||
            filterSubscriptionId != null,
        [
            filterPaymentMethods,
            filterCreditCardIds,
            lockedId,
            filterCategoryIds,
            filterUncategorizedOnly,
            filterAmountMin,
            filterAmountMax,
            filterDescriptionQuery,
            filterInstallmentPlanId,
            filterSubscriptionId,
        ]
    )

    const periodCountsAsActiveFilter = useMemo(() => {
        if (lockPeriodToDefault && defaultPeriod) {
            if (datePreset != null) return true
            if (fullPeriod !== defaultPeriod.fullPeriod) return true
            if (!fullPeriod && !defaultPeriod.fullPeriod) {
                return (
                    filterDateFrom !== defaultPeriod.from ||
                    filterDateTo !== defaultPeriod.to
                )
            }
            return false
        }
        return !fullPeriod
    }, [
        datePreset,
        defaultPeriod,
        filterDateFrom,
        filterDateTo,
        fullPeriod,
        lockPeriodToDefault,
    ])

    const anyFiltersActive = useMemo(
        () =>
            filterType !== filterTypeBaseline ||
            periodCountsAsActiveFilter ||
            advancedFiltersActive,
        [
            advancedFiltersActive,
            filterType,
            filterTypeBaseline,
            periodCountsAsActiveFilter,
        ]
    )

    const filtersPanelProps = useMemo(
        (): TransactionsFiltersPanelBaseProps => ({
            datePreset,
            periodDraftFrom,
            periodDraftTo,
            onPeriodDraftFromChange: handlePeriodDraftFromChange,
            onPeriodDraftToChange: handlePeriodDraftToChange,
            onPresetChange: ({ preset, from, to }) => {
                suppressPeriodDraftDirtyRef.current = true
                setDatePreset(preset)
                setFilterDateFrom(from)
                setFilterDateTo(to)
                setFullPeriod(false)
                setPeriodDraftFrom(from)
                setPeriodDraftTo(to)
                setPeriodDraftDirty(false)
                requestAnimationFrame(() => {
                    suppressPeriodDraftDirtyRef.current = false
                })
            },
            onDateRangeApply: ({ from, to }) => {
                suppressPeriodDraftDirtyRef.current = true
                setDatePreset(null)
                setFilterDateFrom(from)
                setFilterDateTo(to)
                setFullPeriod(false)
                setPeriodDraftFrom(from)
                setPeriodDraftTo(to)
                setPeriodDraftDirty(false)
                requestAnimationFrame(() => {
                    suppressPeriodDraftDirtyRef.current = false
                })
            },
            onClearPeriodFilter: clearPeriodFilter,
            periodIdPrefix: "tx-range-mobile",
            paymentMethods: filterPaymentMethods,
            onTogglePaymentMethod: (method) => {
                setFilterPaymentMethods((prev) =>
                    prev.includes(method)
                        ? prev.filter((x) => x !== method)
                        : [...prev, method]
                )
            },
            creditCardIds: filterCreditCardIds,
            onToggleCreditCardId: (id) => {
                setFilterCreditCardIds((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                )
            },
            creditCards,
            categoryIds: filterCategoryIds,
            onToggleCategory: toggleFilterCategory,
            onClearAllCategories: clearAllCategoryFilters,
            uncategorizedOnly: filterUncategorizedOnly,
            onUncategorizedOnlyChange: handleUncategorizedOnlyChange,
            categories,
            amountMin: filterAmountMin,
            amountMax: filterAmountMax,
            onAmountMinChange: setFilterAmountMin,
            onAmountMaxChange: setFilterAmountMax,
            descriptionQuery: filterDescriptionQuery,
            onDescriptionQueryChange: setFilterDescriptionQuery,
            installmentPlanId: filterInstallmentPlanId,
            onInstallmentPlanIdChange: setFilterInstallmentPlanId,
            installmentPlans,
            subscriptionId: filterSubscriptionId,
            onSubscriptionIdChange: setFilterSubscriptionId,
            subscriptions,
            lockedCategoryId: lockedId ?? undefined,
        }),
        [
            datePreset,
            periodDraftFrom,
            periodDraftTo,
            clearPeriodFilter,
            handlePeriodDraftFromChange,
            handlePeriodDraftToChange,
            filterPaymentMethods,
            filterCreditCardIds,
            creditCards,
            filterCategoryIds,
            toggleFilterCategory,
            clearAllCategoryFilters,
            filterUncategorizedOnly,
            handleUncategorizedOnlyChange,
            categories,
            filterAmountMin,
            filterAmountMax,
            filterDescriptionQuery,
            filterInstallmentPlanId,
            installmentPlans,
            filterSubscriptionId,
            subscriptions,
            lockedId,
        ]
    )

    useEffect(() => {
        if (!filtersSheetOpen) {
            syncPeriodDraftToApplied()
            return
        }
        if (!periodDraftDirty) {
            syncPeriodDraftToApplied()
        }
    }, [
        datePreset,
        filterDateFrom,
        filterDateTo,
        filtersSheetOpen,
        fullPeriod,
        periodDraftDirty,
        syncPeriodDraftToApplied,
    ])

    const hasNoTransactions = !workspaceHasTransactions
    const hasNoMatches =
        workspaceHasTransactions && totalCount === 0 && !tableLoading


  return {
    user,
    authLoading,
    currentWorkspaceId,
    workspaceLoading,
    workspaceError,
    router,
    pathname,
    searchParams,
    transactions,
    categories,
    creditCards,
    workspaceHasTransactions,
    invoicePaidByCardClose,
    totalCount,
    page,
    setPage,
    loading,
    tableLoading,
    dialogOpen,
    setDialogOpen,
    editingTransaction,
    setEditingTransaction,
    saving,
    setSaving,
    pendingDelete,
    setPendingDelete,
    deleting,
    setDeleting,
    selectedIds,
    setSelectedIds,
    filterType,
    setFilterType,
    fullPeriod,
    setFullPeriod,
    filterDateFrom,
    setFilterDateFrom,
    filterDateTo,
    setFilterDateTo,
    datePreset,
    setDatePreset,
    filterPaymentMethods,
    setFilterPaymentMethods,
    filterCreditCardIds,
    setFilterCreditCardIds,
    filterCategoryIds,
    setFilterCategoryIds,
    filterUncategorizedOnly,
    setFilterUncategorizedOnly,
    filterAmountMin,
    setFilterAmountMin,
    filterAmountMax,
    setFilterAmountMax,
    filterDescriptionQuery,
    setFilterDescriptionQuery,
    filterInstallmentsOnly,
    setFilterInstallmentsOnly,
    filterInstallmentPlanId,
    setFilterInstallmentPlanId,
    filterSubscriptionId,
    setFilterSubscriptionId,
    periodDraftFrom,
    setPeriodDraftFrom,
    periodDraftTo,
    setPeriodDraftTo,
    periodDraftDirty,
    setPeriodDraftDirty,
    suppressPeriodDraftDirtyRef,
    filtersSheetOpen,
    setFiltersSheetOpen,
    installmentPlans,
    subscriptions,
    sortKey,
    setSortKey,
    sortDir,
    setSortDir,
    didAutoOpen,
    setDidAutoOpen,
    detailTransaction,
    setDetailTransaction,
    detailOpen,
    setDetailOpen,
    detailLaunchEdit,
    setDetailLaunchEdit,
    skipUrlWriteRef,
    syncPeriodDraftToApplied,
    handlePeriodDraftFromChange,
    handlePeriodDraftToChange,
    creditCardPaymentSelected,
    refreshAll,
    openDialog,
    openTransactionDetail,
    handleDetailLaunchEditConsumed,
    handleDialogOpenChange,
    handleSave,
    handleSaveInstallmentPlan,
    handleUpdateInstallmentPlan,
    confirmDelete,
    toggleSort,
    resetAllFilters,
    clearPeriodFilter,
    handleSelectFullPeriod,
    toggleFilterCategory,
    clearAllCategoryFilters,
    handleUncategorizedOnlyChange,
    advancedFiltersActive,
    anyFiltersActive,
    lockPeriodToDefault,
    filtersPanelProps,
    hasNoTransactions,
    hasNoMatches,
  }
}
