"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { defaultMobileBackHref } from "@/components/layout/app-header"
import { useIsMobile } from "@/hooks/use-mobile"
import { direcaoDaTela, type DirecaoDaTela } from "@/lib/direcao-da-tela"

/** A rota nova tem este tempo para chegar. Sem ela, a cópia sai e a troca segue sem gesto. */
const LIMITE_DA_ROTA_MS = 8000
/** Depois da troca de rota, quanto a tela velha espera o esqueleto sumir. */
const LIMITE_DA_ESPERA_MS = 1200
/** Sem esqueleto e sem o DOM mudar por esse tempo, a tela nova está pronta. */
const SOSSEGO_MS = 80

/** O bloco à espera e o osso solto, que uma seção desenha sem `SkeletonGroup`. */
const ESPERANDO = '[aria-busy="true"], [data-slot="skeleton"]'

/**
 * Duas fases: espera a rota mudar (`false` se passar de `LIMITE_DA_ROTA_MS`) e, mudada,
 * espera o esqueleto sumir (`true`, com teto de `LIMITE_DA_ESPERA_MS` contado da troca).
 */
function telaPronta(rotaDeAntes: string): Promise<boolean> {
    const conteudo = document.querySelector("[data-workspace-content]")
    if (!conteudo) return Promise.resolve(true)
    return new Promise((pronta) => {
        let sossego: ReturnType<typeof setTimeout> | undefined
        let limiteDaEspera: ReturnType<typeof setTimeout> | undefined
        const acabar = (ok: boolean) => {
            clearTimeout(limiteDaRota)
            clearTimeout(limiteDaEspera)
            clearTimeout(sossego)
            observador.disconnect()
            pronta(ok)
        }
        const conferir = () => {
            clearTimeout(sossego)
            if (location.pathname !== rotaDeAntes) {
                if (!limiteDaEspera) {
                    clearTimeout(limiteDaRota)
                    limiteDaEspera = setTimeout(() => acabar(true), LIMITE_DA_ESPERA_MS)
                }
                if (!conteudo.querySelector(ESPERANDO)) sossego = setTimeout(() => acabar(true), SOSSEGO_MS)
            }
        }
        const limiteDaRota = setTimeout(() => acabar(false), LIMITE_DA_ROTA_MS)
        const observador = new MutationObserver(conferir)
        observador.observe(conteudo, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-busy"] })
        conferir()
    })
}

/**
 * Uma cópia parada do conteúdo, na mesma posição da tela, numa camada fixa por baixo das
 * barras (a de cima em `--z-header`, a de baixo em `--z-modal`). Ela segura a tela velha à vista enquanto a nova
 * monta por baixo, e anda no gesto.
 */
function fotografar(conteudo: HTMLElement): HTMLElement {
    const caixa = conteudo.getBoundingClientRect()
    const camada = document.createElement("div")
    camada.dataset.slot = "subpagina-foto"
    camada.setAttribute("aria-hidden", "true")
    camada.inert = true
    Object.assign(camada.style, {
        position: "fixed",
        inset: "0",
        overflow: "hidden",
        backgroundColor: "var(--background)",
        zIndex: "30",
    })
    const copia = conteudo.cloneNode(true) as HTMLElement
    copia.removeAttribute("data-workspace-content")
    Object.assign(copia.style, {
        position: "absolute",
        top: `${caixa.top}px`,
        left: `${caixa.left}px`,
        width: `${caixa.width}px`,
        margin: "0",
    })
    camada.append(copia)
    // No mesmo contexto do conteúdo: o `SidebarInset` é `isolate`, e uma camada no `body`
    // ficaria por cima da tela nova inteira, sem deixar o conteúdo passar por cima dela.
    ;(conteudo.parentElement ?? document.body).append(camada)
    return camada
}

/** O gesto do push do iOS: a tela de cima corre sobre a de baixo, que recua e escurece. */
function animar(camada: HTMLElement, conteudo: HTMLElement, direcao: DirecaoDaTela): Promise<void> {
    const css = getComputedStyle(document.documentElement)
    // O navegador pode devolver o token em `s` ("0.5s") ou em `ms` ("500ms").
    const bruto = css.getPropertyValue("--duration-spring").trim()
    const duration = (Number.parseFloat(bruto) || 0.5) * (bruto.endsWith("ms") ? 1 : 1000)
    const easing = css.getPropertyValue("--ease-emphasized").trim() || "cubic-bezier(0.32, 0.72, 0, 1)"
    const opcoes: KeyframeAnimationOptions = { duration, easing, fill: "both" }
    // A tela nova precisa de fundo e de camada para passar por cima da cópia (ou por baixo, no voltar).
    Object.assign(conteudo.style, {
        position: "relative",
        zIndex: direcao === "entra" ? "31" : "29",
        backgroundColor: "var(--background)",
        minHeight: "100dvh",
    })
    if (direcao === "volta") camada.style.zIndex = "31"
    // `transform`, e não `translate`: o Safari ignora `translate` em keyframes de `animate()`.
    const recua = [
        { transform: "translateX(0)", opacity: 1 },
        { transform: "translateX(-30%)", opacity: 0.85 },
    ]
    const sai = [{ transform: "translateX(0)" }, { transform: "translateX(100%)" }]
    const vem = [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }]
    const volta = [
        { transform: "translateX(-30%)", opacity: 0.85 },
        { transform: "translateX(0)", opacity: 1 },
    ]
    const animacoes =
        direcao === "entra"
            ? [camada.animate(recua, opcoes), conteudo.animate(vem, opcoes)]
            : [camada.animate(sai, opcoes), conteudo.animate(volta, opcoes)]
    return Promise.all(animacoes.map((a) => a.finished)).then(() => {
        for (const a of animacoes) a.cancel()
    })
}

/**
 * A transição das subpáginas do telefone. Sem View Transitions: no iPhone, a foto de uma
 * troca não desenha `backdrop-filter`, e a barra de cima perdia o borrão (o texto passava
 * nítido, ou a barra virava placa). Aqui as barras ficam vivas, com o borrão de verdade, e
 * nunca entram no gesto: uma cópia parada do conteúdo fica à vista na mesma rolagem enquanto
 * a tela nova monta e carrega por baixo, e as duas correm quando ela fica pronta, sem
 * esqueleto à vista. Vale para todo link, e nenhuma tela marca nada. O voltar do navegador
 * fica de fora, porque o gesto do Safari já anima.
 */
export function TransicaoDeSubpagina() {
    const router = useRouter()
    const isMobile = useIsMobile()

    useEffect(() => {
        if (!isMobile) return
        let emCurso = false

        const aoClicar = (e: MouseEvent) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
            const link = (e.target as Element).closest?.<HTMLAnchorElement>("a[href]")
            // Link de dentro de um diálogo fecha o diálogo antes (`useLinkQueFecha`).
            if (!link || link.target || link.hasAttribute("download") || link.closest('[role="dialog"]')) return
            const destino = new URL(link.href)
            if (destino.origin !== location.origin) return
            const rotaDeAntes = location.pathname
            const direcao = direcaoDaTela(rotaDeAntes, destino.pathname, defaultMobileBackHref)
            if (!direcao || emCurso) return
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
            const conteudo = document.querySelector<HTMLElement>("[data-workspace-content]")
            if (!conteudo) return

            // O `Link` não navega com o padrão impedido, e o `onClick` de quem chama segue valendo.
            e.preventDefault()
            emCurso = true
            const camada = fotografar(conteudo)
            const rolagem = window.scrollY
            let novo = conteudo

            void (async () => {
                try {
                    // A página não rola sozinha: quem decide a rolagem é a troca.
                    router.push(`${destino.pathname}${destino.search}${destino.hash}`, { scroll: false })
                    const pronta = await telaPronta(rotaDeAntes)
                    if (!pronta) {
                        // Sem a rota nova: a tela velha fica onde a pessoa a deixou.
                        window.scrollTo({ top: rolagem, behavior: "instant" })
                        return
                    }
                    window.scrollTo({ top: 0, behavior: "instant" })
                    // A rota nova pode montar outro nó de conteúdo: anima o que está na tela agora.
                    novo = document.querySelector<HTMLElement>("[data-workspace-content]") ?? conteudo
                    await animar(camada, novo, direcao)
                } finally {
                    camada.remove()
                    for (const p of ["position", "z-index", "background-color", "min-height"]) novo.style.removeProperty(p)
                    emCurso = false
                }
            })()
        }

        document.addEventListener("click", aoClicar, true)
        return () => document.removeEventListener("click", aoClicar, true)
    }, [isMobile, router])

    return null
}
