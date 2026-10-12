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
 * ## Ele não tinha eixo nenhum, e o que ele desenhava era um resto
 *
 * Este arquivo era o do shadcn com duas trocas. Não havia `variant`, não havia
 * `size`, a altura da linha era um `py-2.5` sem nome, o realce de cursor era um
 * `hover:underline` atravessando a linha inteira, e o anel de foco carregava um
 * `focus-visible:after:border-ring` apontando para um `::after` **que este
 * componente nunca desenhou** — um seletor da família "sobreviveu à remoção" que
 * o AGENTS.md já documenta duas vezes.
 *
 * A geometria, o marcador, o realce, o alvo de toque e o foco saíram daqui para
 * [`lib/disclosure-classes`](../../lib/disclosure-classes.ts), que é a régua que
 * este componente divide com o `Collapsible`. O que fica aqui é o que é só do
 * acordeão: a moldura, o recuo e o conteúdo.
 *
 * ## A altura de conteúdo era circular
 *
 * O corpo trazia `h-(--radix-accordion-content-height)` no **envelope interno**.
 * A variável é escrita pelo Radix a partir do `offsetHeight` desse mesmo nó, ou
 * seja: o elemento declarava como altura a medida que ele próprio produz. Na
 * primeira pintura ela não existe e a declaração cai para `auto`; depois ela
 * congela. Um parágrafo que reflui — janela estreitando, fonte do sistema
 * maior, tradução mais longa — passa a ser **recortado**, porque a altura ficou
 * na medida de antes da quebra.
 *
 * O envelope não precisa de altura nenhuma. Quem anima altura é a `Content` do
 * Radix, por keyframes, contra a variável — e é justamente por isso que o
 * envelope tem que ser livre para ser medido.
 *
 * ## As três molduras
 *
 * `plain` é o que existia: fio entre itens e mais nada, para dentro de algo que
 * já tem moldura. `contained` é uma caixa só com os fios por dentro, para o
 * acordeão que mora direto na tela e não dentro de cartão. `separated` solta cada item, e é a única das três que **não vai dentro
 * de um `Card`**: cartão dentro de cartão é sempre errado, e aqui a regra tem
 * consequência prática, não só estética — a segunda moldura não acrescenta
 * fronteira nenhuma que a primeira já não tenha desenhado.
 *
 * O recuo horizontal é uma variável (`--accordion-px`), e não um número repetido
 * em duas peças: em `plain` ele é zero, porque o texto tem que alinhar com o
 * conteúdo em volta; nas duas molduradas ele é 16, porque agora existe uma borda
 * de onde se afastar. É o mesmo mecanismo do `--dialog-px`.
 *
 * ## Rodada 200
 *
 * - **O estado mora aqui.** O Radix guardava o valor sozinho quando ninguém o
 *   controlava, e duas versões precisam escrever nele de fora da linha: o ⌘F
 *   abrindo o item que achou e o "abrir todos". A raiz agora controla o Radix
 *   sempre, com `defaultValue` como semente — o mesmo idioma do `ToggleGroup`
 *   e do `RadioGroup deselectable`.
 * - **`findable`** no `AccordionContent`: a mecânica do `Collapsible`
 *   (`hooks/use-until-found`).
 * - **`icon` e `description`** no gatilho: o ícone antes do rótulo, e a linha
 *   de apoio sob ele, par de identidade sem `gap`.
 * - **`AccordionToggleAll`**: "Abrir todos" / "Fechar todos" em
 *   `type="multiple"`. Os itens se registram na raiz, e o rótulo troca sozinho.
 * - **O conteúdo alinha com o rótulo**, e não com a seta nem com o ícone: com
 *   `markerSide="start"` ele começava sob o marcador, 28px antes do texto que
 *   encabeça, e o `icon` novo repetiria o defeito.
 */

type AccordionContextValue = {
  size: DisclosureSize
  markerSide: "start" | "end"
  variant: "plain" | "contained" | "separated"
  /** Os itens abertos, sempre como lista — no `single`, zero ou um. */
  abertos: string[]
  /** Abre um item (o ⌘F que o achou). */
  abrir: (valor: string) => void
  /** Só no `multiple`: abre ou fecha todos. */
  todos?: (abrir: boolean) => void
  /** Quantos itens existem — o "abrir todos" precisa saber se já estão. */
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
        "overflow-hidden rounded-surface border border-border bg-card [--accordion-px:--spacing(4)]",
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
    /**
     * De que lado fica o marcador.
     *
     * `end` é o padrão e é o acordeão de perguntas: o rótulo começa na margem e
     * a seta espera na outra ponta. `start` é o acordeão de **estrutura** — uma
     * árvore, um agrupamento aninhado —, onde a seta antes do rótulo é o que
     * deixa a hierarquia legível numa varredura vertical, porque todas as setas
     * ficam na mesma coluna.
     */
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
  // valor calculado no espalhamento: montado aqui e convertido uma vez, o
  // idioma do `ToggleGroup`.
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
        // A variante chega por contexto. Por seletor de ascendente (`in-data-…`)
        // ela casava o `data-variant` de **qualquer** ancestral — o `Carousel`
        // publica `plain`, o `Alert` e o `EmptyState` publicam os seus.
        variant !== "separated" && "not-last:border-b",
        // Cada item solto é uma linha de 34 a 42px fechado: a linha (12), e
        // não a superfície, que o desenhava cápsula (rodada 241v). A linha
        // alta (16) ficaria a 1px da cápsula no degrau `md` de 34.
        variant === "separated" &&
          "overflow-hidden rounded-row border border-border bg-card",
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
     * O que acompanha o rótulo na outra ponta da linha — uma contagem, um total,
     * um `Badge`.
     *
     * É prop e não peça componível porque a alternativa exigia duas margens
     * automáticas na mesma linha de flex, e **duas `ml-auto` dividem a sobra em
     * partes iguais** em vez de empurrar a segunda para a borda: o valor
     * terminaria flutuando no meio da linha. Com um slot nomeado a ordem é
     * declarada, e ela continua correta com o marcador dos dois lados.
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
          // Rótulo sobre apoio é **par de identidade**: sem `gap`, quem os
          // separa é a entrelinha. Só o rótulo sublinha no cursor.
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
      // Sob `forceMount` o Radix nunca escreve `hidden` e mantém os filhos —
      // quem fecha de verdade é o `until-found` do hook.
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
          // O texto alinha com o rótulo, e não com a seta nem com o ícone: o
          // recuo soma o que estiver antes dele — a seta (`markerSide="start"`)
          // e o ícone do gatilho, 16 + o vão de 12 cada um. Cada um publica a
          // sua parcela; sem nenhum, é o recuo da moldura.
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
 * "Abrir todos" / "Fechar todos" (rodada 200), para `type="multiple"` — no
 * `single` não há "todos" a abrir, e ele não renderiza. Fica **dentro** do
 * `Accordion`, antes dos itens, numa faixa alinhada ao fim no recuo da
 * moldura. O rótulo lê o estado: com todos abertos, fecha; senão, abre.
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
