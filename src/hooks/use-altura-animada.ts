"use client"

import * as React from "react"

/** Os keyframes que animam a altura de um filho (Collapsible, Accordion). */
export function animaAAltura(animationName: string): boolean {
    return /^(accordion|collapsible)-(down|up)$/.test(animationName)
}

/**
 * Há um filho animando a própria altura agora? Duas molas da mesma altura
 * (a do filho e a da caixa) saíam em duas etapas; sem `getAnimations`
 * (jsdom), vale o comportamento de antes.
 */
function filhoEmVoo(el: HTMLElement): boolean {
    return (el.getAnimations?.({ subtree: true }) ?? []).some(
        (a) =>
            a instanceof CSSAnimation &&
            animaAAltura(a.animationName) &&
            a.playState === "running" &&
            (a.effect as KeyframeEffect | null)?.target !== el,
    )
}

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
        const gaveta = window.matchMedia("(max-width: 47.99rem)")
        let ultima = { w: el.offsetWidth, h: el.offsetHeight }
        let animando = false
        // As propriedades que andam agora: a caixa só se solta quando todas terminam.
        const pendentes = new Set<string>()

        const limpar = () => {
            el.style.height = ""
            el.style.width = ""
            el.style.maxWidth = ""
            el.style.overflow = ""
            el.style.transition = ""
            pendentes.clear()
            animando = false
        }

        const observador = new ResizeObserver(() => {
            if (animando) return
            const alvo = { w: el.offsetWidth, h: el.offsetHeight }
            const de = ultima
            // Na gaveta (abaixo de 768px) a largura é do `vaul`: só a altura anda.
            const andaLargura = !gaveta.matches && alvo.w !== de.w && de.w !== 0 && alvo.w !== 0
            const andaAltura = alvo.h !== de.h && de.h !== 0 && alvo.h !== 0
            ultima = alvo
            // Um filho que anda a própria altura (`data-altura-em-voo`) já leva a
            // caixa junto: duas animações da mesma altura sairiam em duas etapas.
            if (el.querySelector("[data-altura-em-voo]") || filhoEmVoo(el)) return
            if (reduzido.matches || (!andaLargura && !andaAltura)) return
            animando = true
            el.style.overflow = "clip"
            // A que não mudou fica fixa em px durante a viagem.
            el.style.height = `${de.h}px`
            if (andaLargura) {
                // O teto do degrau (`max-w-xl`…) cortaria a largura de partida ao encolher e a
                // caixa saltaria: durante a viagem as duas pontas já são larguras válidas.
                el.style.maxWidth = "none"
                el.style.width = `${de.w}px`
            }
            void el.offsetHeight
            el.style.transition =
                "height var(--duration-spring) var(--ease-spring), width var(--duration-spring) var(--ease-spring)"
            el.style.height = `${alvo.h}px`
            if (andaLargura) el.style.width = `${alvo.w}px`
            if (andaAltura) pendentes.add("height")
            if (andaLargura) pendentes.add("width")
            // Só a largura mudou: a altura fixa em px não dispara transição.
            if (!andaAltura) el.style.height = ""
        })

        // `ultima` fica no alvo: se o conteúdo mudou durante a viagem, soltar a
        // caixa faz o observador ver a diferença e animar a partir do alvo.
        const fim = (e: TransitionEvent) => {
            if (e.target !== el) return
            pendentes.delete(e.propertyName)
            if (pendentes.size === 0) limpar()
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
