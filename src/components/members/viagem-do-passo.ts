/**
 * A troca de passo do "Adicionar limite" como gesto (a versão B escolhida pelo
 * dono em 07/11/2026): ao escolher, as outras pessoas afundam e somem, o nome da
 * linha tocada viaja na mola até o título ("Limite de …"), e o campo e os botões
 * brotam de onde a linha estava (`menu-morph`). "Voltar" desfaz: o passo do
 * valor recolhe (`menu-unmorph`) e as pessoas sobem de novo na mola.
 *
 * Funções de DOM soltas: a tela só entrega os nós. Movimento reduzido não anima
 * nada (quem chama pergunta `semMovimento()`).
 */

/** O que a viagem precisa lembrar da linha tocada, medido antes da troca. */
export type OrigemDaViagem = { nome: DOMRect; linha: DOMRect }

const SAIDA_MS = 220
const ENTRADA_MS = 500

export function semMovimento(): boolean {
    return typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function mola(): string {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--ease-spring").trim()
    return v || "cubic-bezier(0.16, 1, 0.3, 1)"
}

/** Espera as animações, mas nunca mais que `ms`: em aba de fundo elas congelam, e a troca não pode travar. */
function noMaximo(vao: Promise<unknown>[], ms: number): Promise<void> {
    return Promise.race([Promise.all(vao), new Promise((fim) => window.setTimeout(fim, ms))]).then(() => undefined)
}

/** Roda um keyframe do `globals.css` (`menu-morph`, `menu-unmorph`) e espera acabar. */
function porKeyframe(el: HTMLElement, nome: string, ms: number, atraso = 0, origem?: string): Promise<void> {
    return new Promise((fim) => {
        if (origem) el.style.transformOrigin = origem
        el.style.animation = `${nome} ${ms}ms linear ${atraso}ms ${nome === "menu-morph" ? "backwards" : "forwards"}`
        const pronto = () => {
            el.removeEventListener("animationend", pronto)
            if (nome === "menu-morph") {
                el.style.animation = ""
                el.style.transformOrigin = ""
            }
            fim()
        }
        el.addEventListener("animationend", pronto)
        // Rede de segurança: sem o evento (aba em segundo plano), não trava a troca.
        window.setTimeout(pronto, ms + atraso + 100)
    })
}

function surgir(el: Element | null | undefined, atraso = 0) {
    el?.animate(
        [
            { opacity: 0, filter: "blur(8px)" },
            { opacity: 1, offset: 0.45 },
            { filter: "blur(0)" },
        ],
        { duration: 400, delay: atraso, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "backwards" }
    )
}

/** Passo 1 → 2, antes da troca: as outras linhas afundam, a mídia da tocada recolhe. */
export function sairDaEscolha(corpo: HTMLElement, cabecalho: HTMLElement, rodape: HTMLElement, tocada: HTMLElement) {
    const vao: Promise<unknown>[] = []
    const linhas = Array.from(corpo.querySelectorAll<HTMLElement>("[data-linha]"))
    linhas
        .filter((l) => l !== tocada)
        .forEach((l, i) => {
            vao.push(
                l.animate(
                    [
                        { opacity: 1, transform: "none" },
                        { opacity: 0, transform: "translateY(24px) scale(0.94)" },
                    ],
                    { duration: SAIDA_MS, delay: i * 30, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" }
                ).finished
            )
        })
    // Da linha tocada fica só o nome: ele é quem viaja.
    tocada.querySelectorAll<HTMLElement>(":scope > :not([data-slot=item-content]), [data-slot=item-description]").forEach((p) => {
        vao.push(p.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" }).finished)
    })
    tocada.style.pointerEvents = "none"
    tocada.style.background = "transparent"
    for (const parte of Array.from(cabecalho.children)) {
        vao.push(parte.animate([{ opacity: 1, filter: "blur(0)" }, { opacity: 0, filter: "blur(6px)" }], { duration: 180, easing: "ease-in", fill: "forwards" }).finished)
    }
    vao.push(porKeyframe(rodape, "menu-unmorph", 210, 0, "50% 100%"))
    return noMaximo(vao, SAIDA_MS + 60 + 120)
}

/** Passo 2 montado: o nome pousa no título vindo da linha; campo e botões brotam dela. */
export function chegarAoValor(corpo: HTMLElement, cabecalho: HTMLElement, rodape: HTMLElement, origem: OrigemDaViagem) {
    const nome = cabecalho.querySelector<HTMLElement>("[data-nome]")
    if (nome) {
        const alvo = nome.getBoundingClientRect()
        const dx = origem.nome.left - alvo.left
        const dy = origem.nome.top - alvo.top
        const s = alvo.height ? origem.nome.height / alvo.height : 1
        nome.style.display = "inline-block"
        nome.style.transformOrigin = "0 0"
        nome.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${s})` }, { transform: "none" }], {
            duration: ENTRADA_MS,
            easing: mola(),
        })
    }
    surgir(cabecalho.querySelector("[data-prefixo]"), 120)
    surgir(cabecalho.querySelector("[data-slot=dialog-description]"), 160)
    const caixa = corpo.getBoundingClientRect()
    const origemCss = `${origem.linha.left - caixa.left + 40}px ${origem.linha.top - caixa.top + origem.linha.height / 2}px`
    const campo = corpo.querySelector<HTMLElement>("[data-passo]")
    if (campo) void porKeyframe(campo, "menu-morph", 380, 60, origemCss)
    void porKeyframe(rodape, "menu-morph", 380, 120, "50% 100%")
}

/** Passo 2 → 1, antes da troca: o passo do valor recolhe. */
export function sairDoValor(corpo: HTMLElement, cabecalho: HTMLElement, rodape: HTMLElement) {
    const passo = corpo.querySelector<HTMLElement>("[data-passo]")
    return noMaximo(
        [
            passo ? porKeyframe(passo, "menu-unmorph", 210) : Promise.resolve(),
            porKeyframe(cabecalho, "menu-unmorph", 210, 0, "0 50%"),
            porKeyframe(rodape, "menu-unmorph", 210, 0, "50% 100%"),
        ],
        330
    )
}

/** Passo 1 montado de volta: as pessoas sobem na mola, uma atrás da outra. */
export function chegarAEscolha(corpo: HTMLElement, cabecalho: HTMLElement, rodape: HTMLElement) {
    surgir(cabecalho.querySelector("[data-slot=dialog-title]"))
    surgir(cabecalho.querySelector("[data-slot=dialog-description]"), 40)
    corpo.querySelectorAll<HTMLElement>("[data-linha]").forEach((l, i) => {
        l.animate(
            [
                { opacity: 0, transform: "translateY(24px) scale(0.94)" },
                { opacity: 1, transform: "none" },
            ],
            { duration: ENTRADA_MS, delay: 40 + i * 40, easing: mola(), fill: "backwards" }
        )
    })
    void porKeyframe(rodape, "menu-morph", 380, 100, "50% 100%")
}

/**
 * O iOS só abre o teclado com o foco dado dentro do toque, e o campo do valor
 * monta depois da saída (220ms). Um campo invisível recebe o foco no próprio
 * toque e segura o teclado aberto até o `autoFocus` do campo de verdade
 * assumir; então sai. Mesmo `inputMode` do valor, para o teclado não trocar.
 */
export function segurarTeclado(dentro: HTMLElement): () => void {
    const ponte = document.createElement("input")
    ponte.setAttribute("aria-hidden", "true")
    ponte.tabIndex = -1
    ponte.inputMode = "decimal"
    ponte.style.cssText = "position:absolute;opacity:0;width:1px;height:1px;left:0;top:0;pointer-events:none;font-size:16px"
    dentro.appendChild(ponte)
    ponte.focus({ preventScroll: true })
    return () => ponte.remove()
}
