"use client"

import { useMemo, type ReactNode } from "react"
import Link from "next/link"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { currencyBRL } from "@/lib/formatters"
import { formatDatePtBr, formatTransactionDmyPtBr } from "@/lib/transaction-date"
import { cn } from "@/lib/utils"
import { transactionRowChipShell } from "@/components/ui/badge"
import type { PaymentEvent, PaymentEventKind } from "@/components/dashboard/payment-events"
import { paymentEventMetaBadge } from "@/components/dashboard/payment-event-badge"
import type { Category, WorkspaceInstallmentPlan } from "@/lib/supabase"
import type { InstallmentScheduleRow } from "@/lib/installment-schedule-rows"
import {
    InstallmentPurchaseSection,
    SectionLabel,
    summarizeInstallmentPlan,
    useInstallmentSlices,
} from "@/components/transactions/installment-purchase-section"
import { XMarkIcon } from "@heroicons/react/20/solid"

export type DashboardPaymentPreviewModel = Pick<
    PaymentEvent,
    "kind" | "dateYmd" | "title" | "amount" | "sourceHref" | "metaId" | "installmentPlanId"
>

function contextualDescription(kind: PaymentEventKind, installmentPlanId?: string | null): string {
    if ((kind === "posted_income" || kind === "posted_expense") && installmentPlanId?.trim()) {
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

/** A parcela do dia clicado; sem parcela nesse dia, a próxima a gerar. */
function resolveCurrentSlotFromDate(
    scheduleRows: InstallmentScheduleRow[],
    dateYmd: string,
    plan: WorkspaceInstallmentPlan
): number | null {
    for (const row of scheduleRows) {
        if (row.date === dateYmd) return row.slot
    }
    const nextSlot = plan.generated_count + 1
    return nextSlot >= 1 && nextSlot <= plan.total_installments ? nextSlot : null
}

function FieldCard({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="rounded-lg border border-border/60 bg-background/80 p-3">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            {children}
        </div>
    )
}

export function DashboardPaymentEventPreviewSheet({
    open,
    onOpenChange,
    preview,
    installmentPlans,
    categories,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    preview: DashboardPaymentPreviewModel | null
    installmentPlans?: WorkspaceInstallmentPlan[]
    categories?: Category[]
}) {
    const isMobile = useIsMobile()

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

    const { slices, slicesLoading } = useInstallmentSlices(planId, open)

    const previewDateYmd = preview?.dateYmd ?? null
    const installment = useMemo(() => {
        if (!plan || !isInstallmentKind) return null
        const summary = summarizeInstallmentPlan(plan, slices, slicesLoading)
        // A parcela é a do dia clicado no calendário, e não sempre a próxima a gerar:
        // abrir a parcela de março mostrava "4/10" quando era a "2/10".
        const currentSlot =
            summary.scheduleRows && previewDateYmd
                ? resolveCurrentSlotFromDate(summary.scheduleRows, previewDateYmd, plan)
                : null
        const k = currentSlot ?? plan.generated_count + 1
        return {
            summary,
            currentSlot,
            kn: k >= 1 && k <= plan.total_installments ? { k, n: plan.total_installments } : null,
        }
    }, [plan, isInstallmentKind, slices, slicesLoading, previewDateYmd])

    const meta = preview ? paymentEventMetaBadge(preview.kind, preview.installmentPlanId) : null
    const isInstallmentView = Boolean(preview && installment && plan)

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side={isMobile ? "bottom" : "right"}
                fillMobileViewport={isMobile}
                className={cn(
                    "flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:sm:max-w-md",
                    isMobile && "rounded-t-2xl pt-0 sm:max-w-full"
                )}
            >
                {preview ? (
                    <div className="flex min-h-0 flex-1 flex-col gap-0">
                        <DialogDescription className="sr-only">
                            {isInstallmentView
                                ? "Detalhes da compra parcelada prevista."
                                : "Detalhes do evento previsto no calendário de pagamentos."}
                        </DialogDescription>

                        <div className="mb-3 shrink-0 border-b border-border">
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-4 pb-4 pt-4 sm:px-5 md:pt-5",
                                    isMobile && "pt-2"
                                )}
                            >
                                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                    {isInstallmentView ? (
                                        <DialogTitle className="font-heading text-base font-medium leading-tight">
                                            Detalhe da transação
                                        </DialogTitle>
                                    ) : (
                                        <>
                                            <DialogTitle className="font-heading text-base font-medium leading-5">
                                                {preview.title}
                                            </DialogTitle>
                                            {meta ? (
                                                <span className={cn(transactionRowChipShell, meta.chipClass)}>
                                                    {meta.label}
                                                </span>
                                            ) : null}
                                        </>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="tertiary"
                                    size="icon-sm"
                                    className="-mr-1 shrink-0"
                                    onClick={() => onOpenChange(false)}
                                    aria-label="Fechar"
                                >
                                    <XMarkIcon className="h-5 w-5" aria-hidden />
                                </Button>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-5">
                            <section className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4 dark:bg-muted/10">
                                <div className="flex items-start justify-between gap-3">
                                    <SectionLabel className="shrink-0">Resumo</SectionLabel>
                                    <p className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                                        {formatDatePtBr(preview.dateYmd)}
                                    </p>
                                </div>
                                {preview.amount != null ? (
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            {isInstallmentView ? "Valor desta parcela" : "Valor previsto"}
                                        </p>
                                        <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                                            {isInstallmentView ? "−" : ""}
                                            {currencyBRL(preview.amount)}
                                        </p>
                                        {isInstallmentView ? (
                                            <p className="mt-1 text-2xs leading-snug text-muted-foreground">
                                                Em compras parceladas, o valor acima é desta parcela no
                                                extrato; o total da compra aparece em Compra parcelada.
                                            </p>
                                        ) : null}
                                    </div>
                                ) : null}
                            </section>

                            <section className="space-y-3">
                                <SectionLabel>Detalhes</SectionLabel>
                                <div className="space-y-3 text-sm">
                                    {isInstallmentView ? (
                                        <>
                                            <FieldCard label="Descrição">
                                                <p className="mt-1 line-clamp-4 break-words text-foreground">
                                                    {plan!.description?.trim() || preview.title || "—"}
                                                </p>
                                            </FieldCard>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {category ? (
                                                    <FieldCard label="Categoria">
                                                        <p className="mt-1 inline-flex items-center gap-2">
                                                            <span
                                                                className="size-2 shrink-0 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        category.color || "var(--muted-foreground)",
                                                                }}
                                                                aria-hidden
                                                            />
                                                            {category.name}
                                                        </p>
                                                    </FieldCard>
                                                ) : null}
                                                <FieldCard label="Data prevista">
                                                    <p className="mt-1 tabular-nums">
                                                        {formatTransactionDmyPtBr(preview.dateYmd)}
                                                    </p>
                                                </FieldCard>
                                            </div>
                                        </>
                                    ) : (
                                        <FieldCard label="Descrição">
                                            <p className="mt-1 leading-relaxed text-foreground">
                                                {contextualDescription(preview.kind, preview.installmentPlanId)}
                                            </p>
                                        </FieldCard>
                                    )}
                                </div>
                            </section>

                            {isInstallmentView && installment ? (
                                <InstallmentPurchaseSection
                                    summary={installment.summary}
                                    kn={installment.kn}
                                    amount={preview.amount}
                                    isCurrentRow={(row) => row.slot === installment.currentSlot}
                                    currentRowTitle="Esta parcela"
                                />
                            ) : null}

                            {preview.sourceHref ? (
                                <Button variant="outline" size="lg" className="w-full" asChild>
                                    <Link href={preview.sourceHref}>Ver origem</Link>
                                </Button>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </SheetContent>
        </Sheet>
    )
}
