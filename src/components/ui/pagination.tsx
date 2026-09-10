"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Muted } from "@/components/ui/typography"

/**
 * Navegação entre páginas de uma lista.
 *
 * ## Paginação não é uma fileira de números
 *
 * É uma **posição** e dois **movimentos**. Numa lista de transações, "1–20 de
 * 342" responde a pergunta que a pessoa realmente tem; um link para a página 7
 * quase nunca responde. Por isso `PaginationStatus` existe como peça: a
 * documentação antiga já citava esse texto ("o texto 'página 2 de 8' ao lado é
 * o que continua orientando") sem entregá-lo, e toda tela o escreveria à mão.
 *
 * ## A fileira inteira estava no corpo do texto da página
 *
 * Medido antes da escada: número, extremo e status em **14px**, caixas em 32 —
 * o dígito `font-medium` tinha o mesmo corpo de um parágrafo, e é isso que o olho
 * lia como "grande demais". O rodapé de paginação **real** do app, escrito à mão
 * em `transactions-table.tsx`, já rodava em 12px.
 *
 * **Encolher só a caixa não resolveria**, e o motivo é do `Button`: os degraus
 * `icon-*` **nunca declaram `font-size`** — só `xs` e `sm` da coluna de texto o
 * fazem. A coluna de ícone espelha a de texto na **caixa**, não no **tipo**.
 * Num botão de ícone isso é invisível; esta é a única peça do sistema que põe
 * **texto** dentro de um `icon-*`, então `icon-sm` sozinho daria um dígito de
 * 14px numa caixa de 28. Por isso cada degrau declara o tipo junto com a caixa
 * — a lição que o `Tabs` registrou.
 *
 * ## Uma fonte para o tamanho
 *
 * O tamanho era decidido em quatro lugares que precisavam concordar e não se
 * conheciam: o extremo (`size="md"`), o número (`size="icon-md"`), a reticência
 * (`size-8` cravado) e o quadrado do telefone (`max-sm:size-8`, "na medida dos
 * números ao lado" — escrito à mão). Hoje os quatro saem de `paginationSteps`, e
 * a raiz publica o degrau por contexto.
 *
 * **Contexto, e não clone, e isso custa `"use client"`.** As peças são **netas**
 * da raiz (`Pagination > Content > Item > Link`), e `cloneElement` só alcança
 * filho direto. A troca é barata — o `Button` já é módulo cliente e nada aqui
 * tem estado —, mas este arquivo era componente de servidor, e deixou de ser.
 */

type PaginationSize = "xs" | "sm" | "md" | "lg"

/**
 * A raiz. **É o primeiro `cva` do arquivo de propósito**: o `ds:catalog` lê só o
 * primeiro `variants:` de cada fonte, e sem ele esta peça saía com `—` na coluna
 * de eixos — como se não tivesse decisão nenhuma a tomar.
 *
 * O `size` daqui emite o respiro entre o status e os controles, que é
 * declaração real da raiz. O **tipo** não pode descer por herança a partir
 * dela: o `Button` declara `text-sm` na base do próprio `cva`, e classe no
 * elemento vence herança. Cada peça escreve o seu.
 */
const paginationVariants = cva("flex w-full flex-wrap items-center", {
  variants: {
    align: {
      center: "justify-center",
      between: "justify-between",
      end: "justify-end",
    },
    size: {
      xs: "gap-1.5",
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
    },
  },
  defaultVariants: { align: "center", size: "xs" },
})

type PaginationStep = {
  /** A caixa do número — sempre o par `icon-*` do extremo. */
  numero: "icon-xs" | "icon-sm" | "icon-md" | "icon-lg"
  /** A caixa do extremo, na escada de texto do `Button`. */
  extremo: PaginationSize
  /** O corpo de todas as peças. `icon-*` não o declara, então alguém tem de. */
  tipo: string
  /** O extremo no telefone, quadrado **na medida do número**. */
  quadrado: string
  /** O recuo do lado do chevron, que é mais curto que o do rótulo. */
  inicio: string
  fim: string
  /** A reticência, na mesma caixa do número. */
  salto: string
  saltoIcone: string
}

/**
 * O degrau inteiro, numa tabela só — e com **literais**, porque o Tailwind
 * varre o código como texto e classe montada em tempo de execução não existe.
 *
 * | degrau | caixa | corpo |
 * | --- | --- | --- |
 * | **`xs`** (padrão) | 24 | 12px |
 * | `sm` | 28 | 12,8px |
 * | `md` | 32 | 12,8px |
 * | `lg` | 36 | 14px |
 *
 * **`md` não é a geometria antiga**, e é de propósito: a antiga era caixa 32
 * com tipo 14, que é o defeito relatado. `md` mantém a caixa e desce o tipo.
 *
 * **`xs` é o padrão, e entrou contra a régua da casa, por decisão do dono.** A
 * escada reserva `xs` e `icon-xs` para controles que moram dentro de outro
 * controle, e uma fileira de paginação não mora dentro de nada. O pedido foi
 * uma versão ainda menor que o `sm`, e que ela fosse o padrão. Ele sai inteiro
 * da escada do `Button` — `xs` no extremo, `icon-xs` no número, e o `text-xs`
 * que o próprio `Button xs` usa, o mesmo 12px do rodapé real do app. No toque
 * nada muda: todo controle cresce a 44 de qualquer jeito.
 *
 * `xl` (40) continua fora: é a altura de campo alto, e um paginador maior que
 * tudo em volta não tem caso.
 *
 * O recuo do lado do chevron repete os números que o próprio `Button` usa para
 * ícone na borda (`1.5` no `sm`, `2.5` acima). Ele não vem do mecanismo
 * `has-data-[icon=…]` do `Button` porque aquele seletor soma especificidade e
 * venceria o `max-sm:px-0` — o extremo deixaria de ser quadrado no telefone.
 */
const paginationSteps = {
  xs: {
    numero: "icon-xs",
    extremo: "xs",
    tipo: "text-xs",
    quadrado: "max-sm:size-6",
    inicio: "sm:pl-1.5",
    fim: "sm:pr-1.5",
    salto: "size-6",
    saltoIcone: "size-3",
  },
  sm: {
    numero: "icon-sm",
    extremo: "sm",
    tipo: "text-control-sm",
    quadrado: "max-sm:size-7",
    inicio: "sm:pl-1.5",
    fim: "sm:pr-1.5",
    salto: "size-7",
    saltoIcone: "size-3.5",
  },
  md: {
    numero: "icon-md",
    extremo: "md",
    tipo: "text-control-sm",
    quadrado: "max-sm:size-8",
    inicio: "sm:pl-2.5",
    fim: "sm:pr-2.5",
    salto: "size-8",
    saltoIcone: "size-4",
  },
  lg: {
    numero: "icon-lg",
    extremo: "lg",
    tipo: "text-sm",
    quadrado: "max-sm:size-9",
    inicio: "sm:pl-2.5",
    fim: "sm:pr-2.5",
    salto: "size-9",
    saltoIcone: "size-4",
  },
} as const satisfies Record<PaginationSize, PaginationStep>

const PaginationSizeContext = React.createContext<PaginationSize>("xs")

/** O degrau da peça: o que ela disser, senão o da raiz, senão `xs`. */
function usePaginationStep(size?: PaginationSize): PaginationStep {
  const herdado = React.useContext(PaginationSizeContext)
  return paginationSteps[size ?? herdado]
}

/**
 * `align` existe porque `mx-auto … justify-center` estava cravado, e a forma
 * mais comum numa lista de app é outra: contagem à esquerda, controles à
 * direita. Não dava para chegar nela sem desfazer duas classes por fora.
 */
function Pagination({
  className,
  align = "center",
  size = "xs",
  ...props
}: React.ComponentProps<"nav"> & {
  align?: "center" | "between" | "end"
  /** O degrau da fileira inteira. As peças o herdam; `size` nelas sobrescreve. */
  size?: PaginationSize
}) {
  return (
    <PaginationSizeContext.Provider value={size}>
      <nav
        data-slot="pagination"
        data-align={align}
        data-size={size}
        role="navigation"
        aria-label="Paginação"
        className={cn(paginationVariants({ align, size }), className)}
        {...props}
      />
    </PaginationSizeContext.Provider>
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

/**
 * A posição, em palavras.
 *
 * `.nums` porque os três números mudam a cada página e, sem figuras tabulares,
 * a frase inteira muda de largura junto — o olho lê isso como a linha se
 * mexendo, não como o dado mudando.
 *
 * **Ela costuma morar fora da raiz** — no rodapé de uma tabela, o status fica à
 * esquerda e a `Pagination` à direita, como irmãos. Fora da raiz não há
 * contexto a herdar, então ela nasce no mesmo padrão (`xs`) e aceita `size`
 * próprio para acompanhar uma fileira de outro degrau.
 */
function PaginationStatus({
  className,
  size,
  ...props
}: React.ComponentProps<"p"> & { size?: PaginationSize }) {
  const degrau = usePaginationStep(size)
  return (
    <Muted
      data-slot="pagination-status"
      className={cn("nums", degrau.tipo, className)}
      {...props}
    />
  )
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" className={className} {...props} />
}

/**
 * Um número. A página atual é `secondary`, e não `outline`.
 *
 * Medido no tema claro: `outline` entrega `oklch(0.985)` de preenchimento
 * contra uma página de `oklch(1)` — 1,03:1. Numa fileira de links
 * transparentes, "você está aqui" era um contorno de 1px e um branco quase
 * idêntico ao fundo. `secondary` preenche de cinza, que é a língua de
 * "selecionado" que `Button`, `Toggle` e a bandeja do `Tabs` já falam.
 *
 * `.nums` porque 1, 10 e 100 têm larguras diferentes em figuras
 * proporcionais — a fileira inteira se reacomoda ao virar a página.
 */
function PaginationLink({
  className,
  isActive,
  size,
  ...props
}: { isActive?: boolean; size?: PaginationSize } & React.ComponentProps<"a">) {
  const degrau = usePaginationStep(size)
  // `Button asChild` sobre o `<a>`, e não `buttonVariants()` no `<a>`: a
  // garantia é do componente — o `data-variant`, o embrulho do rótulo, o par
  // `active:` que vier. O `font-medium` que se somava quando ativo saiu: já é a
  // base.
  return (
    <Button
      asChild
      data-slot="pagination-link"
      variant={isActive ? "secondary" : "tertiary"}
      size={degrau.numero}
      className={cn(
        "nums",
        degrau.tipo,
        // **A mesma caixa nos dois estados; o que muda é o fundo.** O
        // `secondary` da página atual pinta até a borda (`bg-clip-border`) e o
        // `tertiary` das outras só até dentro dela: o quadrado da atual saía
        // com 24px e o realce das outras com 22, a borda transparente de 1px
        // sem tinta de cada lado. Medido: em repouso as duas diferiam em
        // `background-color` e em `background-clip`, e em mais nada.
        "bg-clip-border",
        // Alvo de dedo. Aqui não dá para usar o pseudo-elemento do Checkbox: os
        // links ficam lado a lado com 4px de intervalo, e áreas expandidas se
        // sobreporiam — a pessoa tocaria na página 3 mirando a 2. Então o
        // controle cresce de verdade, só em ponteiro grosso.
        "pointer-coarse:min-h-11 pointer-coarse:min-w-11",
        className
      )}
    >
      <a
        aria-current={isActive ? "page" : undefined}
        data-active={isActive ? "true" : undefined}
        {...props}
      />
    </Button>
  )
}

/**
 * Um `<a>` não desabilita, e nas duas pontas da lista os dois botões precisam
 * disso — "Anterior" na página 1 era um link que levava à própria página.
 * Com `disabled` sai um `<span>`: sem `href`, sem foco, `aria-disabled` para o
 * leitor de tela, e a mesma opacidade que o `Button` usa.
 */
function PaginationEdge({
  className,
  disabled,
  size,
  children,
  ...props
}: { disabled?: boolean; size?: PaginationSize } & React.ComponentProps<"a">) {
  const degrau = usePaginationStep(size)
  const classes = cn(
    degrau.tipo,
    // Abaixo de `sm` o rótulo some e o controle fica quadrado, **na medida do
    // número** do mesmo degrau. Antes ele saía 40×32, com 10px de recuo à
    // esquerda e 12 à direita — um retângulo torto numa fileira de quadrados.
    degrau.quadrado,
    "max-sm:gap-0 max-sm:px-0",
    // O mesmo recorte do número: sem ele o realce do extremo pinta só dentro
    // da borda transparente — 1px a menos de cada lado que o das páginas.
    "bg-clip-border",
    "pointer-coarse:min-h-11 pointer-coarse:min-w-11",
    className
  )

  if (disabled) {
    return (
      <Button
        asChild
        variant="tertiary"
        size={degrau.extremo}
        className={cn(classes, "pointer-events-none opacity-50")}
      >
        <span data-slot="pagination-link" aria-disabled="true">
          {children}
        </span>
      </Button>
    )
  }

  return (
    <Button
      asChild
      variant="tertiary"
      size={degrau.extremo}
      className={classes}
    >
      <a data-slot="pagination-link" {...props}>
        {children}
      </a>
    </Button>
  )
}

function PaginationPrevious({
  className,
  size,
  ...props
}: React.ComponentProps<typeof PaginationEdge>) {
  const degrau = usePaginationStep(size)
  return (
    <PaginationEdge
      aria-label="Ir para a página anterior"
      size={size}
      className={cn(degrau.inicio, className)}
      {...props}
    >
      <ChevronLeftIcon aria-hidden />
      <span className="hidden sm:inline">Anterior</span>
    </PaginationEdge>
  )
}

function PaginationNext({
  className,
  size,
  ...props
}: React.ComponentProps<typeof PaginationEdge>) {
  const degrau = usePaginationStep(size)
  return (
    <PaginationEdge
      aria-label="Ir para a próxima página"
      size={size}
      className={cn(degrau.fim, className)}
      {...props}
    >
      <span className="hidden sm:inline">Próxima</span>
      <ChevronRightIcon aria-hidden />
    </PaginationEdge>
  )
}

/**
 * O salto de páginas.
 *
 * O `<span class="sr-only">Mais páginas</span>` que morava aqui estava **dentro**
 * de um `aria-hidden="true"`: texto morto, que nunca chegou à árvore de
 * acessibilidade. Um marcador de salto é decoração — a navegação de verdade são
 * os links ao lado —, então ele fica escondido e sem nome.
 *
 * A caixa era `size-8` **cravado**, sem seguir nada, e o corpo era herdado da
 * página (16px, medido). Hoje os dois vêm do degrau.
 */
function PaginationEllipsis({
  className,
  size,
  ...props
}: React.ComponentProps<"span"> & { size?: PaginationSize }) {
  const degrau = usePaginationStep(size)
  return (
    <span
      data-slot="pagination-ellipsis"
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center text-muted-foreground",
        degrau.salto,
        degrau.tipo,
        className
      )}
      {...props}
    >
      <EllipsisHorizontalIcon className={degrau.saltoIcone} />
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEdge,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationStatus,
  paginationSteps,
  paginationVariants,
}
export type { PaginationSize }
