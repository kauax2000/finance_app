"use client"

import { useState } from "react"

import { JanelaDoAparelho, TELA_DA_NOTIFICACAO } from "@/components/account/passo-a-passo"
import { InstallPwaSheet } from "@/components/pwa/install-pwa-sheet"
import { SettingsSection } from "@/components/settings/settings-section"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { Muted } from "@/components/ui/typography"

const VANTAGENS_DO_IPHONE = [
    "Pela Siri ou com um toque: Botão de Ação, Tela Bloqueada ou o ícone.",
    "O formulário rápido, sem abrir o app inteiro.",
    "O Apple Pay lança o gasto sozinho.",
]

/** No navegador do celular: pede para pôr o app na tela de início. As vantagens do iPhone só vão a quem tem iPhone. */
export function ConviteDeInstalar({ iphone }: { iphone: boolean }) {
    const [aberto, setAberto] = useState(false)

    return (
        <SettingsSection titulo="Use como app">
            <Card padding="none">
                <EmptyState variant="plain" size="sm">
                    <JanelaDoAparelho tela={TELA_DA_NOTIFICACAO} tamanho="compacta" />
                    <EmptyStateTitle>Ponha o Finance na tela de início</EmptyStateTitle>
                    <EmptyStateDescription>
                        {iphone
                            ? "Ele abre direto, em tela cheia, e pode te avisar do que importa."
                            : "Ele abre direto, em tela cheia, e pode te avisar do que importa. No menu do navegador, toque em Instalar app."}
                    </EmptyStateDescription>
                    {iphone ? (
                        <>
                            <ul className="flex flex-col gap-1 text-start">
                                {VANTAGENS_DO_IPHONE.map((v) => (
                                    <li key={v}>
                                        <Muted>{v}</Muted>
                                    </li>
                                ))}
                            </ul>
                            <EmptyStateActions>
                                <Button variant="primary" onClick={() => setAberto(true)}>
                                    Como instalar
                                </Button>
                            </EmptyStateActions>
                        </>
                    ) : null}
                </EmptyState>
            </Card>
            {iphone ? <InstallPwaSheet open={aberto} onOpenChange={setAberto} /> : null}
        </SettingsSection>
    )
}
