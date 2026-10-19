"use client"

import * as React from "react"

/**
 * Anima a altura de uma caixa de altura automática quando o conteúdo dela
 * muda (o diálogo que troca de Despesa para Parcelada). CSS não transiciona de
 * `auto` para `auto`: o `ResizeObserver` vê a altura nova antes da pintura,
 * a caixa volta à antiga em px e anda até a nova na mola do sistema
 * (`--duration-spring`, `--ease-spring`), recortando o que transborda. No fim
 * a altura volta a ser do conteúdo; o que mudou no meio do caminho o
 * observador pega ali, e a caixa segue de onde está, sem salto.
 *
 * Com movimento reduzido, a altura troca na hora.
 */
export function useAlturaAnimada<T extends HTMLElement>() {
    const [el, setEl] = React.useState<T | null>(null)

    React.useEffect(() => {
        if (!el) return
        const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)")
        let ultima = el.offsetHeight
        let animando = false

        const limpar = () => {
            el.style.height = ""
            el.style.overflow = ""
            el.style.transition = ""
            animando = false
        }

        const observador = new ResizeObserver(() => {
            if (animando) return
            const alvo = el.offsetHeight
            if (alvo === ultima) return
            const de = ultima
            ultima = alvo
            if (reduzido.matches || de === 0 || alvo === 0) return
            animando = true
            el.style.overflow = "clip"
            el.style.height = `${de}px`
            void el.offsetHeight
            el.style.transition = "height var(--duration-spring) var(--ease-spring)"
            el.style.height = `${alvo}px`
        })

        // `ultima` fica no alvo: se o conteúdo mudou durante a viagem, soltar a
        // altura faz o observador ver a diferença e animar a partir do alvo.
        const fim = (e: TransitionEvent) => {
            if (e.target === el && e.propertyName === "height") limpar()
        }

        observador.observe(el)
        el.addEventListener("transitionend", fim)
        el.addEventListener("transitioncancel", fim)
        return () => {
            observador.disconnect()
            el.removeEventListener("transitionend", fim)
            el.removeEventListener("transitioncancel", fim)
            limpar()
        }
    }, [el])

    return setEl
}
