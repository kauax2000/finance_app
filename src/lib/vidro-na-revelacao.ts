/**
 * O vidro na revelação do tema. No WebKit (iPhone) a foto da View Transition não desenha
 * `backdrop-filter`: na troca de tema a barra de baixo (e todo `.glass-surface` à vista) entrava
 * nas duas fotos só com a tinta, e a página aparecia nítida atrás dela. Durante a troca, cada
 * vidro visível ganha um nome próprio: o borrão passa a ser desenhado no grupo dele, sobre a foto
 * da página, e a máscara da aurora passa pelas duas fotos dele como pela página: a nova na foto
 * nova (o lado do destino), a oposta na velha, deslocadas pela caixa do vidro, no mesmo sentido
 * da página (`lib/aurora-do-tema`). O nome só
 * existe durante a troca: `view-transition-name` permanente tira o borrão (AGENTS.md).
 */

import { RITMO, quadrosDaMascara, type Sentido } from "./aurora-do-tema"

export type Vidro = { el: HTMLElement; nome: string; rect: DOMRect }

/** Uma folha só: uma troca pulada não deixa outra órfã. */
const ID_DA_FOLHA = "vidro-na-revelacao"

function borrao(estilo: CSSStyleDeclaration) {
    const f = estilo.backdropFilter || estilo.getPropertyValue("-webkit-backdrop-filter")
    return f && f !== "none" ? f : null
}

/**
 * Só o WebKit perde o borrão na foto (`GestureEvent` só existe no Safari, no macOS e no iOS, onde
 * todo navegador é WebKit). O Chrome já desenha o vidro na foto, e lá o borrão nos grupos travava
 * a troca por ~575ms, congelando o polegar do seletor de tema.
 */
function fotoPerdeOBorrao(janela: Window) {
    return "GestureEvent" in janela
}

/** Dá nome a cada vidro à vista e devolve como desfazer. Chame antes de `startViewTransition`. */
export function nomearVidros(doc: Document) {
    const janela = doc.defaultView ?? window
    if (!fotoPerdeOBorrao(janela)) return { vidros: [], desfazer() {} }
    const vidros: Vidro[] = []
    const regras: string[] = []
    // Tira o nome que ficou de uma troca pulada antes de nomear de novo.
    doc.querySelectorAll<HTMLElement>(".glass-surface").forEach((el) => {
        el.style.viewTransitionName = ""
    })
    doc.querySelectorAll<HTMLElement>(".glass-surface").forEach((el) => {
        const rect = el.getBoundingClientRect()
        const naTela =
            rect.width > 0 &&
            rect.height > 0 &&
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < janela.innerHeight &&
            rect.left < janela.innerWidth
        if (!naTela) return
        if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return
        const estilo = janela.getComputedStyle(el)
        const filtro = borrao(estilo)
        if (!filtro) return
        const nome = `vidro-${vidros.length}`
        el.style.viewTransitionName = nome
        vidros.push({ el, nome, rect })
        regras.push(
            `::view-transition-group(${nome}){animation:none;border-radius:${estilo.borderRadius};-webkit-backdrop-filter:${filtro};backdrop-filter:${filtro}}`,
            `::view-transition-old(${nome}),::view-transition-new(${nome}){animation:none;mix-blend-mode:normal}`,
        )
    })
    let folha = doc.getElementById(ID_DA_FOLHA)
    if (!folha) {
        folha = doc.createElement("style")
        folha.id = ID_DA_FOLHA
        doc.head.append(folha)
    }
    folha.textContent = regras.join("\n")
    return {
        vidros,
        desfazer() {
            folha.remove()
            for (const { el } of vidros) el.style.viewTransitionName = ""
        },
    }
}

/** A aurora passando pelas fotos de cada vidro. Chame no `ready`, com a altura e a largura da tela lidas no toque. */
export function revelarVidros(
    html: HTMLElement,
    vidros: Vidro[],
    altura: number,
    largura: number,
    sentido: Sentido,
): Animation[] {
    const tempo = { duration: RITMO[sentido].duracao, easing: "linear" }
    const animacoes: Animation[] = []
    for (const { nome, rect } of vidros) {
        const caixa = { x: rect.left, y: rect.top }
        animacoes.push(html.animate(quadrosDaMascara(altura, largura, sentido, "novo", caixa), {
            ...tempo,
            pseudoElement: `::view-transition-new(${nome})`,
        }))
        animacoes.push(html.animate(quadrosDaMascara(altura, largura, sentido, "velho", caixa), {
            ...tempo,
            pseudoElement: `::view-transition-old(${nome})`,
        }))
    }
    return animacoes
}
