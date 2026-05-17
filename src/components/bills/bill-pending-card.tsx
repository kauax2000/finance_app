"use client"

import { CreditCardIcon, EllipsisHorizontalIcon, PencilIcon, ForwardIcon, TrashIcon } from "@heroicons/react/24/outline"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { billFrequencyLabel } from "@/components/bills/bill-form-shared"
import type { BillPendingRow } from "@/components/bills/bill-list-types"
import {
    CategoryIconPreview,
    normalizeCategoryIcon,
} from "@/components/categories/category-appearance-fields"
import { formatTransactionDmyPtBr } from "@/lib/transaction-date"
import { cn } from "@/lib/utils"
import {
    tagChipDanger,
    tagChipInfo,
    tagChipNeutral,
    tagChipWarning,
} from "@/lib/tag-chip-classes"

const EXPENSE_CATEGORY_FALLBACK_COLOR = "#EF4444"

function cmpYmd(a: string, b: string): number {
    return a.localeCompare(b)
}

function pendingStatusPill(
    row: BillPendingRow,
    todayYmd: string
): { label: string; className: string } {
    if (row.kind === "virtual_cc") {
        return { label: "Fatura cartão", className: tagChipInfo }
    }
    if (cmpYmd(row.dueYmd, todayYmd) < 0) {
        return { label: "Atrasada", className: tagChipDanger }
    }
    if (row.dueYmd === todayYmd) {
        return { label: "Hoje", className: tagChipWarning }
    }
    return { label: "Pendente", className: tagChipNeutral }
}

function daysDeltaLabel(dueYmd: string, todayYmd: string): string {
    const partsDue = dueYmd.split("-").map((x) => Number.parseInt(x, 10))
    const partsTo = todayYmd.split("-").map((x) => Number.parseInt(x, 10))
    const dDue = new Date(partsDue[0] ?? 1970, (partsDue[1] ?? 1) - 1, partsDue[2] ?? 1)
    const dTo = new Date(partsTo[0] ?? 1970, (partsTo[1] ?? 1) - 1, partsTo[2] ?? 1)
    const ms = dDue.getTime() - dTo.getTime()
    const days = Math.round(ms / 86400000)
    if (days === 0) return "vence hoje"
    if (days > 0) return `em ${days} dia${days === 1 ? "" : "s"}`
    const a = Math.abs(days)
    return `há ${a} dia${a === 1 ? "" : "s"}`
}

const categoryIconTileClass = cn(
    "relative flex h-11 w-11 shrink-0 items-center justify-center self-start overflow-hidden rounded-lg",
    "border border-white/20 shadow-sm ring-1 ring-black/5",
    "backdrop-blur-md",
    "after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/30 after:to-white/5 after:opacity-80"
)

export type BillPendingCardProps = {
    row: BillPendingRow
    todayYmd: string
    onOpenDetail: () => void
    onPay: () => void
    onEditModel: () => void
    onSkipInstance: () => void
    onDeleteBill: () => void
}

export function BillPendingCard({
    row,
    todayYmd,
    onOpenDetail,
    onPay,
    onEditModel,
    onSkipInstance,
    onDeleteBill,
}: BillPendingCardProps) {
    const pill = pendingStatusPill(row, todayYmd)
    const dueFmt = formatTransactionDmyPtBr(`${row.dueYmd}T12:00:00`)
    const delta = daysDeltaLabel(row.dueYmd, todayYmd)
    const isEstimated =
        row.kind === "regular"
            ? row.instance.amount == null &&
              row.bill.amount_estimated != null
            : row.amountHint != null

    const subtitle =
        row.kind === "regular"
            ? `${billFrequencyLabel(row.bill.frequency)} · Dia ${row.bill.due_day_of_month}`
            : `Cartão · venc. fatura`

    const cat = row.kind === "regular" ? row.bill.category : null
    const headerColor =
        row.kind === "regular"
            ? (cat?.color ?? EXPENSE_CATEGORY_FALLBACK_COLOR)
            : undefined
    return (
        <Card
            size="sm"
            className={cn(
                "gap-0 overflow-hidden py-0 transition-shadow",
                row.kind === "regular" && !row.bill.is_active && "opacity-[0.82]"
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
                aria-label={`Abrir ${row.title}`}
            >
                <CardHeader className="border-b border-border/60 bg-muted/25 !py-3">
                    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_auto] items-start gap-x-3 gap-y-1">
                        {row.kind === "virtual_cc" ? (
                            <div
                                className={cn(
                                    categoryIconTileClass,
                                    "col-start-1 row-span-2 bg-muted"
                                )}
                                aria-hidden
                            >
                                <CreditCardIcon className="relative z-10 h-5 w-5 text-muted-foreground" />
                            </div>
                        ) : (
                            <div
                                className={cn(
                                    categoryIconTileClass,
                                    "col-start-1 row-span-2"
                                )}
                                style={{ backgroundColor: headerColor }}
                                aria-hidden
                            >
                                <CategoryIconPreview
                                    name={normalizeCategoryIcon(
                                        row.bill.icon ?? "receipt"
                                    )}
                                    className="relative z-10 h-5 w-5 text-white"
                                />
                            </div>
                        )}

                        <CardTitle
                            className={cn(
                                "col-start-2 row-start-1 min-w-0 self-center leading-snug",
                                "line-clamp-2 text-balance @min-[360px]/card-header:line-clamp-1 @min-[360px]/card-header:truncate",
                            )}
                        >
                            {row.title}
                        </CardTitle>

                        <Badge
                            variant="secondary"
                            className={cn(
                                "col-start-3 row-span-2 shrink-0 self-start border-0 text-xs",
                                pill.className
                            )}
                        >
                            {row.kind === "virtual_cc" ? (
                                <>
                                    <CreditCardIcon className="mr-1 inline size-3" aria-hidden />
                                    {pill.label}
                                </>
                            ) : (
                                pill.label
                            )}
                        </Badge>

                        <CardDescription className="col-start-2 row-start-2 text-xs leading-relaxed text-muted-foreground">
                            {row.kind === "regular" && cat ? (
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
                                    <span>{subtitle}</span>
                                </span>
                            ) : (
                                subtitle
                            )}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3 px-4 pb-4 pt-3">
                    <div className="rounded-lg border border-border/80 bg-muted/15 px-3 py-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Valor estimado
                        </p>
                        <div className="mt-1 flex flex-wrap items-baseline gap-1 tabular-nums">
                            {row.amountHint != null ? (
                                <>
                                    {isEstimated ? (
                                        <span className="text-sm text-muted-foreground">
                                            ~
                                        </span>
                                    ) : null}
                                    <MoneyDisplay
                                        value={row.amountHint}
                                        size="lg"
                                        className="font-semibold tracking-tight"
                                    />
                                </>
                            ) : (
                                <span className="text-sm text-muted-foreground">
                                    Definido no pagamento
                                </span>
                            )}
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            Venc. {dueFmt}
                            <span className="text-muted-foreground/70"> · </span>
                            <span
                                className={cn(
                                    cmpYmd(row.dueYmd, todayYmd) < 0 &&
                                        "font-medium text-destructive"
                                )}
                            >
                                {delta}
                            </span>
                        </p>
                    </div>
                </CardContent>
            </button>

            <div className="flex items-center justify-end gap-2 border-t border-border/50 px-4 py-3">
                <Button
                    type="button"
                    size="sm"
                    className="h-8 min-w-[5.5rem] text-xs"
                    onClick={(e) => {
                        e.stopPropagation()
                        onPay()
                    }}
                >
                    Pagar
                </Button>
                {row.kind === "regular" ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                size="icon-sm"
                                variant="outline"
                                aria-label="Mais ações"
                                className="size-8 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <EllipsisHorizontalIcon className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onEditModel()
                                }}
                            >
                                <PencilIcon className="mr-2 size-4" />
                                Editar modelo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onSkipInstance()
                                }}
                            >
                                <ForwardIcon className="mr-2 size-4" />
                                Ignorar parcela
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteBill()
                                }}
                            >
                                <TrashIcon className="mr-2 size-4" />
                                Excluir conta
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}
            </div>
        </Card>
    )
}
