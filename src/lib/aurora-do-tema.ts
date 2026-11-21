/**
 * A aurora da troca de tema. O `ThemeToggle` abre uma View Transition e, no `ready`, a página
 * nova passa por uma borda em onda e desfocada (a máscara SVG no `::view-transition-new(root)`),
 * com uma faixa da marca correndo na frente dela. O sentido e a paleta são do destino: o escuro
 * cai de cima (violeta, índigo, azul) e o claro sobe de baixo (âmbar, coral, magenta). A onda
 * desliza para o lado enquanto a borda anda, e segue deslizando depois da varredura.
 * A faixa é um elemento criado no callback da transição, com `view-transition-name` inline: ela só
 * existe na foto nova e sai no `finished` (nome permanente tira o borrão do vidro, AGENTS.md).
 * A altura e a largura da tela são lidas uma vez, no toque, por quem chama.
 */

import { revelarVidros, type Vidro } from "./vidro-na-revelacao"

/** Para onde a borda anda: o escuro desce, o claro sobe. */
export type Sentido = "desce" | "sobe"

/** O tempo, a parte da varredura, a altura da faixa (fração da tela) e o volume dela. */
export const AURORA = {
    duracao: 1100,
    varredura: 0.6,
    faixa: 0.6,
    opacidade: 0.85,
    easing: "cubic-bezier(0.45, 0, 0.2, 1)",
}

export const NOME_DA_FAIXA = "theme-aurora"

/**
 * A borda em onda, no meio de uma imagem de 3 telas de altura e 2 de largura (repetida no X):
 * em qualquer ponto da varredura, o lado da página nova cobre a tela inteira, e a onda periódica
 * emenda consigo mesma a cada 200 unidades.
 */
const ONDA = "M-10 150L0 150 Q25 138 50 150 T100 150 T150 150 T200 150L210 150"

/** A máscara da borda, num `url("data:…")`: branco é o que mostra, acima ou abaixo da onda. */
export function mascaraDaAurora(lado: "acima" | "abaixo"): string {
    const d = `${ONDA}${lado === "acima" ? "V-10H-10Z" : "V310H-10Z"}`
    const svg =
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300' preserveAspectRatio='none'>` +
        `<defs><filter id='b' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='2.2'/></filter></defs>` +
        `<path filter='url(%23b)' fill='white' d='${d}'/></svg>`
    return `url("data:image/svg+xml,${svg.replace(/%/g, "%25").replace(/%2523/g, "%23")}")`
}

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
    const tamanho = `${2 * largura}px ${3 * altura}px`
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
    const [de, ate] = sentido === "desce" ? [-0.15 * altura, 1.15 * altura] : [1.15 * altura, -0.15 * altura]
    return [
        { ...quadro(0, de), easing: AURORA.easing },
        { ...quadro(-0.8 * largura, ate), offset: AURORA.varredura },
        quadro(-1.2 * largura, ate),
    ]
}

/** A faixa anda na frente da borda, com a cor da frente nela, e some depois da varredura. */
export function quadrosDaFaixa(altura: number, sentido: Sentido): Keyframe[] {
    const bh = altura * AURORA.faixa
    const [ys, recuo] =
        sentido === "desce" ? [[-0.15, 0.95, 1.1], bh * 0.85] : [[1.15, 0.05, -0.1], bh * 0.15]
    const t = (f: number) => `translateY(${f * altura - recuo}px)`
    return [
        { transform: t(ys[0]), opacity: AURORA.opacidade, easing: AURORA.easing },
        { offset: AURORA.varredura, transform: t(ys[1]), opacity: AURORA.opacidade },
        { transform: t(ys[2]), opacity: 0 },
    ]
}

/** Cria a faixa (chame dentro do callback da transição, depois do tema) e devolve como tirá-la. */
export function criarFaixa(doc: Document, altura: number, sentido: Sentido): () => void {
    // Uma troca pulada não deixa faixa órfã.
    doc.querySelectorAll(`.${NOME_DA_FAIXA}`).forEach((el) => el.remove())
    const faixa = doc.createElement("div")
    faixa.className = NOME_DA_FAIXA
    faixa.setAttribute("aria-hidden", "true")
    faixa.setAttribute("data-sentido", sentido)
    faixa.style.height = `${altura * AURORA.faixa}px`
    faixa.style.viewTransitionName = NOME_DA_FAIXA
    doc.body.append(faixa)
    // Tirar duas vezes não faz nada: a animação da faixa e o `finished` da transição tiram.
    return () => faixa.remove()
}

/**
 * Anima a página, a faixa e cada vidro. Chame no `ready`. A faixa acaba 50ms antes da raiz e a
 * animação dela é devolvida: quem chama tira a faixa no `finished` dela, ainda dentro da
 * transição. Tirada só no `finished` da transição, a faixa de verdade (sem o esmaecer, que é do
 * pseudo) podia pintar um quadro no topo.
 */
export function animarAurora(html: HTMLElement, altura: number, largura: number, sentido: Sentido, vidros: Vidro[]): Animation {
    const tempo = { duration: AURORA.duracao, easing: "linear" }
    html.animate(quadrosDaMascara(altura, largura, sentido), { ...tempo, pseudoElement: "::view-transition-new(root)" })
    const faixa = html.animate(quadrosDaFaixa(altura, sentido), {
        ...tempo,
        duration: AURORA.duracao - 50,
        fill: "both",
        pseudoElement: `::view-transition-new(${NOME_DA_FAIXA})`,
    })
    revelarVidros(html, vidros, altura, largura, sentido)
    return faixa
}
