"use client"

import { useEffect } from "react"

/**
 * Marca o `<html>` com o último apontador usado: `data-modality="pointer"` no
 * `pointerdown`, removido no `keydown`. A variante `focus-visible:` do
 * `globals.css` lê a marca e só acende o anel no teclado — o foco que o Radix
 * devolve ao gatilho depois de um clique deixava o anel aceso.
 *
 * Captura, para vir antes do `pointerdown` do Radix que já move o foco.
 */
export function FocusModality() {
    useEffect(() => {
        const html = document.documentElement
        const ponteiro = () => html.setAttribute("data-modality", "pointer")
        const teclado = () => html.removeAttribute("data-modality")
        document.addEventListener("pointerdown", ponteiro, true)
        document.addEventListener("keydown", teclado, true)
        return () => {
            document.removeEventListener("pointerdown", ponteiro, true)
            document.removeEventListener("keydown", teclado, true)
        }
    }, [])
    return null
}
