"use client"

import { Card, CardMessage } from "@/components/ui/card"
import { compareYmd } from "@/lib/transaction-date"
import { billInstancePill, billDaysDeltaLabel } from "@/components/bills/bill-status"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { PaginationMore } from "@/components/ui/pagination"
import {
    Badge,
} from "@/components/ui/badge"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Timeline,
    TimelineActions,
    TimelineDescription,
    TimelineHeader,
    TimelineItem,
    TimelineTitle,
    type TimelineState,
} from "@/components/ui/timeline"
import { paymentMethodLabel } from "@/lib/payment-methods"
import type { BillInstance } from "@/lib/supabase"
import {
    formatTransactionDmyPtBr,
} from "@/lib/transaction-date"

export type BillHistoryTab = "pending" | "paid" | "skipped" | "all"

const TABS: { value: BillHistoryTab; label: string }[] = [
    { value: "pending", label: "Pendentes" },
    { value: "paid", label: "Pagas" },
    { value: "skipped", label: "Ignoradas" },
    { value: "all", label: "Tudo" },
]

const PAGE = 30

/**
 * O estado e o tom de cada cobrança na trilha. Paga deu certo (`success`, o
 * verde de estado e não o de dinheiro); ignorada só aconteceu. Em aberto, a
 * data decide o tom (atrasada, hoje); a mais antiga em aberto é a atual, e as
 * futuras são o previsto.
 */
function instanceTimeline(
    inst: BillInstance,
    todayYmd: string,
    currentId: string | null
): { state?: TimelineState; tone: "default" | "success" | "warning" | "destructive" } {
    if (inst.status === "paid") return { state: "done", tone: "success" }
    if (inst.status === "skipped") return { state: "skipped", tone: "default" }
    const due = inst.due_date.slice(0, 10)
    const cmp = compareYmd(due, todayYmd)
    const tone = cmp < 0 ? "destructive" : cmp === 0 ? "warning" : "default"
    if (inst.id === currentId) return { state: "current", tone }
    return { state: cmp > 0 ? "upcoming" : undefined, tone }
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
    // A contagem de cada aba sai das mesmas ocorrências que a lista filtra —
    // nenhuma consulta a mais.
    const counts = useMemo(() => {
        const c: Record<BillHistoryTab, number> = {
            pending: 0,
            paid: 0,
            skipped: 0,
            all: instances.length,
        }
        for (const i of instances) c[i.status]++
        return c
    }, [instances])
    const visible = filtered.slice(0, shown)
    // A atual é a cobrança em aberto mais antiga, em qualquer aba — a mesma
    // que a tela pediria para pagar primeiro.
    const currentId = useMemo(() => {
        let first: BillInstance | null = null
        for (const i of instances) {
            if (i.status !== "pending") continue
            if (!first || compareYmd(i.due_date.slice(0, 10), first.due_date.slice(0, 10)) < 0) {
                first = i
            }
        }
        return first?.id ?? null
    }, [instances])

    return (
        <div className="space-y-3">
            <Tabs
                value={tab}
                onValueChange={(next) => {
                    setTab(next as BillHistoryTab)
                    setShown(PAGE)
                }}
                className="w-full md:w-fit"
            >
                {/* `md:w-fit`, e não `md:w-auto`: aqui o pai é bloco, e uma moldura
                    `flex` com largura automática ocupa a folha inteira. O trilho
                    antigo era `inline-flex` e tinha a largura dos rótulos. */}
                <TabsList aria-label="Filtrar histórico" className="w-full md:w-fit">
                    {TABS.map((t) => (
                        <TabsTrigger key={t.value} value={t.value} count={counts[t.value]}>
                            {t.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {visible.length === 0 ? (
                // O vazio da lista é o lugar de um cartão que não existe:
                // o tracejado do sistema (rodada 204).
                <Card variant="dashed" padding="none">
                    <CardMessage className="text-center">
                        Nenhuma parcela nesta visão.
                    </CardMessage>
                </Card>
            ) : (
                <Timeline marker="dot" aria-label="Histórico de cobranças">
                    {visible.map((inst) => {
                        const due = inst.due_date.slice(0, 10)
                        const badge = billInstancePill(inst, todayYmd)
                        const { state, tone } = instanceTimeline(inst, todayYmd, currentId)
                        const pm =
                            inst.payment_method != null
                                ? paymentMethodLabel(inst.payment_method)
                                : null
                        const amount =
                            inst.amount != null ? (
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
                                    value={Number(inst.paid_amount)}
                                    tone="muted"
                                    size="sm"
                                    className="font-semibold text-foreground"
                                />
                            ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                            )
                        return (
                            <TimelineItem key={inst.id} tone={tone} state={state}>
                                <TimelineHeader end={amount}>
                                    <TimelineTitle>
                                        <time dateTime={due}>
                                            {formatTransactionDmyPtBr(`${due}T12:00:00`)}
                                        </time>
                                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                            ({billDaysDeltaLabel(due, todayYmd, { compact: true })})
                                        </span>
                                    </TimelineTitle>
                                </TimelineHeader>
                                <TimelineDescription className="flex flex-wrap items-center gap-x-2">
                                    <Badge tone="neutral" size="xs" className={badge.className}>
                                        {badge.label}
                                    </Badge>
                                    {inst.status === "paid" && inst.paid_at ? (
                                        <span>Pago {formatTransactionDmyPtBr(inst.paid_at)}</span>
                                    ) : null}
                                    {pm ? <span>{pm}</span> : null}
                                </TimelineDescription>
                                {inst.status === "pending" ? (
                                    <TimelineActions>
                                        <Button type="button" onClick={() => onPayInstance(inst)}>
                                            Pagar
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="tertiary"
                                            onClick={() => onSkipInstance(inst)}
                                        >
                                            Ignorar
                                        </Button>
                                    </TimelineActions>
                                ) : null}
                            </TimelineItem>
                        )
                    })}
                </Timeline>
            )}

            <PaginationMore
                shown={Math.min(shown, filtered.length)}
                total={filtered.length}
                step={PAGE}
                onMore={() => setShown((s) => s + PAGE)}
                className="pt-1"
            />
        </div>
    )
}
