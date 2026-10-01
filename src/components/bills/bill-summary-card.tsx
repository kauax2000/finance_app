"use client"

import { billDuePill } from "@/components/bills/bill-status"
import {
    DescriptionDetails,
    DescriptionList,
    DescriptionListItem,
    DescriptionTerm,
} from "@/components/ui/description-list"
import {
    Badge,
} from "@/components/ui/badge"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardLink,
    CardTitle,
} from "@/components/ui/card"
import { MoneyDisplay } from "@/components/ui/money-display"
import { billFrequencyLabel } from "@/components/bills/bill-form-shared"
import {
    CategoryIconPreview,
    normalizeCategoryIcon,
} from "@/components/categories/category-appearance-fields"
import type { BillRowWithCategory } from "@/lib/queries/fetch-bills-page-bundle"
import {
    formatTransactionDmyPtBr,
} from "@/lib/transaction-date"
import { cn } from "@/lib/utils"
import { ColorTile } from "@/components/ui/color-tile"

const EXPENSE_CATEGORY_FALLBACK_COLOR = "var(--expense)"

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
        nextDueYmd != null ? billDuePill(nextDueYmd, todayYmd) : null

    return (
        <Card padding="sm" inactive={!bill.is_active} className="group">
                <CardHeader
                    media={
                        <ColorTile size="2xl" color={headerColor}>
                            {/* `lg` desenha o ícone a 20px, e a 20 o conjunto é o mini. */}
                            <CategoryIconPreview name={iconId} size="mini" />
                        </ColorTile>
                    }
                >
                        <CardTitle
                            className={cn(
                                "min-w-0 self-center leading-snug",
                                "line-clamp-2 text-balance @min-[360px]/card-header:line-clamp-1 @min-[360px]/card-header:truncate",
                            )}
                        >
                            {/* O cartão abre pelo `CardLink` (rodada 204), e não por
                                um <button> em volta de tudo. */}
                            <CardLink asChild>
                                <button type="button" className="text-left" onClick={onOpenDetail} aria-label={`Abrir conta ${bill.name}`}>
                                    {bill.name}
                                </button>
                            </CardLink>
                        </CardTitle>

                        <CardAction>
                        <Badge
                            variant={bill.is_active ? "soft" : "outline"}
                            tone={bill.is_active ? "success" : "neutral"}
                            className="shrink-0"
                        >
                            {bill.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                        </CardAction>

                        <CardDescription className="text-xs leading-relaxed">
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
                </CardHeader>

                <CardContent className="space-y-3">
                    <DescriptionList term="eyebrow">
                        <DescriptionListItem>
                            <DescriptionTerm>
                                Próxima parcela
                            </DescriptionTerm>
                            <DescriptionDetails>
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
                                                    tone="neutral"
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
                            </DescriptionDetails>
                        </DescriptionListItem>
                    </DescriptionList>

                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg border border-border/60 bg-background/60 px-2 py-2">
                            <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                                Pago 90d
                            </p>
                            <p className="mt-0.5 text-xs font-semibold tabular-nums">
                                <MoneyDisplay value={paid90Total} size="sm" />
                            </p>
                            <p className="text-2xs text-muted-foreground">
                                {paid90Count} pag.
                            </p>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-background/60 px-2 py-2">
                            <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
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
                            <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                                Atrasos 90d
                            </p>
                            <p className="mt-0.5 text-sm font-semibold tabular-nums">
                                {latePay90Count}
                            </p>
                        </div>
                    </div>

                    <p className="text-center text-2xs text-muted-foreground">
                        Toque para ver histórico completo
                    </p>
                </CardContent>
        </Card>
    )
}
