"use client"

import { useMemo } from "react"
import { EllipsisHorizontalIcon, PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline"
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
import { Badge } from "@/components/ui/badge"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Skeleton } from "@/components/ui/skeleton"
import {
    StatCard,
    StatCardLabel,
    StatCardValue,
} from "@/components/ui/stat-card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { billFrequencyLabel } from "@/components/bills/bill-form-shared"
import {
    CategoryIconPreview,
    normalizeCategoryIcon,
} from "@/components/categories/category-appearance-fields"
import { BillHistoryAnalytics } from "@/components/bills/bill-history-analytics"
import { BillDetailHistoryList } from "@/components/bills/bill-detail-history-list"
import { useBillDetailBundleQuery } from "@/lib/queries/use-bill-detail-bundle"
import type { BillRowWithCategory } from "@/lib/queries/fetch-bills-page-bundle"
import type { BillInstance } from "@/lib/supabase"
import type { PayBillInput } from "@/lib/bills/pay-bill-flow"
import { formatTransactionDmyPtBr } from "@/lib/transaction-date"
import { localYmdFromDate } from "@/lib/transaction-date"
import { cn } from "@/lib/utils"
import {
    tagChipDanger,
    tagChipNeutral,
    tagChipWarning,
} from "@/lib/tag-chip-classes"

const EXPENSE_CATEGORY_FALLBACK_COLOR = "#EF4444"

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

function nextPendingHero(instances: BillInstance[]): BillInstance | null {
    const pend = instances
        .filter((i) => i.status === "pending")
        .sort((a, b) =>
            a.due_date.slice(0, 10).localeCompare(b.due_date.slice(0, 10))
        )
    return pend[0] ?? null
}

function nextParcelPill(dueYmd: string, todayYmd: string) {
    if (cmpYmd(dueYmd, todayYmd) < 0)
        return { label: "Atrasada", className: tagChipDanger }
    if (dueYmd === todayYmd) return { label: "Hoje", className: tagChipWarning }
    return { label: "Pendente", className: tagChipNeutral }
}

export type BillDetailSheetProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    billId: string | null
    workspaceId: string | null
    fallbackBill: BillRowWithCategory | null
    todayYmd: string
    onPay: (input: PayBillInput) => void
    onEditBill: () => void
    onAskDelete: () => void
    onSkipInstance: (inst: BillInstance, bill: BillRowWithCategory) => void
}

export function BillDetailSheet({
    open,
    onOpenChange,
    billId,
    workspaceId,
    fallbackBill,
    todayYmd,
    onPay,
    onEditBill,
    onAskDelete,
    onSkipInstance,
}: BillDetailSheetProps) {
    const isMobile = useIsMobile()
    const detailQ = useBillDetailBundleQuery(workspaceId, billId)

    const bill = detailQ.data?.bill ?? fallbackBill
    const instances = useMemo(
        () => detailQ.data?.instances ?? [],
        [detailQ.data?.instances]
    )

    const nextInst = useMemo(() => nextPendingHero(instances), [instances])

    const limit90 = useMemo(() => addDaysToYmd(todayYmd, -90), [todayYmd])
    const limit60 = useMemo(() => addDaysToYmd(todayYmd, 60), [todayYmd])

    const stats = useMemo(() => {
        let paidSum = 0
        let paidN = 0
        let lateN = 0
        let next60 = 0
        for (const i of instances) {
            const due = i.due_date.slice(0, 10)
            if (
                i.status === "paid" &&
                i.paid_at &&
                i.paid_amount != null
            ) {
                const paidDay = i.paid_at.slice(0, 10)
                if (cmpYmd(paidDay, limit90) >= 0) {
                    paidSum += Number(i.paid_amount)
                    paidN += 1
                    if (cmpYmd(paidDay, due) > 0) lateN += 1
                }
            }
            if (i.status === "pending") {
                if (cmpYmd(due, todayYmd) >= 0 && cmpYmd(due, limit60) <= 0) {
                    next60 += 1
                }
            }
        }
        const avgPaid = paidN > 0 ? paidSum / paidN : null
        return { paidSum, paidN, avgPaid, lateN, next60 }
    }, [instances, limit90, limit60, todayYmd])

    if (!billId) return null

    const loading = detailQ.isPending && !detailQ.data
    const headerColor =
        bill?.category?.color ?? EXPENSE_CATEGORY_FALLBACK_COLOR
    const iconId = normalizeCategoryIcon(bill?.icon ?? "receipt")

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
                {isMobile ? <SheetDragHandle /> : null}
                <SheetDescription className="sr-only">
                    {bill ? `Conta ${bill.name}. Detalhes e histórico de parcelas.` : "Carregando conta."}
                </SheetDescription>

                <div
                    className={cn(
                        "shrink-0 border-b border-border/60 bg-muted/25",
                        mobileSheetChromeBelowHeaderClassName,
                    )}
                >
                    <div
                        className={cn(
                            "flex items-start gap-3 px-4 pb-3 pt-3 sm:px-5 md:pt-4",
                            isMobile && "pt-2"
                        )}
                    >
                        {loading && !bill ? (
                            <Skeleton className="size-11 shrink-0 rounded-lg" />
                        ) : bill ? (
                            <div
                                className={cn(
                                    "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg",
                                    "border border-white/20 shadow-sm ring-1 ring-black/5",
                                    "backdrop-blur-md",
                                    "after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/30 after:to-white/5 after:opacity-80",
                                )}
                                style={{ backgroundColor: headerColor }}
                                aria-hidden
                            >
                                <CategoryIconPreview
                                    name={iconId}
                                    className="relative z-10 h-5 w-5 text-white"
                                />
                            </div>
                        ) : (
                            <div className="size-11 shrink-0 rounded-lg bg-muted" aria-hidden />
                        )}

                        <div className="min-w-0 flex-1">
                            {loading && !bill ? (
                                <Skeleton className="h-5 w-40" />
                            ) : bill ? (
                                <>
                                    <SheetTitle className="font-heading text-base font-medium leading-tight">
                                        {bill.name}
                                    </SheetTitle>
                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                        {bill.category ? (
                                            <span className="inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                                <span className="inline-flex min-w-0 items-center gap-1.5">
                                                    <span
                                                        className="size-2 shrink-0 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                bill.category.color ??
                                                                "var(--muted-foreground)",
                                                        }}
                                                        aria-hidden
                                                    />
                                                    <span className="truncate">
                                                        {bill.category.name}
                                                    </span>
                                                </span>
                                                <span className="text-muted-foreground/70">
                                                    ·
                                                </span>
                                                <span>
                                                    {billFrequencyLabel(bill.frequency)} · Dia{" "}
                                                    {bill.due_day_of_month}
                                                </span>
                                            </span>
                                        ) : (
                                            <>
                                                {billFrequencyLabel(bill.frequency)} · Dia{" "}
                                                {bill.due_day_of_month}
                                            </>
                                        )}
                                    </p>
                                </>
                            ) : (
                                <SheetTitle className="text-base">
                                    Conta não encontrada
                                </SheetTitle>
                            )}
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                            {bill && !loading ? (
                                <Badge
                                    variant={bill.is_active ? "success" : "outline"}
                                    className="shrink-0"
                                >
                                    {bill.is_active ? "Ativa" : "Inativa"}
                                </Badge>
                            ) : null}
                            <div className="flex items-center gap-0.5">
                                {bill ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                className="shrink-0"
                                                aria-label="Mais opções"
                                            >
                                                <EllipsisHorizontalIcon
                                                    className="h-5 w-5"
                                                    aria-hidden
                                                />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44">
                                            <DropdownMenuItem onClick={onEditBill}>
                                                <PencilIcon className="h-4 w-4" aria-hidden />
                                                Editar modelo
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={onAskDelete}
                                            >
                                                <TrashIcon className="h-4 w-4" aria-hidden />
                                                Excluir conta
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : null}
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
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                    {loading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-24 w-full rounded-xl" />
                            <Skeleton className="h-16 w-full rounded-xl" />
                            <Skeleton className="h-40 w-full rounded-xl" />
                        </div>
                    ) : !bill ? (
                        <p className="text-sm text-muted-foreground">
                            Não foi possível carregar esta conta.
                        </p>
                    ) : (
                        <div className="space-y-6">
                            {nextInst ? (
                                <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        Próxima parcela
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-semibold tabular-nums">
                                            {formatTransactionDmyPtBr(
                                                `${nextInst.due_date.slice(0, 10)}T12:00:00`
                                            )}
                                        </p>
                                        {(() => {
                                            const pill = nextParcelPill(
                                                nextInst.due_date.slice(0, 10),
                                                todayYmd
                                            )
                                            return (
                                                <Badge
                                                    variant="secondary"
                                                    className={cn(
                                                        "border-0 text-xs",
                                                        pill.className
                                                    )}
                                                >
                                                    {pill.label}
                                                </Badge>
                                            )
                                        })()}
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground tabular-nums">
                                        {nextInst.amount != null ? (
                                            <>
                                                ~
                                                <MoneyDisplay
                                                    value={Number(nextInst.amount)}
                                                    tone="muted"
                                                    size="sm"
                                                />
                                            </>
                                        ) : bill.amount_estimated != null ? (
                                            <>
                                                ~
                                                <MoneyDisplay
                                                    value={Number(
                                                        bill.amount_estimated
                                                    )}
                                                    tone="muted"
                                                    size="sm"
                                                />
                                            </>
                                        ) : (
                                            "Valor no pagamento"
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="mt-3 w-full md:w-auto"
                                        onClick={() =>
                                            onPay({
                                                kind: "regular",
                                                instance: nextInst,
                                                bill,
                                            })
                                        }
                                    >
                                        Pagar
                                    </Button>
                                </div>
                            ) : null}

                            <div className="grid gap-2 sm:grid-cols-2">
                                <StatCard tone="neutral">
                                    <StatCardLabel>Total pago 90d</StatCardLabel>
                                    <StatCardValue>
                                        <MoneyDisplay value={stats.paidSum} />
                                    </StatCardValue>
                                </StatCard>
                                <StatCard tone="info">
                                    <StatCardLabel>Média paga</StatCardLabel>
                                    <StatCardValue>
                                        {stats.avgPaid != null ? (
                                            <MoneyDisplay value={stats.avgPaid} />
                                        ) : (
                                            "—"
                                        )}
                                    </StatCardValue>
                                </StatCard>
                                <StatCard tone="warning">
                                    <StatCardLabel>Atrasos 90d</StatCardLabel>
                                    <StatCardValue>
                                        {stats.lateN}
                                    </StatCardValue>
                                </StatCard>
                                <StatCard tone="expense">
                                    <StatCardLabel>Pendentes 60d</StatCardLabel>
                                    <StatCardValue>{stats.next60}</StatCardValue>
                                </StatCard>
                            </div>

                            {instances.length > 0 ? (
                                <BillHistoryAnalytics instances={instances} />
                            ) : null}

                            <div>
                                <h2 className="mb-2 text-base font-semibold tracking-tight">
                                    Histórico de parcelas
                                </h2>
                                <BillDetailHistoryList
                                    key={billId}
                                    instances={instances}
                                    todayYmd={todayYmd}
                                    onPayInstance={(inst) =>
                                        onPay({
                                            kind: "regular",
                                            instance: inst,
                                            bill,
                                        })
                                    }
                                    onSkipInstance={(inst) =>
                                        onSkipInstance(inst, bill)
                                    }
                                />
                            </div>

                            {bill.description ? (
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {bill.description}
                                </p>
                            ) : null}
                        </div>
                    )}
                </div>

                {bill && !loading ? (
                    <div className="shrink-0 border-t border-border/60 bg-background px-4 py-3 sm:px-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto"
                                onClick={onEditBill}
                            >
                                Editar modelo
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full text-destructive hover:text-destructive sm:w-auto"
                                onClick={onAskDelete}
                            >
                                Excluir conta
                            </Button>
                        </div>
                    </div>
                ) : null}
            </SheetContent>
        </Sheet>
    )
}
