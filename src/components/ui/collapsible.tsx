"use client"

import { ChevronDownIcon } from "@heroicons/react/16/solid"
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import { animate, type AnimationPlaybackControls } from "motion/react"

import { cn } from "@/lib/utils"
import { useUntilFound } from "@/hooks/use-until-found"
import {
  DISCLOSURE_ROW_HEIGHT_CLASS,
  DISCLOSURE_ROW_HEIGHTS,
  disclosureLabelClassName,
  disclosureMarkerClassName,
  disclosureMotionClassName,
  disclosureRevealClassName,
  disclosureRowClassName,
  disclosureRowFocusClassName,
  type DisclosureSize,
} from "@/lib/disclosure-classes"
import { MOLA } from "@/lib/spring"
import { composeRefs, useControllableState } from "radix-ui/internal"

/**
 * Um bloco que expande: o `Accordion` de um item só, sem a semântica de lista.
 * `CollapsibleRow` é a linha inteira, na régua de
 * [`lib/disclosure-classes`](../../lib/disclosure-classes.ts) que o `Accordion`
 * veste. O `Collapsible` controla o Radix e publica `{ open, setOpen }`, para o
 * `CollapsibleLabel` trocar o texto e o conteúdo `findable` abrir com o ⌘F.
 *
 * `peek` é o "mostrar mais": o fechado é uma espiada, e o que diz "tem mais" é
 * o conteúdo dissolvendo na base. Custa três coisas: (1) `forceMount`, e o
 * texto continua na árvore de acessibilidade mesmo com o `hidden` que o Radix
 * escreve (`data-closed:block` o vence); (2) os keyframes `collapsible-down/up`
 * saem, e a medida do Radix não serve de destino (ver `useEspiada`); (3) `_-_`
 * em todo `-` binário dentro de `calc()` arbitrário, senão a classe é cortada e
 * a máscara cai para `none` em silêncio. A altura anima nos dois sentidos com
 * os keyframes do `tw-animate-css`; sem `overflow-hidden` o conteúdo vazaria.
 */

type CollapsibleState = {
  open: boolean
  setOpen: (open: boolean) => void
  variant: "plain" | "card"
}

const CollapsibleContext = React.createContext<CollapsibleState | null>(null)

/**
 * `card` é a superfície do `Card` (`outline`), escrita aqui porque molécula não
 * importa organismo; se o `outline` do `Card` mudar, muda aqui. Linha e
 * conteúdo recuam por `--collapsible-px`, sem fio entre eles. O canto é a linha
 * alta (`rounded-row-lg`, 16): fechado o cartão é uma linha de 42px, e 22 o
 * desenharia cápsula.
 */
const COLLAPSIBLE_CARD =
  "overflow-hidden rounded-row-lg border border-border bg-card text-card-foreground [--collapsible-px:--spacing(4)]"

function Collapsible({
  open: openProp,
  defaultOpen,
  onOpenChange,
  variant = "plain",
  className,
  ref,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root> & {
  /** `card` veste a superfície do `Card`, com a linha e o conteúdo no recuo. */
  variant?: "plain" | "card"
}) {
  // O Radix guarda o aberto (controlado ou não) e só avisa quando o valor muda.
  const [open, setAberto] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
    caller: "Collapsible",
  })
  const raiz = React.useRef<HTMLDivElement>(null)
  const setOpen = React.useCallback(
    (proximo: boolean) => {
      // O Radix mede a altura de abrir num efeito de layout que roda antes de
      // qualquer efeito daqui; com `hidden="until-found"` ainda lá o
      // `content-visibility: hidden` mediria 0. Por isso o atributo sai no pedido.
      if (proximo) {
        raiz.current
          ?.querySelector(":scope > [data-slot=collapsible-content][hidden]")
          ?.removeAttribute("hidden")
      }
      setAberto(proximo)
    },
    [setAberto]
  )
  const estado = React.useMemo(
    () => ({ open, setOpen, variant }),
    [open, setOpen, variant]
  )

  return (
    <CollapsibleContext value={estado}>
      <CollapsiblePrimitive.Root
        data-slot="collapsible"
        data-variant={variant}
        ref={composeRefs(raiz, ref)}
        open={open}
        onOpenChange={setOpen}
        className={cn(variant === "card" && COLLAPSIBLE_CARD, className)}
        {...props}
      />
    </CollapsibleContext>
  )
}

/**
 * O gatilho continua sendo o primitivo cru: com `asChild` o Radix funde a
 * `className` no filho, e carimbar cromagem aqui vazaria para todo botão. Quem
 * quer a linha desenhada usa `CollapsibleRow`. O `group/disclosure` faz o
 * `CollapsibleMarker` girar sem seletor de quem chama.
 */
function CollapsibleTrigger({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Trigger>) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn("group/disclosure", className)}
      {...props}
    />
  )
}

/** O marcador. Gira porque o gatilho é `group/disclosure` e o Radix escreve `data-state` nele. */
function CollapsibleMarker({
  className,
  ...props
}: React.ComponentProps<typeof ChevronDownIcon>) {
  return (
    <ChevronDownIcon
      data-slot="collapsible-marker"
      aria-hidden
      className={cn(disclosureMarkerClassName, className)}
      {...props}
    />
  )
}

/**
 * A linha inteira como gatilho, a do `AccordionTrigger` sem a semântica de
 * lista: degrau `md`/`lg`/`xl`, rótulo que sublinha, `trailing` na outra ponta
 * (prop, porque duas `ml-auto` dividem a sobra), marcador de qualquer lado e
 * 44px no dedo.
 */
function CollapsibleRow({
  className,
  children,
  size = "md",
  markerSide = "end",
  trailing,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Trigger> & {
  size?: DisclosureSize
  markerSide?: "start" | "end"
  trailing?: React.ReactNode
}) {
  const marker = <CollapsibleMarker />
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-row"
      className={cn(
        disclosureRowClassName,
        disclosureRowFocusClassName,
        DISCLOSURE_ROW_HEIGHT_CLASS[DISCLOSURE_ROW_HEIGHTS[size]],
        "px-(--collapsible-px) py-1.5",
        className
      )}
      {...props}
    >
      {markerSide === "start" ? marker : null}
      <span data-slot="collapsible-row-label" className={disclosureLabelClassName}>
        {children}
      </span>
      {trailing ? (
        <span className="shrink-0 font-normal text-muted-foreground">{trailing}</span>
      ) : null}
      {markerSide === "end" ? marker : null}
    </CollapsiblePrimitive.Trigger>
  )
}

/**
 * O texto do gatilho que acompanha o estado ("Continuar lendo" / "Mostrar
 * menos"), lido do `Collapsible`. O `data-slot="button-label"` é emprestado de
 * propósito: dentro de um `Button asChild` é ele que recebe a maiúscula inicial
 * e o traço do `link`.
 */
function CollapsibleLabel({
  open,
  closed,
}: {
  open: React.ReactNode
  closed: React.ReactNode
}) {
  const estado = React.useContext(CollapsibleContext)
  return <span data-slot="button-label">{estado?.open ? open : closed}</span>
}

/**
 * `findable`: o fechado fica no DOM como `hidden="until-found"` e abre quando o
 * ⌘F o acha (mecânica em `hooks/use-until-found`, dividida com o `Accordion`).
 */
function useEncontravel(ligado: boolean) {
  const estado = React.useContext(CollapsibleContext)
  const setOpen = estado?.setOpen
  const abrir = React.useMemo(() => (setOpen ? () => setOpen(true) : undefined), [setOpen])
  return useUntilFound(ligado, estado?.open ?? false, abrir)
}

/**
 * A espiada em três degraus: alturas de leitura (~3, ~5 e ~7 linhas de
 * `text-sm`), não da escada de controles. A rampa da dissolução é `min(2.5rem,
 * 40%)`, proporcional com teto para o degrau curto.
 */
const collapsibleContentVariants = cva(disclosureMotionClassName, {
  variants: {
    peek: {
      none: "data-open:animate-collapsible-down data-closed:animate-collapsible-up",
      sm: "",
      md: "",
      lg: "",
    },
  },
  defaultVariants: { peek: "none" },
})

/**
 * A variável do degrau mora na casca e não no `cva` do conteúdo: a base dele
 * (`disclosureMotionClassName`) traz `duration-` sem `transition-property`, e
 * o valor inicial é `all` — a casca transicionaria tudo.
 */
const COLLAPSIBLE_PEEK_VAR = {
  none: "",
  sm: "[--collapsible-peek:3.75rem]",
  md: "[--collapsible-peek:6.25rem]",
  lg: "[--collapsible-peek:8.75rem]",
} as const

/**
 * Quem mede não pode ser quem é medido: o Radix lê a caixa da própria
 * `Content`, que em `peek` é o nó preso à espiada, então quem é medido aqui é
 * um envelope interno livre de altura.
 *
 * A espiada desliza porque a altura da casca é estilo inline escrito por JS: o
 * Radix resolve a altura de CSS na mesma passagem em que o `data-state` vira
 * `open`, sem transição para começar, e um `data-state` novo não muda estilo
 * inline. Um `MutationObserver` lê a altura de antes e anima até o destino com
 * o `animate` do `motion` (abrir na `MOLA`, fechar em `--ease-out`, pois uma
 * mola passaria por baixo da espiada); ao fim da abertura volta a `auto`. A
 * preferência de movimento reduzido é perguntada à mão, porque a mola é de JS.
 */
function useEspiada() {
  return React.useCallback((envelope: HTMLElement | null) => {
    if (!envelope) return
    const conteudo = envelope.parentElement
    const casca = conteudo?.parentElement
    if (!conteudo || !casca) return

    // A espiada vem do degrau, em `rem`, na variável da casca.
    const espiada = () =>
      parseFloat(getComputedStyle(casca).getPropertyValue("--collapsible-peek")) *
      parseFloat(getComputedStyle(document.documentElement).fontSize)
    const aberto = () => conteudo.dataset.state === "open"

    casca.style.height = aberto() ? "auto" : `${espiada()}px`

    let trajeto: AnimationPlaybackControls | undefined
    const mo = new MutationObserver(() => {
      trajeto?.stop()
      const abre = aberto()
      const de = casca.getBoundingClientRect().height
      const para = abre ? envelope.scrollHeight : espiada()
      const final = abre ? "auto" : `${para}px`
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        casca.style.height = final
        return
      }
      trajeto = animate(
        casca,
        { height: [`${de}px`, `${para}px`] },
        abre ? MOLA : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
      )
      trajeto.finished.then(() => {
        if (aberto() === abre) casca.style.height = final
      })
    })
    mo.observe(conteudo, { attributes: true, attributeFilter: ["data-state"] })

    return () => {
      mo.disconnect()
      trajeto?.stop()
    }
  }, [])
}

/** A casca da espiada. A altura não mora aqui: é estilo inline escrito por `useEspiada`. */
const COLLAPSIBLE_PEEK_SHELL = [
  "overflow-hidden",

  // A rampa é proporcional com teto (fixa em 40px comeria dois terços do
  // degrau `sm`). `_-_` obrigatório no `-` binário.
  "[mask-image:linear-gradient(to_bottom,#000_calc(100%_-_min(2.5rem,40%)),transparent)]",
  "has-[>[data-slot=collapsible-content][data-state=open]]:[mask-image:none]",
].join(" ")

function CollapsibleContent({
  className,
  peek = "none",
  findable = false,
  forceMount,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Content> &
  VariantProps<typeof collapsibleContentVariants> & {
    /** Fechado, continua encontrável pelo ⌘F, e abre quando é achado. */
    findable?: boolean
  }) {
  const espiando = peek !== "none" && peek != null
  const medirEnvelope = useEspiada()
  const cartao = React.useContext(CollapsibleContext)?.variant === "card"
  const refEncontravel = useEncontravel(findable && !espiando)

  const conteudo = (
    <CollapsiblePrimitive.Content
      data-slot="collapsible-content"
      data-peek={espiando ? peek : undefined}
      // `forceMount` é consequência de `peek` (sem ele não há o que espiar);
      // sob ele o Radix nunca escreve `hidden`. Quem passar o seu ganha.
      forceMount={espiando || findable ? true : forceMount}
      ref={composeRefs(refEncontravel, ref)}
      className={cn(
        collapsibleContentVariants({ peek }),
        espiando ? "h-full" : disclosureRevealClassName,
        // No cartão: o recuo de baixo é pseudo-elemento, porque `padding-bottom`
        // no nó que anima a altura estalaria no fim do fechamento.
        cartao && "px-(--collapsible-px) after:block after:h-(--collapsible-px) after:content-['']",
        className
      )}
      {...props}
    >
      {espiando ? (
        <div ref={medirEnvelope} data-slot="collapsible-peek-body">
          {children}
        </div>
      ) : (
        children
      )}
    </CollapsiblePrimitive.Content>
  )

  if (!espiando) return conteudo

  return (
    <div
      data-slot="collapsible-peek-shell"
      className={cn(COLLAPSIBLE_PEEK_VAR[peek], COLLAPSIBLE_PEEK_SHELL)}
    >
      {conteudo}
    </div>
  )
}

export {
  collapsibleContentVariants,
  Collapsible,
  CollapsibleContent,
  CollapsibleLabel,
  CollapsibleMarker,
  CollapsibleRow,
  CollapsibleTrigger,
}
