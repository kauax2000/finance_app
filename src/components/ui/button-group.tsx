"use client"

import * as React from "react"
import { ButtonSizeContext, type ButtonSize } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    /**
     * O degrau de todos os botões do grupo (rodada 188), pelo
     * `ButtonSizeContext`. Um `size` no próprio botão vence.
     */
    size?: ButtonSize
    /** `vertical` empilha, e a emenda passa a ser horizontal. */
    orientation?: "horizontal" | "vertical"
}

/**
 * A emenda deitada: cantos internos achatados à esquerda e à direita, e as
 * bordas vizinhas sobrepostas em 1px, então a emenda é um fio só.
 *
 * Divisor da emenda. Numa variante de contorno a borda compartilhada já marca a
 * divisão, mas num botão preenchido os dois viram um bloco só. O filete é
 * `currentColor` a 20%: segue a cor do texto de cada variante, então clareia
 * sobre o `destructive` e escurece sobre o claro, sem token novo e sem escolher
 * cor na mão. Recuado nas pontas para não encostar no arredondamento externo,
 * e pousado em `-left-px` para cair exatamente sobre a borda compartilhada:
 * numa variante de contorno as duas somariam 2px de emenda.
 */
const HORIZONTAL = [
    "inline-flex items-center justify-start",
    "[&>*:not(:first-child)]:-ml-px",
    "[&>*:not(:first-child)]:rounded-l-none",
    "[&>*:not(:last-child)]:rounded-r-none",
    "[&>*:not(:first-child)]:before:inset-y-1.5",
    "[&>*:not(:first-child)]:before:-left-px",
    "[&>*:not(:first-child)]:before:w-px",
    // O `secondary` não tem borda que desenhe a emenda, e o filete recuado lia
    // como risco no meio de um bloco. No lugar dele a emenda é um vão de 1px
    // de cima a baixo, **transparente**: o botão deixa de sobrepor o vizinho e
    // passa a 1px dele, e o que aparece ali é a superfície de trás, qualquer
    // que seja — o grupo não precisa saber a cor do fundo.
    "[&>[data-variant=secondary]:not(:first-child)]:ml-px",
    // O campo colado (rodada 188) ocupa a sobra, e o grupo passa a ter a
    // largura de quem o contém — senão `w-full` do `Input` numa caixa que
    // encolhe ao conteúdo não resolve. No dedo o campo sobe a 40
    // (`pointer-coarse:h-10`, a régua de campo) e o botão não: o grupo iguala.
    "has-[>[data-slot=input]]:flex has-[>[data-slot=input]]:w-full [&>[data-slot=input]]:flex-1",
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
 * Botões que agem sobre a mesma coisa e por isso viram uma peça só: uma ação
 * com seu menu, um par de navegação, um campo com a sua ação.
 *
 * O grupo é quem manda no raio. Antes o `Button` carregava
 * `in-data-[slot=button-group]:rounded-xl`, que dentro do grupo deixava cada
 * filho *mais* arredondado — o oposto de colar: três pílulas encostadas, com
 * linha dupla em cada emenda.
 *
 * Não serve para um conjunto onde uma opção fica marcada: isso é `ToggleGroup`,
 * que carrega o estado pressionado e a semântica que o botão não tem.
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
                // Quem tem borda visível desenha a própria emenda, e o filete
                // por cima era um segundo traço para ela: o `outline` tem o
                // contorno no nome, e o texto do grupo também tem.
                "[&>[data-variant=outline]]:before:hidden [&>[data-slot=button-group-text]]:before:hidden",
                // O primário emenda por um vão transparente de 1px **sem o
                // `ml-px` do `secondary`**, e é medido: o fundo dele é recortado
                // no `padding-box` (a `bg-clip-padding` da base), então a borda
                // transparente de 1px de cada lado já é vão, e com a margem a
                // emenda somava 3px. O degradê do primário mora no `::after`,
                // e não no `::before`, justamente porque este seletor o
                // esconderia.
                "[&>[data-variant=primary]]:before:hidden",
                "[&>[data-variant=secondary]]:before:hidden",
                // O divisor mora 1px fora da própria caixa, por cima da aresta
                // do vizinho. Quando esse vizinho entra em hover ele sobe para
                // z-10 e cobria o filete; como o dono do divisor fica em
                // `z-auto`, o pseudo compete direto no grupo, e 20 vence 10.
                "[&>*:not(:first-child)]:before:z-20",
                // A sobreposição faz o vizinho recortar o anel de foco e a
                // borda de hover. Quem está ativo sobe. Empilhamento local, e
                // por isso número cru em vez de token de camada.
                "[&>*:hover]:z-10 [&>*:focus-visible]:z-10",
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
 * Um segmento que não se clica — o "2 de 5" entre as setas, o rótulo antes do
 * seletor (rodada 188). Ele tem borda própria (o divisor do grupo se esconde
 * nele) e o fundo `muted`, que é o que diz "isto não é botão" ao lado de
 * botões de contorno. A altura é a da fileira (`self-stretch`), então ele
 * acompanha o degrau dos botões sem saber qual é; o corpo do texto desce com
 * `xs` e `sm`, como o do `Button`.
 */
export function ButtonGroupText({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="button-group-text"
            className={cn(
                "inline-flex items-center justify-center gap-1.5 self-stretch rounded-lg border border-border bg-muted px-3",
                "text-sm whitespace-nowrap text-muted-foreground tabular-nums",
                "group-data-[size=xs]/button-group:px-2 group-data-[size=xs]/button-group:text-xs group-data-[size=sm]/button-group:px-2.5 group-data-[size=sm]/button-group:text-control-sm",
                className
            )}
            {...props}
        />
    )
}
