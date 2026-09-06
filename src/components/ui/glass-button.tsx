"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
    GLASS_TONE_INKS,
    GLASS_TONES,
    glassControlSurfaceClassName,
    glassInteractiveClassName,
    type GlassTone,
} from "@/lib/glass-classes"
import { cn } from "@/lib/utils"

/**
 * O botão de vidro.
 *
 * **Ele não é o `Button` com uma classe: ele traduz a cor.** O vidro apaga o
 * `background-color` de quem o veste, então um `primary` de vidro perderia o
 * verde. Aqui a hierarquia deixa de ser preenchimento e vira **tom da lâmina** —
 * `--glass-tone`, a camada que a receita pinta acima dela.
 *
 * É essa tradução que o separa de `<Glass asChild><Button /></Glass>`, que
 * também compila e sai sem cor nenhuma.
 *
 * ## Por que `tone` e não `variant`
 *
 * O eixo `variant` do `Button` é **peso** — `primary` preenche, `secondary`
 * preenche de cinza, `tertiary` não preenche. Vidro é **superfície**, e as duas
 * coisas são ortogonais: um vidro não tem como ser "mais preenchido". O que
 * sobrevive da tradução é a **cor**, e a cor do sistema tem sete nomes, que são
 * os mesmos do `Badge`.
 *
 * ## A tinta vem do par `-muted`, e isso não é atalho
 *
 * `text-{tom}-muted-foreground` é a tinta que o `Badge soft` já usa sobre
 * `bg-{tom}-muted`, e o par é calibrado nos dois temas. Como o tom do vidro é
 * derivado desse mesmo `-muted`, a tinta acompanha sem medição nova.
 *
 * **Consequência que precisa ser dita:** um botão de vidro `primary` **não** é
 * um botão verde preenchido com texto branco. Ele é uma lâmina verde translúcida
 * com tinta verde escura no claro e clara no escuro — mais perto de um `Badge
 * soft` que de um `Button primary`. Vidro é um peso próprio, e não uma
 * repintura do primeiro degrau da escada.
 *
 * ## O estado é variável, e não fundo
 *
 * `hover:bg-*` sobre vidro **falha calado** — ver `glassInteractiveClassName`.
 * O `variant="tertiary"` que serve de base traz `hover:bg-muted`, e ele é
 * anulado com `hover:bg-transparent` para o `twMerge` o remover em vez de o
 * deixar pintando atrás das camadas.
 */
function GlassButton({
    className,
    tone = "primary",
    ...props
}: React.ComponentProps<typeof Button> & {
    /** Os sete tons do sistema — os mesmos nomes do `Badge`. */
    tone?: GlassTone
}) {
    return (
        <Button
            data-slot="glass-button"
            data-tone={tone}
            variant="tertiary"
            className={cn(
                glassControlSurfaceClassName,
                glassInteractiveClassName,
                GLASS_TONES[tone],
                GLASS_TONE_INKS[tone],
                // O realce morto do `tertiary`: ele pintaria atrás do vidro.
                // Escrito como classe para o `twMerge` o **remover**, e não
                // para disputar com ele por ordem de emissão.
                "hover:bg-transparent active:bg-transparent dark:hover:bg-transparent dark:active:bg-transparent",
                // A tinta é do tom, e o `tertiary` a trocaria no cursor.
                "hover:text-current active:text-current",
                className
            )}
            {...props}
        />
    )
}

export { GlassButton }
