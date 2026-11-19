"use client"

import { useEffect, useState } from "react"
import Image, { type StaticImageData } from "next/image"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  DialogBody,
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FormCancel } from "@/components/ui/form"
import { ChevronLeftIcon } from "@heroicons/react/16/solid"
import { useIsMobile } from "@/hooks/use-mobile"
import { MOLA, SAIDA } from "@/lib/spring"
import { cn } from "@/lib/utils"
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

function dispensarAviso() {
    try {
        localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, "1")
    } catch {
        /* ignore */
    }
}

/** A janela mede 288 e o aparelho inteiro, 496: ancorado embaixo, ele sobe 208. */
const SUBIDA_DO_APARELHO = -208

export function InstallPwaSheet({ open, onOpenChange }: InstallPwaSheetProps) {
    const [passo, setPasso] = useState(0)
    const celular = useIsMobile()
    const reduzido = useReducedMotion()
    const [abertoAntes, setAbertoAntes] = useState(open)
    if (open !== abertoAntes) {
        setAbertoAntes(open)
        if (open) setPasso(0)
    }

    const handleDismiss = () => {
        dispensarAviso()
        onOpenChange(false)
    }

    const atual = PASSOS[passo]
    const ultimo = passo === PASSOS.length - 1
    const movimento = reduzido ? { duration: 0 } : MOLA

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                variant="flush"
                className="max-h-dvh gap-0 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            >
                <DialogHeader>
                    <DialogTitle>Instalar no iPhone</DialogTitle>
                    <DialogDescription>
                        Use o Finance como app, sem a barra do Safari. Abra pelo Safari: em outro navegador o caminho muda.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="flex flex-col gap-4">
                    <div
                        className={cn(
                            "relative mx-auto h-72 w-60 shrink-0 overflow-hidden",
                            // O aparelho dissolve no lado em que a janela o corta.
                            atual.ancora === "topo"
                                ? "[mask-image:linear-gradient(to_top,transparent,#000_4rem)]"
                                : "[mask-image:linear-gradient(to_bottom,transparent,#000_4rem)]"
                        )}
                    >
                        {/* Um aparelho só: as telas trocam no fade, ele anda quando o corte muda
                            de lado e o alvo desliza até o próximo toque. */}
                        <motion.div
                            initial={false}
                            animate={{ y: atual.ancora === "topo" ? 0 : SUBIDA_DO_APARELHO }}
                            transition={movimento}
                            className="absolute inset-x-0 top-0 aspect-[720/1488]"
                        >
                            {PASSOS.map((p, i) => (
                                <Image
                                    key={p.titulo}
                                    src={p.imagem}
                                    alt=""
                                    sizes="240px"
                                    // O webp já sai no tamanho: do CDN como está, sem o otimizador sob demanda.
                                    unoptimized
                                    placeholder="blur"
                                    className={cn(
                                        "absolute inset-0 h-auto w-60 max-w-none transition-opacity duration-(--duration-slow) ease-(--ease-out)",
                                        i === passo ? "opacity-100" : "opacity-0"
                                    )}
                                />
                            ))}
                            <motion.span
                                initial={false}
                                animate={{ left: `${atual.ponto.x}%`, top: `${atual.ponto.y}%` }}
                                transition={movimento}
                                className="absolute size-8 -translate-x-1/2 -translate-y-1/2"
                                aria-hidden
                            >
                                <span className="absolute inset-0 rounded-full bg-scrim-foreground/30 motion-safe:animate-ping" />
                                <span className="absolute inset-0 rounded-full ring-2 ring-scrim-foreground" />
                            </motion.span>
                        </motion.div>
                    </div>
                    <div aria-hidden className="flex shrink-0 justify-center gap-1.5">
                        {PASSOS.map((p, i) => (
                            <span
                                key={p.titulo}
                                className={cn(
                                    "h-1.5 rounded-full transition-[width,background-color] duration-(--duration-spring) ease-(--ease-spring)",
                                    i === passo ? "w-5 bg-foreground" : "w-1.5 bg-muted-foreground/40"
                                )}
                            />
                        ))}
                    </div>
                    <div aria-live="polite" className="shrink-0">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={passo}
                                initial={reduzido ? false : { opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={reduzido ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -6, transition: SAIDA }}
                                transition={MOLA}
                            >
                                <P className="font-semibold">{atual.titulo}</P>
                                <Muted>{atual.texto}</Muted>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </DialogBody>
                <DialogFooter>
                    {passo > 0 && <FormCancel onClick={() => setPasso(passo - 1)}>Voltar</FormCancel>}
                    <Button
                        type="button"
                        variant="primary"
                        onClick={ultimo ? handleDismiss : () => setPasso(passo + 1)}
                    >
                        {ultimo ? "Entendi" : "Próximo"}
                    </Button>
                </DialogFooter>
                {/* O ‹ é o espelho do ✕, como no Importar: no telefone o Voltar do rodapé (`FormCancel`) some, e ele sobe ao canto. */}
                {celular && passo > 0 ? (
                    <Button
                        type="button"
                        variant="tertiary"
                        size="icon-md"
                        aria-label="Voltar"
                        className="absolute top-2.5 left-2.5 z-20"
                        onClick={() => setPasso(passo - 1)}
                    >
                        <ChevronLeftIcon />
                    </Button>
                ) : null}
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

    // Fechar pelo × ou pelo gesto também dispensa: o "Entendi" está a três toques.
    const handleOpenChange = (next: boolean) => {
        if (!next) dispensarAviso()
        setOpen(next)
    }

    return <InstallPwaSheet open={open} onOpenChange={handleOpenChange} />
}
