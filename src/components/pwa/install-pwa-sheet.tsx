"use client"

import { useEffect, useState } from "react"
import { DevicePhoneMobileIcon, ShareIcon } from "@heroicons/react/24/outline"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { P, Muted } from "@/components/ui/typography"
import {
    PWA_INSTALL_DISMISSED_KEY,
    PWA_INSTALL_VISITS_KEY,
} from "@/lib/pwa/constants"
import { useDisplayMode, useIsIos } from "@/hooks/use-display-mode"

type InstallPwaSheetProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function InstallPwaSheet({ open, onOpenChange }: InstallPwaSheetProps) {
    const handleDismiss = () => {
        try {
            localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, "1")
        } catch {
            /* ignore */
        }
        onOpenChange(false)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                fillMobileViewport
                className="gap-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            >
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <DevicePhoneMobileIcon className="size-5" aria-hidden />
                        Instalar no iPhone
                    </SheetTitle>
                    <SheetDescription>
                        Use o Finance como app na tela inicial, sem a barra do Safari.
                    </SheetDescription>
                </SheetHeader>
                <ol className="list-decimal space-y-3 pl-5 text-sm">
                    <li>
                        <P className="inline">
                            Toque em <ShareIcon className="mx-0.5 inline size-4 align-text-bottom" aria-hidden />{" "}
                            <strong>Compartilhar</strong> na barra do Safari.
                        </P>
                    </li>
                    <li>
                        <P className="inline">
                            Role e escolha <strong>Adicionar à Tela de Início</strong>.
                        </P>
                    </li>
                    <li>
                        <P className="inline">
                            Confirme com <strong>Adicionar</strong>. O ícone &quot;Finance&quot; aparecerá na home.
                        </P>
                    </li>
                </ol>
                <Muted className="text-xs">
                    No iPhone, a instalação funciona melhor pelo Safari. Chrome e outros navegadores usam o mesmo motor, mas o fluxo pode variar.
                </Muted>
                <Button type="button" variant="secondary" className="w-full" onClick={handleDismiss}>
                    Entendi
                </Button>
            </SheetContent>
        </Sheet>
    )
}

/** Auto-prompt after repeat visits on iOS (not standalone). */
export function InstallPwaSheetAuto() {
    const { isStandalone } = useDisplayMode()
    const isIos = useIsIos()
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (!isIos || isStandalone) return

        try {
            if (localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === "1") return
            const visits = Number(localStorage.getItem(PWA_INSTALL_VISITS_KEY) ?? "0") + 1
            localStorage.setItem(PWA_INSTALL_VISITS_KEY, String(visits))
            if (visits >= 2) {
                setOpen(true)
            }
        } catch {
            /* ignore */
        }
    }, [isIos, isStandalone])

    if (!isIos || isStandalone) return null

    return <InstallPwaSheet open={open} onOpenChange={setOpen} />
}
