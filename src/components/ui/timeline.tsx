"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronDownIcon } from "@heroicons/react/16/solid"
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react"
import { Slot } from "radix-ui"

import { MOLA } from "@/lib/spring"
import {
  formatDateTimeShortPtBr,
  formatRelativeTimePtBr,
} from "@/lib/transaction-date"
import { cn } from "@/lib/utils"
import { Button, ButtonSizeContext } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleLabel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Skeleton, SkeletonGroup, SkeletonText } from "@/components/ui/skeleton"
import { Caption, P } from "@/components/ui/typography"

/**
 * Feed cronológico de eventos: marcador, conector e conteúdo.
 * A lista sabe o fim pelo CSS (`:last-child` apaga o conector e o respiro, por
 * variável; `isLast={false}` é a exceção) e a forma, a orientação e o `layout`
 * descem por contexto, sem `cloneElement`: o clone derramava as props no `<li>`
 * da faixa de data e deixava sem fim certo o filho que não era elemento direto
 * (um fragmento, o `TimelineCollapsed`).
 * O ponto se centra na primeira linha do título pela conta do `Alert`,
 * `(entrelinha − marcador) / 2`, em `MARCADOR_OFFSET`; o `max(0px, …)` faz o poço
 * (maior que uma linha) alinhar pelo topo do bloco.
 * Sem anel de superfície no ponto (`ring-4 ring-background` entalharia o fio com
 * `--background` sobre qualquer `--card`): o relevo é um halo do próprio tom
 * (`--tl-well`), que não supõe a superfície de baixo.
 * É cliente: o tempo relativo, o recolhido, o detalhe, a chegada e o fio que se
 * desenha são estado. Um componente de servidor ainda a renderiza com o dado
 * buscado; ela só hidrata no cliente.
 */

/**
 * A lista dos tons, exportada para o teste e a página do catálogo iterarem o
 * `cva` de verdade, e não uma cópia que envelhece.
 */
const TIMELINE_TONES = [
  "default",
  "primary",
  "success",
  "warning",
  "destructive",
  "income",
  "expense",
] as const

/**
 * A raiz. É o primeiro `cva` do arquivo de propósito: o `npm run ds:catalog` lê
 * só o primeiro `variants:` de cada fonte. `marker` é da lista e não do item
 * porque uma trilha tem uma calha só; o item pode sobrescrever.
 */
const timelineVariants = cva(
  [
    "flex",
    // O fio de fábrica, que o estado do item troca por variável.
    "[--tl-line-bg:var(--color-border)]",
    // A coluna de data do `layout="split"`, o topo da faixa presa e a superfície que
    // ela pinta (a página; dentro de um cartão, `--color-card`).
    "[--tl-opposite-w:--spacing(24)] [--tl-sticky-top:0px] [--tl-surface:var(--color-background)]",
  ],
  {
    variants: {
      orientation: {
        vertical: [
          "flex-col",
          "[--tl-rail-dir:column] [--tl-item-dir:row]",
          "[--tl-rail-w:var(--tl-marker)] [--tl-rail-h:auto] [--tl-grow:0_1_auto]",
          // O conector cresce no eixo principal da calha (`flex-1`); aqui se declara a
          // espessura, que é o eixo cruzado.
          "[--tl-line-w:1px] [--tl-line-h:auto] [--tl-dash-dir:to_bottom]",
          // Liga a centragem do marcador na primeira linha do título.
          "[--tl-center:1]",
          "[--tl-content-grow:1_1_0%] [--tl-content-w:auto]",
          "[--tl-content-center:0] [--tl-content-tx:none] [--tl-content-align:start]",
          "[--tl-pb:var(--tl-pad)]",
        ],
        horizontal: [
          "flex-row items-start",
          "[--tl-rail-dir:row] [--tl-item-dir:column]",
          "[--tl-rail-w:100%] [--tl-rail-h:var(--tl-marker)] [--tl-grow:1_1_0%]",
          "[--tl-line-w:auto] [--tl-line-h:1px] [--tl-dash-dir:to_right]",
          // Na horizontal o marcador tem linha própria: não há o que centrar.
          "[--tl-center:0]",
          // Na deitada o texto se centra no marcador (o centro do texto ficava a 161,4px
          // do centro do marcador). O primeiro também se centra, por decisão do dono:
          // passa 6,62px da borda.
          "[--tl-content-grow:0_0_auto] [--tl-content-w:max-content]",
          "[--tl-content-center:1] [--tl-content-tx:-50%] [--tl-content-align:center]",
          "[--tl-pb:0px]",
        ],
      },
      size: {
        sm: "[--tl-dot:--spacing(2)] [--tl-icon:--spacing(3.5)] [--tl-pad:--spacing(4)] [--tl-rail-gap:--spacing(1)] [--tl-lead:calc(var(--text-xs)*1.625)] [--tl-title:var(--text-xs)] [--tl-well-size:--spacing(6)] [--tl-halo:2px] [--tl-gap:--spacing(2)] gap-(--tl-gap)",
        md: "[--tl-dot:--spacing(2.5)] [--tl-icon:--spacing(4)] [--tl-pad:--spacing(6)] [--tl-rail-gap:--spacing(1.5)] [--tl-lead:calc(var(--text-sm)*1.625)] [--tl-title:var(--text-sm)] [--tl-well-size:--spacing(8)] [--tl-halo:3px] [--tl-gap:--spacing(3)] gap-(--tl-gap)",
        lg: "[--tl-dot:--spacing(3)] [--tl-icon:--spacing(5)] [--tl-pad:--spacing(8)] [--tl-rail-gap:--spacing(2)] [--tl-lead:calc(var(--text-sm)*1.625)] [--tl-title:var(--text-sm)] [--tl-well-size:--spacing(10)] [--tl-halo:4px] [--tl-gap:--spacing(4)] gap-(--tl-gap)",
      },
      /**
       * A forma do marcador, e com ela a largura da calha. `dot` é o ponto, `icon` o
       * poço tingido, `avatar` a casca sem tinta (a identidade traz a cor dela), `none` só o fio.
       */
      marker: {
        dot: "[--tl-marker:var(--tl-dot)]",
        icon: "[--tl-marker:var(--tl-well-size)]",
        avatar: "[--tl-marker:var(--tl-well-size)]",
        // `none` é a trilha sem marcador: o fio é a espinha. A calha mede o fio (1px) e
        // o texto se afasta dele 12px em todo degrau; com a calha em zero o fio sobraria
        // por fora, a 6px do texto, e leria como a barra lateral de uma citação.
        none: "[--tl-marker:1px] [--tl-rail-gap:--spacing(3)]",
      },
    },
    defaultVariants: { orientation: "vertical", size: "md", marker: "dot" },
  }
)

/**
 * O tom publica quatro variáveis e não pinta nada: a cor cheia do ponto, a
 * superfície do poço, a tinta dentro dele e a cor forte (o ponto concluído, o fio
 * andado e o contorno do previsto). No `default` a cor cheia é a do fio
 * (`--border`), fraca demais para dizer "aconteceu"; a forte é a tinta secundária.
 * É no poço que o colapso de tons se desfaz: `--income` é `var(--success)` e
 * `--expense` é `var(--destructive)`, idênticos na cor cheia, mas divergem na
 * família `-muted`; ali sete tons rendem sete cores.
 */
const timelineToneVariants = cva("", {
  variants: {
    tone: {
      default:
        "[--tl-fill:var(--color-border)] [--tl-ink:var(--color-muted-foreground)] [--tl-well:var(--color-muted)] [--tl-strong:var(--color-muted-foreground)]",
      primary:
        "[--tl-fill:var(--color-primary)] [--tl-ink:var(--color-primary-muted-foreground)] [--tl-well:var(--color-primary-muted)] [--tl-strong:var(--color-primary)]",
      success:
        "[--tl-fill:var(--color-success)] [--tl-ink:var(--color-success-muted-foreground)] [--tl-well:var(--color-success-muted)] [--tl-strong:var(--color-success)]",
      warning:
        "[--tl-fill:var(--color-warning)] [--tl-ink:var(--color-warning-muted-foreground)] [--tl-well:var(--color-warning-muted)] [--tl-strong:var(--color-warning)]",
      destructive:
        "[--tl-fill:var(--color-destructive)] [--tl-ink:var(--color-destructive-muted-foreground)] [--tl-well:var(--color-destructive-muted)] [--tl-strong:var(--color-destructive)]",
      income:
        "[--tl-fill:var(--color-income)] [--tl-ink:var(--color-income-muted-foreground)] [--tl-well:var(--color-income-muted)] [--tl-strong:var(--color-income)]",
      expense:
        "[--tl-fill:var(--color-expense)] [--tl-ink:var(--color-expense-muted-foreground)] [--tl-well:var(--color-expense-muted)] [--tl-strong:var(--color-expense)]",
    },
  },
  defaultVariants: { tone: "default" },
})

/**
 * `(entrelinha − marcador) / 2`, por degrau, com o fator de orientação embutido.
 * O `max(0px, …)` faz o poço alinhar pelo topo. Todo `-` binário dentro de um
 * `calc()` arbitrário vai como `_-_`.
 */
const MARCADOR_OFFSET =
  "[margin-block-start:max(0px,calc((var(--tl-lead)_-_var(--tl-marker))/2*var(--tl-center)))]"

type TimelineMarker = NonNullable<
  VariantProps<typeof timelineVariants>["marker"]
>
type TimelineOrientation = "vertical" | "horizontal"
type TimelineState = "done" | "current" | "upcoming" | "skipped"

type TimelineContextValue = {
  marker: TimelineMarker
  split: boolean
  live: boolean
}

/**
 * O que a lista sabe e o item não. A forma aceita exceção: o `marker` do item
 * vence o da lista. Sem eixo `glass`: com o relevo (halo do tom no ponto, fio no
 * poço) seria um terceiro acabamento sem tela que o pedisse.
 */
const TimelineContext = React.createContext<TimelineContextValue>({
  marker: "dot",
  split: false,
  live: false,
})

/** A calha: largura fixa em `--tl-marker`, alinhada ao topo. */
const CALHA =
  "flex shrink-0 items-center justify-start [flex-direction:var(--tl-rail-dir)] [gap:var(--tl-rail-gap)] [height:var(--tl-rail-h)] [width:var(--tl-rail-w)]"

/** O conector: a cor (ou o tracejado) vem de `--tl-line-bg`, e o fim o apaga. */
const CONECTOR =
  "flex-1 rounded-full [display:var(--tl-conn,block)] [background:var(--tl-line-bg)] [height:var(--tl-line-h)] [width:var(--tl-line-w)]"

/**
 * Sem marcador o fio é a espinha e não para no último: não há ponto para dizer
 * onde a trilha termina, e um fio que some antes do último evento o deixaria
 * solto, fora da trilha.
 */
const CONECTOR_ESPINHA =
  "flex-1 rounded-full [background:var(--tl-line-bg)] [height:var(--tl-line-h)] [width:var(--tl-line-w)]"

/** O tracejado do previsto, do atual e do recolhido. */
const TRACEJADO =
  "[--tl-line-bg:repeating-linear-gradient(var(--tl-dash-dir),color-mix(in_oklab,var(--color-muted-foreground)_45%,transparent)_0_3px,transparent_3px_7px)]"

/**
 * O trecho até um evento previsto também é tracejado, venha a lista em que ordem
 * vier. O conector de um item é o trecho até o irmão seguinte: numa lista
 * cronológica o previsto vem depois do atual; numa decrescente vem antes, e é o
 * trecho acima dele que ainda não aconteceu (senão o fio entre uma cobrança paga
 * e a próxima prevista sairia cheio).
 */
const TRACEJADO_ATE_PREVISTO =
  "[&:has(+[data-state=upcoming])]:[--tl-line-bg:repeating-linear-gradient(var(--tl-dash-dir),color-mix(in_oklab,var(--color-muted-foreground)_45%,transparent)_0_3px,transparent_3px_7px)]"

/**
 * O `layout="split"` é uma grade de três colunas (a data, a calha, o conteúdo)
 * que no telefone vira duas, com a data embaixo do conteúdo. A calha atravessa
 * as duas linhas, senão o fio pararia antes da data.
 */
const SPLIT_LINHA =
  "grid grid-cols-[var(--tl-rail-w)_minmax(0,1fr)] sm:grid-cols-[var(--tl-opposite-w)_var(--tl-rail-w)_minmax(0,1fr)]"
const SPLIT_CALHA = "col-start-1 row-span-2 row-start-1 sm:col-start-2 sm:row-span-1"
const SPLIT_CONTEUDO = "col-start-2 row-start-1 sm:col-start-3"
const SPLIT_LADO = "col-start-2 row-start-2 sm:col-start-1 sm:row-start-1 sm:pe-2 sm:text-end"

function Timeline({
  className,
  orientation,
  size,
  marker,
  layout = "stack",
  reveal = false,
  live = false,
  progress,
  children,
  ...props
}: React.ComponentProps<"ol"> &
  VariantProps<typeof timelineVariants> & {
    /**
     * `split` põe a data numa coluna à esquerda do fio (o `opposite` de cada item).
     * Só na vertical; no telefone a data desce para baixo do conteúdo.
     */
    layout?: "stack" | "split"
    /** Os eventos sobem em cascata ao montar (`@utility timeline-reveal`). */
    reveal?: boolean
    /**
     * Feed ao vivo: um evento que chega depois da montagem cresce no lugar e
     * empurra a trilha; um que sai, recolhe. Os da primeira pintura não animam.
     */
    live?: boolean
    /** `scroll`: o fio se desenha conforme a pessoa rola a trilha. */
    progress?: "scroll"
  }) {
  const o: TimelineOrientation = orientation ?? "vertical"
  const forma: TimelineMarker = marker ?? "dot"
  const split = layout === "split" && o === "vertical"

  const contexto = React.useMemo(
    () => ({ marker: forma, split, live }),
    [forma, split, live]
  )

  return (
    <TimelineContext.Provider value={contexto}>
      <ol
        data-slot="timeline"
        data-orientation={o}
        data-size={size ?? "md"}
        data-marker={forma}
        data-layout={split ? "split" : "stack"}
        className={cn(
          timelineVariants({ orientation, size, marker }),
          reveal && "timeline-reveal",
          progress === "scroll" && o === "vertical" && "relative",
          className
        )}
        {...props}
      >
        {progress === "scroll" && o === "vertical" ? <TimelineProgress /> : null}
        {live ? (
          <AnimatePresence initial={false}>{children}</AnimatePresence>
        ) : (
          children
        )}
      </ol>
    </TimelineContext.Provider>
  )
}

/**
 * A medida do marcador, republicada no item: o deslocamento vertical e a
 * centragem do texto na horizontal precisam da medida do marcador renderizado,
 * que diverge da calha no item que sobrescreve o `marker` (um ponto de 10px numa
 * trilha de poço saía 6,38px acima do título).
 */
const MEDIDA_DO_MARCADOR: Record<TimelineMarker, string> = {
  dot: "[--tl-marker:var(--tl-dot)]",
  icon: "[--tl-marker:var(--tl-well-size)]",
  avatar: "[--tl-marker:var(--tl-well-size)]",
  // Na deitada não há marcador onde centrar o texto: centrado no começo do
  // trecho, o primeiro passaria 39px para fora da trilha. Sem marcador o texto
  // começa onde o trecho dele começa, como numa régua.
  none: "[--tl-marker:1px] [--tl-content-center:0] [--tl-content-tx:none] [--tl-content-align:start]",
}

/** O halo do relevo: a superfície do tom em volta do ponto. */
const HALO = "[box-shadow:0_0_0_var(--tl-halo)_var(--tl-well)]"
/** O fio de 1px por dentro do poço, na tinta do tom. */
const FIO_DO_POCO =
  "[box-shadow:inset_0_0_0_1px_color-mix(in_oklab,var(--tl-ink)_16%,transparent)]"

const timelineMarkerVariants = cva(
  // `relative z-2`: o fio que se desenha (`progress`) corre por baixo dos
  // marcadores e por cima dos conectores.
  "relative z-2 flex shrink-0 items-center justify-center rounded-full",
  {
    variants: {
      marker: {
        dot: "size-(--tl-dot)",
        icon: "size-(--tl-well-size) [color:var(--tl-ink)] [&_svg]:size-(--tl-icon) [&_svg]:shrink-0",
        avatar:
          "size-(--tl-well-size) overflow-hidden [&>*]:size-full [&>*]:rounded-full",
        none: "hidden",
      },
      /** O estado na trilha. `none` é o evento que só aconteceu. */
      state: { none: "", done: "", current: "", upcoming: "", skipped: "" },
    },
    compoundVariants: [
      // O ponto em relevo: a cor cheia com o halo do tom.
      {
        marker: "dot",
        state: "none",
        class: ["[background:var(--tl-fill)]", HALO].join(" "),
      },
      {
        marker: "dot",
        state: "done",
        class: ["[background:var(--tl-strong)]", HALO].join(" "),
      },
      // O atual: o halo dobra e um anel pulsa — `animate-ping`, que o bloco
      // global de movimento reduzido corta (ele isenta só `spin` e `pulse`).
      {
        marker: "dot",
        state: "current",
        class:
          "[background:var(--tl-strong)] [box-shadow:0_0_0_calc(var(--tl-halo)*2)_var(--tl-well)] after:absolute after:inset-0 after:animate-ping after:rounded-full after:bg-(--tl-strong) after:opacity-60",
      },
      // O previsto é vazado: o contorno na cor forte, e nada dentro.
      {
        marker: "dot",
        state: "upcoming",
        class:
          "[background:transparent] [box-shadow:inset_0_0_0_1.5px_var(--tl-strong)]",
      },
      // O ignorado (a cobrança pulada de propósito): o ponto do fio, sem halo.
      {
        marker: "dot",
        state: "skipped",
        class: "[background:var(--color-border)]",
      },

      {
        marker: "icon",
        state: ["none", "done"],
        class: ["[background:var(--tl-well)]", FIO_DO_POCO].join(" "),
      },
      {
        marker: "icon",
        state: "current",
        class:
          "[background:var(--tl-well)] [box-shadow:inset_0_0_0_1px_color-mix(in_oklab,var(--tl-ink)_16%,transparent),0_0_0_2px_var(--tl-strong)]",
      },
      {
        marker: "icon",
        state: "skipped",
        class: "[background:var(--color-muted)] [color:var(--color-muted-foreground)] opacity-60",
      },
      {
        marker: "icon",
        state: "upcoming",
        class:
          "[background:transparent] border border-dashed border-(--tl-strong) [color:var(--color-muted-foreground)]",
      },

      // O avatar é o único sem tom: a cor dele é a identidade da pessoa.
      { marker: "avatar", state: ["upcoming", "skipped"], class: "opacity-60" },
    ],
    defaultVariants: { marker: "dot", state: "none" },
  }
)

/**
 * Um evento.
 * - `state`: `done` (o fio até o vizinho na cor forte), `current` (o anel, e
 *   `aria-current="step"`), `upcoming` (vazado, fio tracejado de e até ele, título
 *   apagado e "Previsto" para o leitor de tela) e `skipped` (o que não aconteceu
 *   de propósito, como a cobrança ignorada: ponto na cor do fio, sem halo).
 * - `density="compact"`: o evento de sistema numa linha só.
 * - `opposite`: a coluna da esquerda do `layout="split"`.
 * - `isLast`: a lista o sabe pelo CSS; passe `false` na lista que segue além do
 *   último item renderizado.
 */
function TimelineItem({
  className,
  tone,
  marker,
  icon,
  avatar,
  isLast,
  state,
  density = "default",
  opposite,
  children,
  ref,
  ...props
}: Omit<
  React.ComponentProps<"li">,
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
> &
  VariantProps<typeof timelineToneVariants> & {
    marker?: TimelineMarker
    /** O glifo do poço. Heroicons — 16/solid até `md`, 20/solid em `lg`. */
    icon?: React.ReactNode
    /** Um `<Avatar>` de quem chama. Vem como nó para não acoplar a camada. */
    avatar?: React.ReactNode
    isLast?: boolean
    state?: TimelineState
    density?: "default" | "compact"
    /** A coluna de data do `layout="split"`. Fora dele, não aparece. */
    opposite?: React.ReactNode
  }) {
  const lista = React.useContext(TimelineContext)
  const reduzir = useReducedMotion()
  const compacto = density === "compact"
  const forma: TimelineMarker = compacto ? "dot" : (marker ?? lista.marker)
  const lado = lista.split && opposite != null ? opposite : null
  const chegada = lista.live && !reduzir

  // O recorte da chegada é só durante o crescer, e só vertical: o crescer é de
  // altura, e `overflow: clip` nos dois eixos apara o halo dos pontos (que passa
  // 3px da calha) de lado durante a abertura. `clip` num eixo e `visible` no outro
  // é válido (não vira rolagem, ao contrário de `hidden`). Quem o tira é o fim da
  // animação, no próprio nó (o `transitionEnd` do motion nunca o aplicou).
  const no = React.useRef<HTMLLIElement | null>(null)
  const refs = React.useCallback(
    (el: HTMLLIElement | null) => {
      no.current = el
      if (typeof ref === "function") ref(el)
      else if (ref) (ref as React.RefObject<HTMLLIElement | null>).current = el
    },
    [ref]
  )

  return (
    <motion.li
      data-slot="timeline-item"
      data-tone={tone ?? "default"}
      data-state={state}
      data-density={compacto ? "compact" : undefined}
      data-end={isLast === undefined ? undefined : String(isLast)}
      aria-current={state === "current" ? "step" : undefined}
      ref={refs}
      initial={chegada ? { height: 0, opacity: 0, overflowY: "clip" } : false}
      animate={chegada ? { height: "auto", opacity: 1 } : undefined}
      exit={chegada ? { height: 0, opacity: 0 } : undefined}
      onAnimationStart={
        chegada
          ? () => {
              if (no.current) no.current.style.overflowY = "clip"
            }
          : undefined
      }
      onAnimationComplete={
        chegada
          ? () => {
              if (no.current) no.current.style.overflowY = ""
            }
          : undefined
      }
      transition={MOLA}
      className={cn(
        "min-w-0 [flex:var(--tl-grow)]",
        lista.split
          ? cn(SPLIT_LINHA, "[column-gap:var(--tl-rail-gap)]")
          : "flex [flex-direction:var(--tl-item-dir)] [gap:var(--tl-rail-gap)]",
        // O fim: o último não estica, não reserva respiro e não desenha conector. Vai por
        // variável, e a exceção (`isLast={false}`) é o `not-data-[end=false]` na mesma
        // regra: um variante só, no mesmo elemento.
        "last:not-data-[end=false]:[--tl-grow:0_0_auto] last:not-data-[end=false]:[--tl-pb:0px] last:not-data-[end=false]:[--tl-conn:none]",
        "data-[end=true]:[--tl-grow:0_0_auto] data-[end=true]:[--tl-pb:0px] data-[end=true]:[--tl-conn:none]",
        // O link esticado (`TimelineLink`) cobre o item a partir daqui.
        "has-[[data-slot=timeline-link]]:relative",
        state === "done" && "[--tl-line-bg:var(--tl-strong)]",
        state === "upcoming" && TRACEJADO,
        TRACEJADO_ATE_PREVISTO,
        compacto &&
          "[--tl-dot:--spacing(1.5)] [--tl-halo:2px] [--tl-lead:calc(var(--text-xs)*1.625)] [--tl-title:var(--text-xs)] [--tl-pb-k:0.5]",
        MEDIDA_DO_MARCADOR[forma],
        timelineToneVariants({ tone }),
        className
      )}
      {...props}
    >
      {/*
         A calha. Largura fixa em `--tl-marker`, `justify-start` e nunca `center`: sem
         conector (o último), `center` centraria o marcador na altura inteira (23,44px
         abaixo do título).
      */}
      <div
        aria-hidden
        data-slot="timeline-rail"
        className={cn(CALHA, lista.split && SPLIT_CALHA)}
      >
        <span
          data-slot="timeline-marker"
          className={cn(
            timelineMarkerVariants({
              marker: forma,
              state: state ?? "none",
            }),
            MARCADOR_OFFSET
          )}
        >
          {forma === "icon" ? icon : forma === "avatar" ? avatar : null}
        </span>
        <span
          data-slot="timeline-connector"
          className={forma === "none" ? CONECTOR_ESPINHA : CONECTOR}
        />
      </div>

      {/*
         O recuo é `calc(medida/2 * centro)`: `var(--tl-marker)` resolve aqui, com a
         medida do marcador deste item. O `translate` é `none` na vertical, porque
         qualquer valor cria bloco de contenção.
      */}
      <div
        data-slot="timeline-content"
        className={cn(
          "min-w-0 [flex:var(--tl-content-grow)] [inline-size:var(--tl-content-w)]",
          "[margin-inline-start:calc(var(--tl-marker)/2*var(--tl-content-center))]",
          "[padding-block-end:calc(var(--tl-pb)*var(--tl-pb-k,1))] [text-align:var(--tl-content-align)]",
          "[translate:var(--tl-content-tx)_0]",
          lista.split && SPLIT_CONTEUDO,
          lado != null && "max-sm:[padding-block-end:0px]",
          compacto &&
            "flex flex-wrap items-baseline gap-x-1.5 [&_[data-slot=timeline-title]]:font-normal [&_[data-slot=timeline-title]]:text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground [&_[data-slot=timeline-time]]:ms-auto [&_[data-slot=timeline-time]]:mt-0",
          (state === "upcoming" || state === "skipped") &&
            "[&_[data-slot=timeline-title]]:text-muted-foreground"
        )}
      >
        {state === "upcoming" ? <span className="sr-only">Previsto: </span> : null}
        {state === "skipped" ? <span className="sr-only">Ignorado: </span> : null}
        {children}
      </div>

      {lado != null ? (
        <Caption
          data-slot="timeline-opposite"
          className={cn(
            SPLIT_LADO,
            "nums mt-(--space-inline) sm:mt-0 sm:leading-(--tl-lead)",
            "max-sm:[padding-block-end:calc(var(--tl-pb)*var(--tl-pb-k,1))]"
          )}
        >
          {lado}
        </Caption>
      ) : null}
    </motion.li>
  )
}

/**
 * A faixa de data ("Hoje", "Ontem", "Março de 2026") com o que resume o dia na
 * ponta (`end`: o total, a contagem). O fio continua através dela, porque a data
 * rotula a cronologia sem interrompê-la; sem traço próprio (regra J).
 * `sticky` a prende no topo enquanto o dia rola, com o rótulo numa pílula
 * flutuante (a placa da casa: `--popover` e o anel de 1px). Por trás da pílula
 * fica um véu da cor da superfície (`--tl-surface`; dentro de um cartão,
 * `[--tl-surface:var(--color-card)]`), cheio até a metade da faixa e se desfazendo
 * numa rampa que passa 20px abaixo dela, e só com a faixa presa
 * (`scroll-state(stuck: top)`). No lugar natural não há véu; onde a consulta não
 * existe, a pílula flutua sem véu. O topo é `--tl-sticky-top`.
 */
function TimelineSeparator({
  className,
  children,
  sticky = false,
  end,
  ...props
}: React.ComponentProps<"li"> & {
  sticky?: boolean
  /** O resumo do dia na ponta da faixa — o total, a contagem. */
  end?: React.ReactNode
}) {
  const { split } = React.useContext(TimelineContext)
  return (
    <li
      data-slot="timeline-separator"
      data-sticky={sticky || undefined}
      className={cn(
        split
          ? cn(SPLIT_LINHA, "[column-gap:var(--tl-rail-gap)]")
          : "flex [flex-direction:var(--tl-item-dir)] [gap:var(--tl-rail-gap)]",
        sticky && "sticky top-(--tl-sticky-top) z-10 [container-type:scroll-state]",
        className
      )}
      {...props}
    >
      {/*
         O véu vem primeiro e é posicionado; a calha e o rótulo, `relative`, pintam por
         cima pela ordem do documento. A rampa tem cinco paradas para não ter quina.
      */}
      {sticky ? (
        <span
          aria-hidden
          data-slot="timeline-separator-veil"
          className="pointer-events-none absolute inset-x-0 top-0 -bottom-5 opacity-0 transition-opacity duration-(--duration-base) ease-(--ease-out) [background:linear-gradient(to_bottom,var(--tl-surface)_50%,color-mix(in_oklab,var(--tl-surface)_80%,transparent)_65%,color-mix(in_oklab,var(--tl-surface)_45%,transparent)_80%,color-mix(in_oklab,var(--tl-surface)_15%,transparent)_92%,transparent)] [@container_scroll-state(stuck:top)]:opacity-100"
        />
      ) : null}
      <div
        aria-hidden
        className={cn(CALHA, "relative", split && "col-start-1 row-start-1 sm:col-start-2")}
      >
        <span className="flex-1 rounded-full bg-border [height:var(--tl-line-h)] [width:var(--tl-line-w)]" />
      </div>
      <div
        className={cn(
          "relative flex min-w-0 flex-1 items-center gap-2 [padding-block:calc(var(--tl-pad)/3)]",
          split && "col-start-2 row-start-1 sm:col-start-1 sm:justify-end"
        )}
      >
        <Caption
          className={cn(
            "min-w-0 truncate font-semibold tracking-wider uppercase",
            sticky &&
              "rounded-full bg-popover px-2 py-0.5 ring-1 ring-foreground/10"
          )}
        >
          {children}
        </Caption>
        {end != null ? (
          <div
            data-slot="timeline-separator-end"
            className="nums ms-auto shrink-0 text-xs text-muted-foreground"
          >
            {end}
          </div>
        ) : null}
      </div>
    </li>
  )
}

/**
 * Um dia (ou um mês) com a faixa e os eventos dele, num contêiner próprio. É o
 * que faz a faixa seguinte empurrar a anterior: um elemento `sticky` só fica
 * preso dentro do pai, e com todas as faixas irmãs elas se sobreporiam no topo.
 * Estrutura: `<li>` com uma `<ol>` dentro (a lista de eventos do dia). O fio
 * atravessa o grupo: o último evento de um grupo que não é o último continua com
 * conector e respiro, porque o fim da trilha é o último evento do último dia. Só
 * na vertical.
 */
function TimelineGroup({
  className,
  label,
  end,
  sticky = false,
  children,
  ...props
}: React.ComponentProps<"li"> & {
  /** O rótulo da faixa — "Hoje", "Ontem", "12 de março". */
  label: React.ReactNode
  /** O resumo do dia na ponta da faixa. */
  end?: React.ReactNode
  /** A faixa presa ao rolar, empurrada pela do grupo seguinte. */
  sticky?: boolean
}) {
  return (
    <li
      data-slot="timeline-group"
      className={cn(
        // O fim do grupo não é o fim da trilha: no grupo com um irmão depois, o último
        // evento volta a ter conector e respiro. O seletor (classe + `:not(:last-child)`
        // + `:last-child`) pesa mais que o `last:not-data-[end=false]:` do item e vence sem `!`.
        "[&:not(:last-child)>ol>li:last-child]:[--tl-conn:block]",
        // O vão entre os grupos mora dentro do grupo: o último evento leva o respiro
        // mais o vão, e o grupo devolve o vão com margem negativa. Senão a caixa do
        // grupo terminaria 12px antes da faixa seguinte e a faixa presa começaria a
        // subir antes de ser tocada.
        "[&:not(:last-child)>ol>li:last-child]:[--tl-pb:calc(var(--tl-pad)+var(--tl-gap))]",
        "not-last:-mb-(--tl-gap)",
        className
      )}
      {...props}
    >
      <ol className="flex flex-col gap-(--tl-gap)">
        <TimelineSeparator sticky={sticky} end={end}>
          {label}
        </TimelineSeparator>
        {children}
      </ol>
    </li>
  )
}

/**
 * Os eventos que não cabem, numa linha só ("8 eventos ocultos · Mostrar"). Os
 * filhos são os itens escondidos; ao mostrar, tomam o lugar da linha, crescem na
 * mola e o foco vai ao primeiro (o botão some, e o foco não pode cair no `<body>`).
 */
function TimelineCollapsed({
  className,
  children,
  label,
  action = "Mostrar",
}: {
  className?: string
  children: React.ReactNode
  /** O texto da linha. Padrão: "N eventos ocultos". */
  label?: (quantos: number) => React.ReactNode
  action?: React.ReactNode
}) {
  const lista = React.useContext(TimelineContext)
  const { split } = lista
  const [aberto, setAberto] = React.useState(false)
  // Os itens que aparecem crescem no lugar (a chegada do feed ao vivo, ligada só para eles).
  const revelados = React.useMemo(() => ({ ...lista, live: true }), [lista])
  const linha = React.useRef<HTMLLIElement>(null)
  const ancora = React.useRef<{ antes: Element | null; pai: Element | null }>({
    antes: null,
    pai: null,
  })
  const quantos = React.Children.toArray(children).length

  React.useEffect(() => {
    if (!aberto) return
    const { antes, pai } = ancora.current
    const alvo = (antes ? antes.nextElementSibling : pai?.firstElementChild) as
      | HTMLElement
      | null
    if (!alvo) return
    alvo.tabIndex = -1
    alvo.focus({ preventScroll: true })
  }, [aberto])

  if (aberto) {
    return (
      <TimelineContext.Provider value={revelados}>{children}</TimelineContext.Provider>
    )
  }

  return (
    <li
      ref={linha}
      data-slot="timeline-collapsed"
      className={cn(
        split
          ? cn(SPLIT_LINHA, "[column-gap:var(--tl-rail-gap)]")
          : "flex [flex-direction:var(--tl-item-dir)] [gap:var(--tl-rail-gap)]",
        TRACEJADO,
        className
      )}
    >
      <div aria-hidden className={cn(CALHA, split && SPLIT_CALHA)}>
        <span className={CONECTOR} />
      </div>
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-2 [padding-block:calc(var(--tl-pad)/3)]",
          split && SPLIT_CONTEUDO
        )}
      >
        <Caption>{label ? label(quantos) : `${quantos} eventos ocultos`}</Caption>
        <Button
          type="button"
          variant="tertiary"
          size="xs"
          onClick={() => {
            ancora.current = {
              antes: linha.current?.previousElementSibling ?? null,
              pai: linha.current?.parentElement ?? null,
            }
            setAberto(true)
          }}
        >
          {action}
        </Button>
      </div>
    </li>
  )
}

/**
 * O fio que se desenha (`progress="scroll"`): um traço da cor do texto por cima
 * dos conectores e por baixo dos marcadores, do centro do primeiro ao do último,
 * que enche conforme a trilha passa pela tela. A caixa é medida (o primeiro e o
 * último marcador), e não deduzida, para servir a calha simples e a do `split`.
 * É um `<li>` porque é filho de `<ol>`, e vem primeiro para não virar o
 * `:last-child` que decide o fim da trilha. Com movimento reduzido, cheio.
 */
function TimelineProgress() {
  const feixe = React.useRef<HTMLLIElement>(null)
  const progresso = useMotionValue(0)
  const reduzir = useReducedMotion()

  React.useLayoutEffect(() => {
    const el = feixe.current
    const ol = el?.parentElement
    if (!el || !ol) return

    const medir = () => {
      const trilhos = ol.querySelectorAll<HTMLElement>(
        // Os eventos de qualquer nível — um `TimelineGroup` os põe numa lista
        // de dentro.
        "[data-slot=timeline-item] > [data-slot=timeline-rail]"
      )
      if (trilhos.length < 2) {
        el.style.display = "none"
        return
      }
      el.style.display = ""
      const base = ol.getBoundingClientRect()
      const centro = (trilho: HTMLElement) => {
        const m = trilho.querySelector<HTMLElement>("[data-slot=timeline-marker]")
        const r = (m && m.offsetHeight > 0 ? m : trilho).getBoundingClientRect()
        return {
          x: r.left + r.width / 2 - base.left,
          y: m && m.offsetHeight > 0 ? r.top + r.height / 2 - base.top : r.top - base.top,
        }
      }
      const a = centro(trilhos[0])
      const b = centro(trilhos[trilhos.length - 1])
      el.style.setProperty("--tl-beam-x", `${a.x}px`)
      el.style.setProperty("--tl-beam-top", `${a.y}px`)
      el.style.setProperty("--tl-beam-h", `${Math.max(0, b.y - a.y)}px`)
    }

    // O andamento é a lista passando pela janela: 0 quando o topo dela chega a 75%
    // da altura, 1 quando o fim chega a 60%. Lê a caixa contra a janela, então serve
    // a página e qualquer contêiner que role (`scroll` não borbulha, mas captura; o
    // `useScroll` do motion pede o contêiner de antemão, que só se sabe depois de montar).
    const andar = () => {
      const r = ol.getBoundingClientRect()
      const inicio = window.innerHeight * 0.75
      const fim = window.innerHeight * 0.6
      const total = r.height + inicio - fim
      progresso.set(Math.min(1, Math.max(0, (inicio - r.top) / total)))
    }

    medir()
    andar()
    const ro = new ResizeObserver(() => {
      medir()
      andar()
    })
    ro.observe(ol)
    const mo = new MutationObserver(medir)
    mo.observe(ol, { childList: true })
    document.addEventListener("scroll", andar, { capture: true, passive: true })
    window.addEventListener("resize", andar)
    return () => {
      ro.disconnect()
      mo.disconnect()
      document.removeEventListener("scroll", andar, { capture: true })
      window.removeEventListener("resize", andar)
    }
  }, [progresso])

  return (
    <motion.li
      ref={feixe}
      aria-hidden
      data-slot="timeline-progress"
      style={{ scaleY: reduzir ? 1 : progresso }}
      className="pointer-events-none absolute z-1 w-px origin-top -translate-x-1/2 rounded-full bg-foreground [height:var(--tl-beam-h,0px)] [left:var(--tl-beam-x,0px)] [top:var(--tl-beam-top,0px)]"
    />
  )
}

/**
 * Título do evento. A entrelinha é declarada, e não herdada: o `text-(length:…)`
 * escreve `line-height` junto e derrubaria o `leading-relaxed` do `P` (o ponto
 * cairia 0,88px fora do centro). O degrau publica `--tl-lead`, e o título e
 * `MARCADOR_OFFSET` leem a mesma fonte.
 */
function TimelineTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <P
      data-slot="timeline-title"
      className={cn(
        "font-medium text-(length:--tl-title) leading-(--tl-lead)",
        className
      )}
      {...props}
    />
  )
}

/**
 * A primeira linha do evento: o título à esquerda (com um `Badge` ao lado, se
 * houver) e a hora ou o valor na ponta, em `end`. Tem a altura do título, então
 * o marcador continua centrado nela.
 */
function TimelineHeader({
  className,
  end,
  children,
  ...props
}: React.ComponentProps<"div"> & { end?: React.ReactNode }) {
  return (
    <div
      data-slot="timeline-header"
      className={cn("flex min-w-0 items-baseline gap-2", className)}
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2">
        {children}
      </div>
      {end != null ? (
        <div className="shrink-0 text-end [&_[data-slot=timeline-time]]:mt-0">
          {end}
        </div>
      ) : null}
    </div>
  )
}

/** Legenda. Com o título, é o mesmo dado em duas linhas: sem `gap`. */
function TimelineDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <Caption data-slot="timeline-description" className={className} {...props} />
  )
}

/**
 * O relógio de um minuto, para o tempo relativo. No servidor (e na hidratação) é
 * `null` e o `<time>` mostra o que a tela escreveu, então o HTML do servidor e o
 * primeiro quadro do cliente batem e o relativo entra em seguida.
 */
function assinarMinuto(avisar: () => void) {
  const id = window.setInterval(avisar, 30_000)
  return () => window.clearInterval(id)
}
// Meio minuto, e não um: o instante é arredondado para baixo, e com um minuto
// inteiro o evento que acabou de chegar ficaria até 60s "no futuro" ("Em 1 min"
// para a compra que entrou agora).
const minutoAtual = () => Math.floor(Date.now() / 30_000) * 30_000
const semRelogio = () => null
const semAssinatura = () => () => {}

/**
 * Carimbo de tempo. Passe `dateTime`: um `<time>` sem ele não é data para máquina
 * nenhuma. `relative` escreve "Há 5 min", "Ontem", "Em 3 dias" a partir do
 * `dateTime` e se atualiza a cada minuto; a data completa vai no `title`. Os
 * filhos são o que aparece antes de o cliente assumir.
 */
function TimelineTime({
  className,
  relative = false,
  dateTime,
  children,
  ...props
}: React.ComponentProps<"time"> & { relative?: boolean }) {
  const agora = React.useSyncExternalStore(
    relative ? assinarMinuto : semAssinatura,
    relative ? minutoAtual : semRelogio,
    semRelogio
  )
  const relativo =
    relative && dateTime && agora != null
      ? formatRelativeTimePtBr(dateTime, agora)
      : null

  return (
    <Caption
      asChild
      data-slot="timeline-time"
      className={cn("nums mt-(--space-inline) block text-2xs", className)}
    >
      <time
        dateTime={dateTime}
        title={relative && dateTime ? formatDateTimeShortPtBr(dateTime) : undefined}
        suppressHydrationWarning={relative || undefined}
        {...props}
      >
        {relativo ?? children}
      </time>
    </Caption>
  )
}

/**
 * As ações do evento ("Pagar", "Ignorar"). O degrau desce aos botões pelo
 * `ButtonSizeContext` (`sm`): nenhuma chamada declara `size` nem `h-7`. Ficam
 * acima do link esticado.
 */
function TimelineActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <ButtonSizeContext.Provider value="sm">
      <div
        data-slot="timeline-actions"
        className={cn("relative z-10 mt-2 flex flex-wrap gap-2", className)}
        {...props}
      />
    </ButtonSizeContext.Provider>
  )
}

/**
 * O conteúdo numa placa (a nota, o comentário, o trecho que mudou). É `muted`, e
 * não um `Card`: um cartão dentro do cartão que hospeda a trilha seria a segunda
 * moldura sem fronteira nova.
 */
function TimelineCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="timeline-card"
      className={cn(
        "mt-2 rounded-lg bg-muted/60 px-3 py-2.5 text-start text-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * O evento que se abre: um gatilho "Detalhes" que troca de rótulo e o conteúdo
 * na mola da divulgação (o `Collapsible`, com a mesma régua).
 */
function TimelineDetail({
  className,
  children,
  label = "Detalhes",
  openLabel = "Ocultar detalhes",
  defaultOpen,
}: {
  className?: string
  children: React.ReactNode
  label?: React.ReactNode
  openLabel?: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      data-slot="timeline-detail"
      className={cn("relative z-10 mt-1", className)}
    >
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="tertiary"
          size="xs"
          className="-ms-2 [&[data-state=open]>svg]:rotate-180"
        >
          <CollapsibleLabel open={openLabel} closed={label} />
          <ChevronDownIcon
            aria-hidden
            className="transition-[rotate] duration-(--duration-base) ease-(--ease-out)"
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * O evento clicável: o título leva o link e o `::after` dele cobre o evento
 * inteiro (o padrão do `CardLink`). O sublinhado acende no cursor e no toque, o
 * anel de foco contorna o evento, e as ações e o detalhe ficam por cima.
 * `asChild` para o `<Link>` do Next.
 */
function TimelineLink({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"a"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "a"
  return (
    <Comp
      data-slot="timeline-link"
      className={cn(
        "decoration-1 underline-offset-4 outline-none hover:underline active:underline",
        "after:absolute after:-inset-x-1.5 after:-inset-y-1 after:rounded-lg after:content-['']",
        "focus-visible:after:outline-2 focus-visible:after:outline-ring/50",
        className
      )}
      {...props}
    />
  )
}

/**
 * A trilha esperando dado: a mesma forma e degrau da lista, com os marcadores
 * pulsando e as linhas em osso. É um `SkeletonGroup` (o leitor de tela ouve o
 * `label`; os ossos são `aria-hidden`).
 */
function TimelineSkeleton({
  className,
  count = 3,
  lines = 2,
  marker = "dot",
  size,
  label = "Carregando histórico",
  group = true,
}: {
  className?: string
  count?: number
  lines?: number
  marker?: TimelineMarker
  size?: VariantProps<typeof timelineVariants>["size"]
  label?: string
  /**
   * `false` dentro de um esqueleto de página que já é um `SkeletonGroup`: duas
   * regiões de status aninhadas seriam dois anúncios (a régua do `TableSkeleton group`).
   */
  group?: boolean
}) {
  const trilha = (
    <Timeline
      marker={marker}
      size={size}
      aria-hidden
      className={cn(
        "[&_[data-slot=timeline-marker]]:animate-pulse",
        group ? undefined : className
      )}
    >
      {Array.from({ length: count }, (_, i) => (
        <TimelineItem key={i}>
          <Skeleton shape="text" className="w-2/5" />
          {lines > 1 ? <SkeletonText lines={lines - 1} /> : null}
        </TimelineItem>
      ))}
    </Timeline>
  )
  return group ? (
    <SkeletonGroup label={label} className={className}>
      {trilha}
    </SkeletonGroup>
  ) : (
    trilha
  )
}

export {
  TIMELINE_TONES,
  Timeline,
  TimelineActions,
  TimelineCard,
  TimelineCollapsed,
  TimelineDescription,
  TimelineDetail,
  TimelineGroup,
  TimelineHeader,
  TimelineItem,
  TimelineLink,
  TimelineSeparator,
  TimelineSkeleton,
  TimelineTime,
  TimelineTitle,
  timelineMarkerVariants,
  timelineToneVariants,
  timelineVariants,
}
export type { TimelineMarker, TimelineState }
