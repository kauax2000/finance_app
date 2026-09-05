"use client"

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "@heroicons/react/16/solid"
import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { cva, type VariantProps } from "class-variance-authority"

import { Button } from "@/components/ui/button"
import { Caption } from "@/components/ui/typography"
import {
  scrollFadeViewportClassName,
  scrollFadeViewportXClassName,
} from "@/lib/scroll-fade-classes"
import { cn } from "@/lib/utils"

/**
 * Itens que deslizam.
 *
 * ## As setas moravam fora da caixa
 *
 * O arquivo anterior era o shadcn intacto, e nele `CarouselPrevious` é
 * `absolute -left-12` — 48px **para fora** da própria região. O componente não
 * se dimensionava: ele exigia que o pai lhe cedesse sala, e todo pai que
 * recorta ou rola comia as setas.
 *
 * Medido na página do catálogo, num contêiner de 958px: a caixa de recorte ia
 * de 297 a 1255, a seta anterior de **289 a 317** e a seguinte de **1235 a
 * 1263** — 8px fora de cada lado. O `scrollWidth` do pai dava **966 contra 958
 * de `clientWidth`**, ou seja o carrossel dava ao contêiner uma barra de
 * rolagem horizontal fantasma; e `elementsFromPoint` a 90% da largura da seta
 * seguinte devolvia uma `div`, **não o botão** — um pedaço da seta não era
 * clicável.
 *
 * Hoje o padrão é `controls="inside"`: as setas pousam sobre as bordas do
 * viewport, dentro da caixa. `outside` continua existindo para quem tem a
 * calha de verdade, e é opt-in — a família do defeito que a rodada do
 * `Container` corrigiu ao tornar a calha opt-in pelo mesmo motivo.
 *
 * ## A documentação afirmava um comportamento que o código nunca teve
 *
 * A página dizia, com todas as letras, que *"as setas não existem no
 * telefone"*. Medido a 375px: `display: flex` nas duas, **28×28**, sobrepostas
 * ao conteúdo. Elas sempre existiram, e abaixo dos 44px que esta casa usa para
 * dedo. Hoje existem de propósito e **crescem por pseudo-elemento** —
 * `pointer-coarse:after:-inset-2.5` leva a caixa de 28 a um alvo de 46 sem
 * mexer na caixa — a saída do `PageHeaderBack`, do × da `AnnouncementBar` e
 * dos degraus do `Breadcrumb`. Aqui ela é segura porque as duas setas ficam em pontas
 * opostas; numa fileira de alvos adjacentes ela seria errada, e é por isso que
 * os pontos do `CarouselDots` crescem de verdade (ver a peça).
 *
 * ## A lib publicava treze mecanismos e o arquivo lia quatro
 *
 * `embla-carousel` 8.6 expõe `scrollProgress()`, `scrollSnapList()`,
 * `selectedScrollSnap()`, `scrollTo()`, `slidesInView()` e os eventos
 * `scroll`, `settle`, `slidesInView`, `slideFocus` e `slidesChanged`. O
 * arquivo lia `canScrollPrev/Next` e os eventos `select`/`reInit`, e mais
 * nada: um carrossel de quatro faturas sem nenhum sinal de quantas existem.
 * É o mesmo diagnóstico da rodada do `resizable`.
 *
 * `CarouselDots` e `CarouselStatus` são o que sai daí. O contexto passou a
 * publicar `selectedIndex`, `snapCount` e `scrollTo`.
 *
 * ## Dois papéis que não tinham nome
 *
 * `role="region"` sem `aria-label` — medido, `hasAccessibleName: false`. É a
 * medição que o `Popover` e o `resizable` já pagaram nesta base: um papel sem
 * nome é anunciado como o papel, e nada mais. O rótulo tem padrão em pt-BR
 * pela mesma razão que o `locale` do `Calendar` tem — um idioma que só vale
 * quando alguém lembra de passar não é o idioma do app.
 *
 * E cada item era `role="group" aria-roledescription="slide"` **sem rótulo**:
 * quatro grupos anônimos. A posição agora vem do **contêiner**, que é quem a
 * sabe — `CarouselContent` deriva índice e total, do mesmo jeito que a
 * `BreadcrumbList` assumiu os separadores e o `Stepper` passou a derivar o
 * `isLast`. Quem escreve a tela não conta itens à mão.
 *
 * ## Três defeitos menores, os três reais
 *
 * O teclado tratava **só `ArrowLeft`/`ArrowRight`**, inclusive com
 * `orientation="vertical"` — a seta do eixo certo não fazia nada. A limpeza do
 * efeito desinscrevia `select` e **não** `reInit`. E
 * `orientation || (opts?.axis === "y" ? …)` era inalcançável, porque
 * `orientation` tem padrão: código morto, a família que esta base já documenta.
 *
 * ## A dissolução reusa a rampa e traz motor próprio
 *
 * A borda em seco lê como lista terminada, e a casa já tem a primitiva. Mas
 * **`useScrollFade` não pode dirigi-la aqui**, e isso é medido: o embla
 * translada o **trilho**, então o viewport fica com `scrollLeft: 0` enquanto
 * `scrollWidth` é 1476 contra `clientWidth` 730. O hook lê `scrollLeft` e
 * reportaria início 0 e fim 746 para sempre — a ponta esquerda nunca acenderia.
 *
 * A rampa continua sendo a do sistema (`scroll-fade-x`, de `globals.css`); só
 * o motor é daqui, publicando `--scroll-fade-start/end` a partir de
 * `api.scrollProgress()`. As invariantes de `scroll-fade-classes` valem: a
 * máscara vai no **viewport**, que não desenha nada, e quem pinta é a raiz —
 * as setas são irmãs do viewport, então a máscara não as alcança.
 *
 * ## O `variant` de superfície entrou contra a contagem
 *
 * Nenhuma tela do app pede uma superfície para o carrossel — ele tem zero
 * consumidores, e a régua desta casa é que eixo sem contagem é ficção (o
 * precedente é a `Toolbar`, que não ganhou eixo nenhum e registrou isso como a
 * leitura honesta das contagens). O eixo existe por decisão explícita do dono,
 * tomada com esse custo na mesa, e fica registrado assim em vez de ser
 * apresentado como se a medida o tivesse pedido.
 *
 * `card` e `inset` **forçam `controls="inside"`**, com precedência explícita: a
 * raiz passa a pintar, e uma seta a `-left-12` flutuaria fora da superfície que
 * a contém. É a forma com que `scrollable` vence `stretch` no `Tabs`.
 *
 * Nenhuma das duas declara `overflow-hidden`. Ela não é necessária — o recuo da
 * raiz já mantém os itens dentro do raio, e o viewport recorta o trilho —, e
 * declará-la cortaria o anel de foco de 3px das setas contra a borda.
 *
 * ## A seta viajava, e ancorar em variável foi o que a fez viajar
 *
 * A primeira versão desta ancoragem resolveu a geometria e criou um defeito de
 * **movimento**, que medir posição não pega: `top` passou a sair de uma variável
 * escrita por JS, e a base do `Button` declara `transition-all`. Toda remedição
 * — fonte carregando, `snapCount` chegando e os pontos aparecendo, resize —
 * virava uma animação da seta atravessando o cartão.
 *
 * Somavam-se duas coisas. O `cva` declara `50%` como palpite pré-medição, e esse
 * `top: 50%` resolve contra a **raiz**, que inclui pontos e contagem: medido na
 * demonstração padrão, raiz 111px dá 55, contra os 37,5 do centro do trilho —
 * **17,5px** percorridos animadamente na primeira pintura.
 *
 * São dois consertos independentes, e é de propósito: o **layout effect** mata a
 * viagem da primeira pintura (o cliente nunca pinta o palpite), e
 * `CONTROL_TRANSITION` mata a das remedições posteriores, que efeito nenhum
 * alcança. Nenhum dos dois sozinho fecha o caso.
 *
 * ## A seta não tem fundo, e a dissolução é o que a sustenta
 *
 * `variant="tertiary"` nos dois modos: nada em repouso, fundo no cursor **e no
 * toque** — o par `active:` entrou na origem, em `button.tsx`, porque `hover:`
 * compila dentro de `@media (hover: hover)` e sem ele a seta não acenderia no
 * telefone. E `fade` passou a ser padrão pela mesma decisão: sem preenchimento o
 * glifo pousa direto sobre o conteúdo, e a rampa é o que abre chão para ele.
 */

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselOrientation = "horizontal" | "vertical"
type CarouselControls = "inside" | "outside" | "none"
type CarouselGap = "none" | "sm" | "md" | "lg"

/** O rótulo da região, quando quem chama não dá um. Ver o cabeçalho. */
const ROTULO_PADRAO = "Carrossel"

const DEFAULT_GAP: CarouselGap = "md"

/**
 * A superfície da raiz, e a calha das setas.
 *
 * Ela é quem pinta — o viewport carrega a máscara e por isso não desenha nada
 * (invariante 2 de `scroll-fade-classes`).
 *
 * **`outside` reserva a própria calha.** É aqui que o defeito desta rodada se
 * fecha de verdade: na versão antiga o modo "seta fora" punha o botão a
 * `-left-12` e ia buscar 48px no pai, que ninguém tinha prometido. Hoje a raiz
 * declara a calha e a seta pousa em `left-0`, então o componente **nunca**
 * desenha fora da própria caixa, em nenhum dos três modos. A medida da calha
 * está nos `compoundVariants`, com o motivo.
 *
 * `orientation` é eixo do `cva` pela mesma razão: a calha do modo vertical é
 * `py`, e o par só se resolve por `compoundVariants`.
 */
// As duas âncoras nascem em 50%, e isso é o **estado do HTML do servidor**, antes
// de existir caixa para medir. É uma aproximação da *raiz*, não do trilho: onde a
// raiz carrega pontos ou contagem, os dois diferem. Na hidratação o layout effect
// do `CarouselContent` corrige antes da primeira pintura do cliente.
const carouselVariants = cva("relative [--carousel-control-x:50%] [--carousel-control-y:50%]", {
  variants: {
    variant: {
      plain: "",
      card: "rounded-xl border border-border bg-card p-3",
      inset: "rounded-xl bg-muted p-3",
    },
    controls: { inside: "", outside: "", none: "" },
    orientation: { horizontal: "", vertical: "" },
  },
  compoundVariants: [
    // A calha é **a seta mais um respiro**, e não um número herdado.
    //
    // Ela era `px-12` (48), que veio do `-left-12` do shadcn e que eu preservei
    // por fidelidade à distância antiga. Medido, aquilo deixava **20px de fundo
    // puro** entre a borda de dentro da seta (28) e o começo do conteúdo (48) —
    // e como a dissolução mora na borda do viewport, ela nascia depois desse
    // vão. A seta lia como solta, e não como parte da tira que ela controla.
    //
    // 36 = 28 do botão + 8, que é `--space-inline`: a distância que esta casa
    // usa **dentro** de um bloco. A seta e o trilho são o mesmo bloco, então a
    // dissolução passa a encostar nela, como já acontece em `inside`.
    { controls: "outside", orientation: "horizontal", class: "px-9" },
    { controls: "outside", orientation: "vertical", class: "py-9" },
  ],
  defaultVariants: {
    variant: "plain",
    controls: "inside",
    orientation: "horizontal",
  },
})

/**
 * A calha entre itens, por degrau e por eixo.
 *
 * Escrita **literal**, e não montada a partir de um número: o Tailwind varre o
 * código como texto, e a armadilha já pegou a mesma pessoa que a escreveu na
 * rodada do `Tabs` — `pointer-coarse:${…}` estava no elemento e não existia na
 * folha.
 *
 * A calha é margem negativa no trilho mais recuo no item, e não `gap` no flex,
 * porque `gap` entraria na conta de `basis-*`: com `basis-1/2` e um `gap`, dois
 * itens deixam de caber em 100%.
 */
const GAP_CLASSES = {
  horizontal: {
    none: { track: "", item: "" },
    sm: { track: "-ml-2", item: "pl-2" },
    md: { track: "-ml-4", item: "pl-4" },
    lg: { track: "-ml-6", item: "pl-6" },
  },
  vertical: {
    none: { track: "", item: "" },
    sm: { track: "-mt-2", item: "pt-2" },
    md: { track: "-mt-4", item: "pt-4" },
    lg: { track: "-mt-6", item: "pt-6" },
  },
} as const satisfies Record<
  CarouselOrientation,
  Record<CarouselGap, { track: string; item: string }>
>

/**
 * Onde a seta pousa. Nos dois modos ela fica **dentro** da caixa da raiz: em
 * `inside`, sobre a borda do viewport; em `outside`, dentro da calha que o
 * `cva` acima reserva. Nenhuma coordenada é negativa — foi o defeito.
 *
 * ## Ela se centra no viewport, e não na raiz
 *
 * `top-1/2` parece a resposta e não é: a raiz **também contém os pontos e a
 * contagem**, então metade dela fica abaixo do meio do trilho. Medido, com um
 * `CarouselDots` no telefone: raiz 131, viewport 75, e a seta saindo **28px
 * abaixo do centro** — com a borda de baixo dela já **fora** do viewport.
 *
 * Por isso a âncora é `--carousel-control-y`, que o `CarouselContent` escreve
 * a partir da caixa medida do viewport. O padrão declarado no `cva` é `50%`,
 * então antes da medição o comportamento é o de `top-1/2` e não há salto — a
 * mesma ideia do gatilho do `Tabs`, que se pinta sozinho enquanto o marcador
 * não tem caixa para medir.
 */
const CONTROL_POSITION = {
  inside: {
    horizontal: {
      prev: "top-(--carousel-control-y) left-2 -translate-y-1/2",
      next: "top-(--carousel-control-y) right-2 -translate-y-1/2",
    },
    vertical: {
      prev: "left-(--carousel-control-x) top-2 -translate-x-1/2",
      next: "left-(--carousel-control-x) bottom-2 -translate-x-1/2",
    },
  },
  outside: {
    horizontal: {
      prev: "top-(--carousel-control-y) left-0 -translate-y-1/2",
      next: "top-(--carousel-control-y) right-0 -translate-y-1/2",
    },
    vertical: {
      prev: "left-(--carousel-control-x) top-0 -translate-x-1/2",
      next: "left-(--carousel-control-x) bottom-0 -translate-x-1/2",
    },
  },
} as const

/**
 * O alvo de dedo das setas, por pseudo-elemento, sem mexer na caixa. Seguro
 * aqui porque as duas ficam em pontas opostas — ver o cabeçalho.
 *
 * **A conta não é `28 + 2×inset`, e isso foi medido.** O bloco que contém um
 * absoluto é a **caixa de padding** do ancestral posicionado, não a de borda:
 * o `Button` tem 1px de borda, então a base são **26**, e não 28. Com
 * `-inset-2` o alvo sai **42×42** — medido, `getComputedStyle(seta,"::after")`
 * devolve `42px`.
 *
 * Por isso o degrau é `2.5`: 26 + 2×10 = **46**, e 44 é piso, não teto. Os 2px
 * a mais não custam nada num controle sem vizinho.
 *
 * As três ocorrências que esta casa já tinha carregam o mesmo desconto e
 * afirmam 44 nos comentários: `PageHeaderBack` (36 → 42), o × da
 * `AnnouncementBar` (24 → 42) e os degraus do `Breadcrumb` (20 → 42). Fica no
 * backlog com o número; consertá-las é rodada delas.
 */
const CONTROL_TOUCH_TARGET =
  "pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5 pointer-coarse:after:content-['']"

/**
 * A lista é escrita à mão porque a distinção é o ponto: **`translate` transiciona,
 * `top` não.**
 *
 * `top` é ancorado numa variável que o JS mede, e a base do `Button` declara
 * `transition-all`: com ela, toda remedição virava uma **animação** da seta
 * atravessando o cartão. Medido — trocando a variável, a seta ainda estava na
 * origem um quadro depois e só assentava 300ms adiante.
 *
 * Mas trocar por `transition-colors` matava junto o **press**, que é feedback
 * legítimo e que esta seta deve ter como qualquer botão. Os dois convivem porque
 * são propriedades diferentes: a âncora medida mexe em `top` e salta; o press
 * mexe em `translate` e desliza.
 *
 * Enumerar é obrigatório — `transition-all` traria `top` de volta, e
 * `transition-colors` não alcança `translate`. É o mesmo idioma de
 * `transition-[rotate,translate,color]` em `disclosure-classes` e de
 * `transition-[translate,width,height]` no marcador do `Tabs`. E, sendo o mesmo
 * grupo no `twMerge`, esta classe **substitui** a da base em vez de disputar com
 * ela.
 */
const CONTROL_TRANSITION =
  "transition-[color,background-color,border-color,translate]"

/**
 * O afundamento de press **compõe** com a centragem, em vez de substituí-la.
 *
 * A seta tem o mesmo feedback de clique que qualquer botão da casa — 1px para
 * baixo, com a mesma curva. O que ela não pode é herdá-lo cru, e a razão é uma
 * colisão de propriedade, não de gosto.
 *
 * No Tailwind v4 `translate` é propriedade independente, e `-translate-y-1/2` e
 * `active:translate-y-px` escrevem a **mesma** custom property. Verificado no CSS
 * emitido:
 *
 * ```
 * .-translate-y-1\/2        { --tw-translate-y: calc(calc(1 / 2 * 100%) * -1) }
 * .active\:translate-y-px   { &:active { --tw-translate-y: 1px } }
 * ```
 *
 * `.classe:active` é (0,2,0) contra os (0,1,0) da centragem, então ao apertar a
 * seta ia de **−14px para +1px — 15px para baixo**, perdendo a centragem inteira.
 *
 * A saída é somar as duas na **mesma declaração** — `calc(-50% + 1px)` —, e
 * entregá-la pelo **`twMerge` e não por especificidade**: mesma família de
 * utilitário sob o mesmo variante, então esta classe **remove**
 * `active:translate-y-px` da lista em vez de disputar com ela por ordem de
 * emissão, que é o que esta base já registra como decidido "pela ordem do
 * Tailwind e não pelo que se escreveu".
 *
 * O afundamento continua existindo, com a mesma medida do `Button`; o que ele
 * deixou de fazer é apagar a centragem no caminho.
 */
const CONTROL_PRESS_FIX = {
  // A centragem e o afundamento somados na mesma declaração. O `-50%` é a
  // centragem, o `1px` é o mesmo degrau que o `Button` usa — o que muda é que
  // aqui eles **compõem** em vez de um apagar o outro.
  horizontal: "active:translate-y-[calc(-50%_+_1px)]",
  // Na vertical a centragem é em X, então o `active:translate-y-px` da base não
  // colide com nada e já é exatamente o afundamento certo.
  vertical: "",
} as const

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: CarouselOrientation
  setApi?: (api: CarouselApi) => void
  /** Onde as setas pousam. `card` e `inset` forçam `inside`. */
  controls?: CarouselControls
  /** A calha entre itens. */
  gap?: CarouselGap
  /**
   * Dissolve as duas pontas do viewport conforme o trilho anda. **Padrão.**
   *
   * Ela é o que torna a seta sem fundo legível: sem preenchimento o glifo pousa
   * direto sobre o conteúdo, e a rampa é o que abre chão para ele nas duas
   * pontas. Continua sendo prop para quem precisar desligar, e não custa nada
   * quando não há transbordo — o motor só liga `data-scroll-fade` nesse caso.
   */
  fade?: boolean
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  scrollTo: (index: number) => void
  canScrollPrev: boolean
  canScrollNext: boolean
  selectedIndex: number
  snapCount: number
  orientation: CarouselOrientation
  controls: CarouselControls
  gap: CarouselGap
  fade: boolean
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

/**
 * Medição de caixa acontece **antes da pintura**, senão o cliente chega a pintar
 * o palpite do `cva` e a seta salta dele para o valor medido. O `Tabs` tem o
 * mesmo, local, pelo mesmo motivo.
 */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

/** Junta o ref do embla ao ref de medição. O `Tabs` tem o mesmo, local. */
function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.RefObject<T | null>).current = node
    }
  }
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  variant = "plain",
  controls: controlsProp,
  gap = DEFAULT_GAP,
  fade = true,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> &
  CarouselProps &
  // Só o eixo de superfície vem do `cva`. `controls` e `orientation` são props
  // de verdade, com padrão e com precedência própria — herdá-los de
  // `VariantProps` os deixaria anuláveis e duplicaria o padrão em dois lugares.
  Pick<VariantProps<typeof carouselVariants>, "variant">) {
  // Uma superfície pintada não tem controle flutuando fora dela. Precedência
  // explícita, como `scrollable` vencendo `stretch` no `Tabs`.
  const controls: CarouselControls =
    variant === "plain" ? (controlsProp ?? "inside") : "inside"

  const [carouselRef, api] = useEmblaCarousel(
    { ...opts, axis: orientation === "horizontal" ? "x" : "y" },
    plugins
  )
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [snapCount, setSnapCount] = React.useState(0)

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
    setSelectedIndex(api.selectedScrollSnap())
    setSnapCount(api.scrollSnapList().length)
  }, [])

  const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api])
  const scrollNext = React.useCallback(() => api?.scrollNext(), [api])
  const scrollTo = React.useCallback(
    (index: number) => api?.scrollTo(index),
    [api]
  )

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // A seta segue o eixo. Antes eram sempre as horizontais, inclusive num
      // carrossel vertical, onde a tecla certa não fazia nada.
      const anterior = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp"
      const seguinte = orientation === "horizontal" ? "ArrowRight" : "ArrowDown"

      if (event.key === anterior) {
        event.preventDefault()
        scrollPrev()
      } else if (event.key === seguinte) {
        event.preventDefault()
        scrollNext()
      } else if (event.key === "Home") {
        event.preventDefault()
        scrollTo(0)
      } else if (event.key === "End") {
        event.preventDefault()
        scrollTo(Math.max(0, snapCount - 1))
      }
    },
    [orientation, scrollPrev, scrollNext, scrollTo, snapCount]
  )

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on("reInit", onSelect)
    api.on("select", onSelect)
    api.on("slidesChanged", onSelect)

    return () => {
      // `reInit` e `slidesChanged` ficavam inscritos para sempre: a limpeza
      // antiga desinscrevia só o `select`.
      api.off("reInit", onSelect)
      api.off("select", onSelect)
      api.off("slidesChanged", onSelect)
    }
  }, [api, onSelect])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        scrollPrev,
        scrollNext,
        scrollTo,
        canScrollPrev,
        canScrollNext,
        selectedIndex,
        snapCount,
        orientation,
        controls,
        gap,
        fade,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn(
          carouselVariants({ variant, controls, orientation }),
          className
        )}
        role="region"
        aria-roledescription="carousel"
        aria-label={ROTULO_PADRAO}
        data-slot="carousel"
        data-variant={variant}
        data-controls={controls}
        data-gap={gap}
        data-orientation={orientation}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

/**
 * O viewport e o trilho.
 *
 * `className` vai no **trilho**, que é onde `basis-*` e a calha operam;
 * `viewportClassName` vai na caixa que recorta. Os dois existem porque o
 * `data-slot` fica no viewport e quem escrevia `className` não dimensionava o
 * que via — o mesmo defeito que o `SearchInput` pagou e resolveu com
 * `inputClassName`.
 */
function CarouselContent({
  className,
  viewportClassName,
  children,
  ...props
}: React.ComponentProps<"div"> & { viewportClassName?: string }) {
  const { carouselRef, orientation, gap, fade, api } = useCarousel()
  const viewportRef = React.useRef<HTMLDivElement | null>(null)

  // A âncora das setas é o **centro do viewport**, e não o da raiz — que também
  // carrega os pontos e a contagem. Ver a nota em `CONTROL_POSITION`: sem isto,
  // medido, a seta saía 28px abaixo e com a borda fora do trilho.
  //
  // Um `ResizeObserver` e não uma leitura no render: a altura só existe depois
  // do layout. É o mecanismo de `useScrollFade` e do marcador do `Tabs`.
  //
  // E **layout effect**, não `useEffect`: com o efeito depois da pintura, o
  // cliente chegava a pintar o palpite de `50%` do `cva` — que resolve contra a
  // **raiz**, e não contra o trilho — e a seta viajava dali até o valor medido.
  // Medido na demonstração padrão: raiz 111px, logo 50% = 55, contra os 37,5 do
  // centro do trilho. Dezessete pixels e meio de viagem, animados pelo
  // `transition-all` da base do `Button`. Os dois consertos são independentes:
  // este mata a viagem da primeira pintura, e `CONTROL_TRANSITION` mata a das
  // remedições posteriores, que efeito nenhum alcança.
  useIsomorphicLayoutEffect(() => {
    const node = viewportRef.current
    const raiz = node?.closest<HTMLElement>("[data-slot=carousel]")
    if (!node || !raiz) return

    // `offsetTop`/`offsetLeft` e não `getBoundingClientRect`: o bloco que
    // contém um absoluto é a **caixa de padding** da raiz, que desconta a
    // borda mas **não** o recuo — e `offsetTop` é medido a partir dessa mesma
    // caixa. Só a metade da altura não basta: em `card` e `inset` o `p-3`
    // empurra o viewport 12px para baixo enquanto o `top` continua contando do
    // topo, e a seta saía **11px acima** do centro (medido, nas duas). É a
    // mesma escolha que o marcador do `Tabs` registra pelo mesmo motivo.
    const medir = () => {
      raiz.style.setProperty(
        "--carousel-control-y",
        `${Math.round(node.offsetTop + node.clientHeight / 2)}px`
      )
      raiz.style.setProperty(
        "--carousel-control-x",
        `${Math.round(node.offsetLeft + node.clientWidth / 2)}px`
      )
    }

    medir()
    const observer = new ResizeObserver(medir)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // A rampa é a do sistema; o motor é daqui, porque o embla translada o trilho
  // e o `scrollLeft` do viewport nunca sai de zero. Ver o cabeçalho.
  React.useEffect(() => {
    const node = viewportRef.current
    if (!api || !fade || !node) return

    const escrever = () => {
      const trilho = api.containerNode()
      const total =
        orientation === "horizontal"
          ? trilho.scrollWidth - node.clientWidth
          : trilho.scrollHeight - node.clientHeight
      if (total <= 0) {
        delete node.dataset.scrollFade
        return
      }
      const progresso = Math.min(1, Math.max(0, api.scrollProgress()))
      node.style.setProperty(
        "--scroll-fade-start",
        `${Math.round(progresso * total)}px`
      )
      node.style.setProperty(
        "--scroll-fade-end",
        `${Math.round((1 - progresso) * total)}px`
      )
      node.dataset.scrollFade = "on"
    }

    escrever()
    api.on("scroll", escrever)
    api.on("reInit", escrever)
    api.on("resize", escrever)

    return () => {
      api.off("scroll", escrever)
      api.off("reInit", escrever)
      api.off("resize", escrever)
    }
  }, [api, fade, orientation])

  // A posição do item é derivada por quem a conhece — o contêiner —, e não
  // escrita à mão em cada item. É o que a `BreadcrumbList` fez ao assumir os
  // separadores e o `Stepper` ao derivar o `isLast`.
  const itens = React.Children.toArray(children).filter(React.isValidElement)
  const total = itens.length

  return (
    <div
      ref={composeRefs(carouselRef, viewportRef)}
      // Sem `bg`, sem `ring`, sem `radius`: quem carrega a máscara não desenha
      // nada — invariante 2 de `scroll-fade-classes`.
      className={cn(
        "overflow-hidden",
        // A rampa segue o eixo. Cravar a horizontal aqui foi um defeito real:
        // um carrossel vertical saía dissolvendo as bordas **laterais**,
        // enquanto o conteúdo entrava e saía por cima e por baixo. As duas
        // utilities leem as mesmas `--scroll-fade-start/end` que o motor
        // publica — muda só o eixo do gradiente e o teto do clamp (44px na
        // vertical, 32 na horizontal), então o driver não precisou mudar.
        //
        // E é uma **ou** a outra, nunca as duas: a invariante 3 de
        // `scroll-fade-classes` é um gradiente por elemento.
        fade &&
          (orientation === "horizontal"
            ? scrollFadeViewportXClassName
            : scrollFadeViewportClassName),
        viewportClassName
      )}
      data-slot="carousel-content"
    >
      <div
        className={cn(
          "flex",
          // `h-full` na vertical é **carga estrutural**, e foi medido.
          //
          // O embla mede o **contêiner** (este trilho) para achar o
          // comprimento do eixo, e não o viewport. Com a altura só no viewport
          // o trilho cresce até o conteúdo — medido, viewport 160 e trilho 362
          // —, o embla conclui que tudo cabe e **desabilita as duas setas**,
          // com o conteúdo transbordando calado. Com `h-full` o trilho passa a
          // medir o viewport, e aí `basis-1/2` também volta a significar
          // metade do que se vê.
          //
          // É por isso que a altura de um carrossel vertical vai em
          // `viewportClassName`, e não aqui.
          orientation === "horizontal" ? "" : "h-full flex-col",
          GAP_CLASSES[orientation][gap].track,
          className
        )}
        {...props}
      >
        {itens.map((child, i) =>
          React.isValidElement<{ "aria-label"?: string }>(child)
            ? React.cloneElement(child, {
                "aria-label": child.props["aria-label"] ?? `${i + 1} de ${total}`,
              })
            : child
        )}
      </div>
    </div>
  )
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation, gap } = useCarousel()

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        GAP_CLASSES[orientation][gap].item,
        className
      )}
      {...props}
    />
  )
}

function CarouselControl({
  direction,
  className,
  // `tertiary` nos dois modos: nada em repouso, fundo só no cursor e no toque.
  //
  // É convergência, e não exceção. Das três famílias de seta da casa, o
  // `Calendar` e a `Pagination` já são `tertiary` + `rounded-lg`; esta era **a
  // única seta `rounded-full` do repositório e a única com fundo em repouso**.
  //
  // Não há mais `defaultControlVariant`: com um peso só, uma função que escolhe
  // entre dois pesos é uma constante disfarçada. `controls` decide só a posição.
  variant = "tertiary",
  size = "icon-sm",
  ...props
}: React.ComponentProps<typeof Button> & { direction: "prev" | "next" }) {
  const {
    orientation,
    controls,
    scrollPrev,
    scrollNext,
    canScrollPrev,
    canScrollNext,
  } = useCarousel()

  if (controls === "none") return null

  const anterior = direction === "prev"
  const Icone = anterior
    ? orientation === "horizontal"
      ? ChevronLeftIcon
      : ChevronUpIcon
    : orientation === "horizontal"
      ? ChevronRightIcon
      : ChevronDownIcon

  return (
    <Button
      data-slot={anterior ? "carousel-previous" : "carousel-next"}
      variant={variant}
      size={size}
      className={cn(
        // Sem `rounded-full`: o raio é o do `Button` (`rounded-lg`, 10px), que é
        // o que `Calendar` e `Pagination` já entregam nas setas delas.
        "absolute",
        CONTROL_TRANSITION,
        CONTROL_POSITION[controls][orientation][direction],
        CONTROL_PRESS_FIX[orientation],
        CONTROL_TOUCH_TARGET,
        // Em `inside` a seta pousa **sobre** o conteúdo, e desabilitada ela não
        // faz nada: no início do trilho a seta anterior ficava por cima do
        // primeiro item, que é o único que está inteiro na tela — medido, o
        // botão cobria o "R$" de um valor. Um controle morto tapando conteúdo
        // vivo é pior que um controle ausente.
        //
        // `invisible` e não `hidden`: ela é absoluta, então não há refluxo a
        // evitar, mas manter a caixa deixa a medição do alvo estável. Em
        // `outside` ela continua visível — lá existe calha reservada, e um
        // botão sumindo faria a moldura piscar a cada ponta.
        controls === "inside" && "disabled:invisible",
        className
      )}
      disabled={anterior ? !canScrollPrev : !canScrollNext}
      onClick={anterior ? scrollPrev : scrollNext}
      {...props}
    >
      <Icone />
      <span className="sr-only">{anterior ? "Item anterior" : "Próximo item"}</span>
    </Button>
  )
}

function CarouselPrevious(
  props: Omit<React.ComponentProps<typeof CarouselControl>, "direction">
) {
  return <CarouselControl direction="prev" {...props} />
}

function CarouselNext(
  props: Omit<React.ComponentProps<typeof CarouselControl>, "direction">
) {
  return <CarouselControl direction="next" {...props} />
}

/**
 * O indicador de posição.
 *
 * O alvo **cresce de verdade**, e não por pseudo-elemento: o `pagination.tsx`
 * já recusou o `-inset` pelo motivo que vale aqui — alvos pequenos e
 * adjacentes se sobrepõem, e um `::after` de 44px em cada ponto engoliria o
 * vizinho. O botão *é* a área de toque, e o ponto é o filho que ele centraliza.
 *
 * O ativo é `bg-primary-accent`: marca sobre o fundo, que é a régua da casa
 * para o traço que precisa ser enxergado contra a página — `--primary` é o que
 * preenche e carrega texto por cima.
 */
function CarouselDots({
  className,
  variant = "dot",
  ...props
}: React.ComponentProps<"div"> & { variant?: "dot" | "bar" }) {
  const { snapCount, selectedIndex, scrollTo } = useCarousel()

  // Um item só não tem posição para indicar.
  if (snapCount <= 1) return null

  const barra = variant === "bar"

  return (
    <div
      role="group"
      aria-label="Escolher item"
      data-slot="carousel-dots"
      data-variant={variant}
      className={cn(
        "flex items-center justify-center",
        barra && "w-full gap-1",
        className
      )}
      {...props}
    >
      {Array.from({ length: snapCount }, (_, i) => {
        const ativo = i === selectedIndex
        return (
          <button
            key={i}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`Ir para o item ${i + 1}`}
            aria-current={ativo ? "true" : undefined}
            data-slot="carousel-dot"
            data-active={ativo || undefined}
            className={cn(
              "group/dot flex shrink-0 cursor-pointer items-center justify-center",
              "rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              barra
                ? "min-w-0 flex-1 py-2 pointer-coarse:py-5"
                : "size-6 pointer-coarse:h-11"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "rounded-full transition-[background-color,width] duration-(--duration-base) ease-out",
                barra ? "h-1 w-full" : "size-2",
                // O ponto apagado também é um controle, e a 1.4.11 pede 3:1.
                // Varridos os degraus contra o fundo real nos dois temas, **45%
                // é o primeiro que passa nos dois** — 3,15 no claro e 4,36 no
                // escuro, contra 1,78 e 2,22 dos 25% que estavam aqui. O ativo
                // é `--primary-accent`: 7,66 e 6,14.
                //
                // Os degraus são literais, e não montados: varrer com
                // `bg-foreground/${p}` na sonda devolveu razão 1 em todos, e a
                // razão é a de sempre — o Tailwind varre o código como texto, e
                // nenhuma daquelas classes existia na folha.
                ativo
                  ? "bg-primary-accent"
                  : "bg-foreground/45 group-hover/dot:bg-foreground/70 group-active/dot:bg-foreground/70"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

/**
 * "3 de 12" — e **é** a região viva que a APG pede para o carrossel.
 *
 * `role="status"` sozinho: o papel já implica `aria-live="polite"`, e declarar
 * os dois é a contradição que o `FormError` registra.
 */
function CarouselStatus({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Caption>) {
  const { selectedIndex, snapCount } = useCarousel()

  return (
    <Caption
      role="status"
      data-slot="carousel-status"
      className={cn("nums", className)}
      {...props}
    >
      {children ?? `${Math.min(selectedIndex + 1, snapCount)} de ${snapCount}`}
    </Caption>
  )
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
  CarouselStatus,
  carouselVariants,
  useCarousel,
  GAP_CLASSES as carouselGapClasses,
  CONTROL_POSITION as carouselControlPosition,
  CONTROL_TOUCH_TARGET as carouselControlTouchTarget,
  CONTROL_TRANSITION as carouselControlTransition,
  CONTROL_PRESS_FIX as carouselControlPressFix,
  DEFAULT_GAP as carouselDefaultGap,
}
