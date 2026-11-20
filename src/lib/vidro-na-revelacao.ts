/**
 * O vidro na revelação do tema. No WebKit (iPhone) a foto da View Transition não desenha
 * `backdrop-filter`: na troca de tema a barra de baixo (e todo `.glass-surface` à vista) entrava
 * nas duas fotos só com a tinta, e a página aparecia nítida atrás dela. Durante a troca, cada
 * vidro visível ganha um nome próprio: o borrão passa a ser desenhado no grupo dele, sobre a foto
 * da página, e o círculo da revelação passa pelas duas fotos dele como pela página. O nome só
 * existe durante a troca: `view-transition-name` permanente tira o borrão (AGENTS.md).
 */

export type Vidro = { el: HTMLElement; nome: string; rect: DOMRect }

/** Folga do retângulo além da caixa, para a sombra do vidro não ser cortada. */
const FOLGA = 100

/** Uma folha só: uma troca pulada não deixa outra órfã. */
const ID_DA_FOLHA = "vidro-na-revelacao"

/** O que fica fora do círculo, na caixa do vidro: retângulo menos círculo. Os comandos não mudam com o raio, então o navegador interpola. */
export function recorteDeFora(w: number, h: number, cx: number, cy: number, r: number) {
    const ret = `M${-FOLGA} ${-FOLGA}H${w + FOLGA}V${h + FOLGA}H${-FOLGA}Z`
    const circ = `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`
    return `path(evenodd, "${ret} ${circ}")`
}

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

/** O círculo da revelação passando pelas fotos de cada vidro. Chame no `ready`, com o mesmo tempo da raiz. */
export function revelarVidros(
    html: HTMLElement,
    vidros: Vidro[],
    x: number,
    y: number,
    raio: number,
    tempo: KeyframeAnimationOptions,
) {
    for (const { nome, rect } of vidros) {
        const cx = x - rect.left
        const cy = y - rect.top
        html.animate(
            { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${raio}px at ${cx}px ${cy}px)`] },
            { ...tempo, pseudoElement: `::view-transition-new(${nome})` },
        )
        html.animate(
            { clipPath: [recorteDeFora(rect.width, rect.height, cx, cy, 0), recorteDeFora(rect.width, rect.height, cx, cy, raio)] },
            { ...tempo, pseudoElement: `::view-transition-old(${nome})` },
        )
    }
}
