/**
 * A aurora da troca de tema. O `ThemeToggle` abre uma View Transition e, no `ready`, a página
 * nova passa por uma borda em onda e desfocada (a máscara SVG no `::view-transition-new(root)`),
 * com uma faixa da marca correndo na frente dela. O sentido e a paleta são do destino: o escuro
 * cai de cima (violeta, índigo, azul) e o claro sobe de baixo (âmbar, coral, magenta). A onda
 * desliza para o lado enquanto a borda anda, e segue deslizando depois da varredura.
 * A faixa é um elemento criado no callback da transição, com `view-transition-name` inline: ela só
 * existe na foto nova e sai no `finished` (nome permanente tira o borrão do vidro, AGENTS.md).
 * Um aro aceso (o traço da mesma onda, na cor clara da paleta) anda com a borda. A paleta mora
 * no `<html>` durante a troca (`data-aurora`), para a faixa e o aro lerem a mesma.
 * A altura e a largura da tela são lidas uma vez, no toque, por quem chama.
 */

import { revelarVidros, type Vidro } from "./vidro-na-revelacao"

/** Para onde a borda anda: o escuro desce, o claro sobe. */
export type Sentido = "desce" | "sobe"

/** A parte da varredura, a altura da faixa (fração da tela) e o volume dela. */
export const AURORA = {
    varredura: 0.6,
    faixa: 0.6,
    opacidade: 0.85,
}

/** Um ritmo por sentido: a noite cai mais pesada, o sol nasce mais leve. */
export const RITMO: Record<Sentido, { duracao: number; easing: string }> = {
    desce: { duracao: 1250, easing: "cubic-bezier(0.55, 0, 0.15, 1)" },
    sobe: { duracao: 950, easing: "cubic-bezier(0.3, 0, 0.2, 1)" },
}

export const NOME_DA_FAIXA = "theme-aurora"
export const NOME_DO_ARO = "theme-aurora-aro"

/**
 * A borda em onda, no meio de uma imagem de 3 telas de altura e 2/3 de largura (repetida no X,
 * três ondas por tela): em qualquer ponto da varredura, o lado da página nova cobre a tela
 * inteira. A onda tem um período a mais de cada lado, e emenda consigo mesma sem trecho reto.
 */
const ONDA = "M-100 150Q-75 144 -50 150T0 150T50 150T100 150T150 150T200 150T250 150T300 150"

/** O SVG num `url("data:…")`, sem aspas duplas nem cerquilha crua. */
function embutir(svg: string) {
    return `url("data:image/svg+xml,${svg.replace(/%/g, "%25").replace(/%2523/g, "%23")}")`
}

/** A máscara da borda: branco é o que mostra, acima ou abaixo da onda. */
export function mascaraDaAurora(lado: "acima" | "abaixo"): string {
    const d = `${ONDA}${lado === "acima" ? "V-30H-100Z" : "V330H-100Z"}`
    return embutir(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300' preserveAspectRatio='none'>` +
            `<defs><filter id='b' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='2.2'/></filter></defs>` +
            `<path filter='url(%23b)' fill='white' d='${d}'/></svg>`,
    )
}

/** A máscara do aro: só o traço da mesma onda, numa faixa de 40 unidades em volta da borda. */
export function mascaraDoAro(): string {
    return embutir(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 130 200 40' preserveAspectRatio='none'>` +
            `<path fill='none' stroke='white' stroke-width='3' vector-effect='non-scaling-stroke' d='${ONDA}'/></svg>`,
    )
}

/** O deslize lateral da onda, na escala dela (meia imagem = 1/3 da tela). */
const deslize = (largura: number) => [0, (-0.8 * largura) / 3, (-1.2 * largura) / 3]

/** A faixa e o aro acabam 50ms antes da raiz e saem juntos, ainda dentro da transição. */
const ANTES_DO_FIM = 50

/**
 * O fim da varredura na régua da faixa e do aro: eles duram 50ms menos, e a varredura tem de
 * acabar no mesmo instante da borda (0,6 da duração inteira), senão correm na frente dela.
 */
export function varreduraAntesDoFim(sentido: Sentido) {
    const d = RITMO[sentido].duracao
    return (AURORA.varredura * d) / (d - ANTES_DO_FIM)
}

/** Onde a borda anda: de 15% fora da tela até 15% além do outro lado. */
const borda = (altura: number, sentido: Sentido) =>
    sentido === "desce" ? [-0.15 * altura, 1.15 * altura] : [1.15 * altura, -0.15 * altura]

/**
 * Os três quadros da máscara: a borda vai de 15% fora da tela até 15% além do outro lado, e a
 * onda desliza no X. `novo` é a foto nova (o lado do destino), `velho` a velha do vidro (o lado
 * oposto). `caixa` é a esquerda e o topo do vidro: a máscara de um pseudo do vidro mede pela
 * caixa dele, e o tamanho em px da janela mantém a onda em fase com a da página.
 */
export function quadrosDaMascara(
    altura: number,
    largura: number,
    sentido: Sentido,
    lado: "novo" | "velho" = "novo",
    caixa?: { x: number; y: number },
): Keyframe[] {
    const acima = (sentido === "desce") === (lado === "novo")
    const imagem = mascaraDaAurora(acima ? "acima" : "abaixo")
    const tamanho = `${(2 * largura) / 3}px ${3 * altura}px`
    const { x, y } = caixa ?? { x: 0, y: 0 }
    const quadro = (dx: number, bordaY: number) => {
        const posicao = `${dx - x}px ${bordaY - 1.5 * altura - y}px`
        return {
            maskImage: imagem,
            maskSize: tamanho,
            maskRepeat: "repeat-x",
            maskPosition: posicao,
            webkitMaskImage: imagem,
            webkitMaskSize: tamanho,
            webkitMaskRepeat: "repeat-x",
            webkitMaskPosition: posicao,
            // No vidro a máscara não recorta na borda da caixa: a sombra dele passa da caixa.
            ...(caixa && { maskClip: "no-clip", webkitMaskClip: "no-clip" }),
        }
    }
    const [de, ate] = borda(altura, sentido)
    const [x0, x1, x2] = deslize(largura)
    return [
        { ...quadro(x0, de), easing: RITMO[sentido].easing },
        { ...quadro(x1, ate), offset: AURORA.varredura },
        quadro(x2, ate),
    ]
}

/**
 * A faixa anda colada à borda, com a ponta da frente nela o caminho inteiro, e depois da varredura
 * passa mais 0,1 tela e some.
 */
export function quadrosDaFaixa(altura: number, sentido: Sentido): Keyframe[] {
    const bh = altura * AURORA.faixa
    const [ys, recuo] =
        sentido === "desce" ? [[-0.15, 1.15, 1.25], bh * 0.92] : [[1.15, -0.15, -0.25], bh * 0.08]
    const t = (f: number) => `translateY(${f * altura - recuo}px)`
    return [
        { transform: t(ys[0]), opacity: AURORA.opacidade, easing: RITMO[sentido].easing },
        { offset: varreduraAntesDoFim(sentido), transform: t(ys[1]), opacity: AURORA.opacidade },
        { transform: t(ys[2]), opacity: 0 },
    ]
}

/** Cria a faixa (chame dentro do callback da transição, depois do tema) e devolve como tirá-la. */
export function criarFaixa(doc: Document, altura: number): () => void {
    // Uma troca pulada não deixa faixa órfã.
    doc.querySelectorAll(`.${NOME_DA_FAIXA}`).forEach((el) => el.remove())
    const faixa = doc.createElement("div")
    faixa.className = NOME_DA_FAIXA
    faixa.setAttribute("aria-hidden", "true")
    faixa.style.height = `${altura * AURORA.faixa}px`
    faixa.style.viewTransitionName = NOME_DA_FAIXA
    doc.body.append(faixa)
    // Tirar duas vezes não faz nada: a animação da faixa e o `finished` da transição tiram.
    return () => faixa.remove()
}

/** O aro anda com a borda (centrado nela) e some depois da varredura. */
export function quadrosDoAro(altura: number, sentido: Sentido): Keyframe[] {
    const [de, ate] = borda(altura, sentido)
    const t = (y: number) => `translateY(${y - 0.2 * altura}px)`
    return [
        { transform: t(de), opacity: 1, easing: RITMO[sentido].easing },
        { offset: varreduraAntesDoFim(sentido), transform: t(ate), opacity: 1 },
        { transform: t(ate), opacity: 0 },
    ]
}

/** Cria o aro (no callback da transição, depois do tema) e devolve ele e como tirá-lo. */
export function criarAro(doc: Document, altura: number, largura: number): { aro: HTMLElement; tirar: () => void } {
    doc.querySelectorAll(`.${NOME_DO_ARO}`).forEach((el) => el.remove())
    const aro = doc.createElement("div")
    aro.className = NOME_DO_ARO
    aro.setAttribute("aria-hidden", "true")
    const imagem = mascaraDoAro()
    const tamanho = `${(2 * largura) / 3}px ${0.4 * altura}px`
    aro.style.height = `${0.4 * altura}px`
    aro.style.maskImage = imagem
    aro.style.webkitMaskImage = imagem
    aro.style.maskSize = tamanho
    aro.style.webkitMaskSize = tamanho
    aro.style.maskRepeat = "repeat-x"
    aro.style.webkitMaskRepeat = "repeat-x"
    aro.style.viewTransitionName = NOME_DO_ARO
    doc.body.append(aro)
    return { aro, tirar: () => aro.remove() }
}

/**
 * Anima a página, a faixa, o aro e cada vidro. Chame no `ready`. A faixa acaba 50ms antes da raiz e a
 * animação dela é devolvida: quem chama tira a faixa no `finished` dela, ainda dentro da
 * transição. Tirada só no `finished` da transição, a faixa de verdade (sem o esmaecer, que é do
 * pseudo) podia pintar um quadro no topo. Devolve todas as animações, a da faixa primeiro.
 * O aro desliza a máscara no próprio elemento (a foto nova dele é viva) e anda pelo pseudo.
 */
export function animarAurora(
    html: HTMLElement,
    altura: number,
    largura: number,
    sentido: Sentido,
    vidros: Vidro[],
    aro?: HTMLElement,
): Animation[] {
    // `fill` segura o último quadro: na volta (a animação ao contrário) a máscara chega a 0 e
    // ficaria um quadro sem ela, mostrando o tema vivo antes de ele voltar.
    const tempo = { duration: RITMO[sentido].duracao, easing: "linear", fill: "both" as const }
    const antes = { ...tempo, duration: tempo.duration - ANTES_DO_FIM }
    const animacoes = [
        html.animate(quadrosDaFaixa(altura, sentido), {
            ...antes,
            pseudoElement: `::view-transition-new(${NOME_DA_FAIXA})`,
        }),
        html.animate(quadrosDaMascara(altura, largura, sentido), { ...tempo, pseudoElement: "::view-transition-new(root)" }),
    ]
    if (aro) {
        const posicao = (x: number) => ({ maskPosition: `${x}px 0px`, webkitMaskPosition: `${x}px 0px` })
        const [x0, x1, x2] = deslize(largura)
        animacoes.push(
            html.animate(quadrosDoAro(altura, sentido), {
                ...antes,
                pseudoElement: `::view-transition-new(${NOME_DO_ARO})`,
            }),
            aro.animate(
                [{ ...posicao(x0), easing: RITMO[sentido].easing }, { ...posicao(x1), offset: varreduraAntesDoFim(sentido) }, posicao(x2)],
                antes,
            ),
        )
    }
    return [...animacoes, ...revelarVidros(html, vidros, altura, largura, sentido)]
}
