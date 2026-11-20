"use client"

import { Card, CardToolbar } from "@/components/ui/card"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import { PageSection, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import type { TipoDaCategoria } from "@/lib/categoria-detalhe"
import { currencyBRL } from "@/lib/formatters"
import type { Transaction } from "@/lib/supabase"
import { formatDatePtBr } from "@/lib/transaction-date"

/** Os maiores lançamentos do mês (tocar abre o detalhe) e as descrições que mais se repetem. */
export function ParaOndeVai({
    tipo,
    maiores,
    repetidas,
    onAbrir,
}: {
    tipo: TipoDaCategoria
    maiores: Transaction[]
    repetidas: { descricao: string; vezes: number; total: number }[]
    onAbrir: (t: Transaction) => void
}) {
    if (maiores.length === 0 && repetidas.length === 0) return null

    return (
        <PageSection>
            <PageSectionHeader>
                <PageSectionTitle>{tipo === "expense" ? "Para onde vai" : "De onde vem"}</PageSectionTitle>
            </PageSectionHeader>
            <div className="grid gap-3">
                {maiores.length > 0 ? (
                    <Card padding="none">
                        <CardToolbar>{tipo === "expense" ? "Maiores gastos" : "Maiores entradas"}</CardToolbar>
                        <ItemGroup variant="divided">
                            {maiores.map((t) => (
                                <Item key={t.id} variant="flush" interactive asChild>
                                    <button type="button" onClick={() => onAbrir(t)}>
                                        <ItemContent>
                                            <ItemTitle>{t.description || "Sem descrição"}</ItemTitle>
                                            <ItemDescription>{formatDatePtBr(t.date)}</ItemDescription>
                                        </ItemContent>
                                        <ItemActions>
                                            <MoneyDisplay value={Number(t.amount)} />
                                        </ItemActions>
                                    </button>
                                </Item>
                            ))}
                        </ItemGroup>
                    </Card>
                ) : null}
                {repetidas.length > 0 ? (
                    <Card padding="none">
                        <CardToolbar>Mais repetidos</CardToolbar>
                        <ItemGroup variant="divided">
                            {repetidas.map((r) => (
                                <Item key={r.descricao} variant="flush">
                                    <ItemContent>
                                        <ItemTitle className="nums">
                                            {r.descricao} · {r.vezes}× · {currencyBRL(r.total)}
                                        </ItemTitle>
                                    </ItemContent>
                                </Item>
                            ))}
                        </ItemGroup>
                    </Card>
                ) : null}
            </div>
        </PageSection>
    )
}
