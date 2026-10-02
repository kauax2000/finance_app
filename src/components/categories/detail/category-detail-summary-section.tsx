"use client"

import {
    PageSection,
    PageSectionHeader,
    PageSectionTitle,
} from "@/components/ui/page-section"
import {
    StatCard,
    StatCardDelta,
    StatCardFooter,
    StatCardGroup,
    StatCardHeader,
    StatCardLabel,
    StatCardProgress,
    StatCardRange,
    StatCardValue,
} from "@/components/ui/stat-card"
import type { Category } from "@/lib/supabase"
import { currencyBRL } from "@/lib/formatters"

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

/** Contra o quê a variação compara — o `aria-label` e o `title` do chip. */
const MOM_CONTEXT = "em relação ao mês anterior"

function pctShare(part: number, whole: number): number | null {
    if (whole <= 0 || part <= 0) return null
    return (part / whole) * 100
}

/** "Registrado R$ … · + R$ … previstos (R$ … parcelas · R$ … assinaturas)". */
function ProjectionNote({
    postedMonthTotal,
    projectedMonthTotal,
    projectedInstallmentsTotal = 0,
    projectedSubscriptionsTotal = 0,
}: {
    postedMonthTotal?: number
    projectedMonthTotal: number
    projectedInstallmentsTotal?: number
    projectedSubscriptionsTotal?: number
}) {
    const hasInstallments = projectedInstallmentsTotal > 0
    const hasSubscriptions = projectedSubscriptionsTotal > 0
    return (
        <StatCardFooter className="leading-snug">
            Registrado{" "}
            <span className="nums">{currencyBRL(postedMonthTotal ?? 0)}</span>{" "}
            <span className="text-muted-foreground/70">·</span> +{" "}
            <span className="nums">{currencyBRL(projectedMonthTotal)}</span> previstos
            {hasInstallments || hasSubscriptions ? (
                <>
                    {" "}
                    <span className="text-muted-foreground/70">(</span>
                    {hasInstallments ? (
                        <>
                            <span className="nums">{currencyBRL(projectedInstallmentsTotal)}</span>
                            <span className="text-muted-foreground/70"> parcelas</span>
                        </>
                    ) : null}
                    {hasInstallments && hasSubscriptions ? (
                        <span className="text-muted-foreground/70"> · </span>
                    ) : null}
                    {hasSubscriptions ? (
                        <>
                            <span className="nums">{currencyBRL(projectedSubscriptionsTotal)}</span>
                            <span className="text-muted-foreground/70"> assinaturas</span>
                        </>
                    ) : null}
                    <span className="text-muted-foreground/70">)</span>
                </>
            ) : null}
        </StatCardFooter>
    )
}

function ExpenseBudgetOverviewCard({
    limit,
    remaining,
    overBudget,
    monthTotal,
    prevMonthTotal,
    postedMonthTotal,
    projectedMonthTotal,
    projectedInstallmentsTotal,
    projectedSubscriptionsTotal,
}: {
    limit: number
    remaining: number
    overBudget: boolean
    monthTotal: number
    prevMonthTotal: number
    postedMonthTotal?: number
    projectedMonthTotal?: number
    projectedInstallmentsTotal?: number
    projectedSubscriptionsTotal?: number
}) {
    const hasBudget = limit > 0
    // Sem o teto de 100: a barra satura, e quem diz **o quanto** passou é o
    // número. Ver a mesma nota em `expense-category-card`.
    const budgetPctReal = hasBudget
        ? Math.max(0, Math.round((monthTotal / limit) * 100))
        : 0
    const budgetBarLabel = `Uso do orçamento: ${budgetPctReal}% de ${currencyBRL(limit)}${monthTotal > limit ? ", acima do limite" : ""}`

    return (
        <PageSection>
            <PageSectionHeader
                actions={
                    hasBudget ? (
                        <p className="nums text-2xs text-muted-foreground">
                            Limite{" "}
                            <span className="font-medium text-foreground">{currencyBRL(limit)}</span>
                        </p>
                    ) : (
                        <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                            Sem limite
                        </p>
                    )
                }
            >
                <PageSectionTitle className="truncate">Orçamento do mês</PageSectionTitle>
            </PageSectionHeader>

            <StatCard tone="expense" className="min-w-0">
                <StatCardHeader>
                    <StatCardLabel>{hasBudget ? "Gasto" : "Gasto no mês"}</StatCardLabel>
                    <StatCardDelta
                        current={monthTotal}
                        previous={prevMonthTotal}
                        better="down"
                        context={MOM_CONTEXT}
                    />
                </StatCardHeader>
                <StatCardValue value={monthTotal} />
                {!hasBudget ? (
                    <StatCardFooter>Sem orçamento definido</StatCardFooter>
                ) : projectedMonthTotal && projectedMonthTotal > 0 ? (
                    <ProjectionNote
                        postedMonthTotal={postedMonthTotal}
                        projectedMonthTotal={projectedMonthTotal}
                        projectedInstallmentsTotal={projectedInstallmentsTotal}
                        projectedSubscriptionsTotal={projectedSubscriptionsTotal}
                    />
                ) : null}
                {hasBudget ? (
                    <StatCardProgress value={monthTotal} max={limit} label={budgetBarLabel}>
                        {overBudget ? "Acima do limite " : "Restante "}
                        <span className={overBudget ? "nums font-medium text-destructive" : "nums font-medium text-foreground"}>
                            {currencyBRL(Math.abs(remaining))}
                        </span>
                    </StatCardProgress>
                ) : null}
            </StatCard>
        </PageSection>
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
    const share = pctShare(monthTotal, workspaceTypeTotal)

    return (
        <section className="space-y-3" aria-label="Resumo do mês">
            {category.type === "expense" ? (
                <ExpenseBudgetOverviewCard
                    limit={limit}
                    remaining={remaining}
                    overBudget={overBudget}
                    monthTotal={monthTotal}
                    prevMonthTotal={prevMonthCategoryTotal}
                    postedMonthTotal={postedMonthTotal}
                    projectedMonthTotal={projectedMonthTotal}
                    projectedInstallmentsTotal={projectedInstallmentsTotal}
                    projectedSubscriptionsTotal={projectedSubscriptionsTotal}
                />
            ) : (
                <StatCardGroup columns={4}>
                    <StatCard tone="income">
                        <StatCardHeader>
                            <StatCardLabel>Recebido no mês</StatCardLabel>
                            <StatCardDelta
                                current={monthTotal}
                                previous={prevMonthCategoryTotal}
                                better="up"
                                context={MOM_CONTEXT}
                            />
                        </StatCardHeader>
                        <StatCardValue value={monthTotal} />
                    </StatCard>
                    <StatCard>
                        <StatCardHeader>
                            <StatCardLabel>Média / lançamento</StatCardLabel>
                        </StatCardHeader>
                        {stats.count > 0 ? (
                            <StatCardValue value={stats.avg} />
                        ) : (
                            <StatCardValue>—</StatCardValue>
                        )}
                    </StatCard>
                    <StatCard>
                        <StatCardHeader>
                            <StatCardLabel>Menor – maior</StatCardLabel>
                        </StatCardHeader>
                        {stats.count > 0 ? (
                            <StatCardRange min={stats.min} max={stats.max} />
                        ) : (
                            <StatCardValue>—</StatCardValue>
                        )}
                    </StatCard>
                    <StatCard>
                        <StatCardHeader>
                            <StatCardLabel>% das receitas do mês</StatCardLabel>
                        </StatCardHeader>
                        {share !== null ? (
                            <StatCardValue value={share} format="percent" />
                        ) : (
                            <StatCardValue>—</StatCardValue>
                        )}
                    </StatCard>
                </StatCardGroup>
            )}
        </section>
    )
}
