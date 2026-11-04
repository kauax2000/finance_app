"use client"

import { useState } from "react"

import { GuiaDoApplePay } from "@/components/account/guia-do-apple-pay"
import { useLancarAoPagar } from "@/components/account/lancar-ao-pagar"
import { JanelaDoAparelho, TELA_DA_CARTEIRA } from "@/components/account/passo-a-passo"
import { Badge, BadgeDot } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SkeletonText } from "@/components/ui/skeleton"
import { Muted, P } from "@/components/ui/typography"
import { toastError } from "@/lib/toast"

/**
 * Lançar ao pagar: a automação da Carteira roda o Lançar gasto a cada compra com
 * Apple Pay. Mora em "Lançar pelo iPhone" e só aparece com um aparelho
 * conectado, porque a automação usa o atalho que aquele guia instala. O cartão
 * muda com o estado: Configurar; Aguardando a 1ª compra (o Pronto do guia, salvo
 * na conta); Funcionando (a primeira compra pelo Apple Pay chegou).
 */
export function ApplePayConvite() {
    const [guiaAberto, setGuiaAberto] = useState(false)
    const { carregando, estado, marcarConfigurado } = useLancarAoPagar()

    async function concluir() {
        try {
            await marcarConfigurado()
        } catch {
            toastError("Não foi possível salvar. Tente terminar o guia de novo.")
        }
    }

    return (
        <>
            <Card padding="none">
                <div className="flex items-center gap-4 px-4 pt-4">
                    <JanelaDoAparelho tela={TELA_DA_CARTEIRA} tamanho="mini" />
                    {carregando ? (
                        <SkeletonText lines={2} className="min-w-0 flex-1 pb-4" />
                    ) : (
                        <div className="flex min-w-0 flex-1 flex-col items-start gap-3 pb-4">
                            <P className="font-semibold">
                                {estado === "novo" ? "Lance ao pagar com Apple Pay" : "Lançar ao pagar"}
                            </P>
                            {estado === "novo" ? null : (
                                <div className="-mt-2">
                                    {estado === "funcionando" ? (
                                        <Badge tone="success" className="whitespace-nowrap">
                                            <BadgeDot />
                                            Funcionando
                                        </Badge>
                                    ) : (
                                        <Badge tone="warning" className="whitespace-nowrap">
                                            Aguardando a 1ª compra
                                        </Badge>
                                    )}
                                </div>
                            )}
                            {/* Depois do guia a pessoa já sabe o que fazer: fica só o selo. */}
                            {estado === "novo" ? (
                                <Muted>Cada compra com o iPhone vira um gasto, sem abrir nada.</Muted>
                            ) : null}
                            <Button type="button" variant="secondary" onClick={() => setGuiaAberto(true)}>
                                {estado === "novo" ? "Configurar" : "Ver os passos de novo"}
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
            <GuiaDoApplePay open={guiaAberto} onOpenChange={setGuiaAberto} onConcluir={() => void concluir()} />
        </>
    )
}
