"use client"

import {
    StatCard,
    StatCardFooter,
    StatCardGroup,
    StatCardHeader,
    StatCardLabel,
    StatCardValue,
    StatCardValueSkeleton,
} from "@/components/ui/stat-card"
import { cn } from "@/lib/utils"
import type { Resumo } from "@/lib/queries/transacoes-filtradas"

type Props = { resumo: Resumo | undefined; pendente: boolean }

export function ResumoDasTransacoes({ resumo, pendente }: Props) {
    const valor = (n: number, signed = true) =>
        resumo ? <StatCardValue value={n} signed={signed} /> : <StatCardValueSkeleton />
    return (
        <StatCardGroup
            variant="joined"
            aria-label="Resumo dos lançamentos filtrados"
            className={cn("transition-opacity", pendente && "opacity-60")}
        >
            <StatCard size="sm" tone="expense">
                <StatCardHeader>
                    <StatCardLabel>Saídas</StatCardLabel>
                </StatCardHeader>
                {valor(-(resumo?.saidas ?? 0))}
                {resumo?.truncado ? <StatCardFooter>Somando os primeiros 10.000</StatCardFooter> : null}
            </StatCard>
            <StatCard size="sm" tone="income">
                <StatCardHeader>
                    <StatCardLabel>Entradas</StatCardLabel>
                </StatCardHeader>
                {valor(resumo?.entradas ?? 0)}
            </StatCard>
            <StatCard size="sm" tone={(resumo?.resultado ?? 0) < 0 ? "expense" : "income"} className="max-md:hidden">
                <StatCardHeader>
                    <StatCardLabel>Resultado</StatCardLabel>
                </StatCardHeader>
                {valor(resumo?.resultado ?? 0)}
            </StatCard>
            <StatCard size="sm" className="max-md:hidden">
                <StatCardHeader>
                    <StatCardLabel>Lançamentos</StatCardLabel>
                </StatCardHeader>
                {resumo ? <StatCardValue value={resumo.quantidade} format="number" /> : <StatCardValueSkeleton />}
            </StatCard>
        </StatCardGroup>
    )
}
