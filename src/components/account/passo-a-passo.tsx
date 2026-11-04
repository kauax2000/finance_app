"use client"

import type { ReactNode } from "react"
import Image, { type StaticImageData } from "next/image"
import { motion, type Variants } from "motion/react"
import { useAlturaAnimada } from "@/hooks/use-altura-animada"
import { cn } from "@/lib/utils"
import applePay from "./assets/atalho-6-apple-pay.webp"
import carteira from "./assets/atalho-7-carteira.webp"
import atalhos from "./assets/atalho-8-atalhos.webp"
import automacao from "./assets/atalho-9-automacao.webp"

/** Uma peça do passo: surge do desfoque, como as linhas dos diálogos (`menu-content-in`, 500ms, `--ease-out`). */
export const PECA: Variants = {
    oculto: { opacity: 0, filter: "blur(10px)" },
    visivel: {
        opacity: [0, 1, 1],
        filter: ["blur(10px)", "blur(4px)", "blur(0px)"],
        transition: { duration: 0.5, times: [0, 0.45, 1], ease: [0.16, 1, 0.3, 1] },
    },
}

export type Tela = {
    imagem: StaticImageData
    /** Onde tocar, em % da imagem inteira; sem ele, a tela só mostra o que acontece. */
    ponto?: { x: number; y: number }
    /** Que ponta da imagem fica à vista na janela. */
    ancora: "topo" | "baixo"
}

/** A notificação depois do Apple Pay: a tela do último passo do guia e a do vazio da seção. */
export const TELA_DA_NOTIFICACAO: Tela = { imagem: applePay, ancora: "topo" }

/** As telas reais do iPhone nos dois primeiros passos do guia do Apple Pay: o ícone do Atalhos e o + da Automação. */
export const TELAS_DO_APPLE_PAY: { atalhos: Tela; adicionar: Tela } = {
    atalhos: { imagem: atalhos, ponto: { x: 18.4, y: 58.6 }, ancora: "baixo" },
    adicionar: { imagem: automacao, ponto: { x: 50, y: 91.5 }, ancora: "baixo" },
}

/** A Carteira na hora de pagar (print do iPhone do dono, sem os dados dele): o convite do Apple Pay. */
export const TELA_DA_CARTEIRA: Tela = { imagem: carteira, ancora: "topo" }

/** A janela do passo: o aparelho parado na ponta dele, e o alvo no lugar do toque. */
/** As janelas por tamanho, por extenso: a do guia, a do vazio e a miniatura do convite do Apple Pay. */
const JANELA = {
    padrao: { caixa: "mx-auto h-72 w-60", imagem: "w-60", sizes: "240px", topo: "[mask-image:linear-gradient(to_top,transparent,#000_4rem)]" },
    compacta: { caixa: "mx-auto h-36 w-48", imagem: "w-48", sizes: "192px", topo: "[mask-image:linear-gradient(to_top,transparent,#000_4rem)]" },
    mini: { caixa: "h-40 w-36", imagem: "w-36", sizes: "144px", topo: "[mask-image:linear-gradient(to_top,transparent,#000_2.5rem)]" },
} as const

export function JanelaDoAparelho({
    tela,
    tamanho = "padrao",
}: {
    tela: Tela
    /** `padrao` nos passos, `compacta` no vazio da seção, `mini` ao lado de um texto. */
    tamanho?: keyof typeof JANELA
}) {
    const j = JANELA[tamanho]
    return (
        <div
            aria-hidden
            className={cn(
                "relative shrink-0 overflow-hidden",
                j.caixa,
                // O aparelho dissolve no lado em que a janela o corta.
                tela.ancora === "topo" ? j.topo : "[mask-image:linear-gradient(to_bottom,transparent,#000_4rem)]"
            )}
        >
            {/* A janela mede 288 e o aparelho inteiro, 496: ancorado embaixo, ele sobe 208. */}
            <div
                className={cn(
                    "absolute inset-x-0 aspect-[720/1488]",
                    tela.ancora === "topo" ? "top-0" : "-top-52"
                )}
            >
                <Image
                    src={tela.imagem}
                    alt=""
                    sizes={j.sizes}
                    placeholder="blur"
                    className={cn("absolute inset-0 h-auto max-w-none", j.imagem)}
                />
                {tela.ponto ? (
                    <span
                        style={{ left: `${tela.ponto.x}%`, top: `${tela.ponto.y}%` }}
                        className="absolute size-8 -translate-x-1/2 -translate-y-1/2"
                    >
                        <span className="absolute inset-0 rounded-full bg-scrim-foreground/30 motion-safe:animate-ping" />
                        <span className="absolute inset-0 rounded-full ring-2 ring-scrim-foreground" />
                    </span>
                ) : null}
            </div>
        </div>
    )
}

/**
 * A caixa do passo: cada passo tem a altura dele, e a caixa anda de uma altura à
 * outra numa mola só (`data-altura-em-voo` diz ao diálogo que a altura já anda
 * aqui). As peças do passo chegam uma a uma, do desfoque e no lugar: nada anda de
 * lado. `entrar` já embute o movimento reduzido de quem chama.
 */
export function CaixaDoPasso({ chave, entrar, children }: { chave: string; entrar: boolean; children: ReactNode }) {
    const alturaAnimada = useAlturaAnimada<HTMLDivElement>()
    return (
        <div ref={alturaAnimada} data-altura-em-voo="">
            <motion.div
                key={chave}
                initial={entrar ? "oculto" : false}
                animate="visivel"
                transition={{ staggerChildren: 0.03, delayChildren: 0.04 }}
                className="flex flex-col gap-4"
            >
                {children}
            </motion.div>
        </div>
    )
}

/** Uma peça do passo, que chega do desfoque na onda da caixa. */
export function PecaDoPasso({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <motion.div variants={PECA} className={className}>
            {children}
        </motion.div>
    )
}

/** Os pontos do passo: lugar fixo, acima dos botões; o atual se alonga. */
export function PontosDoPasso({ total, atual }: { total: number; atual: number }) {
    return (
        <div aria-hidden className="flex shrink-0 justify-center gap-1.5 pt-4">
            {Array.from({ length: total }, (_, i) => (
                <span
                    key={i}
                    className={cn(
                        "h-1.5 rounded-full transition-[width,background-color] duration-(--duration-spring) ease-(--ease-spring)",
                        i === atual ? "w-5 bg-foreground" : "w-1.5 bg-muted-foreground/40"
                    )}
                />
            ))}
        </div>
    )
}
