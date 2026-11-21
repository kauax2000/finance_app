"use client"

import { ArrowPathIcon, CalendarDaysIcon, ReceiptPercentIcon, ShoppingBagIcon } from "@heroicons/react/16/solid"
import {
    StatCard,
    StatCardFooter,
    StatCardGroup,
    StatCardHeader,
    StatCardIcon,
    StatCardLabel,
    StatCardValue,
} from "@/components/ui/stat-card"
import type { TipoDaCategoria } from "@/lib/categoria-detalhe"
import type { compraTipica, diaDeMaisGasto, maisFrequente } from "@/lib/categoria-resumo"
import { currencyBRL } from "@/lib/formatters"
import type { Transaction } from "@/lib/supabase"
import { transactionLocalYmd } from "@/lib/transaction-date"
import { diaEMes } from "./rotulos"

/** Os quatro números do mês com ícone; cada um some sem dado, e sem nenhum o grupo não aparece. */
export function CartoesDoGasto({
    tipo,
    maior,
    tipica,
    frequente,
    diaDeMais,
}: {
    tipo: TipoDaCategoria
    /** O maior lançamento do mês (`maioresLancamentos(...)[0]`), ou null. */
    maior: Transaction | null
    tipica: ReturnType<typeof compraTipica>
    frequente: ReturnType<typeof maisFrequente>
    diaDeMais: ReturnType<typeof diaDeMaisGasto>
}) {
    const despesa = tipo === "expense"
    if (!maior && tipica == null && !frequente && !diaDeMais) return null
    const dataDoMaior = maior ? transactionLocalYmd(maior.date) : null

    return (
        <StatCardGroup>
            {maior ? (
                <StatCard>
                    <StatCardHeader>
                        <StatCardLabel>
                            <StatCardIcon>
                                <ShoppingBagIcon />
                            </StatCardIcon>
                            {despesa ? "Maior compra" : "Maior entrada"}
                        </StatCardLabel>
                    </StatCardHeader>
                    <StatCardValue value={Number(maior.amount)} />
                    <StatCardFooter className="truncate">
                        {[maior.description?.trim() || "Sem descrição", dataDoMaior ? diaEMes(dataDoMaior) : null]
                            .filter(Boolean)
                            .join(" · ")}
                    </StatCardFooter>
                </StatCard>
            ) : null}
            {tipica != null ? (
                <StatCard>
                    <StatCardHeader>
                        <StatCardLabel>
                            <StatCardIcon>
                                <ReceiptPercentIcon />
                            </StatCardIcon>
                            {despesa ? "Compra típica" : "Entrada típica"}
                        </StatCardLabel>
                    </StatCardHeader>
                    <StatCardValue value={tipica} />
                    <StatCardFooter>
                        {despesa ? "Metade custa menos que isso" : "Metade vale menos que isso"}
                    </StatCardFooter>
                </StatCard>
            ) : null}
            {frequente ? (
                <StatCard>
                    <StatCardHeader>
                        <StatCardLabel>
                            <StatCardIcon>
                                <ArrowPathIcon />
                            </StatCardIcon>
                            Mais frequente
                        </StatCardLabel>
                    </StatCardHeader>
                    <StatCardValue className="truncate font-sans">{frequente.descricao}</StatCardValue>
                    <StatCardFooter className="nums">
                        {frequente.vezes}× no mês · {currencyBRL(frequente.total)}
                    </StatCardFooter>
                </StatCard>
            ) : null}
            {diaDeMais ? (
                <StatCard>
                    <StatCardHeader>
                        <StatCardLabel>
                            <StatCardIcon>
                                <CalendarDaysIcon />
                            </StatCardIcon>
                            {despesa ? "Dia mais caro" : "Melhor dia"}
                        </StatCardLabel>
                    </StatCardHeader>
                    <StatCardValue className="font-sans">{diaEMes(diaDeMais.ymd)}</StatCardValue>
                    <StatCardFooter className="nums">
                        {currencyBRL(diaDeMais.total)} em {diaDeMais.quantidade}{" "}
                        {diaDeMais.quantidade === 1 ? "lançamento" : "lançamentos"}
                    </StatCardFooter>
                </StatCard>
            ) : null}
        </StatCardGroup>
    )
}
