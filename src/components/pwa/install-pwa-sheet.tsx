"use client"

import { useEffect, useState } from "react"
import Image, { type StaticImageData } from "next/image"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  DialogCloseButton,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { P, Muted } from "@/components/ui/typography"
import {
    PWA_INSTALL_DISMISSED_KEY,
    PWA_INSTALL_VISITS_KEY,
} from "@/lib/pwa/constants"
import { useDisplayMode, useIsIos } from "@/hooks/use-display-mode"
import menu from "./assets/instalar-1-menu.webp"
import compartilhar from "./assets/instalar-2-compartilhar.webp"
import verMais from "./assets/instalar-3-ver-mais.webp"
import adicionar from "./assets/instalar-4-adicionar.webp"

type InstallPwaSheetProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

type Passo = {
    imagem: StaticImageData
    /** Onde tocar, em % da imagem inteira. */
    ponto: { x: number; y: number }
    /** Que ponta da imagem fica à vista na janela. */
    ancora: "topo" | "baixo"
    titulo: string
    texto: string
}

/*
 * As imagens são capturas do iOS 27 sobre o PSD de `docs/design/mockups/`.
 * O caminho do Safari muda com a versão do iOS.
 */
const PASSOS: Passo[] = [
    {
        imagem: menu,
        ponto: { x: 28, y: 92.4 },
        ancora: "baixo",
        titulo: "Abra o menu do Safari",
        texto: "Na barra do Safari, toque em ≡ ou em ⋯.",
    },
    {
        imagem: compartilhar,
        ponto: { x: 46.6, y: 51.6 },
        ancora: "baixo",
        titulo: "Toque em Compartilhar",
        texto: "Ele está no menu que abriu.",
    },
    {
        imagem: verMais,
        ponto: { x: 40.2, y: 68.3 },
        ancora: "baixo",
        titulo: "Toque em Adicionar à Tela de Início",
        texto: "Se não aparecer, toque em Ver Mais antes.",
    },
    {
        imagem: adicionar,
        ponto: { x: 80.3, y: 12.1 },
        ancora: "topo",
        titulo: "Toque em Adicionar",
        texto: "O Finance aparece na sua tela inicial.",
    },
]

export function InstallPwaSheet({ open, onOpenChange }: InstallPwaSheetProps) {
    const [passo, setPasso] = useState(0)
    const [abertoAntes, setAbertoAntes] = useState(open)
    if (open !== abertoAntes) {
        setAbertoAntes(open)
        if (open) setPasso(0)
    }

    const handleDismiss = () => {
        try {
            localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, "1")
        } catch {
            /* ignore */
        }
        onOpenChange(false)
    }

    const atual = PASSOS[passo]
    const ultimo = passo === PASSOS.length - 1
    const ancora = atual.ancora === "topo" ? "top-0" : "bottom-0"

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                variant="flush"
                fillMobileViewport
                className="gap-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            >
                <DialogHeader>
                    <DialogTitle>Instalar no iPhone</DialogTitle>
                    <DialogDescription>
                        Use o Finance como app, sem a barra do Safari.
                    </DialogDescription>
                </DialogHeader>
                <div className="relative mx-auto h-72 w-60 overflow-hidden">
                    <Image
                        key={passo}
                        src={atual.imagem}
                        alt=""
                        sizes="240px"
                        className={`absolute inset-x-0 ${ancora} h-auto w-60 max-w-none`}
                    />
                    <div className={`absolute inset-x-0 ${ancora} aspect-[720/1488]`}>
                        <span
                            className="absolute size-8 -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${atual.ponto.x}%`, top: `${atual.ponto.y}%` }}
                            aria-hidden
                        >
                            <span className="absolute inset-0 rounded-full bg-foreground/30 motion-safe:animate-ping" />
                            <span className="absolute inset-0 rounded-full ring-2 ring-foreground" />
                        </span>
                    </div>
                </div>
                <div aria-hidden className="flex justify-center gap-1.5">
                    {PASSOS.map((p, i) => (
                        <span
                            key={p.titulo}
                            className={`size-1.5 rounded-full ${i === passo ? "bg-foreground" : "bg-muted-foreground/40"}`}
                        />
                    ))}
                </div>
                <div aria-live="polite">
                    <P className="font-semibold">{atual.titulo}</P>
                    <Muted>{atual.texto}</Muted>
                </div>
                {passo === 0 && (
                    <Muted className="text-xs">
                        Use o Safari: em outro navegador o caminho muda.
                    </Muted>
                )}
                <div className="flex gap-2">
                    {passo > 0 && (
                        <Button type="button" variant="tertiary" onClick={() => setPasso(passo - 1)}>
                            Voltar
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="primary"
                        className="flex-1"
                        onClick={ultimo ? handleDismiss : () => setPasso(passo + 1)}
                    >
                        {ultimo ? "Entendi" : "Próximo"}
                    </Button>
                </div>
                <DialogCloseButton />
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
