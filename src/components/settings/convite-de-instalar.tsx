"use client"

import { useState } from "react"
import { ArrowDownTrayIcon, EllipsisVerticalIcon, Squares2X2Icon } from "@heroicons/react/16/solid"

import { JanelaDoAparelho, TELA_DA_NOTIFICACAO } from "@/components/account/passo-a-passo"
import { InstallPwaSheet } from "@/components/pwa/install-pwa-sheet"
import { CapaDoApp } from "@/components/settings/neste-celular-grupo"
import { SettingsSection } from "@/components/settings/settings-section"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Muted } from "@/components/ui/typography"

const VANTAGENS_DO_IPHONE = [
    "Pela Siri ou com um toque: Botão de Ação, Tela Bloqueada ou o ícone.",
    "O formulário rápido, sem abrir o app inteiro.",
    "O Apple Pay lança o gasto sozinho.",
]

/** O caminho no Chrome do Android: o menu do navegador instala o app. */
const PASSOS_DO_ANDROID = [
    { icone: EllipsisVerticalIcon, texto: "Toque em ⋮, no canto do navegador" },
    { icone: ArrowDownTrayIcon, texto: "Toque em Instalar app" },
    { icone: Squares2X2Icon, texto: "Abra o Finance pela tela de início" },
]

/** No navegador do celular: pede para pôr o app na tela de início. As vantagens do iPhone só vão a quem tem iPhone. */
export function ConviteDeInstalar({ iphone }: { iphone: boolean }) {
    const [aberto, setAberto] = useState(false)

    if (!iphone)
        return (
            <SettingsSection titulo="Use como app">
                <Card padding="none">
                    <ItemGroup variant="divided">
                        <Item variant="flush">
                            <ItemMedia>
                                <CapaDoApp />
                            </ItemMedia>
                            <ItemContent>
                                <ItemTitle className="pointer-coarse:text-base">Ponha o Finance na tela de início</ItemTitle>
                                <ItemDescription>Ele abre direto, em tela cheia, e pode te avisar do que importa.</ItemDescription>
                            </ItemContent>
                        </Item>
                        {PASSOS_DO_ANDROID.map(({ icone: Icone, texto }) => (
                            <Item key={texto} variant="flush">
                                <ItemMedia variant="tile" tone="neutral">
                                    <Icone aria-hidden="true" />
                                </ItemMedia>
                                <ItemContent>
                                    <ItemTitle className="font-normal pointer-coarse:text-base">{texto}</ItemTitle>
                                </ItemContent>
                            </Item>
                        ))}
                    </ItemGroup>
                </Card>
            </SettingsSection>
        )

    return (
        <SettingsSection titulo="Use como app">
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
