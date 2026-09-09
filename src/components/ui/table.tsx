import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Muted } from "@/components/ui/typography"
import { scrollFadeViewportXClassName } from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"

/**
 * Dados que se comparam coluna a coluna. `table.tsx` era o shadcn quase
 * intacto — zero `cva`, `—` na coluna de variantes do `ds:catalog` — enquanto
 * o app escrevia à mão tudo que faltava: a moldura de 3 folhas
 * (`mt-3 overflow-x-auto rounded-lg border border-border/50 bg-background/40`,
 * byte a byte), a densidade confortável de 5 painéis (`h-11 px-4 py-0` no
 * cabeçalho) e a compacta de 3 folhas (`h-8 px-2`), o cabeçalho tingido e
 * sticky de 4 painéis, a coluna de checkbox de 4, o botão de ordenar de 4+
 * (mesma string de 12 classes) e as 6 linhas "sem resultados" em `colSpan`.
 *
 * Os dois eixos abaixo — `variant` (moldura) e `size` (densidade) — vêm
 * dessas contagens, e não de antecipação. `numeric`, `selection`, `sort` e
 * `TableEmpty` fecham o resto.
 */
const tableVariants = cva("w-full caption-bottom", {
  variants: {
    /**
     * `plain` (o padrão) não desenha moldura — é a forma para dentro de
     * `Card padding="none"` / `TablePanel`, onde quem fecha a borda é o
     * contêiner. `outline` monta a própria caixa
     * (`data-slot="table-frame"`), **por fora** do viewport que a dissolução
     * mascara: a invariante 2 da dissolução ("o elemento mascarado não
     * desenha nada") proíbe pintar o nó que carrega `scroll-fade-x`, então a
     * moldura tem de ser um nó irmão dele, nunca ele. É a substituição das 3
     * folhas de detalhe (parcelas, faturas, eventos de pagamento) e do
     * wrapper que `PropsTable` monta à mão neste catálogo.
     */
    variant: {
      plain: "",
      outline: "",
    },
    /**
     * Três degraus, medidos contra o que o app já escreve à mão. `sm` é a
     * densidade das mini-tabelas de folha (hoje 3 cópias). `md` é o padrão —
     * e já é o que `PropsTable` (90 páginas) e `ChartDataTable` renderizam
     * sem saber que tinham nome, então nenhum dos dois muda de aparência.
     * `lg` é a densidade dos painéis de transações e assinaturas (hoje 5
     * cópias): o `px` dele (16) é de propósito o mesmo `--card-strip-px` do
     * `Card padding="none"` — é o que alinha a coluna com a barra de topo do
     * painel, e a razão de `TablePanel` herdar `lg` por contexto.
     */
    size: {
      sm: "text-xs [--table-px:--spacing(2)] [--table-py:--spacing(1.5)] [--table-head-h:--spacing(7)] [--table-head-fs:var(--text-2xs)]",
      md: "text-sm [--table-px:--spacing(2.5)] [--table-py:--spacing(2)] [--table-head-h:--spacing(8)] [--table-head-fs:var(--text-xs)]",
      lg: "text-sm [--table-px:--spacing(4)] [--table-py:--spacing(3)] [--table-head-h:--spacing(11)] [--table-head-fs:var(--text-xs)]",
    },
  },
  defaultVariants: {
    variant: "plain",
    size: "md",
  },
})

export type TableSize = "sm" | "md" | "lg"

/** Quem provê `lg` é o `TablePanel` — nenhuma tela dentro dele escreve `size`. */
const TableSizeContext = React.createContext<TableSize | undefined>(undefined)

/**
 * `true` só quando `variant="outline"`: a tabela tem a própria moldura
 * fechando embaixo, e o `TableBody` pode soltar o fio da última linha sem ela
 * se dissolver na página. Ver a nota em `TableBody`.
 */
const TableFramedContext = React.createContext(false)

/**
 * `text` é rótulo comum (`font-medium`); `caps` é a régua versalete — caixa
 * alta, `tracking-wider`, sempre `text-2xs` — que 3 mini-tabelas de folha já
 * escreviam à mão na coluna de ações, e que o comentário de `command.tsx`
 * afirmava (erradamente, até esta rodada) já ser a régua do cabeçalho desta
 * tabela.
 */
export type TableHeaderLabels = "text" | "caps"
const TableHeaderLabelsContext = React.createContext<TableHeaderLabels>("text")

function Table({
  className,
  variant,
  size,
  viewportClassName,
  ...props
}: React.ComponentProps<"table"> &
  VariantProps<typeof tableVariants> & {
    /** Teto de altura do viewport — o que um `TableHeader sticky` exige para colar. */
    viewportClassName?: string
  }) {
  const tamanhoDoContexto = React.useContext(TableSizeContext)
  const resolvedSize = size ?? tamanhoDoContexto ?? "md"
  const resolvedVariant = variant ?? "plain"
  const framed = resolvedVariant === "outline"

  const nucleo = (
    <div
      ref={useScrollFade({ axis: "x" })}
      data-slot="table-viewport"
      className={cn(
        "relative w-full overflow-x-auto",
        "overscroll-x-contain [-webkit-overflow-scrolling:touch]",
        "[scrollbar-gutter:stable]",
        // A dissolução lateral diz que **há mais coluna**, e substitui o
        // "Arraste para ver mais →" que a tela de transações escrevia à mão.
        // A barra fica: as duas dizem coisas diferentes — a barra, onde você
        // está; a dissolução, que continua.
        //
        // Este nó não pode ganhar `bg-`, `border-`, `rounded-` nem `shadow-`:
        // a invariante 2 da dissolução recorta o alfa do elemento inteiro, e
        // um painel com os quatro cantos apagados e os lados opacos lê como
        // bug de renderização. Quem pinta é a `<table>` de dentro; quem
        // emoldura é o nó de fora, só em `variant="outline"`.
        //
        // A distância aqui é `--scroll-fade-x-h` (32) e não os 44 do eixo
        // vertical: uma célula mede ~100px, e 44 dissolveria quase metade de
        // uma coluna.
        scrollFadeViewportXClassName,
        viewportClassName
      )}
    >
      <table
        data-slot="table"
        data-variant={resolvedVariant}
        data-size={resolvedSize}
        className={cn(
          tableVariants({ variant: resolvedVariant, size: resolvedSize }),
          className
        )}
        {...props}
      />
    </div>
  )

  return (
    <TableFramedContext.Provider value={framed}>
      {framed ? (
        <div
          data-slot="table-frame"
          className="overflow-hidden rounded-lg border border-border"
        >
          {nucleo}
        </div>
      ) : (
        nucleo
      )}
    </TableFramedContext.Provider>
  )
}

/**
 * Dois eixos independentes. `variant` é a tinta: `plain` nenhuma, `muted` o
 * tingido que 4 painéis já escreviam à mão (`bg-muted/50`). `labels` é a
 * tipografia do rótulo — ver `TableHead`. `sticky` gruda o cabeçalho no topo
 * do viewport; como o viewport rola nos dois eixos (`overflow-x-auto` promove
 * `overflow-y` a `auto`, pela spec), ele só cola de verdade com um teto —
 * `viewportClassName="max-h-*"` no `Table` pai.
 *
 * **O fio continua morando aqui, e é decisão.** `TableHeader` é uma das três
 * tiras do sistema com fio **e** tinta — junto de `PageHeader` e
 * `TableFooter` —, isentas por decisão da regra que tirou fio e tinta de
 * `CardToolbar`/`CardFooter`/`CardNote`. A tinta e o fio vivem em strings
 * separadas do `cn()`, então a regra J do auditor (que só acusa os dois
 * combinados numa string só) nunca os vê juntos.
 */
function TableHeader({
  className,
  variant,
  labels = "text",
  sticky,
  ...props
}: React.ComponentProps<"thead"> & {
  variant?: "plain" | "muted"
  labels?: TableHeaderLabels
  sticky?: boolean
}) {
  return (
    <TableHeaderLabelsContext.Provider value={labels}>
      <thead
        data-slot="table-header"
        data-variant={variant ?? "plain"}
        data-labels={labels}
        data-sticky={sticky ? "" : undefined}
        className={cn(
          "[&_tr]:border-b",
          // Versalete é sempre `text-2xs`, qualquer que seja o degrau de
          // densidade — a régua desce por variável CSS, redeclarada aqui e
          // herdada pelo `<th>` de dentro, porque `uppercase`/`tracking-wider`
          // não são variáveis e descem por contexto React (ver `TableHead`).
          labels === "caps" && "[--table-head-fs:var(--text-2xs)]",
          // Sticky exige tinta opaca: a 50% o conteúdo rolando por baixo
          // vazaria através do cabeçalho parado.
          sticky && "sticky top-0 z-(--z-raised) bg-card",
          !sticky && variant === "muted" && "bg-muted/50",
          className
        )}
        {...props}
      />
    </TableHeaderLabelsContext.Provider>
  )
}

/**
 * Sem moldura própria (`plain`), a última linha mantém o fio: sem ele, ela se
 * dissolvia na página — o defeito que a moldura à mão de `PropsTable` já
 * escondia ("o `Table` remove o fio da última linha, o que é certo quando
 * existe borda externa fechando embaixo e errado quando não existe"). Com
 * moldura (`variant="outline"`), quem fecha embaixo é a borda dela, e o fio
 * duplicado sai — lido do `TableFramedContext` que `Table` publica.
 */
function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  const framed = React.useContext(TableFramedContext)
  return (
    <tbody
      data-slot="table-body"
      className={cn(framed && "[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

/**
 * `variant="muted"` (o padrão) é a mesma tinta do cabeçalho — decisão
 * registrada de manter fio **e** tinta nesta tira. Zero consumidores hoje: é
 * a linha de total que nenhuma tela ainda usa.
 */
function TableFooter({
  className,
  variant = "muted",
  ...props
}: React.ComponentProps<"tfoot"> & { variant?: "plain" | "muted" }) {
  return (
    <tfoot
      data-slot="table-footer"
      data-variant={variant}
      className={cn(
        "border-t font-medium [&>tr]:last:border-b-0",
        variant === "muted" && "bg-muted/50",
        className
      )}
      {...props}
    />
  )
}

/**
 * `interactive` é opt-in — o hover ligado sempre era promessa falsa em toda
 * tabela de referência: o próprio `PropsTable` já o desligava por `className`
 * ("nada acontece ao clicar — a linha acender ao passar o cursor é promessa
 * falsa"). Sem ele, só o fio e `data-state="selected"`, que é estado e não
 * resposta ao cursor, e por isso fica sempre ligado.
 *
 * `variant="group"` é a faixa de seção — a linha de mês que
 * `transactions-table.tsx` já pinta à mão (`bg-muted/30`), com uma célula
 * versalete em `colSpan`. Nunca interativa.
 */
function TableRow({
  className,
  variant,
  interactive,
  ...props
}: React.ComponentProps<"tr"> & {
  variant?: "default" | "group"
  interactive?: boolean
}) {
  return (
    <tr
      data-slot="table-row"
      data-variant={variant ?? "default"}
      className={cn(
        "border-b border-border transition-colors data-[state=selected]:bg-muted",
        interactive &&
          "cursor-pointer hover:bg-muted/50 active:bg-muted/50 focus-visible:inset-ring-3 focus-visible:ring-ring/70 focus-visible:outline-none",
        variant === "group" &&
          "border-border/80 bg-muted/30 hover:bg-muted/30 [&>td]:h-auto [&>td]:py-1.5 [&>td]:text-2xs [&>td]:font-semibold [&>td]:tracking-wider [&>td]:text-muted-foreground [&>td]:uppercase",
        className
      )}
      {...props}
    />
  )
}

const TABLE_NUMERIC_HEAD_CLASS = "text-right"
const TABLE_NUMERIC_CELL_CLASS = "text-right nums whitespace-nowrap"
// Medido: sem nudge, o checkbox de 16px sai 2px acima do centro vertical da
// célula — `align-middle` não fecha essa conta sozinho contra um controle
// inline-flex. É o mesmo ajuste que o shadcn original já carregava, agora
// escopado à coluna de seleção via seletor de descendente.
const TABLE_SELECTION_CLASS =
  "w-10 px-2 md:w-11 md:px-3 [&_[role=checkbox]]:translate-y-0.5"

/**
 * `numeric` alinha à direita e liga `.nums` — sem isso a coluna dança a cada
 * dígito e some justamente a vantagem da tabela (a régua de
 * [Dinheiro](/designsystem/dinheiro)). `selection` reserva a coluna do
 * checkbox — medido, `align-middle` sozinho deixa o `Checkbox` (`size-4`) 2px
 * acima do centro da célula, e a classe soma o nudge que corrige isso.
 * `sort`/`onSort` trocam o rótulo por um botão com a seta; o
 * `aria-sort` vai no próprio `<th>`, não no botão.
 */
function TableHead({
  className,
  numeric,
  selection,
  sort,
  onSort,
  children,
  ...props
}: React.ComponentProps<"th"> & {
  numeric?: boolean
  selection?: boolean
  sort?: "asc" | "desc" | "none"
  onSort?: () => void
}) {
  const labels = React.useContext(TableHeaderLabelsContext)

  return (
    <th
      data-slot="table-head"
      aria-sort={
        onSort
          ? sort === "asc"
            ? "ascending"
            : sort === "desc"
              ? "descending"
              : "none"
          : undefined
      }
      className={cn(
        "h-(--table-head-h) px-(--table-px) text-left align-middle text-(length:--table-head-fs) text-muted-foreground",
        labels === "caps" ? "font-semibold tracking-wider uppercase" : "font-medium",
        numeric && TABLE_NUMERIC_HEAD_CLASS,
        selection && TABLE_SELECTION_CLASS,
        className
      )}
      {...props}
    >
      {onSort ? (
        <Button
          type="button"
          variant="tertiary"
          size="xs"
          onClick={onSort}
          className={cn(
            "-mx-2 text-(length:--table-head-fs)",
            labels === "caps"
              ? "font-semibold tracking-wider uppercase"
              : "font-medium"
          )}
        >
          {children}
          {sort === "asc" ? (
            <ChevronUpIcon aria-hidden />
          ) : sort === "desc" ? (
            <ChevronDownIcon aria-hidden />
          ) : (
            <ChevronUpDownIcon aria-hidden className="text-muted-foreground/60" />
          )}
        </Button>
      ) : (
        children
      )}
    </th>
  )
}

function TableCell({
  className,
  numeric,
  selection,
  ...props
}: React.ComponentProps<"td"> & {
  numeric?: boolean
  selection?: boolean
}) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-(--table-px) py-(--table-py) align-middle",
        numeric && TABLE_NUMERIC_CELL_CLASS,
        selection && TABLE_SELECTION_CLASS,
        className
      )}
      {...props}
    />
  )
}

/**
 * A linha "sem resultados" — 6 telas escreviam
 * `<td colSpan className="h-10 px-2 text-center text-muted-foreground">` à
 * mão. Aceita texto simples (vira `Muted`) ou um `EmptyState variant="plain"`
 * inteiro para o caso que precisa de ícone e ação.
 */
function TableEmpty({
  colSpan,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"td">, "colSpan"> & { colSpan: number }) {
  return (
    <TableRow className="hover:bg-transparent active:bg-transparent">
      <TableCell
        colSpan={colSpan}
        className={cn("py-8 text-center", className)}
        {...props}
      >
        {typeof children === "string" ? <Muted>{children}</Muted> : children}
      </TableCell>
    </TableRow>
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <Muted asChild data-slot="table-caption" className={cn("mt-4", className)}>
      <caption {...props} />
    </Muted>
  )
}

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmpty,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableSizeContext,
  tableVariants,
}
