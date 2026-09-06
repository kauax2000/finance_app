"use client"

import * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import {
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
 * ## Sem eixo de intensidade
 *
 * Zero contagem. Quem precisar de um vidro mais forte ou mais fraco sobrescreve
 * os cinco tokens no próprio elemento — eles são variáveis, e variável herda.
 * Um eixo sem caso medido é ficção, e este projeto já removeu dois.
 */
function Glass({
    className,
    size = "panel",
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
            className={cn(glassVariants({ size }), className)}
            {...props}
        />
    )
}

export { Glass, glassVariants }
