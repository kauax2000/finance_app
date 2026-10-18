"use client"

import { motion, useReducedMotion } from "motion/react"
import * as React from "react"
import {
    ArrowTrendingUpIcon,
    CheckIcon,
    CreditCardIcon,
    ExclamationCircleIcon,
    LockClosedIcon,
    WalletIcon,
} from "@heroicons/react/16/solid"

import { ColorTile } from "@/components/ui/color-tile"
import { MOLA } from "@/lib/spring"
import { TILE_PALETTE } from "@/lib/tile-palette"
import { cn } from "@/lib/utils"
import type { HeroIcon } from "@/types/navigation"

/**
 * A ilustração da caixa vazia: três notificações em miniatura, abertas em leque,
 * na mesma língua das linhas de verdade — o círculo cheio do tom (orçamento,
 * fatura, estouro: o que esta caixa entrega), o título, a descrição, a hora e o
 * ponto azul de não lida na da frente. Entram do monte na mola da casa, uma
 * depois da outra, e depois flutuam poucos pixels; com movimento reduzido,
 * aparecem paradas no lugar.
 * Decorativa (`aria-hidden`): quem diz o que houve é o título do vazio.
 */
type Cartao = {
    tom: string
    Icone: HeroIcon
    x: number
    y: number
    giro: number
    escala: number
    veu: string
    titulo: string
    descricao: string
}

// De trás para a frente, em zigue-zague: cada uma inclina para um lado (direita,
// esquerda, direita) e anda para o mesmo lado, a 28 e 36px uma da outra (a do
// meio inclina para baixo na ponta do ícone, e a da frente o cobria). Cada
// círculo fica à vista, e o conjunto é centrado na caixa. A
// profundidade é a escala e o véu (`veu`), nunca transparência do cartão: o
// fundo de cada um é chapado.
const CARTOES: Cartao[] = [
    { tom: "bg-warning text-warning-foreground", Icone: ArrowTrendingUpIcon, x: 18, y: -32, giro: 6, escala: 0.9, veu: "bg-background/45", titulo: "w-3/5", descricao: "w-2/5" },
    { tom: "bg-info text-info-foreground", Icone: CreditCardIcon, x: -22, y: -4, giro: -6, escala: 0.95, veu: "bg-background/25", titulo: "w-1/2", descricao: "w-3/5" },
    { tom: "bg-destructive text-destructive-foreground", Icone: ExclamationCircleIcon, x: 10, y: 32, giro: 3, escala: 1, veu: "", titulo: "w-2/3", descricao: "w-1/2" },
]

/** O cartão em miniatura: chapado, no raio da linha alta, com a sombra das placas. */
const CASCA =
    "relative flex h-12 items-center gap-2.5 overflow-hidden rounded-row-lg border border-border bg-card bg-clip-padding px-2.5 shadow-md"

/** Quando o leque assenta: a da frente chega aos ~0,6s, e os detalhes vêm depois. */
const LEQUE_ASSENTA_S = 0.6

/**
 * A luz atrás da cena, num degradê radial e não num círculo com `blur`: o borrão
 * de 64px passava da caixa e o Chrome o recortava numa linha reta que
 * atravessava a folha.
 */
function Luz({ tom, className }: { tom: string; className?: string }) {
    return (
        <div
            className={cn(
                "pointer-events-none absolute top-1/2 left-1/2 size-80 -translate-1/2 bg-radial to-transparent to-60%",
                tom,
                className
            )}
        />
    )
}

/**
 * Um cartão do leque: entra do monte na mola, um depois do outro, até o lugar
 * dele no zigue-zague, e depois flutua poucos pixels (num nó próprio, para não
 * brigar com a entrada). O véu das de trás escurece o conteúdo, e o cartão
 * continua chapado.
 */
function CartaoNoLeque({
    cartao,
    indice,
    parado,
    className,
    children,
}: {
    cartao: Cartao
    indice: number
    parado: boolean
    className?: string
    children: React.ReactNode
}) {
    return (
        <motion.div
            className="absolute top-1/2 left-1/2 -mt-6 -ml-24 w-48"
            initial={parado ? false : { opacity: 0, x: 0, y: 24, rotate: 0, scale: 0.9 }}
            animate={{ opacity: 1, x: cartao.x, y: cartao.y, rotate: cartao.giro, scale: cartao.escala }}
            transition={{ ...MOLA, delay: 0.08 * indice }}
        >
            <motion.div
                animate={parado ? undefined : { y: [0, -3, 0] }}
                transition={{ duration: 4 + indice, repeat: Infinity, ease: "easeInOut", delay: 0.6 + 0.3 * indice }}
                className={cn(CASCA, className)}
            >
                {children}
                {cartao.veu ? <span className={cn("absolute inset-0", cartao.veu)} /> : null}
            </motion.div>
        </motion.div>
    )
}

/** O título e a descrição em traço; `apagado` é o texto que ainda não se lê. */
function Linhas({ cartao, apagado = false }: { cartao: Cartao; apagado?: boolean }) {
    return (
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className={cn("h-1.5 rounded-full", apagado ? "bg-foreground/12" : "bg-foreground/25", cartao.titulo)} />
            <span className={cn("h-1.5 rounded-full", apagado ? "bg-muted-foreground/12" : "bg-muted-foreground/25", cartao.descricao)} />
        </span>
    )
}

export function NotificationsEmptyIllustration({ className }: { className?: string }) {
    const parado = useReducedMotion() ?? false

    return (
        <div aria-hidden className={cn("relative h-36 w-full max-w-64", className)}>
            <Luz tom="from-info/15" />
            {CARTOES.map((c, i) => (
                <CartaoNoLeque key={i} cartao={c} indice={i} parado={parado}>
                    <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full [&_svg]:size-3.5", c.tom)}>
                        <c.Icone />
                    </span>
                    <Linhas cartao={c} />
                    <span className="flex shrink-0 items-center gap-1 self-start pt-2">
                        <span className="h-1.5 w-5 rounded-full bg-muted-foreground/25" />
                        {i === CARTOES.length - 1 ? <span className="size-1.5 rounded-full bg-info" /> : null}
                    </span>
                </CartaoNoLeque>
            ))}
        </div>
    )
}

/**
 * Sem conta: os avisos estão ali, trancados. Os mesmos três cartões, com o círculo
 * neutro e o texto apagado (ainda não se lê); quando o leque assenta, o círculo da
 * frente vira o cadeado chapado, num estalo de mola. Decorativa (`aria-hidden`).
 */
export function NotificationsLockedIllustration({ className }: { className?: string }) {
    const parado = useReducedMotion() ?? false

    return (
        <div aria-hidden className={cn("relative h-36 w-full max-w-64", className)}>
            <Luz tom="from-foreground/8" />
            {CARTOES.map((c, i) => {
                const frente = i === CARTOES.length - 1
                return (
                    <CartaoNoLeque key={i} cartao={c} indice={i} parado={parado}>
                        <span className="relative size-7 shrink-0">
                            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-3.5">
                                <c.Icone />
                            </span>
                            {frente ? (
                                <motion.span
                                    className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground text-background [&_svg]:size-3.5"
                                    initial={parado ? false : { opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        opacity: { duration: 0.2, delay: LEQUE_ASSENTA_S },
                                        scale: { ...MOLA, delay: LEQUE_ASSENTA_S },
                                    }}
                                >
                                    <LockClosedIcon />
                                </motion.span>
                            ) : null}
                        </span>
                        <Linhas cartao={c} apagado />
                        <span className="h-1.5 w-5 shrink-0 self-start rounded-full bg-muted-foreground/12 mt-2" />
                    </CartaoNoLeque>
                )
            })}
        </div>
    )
}

/** As carteiras da cena: três cores da paleta que a pessoa escolhe para elas. */
const CORES_DAS_CARTEIRAS = [TILE_PALETTE[0].hex, TILE_PALETTE[3].hex, TILE_PALETTE[6].hex] as const

/**
 * Sem carteira: os cartões viram linhas do seletor de carteira — o ladrilho de
 * cor (a paleta da carteira) e o nome. Quando o leque assenta, a da frente é a
 * escolhida: o contorno acende e o ✓ se desenha na ponta. Decorativa (`aria-hidden`).
 */
export function NotificationsWalletsIllustration({ className }: { className?: string }) {
    const parado = useReducedMotion() ?? false

    return (
        <div aria-hidden className={cn("relative h-36 w-full max-w-64", className)}>
            <Luz tom="from-foreground/8" />
            {CARTOES.map((c, i) => {
                const frente = i === CARTOES.length - 1
                return (
                    <CartaoNoLeque key={i} cartao={c} indice={i} parado={parado}>
                        <ColorTile size="xs" color={CORES_DAS_CARTEIRAS[i]}>
                            <WalletIcon />
                        </ColorTile>
                        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <span className={cn("h-1.5 rounded-full bg-foreground/25", c.titulo)} />
                            <span className="h-1.5 w-1/4 rounded-full bg-muted-foreground/25" />
                        </span>
                        {frente ? (
                            <>
                                <motion.span
                                    className="flex shrink-0 text-foreground [&_svg]:size-4"
                                    initial={parado ? false : { clipPath: "inset(0 100% 0 0)" }}
                                    animate={{ clipPath: "inset(0 0% 0 0)" }}
                                    transition={{ duration: 0.3, ease: "easeOut", delay: LEQUE_ASSENTA_S + 0.15 }}
                                >
                                    <CheckIcon />
                                </motion.span>
                                {/* O contorno da escolhida, por dentro da casca. */}
                                <motion.span
                                    className="pointer-events-none absolute inset-0 rounded-[inherit] ring-2 ring-foreground/50 ring-inset"
                                    initial={parado ? false : { opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.25, delay: LEQUE_ASSENTA_S }}
                                />
                            </>
                        ) : null}
                    </CartaoNoLeque>
                )
            })}
        </div>
    )
}

/**
 * A ilustração do "Tudo lido", na mesma língua: os três cartões chegam no
 * zigue-zague da caixa vazia e se arrumam numa pilha reta, na mola — a caixa
 * foi organizada. As de trás perdem a cor (o círculo neutro cobre o do tom), o
 * ponto azul de não lida se apaga, e o círculo da frente vira o ✓ verde, que se
 * desenha depois que a pilha assenta. Com movimento reduzido, a pilha aparece
 * arrumada e parada. Decorativa (`aria-hidden`).
 */
// A 9px uma da outra: cada uma de trás aparece numa faixa de ~6px acima da
// seguinte (com 7px elas sumiam num fio). Centrada na caixa.
const PILHA = [
    { y: -13, escala: 0.88 },
    { y: -4, escala: 0.94 },
    { y: 9, escala: 1 },
] as const

/** Quando a pilha assenta (a mola sai do zigue-zague aos ~250ms) e a cor muda. */
const ASSENTA_S = 0.55

export function NotificationsReadIllustration({ className }: { className?: string }) {
    const parado = useReducedMotion() ?? false

    return (
        <div aria-hidden className={cn("relative h-24 w-full max-w-64", className)}>
            {/* A luz atrás da pilha, agora no verde do "deu certo" (degradê, sem `blur`). */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 size-72 -translate-1/2 bg-radial from-success/15 to-transparent to-60%" />

            {CARTOES.map((c, i) => {
                const frente = i === CARTOES.length - 1
                const atraso = parado ? 0 : ASSENTA_S + 0.05 * i
                return (
                    <motion.div
                        key={i}
                        className="absolute top-1/2 left-1/2 -mt-6 -ml-24 w-48"
                        initial={parado ? false : { opacity: 0, x: c.x, y: c.y, rotate: c.giro, scale: c.escala }}
                        animate={{ opacity: 1, x: 0, y: PILHA[i].y, rotate: 0, scale: PILHA[i].escala }}
                        transition={{
                            opacity: { duration: 0.2, delay: 0.05 * i },
                            default: { ...MOLA, delay: 0.25 + 0.06 * i },
                        }}
                    >
                        <div className="relative flex h-12 items-center gap-2.5 overflow-hidden rounded-row-lg border border-border bg-card bg-clip-padding px-2.5 shadow-md">
                            <span className="relative size-7 shrink-0">
                                <span className={cn("absolute inset-0 flex items-center justify-center rounded-full [&_svg]:size-3.5", c.tom)}>
                                    <c.Icone />
                                </span>
                                {/* Lida: a da frente vira o ✓ verde; as de trás, o círculo neutro. */}
                                <motion.span
                                    className={cn(
                                        "absolute inset-0 flex items-center justify-center rounded-full [&_svg]:size-3.5",
                                        frente ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                                    )}
                                    initial={parado ? false : { opacity: 0, scale: frente ? 0.6 : 1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ opacity: { duration: 0.25, delay: atraso }, scale: { ...MOLA, delay: atraso } }}
                                >
                                    {frente ? (
                                        <motion.span
                                            className="flex"
                                            initial={parado ? false : { clipPath: "inset(0 100% 0 0)" }}
                                            animate={{ clipPath: "inset(0 0% 0 0)" }}
                                            transition={{ duration: 0.3, ease: "easeOut", delay: atraso + 0.15 }}
                                        >
                                            <CheckIcon />
                                        </motion.span>
                                    ) : (
                                        <c.Icone />
                                    )}
                                </motion.span>
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <span className={cn("h-1.5 rounded-full bg-foreground/25", c.titulo)} />
                                <span className={cn("h-1.5 rounded-full bg-muted-foreground/25", c.descricao)} />
                            </span>
                            <span className="flex shrink-0 items-center gap-1 self-start pt-2">
                                <span className="h-1.5 w-5 rounded-full bg-muted-foreground/25" />
                                {/* O ponto de não lida se apaga quando a pilha assenta. */}
                                {frente ? (
                                    <motion.span
                                        className="size-1.5 rounded-full bg-info"
                                        initial={parado ? false : { opacity: 1 }}
                                        animate={{ opacity: 0 }}
                                        transition={{ duration: 0.25, delay: atraso }}
                                    />
                                ) : null}
                            </span>
                            {c.veu ? <span className={cn("absolute inset-0", c.veu)} /> : null}
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
