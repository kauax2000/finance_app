"use client"

import { ArrowPathIcon, CalendarDaysIcon, ReceiptPercentIcon, ShoppingBagIcon } from "@heroicons/react/20/solid"
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
import { TILE_EXPENSE_DEFAULT, TILE_INCOME_DEFAULT, TILE_PALETTE, tileColorFor } from "@/lib/tile-palette"
import { diaEMes } from "./rotulos"

const paleta = (nome: string) => TILE_PALETTE.find((p) => p.nome === nome)?.hex ?? null

/** Os destaques do mês: quatro números com ícone; cada um some sem dado, e sem nenhum o grupo não aparece. */
export function DestaquesDoMes({
    tipo,
    cor,
    maior,
    tipica,
    frequente,
    diaDeMais,
    className,
}: {
    tipo: TipoDaCategoria
    /** `categories.color`: o primeiro cartão leva a cor da categoria, os outros três um matiz cada da paleta de ladrilhos. */
    cor: string | null
    /** O maior lançamento do mês (`maioresLancamentos(...)[0]`), ou null. */
    maior: Transaction | null
    tipica: ReturnType<typeof compraTipica>
    frequente: ReturnType<typeof maisFrequente>
    diaDeMais: ReturnType<typeof diaDeMaisGasto>
    /** Vai ao `StatCardGroup` (ex.: duas colunas quando o grupo ocupa meia linha). */
    className?: string
}) {
    const despesa = tipo === "expense"
    if (!maior && tipica == null && !frequente && !diaDeMais) return null
    const corDaCategoria = tileColorFor(cor) ?? (despesa ? TILE_EXPENSE_DEFAULT : TILE_INCOME_DEFAULT)
    const dataDoMaior = maior ? transactionLocalYmd(maior.date) : null

    return (
        <StatCardGroup className={className}>
            {maior ? (
                <StatCard>
                    <StatCardIcon size="lg" color={corDaCategoria}>
                        <ShoppingBagIcon className="size-5" />
                    </StatCardIcon>
                    <StatCardHeader>
                        <StatCardLabel variant="plain">{despesa ? "Maior compra" : "Maior entrada"}</StatCardLabel>
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
                    <StatCardIcon size="lg" color={paleta("azul")}>
                        <ReceiptPercentIcon className="size-5" />
                    </StatCardIcon>
                    <StatCardHeader>
                        <StatCardLabel variant="plain">{despesa ? "Compra típica" : "Entrada típica"}</StatCardLabel>
                    </StatCardHeader>
                    <StatCardValue value={tipica} />
                    <StatCardFooter>
                        {despesa ? "Metade custa menos que isso" : "Metade vale menos que isso"}
                    </StatCardFooter>
                </StatCard>
            ) : null}
            {frequente ? (
                <StatCard>
                    <StatCardIcon size="lg" color={paleta("violeta")}>
                        <ArrowPathIcon className="size-5" />
                    </StatCardIcon>
                    <StatCardHeader>
                        <StatCardLabel variant="plain">Mais frequente</StatCardLabel>
                    </StatCardHeader>
                    <StatCardValue className="truncate font-sans">{frequente.descricao}</StatCardValue>
                    <StatCardFooter className="nums">
                        {frequente.vezes}× no mês · {currencyBRL(frequente.total)}
                    </StatCardFooter>
                </StatCard>
            ) : null}
            {diaDeMais ? (
                <StatCard>
                    <StatCardIcon size="lg" color={paleta("lima")}>
                        <CalendarDaysIcon className="size-5" />
                    </StatCardIcon>
                    <StatCardHeader>
                        <StatCardLabel variant="plain">{despesa ? "Dia mais caro" : "Melhor dia"}</StatCardLabel>
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
