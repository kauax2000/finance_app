"use client"

import type { ReactNode } from "react"
import {
    DescriptionDetails,
    DescriptionList,
    DescriptionListItem,
    DescriptionTerm,
} from "@/components/ui/description-list"
import {
    PageSection,
    PageSectionHeader,
    PageSectionTitle,
} from "@/components/ui/page-section"
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  InformationCircleIcon,
  MinusIcon,
} from "@heroicons/react/16/solid"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Category } from "@/lib/supabase"
import { currencyBRL } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { deltaTone } from "@/lib/delta-tone"

export type MonthAmountStats = {
    count: number
    avg: number
    max: number
    min: number
}

type CategoryDetailSummarySectionProps = {
    category: Category
    monthTotal: number
    postedMonthTotal?: number
    projectedMonthTotal?: number
    projectedInstallmentsTotal?: number
    projectedSubscriptionsTotal?: number
    stats: MonthAmountStats
    limit: number
    remaining: number
    overBudget: boolean
    workspaceTypeTotal: number
    prevMonthCategoryTotal: number
}

function pctShare(part: number, whole: number): string | null {
    if (whole <= 0 || part <= 0) return null
    return ((part / whole) * 100).toFixed(1)
}

type MomDirection = "up" | "down" | "flat"

function momentumTone(
    isExpense: boolean,
    direction: MomDirection,
): "income" | "expense" | "neutral" {
    return deltaTone(direction, isExpense ? "expense" : "income")
}

function formatSignedPct(pctRounded: number): string {
    if (pctRounded === 0) return "0%"
    const sign = pctRounded > 0 ? "+" : ""
    return `${sign}${pctRounded}%`
}

function pctAriaLabel(isExpense: boolean, pctRounded: number, direction: MomDirection): string {
    const abs = Math.abs(pctRounded)
    if (direction === "flat") {
        return "Comparado ao mês anterior: sem variação percentual."
    }
    const moreLess = pctRounded > 0 ? "mais" : "menos"
    const kind = isExpense ? "gasto" : "receita"
    return `Comparado ao mês anterior: ${moreLess} ${abs} por cento de ${kind} na categoria.`
}

type MomBadgeModel =
    | { show: false }
    | {
          show: true
          /** Tom, e não forma: o modelo diz a cor do sinal. */
          tone: "income" | "expense" | "neutral"
          direction: MomDirection
          display: string
          ariaLabel: string
          isNovo?: boolean
      }

function buildMomBadgeModel(prev: number, monthTotal: number, isExpense: boolean): MomBadgeModel {
    if (prev === 0 && monthTotal === 0) {
        return { show: false }
    }

    if (prev <= 0 && monthTotal > 0) {
        const kind = isExpense ? "gasto" : "receita"
        return {
            show: true,
            tone: "neutral",
            direction: "flat",
            display: "Sem base mês ant.",
            ariaLabel: `Sem valor de ${kind} no mês anterior para comparar; há valor no período atual.`,
            isNovo: true,
        }
    }

    if (prev > 0 && monthTotal === 0) {
        const pctRounded = -100
        const direction: MomDirection = "down"
        return {
            show: true,
            tone: momentumTone(isExpense, direction),
            direction,
            display: formatSignedPct(pctRounded),
            ariaLabel: pctAriaLabel(isExpense, pctRounded, direction),
        }
    }

    if (prev > 0) {
        const raw = ((monthTotal - prev) / prev) * 100
        const pctRounded = Math.round(raw)
        const direction: MomDirection =
            monthTotal > prev ? "up" : monthTotal < prev ? "down" : "flat"
        return {
            show: true,
            tone: momentumTone(isExpense, direction),
            direction,
            display: formatSignedPct(pctRounded),
            ariaLabel: pctAriaLabel(isExpense, pctRounded, direction),
        }
    }

    return { show: false }
}

/** Faixa de título + divisor; corpo usa `categorySummaryBodyClassName` em `CardContent`. */
const categorySummaryHeaderClassName =
    "flex shrink-0 min-h-14 flex-col justify-center gap-1 border-b border-border bg-muted/40 px-4 py-2.5 md:min-h-11 md:flex-row md:items-center md:justify-between md:gap-2 md:px-5"

const categorySummaryTitleClassName =
    "min-w-0 flex-1 text-2xs leading-[14px] font-medium uppercase tracking-wide text-muted-foreground"

const categorySummaryBodyClassName = "bg-muted/10"

/** Alinhado a `DeltaBadge` em dashboard-kpi-cards (KPI cards). */
const momBadgeClassName =
    "shrink-0 gap-1 px-2 py-0.5 text-2xs font-medium tabular-nums whitespace-nowrap"

function MomBadge({ model }: { model: MomBadgeModel }) {
    if (!model.show) return null

    if (model.isNovo) {
        return (
            <Badge
                tone={model.tone}
                className="max-w-[min(100%,7.5rem)] shrink-0 gap-1 truncate px-2 py-0.5 text-2xs font-medium tabular-nums"
                aria-label={model.ariaLabel}
                title={model.ariaLabel}
                role="status"
            >
                <InformationCircleIcon
                    className="hidden size-3 shrink-0 text-primary-accent md:block"
                    aria-hidden
                />
                <span>{model.display}</span>
            </Badge>
        )
    }

    if (model.direction === "flat") {
        return (
            <Badge
                tone={model.tone}
                className={momBadgeClassName}
                aria-label={model.ariaLabel}
                role="status"
            >
                <MinusIcon className="hidden size-3 shrink-0 opacity-90 md:block" aria-hidden />
                <span>{model.display}</span>
            </Badge>
        )
    }

    const Icon =
        model.direction === "up" ? ArrowTrendingUpIcon : ArrowTrendingDownIcon

    return (
        <Badge
            tone={model.tone}
            className={momBadgeClassName}
            aria-label={model.ariaLabel}
            role="status"
        >
            <Icon className="hidden size-3 shrink-0 opacity-90 md:block" aria-hidden />
            <span>{model.display}</span>
        </Badge>
    )
}

function ExpenseBudgetOverviewCard({
    limit,
    remaining,
    overBudget,
    monthTotal,
    postedMonthTotal,
    projectedMonthTotal,
    projectedInstallmentsTotal,
    projectedSubscriptionsTotal,
    budgetHeaderRight,
}: {
    limit: number
    remaining: number
    overBudget: boolean
    monthTotal: number
    postedMonthTotal?: number
    projectedMonthTotal?: number
    projectedInstallmentsTotal?: number
    projectedSubscriptionsTotal?: number
    /** Badge MoM à direita do título da seção; no desktop, “Limite” fica antes do badge quando houver orçamento. */
    budgetHeaderRight?: ReactNode
}) {
    const hasBudget = limit > 0
    const over = hasBudget && monthTotal > limit
    const near = hasBudget && !over && monthTotal / limit >= 0.85
    const budgetPctRounded = hasBudget
        ? Math.min(100, Math.max(0, Math.round((monthTotal / limit) * 100)))
        : 0
    const budgetFillColor = over
        ? "var(--destructive)"
        : near
          ? "var(--warning)"
          : "var(--success)"
    const budgetBarLabel = hasBudget
        ? `Uso do orçamento: ${budgetPctRounded}% de ${currencyBRL(limit)}${over ? ", acima do limite" : ""}`
        : undefined

    return (
        <PageSection className="md:col-span-6">
            <PageSectionHeader
                actions={
                    <>
                        {hasBudget ? (
                            <p className="hidden tabular-nums text-2xs text-muted-foreground md:block">
                                Limite{" "}
                                <span className="font-medium text-foreground">{currencyBRL(limit)}</span>
                            </p>
                        ) : (
                            <p className="hidden text-2xs font-medium uppercase tracking-wide text-muted-foreground md:block">
                                Sem limite
                            </p>
                        )}
                        {budgetHeaderRight ?? null}
                    </>
                }
            >
                <PageSectionTitle className="truncate">Orçamento do mês</PageSectionTitle>
            </PageSectionHeader>

            <Card padding="none" className="min-w-0">
                <CardContent className="space-y-4 p-3 md:p-4">
                    {hasBudget ? (
                        <>
                            <DescriptionList className="gap-0 md:hidden">
                                <DescriptionListItem className="flex w-full items-center justify-between gap-2">
                                    <DescriptionTerm className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Limite
                                    </DescriptionTerm>
                                    <DescriptionDetails className="text-2xs font-medium">
                                        {currencyBRL(limit)}
                                    </DescriptionDetails>
                                </DescriptionListItem>
                            </DescriptionList>
                            <div className="grid grid-cols-2 items-end gap-3 md:flex md:flex-wrap md:justify-between md:gap-x-6 md:gap-y-4">
                                <div className="min-w-0 space-y-1">
                                    <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Gasto
                                    </p>
                                    <p className="truncate text-lg font-semibold tabular-nums leading-tight sm:text-xl md:text-2xl">
                                        {currencyBRL(monthTotal)}
                                    </p>
                                    {projectedMonthTotal && projectedMonthTotal > 0 ? (
                                        <p className="text-xs leading-snug text-muted-foreground">
                                            Registrado{" "}
                                            <span className="tabular-nums">
                                                {currencyBRL(postedMonthTotal ?? 0)}
                                            </span>{" "}
                                            <span className="text-muted-foreground/70">
                                                ·
                                            </span>{" "}
                                            +{" "}
                                            <span className="tabular-nums">
                                                {currencyBRL(projectedMonthTotal)}
                                            </span>{" "}
                                            previstos
                                            {projectedInstallmentsTotal || projectedSubscriptionsTotal ? (
                                                <>
                                                    {" "}
                                                    <span className="text-muted-foreground/70">
                                                        (
                                                    </span>
                                                    {projectedInstallmentsTotal &&
                                                    projectedInstallmentsTotal > 0 ? (
                                                        <>
                                                            <span className="tabular-nums">
                                                                {currencyBRL(
                                                                    projectedInstallmentsTotal
                                                                )}
                                                            </span>
                                                            <span className="text-muted-foreground/70">
                                                                {" "}
                                                                parcelas
                                                            </span>
                                                        </>
                                                    ) : null}
                                                    {projectedInstallmentsTotal &&
                                                    projectedInstallmentsTotal > 0 &&
                                                    projectedSubscriptionsTotal &&
                                                    projectedSubscriptionsTotal > 0 ? (
                                                        <span className="text-muted-foreground/70">
                                                            {" "}
                                                            ·{" "}
                                                        </span>
                                                    ) : null}
                                                    {projectedSubscriptionsTotal &&
                                                    projectedSubscriptionsTotal > 0 ? (
                                                        <>
                                                            <span className="tabular-nums">
                                                                {currencyBRL(
                                                                    projectedSubscriptionsTotal
                                                                )}
                                                            </span>
                                                            <span className="text-muted-foreground/70">
                                                                {" "}
                                                                assinaturas
                                                            </span>
                                                        </>
                                                    ) : null}
                                                    <span className="text-muted-foreground/70">
                                                        )
                                                    </span>
                                                </>
                                            ) : null}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="min-w-0 justify-self-end space-y-1 text-right">
                                    <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                                        {overBudget ? "Acima do limite" : "Restante"}
                                    </p>
                                    <p
                                        className={cn(
                                            "truncate text-lg font-semibold tabular-nums leading-tight sm:text-xl md:text-2xl",
                                            overBudget && "text-destructive",
                                        )}
                                    >
                                        {currencyBRL(Math.abs(remaining))}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2 text-2xs text-muted-foreground">
                                    <span className="min-w-0 truncate">Uso do orçamento</span>
                                    <span className="shrink-0 tabular-nums font-medium text-foreground">
                                        {budgetPctRounded}%
                                    </span>
                                </div>
                                <div
                                    role="progressbar"
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={budgetPctRounded}
                                    aria-label={budgetBarLabel}
                                    className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                                >
                                    <div
                                        className="h-full max-w-full rounded-full transition-[width] duration-300 ease-out"
                                        style={{
                                            width: `${budgetPctRounded}%`,
                                            backgroundColor: budgetFillColor,
                                        }}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-1">
                            <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                                Gasto no mês
                            </p>
                            <p className="text-xl font-semibold tabular-nums leading-tight md:text-2xl">
                                {currencyBRL(monthTotal)}
                            </p>
                            <p className="text-xs text-muted-foreground">Sem orçamento definido</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </PageSection>
    )
}

function SummaryMetricCard({
    label,
    children,
    headerRight,
}: {
    label: string
    children: ReactNode
    headerRight?: ReactNode
}) {
    return (
        <Card
            padding="none"
            /* O `hover:ring-foreground/15` que morava aqui não desenhava nada: o
               `Card` só declara largura de anel no `focus-visible`, e este cartão
               não é clicável. Com ele saiu a transição, que não tinha o que animar. */
            className="h-full min-w-0"
        >
            <div className={categorySummaryHeaderClassName}>
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2 md:min-w-0 md:flex-1">
                    <p className={categorySummaryTitleClassName}>{label}</p>
                    {headerRight ? (
                        <div className="hidden shrink-0 justify-end md:flex">{headerRight}</div>
                    ) : null}
                </div>
                {headerRight ? <div className="md:hidden">{headerRight}</div> : null}
            </div>
            <CardContent
                className={cn(
                    "flex min-w-0 flex-col justify-center gap-0 pt-4 pb-4 md:pt-5 md:pb-5",
                    categorySummaryBodyClassName,
                    headerRight ? "min-h-[4.5rem]" : "min-h-[4.25rem]",
                )}
            >
                {children}
            </CardContent>
        </Card>
    )
}

export function CategoryDetailSummarySection({
    category,
    monthTotal,
    postedMonthTotal,
    projectedMonthTotal,
    projectedInstallmentsTotal,
    projectedSubscriptionsTotal,
    stats,
    limit,
    remaining,
    overBudget,
    workspaceTypeTotal,
    prevMonthCategoryTotal,
}: CategoryDetailSummarySectionProps) {
    const isExpense = category.type === "expense"
    const share = pctShare(monthTotal, workspaceTypeTotal)
    const prev = prevMonthCategoryTotal
    const momBadge = buildMomBadgeModel(prev, monthTotal, isExpense)

    const primaryLabel = isExpense ? "Gasto no mês" : "Recebido no mês"

    return (
        <section className="space-y-3" aria-label="Resumo do mês">
            <div
                className={cn(
                    "grid gap-3 md:gap-4",
                    isExpense
                        ? stats.count > 0
                            ? "grid-cols-1"
                            : "grid-cols-1 md:grid-cols-1"
                        : "grid-cols-2 md:grid-cols-4",
                )}
            >
                {!isExpense ? (
                    <>
                        <SummaryMetricCard
                            label={primaryLabel}
                            headerRight={momBadge.show ? <MomBadge model={momBadge} /> : undefined}
                        >
                            <p className="text-lg font-semibold tabular-nums leading-tight md:text-xl">
                                {currencyBRL(monthTotal)}
                            </p>
                        </SummaryMetricCard>
                        <SummaryMetricCard label="Média / lançamento">
                            <p className="text-lg font-semibold tabular-nums leading-tight md:text-xl">
                                {stats.count > 0 ? currencyBRL(stats.avg) : "—"}
                            </p>
                        </SummaryMetricCard>
                        <SummaryMetricCard label="Maior · menor">
                            <p className="text-sm font-semibold tabular-nums leading-snug md:text-base">
                                {stats.count > 0
                                    ? `${currencyBRL(stats.max)} · ${currencyBRL(stats.min)}`
                                    : "—"}
                            </p>
                        </SummaryMetricCard>
                        <SummaryMetricCard label="% das receitas do mês">
                            <p className="text-lg font-semibold tabular-nums leading-tight md:text-xl">
                                {share !== null ? `${share}%` : "—"}
                            </p>
                        </SummaryMetricCard>
                    </>
                ) : null}

                {isExpense ? (
                    stats.count > 0 ? (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-6 md:gap-4">
                            <ExpenseBudgetOverviewCard
                                limit={limit}
                                remaining={remaining}
                                overBudget={overBudget}
                                monthTotal={monthTotal}
                                postedMonthTotal={postedMonthTotal}
                                projectedMonthTotal={projectedMonthTotal}
                                projectedInstallmentsTotal={projectedInstallmentsTotal}
                                projectedSubscriptionsTotal={projectedSubscriptionsTotal}
                                budgetHeaderRight={momBadge.show ? <MomBadge model={momBadge} /> : undefined}
                            />
                        </div>
                    ) : (
                        <ExpenseBudgetOverviewCard
                            limit={limit}
                            remaining={remaining}
                            overBudget={overBudget}
                            monthTotal={monthTotal}
                            postedMonthTotal={postedMonthTotal}
                            projectedMonthTotal={projectedMonthTotal}
                            projectedInstallmentsTotal={projectedInstallmentsTotal}
                            projectedSubscriptionsTotal={projectedSubscriptionsTotal}
                            budgetHeaderRight={momBadge.show ? <MomBadge model={momBadge} /> : undefined}
                        />
                    )
                ) : null}
            </div>
        </section>
    )
}
