"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import {
    GLASS_TONE_INKS,
    GLASS_TONES,
    glassControlSurfaceClassName,
    type GlassTone,
} from "@/lib/glass-classes"
import { cn } from "@/lib/utils"

/**
 * A pastilha de vidro.
 *
 * Mesma tradução do `GlassButton`: o vidro apaga o `background-color`, então os
 * sete `bg-{tom}-muted` do `Badge soft` sumiriam. Aqui o tom vira
 * `--glass-tone`, e a tinta continua sendo o `-muted-foreground` que já pareia
 * com ele.
 *
 * ## Ela não tem `variant`, e é medida que decide
 *
 * O `Badge` tem `soft` (preenchido) e `outline` (contornado). **Vidro é a
 * terceira superfície, não um cruzamento das outras duas**: ele já traz o aro
 * como aresta própria, então `outline` seria uma segunda borda para a mesma
 * pastilha. O que sobrevive da tradução é `tone` e `size`.
 *
 * ## O anel de foco do `Badge` é hostil ao vidro, e isso fica escrito
 *
 * A base do `Badge` traz `focus-visible:ring-offset-2
 * focus-visible:ring-offset-background` — uma calha **opaca**, com a cor da
 * página, desenhada em volta da pastilha. Sobre uma superfície translúcida ela
 * lê como um recorte na peça. Ela é anulada aqui (`ring-offset-0`) e o anel
 * encosta na aresta, que é como o resto do sistema desenha foco.
 *
 * ## O aro numa caixa de 14 a 22px
 *
 * O `Badge` mede 14px (`xs`), 18 (`sm`) e 22 (`md`) de altura — bem abaixo dos
 * ~32px para que o preset `control` foi calibrado. A nuvem some nessa escala, e
 * **quem carrega a peça é o aro**: numa pastilha de 22px o eixo do aro tem
 * ~24px e a zona clara dele, 16%, dá ~4px — um brilho de canto, que é
 * exatamente o que uma pastilha de vidro tem. Não há degrau novo porque não há
 * o que ajustar: a nuvem não cabe, e dizer isso é melhor que fingir que cabe.
 */
function GlassBadge({
    className,
    tone = "primary",
    ...props
}: Omit<React.ComponentProps<typeof Badge>, "variant"> & {
    /** Os sete tons do sistema. */
    tone?: GlassTone
}) {
    return (
        <Badge
            data-slot="glass-badge"
            data-tone={tone}
            className={cn(
                glassControlSurfaceClassName,
                GLASS_TONES[tone],
                GLASS_TONE_INKS[tone],
                // A calha opaca do anel de foco: sobre vidro ela lê como um
                // recorte na peça.
                "focus-visible:ring-offset-0",
                // O realce do `soft` pintaria atrás das camadas — ver
                // `glassInteractiveClassName`. Uma pastilha não é clicável, e
                // por isso ela sai em vez de virar realce de vidro.
                "hover:bg-transparent",
                className
            )}
            {...props}
        />
    )
}

export { GlassBadge }
