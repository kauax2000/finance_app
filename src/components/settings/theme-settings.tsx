"use client"

import { useState, useSyncExternalStore } from "react"
import Image from "next/image"
import { SparklesIcon, SwatchIcon } from "@heroicons/react/20/solid"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FormSwitch } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { InstallPwaSheet } from "@/components/pwa/install-pwa-sheet"
import { usePwaShellOptional } from "@/components/pwa/pwa-shell-context"
import { SyncStatusChip } from "@/components/pwa/sync-status-chip"
import { NoCelularCartao } from "@/components/settings/no-celular-cartao"
import { SettingsRow, SettingsSection, SettingsTile } from "@/components/settings/settings-section"
import { ROUTES } from "@/config/navigation"
import { useBuscaDoCabecalho, type BuscaDoCabecalho } from "@/hooks/use-busca-do-cabecalho"
import { useDisplayMode, useIsIos } from "@/hooks/use-display-mode"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLancamentoInteligente } from "@/hooks/use-lancamento-inteligente"

const semAssinatura = () => () => {}
const SEM_CONEXAO = "Sem conexão — alterações ficam na fila até sincronizar."

/**
 * O que vale só neste aparelho: tema, busca do cabeçalho (só do `lg` para cima;
 * abaixo, as duas formas são a mesma lupa), lançamento inteligente e o app instalado.
 * O lançamento inteligente só existe no telefone (`transaction-form-dialog.tsx`,
 * `usarPaleta`): no desktop a chave não faria nada, nem no celular, porque a
 * preferência é do aparelho. Por isso o desktop mostra o QR que leva ao telefone.
 * No telefone não há a busca, então o Tema entra no grupo "Neste celular" em vez
 * de ficar sozinho numa seção.
 */
export function ThemeSettings() {
    const [busca, definirBusca] = useBuscaDoCabecalho()
    const [lancamentoInteligente, definirLancamentoInteligente] = useLancamentoInteligente()
    // No telefone os nomes não cabem ao lado de "Tema".
    const isMobile = useIsMobile()
    const { isStandalone } = useDisplayMode()
    const isIos = useIsIos()
    const shell = usePwaShellOptional()
    const [installOpen, setInstallOpen] = useState(false)
    const origem = useSyncExternalStore(semAssinatura, () => window.location.origin, () => "")
    const noTelefone = origem ? `${origem}${ROUTES.SETTINGS}#no-celular` : ""

    const instalarNoIphone = isIos && !isStandalone
    const textoDoApp = isStandalone
        ? "O Finance está instalado neste aparelho."
        : isIos
          ? "Pelo Safari, na tela inicial do iPhone."
          : "Pelo menu do navegador do celular."

    const descricaoDoApp = (
        <>
            {textoDoApp}
            {shell && !shell.isOnline ? <span className="block">{SEM_CONEXAO}</span> : null}
        </>
    )

    const linhaDoApp = (
        <SettingsRow titulo="Instalar o app" descricao={descricaoDoApp}>
            <div className="flex shrink-0 items-center gap-2">
                <SyncStatusChip />
                {instalarNoIphone ? (
                    <Button type="button" variant="secondary" onClick={() => setInstallOpen(true)}>
                        Como instalar
                    </Button>
                ) : null}
            </div>
        </SettingsRow>
    )

    const seletorDeTema = (
        <ThemeToggle
            size="lg"
            labels={!isMobile}
            // A pele do `Tabs` da busca, logo abaixo: moldura com anel e marcador cinza, também com anel.
            className="shrink-0 bg-popover ring-1 ring-foreground/10 [&_[data-slot=theme-toggle-thumb]]:bg-muted [&_[data-slot=theme-toggle-thumb]]:shadow-xs [&_[data-slot=theme-toggle-thumb]]:ring-1 [&_[data-slot=theme-toggle-thumb]]:ring-foreground/10"
        />
    )

    return (
        <>
            {isMobile ? (
                <SettingsSection
                    id="no-celular"
                    className="scroll-mt-[calc(var(--top-bar-bottom)+--spacing(6))]"
                    titulo="Neste celular"
                    alcance="Vale só neste aparelho."
                >
                    <Card padding="none">
                        <SettingsRow
                            titulo="Tema"
                            media={
                                <SettingsTile>
                                    <SwatchIcon className="size-5" />
                                </SettingsTile>
                            }
                        >
                            {seletorDeTema}
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
                </SettingsSection>
            ) : (
                <SettingsSection titulo="Aparência" alcance="Vale só neste aparelho.">
                    <Card padding="none">
                        <SettingsRow titulo="Tema">{seletorDeTema}</SettingsRow>
                        <div className="max-lg:hidden">
                            <Separator />
                            <SettingsRow
                                titulo="Busca no cabeçalho"
                                descricao="A barra no centro ou um botão ao lado das notificações."
                            >
                                <Tabs
                                    value={busca}
                                    onValueChange={(proxima) => definirBusca(proxima as BuscaDoCabecalho)}
                                    className="shrink-0"
                                >
                                    <TabsList aria-label="Busca no cabeçalho">
                                        <TabsTrigger value="barra">Barra</TabsTrigger>
                                        <TabsTrigger value="botao">Botão</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </SettingsRow>
                        </div>
                    </Card>
                </SettingsSection>
            )}
            {isMobile ? null : (
                <SettingsSection titulo="No celular" alcance="Lance por frase e instale o app no telefone.">
                    <NoCelularCartao value={noTelefone} />
                    {instalarNoIphone ? (
                        <Card padding="none">
                            {linhaDoApp}
                        </Card>
                    ) : shell && shell.pendingSyncCount > 0 ? (
                        <Card padding="none">
                            <SettingsRow
                                titulo="Sincronização"
                                descricao={!shell.isOnline ? SEM_CONEXAO : undefined}
                            >
                                <SyncStatusChip />
                            </SettingsRow>
                        </Card>
                    ) : null}
                </SettingsSection>
            )}
            <InstallPwaSheet open={installOpen} onOpenChange={setInstallOpen} />
        </>
    )
}
