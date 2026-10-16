"use client"

import {
  ArrowRightIcon,
  ArrowsPointingOutIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  PauseIcon,
  PlayIcon,
} from "@heroicons/react/16/solid"
import { Slot } from "radix-ui"
import { composeRefs } from "radix-ui/internal"
import * as React from "react"
import { useCarouselAutoplay } from "@/hooks/use-carousel-autoplay"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { cva, type VariantProps } from "class-variance-authority"

import { Button } from "@/components/ui/button"
import { Card, CardSkeleton } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SkeletonGroup } from "@/components/ui/skeleton"
import { Caption } from "@/components/ui/typography"
import {
  scrollFadeViewportClassName,
  scrollFadeViewportXClassName,
} from "@/lib/scroll-fade-classes"
import { disclosureRevealClassName } from "@/lib/disclosure-classes"
import { menuPanelTintClassName } from "@/lib/glass-classes"
import { ehCursor } from "@/lib/pointer"
import { cn } from "@/lib/utils"

/**
 * Itens que deslizam. Uma biblioteca e um motor só: cada versão é prop ou peça
 * do mesmo `Carousel`, nunca um componente paralelo.
 *
 * - `controls="inside"` (padrão): as setas pousam dentro da caixa, sobre as
 *   bordas do viewport; `outside` reserva a própria calha (o `-left-12` do
 *   shadcn fazia o componente exigir sala do pai, que recortava ou rolava as
 *   setas). `card` e `inset` forçam `inside`: a raiz passa a pintar e uma seta
 *   fora flutuaria fora da superfície.
 * - As setas crescem por pseudo-elemento no toque (`pointer-coarse:after:-inset-2.5`),
 *   seguro porque ficam em pontas opostas; os pontos de `CarouselDots`
 *   crescem de verdade, por serem alvos adjacentes.
 * - A região tem `aria-label` padrão em pt-BR, e cada item é um grupo rotulado
 *   com posição e total derivados pelo `CarouselContent`. O contexto publica
 *   `selectedIndex`, `snapCount` e `scrollTo` (`CarouselDots`, `CarouselStatus`).
 * - A dissolução reusa a rampa `scroll-fade-x`, mas `useScrollFade` não pode
 *   dirigi-la: o embla translada o trilho e o viewport fica com `scrollLeft: 0`.
 *   O motor daqui publica `--scroll-fade-start/end` a partir de
 *   `api.scrollProgress()`, e a máscara vai no viewport. A zona é 6rem (o
 *   triplo da do sistema, calibrada para glifo): o item é um `Card` com borda,
 *   e um fio de 1px resiste (alfa de 31% a 2rem, 9,5% a 6rem). A variável herda
 *   para a rampa sem afetar os outros consumidores.
 * - O `variant` de superfície (`card`, `inset`) existe por decisão do dono, sem
 *   contagem de uso; não declaram `overflow-hidden`, que cortaria o anel de
 *   foco das setas.
 * - A seta ancora em `--carousel-control-y`, escrito a partir da caixa medida do
 *   viewport. Como a base do `Button` declara `transition-all`, toda remedição
 *   virava uma viagem da seta: o layout effect do `CarouselContent` mata a da
 *   primeira pintura e `CONTROL_TRANSITION` a das posteriores.
 * - `effect` (`scale`, `spotlight`, `parallax`, `curve`, `fade`) lê só variáveis
 *   que um driver escreve em cada slide; `loop`, `autoplay` (com
 *   `CarouselPlayPause`), `bleed`, `layout="accordion"`, `until`, `snap="free"`,
 *   `selectOnClick` e `wheel` (ligados) e as peças satélite moram neste arquivo.
 * - A seta é `tertiary` (fundo no cursor e no toque, pelo par `active:`), e
 *   `fade` é padrão porque sem preenchimento o glifo pousa direto sobre o
 *   conteúdo e a rampa abre chão para ele.
 * - `until`: o embla desliga por breakpoint (`active: false`), o trilho vira
 *   grade e setas, pontos, contagem e barra somem. `selectOnClick`: o item
 *   cortado, clicado, vem para a vista antes de agir (o clique é engolido em
 *   captura). `wheel`: o gesto horizontal passa um item por gesto, e o passo trava
 *   até 160ms de silêncio por causa da inércia do trackpad; o ouvinte é nativo
 *   com `passive: false` (o do React é passivo, e o Chrome do Mac leria o
 *   gesto como "voltar"). `effect="fade"` força `gap="none"` e tira a rampa.
 */

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselOrientation = "horizontal" | "vertical"
type CarouselControls = "inside" | "outside" | "none"
type CarouselGap = "none" | "sm" | "md" | "lg"
type CarouselEffect = "none" | "scale" | "spotlight" | "parallax" | "curve" | "fade"
type CarouselUntil = "md" | "lg"
type CarouselLayout = "slide" | "accordion"

/**
 * Os efeitos, escritos por extenso: o Tailwind varre o código como texto, e
 * `carousel-effect-${effect}` nunca chegaria à folha.
 */
const EFFECT_CLASSES = {
  none: "",
  scale: "carousel-effect-scale",
  spotlight: "carousel-effect-spotlight",
  parallax: "carousel-effect-parallax",
  curve: "carousel-effect-curve",
  fade: "carousel-effect-fade",
} as const satisfies Record<CarouselEffect, string>

/** As consultas de `until`, que o embla e o ouvinte da roda leem. */
const UNTIL_QUERY = {
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
} as const satisfies Record<CarouselUntil, string>

/**
 * A tira que vira grade. Literal por degrau e por calha — o Tailwind varre o
 * código como texto. A grade preenche colunas de 16rem (ou a largura toda,
 * se a coluna for menor), e a calha é a do `gap`: a margem negativa do
 * trilho e o recuo do item saem, e o `gap` da grade entra.
 */
const UNTIL_TRACK = {
  md: {
    none: "md:grid md:grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] md:ml-0 md:gap-0",
    sm: "md:grid md:grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] md:ml-0 md:gap-2",
    md: "md:grid md:grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] md:ml-0 md:gap-4",
    lg: "md:grid md:grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] md:ml-0 md:gap-6",
  },
  lg: {
    none: "lg:grid lg:grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] lg:ml-0 lg:gap-0",
    sm: "lg:grid lg:grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] lg:ml-0 lg:gap-2",
    md: "lg:grid lg:grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] lg:ml-0 lg:gap-4",
    lg: "lg:grid lg:grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] lg:ml-0 lg:gap-6",
  },
} as const

const UNTIL_ITEM = { md: "md:pl-0", lg: "lg:pl-0" } as const

/**
 * O que some quando a tira vira grade: setas, pontos, contagem, barra, play.
 * As duas linhas sempre, porque só a do degrau da raiz casa.
 */
const ESCONDE_NA_GRADE =
  "group-data-[until=md]/carousel:md:hidden group-data-[until=lg]/carousel:lg:hidden"

/** A grade está valendo agora? Fora do navegador, nunca. */
function naGrade(until: CarouselUntil | undefined) {
  return (
    until !== undefined &&
    typeof window !== "undefined" &&
    window.matchMedia(UNTIL_QUERY[until]).matches
  )
}

/** O rótulo da região, quando quem chama não dá um. Ver o cabeçalho. */
const ROTULO_PADRAO = "Carrossel"

const DEFAULT_GAP: CarouselGap = "md"

/**
 * A superfície da raiz e a calha das setas. A raiz é quem pinta (o viewport
 * carrega a máscara e não desenha nada). `outside` reserva a própria calha, e a
 * seta pousa em `left-0`: o componente nunca desenha fora da própria caixa.
 * `orientation` é eixo do `cva` porque a calha do vertical é `py`.
 */
// As duas âncoras nascem em 50% (o estado do HTML do servidor, uma aproximação
// da raiz e não do trilho); o layout effect do `CarouselContent` corrige antes
// da primeira pintura do cliente.
const carouselVariants = cva("group/carousel relative [--carousel-control-x:50%] [--carousel-control-y:50%]", {
  variants: {
    variant: {
      plain: "",
      card: "rounded-surface border border-border bg-card bg-clip-padding p-3",
      inset: "rounded-surface bg-muted p-3",
    },
    controls: { inside: "", outside: "", none: "" },
    orientation: { horizontal: "", vertical: "" },
  },
  compoundVariants: [
    // A calha é a seta mais um respiro: 36 = 28 do botão + 8 (`--space-inline`).
    // Com `px-12` ficavam 20px de fundo puro entre a seta e o conteúdo, e a
    // seta lia como solta da tira que ela controla.
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
 * A calha entre itens, por degrau e por eixo, escrita literal (o Tailwind varre
 * o código como texto). É margem negativa no trilho mais recuo no item, e não
 * `gap`, que entraria na conta de `basis-*`.
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
 * Onde a seta pousa: sempre dentro da caixa da raiz, em nenhuma coordenada
 * negativa. Ela se centra no viewport e não na raiz (`top-1/2` ignora os pontos
 * e a contagem que a raiz também contém), por isso a âncora é
 * `--carousel-control-y`, escrita a partir da caixa medida; o padrão `50%`
 * evita salto antes da medição.
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
 * O alvo de dedo das setas, por pseudo-elemento. O bloco que contém um absoluto
 * é a caixa de padding, e o `Button` tem 1px de borda, então a base são 26 e não
 * 28: com `-inset-2.5` o alvo sai 26 + 2×10 = 46 (44 é piso).
 */
const CONTROL_TOUCH_TARGET =
  "pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5 pointer-coarse:after:content-['']"

/**
 * A lista de `transition` é escrita à mão: `translate` transiciona e `top` não.
 * `top` sai de uma variável medida por JS e a base do `Button` declara
 * `transition-all`, o que animava cada remedição; `transition-colors` mataria o
 * press. Enumerar é obrigatório, e como é o mesmo grupo no `twMerge` esta
 * classe substitui a da base.
 */
const CONTROL_TRANSITION =
  "transition-[color,background-color,border-color,translate]"

/**
 * O afundamento de press compõe com a centragem em vez de substituí-la:
 * `-translate-y-1/2` e `active:translate-y-px` escrevem a mesma custom property
 * (`--tw-translate-y`), e `.classe:active` (0,2,0) vence a centragem — ao apertar
 * a seta cairia 15px. A saída é somar as duas na mesma declaração
 * (`calc(-50% + 1px)`) e entregá-la pelo `twMerge`, que remove o
 * `active:translate-y-px` da base.
 */
const CONTROL_PRESS_FIX = {
  // A centragem (`-50%`) e o afundamento (`1px`, o degrau do `Button`) somados na mesma declaração.
  horizontal: "active:translate-y-[calc(-50%_+_1px)]",
  // Na vertical a centragem é em X, então o `active:translate-y-px` da base não colide.
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
  /** Dissolve as duas pontas do viewport conforme o trilho anda. Padrão: é o que abre chão para a seta sem fundo; o motor só liga `data-scroll-fade` quando há transbordo. */
  fade?: boolean
  /** Volta ao começo depois do último. `spotlight` liga por padrão. */
  loop?: boolean
  /** O movimento dos itens conforme se afastam do centro; `spotlight` também centraliza e liga o `loop`. */
  effect?: CarouselEffect
  /** Rotação automática, em ms. Só em conteúdo editorial, nunca sobre dado da pessoa; pausa sob o cursor, com foco dentro, com a aba escondida e pelo `CarouselPlayPause`; com movimento reduzido nasce pausada. */
  autoplay?: number
  /** De borda a borda: sem dissolução, e a raiz sangra a calha da casca (`-mx-4 md:-mx-6`), com o primeiro item alinhado ao conteúdo. */
  bleed?: boolean
  /** `accordion`: itens colapsados lado a lado, o selecionado abre; o embla fica inativo e o índice é do contexto. */
  layout?: CarouselLayout
  /** Carrossel só abaixo do degrau; a partir dele, grade sem setas nem pontos. */
  until?: CarouselUntil
  /** `free`: arraste livre, com inércia, parando onde o dedo soltar. */
  snap?: "item" | "free"
  /** O item cortado, clicado, vem para a vista antes de agir. Ligado. */
  selectOnClick?: boolean
  /** O gesto horizontal do trackpad passa um item por gesto. Ligado. */
  wheel?: boolean
}

type CarouselAutoplay = ReturnType<typeof useCarouselAutoplay>

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
  effect: CarouselEffect
  layout: CarouselLayout
  bleed: boolean
  autoplay: CarouselAutoplay
  until: CarouselUntil | undefined
  selectOnClick: boolean
  /** O acordeão conta os itens pelo contêiner, que é quem os vê. */
  registrarTotal: (total: number) => void
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  variant = "plain",
  controls: controlsProp,
  gap: gapProp = DEFAULT_GAP,
  fade: fadeProp = true,
  loop,
  effect = "none",
  autoplay: intervalo = 0,
  bleed = false,
  layout = "slide",
  until,
  snap = "item",
  selectOnClick = true,
  wheel = true,
  className,
  style,
  children,
  ref,
  onPointerEnter,
  onPointerLeave,
  onFocusCapture,
  onBlurCapture,
  ...props
}: React.ComponentProps<"div"> &
  CarouselProps &
  // Só o eixo de superfície vem do `cva`: `controls` e `orientation` são props
  // com padrão e precedência próprias.
  Pick<VariantProps<typeof carouselVariants>, "variant">) {
  // Uma superfície pintada não tem controle flutuando fora dela.
  const controls: CarouselControls =
    variant === "plain" ? (controlsProp ?? "inside") : "inside"

  const acordeao = layout === "accordion"
  // Sangria e dissolução não convivem: a rampa apagaria justamente as pontas
  // que a sangria veio mostrar.
  const dissolve = effect === "fade"
  // Na dissolução os itens se sobrepõem na origem: calha nenhuma, e nenhuma
  // rampa nas pontas — ela apagaria o item inteiro.
  const gap: CarouselGap = dissolve ? "none" : gapProp
  const fade = fadeProp && !bleed && !acordeao && !dissolve
  const loopEfetivo = loop ?? (effect === "spotlight" ? true : undefined)

  const [carouselRef, api] = useEmblaCarousel(
    {
      // 32 e não os 25 do embla: a duração é o que deixa a curva física assentar.
      duration: 32,
      ...(effect === "spotlight" && { align: "center" as const }),
      ...(loopEfetivo !== undefined && { loop: loopEfetivo }),
      ...(snap === "free" && { dragFree: true }),
      ...(until && { breakpoints: { [UNTIL_QUERY[until]]: { active: false } } }),
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
      // No acordeão o embla não move nada: quem troca o item é o contexto.
      ...(acordeao && { active: false }),
    },
    plugins
  )
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [snapCount, setSnapCount] = React.useState(0)
  const [total, registrarTotal] = React.useState(0)

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
    setSelectedIndex(api.selectedScrollSnap())
    setSnapCount(api.scrollSnapList().length)
  }, [])

  const scrollPrev = React.useCallback(() => {
    if (!acordeao) return api?.scrollPrev()
    setSelectedIndex((i) => (i > 0 ? i - 1 : loopEfetivo ? total - 1 : i))
  }, [api, acordeao, loopEfetivo, total])
  const scrollNext = React.useCallback(() => {
    if (!acordeao) return api?.scrollNext()
    setSelectedIndex((i) => (i < total - 1 ? i + 1 : loopEfetivo ? 0 : i))
  }, [api, acordeao, loopEfetivo, total])
  const scrollTo = React.useCallback(
    (index: number) => {
      if (!acordeao) return api?.scrollTo(index)
      setSelectedIndex(Math.max(0, Math.min(index, total - 1)))
    },
    [api, acordeao, total]
  )

  // No acordeão, poder avançar é aritmética do índice, e não pergunta ao embla.
  const podeAnterior = acordeao
    ? total > 1 && (loopEfetivo || selectedIndex > 0)
    : canScrollPrev
  const podeSeguinte = acordeao
    ? total > 1 && (loopEfetivo || selectedIndex < total - 1)
    : canScrollNext
  const contagem = acordeao ? total : snapCount

  // A rotação avança e, no fim sem `loop`, volta ao começo; senão pararia calada no último item com o relógio ainda desenhado.
  const avancar = React.useCallback(() => {
    if (podeSeguinte) scrollNext()
    else scrollTo(0)
  }, [podeSeguinte, scrollNext, scrollTo])
  const autoplay = useCarouselAutoplay({
    intervalo,
    avancar,
    chave: selectedIndex,
  })

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // A escuta é em captura na região inteira: sem esta saída, a seta dentro
      // de um campo num slide trocava de slide em vez de mover o cursor.
      const alvo = event.target as HTMLElement
      if (alvo.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']")) return
      // Na grade não há para onde andar, e a seta é do navegador.
      if (naGrade(until)) return
      // A seta segue o eixo (num carrossel vertical as horizontais não faziam nada).
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
        scrollTo(Math.max(0, contagem - 1))
      }
    },
    [orientation, scrollPrev, scrollNext, scrollTo, contagem, until]
  )

  // A roda do trackpad. Os passos mais recentes por ref: o ouvinte é montado
  // uma vez, e `scrollNext` muda de identidade com o total do acordeão.
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const passos = React.useRef({ scrollPrev, scrollNext })
  React.useEffect(() => {
    passos.current = { scrollPrev, scrollNext }
  }, [scrollPrev, scrollNext])
  React.useEffect(() => {
    const no = rootRef.current
    if (!no || !wheel || orientation !== "horizontal") return
    let acumulado = 0
    let travado = false
    let silencio: ReturnType<typeof setTimeout> | undefined
    const aoRolar = (e: WheelEvent) => {
      // Só o gesto de lado: o vertical continua rolando a página.
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      if (naGrade(until)) return
      e.preventDefault()
      clearTimeout(silencio)
      silencio = setTimeout(() => {
        acumulado = 0
        travado = false
      }, 160)
      if (travado) return
      acumulado += e.deltaX
      if (Math.abs(acumulado) < 40) return
      travado = true
      if (acumulado > 0) passos.current.scrollNext()
      else passos.current.scrollPrev()
    }
    no.addEventListener("wheel", aoRolar, { passive: false })
    return () => {
      no.removeEventListener("wheel", aoRolar)
      clearTimeout(silencio)
    }
  }, [wheel, orientation, until])

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api || acordeao) return
    onSelect(api)
    api.on("reInit", onSelect)
    api.on("select", onSelect)
    api.on("slidesChanged", onSelect)

    return () => {
      // A limpeza desinscreve também `reInit` e `slidesChanged`, não só o `select`.
      api.off("reInit", onSelect)
      api.off("select", onSelect)
      api.off("slidesChanged", onSelect)
    }
  }, [api, onSelect, acordeao])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        scrollPrev,
        scrollNext,
        scrollTo,
        canScrollPrev: podeAnterior,
        canScrollNext: podeSeguinte,
        selectedIndex,
        snapCount: contagem,
        orientation,
        controls,
        gap,
        fade,
        effect,
        layout,
        bleed,
        autoplay,
        until,
        selectOnClick,
        registrarTotal,
      }}
    >
      <div
        ref={composeRefs(rootRef, ref)}
        onKeyDownCapture={handleKeyDown}
        onPointerEnter={(e) => {
          // Pausar com o cursor em cima é coisa de mouse: no toque o
          // `pointerenter` vem do próprio toque.
          if (ehCursor(e)) autoplay.pausar("cursor")
          onPointerEnter?.(e)
        }}
        onPointerLeave={(e) => {
          autoplay.retomar("cursor")
          onPointerLeave?.(e)
        }}
        onFocusCapture={(e) => {
          autoplay.pausar("foco")
          onFocusCapture?.(e)
        }}
        onBlurCapture={(e) => {
          // Só retoma quando o foco sai da região, e não quando anda dentro
          // dela — de uma seta para um ponto.
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            autoplay.retomar("foco")
          }
          onBlurCapture?.(e)
        }}
        style={
          autoplay.ativo
            ? ({
                "--carousel-autoplay-ms": `${intervalo}ms`,
                ...style,
              } as React.CSSProperties)
            : style
        }
        data-autoplay={
          autoplay.ativo ? (autoplay.rodando ? "running" : "paused") : undefined
        }
        data-effect={effect === "none" ? undefined : effect}
        data-layout={layout}
        data-until={until}
        data-snap={snap === "free" ? "free" : undefined}
        className={cn(
          carouselVariants({ variant, controls, orientation }),
          // A calha da casca, devolvida: a raiz sangra até a borda e o trilho
          // recua o mesmo tanto, para o primeiro item alinhar com o conteúdo.
          bleed && "-mx-4 md:-mx-6",
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
 * O viewport e o trilho. `className` vai no trilho (onde operam `basis-*` e a
 * calha) e `viewportClassName` na caixa que recorta (onde fica o `data-slot`).
 */
function CarouselContent({
  className,
  viewportClassName,
  children,
  ...props
}: React.ComponentProps<"div"> & { viewportClassName?: string }) {
  const {
    carouselRef,
    orientation,
    gap,
    fade,
    api,
    effect,
    layout,
    bleed,
    until,
    registrarTotal,
  } = useCarousel()
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const acordeao = layout === "accordion"

  // A âncora das setas é o centro do viewport, não o da raiz (que também carrega
  // pontos e contagem; ver `CONTROL_POSITION`). Um `ResizeObserver` porque a
  // altura só existe depois do layout, e um layout effect porque com o efeito
  // depois da pintura o cliente pintava o palpite de `50%` (que resolve contra a
  // raiz) e a seta viajava até o valor medido; `CONTROL_TRANSITION` mata a
  // viagem das remedições posteriores.
  React.useLayoutEffect(() => {
    const node = viewportRef.current
    const raiz = node?.closest<HTMLElement>("[data-slot=carousel]")
    if (!node || !raiz) return

    // `offsetTop`/`offsetLeft` e não `getBoundingClientRect`: o bloco que contém
    // um absoluto é a caixa de padding da raiz, que desconta a borda mas não o
    // recuo (em `card` e `inset` o `p-3` empurra o viewport 12px).
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

  // A rampa é a do sistema; o motor é daqui, porque o embla translada o trilho e o `scrollLeft` do viewport nunca sai de zero.
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

  // O driver dos efeitos: escreve em cada slide a distância ao encaixe atual, em
  // passos (`--carousel-slide-s` com sinal, `-d` sem), e o CSS decide o que fazer
  // (`@utility carousel-effect-*`). É o método do tween do embla, inclusive o
  // desvio do `loop`. Nada transiciona: quem suaviza é o embla.
  React.useEffect(() => {
    if (!api || effect === "none" || acordeao) return

    const escrever = () => {
      const engine = api.internalEngine()
      const progresso = api.scrollProgress()
      const snaps = api.scrollSnapList()
      const nos = api.slideNodes()
      // Em `loop` os encaixes dividem a volta inteira; sem ele, o intervalo
      // entre o primeiro e o último. É o que faz "um passo" valer 1.
      const passos = Math.max(
        1,
        engine.options.loop ? snaps.length : snaps.length - 1
      )

      snaps.forEach((snap, i) => {
        for (const indice of engine.slideRegistry[i] ?? []) {
          let diff = snap - progresso
          if (engine.options.loop) {
            for (const ponto of engine.slideLooper.loopPoints) {
              const alvo = ponto.target()
              if (indice === ponto.index && alvo !== 0) {
                diff =
                  Math.sign(alvo) === -1
                    ? snap - (1 + progresso)
                    : snap + (1 - progresso)
              }
            }
          }
          const s = Math.max(-2, Math.min(2, diff * passos))
          const no = nos[indice]
          no?.style.setProperty("--carousel-slide-s", s.toFixed(3))
          no?.style.setProperty("--carousel-slide-d", Math.abs(s).toFixed(3))
        }
      })
    }

    escrever()
    api.on("scroll", escrever)
    api.on("reInit", escrever)
    api.on("slideFocus", escrever)
    return () => {
      api.off("scroll", escrever)
      api.off("reInit", escrever)
      api.off("slideFocus", escrever)
    }
  }, [api, effect, acordeao])

  // A posição do item é derivada pelo contêiner, que a conhece, e não escrita à mão em cada item.
  const itens = React.Children.toArray(children).filter(React.isValidElement)
  const total = itens.length

  // O acordeão não tem encaixes do embla para contar: quem sabe o total é o
  // contêiner, e ele o publica.
  React.useEffect(() => {
    registrarTotal(total)
  }, [registrarTotal, total])

  return (
    <div
      ref={composeRefs(carouselRef, viewportRef)}
      // Sem `bg`, sem `ring`, sem `radius`: quem carrega a máscara não desenha
      // nada — invariante 2 de `scroll-fade-classes`.
      className={cn(
        "overflow-hidden",
        // O triplo da zona do sistema (ver o cabeçalho).
        fade && "[--scroll-fade-x-h:--spacing(24)]",
        // A rampa segue o eixo (cravar a horizontal dissolvia as bordas laterais
        // de um carrossel vertical). É uma ou outra, nunca as duas: a invariante
        // 3 de `scroll-fade-classes` é um gradiente por elemento.
        fade &&
          (orientation === "horizontal"
            ? scrollFadeViewportXClassName
            : scrollFadeViewportClassName),
        // O recuo da sangria mora no viewport: o primeiro item alinha com o
        // conteúdo da página, e o resto passa por baixo da calha até a borda.
        bleed && "px-4 md:px-6",
        viewportClassName
      )}
      data-slot="carousel-content"
    >
      <div
        className={cn(
          "flex",
          // `h-full` na vertical é estrutural: o embla mede o contêiner (este
          // trilho) para achar o comprimento do eixo, e com a altura só no
          // viewport o trilho cresce até o conteúdo, o embla conclui que tudo
          // cabe e desabilita as setas. Por isso a altura de um carrossel
          // vertical vai em `viewportClassName`.
          orientation === "horizontal" ? "" : "h-full flex-col",
          // O acordeão estica os itens na altura do viewport — a altura dele é
          // de quem chama, em `viewportClassName`.
          acordeao && "h-full",
          GAP_CLASSES[orientation][gap].track,
          // A grade de `until`: só no eixo horizontal, que é o da tira.
          until && orientation === "horizontal" && UNTIL_TRACK[until][gap],
          EFFECT_CLASSES[effect],
          className
        )}
        {...props}
      >
        {itens.map((child, i) =>
          React.isValidElement<{ "aria-label"?: string; index?: number }>(child)
            ? React.cloneElement(child, {
                "aria-label": child.props["aria-label"] ?? `${i + 1} de ${total}`,
                // O índice também é do contêiner: o item o usa para saber se é
                // o selecionado e, no acordeão, para se selecionar no clique.
                index: child.props.index ?? i,
              })
            : child
        )}
      </div>
    </div>
  )
}

/**
 * A resposta ao cursor, no filho do item e não nele (o item carrega a calha).
 * `lift` e `zoom` não combinam com `effect="curve"` nem `"parallax"`, que
 * também escrevem `translate`/`scale`.
 */
const ITEM_HOVER = {
  none: "",
  lift: [
    "*:transition-[translate,box-shadow] *:duration-(--duration-base) *:ease-(--ease-out)",
    "hover:*:-translate-y-1 hover:*:shadow-md active:*:-translate-y-1 active:*:shadow-md",
  ].join(" "),
  zoom: [
    "[&_img]:transition-[scale] [&_img]:duration-(--duration-slow) [&_img]:ease-(--ease-out)",
    "hover:[&_img]:scale-105 active:[&_img]:scale-105",
  ].join(" "),
} as const

function CarouselItem({
  className,
  index = 0,
  hover = "none",
  onClick,
  onKeyDown,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  /** Escrito pelo `CarouselContent`; não precisa ser passado. */
  index?: number
  /** A resposta ao cursor e ao toque. */
  hover?: keyof typeof ITEM_HOVER
}) {
  const {
    api,
    orientation,
    gap,
    layout,
    effect,
    until,
    selectOnClick,
    selectedIndex,
    scrollTo,
  } = useCarousel()
  const acordeao = layout === "accordion"
  const selecionado = index === selectedIndex

  // O item cortado na borda vem para a vista antes de agir: o clique é engolido
  // em captura e o embla rola até o encaixe que contém o item (no `spotlight`
  // e no `curve` a régua é ser o central). Arrasto não chega aqui.
  const trazerParaVista = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectOnClick || acordeao || effect === "fade" || !api || naGrade(until)) return
    const encaixe = api
      .internalEngine()
      .slideRegistry.findIndex((grupo) => grupo.includes(index))
    if (encaixe < 0) return
    let fora: boolean
    if (effect === "spotlight" || effect === "curve") {
      fora = encaixe !== api.selectedScrollSnap()
    } else {
      // O filho, e não o item: o item carrega a calha, e o primeiro começa
      // 16px antes do viewport pela margem negativa do trilho.
      const caixa = (e.currentTarget.firstElementChild ?? e.currentTarget).getBoundingClientRect()
      const vista = api.rootNode().getBoundingClientRect()
      fora =
        orientation === "horizontal"
          ? caixa.left < vista.left - 1 || caixa.right > vista.right + 1
          : caixa.top < vista.top - 1 || caixa.bottom > vista.bottom + 1
    }
    if (!fora) return
    e.preventDefault()
    e.stopPropagation()
    api.scrollTo(encaixe)
  }

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      data-selected={selecionado || undefined}
      className={cn(
        acordeao
          ? // O peso cresce na mola da casa: o selecionado abre para 4 partes
            // e os outros ficam com uma, colapsados mas visíveis.
            "min-w-0 basis-0 grow-(--carousel-weight) cursor-pointer transition-[flex-grow] duration-(--duration-spring) ease-(--ease-spring)"
          : "min-w-0 shrink-0 grow-0 basis-full",
        acordeao &&
          "rounded-surface outline-none focus-visible:ring-3 focus-visible:ring-ring/45 focus-visible:ring-inset",
        GAP_CLASSES[orientation][gap].item,
        until && orientation === "horizontal" && UNTIL_ITEM[until],
        ITEM_HOVER[hover],
        className
      )}
      style={
        acordeao
          ? ({
              "--carousel-weight": selecionado ? 4 : 1,
              ...style,
            } as React.CSSProperties)
          : style
      }
      onClickCapture={trazerParaVista}
      onClick={(e) => {
        if (acordeao) scrollTo(index)
        onClick?.(e)
      }}
      // No acordeão o item colapsado é um alvo: ele recebe foco e abre com
      // Enter e Espaço, como o clique. As setas continuam andando pela região.
      tabIndex={acordeao ? 0 : undefined}
      onKeyDown={(e) => {
        if (acordeao && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          scrollTo(index)
        }
        onKeyDown?.(e)
      }}
      {...props}
    />
  )
}

function CarouselControl({
  direction,
  className,
  // `tertiary` nos dois modos: nada em repouso, fundo só no cursor e no toque,
  // como as setas do `Calendar` e da `Pagination`. `controls` decide só a posição.
  variant = "tertiary",
  size = "icon-sm",
  placement = "overlay",
  appearance = "tertiary",
  ...props
}: React.ComponentProps<typeof Button> & {
  direction: "prev" | "next"
  /**
   * `overlay` pousa sobre as bordas do viewport (o padrão); `inline` é estático,
   * para morar numa `CarouselToolbar` — no topo, embaixo ou em volta dos pontos.
   */
  placement?: "overlay" | "inline"
  /**
   * `tertiary` sem fundo (o padrão); `glass`, redonda na tinta flutuante, para
   * pousar sobre foto; `solid`, redonda e preenchida, para uma barra.
   */
  appearance?: "tertiary" | "glass" | "solid"
}) {
  const {
    orientation,
    controls,
    scrollPrev,
    scrollNext,
    canScrollPrev,
    canScrollNext,
  } = useCarousel()

  // `none` esconde as setas sobrepostas; as de uma barra são pedidas à mão.
  if (controls === "none" && placement === "overlay") return null
  const sobreposta = placement === "overlay"

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
      data-appearance={appearance}
      variant={appearance === "solid" ? "secondary" : variant}
      size={size}
      className={cn(
        // Sem `rounded-full` no padrão: o raio é o do `Button`, como no `Calendar` e na `Pagination`.
        sobreposta && "absolute",
        ESCONDE_NA_GRADE,
        CONTROL_TRANSITION,
        sobreposta && CONTROL_POSITION[controls === "none" ? "inside" : controls][orientation][direction],
        sobreposta && CONTROL_PRESS_FIX[orientation],
        // Na barra as setas são vizinhas: o alvo cresce de verdade (um `::after` de 46px engoliria a do lado).
        sobreposta ? CONTROL_TOUCH_TARGET : "pointer-coarse:size-11",
        // Sobre foto, a placa é a tinta flutuante (`background-color`) e o
        // realce do `tertiary` é `background-image`: compõem em vez de disputar.
        appearance === "glass" &&
          cn(menuPanelTintClassName, "rounded-full shadow-sm ring-1 ring-foreground/10"),
        appearance === "solid" && "rounded-full shadow-xs",
        // Redonda, apagada em vez de sumir: numa foto ou barra a seta que some faz a moldura piscar.
        appearance !== "tertiary" && "disabled:opacity-30",
        // Em `inside` a seta pousa sobre o conteúdo, e desabilitada tapava o
        // primeiro item inteiro; `invisible` (e não `hidden`) mantém a caixa e a
        // medição do alvo. Em `outside` fica visível, na calha reservada.
        sobreposta && appearance === "tertiary" && controls === "inside" && "disabled:invisible",
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
 * O indicador de posição. O alvo cresce de verdade e não por pseudo-elemento
 * (como no `pagination.tsx`): alvos adjacentes se sobreporiam. O ativo é
 * `bg-primary-accent`, a marca sobre o fundo.
 */
function CarouselDots({
  className,
  variant = "dot",
  placement = "below",
  surface = "none",
  ...props
}: React.ComponentProps<"div"> & {
  /**
   * `dot` pontos; `pill`, o ativo alonga para três vezes a largura, na mola da
   * casa; `bar`, segmentos que dividem a largura toda.
   */
  variant?: "dot" | "bar" | "pill"
  /** `overlay` pousa sobre a base do viewport, centralizado — para foto. */
  placement?: "below" | "overlay"
  /** `glass` dá uma cápsula de vidro atrás dos pontos. */
  surface?: "none" | "glass"
}) {
  const { snapCount, selectedIndex, scrollTo, autoplay } = useCarousel()

  // Um item só não tem posição para indicar.
  if (snapCount <= 1) return null

  const barra = variant === "bar"
  const pilula = variant === "pill"
  const sobreFoto = placement === "overlay"

  return (
    <div
      role="group"
      aria-label="Escolher item"
      data-slot="carousel-dots"
      data-variant={variant}
      data-placement={placement}
      className={cn(
        "flex items-center justify-center",
        ESCONDE_NA_GRADE,
        barra && "w-full gap-1",
        // Sobre a foto: centralizado na base do viewport, acima do conteúdo.
        sobreFoto &&
          "absolute inset-x-0 bottom-2 z-10 mx-auto w-fit",
        surface === "glass" &&
          cn(menuPanelTintClassName, "rounded-full px-1 shadow-sm ring-1 ring-foreground/10"),
        className
      )}
      {...props}
    >
      {Array.from({ length: snapCount }, (_, i) => {
        const ativo = i === selectedIndex
        // O temporizador mora no ativo, e remonta a cada troca (`key`): a
        // animação recomeça do zero junto com o relógio do `useCarouselAutoplay`.
        const relogio = ativo && autoplay.ativo
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
              "rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
              barra
                ? "min-w-0 flex-1 py-2 pointer-coarse:py-5"
                : cn("h-6 pointer-coarse:h-11", pilula && ativo ? "px-1" : "w-6 pointer-coarse:w-11")
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "relative overflow-hidden rounded-full",
                "transition-[background-color,width] duration-(--duration-spring) ease-(--ease-spring)",
                barra ? "h-1 w-full" : cn("h-2", pilula && ativo ? "w-6" : "w-2"),
                // O ponto apagado também é controle e a 1.4.11 pede 3:1; 45% é o
                // primeiro degrau que passa nos dois temas. Sobre foto a tinta é
                // a do véu (`--scrim-foreground`, branca nos dois temas). Os
                // degraus são literais: o Tailwind varre o código como texto.
                sobreFoto
                  ? ativo
                    ? relogio
                      ? "bg-scrim-foreground/40"
                      : "bg-scrim-foreground"
                    : "bg-scrim-foreground/55 group-hover/dot:bg-scrim-foreground/85 group-active/dot:bg-scrim-foreground/85"
                  : ativo
                    ? relogio
                      ? "bg-primary-accent/30"
                      : "bg-primary-accent"
                    : "bg-foreground/45 group-hover/dot:bg-foreground/70 group-active/dot:bg-foreground/70"
              )}
            >
              {relogio ? (
                <span
                  key={selectedIndex}
                  className={cn(
                    "carousel-timer absolute inset-0 rounded-full",
                    sobreFoto ? "bg-scrim-foreground" : "bg-primary-accent"
                  )}
                />
              ) : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** "3 de 12", a região viva que a APG pede para o carrossel. `role="status"` sozinho: já implica `aria-live="polite"`. */
function CarouselStatus({
  className,
  children,
  placement = "below",
  ...props
}: React.ComponentProps<typeof Caption> & {
  /** `overlay`: a pílula de vidro no canto de cima da foto, na tinta flutuante. */
  placement?: "below" | "overlay"
}) {
  const { selectedIndex, snapCount, autoplay } = useCarousel()

  return (
    <Caption
      role="status"
      // Com a rotação andando, a região viva se cala: anunciar cada troca
      // automática atropelaria o leitor de tela (APG, carrossel com rotação).
      aria-live={autoplay.rodando ? "off" : undefined}
      data-slot="carousel-status"
      data-placement={placement}
      className={cn(
        "nums",
        ESCONDE_NA_GRADE,
        placement === "overlay" &&
          cn(
            menuPanelTintClassName,
            "absolute start-2 top-2 z-10 rounded-full px-2 py-0.5 text-xs font-medium text-foreground shadow-sm ring-1 ring-foreground/10"
          ),
        className
      )}
      {...props}
    >
      {children ?? `${Math.min(selectedIndex + 1, snapCount)} de ${snapCount}`}
    </Caption>
  )
}

/**
 * A barra de controles: o lugar das setas `placement="inline"`, dos pontos, da
 * contagem e do `CarouselPlayPause`. Não se posiciona; quem a põe decide.
 */
function CarouselToolbar({
  className,
  align = "end",
  ...props
}: React.ComponentProps<"div"> & { align?: "start" | "center" | "end" }) {
  return (
    <div
      data-slot="carousel-toolbar"
      className={cn(
        "flex items-center gap-1.5",
        ESCONDE_NA_GRADE,
        align === "start" && "justify-start",
        align === "center" && "justify-center",
        align === "end" && "justify-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * A legenda do item atual (título, texto e ação), fora do trilho. Remonta a
 * cada troca (`key`) e entra com a `disclosure-reveal`.
 */
function CarouselCaption({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  children: (index: number) => React.ReactNode
}) {
  const { selectedIndex, autoplay } = useCarousel()
  return (
    <div
      data-slot="carousel-caption"
      aria-live={autoplay.rodando ? "off" : "polite"}
      className={className}
      {...props}
    >
      <div key={selectedIndex} className={disclosureRevealClassName}>
        {children(selectedIndex)}
      </div>
    </div>
  )
}

/**
 * Pausar e retomar a rotação, obrigatório onde há `autoplay` (WCAG 2.2.2). O
 * ícone e o rótulo dizem o que o botão faz; as pausas automáticas (cursor,
 * foco, aba) não mexem nele, senão mudaria de sentido sob o cursor.
 */
function CarouselPlayPause({
  className,
  variant = "tertiary",
  size = "icon-sm",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { autoplay } = useCarousel()
  if (!autoplay.ativo) return null
  const pausado = autoplay.pausadoPeloUsuario

  return (
    <Button
      type="button"
      data-slot="carousel-play-pause"
      variant={variant}
      size={size}
      onClick={autoplay.alternar}
      className={cn("pointer-coarse:size-11", ESCONDE_NA_GRADE, className)}
      {...props}
    >
      {pausado ? <PlayIcon /> : <PauseIcon />}
      <span className="sr-only">
        {pausado ? "Retomar a rotação" : "Pausar a rotação"}
      </span>
    </Button>
  )
}

/**
 * Os passos nomeados de um carrossel: pílulas numeradas (`horizontal`) ou lista
 * com trilho à esquerda em que só o ativo mostra a descrição (`vertical`).
 * Botões com `aria-current` e não abas: os painéis são os slides do embla
 * (`role="group"`), e `role="tab"` sem painel quebra a posse ARIA. Lê e escreve
 * o índice do contexto, então mora dentro de um `<Carousel>`.
 */
type StepsContextValue = { orientation: "horizontal" | "vertical" }
const StepsContext = React.createContext<StepsContextValue>({
  orientation: "horizontal",
})

function CarouselSteps({
  className,
  orientation = "horizontal",
  children,
  ...props
}: React.ComponentProps<"div"> & { orientation?: "horizontal" | "vertical" }) {
  const { selectedIndex } = useCarousel()
  const listaRef = React.useRef<HTMLDivElement | null>(null)
  const [medido, setMedido] = React.useState(false)

  // O marcador do trilho viaja até o passo ativo (a mecânica do `Tabs`: caixa
  // medida em variáveis); antes da primeira medição ele não transiciona.
  React.useLayoutEffect(() => {
    const lista = listaRef.current
    if (!lista || orientation !== "vertical") return
    const medir = () => {
      const ativo = lista.querySelector<HTMLElement>(
        '[data-slot="carousel-step"][aria-current="step"]'
      )
      if (!ativo) return
      lista.style.setProperty("--steps-y", `${ativo.offsetTop}px`)
      lista.style.setProperty("--steps-h", `${ativo.offsetHeight}px`)
      setMedido(true)
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(lista)
    for (const passo of lista.children) observador.observe(passo)
    return () => observador.disconnect()
  }, [orientation, selectedIndex])

  const vertical = orientation === "vertical"

  return (
    <StepsContext.Provider value={{ orientation }}>
      <div
        ref={listaRef}
        role="group"
        aria-label="Passos"
        data-slot="carousel-steps"
        data-orientation={orientation}
        className={cn(
          vertical
            ? "relative flex flex-col border-s border-border"
            : "flex flex-wrap items-center gap-1.5",
          className
        )}
        {...props}
      >
        {children}
        {vertical ? (
          <span
            aria-hidden="true"
            data-slot="carousel-steps-indicator"
            className={cn(
              "pointer-events-none absolute -start-px top-0 w-0.5 rounded-full bg-foreground",
              "translate-y-(--steps-y) h-(--steps-h)",
              medido &&
                "transition-[translate,height] duration-(--duration-spring) ease-(--ease-spring)"
            )}
          />
        ) : null}
      </div>
    </StepsContext.Provider>
  )
}

function CarouselStep({
  index,
  label,
  description,
  className,
  onClick,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  /** A posição do slide que este passo abre. */
  index: number
  label: React.ReactNode
  /** Só na vertical, e só no passo ativo. */
  description?: React.ReactNode
}) {
  const { selectedIndex, scrollTo, autoplay } = useCarousel()
  const { orientation } = React.useContext(StepsContext)
  const ativo = index === selectedIndex
  const numero = String(index + 1).padStart(2, "0")

  if (orientation === "vertical") {
    return (
      <button
        type="button"
        data-slot="carousel-step"
        aria-current={ativo ? "step" : undefined}
        onClick={(e) => {
          scrollTo(index)
          onClick?.(e)
        }}
        className={cn(
          "group/step flex w-full items-start gap-3 border-b border-border py-5 ps-6 pe-2 text-start outline-none last:border-b-0",
          "focus-visible:ring-3 focus-visible:ring-ring/45 focus-visible:ring-inset",
          className
        )}
        {...props}
      >
        <span className="nums pt-1.5 text-2xs text-muted-foreground">/{numero}</span>
        <span className="flex min-w-0 flex-col">
          <span
            className={cn(
              "text-xl font-medium tracking-tight transition-colors duration-(--duration-base) ease-(--ease-out)",
              ativo
                ? "text-foreground"
                : "text-muted-foreground group-hover/step:text-foreground group-active/step:text-foreground"
            )}
          >
            {label}
          </span>
          {description ? (
            // A descrição abre só no ativo: `grid-rows` de 0fr a 1fr anima a altura sem medir.
            <span
              className={cn(
                "grid transition-[grid-template-rows] duration-(--duration-spring) ease-(--ease-spring)",
                ativo ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <span className="overflow-hidden">
                <span className="block pt-2 text-sm text-muted-foreground">
                  {description}
                </span>
              </span>
            </span>
          ) : null}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      data-slot="carousel-step"
      aria-current={ativo ? "step" : undefined}
      onClick={(e) => {
        scrollTo(index)
        onClick?.(e)
      }}
      className={cn(
        "group/step relative inline-flex h-8 items-center gap-2 overflow-hidden rounded-full ps-1 pe-3 text-xs font-medium outline-none",
        "transition-colors duration-(--duration-base) ease-(--ease-out)",
        "focus-visible:ring-3 focus-visible:ring-ring/45 pointer-coarse:h-11",
        ativo
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground active:bg-muted/60 active:text-foreground",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "nums grid size-6 place-items-center rounded-full text-2xs",
          ativo ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
        )}
      >
        {index + 1}
      </span>
      {label}
      {ativo && autoplay.ativo ? (
        // O relógio do autoplay, como um fio na base da pílula ativa.
        <span
          key={selectedIndex}
          aria-hidden="true"
          className="carousel-timer absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-foreground/60"
        />
      ) : null}
    </button>
  )
}

/**
 * A tira de miniaturas de uma galeria: um segundo embla, livre (`dragFree`),
 * sincronizado com o principal nos dois sentidos pelo contexto. Arrastar a
 * tira não escolhe a miniatura em que o arrasto termina (o embla 8 cancela o
 * clique de um arrasto).
 */

function CarouselThumbs({
  className,
  orientation = "horizontal",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /** `vertical`: a coluna ao lado da foto a partir de `md` (abaixo, deita embaixo); a coluna não mede nada (`contain: size`) e a foto dá a altura. */
  orientation?: "horizontal" | "vertical"
}) {
  const { selectedIndex } = useCarousel()
  const vertical = orientation === "vertical"
  const [ref, api] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
    ...(vertical && { breakpoints: { [UNTIL_QUERY.md]: { axis: "y" } } }),
  })

  React.useEffect(() => {
    api?.scrollTo(selectedIndex)
  }, [api, selectedIndex])

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Miniaturas"
      data-slot="carousel-thumbs"
      data-orientation={orientation}
      className={cn(
        "min-w-0 flex-1 overflow-hidden",
        vertical && "md:[contain:size]",
        className
      )}
      {...props}
    >
      {/* O recuo dá lugar ao anel de foco e ao da seleção, que o recorte do viewport cortaria. */}
      <div className={cn("flex gap-2 p-1", vertical && "md:flex-col")}>{children}</div>
    </div>
  )
}

function CarouselThumb({
  index,
  className,
  onClick,
  ...props
}: React.ComponentProps<"button"> & {
  /** A posição do slide que esta miniatura abre. */
  index: number
}) {
  const { selectedIndex, scrollTo } = useCarousel()
  const ativa = index === selectedIndex

  return (
    <button
      type="button"
      data-slot="carousel-thumb"
      aria-label={`Ir para o item ${index + 1}`}
      aria-current={ativa ? "true" : undefined}
      onClick={(e) => {
        scrollTo(index)
        onClick?.(e)
      }}
      className={cn(
        "h-12 w-16 shrink-0 overflow-hidden rounded-md outline-none",
        "[&_img]:size-full [&_img]:object-cover",
        "transition-[opacity,box-shadow] duration-(--duration-base) ease-(--ease-out)",
        "focus-visible:ring-3 focus-visible:ring-ring/45",
        ativa
          ? "opacity-100 ring-2 ring-primary-accent ring-offset-2 ring-offset-background"
          : "opacity-55 hover:opacity-100 active:opacity-100",
        className
      )}
      {...props}
    />
  )
}

/**
 * A barra de rolagem da tira, o indicador do arraste livre (`snap="free"`),
 * onde pontos mentem. O polegar tem a largura da fração visível e anda com
 * `scrollProgress()`. Decorativa (`aria-hidden`); some quando tudo cabe;
 * horizontal e sem `loop` (no laço o polegar saltaria de ponta a ponta).
 */
function CarouselProgress({ className, ...props }: React.ComponentProps<"div">) {
  const { api } = useCarousel()
  const ref = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const no = ref.current
    if (!api || !no) return
    const escrever = () => {
      const trilho = api.containerNode()
      const fracao = Math.min(1, api.rootNode().clientWidth / Math.max(1, trilho.scrollWidth))
      const progresso = Math.min(1, Math.max(0, api.scrollProgress()))
      no.style.setProperty("--carousel-progress-w", `${fracao * 100}%`)
      // `translate` em % é da largura do próprio polegar: andar a pista toda
      // é `(1/fração − 1)` larguras.
      no.style.setProperty(
        "--carousel-progress-x",
        `${progresso * (1 / fracao - 1) * 100}%`
      )
      if (fracao >= 1) no.dataset.empty = ""
      else delete no.dataset.empty
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
  }, [api])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-slot="carousel-progress"
      className={cn(
        "relative h-1 w-full overflow-hidden rounded-full bg-muted data-empty:invisible",
        ESCONDE_NA_GRADE,
        className
      )}
      {...props}
    >
      <div className="h-full w-(--carousel-progress-w) translate-x-(--carousel-progress-x) rounded-full bg-primary-accent" />
    </div>
  )
}

/**
 * O carrossel carregando, na forma que ele vai ter (mesmo `basis` e calha). Fica
 * fora de um `<Carousel>` e é um `SkeletonGroup`; o osso de cada item é um
 * `CardSkeleton` sem barra, ou `children`.
 */
function CarouselSkeleton({
  count = 3,
  gap = DEFAULT_GAP,
  itemClassName = "basis-2/3 sm:basis-1/3",
  className,
  children,
  ...props
}: React.ComponentProps<typeof SkeletonGroup> & {
  /** Quantos itens desenhar — o bastante para vazar da borda. */
  count?: number
  gap?: CarouselGap
  /** O `basis` do item real. */
  itemClassName?: string
}) {
  return (
    <SkeletonGroup
      data-slot="carousel-skeleton"
      className={cn("overflow-hidden", className)}
      {...props}
    >
      <div className={cn("flex", GAP_CLASSES.horizontal[gap].track)}>
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className={cn(
              "min-w-0 shrink-0 grow-0",
              GAP_CLASSES.horizontal[gap].item,
              itemClassName
            )}
          >
            {children ?? <CardSkeleton toolbar={false} lines={2} />}
          </div>
        ))}
      </div>
    </SkeletonGroup>
  )
}

/**
 * O último item é o caminho para a lista ("Ver todos"): um item de verdade
 * (entra na contagem e no teclado) com a superfície `Card variant="dashed"`
 * clicável. O filho é o link, que recebe a superfície por `asChild`.
 */
function CarouselMore({
  count,
  children,
  ...props
}: Omit<React.ComponentProps<typeof CarouselItem>, "children"> & {
  /** O total da lista, dito embaixo ("12 no total"). */
  count?: number
  /** O link, com o texto: `<Link href="/credit-cards">Ver todos</Link>`. */
  children: React.ReactElement
}) {
  return (
    <CarouselItem data-more="" {...props}>
      <Card
        variant="dashed"
        interactive
        asChild
        className="h-full min-h-28 items-center justify-center gap-1.5 text-center font-medium text-foreground"
      >
        <Slot.Root data-slot="carousel-more">
          <span className="grid size-8 place-items-center rounded-full bg-muted" aria-hidden="true">
            <ArrowRightIcon className="size-4" />
          </span>
          <Slot.Slottable>{children}</Slot.Slottable>
          {count != null ? (
            <Caption className="nums font-normal">{count} no total</Caption>
          ) : null}
        </Slot.Root>
      </Card>
    </CarouselItem>
  )
}

/**
 * A galeria em tela cheia: o botão de expandir e um `Dialog` com outro
 * `Carousel` que abre no item atual (`startIndex`) e devolve o índice ao
 * fechar. Os itens vêm em `children` outra vez, porque em tela cheia a foto é
 * inteira (`object-contain`). As setas do teclado andam de qualquer foco: o
 * diálogo abre com o foco no ×, fora da região.
 */
function CarouselFullscreen({
  title = "Imagens",
  className,
  children,
}: {
  /** O nome do diálogo e da região. */
  title?: string
  className?: string
  /** Os `CarouselItem` da tela cheia. */
  children: React.ReactNode
}) {
  const { api: principal, selectedIndex } = useCarousel()
  const [interna, setInterna] = React.useState<CarouselApi>()

  React.useEffect(() => {
    if (!interna) return
    const devolver = () => principal?.scrollTo(interna.selectedScrollSnap(), true)
    interna.on("select", devolver)
    return () => {
      interna.off("select", devolver)
    }
  }, [interna, principal])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="tertiary"
          size="icon-sm"
          data-slot="carousel-fullscreen-trigger"
          className={cn(
            menuPanelTintClassName,
            "absolute end-2 top-2 z-10 rounded-full shadow-sm ring-1 ring-foreground/10",
            CONTROL_TOUCH_TARGET,
            className
          )}
        >
          <ArrowsPointingOutIcon />
          <span className="sr-only">Ver em tela cheia</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        data-slot="carousel-fullscreen"
        // Opaca nos dois temas: a placa modal é vidro, e a página não pode aparecer atrás de uma foto em tela cheia.
        className="flex h-dvh max-h-none w-screen max-w-none flex-col justify-center rounded-none bg-background p-0 ring-0 sm:max-w-none dark:bg-background"
        onKeyDown={(e) => {
          // Dentro da região a captura já andou e marcou o evento.
          if (e.defaultPrevented) return
          if (e.key === "ArrowLeft") interna?.scrollPrev()
          else if (e.key === "ArrowRight") interna?.scrollNext()
        }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <Carousel
          opts={{ startIndex: selectedIndex }}
          setApi={setInterna}
          gap="none"
          fade={false}
          aria-label={title}
          className="w-full"
        >
          <CarouselContent>{children}</CarouselContent>
          <CarouselPrevious appearance="glass" />
          <CarouselNext appearance="glass" />
          <CarouselStatus placement="overlay" />
        </Carousel>
      </DialogContent>
    </Dialog>
  )
}

export {
  type CarouselApi,
  type CarouselEffect,
  CarouselToolbar,
  CarouselCaption,
  CarouselFullscreen,
  CarouselMore,
  CarouselProgress,
  CarouselSkeleton,
  CarouselPlayPause,
  CarouselStep,
  CarouselSteps,
  CarouselThumb,
  CarouselThumbs,
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
  EFFECT_CLASSES as carouselEffectClasses,
  ITEM_HOVER as carouselItemHover,
  UNTIL_TRACK as carouselUntilTrack,
}
