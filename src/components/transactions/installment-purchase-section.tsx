"use client"

import { useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { toastError } from "@/lib/toast"
import { currencyBRL } from "@/lib/formatters"
import { formatTransactionDayPtBr } from "@/lib/transaction-date"
import { totalPurchaseFromPlan } from "@/lib/transaction-installment"
import {
    buildInstallmentScheduleRows,
    type InstallmentPlanSliceInput,
    type InstallmentScheduleRow,
} from "@/lib/installment-schedule-rows"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    tagChipSky,
    tagChipSuccess,
    tagChipWarning,
    transactionRowChipShell,
} from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * O bloco "Compra parcelada" das folhas de detalhe. A folha da transação e a
 * prévia do calendário escreviam o mesmo bloco, a mesma consulta de parcelas e a
 * mesma conta, cada uma na sua cópia; o que muda entre elas vem por props.
 */

export function SectionLabel({
    children,
    className,
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <p
            className={cn(
                "text-2xs font-semibold uppercase tracking-wide text-muted-foreground",
                className
            )}
        >
            {children}
        </p>
    )
}

/** As parcelas já lançadas de um plano, carregadas enquanto a folha está aberta. */
export function useInstallmentSlices(planId: string | null | undefined, open: boolean) {
    const [slices, setSlices] = useState<InstallmentPlanSliceInput[] | null>(null)
    const [slicesLoading, setSlicesLoading] = useState(false)

    /* eslint-disable react-hooks/set-state-in-effect -- carrega/limpa as parcelas quando a folha abre */
    useEffect(() => {
        if (!open || !planId) {
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
                .order("installment_sequence", { ascending: true, nullsFirst: false })
                .order("date", { ascending: true })
                .order("created_at", { ascending: true })
            if (cancelled) return
            if (error) {
                toastError(
                    formatSupabasePostgrestError(error) ?? "Não foi possível carregar as parcelas."
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
    }, [open, planId])
    /* eslint-enable react-hooks/set-state-in-effect */

    return { slices, slicesLoading }
}

export function summarizeInstallmentPlan(
    plan: Parameters<typeof buildInstallmentScheduleRows>[0],
    slices: InstallmentPlanSliceInput[] | null,
    slicesLoading: boolean
) {
    const totalPurchase = totalPurchaseFromPlan(plan)
    const posted = slices?.reduce((sum, r) => sum + r.amount, 0) ?? null
    return {
        totalPurchase,
        posted,
        remaining: posted != null ? Math.max(0, totalPurchase - posted) : null,
        futureSlots: Math.max(0, plan.total_installments - (slices?.length ?? 0)),
        slicesLoading,
        scheduleRows:
            slices != null && !slicesLoading ? buildInstallmentScheduleRows(plan, slices) : null,
    }
}

export type InstallmentSummary = ReturnType<typeof summarizeInstallmentPlan>

/** Fundo suave + texto forte, sem borda — cores distintas por status da parcela. */
function statusChipClassName(row: InstallmentScheduleRow): string {
    if (row.status === "pending") return tagChipWarning
    if (row.invoicePaid) return tagChipSuccess
    return tagChipSky
}

function moneyOrPlaceholder(value: number | null, loading: boolean) {
    if (loading) return "…"
    return value != null ? currencyBRL(value) : "—"
}

export function InstallmentPurchaseSection({
    summary,
    kn,
    amount,
    isCurrentRow,
    currentRowTitle,
    warning,
}: {
    summary: InstallmentSummary
    kn: { k: number; n: number } | null
    /** O valor desta parcela; sem ele a linha "Esta parcela" não aparece. */
    amount: number | null
    isCurrentRow: (row: InstallmentScheduleRow) => boolean
    currentRowTitle: string
    warning?: string
}) {
    return (
        <section className="space-y-3">
            <SectionLabel>Compra parcelada</SectionLabel>
            <div className="overflow-hidden rounded-xl border border-border/80 bg-gradient-to-b from-muted/30 to-muted/10 p-3.5 dark:from-muted/15 dark:to-muted/5 sm:p-4">
                <div className="min-w-0">
                    {kn ? (
                        <p className="text-sm font-semibold text-foreground">
                            Parcela {kn.k} de {kn.n}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Parcela vinculada a um plano de pagamento.
                        </p>
                    )}
                    {amount != null ? (
                        <p className="mt-0.5 text-2xs text-muted-foreground">
                            Esta parcela:{" "}
                            <span className="font-medium text-foreground">
                                {currencyBRL(amount)}
                            </span>
                        </p>
                    ) : null}
                </div>

                <dl className="mt-3 grid gap-2 rounded-lg border border-border/50 bg-background/60 px-3 py-2.5 text-xs sm:text-sm">
                    <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Total da compra (referência)</dt>
                        <dd className="shrink-0 tabular-nums font-medium">
                            {currencyBRL(summary.totalPurchase)}
                        </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Já lançado no extrato</dt>
                        <dd className="shrink-0 tabular-nums font-medium">
                            {moneyOrPlaceholder(summary.posted, summary.slicesLoading)}
                        </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Falta (sobre o total)</dt>
                        <dd className="shrink-0 tabular-nums font-medium">
                            {moneyOrPlaceholder(summary.remaining, summary.slicesLoading)}
                        </dd>
                    </div>
                </dl>

                {warning ? (
                    <p className="mt-3 text-2xs leading-snug text-muted-foreground">{warning}</p>
                ) : null}

                <div className="mt-3 overflow-x-auto rounded-lg border border-border/50 bg-background/40">
                    <Table className="min-w-[280px] text-xs">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="h-8 w-10 px-2 text-2xs font-semibold uppercase tracking-wide">
                                    #
                                </TableHead>
                                <TableHead className="h-8 px-2 text-2xs font-semibold uppercase tracking-wide">
                                    Data
                                </TableHead>
                                <TableHead className="h-8 px-2 text-right text-2xs font-semibold uppercase tracking-wide">
                                    Valor da parcela
                                </TableHead>
                                <TableHead className="h-8 px-2 text-2xs font-semibold uppercase tracking-wide">
                                    Status
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {summary.slicesLoading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="h-10 px-2 text-center text-muted-foreground"
                                    >
                                        …
                                    </TableCell>
                                </TableRow>
                            ) : summary.scheduleRows && summary.scheduleRows.length > 0 ? (
                                summary.scheduleRows.map((row) => {
                                    const isCurrent = isCurrentRow(row)
                                    return (
                                        <TableRow
                                            key={row.slot}
                                            className={cn(
                                                "h-9 border-border/40",
                                                isCurrent && "bg-muted/50 dark:bg-muted/30"
                                            )}
                                        >
                                            <TableCell className="px-2 py-1.5 font-medium tabular-nums">
                                                {row.slot}
                                                {isCurrent ? (
                                                    <span
                                                        className="ml-1 text-2xs font-normal text-muted-foreground"
                                                        title={currentRowTitle}
                                                    >
                                                        ●
                                                    </span>
                                                ) : null}
                                            </TableCell>
                                            <TableCell className="max-w-[7rem] truncate px-2 py-1.5 tabular-nums text-muted-foreground">
                                                {row.date ? formatTransactionDayPtBr(row.date) : "—"}
                                            </TableCell>
                                            <TableCell className="px-2 py-1.5 text-right tabular-nums font-medium">
                                                {currencyBRL(row.parcelAmount)}
                                            </TableCell>
                                            <TableCell className="px-2 py-1.5">
                                                <span
                                                    className={cn(
                                                        transactionRowChipShell,
                                                        statusChipClassName(row)
                                                    )}
                                                >
                                                    {row.status === "pending"
                                                        ? "Não lançada"
                                                        : row.invoicePaid
                                                          ? "Paga"
                                                          : "Lançada"}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
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

                {!summary.slicesLoading && summary.futureSlots > 0 ? (
                    <p className="mt-2.5 text-2xs leading-snug text-muted-foreground">
                        Faltam{" "}
                        <span className="font-medium text-foreground">{summary.futureSlots}</span>{" "}
                        {summary.futureSlots === 1 ? "parcela" : "parcelas"} ainda não lançadas
                        (aparecem nas datas de cobrança).
                    </p>
                ) : null}
            </div>
        </section>
    )
}
