"use client"

import {
    ChartDonut,
    ChartDonutCenter,
    type ChartConfig,
} from "@/components/ui/chart"
import {
    EmptyState,
    EmptyStateDescription,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import Link from "next/link"
import { useMemo } from "react"
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid"
import { ChartPieIcon, ReceiptPercentIcon, TagIcon } from "@heroicons/react/24/outline"
import { Card, CardContent, CardToolbar } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    PageSection,
    PageSectionHeader,
    PageSectionTitle,
} from "@/components/ui/page-section"
import { ROUTES } from "@/config/navigation"
import { labelYearMonthPt } from "@/lib/budget-month"

/** Cinco fatias e "Outras": a rampa tem cinco degraus, e quem agrega é a tela. */
const PIE_TOP_N = 5

function isHex6(s: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(s.trim())
}

type SliceRow = { key: string; value: number }

export function DashboardExpenseCategories({
    data,
    calendarYm,
}: {
    data: { id: string; name: string; value: number; color: string }[]
    calendarYm: string
}) {
    const monthTitle = useMemo(() => labelYearMonthPt(calendarYm), [calendarYm])

    /**
     * A chave da fatia é o id, e o nome vai no `config` — duas categorias com
     * nomes que só diferem em acento virariam a mesma variável de cor. A
     * categoria sem cor própria cai na rampa pelo índice, e "Outras" cai no
     * `--muted-foreground` que o `ChartDonut` reserva para a sexta fatia.
     */
    const { rows, config, total } = useMemo(() => {
        const positive = data
            .filter((r) => r.value > 0)
            .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "pt-BR"))
        const config: ChartConfig = {}
        const rows: SliceRow[] = positive.slice(0, PIE_TOP_N).map((row) => {
            const key = `cat-${row.id}`
            config[key] = {
                label: row.name,
                ...(row.color && isHex6(row.color) ? { color: row.color.trim() } : {}),
            }
            return { key, value: row.value }
        })
        const rest = positive.slice(PIE_TOP_N)
        if (rest.length > 0) {
            config.__others__ = { label: "Outras" }
            rows.push({
                key: "__others__",
                value: rest.reduce((s, r) => s + r.value, 0),
            })
        }
        return { rows, config, total: positive.reduce((s, r) => s + r.value, 0) }
    }, [data])

    return (
        <PageSection>
            <PageSectionHeader
                actions={
                    <Button
                        asChild
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2 px-2 text-xs pointer-coarse:h-11"
                    >
                        <Link href={ROUTES.DASHBOARD_CATEGORIES}>
                            <ArrowTopRightOnSquareIcon className="size-3.5 shrink-0 md:size-4" />
                            <span className="truncate">Ver categorias</span>
                        </Link>
                    </Button>
                }
            >
                <PageSectionTitle>Despesas por categoria</PageSectionTitle>
            </PageSectionHeader>

            <Card padding="none">
                <CardContent className="relative flex flex-col gap-0">
                    <CardToolbar
                        aria-live="polite"
                    >
                        <p className="text-sm font-semibold leading-snug text-foreground">
                            {monthTitle}
                        </p>
                    </CardToolbar>
                    <div className="p-4">
                    {rows.length > 0 ? (
                        <ChartDonut
                            config={config}
                            data={rows}
                            nameKey="key"
                            dataKey="value"
                            label={`Despesas por categoria em ${monthTitle}`}
                            legend="list"
                            center={<ChartDonutCenter amount={total} label="Total gasto" />}
                            className="w-56 md:w-64"
                        />
                    ) : (
                        <EmptyState variant="plain" className="min-h-60">
                            <EmptyStateIcon variant="stack">
                                <TagIcon aria-hidden />
                                <ChartPieIcon aria-hidden />
                                <ReceiptPercentIcon aria-hidden />
                            </EmptyStateIcon>
                            <EmptyStateTitle>Nenhuma despesa no período</EmptyStateTitle>
                            <EmptyStateDescription>
                                As categorias aparecem assim que despesas forem
                                registradas.
                            </EmptyStateDescription>
                        </EmptyState>
                    )}
                    </div>
                </CardContent>
            </Card>
        </PageSection>
    )
}
