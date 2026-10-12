"use client"

import * as React from "react"
import { ButtonSizeContext, type ButtonSize } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    /** O degrau de todos os botões do grupo (pelo `ButtonSizeContext`); um `size` no próprio botão vence. */
    size?: ButtonSize
    /** `vertical` empilha, e a emenda passa a ser horizontal. */
    orientation?: "horizontal" | "vertical"
}

/**
 * A emenda deitada: cantos internos achatados e bordas vizinhas sobrepostas em
 * 1px. O filete divisor é `currentColor` a 20% (segue a cor de cada variante),
 * recuado nas pontas e pousado em `-left-px` sobre a borda compartilhada.
 */
// A emenda só vale entre botões; com um campo no grupo as peças ficam separadas
// por 8px. Cada classe leva `not-has-[>[data-slot=input]]:` por extenso: o
// Tailwind lê o código como texto, e um prefixo montado num template não gera
// classe nenhuma.
const HORIZONTAL = [
    "inline-flex items-center justify-start",
    "not-has-[>[data-slot=input]]:[&>*:not(:first-child)]:-ml-px",
    "not-has-[>[data-slot=input]]:[&>*:not(:first-child)]:rounded-l-none",
    "not-has-[>[data-slot=input]]:[&>*:not(:last-child)]:rounded-r-none",
    "not-has-[>[data-slot=input]]:[&>*:not(:first-child)]:before:inset-y-1.5",
    "not-has-[>[data-slot=input]]:[&>*:not(:first-child)]:before:-left-px",
    "not-has-[>[data-slot=input]]:[&>*:not(:first-child)]:before:w-px",
    // O `secondary` não tem borda que desenhe a emenda: no lugar do filete, um
    // vão transparente de 1px mostra a superfície de trás, qualquer que seja.
    "not-has-[>[data-slot=input]]:[&>[data-variant=secondary]:not(:first-child)]:ml-px",
    // O campo ocupa a sobra e o grupo ganha a largura de quem o contém; no dedo
    // o campo sobe a 40 e o grupo iguala os botões.
    "has-[>[data-slot=input]]:flex has-[>[data-slot=input]]:w-full has-[>[data-slot=input]]:gap-2 [&>[data-slot=input]]:flex-1",
    "pointer-coarse:has-[>[data-slot=input]]:*:h-10",
]

/** A mesma emenda, em pé: cantos de cima e de baixo, fio na horizontal. */
const VERTICAL = [
    "inline-flex flex-col items-stretch",
    "[&>*:not(:first-child)]:-mt-px",
    "[&>*:not(:first-child)]:rounded-t-none",
    "[&>*:not(:last-child)]:rounded-b-none",
    "[&>*:not(:first-child)]:before:inset-x-1.5",
    "[&>*:not(:first-child)]:before:-top-px",
    "[&>*:not(:first-child)]:before:h-px",
    "[&>[data-variant=secondary]:not(:first-child)]:mt-px",
]

/**
 * Botões que agem sobre a mesma coisa e viram uma peça só: uma ação com seu
 * menu, um par de navegação, um campo com a sua ação. O grupo manda no raio.
 * Conjunto com opção marcada é `ToggleGroup`.
 */
export function ButtonGroup({
    className,
    children,
    size,
    orientation = "horizontal",
    ...props
}: ButtonGroupProps) {
    return (
        <div
            data-slot="button-group"
            data-size={size}
            data-orientation={orientation}
            className={cn(
                "group/button-group",
                orientation === "vertical" ? VERTICAL : HORIZONTAL,
                "[&>*:not(:first-child)]:relative",
                "[&>*:not(:first-child)]:before:pointer-events-none",
                "[&>*:not(:first-child)]:before:absolute",
                "[&>*:not(:first-child)]:before:bg-current/20",
                // Quem tem borda visível desenha a própria emenda; o filete
                // por cima seria um segundo traço.
                "[&>[data-variant=outline]]:before:hidden [&>[data-slot=button-group-text]]:before:hidden",
                // O primário emenda por um vão transparente de 1px sem o
                // `ml-px` do `secondary`: o fundo recortado no `padding-box`
                // já deixa o vão, e com a margem a emenda somava 3px.
                "[&>[data-variant=primary]]:before:hidden",
                "[&>[data-variant=secondary]]:before:hidden",
                // O divisor mora 1px fora da caixa; o vizinho em hover sobe a
                // z-10 e cobria o filete, então o pseudo usa 20.
                "[&>*:not(:first-child)]:before:z-20",
                // A sobreposição recorta o anel de foco do vizinho; quem está
                // ativo sobe. Empilhamento local, número cru.
                "[&>*]:hover:z-10 [&>*:focus-visible]:z-10",
                className
            )}
            role="group"
            {...props}
        >
            <ButtonSizeContext value={size}>{children}</ButtonSizeContext>
        </div>
    )
}

/**
 * Um segmento que não se clica (o "2 de 5" entre as setas). Borda própria, fundo
 * `muted` e a altura da fileira (`self-stretch`).
 */
export function ButtonGroupText({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="button-group-text"
            className={cn(
                "inline-flex items-center justify-center gap-1.5 self-stretch rounded-full border border-border bg-muted px-3",
                "text-sm whitespace-nowrap text-muted-foreground tabular-nums",
                "group-data-[size=xs]/button-group:px-2 group-data-[size=xs]/button-group:text-xs group-data-[size=sm]/button-group:px-2.5 group-data-[size=sm]/button-group:text-control-sm",
                className
            )}
            {...props}
        />
    )
}
