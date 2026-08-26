import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

/**
 * Botões que agem sobre a mesma coisa e por isso viram uma peça só: uma ação
 * com seu menu, um par de navegação.
 *
 * O grupo é quem manda no raio. Antes o `Button` carregava
 * `in-data-[slot=button-group]:rounded-xl`, que dentro do grupo deixava cada
 * filho *mais* arredondado — o oposto de colar: três pílulas encostadas, com
 * linha dupla em cada emenda. Aqui os cantos internos são achatados e as bordas
 * vizinhas se sobrepõem em 1px, então a emenda é um fio só.
 *
 * Não serve para um conjunto onde uma opção fica marcada: isso é `ToggleGroup`,
 * que carrega o estado pressionado e a semântica que o botão não tem.
 */
export function ButtonGroup({ className, children, ...props }: ButtonGroupProps) {
    return (
        <div
            data-slot="button-group"
            className={cn(
                "inline-flex items-center justify-start",
                "[&>*:not(:first-child)]:-ml-px",
                "[&>*:not(:first-child)]:rounded-l-none",
                "[&>*:not(:last-child)]:rounded-r-none",
                // Divisor da emenda. Numa variante de contorno a borda
                // compartilhada já marca a divisão, mas num botão preenchido os
                // dois viram um bloco só. O filete é `currentColor` a 20%:
                // segue a cor do texto de cada variante, então clareia sobre o
                // primário e escurece sobre o claro, sem token novo e sem
                // escolher cor na mão. Recuado nas pontas para não encostar no
                // arredondamento externo, e pousado em `-left-px` para cair
                // exatamente sobre a borda compartilhada: numa variante de
                // contorno as duas somariam 2px de emenda.
                "[&>*:not(:first-child)]:relative",
                "[&>*:not(:first-child)]:before:pointer-events-none",
                "[&>*:not(:first-child)]:before:absolute",
                "[&>*:not(:first-child)]:before:inset-y-1.5",
                "[&>*:not(:first-child)]:before:-left-px",
                "[&>*:not(:first-child)]:before:w-px",
                "[&>*:not(:first-child)]:before:bg-current/20",
                // O divisor mora 1px fora da própria caixa, ou seja, por cima
                // da aresta do vizinho da esquerda. Quando esse vizinho entra
                // em hover ele sobe para z-10 e cobria o filete, e a emenda
                // sumia justo do lado que se está apontando. Como o dono do
                // divisor fica em `z-auto` (sem contexto de empilhamento
                // próprio), o pseudo-elemento compete direto no grupo: 20 vence
                // os 10 do botão elevado.
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
            {children}
        </div>
    )
}
