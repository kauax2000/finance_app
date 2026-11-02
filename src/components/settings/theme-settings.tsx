"use client"

import { useState, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FormSwitch } from "@/components/ui/form"
import { QrCode, QrCodeCopy } from "@/components/ui/qr-code"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Muted } from "@/components/ui/typography"
import { InstallPwaSheet } from "@/components/pwa/install-pwa-sheet"
import { usePwaShellOptional } from "@/components/pwa/pwa-shell-context"
import { SyncStatusChip } from "@/components/pwa/sync-status-chip"
import { SettingsRow, SettingsSection } from "@/components/settings/settings-section"
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

    const linhaDoApp = (
        <SettingsRow
            titulo="Instalar o app"
            descricao={
                <>
                    {textoDoApp}
                    {shell && !shell.isOnline ? <span className="block">{SEM_CONEXAO}</span> : null}
                </>
            }
        >
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

    return (
        <>
            <SettingsSection titulo="Aparência" alcance="Vale só neste aparelho.">
                <Card padding="none">
                    <SettingsRow titulo="Tema">
                        <ThemeToggle
                            size="lg"
                            labels={!isMobile}
                            // A pele do `Tabs` da busca, logo abaixo: moldura com anel e marcador cinza, também com anel.
                            className="shrink-0 bg-popover ring-1 ring-foreground/10 [&_[data-slot=theme-toggle-thumb]]:bg-muted [&_[data-slot=theme-toggle-thumb]]:shadow-xs [&_[data-slot=theme-toggle-thumb]]:ring-1 [&_[data-slot=theme-toggle-thumb]]:ring-foreground/10"
                        />
                    </SettingsRow>
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
            {isMobile ? (
                <SettingsSection id="no-celular" titulo="Neste celular" alcance="Vale só neste aparelho.">
                    <Card padding="none">
                        <div className="px-4 py-3">
                            <FormSwitch
                                className="items-center"
                                label="Lançamento inteligente"
                                description="Digite uma frase no + e o app preenche o resto."
                                checked={lancamentoInteligente}
                                onCheckedChange={definirLancamentoInteligente}
                            />
                        </div>
                        <Separator />
                        {linhaDoApp}
                    </Card>
                </SettingsSection>
            ) : (
                <SettingsSection titulo="No celular" alcance="Lance por frase e instale o app no telefone.">
                    <Card padding="none">
                        <div className="flex min-w-0 items-center justify-between gap-6 px-4 py-4">
                            <div className="min-w-0">
                                <p className="text-sm font-medium">Abra o Finance no telefone</p>
                                <Muted>Aponte a câmera para o código. Lá você liga o lançamento inteligente e instala o app.</Muted>
                                <QrCodeCopy value={noTelefone} className="mt-3" />
                            </div>
                            <QrCode value={noTelefone} label="Abrir o Finance no telefone" link={false} />
                        </div>
                        {instalarNoIphone ? (
                            <>
                                <Separator />
                                {linhaDoApp}
                            </>
                        ) : shell && shell.pendingSyncCount > 0 ? (
                            <>
                                <Separator />
                                <SettingsRow
                                    titulo="Sincronização"
                                    descricao={!shell.isOnline ? SEM_CONEXAO : undefined}
                                >
                                    <SyncStatusChip />
                                </SettingsRow>
                            </>
                        ) : null}
                    </Card>
                </SettingsSection>
            )}
            <InstallPwaSheet open={installOpen} onOpenChange={setInstallOpen} />
        </>
    )
}
