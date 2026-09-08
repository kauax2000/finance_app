"use client"

import * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import {
    GLASS_MATERIALS,
    glassControlSurfaceClassName,
    glassSurfaceClassName,
} from "@/lib/glass-classes"

/**
 * O eixo mora aqui e as strings moram na régua — `cva` fora de
 * `components/ui/` é reprovado pela regra A2 do auditor, e classe literal fora
 * do que o Tailwind varre não existe. Cada um no seu lugar.
 */
const glassVariants = cva("", {
    variants: {
        size: {
            panel: glassSurfaceClassName,
            control: glassControlSurfaceClassName,
        },
        /** Ausência é o pintado. Os três degraus são o material do iOS. */
        material: GLASS_MATERIALS,
    },
    defaultVariants: { size: "panel" },
})

/**
 * A superfície de vidro, vestível.
 *
 * **Ele é conveniência, não a primitiva.** A receita mora na `@utility glass` de
 * `globals.css` e a régua em `lib/glass-classes.ts`; este arquivo existe para os
 * dois casos em que compor as classes à mão seria pior:
 *
 * - **vestir uma peça que já existe**, sem tocar na `className` dela —
 *   `<Glass asChild><AppThemeToggle /></Glass>`, que é a forma que o pedido
 *   descreve. Com `asChild` nenhum nó é criado: o `Slot` mescla as classes no
 *   filho.
 * - **ser dono da casca**, quando ninguém mais é — `<Glass className="rounded-xl
 *   p-4">`.
 *
 * Quem já tem casca própria e a controla (a `Sidebar`, por exemplo) compõe
 * `glassSurfaceClassName` direto: um `<div>` interposto quebraria o contexto de
 * uma primitiva do Radix, e é o mesmo argumento que o `ScrollFade` registra.
 *
 * ## As três armadilhas
 *
 * Elas estão escritas por extenso em `lib/glass-classes.ts` e valem para
 * qualquer superfície: o shorthand `background` **apaga** o `background-color`
 * de quem veste; a borda transparente de 1px **toma** a borda e encolhe o
 * conteúdo em 2px; e o raio é **herdado**, que é justamente o que torna a peça
 * portátil entre um `rounded-full` e um `rounded-xl`.
 *
 * ## `material` é um eixo de premissa, e não de gosto
 *
 * Sem ele a peça é o vidro **pintado**: luz desenhada, porque a premissa é que
 * não há conteúdo atrás. Com ele é o material do iOS — borrão de verdade,
 * vibrância, e a lâmina aberta para o que está atrás aparecer.
 *
 * **Ligá-lo onde nada passa por baixo deixa a peça pior**: o borrão não tem o
 * que borrar e a lâmina abriu à toa. A régua está em `lib/glass-classes.ts`,
 * como a quarta armadilha.
 *
 * Os três degraus vêm do iOS e diferem na **opacidade da lâmina**, nunca no
 * raio — um material mais fino mostra mais do que está atrás. A escada nasceu
 * sem caso medido, por decisão do dono, e isso fica dito: a régua desta casa é
 * que eixo sem contagem é ficção, e ela já removeu dois.
 */
function Glass({
    className,
    size = "panel",
    material,
    asChild = false,
    ...props
}: React.ComponentProps<"div"> &
    VariantProps<typeof glassVariants> & {
        asChild?: boolean
    }) {
    const Comp = asChild ? Slot.Root : "div"

    return (
        <Comp
            data-slot="glass"
            data-size={size}
            data-material={material}
            className={cn(glassVariants({ size, material }), className)}
            {...props}
        />
    )
}

export { Glass, glassVariants }
