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
import { Spinner } from "@/components/ui/spinner"
import { Caption, Muted } from "@/components/ui/typography"

/**
 * Navegação entre páginas de uma lista.
 * Paginação é uma posição e dois movimentos, não uma fileira de números: "1–20
 * de 342" responde o que a pessoa tem, por isso existe `PaginationStatus`.
 * O tamanho vem de uma fonte só, `paginationSteps`, e a raiz o publica por
 * contexto (as peças são netas da raiz, e `cloneElement` só alcança filho
 * direto; por isso o arquivo é cliente).
 * Os degraus `icon-*` do `Button` nunca declaram `font-size` e esta é a única
 * peça que põe texto dentro de um deles: cada degrau declara o tipo junto com a
 * caixa.
 * Sem `href`, número e extremo viram `<button>`; `page` e `total` montam a janela
 * (`1 … 4 5 6 … 20`) com `getHref` ou `onPageChange`; abaixo de `sm` (ou em
 * `variant="compact"`) fica `‹ 2 de 8 ›`; `PaginationMore` é o "Mostrar mais".
 */

type PaginationSize = "xs" | "sm" | "md" | "lg"

/**
 * A raiz. É o primeiro `cva` do arquivo de propósito: o `ds:catalog` lê só o
 * primeiro `variants:` de cada fonte.
 * O `size` daqui emite o respiro entre o status e os controles. O tipo não
 * desce por herança: o `Button` declara `text-sm` na base e vence; cada peça
 * escreve o seu.
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
 * O degrau inteiro, numa tabela só e com literais (o Tailwind varre texto).
 * | degrau | caixa | corpo |
 * | --- | --- | --- |
 * | **`xs`** (padrão) | 24 | 12px |
 * | `sm` | 28 | 12,8px |
 * | `md` | 32 | 12,8px |
 * | `lg` | 36 | 14px |
 * `xs` é o padrão contra a régua da casa (que o reserva a controle dentro de
 * outro), por decisão do dono; no toque todo controle cresce a 44. `xl` fica fora.
 * O recuo do lado do chevron repete os números do `Button`; o mecanismo
 * `has-data-[icon=…]` dele soma especificidade e venceria o `max-sm:px-0`, e o
 * extremo deixaria de ser quadrado no telefone.
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

/**
 * A janela de páginas: a primeira, a última, a atual e as vizinhas; o resto vira
 * reticência, exceto quando ela esconderia uma página só (vira a própria página).
 */
function janelaDePaginas(page: number, total: number, vizinhos = 1): (number | "…")[] {
  const alvo = new Set([1, total])
  for (let p = page - vizinhos; p <= page + vizinhos; p++) {
    if (p >= 1 && p <= total) alvo.add(p)
  }
  const ordenadas = [...alvo].sort((a, b) => a - b)
  const janela: (number | "…")[] = []
  ordenadas.forEach((p, i) => {
    const anterior = ordenadas[i - 1]
    if (anterior !== undefined && p - anterior === 2) janela.push(anterior + 1)
    else if (anterior !== undefined && p - anterior > 2) janela.push("…")
    janela.push(p)
  })
  return janela
}

/** O degrau da peça: o que ela disser, senão o da raiz, senão `xs`. */
function usePaginationStep(size?: PaginationSize): PaginationStep {
  const herdado = React.useContext(PaginationSizeContext)
  return paginationSteps[size ?? herdado]
}

/** `align`: a forma comum numa lista de app é contagem à esquerda e controles à direita. */
function Pagination({
  className,
  align = "center",
  size = "xs",
  variant = "default",
  page,
  total,
  getHref,
  onPageChange,
  children,
  ...props
}: React.ComponentProps<"nav"> & {
  align?: "center" | "between" | "end"
  /** O degrau da fileira inteira. As peças o herdam; `size` nelas sobrescreve. */
  size?: PaginationSize
  /** `compact`: só `‹ 2 de 8 ›`, em qualquer largura. Pede `page` e `total`. */
  variant?: "default" | "compact"
  /** A página atual, a partir de 1. Com `total`, a fileira é gerada. */
  page?: number
  total?: number
  /** Links: o endereço de cada página. */
  getHref?: (page: number) => string
  /** Botões: a troca por estado, sem URL. */
  onPageChange?: (page: number) => void
}) {
  const gerada = page !== undefined && total !== undefined
  return (
    <PaginationSizeContext.Provider value={size}>
      <nav
        data-slot="pagination"
        data-align={align}
        data-size={size}
        data-variant={variant}
        role="navigation"
        aria-label="Paginação"
        className={cn(paginationVariants({ align, size }), className)}
        {...props}
      >
        {children}
        {gerada ? (
          <PaginationAuto
            page={page}
            total={total}
            getHref={getHref}
            onPageChange={onPageChange}
            compact={variant === "compact"}
          />
        ) : null}
      </nav>
    </PaginationSizeContext.Provider>
  )
}

/** "2 de 8": a posição entre as setas, na forma compacta. */
function PaginationPosition({ page, total }: { page: number; total: number }) {
  const degrau = usePaginationStep()
  return (
    <span
      data-slot="pagination-position"
      aria-current="page"
      className={cn("nums px-1.5 whitespace-nowrap text-muted-foreground", degrau.tipo)}
    >
      <span className="font-medium text-foreground">{page}</span> de {total}
    </span>
  )
}

function PaginationAuto({
  page,
  total,
  getHref,
  onPageChange,
  compact,
}: {
  page: number
  total: number
  getHref?: (page: number) => string
  onPageChange?: (page: number) => void
  compact: boolean
}) {
  const destino = (p: number) =>
    getHref ? { href: getHref(p) } : { onClick: () => onPageChange?.(p) }
  const ultima = Math.max(total, 1)
  return (
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious {...destino(page - 1)} disabled={page <= 1} />
      </PaginationItem>
      {/* No telefone (e sempre, em `compact`) a posição toma o lugar dos números: sete peças a 44px transbordam a 375px. */}
      <PaginationItem className={compact ? undefined : "sm:hidden"}>
        <PaginationPosition page={page} total={ultima} />
      </PaginationItem>
      {compact
        ? null
        : janelaDePaginas(page, ultima).map((p, i) => (
            <PaginationItem key={i} className="max-sm:hidden">
              {p === "…" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink {...destino(p)} isActive={p === page}>
                  {p}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
      <PaginationItem>
        <PaginationNext {...destino(page + 1)} disabled={page >= ultima} />
      </PaginationItem>
    </PaginationContent>
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
 * A posição, em palavras. `.nums` porque os números mudam a cada página e a
 * frase não pode mudar de largura. Costuma morar fora da raiz (status à esquerda,
 * `Pagination` à direita), sem contexto a herdar: nasce em `xs` e aceita `size`.
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
 * Um número. A página atual é `secondary`, e não `outline`: este entrega 1,03:1
 * contra a página no tema claro, e `secondary` é a língua de "selecionado" de
 * `Button`, `Toggle` e `Tabs`. `.nums` porque 1, 10 e 100 têm larguras diferentes.
 */
function PaginationLink({
  className,
  isActive,
  size,
  ...props
}: { isActive?: boolean; size?: PaginationSize } & React.ComponentProps<"a">) {
  const degrau = usePaginationStep(size)
  // Sem `href` é um botão: a lista de estado local troca de página sem URL, e um
  // `<a>` sem `href` não é focável nem anunciado.
  const Elemento = props.href === undefined ? "button" : "a"
  // `Button asChild` sobre o `<a>`, e não `buttonVariants()`: a garantia
  // (`data-variant`, embrulho do rótulo, par `active:`) é do componente.
  return (
    <Button
      asChild
      data-slot="pagination-link"
      variant={isActive ? "secondary" : "tertiary"}
      size={degrau.numero}
      className={cn(
        "nums",
        degrau.tipo,
        // A mesma caixa nos dois estados, só o fundo muda: o `secondary` da atual pinta
        // até a borda (`bg-clip-border`) e o `tertiary` só até dentro dela.
        "bg-clip-border",
        // Alvo de dedo: o pseudo-elemento não serve aqui, os links ficam a 4px e as
        // áreas expandidas se sobreporiam; o controle cresce de verdade, só em ponteiro grosso.
        "pointer-coarse:min-h-11 pointer-coarse:min-w-11",
        className
      )}
    >
      <Elemento
        {...(Elemento === "button" ? { type: "button" as const } : {})}
        aria-current={isActive ? "page" : undefined}
        data-active={isActive ? "true" : undefined}
        {...(props as React.ComponentProps<"a"> & React.ComponentProps<"button">)}
      />
    </Button>
  )
}

/**
 * Um `<a>` não desabilita, e nas pontas da lista os botões precisam disso. Com
 * `disabled` sai um `<span>` sem `href` nem foco, com `aria-disabled` e a
 * opacidade do `Button`.
 */
function PaginationEdge({
  className,
  disabled,
  size,
  children,
  "aria-label": ariaLabel,
  ...props
}: { disabled?: boolean; size?: PaginationSize } & React.ComponentProps<"a">) {
  const degrau = usePaginationStep(size)
  const classes = cn(
    degrau.tipo,
    // Abaixo de `sm` o rótulo some e o controle fica quadrado, na medida do número do mesmo degrau.
    degrau.quadrado,
    "max-sm:gap-0 max-sm:px-0",
    // O mesmo recorte do número: sem ele o realce do extremo pinta 1px a menos de cada lado.
    "bg-clip-border",
    "pointer-coarse:min-h-11 pointer-coarse:min-w-11",
    className
  )

  // Sem `href`, botão; o desabilitado é o do próprio botão (sai do foco e do clique, sem `span`).
  if (props.href === undefined) {
    return (
      <Button asChild variant="tertiary" size={degrau.extremo} className={classes}>
        <button
          type="button"
          data-slot="pagination-link"
          aria-label={ariaLabel}
          disabled={disabled}
          {...(props as React.ComponentProps<"button">)}
        >
          {children}
        </button>
      </Button>
    )
  }

  if (disabled) {
    return (
      <Button
        asChild
        variant="tertiary"
        size={degrau.extremo}
        className={cn(classes, "pointer-events-none opacity-50")}
      >
        {/* O nome vai junto: sem ele, no telefone (rótulo escondido) o extremo desabilitado não se chama nada. */}
        <span data-slot="pagination-link" role="link" aria-disabled="true" aria-label={ariaLabel}>
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
      <a data-slot="pagination-link" aria-label={ariaLabel} {...props}>
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
 * O salto de páginas: decoração (a navegação são os links ao lado), então fica
 * escondido e sem nome. Caixa e corpo vêm do degrau.
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

/**
 * O "Mostrar mais": o botão com a contagem do que já está à vista, para a lista
 * que cresce em vez de trocar de página. Some quando tudo foi mostrado.
 * `pending` troca o rótulo pelo `Spinner` e marca `aria-busy`.
 */
function PaginationMore({
  shown,
  total,
  step,
  onMore,
  pending = false,
  className,
}: {
  shown: number
  total: number
  /** Quantos entram a cada toque; aparece no rótulo. */
  step?: number
  onMore: () => void
  pending?: boolean
  className?: string
}) {
  if (shown >= total) return null
  const proximos = step ? Math.min(step, total - shown) : null
  return (
    <div
      data-slot="pagination-more"
      className={cn("flex flex-col items-center gap-1", className)}
    >
      <Button
        type="button"
        variant="tertiary"
        size="sm"
        disabled={pending}
        aria-busy={pending || undefined}
        onClick={onMore}
      >
        {pending ? <Spinner size="sm" aria-hidden /> : null}
        {proximos ? "mostrar mais " + proximos : "mostrar mais"}
      </Button>
      <Caption className="nums">
        {shown} de {total}
      </Caption>
    </div>
  )
}

export {
  janelaDePaginas,
  Pagination,
  PaginationContent,
  PaginationMore,
  PaginationPosition,
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
