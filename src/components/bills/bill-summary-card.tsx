"use client"

import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { MoneyDisplay } from "@/components/ui/money-display"
import { billFrequencyLabel } from "@/components/bills/bill-form-shared"
import {
    CategoryIconPreview,
    normalizeCategoryIcon,
} from "@/components/categories/category-appearance-fields"
import type { BillRowWithCategory } from "@/lib/queries/fetch-bills-page-bundle"
import { formatTransactionDmyPtBr } from "@/lib/transaction-date"
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

function nextParcelStatus(
    dueYmd: string,
    todayYmd: string
): { label: string; className: string } {
    if (cmpYmd(dueYmd, todayYmd) < 0) {
        return { label: "Atrasada", className: tagChipDanger }
    }
    if (dueYmd === todayYmd) {
        return { label: "Hoje", className: tagChipWarning }
    }
    return { label: "Pendente", className: tagChipNeutral }
}

export type BillSummaryCardProps = {
    bill: BillRowWithCategory
    todayYmd: string
    paid90Total: number
    paid90Count: number
    avgCharge: number | null
    latePay90Count: number
    nextDueYmd: string | null
    nextAmountHint: number | null
    onOpenDetail: () => void
}

export function BillSummaryCard({
    bill,
    todayYmd,
    paid90Total,
    paid90Count,
    avgCharge,
    latePay90Count,
    nextDueYmd,
    nextAmountHint,
    onOpenDetail,
}: BillSummaryCardProps) {
    const cat = bill.category
    const frequencyLine = `${billFrequencyLabel(bill.frequency)} · Dia ${bill.due_day_of_month}`
    const headerColor = cat?.color ?? EXPENSE_CATEGORY_FALLBACK_COLOR
    const iconId = normalizeCategoryIcon(bill.icon ?? "receipt")

    const nextPill =
        nextDueYmd != null ? nextParcelStatus(nextDueYmd, todayYmd) : null

    return (
        <Card
            size="sm"
            className={cn(
                "gap-0 overflow-hidden py-0 transition-shadow",
                !bill.is_active && "opacity-[0.82]"
            )}
        >
            <button
                type="button"
                className={cn(
                    "group w-full min-w-0 rounded-xl text-left outline-none",
                    "transition-shadow hover:shadow-md",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
                onClick={onOpenDetail}
                aria-label={`Abrir conta ${bill.name}`}
            >
                <CardHeader className="border-b border-border/60 bg-muted/25 !py-3">
                    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_auto] items-start gap-x-3 gap-y-1">
                        <div
                            className={cn(
                                "relative col-start-1 row-span-2 flex h-11 w-11 shrink-0 items-center justify-center self-start overflow-hidden rounded-lg",
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

                        <CardTitle
                            className={cn(
                                "col-start-2 row-start-1 min-w-0 self-center leading-snug",
                                "line-clamp-2 text-balance @min-[360px]/card-header:line-clamp-1 @min-[360px]/card-header:truncate",
                            )}
                        >
                            {bill.name}
                        </CardTitle>

                        <Badge
                            variant={bill.is_active ? "success" : "outline"}
                            className="col-start-3 row-span-2 shrink-0 self-start"
                        >
                            {bill.is_active ? "Ativa" : "Inativa"}
                        </Badge>

                        <CardDescription className="col-start-2 row-start-2 text-xs leading-relaxed text-muted-foreground">
                            {cat ? (
                                <span className="inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                    <span className="inline-flex min-w-0 items-center gap-1.5">
                                        <span
                                            className="size-2 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    cat.color ??
                                                    "var(--muted-foreground)",
                                            }}
                                            aria-hidden
                                        />
                                        <span className="truncate">{cat.name}</span>
                                    </span>
                                    <span className="text-muted-foreground/70">·</span>
                                    <span>{frequencyLine}</span>
                                </span>
                            ) : (
                                frequencyLine
                            )}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3 px-4 pb-3 pt-3">
                    <div className="rounded-lg border border-border/80 bg-muted/15 px-3 py-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Próxima parcela
                        </p>
                        {nextDueYmd ? (
                            <>
                                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-sm font-medium tabular-nums">
                                        {formatTransactionDmyPtBr(
                                            `${nextDueYmd}T12:00:00`
                                        )}
                                    </span>
                                    {nextPill ? (
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "shrink-0 border-0 text-xs",
                                                nextPill.className
                                            )}
                                        >
                                            {nextPill.label}
                                        </Badge>
                                    ) : null}
                                </div>
                                <div className="mt-1 text-sm text-muted-foreground tabular-nums">
                                    {nextAmountHint != null ? (
                                        <>
                                            ~
                                            <MoneyDisplay
                                                value={nextAmountHint}
                                                tone="muted"
                                                size="sm"
                                            />
                                        </>
                                    ) : (
                                        "Valor no pagamento"
                                    )}
                                </div>
                            </>
                        ) : (
                            <p className="mt-1 text-sm text-muted-foreground">
                                Sem parcela pendente
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg border border-border/60 bg-background/60 px-2 py-2">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                Pago 90d
                            </p>
                            <p className="mt-0.5 text-xs font-semibold tabular-nums">
                                <MoneyDisplay value={paid90Total} size="sm" />
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                {paid90Count} pag.
                            </p>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-background/60 px-2 py-2">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                Média
                            </p>
                            <p className="mt-0.5 text-xs font-semibold tabular-nums">
                                {avgCharge != null ? (
                                    <MoneyDisplay value={avgCharge} size="sm" />
                                ) : (
                                    "—"
                                )}
                            </p>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-background/60 px-2 py-2">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                Atrasos 90d
                            </p>
                            <p className="mt-0.5 text-sm font-semibold tabular-nums">
                                {latePay90Count}
                            </p>
                        </div>
                    </div>

                    <p className="text-center text-[11px] text-muted-foreground">
                        Toque para ver histórico completo
                    </p>
                </CardContent>
            </button>
        </Card>
    )
}
