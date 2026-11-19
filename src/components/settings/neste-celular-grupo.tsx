"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { DevicePhoneMobileIcon, SparklesIcon, SwatchIcon } from "@heroicons/react/20/solid"
import { useAparelhosDeCaptura } from "@/components/account/aparelhos-de-captura"
import { GuiaDoAtalho } from "@/components/account/guia-do-atalho"
import { CartaoDeLancar } from "@/components/me/cartao-de-lancar"
import { descricaoDaLista, lancarNaVoce } from "@/components/me/estado-na-voce"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Item, ItemActions, ItemChevron, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { PageSection, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { ConviteDeInstalarCartao } from "@/components/settings/convite-de-instalar"
import { SettingsRow } from "@/components/settings/settings-section"
import { ROUTES } from "@/config/navigation"
import { InstallPwaSheet } from "@/components/pwa/install-pwa-sheet"
import { usePwaShellOptional } from "@/components/pwa/pwa-shell-context"
import { SyncStatusChip } from "@/components/pwa/sync-status-chip"
import { useAparelhoDeLancar } from "@/hooks/use-aparelho-de-lancar"
import { useDisplayMode, useIsIos } from "@/hooks/use-display-mode"
import { useLancamentoInteligente } from "@/hooks/use-lancamento-inteligente"

export const SEM_CONEXAO = "Sem conexão — alterações ficam na fila até sincronizar."

/** Se este aparelho pode instalar pelo passo a passo, e o texto da linha do app. */
export function useInstalarApp() {
    const { isStandalone } = useDisplayMode()
    const isIos = useIsIos()
    const shell = usePwaShellOptional()

    const textoDoApp = isIos ? "Pelo Safari, na tela inicial do iPhone." : "Pelo menu do navegador do celular."

    return {
        instalado: isStandalone,
        instalarNoIphone: isIos && !isStandalone,
        descricaoDoApp: (
            <>
                {textoDoApp}
                {shell && !shell.isOnline ? <span className="block">{SEM_CONEXAO}</span> : null}
            </>
        ),
    }
}

/** O ícone do app na capa dele. A capa é preta: o ícone entra menor sobre ela, para a capa aparecer em volta do logo. */
export function CapaDoApp() {
    return (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-row bg-black ring-1 ring-foreground/10">
            <Image src="/icons/apple-touch-icon.png" alt="" width={22} height={22} className="size-5.5" />
        </span>
    )
}

/** O seletor de tema de Configurações e da página Você, na pele do `Tabs`: moldura com anel e marcador cinza, também com anel. */
export function SeletorDeTema({ labels }: { labels: boolean }) {
    return (
        <ThemeToggle
            size="lg"
            labels={labels}
            className="shrink-0 bg-popover ring-1 ring-foreground/10 [&_[data-slot=theme-toggle-thumb]]:bg-muted [&_[data-slot=theme-toggle-thumb]]:shadow-xs [&_[data-slot=theme-toggle-thumb]]:ring-1 [&_[data-slot=theme-toggle-thumb]]:ring-foreground/10"
        />
    )
}

/**
 * O que vale só neste telefone, na página Você: tema, Lançar pelo iPhone (só no
 * iPhone), lançamento inteligente e o app instalado. O QR do desktop abre aqui
 * (`#no-celular`). O lançamento inteligente só existe no telefone
 * (`transaction-form-dialog.tsx`, `usarPaleta`).
 */
export function NesteCelularGrupo() {
    const [lancamentoInteligente, definirLancamentoInteligente] = useLancamentoInteligente()
    const { instalado, instalarNoIphone, descricaoDoApp } = useInstalarApp()
    const shell = usePwaShellOptional()
    const [installOpen, setInstallOpen] = useState(false)
    const aparelhos = useAparelhosDeCaptura()
    const [guiaAberto, setGuiaAberto] = useState(false)
    // Só no iPhone: instalado, o cartão até o primeiro aparelho e a linha depois; no navegador, o convite de instalar.
    const lancar = lancarNaVoce(useAparelhoDeLancar(), {
        carregando: aparelhos.isPending,
        erro: aparelhos.isError,
        quantos: aparelhos.ativos.length,
    })
    const descricaoDosAparelhos = descricaoDaLista(aparelhos.ativos.map((t) => t.name), "aparelhos")

    return (
        <>
            <PageSection
                id="no-celular"
                size="sm"
                className="scroll-mt-[calc(var(--top-bar-bottom)+--spacing(6))]"
            >
                <PageSectionHeader>
                    <PageSectionTitle>Neste celular</PageSectionTitle>
                </PageSectionHeader>
                <Card padding="none">
                    <ItemGroup variant="divided">
                        <Item variant="flush" className="min-h-12">
                            <ItemMedia variant="icon">
                                <SwatchIcon className="size-5" aria-hidden />
                            </ItemMedia>
                            <ItemContent>
                                <ItemTitle className="pointer-coarse:text-base">Tema</ItemTitle>
                            </ItemContent>
                            <ItemActions>
                                <SeletorDeTema labels={false} />
                            </ItemActions>
                        </Item>
                        {lancar === "linha" ? (
                            <Item variant="flush" interactive asChild className="min-h-12">
                                <Link href={ROUTES.SETTINGS_LANCAR}>
                                    <ItemMedia variant="icon">
                                        <DevicePhoneMobileIcon className="size-5" aria-hidden />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle className="pointer-coarse:text-base">Lançar pelo iPhone</ItemTitle>
                                        {descricaoDosAparelhos ? <ItemDescription>{descricaoDosAparelhos}</ItemDescription> : null}
                                    </ItemContent>
                                    <ItemChevron />
                                </Link>
                            </Item>
                        ) : null}
                        {/* Como as linhas com descrição da Você: o `Item` põe o ícone na linha do título. O `label` faz a linha inteira ser o alvo da chave. */}
                        <Item variant="flush" asChild className="min-h-12">
                            <label>
                                <ItemMedia variant="icon">
                                    <SparklesIcon className="size-5" aria-hidden />
                                </ItemMedia>
                                <ItemContent>
                                    <ItemTitle className="pointer-coarse:text-base">Lançamento inteligente</ItemTitle>
                                    <ItemDescription>Digite uma frase no +; vale na conta, inclusive no atalho do iPhone.</ItemDescription>
                                </ItemContent>
                                <ItemActions>
                                    <Switch
                                        aria-label="Lançamento inteligente"
                                        checked={lancamentoInteligente}
                                        onCheckedChange={definirLancamentoInteligente}
                                    />
                                </ItemActions>
                            </label>
                        </Item>
                        {/* Instalado, não há o que instalar: da linha só fica a fila, quando existe. */}
                        {instalado ? (
                            shell && shell.pendingSyncCount > 0 ? (
                                <>
                                <Item variant="flush" className="min-h-12">
                                    <ItemContent>
                                        <ItemTitle className="pointer-coarse:text-base">Sincronização</ItemTitle>
                                        {!shell.isOnline ? <ItemDescription>{SEM_CONEXAO}</ItemDescription> : null}
                                    </ItemContent>
                                    <ItemActions>
                                        <SyncStatusChip />
                                    </ItemActions>
                                </Item>
                                </>
                            ) : null
                        ) : lancar === "convite" ? null : (
                            <>
                                <SettingsRow
                                    titulo="Instalar o app"
                                    descricao={descricaoDoApp}
                                    media={<CapaDoApp />}
                                >
                                    <SyncStatusChip />
                                </SettingsRow>
                            </>
                        )}
                    </ItemGroup>
                    {instalarNoIphone && lancar !== "convite" ? (
                        <div className="px-4 pb-3">
                            <Button
                                type="button"
                                variant="primary"
                                className="w-full"
                                onClick={() => setInstallOpen(true)}
                            >
                                Como instalar
                            </Button>
                        </div>
                    ) : null}
                </Card>
            </PageSection>
            {/* O convite é seção própria, com subtítulo: dentro de Neste celular, o cartão engolia a lista. */}
            {lancar === "cartao" || lancar === "convite" ? (
                <PageSection size="sm">
                    <PageSectionHeader>
                        <PageSectionTitle>{lancar === "cartao" ? "Lançar pelo iPhone" : "App no iPhone"}</PageSectionTitle>
                    </PageSectionHeader>
                    {lancar === "cartao" ? (
                        <CartaoDeLancar onConectar={() => setGuiaAberto(true)} />
                    ) : (
                        <ConviteDeInstalarCartao />
                    )}
                </PageSection>
            ) : null}
            <InstallPwaSheet open={installOpen} onOpenChange={setInstallOpen} />
            {/* Fora do ramo do cartão, como em `AtalhoSecao`: o primeiro aparelho troca o cartão pela linha, e o guia segue aberto até a pessoa fechar, com o código e os passos do atalho. */}
            <GuiaDoAtalho
                open={guiaAberto}
                onOpenChange={setGuiaAberto}
                aoCriar={() => void aparelhos.refetch()}
                atalhos={aparelhos.ativos}
            />
        </>
    )
}
