import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte, blocoCss, semComentarios } from "@/test/fonte"

import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselMore,
  CarouselProgress,
  CarouselSkeleton,
  CarouselStatus,
  carouselEffectClasses,
  carouselUntilTrack,
  carouselControlPosition,
  carouselControlTouchTarget,
  carouselDefaultGap,
  carouselItemHover,
  carouselControlPressFix,
  carouselControlTransition,
  carouselGapClasses,
  carouselVariants,
} from "./carousel"
import { esperarDepoisDeNoScrollbar } from "@/test/regras"

/** As versões do `Carousel`. */

const carrossel = (props: Record<string, unknown>, ...filhos: React.ReactNode[]) =>
  renderToStaticMarkup(h(Carousel, { "aria-label": "Teste", ...props }, ...filhos))
const itens = (n: number) =>
  h(CarouselContent, null, ...Array.from({ length: n }, (_, i) => h(CarouselItem, { key: i }, `item ${i}`)))

describe("as versões do Carousel", () => {
  it("until vira grade a partir do degrau, com a calha do gap, e esconde os controles", () => {
    const html = carrossel({ until: "md" }, itens(3), h(CarouselDots), h(CarouselStatus))
    expect(html).toContain('data-until="md"')
    expect(html).toContain("md:grid")
    expect(html).toContain("md:gap-4")
    expect(html).toContain("md:pl-0")
    expect(html).toMatch(/data-slot="carousel-status"[^>]*group-data-\[until=md\]\/carousel:md:hidden/)
    // Literal por degrau e por calha: classe montada não chega à folha.
    for (const degrau of Object.values(carouselUntilTrack)) {
      expect(Object.values(degrau).every((c) => /(md|lg):grid /.test(c))).toBe(true)
    }
  })

  it("fade é efeito com utility própria e força a calha zero", () => {
    expect(carouselEffectClasses.fade).toBe("carousel-effect-fade")
    const html = carrossel({ effect: "fade", gap: "lg" }, itens(2))
    expect(html).not.toContain("-ml-6")
    expect(html).toContain("carousel-effect-fade")
    const css = lerFonte("src/app/globals.css")
    expect(css).toMatch(/@utility carousel-effect-fade \{[\s\S]*?translate: calc\(var\(--carousel-slide-s, 0\) \* -100%\) 0;/)
    expect(css).toMatch(/carousel-effect-fade[\s\S]*?:not\(\[data-selected\]\) \{\s*pointer-events: none;/)
  })

  it("snap free liga o dragFree; a roda e o clique no item cortado são padrão", () => {
    expect(carrossel({ snap: "free" }, itens(2))).toContain('data-snap="free"')
    const codigo = lerFonte("src/components/ui/carousel.tsx")
    expect(codigo).toContain('...(snap === "free" && { dragFree: true })')
    expect(codigo).toContain("selectOnClick = true")
    expect(codigo).toContain("wheel = true")
    // O ouvinte nativo, não passivo: o onWheel do React não pode cancelar o gesto.
    expect(codigo).toContain('addEventListener("wheel", aoRolar, { passive: false })')
    expect(codigo).toContain("onClickCapture={trazerParaVista}")
  })

  it("a barra de progresso é decorativa e começa invisível sem medida", () => {
    const html = carrossel({}, itens(3), h(CarouselProgress))
    expect(html).toMatch(/data-slot="carousel-progress"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-slot="carousel-progress"/)
    expect(html).toContain("data-empty:invisible")
  })

  it("a contagem sobre a foto é a pílula de vidro", () => {
    const html = carrossel({}, itens(3), h(CarouselStatus, { placement: "overlay" }))
    expect(html).toMatch(/data-slot="carousel-status"[^>]*data-placement="overlay"/)
    expect(html).toContain("rounded-full")
  })

  it("CarouselMore é um item, e o link recebe a superfície do lugar vazio", () => {
    const html = carrossel(
      {},
      h(CarouselContent, null, h(CarouselItem, { key: 0 }, "a"), h(CarouselMore, { key: 1, count: 12, children: h("a", { href: "/x" }, "Ver todos") }))
    )
    expect(html).toMatch(/<a[^>]*data-slot="carousel-more"[^>]*href="\/x"|<a[^>]*href="\/x"[^>]*data-slot="carousel-more"/)
    expect(html).toContain("border-dashed")
    expect(html).toContain("12 no total")
    expect(html).toContain('aria-label="2 de 2"')
  })

  it("o esqueleto anuncia uma vez e tem o basis do item", () => {
    const html = renderToStaticMarkup(h(CarouselSkeleton, { count: 2, itemClassName: "basis-1/2" }))
    expect(html).toContain('role="status"')
    expect((html.match(/basis-1\/2/g) ?? []).length).toBe(2)
  })

  it("a tela cheia é opaca nos dois temas e devolve o índice", () => {
    const codigo = lerFonte("src/components/ui/carousel.tsx")
    expect(codigo).toMatch(/data-slot="carousel-fullscreen"[\s\S]*?bg-background[\s\S]*?dark:bg-background"/)
    expect(codigo).toContain("principal?.scrollTo(interna.selectedScrollSnap(), true)")
  })
})

/**
 * A escada e a caixa do `Carousel`, trancadas. As setas moravam fora da caixa (`-left-12`,
 * `-right-12`), o que dava ao pai 8px de rolagem horizontal fantasma e deixava parte da seta
 * sem responder ao clique; a asserção 4 proíbe coordenada negativa em qualquer controle.
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

const fonte = lerFonte("src/components/ui/carousel.tsx")

describe("escada e caixa do Carousel", () => {
  it("1. `md` é o padrão da calha, e ele está escrito uma vez só", () => {
    expect(carouselDefaultGap).toBe("md")
    // Escrito duas vezes (na desestruturação e numa tabela de padrões), os dois se separam.
    const ocorrencias = fonte.match(/DEFAULT_GAP:\s*CarouselGap\s*=\s*"md"/g)
    expect(ocorrencias).toHaveLength(1)
  })

  it("3. a calha cresce monotonicamente, e o trilho devolve o que o item recua", () => {
    for (const eixo of EIXOS) {
      const trilho = DEGRAUS.map((g) => medida(carouselGapClasses[eixo][g].track))
      const item = DEGRAUS.map((g) => medida(carouselGapClasses[eixo][g].item))

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
    // A raiz também carrega os pontos e a contagem: `top-1/2` punha a seta 28px abaixo do
    // centro do trilho.
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
    // O bloco que contém um absoluto é a caixa de padding do ancestral: o `Button` tem 1px de
    // borda, a base do `icon-sm` são 26 e `-inset-2.5` dá 26+20 = 46.
    expect(carouselControlTouchTarget).toContain("pointer-coarse:after:-inset-2.5")
    expect(carouselControlTouchTarget).toContain("pointer-coarse:after:absolute")
    expect(carouselControlTouchTarget).toContain("pointer-coarse:after:content-['']")
  })

  it("8. a âncora medida (`top`) não transiciona — foi o defeito da viagem", () => {
    // `top` sai de uma variável medida por JS e a base do `Button` declara `transition-all`:
    // sem esta troca, toda remedição vira uma animação da seta. A lista enumerada e
    // `transition-all` são o mesmo grupo no `twMerge`, e `top` fica de fora dela.
    expect(carouselControlTransition).not.toMatch(/\btop\b/)
    expect(carouselControlTransition).not.toContain("transition-all")
    expect(fonte).toContain("CONTROL_TRANSITION")
    // A medição roda antes da pintura (dentro do layout effect), senão o cliente pinta o
    // palpite de 50% do `cva` e a seta salta. O motor da dissolução não decide posição, então
    // um `useEffect` normal basta.
    const blocoLayout = fonte.split("React.useLayoutEffect(")[1] ?? ""
    expect(blocoLayout).toContain("--carousel-control-y")
    expect(blocoLayout).toContain("--carousel-control-x")
  })

  it("8a. o press afunda 1px E mantém a centragem — as duas na mesma declaração", () => {
    // No Tailwind v4 `translate` é propriedade independente, e `-translate-y-1/2` e o
    // `active:translate-y-px` da base escrevem a mesma custom property: herdar o nudge cru
    // levava a seta 15px para baixo. Somar os dois numa declaração só devolve o feedback; a
    // entrega é pelo `twMerge`.
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
    // `top` é a âncora medida por JS, e transicioná-la faz a seta viajar a cada remedição;
    // `translate` é só o press. Enumerar é obrigatório: `transition-all` traria `top` de volta
    // e `transition-colors` não alcança `translate`.
    expect(carouselControlTransition).toContain("translate")
    expect(carouselControlTransition).not.toContain("all")
    // O `top` de fora é a asserção 8.
  })

  it("8b. a seta é quadrada de cantos arredondados, sem fundo em repouso", () => {
    // As setas são quadradas (`tertiary` com o `rounded-lg` do `Button`) e redondas só nas
    // aparências que pedem: `glass` sobre foto e `solid` numa barra.
    const controle = fonte.slice(
      fonte.indexOf("function CarouselControl("),
      fonte.indexOf("function CarouselPrevious(")
    )
    for (const linha of controle
      .split("\n")
      .filter((l) => l.includes("rounded-full") && !/^\s*(\/\/|\*)/.test(l))) {
      expect(linha, "rounded-full fora das aparências redondas").toMatch(
        /appearance === "(glass|solid)"|menuPanelTintClassName/
      )
    }
    expect(controle).toMatch(/appearance = "tertiary"/)
    expect(fonte).toMatch(/variant = "tertiary"/)
    // Uma função que escolhe entre dois pesos, com um peso só, é constante e não volta como
    // declaração nem como export; citá-la num comentário continua passando.
    expect(fonte).not.toMatch(/function defaultControlVariant/)
    expect(fonte).not.toMatch(/^\s*defaultControlVariant,$/m)
  })

  it("8c. a dissolução é o padrão — é ela que sustenta a seta sem fundo", () => {
    expect(fonte).toMatch(/fade: fadeProp = true/)
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
    // O viewport é o elemento mascarado: `bg`, `ring` ou `radius` ali saem com os quatro cantos
    // apagados. A asserção olha as classes literais do nó, e a fatia é o `cn()` do viewport
    // (não os últimos N caracteres, número mágico que reprovou código correto).
    const antes = fonte.split('data-slot="carousel-content"')[0]!
    const bloco = antes.slice(antes.lastIndexOf("className={cn("))
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
    // O embla mede o contêiner, não o viewport: com a altura só no viewport o trilho crescia
    // até o conteúdo e as duas setas saíam desabilitadas.
    expect(fonte).toContain('orientation === "horizontal" ? "" : "h-full flex-col"')
  })

  it("12. o efeito desinscreve tudo o que inscreve", () => {
    const inscritos = [...fonte.matchAll(/api\.on\("(\w+)"/g)].map((m) => m[1])
    const desinscritos = [...fonte.matchAll(/api\.off\("(\w+)"/g)].map((m) => m[1])
    // `reInit` não pode ficar inscrito para sempre.
    expect(new Set(inscritos)).toStrictEqual(new Set(desinscritos))
  })

  it("13. os efeitos só leem a variável do driver, e nada transiciona", () => {
    const css = lerFonte("src/app/globals.css")
    for (const [efeito, classe] of Object.entries(carouselEffectClasses)) {
      if (efeito === "none") continue
      const bloco = esperarDepoisDeNoScrollbar(css, `@utility ${classe} {`, { mensagem: `${classe} não existe` })
      expect(bloco, classe).toMatch(/--carousel-slide-[ds]/)
      expect(bloco, `${classe} transiciona`).not.toMatch(/transition/)
      // Movimento reduzido zera o que se move. A exceção é o `fade`: o deslocamento dele é o
      // empilhamento, não movimento, e a troca já é só opacidade.
      if (efeito === "fade") {
        expect(bloco, "o fade não pode desfazer o empilhamento").not.toContain("translate: none")
        continue
      }
      expect(bloco, `${classe} sem movimento reduzido`).toContain("prefers-reduced-motion")
    }
    // O driver escreve as duas, e desinscreve o que inscreve (a 12 cobre).
    expect(fonte).toContain('"--carousel-slide-s"')
    expect(fonte).toContain('"--carousel-slide-d"')
  })

  it("14. o acordeão desativa o embla e o índice passa a ser do contexto", () => {
    expect(fonte).toMatch(/acordeao && \{ active: false \}/)
    // Sem `overflow-hidden` no item: o anel de foco de quem estiver dentro.
    expect(fonte).toContain("grow-(--carousel-weight)")
    expect(fonte).toContain("transition-[flex-grow] duration-(--duration-spring) ease-(--ease-spring)")
  })

  it("15. a sangria desliga a dissolução e devolve a calha da casca", () => {
    expect(fonte).toMatch(/const fade = fadeProp && !bleed && !acordeao/)
    expect(fonte).toContain('bleed && "-mx-4 md:-mx-6"')
    expect(fonte).toContain('bleed && "px-4 md:px-6"')
  })

  it("16. o autoplay pausa no cursor, no foco e com a aba escondida — e o relógio é o CSS", () => {
    const hook = lerFonte("src/hooks/use-carousel-autoplay.ts")
    expect(fonte).toContain('autoplay.pausar("cursor")')
    expect(fonte).toContain('autoplay.pausar("foco")')
    expect(hook).toContain('pausar("oculta")')
    // Movimento reduzido nasce pausado pelo usuário, e não desligado.
    expect(hook).toMatch(/prefers-reduced-motion: reduce[\s\S]{0,80}pausar\("usuario"\)/)
    // O relógio do CSS lê o intervalo publicado na raiz e pausa com ela.
    const css = lerFonte("src/app/globals.css")
    const bloco = blocoCss(css, "@utility carousel-timer {")
    expect(bloco).toContain("var(--carousel-autoplay-ms")
    expect(bloco).toMatch(/\[data-autoplay="paused"\] &[\s\S]*animation-play-state: paused/)
    expect(fonte).toContain('"--carousel-autoplay-ms"')
  })

  it("17. o cursor mexe no filho do item, e tem par de toque", () => {
    expect(carouselItemHover.lift).toMatch(/active:\*:-translate-y-1/)
    expect(carouselItemHover.zoom).toMatch(/active:\[&_img\]:scale-105/)
  })

  it("18. passos e miniaturas dizem qual é o atual, sem abas quebradas", () => {
    const codigo = semComentarios(fonte, "numa-passada")
    const passos = codigo.slice(
      codigo.indexOf("function CarouselSteps("),
      codigo.indexOf("function CarouselThumbs(")
    )
    const miniaturas = codigo.slice(codigo.indexOf("function CarouselThumbs("))
    expect(passos).toContain('aria-current={ativo ? "step" : undefined}')
    expect(passos).not.toMatch(/role="tab"/)
    expect(miniaturas).toContain('aria-current={ativa ? "true" : undefined}')
  })
})
