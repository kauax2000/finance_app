"use client"

import { currencyBRL } from "@/lib/formatters"
import { useEffect, useMemo, useState } from "react"
import type {
    Category,
    CreditCard,
    Transaction,
    TransactionInstallmentPlanRef,
} from "@/lib/supabase"
import { supabase } from "@/lib/supabase"
import {
    formatTransactionDayPtBr,
    formatTransactionDmyPtBr,
} from "@/lib/transaction-date"
import { resolveInstallmentKn } from "@/lib/transaction-installment"
import { INSTALLMENT_DELETE_WARNING } from "@/lib/transactions/delete-transactions"
import { paymentMethodLabel } from "@/lib/payment-methods"
import {
    creditCardInvoiceHintForPurchase,
    creditCardInvoiceSlotLabelPt,
    formatDatePtBr,
} from "@/lib/credit-card-billing"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    InstallmentPurchaseSection,
    SectionLabel,
    summarizeInstallmentPlan,
    useInstallmentSlices,
} from "@/components/transactions/installment-purchase-section"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TransactionFormSurface } from "@/components/transactions/transaction-form-surface"
import { useTransactionForm } from "@/components/transactions/transaction-form-use"
import type {
    InstallmentPlanUpdatePayload,
    TransactionFormSavePayload,
} from "@/components/transactions/transaction-form-types"
import { ArrowPathRoundedSquareIcon, EllipsisHorizontalIcon, PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/16/solid"

import Link from "next/link"
import { cn } from "@/lib/utils"

const RECURRING_INTERVAL_LABEL: Record<"daily" | "weekly" | "monthly", string> = {
    daily: "diária",
    weekly: "semanal",
    monthly: "mensal",
}

export type TransactionDetailSheetProps = {
    transaction: Transaction | null
    open: boolean
    onOpenChange: (open: boolean) => void
    creditCards: CreditCard[]
    categories: Category[]
    categoriesHref: string
    creditCardsHref: string
    subscriptionsHref: string
    saving: boolean
    onSave: (payload: TransactionFormSavePayload) => Promise<boolean>
    onUpdateInstallmentPlan: (
        planId: string,
        payload: InstallmentPlanUpdatePayload
    ) => Promise<boolean>
    onDelete: (t: Transaction) => void
    /** When the sheet opens with this true, switch to edit mode once (e.g. table “Editar”). */
    launchInEditMode?: boolean
    onLaunchEditConsumed?: () => void
}

export function TransactionDetailSheet({
    transaction,
    open,
    onOpenChange,
    creditCards,
    categories,
    categoriesHref,
    creditCardsHref,
    subscriptionsHref,
    saving,
    onSave,
    onUpdateInstallmentPlan,
    onDelete,
    launchInEditMode = false,
    onLaunchEditConsumed,
}: TransactionDetailSheetProps) {
    const isMobile = useIsMobile()
    const [detailMode, setDetailMode] = useState<"view" | "edit">("view")
    const [planFallback, setPlanFallback] =
        useState<TransactionInstallmentPlanRef | null>(null)

    const t = transaction

    /* eslint-disable react-hooks/set-state-in-effect -- load/clear installment plan embed when sheet opens */
    useEffect(() => {
        if (!open || !t?.installment_plan_id) {
            setPlanFallback(null)
            return
        }
        if (t.installment_plan) {
            setPlanFallback(null)
            return
        }
        let cancelled = false
        void (async () => {
            const { data, error } = await supabase
                .from("workspace_installment_plans")
                .select(
                    "id,total_installments,installment_amount,final_installment_amount,generated_count,is_active,next_billing_date,description"
                )
                .eq("id", t.installment_plan_id!)
                .maybeSingle()
            if (cancelled) return
            if (!error && data) {
                setPlanFallback(data as TransactionInstallmentPlanRef)
            } else {
                setPlanFallback(null)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [open, t?.installment_plan_id, t?.installment_plan])
    /* eslint-enable react-hooks/set-state-in-effect */

    const { slices, slicesLoading } = useInstallmentSlices(t?.installment_plan_id, open)

    const installmentBlock = useMemo(() => {
        const plan = t?.installment_plan ?? planFallback
        if (!t || t.type !== "expense" || !t.installment_plan_id || !plan) {
            return null
        }
        return {
            kn: resolveInstallmentKn(t.installment_sequence, t.description, plan),
            summary: summarizeInstallmentPlan(plan, slices, slicesLoading),
        }
    }, [t, planFallback, slices, slicesLoading])

    const txForForm = useMemo((): Transaction | null => {
        if (!t) return null
        if (t.installment_plan || !planFallback) return t
        return { ...t, installment_plan: planFallback }
    }, [t, planFallback])

    const {
        handleSubmit,
        fieldsProps,
        formTitle,
        formDescription,
        showFooter,
        submitDisabled,
    } = useTransactionForm({
        active: open && detailMode === "edit",
        saving,
        editingTransaction: txForForm,
        defaultLaunchKind: "expense",
        categories,
        creditCards,
        categoriesHref,
        creditCardsHref,
        onSave,
        onSaveInstallmentPlan: undefined,
        onUpdateInstallmentPlan,
        closeOnSuccess: false,
        onClose: () => setDetailMode("view"),
        onSuccess: () => setDetailMode("view"),
    })

    useEffect(() => {
        if (!open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- reset edit mode when sheet closes
            setDetailMode("view")
        }
    }, [open])

    useEffect(() => {
        if (!open || !launchInEditMode) return
        // eslint-disable-next-line react-hooks/set-state-in-effect -- open sheet directly in edit from row action
        setDetailMode("edit")
        onLaunchEditConsumed?.()
    }, [open, launchInEditMode, onLaunchEditConsumed])

    if (!t) {
        return null
    }

    const paymentCard = t.payment_credit_card_id
        ? creditCards.find((c) => c.id === t.payment_credit_card_id)
        : null

    const paymentLine =
        t.type === "expense" && t.payment_method
            ? t.payment_method === "credit_card" && paymentCard
                ? `${paymentMethodLabel(t.payment_method)} · ${paymentCard.name} · •••• ${paymentCard.last_four}`
                : paymentMethodLabel(t.payment_method)
            : null

    const creditInvoiceHint =
        t.type === "expense" &&
        t.payment_method === "credit_card" &&
        paymentCard
            ? creditCardInvoiceHintForPurchase(t.date, paymentCard)
            : null

    const isIncome = t.type === "income"

    const viewBody = (
        <div className="flex min-h-0 flex-1 flex-col gap-0">
            <DialogDescription className="sr-only">
                {isIncome ? "Receita" : "Despesa"}. {formatTransactionDayPtBr(t.date)}.
                Valor {currencyBRL(Number(t.amount))}.
            </DialogDescription>
            <div
                className={cn(
                    "shrink-0 border-b border-border",
                    "mb-3",
                )}
            >
                <div
                    className={cn(
                        "flex items-center gap-3 px-4 pb-4 pt-4 sm:px-5 md:pt-5",
                        isMobile && "pt-2"
                    )}
                >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="font-heading text-base font-medium leading-tight">
                                Detalhe da transação
                            </DialogTitle>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="tertiary"
                                    size="icon-sm"
                                    className="shrink-0"
                                    aria-label="Mais opções"
                                >
                                    <EllipsisHorizontalIcon aria-hidden />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" size="sm">
                                <DropdownMenuItem
                                    onClick={() => setDetailMode("edit")}
                                >
                                    <PencilIcon className="h-4 w-4" aria-hidden />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive"
                                    onClick={() => onDelete(t)}
                                >
                                    <TrashIcon aria-hidden />
                                    Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            type="button"
                            variant="tertiary"
                            size="icon-sm"
                            className="shrink-0 -mr-1"
                            onClick={() => onOpenChange(false)}
                            aria-label="Fechar"
                        >
                            <XMarkIcon aria-hidden />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-5">
                <section className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4 dark:bg-muted/10">
                    <div className="flex items-start justify-between gap-3">
                        <SectionLabel className="shrink-0">Resumo</SectionLabel>
                        <p className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                            {formatTransactionDayPtBr(t.date)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">
                            {t.installment_plan_id
                                ? "Valor desta movimentação"
                                : "Valor"}
                        </p>
                        <p
                            className={cn(
                                "mt-0.5 text-2xl font-semibold tabular-nums tracking-tight",
                                isIncome
                                    ? "text-income"
                                    : "text-foreground"
                            )}
                        >
                            {isIncome ? "+" : "−"}
                            {currencyBRL(Number(t.amount))}
                        </p>
                        {t.installment_plan_id ? (
                            <p className="mt-1 text-2xs leading-snug text-muted-foreground">
                                Em compras parceladas, o valor acima é desta
                                parcela no extrato; o total da compra aparece em
                                Compra parcelada.
                            </p>
                        ) : null}
                    </div>
                </section>

                <section className="space-y-3">
                    <SectionLabel>Detalhes</SectionLabel>
                    <div className="space-y-3 text-sm">
                        <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                            <p className="text-xs font-medium text-muted-foreground">
                                Descrição
                            </p>
                            <p className="mt-1 line-clamp-4 break-words text-foreground">
                                {t.description?.trim() || "—"}
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Categoria
                                </p>
                                {t.category ? (
                                    <p className="mt-1 inline-flex items-center gap-2">
                                        <span
                                            className="size-2 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    t.category.color ||
                                                    "var(--muted-foreground)",
                                            }}
                                            aria-hidden
                                        />
                                        {t.category.name}
                                    </p>
                                ) : (
                                    <p className="mt-1">—</p>
                                )}
                            </div>
                            <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Data (calendário)
                                </p>
                                <p className="mt-1 tabular-nums">
                                    {formatTransactionDmyPtBr(t.date)}
                                </p>
                            </div>
                            {t.type === "expense" && paymentLine ? (
                                <div className="rounded-lg border border-border/60 bg-background/80 p-3 sm:col-span-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Pagamento
                                    </p>
                                    <p className="mt-1">{paymentLine}</p>
                                    {creditInvoiceHint ? (
                                        <p className="mt-2 text-2xs leading-snug text-muted-foreground">
                                            <span className="font-medium text-foreground/90">
                                                {creditCardInvoiceSlotLabelPt(
                                                    creditInvoiceHint.slot
                                                )}
                                            </span>
                                            {" · "}
                                            Fecha em{" "}
                                            {formatDatePtBr(
                                                creditInvoiceHint.statementClose
                                            )}
                                            {" · "}
                                            Vencimento estimado{" "}
                                            {formatDatePtBr(
                                                creditInvoiceHint.dueEstimate
                                            )}
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}
                            {t.is_recurring ? (
                                <div className="rounded-lg border border-border/60 bg-background/80 p-3 sm:col-span-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Recorrência
                                    </p>
                                    <p className="mt-1">
                                        Sim ·{" "}
                                        {t.recurring_interval
                                            ? RECURRING_INTERVAL_LABEL[t.recurring_interval]
                                            : "—"}
                                    </p>
                                </div>
                            ) : null}
                            {t.subscription_id ? (
                                <div className="rounded-lg border border-border/60 bg-background/80 p-3 sm:col-span-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Assinatura
                                    </p>
                                    <Link
                                        href={subscriptionsHref}
                                        className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                        <ArrowPathRoundedSquareIcon
                                            className="size-3.5 shrink-0 opacity-80"
                                            aria-hidden
                                        />
                                        {t.subscription?.name ??
                                            "Ver assinaturas"}
                                    </Link>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </section>

                {installmentBlock ? (
                    <InstallmentPurchaseSection
                        summary={installmentBlock.summary}
                        kn={installmentBlock.kn}
                        amount={Number(t.amount)}
                        isCurrentRow={(row) => row.transactionId === t.id}
                        currentRowTitle="Esta transação"
                        warning={INSTALLMENT_DELETE_WARNING}
                    />
                ) : null}
            </div>
        </div>
    )

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                fillMobileViewport={isMobile}
                className={cn(
                    "flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:sm:max-w-md",
                    isMobile && "rounded-t-2xl pt-0 sm:max-w-full"
                )}
            >
                {detailMode === "edit" ? (
                    <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden">
                        <TransactionFormSurface
                            variant="detail-sheet"
                            handleSubmit={handleSubmit}
                            fieldsProps={fieldsProps}
                            formTitle={formTitle}
                            formDescription={formDescription}
                            showFooter={showFooter}
                            submitDisabled={submitDisabled}
                            saving={saving}
                        />
                    </div>
                ) : (
                    viewBody
                )}
            </SheetContent>
        </Sheet>
    )
}
