"use client"

import { ChevronDownIcon } from "@heroicons/react/16/solid"
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Accordion as AccordionPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { composeRefs } from "radix-ui/internal"
import { useUntilFound } from "@/hooks/use-until-found"
import { Button } from "@/components/ui/button"
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

/**
 * Assuntos em que se lê um ou outro, não todos.
 *
 * Geometria, marcador, realce, alvo de toque e foco moram em
 * [`lib/disclosure-classes`](../../lib/disclosure-classes.ts), dividida com o
 * `Collapsible`; aqui ficam a moldura, o recuo e o conteúdo. O envelope interno
 * não declara altura: quem anima é a `Content` do Radix contra a variável que
 * ele mede do envelope, e declarar essa medida como altura recortaria texto que
 * reflui.
 *
 * `plain` é fio entre itens, para dentro de algo que já tem moldura; `contained`
 * é uma caixa só; `separated` solta cada item e não vai dentro de um `Card`.
 * O recuo é `--accordion-px` (0 em `plain`, 16 nas molduradas).
 *
 * O estado mora na raiz (controla o Radix, `defaultValue` é a semente), porque
 * o ⌘F e o "abrir todos" escrevem nele de fora da linha.
 */

type AccordionContextValue = {
  size: DisclosureSize
  markerSide: "start" | "end"
  variant: "plain" | "contained" | "separated"
  /** Os itens abertos, sempre como lista (no `single`, zero ou um). */
  abertos: string[]
  /** Abre um item (o ⌘F que o achou). */
  abrir: (valor: string) => void
  /** Só no `multiple`: abre ou fecha todos. */
  todos?: (abrir: boolean) => void
  /** Quantos itens existem, para o "abrir todos" saber se já estão. */
  itens: string[]
  registrar: (valor: string) => () => void
}

const AccordionContext = React.createContext<AccordionContextValue>({
  size: "md",
  markerSide: "end",
  variant: "plain",
  abertos: [],
  abrir: () => {},
  itens: [],
  registrar: () => () => {},
})

const AccordionItemContext = React.createContext<string | null>(null)

/** O conteúdo `findable` fechado sai do `until-found` antes de o Radix medir. */
function revelar(raiz: HTMLElement | null, valores: string[]) {
  for (const valor of valores) {
    raiz
      ?.querySelector(
        `[data-slot=accordion-item][data-value="${CSS.escape(valor)}"] > [data-slot=accordion-content][hidden]`
      )
      ?.removeAttribute("hidden")
  }
}

const accordionVariants = cva("flex w-full flex-col", {
  variants: {
    variant: {
      plain: "[--accordion-px:0px]",
      contained:
        "overflow-hidden rounded-surface border border-border bg-card bg-clip-padding [--accordion-px:--spacing(4)]",
      separated: "gap-2 [--accordion-px:--spacing(4)]",
    },
  },
  defaultVariants: { variant: "plain" },
})

function Accordion({
  className,
  variant = "plain",
  size = "md",
  markerSide = "end",
  ref,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root> &
  VariantProps<typeof accordionVariants> & {
    /** O degrau da escada de controles que a linha ocupa: 32, 36, 40. */
    size?: DisclosureSize
    /** De que lado fica o marcador: `end` (padrão) para perguntas; `start` para estrutura, com as setas na mesma coluna. */
    markerSide?: "start" | "end"
  }) {
  const multiplo = props.type === "multiple"
  const lista = (v: unknown): string[] =>
    Array.isArray(v) ? v : typeof v === "string" && v ? [v] : []
  const [interno, setInterno] = React.useState<string[]>(() => lista(props.defaultValue))
  const controlado = props.value !== undefined
  const abertos = controlado ? lista(props.value) : interno
  const raiz = React.useRef<HTMLDivElement>(null)
  const aoMudar = props.onValueChange as ((v: string | string[]) => void) | undefined

  const mudar = React.useCallback(
    (proximo: string[]) => {
      revelar(raiz.current, proximo.filter((v) => !abertos.includes(v)))
      if (!controlado) setInterno(proximo)
      aoMudar?.(multiplo ? proximo : (proximo[0] ?? ""))
    },
    [abertos, controlado, aoMudar, multiplo]
  )

  const [itens, setItens] = React.useState<string[]>([])
  const registrar = React.useCallback((valor: string) => {
    setItens((atual) => (atual.includes(valor) ? atual : [...atual, valor]))
    return () => setItens((atual) => atual.filter((v) => v !== valor))
  }, [])

  const ctx = React.useMemo<AccordionContextValue>(
    () => ({
      size,
      markerSide,
      variant: variant ?? "plain",
      abertos,
      itens,
      registrar,
      abrir: (valor) => {
        if (!abertos.includes(valor)) mudar(multiplo ? [...abertos, valor] : [valor])
      },
      todos: multiplo ? (abrir) => mudar(abrir ? itens : []) : undefined,
    }),
    [size, markerSide, variant, abertos, itens, registrar, mudar, multiplo]
  )

  // A união discriminada do Radix (`single` | `multiple`) não sobrevive a um
  // valor calculado no espalhamento: montado aqui e convertido uma vez.
  const primitiva = {
    ...props,
    defaultValue: undefined,
    value: multiplo ? abertos : (abertos[0] ?? ""),
    onValueChange: (v: string | string[]) => mudar(lista(v)),
  } as React.ComponentProps<typeof AccordionPrimitive.Root>

  return (
    <AccordionContext.Provider value={ctx}>
      <AccordionPrimitive.Root
        ref={composeRefs(raiz, ref)}
        data-slot="accordion"
        data-variant={variant}
        data-size={size}
        data-marker-side={markerSide}
        className={cn(
          accordionVariants({ variant }),
          markerSide === "start" && "[--accordion-marker-ps:--spacing(7)]",
          className
        )}
        {...primitiva}
      />
    </AccordionContext.Provider>
  )
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  const { variant, registrar } = React.useContext(AccordionContext)
  React.useEffect(() => registrar(props.value), [registrar, props.value])
  return (
    <AccordionItemContext.Provider value={props.value}>
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      data-value={props.value}
      className={cn(
        // A variante chega por contexto: o seletor de ascendente casaria o
        // `data-variant` de qualquer ancestral (`Carousel`, `Alert`…).
        variant !== "separated" && "not-last:border-b",
        // Item solto fechado é uma linha de 34 a 42px: a linha (12), não a
        // superfície, que o desenharia cápsula.
        variant === "separated" &&
          "overflow-hidden rounded-row border border-border bg-card bg-clip-padding",
        "min-w-0",
        // O ícone do gatilho empurra o conteúdo para baixo do rótulo.
        "has-[[data-slot=accordion-trigger-icon]]:[--accordion-icon-ps:--spacing(7)]",
        className
      )}
      {...props}
    />
    </AccordionItemContext.Provider>
  )
}

function AccordionTrigger({
  className,
  children,
  trailing,
  icon,
  description,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
    /** O ícone (ou o ladrilho) antes do rótulo — a categoria, o cartão. */
    icon?: React.ReactNode
    /** A linha de apoio sob o rótulo: "4 transações · última em 12/03". */
    description?: React.ReactNode
    /**
     * O que acompanha o rótulo na outra ponta (contagem, total, `Badge`). É prop
     * porque duas `ml-auto` na mesma linha dividem a sobra em vez de empurrar a
     * segunda para a borda.
     */
    trailing?: React.ReactNode
  }) {
  const { size, markerSide } = React.useContext(AccordionContext)

  const marker = (
    <ChevronDownIcon
      data-slot="accordion-marker"
      aria-hidden
      className={disclosureMarkerClassName}
    />
  )

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          disclosureRowClassName,
          disclosureRowFocusClassName,
          DISCLOSURE_ROW_HEIGHT_CLASS[DISCLOSURE_ROW_HEIGHTS[size]],
          "px-(--accordion-px) py-1.5",
          className
        )}
        {...props}
      >
        {markerSide === "start" ? marker : null}
        {icon ? (
          <span
            data-slot="accordion-trigger-icon"
            aria-hidden
            className="flex shrink-0 text-muted-foreground [&>svg]:size-4"
          >
            {icon}
          </span>
        ) : null}
        {description ? (
          // Rótulo sobre apoio é par de identidade (sem `gap`). Só o rótulo
          // sublinha no cursor.
          <span data-slot="accordion-trigger-content" className="flex min-w-0 flex-1 flex-col">
            <span data-slot="accordion-trigger-label" className={disclosureLabelClassName}>
              {children}
            </span>
            <span
              data-slot="accordion-trigger-description"
              className="text-xs font-normal text-muted-foreground"
            >
              {description}
            </span>
          </span>
        ) : (
          <span
            data-slot="accordion-trigger-label"
            className={disclosureLabelClassName}
          >
            {children}
          </span>
        )}
        {trailing ? (
          <span
            data-slot="accordion-trigger-trailing"
            className="shrink-0 font-normal text-muted-foreground"
          >
            {trailing}
          </span>
        ) : null}
        {markerSide === "end" ? marker : null}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  findable = false,
  forceMount,
  ref,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content> & {
  /** Fechado, continua encontrável pelo ⌘F, e abre quando é achado. */
  findable?: boolean
}) {
  const { abertos, abrir } = React.useContext(AccordionContext)
  const valor = React.useContext(AccordionItemContext)
  const aoAchar = React.useMemo(
    () => (valor != null ? () => abrir(valor) : undefined),
    [abrir, valor]
  )
  const refEncontravel = useUntilFound(
    findable,
    valor != null && abertos.includes(valor),
    aoAchar
  )

  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      // Sob `forceMount` o Radix nunca escreve `hidden`: quem fecha de verdade
      // é o `until-found` do hook.
      forceMount={findable ? true : forceMount}
      ref={composeRefs(refEncontravel, ref)}
      className={cn(
        disclosureMotionClassName,
        "text-sm data-open:animate-accordion-down data-closed:animate-accordion-up"
      )}
      {...props}
    >
      {/* Sem altura declarada, de propósito: este é o nó que o Radix **mede**
          para escrever `--radix-accordion-content-height`. */}
      <div
        className={cn(
          disclosureRevealClassName,
          "px-(--accordion-px) pt-0 pb-3 text-muted-foreground",
          // O texto alinha com o rótulo: o recuo soma a seta (`markerSide="start"`)
          // e o ícone do gatilho, cada um publica a sua parcela.
          "ps-[calc(var(--accordion-px)+var(--accordion-marker-ps,0px)+var(--accordion-icon-ps,0px))]",
          "[&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-primary-accent [&_a]:active:text-primary-accent",
          "[&_p:not(:last-child)]:mb-3",
          className
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
}

/**
 * "Abrir todos" / "Fechar todos", só para `type="multiple"`. Fica dentro do
 * `Accordion`, antes dos itens; o rótulo lê o estado.
 */
function AccordionToggleAll({
  className,
  openLabel = "Abrir todos",
  closeLabel = "Fechar todos",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children" | "onClick"> & {
  openLabel?: string
  closeLabel?: string
}) {
  const { todos, itens, abertos, variant } = React.useContext(AccordionContext)
  if (!todos) return null
  const tudoAberto = itens.length > 0 && itens.every((v) => abertos.includes(v))

  return (
    <div
      data-slot="accordion-toggle-all"
      className={cn(
        "flex justify-end px-(--accordion-px) py-1",
        // Na caixa, a faixa é uma linha a mais, com o fio dos itens.
        variant === "contained" && "border-b"
      )}
    >
      <Button
        type="button"
        variant="tertiary"
        size="xs"
        aria-expanded={tudoAberto}
        className={cn("text-muted-foreground", className)}
        onClick={() => todos(!tudoAberto)}
        {...props}
      >
        {tudoAberto ? closeLabel : openLabel}
      </Button>
    </div>
  )
}

export {
  accordionVariants,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  AccordionToggleAll,
}
