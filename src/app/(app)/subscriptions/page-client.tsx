"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import {
    supabase,
    type WorkspaceSubscription,
    type WorkspaceSubscriptionListRow,
} from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { toastError, toastSuccess } from "@/lib/toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Pencil,
    Plus,
    Repeat,
    SearchX,
    Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/config/navigation"
import { SubscriptionFormDialog } from "@/components/subscriptions/subscription-form-dialog"
import { SubscriptionDetailSheet } from "@/components/subscriptions/subscription-detail-sheet"
import { SubscriptionsPageSkeleton } from "@/components/subscriptions/subscriptions-page-skeleton"
import {
    SubscriptionsToolbar,
    type SubscriptionSortDir,
    type SubscriptionSortKey,
    type SubscriptionStatusFilter,
} from "@/components/subscriptions/subscriptions-toolbar"
import {
    subscriptionBillingIntervalLabel,
    type SubscriptionFormPayload,
} from "@/components/subscriptions/subscription-form-shared"
import { tagChipSuccess } from "@/lib/tag-chip-classes"
import {
    formatSubscriptionChargeDatePtBr,
    formatSubscriptionTxSummary,
} from "@/lib/subscription-tx-summary"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { useSubscriptionsPageBundle } from "@/lib/queries/use-subscriptions-page-bundle"

type SortKey = SubscriptionSortKey
type SortDir = SubscriptionSortDir

type PendingDelete =
    | { mode: "single"; subscription: WorkspaceSubscriptionListRow }
    | { mode: "bulk"; ids: string[] }

function formatMoneyBRL(amount: number): string {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(amount)
}

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
    if (!active) {
        return (
            <ArrowUpDown
                className="ml-1 size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
            />
        )
    }
    return dir === "asc" ? (
        <ArrowUp
            className="ml-1 size-3.5 shrink-0 text-foreground"
            aria-hidden
        />
    ) : (
        <ArrowDown
            className="ml-1 size-3.5 shrink-0 text-foreground"
            aria-hidden
        />
    )
}

function compareSubscriptions(
    a: WorkspaceSubscriptionListRow,
    b: WorkspaceSubscriptionListRow,
    key: SortKey,
    dir: SortDir
): number {
    const inv = dir === "asc" ? 1 : -1
    if (key === "name") {
        return a.name.localeCompare(b.name, "pt-BR") * inv
    }
    if (key === "amount") {
        const na = Number(a.amount)
        const nb = Number(b.amount)
        if (na === nb) return a.name.localeCompare(b.name, "pt-BR")
        return na < nb ? -inv : inv
    }
    const da = a.next_billing_date ?? a.start_date
    const db = b.next_billing_date ?? b.start_date
    if (!da && !db) return a.name.localeCompare(b.name, "pt-BR")
    if (!da) return 1
    if (!db) return -1
    const c = da.localeCompare(db)
    if (c !== 0) return c * inv
    return a.name.localeCompare(b.name, "pt-BR")
}

export default function SubscriptionsPageClient() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { user, loading: authLoading } = useAuth()
    const {
        currentWorkspaceId,
        loading: workspaceLoading,
        error: workspaceError,
    } = useWorkspace()

    const bundleQuery = useSubscriptionsPageBundle(
        !authLoading && !workspaceLoading && currentWorkspaceId
            ? currentWorkspaceId
            : null,
        Boolean(user && !authLoading && !workspaceLoading),
    )
    const bundle = bundleQuery.data
    const rows = useMemo(() => bundle?.rows ?? [], [bundle?.rows])
    const categories = useMemo(
        () => bundle?.categories ?? [],
        [bundle?.categories],
    )
    const creditCards = useMemo(
        () => bundle?.creditCards ?? [],
        [bundle?.creditCards],
    )
    const billingStats = useMemo(
        () => bundle?.billingStats ?? {},
        [bundle?.billingStats],
    )
    const tableMissing = bundle?.tableMissing ?? false

    const loading =
        authLoading ||
        workspaceLoading ||
        (Boolean(user && currentWorkspaceId) && bundleQuery.isPending)
    const tableLoading = bundleQuery.isRefetching

    const refreshBundle = useCallback(async () => {
        if (!currentWorkspaceId) return
        await invalidateWorkspaceData(queryClient, currentWorkspaceId, {
            domains: ["subscriptions", "transactions"],
        })
    }, [currentWorkspaceId, queryClient])

    const [saving, setSaving] = useState(false)
    const [activeToggleSaving, setActiveToggleSaving] = useState(false)

    const [formOpen, setFormOpen] = useState(false)
    const [editingSubscription, setEditingSubscription] =
        useState<WorkspaceSubscription | null>(null)

    const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
        null
    )
    const [deleting, setDeleting] = useState(false)

    const didConsumeNewQuery = useRef(false)

    const [statusFilter, setStatusFilter] =
        useState<SubscriptionStatusFilter>("all")
    const [sortKey, setSortKey] = useState<SortKey>("name")
    const [sortDir, setSortDir] = useState<SortDir>("asc")

    const [selectedIds, setSelectedIds] = useState(() => new Set<string>())
    const [detailSub, setDetailSub] =
        useState<WorkspaceSubscriptionListRow | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [detailLaunchEdit, setDetailLaunchEdit] = useState(false)

    const expenseCategories = useMemo(
        () => categories.filter((c) => c.type === "expense"),
        [categories]
    )

    const prevWorkspaceIdRef = useRef<string | null>(null)
    useEffect(() => {
        if (prevWorkspaceIdRef.current === currentWorkspaceId) return
        prevWorkspaceIdRef.current = currentWorkspaceId
        setSelectedIds(new Set())
        setStatusFilter("all")
        setSortKey("name")
        setSortDir("asc")
    }, [currentWorkspaceId])

    useEffect(() => {
        setSelectedIds(new Set())
    }, [statusFilter, sortKey, sortDir, currentWorkspaceId])

    useEffect(() => {
        didConsumeNewQuery.current = false
    }, [currentWorkspaceId])

    const filteredSorted = useMemo(() => {
        let list = rows.filter((r) => {
            if (statusFilter === "active" && !r.is_active) return false
            if (statusFilter === "inactive" && r.is_active) return false
            return true
        })
        list = [...list].sort((a, b) =>
            compareSubscriptions(a, b, sortKey, sortDir)
        )
        return list
    }, [rows, statusFilter, sortKey, sortDir])

    const hasNoSubscriptions = rows.length === 0
    const hasNoMatches =
        rows.length > 0 && filteredSorted.length === 0 && !tableLoading

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"))
        } else {
            setSortKey(key)
            setSortDir(
                key === "name" ? "asc" : key === "amount" ? "desc" : "asc"
            )
        }
    }

    const resetFilters = () => {
        setStatusFilter("all")
        setSortKey("name")
        setSortDir("asc")
    }

    const openCreate = () => {
        setEditingSubscription(null)
        setFormOpen(true)
    }

    useEffect(() => {
        if (authLoading || workspaceLoading || loading) return
        if (formOpen) return
        if (didConsumeNewQuery.current) return
        if (searchParams.get("new") !== "1") return

        didConsumeNewQuery.current = true
        setEditingSubscription(null)
        setFormOpen(true)

        const nextParams = new URLSearchParams(searchParams.toString())
        nextParams.delete("new")
        const qs = nextParams.toString()
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }, [
        authLoading,
        workspaceLoading,
        loading,
        formOpen,
        pathname,
        router,
        searchParams,
    ])

    const openDetail = useCallback(
        (s: WorkspaceSubscriptionListRow, opts?: { edit?: boolean }) => {
            setDetailSub(s)
            setDetailOpen(true)
            setDetailLaunchEdit(opts?.edit === true)
        },
        []
    )

    const handleDetailLaunchEditConsumed = useCallback(() => {
        setDetailLaunchEdit(false)
    }, [])

    const handleFormOpenChange = (open: boolean) => {
        if (!open && saving) return
        setFormOpen(open)
        if (!open) {
            setEditingSubscription(null)
        }
    }

    const handleSaveSubscription = async (
        payload: SubscriptionFormPayload,
        subscriptionIdForUpdate?: string | null
    ): Promise<boolean> => {
        if (!user || !currentWorkspaceId) return false

        const updateId = subscriptionIdForUpdate ?? editingSubscription?.id

        setSaving(true)
        try {
            if (updateId) {
                const { error } = await supabase
                    .from("workspace_subscriptions")
                    .update({ ...payload })
                    .eq("id", updateId)
                if (error) {
                    toastError(
                        formatSupabasePostgrestError(error) ??
                            "Não foi possível salvar a assinatura."
                    )
                    return false
                }
                toastSuccess("Assinatura atualizada.")
            } else {
                const { error } = await supabase
                    .from("workspace_subscriptions")
                    .insert({
                        workspace_id: currentWorkspaceId,
                        user_id: user.id,
                        ...payload,
                    })
                if (error) {
                    toastError(
                        formatSupabasePostgrestError(error) ??
                            "Não foi possível cadastrar a assinatura."
                    )
                    return false
                }
                toastSuccess("Assinatura cadastrada.")
            }
            void refreshBundle()
            return true
        } finally {
            setSaving(false)
        }
    }

    const handleToggleSubscriptionActive = useCallback(
        async (id: string, next: boolean): Promise<boolean> => {
            if (!user || !currentWorkspaceId) return false
            setActiveToggleSaving(true)
            try {
                const { error } = await supabase
                    .from("workspace_subscriptions")
                    .update({ is_active: next })
                    .eq("id", id)
                if (error) {
                    toastError(
                        formatSupabasePostgrestError(error) ??
                            "Não foi possível atualizar o status."
                    )
                    return false
                }
                await refreshBundle()
                return true
            } finally {
                setActiveToggleSaving(false)
            }
        },
        [user, currentWorkspaceId, refreshBundle]
    )

    const confirmDelete = async () => {
        if (!pendingDelete) return

        setDeleting(true)
        const mode = pendingDelete.mode

        const { error: dErr } =
            mode === "single"
                ? await supabase
                      .from("workspace_subscriptions")
                      .delete()
                      .eq("id", pendingDelete.subscription.id)
                : await supabase
                      .from("workspace_subscriptions")
                      .delete()
                      .in("id", pendingDelete.ids)

        setDeleting(false)
        if (dErr) {
            toastError(
                formatSupabasePostgrestError(dErr) ??
                    (mode === "single"
                        ? "Não foi possível excluir a assinatura."
                        : "Não foi possível excluir as assinaturas.")
            )
            return
        }

        const n = mode === "single" ? 1 : pendingDelete.ids.length
        toastSuccess(
            n === 1
                ? "Assinatura removida."
                : `${n.toLocaleString("pt-BR")} assinaturas removidas.`
        )
        setPendingDelete(null)
        setSelectedIds(new Set())
        setDetailOpen(false)
        setDetailSub(null)
        void refreshBundle()
    }

    useEffect(() => {
        if (!detailOpen || !detailSub) return
        const next = rows.find((r) => r.id === detailSub.id)
        if (next && next !== detailSub) setDetailSub(next)
    }, [rows, detailOpen, detailSub])

    const pageIds = filteredSorted.map((r) => r.id)
    const selectedOnPageCount = pageIds.filter((id) =>
        selectedIds.has(id)
    ).length
    const allPageSelected =
        pageIds.length > 0 && selectedOnPageCount === pageIds.length
    const somePageSelected =
        selectedOnPageCount > 0 &&
        selectedOnPageCount < pageIds.length

    if (workspaceError) {
        return (
            <Card>
                <CardContent className="py-6 text-sm text-red-500">
                    {workspaceError}
                </CardContent>
            </Card>
        )
    }

    if (!authLoading && !workspaceLoading && !currentWorkspaceId) {
        return (
            <Card>
                <CardContent className="py-6 text-sm text-muted-foreground">
                    Nenhum espaço de trabalho selecionado. Escolha um espaço no menu
                    lateral para continuar.
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return <SubscriptionsPageSkeleton />
    }

    if (tableMissing) {
        return (
            <div className="space-y-3">
                <Card>
                    <CardContent className="py-6 text-sm">
                        <p className="font-medium">Tabela ainda não criada no banco</p>
                        <p className="mt-2 text-muted-foreground">
                            Aplique a migração{" "}
                            <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                supabase/migrations/20260403150000_workspace_subscriptions.sql
                            </code>{" "}
                            e recarregue o schema do PostgREST (
                            <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                NOTIFY pgrst, &apos;reload schema&apos;;
                            </code>
                            ).
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <SubscriptionsToolbar
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={(k, d) => {
                    setSortKey(k)
                    setSortDir(d)
                }}
                onResetFilters={resetFilters}
                onNewSubscription={openCreate}
            />

            <SubscriptionFormDialog
                open={formOpen}
                onOpenChange={handleFormOpenChange}
                editingSubscription={editingSubscription}
                expenseCategories={expenseCategories}
                categoriesHref={ROUTES.DASHBOARD_CATEGORIES}
                creditCards={creditCards}
                creditCardsHref={ROUTES.CREDIT_CARDS}
                saving={saving}
                onSave={handleSaveSubscription}
            />

            {detailSub ? (
                <SubscriptionDetailSheet
                    subscription={detailSub}
                    open={detailOpen}
                    onOpenChange={(next) => {
                        setDetailOpen(next)
                        if (!next) {
                            setDetailSub(null)
                            setDetailLaunchEdit(false)
                        }
                    }}
                    txSummaryLine={formatSubscriptionTxSummary(
                        detailSub.id,
                        billingStats,
                        detailSub.next_billing_date ?? detailSub.start_date
                    )}
                    expenseCategories={expenseCategories}
                    categoriesHref={ROUTES.DASHBOARD_CATEGORIES}
                    creditCards={creditCards}
                    creditCardsHref={ROUTES.CREDIT_CARDS}
                    saving={saving}
                    onSave={handleSaveSubscription}
                    launchInEditMode={detailLaunchEdit}
                    onLaunchEditConsumed={handleDetailLaunchEditConsumed}
                    onDelete={(s) => {
                        setDetailOpen(false)
                        setDetailSub(null)
                        setPendingDelete({ mode: "single", subscription: s })
                    }}
                    onActiveChange={handleToggleSubscriptionActive}
                    activeToggleSaving={activeToggleSaving}
                />
            ) : null}

            {!hasNoSubscriptions && !hasNoMatches ? (
                <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent className="relative flex flex-col p-0">
                        {selectedIds.size > 0 ? (
                            <div className="border-b border-border bg-muted/40">
                                <div
                                    className="flex flex-col gap-3 px-3 py-3 sm:hidden"
                                    role="toolbar"
                                    aria-label="Ações da seleção"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="min-w-0 pt-0.5 text-sm font-medium leading-snug text-foreground">
                                            {selectedIds.size === 1
                                                ? "1 selecionada"
                                                : `${selectedIds.size.toLocaleString("pt-BR")} selecionadas`}
                                        </p>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="lg"
                                            className="shrink-0 px-3 text-xs text-muted-foreground hover:text-foreground"
                                            onClick={() =>
                                                setSelectedIds(new Set())
                                            }
                                        >
                                            Limpar
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-11 w-full gap-2 text-xs font-medium"
                                            disabled={selectedIds.size !== 1}
                                            onClick={() => {
                                                const id = [...selectedIds][0]
                                                const s = filteredSorted.find(
                                                    (x) => x.id === id
                                                )
                                                if (s) openDetail(s, { edit: true })
                                            }}
                                        >
                                            <Pencil className="size-3.5 shrink-0" />
                                            Editar
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="h-11 w-full gap-2 text-xs font-medium"
                                            onClick={() =>
                                                setPendingDelete({
                                                    mode: "bulk",
                                                    ids: [...selectedIds],
                                                })
                                            }
                                        >
                                            <Trash2 className="size-3.5 shrink-0" />
                                            Excluir
                                        </Button>
                                    </div>
                                    {selectedIds.size !== 1 ? (
                                        <p className="-mt-1 text-center text-[11px] leading-tight text-muted-foreground">
                                            Editar uma assinatura por vez
                                        </p>
                                    ) : null}
                                </div>
                                <div
                                    className="hidden px-4 py-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2"
                                    role="toolbar"
                                    aria-label="Ações da seleção"
                                >
                                    <span className="mr-auto text-xs tabular-nums text-muted-foreground">
                                        {selectedIds.size === 1
                                            ? "1 selecionada"
                                            : `${selectedIds.size.toLocaleString("pt-BR")} selecionadas`}
                                    </span>
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={() =>
                                                setSelectedIds(new Set())
                                            }
                                        >
                                            Limpar seleção
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs"
                                            disabled={selectedIds.size !== 1}
                                            onClick={() => {
                                                const id = [...selectedIds][0]
                                                const s = filteredSorted.find(
                                                    (x) => x.id === id
                                                )
                                                if (s) openDetail(s, { edit: true })
                                            }}
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={() =>
                                                setPendingDelete({
                                                    mode: "bulk",
                                                    ids: [...selectedIds],
                                                })
                                            }
                                        >
                                            Excluir
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        <div
                            className={cn(
                                "min-w-0 overflow-hidden",
                                selectedIds.size === 0 && "rounded-t-xl"
                            )}
                        >
                            <Table className="min-w-[720px] text-sm">
                                <TableHeader className="sticky top-0 z-10 bg-muted/50 [&_tr]:border-b-0">
                                    <TableRow className="border-0 hover:bg-transparent [&>th]:border-b [&>th]:border-border">
                                        <TableHead className="w-10 px-2 py-0 md:w-11 md:px-3">
                                            <Checkbox
                                                aria-label="Selecionar todas na lista filtrada"
                                                checked={
                                                    allPageSelected
                                                        ? true
                                                        : somePageSelected
                                                          ? "indeterminate"
                                                          : false
                                                }
                                                onCheckedChange={(v) => {
                                                    if (v === true) {
                                                        setSelectedIds(
                                                            new Set(pageIds)
                                                        )
                                                    } else {
                                                        setSelectedIds(
                                                            new Set()
                                                        )
                                                    }
                                                }}
                                            />
                                        </TableHead>
                                        <TableHead
                                            className="h-11 px-4 py-0 align-middle"
                                            aria-sort={
                                                sortKey === "name"
                                                    ? sortDir === "asc"
                                                        ? "ascending"
                                                        : "descending"
                                                    : "none"
                                            }
                                        >
                                            <button
                                                type="button"
                                                className={cn(
                                                    "-mx-1 inline-flex items-center rounded-md px-1 py-1 text-xs font-semibold tracking-wide outline-none transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                                    sortKey === "name"
                                                        ? "text-foreground"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                                onClick={() =>
                                                    toggleSort("name")
                                                }
                                            >
                                                Assinatura
                                                <SortIndicator
                                                    active={sortKey === "name"}
                                                    dir={sortDir}
                                                />
                                            </button>
                                        </TableHead>
                                        <TableHead
                                            className="h-11 px-4 py-0 align-middle"
                                            aria-sort={
                                                sortKey === "amount"
                                                    ? sortDir === "asc"
                                                        ? "ascending"
                                                        : "descending"
                                                    : "none"
                                            }
                                        >
                                            <button
                                                type="button"
                                                className={cn(
                                                    "-mx-1 inline-flex items-center rounded-md px-1 py-1 text-xs font-semibold tracking-wide outline-none transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                                    sortKey === "amount"
                                                        ? "text-foreground"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                                onClick={() =>
                                                    toggleSort("amount")
                                                }
                                            >
                                                Valor
                                                <SortIndicator
                                                    active={
                                                        sortKey === "amount"
                                                    }
                                                    dir={sortDir}
                                                />
                                            </button>
                                        </TableHead>
                                        <TableHead className="hidden h-11 px-4 py-0 text-xs font-semibold tracking-wide text-muted-foreground sm:table-cell">
                                            Periodicidade
                                        </TableHead>
                                        <TableHead
                                            className="h-11 px-4 py-0 align-middle"
                                            aria-sort={
                                                sortKey === "next_billing_date"
                                                    ? sortDir === "asc"
                                                        ? "ascending"
                                                        : "descending"
                                                    : "none"
                                            }
                                        >
                                            <button
                                                type="button"
                                                className={cn(
                                                    "-mx-1 inline-flex items-center rounded-md px-1 py-1 text-xs font-semibold tracking-wide outline-none transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                                    sortKey ===
                                                        "next_billing_date"
                                                        ? "text-foreground"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                                onClick={() =>
                                                    toggleSort(
                                                        "next_billing_date"
                                                    )
                                                }
                                            >
                                                Próxima
                                                <SortIndicator
                                                    active={
                                                        sortKey ===
                                                        "next_billing_date"
                                                    }
                                                    dir={sortDir}
                                                />
                                            </button>
                                        </TableHead>
                                        <TableHead className="hidden h-11 px-4 py-0 text-xs font-semibold tracking-wide text-muted-foreground md:table-cell">
                                            Categoria
                                        </TableHead>
                                        <TableHead className="h-11 min-w-[4.5rem] px-4 py-0 text-xs font-semibold tracking-wide text-muted-foreground">
                                            Status
                                        </TableHead>
                                        <TableHead className="h-11 w-[5.25rem] px-3 py-0 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Ações
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="[&_tr:last-child]:border-b-0">
                                    {filteredSorted.map((s) => {
                                        const txLine = formatSubscriptionTxSummary(
                                            s.id,
                                            billingStats
                                        )
                                        return (
                                            <TableRow
                                                key={s.id}
                                                className={cn(
                                                    "cursor-pointer border-border/80 transition-colors hover:bg-muted/30",
                                                    !s.is_active && "opacity-70"
                                                )}
                                                onClick={() => openDetail(s)}
                                            >
                                                <TableCell className="w-10 px-2 py-3 md:w-11 md:px-3">
                                                    <Checkbox
                                                        aria-label={`Selecionar ${s.name}`}
                                                        checked={selectedIds.has(
                                                            s.id
                                                        )}
                                                        onCheckedChange={(
                                                            v
                                                        ) => {
                                                            setSelectedIds(
                                                                (prev) => {
                                                                    const next =
                                                                        new Set(
                                                                            prev
                                                                        )
                                                                    if (
                                                                        v ===
                                                                        true
                                                                    ) {
                                                                        next.add(
                                                                            s.id
                                                                        )
                                                                    } else {
                                                                        next.delete(
                                                                            s.id
                                                                        )
                                                                    }
                                                                    return next
                                                                }
                                                            )
                                                        }}
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="max-w-[200px] px-4 py-3 text-left lg:max-w-[280px]">
                                                    <div className="flex min-w-0 flex-col gap-0.5">
                                                        <span
                                                            className="font-medium [overflow-wrap:anywhere]"
                                                            title={s.name}
                                                        >
                                                            {s.name}
                                                        </span>
                                                        <span className="text-[11px] text-muted-foreground">
                                                            {txLine}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap px-4 py-3 tabular-nums">
                                                    {formatMoneyBRL(
                                                        Number(s.amount)
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                                                    {subscriptionBillingIntervalLabel(
                                                        s.billing_interval
                                                    )}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                                                    {formatSubscriptionChargeDatePtBr(
                                                        s.next_billing_date ??
                                                            s.start_date
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden max-w-[8rem] px-4 py-3 md:table-cell">
                                                    {s.category ? (
                                                        <span className="inline-flex max-w-full items-center gap-1.5">
                                                            <span
                                                                className="size-2 shrink-0 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        s
                                                                            .category
                                                                            .color ||
                                                                        "var(--muted-foreground)",
                                                                }}
                                                                aria-hidden
                                                            />
                                                            <span className="truncate">
                                                                {
                                                                    s.category
                                                                        .name
                                                                }
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center justify-center rounded-full border-0 px-2.5 py-0.5 text-xs font-medium",
                                                            s.is_active
                                                                ? tagChipSuccess
                                                                : "bg-muted text-muted-foreground"
                                                        )}
                                                    >
                                                        {s.is_active
                                                            ? "Ativa"
                                                            : "Inativa"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-3 py-3 pr-4 text-left">
                                                    <div className="flex items-center justify-start gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            type="button"
                                                            className="size-7"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                openDetail(
                                                                    s,
                                                                    {
                                                                        edit: true,
                                                                    }
                                                                )
                                                            }}
                                                        >
                                                            <Pencil className="size-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            type="button"
                                                            className="size-7 text-destructive hover:text-destructive"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setPendingDelete(
                                                                    {
                                                                        mode: "single",
                                                                        subscription:
                                                                            s,
                                                                    }
                                                                )
                                                            }}
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 rounded-b-xl border-t border-border bg-muted/40 px-3 py-2.5 sm:px-4">
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                {filteredSorted.length === 0 ? (
                                    "Nenhuma assinatura na lista filtrada."
                                ) : statusFilter !== "all" ? (
                                    <>
                                        <span className="text-foreground/90">
                                            {filteredSorted.length.toLocaleString(
                                                "pt-BR"
                                            )}
                                        </span>
                                        <span className="mx-1 text-border">
                                            ·
                                        </span>
                                        <span>
                                            na lista filtrada (total no espaço:{" "}
                                            {rows.length.toLocaleString(
                                                "pt-BR"
                                            )}
                                            )
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        {rows.length.toLocaleString("pt-BR")}{" "}
                                        {rows.length === 1
                                            ? "assinatura"
                                            : "assinaturas"}
                                    </>
                                )}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : hasNoMatches ? (
                <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent
                        className="flex flex-col items-center justify-center px-4 py-12 md:py-14"
                        role="status"
                        aria-live="polite"
                    >
                        <div
                            className="mb-5 flex size-14 items-center justify-center rounded-full bg-muted/60"
                            aria-hidden
                        >
                            <SearchX className="size-7 text-muted-foreground" />
                        </div>
                        <h2 className="mb-2 text-center text-base font-semibold tracking-tight">
                            Nenhuma assinatura com esses filtros
                        </h2>
                        <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
                            Tente outro status ou ajuste a ordenação.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className="min-w-[10rem] text-xs"
                            onClick={resetFilters}
                        >
                            Limpar filtros
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent
                        className="flex flex-col items-center justify-center px-4 py-12 md:py-14"
                        role="status"
                        aria-live="polite"
                    >
                        <div
                            className="mb-5 flex size-14 items-center justify-center rounded-full bg-muted/60"
                            aria-hidden
                        >
                            <Repeat className="size-7 text-muted-foreground" />
                        </div>
                        <h2 className="mb-2 text-center text-base font-semibold tracking-tight">
                            Cadastre suas assinaturas
                        </h2>
                        <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
                            Registre serviços recorrentes para acompanhar valores,
                            datas de cobrança e vínculo com transações.
                        </p>
                        <Button
                            type="button"
                            size="lg"
                            className="gap-1.5"
                            onClick={openCreate}
                        >
                            <Plus className="size-3.5" />
                            Nova assinatura
                        </Button>
                    </CardContent>
                </Card>
            )}

            <AlertDialog
                open={pendingDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !deleting) setPendingDelete(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingDelete?.mode === "bulk"
                                ? `Excluir ${pendingDelete.ids.length.toLocaleString("pt-BR")} assinaturas?`
                                : "Excluir assinatura?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <p>Esta ação não pode ser desfeita.</p>
                                {pendingDelete?.mode === "single" ? (
                                    <>
                                        <p className="text-foreground">
                                            A assinatura{" "}
                                            <span className="font-medium">
                                                “{pendingDelete.subscription.name}”
                                            </span>{" "}
                                            será removida.
                                        </p>
                                        <ul className="list-inside list-disc space-y-1 text-foreground">
                                            <li>
                                                Lançamentos já registrados no
                                                extrato não são removidos.
                                            </li>
                                            <li>
                                                {formatMoneyBRL(
                                                    Number(
                                                        pendingDelete
                                                            .subscription
                                                            .amount
                                                    )
                                                )}{" "}
                                                ·{" "}
                                                {subscriptionBillingIntervalLabel(
                                                    pendingDelete.subscription
                                                        .billing_interval
                                                )}
                                            </li>
                                        </ul>
                                    </>
                                ) : pendingDelete?.mode === "bulk" ? (
                                    <>
                                        <p className="text-foreground">
                                            As{" "}
                                            {pendingDelete.ids.length.toLocaleString(
                                                "pt-BR"
                                            )}{" "}
                                            assinaturas selecionadas serão
                                            removidas.
                                        </p>
                                        <ul className="list-inside list-disc space-y-1 text-foreground">
                                            <li>
                                                Lançamentos já registrados no
                                                extrato não são removidos.
                                            </li>
                                        </ul>
                                        <ul className="max-h-40 list-inside list-disc overflow-y-auto text-foreground">
                                            {pendingDelete.ids
                                                .slice(0, 8)
                                                .map((id) => {
                                                    const sub = rows.find(
                                                        (x) => x.id === id
                                                    )
                                                    return (
                                                        <li key={id}>
                                                            {sub?.name ??
                                                                `${id.slice(0, 8)}…`}
                                                        </li>
                                                    )
                                                })}
                                            {pendingDelete.ids.length > 8 ? (
                                                <li className="text-muted-foreground">
                                                    e mais{" "}
                                                    {(
                                                        pendingDelete.ids
                                                            .length - 8
                                                    ).toLocaleString("pt-BR")}{" "}
                                                    …
                                                </li>
                                            ) : null}
                                        </ul>
                                    </>
                                ) : null}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            type="button"
                            disabled={deleting}
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            type="button"
                            className={buttonVariants({
                                variant: "destructive",
                            })}
                            disabled={deleting}
                            onClick={(e) => {
                                e.preventDefault()
                                void confirmDelete()
                            }}
                        >
                            {deleting ? "Excluindo…" : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
