"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Badge } from "@/components/ui/badge"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
    transactionSegmentContainerClassName,
    transactionSegmentTabClassName,
} from "@/components/transactions/transaction-type-segment"
import { paymentMethodLabel } from "@/lib/payment-methods"
import type { BillInstance } from "@/lib/supabase"
import { formatTransactionDmyPtBr } from "@/lib/transaction-date"
import { cn } from "@/lib/utils"
import {
    tagChipDanger,
    tagChipNeutral,
    tagChipSuccess,
    tagChipWarning,
} from "@/lib/tag-chip-classes"

export type BillHistoryTab = "pending" | "paid" | "skipped" | "all"

const TABS: { value: BillHistoryTab; label: string }[] = [
    { value: "pending", label: "Pendentes" },
    { value: "paid", label: "Pagas" },
    { value: "skipped", label: "Ignoradas" },
    { value: "all", label: "Tudo" },
]

const PAGE = 30

function cmpYmd(a: string, b: string): number {
    return a.localeCompare(b)
}

function daysDeltaLabel(dueYmd: string, todayYmd: string): string {
    const partsDue = dueYmd.split("-").map((x) => Number.parseInt(x, 10))
    const partsTo = todayYmd.split("-").map((x) => Number.parseInt(x, 10))
    const dDue = new Date(partsDue[0] ?? 1970, (partsDue[1] ?? 1) - 1, partsDue[2] ?? 1)
    const dTo = new Date(partsTo[0] ?? 1970, (partsTo[1] ?? 1) - 1, partsTo[2] ?? 1)
    const ms = dDue.getTime() - dTo.getTime()
    const days = Math.round(ms / 86400000)
    if (days === 0) return "hoje"
    if (days > 0) return `em ${days}d`
    return `há ${Math.abs(days)}d`
}

function instanceDotClass(inst: BillInstance, todayYmd: string): string {
    if (inst.status === "paid") return "bg-success"
    if (inst.status === "skipped") return "bg-muted-foreground/50"
    const due = inst.due_date.slice(0, 10)
    if (cmpYmd(due, todayYmd) < 0) return "bg-destructive"
    if (due === todayYmd) return "bg-warning"
    return "bg-muted-foreground"
}

function statusBadge(inst: BillInstance, todayYmd: string) {
    if (inst.status === "paid")
        return { label: "Paga", className: tagChipSuccess }
    if (inst.status === "skipped")
        return { label: "Ignorada", className: tagChipNeutral }
    const due = inst.due_date.slice(0, 10)
    if (cmpYmd(due, todayYmd) < 0)
        return { label: "Atrasada", className: tagChipDanger }
    if (due === todayYmd) return { label: "Hoje", className: tagChipWarning }
    return { label: "Pendente", className: tagChipNeutral }
}

function filterInstances(
    instances: BillInstance[],
    tab: BillHistoryTab
): BillInstance[] {
    if (tab === "all") {
        return [...instances].sort((a, b) =>
            b.due_date.slice(0, 10).localeCompare(a.due_date.slice(0, 10))
        )
    }
    if (tab === "pending") {
        return [...instances]
            .filter((i) => i.status === "pending")
            .sort((a, b) =>
                a.due_date.slice(0, 10).localeCompare(b.due_date.slice(0, 10))
            )
    }
    if (tab === "paid") {
        return [...instances]
            .filter((i) => i.status === "paid")
            .sort((a, b) => {
                const pa = a.paid_at ?? a.due_date
                const pb = b.paid_at ?? b.due_date
                return pb.localeCompare(pa)
            })
    }
    return [...instances]
        .filter((i) => i.status === "skipped")
        .sort((a, b) =>
            b.due_date.slice(0, 10).localeCompare(a.due_date.slice(0, 10))
        )
}

export type BillDetailHistoryListProps = {
    instances: BillInstance[]
    todayYmd: string
    defaultTab?: BillHistoryTab
    onPayInstance: (inst: BillInstance) => void
    onSkipInstance: (inst: BillInstance) => void
}

export function BillDetailHistoryList({
    instances,
    todayYmd,
    defaultTab,
    onPayInstance,
    onSkipInstance,
}: BillDetailHistoryListProps) {
    const hasPending = useMemo(
        () => instances.some((i) => i.status === "pending"),
        [instances],
    )
    const initialTab: BillHistoryTab =
        defaultTab ??
        (hasPending ? "pending" : instances.some((i) => i.status === "paid") ? "paid" : "all")
    const [tab, setTab] = useState<BillHistoryTab>(initialTab)
    const [shown, setShown] = useState(PAGE)

    const filtered = useMemo(() => filterInstances(instances, tab), [instances, tab])
    const visible = filtered.slice(0, shown)

    return (
        <div className="space-y-3">
            <div
                className={cn(transactionSegmentContainerClassName, "w-full")}
                role="tablist"
                aria-label="Filtrar histórico"
            >
                <ButtonGroup className="h-full min-h-0 w-full flex-wrap gap-0.5">
                    {TABS.map((t) => {
                        const selected = tab === t.value
                        return (
                            <Button
                                key={t.value}
                                type="button"
                                role="tab"
                                aria-selected={selected}
                                size="sm"
                                variant="ghost"
                                className={transactionSegmentTabClassName(selected)}
                                onClick={() => {
                                    setTab(t.value)
                                    setShown(PAGE)
                                }}
                            >
                                {t.label}
                            </Button>
                        )
                    })}
                </ButtonGroup>
            </div>

            <div className="space-y-1">
                {visible.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                        Nenhuma parcela nesta visão.
                    </p>
                ) : (
                    visible.map((inst) => {
                        const due = inst.due_date.slice(0, 10)
                        const badge = statusBadge(inst, todayYmd)
                        const pm =
                            inst.payment_method != null
                                ? paymentMethodLabel(inst.payment_method)
                                : null
                        return (
                            <div
                                key={inst.id}
                                className="flex flex-col gap-2 rounded-lg px-3 py-2.5 hover:bg-muted/40"
                            >
                                <div className="flex items-start gap-3">
                                    <span
                                        className={cn(
                                            "mt-1.5 size-2 shrink-0 rounded-full",
                                            instanceDotClass(inst, todayYmd)
                                        )}
                                        aria-hidden
                                    />
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                                            <p className="text-sm font-medium leading-snug">
                                                {formatTransactionDmyPtBr(
                                                    `${due}T12:00:00`
                                                )}
                                                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                                    ({daysDeltaLabel(due, todayYmd)})
                                                </span>
                                            </p>
                                            <div className="shrink-0 text-right tabular-nums">
                                                {inst.amount != null ? (
                                                    <MoneyDisplay
                                                        value={Number(inst.amount)}
                                                        tone="muted"
                                                        size="sm"
                                                        className={
                                                            inst.status === "paid"
                                                                ? "font-semibold text-foreground"
                                                                : undefined
                                                        }
                                                    />
                                                ) : inst.paid_amount != null ? (
                                                    <MoneyDisplay
                                                        value={Number(
                                                            inst.paid_amount
                                                        )}
                                                        tone="muted"
                                                        size="sm"
                                                        className="font-semibold text-foreground"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "border-0 text-[11px]",
                                                    badge.className
                                                )}
                                            >
                                                {badge.label}
                                            </Badge>
                                            {inst.status === "paid" &&
                                            inst.paid_at ? (
                                                <span className="text-[11px] text-muted-foreground">
                                                    Pago{" "}
                                                    {formatTransactionDmyPtBr(
                                                        inst.paid_at
                                                    )}
                                                </span>
                                            ) : null}
                                            {pm ? (
                                                <span className="text-[11px] text-muted-foreground">
                                                    {pm}
                                                </span>
                                            ) : null}
                                        </div>
                                        {inst.status === "pending" ? (
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() =>
                                                        onPayInstance(inst)
                                                    }
                                                >
                                                    Pagar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() =>
                                                        onSkipInstance(inst)
                                                    }
                                                >
                                                    Ignorar
                                                </Button>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {filtered.length > shown ? (
                <div className="pt-1 text-center">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => setShown((s) => s + PAGE)}
                    >
                        Mostrar mais
                    </Button>
                </div>
            ) : null}
        </div>
    )
}
