"use client"

import { useCallback, useEffect, useRef } from "react"
import { flushSync } from "react-dom"

/** Quanto a tela velha espera a nova (a releitura do arquivo), como na subpágina do app. */
const LIMITE_DA_ESPERA_MS = 1200

const SELETOR = "[data-subtela-conteudo]"

type Estado = { passo: string; pendente: string | null; erro: string | null }
type Direcao = "entra" | "volta"

/** Lê um token de duração (`0.3s` ou `300ms`) em milissegundos. */
function duracao(token: string, padrao: number): number {
    const bruto = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
    const n = Number.parseFloat(bruto)
    if (!Number.isFinite(n)) return padrao
    return bruto.endsWith("ms") ? n : n * 1000
}

/**
 * Uma cópia parada da tela velha, no mesmo lugar dentro da gaveta, enquanto a nova monta por
 * baixo. Sem View Transitions: no iPhone a foto de uma troca não desenha `backdrop-filter`, e a
 * gaveta de vidro ficava transparente, com a lista da página nítida atrás (19/11/2026).
 */
function fotografar(velho: HTMLElement) {
    const pai = velho.parentElement
    if (!pai) return null
    const caixa = velho.getBoundingClientRect()
    const caixaDoPai = pai.getBoundingClientRect()
    const copia = velho.cloneNode(true) as HTMLElement
    copia.removeAttribute("data-subtela-conteudo")
    copia.dataset.subtelaCopia = ""
    copia.setAttribute("aria-hidden", "true")
    copia.inert = true
    Object.assign(copia.style, {
        position: "absolute",
        top: `${caixa.top - caixaDoPai.top + pai.scrollTop}px`,
        left: `${caixa.left - caixaDoPai.left + pai.scrollLeft}px`,
        width: `${caixa.width}px`,
        height: `${caixa.height}px`,
        margin: "0",
        zIndex: "1",
        pointerEvents: "none",
    })
    // O pai recorta o que passa da caixa durante o gesto (a tela nova vem de fora dela).
    const antes = { position: pai.style.position, overflow: pai.style.overflow }
    if (getComputedStyle(pai).position === "static") pai.style.position = "relative"
    pai.style.overflow = "clip"
    pai.append(copia)
    return {
        copia,
        soltar: () => {
            copia.remove()
            pai.style.position = antes.position
            pai.style.overflow = antes.overflow
        },
    }
}

/**
 * O gesto: a tela de cima corre sobre a de baixo, e os botões da barra (o ⋯ e o × da direita, o
 * "‹ Cancelar" da esquerda) não andam com a tela: anulam o deslize e trocam esmaecendo no lugar,
 * como a barra de navegação do iOS.
 */
function animar(copia: HTMLElement, novo: HTMLElement, direcao: Direcao): Promise<void> {
    const largura = novo.getBoundingClientRect().width
    const opcoes: KeyframeAnimationOptions = {
        duration: duracao("--duration-slow", 300),
        easing: getComputedStyle(document.documentElement).getPropertyValue("--ease-out").trim() || "ease-out",
        fill: "both",
    }
    const x = (px: number) => `translateX(${px}px)`
    const [deVelho, ateVelho, deNovo] = direcao === "entra" ? [0, -0.3 * largura, largura] : [0, largura, -0.3 * largura]
    // Na volta a tela velha (a cópia) sai por cima; na ida a nova entra por cima.
    copia.style.zIndex = direcao === "volta" ? "2" : "0"
    novo.style.position = novo.style.position || "relative"
    novo.style.zIndex = "1"
    const animacoes = [
        copia.animate(
            direcao === "entra"
                ? [{ transform: x(deVelho), opacity: 1 }, { transform: x(ateVelho), opacity: 0 }]
                : [{ transform: x(deVelho) }, { transform: x(ateVelho) }],
            opcoes,
        ),
        novo.animate(
            direcao === "entra"
                ? [{ transform: x(deNovo) }, { transform: x(0) }]
                : [{ transform: x(deNovo), opacity: 0 }, { transform: x(0), opacity: 1 }],
            opcoes,
        ),
    ]
    const botoes = '[data-slot="dialog-header-end"], [data-slot="dialog-header-start"]'
    for (const b of copia.querySelectorAll<HTMLElement>(botoes)) {
        animacoes.push(
            b.animate(
                [
                    { transform: x(-deVelho), opacity: 1 },
                    { transform: x(-(deVelho + (ateVelho - deVelho) * 0.66)), opacity: 0, offset: 0.66 },
                    { transform: x(-ateVelho), opacity: 0 },
                ],
                opcoes,
            ),
        )
    }
    for (const b of novo.querySelectorAll<HTMLElement>(botoes)) {
        animacoes.push(
            b.animate(
                [
                    { transform: x(-deNovo + 12), opacity: 0 },
                    { transform: x(0), opacity: 1 },
                ],
                opcoes,
            ),
        )
    }
    return Promise.all(animacoes.map((a) => a.finished)).then(() => {
        for (const a of animacoes) a.cancel()
        novo.style.removeProperty("z-index")
    })
}

/**
 * A parte comum às duas formas: decide se há gesto e, havendo, segura a cópia da tela velha,
 * espera a nova (`trocar`) e corre as duas. A troca é seca fora do telefone, com movimento
 * reduzido, com outra troca em curso, ou quando `trocar` devolve `false` (sem tela nova a empurrar).
 */
function comecarSubtela(ativo: boolean, direcao: Direcao, trocar: () => Promise<boolean> | boolean): boolean {
    const raiz = document.documentElement
    const velho = document.querySelector<HTMLElement>(SELETOR)
    if (!ativo || !velho || raiz.dataset.subtela || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return false
    }
    const foto = fotografar(velho)
    if (!foto) return false
    raiz.dataset.subtela = direcao
    void (async () => {
        try {
            const andou = await trocar()
            const novo = document.querySelector<HTMLElement>(SELETOR)
            // O React pode reaproveitar o mesmo nó entre as telas: a cópia é que guarda a velha.
            if (andou && novo) await animar(foto.copia, novo, direcao)
        } finally {
            foto.soltar()
            delete raiz.dataset.subtela
        }
    })()
    return true
}

/**
 * A forma genérica, sem espera: a tela nova é a que a `acao` monta na hora (o formulário de edição
 * do detalhe do lançamento). Mesmo gesto da subtela do Importar.
 */
export function useTrocaDeSubtela(ativo: boolean) {
    return useCallback(
        (direcao: Direcao, acao: () => void) => {
            if (
                !comecarSubtela(ativo, direcao, () => {
                    flushSync(acao)
                    return true
                })
            ) {
                acao()
            }
        },
        [ativo],
    )
}

/**
 * O gesto da subpágina do telefone (`TransicaoDeSubpagina`) dentro da gaveta do Importar: a
 * subtela Conferir leitura entra pela direita, e a conferência volta da esquerda. A cópia da tela
 * velha fica à vista enquanto a nova monta; a releitura do Está certo espera o passo mudar, até
 * 1,2s. Se o passo não muda (o erro de coluna faltando), a troca acontece sem gesto. Só no
 * telefone; com movimento reduzido, a troca é seca.
 */
export function useTransicaoDaSubtela(estado: Estado, ativo: boolean) {
    const atual = useRef(estado)
    useEffect(() => {
        atual.current = estado
    })

    return useCallback(
        (direcao: Direcao, acao: () => unknown) => {
            const passoDeAntes = atual.current.passo
            const comecou = comecarSubtela(ativo, direcao, async () => {
                flushSync(() => {
                    void acao()
                })
                await new Promise<void>((pronta) => {
                    const inicio = performance.now()
                    const conferir = () => {
                        const { passo, pendente, erro } = atual.current
                        const acabou = passo !== passoDeAntes || (pendente == null && erro != null)
                        if (acabou || performance.now() - inicio > LIMITE_DA_ESPERA_MS) return pronta()
                        setTimeout(conferir, 16)
                    }
                    setTimeout(conferir, 0)
                })
                // Sem passo novo não há página a empurrar: a troca acontece sem deslizar.
                return atual.current.passo !== passoDeAntes
            })
            if (!comecou) void acao()
        },
        [ativo],
    )
}
