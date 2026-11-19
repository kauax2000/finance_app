"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { defaultMobileBackHref } from "@/components/layout/app-header"
import { useIsMobile } from "@/hooks/use-mobile"
import { direcaoDaTela } from "@/lib/direcao-da-tela"

/** A rota nova tem este tempo para chegar. Sem ela, a troca acontece sem gesto. */
const LIMITE_DA_ROTA_MS = 4000
/** Depois da troca de rota, quanto a tela velha espera o esqueleto sumir. */
const LIMITE_DA_ESPERA_MS = 1200
/** Sem esqueleto e sem o DOM mudar por esse tempo, a tela nova está pronta. */
const SOSSEGO_MS = 80

/** O bloco à espera e o osso solto, que uma seção desenha sem `SkeletonGroup`. */
const ESPERANDO = '[aria-busy="true"], [data-slot="skeleton"]'

type DocumentoComTransicao = Document & {
    startViewTransition?: (trocar: () => Promise<void>) => { finished: Promise<void>; skipTransition: () => void }
}

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
 * A transição das subpáginas do telefone. O navegador segura a tela velha enquanto a
 * promessa do `startViewTransition` corre: a tela nova monta e carrega por baixo, e só
 * pronta o gesto começa, sem esqueleto à vista. A espera tem duas fases (a rota mudar, e
 * o esqueleto sumir); sem rota nova em 4s a troca acontece sem gesto. Vale para todo link,
 * e nenhuma tela marca nada. O voltar do navegador fica de fora, porque o gesto do Safari já anima.
 */
export function TransicaoDeSubpagina() {
    const router = useRouter()
    const isMobile = useIsMobile()

    useEffect(() => {
        if (!isMobile) return
        const doc = document as DocumentoComTransicao
        const raiz = document.documentElement

        const aoClicar = (e: MouseEvent) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
            const link = (e.target as Element).closest?.<HTMLAnchorElement>("a[href]")
            // Link de dentro de um diálogo fecha o diálogo antes (`useLinkQueFecha`).
            if (!link || link.target || link.hasAttribute("download") || link.closest('[role="dialog"]')) return
            const destino = new URL(link.href)
            if (destino.origin !== location.origin) return
            const rotaDeAntes = location.pathname
            const direcao = direcaoDaTela(rotaDeAntes, destino.pathname, defaultMobileBackHref)
            if (!direcao || !doc.startViewTransition) return
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

            // O `Link` não navega com o padrão impedido, e o `onClick` de quem chama segue valendo.
            e.preventDefault()
            if (raiz.dataset.subpagina) return
            const rolagemDeAntes = window.scrollY
            raiz.dataset.subpagina = direcao
            // A tela nova é mais curta, e o navegador corta a rolagem sozinho quando o
            // documento encolhe — outra rolagem na espera. A altura fica até a troca.
            const conteudo = document.querySelector<HTMLElement>("[data-workspace-content]")
            const transicao = doc.startViewTransition(async () => {
                if (conteudo) conteudo.style.minHeight = `${conteudo.offsetHeight}px`
                // Sem rolar: no WebKit, rolar durante a espera troca a foto parada pela página
                // viva, ainda não pintada, e a tela pisca em branco. A rolagem vem no fim.
                router.push(`${destino.pathname}${destino.search}${destino.hash}`, { scroll: false })
                if (!(await telaPronta(rotaDeAntes))) transicao.skipTransition()
                if (conteudo) conteudo.style.minHeight = ""
                window.scrollTo({ top: 0, behavior: "instant" })
                raiz.style.setProperty("--subpagina-desvio", `${window.scrollY - rolagemDeAntes}px`)
            })
            void transicao.finished.finally(() => delete raiz.dataset.subpagina)
        }

        document.addEventListener("click", aoClicar, true)
        return () => document.removeEventListener("click", aoClicar, true)
    }, [isMobile, router])

    return null
}
