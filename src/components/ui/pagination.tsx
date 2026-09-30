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
 *
 * ## Rodada 196
 *
 * Nenhuma tela usava este componente: ele só aceitava `href`, e as duas listas
 * paginadas do app trocam de página por estado. Agora:
 *
 * - **por botões** — sem `href`, número e extremo viram `<button>`;
 * - **fileira gerada** — `page` e `total` montam a janela (`1 … 4 5 6 … 20`),
 *   com `getHref` (links) ou `onPageChange` (botões);
 * - **compacta** — abaixo de `sm` os números somem e fica `‹ 2 de 8 ›`, que era
 *   o defeito aberto desta página (a fileira transbordava a 375px);
 *   `variant="compact"` a força em qualquer largura;
 * - **`PaginationMore`** — o "Mostrar mais" com a contagem.
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

/**
 * A janela de páginas: a primeira, a última, a atual e as vizinhas; o resto
 * vira reticência — e uma reticência que esconderia **uma** página só vira a
 * página, porque "…" no lugar de um número não economiza nada.
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

/**
 * `align` existe porque `mx-auto … justify-center` estava cravado, e a forma
 * mais comum numa lista de app é outra: contagem à esquerda, controles à
 * direita. Não dava para chegar nela sem desfazer duas classes por fora.
 */
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
      {/* No telefone (e sempre, em `compact`) a posição toma o lugar dos
          números: a fileira de sete peças a 44px transbordava a 375px. */}
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
  // Sem `href` é um botão (rodada 196): a lista de estado local troca de
  // página sem URL, e um `<a>` sem `href` não é focável nem anunciado.
  const Elemento = props.href === undefined ? "button" : "a"
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
  "aria-label": ariaLabel,
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

  // Sem `href`, botão (rodada 196) — e o desabilitado é o do próprio botão,
  // que sai do foco e do clique sem precisar de `span`.
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

/**
 * O "Mostrar mais" (rodada 196): o botão com a contagem do que já está à
 * vista, para a lista que cresce em vez de trocar de página. Some quando tudo
 * já foi mostrado. `pending` troca o rótulo pelo `Spinner` e marca `aria-busy`
 * enquanto a próxima leva chega. O histórico de pagamentos da conta escrevia o
 * botão à mão, sem contagem.
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
