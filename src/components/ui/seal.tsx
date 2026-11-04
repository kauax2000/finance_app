"use client"

import * as React from "react"

import { animate, useReducedMotion } from "motion/react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { Skeleton } from "@/components/ui/skeleton"
import { ehCursor } from "@/lib/pointer"
import { cn } from "@/lib/utils"

/**
 * # Seal — o selo holográfico
 *
 * Um selo de metal estampado, como o adesivo de "original" de um produto: o anel com o texto gravado, os fios
 * concêntricos e um ícone no miolo, sobre prata ou ouro com o reflexo holográfico. Pequeno na tela (40px, o
 * botão), ele **abre grande** num véu ao toque, com o nome acessível como legenda.
 *
 * **O metal é físico, não tema**: as paradas moram nas `@utility seal-silver`/`seal-gold`, iguais nos dois
 * temas. O holográfico é a exceção nomeada ao arco-íris sob texto (rodada 361): o volume é
 * `--seal-holo-opacity` e só sob o ponteiro; o texto do anel é textura, e o que se lê é a legenda do selo
 * aberto. **Uma peça de marca por tela** — o selo conta como ela.
 *
 * **O movimento.** O selo inclina até 18° com o cursor e o reflexo segue o ponteiro; sem cursor ele balança
 * devagar (`seal-sway`). Aberto, inclina com o cursor ou com o giroscópio do telefone (o iOS pede permissão no
 * toque que abre o selo) e, a cada toque, dá uma volta inteira, como uma moeda. Com movimento reduzido não há
 * balanço nem volta; a inclinação segue a mão da pessoa.
 *
 * O ponteiro escreve variáveis no próprio nó (`--seal-rx`, `--seal-ry`, `--seal-x`, `--seal-y`,
 * `--seal-angle`) sem `setState`: nenhum render por evento.
 */

type SealTone = "silver" | "gold"

const TONE: Record<SealTone, string> = {
  silver: "seal-silver",
  gold: "seal-gold",
}

/** A inclinação máxima, em graus, de cada lado. */
const INCLINACAO = 18

type SealProps = {
  /** O nome do selo, lido pelo leitor de tela e escrito como legenda do selo aberto ("Membro desde março de 2026"). */
  label: string
  /** O texto gravado no anel ("MEMBRO DESDE · MAR 2026 · FINANCE APP · "). Cabe uma volta. */
  ring: string
  /** A linha de baixo da legenda do selo aberto. */
  description?: string
  /** O desenho do miolo, pintado na tinta do selo (`currentColor`). */
  icon?: React.ReactNode
  /** O metal. */
  tone?: SealTone
  className?: string
}

/** Escreve a inclinação e o reflexo para um ponto do selo (0–1 nos dois eixos). */
function inclinar(el: HTMLElement, x: number, y: number) {
  el.style.setProperty("--seal-ry", `${(x - 0.5) * INCLINACAO * 2}deg`)
  el.style.setProperty("--seal-rx", `${(0.5 - y) * INCLINACAO * 2}deg`)
  el.style.setProperty("--seal-x", `${x * 100}%`)
  el.style.setProperty("--seal-y", `${y * 100}%`)
  el.style.setProperty("--seal-angle", `${(x - 0.5) * 140 + (y - 0.5) * 80}deg`)
}

function repousar(el: HTMLElement) {
  for (const v of ["--seal-rx", "--seal-ry", "--seal-x", "--seal-y", "--seal-angle"]) el.style.removeProperty(v)
}

/** O ponteiro que inclina: só o cursor de verdade; o dedo não tem "passar por cima". */
function usePonteiro() {
  const [vivo, setVivo] = React.useState(false)
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!ehCursor(e)) return
    const r = e.currentTarget.getBoundingClientRect()
    inclinar(e.currentTarget, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
    if (!vivo) setVivo(true)
  }
  const onPointerLeave = (e: React.PointerEvent<HTMLElement>) => {
    repousar(e.currentTarget)
    setVivo(false)
  }
  return { vivo, onPointerMove, onPointerLeave }
}

type DeviceOrientationComPermissao = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">
}

/** O iOS só entrega o giroscópio depois de uma permissão pedida dentro de um toque. */
function pedirGiroscopio() {
  const D = typeof window === "undefined" ? undefined : (window.DeviceOrientationEvent as DeviceOrientationComPermissao | undefined)
  D?.requestPermission?.().catch(() => {})
}

/** Enquanto o selo aberto existe, o giroscópio inclina ele (±30° do aparelho viram a inclinação inteira). */
function useGiroscopio(ref: React.RefObject<HTMLElement | null>, ativo: boolean) {
  React.useEffect(() => {
    const el = ref.current
    if (!ativo || !el) return
    const janela = el.ownerDocument.defaultView
    if (!janela) return
    let base: { beta: number; gamma: number } | null = null
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return
      base ??= { beta: e.beta, gamma: e.gamma }
      const lim = (v: number) => Math.max(0, Math.min(1, v))
      inclinar(el, lim(0.5 + (e.gamma - base.gamma) / 60), lim(0.5 + (e.beta - base.beta) / 60))
    }
    janela.addEventListener("deviceorientation", onOrientation)
    return () => {
      janela.removeEventListener("deviceorientation", onOrientation)
      repousar(el)
    }
  }, [ref, ativo])
}

/** O disco: metal, tinta impressa, holográfico e brilho. O tamanho é de quem o contém. */
function SealDisc({
  ring,
  icon,
  tone,
  balanca,
  girando,
}: Pick<SealProps, "ring" | "icon"> & { tone: SealTone; balanca: boolean; girando?: React.Ref<HTMLSpanElement> }) {
  const id = React.useId()
  return (
    <span
      data-slot="seal-disc"
      data-tone={tone}
      className={cn(
        "relative block size-full rounded-full shadow-md ring-1 ring-(--seal-ink) transform-3d",
        "[transform:rotateX(var(--seal-rx,0deg))_rotateY(var(--seal-ry,0deg))]",
        "transition-transform duration-(--duration-slow) ease-(--ease-out)",
        TONE[tone],
        balanca && "seal-sway"
      )}
    >
      <span
        ref={girando}
        data-slot="seal-face"
        className="absolute inset-0 overflow-clip rounded-full text-(--seal-ink)"
      >
        <span className="seal-metal absolute inset-0" />
        <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 size-full">
          <defs>
            <path id={`${id}-anel`} d="M50,50 m-38.5,0 a38.5,38.5 0 1,1 77,0 a38.5,38.5 0 1,1 -77,0" />
          </defs>
          <circle cx="50" cy="50" r="48.6" fill="none" stroke="currentColor" strokeWidth=".9" />
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth=".55" strokeDasharray=".8 1.6" />
          <circle cx="50" cy="50" r="31" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <text fontSize="7" fontWeight="800" fill="currentColor" className="font-sans">
            <textPath href={`#${id}-anel`} textLength="238" lengthAdjust="spacing">
              {ring}
            </textPath>
          </text>
          <g fill="none" stroke="currentColor" strokeWidth=".35" opacity=".55">
            <circle cx="50" cy="50" r="27" />
            <circle cx="50" cy="50" r="24" />
            <circle cx="50" cy="50" r="21" />
          </g>
        </svg>
        {icon ? (
          <span data-slot="seal-icon" className="absolute inset-1/3 grid place-items-center [&>*]:size-full">
            {icon}
          </span>
        ) : null}
        <span className="seal-holo absolute inset-0" />
        <span className="seal-glare absolute inset-0" />
      </span>
    </span>
  )
}

function Seal({ label, ring, description, icon, tone = "silver", className }: SealProps) {
  const reduzido = useReducedMotion() ?? false
  const [aberto, setAberto] = React.useState(false)
  const pequeno = usePonteiro()
  const grande = usePonteiro()
  const grandeRef = React.useRef<HTMLButtonElement>(null)
  const face = React.useRef<HTMLSpanElement>(null)
  const volta = React.useRef(0)
  useGiroscopio(grandeRef, aberto)

  const girar = () => {
    const el = face.current
    if (!el || reduzido) return
    const de = volta.current
    volta.current += 360
    animate(de, volta.current, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => el.style.setProperty("transform", `rotateY(${v}deg)`),
    })
  }

  return (
    <DialogPrimitive.Root open={aberto} onOpenChange={setAberto}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          data-slot="seal"
          data-tone={tone}
          onClick={pedirGiroscopio}
          onPointerMove={pequeno.onPointerMove}
          onPointerLeave={pequeno.onPointerLeave}
          className={cn(
            "relative size-10 shrink-0 cursor-pointer rounded-full perspective-near outline-none",
            "focus-visible:ring-3 focus-visible:ring-ring/45",
            "after:absolute after:-inset-0.5 after:rounded-full pointer-coarse:after:-inset-1",
            className
          )}
        >
          <SealDisc ring={ring} icon={icon} tone={tone} balanca={!pequeno.vivo} />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-slot="seal-overlay"
          className="fixed inset-0 z-(--z-modal) bg-scrim animation-duration-(--duration-slow) ease-(--ease-out) supports-backdrop-filter:backdrop-blur-md data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Content
          data-slot="seal-content"
          className="fixed inset-0 z-(--z-modal) grid place-content-center justify-items-center gap-6 p-4 text-center outline-none animation-duration-(--duration-spring) ease-(--ease-spring) data-open:animate-in data-open:fade-in-0 data-open:zoom-in-50 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-90 data-closed:animation-duration-(--duration-fast)"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAberto(false)
          }}
        >
          <button
            ref={grandeRef}
            type="button"
            aria-label={reduzido ? label : `${label}. Girar o selo`}
            data-slot="seal-large"
            onClick={girar}
            onPointerMove={grande.onPointerMove}
            onPointerLeave={grande.onPointerLeave}
            className="size-56 sm:size-64 cursor-pointer rounded-full perspective-distant outline-none focus-visible:ring-3 focus-visible:ring-ring/45"
          >
            <SealDisc ring={ring} icon={icon} tone={tone} balanca={!grande.vivo} girando={face} />
          </button>
          <div>
            <DialogPrimitive.Title className="text-base font-medium text-scrim-foreground">{label}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-scrim-foreground/70">
              {description ?? (reduzido ? "Esc para fechar" : "Toque para girar · Esc para fechar")}
            </DialogPrimitive.Description>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** O osso do selo: o círculo de 40, no pulso. */
function SealSkeleton({ className }: { className?: string }) {
  return <Skeleton shape="circle" size="md" className={className} />
}

export { Seal, SealSkeleton }
export type { SealProps, SealTone }
