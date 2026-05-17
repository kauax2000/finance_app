"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowTopRightOnSquareIcon, ReceiptPercentIcon } from "@heroicons/react/24/outline"
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/navigation"
import { labelYearMonthPt } from "@/lib/budget-month"
import { cn } from "@/lib/utils"

const currencyFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
})

const pctFmt = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
})

/** Fallback palette when category color is missing or invalid (theme-aware neutrals + accents). */
const FALLBACK_FILLS = [
    "oklch(0.65 0.15 166)",
    "oklch(0.62 0.19 264)",
    "oklch(0.7 0.15 45)",
    "oklch(0.58 0.2 25)",
    "oklch(0.55 0.12 250)",
]

function isHex6(s: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(s.trim())
}

function resolveFill(raw: string | undefined, index: number): string {
    if (raw && isHex6(raw)) return raw.trim()
    return FALLBACK_FILLS[index % FALLBACK_FILLS.length]
}

/** Keeps the donut center label readable without overlapping slice edges. */
function totalCenterAmountTextClass(formatted: string): string {
    const len = formatted.length
    if (len > 21) return "text-[11px] leading-snug"
    if (len > 17) return "text-xs leading-snug"
    if (len > 14) return "text-sm leading-snug"
    if (len > 11) return "text-base leading-snug"
    return "text-lg leading-snug"
}

type ExpenseCategoryRow = {
    name: string
    value: number
    color: string
    key: string
    /** Workspace category id or `__none__` (never `__others__` on list rows). */
    sourceId: string
    pct: number
}

function listRowMatchesHighlight(
    activeKey: string | null,
    row: ExpenseCategoryRow,
    othersCategoryIds: Set<string>,
): boolean {
    if (activeKey === null) return true
    if (activeKey === row.key) return true
    if (activeKey === "__others__" && othersCategoryIds.has(row.sourceId)) {
        return true
    }
    return false
}

function pieSliceActive(
    activeKey: string | null,
    entry: ExpenseCategoryRow,
    othersCategoryIds: Set<string>,
): boolean {
    if (activeKey === null) return true
    if (activeKey === entry.key) return true
    if (
        entry.key === "__others__" &&
        activeKey.startsWith("cat:") &&
        othersCategoryIds.has(activeKey.slice("cat:".length))
    ) {
        return true
    }
    return false
}

function CategoryTooltip({
    active,
    payload,
}: {
    active?: boolean
    payload?: (
        | { payload?: ExpenseCategoryRow; name?: string; value?: number }
        | ExpenseCategoryRow
    )[]
}) {
    if (!active || !payload?.[0]) return null
    const first = payload[0] as
        | { payload?: ExpenseCategoryRow }
        | ExpenseCategoryRow
    const row =
        "payload" in first && first.payload
            ? first.payload
            : (first as ExpenseCategoryRow)
    return (
        <div className="min-w-[10rem] rounded-lg border border-border/80 bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="mt-1 tabular-nums text-muted-foreground">
                {currencyFmt.format(row.value)} · {pctFmt.format(row.pct)}% do total
            </p>
        </div>
    )
}

export function DashboardExpenseCategories({
    data,
    calendarYm,
}: {
    data: { id: string; name: string; value: number; color: string }[]
    calendarYm: string
}) {
    const [activeKey, setActiveKey] = useState<string | null>(null)
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const [chartReady, setChartReady] = useState(false)
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
    const monthTitle = useMemo(() => labelYearMonthPt(calendarYm), [calendarYm])

    const sorted = useMemo(
        () =>
            [...data].sort((a, b) => {
                if (b.value !== a.value) return b.value - a.value
                return a.name.localeCompare(b.name, "pt-BR")
            }),
        [data],
    )

    const total = useMemo(
        () => sorted.reduce((sum, row) => sum + row.value, 0),
        [sorted],
    )

    const listRows = useMemo(
        (): ExpenseCategoryRow[] =>
            sorted.map((row, index) => ({
                name: row.name,
                value: row.value,
                color: resolveFill(row.color, index),
                key: `cat:${row.id}`,
                sourceId: row.id,
                pct: total > 0 ? (row.value / total) * 100 : 0,
            })),
        [sorted, total],
    )

    const { pieRows, othersCategoryIds } = useMemo(() => {
        const emptyIds = new Set<string>()
        const positive = sorted.filter((r) => r.value > 0)
        if (positive.length === 0) {
            return { pieRows: [] as ExpenseCategoryRow[], othersCategoryIds: emptyIds }
        }
        if (positive.length <= 5) {
            return {
                pieRows: positive.map((row, index) => ({
                    name: row.name,
                    value: row.value,
                    color: resolveFill(row.color, index),
                    key: `cat:${row.id}`,
                    sourceId: row.id,
                    pct: total > 0 ? (row.value / total) * 100 : 0,
                })),
                othersCategoryIds: emptyIds,
            }
        }

        const top = positive.slice(0, 5)
        const rest = positive.slice(5)
        const othersValue = rest.reduce((s, r) => s + r.value, 0)
        const othersCategoryIds = new Set(rest.map((r) => r.id))

        const topRows: ExpenseCategoryRow[] = top.map((row, index) => ({
            name: row.name,
            value: row.value,
            color: resolveFill(row.color, index),
            key: `cat:${row.id}`,
            sourceId: row.id,
            pct: total > 0 ? (row.value / total) * 100 : 0,
        }))

        const othersRow: ExpenseCategoryRow = {
            name: "Outras",
            value: othersValue,
            color: "color-mix(in oklch, var(--muted-foreground) 45%, transparent)",
            key: "__others__",
            sourceId: "__others__",
            pct: total > 0 ? (othersValue / total) * 100 : 0,
        }

        return {
            pieRows: [...topRows, othersRow],
            othersCategoryIds,
        }
    }, [sorted, total])

    const maxValue = useMemo(
        () => Math.max(1, ...listRows.map((r) => r.value)),
        [listRows],
    )
    const totalDisplay = currencyFmt.format(total)

    return (
        <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex h-8 min-w-0 items-end">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Despesas por categoria
                    </p>
                </div>
                <Button
                    asChild
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 w-full gap-2 px-2 text-xs md:h-8 md:w-auto"
                >
                    <Link href={ROUTES.DASHBOARD_CATEGORIES}>
                        <ArrowTopRightOnSquareIcon className="size-3.5 shrink-0 md:size-4" />
                        <span className="truncate">Ver categorias</span>
                    </Link>
                </Button>
            </div>

            <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                <CardContent className="relative flex flex-col gap-0 p-0">
                    <div
                        className="flex min-h-10 shrink-0 items-center border-b border-border bg-muted/30 px-4 py-2.5"
                        aria-live="polite"
                    >
                        <p className="text-sm font-semibold capitalize leading-snug text-foreground">
                            {monthTitle}
                        </p>
                    </div>
                    <div className="space-y-4 p-4">
                    {data.length > 0 ? (
                        <>
                            <div ref={chartContainerRef} className="relative mx-auto h-[240px] w-full max-w-[280px] md:h-[320px] md:max-w-[360px]">
                                {pieRows.length > 0 ? (
                                    <>
                                        {chartReady && <ResponsiveContainer width="100%" height="100%">
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
                                                    onMouseEnter={(_, index) => {
                                                        const row = pieRows[index]
                                                        setActiveKey(row?.key ?? null)
                                                    }}
                                                    onMouseLeave={() =>
                                                        setActiveKey(null)
                                                    }
                                                >
                                                    {pieRows.map((entry) => (
                                                        <Cell
                                                            key={entry.key}
                                                            fill={entry.color}
                                                            stroke="var(--card)"
                                                            strokeWidth={2}
                                                            style={{
                                                                fillOpacity:
                                                                    pieSliceActive(
                                                                        activeKey,
                                                                        entry,
                                                                        othersCategoryIds,
                                                                    )
                                                                        ? 1
                                                                        : 0.35,
                                                            }}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    content={<CategoryTooltip />}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>}
                                        <div
                                            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4"
                                            aria-hidden
                                        >
                                            <div className="max-w-[min(11rem,82%)] text-center md:max-w-[min(13rem,82%)]">
                                                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                                    Total gasto
                                                </p>
                                                <p
                                                    className={cn(
                                                        "mt-0.5 break-words font-semibold tabular-nums text-foreground",
                                                        totalCenterAmountTextClass(
                                                            totalDisplay,
                                                        ),
                                                    )}
                                                >
                                                    {totalDisplay}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
                                        <p className="text-xs text-muted-foreground">
                                            Nenhuma despesa no período
                                        </p>
                                        <p
                                            className={cn(
                                                "font-semibold tabular-nums text-foreground",
                                                totalCenterAmountTextClass(
                                                    totalDisplay,
                                                ),
                                            )}
                                        >
                                            {totalDisplay}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Todas as categorias
                                </p>
                                <ul className="grid grid-cols-1 gap-y-2" role="list">
                                    {listRows.map((row) => {
                                        const isActive =
                                            listRowMatchesHighlight(
                                                activeKey,
                                                row,
                                                othersCategoryIds,
                                            )
                                        return (
                                            <li key={row.key}>
                                                <button
                                                    type="button"
                                                    className={cn(
                                                        "w-full rounded-lg border px-2 py-2 text-left transition-colors",
                                                        "border-transparent hover:border-border/60 hover:bg-muted/30",
                                                        isActive &&
                                                            activeKey !== null &&
                                                            "border-border/80 bg-muted/40",
                                                        !isActive &&
                                                            activeKey !== null &&
                                                            "opacity-45",
                                                    )}
                                                    onMouseEnter={() =>
                                                        setActiveKey(row.key)
                                                    }
                                                    onMouseLeave={() =>
                                                        setActiveKey(null)
                                                    }
                                                    onFocus={() =>
                                                        setActiveKey(row.key)
                                                    }
                                                    onBlur={() =>
                                                        setActiveKey(null)
                                                    }
                                                >
                                                    <div className="flex items-center justify-between gap-2 text-xs">
                                                        <span className="flex min-w-0 items-center gap-2">
                                                            <span
                                                                className="size-2 shrink-0 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        row.color,
                                                                }}
                                                                aria-hidden
                                                            />
                                                            <span
                                                                className="min-w-0 truncate font-medium"
                                                                title={row.name}
                                                            >
                                                                {row.name}
                                                            </span>
                                                        </span>
                                                        <span className="flex shrink-0 flex-col items-end gap-0.5 tabular-nums">
                                                            <span className="font-medium text-foreground">
                                                                {currencyFmt.format(
                                                                    row.value,
                                                                )}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {pctFmt.format(
                                                                    row.pct,
                                                                )}
                                                                % do total
                                                            </span>
                                                        </span>
                                                    </div>
                                                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${Math.min(
                                                                    100,
                                                                    (row.value /
                                                                        maxValue) *
                                                                        100,
                                                                )}%`,
                                                                backgroundColor:
                                                                    row.color,
                                                            }}
                                                        />
                                                    </div>
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        </>
                    ) : (
                        <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                                <ReceiptPercentIcon
                                    className="h-6 w-6 text-muted-foreground"
                                    aria-hidden
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Nenhuma despesa no período
                            </p>
                            <p className="max-w-sm text-xs text-muted-foreground">
                                As categorias aparecem assim que despesas forem
                                registradas.
                            </p>
                        </div>
                    )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
