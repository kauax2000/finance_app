"use client"

import type { SceneScriptId } from "@/lib/scene-script"

export type PaletteDemoProps = {
    /** O roteiro da cena (`null` nas cenas sem paleta). */
    script: SceneScriptId | null
    /**
     * Quantos focos de verdade a coluna já recebeu (`focoPulaORoteiro`): cada
     * aumento pula o roteiro em execução para o quadro final.
     */
    skip: number
}

/**
 * A paleta ⌘K digitada pelo roteiro (`useSceneScript`), dentro do palco. Chega
 * por `next/dynamic` só com o palco na tela, para o telefone nunca baixar o
 * cmdk. Por ora não desenha nada: o voo da pílula, o cursor "Você" e a paleta
 * entram com a cena do login.
 */
export function PaletteDemo({ script, skip }: PaletteDemoProps) {
    void script
    void skip
    return null
}
