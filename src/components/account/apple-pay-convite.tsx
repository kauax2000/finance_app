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
import { currencyBRL } from "@/lib/formatters"
import { toastError } from "@/lib/toast"
import { formatRelativeTimePtBr } from "@/lib/transaction-date"

const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/**
 * Lançar ao pagar: a automação da Carteira roda o Lançar gasto a cada compra com
 * Apple Pay. Mora em "Lançar pelo iPhone" e só aparece com um aparelho
 * conectado, porque a automação usa o atalho que aquele guia instala. O cartão
 * muda com o estado: Configurar; Aguardando a 1ª compra (o Pronto do guia, salvo
 * na conta); Funcionando (a primeira compra pelo Apple Pay chegou).
 */
export function ApplePayConvite() {
    const [guiaAberto, setGuiaAberto] = useState(false)
    const { carregando, estado, ultima, marcarConfigurado } = useLancarAoPagar()

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
                <div className="flex items-center gap-3 p-4">
                    <JanelaDoAparelho tela={TELA_DA_CARTEIRA} tamanho="mini" />
                    {carregando ? (
                        <SkeletonText lines={2} className="min-w-0 flex-1" />
                    ) : (
                        <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
                            {estado === "novo" ? (
                                <div>
                                    <P className="font-semibold">Lance ao pagar com Apple Pay</P>
                                    <Muted>Cada compra com o iPhone vira um gasto aqui, sem digitar nada.</Muted>
                                </div>
                            ) : (
                                <div>
                                    <P className="font-semibold">Lançar ao pagar</P>
                                    <Muted>
                                        {ultima
                                            ? `Última compra lançada ${minuscula(formatRelativeTimePtBr(ultima.created_at))} · ${ultima.description}, ${currencyBRL(ultima.amount)}`
                                            : "Pague algo com o iPhone e o gasto aparece aqui sozinho."}
                                    </Muted>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {/* Embaixo, na largura do cartão: ao lado do aparelho o rótulo não cabia a 375px. */}
                {carregando ? null : (
                    <div className="flex flex-col items-start gap-3 px-4 pb-4">
                        {/* O estado logo acima do botão, um degrau maior que o chip de linha: ao lado do aparelho não cabia. */}
                        {estado === "funcionando" ? (
                            <Badge tone="success" className="w-full justify-center px-3 py-1 text-sm">
                                <BadgeDot />
                                Funcionando
                            </Badge>
                        ) : estado === "aguardando" ? (
                            <Badge tone="warning" className="w-full justify-center px-3 py-1 text-sm">
                                Aguardando a 1ª compra
                            </Badge>
                        ) : null}
                        <Button
                            type="button"
                            variant="secondary"
                            className="w-full"
                            onClick={() => setGuiaAberto(true)}
                        >
                            {estado === "novo" ? "Configurar" : "Ver os passos de novo"}
                        </Button>
                    </div>
                )}
            </Card>
            <GuiaDoApplePay open={guiaAberto} onOpenChange={setGuiaAberto} onConcluir={() => void concluir()} />
        </>
    )
}
