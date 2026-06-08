"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import type {
    Category,
    CreditCard,
    Transaction,
    TransactionInstallmentPlanRef,
} from "@/lib/supabase"
import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import {
    formatTransactionDayPtBr,
    formatTransactionDmyPtBr,
} from "@/lib/transaction-date"
import {
    resolveInstallmentKn,
    totalPurchaseFromPlan,
} from "@/lib/transaction-installment"
import { INSTALLMENT_DELETE_WARNING } from "@/lib/transactions/delete-transactions"
import {
    buildInstallmentScheduleRows,
    type InstallmentPlanSliceInput,
} from "@/lib/installment-schedule-rows"
import { paymentMethodLabel } from "@/lib/payment-methods"
import {
    creditCardInvoiceHintForPurchase,
    creditCardInvoiceSlotLabelPt,
    formatDatePtBr,
} from "@/lib/credit-card-billing"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from "@/components/ui/sheet"
import { SheetDragHandle } from "@/components/ui/sheet-drag-handle"
import { mobileSheetChromeBelowHeaderClassName } from "@/components/ui/mobile-sheet-form-chrome"
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toastError } from "@/lib/toast"
import { EllipsisHorizontalIcon, PencilIcon, ArrowPathRoundedSquareIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline"
import Link from "next/link"
import {
    tagChipSky,
    tagChipSuccess,
    tagChipWarning,
    transactionRowChipShell,
} from "@/lib/tag-chip-classes"
import { cn } from "@/lib/utils"

const currencyFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
})

type SliceRow = InstallmentPlanSliceInput

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

function SectionLabel({
    children,
    className,
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <p
            className={cn(
                "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                className
            )}
        >
            {children}
        </p>
    )
}

/** Fundo suave + texto forte, sem borda — cores distintas por status da parcela. */
function installmentStatusChipClassNames(row: {
    status: "posted" | "pending"
    invoicePaid: boolean
}): string {
    if (row.status === "pending") {
        return tagChipWarning
    }
    if (row.invoicePaid) {
        return tagChipSuccess
    }
    return tagChipSky
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
    const [slices, setSlices] = useState<SliceRow[] | null>(null)
    const [slicesLoading, setSlicesLoading] = useState(false)
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

    /* eslint-disable react-hooks/set-state-in-effect -- load installment slice rows when sheet opens */
    useEffect(() => {
        if (!open || !t?.installment_plan_id) {
            setSlices(null)
            return
        }
        let cancelled = false
        setSlicesLoading(true)
        void (async () => {
            const { data, error } = await supabase
                .from("transactions")
                .select("id, amount, date, installment_sequence, created_at")
                .eq("installment_plan_id", t.installment_plan_id!)
                .order("installment_sequence", {
                    ascending: true,
                    nullsFirst: false,
                })
                .order("date", { ascending: true })
                .order("created_at", { ascending: true })
            if (cancelled) return
            if (error) {
                toastError(
                    formatSupabasePostgrestError(error) ??
                        "Não foi possível carregar as parcelas."
                )
                setSlices([])
            } else {
                setSlices(
                    (data ?? []).map((r) => ({
                        id: r.id,
                        amount: Number(r.amount),
                        date: r.date,
                        installment_sequence: r.installment_sequence ?? null,
                        created_at: r.created_at,
                    }))
                )
            }
            setSlicesLoading(false)
        })()
        return () => {
            cancelled = true
        }
    }, [open, t?.installment_plan_id])
    /* eslint-enable react-hooks/set-state-in-effect */

    const installmentBlock = useMemo(() => {
        const plan = t?.installment_plan ?? planFallback
        if (!t || t.type !== "expense" || !t.installment_plan_id || !plan) {
            return null
        }
        const kn = resolveInstallmentKn(
            t.installment_sequence,
            t.description,
            plan
        )
        const totalPurchase = totalPurchaseFromPlan(plan)
        const posted =
            slices?.reduce((sum, r) => sum + r.amount, 0) ?? null
        const remaining =
            posted != null ? Math.max(0, totalPurchase - posted) : null
        const postedCount = slices?.length ?? 0
        const futureSlots = Math.max(0, plan.total_installments - postedCount)

        const scheduleRows =
            slices != null && !slicesLoading
                ? buildInstallmentScheduleRows(plan, slices)
                : null

        return {
            kn,
            totalPurchase,
            posted,
            remaining,
            postedCount,
            futureSlots,
            slicesLoading,
            scheduleRows,
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
            {isMobile ? <SheetDragHandle /> : null}
            <SheetDescription className="sr-only">
                {isIncome ? "Receita" : "Despesa"}. {formatTransactionDayPtBr(t.date)}.
                Valor {currencyFmt.format(Number(t.amount))}.
            </SheetDescription>
            <div
                className={cn(
                    "shrink-0 border-b border-border",
                    mobileSheetChromeBelowHeaderClassName,
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
                            <SheetTitle className="font-heading text-base font-medium leading-tight">
                                Detalhe da transação
                            </SheetTitle>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0"
                                    aria-label="Mais opções"
                                >
                                    <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                    onClick={() => setDetailMode("edit")}
                                >
                                    <PencilIcon className="h-4 w-4" aria-hidden />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => onDelete(t)}
                                >
                                    <TrashIcon className="h-4 w-4" aria-hidden />
                                    Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 -mr-1"
                            onClick={() => onOpenChange(false)}
                            aria-label="Fechar"
                        >
                            <XMarkIcon className="h-5 w-5" aria-hidden />
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
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-foreground"
                            )}
                        >
                            {isIncome ? "+" : "−"}
                            {currencyFmt.format(Number(t.amount))}
                        </p>
                        {t.installment_plan_id ? (
                            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
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
                                        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
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
                                        Sim · {t.recurring_interval ?? "—"}
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
                    <section className="space-y-3">
                        <SectionLabel>Compra parcelada</SectionLabel>
                        <div className="overflow-hidden rounded-xl border border-border/80 bg-gradient-to-b from-muted/30 to-muted/10 p-3.5 dark:from-muted/15 dark:to-muted/5 sm:p-4">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                    {installmentBlock.kn ? (
                                        <p className="text-sm font-semibold text-foreground">
                                            Parcela {installmentBlock.kn.k} de{" "}
                                            {installmentBlock.kn.n}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Parcela vinculada a um plano de
                                            pagamento.
                                        </p>
                                    )}
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        Esta parcela:{" "}
                                        <span className="font-medium text-foreground">
                                            {currencyFmt.format(
                                                Number(t.amount)
                                            )}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <dl className="mt-3 grid gap-2 rounded-lg border border-border/50 bg-background/60 px-3 py-2.5 text-xs sm:text-sm">
                                <div className="flex justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Total da compra (referência)
                                    </dt>
                                    <dd className="shrink-0 tabular-nums font-medium">
                                        {currencyFmt.format(
                                            installmentBlock.totalPurchase
                                        )}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Já lançado no extrato
                                    </dt>
                                    <dd className="shrink-0 tabular-nums font-medium">
                                        {installmentBlock.slicesLoading
                                            ? "…"
                                            : installmentBlock.posted != null
                                              ? currencyFmt.format(
                                                    installmentBlock.posted
                                                )
                                              : "—"}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Falta (sobre o total)
                                    </dt>
                                    <dd className="shrink-0 tabular-nums font-medium">
                                        {installmentBlock.slicesLoading
                                            ? "…"
                                            : installmentBlock.remaining != null
                                              ? currencyFmt.format(
                                                    installmentBlock.remaining
                                                )
                                              : "—"}
                                    </dd>
                                </div>
                            </dl>

                            <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
                                {INSTALLMENT_DELETE_WARNING}
                            </p>

                            <div className="mt-3 overflow-x-auto rounded-lg border border-border/50 bg-background/40">
                                <Table className="min-w-[280px] text-xs">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="h-8 w-10 px-2 text-[10px] font-semibold uppercase tracking-wide">
                                                #
                                            </TableHead>
                                            <TableHead className="h-8 px-2 text-[10px] font-semibold uppercase tracking-wide">
                                                Data
                                            </TableHead>
                                            <TableHead className="h-8 px-2 text-right text-[10px] font-semibold uppercase tracking-wide">
                                                Valor da parcela
                                            </TableHead>
                                            <TableHead className="h-8 px-2 text-[10px] font-semibold uppercase tracking-wide">
                                                Status
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {installmentBlock.slicesLoading ? (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell
                                                    colSpan={4}
                                                    className="h-10 px-2 text-center text-muted-foreground"
                                                >
                                                    …
                                                </TableCell>
                                            </TableRow>
                                        ) : installmentBlock.scheduleRows &&
                                          installmentBlock.scheduleRows.length >
                                              0 ? (
                                            installmentBlock.scheduleRows.map(
                                                (row) => {
                                                    const isCurrent =
                                                        row.transactionId ===
                                                        t.id
                                                    return (
                                                        <TableRow
                                                            key={row.slot}
                                                            className={cn(
                                                                "h-9 border-border/40",
                                                                isCurrent &&
                                                                    "bg-muted/50 dark:bg-muted/30"
                                                            )}
                                                        >
                                                            <TableCell className="px-2 py-1.5 font-medium tabular-nums">
                                                                {row.slot}
                                                                {isCurrent ? (
                                                                    <span
                                                                        className="ml-1 text-[9px] font-normal text-muted-foreground"
                                                                        title="Esta transação"
                                                                    >
                                                                        ●
                                                                    </span>
                                                                ) : null}
                                                            </TableCell>
                                                            <TableCell className="max-w-[7rem] truncate px-2 py-1.5 tabular-nums text-muted-foreground">
                                                                {row.date
                                                                    ? formatTransactionDayPtBr(
                                                                          row.date
                                                                      )
                                                                    : "—"}
                                                            </TableCell>
                                                            <TableCell className="px-2 py-1.5 text-right tabular-nums font-medium">
                                                                {currencyFmt.format(
                                                                    row.parcelAmount
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="px-2 py-1.5">
                                                                <span
                                                                    className={cn(
                                                                        transactionRowChipShell,
                                                                        installmentStatusChipClassNames(
                                                                            row
                                                                        )
                                                                    )}
                                                                >
                                                                    {row.status ===
                                                                    "pending"
                                                                        ? "Não lançada"
                                                                        : row.invoicePaid
                                                                          ? "Paga"
                                                                          : "Lançada"}
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                }
                                            )
                                        ) : (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell
                                                    colSpan={4}
                                                    className="h-10 px-2 text-center text-muted-foreground"
                                                >
                                                    Sem parcelas para exibir.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {!installmentBlock.slicesLoading &&
                            installmentBlock.futureSlots > 0 ? (
                                <p className="mt-2.5 text-[11px] leading-snug text-muted-foreground">
                                    Faltam{" "}
                                    <span className="font-medium text-foreground">
                                        {installmentBlock.futureSlots}
                                    </span>{" "}
                                    {installmentBlock.futureSlots === 1
                                        ? "parcela"
                                        : "parcelas"}{" "}
                                    ainda não lançadas (aparecem nas datas de
                                    cobrança).
                                </p>
                            ) : null}
                        </div>
                    </section>
                ) : null}
            </div>
        </div>
    )

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side={isMobile ? "bottom" : "right"}
                fillMobileViewport={isMobile}
                className={cn(
                    "flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:sm:max-w-md",
                    isMobile && "rounded-t-2xl pt-0 sm:max-w-full"
                )}
                showCloseButton={false}
            >
                {detailMode === "edit" ? (
                    <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden">
                        {isMobile ? <SheetDragHandle /> : null}
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
