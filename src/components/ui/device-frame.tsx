"use client"

import * as React from "react"

import { Battery100Icon, LockClosedIcon, SignalIcon, WifiIcon } from "@heroicons/react/16/solid"
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type Transition,
} from "motion/react"

import { Skeleton, SkeletonGroup, SkeletonText } from "@/components/ui/skeleton"
import { MOLA, MOLA_PALCO, SAIDA } from "@/lib/spring"
import { cn } from "@/lib/utils"
import type { HeroIcon } from "@/types/navigation"

/**
 * # DeviceFrame — uma moldura que muda de forma
 *
 * Um aparelho desenhado só com tokens: `browser` (a janela com as bolinhas e a barra de endereço), `tablet`
 * (moldura grossa, barra de status fina) e `phone` (moldura fina, ilha, barra de abas). A moldura é **uma só**:
 * trocar `form` não remonta nada; a projeção de layout do `motion` anima a caixa (nunca `scale()`), a barra de
 * endereço vira a ilha, o trilho vira a barra de abas, e a moldura gira até 6° no caminho.
 *
 * **O tamanho.** Dentro do palco (`[data-slot="showcase-hero"]`, que a `@utility showcase-stage` mede por
 * `data-form`) a moldura preenche o herói. Fora dele ela tem tamanho próprio, por forma: `browser` ocupa a
 * largura até 576px (`max-w-xl`) em 16/10; `tablet` tem 384px de altura (`h-96`) em 3/4; `phone`, 480px
 * (`h-120`) em 9/19,5. A projeção anima a troca de tamanho nos dois casos.
 *
 * **O raio** vem dos tokens, lido por sondas (`<span hidden>` com `rounded-surface`, `rounded-modal` e
 * `concentric`), e é aplicado em `style.borderRadius` em px: é o valor que o `motion` corrige durante a
 * projeção — com o raio só na classe, o canto deformaria em elipse no voo. O raio também anima
 * explicitamente, senão salta para o degrau novo no primeiro quadro. Nenhum número de raio mora aqui.
 *
 * **A tinta.** O `brand-field` herda texto quase branco; por isso toda superfície desenhada declara a própria
 * (`text-foreground` na tela, na barra de status e no aviso; `text-muted-foreground` na barra do navegador).
 */

type DeviceFrameForm = "browser" | "tablet" | "phone"

type DeviceFrameNavItem = {
  /** O ícone, do `20/solid` (desenhado a 20px). */
  icon: HeroIcon
  /** A aba da tela atual: ganha a pílula e a tinta cheia. */
  active?: boolean
}

type DeviceFrameContextValue = { form: DeviceFrameForm; transition: Transition }

const DeviceFrameContext = React.createContext<DeviceFrameContextValue | null>(null)

/** A forma da moldura, para a tela reorganizar a mini UI (em vez de ler uma container query). */
function useDeviceFrame(): { form: DeviceFrameForm } {
  const ctx = React.useContext(DeviceFrameContext)
  if (!ctx) throw new Error("useDeviceFrame precisa estar dentro de um DeviceFrame")
  return { form: ctx.form }
}

/**
 * A caixa de cada forma, por extenso. Fora do palco o tamanho é este; dentro do herói o `in-data-[slot=
 * showcase-hero]` desliga a medida própria e a moldura preenche quem a mede. Cada forma publica o pai e o
 * recuo do `concentric` da tela.
 */
const FORMA: Record<DeviceFrameForm, string> = {
  browser:
    "w-full max-w-xl aspect-16/10 rounded-surface bg-background ring-1 ring-border [--radius-parent:var(--radius-surface)] [--radius-inset:--spacing(0)]",
  tablet:
    "h-96 aspect-3/4 rounded-modal bg-(--device-bezel) p-2 ring-1 ring-(--device-bezel-edge) [--radius-parent:var(--radius-modal)] [--radius-inset:--spacing(2)]",
  phone:
    "h-120 aspect-18/39 rounded-modal bg-(--device-bezel) p-1.5 ring-1 ring-(--device-bezel-edge) [--radius-parent:var(--radius-modal)] [--radius-inset:--spacing(1.5)]",
}

/**
 * `transition-none`: quem anima a caixa é a projeção. Sem isso, o bloco global de movimento reduzido (0,01ms
 * em `all`) transiciona o `aspect-ratio` e a moldura pisca um quadro na proporção velha.
 */
const FRAME_BASE =
  "relative isolate min-h-0 min-w-0 shrink-0 shadow-xl transition-none in-data-[slot=showcase-hero]:size-full in-data-[slot=showcase-hero]:max-w-none in-data-[slot=showcase-hero]:aspect-auto"

/** A tela: a superfície do app, com a própria tinta, recortada no raio concêntrico ao da moldura. */
const SCREEN_BASE =
  "@container/screen concentric relative flex size-full flex-col overflow-hidden bg-background text-foreground"

/** A caixa da barra de endereço, da ilha e do aviso — o mesmo elemento nas três. */
const ILHA = {
  url: "top-1.5 h-6 w-1/2 rounded-full",
  island: "top-2 h-5 w-1/3 rounded-full",
  card: "top-2 inset-x-2 w-auto rounded-surface shadow-lg ring-1 ring-foreground/10",
} as const

type IlhaEstado = keyof typeof ILHA

/** A barra de status entra a partir de 40% da troca (~0,65s). */
const ENTRADA_STATUS = 0.65 * 0.4
const SAIDA_BOLINHAS: Transition = { duration: 0.12, ease: SAIDA.ease }
const TROCA_OPACIDADE: Transition = { duration: 0.2, ease: SAIDA.ease }
/** Movimento reduzido: o layout e o giro pulam; ficam as opacidades. */
const INSTANTANEO: Transition = { duration: 0 }

/** O raio resolvido de uma sonda, em px (`"22px"`). */
const raioDe = (el: Element | null) => (el ? getComputedStyle(el).borderTopLeftRadius : "")

/** A ilha é pílula (metade da própria altura) ou cartão (a sonda `rounded-surface`), em px como a moldura. */
const raioDaIlha = (el: HTMLElement, sondaSurface: Element | null) =>
  el.dataset.state === "card" ? raioDe(sondaSurface) : `${el.offsetHeight / 2}px`

function DeviceFrameScreen({
  className,
  ...props
}: React.ComponentProps<typeof motion.div>) {
  const ctx = React.useContext(DeviceFrameContext)
  return (
    <motion.div
      layout
      data-slot="device-frame-screen"
      data-form={ctx?.form}
      transition={ctx ? { layout: ctx.transition } : undefined}
      className={cn(SCREEN_BASE, className)}
      {...props}
    />
  )
}

type DeviceFrameProps = {
  /** A forma do aparelho. Trocar anima: a caixa, o raio, a barra ↔ ilha, o trilho ↔ abas e o giro. */
  form: DeviceFrameForm
  /** O endereço da barra do navegador — breadcrumb, nunca domínio ("Finance › Painel"). */
  url?: string
  /** O aviso: no celular a ilha se abre num cartão; no navegador e no tablet, um cartão no canto da tela. */
  notification?: React.ReactNode
  /** A navegação: trilho à esquerda no navegador e no tablet, barra de abas no celular. */
  nav?: DeviceFrameNavItem[]
  /** O sentido do giro na troca: 1 gira para −6°, −1 para +6°. Quem decide é o palco (a ordem das cenas). */
  turn?: 1 | -1
  /** Dispara ao montar e quando uma troca de forma assenta (a moldura em repouso). */
  onSettled?: () => void
  className?: string
  /** A tela. */
  children?: React.ReactNode
}

function DeviceFrame({
  form,
  url,
  notification,
  nav,
  turn = 1,
  onSettled,
  className,
  children,
}: DeviceFrameProps) {
  const reduced = useReducedMotion() ?? false
  const uid = React.useId()

  // A troca em voo: nasce no render em que `form` muda e acaba quando a projeção assenta.
  const [formAnterior, setFormAnterior] = React.useState(form)
  const [emTroca, setEmTroca] = React.useState(false)
  if (form !== formAnterior) {
    setFormAnterior(form)
    setEmTroca(!reduced)
  }

  const sondaSurface = React.useRef<HTMLSpanElement>(null)
  const sondaModal = React.useRef<HTMLSpanElement>(null)
  const sondaTela = React.useRef<HTMLSpanElement>(null)

  // Vazios até a primeira leitura: até lá vale a classe (`rounded-*`, `concentric`), igual no servidor.
  const raio = useMotionValue("")
  const raioTela = useMotionValue("")
  const raioIlha = useMotionValue("")
  const giro = useMotionValue(0)

  const transition: Transition = reduced ? INSTANTANEO : MOLA_PALCO
  const ctx = React.useMemo(() => ({ form, transition }), [form, transition])

  /**
   * A leitura em repouso: ao montar e a cada mudança de caixa (a folha de estilo que chega depois, como no
   * iframe do `IphoneFrame`, o palco que redimensiona). Durante a troca quem escreve é a animação.
   */
  const quadroRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return
      const ro = new ResizeObserver(() => {
        if (raio.isAnimating()) return
        raio.set(raioDe(el.dataset.form === "browser" ? sondaSurface.current : sondaModal.current))
        raioTela.set(raioDe(sondaTela.current))
      })
      ro.observe(el)
      return () => ro.disconnect()
    },
    [raio, raioTela]
  )

  const avisarRepouso = React.useEffectEvent(() => onSettled?.())
  // A forma já tratada: o `StrictMode` roda o efeito duas vezes na montagem, e a segunda não é uma troca.
  const formVisto = React.useRef<DeviceFrameForm | null>(null)

  // A troca: o raio anima da forma velha para a nova, na mola da projeção, e a moldura gira.
  React.useLayoutEffect(() => {
    if (formVisto.current === form) return
    const primeira = formVisto.current === null
    formVisto.current = form
    if (primeira) {
      avisarRepouso()
      return
    }
    const alvo = raioDe(form === "browser" ? sondaSurface.current : sondaModal.current)
    const alvoTela = raioDe(sondaTela.current)
    // Sem leitura anterior (o observador ainda não rodou) não há de onde animar.
    if (reduced || !raio.get()) {
      raio.set(alvo)
      raioTela.set(alvoTela)
      if (reduced) avisarRepouso()
      return
    }
    animate(raio, alvo, MOLA_PALCO)
    animate(raioTela, alvoTela, MOLA_PALCO)
    // Três quadros não cabem numa mola no motion 13: o giro é uma curva de 0,65s, a duração da mola do palco.
    animate(giro, [0, -6 * turn, 0], { duration: 0.65, ease: "easeInOut" })
    // `turn` e `reduced` são lidos no instante da troca; a troca é que dispara.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form])

  const temIlha = form === "phone" || (form === "browser" && url != null)
  const ilhaEstado: IlhaEstado = form === "browser" ? "url" : notification != null ? "card" : "island"
  const ilhaAnterior = React.useRef<{ el: HTMLDivElement | null; form: DeviceFrameForm; estado: IlhaEstado }>({
    el: null,
    form,
    estado: ilhaEstado,
  })

  const ilhaEl = React.useRef<HTMLDivElement>(null)
  const ilhaRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      ilhaEl.current = el
      if (!el) return
      const ro = new ResizeObserver(() => {
        if (!raioIlha.isAnimating()) raioIlha.set(raioDaIlha(el, sondaSurface.current))
      })
      ro.observe(el)
      return () => ro.disconnect()
    },
    [raioIlha]
  )

  React.useLayoutEffect(() => {
    const el = ilhaEl.current
    const anterior = ilhaAnterior.current
    ilhaAnterior.current = { el, form, estado: ilhaEstado }
    // A ilha que acabou de montar é lida pelo observador; aqui só anima a que já estava e mudou.
    if (!el || anterior.el !== el) return
    if (anterior.form === form && anterior.estado === ilhaEstado) return
    const alvo = raioDaIlha(el, sondaSurface.current)
    if (reduced || !raioIlha.get()) raioIlha.set(alvo)
    else animate(raioIlha, alvo, anterior.form !== form ? MOLA_PALCO : MOLA)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ilhaEstado, temIlha, form])

  const navItens = nav?.length
    ? nav.map(({ icon: Icon, active }, i) => (
        <motion.span
          key={i}
          layout="position"
          layoutId={`${uid}-nav-${i}`}
          transition={{ layout: transition }}
          data-slot="device-frame-nav-item"
          data-active={active || undefined}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            active ? "bg-muted text-foreground" : "text-muted-foreground"
          )}
        >
          <Icon aria-hidden className="size-5" />
        </motion.span>
      ))
    : null

  const saida: Transition = reduced ? INSTANTANEO : SAIDA

  return (
    <DeviceFrameContext.Provider value={ctx}>
      <motion.div
        ref={quadroRef}
        layout
        data-slot="device-frame"
        data-form={form}
        data-turning={emTroca || undefined}
        transition={{ layout: transition }}
        onLayoutAnimationComplete={() => {
          if (!emTroca) return
          setEmTroca(false)
          onSettled?.()
        }}
        style={{ borderRadius: raio, rotateY: giro }}
        className={cn(FRAME_BASE, FORMA[form], emTroca && "will-change-transform", className)}
      >
        {/* As sondas: o raio dos tokens, resolvido em px pelo navegador. */}
        <span hidden ref={sondaSurface} data-slot="device-frame-probe" className="rounded-surface" />
        <span hidden ref={sondaModal} data-slot="device-frame-probe" className="rounded-modal" />
        <span hidden ref={sondaTela} data-slot="device-frame-probe" className="concentric" />

        <DeviceFrameScreen style={{ borderRadius: raioTela }}>
          <AnimatePresence initial={false} mode="popLayout">
            {form === "browser" ? (
              <motion.div
                key="bar"
                layout="position"
                data-slot="device-frame-bar"
                aria-hidden
                exit={{ opacity: 0, transition: reduced ? INSTANTANEO : SAIDA_BOLINHAS }}
                transition={{ layout: transition }}
                className="relative flex h-9 shrink-0 items-center gap-1.5 bg-muted px-3 text-muted-foreground"
              >
                {[0, 1, 2].map((i) => (
                  <span key={i} data-slot="device-frame-dot" className="size-2.5 rounded-full bg-foreground/15" />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key={`status-${form}`}
                layout="position"
                data-slot="device-frame-status"
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { ...TROCA_OPACIDADE, delay: reduced ? 0 : ENTRADA_STATUS } }}
                exit={{ opacity: 0, transition: saida }}
                transition={{ layout: transition }}
                className={cn(
                  "flex shrink-0 items-center justify-between text-foreground nums",
                  form === "phone" ? "h-9 px-5 text-xs font-semibold" : "h-6 px-4 text-2xs font-medium"
                )}
              >
                <span>9:41</span>
                <span className="flex items-center gap-1">
                  {form === "phone" ? (
                    <>
                      <SignalIcon className="size-3.5" />
                      <WifiIcon className="size-3.5" />
                    </>
                  ) : null}
                  <Battery100Icon className="size-3.5" />
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex min-h-0 flex-1">
            {/* Trilho e abas não são nós de layout: esticam com a tela (só fios), e os ícones voam sozinhos. */}
            {navItens && form !== "phone" ? (
              <div
                data-slot="device-frame-nav"
                data-orientation="vertical"
                aria-hidden
                className={cn(
                  "flex shrink-0 flex-col items-center gap-1 border-e border-border py-2 transition-none",
                  form === "browser" ? "w-12" : "w-10"
                )}
              >
                {navItens}
              </div>
            ) : null}

            <motion.div
              layout="position"
              data-slot="device-frame-content"
              transition={{ layout: transition }}
              className="relative min-w-0 flex-1 overflow-hidden"
            >
              {children}
              <AnimatePresence initial={false}>
                {notification != null && form !== "phone" ? (
                  <motion.div
                    key="notification"
                    data-slot="device-frame-notification"
                    initial={{ opacity: 0, y: reduced ? 0 : -8 }}
                    animate={{ opacity: 1, y: 0, transition: reduced ? TROCA_OPACIDADE : MOLA }}
                    exit={{ opacity: 0, transition: saida }}
                    className="absolute end-3 top-3 z-10 w-3/5 max-w-64 rounded-surface bg-card p-3 text-foreground shadow-lg ring-1 ring-foreground/10"
                  >
                    {notification}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </div>

          {navItens && form === "phone" ? (
            <div
              data-slot="device-frame-nav"
              data-orientation="horizontal"
              aria-hidden
              className="flex h-12 shrink-0 items-center justify-around border-t border-border"
            >
              {navItens}
            </div>
          ) : null}

          {/* Barra de endereço, ilha e aviso: um elemento só, que muda de caixa; as camadas trocam a opacidade. */}
          <AnimatePresence initial={false}>
            {temIlha ? (
              <motion.div
                key="island"
                ref={ilhaRef}
                layout
                layoutId={`${uid}-island`}
                data-slot="device-frame-island"
                data-state={ilhaEstado}
                exit={{ opacity: 0, transition: saida }}
                transition={{ layout: emTroca || reduced ? transition : MOLA }}
                style={{ borderRadius: raioIlha }}
                className={cn("absolute inset-x-0 z-10 mx-auto overflow-hidden transition-none", ILHA[ilhaEstado])}
              >
                {url != null ? (
                  <motion.div
                    data-slot="device-frame-url"
                    aria-hidden
                    initial={false}
                    animate={{ opacity: ilhaEstado === "url" ? 1 : 0 }}
                    transition={TROCA_OPACIDADE}
                    className="absolute inset-0 flex items-center justify-center bg-background px-3 text-muted-foreground"
                  >
                    <motion.span
                      layout="position"
                      transition={{ layout: transition }}
                      className="flex min-w-0 items-center gap-1 text-xs"
                    >
                      <LockClosedIcon className="size-3 shrink-0" />
                      <span className="truncate">{url}</span>
                    </motion.span>
                  </motion.div>
                ) : null}
                <motion.div
                  data-slot="device-frame-island-pill"
                  aria-hidden
                  initial={false}
                  animate={{ opacity: ilhaEstado === "island" ? 1 : 0 }}
                  transition={TROCA_OPACIDADE}
                  className="absolute inset-0 bg-(--device-bezel)"
                />
                <AnimatePresence initial={false} mode="popLayout">
                  {ilhaEstado === "card" ? (
                    <motion.div
                      key="card"
                      data-slot="device-frame-notification"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: TROCA_OPACIDADE }}
                      exit={{ opacity: 0, transition: saida }}
                      className="relative bg-card p-3 text-foreground"
                    >
                      <motion.div layout="position" transition={{ layout: MOLA }}>
                        {notification}
                      </motion.div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </DeviceFrameScreen>
      </motion.div>
    </DeviceFrameContext.Provider>
  )
}

/** A moldura esperando: a mesma caixa e o mesmo cromo, com ossos no lugar da tela. */
function DeviceFrameSkeleton({
  form = "browser",
  group = true,
  className,
}: {
  form?: DeviceFrameForm
  /** O `SkeletonGroup` em volta; `false` dentro de um esqueleto de página. */
  group?: boolean
  className?: string
}) {
  const ossos = (
    <div data-slot="device-frame-skeleton" data-form={form} className={cn(FRAME_BASE, FORMA[form], className)}>
      <div data-slot="device-frame-screen" className={SCREEN_BASE}>
        {form === "browser" ? (
          <div data-slot="device-frame-bar" className="flex h-9 shrink-0 items-center gap-1.5 bg-muted px-3 text-muted-foreground">
            {[0, 1, 2].map((i) => (
              <span key={i} data-slot="device-frame-dot" className="size-2.5 rounded-full bg-foreground/15" />
            ))}
            <Skeleton className="mx-auto h-6 w-1/2 rounded-full" />
          </div>
        ) : (
          <div
            data-slot="device-frame-status"
            className={cn("flex shrink-0 items-center justify-between text-foreground", form === "phone" ? "h-9 px-5" : "h-6 px-4")}
          >
            <Skeleton shape="text" className="w-8 text-xs" />
            <Skeleton className="h-2.5 w-10 rounded-full" />
          </div>
        )}
        <div className="flex min-h-0 flex-1">
          {form !== "phone" ? (
            <div
              data-slot="device-frame-nav"
              className={cn("flex shrink-0 flex-col items-center gap-1 border-e border-border py-2", form === "browser" ? "w-12" : "w-10")}
            >
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} shape="circle" size="sm" />
              ))}
            </div>
          ) : null}
          <div data-slot="device-frame-content" className="flex min-w-0 flex-1 flex-col gap-3 p-4">
            <Skeleton shape="text" className="w-1/3 text-xs" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-16 w-full rounded-row" />
            <SkeletonText lines={2} className="text-xs" />
          </div>
        </div>
        {form === "phone" ? (
          <div data-slot="device-frame-nav" className="flex h-12 shrink-0 items-center justify-around border-t border-border">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} shape="circle" size="sm" />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
  // O grupo embrulha a moldura: a largura do navegador (`w-full`) precisa de um pai com largura.
  return group ? (
    <SkeletonGroup label="Carregando a prévia…" className={form === "browser" ? "w-full max-w-xl" : undefined}>
      {ossos}
    </SkeletonGroup>
  ) : (
    ossos
  )
}

export { DeviceFrame, DeviceFrameScreen, DeviceFrameSkeleton, useDeviceFrame }
export type { DeviceFrameForm, DeviceFrameNavItem, DeviceFrameProps }
