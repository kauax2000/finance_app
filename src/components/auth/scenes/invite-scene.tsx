import { HomeModernIcon, ShoppingCartIcon, WifiIcon } from "@heroicons/react/16/solid"

import { AvatarGroup, AvatarGroupItem } from "@/components/ui/avatar-group"
import { Card, CardNote, CardToolbar } from "@/components/ui/card"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"

const DIVIDIDO = [
    { icon: HomeModernIcon, titulo: "Aluguel", detalhe: "dividido em 2", valor: 1075 },
    { icon: ShoppingCartIcon, titulo: "Mercado", detalhe: "quem pagou anota", valor: 412.3 },
    { icon: WifiIcon, titulo: "Internet", detalhe: "todo dia 10", valor: 59.95 },
] as const

/** A cena do convite: uma carteira dividida, do jeito que ela vai ficar. */
export function InviteScene() {
    return (
        <Card variant="elevated" padding="none">
            <CardToolbar variant="title">
                Carteira compartilhada
                <AvatarGroup label="Quem já está na carteira" size="sm">
                    <AvatarGroupItem name="Marina Costa" />
                    <AvatarGroupItem name="Rafael Lima" />
                </AvatarGroup>
            </CardToolbar>
            <ItemGroup variant="divided">
                {DIVIDIDO.map(({ icon: Icon, titulo, detalhe, valor }) => (
                    <Item key={titulo} size="md">
                        <ItemMedia variant="icon"><Icon /></ItemMedia>
                        <ItemContent>
                            <ItemTitle>{titulo}</ItemTitle>
                            <ItemDescription>{detalhe}</ItemDescription>
                        </ItemContent>
                        <ItemActions><MoneyDisplay value={valor} size="md" /></ItemActions>
                    </Item>
                ))}
            </ItemGroup>
            <CardNote>Números de exemplo.</CardNote>
        </Card>
    )
}
