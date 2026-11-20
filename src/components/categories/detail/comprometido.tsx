"use client"

import { Card } from "@/components/ui/card"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { PageSection, PageSectionHeader, PageSectionMeta, PageSectionTitle } from "@/components/ui/page-section"
import { subscriptionBillingIntervalLabel } from "@/components/subscriptions/subscription-form-shared"
import { parseYearMonth } from "@/lib/budget-month"
import type { TipoDaCategoria } from "@/lib/categoria-detalhe"
import { currencyBRL } from "@/lib/formatters"
import type { WorkspaceInstallmentPlan, WorkspaceSubscription } from "@/lib/supabase"
import { formatMonthLongPtBr } from "@/lib/transaction-date"

/** As parcelas e assinaturas ativas da categoria, com o que ainda cai no mês. Sem nenhuma, não aparece. */
export function Comprometido({
    tipo,
    yearMonth,
    parcelas,
    assinaturas,
    previstoNoMes,
}: {
    tipo: TipoDaCategoria
    yearMonth: string
    parcelas: WorkspaceInstallmentPlan[]
    assinaturas: WorkspaceSubscription[]
    previstoNoMes: number
}) {
    const ativas = parcelas.filter((p) => p.is_active)
    const recorrentes = assinaturas.filter((s) => s.is_active)
    if (ativas.length === 0 && recorrentes.length === 0) return null

    const { y, m } = parseYearMonth(yearMonth)
    const mes = formatMonthLongPtBr(new Date(y, m - 1, 1))

    return (
        <PageSection>
            <PageSectionHeader
                actions={
                    previstoNoMes > 0 ? (
                        <PageSectionMeta>
                            Previsto em {mes}{" "}
                            <span className="font-medium text-foreground">{currencyBRL(previstoNoMes)}</span>
                        </PageSectionMeta>
                    ) : null
                }
            >
                <PageSectionTitle>{tipo === "expense" ? "Comprometido" : "Recorrente"}</PageSectionTitle>
            </PageSectionHeader>
            <Card padding="none">
                <ItemGroup variant="divided">
                    {ativas.map((p) => (
                        <Item key={p.id} variant="flush">
                            <ItemContent>
                                <ItemTitle>{p.description || "Compra parcelada"}</ItemTitle>
                                <ItemDescription className="nums">
                                    {p.generated_count}/{p.total_installments} · {currencyBRL(p.installment_amount)}/mês
                                </ItemDescription>
                            </ItemContent>
                        </Item>
                    ))}
                    {recorrentes.map((s) => (
                        <Item key={s.id} variant="flush">
                            <ItemContent>
                                <ItemTitle>{s.name}</ItemTitle>
                                <ItemDescription className="nums">
                                    {currencyBRL(s.amount)} · {subscriptionBillingIntervalLabel(s.billing_interval)}
                                </ItemDescription>
                            </ItemContent>
                        </Item>
                    ))}
                </ItemGroup>
            </Card>
        </PageSection>
    )
}
