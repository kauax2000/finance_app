"use client"

import { PageSection, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import {
    StatCard,
    StatCardDelta,
    StatCardFooter,
    StatCardGroup,
    StatCardHeader,
    StatCardLabel,
    StatCardValue,
} from "@/components/ui/stat-card"
import { parseYearMonth } from "@/lib/budget-month"
import type { Comparacao, TipoDaCategoria } from "@/lib/categoria-detalhe"
import { currencyBRL } from "@/lib/formatters"
import { formatMonthLongPtBr } from "@/lib/transaction-date"

/** "Isso é normal?": o mês contra o mesmo ponto do anterior, e a média de 6 meses. */
export function Comparacoes({
    tipo,
    comparacao,
    media,
}: {
    tipo: TipoDaCategoria
    comparacao: Comparacao
    media: number | null
}) {
    const { y, m } = parseYearMonth(comparacao.mesAnterior)
    const mes = formatMonthLongPtBr(new Date(y, m - 1, 1))
    const legenda = comparacao.mesmoPonto ? `vs mesmo dia de ${mes}` : `vs ${mes}`
    const contexto = comparacao.mesmoPonto
        ? `em relação ao mesmo dia de ${mes}`
        : `em relação a ${mes}`

    return (
        <PageSection>
            <PageSectionHeader>
                <PageSectionTitle>Comparação</PageSectionTitle>
            </PageSectionHeader>
            <StatCardGroup columns={2}>
                <StatCard size="sm">
                    <StatCardHeader>
                        <StatCardLabel>{comparacao.mesmoPonto ? "Até hoje" : "No mês"}</StatCardLabel>
                        <StatCardDelta
                            current={comparacao.atual}
                            previous={comparacao.anterior}
                            better={tipo === "expense" ? "down" : "up"}
                            context={contexto}
                        />
                    </StatCardHeader>
                    <StatCardValue value={comparacao.atual} />
                    <StatCardFooter>
                        {legenda} · <span className="nums">{currencyBRL(comparacao.anterior)}</span>
                    </StatCardFooter>
                </StatCard>
                {media !== null ? (
                    <StatCard size="sm">
                        <StatCardHeader>
                            <StatCardLabel>Média de 6 meses</StatCardLabel>
                        </StatCardHeader>
                        <StatCardValue value={media} />
                    </StatCard>
                ) : null}
            </StatCardGroup>
        </PageSection>
    )
}
