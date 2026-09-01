"use client"

import { ChevronDownIcon } from "@heroicons/react/16/solid"
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Accordion as AccordionPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import {
  DISCLOSURE_ROW_HEIGHT_CLASS,
  DISCLOSURE_ROW_HEIGHTS,
  disclosureLabelClassName,
  disclosureMarkerClassName,
  disclosureMotionClassName,
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
 * já tem moldura. `contained` é uma caixa só com os fios por dentro — a forma
 * que este app usa, porque um acordeão aqui mora dentro de tela e não dentro de
 * cartão. `separated` solta cada item, e é a única das três que **não vai dentro
 * de um `Card`**: cartão dentro de cartão é sempre errado, e aqui a regra tem
 * consequência prática, não só estética — a segunda moldura não acrescenta
 * fronteira nenhuma que a primeira já não tenha desenhado.
 *
 * O recuo horizontal é uma variável (`--accordion-px`), e não um número repetido
 * em duas peças: em `plain` ele é zero, porque o texto tem que alinhar com o
 * conteúdo em volta; nas duas molduradas ele é 16, porque agora existe uma borda
 * de onde se afastar. É o mesmo mecanismo do `--dialog-px`.
 */

type AccordionContextValue = {
  size: DisclosureSize
  markerSide: "start" | "end"
}

const AccordionContext = React.createContext<AccordionContextValue>({
  size: "md",
  markerSide: "end",
})

const accordionVariants = cva("flex w-full flex-col", {
  variants: {
    variant: {
      plain: "[--accordion-px:0px]",
      contained:
        "overflow-hidden rounded-xl border border-border bg-card [--accordion-px:--spacing(4)]",
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
  const ctx = React.useMemo(() => ({ size, markerSide }), [size, markerSide])

  return (
    <AccordionContext.Provider value={ctx}>
      <AccordionPrimitive.Root
        data-slot="accordion"
        data-variant={variant}
        data-size={size}
        className={cn(accordionVariants({ variant }), className)}
        {...props}
      />
    </AccordionContext.Provider>
  )
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        // A variante desce por seletor de ascendente em vez de por contexto
        // porque aqui ela é só pintura, e um `data-variant` no item duplicaria
        // um dado que a raiz já publica.
        "in-data-[variant=plain]:not-last:border-b",
        "in-data-[variant=contained]:not-last:border-b",
        "in-data-[variant=separated]:overflow-hidden in-data-[variant=separated]:rounded-xl in-data-[variant=separated]:border in-data-[variant=separated]:border-border in-data-[variant=separated]:bg-card",
        "min-w-0",
        className
      )}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  trailing,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
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
        <span
          data-slot="accordion-trigger-label"
          className={disclosureLabelClassName}
        >
          {children}
        </span>
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
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
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
          "px-(--accordion-px) pt-0 pb-3 text-muted-foreground",
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

export {
  accordionVariants,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
}
