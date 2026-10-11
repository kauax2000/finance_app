"use client"

import {
    ChartDonut,
    ChartDonutCenter,
    type ChartConfig,
} from "@/components/ui/chart"
import {
    Item,
    ItemChevron,
} from "@/components/ui/item"
import { percentPointsBR } from "@/lib/formatters"
import Link from "next/link"
import { useMemo, useState } from "react"
import {
    CategoryIconPreview,
    normalizeCategoryIcon,
} from "@/components/categories/category-appearance-fields"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Muted } from "@/components/ui/typography"
import { InvoiceDeltaVsPriorChip } from "@/components/credit-cards/invoice-delta-vs-prior-chip"
import { categoryDetailPath } from "@/config/navigation"
import type { CategoryComparisonRow } from "@/lib/credit-card-invoice-analytics"
import { ehCursor } from "@/lib/pointer"
import { cn } from "@/lib/utils"
import { ColorTile } from "@/components/ui/color-tile"

/** Cinco fatias e "Outras": a rampa tem cinco degraus, e quem agrega é a tela. */
const PIE_TOP_N = 5

function isHex6(s: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(s.trim())
}

function categoryRowKey(c: CategoryComparisonRow): string {
    return c.categoryId ?? "__none__"
}

type SliceRow = { key: string; value: number }

/**
 * A chave da fatia é o id, e o nome vai no `config`. A categoria sem cor
 * própria cai na rampa pelo índice, e "Outras" cai no `--muted-foreground`
 * que o `ChartDonut` reserva para a sexta fatia.
 */
function buildDonut(rows: CategoryComparisonRow[]): {
    slices: SliceRow[]
    config: ChartConfig
} {
    const positive = rows.filter((r) => r.total > 0)
    const config: ChartConfig = {}
    const slices: SliceRow[] = positive.slice(0, PIE_TOP_N).map((r) => {
        const key = `cat-${categoryRowKey(r)}`
        config[key] = {
            label: r.name,
            ...(r.color && isHex6(r.color) ? { color: r.color.trim() } : {}),
        }
        return { key, value: r.total }
    })
    const rest = positive.slice(PIE_TOP_N)
    if (rest.length > 0) {
        config.__others__ = { label: "Outras" }
        slices.push({
            key: "__others__",
            value: rest.reduce((s, r) => s + r.total, 0),
        })
    }
    return { slices, config }
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
    const total = useMemo(
        () => rows.reduce((sum, row) => sum + row.total, 0),
        [rows],
    )
    const { slices, config } = useMemo(() => buildDonut(rows), [rows])
    // A linha e a fatia acendem juntas: pousar numa linha acende a fatia dela
    // (as que ficaram fora das cinco são "Outras"), e a fatia acesa no gráfico
    // tinge a linha.
    const fatias = useMemo(() => new Set(slices.map((f) => f.key)), [slices])
    const [ativa, setAtiva] = useState<string | null>(null)
    const fatiaDa = (row: CategoryComparisonRow) => {
        const key = `cat-${categoryRowKey(row)}`
        return fatias.has(key) ? key : "__others__"
    }

    return (
        <section id="cc-categorias" className="space-y-3 text-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Gastos por categoria
            </h3>

            {rows.length === 0 ? (
                <Muted>{emptyMessage}</Muted>
            ) : (
                <>
                    {/* A lista abaixo é a legenda: cada linha leva ao detalhe
                        da categoria, e a do `ChartDonut` não navega. */}
                    {slices.length > 0 ? (
                        <div className="flex justify-center">
                            <ChartDonut
                                config={config}
                                data={slices}
                                nameKey="key"
                                dataKey="value"
                                label="Gastos por categoria nesta fatura"
                                legend={false}
                                center={<ChartDonutCenter amount={total} label="Total gasto" />}
                                active={ativa}
                                onActiveChange={setAtiva}
                                className="w-48 sm:w-52"
                            />
                        </div>
                    ) : null}

                    <ul className="space-y-2" onPointerLeave={() => setAtiva(null)}>
                        {rows.map((c) => {
                            const key = categoryRowKey(c)
                            const rowSurfaceClass = cn(
                                "block border-border/50 px-3 py-2.5 transition-colors",
                                ativa === fatiaDa(c) && "bg-muted/60",
                            )
                            const rowBody = (
                                <div className="flex min-w-0 items-center gap-2">
                                        <ColorTile color={c.color} className="sm:size-9">
                                            <CategoryIconPreview name={normalizeCategoryIcon(c.icon)} />
                                        </ColorTile>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium leading-snug text-foreground sm:text-base">
                                                {c.name}
                                            </p>
                                            <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                                                {percentPointsBR(c.shareOpenPct)}% do total
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
                                                size="md"
                                                tone={c.categoryId == null ? "muted" : undefined}
                                                className="font-semibold sm:text-base"
                                            />
                                            {/* Sem categoria a linha não navega, e a
                                                seta fica parada e mais apagada. */}
                                            <ItemChevron
                                                className={c.categoryId == null ? "opacity-50" : undefined}
                                            />
                                        </div>
                                </div>
                            )
                            return (
                                // A fatia acende com o cursor; o toque abre a categoria.
                                <li
                                    key={key}
                                    onPointerEnter={(e) => {
                                        if (ehCursor(e)) setAtiva(fatiaDa(c))
                                    }}
                                >
                                    {c.categoryId != null ? (
                                        <Item
                                            asChild
                                            interactive
                                            variant="outline"
                                            className={cn("group/row no-underline text-inherit", rowSurfaceClass)}
                                        >
                                        <Link
                                            href={categoryDetailPath(c.categoryId, {
                                                type: "expense",
                                                month: invoiceYearMonth,
                                            })}
                                            aria-label={`Ver detalhes de ${c.name}`}
                                        >
                                            {rowBody}
                                        </Link>
                                        </Item>
                                    ) : (
                                        <Item
                                            variant="outline"
                                            className={rowSurfaceClass}
                                            title="Defina uma categoria nas transações para ver o detalhe"
                                        >
                                            {rowBody}
                                        </Item>
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
