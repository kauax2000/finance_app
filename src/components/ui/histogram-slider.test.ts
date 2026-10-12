import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import {
  alturaDaBarra,
  ancoraDaBarra,
  faixaAtiva,
} from "./histogram-slider"

/**
 * As três contas do histograma: qual barra acende, que altura ela tem e onde o arco-íris é
 * ancorado nela. O resto é composição, guardada pelos testes dos componentes.
 */

const FAIXA = { min: 0, max: 100, total: 10 }

describe("HistogramSlider", () => {
  it("1. a coluna acende só quando cabe inteira entre as guias", () => {
    // A coluna acende quando cabe inteira entre as guias (contenção, e não sobreposição): com a
    // linha-guia desenhada, a sobreposição acendia a coluna sob o punho metade para fora da
    // linha.
    const ativa = (i: number, de: number, ate: number) =>
      faixaAtiva(i, { ...FAIXA, de, ate })

    // Com 10 faixas em [0,100], a faixa 0 é [0,10] e a 1 é [10,20].
    expect(ativa(0, 0, 100)).toBe(true)

    // Um punho **dentro** da faixa 0 já a apaga: ela não cabe mais inteira.
    expect(ativa(0, 5, 100)).toBe(false)
    // E a 1 continua acesa, porque começa depois do corte.
    expect(ativa(1, 5, 100)).toBe(true)

    // Na fronteira exata a faixa seguinte acende, e a anterior não.
    expect(ativa(0, 10, 100)).toBe(false)
    expect(ativa(1, 10, 100)).toBe(true)

    // O punho de cima corta pelo mesmo critério.
    expect(ativa(9, 0, 100)).toBe(true)
    expect(ativa(9, 0, 95)).toBe(false)
    expect(ativa(8, 0, 95)).toBe(true)

    // Uma seleção mais estreita que uma faixa não acende nada — é verdade, e
    // não um buraco: não há coluna inteira ali dentro.
    expect(ativa(0, 2, 8)).toBe(false)
  })

  it("2. a altura tem piso, mas zero continua zero", () => {
    // Uma faixa com dado precisa desenhar alguma coisa: sem piso, 1 contra 200
    // sai em 0,5% e o histograma mente dizendo que ali não há nada.
    expect(alturaDaBarra(1, 200)).toBeGreaterThanOrEqual(6)
    // Zero é verdade, e não se inventa.
    expect(alturaDaBarra(0, 200)).toBe(0)
    // O máximo enche a barra.
    expect(alturaDaBarra(200, 200)).toBe(100)
    // E a proporção sobrevive acima do piso.
    expect(alturaDaBarra(100, 200)).toBe(50)
    // Sem dado nenhum, nada desenha — e não divide por zero.
    expect(alturaDaBarra(0, 0)).toBe(0)
    expect(Number.isFinite(alturaDaBarra(5, 0))).toBe(true)
  })

  it("3. a âncora do arco-íris é aritmética, e não divide por zero", () => {
    // `P = 100i/(N−1)`: a primeira barra alinha o começo da imagem, a última o
    // fim. É o que faz o degradê atravessar o histograma inteiro em vez de se
    // repetir dentro de cada barra.
    expect(ancoraDaBarra(0, 10)).toBe(0)
    expect(ancoraDaBarra(9, 10)).toBe(100)
    expect(ancoraDaBarra(5, 11)).toBe(50)
    // Uma barra só não tem para onde deslocar — e `N−1` seria zero.
    expect(ancoraDaBarra(0, 1)).toBe(0)
    expect(Number.isFinite(ancoraDaBarra(0, 1))).toBe(true)
  })

  it("4. a travessia é opacidade, e o degradê não volta a estalar", () => {
    // `transition-colors` cobre `background-color` e não `background-image`: na variante de
    // marca o degradê aparecia de estalo. Degradê não interpola, quem liga e desliga é uma
    // opacidade.
    const src = semComentarios(lerFonte("src/components/ui/histogram-slider.tsx"), "numa-passada")

    // A camada acesa existe **sempre**, e só a opacidade muda: montar e
    // desmontar não deixa nada para esmaecer.
    expect(src).toContain('data-slot="histogram-slider-fill"')
    expect(src).toContain("opacity-0")
    expect(src).toContain("transition-opacity")
    // E a coluna não volta a apostar numa transição de cor para a tinta ativa.
    expect(src).not.toContain("transition-colors")

    // A guia se ancora na coluna, e não no punho: o Radix recua o punho meia-largura nas
    // pontas, e o centro dele não cai no x da coluna (1,73px de desvio numa coluna de 6,02px).
    expect(src).toContain('data-slot="histogram-slider-guide"')
    expect(src).toContain("frestaDaGuia(")
    // E ela **não** volta a ser pseudo do punho — nem o `::after`, que é o
    // alvo de toque de 44px: escrever ali o apagaria sem erro nenhum.
    expect(src).not.toMatch(/slider-thumb\]\]:(before|after):/)
    const alvo = lerFonte("src/components/ui/slider.tsx")
    expect(alvo, "o alvo de 44px do punho").toContain("after:size-11")

    // Ela nasce na altura do centro do punho e desce até a base, é invertida
    // para se ver sobre qualquer coluna, e não disputa o arraste com o slider
    // que a cobre.
    expect(src).toContain("--histogram-h")
    expect(src).toContain("top-1/2 bottom-0")
    expect(src).toContain("mix-blend-difference")
    expect(src).toMatch(/pointer-events-none absolute top-1\/2/)

    // Toda coluna leva o mesmo tempo entre o neutro e o pintado; a ordem de acender é a do
    // arraste, e um atraso por coluna calcularia uma ordem que já existe.
    expect(src).not.toMatch(/transitionDelay:/)
    expect(src).not.toMatch(/--bar-delay/)
    expect(src).not.toMatch(/\bdelay-/)
    // E a duração é uma só, declarada uma vez.
    expect(src).toContain("duration-(--duration-slow)")
  })

  it("5. o slider é travado na grade, e é isso que centra punho e guia", () => {
    const src = semComentarios(lerFonte("src/components/ui/histogram-slider.tsx"), "numa-passada")

    // **O passo é a largura de uma faixa, e não uma prop.** Com passo livre,
    // uma guia presa às frestas não tem como estar sempre sob um punho que
    // anda contínuo — os dois se afastam até meia coluna.
    expect(src).toMatch(/const passo = larguraDaFaixa\(min, max, total\)/)
    expect(src).toMatch(/step=\{passo/)
    expect(src, "`step` não pode voltar a ser prop").not.toMatch(/step\?: number/)

    // O estado nasce na grade: senão o punho recebe o valor encaixado e as guias leem o cru, e
    // os dois discordam até o primeiro arraste.
    expect(src).toMatch(/useState<\[number, number\]>\(inicialNaGrade\)/)

    // A régua recua meio punho de cada lado, senão a grade das colunas e a
    // faixa que o punho percorre vivem em sistemas de coordenadas diferentes.
    // `1.75` é metade do `size-3.5` do punho.
    expect(src).toContain("inset-x-1.75")
  })
})
