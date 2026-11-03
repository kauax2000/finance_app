"use client"

import { useState } from "react"

import { GuiaDoApplePay } from "@/components/account/guia-do-apple-pay"
import { JanelaDoAparelho, TELA_DA_NOTIFICACAO } from "@/components/account/passo-a-passo"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Muted, P } from "@/components/ui/typography"

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
                <div className="flex items-center gap-4 p-4">
                    <JanelaDoAparelho tela={TELA_DA_NOTIFICACAO} tamanho="mini" />
                    <div className="flex min-w-0 flex-col items-start gap-3">
                        <div>
                            <P className="font-semibold">Lance ao pagar com Apple Pay</P>
                            <Muted>Cada compra com o iPhone vira um gasto, sem abrir nada.</Muted>
                        </div>
                        <Button type="button" variant="secondary" onClick={() => setGuiaAberto(true)}>
                            Configurar
                        </Button>
                    </div>
                </div>
            </Card>
            <GuiaDoApplePay open={guiaAberto} onOpenChange={setGuiaAberto} />
        </>
    )
}
