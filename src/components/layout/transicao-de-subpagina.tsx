"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { defaultMobileBackHref } from "@/components/layout/app-header"
import { useIsMobile } from "@/hooks/use-mobile"
import { direcaoDaTela } from "@/lib/direcao-da-tela"

/** Quanto a tela velha espera a nova. Passou disso, anima com o que tiver. */
const LIMITE_DA_ESPERA_MS = 1200
/** Sem esqueleto e sem o DOM mudar por esse tempo, a tela nova está pronta. */
const SOSSEGO_MS = 80

/** O bloco à espera e o osso solto, que uma seção desenha sem `SkeletonGroup`. */
const ESPERANDO = '[aria-busy="true"], [data-slot="skeleton"]'

type DocumentoComTransicao = Document & {
    startViewTransition?: (trocar: () => Promise<void>) => { finished: Promise<void> }
}

/** Resolve quando a rota já mudou e nenhum esqueleto segue à espera no conteúdo. */
function telaPronta(rotaDeAntes: string): Promise<void> {
    const conteudo = document.querySelector("[data-workspace-content]")
    if (!conteudo) return Promise.resolve()
    return new Promise((pronta) => {
        let sossego: ReturnType<typeof setTimeout> | undefined
        const acabar = () => {
            clearTimeout(limite)
            clearTimeout(sossego)
            observador.disconnect()
            pronta()
        }
        const conferir = () => {
            clearTimeout(sossego)
            const esperando = conteudo.querySelector(ESPERANDO)
            if (location.pathname !== rotaDeAntes && !esperando) sossego = setTimeout(acabar, SOSSEGO_MS)
        }
        const limite = setTimeout(acabar, LIMITE_DA_ESPERA_MS)
        const observador = new MutationObserver(conferir)
        observador.observe(conteudo, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-busy"] })
        conferir()
    })
}

/**
 * A transição das subpáginas do telefone. O navegador segura a tela velha enquanto a
 * promessa do `startViewTransition` corre: a tela nova monta e carrega por baixo, e só
 * pronta o gesto começa, sem esqueleto à vista. Vale para todo link, e nenhuma tela
 * marca nada. O voltar do navegador fica de fora, porque o gesto do Safari já anima.
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
            const transicao = doc.startViewTransition(async () => {
                router.push(`${destino.pathname}${destino.search}${destino.hash}`)
                await telaPronta(rotaDeAntes)
                raiz.style.setProperty("--subpagina-desvio", `${window.scrollY - rolagemDeAntes}px`)
            })
            void transicao.finished.finally(() => delete raiz.dataset.subpagina)
        }

        document.addEventListener("click", aoClicar, true)
        return () => document.removeEventListener("click", aoClicar, true)
    }, [isMobile, router])

    return null
}
