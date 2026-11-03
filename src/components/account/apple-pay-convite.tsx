"use client"

import { CreditCardIcon } from "@heroicons/react/16/solid"
import { useState } from "react"

import { GuiaDoApplePay } from "@/components/account/guia-do-apple-pay"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"

/**
 * O convite para lançar ao pagar: a automação da Carteira roda o Lançar gasto a
 * cada compra com Apple Pay. Mora em "Lançar gastos pelo iPhone" e só aparece com
 * um aparelho conectado, porque a automação usa o atalho que aquele guia instala.
 */
export function ApplePayConvite() {
    const [guiaAberto, setGuiaAberto] = useState(false)
    return (
        <>
            <Card padding="none">
                <Item variant="flush" className="px-4">
                    <ItemMedia variant="tile">
                        <CreditCardIcon />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                        <ItemTitle>Lançar ao pagar com Apple Pay</ItemTitle>
                        <ItemDescription>Toda compra com o iPhone vira um gasto, sem você abrir nada.</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                        <Button type="button" variant="secondary" onClick={() => setGuiaAberto(true)}>
                            Configurar
                        </Button>
                    </ItemActions>
                </Item>
            </Card>
            <GuiaDoApplePay open={guiaAberto} onOpenChange={setGuiaAberto} />
        </>
    )
}
