"use client"

import { useCallback, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import type { User } from "@supabase/supabase-js"
import { Plus, Receipt, SearchX, SlidersHorizontal } from "lucide-react"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { Button } from "@/components/ui/button"
import { usePageChromeSlot } from "@/components/layout/page-chrome-provider"
import { Card, CardContent } from "@/components/ui/card"
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
    BillsToolbar,
    type BillsModelFilter,
    type BillsPageMode,
    type BillsPendingFilter,
    type BillsSortDir,
    type BillsSortKey,
} from "@/components/bills/bills-toolbar"
import { BillsPageSkeleton } from "@/components/bills/bills-page-skeleton"
import { BillFormDialog } from "@/components/bills/bill-form-dialog"
import { PayBillDialog } from "@/components/bills/pay-bill-dialog"
import { BillPendingCard } from "@/components/bills/bill-pending-card"
import { BillSummaryCard } from "@/components/bills/bill-summary-card"
import { BillDetailSheet } from "@/components/bills/bill-detail-sheet"
import type { BillFormPayloadForSave } from "@/components/bills/bill-form-shared"
import type { BillPendingRow } from "@/components/bills/bill-list-types"
import { useBillsPageBundleQuery } from "@/lib/queries/use-bills-page-bundle"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { creditCardDetailPath } from "@/config/navigation"
import { projectVirtualCreditCardBills } from "@/lib/bills/credit-card-bill-projector"
import type { VirtualCreditCardBill } from "@/lib/bills/credit-card-bill-projector"
import {
    deleteBillCascade,
    insertBillWithFirstInstance,
    skipBillInstance,
    updateBillRow,
} from "@/lib/bills/mutations"
import type { BillInstance } from "@/lib/supabase"
import { localYmdFromDate } from "@/lib/transaction-date"
import { supabase } from "@/lib/supabase"
import { toastError, toastSuccess } from "@/lib/toast"
import type { PayBillInput } from "@/lib/bills/pay-bill-flow"
import type {
    BillInstanceWithBill,
    BillRowWithCategory,
} from "@/lib/queries/fetch-bills-page-bundle"
import type { Bill } from "@/lib/supabase"

const DETAIL_QUERY = "detail"

function cmpYmd(a: string, b: string): number {
    return a.localeCompare(b)
}

function addDaysToYmd(ymd: string, days: number): string {
    const parts = ymd.split("-").map((x) => Number.parseInt(x, 10))
    const y = parts[0] ?? 1970
    const m = parts[1] ?? 1
    const d = parts[2] ?? 1
    const dt = new Date(y, m - 1, d)
    dt.setDate(dt.getDate() + days)
    return localYmdFromDate(dt)
}

async function handleSkipBillInstance(opts: {
    workspaceId: string | null
    user: User
    instanceId: string
    bill: BillRowWithCategory
    dueYmd: string
    onInvalidate: () => Promise<void>
}) {
    const { workspaceId, user, instanceId, bill, dueYmd, onInvalidate } = opts
    if (!workspaceId) return
    const sk = await skipBillInstance({
        supabase,
        user,
        workspaceId,
        instanceId,
        bill,
        currentDueYmd: dueYmd,
    })
    if (!sk.ok) toastError(sk.error)
    else {
        toastSuccess("Parcela ignorada; próxima gerada quando aplicável.")
        await onInvalidate()
    }
}

function comparePendingRows(
    a: BillPendingRow,
    b: BillPendingRow,
    key: BillsSortKey,
    dir: BillsSortDir
): number {
    const inv = dir === "asc" ? 1 : -1
    if (key === "due_date") {
        const c = cmpYmd(a.dueYmd, b.dueYmd)
        if (c !== 0) return c * inv
    } else if (key === "amount") {
        const na = a.amountHint ?? -Infinity
        const nb = b.amountHint ?? -Infinity
        if (na !== nb) return na < nb ? -inv : inv
    } else if (key === "name") {
        const c = a.title.localeCompare(b.title, "pt-BR")
        if (c !== 0) return c * inv
    }
    return a.title.localeCompare(b.title, "pt-BR")
}

type BillModelSummary = {
    bill: BillRowWithCategory
    paid90Total: number
    paid90Count: number
    avgCharge: number | null
    latePay90Count: number
    nextDueYmd: string | null
    nextAmountHint: number | null
}

function compareModelSummaries(
    a: BillModelSummary,
    b: BillModelSummary,
    key: BillsSortKey,
    dir: BillsSortDir
): number {
    const inv = dir === "asc" ? 1 : -1
    if (key === "name") {
        const c = a.bill.name.localeCompare(b.bill.name, "pt-BR")
        if (c !== 0) return c * inv
    } else if (key === "due_date") {
        const da = a.nextDueYmd ?? "9999-12-31"
        const db = b.nextDueYmd ?? "9999-12-31"
        const c = cmpYmd(da, db)
        if (c !== 0) return c * inv
    } else if (key === "amount") {
        const na =
            a.nextAmountHint ??
            (a.bill.amount_estimated != null
                ? Number(a.bill.amount_estimated)
                : -Infinity)
        const nb =
            b.nextAmountHint ??
            (b.bill.amount_estimated != null
                ? Number(b.bill.amount_estimated)
                : -Infinity)
        if (na !== nb) return na < nb ? -inv : inv
    }
    return a.bill.name.localeCompare(b.bill.name, "pt-BR")
}

export default function BillsPageClient() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const qc = useQueryClient()
    const { user } = useAuth()
    const { currentWorkspaceId } = useWorkspace()
    const bundleQ = useBillsPageBundleQuery(currentWorkspaceId)

    const [mode, setMode] = useState<BillsPageMode>("bills")
    const [pendingFilter, setPendingFilter] =
        useState<BillsPendingFilter>("all")
    const [modelFilter, setModelFilter] = useState<BillsModelFilter>("all")
    const [sortKey, setSortKey] = useState<BillsSortKey>("name")
    const [sortDir, setSortDir] = useState<BillsSortDir>("asc")

    const [formOpen, setFormOpen] = useState(false)
    const [editingBill, setEditingBill] = useState<Bill | null>(null)
    const [savingBill, setSavingBill] = useState(false)
    const [payOpen, setPayOpen] = useState(false)
    const [payInput, setPayInput] = useState<PayBillInput | null>(null)
    const [paySaving, setPaySaving] = useState(false)
    const [confirmDeleteBill, setConfirmDeleteBill] = useState<Bill | null>(null)
    const [mobileFiltersSheetOpen, setMobileFiltersSheetOpen] = useState(false)

    const billsHasTableEarly = Boolean(bundleQ.data && !bundleQ.data.tableMissing)
    const billsFilterActiveEarly =
        mode === "pending" ? pendingFilter !== "all" : modelFilter !== "all"

    const billsChromeDateFilter = useMemo(
        () => (
            <Button
                type="button"
                variant="outline"
                size="icon"
                className="relative size-9 shrink-0"
                disabled={!billsHasTableEarly}
                onClick={() => setMobileFiltersSheetOpen(true)}
                aria-label="Filtros e ordenação"
            >
                <SlidersHorizontal className="size-4 opacity-80" />
                {billsFilterActiveEarly ? (
                    <span
                        className="pointer-events-none absolute top-1.5 right-1.5 size-2 rounded-full bg-primary"
                        aria-hidden
                    />
                ) : null}
            </Button>
        ),
        [billsHasTableEarly, billsFilterActiveEarly],
    )
    usePageChromeSlot({ dateFilter: billsChromeDateFilter })

    const detailBillId = searchParams.get(DETAIL_QUERY)

    const setDetailBillId = useCallback(
        (id: string | null) => {
            const next = new URLSearchParams(searchParams.toString())
            if (id) next.set(DETAIL_QUERY, id)
            else next.delete(DETAIL_QUERY)
            const qs = next.toString()
            router.replace(qs ? `${pathname}?${qs}` : pathname, {
                scroll: false,
            })
        },
        [pathname, router, searchParams]
    )

    const handleModeChange = useCallback((m: BillsPageMode) => {
        setMode(m)
        if (m === "pending") {
            setSortKey("due_date")
            setSortDir("asc")
        } else {
            setSortKey("name")
            setSortDir("asc")
        }
    }, [])

    const todayYmd = useMemo(() => localYmdFromDate(new Date()), [])
    const limit30Ymd = useMemo(() => addDaysToYmd(todayYmd, 30), [todayYmd])

    const virtualRows = useMemo(() => {
        if (!bundleQ.data?.creditCards?.length || bundleQ.data.tableMissing) {
            return [] as VirtualCreditCardBill[]
        }
        return projectVirtualCreditCardBills({
            workspaceId: currentWorkspaceId ?? "",
            creditCards: bundleQ.data.creditCards.filter((c) => c.is_active),
            ccRows: bundleQ.data.ccRows ?? [],
            installmentPlans: bundleQ.data.installmentPlans ?? [],
            invoicePayments: bundleQ.data.invoicePayments ?? [],
        })
    }, [bundleQ.data, currentWorkspaceId])

    const pendingRegular = useMemo(
        () => bundleQ.data?.pendingInstances ?? [],
        [bundleQ.data?.pendingInstances]
    )

    const regularRows = useMemo((): BillPendingRow[] => {
        const rows: BillPendingRow[] = []
        for (const inst of pendingRegular) {
            const bill =
                inst.bill ??
                bundleQ.data?.bills.find((b) => b.id === inst.bill_id) ??
                null
            if (!bill || !bill.is_active) continue
            const dueYmd = inst.due_date.slice(0, 10)
            const amt =
                inst.amount != null
                    ? Number(inst.amount)
                    : bill.amount_estimated != null
                      ? Number(bill.amount_estimated)
                      : null
            rows.push({
                kind: "regular",
                id: inst.id,
                title: bill.name,
                dueYmd,
                amountHint: amt,
                instance: inst as BillInstance,
                bill,
            })
        }
        for (const v of virtualRows) {
            rows.push({
                kind: "virtual_cc",
                id: v.id,
                title: `Fatura · ${v.cardName}`,
                dueYmd: v.due_date_ymd,
                amountHint: v.amount_estimated,
                virtual: v,
            })
        }
        rows.sort((a, b) => cmpYmd(a.dueYmd, b.dueYmd))
        return rows
    }, [bundleQ.data?.bills, pendingRegular, virtualRows])

    const paidSnippets = useMemo(
        () => bundleQ.data?.recentPaidInstances ?? [],
        [bundleQ.data?.recentPaidInstances]
    )

    const overdueRows = useMemo(
        () => regularRows.filter((r) => cmpYmd(r.dueYmd, todayYmd) < 0),
        [regularRows, todayYmd]
    )
    const soonFilterRows = useMemo(
        () =>
            [...regularRows]
                .filter(
                    (r) =>
                        cmpYmd(r.dueYmd, todayYmd) >= 0 &&
                        cmpYmd(r.dueYmd, limit30Ymd) <= 0
                )
                .sort((a, b) => cmpYmd(a.dueYmd, b.dueYmd)),
        [regularRows, todayYmd, limit30Ymd]
    )

    const filteredPendingRows = useMemo(() => {
        if (pendingFilter === "all") return regularRows
        if (pendingFilter === "overdue") return overdueRows
        if (pendingFilter === "soon") return soonFilterRows
        return [] as BillPendingRow[]
    }, [pendingFilter, regularRows, overdueRows, soonFilterRows])

    const sortedPendingCards = useMemo(() => {
        const copy = [...filteredPendingRows]
        copy.sort((a, b) => comparePendingRows(a, b, sortKey, sortDir))
        return copy
    }, [filteredPendingRows, sortKey, sortDir])

    const modelSummaries = useMemo((): BillModelSummary[] => {
        const data = bundleQ.data
        if (!data) return []
        const bills = data.bills.filter((b) => {
            if (modelFilter === "active") return b.is_active
            if (modelFilter === "inactive") return !b.is_active
            return true
        })

        const byBillPaid = new Map<string, BillInstanceWithBill[]>()
        for (const inst of data.recentPaidInstances) {
            const list = byBillPaid.get(inst.bill_id) ?? []
            list.push(inst)
            byBillPaid.set(inst.bill_id, list)
        }

        const nextPendingByBill = new Map<string, BillInstanceWithBill>()
        for (const inst of data.pendingInstances) {
            const cur = nextPendingByBill.get(inst.bill_id)
            const due = inst.due_date.slice(0, 10)
            if (!cur) {
                nextPendingByBill.set(inst.bill_id, inst)
                continue
            }
            const curDue = cur.due_date.slice(0, 10)
            if (cmpYmd(due, curDue) < 0) nextPendingByBill.set(inst.bill_id, inst)
        }

        return bills.map((bill) => {
            const paidList = byBillPaid.get(bill.id) ?? []
            let paid90Total = 0
            let paid90Count = 0
            let latePay90Count = 0
            for (const inst of paidList) {
                if (inst.paid_amount == null || !inst.paid_at) continue
                paid90Total += Number(inst.paid_amount)
                paid90Count += 1
                const paidDay = inst.paid_at.slice(0, 10)
                const due = inst.due_date.slice(0, 10)
                if (cmpYmd(paidDay, due) > 0) latePay90Count += 1
            }
            const avgCharge =
                paid90Count > 0
                    ? paid90Total / paid90Count
                    : bill.amount_estimated != null
                      ? Number(bill.amount_estimated)
                      : null

            const nextInst = nextPendingByBill.get(bill.id)
            const nextDueYmd = nextInst?.due_date.slice(0, 10) ?? null
            let nextAmountHint: number | null = null
            if (nextInst) {
                nextAmountHint =
                    nextInst.amount != null
                        ? Number(nextInst.amount)
                        : bill.amount_estimated != null
                          ? Number(bill.amount_estimated)
                          : null
            }

            return {
                bill,
                paid90Total,
                paid90Count,
                avgCharge,
                latePay90Count,
                nextDueYmd,
                nextAmountHint,
            }
        })
    }, [bundleQ.data, modelFilter])

    const sortedModelCards = useMemo(() => {
        const copy = [...modelSummaries]
        copy.sort((a, b) => compareModelSummaries(a, b, sortKey, sortDir))
        return copy
    }, [modelSummaries, sortKey, sortDir])

    const onInvalidate = useCallback(async () => {
        if (!currentWorkspaceId) return
        await invalidateWorkspaceData(qc, currentWorkspaceId, {
            domains: [
                "bills",
                "transactions",
                "credit_cards",
                "credit_card_expense_rows",
            ],
        })
    }, [qc, currentWorkspaceId])

    const handleSaveBill = useCallback(
        async (
            payload: BillFormPayloadForSave,
            billIdForUpdate?: string | null
        ): Promise<boolean> => {
            if (!user?.id || !currentWorkspaceId) return false
            setSavingBill(true)
            try {
                if (billIdForUpdate) {
                    const up = await updateBillRow({
                        supabase,
                        workspaceId: currentWorkspaceId,
                        billId: billIdForUpdate,
                        payload,
                    })
                    if (!up.ok) {
                        toastError(up.error)
                        return false
                    }
                    toastSuccess("Conta atualizada.")
                } else {
                    const ins = await insertBillWithFirstInstance({
                        supabase,
                        user,
                        workspaceId: currentWorkspaceId,
                        payload,
                    })
                    if (!ins.ok) {
                        toastError(ins.error)
                        return false
                    }
                    toastSuccess("Conta criada.")
                }
                await onInvalidate()
                return true
            } finally {
                setSavingBill(false)
            }
        },
        [user, currentWorkspaceId, onInvalidate]
    )

    const handleDeleteBill = useCallback(async () => {
        if (!confirmDeleteBill || !currentWorkspaceId) return
        const deletedId = confirmDeleteBill.id
        const r = await deleteBillCascade({
            supabase,
            workspaceId: currentWorkspaceId,
            billId: deletedId,
        })
        if (!r.ok) toastError(r.error)
        else {
            toastSuccess("Conta removida.")
            await onInvalidate()
            if (detailBillId === deletedId) setDetailBillId(null)
        }
        setConfirmDeleteBill(null)
    }, [
        confirmDeleteBill,
        currentWorkspaceId,
        onInvalidate,
        detailBillId,
        setDetailBillId,
    ])

    const openPay = useCallback((input: PayBillInput) => {
        setPayInput(input)
        setPayOpen(true)
    }, [])

    const expenseCats =
        bundleQ.data?.categories.filter((c) => c.type === "expense") ?? []

    const resetFilters = useCallback(() => {
        setPendingFilter("all")
        setModelFilter("all")
        if (mode === "pending") {
            setSortKey("due_date")
            setSortDir("asc")
        } else {
            setSortKey("name")
            setSortDir("asc")
        }
    }, [mode])

    if (bundleQ.isPending && !bundleQ.data) {
        return (
            <div className="flex flex-col gap-3">
                <BillsPageSkeleton />
            </div>
        )
    }

    if (bundleQ.data?.tableMissing) {
        return (
            <div className="space-y-3">
                <Card>
                    <CardContent className="py-6 text-sm">
                        <p className="font-medium">Tabela ainda não criada no banco</p>
                        <p className="mt-2 text-muted-foreground">
                            Aplique a migration{" "}
                            <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                bills
                            </code>{" "}
                            no Supabase ou peça ao administrador. Recarregue o schema do
                            PostgREST se necessário (
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

    if (!user) {
        return (
            <p className="text-sm text-muted-foreground">
                Faça login para gerenciar contas a pagar.
            </p>
        )
    }

    const data = bundleQ.data
    if (!data) {
        return (
            <div className="flex flex-col gap-3">
                <BillsPageSkeleton />
            </div>
        )
    }

    const workspaceHasAnything =
        regularRows.length > 0 || paidSnippets.length > 0

    const globalEmpty = !workspaceHasAnything

    let listEmpty = false
    if (mode === "pending") {
        if (pendingFilter === "all") {
            listEmpty = regularRows.length === 0
        } else if (pendingFilter === "overdue") {
            listEmpty = overdueRows.length === 0
        } else {
            listEmpty = soonFilterRows.length === 0
        }
    } else {
        listEmpty = modelSummaries.length === 0
    }

    const hasNoMatches = workspaceHasAnything && listEmpty

    const showPendingEmptyButHasHistory =
        mode === "pending" &&
        pendingFilter === "all" &&
        regularRows.length === 0 &&
        paidSnippets.length > 0

    const detailFallbackBill =
        detailBillId != null
            ? (data.bills.find((b) => b.id === detailBillId) ?? null)
            : null

    const hasTable = !data.tableMissing

    return (
        <div className="min-w-0 max-w-full space-y-3">
            <BillsToolbar
                mode={mode}
                onModeChange={handleModeChange}
                pendingFilter={pendingFilter}
                onPendingFilterChange={setPendingFilter}
                modelFilter={modelFilter}
                onModelFilterChange={setModelFilter}
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={(k, d) => {
                    setSortKey(k)
                    setSortDir(d)
                }}
                onNewBill={() => {
                    setEditingBill(null)
                    setFormOpen(true)
                }}
                hasTable={hasTable}
                filtersSheetOpen={mobileFiltersSheetOpen}
                onFiltersSheetOpenChange={setMobileFiltersSheetOpen}
                mobileFiltersTrigger="external"
            />

            {globalEmpty ? (
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
                            <Receipt className="size-7 text-muted-foreground" />
                        </div>
                        <h2 className="mb-2 text-center text-base font-semibold tracking-tight">
                            Cadastre suas contas a pagar
                        </h2>
                        <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
                            Vencimentos variáveis, lembretes e confirmação do valor ao
                            pagar. Faturas de cartão aparecem automaticamente quando houver
                            valor em aberto.
                        </p>
                        <Button
                            type="button"
                            size="lg"
                            className="gap-1.5"
                            onClick={() => {
                                setEditingBill(null)
                                setFormOpen(true)
                            }}
                        >
                            <Plus className="size-3.5" />
                            Nova conta
                        </Button>
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
                            Nenhuma conta com esses filtros
                        </h2>
                        <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
                            Tente outro filtro ou limpe para ver tudo.
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
            ) : showPendingEmptyButHasHistory ? (
                <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent className="mx-auto max-w-md px-4 py-8 text-center text-sm text-muted-foreground md:py-10">
                        <p className="mb-4">
                            Nenhuma conta pendente no momento. Você tem pagamentos recentes
                            — veja o histórico na aba{" "}
                            <span className="font-medium text-foreground">Contas</span>.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleModeChange("bills")}
                        >
                            Ver contas
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {mode === "pending"
                            ? sortedPendingCards.map((row) => (
                                  <BillPendingCard
                                      key={row.id}
                                      row={row}
                                      todayYmd={todayYmd}
                                      onOpenDetail={() => {
                                          if (row.kind === "virtual_cc") {
                                              router.push(
                                                  creditCardDetailPath(
                                                      row.virtual.credit_card_id
                                                  )
                                              )
                                              return
                                          }
                                          setDetailBillId(row.bill.id)
                                      }}
                                      onPay={() =>
                                          openPay(
                                              row.kind === "regular"
                                                  ? {
                                                        kind: "regular",
                                                        instance: row.instance,
                                                        bill: row.bill,
                                                    }
                                                  : {
                                                        kind: "virtual_cc",
                                                        virtual: row.virtual,
                                                    }
                                          )
                                      }
                                      onEditModel={() => {
                                          if (row.kind !== "regular") return
                                          setEditingBill(row.bill)
                                          setFormOpen(true)
                                      }}
                                      onSkipInstance={() => {
                                          if (row.kind !== "regular") return
                                          void handleSkipBillInstance({
                                              workspaceId: currentWorkspaceId,
                                              user,
                                              instanceId: row.instance.id,
                                              bill: row.bill,
                                              dueYmd: row.dueYmd,
                                              onInvalidate,
                                          })
                                      }}
                                      onDeleteBill={() => {
                                          if (row.kind !== "regular") return
                                          setConfirmDeleteBill(row.bill)
                                      }}
                                  />
                              ))
                            : sortedModelCards.map((m) => (
                                  <BillSummaryCard
                                      key={m.bill.id}
                                      bill={m.bill}
                                      todayYmd={todayYmd}
                                      paid90Total={m.paid90Total}
                                      paid90Count={m.paid90Count}
                                      avgCharge={m.avgCharge}
                                      latePay90Count={m.latePay90Count}
                                      nextDueYmd={m.nextDueYmd}
                                      nextAmountHint={m.nextAmountHint}
                                      onOpenDetail={() =>
                                          setDetailBillId(m.bill.id)
                                      }
                                  />
                              ))}
                    </div>

                    <p className="px-0.5 text-xs leading-relaxed text-muted-foreground">
                        {mode === "pending" ? (
                            <>
                                <span className="text-foreground/90">
                                    {sortedPendingCards.length.toLocaleString(
                                        "pt-BR"
                                    )}
                                </span>
                                <span className="mx-1 text-border">·</span>
                                {pendingFilter === "all" ? (
                                    <span>
                                        {regularRows.length.toLocaleString("pt-BR")}{" "}
                                        {regularRows.length === 1
                                            ? "pendência no espaço"
                                            : "pendências no espaço"}
                                    </span>
                                ) : (
                                    <span>
                                        na lista filtrada (
                                        {regularRows.length.toLocaleString("pt-BR")}{" "}
                                        no espaço)
                                    </span>
                                )}
                            </>
                        ) : (
                            <>
                                <span className="text-foreground/90">
                                    {sortedModelCards.length.toLocaleString(
                                        "pt-BR"
                                    )}
                                </span>
                                <span className="mx-1 text-border">·</span>
                                <span>modelos de conta</span>
                            </>
                        )}
                    </p>
                </>
            )}

            <BillDetailSheet
                open={Boolean(detailBillId)}
                onOpenChange={(o) => {
                    if (!o) setDetailBillId(null)
                }}
                billId={detailBillId}
                workspaceId={currentWorkspaceId}
                fallbackBill={detailFallbackBill}
                todayYmd={todayYmd}
                onPay={openPay}
                onEditBill={() => {
                    const b = data.bills.find((x) => x.id === detailBillId)
                    if (b) {
                        setEditingBill(b)
                        setFormOpen(true)
                    }
                }}
                onAskDelete={() => {
                    const b = data.bills.find((x) => x.id === detailBillId)
                    if (b) setConfirmDeleteBill(b)
                }}
                onSkipInstance={(inst, bill) =>
                    void handleSkipBillInstance({
                        workspaceId: currentWorkspaceId,
                        user,
                        instanceId: inst.id,
                        bill,
                        dueYmd: inst.due_date.slice(0, 10),
                        onInvalidate,
                    })
                }
            />

            <BillFormDialog
                open={formOpen}
                onOpenChange={(o) => {
                    setFormOpen(o)
                    if (!o) setEditingBill(null)
                }}
                editingBill={editingBill}
                expenseCategories={expenseCats}
                creditCards={data.creditCards}
                saving={savingBill}
                onSave={handleSaveBill}
            />

            <PayBillDialog
                open={payOpen}
                onOpenChange={(o) => {
                    setPayOpen(o)
                    if (!o) setPayInput(null)
                }}
                user={user}
                workspaceId={currentWorkspaceId}
                input={payInput}
                categoriesExpense={expenseCats}
                creditCards={data.creditCards}
                saving={paySaving}
                setSaving={setPaySaving}
                onPaid={async () => {
                    toastSuccess("Pagamento registrado.")
                    await onInvalidate()
                }}
            />

            <AlertDialog
                open={Boolean(confirmDeleteBill)}
                onOpenChange={(o) => !o && setConfirmDeleteBill(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Remove o modelo e todas as parcelas ligadas a{" "}
                            <strong>{confirmDeleteBill?.name}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            type="button"
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={(e) => {
                                e.preventDefault()
                                void handleDeleteBill()
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
