"use client"

import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateGhost,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { currencyBRL, numberBR } from "@/lib/formatters"
import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/16/solid"
import { ArrowPathRoundedSquareIcon, FunnelIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type {
    ColumnFiltersState,
    PaginationState,
    RowSelectionState,
    SortingState,
} from "@tanstack/react-table"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import {
    type WorkspaceSubscription,
    type WorkspaceSubscriptionListRow,
} from "@/lib/supabase"
import { toastError, toastSuccess } from "@/lib/toast"
import { SUBSCRIPTION_SAVE_TOAST_ID } from "@/components/subscriptions/use-subscription-form"
import {
    Card,
    CardContent,
    CardMessage,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogList,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ColorTile } from "@/components/ui/color-tile"
import {
    DataTable,
    dataTableColumns,
    type DataTableAction,
    type DataTableBulkAction,
    type DataTableColumnDef,
} from "@/components/ui/data-table"
import { ROUTES } from "@/config/navigation"
import { SubscriptionFormDialog } from "@/components/subscriptions/subscription-form-dialog"
import { SubscriptionDetailSheet } from "@/components/subscriptions/subscription-detail-sheet"
import { SubscriptionsPageSkeleton } from "@/components/subscriptions/subscriptions-page-skeleton"
import {
    SubscriptionsToolbar,
    type SubscriptionSortKey,
    type SubscriptionStatusFilter,
} from "@/components/subscriptions/subscriptions-toolbar"
import {
    subscriptionBillingIntervalLabel,
    type SubscriptionFormPayload,
} from "@/components/subscriptions/subscription-form-shared"
import {
    createSubscription,
    deleteSubscriptions,
    setSubscriptionActive,
    updateSubscription,
} from "@/lib/subscriptions/mutations"
import { dispatchFinanceSubscriptionsMutated } from "@/lib/workspace-data-events"
import { formatSubscriptionTxSummary } from "@/lib/subscription-tx-summary"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { useSubscriptionsPageBundle } from "@/lib/queries/use-subscriptions-page-bundle"

type Row = WorkspaceSubscriptionListRow

type PendingDelete =
    | { mode: "single"; subscription: Row }
    | { mode: "bulk"; ids: string[] }

/** A ordem de quem chega: nome de A a Z, como antes da tabela de dados. */
const ORDEM_PADRAO: SortingState = [{ id: "name", desc: false }]

const PAGINA_INICIAL: PaginationState = { pageIndex: 0, pageSize: 20 }

const STATUS_OPTIONS = [
    { value: "active", label: "Ativa" },
    { value: "inactive", label: "Pausada" },
]

const statusLabel = (v: string) =>
    STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v

const col = dataTableColumns<Row>()

/**
 * As colunas da lista. O nome ordena em `pt-BR` (o `text` da TanStack põe
 * "Á" depois de "Z"), o valor abre do maior e a data da mais próxima, como o
 * menu "Ordenar" sempre fez. O status é faceta só para a URL (`?status=`): quem
 * o escolhe continua sendo a bandeja "Todas · Ativas · Inativas" da barra.
 */
function subscriptionColumns(
    billingStats: Record<string, { count: number; lastDate: string }>
): DataTableColumnDef<Row>[] {
    return [
        {
            ...col.identity({
                id: "name",
                header: "Assinatura",
                title: (s) => s.name,
                description: (s) => formatSubscriptionTxSummary(s.id, billingStats),
                media: (s) => <ColorTile size="xs" color={s.category?.color} />,
            }),
            sortFn: (a, b) =>
                a.original.name.localeCompare(b.original.name, "pt-BR"),
        },
        {
            // Assinatura é sempre saída: o valor fica neutro, sem o "+" verde
            // que o tom pelo sinal daria a um número positivo.
            ...col.money({
                id: "amount",
                header: "Valor",
                accessor: (s) => Number(s.amount),
                signed: false,
                tone: "none",
            }),
            sortDescFirst: true,
        },
        {
            id: "billing_interval",
            header: "Periodicidade",
            accessorFn: (s) => subscriptionBillingIntervalLabel(s.billing_interval),
            enableSorting: false,
            meta: { label: "Periodicidade", cellClassName: "text-muted-foreground" },
        },
        col.date({
            id: "next_billing_date",
            header: "Próxima",
            accessor: (s) => s.next_billing_date ?? s.start_date,
            meta: { label: "Próxima cobrança" },
        }),
        {
            id: "category",
            header: "Categoria",
            accessorFn: (s) => s.category?.name ?? "",
            enableSorting: false,
            cell: ({ getValue }) => (getValue() as string) || "—",
            meta: { label: "Categoria", cellClassName: "text-muted-foreground" },
        },
        {
            ...col.status({
                id: "status",
                header: "Status",
                accessor: (s) => (s.is_active ? "active" : "inactive"),
                tone: (v) => (v === "active" ? "success" : "neutral"),
                label: statusLabel,
                meta: {
                    facet: { options: STATUS_OPTIONS },
                    mobile: "trailing",
                    csv: (s: Row) => (s.is_active ? "Ativa" : "Pausada"),
                },
            }),
            enableSorting: false,
        },
    ]
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
    const [sorting, setSorting] = useState<SortingState>(ORDEM_PADRAO)
    const [search, setSearch] = useState("")
    const [pagination, setPagination] =
        useState<PaginationState>(PAGINA_INICIAL)

    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const [detailSub, setDetailSub] =
        useState<WorkspaceSubscriptionListRow | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [detailLaunchEdit, setDetailLaunchEdit] = useState(false)

    const expenseCategories = useMemo(
        () => categories.filter((c) => c.type === "expense"),
        [categories]
    )

    const columns = useMemo(
        () => subscriptionColumns(billingStats),
        [billingStats]
    )

    // A bandeja de status é a faceta da coluna `status`: memorizada, porque a
    // tabela volta à primeira página a cada filtro novo, e um array refeito
    // por render contaria como filtro novo.
    const columnFilters = useMemo<ColumnFiltersState>(
        () =>
            statusFilter === "all"
                ? []
                : [{ id: "status", value: [statusFilter] }],
        [statusFilter]
    )

    const resetFilters = () => {
        setStatusFilter("all")
        setSearch("")
        setSorting(ORDEM_PADRAO)
        setRowSelection({})
    }

    const prevWorkspaceIdRef = useRef<string | null>(null)
    useEffect(() => {
        if (prevWorkspaceIdRef.current === currentWorkspaceId) return
        prevWorkspaceIdRef.current = currentWorkspaceId
        setRowSelection({})
        setStatusFilter("all")
        setSearch("")
        setSorting(ORDEM_PADRAO)
        setPagination(PAGINA_INICIAL)
    }, [currentWorkspaceId])

    useEffect(() => {
        didConsumeNewQuery.current = false
    }, [currentWorkspaceId])

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
                const result = await updateSubscription({
                    workspaceId: currentWorkspaceId,
                    subscriptionId: updateId,
                    payload,
                })
                if (!result.ok) {
                    toastError(result.errorMessage, { id: SUBSCRIPTION_SAVE_TOAST_ID })
                    return false
                }
                toastSuccess("Assinatura atualizada", {
                    id: SUBSCRIPTION_SAVE_TOAST_ID,
                    description: result.queued
                        ? "Sincroniza ao voltar online"
                        : undefined,
                })
            } else {
                const result = await createSubscription({
                    workspaceId: currentWorkspaceId,
                    userId: user.id,
                    payload,
                })
                if (!result.ok) {
                    toastError(result.errorMessage, { id: SUBSCRIPTION_SAVE_TOAST_ID })
                    return false
                }
                toastSuccess("Assinatura cadastrada", {
                    id: SUBSCRIPTION_SAVE_TOAST_ID,
                    description: result.queued
                        ? "Sincroniza ao voltar online"
                        : undefined,
                })
            }
            dispatchFinanceSubscriptionsMutated()
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
                const result = await setSubscriptionActive({
                    workspaceId: currentWorkspaceId,
                    subscriptionId: id,
                    isActive: next,
                })
                if (!result.ok) {
                    toastError(result.errorMessage)
                    return false
                }
                dispatchFinanceSubscriptionsMutated()
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
        const ids =
            mode === "single" ? [pendingDelete.subscription.id] : pendingDelete.ids

        const result = currentWorkspaceId
            ? await deleteSubscriptions({ workspaceId: currentWorkspaceId, ids })
            : ({ ok: false, errorMessage: "Carteira indisponível" } as const)

        setDeleting(false)
        if (!result.ok) {
            toastError(result.errorMessage, { id: "excluir-assinatura" })
            return
        }
        dispatchFinanceSubscriptionsMutated()

        const n = ids.length
        toastSuccess(
            n === 1
                ? "Assinatura removida"
                : `${numberBR(n)} assinaturas removidas`,
            { id: "excluir-assinatura" }
        )
        setPendingDelete(null)
        setRowSelection({})
        setDetailOpen(false)
        setDetailSub(null)
        void refreshBundle()
    }

    useEffect(() => {
        if (!detailOpen || !detailSub) return
        const next = rows.find((r) => r.id === detailSub.id)
        if (next && next !== detailSub) setDetailSub(next)
    }, [rows, detailOpen, detailSub])

    const rowActions = useMemo<DataTableAction<Row>[]>(
        () => [
            {
                label: "Editar",
                icon: <PencilIcon aria-hidden />,
                primary: true,
                onSelect: (s) => openDetail(s, { edit: true }),
            },
            {
                label: "Excluir",
                icon: <TrashIcon aria-hidden />,
                variant: "destructive",
                onSelect: (s) =>
                    setPendingDelete({ mode: "single", subscription: s }),
            },
        ],
        [openDetail]
    )

    // A confirmação mora no `AlertDialog` da página, então a ação só o abre.
    const bulkActions = useMemo<DataTableBulkAction<Row>[]>(
        () => [
            {
                label: "Editar",
                icon: <PencilIcon aria-hidden />,
                // Uma de cada vez, como a barra de antes: com mais de uma
                // marcada, o botão fica desabilitado.
                disabled: (selecionadas) => selecionadas.length !== 1,
                onSelect: ([s]) => {
                    if (s) openDetail(s, { edit: true })
                },
            },
            {
                label: "Excluir",
                icon: <TrashIcon aria-hidden />,
                variant: "destructive",
                // Só abre a confirmação: `false` mantém a seleção, e cancelar
                // não a perde. Ela limpa depois de excluir.
                onSelect: (_, ids) => {
                    setPendingDelete({ mode: "bulk", ids })
                    return false
                },
            },
        ],
        [openDetail]
    )

    if (workspaceError) {
        return (
            <Card>
                <CardMessage tone="destructive">
                    {workspaceError}
                </CardMessage>
            </Card>
        )
    }

    if (!authLoading && !workspaceLoading && !currentWorkspaceId) {
        return (
            <Card>
                <CardMessage>
                    Nenhum espaço de trabalho selecionado. Escolha um espaço no menu
                    lateral para continuar.
                </CardMessage>
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
                onStatusFilterChange={(v) => {
                    setStatusFilter(v)
                    setRowSelection({})
                }}
                sortKey={
                    (sorting[0]?.id as SubscriptionSortKey | undefined) ?? "name"
                }
                sortDir={sorting[0]?.desc ? "desc" : "asc"}
                onSortChange={(k, d) => setSorting([{ id: k, desc: d === "desc" }])}
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

            {rows.length > 0 ? (
                <DataTable
                    id="assinaturas"
                    aria-label="Assinaturas"
                    columns={columns}
                    data={rows}
                    getRowId={(s) => s.id}
                    getRowLabel={(s) => s.name}
                    urlState
                    sorting={sorting}
                    onSortingChange={setSorting}
                    columnFilters={columnFilters}
                    onColumnFiltersChange={(next) => {
                        // A URL pode trazer `?status=`; a bandeja segue o que
                        // ela disser, e "as duas" é o mesmo que "todas".
                        const valores =
                            (next.find((f) => f.id === "status")?.value as
                                | string[]
                                | undefined) ?? []
                        setStatusFilter(
                            valores.length === 1
                                ? (valores[0] as SubscriptionStatusFilter)
                                : "all"
                        )
                        setRowSelection({})
                    }}
                    globalFilter={search}
                    onGlobalFilterChange={(v) => {
                        setSearch(v)
                        setRowSelection({})
                    }}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    rowSelection={rowSelection}
                    onRowSelectionChange={setRowSelection}
                    enableSelection
                    bulkActions={bulkActions}
                    rowActions={rowActions}
                    // O botão direito e o toque longo repetem as ações da linha.
                    rowContextMenu
                    onRowClick={(s) => openDetail(s)}
                    rowState={(s) => (s.is_active ? undefined : "pending")}
                    pending={tableLoading}
                    countLabel={(n, { filtered, all }) =>
                        filtered
                            ? `${numberBR(n)} na lista filtrada (total no espaço: ${numberBR(all)})`
                            : `${numberBR(n)} ${n === 1 ? "assinatura" : "assinaturas"}`
                    }
                    toolbar={{
                        search: "Buscar assinatura…",
                        export: "assinaturas",
                        view: true,
                    }}
                    empty={
                        <EmptyState variant="plain">
                            <EmptyStateIcon variant="stack">
                                <MagnifyingGlassIcon aria-hidden />
                                <ArrowPathRoundedSquareIcon aria-hidden />
                                <FunnelIcon aria-hidden />
                            </EmptyStateIcon>
                            <EmptyStateTitle>Nenhuma assinatura com esses filtros</EmptyStateTitle>
                            <EmptyStateDescription>
                                Tente outro status ou outra busca.
                            </EmptyStateDescription>
                            <EmptyStateActions>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetFilters}
                                >
                                    Limpar filtros
                                </Button>
                            </EmptyStateActions>
                        </EmptyState>
                    }
                />
            ) : (
                <Card padding="none">
                    <CardContent
                        role="status"
                        aria-live="polite"
                    >
                        <EmptyState variant="plain" size="lg">
                            <EmptyStateGhost leading="tile" trailing="date" />
                            <EmptyStateTitle>Cadastre suas assinaturas</EmptyStateTitle>
                            <EmptyStateDescription>
                                Registre serviços recorrentes para acompanhar valores,
                                datas de cobrança e vínculo com transações.
                            </EmptyStateDescription>
                            <EmptyStateActions>
                                <Button
                                    type="button"
                                    onClick={openCreate}
                                >
                                    <PlusIcon aria-hidden />
                                    Nova assinatura
                                </Button>
                            </EmptyStateActions>
                        </EmptyState>
                    </CardContent>
                </Card>
            )}

            <AlertDialog
                pending={deleting}
                open={pendingDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !deleting) setPendingDelete(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingDelete?.mode === "bulk"
                                ? `Excluir ${numberBR(pendingDelete.ids.length)} assinaturas?`
                                : "Excluir assinatura?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
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
                                    <AlertDialogList>
                                        <li>
                                            Lançamentos já registrados no
                                            extrato não são removidos.
                                        </li>
                                        <li>
                                            {currencyBRL(
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
                                    </AlertDialogList>
                                </>
                            ) : pendingDelete?.mode === "bulk" ? (
                                <>
                                    <p className="text-foreground">
                                        As{" "}
                                        {numberBR(pendingDelete.ids.length)}{" "}
                                        assinaturas selecionadas serão
                                        removidas.
                                    </p>
                                    <AlertDialogList>
                                        <li>
                                            Lançamentos já registrados no
                                            extrato não são removidos.
                                        </li>
                                    </AlertDialogList>
                                    <AlertDialogList className="max-h-40 overflow-y-auto">
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
                                                {numberBR((
                                                    pendingDelete.ids
                                                        .length - 8
                                                ))}{" "}
                                                …
                                            </li>
                                        ) : null}
                                    </AlertDialogList>
                                </>
                            ) : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            type="button"
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            pendingLabel="Excluindo…"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault()
                                void confirmDelete()
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
