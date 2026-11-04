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

/** No navegador do iPhone: pede para pôr o app na tela de início. O Android já vê o convite fora de Configurações. */
export function ConviteDeInstalar() {
    const [aberto, setAberto] = useState(false)

    return (
        <SettingsSection titulo="Instale o app">
            <Card padding="none">
                <EmptyState variant="plain" size="sm">
                    <JanelaDoAparelho tela={TELA_DA_NOTIFICACAO} tamanho="compacta" />
                    <EmptyStateTitle>Ponha o Finance na tela de início</EmptyStateTitle>
                    <EmptyStateDescription>
                        Ele abre direto, em tela cheia, e pode te avisar do que importa.
                    </EmptyStateDescription>
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
                </EmptyState>
            </Card>
            <InstallPwaSheet open={aberto} onOpenChange={setAberto} />
        </SettingsSection>
    )
}
