"use client"

import { useState } from "react"
import Image from "next/image"
import { SparklesIcon, SwatchIcon } from "@heroicons/react/20/solid"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FormSwitch } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { InstallPwaSheet } from "@/components/pwa/install-pwa-sheet"
import { usePwaShellOptional } from "@/components/pwa/pwa-shell-context"
import { SyncStatusChip } from "@/components/pwa/sync-status-chip"
import { SettingsRow, SettingsTile } from "@/components/settings/settings-section"
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
 * O que vale só neste telefone, na página Você: tema, lançamento inteligente e o
 * app instalado. O QR do desktop abre aqui (`#no-celular`). O lançamento
 * inteligente só existe no telefone (`transaction-form-dialog.tsx`, `usarPaleta`).
 */
export function NesteCelularGrupo() {
    const [lancamentoInteligente, definirLancamentoInteligente] = useLancamentoInteligente()
    const { instalado, instalarNoIphone, descricaoDoApp } = useInstalarApp()
    const shell = usePwaShellOptional()
    const [installOpen, setInstallOpen] = useState(false)

    return (
        <>
            <Card
                id="no-celular"
                padding="none"
                role="group"
                aria-label="Neste celular"
                className="scroll-mt-[calc(var(--top-bar-bottom)+--spacing(6))]"
            >
                <SettingsRow
                    titulo="Tema"
                    media={
                        <SettingsTile>
                            <SwatchIcon className="size-5" />
                        </SettingsTile>
                    }
                >
                    <SeletorDeTema labels={false} />
                </SettingsRow>
                <Separator />
                <div className="flex min-w-0 items-center gap-3 px-4 py-3">
                    <SettingsTile>
                        <SparklesIcon className="size-5" />
                    </SettingsTile>
                    <FormSwitch
                        className="min-w-0 flex-1 items-center"
                        label="Lançamento inteligente"
                        description="Digite uma frase no +"
                        checked={lancamentoInteligente}
                        onCheckedChange={definirLancamentoInteligente}
                    />
                </div>
                {/* Instalado, não há o que instalar: da linha só fica a fila, quando existe. */}
                {instalado ? (
                    shell && shell.pendingSyncCount > 0 ? (
                        <>
                            <Separator />
                            <SettingsRow
                                titulo="Sincronização"
                                descricao={!shell.isOnline ? SEM_CONEXAO : undefined}
                            >
                                <SyncStatusChip />
                            </SettingsRow>
                        </>
                    ) : null
                ) : (
                    <>
                        <Separator />
                        <SettingsRow
                            titulo="Instalar o app"
                            descricao={descricaoDoApp}
                            media={
                                <Image
                                    src="/icons/apple-touch-icon.png"
                                    alt=""
                                    width={36}
                                    height={36}
                                    className="size-9 shrink-0 rounded-row ring-1 ring-foreground/10"
                                />
                            }
                        >
                            <SyncStatusChip />
                        </SettingsRow>
                    </>
                )}
                {instalarNoIphone ? (
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
            <InstallPwaSheet open={installOpen} onOpenChange={setInstallOpen} />
        </>
    )
}
