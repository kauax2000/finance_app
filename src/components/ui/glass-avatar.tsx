"use client"

import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IDENTITY_TONES } from "@/lib/avatar"
import {
    GLASS_IDENTITY_TONES,
    glassControlSurfaceClassName,
} from "@/lib/glass-classes"
import { cn } from "@/lib/utils"

/**
 * O avatar de vidro.
 *
 * **É a peça em que o vidro não tinha onde morar, e a tradução de cor é o que
 * resolve.** Medido: a raiz do `Avatar` não pinta fundo nenhum, e o
 * `AvatarFallback` é `h-full w-full` com superfície **opaca**. Isso deixa dois
 * caminhos e os dois falham:
 *
 * - vidro na **raiz** → fica escondido atrás do fallback opaco;
 * - vidro no **fallback** → o shorthand apaga o `bg-identity-N-surface`, e
 *   sobra a identidade sem cor.
 *
 * O terceiro caminho — tornar `--identity-N-surface` translúcido — está
 * **rejeitado por escrito** no sistema (`lib/avatar.ts`): avatares empilhados
 * mostrariam o de baixo, e as iniciais leriam sobre a cor do vizinho.
 *
 * A saída é a desta rodada: **a identidade vira o tom do vidro**. A lâmina fica
 * na raiz, o fallback fica transparente, e a cor da pessoa entra por
 * `--glass-tone`. A tinta (`text-identity-N`) não muda, porque o par já é
 * calibrado.
 *
 * A objeção do empilhamento **não se aplica aqui e é por isso que a peça é
 * separada**: um `GlassAvatar` é opt-in, e quem o escolhe aceita a
 * translucidez. O `Avatar` normal segue opaco.
 *
 * ## O custo, medido
 *
 * O vidro traz `border: 1px solid transparent`, que é onde o aro mora. Com
 * `box-sizing: border-box` a caixa externa não cresce — **a foto encolhe 2px**.
 * Num avatar `sm` de 32px, são 30px de imagem. É o preço da aresta, e ele está
 * dito porque numa peça circular com foto ele é visível.
 */
function GlassAvatar({
    className,
    seed,
    src,
    alt,
    children,
    ...props
}: React.ComponentProps<typeof Avatar> & {
    /** O que decide a identidade — o mesmo argumento de `identityToneFor`. */
    seed?: number
    src?: string
    alt?: string
}) {
    const indice = ((seed ?? 0) % IDENTITY_TONES.length + IDENTITY_TONES.length) %
        IDENTITY_TONES.length

    return (
        <Avatar
            data-slot="glass-avatar"
            className={cn(
                glassControlSurfaceClassName,
                GLASS_IDENTITY_TONES[indice],
                className
            )}
            {...props}
        >
            {src ? <AvatarImage src={src} alt={alt ?? ""} /> : null}
            {/* Transparente de propósito: quem pinta é a lâmina da raiz. Um
                fundo aqui esconderia o vidro inteiro, que é o defeito que esta
                peça existe para não ter. */}
            <AvatarFallback
                className={cn("bg-transparent", IDENTITY_TONES[indice].ink)}
            >
                {children}
            </AvatarFallback>
        </Avatar>
    )
}

export { GlassAvatar }
