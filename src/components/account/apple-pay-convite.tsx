"use client"

import { useState } from "react"

import { GuiaDoApplePay } from "@/components/account/guia-do-apple-pay"
import { useLancarAoPagar } from "@/components/account/lancar-ao-pagar"
import { JanelaDoAparelho, TELA_DA_CARTEIRA } from "@/components/account/passo-a-passo"
import { BadgeDot } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SkeletonText } from "@/components/ui/skeleton"
import { Muted, P } from "@/components/ui/typography"
import { toastError } from "@/lib/toast"
import { cn } from "@/lib/utils"

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
                        <SkeletonText lines={2} className="min-w-0 flex-1" />
                    ) : estado === "novo" ? (
                        <div className="min-w-0 flex-1">
                            <P className="font-semibold">Lance ao pagar com Apple Pay</P>
                            <Muted>Cada compra com o iPhone vira um gasto, sem abrir nada.</Muted>
                        </div>
                    ) : (
                        // Depois do guia a pessoa já sabe o que é: fica só o estado, na cor dele.
                        <P
                            className={cn(
                                "flex min-w-0 flex-1 items-center gap-2 font-medium",
                                estado === "funcionando" ? "text-success" : "text-warning"
                            )}
                        >
                            {estado === "funcionando" ? <BadgeDot className="[--badge-dot:var(--color-success)]" /> : null}
                            {estado === "funcionando" ? "Funcionando" : "Aguardando a 1ª compra"}
                        </P>
                    )}
                </div>
                <div className="p-4 pt-3">
                    {carregando ? null : (
                        <Button type="button" variant="secondary" className="w-full" onClick={() => setGuiaAberto(true)}>
                            {estado === "novo" ? "Configurar" : "Ver os passos de novo"}
                        </Button>
                    )}
                </div>
            </Card>
            <GuiaDoApplePay open={guiaAberto} onOpenChange={setGuiaAberto} onConcluir={() => void concluir()} />
        </>
    )
}
