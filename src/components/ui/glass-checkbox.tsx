"use client"

import * as React from "react"

import { Checkbox } from "@/components/ui/checkbox"
import {
    glassControlSurfaceClassName,
    glassInteractiveClassName,
} from "@/lib/glass-classes"
import { cn } from "@/lib/utils"

/**
 * A caixa de marcar de vidro.
 *
 * **É a menor das quatro, e a escala é o assunto.** Ela mede 16×16px, contra os
 * ~32px para que o preset `control` foi calibrado. A conta: a nuvem de `control`
 * (70% da altura) dá **11px**, e o eixo do aro numa caixa de 16 mede ~20px, com
 * a zona clara em 16% — ou seja **3px** de brilho de canto.
 *
 * Nessa escala **a nuvem não existe como nuvem** — ela vira um degradê de canto
 * indistinguível do próprio aro. O que carrega a peça é a aresta, e isso é dito
 * aqui em vez de a peça fingir ter três camadas de luz que ninguém enxerga.
 *
 * ## O estado marcado é a mudança de verdade
 *
 * O `Checkbox` pinta o marcado em três propriedades de uma vez —
 * `data-[state=checked]:` com `border-primary`, `bg-primary` e
 * `text-primary-foreground`. Sobre vidro **duas das três falham**: o fundo passa
 * a pintar atrás das camadas e some, e a tinta branca deixa de parear com um
 * preenchimento que não existe mais.
 *
 * Aqui o marcado vira **tom da lâmina**, e a tinta acompanha para o
 * `-muted-foreground`, que é o par calibrado do mesmo `-muted`. O contorno
 * continua verde, porque ele é a única das três que sobrevive intacta e é o que
 * torna o estado legível numa caixa de 16px.
 */
function GlassCheckbox({
    className,
    ...props
}: React.ComponentProps<typeof Checkbox>) {
    return (
        <Checkbox
            data-slot="glass-checkbox"
            className={cn(
                glassControlSurfaceClassName,
                glassInteractiveClassName,
                // O realce do `Checkbox` pintaria atrás do vidro — ver
                // `glassInteractiveClassName`. Anulado para o `twMerge` o
                // remover em vez de o deixar morto na folha.
                "hover:bg-transparent",
                // O marcado: tom em vez de preenchimento, e a tinta do par.
                "data-[state=checked]:[--glass-tone:color-mix(in_oklab,var(--primary-muted)_80%,transparent)]",
                "data-[state=indeterminate]:[--glass-tone:color-mix(in_oklab,var(--primary-muted)_80%,transparent)]",
                "data-[state=checked]:bg-transparent data-[state=indeterminate]:bg-transparent",
                "data-[state=checked]:text-primary-muted-foreground data-[state=indeterminate]:text-primary-muted-foreground",
                className
            )}
            {...props}
        />
    )
}

export { GlassCheckbox }
