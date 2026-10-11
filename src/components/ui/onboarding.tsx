"use client"

/**
 * **Onboarding** (rodada 247) — cinco superfícies para apresentar o produto,
 * e cada uma veio de uma referência do 21st (todas MIT):
 *
 * - `OnboardingDialog` — as boas-vindas em passos (originui e patrick-xin): a
 *   mídia de cada passo desliza de lado, com arraste, o texto cruza numa célula
 *   só da grade (a janela não muda de altura) e as pílulas alargam na mola.
 * - `OnboardingChecklist` — os primeiros passos (onboarding-01 e
 *   onboarding-6): `accordion`, a linha que abre com a ação, ou `list`, os
 *   links riscados quando feitos. Completo, celebra.
 * - `OnboardingCard` — a novidade no rodapé da barra lateral (KarrixLee): as
 *   imagens recortadas que, abertas, crescem e se abrem em leque.
 * - `OnboardingTour` — **o foco num botão real**, sem referência: o véu
 *   recorta o elemento da tela, o clique passa pelo buraco e cai nele, e o
 *   passo avança depois que o próprio app tratou o clique.
 * - `OnboardingHotspot` — o ponto que pulsa sobre um botão sem escurecer nada.
 *
 * O que a casa já tinha e elas compõem: `Dialog surface="auto"` (gaveta no
 * telefone), o `Carousel` (o arraste), o `Popover` com âncora virtual (o
 * `FilterBar` fez primeiro), `Accordion`, `Item`, `ProgressRing`, `EmptyState`.
 */

import * as React from "react"
import Link from "next/link"
import { createPortal } from "react-dom"
import {
  AnimatePresence,
  animate,
  motion,
  type MotionStyle,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react"
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, CursorArrowRaysIcon, XMarkIcon } from "@heroicons/react/16/solid"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { BadgeDot } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/ui/empty-state"
import { Item, ItemChevron, ItemContent, ItemTitle } from "@/components/ui/item"
import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Progress, ProgressRing } from "@/components/ui/progress"
import { Skeleton, SkeletonGroup, SkeletonText } from "@/components/ui/skeleton"
import { Muted } from "@/components/ui/typography"
import { useIsMobile, useViewportWindow } from "@/hooks/use-mobile"
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect"
import { menuPanelTintClassName } from "@/lib/glass-classes"
import { menuPanelSurfaceClassName } from "@/lib/menu-classes"
import { MOLA } from "@/lib/spring"
import { cn } from "@/lib/utils"

/* ── Tipos ──────────────────────────────────────────────────────────────── */

type OnboardingMediaSource =
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; alt?: string; poster?: string }

type OnboardingStep = {
  /** O título do passo, também o nome da pílula ("Ir para …"). */
  title: string
  description?: React.ReactNode
  /** Imagem, vídeo ou uma ilustração em JSX. */
  media?: OnboardingMediaSource | React.ReactNode
}

/** Um seletor CSS, uma `ref` ou uma função que devolve o elemento. */
type OnboardingTarget =
  | string
  | React.RefObject<HTMLElement | null>
  | (() => HTMLElement | null)

type OnboardingTourStep = OnboardingStep & {
  /** O elemento recortado. Sem alvo, a placa fica no centro, sem recorte. */
  target?: OnboardingTarget
  /**
   * `target`: o passo avança quando a pessoa usa o próprio elemento — o clique
   * passa pelo buraco. `next` (padrão): pelo botão da placa.
   */
  advanceOn?: "next" | "target"
  /** A dica do passo `target` ("Clique em Adicionar"); sem ela, a do tour. */
  hint?: string
  /** De que lado do recorte a placa pousa no desktop. */
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  /**
   * Espera o alvo montar — o menu que o clique anterior abriu, a tela de outra
   * rota. `true` espera até 5 s; um número, os milissegundos.
   */
  waitFor?: boolean | number
  /** A folga do recorte em volta do alvo, em px. Padrão 8. */
  padding?: number
}

type OnboardingChecklistItem = {
  id: string
  title: string
  description?: React.ReactNode
  /** A ação do item: um link (`href`) ou um botão (`onClick`). */
  action?: { label: string; href?: string; onClick?: () => void }
  /** Feito — quem sabe é a tela, que lê os próprios dados. */
  done?: boolean
}

/* ── Constantes ─────────────────────────────────────────────────────────── */

const CONCLUIDO = "completed"
const DISPENSADO = "dismissed"
const VISTO = "seen"
/** A mola do leque, a da referência (KarrixLee): um pouco mais amortecida que a `MOLA`. */
const MOLA_LEQUE = { type: "spring", stiffness: 300, damping: 30 } as const
const FOLGA_PADRAO = 4
/**
 * As setas do "próximo" e do "voltar", que andam 2px para o lado em que levam,
 * no cursor e no toque — a do `PageSectionLink`. O "concluir" do último passo
 * não leva seta: ali não há para onde ir. O `data-icon` de cada uma tira do
 * botão o recuo do lado dela.
 */
const SETA_QUE_ANDA =
  "transition-transform duration-(--duration-base) ease-(--ease-out) group-hover/button:translate-x-0.5 group-active/button:translate-x-0.5"
/**
 * O × do canto do checklist — e do card de novidade **no telefone**: 28px,
 * recuado para dentro do recuo de 16 (`-me-1.5 -my-1`), ocupando só a altura
 * da linha do título (20), e no dedo o alvo cresce a 44 por fora da caixa.
 * No telefone os dois cartões ficam um sobre o outro no mesmo feed, e com
 * cabeçalhos diferentes — 16 contra 12 de recuo, título de 14 contra 12, × de
 * 28 contra 24 — liam como peças de famílias diferentes; o texto do card,
 * aliás, era pequeno demais ali. Na barra lateral do desktop o card continua
 * compacto (o `md:` dele).
 */
const X_DO_CARTAO =
  "relative -me-1.5 -my-1 shrink-0 pointer-coarse:after:absolute pointer-coarse:after:-inset-2 pointer-coarse:after:content-['']"
/** No dedo, o alvo do × cresce a 44 sem crescer o círculo (28 + 2 × 8). */
const FECHAR_NO_DEDO =
  "pointer-coarse:after:absolute pointer-coarse:after:-inset-2 pointer-coarse:after:content-['']"
const SETA_QUE_VOLTA =
  "transition-transform duration-(--duration-base) ease-(--ease-out) group-hover/button:-translate-x-0.5 group-active/button:-translate-x-0.5"
const ESPERA_PADRAO = 5000
const CAMPO = "input, textarea, select, [contenteditable=''], [contenteditable='true']"
const FOCAVEIS =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"

/* ── Peças puras (exportadas para o teste) ──────────────────────────────── */

type Recorte = { x: number; y: number; w: number; h: number; r: number }

/**
 * O buraco em volta do alvo: a caixa dele mais a folga, e o raio **dele**
 * mais a folga — um botão cápsula ganha um recorte cápsula, um cartão de 22
 * ganha 30. Limitado à metade da altura, que é o raio máximo que o CSS desenha.
 */
function recorteDoAlvo(
  caixa: { left: number; top: number; width: number; height: number },
  raio: number,
  folga = FOLGA_PADRAO
): Recorte {
  const h = caixa.height + folga * 2
  const w = caixa.width + folga * 2
  return {
    x: caixa.left - folga,
    y: caixa.top - folga,
    w,
    h,
    r: Math.min(raio + folga, h / 2, w / 2),
  }
}

/**
 * Onde a placa do telefone prende: embaixo, a menos que o alvo esteja na
 * metade de baixo — aí em cima, para nunca o cobrir.
 */
function ladoDaDoca(
  alvo: { top: number; bottom: number } | null,
  alturaDaJanela: number
): "top" | "bottom" {
  if (!alvo) return "bottom"
  return (alvo.top + alvo.bottom) / 2 > alturaDaJanela / 2 ? "top" : "bottom"
}

/**
 * O leque das imagens do card, com os números da referência: até três, a do
 * meio parada, as das pontas a ±5° e ±20px, a da frente um pouco maior.
 */
function lequeDaMidia(indice: number, total: number) {
  if (total <= 1) return { rotate: 0, x: 0, y: -5, scale: 1 }
  const centro = total === 2 ? 0.5 : 1
  return {
    rotate: (indice - centro) * 5,
    x: (indice - centro) * 20,
    y: [-10, -5, 0][indice] ?? 0,
    scale: 0.95 + indice * 0.02,
  }
}

/**
 * O espaço que o leque aberto ocupa acima e abaixo da imagem, em px, medido
 * num card de barra lateral (imagem de 214px): com três, o de trás sobe ~16
 * e o da frente desce ~9; com duas (±2,5°), só sobe ~12; com uma (o vídeo),
 * sobe 5 e não gira.
 */
function folgaDoLeque(total: number) {
  if (total <= 1) return { paddingTop: 6, paddingBottom: 0 }
  if (total === 2) return { paddingTop: 12, paddingBottom: 0 }
  return { paddingTop: 16, paddingBottom: 8 }
}

/** O passo guardado, se for um número válido. */
function passoGuardado(valor: string | null, total: number) {
  if (!valor || !/^\d+$/.test(valor)) return 0
  return Math.min(Number(valor), Math.max(0, total - 1))
}

/**
 * Até onde se chega indo de um passo do tour a outro: para trás, sempre; para
 * a frente, **nunca por cima de um passo que avança pelo clique no alvo**. O
 * passo seguinte costuma depender desse clique (a Despesa só existe com o menu
 * do + Adicionar aberto), e pular pela seta ou pela pílula deixava o tour
 * esperando um alvo que não vinha — cinco segundos sem placa, e ela no centro.
 */
function passoAlcancavel(steps: { advanceOn?: "next" | "target" }[], de: number, para: number) {
  for (let i = Math.max(0, de); i < para; i++) if (steps[i]?.advanceOn === "target") return i
  return para
}

/* ── Hooks internos ─────────────────────────────────────────────────────── */

const assinarNada = () => () => {}
/** `true` no cliente, `false` no servidor e na hidratação — sem efeito. */
function useNoCliente() {
  return React.useSyncExternalStore(
    assinarNada,
    () => true,
    () => false
  )
}

function armazem(area: "local" | "session") {
  return area === "session" ? window.sessionStorage : window.localStorage
}

/**
 * O que foi visto, guardado — lido **depois** de montar (o servidor não tem
 * `localStorage`), com `try/catch` (janela privada, armazenamento bloqueado).
 * `lido` diz se a leitura já aconteceu: quem tem `storageKey` não renderiza
 * antes dela, senão um card dispensado piscaria a cada carga.
 */
function useGuardado(chave: string | undefined, area: "local" | "session" = "local") {
  const [leitura, setLeitura] = React.useState<{ chave: string; valor: string | null } | null>(null)
  React.useEffect(() => {
    if (!chave) return
    let valor: string | null = null
    try {
      valor = armazem(area).getItem(chave)
    } catch {}
    setLeitura({ chave, valor })
  }, [chave, area])
  const gravar = React.useCallback(
    (proximo: string | null) => {
      if (!chave) return
      setLeitura({ chave, valor: proximo })
      try {
        if (proximo == null) armazem(area).removeItem(chave)
        else armazem(area).setItem(chave, proximo)
      } catch {}
    },
    [chave, area]
  )
  const lida = chave && leitura?.chave === chave ? leitura : null
  return [lida ? lida.valor : null, gravar, !chave || lida !== null] as const
}

/**
 * O documento está no tema escuro? Lido da classe do `<html>` **do documento
 * onde o componente vive** — dentro da moldura do catálogo, o do iframe — e
 * acompanhado por um observador, porque o tema troca sem recarregar. No
 * servidor não há tema a ler: `null`, e quem depende dele espera o cliente.
 */
function useTemaEscuro() {
  const janela = useViewportWindow()
  const loja = React.useMemo(() => {
    const html = () => (janela ?? window).document.documentElement
    return {
      assinar(aoMudar: () => void) {
        const mo = new MutationObserver(aoMudar)
        mo.observe(html(), { attributes: true, attributeFilter: ["class"] })
        return () => mo.disconnect()
      },
      ler: () => html().classList.contains("dark"),
    }
  }, [janela])
  return React.useSyncExternalStore<boolean | null>(loja.assinar, loja.ler, () => null)
}

/** A versão mais recente de uma função, para os ouvintes montados uma vez. */
function useAtual<T>(valor: T) {
  const ref = React.useRef(valor)
  useIsomorphicLayoutEffect(() => {
    ref.current = valor
  })
  return ref
}

function resolverAlvo(alvo: OnboardingTarget | undefined, doc: Document) {
  if (!alvo) return null
  if (typeof alvo === "string") {
    // O primeiro **visível**: o `TopBarSearch` tem dois botões com o mesmo
    // `data-slot` (o ícone abaixo de `md`, a pílula a partir dele).
    for (const el of doc.querySelectorAll<HTMLElement>(alvo)) {
      if (el.getClientRects().length) return el
    }
    return null
  }
  if (typeof alvo === "function") return alvo()
  return alvo.current
}

function foraDaVista(caixa: DOMRect, janela: Window) {
  return (
    caixa.top < 0 ||
    caixa.left < 0 ||
    caixa.bottom > janela.innerHeight ||
    caixa.right > janela.innerWidth
  )
}

/**
 * O documento é de dedo? Num telefone o `pointerType` já diz; a moldura do
 * iPhone do catálogo roda no navegador do desktop, onde ele diz "mouse", e marca
 * o `<html>` de dentro com `data-pointer="coarse"` — a mesma marca que faz a
 * variante `pointer-coarse:` valer lá. No app ninguém a escreve.
 */
function deDedo(el: Element) {
  return el.ownerDocument.documentElement.dataset.pointer === "coarse"
}

function focavel(el: HTMLElement) {
  return el.matches(FOCAVEIS)
}

/* ── Mídia ──────────────────────────────────────────────────────────────── */

function eFonte(media: unknown): media is OnboardingMediaSource {
  return (
    typeof media === "object" &&
    media !== null &&
    !React.isValidElement(media) &&
    "type" in media &&
    "src" in media
  )
}

/**
 * A mídia de um passo: imagem, vídeo ou uma ilustração em JSX. O `CardMedia`
 * só desenha `<img>`; aqui o vídeo é mudo, em laço, `playsInline` (o iOS
 * abriria em tela cheia) e, com movimento reduzido, **parado** com os
 * controles à vista — quem quiser vê, ninguém é obrigado.
 */
function OnboardingMedia({
  media,
  className,
}: {
  media: OnboardingMediaSource | React.ReactNode
  className?: string
}) {
  const reduzido = useReducedMotion() ?? false
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const fonte = eFonte(media) ? media : null

  // O `muted` do React não sai no HTML do servidor, e o navegador só deixa
  // tocar sozinho o que nasce mudo: a propriedade e o `play` vão aqui.
  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    if (reduzido) video.pause()
    else void video.play().catch(() => {})
  }, [reduzido, fonte?.src])

  return (
    <div
      data-slot="onboarding-media"
      className={cn(
        "relative overflow-hidden bg-muted [&>img]:size-full [&>img]:object-cover [&>video]:size-full [&>video]:object-cover",
        className
      )}
    >
      {fonte?.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element -- a fonte é de quem chama, de qualquer domínio
        <img src={fonte.src} alt={fonte.alt} draggable={false} />
      ) : fonte?.type === "video" ? (
        <video
          ref={videoRef}
          src={fonte.src}
          poster={fonte.poster}
          aria-label={fonte.alt}
          muted
          loop
          playsInline
          autoPlay={!reduzido}
          controls={reduzido}
          preload="metadata"
        />
      ) : (
        // A ilustração é desenho: nada nela recebe foco nem é lido — num slide
        // escondido do carrossel, um botão dela levaria o foco para fora da vista.
        <div inert aria-hidden className="contents">
          {media as React.ReactNode}
        </div>
      )}
    </div>
  )
}

/* ── As pílulas ─────────────────────────────────────────────────────────── */

/**
 * O indicador do diálogo e do tour (patrick-xin): a pílula ativa alarga de 16
 * para 24px na mola, e cada uma é um botão que leva ao passo. As setas andam
 * entre elas com o foco junto. O alvo de toque cresce só na vertical: elas
 * encostam umas nas outras.
 */
function OnboardingPills({
  titulos,
  atual,
  de,
  onIr,
  className,
}: {
  titulos: string[]
  atual: number
  /** O passo de onde se veio: a pílula dele nasce larga e cede a vez (a placa do tour remonta a cada passo). */
  de?: number | null
  onIr: (indice: number) => void
  className?: string
}) {
  const reduzido = useReducedMotion() ?? false
  const ref = React.useRef<HTMLDivElement>(null)
  const ir = (indice: number) => {
    const alvo = Math.max(0, Math.min(titulos.length - 1, indice))
    onIr(alvo)
    ref.current
      ?.querySelector<HTMLElement>(`[data-index="${alvo}"]`)
      ?.focus({ preventScroll: true })
  }
  if (titulos.length < 2) return null
  return (
    <div
      ref={ref}
      role="group"
      aria-label="Passos"
      data-slot="onboarding-pills"
      className={cn("flex items-center gap-1.5", className)}
      onKeyDown={(e) => {
        const mapa: Record<string, number> = {
          ArrowLeft: atual - 1,
          ArrowRight: atual + 1,
          Home: 0,
          End: titulos.length - 1,
        }
        if (!(e.key in mapa)) return
        e.preventDefault()
        ir(mapa[e.key])
      }}
    >
      {titulos.map((titulo, i) => (
        <motion.button
          key={i}
          type="button"
          data-index={i}
          data-slot="onboarding-pill"
          aria-label={`Ir para ${titulo}`}
          aria-current={i === atual ? "step" : undefined}
          tabIndex={i === atual ? 0 : -1}
          initial={de == null ? false : { width: i === de ? 24 : 16 }}
          animate={{ width: i === atual ? 24 : 16 }}
          transition={reduzido ? { duration: 0 } : MOLA}
          onClick={() => onIr(i)}
          className={cn(
            "relative h-2 shrink-0 rounded-full outline-none",
            "transition-colors duration-(--duration-base) ease-(--ease-out)",
            "after:absolute after:inset-x-0 after:-inset-y-4 after:content-['']",
            "focus-visible:ring-3 focus-visible:ring-ring/45",
            i === atual
              ? "bg-primary"
              : "bg-foreground/15 hover:bg-foreground/30 active:bg-foreground/30"
          )}
        />
      ))}
    </div>
  )
}

/* ── OnboardingDialog ───────────────────────────────────────────────────── */

type OnboardingDialogProps = {
  steps: OnboardingStep[]
  open?: boolean
  /** Abre sozinho na primeira visita (a menos que o `storageKey` diga que já foi visto). */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Guarda em `localStorage` o passo, a conclusão e o pular. */
  storageKey?: string
  onComplete?: () => void
  onSkip?: () => void
  /** O gatilho, quando o diálogo também abre por um botão. */
  trigger?: React.ReactNode
  nextLabel?: string
  backLabel?: string
  skipLabel?: string
  finishLabel?: string
  className?: string
}

/**
 * As boas-vindas em passos. **Um índice só**, o do `Carousel`: arrastar a
 * mídia, a seta do teclado, a pílula e o botão andam pelo mesmo `api`, e o
 * resto (texto, pílulas, rodapé) lê o passo do evento `select` dele.
 */
function OnboardingDialog({
  steps,
  open,
  defaultOpen = false,
  onOpenChange,
  storageKey,
  onComplete,
  onSkip,
  trigger,
  nextLabel = "próximo",
  backLabel = "voltar",
  skipLabel = "pular as boas-vindas",
  finishLabel = "começar",
  className,
}: OnboardingDialogProps) {
  const reduzido = useReducedMotion() ?? false
  const gaveta = useIsMobile()
  const [guardado, gravar, lido] = useGuardado(storageKey)
  const total = steps.length
  const visto = guardado === CONCLUIDO || guardado === DISPENSADO
  const controlado = open !== undefined
  const [interno, setInterno] = React.useState<boolean | null>(null)
  const aberto = total > 0 && (controlado ? open : (interno ?? (lido && defaultOpen && !visto)))
  const inicio = passoGuardado(guardado, total)
  const [escolhido, setEscolhido] = React.useState<number | null>(null)
  const atual = escolhido ?? inicio
  const [api, setApi] = React.useState<CarouselApi>()
  const temMidia = steps.some((s) => s.media != null)
  const ultimo = atual === total - 1

  // O passo é o do carrossel, venha de onde vier a troca.
  const gravarRef = useAtual(gravar)
  React.useEffect(() => {
    if (!api) return
    const aoSelecionar = () => {
      const n = api.selectedScrollSnap()
      setEscolhido(n)
      gravarRef.current(String(n))
    }
    api.on("select", aoSelecionar)
    return () => {
      api.off("select", aoSelecionar)
    }
  }, [api, gravarRef])

  const fechar = (motivo: typeof CONCLUIDO | typeof DISPENSADO) => {
    if (!controlado) setInterno(false)
    onOpenChange?.(false)
    gravar(motivo)
    setEscolhido(null)
    setApi(undefined)
    if (motivo === CONCLUIDO) onComplete?.()
    else onSkip?.()
  }

  const ir = (indice: number) => {
    if (api) api.scrollTo(indice, reduzido)
    else setEscolhido(indice)
  }
  const proximo = () => (ultimo ? fechar(CONCLUIDO) : ir(atual + 1))
  const voltar = () => ir(atual - 1)
  const passo = steps[atual]

  return (
    <Dialog
      surface="auto"
      open={aberto}
      onOpenChange={(proximoAberto) => {
        if (proximoAberto) {
          if (!controlado) setInterno(true)
          onOpenChange?.(true)
        } else fechar(DISPENSADO)
      }}
    >
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        data-slot="onboarding-dialog"
        showCloseButton={false}
        // Um clique fora não pula as boas-vindas: Esc e o × pulam. O vaul
        // respeita o mesmo `preventDefault`, e o `onInteractOutside` não chega
        // à gaveta.
        onPointerDownOutside={(e) => e.preventDefault()}
        // O foco vai ao botão principal, e não ao primeiro focável da árvore —
        // que podia ser um slide fora da vista.
        onOpenAutoFocus={(e) => {
          const primario = (e.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>(
            "[data-onboarding-primary]"
          )
          if (!primario) return
          e.preventDefault()
          primario.focus({ preventScroll: true })
        }}
        onKeyDown={(e) => {
          // Dentro do carrossel e das pílulas a captura deles já andou.
          if (e.defaultPrevented || (e.target as HTMLElement).closest(CAMPO)) return
          const mapa: Record<string, number> = {
            ArrowLeft: atual - 1,
            ArrowRight: atual + 1,
            Home: 0,
            End: total - 1,
          }
          if (!(e.key in mapa)) return
          e.preventDefault()
          ir(Math.max(0, Math.min(total - 1, mapa[e.key])))
        }}
        // A gaveta tem o recuo e a área segura dela; só o diálogo zera o casco.
        className={cn(!gaveta && "gap-0 p-0 [--dialog-bleed:0px]", className)}
      >
        {/* O nome é o do passo ativo; as cópias visíveis são `aria-hidden`. */}
        <DialogTitle className="sr-only">{passo?.title}</DialogTitle>
        {passo?.description ? (
          <DialogDescription className="sr-only">{passo.description}</DialogDescription>
        ) : null}

        {temMidia ? (
          // Na gaveta, a ilustração desce para baixo da faixa da alça e do ×.
          // **`min-w-0` é carga estrutural**: este invólucro é item da grade do
          // diálogo, e sem ele o mínimo automático é a largura do trilho do
          // carrossel — a ilustração, o texto e o rodapé estouravam a janela.
          // O `overflow-hidden` de dentro só recorta; quem limita é aqui.
          <div className={cn("relative m-2 mb-0 min-w-0", gaveta && "mt-6")}>
            <div className="overflow-hidden bg-muted concentric [--radius-inset:--spacing(2)]">
              <Carousel
                setApi={setApi}
                opts={{ startIndex: inicio }}
                gap="none"
                fade={false}
                controls="none"
                aria-label="Ilustrações dos passos"
                // O arraste lateral é da mídia, e não da gaveta.
                data-vaul-no-drag
                className="w-full"
              >
                <CarouselContent>
                  {steps.map((s, i) => (
                    <CarouselItem key={i} aria-label={`${i + 1} de ${total}`}>
                      <OnboardingMedia media={s.media} className="aspect-video w-full" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
            {/* No diálogo, o × mora no canto **da ilustração**, a 8px dela, com
                a placa flutuante atrás (o glifo cru some numa imagem clara). Na
                gaveta ele fica **acima** dela, na faixa da alça: ancorado na
                janela, a alça empurrava a ilustração para baixo e ele ficava
                montado na borda, metade no fundo e metade na imagem. */}
            {gaveta ? null : (
              <DialogCloseButton
                label={skipLabel}
                className={cn(
                  FECHAR_NO_DEDO,
                  menuPanelTintClassName,
                  "top-2 right-2 z-10 shadow-sm ring-1 ring-foreground/10"
                )}
              />
            )}
          </div>
        ) : null}

        <OnboardingPills
          titulos={steps.map((s) => s.title)}
          atual={atual}
          onIr={ir}
          className="justify-center pt-4"
        />

        {/* Todos os passos na mesma célula: a altura é a do mais alto, e a
            janela não pula de um passo para o outro. */}
        <div className="grid px-(--dialog-px) pt-3">
          {steps.map((s, i) => {
            const ativo = i === atual
            return (
              <div
                key={i}
                data-slot="onboarding-dialog-step"
                data-active={ativo || undefined}
                aria-hidden
                inert={!ativo}
                className={cn(
                  "col-start-1 row-start-1 flex flex-col text-left",
                  "transition-opacity duration-(--duration-base) ease-(--ease-out)",
                  ativo ? "opacity-100" : "opacity-0"
                )}
              >
                <p className="font-heading text-base leading-snug font-medium text-balance">
                  {s.title}
                </p>
                {s.description ? (
                  <Muted className="text-pretty">{s.description}</Muted>
                ) : null}
              </div>
            )
          })}
        </div>

        {/* Na gaveta, o par numa linha só: empilhado, o voltar entrava embaixo
            do próximo no segundo passo e a gaveta crescia. */}
        <DialogFooter
          className={gaveta ? "flex-row" : undefined}
          start={
            atual > 0 ? (
              <Button type="button" variant="tertiary" onClick={voltar}>
                <ChevronLeftIcon aria-hidden data-icon="inline-start" className={SETA_QUE_VOLTA} />
                {backLabel}
              </Button>
            ) : null
          }
        >
          {/* Pular é o × do canto (com o `skipLabel` de nome), como no tour:
              o rodapé fica só com o par voltar · próximo. */}
          <Button
            type="button"
            variant="primary"
            data-onboarding-primary
            onClick={proximo}
            className={gaveta ? "flex-1" : undefined}
          >
            {ultimo ? finishLabel : nextLabel}
            {ultimo ? null : <ChevronRightIcon aria-hidden data-icon="inline-end" className={SETA_QUE_ANDA} />}
          </Button>
        </DialogFooter>

        {/* O × de fábrica: o da gaveta (no canto, acima da ilustração) e o do
            diálogo sem mídia. */}
        {temMidia && !gaveta ? null : <DialogCloseButton label={skipLabel} className={FECHAR_NO_DEDO} />}
      </DialogContent>
    </Dialog>
  )
}

/* ── OnboardingChecklist ────────────────────────────────────────────────── */

/** O estado de um item: o preenchido do `Checkbox` marcado, ou o círculo tracejado. */
function Situacao({ done, size }: { done: boolean; size: "sm" | "md" }) {
  return (
    <span
      data-slot="onboarding-check"
      data-done={done || undefined}
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        size === "sm" ? "size-4" : "size-5",
        done
          ? "bg-primary text-primary-foreground"
          : "border border-dashed border-muted-foreground/60"
      )}
    >
      {done ? <CheckIcon className={size === "sm" ? "size-3" : "size-3.5"} /> : null}
    </span>
  )
}

function AcaoDoItem({
  action,
  size,
}: {
  action: NonNullable<OnboardingChecklistItem["action"]>
  size: "sm" | "md"
}) {
  return action.href ? (
    <Button asChild size={size} className="pointer-coarse:h-10">
      <Link href={action.href} onClick={action.onClick}>
        {action.label}
      </Link>
    </Button>
  ) : (
    <Button type="button" size={size} onClick={action.onClick} className="pointer-coarse:h-10">
      {action.label}
    </Button>
  )
}

type OnboardingChecklistProps = {
  title: string
  items: OnboardingChecklistItem[]
  /** `accordion`: a linha abre com a descrição e a ação. `list`: links diretos. */
  variant?: "accordion" | "list"
  /** Guarda em `localStorage` que foi dispensado. */
  storageKey?: string
  onDismiss?: () => void
  dismissLabel?: string
  /** O título da celebração, com tudo feito. */
  doneTitle?: string
  doneDescription?: React.ReactNode
  className?: string
}

/**
 * Os primeiros passos. O `done` de cada item é da tela — "tem uma
 * transação?" é pergunta aos dados, e o componente não a sabe responder.
 *
 * Na sanfona, abre a primeira pendente, e **quando a linha aberta fica feita,
 * a próxima pendente abre sozinha** (onboarding-01). Isso é derivado, não
 * efeito: a escolha guarda se o item já estava feito quando foi aberto, e um
 * item que passou a feito depois devolve a sanfona ao automático.
 */
function OnboardingChecklist({
  title,
  items,
  variant = "accordion",
  storageKey,
  onDismiss,
  dismissLabel = "Dispensar",
  doneTitle = "Tudo pronto",
  doneDescription,
  className,
}: OnboardingChecklistProps) {
  const reduzido = useReducedMotion() ?? false
  const [guardado, gravar, lido] = useGuardado(storageKey)
  const [dispensado, setDispensado] = React.useState(false)
  const [escolha, setEscolha] = React.useState<{ id: string; feito: boolean } | null>(null)
  const cartaoRef = React.useRef<HTMLDivElement>(null)
  const saindo = React.useRef(false)
  const visivel = lido && !dispensado && guardado !== DISPENSADO
  // Já visível na primeira pintura (o servidor o desenhou, sem `storageKey`),
  // ele não desenrola — piscaria. Só quem aparece depois desenrola.
  const [visivelAoMontar] = React.useState(visivel)

  const feitos = items.filter((i) => i.done).length
  const total = items.length
  const completo = total > 0 && feitos === total
  const primeiraPendente = items.find((i) => !i.done)?.id ?? ""
  const escolhido = escolha ? items.find((i) => i.id === escolha.id) : undefined
  const aberto =
    escolha && !(escolhido?.done && !escolha.feito) ? escolha.id : primeiraPendente
  const contagem = `${feitos} de ${total}`

  // O espaço desenrola quando monta — uma vez por espaço, porque `ref` de
  // função pode ser chamada de novo pelo mesmo nó.
  const espacoRef = React.useRef<HTMLDivElement | null>(null)
  const desenrolado = React.useRef<HTMLDivElement | null>(null)
  const refDoEspaco = React.useCallback(
    (espaco: HTMLDivElement | null) => {
      espacoRef.current = espaco
      if (!espaco || espaco === desenrolado.current) return
      desenrolado.current = espaco
      const cartao = cartaoRef.current
      if (visivelAoMontar || reduzido || !cartao) return
      void desenrolar(espaco, cartao)
    },
    [visivelAoMontar, reduzido]
  )

  // Fechar enrola a persiana (`enrolar`). Grava só no fim, e uma vez.
  const dispensar = async () => {
    if (saindo.current) return
    saindo.current = true
    const espaco = espacoRef.current
    const cartao = cartaoRef.current
    if (espaco && cartao) {
      if (reduzido) await espaco.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: "forwards" }).finished
      else await enrolar(espaco, cartao)
    }
    gravar(DISPENSADO)
    setDispensado(true)
    onDismiss?.()
  }

  if (!visivel) return null

  return (
    <div
      ref={refDoEspaco}
      data-slot="onboarding-checklist-space"
      // Recorta com folga de 4px, como o espaço do card.
      className={cn("overflow-clip [overflow-clip-margin:var(--spacing)]", className)}
    >
    <div ref={cartaoRef} data-slot="onboarding-checklist-motion">
    <Card
      data-slot="onboarding-checklist"
      data-variant={variant}
      // O recuo do cartão (16) é o do cabeçalho; as linhas recuam 8 e devolvem
      // 8 por dentro, para o círculo cair na coluna do título.
      padding="md"
      className="gap-3 pb-2"
    >
      <CardHeader>
        <CardTitle size="sm">{title}</CardTitle>
        <CardDescription className="flex items-center gap-2 text-xs">
          {variant === "accordion" ? (
            <ProgressRing
              value={feitos}
              max={Math.max(1, total)}
              size="sm"
              className="size-5"
              aria-label={`${contagem} concluídos`}
            />
          ) : null}
          <span className="nums">{contagem} concluídos</span>
        </CardDescription>
        <CardAction>
          <Button
            type="button"
            variant="tertiary"
            size="icon-sm"
            onClick={dispensar}
            className={X_DO_CARTAO}
          >
            <XMarkIcon />
            <span className="sr-only">{dismissLabel}</span>
          </Button>
        </CardAction>
      </CardHeader>

      {variant === "list" ? (
        <CardContent data-onboarding-row>
          <Progress
            value={feitos}
            max={Math.max(1, total)}
            size="sm"
            aria-label={`${contagem} concluídos`}
          />
        </CardContent>
      ) : null}

      {/* Cada linha — da sanfona, da lista, ou a celebração inteira — é um
          gomo da persiana (`data-onboarding-row`). */}
      {completo ? (
        <EmptyState
          data-onboarding-row
          variant="plain"
          size="sm"
          data-variant="done"
          data-slot="onboarding-checklist-done"
          className="py-4"
        >
          <EmptyStateIcon variant="done" />
          <EmptyStateTitle>{doneTitle}</EmptyStateTitle>
          {doneDescription ? (
            <EmptyStateDescription>{doneDescription}</EmptyStateDescription>
          ) : null}
          <EmptyStateActions>
            <Button type="button" variant="secondary" onClick={dispensar} className="pointer-coarse:h-10">
              {dismissLabel}
            </Button>
          </EmptyStateActions>
        </EmptyState>
      ) : variant === "accordion" ? (
        <Accordion
          type="single"
          collapsible
          value={aberto}
          onValueChange={(v: string) =>
            setEscolha({ id: v, feito: !!items.find((i) => i.id === v)?.done })
          }
          className="px-2 [--accordion-px:--spacing(2)]"
        >
          {items.map((item) => (
            <AccordionItem
              key={item.id}
              data-onboarding-row
              value={item.id}
              data-done={item.done || undefined}
              className={cn(
                "rounded-row not-last:border-b-0",
                "transition-colors duration-(--duration-base) ease-(--ease-out) data-open:bg-muted"
              )}
            >
              <AccordionTrigger
                icon={<Situacao done={!!item.done} size="sm" />}
                className={cn(item.done && "text-muted-foreground")}
              >
                {item.title}
                <span className="sr-only">{item.done ? ", concluído" : ", pendente"}</span>
              </AccordionTrigger>
              <AccordionContent>
                {item.description ? <p className="text-pretty">{item.description}</p> : null}
                {item.action && !item.done ? (
                  <div className="pt-1">
                    <AcaoDoItem action={item.action} size="sm" />
                  </div>
                ) : null}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <ul className="flex flex-col px-2">
          {items.map((item) => {
            const conteudo = (
              <>
                <Situacao done={!!item.done} size="md" />
                <ItemContent>
                  <ItemTitle
                    className={cn(item.done && "font-normal text-muted-foreground line-through")}
                  >
                    {item.title}
                    <span className="sr-only">{item.done ? ", concluído" : ", pendente"}</span>
                  </ItemTitle>
                </ItemContent>
                {!item.done && item.action ? <ItemChevron /> : null}
              </>
            )
            // 7 + a borda (transparente) do `Item`: o círculo cai na coluna do título.
            const linha = "rounded-row px-1.75 pointer-coarse:min-h-11"
            return (
              <li key={item.id} data-onboarding-row data-slot="onboarding-checklist-item" data-done={item.done || undefined}>
                {item.action && !item.done ? (
                  <Item size="sm" interactive asChild className={linha}>
                    {item.action.href ? (
                      <Link href={item.action.href} onClick={item.action.onClick}>
                        {conteudo}
                      </Link>
                    ) : (
                      <button type="button" onClick={item.action.onClick}>
                        {conteudo}
                      </button>
                    )}
                  </Item>
                ) : (
                  <Item size="sm" className={linha}>
                    {conteudo}
                  </Item>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
    </div>
    </div>
  )
}

/* ── OnboardingCard ─────────────────────────────────────────────────────── */

type OnboardingCardProps = {
  title: string
  description?: React.ReactNode
  /** Até três imagens (o leque) ou um vídeo — ou ilustrações em JSX. */
  media?: Array<OnboardingMediaSource | React.ReactNode>
  /** O "saiba mais". */
  action?: { label: string; href: string }
  dismissLabel?: string
  /** Guarda o dispensar: `forever` em `localStorage`, `session` só nesta aba. */
  storageKey?: string
  dismiss?: "session" | "forever"
  onDismiss?: () => void
  /**
   * A superfície. `brand` (padrão): o brilho de marca acende na borda conforme
   * o ponteiro chega. `beam`: o mesmo arco dá a volta na borda sozinho, num
   * laço, para chamar a atenção. `contrast`: o `brand` no tema oposto — o
   * cartão do claro no escuro e o do escuro no claro, com o mesmo brilho.
   */
  variant?: "brand" | "beam" | "contrast"
  className?: string
}

/** Uma volta do arco do `beam`, em segundos. */
const VOLTA_DO_FEIXE = 4

/**
 * **O fechar do card: ele colapsa, diminui e sai pela esquerda**, uma etapa
 * emendando na outra. Fechar é curva, não mola (uma mola até zero passaria por
 * baixo de zero):
 *
 * 1. **Colapsa** (os primeiros 40%): o leque recolhe e as faixas se fecham de
 *    verdade — altura até zero, de baixo para cima: ações, mídia, descrição —,
 *    até sobrar a linha do título. O espaço acompanha, porque a altura dele é
 *    `auto` até a etapa 4.
 * 2. **Diminui**: o cartão, já compacto, encolhe a 72%, com a origem na borda
 *    esquerda, depois de um impulso de 1,5% para a direita.
 * 3. **Sai pela esquerda**: desliza 115% da própria largura, acelerando; só no
 *    fim desfoca e esmaece.
 * 4. **O espaço que sobrou fecha por último.**
 *
 * Abrir é a volta, mais curta: o espaço abre, o cartão sobe nele e as faixas
 * chegam em cascata. `--ease-emphasized` e `--ease-in-out` escritas aqui
 * porque o motion não lê variável de CSS; a saída é uma curva de aceleração.
 */
const CURVA_ENFATICA = [0.32, 0.72, 0, 1] as const
const CURVA_SUAVE = [0.65, 0, 0.35, 1] as const
const CURVA_SAIDA = [0.55, 0, 1, 0.45] as const
const ESPACO_DO_CARD = {
  inicial: { height: 0 },
  aberto: { height: "auto", transition: { duration: 0.34, ease: CURVA_SUAVE } },
}
const CARTAO_DO_CARD = {
  inicial: { opacity: 0, y: 16, scale: 0.97, filter: "blur(4px)" },
  aberto: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.4,
      delay: 0.08,
      ease: CURVA_ENFATICA,
      delayChildren: 0.16,
      staggerChildren: 0.04,
    },
    // Em repouso, sem filtro: um `blur(0px)` que fica cria contexto de
    // empilhamento à toa embaixo do brilho e do leque.
    transitionEnd: { filter: "none" },
  },
}
/** Cada faixa do cartão chega em cascata ao abrir. */
const FAIXA_DO_CARD = {
  inicial: { opacity: 0, y: 6 },
  aberto: { opacity: 1, y: 0, transition: { duration: 0.3, ease: CURVA_ENFATICA } },
}

/** As mesmas curvas, na grafia da Web Animations API. */
const bezier = (c: readonly number[]) => `cubic-bezier(${c.join(",")})`

/**
 * A saída, como **sequência imperativa na Web Animations API**, e não como
 * `exit` do `AnimatePresence`:
 *
 * - o motion fixa em px a altura de quem sai no instante em que a saída
 *   começa, e o espaço ficava preso em 167px enquanto as faixas colapsavam por
 *   dentro — um buraco vazio que só fechava no fim. Aqui o espaço continua
 *   `auto`, acompanha o colapso, e o que sobra (a linha do título) é medido
 *   **depois** dele;
 * - e não o `animate` imperativo do motion, que reconhece elemento por
 *   `instanceof HTMLElement` da janela de fora: dentro da moldura do catálogo
 *   (um iframe) ele tratava o nó como objeto comum e nada se movia. A WAAPI é a
 *   do próprio elemento — o precedente do `ThemeToggle` e do `viajarLiquido`.
 */
async function sairPelaEsquerda(espaco: HTMLElement, cartao: HTMLElement) {
  const fim = { fill: "forwards" } as const
  // As faixas colapsam de baixo para cima: ações, mídia, descrição. O recorte
  // entra agora — aberto, o leque transborda a faixa da mídia. Altura e recuo
  // medidos antes de qualquer coisa mudar.
  const faixas = [...espaco.querySelectorAll<HTMLElement>("[data-onboarding-collapse]")].reverse()
  const medidas = faixas.map((faixa) => ({
    altura: faixa.offsetHeight,
    recuo: getComputedStyle(faixa).paddingTop,
  }))
  for (const faixa of faixas) faixa.style.overflow = "hidden"
  const colapso = faixas.map((faixa, i) =>
    faixa.animate(
      [
        { height: `${medidas[i].altura}px`, paddingTop: medidas[i].recuo, opacity: 1 },
        { height: "0px", paddingTop: "0px", opacity: 0 },
      ],
      { ...fim, duration: 240, delay: i * 50, easing: bezier(CURVA_ENFATICA) }
    ).finished
  )
  // O cartão diminui e sai pela esquerda, depois de um impulso para a direita;
  // cada trecho com a sua curva (a da casa, depois a de aceleração).
  // A origem (a borda esquerda) vai nos próprios quadros: o balão do
  // `Popover` tem a dele, a do lado de onde abriu, e ela venceria.
  const saida = cartao.animate(
    [
      { transform: "translateX(0%) scale(1)", transformOrigin: "0% 50%", easing: bezier(CURVA_ENFATICA) },
      { transform: "translateX(1.5%) scale(0.96)", transformOrigin: "0% 50%", offset: 0.4, easing: bezier(CURVA_SAIDA) },
      { transform: "translateX(-115%) scale(0.72)", transformOrigin: "0% 50%" },
    ],
    { ...fim, duration: 620 }
  ).finished
  const esmaecer = cartao.animate(
    [
      { opacity: 1, filter: "blur(0px)" },
      { opacity: 0, filter: "blur(3px)" },
    ],
    { ...fim, duration: 200, delay: 420, easing: bezier(CURVA_SAIDA) }
  ).finished
  await Promise.all(colapso)
  // O que sobrou do espaço fecha agora, medido depois do colapso.
  const fechar = espaco.animate(
    [{ height: `${espaco.offsetHeight}px` }, { height: "0px" }],
    { ...fim, duration: 260, delay: 100, easing: bezier(CURVA_SUAVE) }
  ).finished
  await Promise.all([saida, esmaecer, fechar])
}

/**
 * A entrada do balão do hotspot, o caminho de volta da saída: ele **brota do
 * ponto** — nasce a 60%, desfocado e transparente, com a origem no lado de
 * onde o `Popover` abre (o ponto), e cresce na mola da casa —, e logo atrás as
 * faixas (descrição e botão) **se desdobram** em cascata, de cima para baixo,
 * o espelho do colapso. A mola e a duração são lidas dos tokens
 * (`--ease-spring`, `--duration-spring`) no próprio elemento; sem `fill`
 * para a frente, então no fim tudo volta ao natural (a altura `auto`).
 */
async function brotarDoPonto(balao: HTMLElement) {
  const estilo = getComputedStyle(balao)
  const mola = estilo.getPropertyValue("--ease-spring").trim() || bezier(CURVA_ENFATICA)
  const duracao = parseFloat(estilo.getPropertyValue("--duration-spring")) || 500
  const faixas = [...balao.querySelectorAll<HTMLElement>("[data-onboarding-collapse]")]
  const medidas = faixas.map((faixa) => ({
    altura: faixa.offsetHeight,
    recuo: getComputedStyle(faixa).paddingTop,
  }))
  for (const faixa of faixas) faixa.style.overflow = "hidden"
  const brotar = balao.animate(
    [
      // A origem é a do próprio popover (a classe `origin-(--radix-…)`), que
      // aponta para o ponto e acompanha o posicionamento quando ele termina.
      { opacity: 0, transform: "scale(0.6)", filter: "blur(6px)" },
      { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
    ],
    { duration: duracao, easing: mola }
  ).finished
  const desdobrar = faixas.map((faixa, i) =>
    faixa.animate(
      [
        { height: "0px", paddingTop: "0px", opacity: 0 },
        { height: `${medidas[i].altura}px`, paddingTop: medidas[i].recuo, opacity: 1 },
      ],
      { duration: 320, delay: 120 + i * 60, easing: bezier(CURVA_ENFATICA), fill: "backwards" }
    ).finished
  )
  await Promise.all([brotar, ...desdobrar]).catch(() => {})
  for (const faixa of faixas) faixa.style.overflow = ""
}

/**
 * A saída do balão do hotspot é **o avesso da entrada**, e não a do card: o
 * caminho de volta para o ponto de onde ele brotou.
 *
 * 1. As faixas se **dobram de baixo para cima** — o botão, depois a descrição
 *    —, o espelho do desdobrar.
 * 2. O balão **volta para dentro do ponto**: a 60%, desfocado e transparente,
 *    com a mesma origem da entrada (a do popover, no ponto), começando enquanto
 *    as faixas ainda dobram. Mais curta que a entrada e em curva de saída —
 *    fechar é curva, não mola.
 * 3. Quem fecha a cena é o ponto, que absorve o balão e se apaga (o `exit`
 *    dele, no componente).
 */
async function recolherNoPonto(balao: HTMLElement) {
  const fim = { fill: "forwards" } as const
  const faixas = [...balao.querySelectorAll<HTMLElement>("[data-onboarding-collapse]")].reverse()
  const medidas = faixas.map((faixa) => ({
    altura: faixa.offsetHeight,
    recuo: getComputedStyle(faixa).paddingTop,
  }))
  for (const faixa of faixas) faixa.style.overflow = "hidden"
  const dobrar = faixas.map((faixa, i) =>
    faixa.animate(
      [
        { height: `${medidas[i].altura}px`, paddingTop: medidas[i].recuo, opacity: 1 },
        { height: "0px", paddingTop: "0px", opacity: 0 },
      ],
      { ...fim, duration: 220, delay: i * 60, easing: bezier(CURVA_ENFATICA) }
    ).finished
  )
  const recolher = balao.animate(
    [
      { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
      { opacity: 0, transform: "scale(0.6)", filter: "blur(6px)" },
    ],
    { ...fim, duration: 260, delay: 140, easing: bezier(CURVA_SAIDA) }
  ).finished
  await Promise.all([...dobrar, recolher])
}

/**
 * O checklist tem o gesto dele: **enrola e desenrola, como uma persiana** —
 * o que uma lista de passos sugere, e não a saída lateral do card nem a volta
 * ao ponto da dica.
 *
 * Desenrolar (aparecer): o espaço abre, o cartão desce de leve até o lugar, e
 * as linhas (`[data-onboarding-row]`) se desenrolam **de cima para baixo**,
 * uma a uma; o tique dos passos feitos estala na mola quando a linha chega.
 * Sem `fill` para a frente: no fim, tudo volta ao natural.
 */
async function desenrolar(espaco: HTMLElement, cartao: HTMLElement) {
  // **Medir só depois de a altura assentar.** Na montagem o conteúdo pode
  // ainda não ter a largura final — dentro da moldura do catálogo, o iframe
  // recém-criado está se assentando —, e o texto, quebrado em colunas
  // estreitas, media milhares de pixels. Escondido enquanto isso, espera até a
  // altura do cartão repetir entre dois quadros (no app, é o segundo quadro).
  espaco.style.height = "0px"
  cartao.style.opacity = "0"
  const janela = espaco.ownerDocument.defaultView ?? window
  let anterior = -1
  for (let i = 0; i < 12; i++) {
    await new Promise((pronto) => janela.requestAnimationFrame(pronto))
    const altura = cartao.offsetHeight
    if (altura > 0 && altura === anterior) break
    anterior = altura
  }
  if (!espaco.isConnected) return
  const estilo = getComputedStyle(cartao)
  const mola = estilo.getPropertyValue("--ease-spring").trim() || bezier(CURVA_ENFATICA)
  const linhas = [...cartao.querySelectorAll<HTMLElement>("[data-onboarding-row]")]
  const alturas = linhas.map((linha) => linha.offsetHeight)
  // O espaço abre só até o cabeçalho (o cartão com as linhas fechadas); dali
  // em diante ele cresce sozinho, junto com as linhas. Abrir até a altura final
  // dava um tranco: ao terminar, ele voltava à natural com as linhas ainda
  // abrindo.
  const cabeca = cartao.offsetHeight - alturas.reduce((soma, altura) => soma + altura, 0)
  for (const linha of linhas) linha.style.overflow = "hidden"
  const animacoes = [
    espaco.animate([{ height: "0px" }, { height: `${cabeca}px` }], {
      duration: 200,
      easing: bezier(CURVA_ENFATICA),
    }).finished,
    cartao.animate(
      [
        { opacity: 0, transform: "translateY(-10px)", filter: "blur(3px)" },
        { opacity: 1, transform: "translateY(0)", filter: "blur(0px)" },
      ],
      { duration: 380, delay: 60, easing: bezier(CURVA_ENFATICA), fill: "backwards" }
    ).finished,
    ...linhas.map(
      (linha, i) =>
        linha.animate(
          [
            { height: "0px", opacity: 0, transform: "translateY(-6px)" },
            { height: `${alturas[i]}px`, opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 280, delay: 160 + i * 45, easing: bezier(CURVA_ENFATICA), fill: "backwards" }
        ).finished
    ),
    ...linhas.flatMap((linha, i) =>
      [...linha.querySelectorAll<HTMLElement>('[data-slot="onboarding-check"][data-done]')].map(
        (tique) =>
          tique.animate([{ transform: "scale(0.4)" }, { transform: "scale(1)" }], {
            duration: 500,
            delay: 280 + i * 45,
            easing: mola,
            fill: "backwards",
          }).finished
      )
    ),
  ]
  // As animações já seguram o começo (o espaço em 0, o cartão invisível pelo
  // `fill: backwards`): o estilo da espera sai.
  espaco.style.height = ""
  cartao.style.opacity = ""
  await Promise.all(animacoes).catch(() => {})
  for (const linha of linhas) linha.style.overflow = ""
}

/**
 * Enrolar (fechar), o avesso: as linhas sobem e somem **de baixo para cima**
 * (a última primeiro), como enroladas no cabeçalho; com o cabeçalho sozinho,
 * o cartão sobe 10px e se dissolve, e o espaço — medido nesse instante —
 * fecha. Em curva, não em mola.
 */
async function enrolar(espaco: HTMLElement, cartao: HTMLElement) {
  const fim = { fill: "forwards" } as const
  const linhas = [...cartao.querySelectorAll<HTMLElement>("[data-onboarding-row]")].reverse()
  const alturas = linhas.map((linha) => linha.offsetHeight)
  for (const linha of linhas) linha.style.overflow = "hidden"
  const enrolarLinhas = Promise.all(
    linhas.map(
      (linha, i) =>
        linha.animate(
          [
            { height: `${alturas[i]}px`, opacity: 1, transform: "translateY(0)" },
            { height: "0px", opacity: 0, transform: "translateY(-8px)" },
          ],
          { ...fim, duration: 220, delay: i * 45, easing: bezier(CURVA_ENFATICA) }
        ).finished
    )
  )
  // O cartão começa a se dissolver enquanto a última linha ainda enrola: o
  // cabeçalho não fica sozinho, parado, antes de sumir.
  const dissolver = cartao.animate(
    [
      { opacity: 1, transform: "translateY(0)", filter: "blur(0px)" },
      { opacity: 0, transform: "translateY(-10px)", filter: "blur(4px)" },
    ],
    { ...fim, duration: 240, delay: Math.max(0, linhas.length - 1) * 45 + 140, easing: bezier(CURVA_SAIDA) }
  ).finished
  await enrolarLinhas
  // O espaço fecha depois das linhas, medido nesse instante.
  const fechar = espaco.animate([{ height: `${espaco.offsetHeight}px` }, { height: "0px" }], {
    ...fim,
    duration: 260,
    easing: bezier(CURVA_SUAVE),
  }).finished
  await Promise.all([dissolver, fechar])
}

/** Com movimento reduzido, só a opacidade, e o espaço some de uma vez. */
const CARTAO_REDUZIDO = {
  inicial: { opacity: 0 },
  aberto: { opacity: 1, transition: { duration: 0.15 } },
}

/**
 * A novidade no rodapé da barra lateral (KarrixLee). Em repouso a mídia fica
 * recortada a 75px, dissolvendo no cartão; aberto, cresce até a altura da imagem e as imagens
 * se abrem em leque, e o rodapé (dispensar e saiba mais) desce.
 *
 * **Abre de três jeitos, e a referência só tinha um**: o cursor (só mouse), o
 * foco de teclado e o toque — que alterna. Na referência só o `mouseenter`
 * abria, então no telefone o dispensar era inalcançável, e ele era uma `div`.
 */
function OnboardingCard({
  title,
  description,
  media = [],
  action,
  dismissLabel = "Dispensar",
  storageKey,
  dismiss = "forever",
  onDismiss,
  variant = "brand",
  className,
}: OnboardingCardProps) {
  const reduzido = useReducedMotion() ?? false
  const contraste = variant === "contrast"
  const escuro = useTemaEscuro()
  const [guardado, gravar, lido] = useGuardado(
    storageKey,
    dismiss === "session" ? "session" : "local"
  )
  const [dispensado, setDispensado] = React.useState(false)
  const [aberto, setAberto] = React.useState(false)
  const ponteiro = React.useRef<string>("mouse")
  const itens = media.slice(0, 3)
  // O `contrast` espera o cliente: o tema oposto só se sabe lendo o `<html>`, e
  // um palpite no servidor pintaria o cartão errado no primeiro quadro.
  const visivel =
    lido && !dispensado && guardado !== DISPENSADO && !(contraste && escuro === null)
  const mola = reduzido ? { duration: 0 } : MOLA_LEQUE
  const faixa = reduzido ? undefined : FAIXA_DO_CARD

  // **Um número só abre a mídia**: `abertura` vai de 0 a 1 na mola do leque, e
  // a altura, a folga e o recorte saem dele. A primeira versão animava
  // `height: "auto"` junto com o `padding`: o motion mede o "auto" no começo,
  // com o padding ainda em 0 (120px), anima até lá enquanto o padding cresce, e
  // no fim troca para `auto` de verdade — o salto de 120 para 144 que quebrava a
  // abertura. Aqui a altura aberta é a da imagem, medida, mais a folga.
  const abertura = useMotionValue(0)
  const alturaImagem = useMotionValue(0)
  const folga = folgaDoLeque(itens.length)
  const folgaCima = useMotionValue(folga.paddingTop)
  const folgaBaixo = useMotionValue(folga.paddingBottom)
  React.useEffect(() => {
    folgaCima.set(folga.paddingTop)
    folgaBaixo.set(folga.paddingBottom)
  }, [folga.paddingTop, folga.paddingBottom, folgaCima, folgaBaixo])
  React.useEffect(() => {
    if (reduzido) {
      abertura.jump(aberto ? 1 : 0)
      return
    }
    const controle = animate(abertura, aberto ? 1 : 0, MOLA_LEQUE)
    return () => controle.stop()
  }, [aberto, reduzido, abertura])
  // A mola passa um pouco do alvo; a folga e o recorte não passam de zero.
  const t = useTransform(() => Math.max(0, abertura.get()))
  const altura = useTransform(
    () => 75 + (alturaImagem.get() + folgaCima.get() + folgaBaixo.get() - 75) * abertura.get()
  )
  const paddingTop = useTransform(() => folgaCima.get() * t.get())
  const paddingBottom = useTransform(() => folgaBaixo.get() * t.get())
  // O recorte é **quadrado** e anima junto: em repouso, a caixa (75px); aberto,
  // 12px além dela — a borda de dentro do cartão, cujo casco de marca recorta
  // 4px fora da borda, para o anel. Trocar `overflow` por classe saltava: ao
  // abrir, a imagem aparecia de uma vez 12px abaixo da caixa; ao fechar, o
  // leque ainda aberto era cortado.
  const recorte = useTransform(() => `inset(${-12 * t.get()}px)`)
  // A primeira imagem dá a altura, e o observador a acompanha se a largura
  // mudar. Memorizada: uma `ref` de função refeita a cada render religaria o
  // observador a cada render (a medição da rodada 212).
  const medirImagem = React.useCallback(
    (el: HTMLSpanElement | null) => {
      if (!el) return
      const ro = new ResizeObserver(() => alturaImagem.set(el.offsetHeight))
      ro.observe(el)
      return () => ro.disconnect()
    },
    [alturaImagem]
  )

  const escopo = React.useRef<HTMLDivElement>(null)

  // **Aberto pelo toque ou pelo teclado, o card rola até aparecer inteiro**:
  // no fim de um feed de telefone ele cresce para baixo da barra de baixo, e o
  // rodapé (dispensar, saiba mais) ficava escondido. Pelo cursor ele já está
  // à vista. Depois da abertura (a mola do leque assenta em ~400ms), e só o
  // necessário — quem rola respeita o `scroll-padding` da tela, que desconta
  // as barras.
  const mostrarAoAbrir = React.useRef(false)
  React.useEffect(() => {
    const el = escopo.current
    if (!aberto || !mostrarAoAbrir.current || !el) return
    mostrarAoAbrir.current = false
    const win = el.ownerDocument.defaultView ?? window
    const espera = win.setTimeout(
      () => el.scrollIntoView({ block: "nearest", behavior: reduzido ? "auto" : "smooth" }),
      reduzido ? 0 : 400
    )
    return () => win.clearTimeout(espera)
  }, [aberto, reduzido])
  const saindo = React.useRef(false)
  const dispensar = async () => {
    if (saindo.current) return
    saindo.current = true
    // O colapso começa pelo leque: ele recolhe enquanto as faixas se fecham.
    setAberto(false)
    const espaco = escopo.current
    const cartao = espaco?.querySelector<HTMLElement>('[data-slot="onboarding-card-motion"]')
    if (espaco && cartao) {
      if (reduzido) await espaco.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: "forwards" }).finished
      else await sairPelaEsquerda(espaco, cartao)
    }
    // Grava só no fim: o `guardado` dispensado desmontaria o card no meio.
    gravar(DISPENSADO)
    setDispensado(true)
    onDismiss?.()
  }

  // **O `beam` é o brilho de marca sem o ponteiro**: a mesma `@utility
  // brand-glow` (o arco-íris parado, a janela que viaja), com o ângulo girando
  // sozinho — o `--brand-glow-start` escrito a cada quadro, como o
  // `useBrandGlow` faz. Com movimento reduzido o arco fica parado no topo.
  const superficieRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = superficieRef.current
    if (variant !== "beam" || !visivel || !el) return
    if (reduzido) {
      el.style.setProperty("--brand-glow-start", "0")
      return
    }
    const volta = animate(0, 360, {
      duration: VOLTA_DO_FEIXE,
      ease: "linear",
      repeat: Infinity,
      onUpdate: (v) => el.style.setProperty("--brand-glow-start", String(v)),
    })
    return () => volta.stop()
  }, [variant, visivel, reduzido])

  return (
    <AnimatePresence initial={false}>
      {visivel ? (
        <motion.div
          key="card"
          data-slot="onboarding-card"
          data-open={aberto || undefined}
          // O espaço do card. Recorta com 4px de folga, para o anel do brilho
          // (2px por fora da borda, mais o borrão) não ser cortado enquanto
          // a altura fecha.
          ref={escopo}
          variants={reduzido ? undefined : ESPACO_DO_CARD}
          initial="inicial"
          animate="aberto"
          className={cn(
            "overflow-clip [overflow-clip-margin:var(--spacing)] group-data-[collapsible=icon]:hidden",
            className
          )}
          // O cursor abre e fecha; o dedo, não (nem o da moldura do iPhone).
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse" && !deDedo(e.currentTarget)) setAberto(true)
          }}
          onPointerLeave={(e) => {
            if (e.pointerType !== "mouse" || deDedo(e.currentTarget)) return
            // Só o foco **de teclado** segura o card aberto quando o mouse sai:
            // quem chegou pelo Tab não pode vê-lo fechar sob o foco. O foco que
            // um clique de mouse deixa num botão não é `:focus-visible`, e era
            // ele que prendia o card aberto depois de clicar na mídia.
            const foco = e.currentTarget.ownerDocument.activeElement
            if (foco && e.currentTarget.contains(foco) && foco.matches(":focus-visible")) return
            setAberto(false)
          }}
          // Só o foco de teclado abre: o toque que foca a mídia (o Chrome do
          // Android foca botão no toque) abria aqui e o clique logo fechava.
          onFocus={(e) => {
            if (!(e.target as HTMLElement).matches(":focus-visible")) return
            mostrarAoAbrir.current = true
            setAberto(true)
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setAberto(false)
          }}
        >
          {/* O cartão diminui em direção à borda esquerda, por onde sai. */}
          <motion.div
            data-slot="onboarding-card-motion"
            variants={reduzido ? CARTAO_REDUZIDO : CARTAO_DO_CARD}
            style={{ transformOrigin: "0% 50%" }}
          >
          {/* `brand` e `beam` são a peça de marca da tela — uma por tela. */}
          <Card
            ref={superficieRef}
            data-slot="onboarding-card-surface"
            data-variant={variant}
            // O `contrast` é o `brand` no tema oposto: o mesmo casco, o mesmo
            // brilho no ponteiro, e as cores trocadas abaixo.
            variant={variant === "beam" ? "outline" : "brand"}
            padding="none"
            className={cn(
              // No telefone o cabeçalho é o do checklist (recuo 16, `CardTitle
              // sm`, a descrição a 4px, o mesmo ×); na barra lateral do
              // desktop, o compacto (recuo 12, título de 12, × de 24).
              "gap-0 p-4 text-xs md:p-3",
              // O casco do `Card brand` (o recorte com folga para o anel),
              // com o arco sempre aceso e um pouco mais forte que o do ponteiro:
              // ele existe para ser visto.
              variant === "beam" &&
                "brand-glow isolate overflow-clip [overflow-clip-margin:var(--spacing)] [--brand-glow-active:1] [--brand-glow-opacity:0.8]",
              // **O `contrast` é o `brand` dentro do tema oposto**, e não uma
              // imitação dele: o cartão vira uma ilha de tema — `.light` no
              // escuro, `.dark` no claro, as duas paletas do `globals.css` (a
              // `.light` já servia à página de Cores) — e tudo dentro dele, as
              // ilustrações incluídas, se pinta no outro tema. A primeira
              // versão trocava só as cores do cartão, e a mídia ficava escura
              // num cartão branco.
              contraste && (escuro ? "light" : "dark")
            )}
          >
            {/* O × fecha a qualquer momento — o dispensar do rodapé só aparece
                com o card aberto. */}
            <motion.div variants={faixa} className="flex items-start gap-2">
              <CardTitle size="sm" className="min-w-0 flex-1 md:text-xs md:font-medium">
                {title}
              </CardTitle>
              <Button
                type="button"
                variant="tertiary"
                size="icon-sm"
                data-slot="onboarding-card-close"
                onClick={dispensar}
                className={cn(
                  X_DO_CARTAO,
                  // O compacto do desktop: o degrau `icon-xs`, sem descontar a
                  // base, e o alvo de 32 também no mouse.
                  "md:mb-0 md:size-6 md:[&_svg:not([class*='size-'])]:size-3",
                  "md:after:absolute md:after:-inset-1 md:after:content-[''] md:pointer-coarse:after:-inset-2.5"
                )}
              >
                <XMarkIcon />
                <span className="sr-only">{dismissLabel}</span>
              </Button>
            </motion.div>
            {description ? (
              <motion.div variants={faixa} data-onboarding-collapse className="pt-1 md:pt-0.5">
                <CardDescription className="text-xs">{description}</CardDescription>
              </motion.div>
            ) : null}

            {itens.length ? (
              <motion.div variants={faixa} data-onboarding-collapse className="pt-3">
              <button
                type="button"
                data-slot="onboarding-card-media"
                aria-expanded={aberto}
                aria-label={aberto ? "Recolher a novidade" : "Ver a novidade"}
                onPointerDown={(e) => {
                  ponteiro.current = e.pointerType
                }}
                onClick={(e) => {
                  // O mouse já abriu pelo cursor; o clique dele não fecha.
                  // Toque, caneta e teclado (`detail` 0) alternam.
                  if (e.detail !== 0 && ponteiro.current === "mouse" && !deDedo(e.currentTarget)) return
                  mostrarAoAbrir.current = !aberto
                  setAberto(!aberto)
                }}
                className={cn(
                  "relative block w-full text-left outline-none",
                  "focus-visible:ring-3 focus-visible:ring-ring/45"
                )}
              >
                {/* O palco: a altura, a folga e o recorte saem da `abertura`. O
                    recorte mora aqui, e não no botão, para não cortar o anel de
                    foco dele. A primeira imagem fica no fluxo e dá a altura; as
                    outras se empilham sobre ela. */}
                <motion.span
                  data-slot="onboarding-card-stage"
                  className="block"
                  style={{ height: altura, paddingTop, paddingBottom, clipPath: recorte }}
                >
                  <span className="relative block">
                    {itens.map((m, i) => (
                      <motion.span
                        key={i}
                        ref={i === 0 ? medirImagem : undefined}
                        initial={false}
                        animate={aberto ? lequeDaMidia(i, itens.length) : { rotate: 0, x: 0, y: 0, scale: 1 }}
                        transition={mola}
                        className={i === 0 ? "relative block" : "absolute inset-0 block"}
                        style={{ zIndex: i }}
                      >
                        <OnboardingMedia
                          media={m}
                          className="aspect-video w-full rounded-row border border-border shadow-lg"
                        />
                      </motion.span>
                    ))}
                  </span>
                </motion.span>
                <motion.span
                  aria-hidden
                  initial={false}
                  animate={{ opacity: aberto ? 0 : 1 }}
                  transition={{ duration: reduzido ? 0 : 0.2 }}
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-linear-to-b from-transparent to-card"
                />
              </button>
              </motion.div>
            ) : null}

            {/* O par de ações divide a linha ao meio: o saiba mais é o primário,
                o dispensar o acompanha em `tertiary`. A folga de 4px em volta é
                do anel de foco, que o `overflow-hidden` da altura cortaria. */}
            {/* A faixa por fora; a de dentro anima a própria altura (abrir e
                recolher o rodapé) e não herda os rótulos do cartão. */}
            <motion.div variants={faixa} data-onboarding-collapse>
            <motion.div
              initial={false}
              animate={{ height: aberto ? "auto" : 0, opacity: aberto ? 1 : 0 }}
              transition={mola}
              className="-mx-1 overflow-hidden px-1"
            >
              <div className="flex items-center gap-2 pt-3 pb-1">
                <Button type="button" variant="tertiary" size="sm" className="flex-1 pointer-coarse:h-10" onClick={dispensar}>
                  {dismissLabel}
                </Button>
                {action ? (
                  <Button asChild variant="primary" size="sm" className="flex-1 pointer-coarse:h-10">
                    <Link href={action.href}>{action.label}</Link>
                  </Button>
                ) : null}
              </div>
            </motion.div>
            </motion.div>
          </Card>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

/* ── OnboardingHotspot ──────────────────────────────────────────────────── */

type OnboardingHotspotProps = {
  /** O botão real que o ponto marca. */
  children: React.ReactNode
  title: string
  description?: React.ReactNode
  /** O nome do ponto para o leitor de tela. */
  label?: string
  /** Guarda em `localStorage` que foi visto. */
  storageKey?: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  dismissLabel?: string
  className?: string
}

/**
 * O ponto que pulsa sobre um botão, sem escurecer a tela — o "olhe aqui" que
 * não interrompe. Tocar no ponto abre a dica ancorada; **usar o botão o
 * apaga**, porque quem usou já descobriu. O pulso é o `BadgeDot`, que o bloco
 * global de movimento reduzido corta.
 */
function OnboardingHotspot({
  children,
  title,
  description,
  label = "Novidade",
  storageKey,
  side = "bottom",
  align = "center",
  dismissLabel = "entendi",
  className,
}: OnboardingHotspotProps) {
  const reduzido = useReducedMotion() ?? false
  const [guardado, gravar, lido] = useGuardado(storageKey)
  const [visto, setVisto] = React.useState(false)
  const [dica, setDica] = React.useState(false)
  const pontoRef = React.useRef<HTMLButtonElement>(null)
  const dicaRef = React.useRef<HTMLDivElement>(null)
  const saindo = React.useRef(false)
  const ativo = lido && !visto && guardado !== VISTO

  const marcar = () => {
    gravar(VISTO)
    setVisto(true)
    setDica(false)
  }

  // Abrir a dica: ela brota do ponto (no lugar da entrada genérica do popover,
  // que a classe abaixo desliga). Por `ref` de função, que roda no instante em
  // que o balão entra no DOM: um efeito em `dica` disparava antes de o Radix
  // montar o conteúdo, e o balão aparecia inteiro. **E só uma vez por balão**:
  // o Radix recompõe a `ref` a cada render (a medição da rodada 212), e cada
  // chamada recomeçava a entrada medindo as faixas já presas em zero.
  const brotou = React.useRef<HTMLDivElement | null>(null)
  const refDaDica = React.useCallback(
    (balao: HTMLDivElement | null) => {
      dicaRef.current = balao
      if (!balao || balao === brotou.current) return
      brotou.current = balao
      saindo.current = false
      if (!reduzido) void brotarDoPonto(balao)
    },
    [reduzido]
  )

  // O "entendi" recolhe a dica de volta para o ponto (`recolherNoPonto`), o
  // avesso do brotar — e então o ponto, que a absorveu, se apaga. Usar o botão
  // real continua apagando só o ponto.
  const entendi = async () => {
    if (saindo.current) return
    saindo.current = true
    const balao = dicaRef.current
    if (balao) {
      if (reduzido) await balao.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: "forwards" }).finished
      else await recolherNoPonto(balao)
    }
    marcar()
  }

  return (
    <Popover open={ativo && dica} onOpenChange={setDica}>
      <PopoverAnchor asChild>
        <span
          data-slot="onboarding-hotspot"
          className={cn("relative inline-flex", className)}
          onClickCapture={(e) => {
            const alvo = e.target as Node
            if (!ativo || pontoRef.current?.contains(alvo)) return
            if (e.currentTarget.contains(alvo)) marcar()
          }}
        >
          {children}
          <AnimatePresence>
            {ativo ? (
              <motion.span
                key="ponto"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                // O ponto absorve o balão e se apaga: uma pulsada (1,35) e some
                // — o fim da volta do balão para a fonte. Com movimento
                // reduzido, só esmaece.
                exit={
                  reduzido
                    ? { opacity: 0, transition: { duration: 0.15 } }
                    : {
                        scale: [1, 1.35, 0],
                        opacity: [1, 1, 0],
                        transition: { duration: 0.34, times: [0, 0.35, 1], ease: [CURVA_ENFATICA, CURVA_SAIDA] },
                      }
                }
                transition={{ duration: 0.2 }}
                className="absolute -end-1 -top-1 z-10 flex"
              >
                <PopoverTrigger asChild>
                  <button
                    ref={pontoRef}
                    type="button"
                    data-slot="onboarding-hotspot-dot"
                    aria-label={label}
                    className={cn(
                      "relative flex size-3.5 items-center justify-center rounded-full outline-none",
                      "after:absolute after:-inset-1.5 after:content-[''] pointer-coarse:after:-inset-4",
                      "focus-visible:ring-3 focus-visible:ring-ring/45"
                    )}
                  >
                    <BadgeDot pulse className="size-2.5 [--badge-dot:var(--info)]" />
                  </button>
                </PopoverTrigger>
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>
      </PopoverAnchor>
      <PopoverContent
        ref={refDaDica}
        size="sm"
        side={side}
        align={align}
        sideOffset={8}
        // A entrada é a do `brotarDoPonto`, pela Web Animations API; a do
        // popover sai, senão as duas animariam a mesma transformação. Com
        // movimento reduzido, a dica aparece na hora.
        motion="none"
      >
        <PopoverArrow />
        <div className="flex flex-col">
          <PopoverTitle>{title}</PopoverTitle>
          {description ? (
            <div data-onboarding-collapse>
              <PopoverDescription>{description}</PopoverDescription>
            </div>
          ) : null}
        </div>
        <div data-onboarding-collapse className="flex">
          <Button type="button" variant="secondary" size="sm" onClick={entendi} className="pointer-coarse:h-10">
            {dismissLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ── OnboardingTour ─────────────────────────────────────────────────────── */

type OnboardingTourProps = {
  steps: OnboardingTourStep[]
  open?: boolean
  /** Começa sozinho na primeira visita (a menos que o `storageKey` diga que já foi visto). */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Guarda em `localStorage` o passo, a conclusão e o pular. */
  storageKey?: string
  onComplete?: () => void
  onSkip?: () => void
  nextLabel?: string
  backLabel?: string
  /** O nome do × da placa, que pula o tour. */
  skipLabel?: string
  finishLabel?: string
  /** O texto do passo que avança pelo clique no próprio elemento. */
  hint?: string
}

/** Os quatro bloqueios em volta do buraco: o clique no véu não chega à tela. */
const BLOQUEIO = "pointer-events-auto absolute"
/**
 * A camada do tour fica **um degrau acima** dos popovers, e é a exceção
 * consciente à regra de não escalar: o menu que o clique abriu (o "+
 * Adicionar") tem de ficar **sob** o véu, com o buraco no item, senão ele
 * pinta por cima do recorte e esconde o anel. Os toasts continuam acima.
 */
const CAMADA_VEU = "z-[calc(var(--z-popover)+1)]"
const CAMADA_PLACA = "z-[calc(var(--z-popover)+2)]"

/**
 * **O gesto do tour é o foco**, o de uma íris de câmera — e não a saída
 * lateral do card, a volta ao ponto da dica nem a persiana do checklist:
 *
 * - **Abrir**: o véu fecha sobre o alvo vindo das bordas (o buraco nasce
 *   maior que a janela e encolhe até o recorte), com o anel de marca
 *   chegando junto; a placa surge depois que ele pousa.
 * - **Trocar de passo**: a placa some para dentro do alvo de agora, o buraco
 *   viaja ao próximo e pousa com um **pulso** do anel, e só então a placa nova
 *   surge do lado do alvo, com as faixas subindo em cascata.
 * - **Fechar**: a placa some e a íris abre — o buraco cresce além da tela e o
 *   véu sai pelas bordas.
 *
 * Em curva, e não na `MOLA`: com ela o buraco passava do alvo (num cartão de
 * 400 × 354, chegava a 427 × 393), e a placa ancorada nele era espremida
 * contra a borda, cortando o rodapé.
 */
const IRIS_FECHA = { duration: 0.75, ease: CURVA_ENFATICA }
const VIAGEM = { duration: 0.5, ease: CURVA_ENFATICA }
const IRIS_ABRE = { duration: 0.45, delay: 0.06, ease: CURVA_SAIDA }
const PULSO = { duration: 0.8, ease: CURVA_ENFATICA }
/** Quanto o pulso se afasta do recorte ao pousar, em px. */
const ALCANCE_DO_PULSO = 14
/**
 * **O anel de marca é desenho do tour**, e não a `@utility brand-glow`: o
 * brilho da casa repete o arco-íris 2,5 vezes na volta (vinte faixas de 18°,
 * feitas para um arco curto passando pela borda), e numa pílula larga as
 * faixas se espremiam no meio da aresta comprida e esticavam nos cantos —
 * lia como listra, não como anel. Aqui é o degradê oficial da marca
 * (`--brand-rainbow`, o linear de 135° em oklch), que atravessa o anel uma vez
 * e parado (a cor não gira; a regra da rodada 100). Um cônico de uma volta
 * também foi visto: num alvo largo ele espreme as cores no meio da aresta.
 *
 * É um traço nítido de 2px, colado na borda do buraco e concêntrico com ele (o
 * raio dele mais 2, em `--onboarding-raio`, que o recorte publica), e **parado**:
 * houve um brilho borrado correndo em volta dele, e saiu a pedido do dono.
 *
 * A máscara recorta o anel com uma cor de token opaca: ela só lê o alfa.
 */
const ARCO_IRIS_DO_ANEL = "brand-rainbow-image bg-(image:--brand-rainbow)"
const TRACO_DO_ANEL = [
  "absolute rounded-[var(--onboarding-raio)] p-0.5",
  "[mask:linear-gradient(var(--foreground)_0_0)_content-box_exclude,linear-gradient(var(--foreground)_0_0)]",
  ARCO_IRIS_DO_ANEL,
].join(" ")

/** O buraco que cobre a janela em volta de um recorte: de onde a íris fecha e para onde ela abre. */
function irisDe(r: Recorte, largura: number, altura: number): Recorte {
  const d = Math.hypot(largura, altura)
  return { x: r.x - d, y: r.y - d, w: r.w + d * 2, h: r.h + d * 2, r: r.r + d }
}

/**
 * O lado do alvo, visto da placa: é de lá que ela surge e para lá que ela
 * some. A ancorada diz pelo `data-side` do Radix (já desviado da borda); a
 * presa no telefone sobe da borda em que prende; a do centro não se desloca.
 */
function rumoAoAlvo(placa: HTMLElement, px: number) {
  const doca = placa.dataset.dock
  const lado = placa.dataset.side ?? (doca === "bottom" ? "top" : doca === "top" ? "bottom" : undefined)
  if (lado === "bottom") return { x: 0, y: -px }
  if (lado === "top") return { x: 0, y: px }
  if (lado === "right") return { x: -px, y: 0 }
  if (lado === "left") return { x: px, y: 0 }
  return { x: 0, y: 0 }
}

const umQuadro = (win: Window) => new Promise<void>((pronto) => win.requestAnimationFrame(() => pronto()))

/**
 * A placa surge **do lado do alvo**: nasce a 92%, desfocada, deslocada 10px na
 * direção dele e com a origem que o Radix aponta para a âncora, e cresce na
 * mola da casa; as faixas (`[data-onboarding-rise]`) sobem logo atrás, em
 * cascata. Espera dois quadros escondida, porque o lado só é o de verdade
 * depois que a âncora virtual posiciona.
 */
async function surgirDoAlvo(placa: HTMLElement) {
  const win = placa.ownerDocument.defaultView ?? window
  placa.style.opacity = "0"
  await umQuadro(win)
  await umQuadro(win)
  const estilo = win.getComputedStyle(placa)
  const mola = estilo.getPropertyValue("--ease-spring").trim() || bezier(CURVA_ENFATICA)
  const duracao = parseFloat(estilo.getPropertyValue("--duration-spring")) || 500
  const { x, y } = rumoAoAlvo(placa, 10)
  const surgir = placa.animate(
    [
      { opacity: 0, transform: `translate(${x}px, ${y}px) scale(0.92)`, filter: "blur(6px)" },
      { opacity: 1, transform: "translate(0px, 0px) scale(1)", filter: "blur(0px)" },
    ],
    { duration: duracao, easing: mola }
  ).finished
  placa.style.opacity = ""
  const subir = [...placa.querySelectorAll<HTMLElement>("[data-onboarding-rise]")].map((faixa, i) =>
    faixa.animate(
      [
        { opacity: 0, transform: "translateY(6px)" },
        { opacity: 1, transform: "translateY(0px)" },
      ],
      { duration: 300, delay: 90 + i * 45, easing: bezier(CURVA_ENFATICA), fill: "backwards" }
    ).finished
  )
  await Promise.all([surgir, ...subir]).catch(() => {})
}

/** O avesso: a placa some **para dentro do alvo**, mais curta e em curva de saída. */
async function sumirNoAlvo(placa: HTMLElement) {
  const { x, y } = rumoAoAlvo(placa, 8)
  await placa
    .animate(
      [
        { opacity: 1, transform: "translate(0px, 0px) scale(1)", filter: "blur(0px)" },
        { opacity: 0, transform: `translate(${x}px, ${y}px) scale(0.94)`, filter: "blur(4px)" },
      ],
      { duration: 170, easing: bezier(CURVA_SAIDA), fill: "forwards" }
    )
    .finished.catch(() => {})
}

/**
 * O tour com foco num botão real.
 *
 * **O clique passa pelo buraco.** Quem escurece é a sombra de 100vmax de um
 * elemento sem eventos (`pointer-events-none`), e quem bloqueia são quatro
 * retângulos transparentes **em volta** do recorte: dentro dele não há nada, e
 * o clique cai no elemento da tela. O passo `advanceOn: "target"` avança num
 * `click` em **bolha** no documento — depois que o handler do app já rodou —,
 * conferindo onde o `pointerdown` aconteceu: com um menu modal aberto o Radix
 * tira os eventos do `body`, e o `click` cai no `<html>`.
 *
 * **O anel é de marca**: o arco-íris numa volta só, num traço nítido colado
 * no buraco, e um brilho borrado do mesmo traço que corre em volta dele (ver
 * `ARCO_IRIS_DO_ANEL`). Ele cola no alvo: a folga caiu de 8 para 4.
 *
 * **A placa espera o buraco pousar.** No desktop ela é um `Popover` ancorado
 * num retângulo virtual que lê o recorte; ao trocar de passo, ela some com a
 * âncora **congelada** onde estava, e a do passo novo só monta quando o buraco
 * chega — posicionada de primeira, sem atravessar a tela com o texto trocado.
 * No telefone ela prende embaixo — ou em cima, se o alvo está na metade de
 * baixo —, e o recorte continua: uma gaveta cobriria o alvo.
 */
function OnboardingTour({
  steps,
  open,
  defaultOpen = false,
  onOpenChange,
  storageKey,
  onComplete,
  onSkip,
  nextLabel = "próximo",
  backLabel = "voltar",
  skipLabel = "pular o tour",
  finishLabel = "concluir",
  hint = "Clique no botão destacado para continuar.",
}: OnboardingTourProps) {
  const janela = useViewportWindow()
  const noCliente = useNoCliente()
  const mobile = useIsMobile()
  const reduzido = useReducedMotion() ?? false
  const [guardado, gravar, lido] = useGuardado(storageKey)
  const total = steps.length
  const visto = guardado === CONCLUIDO || guardado === DISPENSADO
  const controlado = open !== undefined
  const [interno, setInterno] = React.useState<boolean | null>(null)
  const aberto =
    noCliente && total > 0 && (controlado ? !!open : (interno ?? (lido && defaultOpen && !visto)))
  // Retomar também não cai depois de um clique que não foi dado.
  const inicio = passoAlcancavel(steps, 0, passoGuardado(guardado, total))
  const [escolhido, setEscolhido] = React.useState<number | null>(null)
  const passo = Math.min(escolhido ?? inicio, Math.max(0, total - 1))
  const step = steps[passo]
  const ultimo = passo === total - 1

  // O alvo resolvido de cada passo. `el` só vale para o passo atual.
  const [resolvido, setResolvido] = React.useState<{ passo: number; el: HTMLElement | null } | null>(null)
  const el = aberto && resolvido?.passo === passo ? resolvido.el : undefined
  const alvoDaPlaca = aberto ? resolvido?.el : undefined
  const [doca, setDoca] = React.useState<{ lado: "top" | "bottom"; px: number | null } | null>(null)

  // A placa: a do passo atual só aparece quando o buraco **pousa** nele; a do
  // passo que ficou para trás continua montada enquanto some (`saindo`).
  const [pousou, setPousou] = React.useState<number | null>(null)
  const [saindo, setSaindo] = React.useState<{ passo: number; ancorada: boolean } | null>(null)
  const [vindoDe, setVindoDe] = React.useState<number | null>(null)
  const placaPasso = saindo?.passo ?? (aberto && pousou === passo ? passo : null)
  const ancorada = saindo ? saindo.ancorada : !mobile && el != null
  const popoverAberto = placaPasso !== null && ancorada
  const visivel = placaPasso === passo && saindo === null

  const placaRef = React.useRef<HTMLDivElement>(null)
  const placaEl = React.useRef<HTMLElement | null>(null)
  const surgiu = React.useRef<HTMLElement | null>(null)
  const anelRef = React.useRef<HTMLSpanElement>(null)
  const peloTeclado = React.useRef(false)
  const posicionado = React.useRef(false)
  const fechando = React.useRef(false)
  const pararViagem = React.useRef<() => void>(() => {})
  const congelado = React.useRef<DOMRect | null>(null)
  const focoAntes = React.useRef<HTMLElement | null>(null)
  const focadoNoPasso = React.useRef<number | null>(null)

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const mw = useMotionValue(0)
  const mh = useMotionValue(0)
  const mr = useMotionValue(0)
  const topoDoBuraco = useTransform(() => Math.max(0, my.get()))
  const fimY = useTransform(() => my.get() + mh.get())
  const fimX = useTransform(() => mx.get() + mw.get())
  const esquerdaDoBuraco = useTransform(() => Math.max(0, mx.get()))
  // O pulso do pouso: um segundo anel que se afasta do recorte e se apaga.
  const pulso = useMotionValue(1)
  const alcance = useTransform(() => pulso.get() * ALCANCE_DO_PULSO)
  const pulsoX = useTransform(() => mx.get() - alcance.get())
  const pulsoY = useTransform(() => my.get() - alcance.get())
  const pulsoW = useTransform(() => mw.get() + alcance.get() * 2)
  const pulsoH = useTransform(() => mh.get() + alcance.get() * 2)
  const pulsoOpacidade = useTransform(() => 1 - pulso.get())
  // O raio que o anel lê para ficar concêntrico com o buraco: o do alvo (não
  // um degrau da escala) mais o traço. O motion escreve variável de CSS pelo
  // `style`; o tipo dele é que não a conhece.
  const raioDoAnel = useTransform(() => `${mr.get() + 2}px`)
  const raioDoPulso = useTransform(() => `${mr.get() + alcance.get() + 2}px`)

  // A âncora da placa: o buraco, lido ao vivo — ou congelado onde estava,
  // enquanto a placa do passo anterior some. Um objeto novo quando o alvo
  // muda, para o `Popper` reler o `contextElement` (o padrão do `FilterBar`).
  const ancoraRef = React.useRef<{ getBoundingClientRect: () => DOMRect; contextElement?: Element }>({
    getBoundingClientRect: () => new DOMRect(),
  })
  useIsomorphicLayoutEffect(() => {
    ancoraRef.current = {
      getBoundingClientRect: () => congelado.current ?? new DOMRect(mx.get(), my.get(), mw.get(), mh.get()),
      contextElement: alvoDaPlaca ?? undefined,
    }
  }, [alvoDaPlaca, mx, my, mw, mh])

  // A entrada roda uma vez por placa: o Radix recompõe a `ref` a cada render.
  const refDaPlaca = React.useCallback(
    (placa: HTMLDivElement | null) => {
      placaEl.current = placa
      if (!placa || placa === surgiu.current) return
      surgiu.current = placa
      if (!reduzido) void surgirDoAlvo(placa)
    },
    [reduzido]
  )

  /* As transições de estado. */

  // O anel pulsa no alvo: "é aqui que se clica".
  const pulsar = () => {
    if (reduzido) return
    pulso.jump(0)
    animate(pulso, 1, PULSO)
  }

  // `peloAlvo`: quem avança é o clique no próprio alvo, o único caminho para a
  // frente num passo `advanceOn: "target"`.
  const ir = (indice: number, peloAlvo = false) => {
    if (fechando.current) return
    const pedido = Math.max(0, Math.min(total - 1, indice))
    let alvo = peloAlvo ? pedido : passoAlcancavel(steps, passo, pedido)
    // Voltar a um passo que espera o alvo, sem o alvo na tela (o menu já
    // fechou), volta até o clique que o faz aparecer.
    if (alvo < passo && steps[alvo]?.waitFor && !resolverAlvo(steps[alvo].target, (janela ?? window).document)) {
      for (let i = alvo - 1; i >= 0; i--) {
        if (steps[i]?.advanceOn !== "target") continue
        alvo = i
        break
      }
    }
    if (alvo === passo) {
      if (pedido > passo) pulsar()
      return
    }
    if (visivel) {
      congelado.current = new DOMRect(mx.get(), my.get(), mw.get(), mh.get())
      setSaindo({ passo, ancorada })
    }
    setVindoDe(passo)
    setEscolhido(alvo)
    gravar(String(alvo))
  }

  const encerrar = (motivo: typeof CONCLUIDO | typeof DISPENSADO) => {
    if (!controlado) setInterno(false)
    onOpenChange?.(false)
    gravar(motivo)
    setEscolhido(null)
    setResolvido(null)
    setDoca(null)
    setPousou(null)
    setSaindo(null)
    setVindoDe(null)
    congelado.current = null
    posicionado.current = false
    fechando.current = false
    focadoNoPasso.current = null
    focoAntes.current?.focus({ preventScroll: true })
    focoAntes.current = null
    if (motivo === CONCLUIDO) onComplete?.()
    else onSkip?.()
  }

  // Fechar é o avesso de abrir: a placa some e a íris abre, e só então o tour
  // desmonta. Quem fecha por fora (o `open` controlado) só esmaece.
  const fechar = async (motivo: typeof CONCLUIDO | typeof DISPENSADO) => {
    if (fechando.current) return
    fechando.current = true
    pararViagem.current()
    if (!reduzido) {
      const win = janela ?? window
      // O anel se dissolve enquanto a íris abre: crescendo junto, ele virava
      // um arco enorme cortando a tela.
      if (anelRef.current) anelRef.current.style.opacity = "0"
      const fim = irisDe(
        { x: mx.get(), y: my.get(), w: mw.get(), h: mh.get(), r: mr.get() },
        win.innerWidth,
        win.innerHeight
      )
      await Promise.all([
        placaEl.current ? sumirNoAlvo(placaEl.current) : undefined,
        animate(mx, fim.x, IRIS_ABRE),
        animate(my, fim.y, IRIS_ABRE),
        animate(mw, fim.w, IRIS_ABRE),
        animate(mh, fim.h, IRIS_ABRE),
        animate(mr, fim.r, IRIS_ABRE),
      ])
    }
    encerrar(motivo)
  }

  const avancar = (peloAlvo = false) => {
    if (step?.advanceOn === "target" && !peloAlvo) return pulsar()
    if (ultimo) void fechar(CONCLUIDO)
    else ir(passo + 1, peloAlvo)
  }
  const voltar = () => ir(passo - 1)
  const acoes = useAtual({ avancar, voltar, fechar })

  /* 1. O alvo: resolvido num quadro, ou esperado. */

  React.useEffect(() => {
    if (!aberto || !step) return
    const win = janela ?? window
    const doc = win.document
    if (!focoAntes.current) {
      focoAntes.current = doc.activeElement as HTMLElement | null
      // Quem abriu pelo teclado (o gatilho com o anel de foco) segue no teclado.
      peloTeclado.current = focoAntes.current?.matches(":focus-visible") ?? false
    }
    let observador: MutationObserver | undefined
    let prazo = 0
    const achar = () => {
      const achado = resolverAlvo(step.target, doc)
      if (!achado) return false
      observador?.disconnect()
      win.clearTimeout(prazo)
      setResolvido({ passo, el: achado })
      return true
    }
    const semAlvo = () => {
      if (step.target && process.env.NODE_ENV !== "production") {
        console.warn(`OnboardingTour: o alvo do passo ${passo + 1} não apareceu; a placa vai ao centro.`)
      }
      setResolvido({ passo, el: null })
    }
    const quadro = win.requestAnimationFrame(() => {
      if (!step.target) return setResolvido({ passo, el: null })
      if (achar()) return
      if (!step.waitFor) return semAlvo()
      observador = new MutationObserver(() => {
        achar()
      })
      observador.observe(doc.body, { childList: true, subtree: true })
      prazo = win.setTimeout(
        () => {
          observador?.disconnect()
          semAlvo()
        },
        typeof step.waitFor === "number" ? step.waitFor : ESPERA_PADRAO
      )
    })
    return () => {
      win.cancelAnimationFrame(quadro)
      observador?.disconnect()
      win.clearTimeout(prazo)
    }
  }, [aberto, passo, step, janela])

  /* 2. O recorte: rola até o alvo se precisar, viaja (a íris, na primeira vez)
     e acompanha. A viagem é um progresso de 0 a 1 entre o recorte de onde
     saiu e o **alvo ao vivo**: se o alvo muda de tamanho no caminho (o
     checklist abrindo a próxima linha), o destino acompanha sem recomeçar. */

  React.useEffect(() => {
    if (!aberto || el === undefined) return
    const win = janela ?? window
    const doc = win.document
    const folga = step?.padding ?? FOLGA_PADRAO
    const medir = (): Recorte => {
      if (!el) return { x: win.innerWidth / 2, y: win.innerHeight / 2, w: 0, h: 0, r: 0 }
      const raio = parseFloat(win.getComputedStyle(el).borderTopLeftRadius) || 0
      return recorteDoAlvo(el.getBoundingClientRect(), raio, folga)
    }
    const docar = () => {
      if (!mobile) return
      const vh = win.innerHeight
      const lado = ladoDaDoca(el ? el.getBoundingClientRect() : null, vh)
      if (lado === "bottom") {
        const barra = doc.querySelector<HTMLElement>('[data-slot="bottom-bar"]:not([data-hidden])')
        setDoca({ lado, px: barra ? Math.round(vh - barra.getBoundingClientRect().top) : null })
      } else {
        const topo = doc.querySelector<HTMLElement>('[data-slot="top-bar"]')
        setDoca({ lado, px: topo ? Math.round(topo.getBoundingClientRect().bottom) : null })
      }
    }

    const agora = (): Recorte => ({ x: mx.get(), y: my.get(), w: mw.get(), h: mh.get(), r: mr.get() })
    const colocar = (r: Recorte) => {
      mx.jump(r.x)
      my.jump(r.y)
      mw.jump(r.w)
      mh.jump(r.h)
      mr.jump(r.r)
    }
    let viagem: ReturnType<typeof animate> | undefined
    let alvo = agora()
    let chegou = false
    const parar = () => {
      const v = viagem
      viagem = undefined
      v?.stop()
    }
    pararViagem.current = parar
    const pousar = () => {
      setPousou(passo)
      if (reduzido || !el) return
      pulso.jump(0)
      animate(pulso, 1, PULSO)
    }
    const viajar = (de: Recorte, para: Recorte, curva: typeof VIAGEM) => {
      parar()
      alvo = para
      const esta = animate(0, 1, {
        ...curva,
        onUpdate: (t) =>
          colocar({
            x: de.x + (alvo.x - de.x) * t,
            y: de.y + (alvo.y - de.y) * t,
            w: de.w + (alvo.w - de.w) * t,
            h: de.h + (alvo.h - de.h) * t,
            r: de.r + (alvo.r - de.r) * t,
          }),
      })
      viagem = esta
      void esta.then(() => {
        if (viagem !== esta) return
        viagem = undefined
        pousar()
      })
    }
    const chegar = () => {
      chegou = true
      const r = medir()
      if (reduzido) {
        colocar(r)
        pousar()
      } else if (!posicionado.current) viajar(irisDe(r, win.innerWidth, win.innerHeight), r, IRIS_FECHA)
      else viajar(agora(), r, VIAGEM)
      posicionado.current = true
      docar()
    }

    let quadro = 0
    const acompanhar = () => {
      if (!chegou || quadro || fechando.current) return
      quadro = win.requestAnimationFrame(() => {
        quadro = 0
        if (fechando.current) return
        const r = medir()
        if (viagem) alvo = r
        else colocar(r)
        docar()
      })
    }

    let espera = 0
    const aoParar = () => {
      win.clearTimeout(espera)
      doc.removeEventListener("scrollend", aoParar, true)
      chegar()
    }
    const inicial = win.requestAnimationFrame(() => {
      if (el && foraDaVista(el.getBoundingClientRect(), win)) {
        el.scrollIntoView({ block: "center", inline: "nearest", behavior: reduzido ? "auto" : "smooth" })
        doc.addEventListener("scrollend", aoParar, true)
        espera = win.setTimeout(aoParar, 320)
      } else chegar()
    })

    const ro = el ? new ResizeObserver(acompanhar) : null
    if (el) ro?.observe(el)
    win.addEventListener("scroll", acompanhar, { capture: true, passive: true })
    win.addEventListener("resize", acompanhar)
    return () => {
      parar()
      win.cancelAnimationFrame(inicial)
      win.cancelAnimationFrame(quadro)
      win.clearTimeout(espera)
      doc.removeEventListener("scrollend", aoParar, true)
      ro?.disconnect()
      win.removeEventListener("scroll", acompanhar, { capture: true })
      win.removeEventListener("resize", acompanhar)
    }
  }, [aberto, el, passo, janela, mobile, reduzido, step?.padding, mx, my, mw, mh, mr, pulso])

  /* 3. A placa que ficou para trás some, e a âncora descongela. */

  React.useEffect(() => {
    if (!saindo) return
    const placa = placaEl.current
    let vivo = true
    void (placa && !reduzido ? sumirNoAlvo(placa) : Promise.resolve()).then(() => {
      if (!vivo) return
      congelado.current = null
      setSaindo(null)
    })
    return () => {
      vivo = false
    }
  }, [saindo, reduzido])

  /* 4. O clique no próprio elemento avança. */

  const avancaPeloAlvo = step?.advanceOn === "target"
  React.useEffect(() => {
    if (!aberto || !el || !avancaPeloAlvo) return
    const doc = (janela ?? window).document
    let baixou: EventTarget | null = null
    const aoBaixar = (e: PointerEvent) => {
      baixou = e.target
    }
    // Em bolha: o handler do app (abrir o menu, navegar) roda antes.
    const aoClicar = (e: MouseEvent) => {
      const origem = (baixou ?? e.target) as Node | null
      baixou = null
      if (origem && el.contains(origem)) acoes.current.avancar(true)
    }
    doc.addEventListener("pointerdown", aoBaixar, true)
    doc.addEventListener("click", aoClicar)
    return () => {
      doc.removeEventListener("pointerdown", aoBaixar, true)
      doc.removeEventListener("click", aoClicar)
    }
  }, [aberto, el, avancaPeloAlvo, janela, acoes])

  /* 5. O teclado: setas entre passos, Esc encerra, Tab circula placa + alvo. */

  React.useEffect(() => {
    if (!aberto) return
    const doc = (janela ?? window).document
    const aoApontar = () => {
      peloTeclado.current = false
    }
    const aoTeclar = (e: KeyboardEvent) => {
      peloTeclado.current = true
      if (e.defaultPrevented) return
      const foco = e.target as HTMLElement | null
      if (e.key === "Escape") {
        // Com a placa ancorada à vista, o Esc é do `Popover` (que respeita um
        // menu aberto por cima).
        if (popoverAberto) return
        e.preventDefault()
        void acoes.current.fechar(DISPENSADO)
        return
      }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        if (foco?.closest(CAMPO) || foco?.closest('[role="menu"], [role="listbox"], [role="slider"], [role="tablist"], [role="radiogroup"]')) return
        e.preventDefault()
        if (e.key === "ArrowRight") acoes.current.avancar()
        else acoes.current.voltar()
        return
      }
      if (e.key !== "Tab") return
      const placa = placaRef.current
      // Dentro de um menu aberto, o foco é do menu.
      if (!placa || (el && el.closest('[role="menu"]'))) return
      const lista = [
        ...(el && focavel(el) ? [el] : []),
        ...placa.querySelectorAll<HTMLElement>(FOCAVEIS),
      ].filter((n) => n.getClientRects().length > 0)
      if (!lista.length) return
      const i = lista.indexOf(doc.activeElement as HTMLElement)
      e.preventDefault()
      const proximo = i === -1 ? 0 : (i + (e.shiftKey ? -1 : 1) + lista.length) % lista.length
      lista[proximo].focus({ preventScroll: true })
    }
    doc.addEventListener("keydown", aoTeclar)
    doc.addEventListener("pointerdown", aoApontar, true)
    return () => {
      doc.removeEventListener("keydown", aoTeclar)
      doc.removeEventListener("pointerdown", aoApontar, true)
    }
  }, [aberto, el, popoverAberto, janela, acoes])

  /* 6. O foco, quando a placa do passo aparece — nunca ao montar fechado, e
     comparado com o passo anterior (o `StrictMode` roda o efeito duas vezes;
     quem marca é o quadro). **Quem navega pelo teclado** vai ao primário (ou
     ao alvo, no passo que avança por ele), com o anel de foco; **quem usa o
     ponteiro** vai à própria placa, sem anel nenhum: o anel branco no
     "próximo" e no alvo, a cada passo, brigava com o anel de marca. O Tab
     continua levando ao alvo e aos botões. */

  React.useEffect(() => {
    if (!aberto || !visivel || focadoNoPasso.current === passo) return
    const win = janela ?? window
    const quadro = win.requestAnimationFrame(() => {
      focadoNoPasso.current = passo
      if (!peloTeclado.current) {
        // Sem roubar o foco de quem o tem: o menu que o clique no alvo abriu
        // fecharia (o foco sai dele). Quem chega aqui pelo "próximo" está no
        // `body`, porque a placa anterior desmontou.
        const ativo = win.document.activeElement
        if (!ativo || ativo === win.document.body) placaEl.current?.focus({ preventScroll: true })
        return
      }
      if (avancaPeloAlvo && el && focavel(el)) {
        el.focus({ preventScroll: true })
        return
      }
      const placa = placaRef.current
      const primario =
        placa?.querySelector<HTMLElement>("[data-onboarding-primary]") ??
        placa?.querySelector<HTMLElement>(FOCAVEIS)
      primario?.focus({ preventScroll: true })
    })
    return () => win.cancelAnimationFrame(quadro)
  }, [aberto, visivel, el, passo, avancaPeloAlvo, janela])

  if (!noCliente || !step) return null

  const passoDaPlaca = placaPasso ?? passo
  const stepDaPlaca = steps[passoDaPlaca] ?? step
  const corpo = (emPopover: boolean) => (
    <CorpoDoTour
      ref={placaRef}
      step={stepDaPlaca}
      passo={passoDaPlaca}
      de={vindoDe}
      titulos={steps.map((s) => s.title)}
      ultimo={passoDaPlaca === total - 1}
      emPopover={emPopover}
      rotulos={{ nextLabel, backLabel, skipLabel, finishLabel, hint }}
      onIr={ir}
      onAvancar={() => avancar()}
      onVoltar={voltar}
      onPular={() => void fechar(DISPENSADO)}
    />
  )

  const corpoDoDocumento = (janela ?? window).document.body

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {aberto ? (
            <motion.div
              key="tour"
              data-slot="onboarding-tour"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduzido ? 0 : 0.2 }}
              className={cn(
                "pointer-events-none fixed inset-0",
                CAMADA_VEU,
                "[--onboarding-safe-top:env(safe-area-inset-top,0px)] [--onboarding-safe-bottom:env(safe-area-inset-bottom,0px)]"
              )}
            >
              <motion.div
                aria-hidden
                data-slot="onboarding-tour-spotlight"
                data-target={alvoDaPlaca ? "" : undefined}
                style={{ x: mx, y: my, width: mw, height: mh, borderRadius: mr, ...({ "--onboarding-raio": raioDoAnel } as MotionStyle) }}
                className="absolute top-0 left-0 shadow-[0_0_0_100vmax_var(--overlay)]"
              >
                <span
                  ref={anelRef}
                  data-slot="onboarding-tour-ring"
                  className={cn(
                    TRACO_DO_ANEL,
                    "-inset-0.5 transition-opacity duration-(--duration-slow) ease-(--ease-out)",
                    alvoDaPlaca ? "opacity-100" : "opacity-0"
                  )}
                />
              </motion.div>
              <motion.div
                aria-hidden
                data-slot="onboarding-tour-pulse"
                style={{ x: pulsoX, y: pulsoY, width: pulsoW, height: pulsoH, opacity: pulsoOpacidade, ...({ "--onboarding-raio": raioDoPulso } as MotionStyle) }}
                className="absolute top-0 left-0"
              >
                <span className={cn(TRACO_DO_ANEL, "-inset-0.5", alvoDaPlaca ? "opacity-100" : "opacity-0")} />
              </motion.div>
              <motion.div aria-hidden className={BLOQUEIO} style={{ top: 0, left: 0, right: 0, height: topoDoBuraco }} />
              <motion.div aria-hidden className={BLOQUEIO} style={{ top: fimY, left: 0, right: 0, bottom: 0 }} />
              <motion.div aria-hidden className={BLOQUEIO} style={{ top: my, left: 0, width: esquerdaDoBuraco, height: mh }} />
              <motion.div aria-hidden className={BLOQUEIO} style={{ top: my, left: fimX, right: 0, height: mh }} />

              <p className="sr-only" aria-live="polite">
                {`Passo ${passo + 1} de ${total}: ${step.title}`}
              </p>

              {placaPasso !== null && !ancorada ? (
                <div
                  key={placaPasso}
                  ref={refDaPlaca}
                  role="dialog"
                  aria-modal="false"
                  aria-labelledby="onboarding-tour-title"
                  aria-describedby={stepDaPlaca.description ? "onboarding-tour-description" : undefined}
                  data-slot="onboarding-tour-card"
                  data-dock={mobile ? (doca?.lado ?? "bottom") : "center"}
                  tabIndex={-1}
                  className={cn(
                    "pointer-events-auto fixed outline-hidden",
                    CAMADA_PLACA,
                    menuPanelSurfaceClassName,
                    "flex flex-col p-2.5 text-sm",
                    mobile
                      ? doca?.lado === "top"
                        ? "inset-x-3 origin-top"
                        : "inset-x-3 origin-bottom"
                      : "top-1/2 left-1/2 w-88 max-w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2"
                  )}
                  style={
                    mobile
                      ? doca?.lado === "top"
                        ? { top: doca.px != null ? doca.px + 12 : "calc(var(--onboarding-safe-top) + 12px)" }
                        : { bottom: doca?.px != null ? doca.px + 12 : "calc(var(--onboarding-safe-bottom) + 12px)" }
                      : undefined
                  }
                >
                  {corpo(false)}
                </div>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>,
        corpoDoDocumento
      )}

      <Popover open={popoverAberto}>
        <PopoverAnchor virtualRef={ancoraRef} />
        <PopoverContent
          key={placaPasso ?? undefined}
          ref={refDaPlaca}
          data-slot="onboarding-tour-card"
          data-dock="anchored"
          side={stepDaPlaca.side ?? "bottom"}
          align={stepDaPlaca.align ?? "center"}
          sideOffset={12}
          size={stepDaPlaca.media ? "lg" : "md"}
          // A placa acompanha o recorte quadro a quadro (a rolagem, o alvo que
          // cresce) — e fica parada enquanto ele viaja, porque a âncora congela.
          updatePositionStrategy="always"
          // A entrada e a saída são as do tour (`surgirDoAlvo`, `sumirNoAlvo`),
          // e a seta mora fora da caixa: o `overflow` da placa a recortava.
          motion="none"
          className={cn(CAMADA_PLACA, "overflow-visible")}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            e.preventDefault()
            void fechar(DISPENSADO)
          }}
        >
          <PopoverArrow />
          {corpo(true)}
        </PopoverContent>
      </Popover>
    </>
  )
}

/**
 * O miolo da placa do tour, o mesmo ancorada, presa ou no centro. **O rodapé
 * tem a mesma forma em todos os passos**: o × do canto pula (era um terceiro
 * botão no rodapé, que quebrava em duas linhas quando o voltar aparecia), e o
 * voltar some no primeiro passo sem sair do lugar.
 */
function CorpoDoTour({
  ref,
  step,
  passo,
  de,
  titulos,
  ultimo,
  emPopover,
  rotulos,
  onIr,
  onAvancar,
  onVoltar,
  onPular,
}: {
  ref: React.Ref<HTMLDivElement>
  step: OnboardingTourStep
  passo: number
  de: number | null
  titulos: string[]
  ultimo: boolean
  emPopover: boolean
  rotulos: { nextLabel: string; backLabel: string; skipLabel: string; finishLabel: string; hint: string }
  onIr: (indice: number) => void
  onAvancar: () => void
  onVoltar: () => void
  onPular: () => void
}) {
  const pelaPeca = step.advanceOn === "target"
  return (
    <div ref={ref} data-slot="onboarding-tour-body" className="flex flex-col gap-3">
      {step.media != null ? (
        <OnboardingMedia
          media={step.media}
          className="aspect-video w-full concentric [--radius-inset:--spacing(2.5)]"
        />
      ) : null}
      <div data-onboarding-rise className="flex items-start gap-2 ps-1">
        <div className="flex min-w-0 flex-1 flex-col pt-0.5">
          {emPopover ? (
            <>
              <PopoverTitle className="leading-snug">{step.title}</PopoverTitle>
              {step.description ? (
                <PopoverDescription className="text-pretty">{step.description}</PopoverDescription>
              ) : null}
            </>
          ) : (
            <>
              <h2 id="onboarding-tour-title" className="font-heading leading-snug font-medium text-balance">
                {step.title}
              </h2>
              {step.description ? (
                <Muted id="onboarding-tour-description" className="text-pretty">
                  {step.description}
                </Muted>
              ) : null}
            </>
          )}
        </div>
        <Button
          type="button"
          variant="tertiary"
          size="icon-xs"
          data-slot="onboarding-tour-close"
          aria-label={rotulos.skipLabel}
          onClick={onPular}
          className="relative after:absolute after:-inset-1 after:content-[''] pointer-coarse:after:-inset-2.5"
        >
          <XMarkIcon />
        </Button>
      </div>
      {pelaPeca ? (
        <p
          data-onboarding-rise
          data-slot="onboarding-tour-hint"
          className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground"
        >
          <CursorArrowRaysIcon aria-hidden className="size-4 shrink-0" />
          {step.hint ?? rotulos.hint}
        </p>
      ) : null}
      <div data-onboarding-rise className="flex items-center gap-2">
        <OnboardingPills titulos={titulos} atual={passo} de={de} onIr={onIr} className="ps-1" />
        <div className="ms-auto flex items-center gap-1">
          <Button
            type="button"
            variant="tertiary"
            size="icon-sm"
            aria-label={rotulos.backLabel}
            onClick={onVoltar}
            className={cn("pointer-coarse:size-10", passo === 0 && "invisible")}
          >
            <ChevronLeftIcon className={SETA_QUE_VOLTA} />
          </Button>
          {!pelaPeca ? (
            <Button type="button" size="sm" data-onboarding-primary onClick={onAvancar} className="pointer-coarse:h-10">
              {ultimo ? rotulos.finishLabel : rotulos.nextLabel}
              {ultimo ? null : <ChevronRightIcon aria-hidden data-icon="inline-end" className={SETA_QUE_ANDA} />}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/* ── OnboardingSkeleton ─────────────────────────────────────────────────── */

/**
 * A espera, na forma do checklist ou do card — para quando o "feito" vem do
 * servidor. `group={false}` dentro de um esqueleto de página, que já anuncia.
 */
function OnboardingSkeleton({
  variant = "checklist",
  group = true,
  className,
}: {
  variant?: "checklist" | "card"
  group?: boolean
  className?: string
}) {
  const ossos =
    variant === "checklist" ? (
      <Card data-slot="onboarding-skeleton" padding="none" className={cn("gap-3 pt-4 pb-3", className)}>
        <div className="flex flex-col gap-2 px-4">
          <Skeleton shape="text" className="w-40 text-sm" />
          <Skeleton shape="text" className="w-24 text-xs" />
        </div>
        <div className="flex flex-col gap-1 px-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex h-8 items-center gap-3">
              <Skeleton shape="circle" className="size-4" />
              <Skeleton shape="text" className={cn("text-sm", i % 2 ? "w-36" : "w-48")} />
            </div>
          ))}
        </div>
      </Card>
    ) : (
      <Card data-slot="onboarding-skeleton" padding="none" className={cn("gap-2 p-3", className)}>
        <Skeleton shape="text" className="w-32 text-xs" />
        <SkeletonText lines={2} className="text-xs" />
        <Skeleton className="h-19 w-full rounded-row" />
      </Card>
    )
  return group ? <SkeletonGroup label="Carregando os primeiros passos…">{ossos}</SkeletonGroup> : ossos
}

export {
  folgaDoLeque,
  OnboardingCard,
  OnboardingChecklist,
  OnboardingDialog,
  OnboardingHotspot,
  OnboardingMedia,
  OnboardingSkeleton,
  OnboardingTour,
  irisDe,
  ladoDaDoca,
  lequeDaMidia,
  passoAlcancavel,
  passoGuardado,
  recorteDoAlvo,
}
export type {
  OnboardingChecklistItem,
  OnboardingMediaSource,
  OnboardingStep,
  OnboardingTarget,
  OnboardingTourStep,
}
