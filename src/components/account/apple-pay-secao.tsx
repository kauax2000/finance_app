"use client"

import { useState } from "react"

import { useAparelhosDeCaptura } from "@/components/account/aparelhos-de-captura"
import { GuiaDoApplePay } from "@/components/account/guia-do-apple-pay"
import { SettingsSection } from "@/components/settings/settings-section"
import { Button } from "@/components/ui/button"
import { Card, CardMessage } from "@/components/ui/card"
import { Item, ItemActions, ItemContent, ItemTitle } from "@/components/ui/item"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { Muted } from "@/components/ui/typography"

/**
 * Lançar ao pagar: a automação da Carteira que roda o Lançar gasto a cada compra
 * com Apple Pay. Precisa de um aparelho conectado na seção de cima.
 */
export function ApplePaySecao() {
    const lista = useAparelhosDeCaptura()
    const [guiaAberto, setGuiaAberto] = useState(false)

    return (
        <SettingsSection titulo="Lançar ao pagar">
            <Card padding="none">
                {lista.isLoading ? (
                    <SkeletonGroup label="Carregando aparelhos…" delay>
                        <div className="flex flex-col gap-1 px-4 py-3">
                            <Skeleton className="h-4 w-40 max-w-full" />
                            <Skeleton className="h-3 w-56 max-w-full" />
                        </div>
                    </SkeletonGroup>
                ) : lista.isError ? (
                    <CardMessage tone="destructive">Não foi possível ver os aparelhos.</CardMessage>
                ) : (
                    <Item variant="flush" className="px-4">
                        <ItemContent className="min-w-0">
                            <ItemTitle>Lançar ao pagar com Apple Pay</ItemTitle>
                            <Muted>
                                {lista.ativos.length === 0
                                    ? "Conecte o iPhone primeiro, na seção acima."
                                    : "Cada compra com o iPhone vira um gasto no Finance, sozinha."}
                            </Muted>
                        </ItemContent>
                        {lista.ativos.length > 0 ? (
                            <ItemActions>
                                <Button type="button" variant="secondary" onClick={() => setGuiaAberto(true)}>
                                    Configurar
                                </Button>
                            </ItemActions>
                        ) : null}
                    </Item>
                )}
            </Card>

            <GuiaDoApplePay open={guiaAberto} onOpenChange={setGuiaAberto} />
        </SettingsSection>
    )
}
