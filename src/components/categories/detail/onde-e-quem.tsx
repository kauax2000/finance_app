"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartBarList } from "@/components/ui/chart"
import { PageSection, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import type { Fatia, TipoDaCategoria } from "@/lib/categoria-detalhe"

/** A divisão do mês por forma de pagamento e por pessoa; "Por pessoa" some com uma fatia só. */
export function OndeEQuem({
    tipo,
    porPagamento,
    porMembro,
}: {
    tipo: TipoDaCategoria
    porPagamento: Fatia[]
    porMembro: Fatia[]
}) {
    if (porPagamento.length === 0 && porMembro.length < 2) return null
    const oQue = tipo === "expense" ? "O gasto" : "A receita"

    return (
        <PageSection>
            <PageSectionHeader>
                <PageSectionTitle>Onde e quem</PageSectionTitle>
            </PageSectionHeader>
            <div className="grid gap-3 sm:grid-cols-2">
                {porPagamento.length > 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle size="sm">Por forma de pagamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartBarList
                                data={porPagamento}
                                nameKey="nome"
                                dataKey="valor"
                                share
                                label={`${oQue} do mês por forma de pagamento`}
                            />
                        </CardContent>
                    </Card>
                ) : null}
                {porMembro.length > 1 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle size="sm">Por pessoa</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartBarList
                                data={porMembro}
                                nameKey="nome"
                                dataKey="valor"
                                share
                                label={`${oQue} do mês por pessoa`}
                            />
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        </PageSection>
    )
}
