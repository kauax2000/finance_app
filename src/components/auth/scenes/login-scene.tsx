import { BanknotesIcon, BoltIcon, CreditCardIcon, HomeModernIcon } from "@heroicons/react/16/solid"

import { Badge } from "@/components/ui/badge"
import { Card, CardNote, CardToolbar } from "@/components/ui/card"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
    StatCard,
    StatCardChart,
    StatCardHeader,
    StatCardIcon,
    StatCardLabel,
    StatCardValue,
} from "@/components/ui/stat-card"

/** Números de exemplo, autorados com fidelidade; nenhuma alegação comercial. */
const SALDO = [
    { dia: 1, saldo: 3120 }, { dia: 5, saldo: 2890 }, { dia: 10, saldo: 4410 },
    { dia: 15, saldo: 3980 }, { dia: 20, saldo: 4630 }, { dia: 25, saldo: 4182.6 },
]

const PROXIMAS = [
    { icon: CreditCardIcon, titulo: "Fatura do cartão", quando: "fatura aberta", valor: 1284.6, urgente: true },
    { icon: HomeModernIcon, titulo: "Aluguel", quando: "em 4 dias", valor: 2150 },
    { icon: BoltIcon, titulo: "Energia", quando: "em 9 dias", valor: 186.4 },
] as const

/**
 * A cena do login: o mês de quem volta, de relance.
 *
 * A subida em cascata é a do `stat-card-reveal` (o `StatCard` entra); a
 * utility genérica de entrada não existe no sistema, então o cartão de contas
 * não sobe junto.
 */
export function LoginScene() {
    return (
        <div className="stat-card-reveal flex flex-col gap-4">
            <StatCard size="lg" tone="income">
                <StatCardHeader>
                    <StatCardLabel>
                        <StatCardIcon>
                            <BanknotesIcon />
                        </StatCardIcon>
                        Saldo de outubro
                    </StatCardLabel>
                </StatCardHeader>
                <StatCardValue value={SALDO[SALDO.length - 1].saldo} />
                <StatCardChart data={SALDO} y="saldo" label="Saldo" variant="area" />
            </StatCard>
            <Card variant="elevated" padding="none">
                <CardToolbar variant="title">Próximas contas</CardToolbar>
                <ItemGroup variant="divided">
                    {PROXIMAS.map(({ icon: Icon, titulo, quando, valor, ...p }) => (
                        <Item key={titulo} size="md">
                            <ItemMedia variant="icon"><Icon /></ItemMedia>
                            <ItemContent>
                                <ItemTitle>{titulo}</ItemTitle>
                                <ItemDescription>{quando}</ItemDescription>
                            </ItemContent>
                            <ItemActions>
                                {"urgente" in p ? <Badge tone="warning" size="xs">amanhã</Badge> : null}
                                <MoneyDisplay value={valor} size="md" />
                            </ItemActions>
                        </Item>
                    ))}
                </ItemGroup>
                <CardNote>Números de exemplo.</CardNote>
            </Card>
        </div>
    )
}
