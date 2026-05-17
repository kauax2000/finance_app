"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CreditCardIcon } from "@heroicons/react/24/outline"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import {
    supabase,
    type Category,
    type CreditCard,
    type CreditCardInvoicePayment,
    type Transaction,
    type WorkspaceInstallmentPlan,
} from "@/lib/supabase"
import {
    formatSupabasePostgrestError,
    isPostgrestRelationMissingError,
} from "@/lib/supabase-errors"
import { toastError, toastSuccess, toastWarning } from "@/lib/toast"
import { CustomForm } from "@/components/ui/form"
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
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
    MobileSheetFormHeaderCloseButton,
    MobileSheetFormStickyHeader,
    mobileFormSheetContentClassName,
} from "@/components/ui/mobile-sheet-form-chrome"
import { useIsMobile } from "@/hooks/use-mobile"
import { TransactionDetailSheet } from "@/components/transactions/transaction-detail-sheet"
import type {
    InstallmentPlanUpdatePayload,
    TransactionFormSavePayload,
} from "@/components/transactions/transaction-form-types"
import { CreditCardDetailSkeleton } from "@/components/credit-cards/credit-card-detail-skeleton"
import { CreditCardDetailView } from "@/components/credit-cards/credit-card-detail-view"
import { CreditCardFormFields } from "@/components/credit-cards/credit-card-form-fields"
import { parseExpiryFields } from "@/components/credit-cards/credit-card-form-shared"
import { resolveCreditCardForSave } from "@/lib/credit-card-number"
import {
    buildCardCycleSnapshot,
    cycleOffsetBoundsForCard,
    shiftRefDateByCycles,
} from "@/lib/credit-card-billing"
import {
    buildCreditCardInvoiceAnalytics,
    filterCardExpensesInWindow,
} from "@/lib/credit-card-invoice-analytics"
import {
    ccAnalyticsRowsToListTransactions,
    fetchCreditCardExpenseRowsForCard,
    fetchCreditCardInvoicePaymentsForCard,
    fetchWorkspaceInstallmentPlansForCard,
    INVOICE_POSTED_TX_DISPLAY_CAP,
    transactionIdForInstallmentPlan,
    type CcTxAnalyticsRow,
} from "@/lib/credit-cards-workspace-transactions"
import type { WorkspaceMemberDirectoryEntry } from "@/components/dashboard/use-dashboard-data"
import { formatYearMonth } from "@/lib/budget-month"
import { useMemberDirectoryQuery } from "@/lib/queries/use-member-directory"
import {
    deleteTransactionsByIds,
    persistInstallmentPlanUpdate,
    persistTransactionSave,
} from "@/lib/transaction-detail-sheet-mutations"
import { fetchTransactionForDetailSheet } from "@/lib/transactions-detail-sheet-query"
import { formatTransactionDayPtBr } from "@/lib/transaction-date"
import { ROUTES, transactionsHrefForCreditCard } from "@/config/navigation"
import { useHideMobileFab } from "@/components/layout/mobile-fab-provider"
import { usePageChromeSlot } from "@/components/layout/page-chrome-provider"
import { cn } from "@/lib/utils"

const currencyFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
})

export default function CreditCardDetailPageClient() {
    const isMobile = useIsMobile()
    const router = useRouter()
    const rawParams = useParams()
    const cardIdParam = rawParams.cardId
    const cardId =
        typeof cardIdParam === "string"
            ? cardIdParam
            : Array.isArray(cardIdParam)
              ? cardIdParam[0] ?? ""
              : ""

    const { user, loading: authLoading } = useAuth()
    const { currentWorkspaceId, loading: workspaceLoading } = useWorkspace()

    const [card, setCard] = useState<CreditCard | null>(null)
    const [ccAnalyticsRows, setCcAnalyticsRows] = useState<CcTxAnalyticsRow[]>([])
    const [installmentPlans, setInstallmentPlans] = useState<WorkspaceInstallmentPlan[]>([])
    const [invoicePayments, setInvoicePayments] = useState<CreditCardInvoicePayment[]>([])
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [creditCardsTableMissing, setCreditCardsTableMissing] = useState(false)

    const [pendingCardDelete, setPendingCardDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [sheetCategories, setSheetCategories] = useState<Category[]>([])
    const [sheetCreditCards, setSheetCreditCards] = useState<CreditCard[]>([])
    const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(
        null
    )
    const [detailOpen, setDetailOpen] = useState(false)
    const [detailSaving, setDetailSaving] = useState(false)
    const [pendingTransactionDelete, setPendingTransactionDelete] =
        useState<Transaction | null>(null)
    const [deletingTransaction, setDeletingTransaction] = useState(false)
    const [editingOpen, setEditingOpen] = useState(false)
    const [editSaving, setEditSaving] = useState(false)
    const [editFormKey, setEditFormKey] = useState(0)

    const [cycleOffset, setCycleOffset] = useState(0)

    const [editName, setEditName] = useState("")
    const [editCardNumber, setEditCardNumber] = useState("")
    const [editClosingDay, setEditClosingDay] = useState("")
    const [editDueDay, setEditDueDay] = useState("")
    const [editCreditLimit, setEditCreditLimit] = useState("")
    const [editExpiryMonth, setEditExpiryMonth] = useState("")
    const [editExpiryYear, setEditExpiryYear] = useState("")

    const openEdit = useCallback((c: CreditCard) => {
        setEditFormKey((k) => k + 1)
        setEditName(c.name)
        setEditCardNumber("")
        setEditClosingDay(String(c.closing_day))
        setEditDueDay(String(c.due_day))
        setEditCreditLimit(
            c.credit_limit != null ? String(c.credit_limit).replace(".", ",") : ""
        )
        setEditExpiryMonth(
            c.expiry_month != null && c.expiry_month >= 1 && c.expiry_month <= 12
                ? String(c.expiry_month).padStart(2, "0")
                : ""
        )
        setEditExpiryYear(c.expiry_year != null ? String(c.expiry_year) : "")
        setEditingOpen(true)
    }, [])

    const closeEdit = useCallback(() => {
        setEditingOpen(false)
        setEditName("")
        setEditCardNumber("")
        setEditClosingDay("")
        setEditDueDay("")
        setEditCreditLimit("")
        setEditExpiryMonth("")
        setEditExpiryYear("")
    }, [])

    const load = useCallback(async () => {
        if (!user || !currentWorkspaceId || !cardId) return
        setLoading(true)
        setNotFound(false)
        setCreditCardsTableMissing(false)

        const [cardRes, txPack, plansPack, paymentsPack] = await Promise.all([
            supabase
                .from("credit_cards")
                .select("*")
                .eq("id", cardId)
                .eq("workspace_id", currentWorkspaceId)
                .maybeSingle(),
            fetchCreditCardExpenseRowsForCard(supabase, currentWorkspaceId, cardId),
            fetchWorkspaceInstallmentPlansForCard(supabase, currentWorkspaceId, cardId),
            fetchCreditCardInvoicePaymentsForCard(supabase, currentWorkspaceId, cardId),
        ])

        if (cardRes.error) {
            if (isPostgrestRelationMissingError(cardRes.error)) {
                setCreditCardsTableMissing(true)
                setCard(null)
            } else {
                toastError(
                    formatSupabasePostgrestError(cardRes.error) ??
                        "Não foi possível carregar o cartão."
                )
                setCard(null)
            }
        } else if (!cardRes.data) {
            setNotFound(true)
            setCard(null)
        } else {
            setCard(cardRes.data)
        }

        if (txPack.error) {
            if (!isPostgrestRelationMissingError(txPack.error)) {
                toastError(
                    formatSupabasePostgrestError(txPack.error) ??
                        "Não foi possível carregar transações do cartão."
                )
            }
            setCcAnalyticsRows([])
        } else {
            setCcAnalyticsRows(txPack.rows)
        }

        if (plansPack.error) {
            if (!isPostgrestRelationMissingError(plansPack.error)) {
                toastError(
                    formatSupabasePostgrestError(plansPack.error) ??
                        "Não foi possível carregar parcelamentos."
                )
            }
            setInstallmentPlans([])
        } else {
            setInstallmentPlans(plansPack.plans)
        }

        if (paymentsPack.error) {
            if (!isPostgrestRelationMissingError(paymentsPack.error)) {
                toastError(
                    formatSupabasePostgrestError(paymentsPack.error) ??
                        "Não foi possível carregar pagamentos de fatura."
                )
            }
            setInvoicePayments([])
        } else {
            setInvoicePayments(paymentsPack.payments)
        }

        setLoading(false)
    }, [user, currentWorkspaceId, cardId])

    const refreshInvoicePayments = useCallback(async () => {
        if (!user || !currentWorkspaceId || !cardId) return
        const pack = await fetchCreditCardInvoicePaymentsForCard(
            supabase,
            currentWorkspaceId,
            cardId
        )
        if (pack.error) {
            if (!isPostgrestRelationMissingError(pack.error)) {
                toastError(
                    formatSupabasePostgrestError(pack.error) ??
                        "Não foi possível atualizar pagamentos de fatura."
                )
            }
            setInvoicePayments([])
            return
        }
        setInvoicePayments(pack.payments)
    }, [user, currentWorkspaceId, cardId])

    useEffect(() => {
        if (!user || !currentWorkspaceId) return
        let cancelled = false
        void (async () => {
            const [categoriesRes, cardsRes] = await Promise.all([
                supabase
                    .from("categories")
                    .select("*")
                    .eq("workspace_id", currentWorkspaceId),
                supabase
                    .from("credit_cards")
                    .select("*")
                    .eq("workspace_id", currentWorkspaceId)
                    .order("name"),
            ])
            if (cancelled) return
            if (!categoriesRes.error && categoriesRes.data) {
                setSheetCategories(categoriesRes.data)
            }
            if (!cardsRes.error && cardsRes.data) {
                setSheetCreditCards(cardsRes.data)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [user, currentWorkspaceId])

    const refreshDetailTransaction = useCallback(
        async (transactionId: string) => {
            if (!user || !currentWorkspaceId) return
            const { transaction } = await fetchTransactionForDetailSheet(supabase, {
                transactionId,
                workspaceId: currentWorkspaceId,
                creditCards: sheetCreditCards,
            })
            if (transaction) setDetailTransaction(transaction)
        },
        [user, currentWorkspaceId, sheetCreditCards]
    )

    const openInstallmentPlanSheet = useCallback(
        async (planId: string) => {
            if (!user || !currentWorkspaceId) return
            const txId = transactionIdForInstallmentPlan(ccAnalyticsRows, planId)
            if (!txId) {
                toastError("Nenhuma parcela encontrada para este plano.")
                return
            }
            const { transaction, errorMessage } = await fetchTransactionForDetailSheet(
                supabase,
                {
                    transactionId: txId,
                    workspaceId: currentWorkspaceId,
                    creditCards: sheetCreditCards,
                }
            )
            if (errorMessage) {
                toastError(errorMessage)
                return
            }
            if (!transaction) {
                toastError("Transação não encontrada.")
                return
            }
            setDetailTransaction(transaction)
            setDetailOpen(true)
        },
        [user, currentWorkspaceId, ccAnalyticsRows, sheetCreditCards]
    )

    const handleDetailSave = useCallback(
        async (payload: TransactionFormSavePayload) => {
            if (!user || !currentWorkspaceId) return false
            setDetailSaving(true)
            const editingId = payload.editingId
            const ok = await persistTransactionSave({
                supabase,
                user,
                workspaceId: currentWorkspaceId,
                payload,
                resolveEditingTransaction: (id) =>
                    detailTransaction?.id === id ? detailTransaction : null,
                onAfterSuccess: async () => {
                    await load()
                },
            })
            setDetailSaving(false)
            if (ok && editingId) await refreshDetailTransaction(editingId)
            return ok
        },
        [
            user,
            currentWorkspaceId,
            detailTransaction,
            load,
            refreshDetailTransaction,
        ]
    )

    const handleUpdateInstallmentPlanForSheet = useCallback(
        async (planId: string, payload: InstallmentPlanUpdatePayload) => {
            if (!user || !currentWorkspaceId) return false
            setDetailSaving(true)
            const txId = detailTransaction?.id
            const ok = await persistInstallmentPlanUpdate({
                supabase,
                planId,
                payload,
                onAfterSuccess: async () => {
                    await load()
                },
            })
            setDetailSaving(false)
            if (ok && txId) await refreshDetailTransaction(txId)
            return ok
        },
        [user, currentWorkspaceId, detailTransaction, load, refreshDetailTransaction]
    )

    const confirmDeleteTransaction = useCallback(async () => {
        if (!pendingTransactionDelete) return
        setDeletingTransaction(true)
        if (!currentWorkspaceId) return
        const ok = await deleteTransactionsByIds(
            supabase,
            [pendingTransactionDelete.id],
            currentWorkspaceId
        )
        setDeletingTransaction(false)
        if (!ok) return
        setPendingTransactionDelete(null)
        await load()
    }, [pendingTransactionDelete, load])

    useEffect(() => {
        if (authLoading || workspaceLoading) return
        if (!user || !currentWorkspaceId || !cardId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- sync loading off when auth/workspace/id missing
            setLoading(false)
            if (!cardId) setNotFound(true)
            return
        }
        void load()
    }, [authLoading, workspaceLoading, user, currentWorkspaceId, cardId, load])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reset billing cycle pager when card changes
        setCycleOffset(0)
    }, [cardId])

    const todayAnchor = useMemo(() => new Date(), [cardId])

    const cycleOffsetBounds = useMemo(
        () =>
            card
                ? cycleOffsetBoundsForCard(
                      card,
                      ccAnalyticsRows,
                      installmentPlans,
                      todayAnchor
                  )
                : { min: 0, max: 0 },
        [card, ccAnalyticsRows, installmentPlans, todayAnchor]
    )

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- clamp offset when computed bounds change
        setCycleOffset((o) =>
            Math.min(cycleOffsetBounds.max, Math.max(cycleOffsetBounds.min, o))
        )
    }, [cycleOffsetBounds.min, cycleOffsetBounds.max])

    const refDate = useMemo(
        () =>
            card ? shiftRefDateByCycles(card, todayAnchor, cycleOffset) : todayAnchor,
        [card, todayAnchor, cycleOffset]
    )

    const snapshot = useMemo(() => {
        if (!card) return null
        return buildCardCycleSnapshot(card, ccAnalyticsRows, refDate, {
            installmentPlans,
        })
    }, [card, ccAnalyticsRows, installmentPlans, refDate])

    useHideMobileFab()

    usePageChromeSlot({
        backHref: card ? ROUTES.CREDIT_CARDS : undefined,
    })

    const invoiceAnalytics = useMemo(() => {
        if (!card || !snapshot) return null
        return buildCreditCardInvoiceAnalytics(
            snapshot,
            card.id,
            ccAnalyticsRows,
            installmentPlans
        )
    }, [card, snapshot, ccAnalyticsRows, installmentPlans])

    const { invoicePostedTransactions, invoicePostedTotalInPeriod } = useMemo(() => {
        if (!card || !snapshot) {
            return {
                invoicePostedTransactions: [] as Transaction[],
                invoicePostedTotalInPeriod: 0,
            }
        }
        const posted = filterCardExpensesInWindow(
            ccAnalyticsRows,
            card.id,
            snapshot.openWindow.start,
            snapshot.openWindow.end
        )
        const sorted = [...posted].sort((a, b) => b.date.localeCompare(a.date))
        const invoicePostedTotalInPeriod = sorted.length
        const capped = sorted.slice(0, INVOICE_POSTED_TX_DISPLAY_CAP)
        const invoicePostedTransactions = ccAnalyticsRowsToListTransactions(
            capped,
            card
        )
        return {
            invoicePostedTransactions,
            invoicePostedTotalInPeriod,
        }
    }, [card, snapshot, ccAnalyticsRows])

    const invoicePeriodYm = useMemo(
        () => (snapshot ? formatYearMonth(snapshot.nextClose) : ""),
        [snapshot]
    )

    const memberDirQuery = useMemberDirectoryQuery(currentWorkspaceId)

    const memberDirectoryByUserId = useMemo(() => {
        if (!user?.id) return {}
        const fallback: WorkspaceMemberDirectoryEntry = {
            full_name:
                typeof user.user_metadata?.full_name === "string" &&
                user.user_metadata.full_name.trim() !== ""
                    ? user.user_metadata.full_name.trim()
                    : null,
            email: user.email ?? "",
            avatar_url: null,
            avatar_color: null,
        }
        if (memberDirQuery.isPending && !memberDirQuery.data) {
            return { [user.id]: fallback }
        }
        const rows = memberDirQuery.data
        if (!rows || memberDirQuery.isError) {
            return { [user.id]: fallback }
        }
        const nextDir: Record<string, WorkspaceMemberDirectoryEntry> = {}
        for (const row of rows) {
            nextDir[row.user_id] = {
                full_name: row.full_name,
                email: row.email ?? "",
                avatar_url: row.avatar_url ?? null,
                avatar_color: row.avatar_color ?? null,
            }
        }
        if (!nextDir[user.id]) {
            nextDir[user.id] = fallback
        }
        return nextDir
    }, [memberDirQuery.data, memberDirQuery.isError, memberDirQuery.isPending, user])

    const invoicePaidByCardClose = useMemo(() => {
        const next = new Set<string>()
        for (const p of invoicePayments) {
            if (p.status === "paid") {
                next.add(`${p.credit_card_id}:${p.statement_close_date}`)
            }
        }
        return next
    }, [invoicePayments])

    const openTransactionDetailById = useCallback(
        async (transactionId: string) => {
            if (!user || !currentWorkspaceId) return
            const { transaction, errorMessage } =
                await fetchTransactionForDetailSheet(supabase, {
                    transactionId,
                    workspaceId: currentWorkspaceId,
                    creditCards: sheetCreditCards,
                })
            if (!transaction) {
                toastError(errorMessage ?? "Transação não encontrada.")
                return
            }
            setDetailTransaction(transaction)
            setDetailOpen(true)
        },
        [user, currentWorkspaceId, sheetCreditCards]
    )

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!card || !user || !currentWorkspaceId) return

        const resolved = resolveCreditCardForSave({
            digits: editCardNumber,
            mode: "edit",
            existing: {
                last_four: card.last_four,
                brand: card.brand,
            },
        })
        if (!resolved.ok) {
            toastError(resolved.message)
            return
        }
        if (resolved.luhnWarning) {
            toastWarning(
                "O número informado pode estar incorreto. Verifique os dígitos."
            )
        }
        const closeN = parseInt(editClosingDay, 10)
        const dueN = parseInt(editDueDay, 10)
        if (
            Number.isNaN(closeN) ||
            closeN < 1 ||
            closeN > 31 ||
            Number.isNaN(dueN) ||
            dueN < 1 ||
            dueN > 31
        ) {
            toastError("Dia de fechamento e vencimento devem ser entre 1 e 31.")
            return
        }

        const exp = parseExpiryFields(editExpiryMonth, editExpiryYear)
        if (!exp.ok) {
            toastError(exp.message)
            return
        }

        setEditSaving(true)
        const limitVal = editCreditLimit.trim()
            ? parseFloat(editCreditLimit.replace(",", "."))
            : null
        const { data, error } = await supabase
            .from("credit_cards")
            .update({
                name: editName.trim(),
                last_four: resolved.lastFour,
                brand: resolved.brand,
                closing_day: closeN,
                due_day: dueN,
                credit_limit:
                    limitVal !== null && !Number.isNaN(limitVal) ? limitVal : null,
                is_active: card.is_active,
                ...(exp.month != null && exp.year != null
                    ? { expiry_month: exp.month, expiry_year: exp.year }
                    : {}),
            })
            .eq("id", card.id)
            .eq("workspace_id", currentWorkspaceId)
            .select("*")
            .maybeSingle()
        setEditSaving(false)

        if (error) {
            toastError(
                formatSupabasePostgrestError(error) ?? "Não foi possível salvar o cartão."
            )
            return
        }

        toastSuccess("Cartão atualizado.")
        closeEdit()
        if (data) setCard(data)
        else void load()
    }

    const confirmDelete = async () => {
        if (!card) return
        setDeleting(true)
        const { error } = await supabase
            .from("credit_cards")
            .delete()
            .eq("id", card.id)
        setDeleting(false)
        if (error) {
            toastError(
                formatSupabasePostgrestError(error) ??
                    "Não foi possível excluir o cartão."
            )
            return
        }
        toastSuccess("Cartão removido.")
        setPendingCardDelete(false)
        router.push(ROUTES.CREDIT_CARDS)
    }

    const handleSetActive = async (active: boolean) => {
        if (!card) return
        const { error } = await supabase
            .from("credit_cards")
            .update({ is_active: active })
            .eq("id", card.id)
        if (error) {
            toastError(
                formatSupabasePostgrestError(error) ??
                    "Não foi possível atualizar o cartão."
            )
            return
        }
        toastSuccess(active ? "Cartão ativado." : "Cartão desativado.")
        setCard((prev) => (prev ? { ...prev, is_active: active } : prev))
    }

    if (authLoading || workspaceLoading || loading) {
        return <CreditCardDetailSkeleton />
    }

    if (!user || !currentWorkspaceId) {
        return (
            <p className="text-sm text-muted-foreground">
                Escolha uma carteira para ver este cartão.
            </p>
        )
    }

    if (creditCardsTableMissing) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Tabela ainda não criada no banco
                        </CardTitle>
                        <CardDescription>
                            A tabela de cartões não está disponível. Aplique a migração em{" "}
                            <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                supabase/migrations/20260403140000_credit_cards_payment.sql
                            </code>
                            .
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Button type="button" variant="outline" size="sm" asChild>
                    <Link href={ROUTES.CREDIT_CARDS}>Voltar aos cartões</Link>
                </Button>
            </div>
        )
    }

    if (notFound || !card) {
        return (
            <EmptyState className="max-w-md border-border/80 bg-card/40 py-10">
                <EmptyStateIcon>
                    <CreditCardIcon aria-hidden />
                </EmptyStateIcon>
                <EmptyStateTitle>Cartão não encontrado</EmptyStateTitle>
                <EmptyStateDescription>
                    Não há cartão com este identificador nesta carteira ou o link
                    está incorreto.
                </EmptyStateDescription>
                <EmptyStateActions>
                    <Button type="button" variant="default" size="sm" asChild>
                        <Link href={ROUTES.CREDIT_CARDS}>Ver todos os cartões</Link>
                    </Button>
                </EmptyStateActions>
            </EmptyState>
        )
    }

    const editDialog = isMobile ? (
        <Sheet
            open={editingOpen}
            onOpenChange={(open) => {
                if (!open && editSaving) return
                if (!open && !editSaving) closeEdit()
            }}
        >
            <SheetContent
                side="bottom"
                fillMobileViewport
                showCloseButton={false}
                className={mobileFormSheetContentClassName}
            >
                <MobileSheetFormDragStrip />
                <MobileSheetFormStickyHeader
                    title="Editar cartão"
                    endAdornment={
                        <MobileSheetFormHeaderCloseButton disabled={editSaving} />
                    }
                />
                <CustomForm
                    onSubmit={handleSaveEdit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="min-h-0 flex-1 overflow-y-auto px-4">
                        <div className="space-y-3 pb-2">
                            <CreditCardFormFields
                                formKey={`edit-detail-${card.id}-${editFormKey}`}
                                idPrefix="cc-detail-edit"
                                name={editName}
                                onNameChange={setEditName}
                                cardNumber={editCardNumber}
                                onCardNumberChange={setEditCardNumber}
                                savedLastFour={card.last_four}
                                closingDay={editClosingDay}
                                onClosingDayChange={setEditClosingDay}
                                dueDay={editDueDay}
                                onDueDayChange={setEditDueDay}
                                creditLimit={editCreditLimit}
                                onCreditLimitChange={setEditCreditLimit}
                                expiryMonth={editExpiryMonth}
                                onExpiryMonthChange={setEditExpiryMonth}
                                expiryYear={editExpiryYear}
                                onExpiryYearChange={setEditExpiryYear}
                            />
                        </div>
                    </div>
                    <SheetFooter className="mt-0 shrink-0 gap-2 border-t border-border/60 px-4 pt-4">
                        <Button
                            type="submit"
                            size="sm"
                            className="h-10 w-full"
                            disabled={editSaving}
                        >
                            {editSaving ? "Salvando…" : "Salvar"}
                        </Button>
                    </SheetFooter>
                </CustomForm>
            </SheetContent>
        </Sheet>
    ) : (
        <Dialog
            open={editingOpen}
            onOpenChange={(open) => {
                if (!open && !editSaving) closeEdit()
            }}
        >
            <DialogContent className="flex max-h-[min(90dvh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
                <CustomForm
                    onSubmit={handleSaveEdit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
                        <DialogTitle>Editar cartão</DialogTitle>
                        <DialogDescription>
                            Atualize os dados do cartão. O número completo não é armazenado.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto px-6">
                        <div className="space-y-3 pb-2">
                            <CreditCardFormFields
                                formKey={`edit-detail-${card.id}-${editFormKey}`}
                                idPrefix="cc-detail-edit"
                                name={editName}
                                onNameChange={setEditName}
                                cardNumber={editCardNumber}
                                onCardNumberChange={setEditCardNumber}
                                savedLastFour={card.last_four}
                                closingDay={editClosingDay}
                                onClosingDayChange={setEditClosingDay}
                                dueDay={editDueDay}
                                onDueDayChange={setEditDueDay}
                                creditLimit={editCreditLimit}
                                onCreditLimitChange={setEditCreditLimit}
                                expiryMonth={editExpiryMonth}
                                onExpiryMonthChange={setEditExpiryMonth}
                                expiryYear={editExpiryYear}
                                onExpiryYearChange={setEditExpiryYear}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mx-0 mb-0 mt-0 shrink-0 flex-row flex-wrap justify-end gap-2 rounded-b-xl border-t border-border/60 bg-background px-6 pt-4 pb-5 sm:gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => closeEdit()}
                            disabled={editSaving}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={editSaving}>
                            {editSaving ? "Salvando…" : "Salvar"}
                        </Button>
                    </DialogFooter>
                </CustomForm>
            </DialogContent>
        </Dialog>
    )

    return (
        <>
            <CreditCardDetailView
                card={card}
                workspaceId={currentWorkspaceId}
                userId={user.id}
                snapshot={snapshot}
                invoiceAnalytics={invoiceAnalytics}
                invoicePayments={invoicePayments}
                onInvoicePaymentChanged={refreshInvoicePayments}
                transactionsHref={transactionsHrefForCreditCard(card.id)}
                invoiceTransactions={invoicePostedTransactions}
                invoicePostedTotalInPeriod={invoicePostedTotalInPeriod}
                invoicePostedDisplayCap={INVOICE_POSTED_TX_DISPLAY_CAP}
                invoicePeriodYm={invoicePeriodYm}
                memberDirectoryByUserId={memberDirectoryByUserId}
                currentUserId={user.id}
                invoicePaidByCardClose={invoicePaidByCardClose}
                onTransactionClick={(tx) => {
                    void openTransactionDetailById(tx.id)
                }}
                cycleOffset={cycleOffset}
                cycleOffsetBounds={cycleOffsetBounds}
                onCycleOffsetChange={setCycleOffset}
                onEdit={() => openEdit(card)}
                onDelete={() => setPendingCardDelete(true)}
                onSetActive={handleSetActive}
                onInstallmentPlanPress={(planId) => {
                    void openInstallmentPlanSheet(planId)
                }}
            />
            {detailTransaction ? (
                <TransactionDetailSheet
                    transaction={detailTransaction}
                    open={detailOpen}
                    onOpenChange={(next) => {
                        setDetailOpen(next)
                        if (!next) {
                            setDetailTransaction(null)
                        }
                    }}
                    creditCards={sheetCreditCards}
                    categories={sheetCategories}
                    categoriesHref={ROUTES.DASHBOARD_CATEGORIES}
                    creditCardsHref={ROUTES.CREDIT_CARDS}
                    subscriptionsHref={ROUTES.SUBSCRIPTIONS}
                    saving={detailSaving}
                    onSave={handleDetailSave}
                    onUpdateInstallmentPlan={handleUpdateInstallmentPlanForSheet}
                    onDelete={(tx) => {
                        setDetailOpen(false)
                        setDetailTransaction(null)
                        setPendingTransactionDelete(tx)
                    }}
                />
            ) : null}
            {editDialog}
            <AlertDialog
                open={pendingCardDelete}
                onOpenChange={(open) => {
                    if (!open && !deleting) setPendingCardDelete(false)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir cartão?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Lançamentos já salvos podem ficar sem vínculo com este cartão. Esta
                            ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
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

            <AlertDialog
                open={pendingTransactionDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !deletingTransaction) {
                        setPendingTransactionDelete(null)
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <p>Esta ação não pode ser desfeita.</p>
                                {pendingTransactionDelete ? (
                                    <ul className="list-inside list-disc text-foreground">
                                        <li>
                                            {formatTransactionDayPtBr(
                                                pendingTransactionDelete.date
                                            )}{" "}
                                            —{" "}
                                            {pendingTransactionDelete.description ||
                                                pendingTransactionDelete.category?.name ||
                                                "Sem descrição"}
                                        </li>
                                        <li className="font-medium">
                                            {pendingTransactionDelete.type === "income"
                                                ? "Receita"
                                                : "Despesa"}{" "}
                                            de{" "}
                                            {currencyFmt.format(
                                                Number(pendingTransactionDelete.amount)
                                            )}
                                        </li>
                                    </ul>
                                ) : null}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingTransaction}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deletingTransaction}
                            onClick={(e) => {
                                e.preventDefault()
                                void confirmDeleteTransaction()
                            }}
                        >
                            {deletingTransaction ? "Excluindo…" : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
