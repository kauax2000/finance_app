"use client"

import { useState } from "react"

import { useAparelhosDeCaptura } from "@/components/account/aparelhos-de-captura"
import { GuiaDoAtalho } from "@/components/account/guia-do-atalho"
import { LancarPeloIphoneVazio } from "@/components/account/lancar-pelo-iphone-vazio"
import { Card } from "@/components/ui/card"

/** Na página Você, no iPhone instalado e até o primeiro aparelho: o convite de lançar pelo iPhone, com o guia. */
export function CartaoDeLancar() {
    const lista = useAparelhosDeCaptura()
    const [aberto, setAberto] = useState(false)
    return (
        <>
            <Card padding="none">
                <LancarPeloIphoneVazio onConectar={() => setAberto(true)} />
            </Card>
            <GuiaDoAtalho
                open={aberto}
                onOpenChange={setAberto}
                aoCriar={() => void lista.refetch()}
                nomesEmUso={lista.ativos.map((t) => t.name)}
            />
        </>
    )
}
