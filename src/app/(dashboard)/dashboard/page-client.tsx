"use client"

import { useCallback, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardPageSkeleton } from "@/components/dashboard/dashboard-page-skeleton"
import { useDashboardData } from "@/components/dashboard/use-dashboard-data"
import { DashboardToolbar } from "@/components/dashboard/dashboard-toolbar"
import { MonthNav } from "@/components/categories/categories-toolbar"
import { usePageChromeSlot } from "@/components/layout/page-chrome-provider"
import { DashboardKpiCards } from "@/components/dashboard/dashboard-kpi-cards"
import { DashboardPaymentsCalendar } from "@/components/dashboard/dashboard-payments-calendar"
import { DashboardOpenInvoices } from "@/components/dashboard/dashboard-open-invoices"
import { DashboardInstallmentsEndingSoon } from "@/components/dashboard/dashboard-installments-ending-soon"
import { DashboardRecentTransactions } from "@/components/dashboard/dashboard-recent-transactions"
import {
    DashboardPaymentEventPreviewSheet,
    type DashboardPaymentPreviewModel,
} from "@/components/dashboard/dashboard-payment-event-preview-sheet"
import type { PaymentEvent, UpcomingPaymentRow } from "@/components/dashboard/payment-events"
import { TransactionDetailSheet } from "@/components/transactions/transaction-detail-sheet"
import type {
    InstallmentPlanUpdatePayload,
    TransactionFormSavePayload,
} from "@/components/transactions/transaction-form-types"
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
import { MoneyDisplay } from "@/components/ui/money-display"
import { ROUTES } from "@/config/navigation"
import { supabase } from "@/lib/supabase"
import type { Transaction } from "@/lib/supabase"
import { fetchTransactionForDetailSheet } from "@/lib/transactions-detail-sheet-query"
import {
    deleteTransactionsByIds,
    persistInstallmentPlanUpdate,
    persistTransactionSave,
} from "@/lib/transaction-detail-sheet-mutations"
import { toastError } from "@/lib/toast"
import { formatTransactionDayPtBr } from "@/lib/transaction-date"
import { dispatchFinanceTransactionsMutated } from "@/lib/workspace-data-events"

const DashboardExpenseCategories = dynamic(
    () =>
        import("@/components/dashboard/dashboard-expense-categories").then(
            (m) => ({ default: m.DashboardExpenseCategories }),
        ),
    {
        ssr: false,
        loading: () => (
            <Card>
                <CardContent className="min-h-[280px] pt-6">
                    <Skeleton className="h-[220px] w-full rounded-lg" />
                </CardContent>
            </Card>
        ),
    },
)

function previewFromPaymentEvent(e: PaymentEvent): DashboardPaymentPreviewModel {
    return {
        kind: e.kind,
        dateYmd: e.dateYmd,
        title: e.title,
        amount: e.amount,
        sourceHref: e.sourceHref,
        metaId: e.metaId,
        installmentPlanId: e.installmentPlanId,
    }
}

function previewFromUpcomingRow(r: UpcomingPaymentRow): DashboardPaymentPreviewModel {
    return {
        kind: r.kind,
        dateYmd: r.dateYmd,
        title: r.title,
        amount: r.amount,
        sourceHref: r.sourceHref,
        metaId: r.metaId,
        installmentPlanId: r.installmentPlanId,
    }
}

export default function DashboardPageClient() {
    const { loading: authLoading } = useAuth()
    const {
        currentWorkspaceId,
        loading: workspaceLoading,
        error: workspaceError,
        refreshWorkspaces,
    } = useWorkspace()

    const d = useDashboardData()

    const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(
        null,
    )
    const [detailOpen, setDetailOpen] = useState(false)
    const [detailLaunchEdit, setDetailLaunchEdit] = useState(false)
    const [saving, setSaving] = useState(false)
    const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [preview, setPreview] = useState<DashboardPaymentPreviewModel | null>(
        null,
    )
    const [previewOpen, setPreviewOpen] = useState(false)

    const dashboardDateFilter = useMemo(
        () => (
            <MonthNav
                budgetMonthYm={d.calendarYm}
                onBudgetMonthYmChange={d.setCalendarYm}
                dense
            />
        ),
        [d.calendarYm, d.setCalendarYm],
    )
    usePageChromeSlot({ dateFilter: dashboardDateFilter })

    const openEventPreview = useCallback((model: DashboardPaymentPreviewModel) => {
        setDetailOpen(false)
        setDetailTransaction(null)
        setDetailLaunchEdit(false)
        setPreview(model)
        setPreviewOpen(true)
    }, [])

    const openTransactionDetailById = useCallback(
        async (transactionId: string) => {
            if (!d.currentWorkspaceId) return
            setPreviewOpen(false)
            setPreview(null)
            setDetailLaunchEdit(false)
            const { transaction, errorMessage } =
                await fetchTransactionForDetailSheet(supabase, {
                    transactionId,
                    workspaceId: d.currentWorkspaceId,
                    creditCards: d.creditCards,
                })
            if (!transaction) {
                toastError(errorMessage ?? "Transação não encontrada.")
                return
            }
            setDetailTransaction(transaction)
            setDetailOpen(true)
        },
        [d.currentWorkspaceId, d.creditCards],
    )

    const handleDetailLaunchEditConsumed = useCallback(() => {
        setDetailLaunchEdit(false)
    }, [])

    const handleSave = useCallback(
        async (payload: TransactionFormSavePayload): Promise<boolean> => {
            if (!d.user || !d.currentWorkspaceId) return false
            setSaving(true)
            const ok = await persistTransactionSave({
                supabase,
                user: d.user,
                workspaceId: d.currentWorkspaceId,
                payload,
                resolveEditingTransaction: (editingId) =>
                    detailTransaction?.id === editingId ? detailTransaction : null,
                onAfterSuccess: async () => {
                    await d.refetch()
                    dispatchFinanceTransactionsMutated()
                },
            })
            setSaving(false)
            if (ok && payload.editingId && d.currentWorkspaceId) {
                const { transaction } = await fetchTransactionForDetailSheet(
                    supabase,
                    {
                        transactionId: payload.editingId,
                        workspaceId: d.currentWorkspaceId,
                        creditCards: d.creditCards,
                    },
                )
                if (transaction) setDetailTransaction(transaction)
            }
            return ok
        },
        [
            d.user,
            d.currentWorkspaceId,
            d.creditCards,
            detailTransaction,
            d.refetch,
        ],
    )

    const handleUpdateInstallmentPlan = useCallback(
        async (
            planId: string,
            payload: InstallmentPlanUpdatePayload,
        ): Promise<boolean> => {
            if (!d.currentWorkspaceId) return false
            setSaving(true)
            const ok = await persistInstallmentPlanUpdate({
                supabase,
                planId,
                payload,
                onAfterSuccess: async () => {
                    await d.refetch()
                    dispatchFinanceTransactionsMutated()
                },
            })
            setSaving(false)
            if (ok && detailTransaction?.id && d.currentWorkspaceId) {
                const { transaction } = await fetchTransactionForDetailSheet(
                    supabase,
                    {
                        transactionId: detailTransaction.id,
                        workspaceId: d.currentWorkspaceId,
                        creditCards: d.creditCards,
                    },
                )
                if (transaction) setDetailTransaction(transaction)
            }
            return ok
        },
        [
            d.currentWorkspaceId,
            d.creditCards,
            detailTransaction?.id,
            d.refetch,
        ],
    )

    const confirmDelete = useCallback(async () => {
        if (!pendingDelete) return
        setDeleting(true)
        if (!d.currentWorkspaceId) return
        const ok = await deleteTransactionsByIds(
            supabase,
            [pendingDelete.id],
            d.currentWorkspaceId
        )
        setDeleting(false)
        if (!ok) return
        setPendingDelete(null)
        await d.refetch()
        dispatchFinanceTransactionsMutated()
    }, [pendingDelete, d.refetch])

    if (workspaceError) {
        return (
            <Alert variant="destructive">
                <ExclamationTriangleIcon />
                <AlertTitle>Não foi possível carregar as carteiras</AlertTitle>
                <AlertDescription className="flex flex-col gap-3">
                    <span>{workspaceError}</span>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-fit border-destructive/40 bg-transparent text-destructive-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => void refreshWorkspaces()}
                    >
                        Tentar novamente
                    </Button>
                </AlertDescription>
            </Alert>
        )
    }

    if (!authLoading && !workspaceLoading && !currentWorkspaceId) {
        return (
            <Card>
                <CardContent className="py-8 text-sm text-muted-foreground">
                    Nenhum espaço de trabalho selecionado. Escolha um espaço no menu
                    lateral para continuar.
                </CardContent>
            </Card>
        )
    }

    if (d.loading) {
        return <DashboardPageSkeleton />
    }

    return (
        <div className="min-w-0 max-w-full space-y-5">
            <DashboardToolbar
                calendarYm={d.calendarYm}
                onCalendarYmChange={d.setCalendarYm}
            />

            <div className="relative">
                <DashboardKpiCards
                    kpiCurrent={d.kpiCurrent}
                    kpiPrev={d.kpiPrev}
                    kpiPlanned={d.kpiPlanned}
                    totalOpenInvoices={d.totalOpenInvoices}
                />
            </div>

            <div className="min-h-0 min-w-0">
                <DashboardPaymentsCalendar
                    calendarYm={d.calendarYm}
                    onCalendarYmChange={d.setCalendarYm}
                    events={d.calendarEvents}
                    todayYmd={d.todayYmd}
                    summary={d.calendarSummary}
                    upcomingRows={d.upcomingPayments}
                    onTransactionPostedClick={(id) => {
                        void openTransactionDetailById(id)
                    }}
                    onPaymentEventPreview={(e) => {
                        openEventPreview(previewFromPaymentEvent(e))
                    }}
                    onUpcomingPaymentClick={(r) => {
                        openEventPreview(previewFromUpcomingRow(r))
                    }}
                />
            </div>

            <div className="relative min-w-0">
                <div
                    className={[
                        "grid grid-cols-1 gap-5",
                        "lg:grid-cols-2 lg:items-start lg:gap-x-4 xl:gap-x-6",
                    ].join(" ")}
                >
                    <DashboardExpenseCategories
                        data={d.expenseByCategory}
                        calendarYm={d.calendarYm}
                    />
                    <div className="min-w-0 space-y-5">
                        <DashboardOpenInvoices
                            cards={d.creditCards}
                            snapshots={d.snapshots}
                            calendarYm={d.calendarYm}
                        />
                        <DashboardInstallmentsEndingSoon
                            endingSoon={d.installmentsEndingSoon}
                            creditCards={d.creditCards}
                            onPlanClick={(plan) => {
                                openEventPreview({
                                    kind: "installment",
                                    dateYmd: plan.nextBilling,
                                    title: plan.label,
                                    amount: plan.monthlyAmount,
                                    sourceHref: null,
                                    installmentPlanId: plan.planId,
                                })
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="relative">
                <DashboardRecentTransactions
                    transactions={d.recentTransactions}
                    memberDirectoryByUserId={d.memberDirectoryByUserId}
                    currentUserId={d.user?.id ?? null}
                    calendarYm={d.calendarYm}
                    invoicePaidByCardClose={d.invoicePaidByCardClose}
                    onTransactionClick={(tx) => {
                        void openTransactionDetailById(tx.id)
                    }}
                />
            </div>

            {detailTransaction ? (
                <TransactionDetailSheet
                    transaction={detailTransaction}
                    open={detailOpen}
                    onOpenChange={(next) => {
                        setDetailOpen(next)
                        if (!next) {
                            setDetailTransaction(null)
                            setDetailLaunchEdit(false)
                        }
                    }}
                    creditCards={d.creditCards}
                    categories={d.categories}
                    categoriesHref={ROUTES.DASHBOARD_CATEGORIES}
                    creditCardsHref={ROUTES.CREDIT_CARDS}
                    subscriptionsHref={ROUTES.SUBSCRIPTIONS}
                    saving={saving}
                    onSave={handleSave}
                    onUpdateInstallmentPlan={handleUpdateInstallmentPlan}
                    launchInEditMode={detailLaunchEdit}
                    onLaunchEditConsumed={handleDetailLaunchEditConsumed}
                    onDelete={(tx) => {
                        setDetailOpen(false)
                        setDetailTransaction(null)
                        setDetailLaunchEdit(false)
                        setPendingDelete(tx)
                    }}
                />
            ) : null}

            <DashboardPaymentEventPreviewSheet
                open={previewOpen}
                onOpenChange={(open) => {
                    setPreviewOpen(open)
                    if (!open) setPreview(null)
                }}
                preview={preview}
                installmentPlans={d.installmentPlans}
                categories={d.categories}
                creditCards={d.creditCards}
            />

            <AlertDialog
                open={pendingDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !deleting) setPendingDelete(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <p>Esta ação não pode ser desfeita.</p>
                                {pendingDelete ? (
                                    <ul className="list-inside list-disc text-foreground">
                                        <li>
                                            {formatTransactionDayPtBr(
                                                pendingDelete.date,
                                            )}{" "}
                                            —{" "}
                                            {pendingDelete.description ||
                                                pendingDelete.category?.name ||
                                                "Sem descrição"}
                                        </li>
                                        <li className="flex flex-wrap items-center gap-1 font-medium">
                                            {pendingDelete.type === "income"
                                                ? "Receita"
                                                : "Despesa"}{" "}
                                            de{" "}
                                            <MoneyDisplay
                                                value={Number(
                                                    pendingDelete.amount,
                                                )}
                                                size="sm"
                                                className="inline font-medium"
                                            />
                                        </li>
                                    </ul>
                                ) : null}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
