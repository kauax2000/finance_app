/**
 * A aurora da troca de tema. O `ThemeToggle` abre uma View Transition e, no `ready`, a página
 * nova desce de cima para baixo por uma borda ondulada e desfocada (a máscara SVG no
 * `::view-transition-new(root)`), com uma faixa do arco-íris da marca correndo na frente dela.
 * A faixa é um elemento criado no callback da transição, com `view-transition-name` inline: ela só
 * existe na foto nova e sai no `finished` (nome permanente tira o borrão do vidro, AGENTS.md).
 * A altura da tela é lida uma vez, no toque, por quem chama.
 */

import { revelarVidros, type Vidro } from "./vidro-na-revelacao"

/** O tempo, a parte da varredura, a altura da faixa (fração da tela) e o volume dela. */
export const AURORA = {
    duracao: 1100,
    varredura: 0.6,
    faixa: 0.75,
    opacidade: 0.9,
    easing: "cubic-bezier(0.45, 0, 0.2, 1)",
}

export const NOME_DA_FAIXA = "theme-aurora"

/**
 * A borda ondulada: branco é o que mostra a página nova. A onda do protótipo desceu 22 unidades
 * numa imagem de 240 (2,4 telas): no fim a imagem ainda cobre o topo, e a borda (≈1,03 tela) já
 * passou do pé. Com a onda em 100 de 200, o topo ficava fora da imagem, e a página velha aparecia
 * nos 10% de cima enquanto a máscara não terminava.
 */
const BORDA = "M-10 -10H110V122C88 134 72 115 54 126S22 138 -10 125Z"

/**
 * A máscara da borda, num `url("data:…")`. A invertida (a foto velha do vidro) é tudo abaixo da
 * borda: um retângulo menos o caminho, por `evenodd`. Ela tem o dobro da altura (na mesma escala,
 * com a borda no mesmo lugar), para que o que fica abaixo da borda cubra a tela inteira desde o
 * primeiro quadro (fora da imagem a máscara é transparente, e a foto velha sumiria antes de a
 * borda chegar).
 */
export function mascaraDaAurora(invertida = false): string {
    const altura = invertida ? 480 : 240
    const d = invertida ? `M-10 -10H110V${altura + 10}H-10Z ${BORDA}` : BORDA
    const regra = invertida ? " fill-rule='evenodd'" : ""
    const svg =
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 ${altura}' preserveAspectRatio='none'>` +
        `<defs><filter id='b' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='2.2'/></filter></defs>` +
        `<path filter='url(%23b)' fill='white'${regra} d='${d}'/></svg>`
    return `url("data:image/svg+xml,${svg.replace(/%/g, "%25").replace(/%2523/g, "%23")}")`
}

/** Os três quadros da máscara: de acima da tela até abaixo dela, parada depois da varredura. O `deslocamento` é o topo do vidro, para ele casar com a página. */
export function quadrosDaMascara(altura: number, deslocamento = 0, invertida = false): Keyframe[] {
    const imagem = mascaraDaAurora(invertida)
    const tamanho = `100% ${(invertida ? 4.8 : 2.4) * altura}px`
    const quadro = (y: number) => {
        const posicao = `0 ${y}px`
        return {
            maskImage: imagem,
            maskSize: tamanho,
            maskRepeat: "no-repeat",
            maskPosition: posicao,
            webkitMaskImage: imagem,
            webkitMaskSize: tamanho,
            webkitMaskRepeat: "no-repeat",
            webkitMaskPosition: posicao,
        }
    }
    const fim = -0.12 * altura - deslocamento
    return [
        { ...quadro(-2.32 * altura - deslocamento), easing: AURORA.easing },
        { ...quadro(fim), offset: AURORA.varredura },
        quadro(fim),
    ]
}

/** A faixa desce na frente da borda e some depois da varredura. */
export function quadrosDaFaixa(altura: number): Keyframe[] {
    const bh = altura * AURORA.faixa
    return [
        { transform: `translateY(${-bh}px)`, opacity: AURORA.opacidade, easing: AURORA.easing },
        { offset: AURORA.varredura, transform: `translateY(${altura - bh * 0.55}px)`, opacity: AURORA.opacidade },
        { transform: `translateY(${altura - bh * 0.35}px)`, opacity: 0 },
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
    return () => faixa.remove()
}

/** Anima a página, a faixa e cada vidro com o mesmo tempo. Chame no `ready`. */
export function animarAurora(html: HTMLElement, altura: number, vidros: Vidro[]): void {
    const tempo = { duration: AURORA.duracao, easing: "linear" }
    html.animate(quadrosDaMascara(altura), { ...tempo, pseudoElement: "::view-transition-new(root)" })
    html.animate(quadrosDaFaixa(altura), {
        ...tempo,
        fill: "both",
        pseudoElement: `::view-transition-new(${NOME_DA_FAIXA})`,
    })
    revelarVidros(html, vidros, altura)
}
