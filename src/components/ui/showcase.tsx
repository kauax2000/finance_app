"use client"

import * as React from "react"

import {
  AnimatePresence,
  LayoutGroup,
  MotionConfig,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionStyle,
  type MotionValue,
  type Transition,
} from "motion/react"

import { Card, CardContent } from "@/components/ui/card"
import {
  DeviceFrame,
  DeviceFrameSkeleton,
  type DeviceFrameForm,
  type DeviceFrameProps,
} from "@/components/ui/device-frame"
import { PresenceCursor, type PresenceCursorFrom, type PresenceCursorTone } from "@/components/ui/presence-cursor"
import { SkeletonGroup } from "@/components/ui/skeleton"
import { deDedo, ehCursor } from "@/lib/pointer"
import { MOLA, MOLA_PALCO, SAIDA } from "@/lib/spring"
import { cn } from "@/lib/utils"

/**
 * # Showcase — o palco decorativo
 *
 * Um campo onde o app se apresenta sozinho: o herói (`ShowcaseHero`, um `DeviceFrame` que muda de forma), a
 * colagem em volta (`ShowcaseScatter`, doze lugares fixos que se afastam do herói), o que flutua à frente
 * (`ShowcaseFloat`, `ShowcaseCursor`), o voo de uma pílula de um lugar ao outro (`ShowcaseFlight`) e a legenda
 * no pé (`ShowcaseCaption` com os `ShowcaseDots`).
 *
 * **É decorativo e acessível.** O palco é `inert` e `aria-hidden`: ninguém o foca, o leitor de tela não o lê,
 * e quem não o vê não perde nada. Dentro dele vale o escopo opaco (`data-opaque`): o vidro pousaria sobre o
 * arco-íris do campo, e ali a placa é sólida.
 *
 * **O tamanho é do palco.** Ele é o container `showcase` (`size`, pela `@utility showcase-stage`), e tudo se
 * mede nele: o herói por `data-form`, a colagem em `%` e `cqw`/`cqh`, os níveis por container query —
 * XS < 28rem (3 cartões), S 28–36rem (6), M 36–48rem (9), L ≥ 48rem (12) — e o palco baixo (`showcase-short`,
 * altura < 44rem), que esconde s5, s6 e s9.
 *
 * **A profundidade é só sombra e ordem**: nada de `scale`, desfoque ou opacidade para afastar um cartão — o
 * selo "exemplo" fica sempre no corpo dele. Os planos: colagem longe e média (`z-0`), o herói (`z-10`), a
 * colagem perto (`z-20`), o que flutua (`z-30`).
 *
 * **O movimento.** `MotionConfig reducedMotion="user"`: com movimento reduzido o layout e os deslocamentos
 * pulam e ficam as opacidades. A paralaxe (`parallax`) só existe com cursor de verdade e com o palco visível e
 * em repouso; nenhum `requestAnimationFrame` — os valores do `motion` agendam os quadros.
 */

type ShowcaseForm = DeviceFrameForm
type ShowcaseDepth = "far" | "mid" | "near"
type ShowcaseEdge = "top" | "end" | "bottom" | "start"
type ShowcaseLevel = "XS" | "S" | "M" | "L"

type ShowcaseSlot = {
  /** O centro do cartão, em % da largura do palco. */
  x: number
  /** O centro do cartão, em % da altura do palco. */
  y: number
  /** A inclinação, em graus. */
  rot: number
  depth: ShowcaseDepth
  /** A borda do palco que corta o cartão; o cartão põe o selo do lado de dentro. */
  edge: ShowcaseEdge
  /** O menor nível em que o lugar aparece. */
  level: ShowcaseLevel
  /** Some no palco baixo (`showcase-short`). */
  short: boolean
  /** Sobe 6cqh quando a legenda existe (os lugares que pousam no pé). */
  caption: boolean
  /** O `--slot-delay` da entrada e do afastamento, em ms. */
  delay: number
}

/** Os doze lugares da colagem (seção 6 do plano do painel), por extenso. */
const SHOWCASE_SLOTS = [
  { x: 84, y: 9, rot: 6, depth: "near", edge: "top", level: "XS", short: false, caption: false, delay: 0 },
  { x: 6, y: 88, rot: -7, depth: "near", edge: "start", level: "XS", short: false, caption: false, delay: 25 },
  { x: 92, y: 86, rot: 4, depth: "mid", edge: "end", level: "XS", short: false, caption: false, delay: 50 },
  { x: 97, y: 40, rot: -5, depth: "far", edge: "end", level: "S", short: false, caption: false, delay: 75 },
  { x: 2, y: 30, rot: 5, depth: "mid", edge: "start", level: "S", short: false, caption: false, delay: 100 },
  { x: 50, y: 97, rot: -2, depth: "far", edge: "bottom", level: "S", short: true, caption: true, delay: 125 },
  { x: 60, y: 4, rot: -4, depth: "mid", edge: "top", level: "M", short: true, caption: false, delay: 150 },
  { x: 3, y: 62, rot: -3, depth: "far", edge: "start", level: "M", short: false, caption: false, delay: 175 },
  { x: 98, y: 66, rot: 7, depth: "mid", edge: "end", level: "M", short: false, caption: false, delay: 200 },
  { x: 30, y: 96, rot: 3, depth: "mid", edge: "bottom", level: "L", short: true, caption: true, delay: 225 },
  { x: 76, y: 98, rot: -6, depth: "far", edge: "bottom", level: "L", short: false, caption: true, delay: 250 },
  { x: 99, y: 14, rot: -8, depth: "far", edge: "end", level: "L", short: false, caption: false, delay: 275 },
] as const satisfies readonly ShowcaseSlot[]

type ShowcaseSlotIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

/** O afastamento da colagem por forma do herói: o centro livre é a caixa do herói mais 8%. */
const AFASTAMENTO: Record<ShowcaseForm, { kx: number; ky: number }> = {
  browser: { kx: 1, ky: 1.12 },
  tablet: { kx: 1.08, ky: 1.06 },
  phone: { kx: 1.14, ky: 1 },
}

/** O nível mínimo de cada lugar, por container query no palco (classe por extenso). */
const NIVEL: Record<ShowcaseLevel, string> = {
  XS: "block",
  S: "hidden @md/showcase:block",
  M: "hidden @xl/showcase:block",
  L: "hidden @3xl/showcase:block",
}

/** A largura do cartão por nível: XS `w-44`, S `w-48`, M e L `w-56`. */
const LARGURA_DO_CARTAO = "w-44 @md/showcase:w-48 @xl/showcase:w-56"

/** A profundidade: a ordem no invólucro de fora, a sombra no cartão (o filho do de dentro). */
const PLANO: Record<ShowcaseDepth, string> = { far: "z-0", mid: "z-0", near: "z-20" }
/** `[&>*]:` e não `*:`: o `*:` compila em `:where()` e perde para a sombra que o próprio cartão declara. */
const SOMBRA: Record<ShowcaseDepth, string> = { far: "[&>*]:shadow-sm", mid: "[&>*]:shadow-md", near: "[&>*]:shadow-lg" }

/** De onde o cartão que troca entra: 8px mais para fora, do lado da borda que o corta. */
const PARA_FORA: Record<ShowcaseEdge, { x: number; y: number }> = {
  top: { x: 0, y: -8 },
  end: { x: 8, y: 0 },
  bottom: { x: 0, y: 8 },
  start: { x: -8, y: 0 },
}

/** A paralaxe: o deslocamento máximo de cada plano, em px, oposto ao ponteiro. */
type Plano = ShowcaseDepth | "hero" | "float"
const PARALAXE: Record<Plano, number> = { far: 2, mid: 4, hero: 6, near: 8, float: 8 }

const SAIDA_COLAGEM: Transition = { duration: 0.16, ease: SAIDA.ease }
/** A pílula fantasma revela o conteúdo antes da cauda da mola (o fim do layout chega em ~830ms). */
const REVELA_O_POUSO_MS = 450
/** O cursor chega em ~400ms na mola; o clique vem depois, e solta em 160ms. */
const CHEGADA_DO_CURSOR_MS = 450
const DURACAO_DO_CLIQUE_MS = 160

type Rect = { x: number; y: number; width: number; height: number }
type Deriva = { x: MotionValue<number>; y: MotionValue<number> }

type ShowcaseContextValue = {
  active: boolean
  /** O palco já passou do primeiro quadro: o que monta depois é destino de um voo, não o ponto inicial. */
  montado: boolean
  settled: boolean
  anchorRect: (id: string) => Rect | null
  setSettled: (settled: boolean) => void
  hero: Rect | null
  heroRef: (el: HTMLElement | null) => (() => void) | undefined
  deriva: Record<Plano, Deriva>
  stageRef: React.RefObject<HTMLDivElement | null>
}

const ShowcaseContext = React.createContext<ShowcaseContextValue | null>(null)

function usePalco(): ShowcaseContextValue {
  const ctx = React.useContext(ShowcaseContext)
  if (!ctx) throw new Error("As peças do Showcase precisam estar dentro de um ShowcaseStage")
  return ctx
}

/**
 * O estado do palco: `active` (o palco está na tela — no telefone o aside é `display: none` e ele nunca fica
 * verdadeiro), `settled` (o herói em repouso, sem troca de forma em voo) e `anchorRect(id)`, a caixa de um
 * `[data-showcase-anchor]` em relação ao palco, no lugar de layout (sem transformações).
 */
function useShowcase(): Pick<ShowcaseContextValue, "active" | "settled" | "anchorRect"> {
  const { active, settled, anchorRect } = usePalco()
  return { active, settled, anchorRect }
}

/** O deslocamento de um plano: a posição normalizada do ponteiro (−1…1) vezes o máximo, no sentido oposto. */
function useDeriva(sx: MotionValue<number>, sy: MotionValue<number>, max: number): Deriva {
  return { x: useTransform(sx, (v) => -v * max), y: useTransform(sy, (v) => -v * max) }
}

const limitar = (v: number) => Math.max(-1, Math.min(1, v))

/**
 * A caixa de um elemento no palco, pela cadeia de `offsetParent` (mais a borda de cada pai): o lugar de layout,
 * sem transformação nenhuma — nem a projeção de uma peça que ainda anda, nem a paralaxe, nem a entrada. A caixa
 * por `getBoundingClientRect` pegaria a peça no meio de um voo. `null` se o elemento não mora no palco.
 */
function caixaNoPalco(alvo: HTMLElement, palco: Element): Rect | null {
  let x = 0
  let y = 0
  let el: HTMLElement = alvo
  while (el !== palco) {
    x += el.offsetLeft
    y += el.offsetTop
    const pai = el.offsetParent as HTMLElement | null
    if (!pai) return null
    if (pai !== palco) {
      x += pai.clientLeft
      y += pai.clientTop
    }
    el = pai
  }
  return { x, y, width: alvo.offsetWidth, height: alvo.offsetHeight }
}

type ShowcaseStageProps = {
  /** A paralaxe no mouse: cada plano se desloca até 2–8px, oposto ao cursor. Desligada por padrão. */
  parallax?: boolean
  className?: string
  children?: React.ReactNode
}

function ShowcaseStage({ parallax = false, className, children }: ShowcaseStageProps) {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const active = useInView(stageRef)
  const reduzido = useReducedMotion() ?? false
  const [settled, setSettled] = React.useState(true)
  const [hero, setHero] = React.useState<Rect | null>(null)
  const [montado, setMontado] = React.useState(false)
  React.useEffect(() => {
    const t = setTimeout(() => setMontado(true), 0)
    return () => clearTimeout(t)
  }, [])

  // A paralaxe: x/y normalizados, a mola da casa e um deslocamento por plano. Nenhum `setState` por evento.
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: MOLA.stiffness, damping: MOLA.damping })
  const sy = useSpring(py, { stiffness: MOLA.stiffness, damping: MOLA.damping })
  const deriva: Record<Plano, Deriva> = {
    far: useDeriva(sx, sy, PARALAXE.far),
    mid: useDeriva(sx, sy, PARALAXE.mid),
    near: useDeriva(sx, sy, PARALAXE.near),
    hero: useDeriva(sx, sy, PARALAXE.hero),
    float: useDeriva(sx, sy, PARALAXE.float),
  }

  // Durante a troca de forma a paralaxe congela: o alvo volta a 0 e o ponteiro é ignorado até o repouso.
  const emRepouso = React.useRef(settled)
  React.useEffect(() => {
    emRepouso.current = settled
    if (!settled) {
      px.set(0)
      py.set(0)
    }
  }, [settled, px, py])

  /**
   * O ouvinte mora no pai **não inerte** do palco (o aside): o palco é `inert`, e o único `pointermove` em
   * `document` montado em repouso é o do brilho da marca. Só cursor de verdade (`ehCursor`), só com
   * `(hover: hover)`, nunca na moldura do iPhone (`deDedo`), nunca com movimento reduzido nem fora da tela.
   */
  React.useEffect(() => {
    const el = stageRef.current
    const pai = el?.parentElement
    const janela = el?.ownerDocument.defaultView
    const ligada =
      parallax && active && !reduzido && el && pai && janela && !deDedo(el) && janela.matchMedia("(hover: hover)").matches
    if (!ligada) {
      px.set(0)
      py.set(0)
      return
    }
    const mover = (e: PointerEvent) => {
      if (!ehCursor(e) || !emRepouso.current) return
      const r = el.getBoundingClientRect()
      px.set(limitar(((e.clientX - r.left) / r.width) * 2 - 1))
      py.set(limitar(((e.clientY - r.top) / r.height) * 2 - 1))
    }
    const sair = () => {
      px.set(0)
      py.set(0)
    }
    pai.addEventListener("pointermove", mover)
    pai.addEventListener("pointerleave", sair)
    return () => {
      pai.removeEventListener("pointermove", mover)
      pai.removeEventListener("pointerleave", sair)
      sair()
    }
  }, [parallax, active, reduzido, px, py])

  /**
   * A caixa do herói, em px no palco, pelo lugar de layout (`caixaNoPalco`): quem flutua se ancora nela. O
   * observador olha o palco e o herói; a leitura vem no callback, nunca no render.
   */
  const heroRef = React.useCallback((el: HTMLElement | null) => {
    // O palco pelo DOM: no primeiro commit a ref do palco (pai) ainda não foi ligada.
    const palco = el?.closest('[data-slot="showcase-stage"]')
    if (!el || !palco) return
    const medir = () => setHero(caixaNoPalco(el, palco))
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    ro.observe(palco)
    return () => ro.disconnect()
  }, [])

  const anchorRect = React.useCallback((id: string): Rect | null => {
    const palco = stageRef.current
    const alvo = palco?.querySelector<HTMLElement>(`[data-showcase-anchor="${CSS.escape(id)}"]`)
    return palco && alvo ? caixaNoPalco(alvo, palco) : null
  }, [])

  const ctx: ShowcaseContextValue = { active, montado, settled, anchorRect, setSettled, hero, heroRef, deriva, stageRef }
  const grupo = React.useId()

  return (
    <ShowcaseContext.Provider value={ctx}>
      <MotionConfig reducedMotion="user">
        <LayoutGroup id={grupo}>
          {/* `layoutRoot`: as projeções de dentro medem em relação ao palco, e a página que anda em volta (um
              aviso que entra em cima) não faz a moldura voar. */}
          <motion.div
            ref={stageRef}
            inert
            aria-hidden
            data-slot="showcase-stage"
            data-opaque=""
            data-active={active || undefined}
            data-settled={settled || undefined}
            className={cn(
              "showcase-stage relative isolate size-full overflow-clip perspective-distant",
              // A legenda levanta os lugares do pé (s5, s9, s10): 6cqh, por CSS, sem esperar a hidratação.
              "has-[[data-slot=showcase-caption]]:[--showcase-caption:1]",
              className
            )}
          >
            {children}
          </motion.div>
        </LayoutGroup>
      </MotionConfig>
    </ShowcaseContext.Provider>
  )
}

type ShowcaseHeroProps = Omit<DeviceFrameProps, "className"> & { className?: string }

/**
 * O herói: o `DeviceFrame` no centro do palco (a 52% da altura), no tamanho que a `@utility showcase-stage`
 * dá por `data-form`. Trocar `form` põe o palco fora do repouso até a moldura assentar (`onSettled`).
 */
function ShowcaseHero({ form, onSettled, className, children, ...frame }: ShowcaseHeroProps) {
  const { setSettled, deriva, heroRef } = usePalco()
  // A forma em que a moldura já assentou: no movimento reduzido o `onSettled` vem antes deste efeito.
  const assentou = React.useRef<DeviceFrameForm | null>(form)
  React.useLayoutEffect(() => {
    if (assentou.current !== form) setSettled(false)
  }, [form, setSettled])

  return (
    // O centro a 52% da altura é a caixa de 4% até o pé, centrando pelo flex: um lugar de layout, que as
    // medidas por `offset*` leem (um `-translate-1/2` elas não veriam).
    <motion.div
      data-slot="showcase-hero-point"
      className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center showcase-enter"
      style={{ top: "4%", x: deriva.hero.x, y: deriva.hero.y, "--slot-delay": "120ms" } as MotionStyle}
    >
      <div
        ref={heroRef}
        data-slot="showcase-hero"
        data-form={form}
        className={cn("min-h-0 min-w-0 shrink-0 perspective-distant", className)}
      >
        <DeviceFrame
          form={form}
          {...frame}
          onSettled={() => {
            assentou.current = form
            setSettled(true)
            onSettled?.()
          }}
        >
          {children}
        </DeviceFrame>
      </div>
    </motion.div>
  )
}

type ShowcaseScatterContextValue = { ripple: boolean }
const ShowcaseScatterContext = React.createContext<ShowcaseScatterContextValue>({ ripple: false })

/**
 * A colagem: o plano dos cartões em volta do herói. `clear` é a forma do herói, e o afastamento acompanha
 * (navegador `kx 1,00 / ky 1,12`, tablet `1,08 / 1,06`, celular `1,14 / 1,00`), na mola de CSS, cada lugar no
 * seu atraso. `ripple` faz a colagem respirar uma vez.
 */
function ShowcaseScatter({
  clear,
  ripple = false,
  className,
  children,
}: {
  clear: ShowcaseForm
  ripple?: boolean
  className?: string
  children?: React.ReactNode
}) {
  const k = AFASTAMENTO[clear]
  return (
    <ShowcaseScatterContext.Provider value={{ ripple }}>
      <div
        data-slot="showcase-scatter"
        data-clear={clear}
        className={cn("pointer-events-none absolute inset-0", className)}
        style={{ "--clear-kx": k.kx, "--clear-ky": k.ky } as React.CSSProperties}
      >
        {children}
      </div>
    </ShowcaseScatterContext.Provider>
  )
}

/**
 * Um lugar da colagem. O invólucro **de fora** é o ponto: a posição do lugar, o afastamento (`translate` em
 * `cqw`/`cqh`), a entrada `showcase-enter` no `--slot-delay`, a ordem e a paralaxe. O **de dentro** centra o
 * cartão, inclina e respira; trocar `itemKey` tira o cartão velho e entra o novo de 8px mais para fora.
 * Publica `data-edge` para o cartão pôr o selo do lado de dentro.
 */
function ShowcaseScatterItem({
  slot,
  itemKey,
  className,
  children,
}: {
  slot: ShowcaseSlotIndex
  itemKey: React.Key
  className?: string
  children?: React.ReactNode
}) {
  const palco = usePalco()
  const { ripple } = React.useContext(ShowcaseScatterContext)
  const s: ShowcaseSlot = SHOWCASE_SLOTS[slot]
  const fora = PARA_FORA[s.edge]
  const deriva = palco.deriva[s.depth]
  return (
    <motion.div
      data-slot="showcase-scatter-item"
      data-showcase-slot={slot}
      data-edge={s.edge}
      data-depth={s.depth}
      className={cn(
        "group/showcase-item absolute showcase-enter",
        "transition-[translate] duration-(--duration-spring) ease-(--ease-spring) delay-(--slot-delay)",
        NIVEL[s.level],
        s.short && "showcase-short:hidden",
        PLANO[s.depth],
        className
      )}
      style={
        {
          left: `${s.x}%`,
          top: s.caption ? `calc(${s.y}% - 6cqh * var(--showcase-caption, 0))` : `${s.y}%`,
          "--slot-x": s.x,
          "--slot-y": s.y,
          "--slot-delay": `${s.delay}ms`,
          translate:
            "calc((var(--slot-x) - 50) * (var(--clear-kx, 1) - 1) * 1cqw) calc((var(--slot-y) - 50) * (var(--clear-ky, 1) - 1) * 1cqh)",
          x: deriva.x,
          y: deriva.y,
        } as MotionStyle
      }
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={itemKey}
          data-slot="showcase-scatter-card"
          initial={{ opacity: 0, x: fora.x, y: fora.y, rotate: s.rot }}
          animate={{
            opacity: 1,
            x: 0,
            y: 0,
            rotate: s.rot,
            transition: { ...MOLA, delay: 0.2 + Math.min(s.delay, 200) / 1000 },
          }}
          exit={{ opacity: 0, rotate: s.rot + 2, scale: 0.97, transition: SAIDA_COLAGEM }}
          className={cn("absolute top-0 left-0 -translate-1/2", LARGURA_DO_CARTAO, SOMBRA[s.depth], ripple && "showcase-ripple")}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

type ShowcaseFloatAnchor = "center" | "top-start" | "top-end" | "start" | "end" | "bottom-start" | "bottom-end" | "hero-bottom"

/**
 * O ponto do herói onde a peça flutuante pousa, em frações da caixa dele: o centro do chip, ou o topo da paleta
 * (`center`) — a paleta cresce para baixo enquanto as linhas entram, e com o centro preso a pílula subiria no
 * meio do voo.
 */
const PONTO_DO_HEROI: Record<ShowcaseFloatAnchor, readonly [number, number]> = {
  center: [0.5, 0.58],
  "top-start": [0, 0.12],
  "top-end": [1, 0.12],
  start: [0, 0.5],
  end: [1, 0.5],
  "bottom-start": [0, 0.88],
  "bottom-end": [1, 0.88],
  "hero-bottom": [0.5, 1],
}

/**
 * O que flutua à frente do herói (`z-30`): a paleta (`center`, o topo a 58% da altura dele, com 80% da largura e no
 * máximo 28rem) ou um chip sobre a borda (as outras âncoras; escondido no nível XS). Entra na mola (opacidade
 * e 8px) e sai em 150ms; `open` decide, e o primeiro quadro já nasce no lugar.
 */
function ShowcaseFloat({
  anchor,
  open = true,
  layoutId,
  className,
  children,
}: {
  anchor: ShowcaseFloatAnchor
  open?: boolean
  /** O mesmo chip em duas cenas não se move na troca (`layoutId`). */
  layoutId?: string
  className?: string
  children?: React.ReactNode
}) {
  const palco = usePalco()
  const hero = palco.hero
  const [fx, fy] = PONTO_DO_HEROI[anchor]
  return (
    <AnimatePresence initial={false}>
      {open && hero ? (
        <motion.div
          key="float"
          data-slot="showcase-float"
          data-anchor={anchor}
          className={cn("pointer-events-none absolute z-30", anchor !== "center" && "@max-md/showcase:hidden")}
          style={{
            left: hero.x + hero.width * fx,
            top: hero.y + hero.height * fy,
            x: palco.deriva.float.x,
            y: palco.deriva.float.y,
          }}
        >
          <motion.div
            layoutId={layoutId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: MOLA }}
            exit={{ opacity: 0, transition: SAIDA }}
            className={cn(
              "absolute top-0 left-0",
              anchor === "center" ? "-translate-x-1/2" : "w-max -translate-1/2",
              className
            )}
            style={anchor === "center" ? { width: `min(${hero.width * 0.8}px, 28rem)` } : undefined}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

/** O raio da caixa em px, com teto na metade da altura (`rounded-full` resolve num número enorme). */
const raioDaCaixa = (el: HTMLElement) =>
  `${Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, el.offsetHeight / 2)}px`

/**
 * Um ponto de pouso do voo de uma pílula. Os pontos com o mesmo `layoutId` dividem um fantasma opaco, sem
 * texto: só o ponto `active` o desenha, e a projeção o leva do ponto anterior até aqui (`MOLA_PALCO`). O
 * conteúdo real do ponto inativo fica transparente (o lugar continua ocupado); o do ativo aparece aos 450ms,
 * antes da cauda da mola, e o fantasma se apaga junto. O texto nunca estica.
 */
function ShowcaseFlight({
  layoutId,
  active,
  className,
  children,
}: {
  layoutId: string
  active: boolean
  /** A forma da pílula (`rounded-full`): o raio do fantasma sai dela, em px. */
  className?: string
  children?: React.ReactNode
}) {
  const reduzido = useReducedMotion() ?? false
  const { montado } = usePalco()
  // Pousado só o ponto ativo que nasce com o palco (o ponto inicial da página, o quadro do servidor); quem fica
  // ativo depois — ou monta já ativo, como a paleta que abre — é destino de um voo e ainda não pousou.
  const [pousou, setPousou] = React.useState(() => active && !montado)
  const [ativoAntes, setAtivoAntes] = React.useState(active)
  if (active !== ativoAntes) {
    setAtivoAntes(active)
    setPousou(false)
  }
  React.useEffect(() => {
    if (!active || pousou) return
    const t = setTimeout(() => setPousou(true), reduzido ? 0 : REVELA_O_POUSO_MS)
    return () => clearTimeout(t)
  }, [active, pousou, reduzido])

  const raio = useMotionValue("")
  const caixaRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return
      const ro = new ResizeObserver(() => raio.set(raioDaCaixa(el)))
      ro.observe(el)
      return () => ro.disconnect()
    },
    [raio]
  )

  const visivel = active && pousou
  return (
    <div
      ref={caixaRef}
      data-slot="showcase-flight"
      data-active={active || undefined}
      data-landed={visivel || undefined}
      className={cn("relative", className)}
    >
      {active ? (
        <motion.div
          layoutId={layoutId}
          aria-hidden
          data-slot="showcase-flight-ghost"
          transition={{ layout: MOLA_PALCO }}
          style={{ borderRadius: raio }}
          className={cn(
            // O `motion` pode deixar a opacidade em linha depois do voo; a visibilidade, discreta, some no fim dos
            // 150ms em que o conteúdo aparece, e o fantasma não fica por baixo da pílula pousada.
            "pointer-events-none absolute inset-0 bg-popover ring-1 ring-foreground/10 transition-[opacity,visibility] duration-(--duration-fast)",
            visivel ? "invisible opacity-0" : "visible opacity-100"
          )}
        />
      ) : null}
      <div
        data-slot="showcase-flight-content"
        className={cn("relative transition-opacity duration-(--duration-fast)", visivel ? "opacity-100" : "opacity-0")}
      >
        {children}
      </div>
    </div>
  )
}

/** Uma peça da mini UI que só translada na troca de forma (`layout="position"`): o texto nunca estica. */
function ShowcasePiece({ className, ...props }: React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      layout="position"
      transition={{ layout: MOLA_PALCO }}
      data-slot="showcase-piece"
      className={className}
      {...props}
    />
  )
}

/**
 * O que existe numa forma ou numa cena só: trocar `swapKey` tira o velho em 150ms e entra o novo na mola
 * (`rise` sobe 8px; `fade` só aparece). `popLayout`: o que sai não ocupa lugar — o pai precisa ser posicionado.
 */
function ShowcaseSwap({
  swapKey,
  effect = "fade",
  className,
  children,
}: {
  swapKey: React.Key
  effect?: "fade" | "rise"
  className?: string
  children?: React.ReactNode
}) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={swapKey}
        data-slot="showcase-swap"
        data-effect={effect}
        initial={{ opacity: 0, y: effect === "rise" ? 8 : 0 }}
        animate={{ opacity: 1, y: 0, transition: { y: MOLA, opacity: { duration: 0.2, ease: SAIDA.ease } } }}
        exit={{ opacity: 0, transition: SAIDA }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Um cursor de outra pessoa que acha o alvo: mede o `[data-showcase-anchor]` em relação ao palco depois do
 * repouso e a cada mudança de tamanho do palco, e pousa um `PresenceCursor` no centro dele, na camada que
 * flutua. Entra depois de `delay` (só com o palco na tela), pela borda `from`; `click` aperta ao chegar. Anda
 * com o herói na paralaxe, para nunca errar o alvo. Para sair em 150ms, quem o tira embrulha num
 * `AnimatePresence`.
 */
function ShowcaseCursor({
  name,
  tone,
  anchor,
  from,
  delay = 0,
  click = false,
}: {
  name: string
  tone: PresenceCursorTone
  anchor: string
  from?: PresenceCursorFrom
  delay?: number
  click?: boolean
}) {
  const palco = usePalco()
  const { active, settled, anchorRect, stageRef, deriva } = palco
  const reduzido = useReducedMotion() ?? false
  const [at, setAt] = React.useState<{ x: number; y: number } | null>(null)
  const [visivel, setVisivel] = React.useState(false)
  const [pressed, setPressed] = React.useState(false)

  // A medida, no lugar de layout (sem a paralaxe, que o cursor soma de novo por andar com o herói): o observador
  // dispara ao observar e a cada mudança de tamanho do palco e do alvo (uma fonte que chega); refaz ao assentar.
  React.useEffect(() => {
    const el = stageRef.current
    if (!el || !settled) return
    const ro = new ResizeObserver(() => {
      const r = anchorRect(anchor)
      if (r) setAt({ x: r.x + r.width / 2, y: r.y + r.height / 2 })
    })
    ro.observe(el)
    const alvo = el.querySelector(`[data-showcase-anchor="${CSS.escape(anchor)}"]`)
    if (alvo) ro.observe(alvo)
    return () => ro.disconnect()
  }, [settled, anchor, anchorRect, stageRef])

  const medido = at !== null
  React.useEffect(() => {
    if (!active || !medido) return
    const t = setTimeout(() => setVisivel(true), reduzido ? 0 : delay)
    return () => clearTimeout(t)
  }, [active, medido, delay, reduzido])

  React.useEffect(() => {
    if (!visivel || !click || reduzido) return
    const aperta = setTimeout(() => setPressed(true), CHEGADA_DO_CURSOR_MS)
    const solta = setTimeout(() => setPressed(false), CHEGADA_DO_CURSOR_MS + DURACAO_DO_CLIQUE_MS)
    return () => {
      clearTimeout(aperta)
      clearTimeout(solta)
    }
  }, [visivel, click, reduzido])

  if (!visivel || !at) return null
  return (
    <motion.div
      data-slot="showcase-cursor"
      data-anchor={anchor}
      exit={{ opacity: 0, transition: SAIDA }}
      className="pointer-events-none absolute inset-0 z-30"
      style={{ x: deriva.hero.x, y: deriva.hero.y }}
    >
      <PresenceCursor name={name} tone={tone} at={at} from={from} pressed={pressed} />
    </motion.div>
  )
}

/**
 * Os capítulos: `count` pontos (`bg-current/40`, sem texto), o ativo vira uma pílula que viaja entre os
 * lugares (`layoutId`) e se preenche até `fill` (0–1), mudando de largura. Os lugares têm a largura da pílula,
 * para nada empurrar o vizinho.
 */
function ShowcaseDots({
  count,
  active,
  fill = 1,
  className,
}: {
  count: number
  active: number
  fill?: number
  className?: string
}) {
  const id = React.useId()
  return (
    <div data-slot="showcase-dots" aria-hidden className={cn("flex shrink-0 items-center", className)}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          data-slot="showcase-dot"
          data-active={i === active || undefined}
          className="relative flex h-1.5 w-6 items-center justify-center"
        >
          {i === active ? (
            <motion.span
              layoutId={`${id}-dot`}
              transition={{ layout: MOLA }}
              className="absolute inset-0 overflow-hidden rounded-full bg-current/25"
            >
              <motion.span
                data-slot="showcase-dot-fill"
                initial={false}
                animate={{ width: `${Math.max(0, Math.min(1, fill)) * 100}%` }}
                transition={MOLA}
                className="absolute inset-y-0 start-0 rounded-full bg-current"
              />
            </motion.span>
          ) : (
            <span className="size-1.5 rounded-full bg-current/40" />
          )}
        </span>
      ))}
    </div>
  )
}

/**
 * A legenda da cena: um cartão no pé do palco, à esquerda, com o título e a descrição (sans) e os pontos à
 * direita (`dots`). Trocar o título troca o texto subindo, com o cartão parado. No nível XS a descrição some.
 * Os lugares da colagem que pousam no pé (s5, s9, s10) sobem 6cqh enquanto ela existe.
 */
function ShowcaseCaption({
  title,
  description,
  dots,
  className,
}: {
  title: string
  description?: string
  /** Os capítulos, à direita: um `ShowcaseDots`. */
  dots?: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="showcase-caption"
      className={cn("absolute start-4 bottom-4 z-30 max-w-[calc(100%-2rem)] showcase-enter", className)}
      style={{ "--slot-delay": "300ms" } as React.CSSProperties}
    >
      <Card variant="elevated" padding="sm">
        <CardContent className="flex items-center gap-4">
          <div className="relative min-w-0">
            <ShowcaseSwap swapKey={title} effect="rise">
              <p data-slot="showcase-caption-title" className="text-sm font-medium">
                {title}
              </p>
              {description ? (
                <p data-slot="showcase-caption-description" className="text-xs text-muted-foreground @max-md/showcase:hidden">
                  {description}
                </p>
              ) : null}
            </ShowcaseSwap>
          </div>
          {dots}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * O palco esperando: o herói na forma, em ossos (`DeviceFrameSkeleton`), no mesmo lugar e tamanho, sem colagem
 * nem flutuantes. `group={false}` dentro de um esqueleto de página.
 */
function ShowcaseSkeleton({
  form = "browser",
  group = true,
  className,
}: {
  form?: ShowcaseForm
  group?: boolean
  className?: string
}) {
  const ossos = (
    <div data-slot="showcase-skeleton" className={cn("showcase-stage relative isolate size-full overflow-clip", className)}>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center" style={{ top: "4%" }}>
        <div data-slot="showcase-hero" data-form={form} className="min-h-0 min-w-0 shrink-0">
          <DeviceFrameSkeleton form={form} group={false} />
        </div>
      </div>
    </div>
  )
  return group ? (
    <SkeletonGroup label="Carregando a prévia…" className="size-full">
      {ossos}
    </SkeletonGroup>
  ) : (
    ossos
  )
}

export {
  SHOWCASE_SLOTS,
  ShowcaseCaption,
  ShowcaseCursor,
  ShowcaseDots,
  ShowcaseFlight,
  ShowcaseFloat,
  ShowcaseHero,
  ShowcasePiece,
  ShowcaseScatter,
  ShowcaseScatterItem,
  ShowcaseSkeleton,
  ShowcaseStage,
  ShowcaseSwap,
  useShowcase,
}
export type {
  ShowcaseDepth,
  ShowcaseEdge,
  ShowcaseFloatAnchor,
  ShowcaseForm,
  ShowcaseLevel,
  ShowcaseSlot,
  ShowcaseSlotIndex,
  ShowcaseStageProps,
}
