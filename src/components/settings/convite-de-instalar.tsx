"use client"

import { useState } from "react"
import { BellAlertIcon, BoltIcon, CloudArrowUpIcon } from "@heroicons/react/16/solid"

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
import { Item, ItemContent, ItemDescription, ItemGroup, ItemGroupLabel, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Muted } from "@/components/ui/typography"

const VANTAGENS_DO_IPHONE = [
    "Pela Siri ou com um toque: Botão de Ação, Tela Bloqueada ou o ícone.",
    "O formulário rápido, sem abrir o app inteiro.",
    "O Apple Pay lança o gasto sozinho.",
]

const VANTAGENS_DO_ANDROID = [
    { icone: BoltIcon, texto: "Lance o gasto em segundos, na hora da compra" },
    { icone: BellAlertIcon, texto: "Receba os avisos de contas e do orçamento" },
    { icone: CloudArrowUpIcon, texto: "Lance sem internet: sincroniza quando voltar" },
]

/** O caminho no Chrome e no Samsung Internet: o menu do navegador instala o app. */
const PASSOS_DO_ANDROID = [
    "Toque em ⋮ no canto do Chrome",
    "Escolha Instalar app ou Adicionar à tela inicial",
    "Abra o Finance pelo ícone novo",
]

/** No navegador do celular: pede para pôr o app na tela de início. As vantagens do iPhone só vão a quem tem iPhone. */
export function ConviteDeInstalar({ iphone }: { iphone: boolean }) {
    const [aberto, setAberto] = useState(false)

    if (!iphone)
        return (
            <SettingsSection titulo="Instale o app">
                <Card padding="none">
                    <ItemGroup variant="divided">
                        <Item variant="flush">
                            <ItemMedia>
                                <CapaDoApp />
                            </ItemMedia>
                            <ItemContent>
                                <ItemTitle className="pointer-coarse:text-base">Tenha o Finance como app</ItemTitle>
                                <ItemDescription>
                                    Fica na tela de início do celular e abre direto, em tela cheia, sem procurar no navegador.
                                </ItemDescription>
                            </ItemContent>
                        </Item>
                        {VANTAGENS_DO_ANDROID.map(({ icone: Icone, texto }) => (
                            <Item key={texto} variant="flush">
                                <ItemMedia variant="icon">
                                    <Icone className="text-foreground" aria-hidden="true" />
                                </ItemMedia>
                                <ItemContent>
                                    <ItemTitle className="font-normal text-muted-foreground pointer-coarse:text-base">
                                        {texto}
                                    </ItemTitle>
                                </ItemContent>
                            </Item>
                        ))}
                        <ItemGroup variant="divided" role="list" aria-label="Como instalar">
                            <ItemGroupLabel aria-hidden="true">Como instalar</ItemGroupLabel>
                            {PASSOS_DO_ANDROID.map((texto, i) => (
                                <Item key={texto} variant="flush" role="listitem">
                                    {/* A ordem já vem da lista; o número é só o desenho. */}
                                    <ItemMedia variant="tile" tone="neutral" aria-hidden="true">
                                        {i + 1}
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle className="font-normal pointer-coarse:text-base">{texto}</ItemTitle>
                                    </ItemContent>
                                </Item>
                            ))}
                        </ItemGroup>
                    </ItemGroup>
                </Card>
            </SettingsSection>
        )

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
