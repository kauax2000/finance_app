"use client"

import Link from "next/link"
import { ChevronRightIcon } from "@heroicons/react/24/outline"
import { useEffect, useMemo, useRef, useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import {
    CategoryIconPreview,
    normalizeCategoryIcon,
} from "@/components/categories/category-appearance-fields"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Muted } from "@/components/ui/typography"
import { InvoiceDeltaVsPriorChip } from "@/components/credit-cards/invoice-delta-vs-prior-chip"
import { categoryDetailPath } from "@/config/navigation"
import type { CategoryComparisonRow } from "@/lib/credit-card-invoice-analytics"
import { currencyBRL } from "@/lib/formatters"
import { cn } from "@/lib/utils"

const PIE_TOP_N = 5

const FALLBACK_FILLS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
]

const pctFmt = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
})

function isHex6(s: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(s.trim())
}

function resolveFill(raw: string | null | undefined, index: number): string {
    if (raw && isHex6(raw)) return raw.trim()
    return FALLBACK_FILLS[index % FALLBACK_FILLS.length]
}

function totalCenterAmountTextClass(formatted: string): string {
    const len = formatted.length
    if (len > 21) return "text-[11px] leading-snug"
    if (len > 17) return "text-xs leading-snug"
    if (len > 14) return "text-sm leading-snug"
    if (len > 11) return "text-base leading-snug"
    return "text-lg leading-snug"
}

type PieRow = {
    key: string
    name: string
    value: number
    color: string
    pct: number
}

function CategoryPieTooltip({
    active,
    payload,
}: {
    active?: boolean
    payload?: ({ payload?: PieRow; value?: number } | PieRow)[]
}) {
    if (!active || !payload?.[0]) return null
    const first = payload[0] as { payload?: PieRow } | PieRow
    const row =
        "payload" in first && first.payload
            ? first.payload
            : (first as PieRow)
    return (
        <div className="min-w-[10rem] rounded-lg border border-border/80 bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="mt-1 tabular-nums text-muted-foreground">
                {currencyBRL(row.value)} · {pctFmt.format(row.pct)}% do total
            </p>
        </div>
    )
}

function categoryRowKey(c: CategoryComparisonRow): string {
    return c.categoryId ?? "__none__"
}

function resolvePieHighlightKey(rowKey: string, pieRows: PieRow[]): string {
    if (pieRows.some((p) => p.key === rowKey)) return rowKey
    if (pieRows.some((p) => p.key === "__others__")) return "__others__"
    return rowKey
}

function buildPieRows(rows: CategoryComparisonRow[]): PieRow[] {
    const positive = rows.filter((r) => r.total > 0)
    const total = positive.reduce((s, r) => s + r.total, 0)
    if (positive.length === 0 || total <= 0) return []

    const toPieRow = (r: CategoryComparisonRow, index: number): PieRow => ({
        key: r.categoryId ?? "__none__",
        name: r.name,
        value: r.total,
        color: resolveFill(r.color, index),
        pct: (r.total / total) * 100,
    })

    if (positive.length <= PIE_TOP_N) {
        return positive.map(toPieRow)
    }

    const top = positive.slice(0, PIE_TOP_N)
    const rest = positive.slice(PIE_TOP_N)
    const othersValue = rest.reduce((s, r) => s + r.total, 0)
    return [
        ...top.map(toPieRow),
        {
            key: "__others__",
            name: "Outras",
            value: othersValue,
            color: "color-mix(in oklch, var(--muted-foreground) 45%, transparent)",
            pct: (othersValue / total) * 100,
        },
    ]
}

export type CreditCardInvoiceCategorySpendSectionProps = {
    rows: CategoryComparisonRow[]
    invoiceYearMonth: string
    emptyMessage?: string
}

export function CreditCardInvoiceCategorySpendSection({
    rows,
    invoiceYearMonth,
    emptyMessage = "Sem categorias nesta fatura.",
}: CreditCardInvoiceCategorySpendSectionProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const [chartReady, setChartReady] = useState(false)
    const [activeCategoryKey, setActiveCategoryKey] = useState<string | null>(null)

    useEffect(() => {
        const el = chartContainerRef.current
        if (!el) return
        const ro = new ResizeObserver(([entry]) => {
            if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                setChartReady(true)
            }
        })
        ro.observe(el)
        if (el.clientWidth > 0 && el.clientHeight > 0) setChartReady(true)
        return () => ro.disconnect()
    }, [])

    const total = useMemo(
        () => rows.reduce((sum, row) => sum + row.total, 0),
        [rows],
    )

    const pieRows = useMemo(() => buildPieRows(rows), [rows])
    const totalDisplay = currencyBRL(total)

    const activeRow = useMemo(() => {
        if (!activeCategoryKey) return null
        return rows.find((c) => categoryRowKey(c) === activeCategoryKey) ?? null
    }, [activeCategoryKey, rows])

    const activePieHighlightKey = useMemo(() => {
        if (!activeCategoryKey) return null
        return resolvePieHighlightKey(activeCategoryKey, pieRows)
    }, [activeCategoryKey, pieRows])

    const activePieRow = useMemo(() => {
        if (!activeCategoryKey) return null
        return (
            pieRows.find((p) => p.key === activeCategoryKey) ??
            (activePieHighlightKey
                ? pieRows.find((p) => p.key === activePieHighlightKey)
                : null) ??
            null
        )
    }, [activeCategoryKey, activePieHighlightKey, pieRows])

    return (
        <section id="cc-categorias" className="space-y-3 text-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Gastos por categoria
            </h3>

            {rows.length === 0 ? (
                <Muted>{emptyMessage}</Muted>
            ) : (
                <>
                    <div
                        ref={chartContainerRef}
                        className="relative mx-auto h-[200px] w-full max-w-[260px] min-w-0 sm:h-[220px] sm:max-w-[300px]"
                    >
                        {pieRows.length > 0 && chartReady ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieRows}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="58%"
                                            outerRadius="73%"
                                            paddingAngle={1}
                                            dataKey="value"
                                            nameKey="name"
                                            label={false}
                                            isAnimationActive={false}
                                            onMouseEnter={(_, i) => {
                                                const row = pieRows[i]
                                                setActiveCategoryKey(row?.key ?? null)
                                            }}
                                            onMouseLeave={() => setActiveCategoryKey(null)}
                                        >
                                            {pieRows.map((entry) => (
                                                <Cell
                                                    key={entry.key}
                                                    fill={entry.color}
                                                    stroke="var(--card)"
                                                    strokeWidth={2}
                                                    style={{
                                                        fillOpacity:
                                                            activePieHighlightKey === null ||
                                                            activePieHighlightKey === entry.key
                                                                ? 1
                                                                : 0.35,
                                                    }}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CategoryPieTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div
                                    className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4"
                                    aria-hidden
                                >
                                    <div className="max-w-[min(11rem,82%)] text-center">
                                        {activeCategoryKey == null ? (
                                            <>
                                                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                                    Total gasto
                                                </p>
                                                <p
                                                    className={cn(
                                                        "mt-0.5 break-words font-semibold tabular-nums text-foreground",
                                                        totalCenterAmountTextClass(totalDisplay),
                                                    )}
                                                >
                                                    {totalDisplay}
                                                </p>
                                            </>
                                        ) : activeRow ? (
                                            <>
                                                <p className="max-w-full truncate text-xs font-semibold leading-snug text-foreground">
                                                    {activeRow.name}
                                                </p>
                                                <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                                                    {currencyBRL(activeRow.total)}
                                                </p>
                                                <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                                                    {pctFmt.format(activeRow.shareOpenPct)}%
                                                </p>
                                            </>
                                        ) : activePieRow ? (
                                            <>
                                                <p className="max-w-full truncate text-xs font-semibold leading-snug text-foreground">
                                                    {activePieRow.name}
                                                </p>
                                                <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                                                    {currencyBRL(activePieRow.value)}
                                                </p>
                                                <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                                                    {pctFmt.format(activePieRow.pct)}%
                                                </p>
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>

                    <ul className="space-y-2">
                        {rows.map((c) => {
                            const key = categoryRowKey(c)
                            const isActive = activeCategoryKey === key
                            const rowSurfaceClass = cn(
                                "rounded-lg border border-border/50 bg-muted/15 px-3 py-2.5 transition-colors dark:bg-muted/10",
                                isActive && "border-border/60 bg-muted/30",
                            )
                            const rowBody = (
                                <div className="flex min-w-0 items-center gap-2">
                                        <div
                                            className={cn(
                                                "relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md sm:h-9 sm:w-9",
                                                "border border-white/20 shadow-sm ring-1 ring-black/5",
                                                "backdrop-blur-md",
                                                "after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/30 after:to-white/5 after:opacity-80",
                                            )}
                                            style={{
                                                backgroundColor:
                                                    c.color?.trim() || "var(--primary)",
                                            }}
                                            aria-hidden
                                        >
                                            <CategoryIconPreview
                                                name={normalizeCategoryIcon(c.icon)}
                                                className="relative z-10 h-3.5 w-3.5 text-white sm:h-4 sm:w-4"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium leading-snug text-foreground sm:text-base">
                                                {c.name}
                                            </p>
                                            <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                                                {pctFmt.format(c.shareOpenPct)}% do total
                                            </p>
                                        </div>
                                        <div
                                            className={cn(
                                                "flex shrink-0 items-center gap-1.5",
                                                c.categoryId == null && "opacity-60",
                                            )}
                                        >
                                            <InvoiceDeltaVsPriorChip
                                                deltaPct={c.deltaVsPriorPct}
                                            />
                                            <MoneyDisplay
                                                value={c.total}
                                                size="default"
                                                tone={c.categoryId == null ? "muted" : undefined}
                                                className="font-semibold sm:text-base"
                                            />
                                            <ChevronRightIcon
                                                className={cn(
                                                    "size-4 shrink-0 text-muted-foreground transition-transform",
                                                    c.categoryId != null &&
                                                        "group-hover/row:translate-x-0.5 group-active/row:translate-x-0.5 group-hover/row:text-foreground group-active/row:text-foreground",
                                                    c.categoryId == null &&
                                                        "text-muted-foreground/50",
                                                )}
                                                aria-hidden
                                            />
                                        </div>
                                </div>
                            )
                            return (
                                <li
                                    key={key}
                                    onMouseEnter={() => setActiveCategoryKey(key)}
                                    onMouseLeave={() => setActiveCategoryKey(null)}
                                >
                                    {c.categoryId != null ? (
                                        <Link
                                            href={categoryDetailPath(c.categoryId, {
                                                type: "expense",
                                                month: invoiceYearMonth,
                                            })}
                                            className={cn(
                                                "group/row block no-underline text-inherit",
                                                rowSurfaceClass,
                                                "hover:bg-muted/30 active:bg-muted/30",
                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                            )}
                                            aria-label={`Ver detalhes de ${c.name}`}
                                            onFocus={() => setActiveCategoryKey(key)}
                                            onBlur={() => setActiveCategoryKey(null)}
                                        >
                                            {rowBody}
                                        </Link>
                                    ) : (
                                        <div
                                            className={rowSurfaceClass}
                                            title="Defina uma categoria nas transações para ver o detalhe"
                                        >
                                            {rowBody}
                                        </div>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </>
            )}
        </section>
    )
}
