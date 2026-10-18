"use client"

import { motion, useReducedMotion } from "motion/react"
import {
    ArrowTrendingUpIcon,
    CheckIcon,
    CreditCardIcon,
    ExclamationCircleIcon,
} from "@heroicons/react/16/solid"

import { MOLA } from "@/lib/spring"
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

export function NotificationsEmptyIllustration({ className }: { className?: string }) {
    const parado = useReducedMotion() ?? false

    return (
        <div aria-hidden className={cn("relative h-36 w-full max-w-64", className)}>
            {/* A luz atrás da pilha, no azul da não lida. Degradê radial, e não um círculo
                com `blur`: o borrão de 64px passava da caixa e o Chrome o recortava numa
                linha reta que atravessava a folha. */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 size-80 -translate-1/2 bg-radial from-info/15 to-transparent to-60%" />

            {CARTOES.map((c, i) => {
                const frente = i === CARTOES.length - 1
                return (
                    <motion.div
                        key={i}
                        className="absolute top-1/2 left-1/2 -mt-6 -ml-24 w-48"
                        initial={parado ? false : { opacity: 0, x: 0, y: 24, rotate: 0, scale: 0.9 }}
                        animate={{ opacity: 1, x: c.x, y: c.y, rotate: c.giro, scale: c.escala }}
                        transition={{ ...MOLA, delay: 0.08 * i }}
                    >
                        {/* A flutuação mora num nó próprio, para não brigar com a entrada. */}
                        <motion.div
                            animate={parado ? undefined : { y: [0, -3, 0] }}
                            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: 0.6 + 0.3 * i }}
                            className="relative flex h-12 items-center gap-2.5 overflow-hidden rounded-row-lg border border-border bg-card bg-clip-padding px-2.5 shadow-md"
                        >
                            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full [&_svg]:size-3.5", c.tom)}>
                                <c.Icone />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <span className={cn("h-1.5 rounded-full bg-foreground/25", c.titulo)} />
                                <span className={cn("h-1.5 rounded-full bg-muted-foreground/25", c.descricao)} />
                            </span>
                            <span className="flex shrink-0 items-center gap-1 self-start pt-2">
                                <span className="h-1.5 w-5 rounded-full bg-muted-foreground/25" />
                                {frente ? <span className="size-1.5 rounded-full bg-info" /> : null}
                            </span>
                            {/* O véu das de trás: escurece o conteúdo, e o cartão continua chapado. */}
                            {c.veu ? <span className={cn("absolute inset-0", c.veu)} /> : null}
                        </motion.div>
                    </motion.div>
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
