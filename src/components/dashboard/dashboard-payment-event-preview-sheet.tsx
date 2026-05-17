"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from "@/components/ui/sheet"
import { SheetDragHandle } from "@/components/ui/sheet-drag-handle"
import { mobileSheetChromeBelowHeaderClassName } from "@/components/ui/mobile-sheet-form-chrome"
import { formatDatePtBr, formatTransactionDayPtBr, formatTransactionDmyPtBr } from "@/lib/transaction-date"
import { cn } from "@/lib/utils"
import {
    tagChipDanger,
    tagChipInfo,
    tagChipNeutral,
    tagChipSky,
    tagChipSuccess,
    tagChipWarning,
    transactionRowChipShell,
} from "@/lib/tag-chip-classes"
import {
    paymentEventHasMetaBadge,
    type PaymentEventKind,
} from "@/components/dashboard/payment-events"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import type { Category, CreditCard, WorkspaceInstallmentPlan } from "@/lib/supabase"
import { totalPurchaseFromPlan } from "@/lib/transaction-installment"
import {
    buildInstallmentScheduleRows,
    type InstallmentPlanSliceInput,
    type InstallmentScheduleRow,
} from "@/lib/installment-schedule-rows"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { toastError } from "@/lib/toast"
import { XMarkIcon } from "@heroicons/react/24/outline"

const currencyFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
})

export type DashboardPaymentPreviewModel = {
    kind: PaymentEventKind
    dateYmd: string
    title: string
    amount: number | null
    sourceHref: string | null
    metaId?: string
    installmentPlanId?: string | null
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
                className,
            )}
        >
            {children}
        </p>
    )
}

function kindShortLabel(k: PaymentEventKind): string {
    switch (k) {
        case "subscription":
            return "Assinatura"
        case "installment":
            return "Parcelada"
        case "card_close":
            return "Fechamento"
        case "card_due":
            return "Vencimento"
        case "bill_due":
            return "Conta"
        case "posted_income":
            return "Receita"
        case "posted_expense":
            return "Despesa"
        default:
            return k
    }
}

function chipClass(kind: PaymentEventKind): string {
    switch (kind) {
        case "subscription":
            return tagChipInfo
        case "installment":
            return tagChipWarning
        case "card_close":
        case "card_due":
            return tagChipNeutral
        case "bill_due":
            return tagChipInfo
        case "posted_income":
            return tagChipSuccess
        case "posted_expense":
            return tagChipDanger
        default:
            return tagChipNeutral
    }
}

function metaBadgeLabelAndClass(
    kind: PaymentEventKind,
    installmentPlanId?: string | null,
): { label: string; chipClass: string } | null {
    if (!paymentEventHasMetaBadge({ kind, installmentPlanId })) return null
    const plan = installmentPlanId?.trim()
    if (
        (kind === "posted_expense" || kind === "posted_income") &&
        plan
    ) {
        return { label: "Parcelada", chipClass: tagChipWarning }
    }
    return { label: kindShortLabel(kind), chipClass: chipClass(kind) }
}

function contextualDescription(
    kind: PaymentEventKind,
    installmentPlanId?: string | null,
): string {
    const plan = installmentPlanId?.trim()
    if (
        (kind === "posted_income" || kind === "posted_expense") &&
        plan
    ) {
        return "Transação vinculada a um plano de parcelas."
    }
    switch (kind) {
        case "subscription":
            return "Cobrança prevista de assinatura. Ainda não há transação lançada nesta data."
        case "installment":
            return "Compra parcelada prevista ainda não lançada como transação."
        case "bill_due":
            return "Conta com vencimento previsto. Confira em Contas para registrar o pagamento."
        case "card_close":
            return "Data de fechamento da fatura do cartão (evento informativo)."
        case "card_due":
            return "Data de vencimento da fatura do cartão (evento informativo)."
        default:
            return "Evento previsto no calendário."
    }
}

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

function resolveCurrentSlotFromDate(
    scheduleRows: InstallmentScheduleRow[],
    dateYmd: string,
    plan: WorkspaceInstallmentPlan,
): number | null {
    for (const row of scheduleRows) {
        if (row.date === dateYmd) return row.slot
    }
    const generatedCount = plan.generated_count
    const nextSlot = generatedCount + 1
    if (nextSlot >= 1 && nextSlot <= plan.total_installments) {
        return nextSlot
    }
    return null
}

export function DashboardPaymentEventPreviewSheet({
    open,
    onOpenChange,
    preview,
    installmentPlans,
    categories,
    creditCards,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    preview: DashboardPaymentPreviewModel | null
    installmentPlans?: WorkspaceInstallmentPlan[]
    categories?: Category[]
    creditCards?: CreditCard[]
}) {
    const isMobile = useIsMobile()
    const side = isMobile ? "bottom" : "right"

    const dateLabel = preview ? formatDatePtBr(preview.dateYmd) : ""
    const meta = preview
        ? metaBadgeLabelAndClass(preview.kind, preview.installmentPlanId)
        : null

    const isInstallmentKind = preview?.kind === "installment"
    const planId = isInstallmentKind ? preview?.metaId : null

    const plan = useMemo(() => {
        if (!planId || !installmentPlans) return null
        return installmentPlans.find((p) => p.id === planId) ?? null
    }, [planId, installmentPlans])

    const category = useMemo(() => {
        if (!plan?.category_id || !categories) return null
        return categories.find((c) => c.id === plan.category_id) ?? null
    }, [plan?.category_id, categories])

    const [slices, setSlices] = useState<InstallmentPlanSliceInput[] | null>(null)
    const [slicesLoading, setSlicesLoading] = useState(false)

    useEffect(() => {
        if (!open || !isInstallmentKind || !planId) {
            setSlices(null)
            setSlicesLoading(false)
            return
        }
        let cancelled = false
        setSlicesLoading(true)
        void (async () => {
            const { data, error } = await supabase
                .from("transactions")
                .select("id, amount, date, installment_sequence, created_at")
                .eq("installment_plan_id", planId)
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
                        "Não foi possível carregar as parcelas.",
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
                    })),
                )
            }
            setSlicesLoading(false)
        })()
        return () => {
            cancelled = true
        }
    }, [open, isInstallmentKind, planId])

    const installmentBlock = useMemo(() => {
        if (!plan || !isInstallmentKind) return null
        const total = totalPurchaseFromPlan(plan)
        const posted = slices?.reduce((sum, r) => sum + r.amount, 0) ?? null
        const remaining = posted != null ? Math.max(0, total - posted) : null
        const postedCount = slices?.length ?? 0
        const futureSlots = Math.max(0, plan.total_installments - postedCount)

        const currentSlotK = plan.generated_count + 1
        const kn =
            currentSlotK >= 1 && currentSlotK <= plan.total_installments
                ? { k: currentSlotK, n: plan.total_installments }
                : null

        const scheduleRows =
            slices != null && !slicesLoading
                ? buildInstallmentScheduleRows(plan, slices)
                : null

        return {
            kn,
            totalPurchase: total,
            posted,
            remaining,
            postedCount,
            futureSlots,
            slicesLoading,
            scheduleRows,
        }
    }, [plan, isInstallmentKind, slices, slicesLoading])

    const highlightSlot = useMemo(() => {
        if (!installmentBlock?.scheduleRows || !preview?.dateYmd || !plan) return null
        return resolveCurrentSlotFromDate(
            installmentBlock.scheduleRows,
            preview.dateYmd,
            plan,
        )
    }, [installmentBlock?.scheduleRows, preview?.dateYmd, plan])

    if (isInstallmentKind && plan) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side={side}
                    fillMobileViewport={isMobile}
                    className={cn(
                        "flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:sm:max-w-md",
                        isMobile && "rounded-t-2xl pt-0 sm:max-w-full",
                    )}
                    showCloseButton={false}
                >
                    <div className="flex min-h-0 flex-1 flex-col gap-0">
                        {isMobile ? <SheetDragHandle /> : null}
                        <SheetDescription className="sr-only">
                            Detalhes da compra parcelada prevista.
                        </SheetDescription>

                        {/* ── Header ── */}
                        <div
                            className={cn(
                                "shrink-0 border-b border-border",
                                mobileSheetChromeBelowHeaderClassName,
                            )}
                        >
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-4 pb-4 pt-4 sm:px-5 md:pt-5",
                                    isMobile && "pt-2",
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

                        {/* ── Body ── */}
                        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-5">
                            {/* Resumo */}
                            <section className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4 dark:bg-muted/10">
                                <div className="flex items-start justify-between gap-3">
                                    <SectionLabel className="shrink-0">Resumo</SectionLabel>
                                    <p className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                                        {dateLabel}
                                    </p>
                                </div>
                                {preview!.amount != null ? (
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Valor desta parcela
                                        </p>
                                        <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                                            −{currencyFmt.format(preview!.amount)}
                                        </p>
                                        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                                            Em compras parceladas, o valor acima é desta
                                            parcela no extrato; o total da compra aparece em
                                            Compra parcelada.
                                        </p>
                                    </div>
                                ) : null}
                            </section>

                            {/* Detalhes */}
                            <section className="space-y-3">
                                <SectionLabel>Detalhes</SectionLabel>
                                <div className="space-y-3 text-sm">
                                    <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Descrição
                                        </p>
                                        <p className="mt-1 line-clamp-4 break-words text-foreground">
                                            {plan.description?.trim() || preview!.title || "—"}
                                        </p>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {category ? (
                                            <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Categoria
                                                </p>
                                                <p className="mt-1 inline-flex items-center gap-2">
                                                    <span
                                                        className="size-2 shrink-0 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                category.color ||
                                                                "var(--muted-foreground)",
                                                        }}
                                                        aria-hidden
                                                    />
                                                    {category.name}
                                                </p>
                                            </div>
                                        ) : null}
                                        <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Data prevista
                                            </p>
                                            <p className="mt-1 tabular-nums">
                                                {formatTransactionDmyPtBr(preview!.dateYmd)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Compra parcelada */}
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
                                                {preview!.amount != null ? (
                                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                        Esta parcela:{" "}
                                                        <span className="font-medium text-foreground">
                                                            {currencyFmt.format(preview!.amount)}
                                                        </span>
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <dl className="mt-3 grid gap-2 rounded-lg border border-border/50 bg-background/60 px-3 py-2.5 text-xs sm:text-sm">
                                            <div className="flex justify-between gap-3">
                                                <dt className="text-muted-foreground">
                                                    Total da compra (referência)
                                                </dt>
                                                <dd className="shrink-0 tabular-nums font-medium">
                                                    {currencyFmt.format(
                                                        installmentBlock.totalPurchase,
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
                                                                installmentBlock.posted,
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
                                                                installmentBlock.remaining,
                                                            )
                                                          : "—"}
                                                </dd>
                                            </div>
                                        </dl>

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
                                                                    row.slot === highlightSlot
                                                                return (
                                                                    <TableRow
                                                                        key={row.slot}
                                                                        className={cn(
                                                                            "h-9 border-border/40",
                                                                            isCurrent &&
                                                                                "bg-muted/50 dark:bg-muted/30",
                                                                        )}
                                                                    >
                                                                        <TableCell className="px-2 py-1.5 font-medium tabular-nums">
                                                                            {row.slot}
                                                                            {isCurrent ? (
                                                                                <span
                                                                                    className="ml-1 text-[9px] font-normal text-muted-foreground"
                                                                                    title="Esta parcela"
                                                                                >
                                                                                    ●
                                                                                </span>
                                                                            ) : null}
                                                                        </TableCell>
                                                                        <TableCell className="max-w-[7rem] truncate px-2 py-1.5 tabular-nums text-muted-foreground">
                                                                            {row.date
                                                                                ? formatTransactionDayPtBr(
                                                                                      row.date,
                                                                                  )
                                                                                : "—"}
                                                                        </TableCell>
                                                                        <TableCell className="px-2 py-1.5 text-right tabular-nums font-medium">
                                                                            {currencyFmt.format(
                                                                                row.parcelAmount,
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell className="px-2 py-1.5">
                                                                            <span
                                                                                className={cn(
                                                                                    transactionRowChipShell,
                                                                                    installmentStatusChipClassNames(
                                                                                        row,
                                                                                    ),
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
                                                            },
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

                            {/* Source link */}
                            {preview!.sourceHref ? (
                                <Button
                                    variant="outline"
                                    size="default"
                                    className="w-full"
                                    asChild
                                >
                                    <Link href={preview!.sourceHref}>
                                        Ver origem
                                    </Link>
                                </Button>
                            ) : null}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side={side}
                fillMobileViewport={isMobile}
                className={cn(
                    "flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:sm:max-w-md",
                    isMobile && "rounded-t-2xl pt-0 sm:max-w-full",
                )}
                showCloseButton={false}
            >
                {preview ? (
                    <div className="flex min-h-0 flex-1 flex-col gap-0">
                        {isMobile ? <SheetDragHandle /> : null}

                        <SheetDescription className="sr-only">
                            Detalhes do evento previsto no calendário de
                            pagamentos.
                        </SheetDescription>

                        {/* ── Header ── */}
                        <div
                            className={cn(
                                "shrink-0 border-b border-border",
                                mobileSheetChromeBelowHeaderClassName,
                            )}
                        >
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-4 pb-4 pt-4 sm:px-5 md:pt-5",
                                    isMobile && "pt-2",
                                )}
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <SheetTitle className="font-heading text-base font-medium leading-5">
                                                {preview.title}
                                            </SheetTitle>
                                            {meta ? (
                                                <span
                                                    className={cn(
                                                        transactionRowChipShell,
                                                        meta.chipClass,
                                                    )}
                                                >
                                                    {meta.label}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-0.5">
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

                        {/* ── Body ── */}
                        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-5">
                            {/* Summary card */}
                            <section className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4 dark:bg-muted/10">
                                <div className="flex items-start justify-between gap-3">
                                    <SectionLabel className="shrink-0">Resumo</SectionLabel>
                                    <p className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                                        {dateLabel}
                                    </p>
                                </div>
                                {preview.amount != null ? (
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Valor previsto
                                        </p>
                                        <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                                            {currencyFmt.format(preview.amount)}
                                        </p>
                                    </div>
                                ) : null}
                            </section>

                            {/* Details section */}
                            <section className="space-y-3">
                                <SectionLabel>Detalhes</SectionLabel>
                                <div className="space-y-3 text-sm">
                                    {/* Description */}
                                    <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Descrição
                                        </p>
                                        <p className="mt-1 leading-relaxed text-foreground">
                                            {contextualDescription(
                                                preview.kind,
                                                preview.installmentPlanId,
                                            )}
                                        </p>
                                    </div>

                                </div>
                            </section>

                            {/* Source link */}
                            {preview.sourceHref ? (
                                <Button
                                    variant="outline"
                                    size="default"
                                    className="w-full"
                                    asChild
                                >
                                    <Link href={preview.sourceHref}>
                                        Ver origem
                                    </Link>
                                </Button>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </SheetContent>
        </Sheet>
    )
}
