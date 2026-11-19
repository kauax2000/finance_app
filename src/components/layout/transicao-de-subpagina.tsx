"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { defaultMobileBackHref } from "@/components/layout/app-header"
import { useIsMobile } from "@/hooks/use-mobile"
import { direcaoDaTela } from "@/lib/direcao-da-tela"

/**
 * A rota nova tem este tempo para chegar. Sem ela, a troca acontece sem gesto. Somado
 * ao `LIMITE_DA_ESPERA_MS`, fica abaixo dos ~4s em que o navegador desiste da promessa
 * (`TimeoutError`, iOS 27): passou disso, a transição abortava e a tela nova não vinha.
 */
const LIMITE_DA_ROTA_MS = 2500
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
 * o esqueleto sumir); sem rota nova em 2,5s a troca acontece sem gesto. Vale para todo link,
 * e nenhuma tela marca nada. O voltar do navegador fica de fora, porque o gesto do Safari já anima.
 */
export function TransicaoDeSubpagina() {
    const router = useRouter()
    const isMobile = useIsMobile()
    const pathname = usePathname()
    // A troca que passou do teto segue sem gesto: a tela nova chega depois, e só então
    // a página vai ao topo (antes, a Você saltava ao topo e a tela nova vinha em corte).
    const topoNaProximaRota = useRef(false)

    useEffect(() => {
        if (!topoNaProximaRota.current) return
        topoNaProximaRota.current = false
        window.scrollTo({ top: 0, behavior: "instant" })
    }, [pathname])

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
            // Antes da foto, o conteúdo vira uma janela do tamanho da tela, rolada por dentro
            // até o mesmo ponto, com a página em 0. No WebKit a foto de um conteúdo alto e
            // rolado sai vazia (o voltar de uma página longa cortava seco), e rolar a página
            // durante a espera troca a foto parada pela página viva, em branco. Com a página
            // em 0 e a janela de altura fixa, a tela nova não encolhe o documento nem rola.
            const conteudo = document.querySelector<HTMLElement>("[data-workspace-content]")
            const rolagem = window.scrollY
            // Antes da janela: as regras dela no CSS moram sob `html[data-subpagina]`.
            raiz.dataset.subpagina = direcao
            if (conteudo && rolagem > 0) {
                const topo = conteudo.getBoundingClientRect().top + rolagem
                conteudo.dataset.janela = ""
                // `flex: none`: o `flex-1` do conteúdo venceria a altura dada.
                conteudo.style.flex = "none"
                conteudo.style.height = `${window.innerHeight}px`
                window.scrollTo({ top: 0, behavior: "instant" })
                conteudo.scrollTop = rolagem - topo
            }
            const soltar = () => {
                if (!conteudo || !("janela" in conteudo.dataset)) return
                delete conteudo.dataset.janela
                conteudo.style.flex = ""
                conteudo.style.height = ""
                conteudo.scrollTop = 0
            }
            const transicao = doc.startViewTransition(async () => {
                // Sem rolar: a rolagem ao topo vem no fim, com a tela nova pronta.
                router.push(`${destino.pathname}${destino.search}${destino.hash}`, { scroll: false })
                const pronta = await telaPronta(rotaDeAntes)
                soltar()
                if (pronta) {
                    window.scrollTo({ top: 0, behavior: "instant" })
                    return
                }
                // Sem a rota nova: a tela velha fica onde a pessoa a deixou.
                window.scrollTo({ top: rolagem, behavior: "instant" })
                if (location.pathname === rotaDeAntes) topoNaProximaRota.current = true
                else window.scrollTo({ top: 0, behavior: "instant" })
                transicao.skipTransition()
            })
            void transicao.finished.finally(() => {
                // Se a troca abortou antes da promessa, o conteúdo não fica preso numa tela.
                soltar()
                delete raiz.dataset.subpagina
            })
        }

        document.addEventListener("click", aoClicar, true)
        return () => document.removeEventListener("click", aoClicar, true)
    }, [isMobile, router])

    return null
}
