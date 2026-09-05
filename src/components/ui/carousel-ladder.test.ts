import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import {
  carouselControlPosition,
  carouselControlTouchTarget,
  carouselDefaultGap,
  carouselControlPressFix,
  carouselControlTransition,
  carouselGapClasses,
  carouselVariants,
} from "./carousel"

/**
 * A escada e a caixa do `Carousel`, trancadas.
 *
 * O defeito que este teste existe para não deixar voltar é geométrico e foi
 * medido: as setas moravam **fora** da caixa do componente (`-left-12`,
 * `-right-12`), e num contêiner de 958px isso punha 8px de cada seta fora da
 * região de recorte do pai, dava ao pai 8px de rolagem horizontal fantasma
 * (`scrollWidth` 966 contra `clientWidth` 958) e deixava parte da seta seguinte
 * sem responder ao clique.
 *
 * Por isso a asserção que mais vale aqui não é sobre degraus: é a **4**, que
 * proíbe coordenada negativa em qualquer posição de controle. Um componente não
 * desenha fora da própria caixa; quem precisa de calha a reserva.
 */
const EIXOS = ["horizontal", "vertical"] as const
const DEGRAUS = ["none", "sm", "md", "lg"] as const
const SUPERFICIES = ["plain", "card", "inset"] as const

/**
 * A magnitude de um utilitário de espaçamento: `-ml-4` → 4, `pl-6` → 6.
 *
 * O sinal é descartado de propósito — o trilho recua o que o item avança, e o
 * que se compara entre os dois é a medida, não a direção.
 */
function medida(classe: string) {
  const m = classe.match(/(\d+(?:\.\d+)?)$/)
  return m ? Number(m[1]) : 0
}

const fonte = readFileSync(new URL("./carousel.tsx", import.meta.url), "utf8")

describe("escada e caixa do Carousel", () => {
  it("1. `md` é o padrão da calha, e ele está escrito uma vez só", () => {
    expect(carouselDefaultGap).toBe("md")
    // Escrito duas vezes — na desestruturação e numa tabela de padrões — os
    // dois se separam. O `Container` pagou isso na rodada 16.
    const ocorrencias = fonte.match(/DEFAULT_GAP:\s*CarouselGap\s*=\s*"md"/g)
    expect(ocorrencias).toHaveLength(1)
  })

  it("2. nenhum par de degraus de calha produz a mesma string", () => {
    for (const eixo of EIXOS) {
      const strings = DEGRAUS.map(
        (g) => `${carouselGapClasses[eixo][g].track}|${carouselGapClasses[eixo][g].item}`
      )
      expect(new Set(strings).size).toBe(DEGRAUS.length)
    }
  })

  it("3. a calha cresce monotonicamente, e o trilho devolve o que o item recua", () => {
    for (const eixo of EIXOS) {
      const trilho = DEGRAUS.map((g) => medida(carouselGapClasses[eixo][g].track))
      const item = DEGRAUS.map((g) => medida(carouselGapClasses[eixo][g].item))

      expect(trilho).toStrictEqual([...trilho].sort((a, b) => a - b))
      // A margem negativa do trilho tem de cancelar exatamente o recuo do item,
      // senão o primeiro item nasce deslocado da borda do viewport.
      expect(trilho).toStrictEqual(item)
      // E o sinal tem de ser o que a compensação exige: negativo no trilho,
      // positivo no item. Comparar só magnitudes deixaria passar dois recuos.
      for (const g of DEGRAUS) {
        const { track, item: recuo } = carouselGapClasses[eixo][g]
        if (g === "none") continue
        expect(track.startsWith("-")).toBe(true)
        expect(recuo.startsWith("-")).toBe(false)
      }
    }
  })

  it("4. nenhuma posição de controle é negativa — o componente não desenha fora da própria caixa", () => {
    for (const modo of ["inside", "outside"] as const) {
      for (const eixo of EIXOS) {
        for (const lado of ["prev", "next"] as const) {
          const classes = carouselControlPosition[modo][eixo][lado]
          // `-translate-*` é permitido: ele centraliza dentro da caixa. O que
          // não pode é âncora negativa (`-left-12`), que foi o defeito.
          for (const classe of classes.split(/\s+/)) {
            if (classe.startsWith("-translate")) continue
            expect(classe.startsWith("-")).toBe(false)
          }
        }
      }
    }
  })

  it("4b. a seta se centra no viewport, e nunca em `1/2` da raiz", () => {
    // A raiz também carrega os pontos e a contagem: medido, `top-1/2` punha a
    // seta 28px abaixo do centro do trilho, com a borda dela já fora dele.
    for (const modo of ["inside", "outside"] as const) {
      const h = carouselControlPosition[modo].horizontal
      const v = carouselControlPosition[modo].vertical
      for (const lado of ["prev", "next"] as const) {
        expect(h[lado]).toContain("top-(--carousel-control-y)")
        expect(v[lado]).toContain("left-(--carousel-control-x)")
        expect(h[lado]).not.toContain("top-1/2")
        expect(v[lado]).not.toContain("left-1/2")
      }
    }
    // E o `cva` declara o padrão de 50%, senão a primeira pintura salta.
    const base = carouselVariants({})
    expect(base).toContain("[--carousel-control-y:50%]")
    expect(base).toContain("[--carousel-control-x:50%]")
  })

  it("5. `outside` reserva a própria calha, e só ele", () => {
    const fora = carouselVariants({ controls: "outside", orientation: "horizontal" })
    const foraVertical = carouselVariants({ controls: "outside", orientation: "vertical" })
    // 36 = os 28 do botão mais os 8 de `--space-inline`. A calha é a seta mais
    // um respiro, e não um número herdado: com os 48 antigos sobravam 20px de
    // fundo puro entre a seta e o começo da dissolução, e ela lia como solta.
    expect(fora).toContain("px-9")
    expect(foraVertical).toContain("py-9")

    for (const controls of ["inside", "none"] as const) {
      const dentro = carouselVariants({ controls, orientation: "horizontal" })
      expect(dentro).not.toMatch(/\bpx-\d/)
      expect(dentro).not.toMatch(/\bpy-\d/)
    }
  })

  it("6. as superfícies pintadas não declaram `overflow-hidden` — ele cortaria o anel de foco", () => {
    for (const variant of SUPERFICIES) {
      expect(carouselVariants({ variant })).not.toContain("overflow-hidden")
    }
    // E as duas que pintam trazem recuo, senão o item encosta na borda.
    expect(carouselVariants({ variant: "card" })).toContain("p-3")
    expect(carouselVariants({ variant: "inset" })).toContain("p-3")
    expect(carouselVariants({ variant: "plain" })).not.toContain("p-3")
  })

  it("7. a seta passa dos 44 no toque, por pseudo-elemento", () => {
    // O bloco que contém um absoluto é a caixa de **padding** do ancestral: o
    // `Button` tem 1px de borda, então a base do `icon-sm` são 26, e não 28.
    // Medido, `-inset-2` dava 42 — abaixo do piso. `-inset-2.5` dá 26+20 = 46.
    expect(carouselControlTouchTarget).toContain("pointer-coarse:after:-inset-2.5")
    expect(carouselControlTouchTarget).toContain("pointer-coarse:after:absolute")
    expect(carouselControlTouchTarget).toContain("pointer-coarse:after:content-['']")
  })

  it("8. a âncora medida (`top`) não transiciona — foi o defeito da viagem", () => {
    // `top` sai de uma variável medida por JS, e a base do `Button` declara
    // `transition-all`: sem esta troca, toda remedição vira uma animação da seta
    // atravessando o cartão. A lista enumerada e `transition-all` são o mesmo
    // grupo no `twMerge`, então esta **substitui** aquela — e `top` fica de fora
    // dela de propósito. A cobertura do que ela **inclui** está na 8a2.
    expect(carouselControlTransition).not.toMatch(/\btop\b/)
    expect(carouselControlTransition).not.toContain("transition-all")
    expect(fonte).toContain("CONTROL_TRANSITION")
    // E a medição roda antes da pintura, senão o cliente pinta o palpite de 50%
    // do `cva` — que resolve contra a raiz, não contra o trilho — e a seta salta.
    // A medição da âncora tem de estar **dentro** do layout effect. O motor da
    // dissolução continua sendo um `useEffect` normal, e é correto: ele não
    // decide posição nenhuma, então não precisa correr antes da pintura.
    const blocoLayout = fonte.split("useIsomorphicLayoutEffect(")[1] ?? ""
    expect(blocoLayout).toContain("--carousel-control-y")
    expect(blocoLayout).toContain("--carousel-control-x")
  })

  it("8a. o press afunda 1px E mantém a centragem — as duas na mesma declaração", () => {
    // No Tailwind v4 `translate` é propriedade independente, e `-translate-y-1/2`
    // e o `active:translate-y-px` da base do `Button` escrevem a **mesma** custom
    // property. `.classe:active` é (0,2,0) contra (0,1,0), então herdar o nudge
    // cru levava a seta de −14px para +1px: 15px para baixo, sem centragem.
    //
    // Somar os dois numa declaração só devolve o feedback sem o defeito. E a
    // entrega é pelo `twMerge`, não por especificidade: mesma família sob o mesmo
    // variante, então esta classe **remove** a da base da lista.
    expect(carouselControlPressFix.horizontal).toBe(
      "active:translate-y-[calc(-50%_+_1px)]"
    )
    // O `-50%` tem de casar com a centragem de repouso, senão o press vira um
    // deslocamento em vez de um afundamento.
    for (const modo of ["inside", "outside"] as const) {
      for (const lado of ["prev", "next"] as const) {
        expect(carouselControlPosition[modo].horizontal[lado]).toContain(
          "-translate-y-1/2"
        )
      }
    }
    // Na vertical a centragem é em X: o nudge em Y da base não colide e fica.
    expect(carouselControlPressFix.vertical).toBe("")
  })

  it("8a2. `translate` transiciona e `top` não — é o que separa press de remedição", () => {
    // `top` é a âncora medida por JS: transicioná-la faz a seta viajar a cada
    // remedição. `translate` é só o press. Enumerar é obrigatório —
    // `transition-all` traria `top` de volta e `transition-colors` não alcança
    // `translate`.
    expect(carouselControlTransition).toContain("translate")
    expect(carouselControlTransition).not.toContain("all")
    expect(carouselControlTransition).not.toMatch(/\btop\b/)
  })

  it("8b. a seta é quadrada de cantos arredondados, sem fundo em repouso", () => {
    // `rounded-full` era a única do repositório; `Calendar` e `Pagination` já
    // entregam `tertiary` + o `rounded-lg` do próprio `Button`.
    expect(fonte).not.toContain("rounded-full\"")
    expect(fonte).toMatch(/variant = "tertiary"/)
    // Uma função que escolhe entre dois pesos, com um peso só, é constante. Ela
    // não pode voltar como declaração nem como export — citá-la num comentário
    // que explica por que ela saiu é justamente o que deve continuar passando.
    expect(fonte).not.toMatch(/function defaultControlVariant/)
    expect(fonte).not.toMatch(/^\s*defaultControlVariant,$/m)
  })

  it("8c. a dissolução é o padrão — é ela que sustenta a seta sem fundo", () => {
    expect(fonte).toMatch(/fade = true/)
  })

  it("9. o ponto ativo é `primary-accent`, e o alvo cresce de verdade", () => {
    // `--primary` preenche e carrega texto por cima; um ponto de 8px é marca
    // sobre o fundo, e a régua da casa para isso é o acento.
    expect(fonte).toContain("bg-primary-accent")
    // O `pagination.tsx` já recusou o `-inset` para alvos adjacentes: um
    // `::after` de 44px em cada ponto engoliria o vizinho.
    expect(fonte).toMatch(/pointer-coarse:h-11|pointer-coarse:py-5/)
    expect(fonte).not.toMatch(/carousel-dot[\s\S]{0,600}?after:-inset/)

    // O ponto apagado é controle, e a 1.4.11 pede 3:1. Varridos os degraus
    // contra o fundo real, 45% é o primeiro que passa nos dois temas — 3,15 no
    // claro e 4,36 no escuro. Abaixo disso ele reprova, e 25% reprovava.
    expect(fonte).toContain("bg-foreground/45")
    expect(fonte).not.toContain("bg-foreground/25")
    // E o par `active:` existe, senão o toque não responde.
    expect(fonte).toContain("group-active/dot:bg-foreground/70")
  })

  it("10. quem carrega a máscara não desenha nada — invariante 2 da dissolução", () => {
    // O viewport é o elemento mascarado. Uma `bg`, um `ring` ou um `radius` ali
    // sai com os quatro cantos apagados e os lados opacos. A asserção olha as
    // classes literais do nó, e não a forma da chamada: casar a string exata do
    // `cn()` fazia o teste passar por acidente e quebrar a cada refatoração.
    const bloco = fonte.split('data-slot="carousel-content"')[0].slice(-900)
    for (const proibida of ["bg-", "ring-", "rounded-", "shadow-", "border-"]) {
      expect(
        new RegExp(`"[^"]*\\b${proibida}`).test(bloco),
        `o viewport mascarado não pode declarar ${proibida}*`
      ).toBe(false)
    }
    expect(bloco).toContain("overflow-hidden")
  })

  it("10b. a rampa segue o eixo — a vertical não dissolve os lados", () => {
    // Defeito real: o viewport vertical saía com `scroll-fade-x`, dissolvendo as
    // bordas laterais enquanto o conteúdo entrava e saía por cima e por baixo.
    // As duas utilities leem as mesmas `--scroll-fade-start/end`, então nada
    // denuncia a troca em runtime — só o olho.
    expect(fonte).toContain("scrollFadeViewportClassName")
    expect(fonte).toContain("scrollFadeViewportXClassName")
    // E a escolha tem de ser condicional à orientação, não cravada.
    expect(fonte).toMatch(
      /orientation === "horizontal"\s*\?\s*scrollFadeViewportXClassName\s*:\s*scrollFadeViewportClassName/
    )
    // Uma **ou** a outra: a invariante 3 é um gradiente por elemento.
    expect(fonte).not.toMatch(
      /scrollFadeViewportXClassName,\s*scrollFadeViewportClassName/
    )
  })

  it("11b. o trilho vertical mede o viewport — sem isso o embla desabilita as setas", () => {
    // Medido: o embla mede o **contêiner**, não o viewport. Com a altura só no
    // viewport, o trilho crescia até o conteúdo (160 contra 362) e as duas
    // setas saíam desabilitadas com o conteúdo transbordando calado.
    expect(fonte).toContain('orientation === "horizontal" ? "" : "h-full flex-col"')
  })

  it("12. o efeito desinscreve tudo o que inscreve", () => {
    const inscritos = [...fonte.matchAll(/api\.on\("(\w+)"/g)].map((m) => m[1])
    const desinscritos = [...fonte.matchAll(/api\.off\("(\w+)"/g)].map((m) => m[1])
    // Era o defeito: `reInit` ficava inscrito para sempre.
    expect(new Set(inscritos)).toStrictEqual(new Set(desinscritos))
  })
})
