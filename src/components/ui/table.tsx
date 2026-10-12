"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import {
  ArrowPathIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/16/solid"
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/ui/empty-state"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Muted } from "@/components/ui/typography"
import {
  scrollFadeVeilClassName,
  scrollFadeViewportXClassName,
} from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"

/**
 * Dados que se comparam coluna a coluna. Os eixos `variant` (moldura) e `size`
 * (densidade) vêm do que as telas escreviam à mão; `numeric`, `selection`,
 * `sort` e `TableEmpty` fecham o resto.
 */
const tableVariants = cva("w-full caption-bottom", {
  variants: {
    /**
     * `plain` (padrão) não desenha moldura: é a forma para dentro de `Card
     * padding="none"` / `TablePanel`, onde o contêiner fecha a borda. `outline`
     * monta a própria caixa (`data-slot="table-frame"`) **por fora** do viewport que
     * a dissolução mascara: o nó mascarado não desenha nada, então a moldura é um nó
     * irmão dele.
     */
    variant: {
      plain: "",
      outline: "",
    },
    /**
     * Cinco degraus, pela altura da linha: `xs` 32 · `sm` 36 · **`md` 44** · `lg`
     * 52 · `xl` 64 (a escada de densidade do Carbon, com os nomes do sistema). A
     * altura é `2 × py` mais a entrelinha do corpo (16 no `text-xs`, 20 no
     * `text-sm`, 24 no `text-base`). O `px` do `md` para cima é 16, o
     * `--card-strip-px` do `Card padding="none"`: alinha a coluna com a barra de
     * topo do painel em qualquer densidade.
     */
    size: {
      xs: "text-xs [--table-px:--spacing(2)] [--table-py:--spacing(2)] [--table-head-h:--spacing(8)] [--table-head-fs:var(--text-2xs)]",
      sm: "text-sm [--table-px:--spacing(2.5)] [--table-py:--spacing(2)] [--table-head-h:--spacing(9)] [--table-head-fs:var(--text-xs)]",
      md: "text-sm [--table-px:--spacing(4)] [--table-py:--spacing(3)] [--table-head-h:--spacing(11)] [--table-head-fs:var(--text-xs)]",
      lg: "text-sm [--table-px:--spacing(4)] [--table-py:--spacing(4)] [--table-head-h:--spacing(12)] [--table-head-fs:var(--text-xs)]",
      xl: "text-base [--table-px:--spacing(4)] [--table-py:--spacing(5)] [--table-head-h:--spacing(14)] [--table-head-fs:var(--text-sm)]",
    },
    /**
     * O fio entre as linhas. `rows` (padrão) é o de sempre; `none` tira os fios do
     * corpo (a faixa de grupo mantém o seu), para a tabela curta dentro de uma
     * moldura; `grid` soma o fio vertical entre as células, para a planilha.
     */
    dividers: {
      rows: "",
      none: "[&>tbody>tr:not([data-variant=group])]:border-transparent",
      grid: "[&_th:not(:last-child)]:border-e [&_td:not(:last-child)]:border-e [&_th]:border-border [&_td]:border-border",
    },
    /**
     * Zebra, para a linha larga que o olho atravessa. Desligada por padrão e mais
     * fraca que o realce do cursor (`muted/30`). O seletor vai em `:where()` para
     * pesar (0,1,0): o `hover:` e o selecionado (0,2,0) vencem sem disputa.
     */
    striped: {
      true: "[&_:where(tbody>tr:nth-child(even):not([data-variant=group]))]:bg-muted/20 [&_:where(tbody>tr:nth-child(even):not([data-variant=group]))]:[--table-pin-bg:color-mix(in_srgb,var(--color-muted)_20%,var(--color-card))]",
      false: "",
    },
  },
  defaultVariants: {
    variant: "plain",
    size: "md",
    dividers: "rows",
    striped: false,
  },
})

export type TableSize = "xs" | "sm" | "md" | "lg" | "xl"

/** Quem provê `lg` é o `TablePanel` (nenhuma tela dentro dele escreve `size`). */
const TableSizeContext = React.createContext<TableSize | undefined>(undefined)

/**
 * `true` só quando `variant="outline"`: a moldura fecha embaixo, e o `TableBody`
 * pode soltar o fio da última linha sem ela se dissolver na página.
 */
const TableFramedContext = React.createContext(false)

/**
 * O modo de dissolução do viewport, para as peças de dentro. Em `bottom` o
 * viewport não se mascara (a borda de baixo é um véu irmão) e o `TableHeader`
 * fixo pode ser vidro: `backdrop-filter` dentro de elemento mascarado não borra.
 */
const TableFadeContext = React.createContext<TableFade>("sides")

export type TableFade = "sides" | "bottom" | "none"

/**
 * `text` é rótulo comum (`font-medium`); `caps` é a régua versalete (caixa alta,
 * `tracking-wider`, sempre `text-2xs`) das mini-tabelas de folha.
 */
export type TableHeaderLabels = "text" | "caps"
const TableHeaderLabelsContext = React.createContext<TableHeaderLabels>("text")

function Table({
  className,
  variant,
  size,
  dividers,
  striped,
  pending = false,
  viewportClassName,
  viewportRef,
  fade = "sides",
  ...props
}: React.ComponentProps<"table"> &
  VariantProps<typeof tableVariants> & {
    /** Teto de altura do viewport — o que um `TableHeader sticky` exige para colar. */
    viewportClassName?: string
    /** O nó que rola — para quem virtualiza as linhas e precisa dele. */
    viewportRef?: (el: HTMLDivElement | null) => void
    /**
     * A recarga: os dados de antes continuam na tela (`keepPreviousData`) e o corpo
     * esmaece a 60% com `aria-busy`. Não é carregamento (esse é o `TableSkeleton`).
     */
    pending?: boolean
    /**
     * A borda que dissolve. `sides` (padrão) é a horizontal: há mais coluna.
     * `bottom` é para o corpo com teto de altura: as linhas passam por trás do
     * rodapé, que não pinta nada, e se dissolvem ali como a lista do `Command`. Ele
     * substitui a lateral (um gradiente por elemento) e só a ponta de baixo, porque
     * o cabeçalho `sticky` mora no mesmo viewport.
     * Quem publica `--table-panel-foot-h` vira faixa de baixo: o viewport sangra por
     * baixo dela e devolve o mesmo tanto em recuo. O `TablePanelFooter` mora fora da
     * moldura e não publica nada, então a faixa vale zero ali; fora de um
     * `TablePanel` também. O piso é o da casa, 0,06.
     * A zona acima do rodapé é 32px, não os 44 da casa: com a rampa atravessando o
     * rodapé (assenta a 3/4 dele), 32 mais 3/4 de 44 dão ~65px de rampa suave.
     * `none` não dissolve nada, e é o que uma coluna fixa pede: a máscara lateral
     * apagaria a coluna presa na borda, e quem diz "há mais" é a sombra da emenda.
     */
    fade?: TableFade
  }) {
  const tamanhoDoContexto = React.useContext(TableSizeContext)
  const resolvedSize = size ?? tamanhoDoContexto ?? "md"
  const resolvedVariant = variant ?? "plain"
  const framed = resolvedVariant === "outline"
  const fundo = fade === "bottom"

  // `arrows` liga os `data-scroll-more-start`/`-end` no viewport, que a sombra
  // da coluna fixa lê para acender só quando há rolagem para aquele lado.
  const refDoFade = useScrollFade(
    fundo ? { axis: "y", sides: "end", shell: true } : { axis: "x", arrows: true }
  )
  const refDoViewport = React.useCallback(
    (el: HTMLDivElement | null) => {
      const limpar = refDoFade(el)
      viewportRef?.(el)
      return () => {
        limpar?.()
        viewportRef?.(null)
      }
    },
    [refDoFade, viewportRef]
  )

  const nucleo = (
    <div
      ref={refDoViewport}
      data-slot="table-viewport"
      data-fade={fade}
      className={cn(
        "group/table-viewport relative w-full overflow-x-auto",
        "overscroll-x-contain [-webkit-overflow-scrolling:touch]",
        "[scrollbar-gutter:stable]",
        // A dissolução lateral diz que há mais coluna. A barra fica: ela diz onde você
        // está; a dissolução, que continua.
        // Este nó não pode ganhar `bg-`, `border-`, `rounded-` nem `shadow-`: a máscara
        // recorta o alfa do elemento inteiro (cantos apagados, lados opacos). Quem pinta
        // é a `<table>` de dentro; quem emoldura é o nó de fora, só em `variant="outline"`.
        // A distância é `--scroll-fade-x-h` (32), e não os 44 do eixo vertical: uma
        // célula mede ~100px.
        fundo
          ? "pb-(--scroll-fade-foot-h) [scroll-padding-block-end:calc(var(--scroll-fade-foot-h)+var(--scroll-fade-h)+0.25rem)]"
          : fade === "sides" && scrollFadeViewportXClassName,
        viewportClassName
      )}
    >
      <table
        data-slot="table"
        data-variant={resolvedVariant}
        data-size={resolvedSize}
        aria-busy={pending || undefined}
        className={cn(
          tableVariants({ variant: resolvedVariant, size: resolvedSize, dividers, striped }),
          "[&>tbody]:transition-opacity [&>tbody]:duration-(--duration-base) [&>tbody]:ease-(--ease-out)",
          pending && "[&>tbody]:opacity-60",
          className
        )}
        {...props}
      />
    </div>
  )

  // Em `fade="bottom"` a borda de baixo é um véu irmão, e não máscara: o viewport
  // que carrega um cabeçalho de vidro não pode se mascarar. A casca é `relative`
  // para ancorar o véu, recebe as variáveis do hook (`shell`) e sangra por baixo do
  // rodapé do painel. Os cantos de baixo do véu leem `--scroll-fade-veil-r`, que a
  // moldura publica, para nunca pintar por cima do arco da borda.
  const corpo = fundo ? (
    <div
      data-slot="table-fade-shell"
      className="relative -mb-(--scroll-fade-foot-h) [--scroll-fade-h:--spacing(8)] [--scroll-fade-foot-h:var(--table-panel-foot-h,0px)]"
    >
      {nucleo}
      <div aria-hidden data-slot="table-fade-veil" className={scrollFadeVeilClassName} />
    </div>
  ) : (
    nucleo
  )

  return (
    <TableFadeContext.Provider value={fade}>
    <TableFramedContext.Provider value={framed}>
      {framed ? (
        <div
          data-slot="table-frame"
          // `clip-path` além do `overflow-hidden`: o borrão do cabeçalho fixo vira camada
          // própria e, no Chrome acelerado, escapa do recorte arredondado de um
          // `overflow`. O `clip-path` recorta em qualquer motor, no mesmo raio.
          className="w-full min-w-0 overflow-hidden rounded-surface border border-border [clip-path:inset(0_round_var(--radius-surface))] [--scroll-fade-veil-r:calc(var(--radius-surface)_-_1px)]"
        >
          {corpo}
        </div>
      ) : (
        corpo
      )}
    </TableFramedContext.Provider>
    </TableFadeContext.Provider>
  )
}

/**
 * Dois eixos independentes. `variant` é a tinta (`plain` nenhuma, `muted` o
 * tingido, `bg-muted/50`); `labels` é a tipografia do rótulo (ver `TableHead`);
 * `sticky` gruda o cabeçalho no topo do viewport e, como ele rola nos dois eixos,
 * só cola de verdade com um teto (`viewportClassName="max-h-*"` no `Table`).
 * O fio continua morando aqui por decisão: `TableHeader` é uma das três tiras com
 * fio e tinta (com `PageHeader` e `TableFooter`), isentas da regra que os tirou de
 * `CardToolbar`/`CardFooter`/`CardNote`. Tinta e fio vivem em strings separadas
 * do `cn()`, então a regra J do auditor nunca os vê juntos.
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
  // Vidro só onde o viewport não se mascara (ver `TableFadeContext`).
  const fade = React.useContext(TableFadeContext)
  const vidro = sticky && fade === "bottom"
  return (
    <TableHeaderLabelsContext.Provider value={labels}>
      <thead
        data-slot="table-header"
        data-variant={variant ?? "plain"}
        data-labels={labels}
        data-sticky={sticky ? "" : undefined}
        className={cn(
          "[&_tr]:border-b",
          // Versalete é sempre `text-2xs`, qualquer que seja o degrau: a régua desce por
          // variável CSS, herdada pelo `<th>`, porque `uppercase`/`tracking-wider` não são
          // variáveis e descem por contexto React (ver `TableHead`).
          labels === "caps" && "[--table-head-fs:var(--text-2xs)]",
          // Sticky exige tinta opaca ou vidro: a 50% sem borrão, o conteúdo rolando por
          // baixo vazaria nítido através do cabeçalho parado.
          sticky && "sticky top-0 z-(--z-raised)",
          // O divisor gruda junto, e por isso não é borda: com `border-collapse` o fio
          // entre cabeçalho e corpo pertence à grade, e não à célula `sticky`, e subiria
          // com a primeira linha. Aqui é uma sombra interna de 1px em cada `<th>`, parte
          // da célula; a borda da linha sai para não sobrar um segundo fio.
          sticky &&
            "[&_tr]:border-b-0 [&_th]:shadow-[inset_0_-1px_0_var(--color-border)]",
          sticky && variant !== "muted" && "bg-card",
          // Opaco e tingido: `sticky` com `bg-card` perderia o tom `muted` do cabeçalho de
          // um `TablePanel`. A mistura é a composição que o navegador faria de `muted/50`
          // sobre o card, em `srgb` (onde o alfa se compõe; em `oklab` sairia outra cor).
          // Translúcido, o `sticky` deixaria as linhas passarem por baixo.
          sticky &&
            variant === "muted" &&
            "bg-[color-mix(in_srgb,var(--color-muted)_50%,var(--color-card))]",
          // Sob `fade="bottom"` o cabeçalho fixo é vidro, na receita do cabeçalho do
          // catálogo (`barSurfaceClassName`) com a tinta desta superfície. A tinta deixa
          // passar 20% (e não os 40% do catálogo) por contraste: com texto claro cobrindo
          // 35% da área atrás do rótulo, os 12px de `--muted-foreground` caíam a 3,64 no
          // escuro com 50%; com 20%, 5,23 no escuro e 4,72 no claro. A cor é `muted` a
          // 62,5% sobre o card com alfa 80%, que compõe a mistura opaca acima (em repouso
          // nada muda de cor), só sob `supports-backdrop-filter:`. Com `fade="sides"` o
          // viewport se mascara e mataria o borrão: ali o cabeçalho segue opaco.
          vidro && "glass-surface",
          vidro &&
            variant !== "muted" &&
            "supports-backdrop-filter:bg-card/80 reduced-transparency:bg-card",
          vidro &&
            variant === "muted" &&
            "supports-backdrop-filter:bg-[color-mix(in_srgb,color-mix(in_srgb,var(--color-muted)_62.5%,var(--color-card))_80%,transparent)] reduced-transparency:bg-[color-mix(in_srgb,var(--color-muted)_50%,var(--color-card))]",
          !sticky && variant === "muted" && "bg-muted/50",
          // A célula de uma coluna fixa precisa de fundo opaco (passa por cima das outras
          // ao rolar), e o cabeçalho tingido lhe dá o tom já composto.
          variant === "muted" &&
            "[--table-pin-bg:color-mix(in_srgb,var(--color-muted)_50%,var(--color-card))]",
          className
        )}
        {...props}
      />
    </TableHeaderLabelsContext.Provider>
  )
}

/**
 * Sem moldura própria (`plain`), a última linha mantém o fio, senão se
 * dissolveria na página. Com moldura (`outline`), quem fecha embaixo é a borda
 * dela e o fio duplicado sai (lido do `TableFramedContext`).
 */
function TableBody({
  className,
  reveal = false,
  ...props
}: React.ComponentProps<"tbody"> & {
  /**
   * As linhas sobem em cascata (`@utility table-reveal`) quando o corpo monta;
   * quem quer a cascata a cada página troca a `key` do `<tbody>`.
   */
  reveal?: boolean
}) {
  const framed = React.useContext(TableFramedContext)
  return (
    <tbody
      data-slot="table-body"
      className={cn(framed && "[&_tr:last-child]:border-0", reveal && "table-reveal", className)}
      {...props}
    />
  )
}

/**
 * `variant="muted"` (padrão) é a mesma tinta do cabeçalho: fio e tinta nesta tira
 * são decisão registrada. Sem consumidores hoje.
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
 * `interactive` é opt-in: o hover ligado sempre seria promessa falsa em tabela de
 * referência. Sem ele, só o fio e `data-state="selected"` (estado, não resposta
 * ao cursor, por isso sempre ligado).
 * `variant="group"` é a faixa de seção (a linha de mês), com uma célula versalete
 * em `colSpan`. Nunca interativa.
 */
function TableRow({
  className,
  variant,
  interactive,
  state,
  asChild = false,
  onKeyDown,
  ...props
}: React.ComponentProps<"tr"> & {
  variant?: "default" | "group"
  interactive?: boolean
  /**
   * O estado da linha que não é seleção. `current` é "esta é a de agora" (a
   * parcela vigente, a fatura aberta), com `aria-current` e sem fundo (o
   * `bg-muted/50` lia como hover preso ou seleção). `pending` é a linha prevista ou
   * não efetivada, em tinta apagada; a ficha que diz o porquê é de quem chama. A
   * seleção continua `data-state="selected"`, que o `DataTable` escreve.
   */
  state?: "current" | "pending"
  /** A linha vira o seu filho (o `motion.tr` do `DataTable`, que desliza). */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "tr"
  return (
    <Comp
      data-slot="table-row"
      data-variant={variant ?? "default"}
      data-row-state={state}
      aria-current={state === "current" ? "true" : undefined}
      // A linha clicável recebe o teclado: entra na ordem do Tab e abre com Enter (o
      // mesmo clique, disparado no próprio nó). Quem cuida do foco entre as linhas (o
      // `DataTable`) escreve o próprio `tabIndex`.
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e: React.KeyboardEvent<HTMLTableRowElement>) => {
        onKeyDown?.(e)
        if (
          interactive &&
          !e.defaultPrevented &&
          e.key === "Enter" &&
          e.target === e.currentTarget
        ) {
          e.preventDefault()
          e.currentTarget.click()
        }
      }}
      className={cn(
        "border-b border-border transition-colors data-[state=selected]:bg-muted",
        // O fundo de uma célula fixa (`pin`) acompanha o da linha: ela é opaca e passaria
        // por cima do realce, então a linha publica o próprio tom já composto sobre o card.
        "data-[state=selected]:[--table-pin-bg:var(--color-muted)]",
        // A prevista apaga o texto e a cor (ladrilho, avatar e valor em tinta cheia ao
        // lado de texto apagado liam como a linha mais viva); o valor mantém vermelho e
        // verde, só baixa, porque o sinal ainda é informação.
        state === "pending" &&
          "text-muted-foreground [&_[data-slot=avatar]]:opacity-50 [&_[data-slot=color-tile]]:opacity-50 [&_[data-slot=money-display]]:opacity-50",
        interactive &&
          "cursor-pointer hover:bg-muted/30 active:bg-muted/30 focus-visible:inset-ring-3 focus-visible:inset-ring-ring/45 focus-visible:outline-none group/table-row hover:[--table-pin-bg:color-mix(in_srgb,var(--color-muted)_30%,var(--color-card))]",
        variant === "group" &&
          "border-border/80 bg-muted/30 [--table-pin-bg:color-mix(in_srgb,var(--color-muted)_30%,var(--color-card))] [&>td]:h-auto [&>td]:py-1.5 [&>td]:text-2xs [&>td]:font-semibold [&>td]:tracking-wider [&>td]:text-muted-foreground [&>td]:uppercase",
        className
      )}
      {...props}
    />
  )
}

/**
 * O nome da linha: a célula que diz o que a linha é ("Mercado"). Numa linha
 * `interactive` sublinha junto do realce, na régua do rótulo do `Accordion`
 * (`disclosureLabelClassName`): o traço mora no nome e nunca na linha, porque
 * `text-decoration` desce para todo descendente em linha (um valor sublinhado
 * lê como rasura).
 * Só acende sob `interactive`: o `group/table-row` só existe nesse ramo, então
 * numa linha que não responde ao cursor o `group-hover` não tem ancestral. O par
 * `group-active` vem porque `hover:` compila dentro de `@media (hover: hover)`.
 */
const TABLE_PRIMARY_CELL_CLASS =
  "underline-offset-4 decoration-from-font group-hover/table-row:underline group-active/table-row:underline"

/**
 * A coluna fixa: a célula gruda na borda de onde a tabela rola e pinta o fundo
 * da linha (`--table-pin-bg`, que linha, cabeçalho e zebra publicam já
 * compostos, porque a célula é opaca). A sombra da emenda só acende quando há
 * rolagem para aquele lado (o viewport marca `data-scroll-more-start`/`-end`);
 * a cor sai do `--foreground`, então vale nos dois temas.
 */
const TABLE_PIN_CLASS = {
  start:
    "sticky start-0 z-1 bg-(--table-pin-bg,var(--color-card)) transition-shadow duration-(--duration-base) ease-(--ease-out) group-data-[scroll-more-start]/table-viewport:shadow-[inset_-1px_0_0_var(--color-border),10px_0_12px_-10px_color-mix(in_oklab,var(--color-foreground)_22%,transparent)]",
  end: "sticky end-0 z-1 bg-(--table-pin-bg,var(--color-card)) transition-shadow duration-(--duration-base) ease-(--ease-out) group-data-[scroll-more-end]/table-viewport:shadow-[inset_1px_0_0_var(--color-border),-10px_0_12px_-10px_color-mix(in_oklab,var(--color-foreground)_22%,transparent)]",
} as const

export type TablePin = keyof typeof TABLE_PIN_CLASS

const TABLE_NUMERIC_HEAD_CLASS = "text-right"
const TABLE_NUMERIC_CELL_CLASS = "text-right nums whitespace-nowrap"
// Sem o nudge, o checkbox de 16px sai 2px acima do centro vertical da célula
// (`align-middle` não fecha a conta contra um controle inline-flex); escopado à
// coluna de seleção por seletor de descendente.
const TABLE_SELECTION_CLASS =
  "w-10 px-2 md:w-11 md:px-3 [&_[role=checkbox]]:translate-y-0.5"

/**
 * A coluna de ações: a última, o espelho de `selection`.
 * Encolhe até o conteúdo (`w-px` com `whitespace-nowrap`) e alinha à direita,
 * rente à borda do painel. O recuo horizontal é o do degrau (`--table-px`).
 * O recuo vertical sai: o botão (28) é mais alto que a linha de texto (20), e
 * com ele a linha com ações cresceria de 44 para 52; com `py-0` o botão se
 * centra na linha que as outras células definem.
 * A célula monta a fileira (`flex … gap-1`); os botões crescem a 44 em ponteiro
 * grosso, e nada aqui depende de `hover` (esconder ações até o cursor passar não
 * existe no dedo).
 * O cabeçalho não mostra rótulo (os ícones já dizem): o nome fica em `sr-only`,
 * porque um `<th>` vazio é anunciado como coluna sem nome. `children` troca o texto.
 * Cada botão com `aria-label` ganha um tooltip `sm` com o mesmo texto, montado
 * pela célula. O alvo de dedo se ancora em `button`, e não em `data-slot=button`:
 * o `Button` espalha as props depois do `data-slot`, e o `TooltipTrigger asChild`
 * o troca por `tooltip-trigger`.
 */
const TABLE_ACTIONS_HEAD_CLASS = "w-px whitespace-nowrap text-right"
const TABLE_ACTIONS_CELL_CLASS = "w-px py-0 whitespace-nowrap"
const TABLE_ACTIONS_ROW_CLASS =
  "flex items-center justify-end gap-1 [&>button]:pointer-coarse:size-11"

/**
 * `numeric` alinha à direita e liga `.nums` (senão a coluna dança a cada dígito;
 * régua do [Money Display](/designsystem/money-display)). `selection` reserva a
 * coluna do checkbox e soma o nudge que centra o `Checkbox` (`size-4`).
 * `sort`/`onSort` trocam o rótulo por um botão com a seta; o `aria-sort` vai no
 * próprio `<th>`, não no botão. `actions` é a última coluna (`TABLE_ACTIONS_HEAD_CLASS`).
 */
function TableHead({
  className,
  numeric,
  selection,
  actions,
  pin,
  sort,
  sortIndex,
  onSort,
  children,
  ...props
}: React.ComponentProps<"th"> & {
  numeric?: boolean
  selection?: boolean
  actions?: boolean
  /** Gruda a coluna na borda ao rolar de lado. Ver `TABLE_PIN_CLASS`. */
  pin?: TablePin
  sort?: "asc" | "desc" | "none"
  /**
   * A posição desta coluna numa ordenação por várias (1, 2…), ao lado da seta.
   * Só aparece com duas ou mais colunas ordenadas.
   */
  sortIndex?: number
  /** Recebe o clique: o `DataTable` lê o Shift dele para somar a coluna. */
  onSort?: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
  const labels = React.useContext(TableHeaderLabelsContext)

  return (
    <th
      data-slot="table-head"
      // `aria-sort` só na coluna ordenada, como pede o padrão de tabela ordenável do
      // W3C APG: "none" em toda coluna que pode ordenar faria o leitor de tela anunciar
      // "não ordenada" em cada cabeçalho.
      aria-sort={
        onSort && sort === "asc" ? "ascending" : onSort && sort === "desc" ? "descending" : undefined
      }
      className={cn(
        "h-(--table-head-h) px-(--table-px) text-left align-middle text-(length:--table-head-fs) text-muted-foreground",
        // A costura de coluna do `Resizable` é absoluta na borda da célula, e a célula
        // só se posiciona quando ela está dentro (nenhuma outra tabela muda; o `sticky`
        // do cabeçalho é do `thead`). Sem `truncate`: o `overflow: hidden` cortaria a
        // metade da costura que passa da borda.
        "has-[>[data-slot=resizable-column-handle]]:relative",
        labels === "caps" ? "font-semibold tracking-wider uppercase" : "font-medium",
        numeric && TABLE_NUMERIC_HEAD_CLASS,
        selection && TABLE_SELECTION_CLASS,
        actions && TABLE_ACTIONS_HEAD_CLASS,
        pin && TABLE_PIN_CLASS[pin],
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
          {/*
             A seta gira, e não troca: de crescente para decrescente é a mesma seta virando
             na mola, como o marcador do `Accordion`. Sem ordenação é o par apagado, que
             diz "dá para ordenar" sem afirmar um sentido.
          */}
          {sort === "asc" || sort === "desc" ? (
            <ChevronUpIcon
              aria-hidden
              className={cn(
                "transition-[rotate] duration-(--duration-spring) ease-(--ease-spring)",
                sort === "desc" && "rotate-180"
              )}
            />
          ) : (
            <ChevronUpDownIcon aria-hidden className="text-muted-foreground/60" />
          )}
          {sortIndex ? (
            <span className="-ms-0.5 text-2xs nums text-muted-foreground">
              {sortIndex}
            </span>
          ) : null}
        </Button>
      ) : actions ? (
        <span className="sr-only">{children ?? "Ações"}</span>
      ) : (
        children
      )}
    </th>
  )
}

/**
 * O realce dos botões de ação, que a célula acrescenta a cada um. O botão pousa
 * sobre a linha já acesa (`bg-muted/30`), e o hover do `tertiary` dava 1,06
 * contra ela (invisível); `bg-current/10` dá 1,32 no escuro e 1,25 no claro (o
 * degrau do `AlertAction`), e foi descido por decisão do dono: o realce não pode
 * disputar com a linha acesa em volta.
 * Entra por `className`, para o `twMerge` remover o `hover:bg-muted` e o
 * `dark:hover:bg-muted/50` do `tertiary` em vez de disputar com eles. O par
 * `dark:` é obrigatório: `.x:hover:is(.dark *)` pesa (0,3,0) e venceria um
 * `hover:` sozinho no escuro.
 */
const TABLE_ACTION_HOVER_CLASS =
  "hover:bg-current/10 active:bg-current/10 dark:hover:bg-current/10 dark:active:bg-current/10"

/**
 * A ação destrutiva da coluna: neutra em repouso, o botão `destructive` no
 * cursor e no toque. Quem escreve `variant="destructive"` declara a intenção, e
 * a célula a troca por `tertiary` com este realce: uma lixeira vermelha em toda
 * linha, ao lado de valores de saída em vermelho, é a mistura que a invariante 3
 * proíbe; o vermelho chega na hora da decisão.
 * O realce é a superfície de repouso do próprio `Button destructive`
 * (`bg-destructive/10`, `/20` no escuro, tinta `destructive-muted-foreground`). O
 * par `dark:` pela razão de sempre.
 */
const TABLE_ACTION_DESTRUCTIVE_CLASS =
  "hover:bg-destructive/10 hover:text-destructive-muted-foreground active:bg-destructive/10 active:text-destructive-muted-foreground dark:hover:bg-destructive/20 dark:active:bg-destructive/20"

/**
 * Os filhos da coluna de ações, com os fragmentos abertos: quem escreve as ações
 * num helper devolve `<>…</>`, e o `Children.map` veria um filho só, sem
 * `aria-label`, e nenhum botão ganharia tooltip.
 */
function acoesAbertas(nos: React.ReactNode): React.ReactNode[] {
  return React.Children.toArray(nos).flatMap((no) =>
    React.isValidElement<{ children?: React.ReactNode }>(no) &&
    no.type === React.Fragment
      ? acoesAbertas(no.props.children)
      : [no]
  )
}

function TableCell({
  className,
  numeric,
  selection,
  actions,
  pin,
  primary,
  children,
  ...props
}: React.ComponentProps<"td"> & {
  numeric?: boolean
  selection?: boolean
  actions?: boolean
  /** Gruda a coluna na borda ao rolar de lado. Ver `TABLE_PIN_CLASS`. */
  pin?: TablePin
  /** O nome da linha: sublinha quando a linha `interactive` recebe o cursor. */
  primary?: boolean
}) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-(--table-px) py-(--table-py) align-middle",
        numeric && TABLE_NUMERIC_CELL_CLASS,
        selection && TABLE_SELECTION_CLASS,
        actions && TABLE_ACTIONS_CELL_CLASS,
        pin && TABLE_PIN_CLASS[pin],
        primary && TABLE_PRIMARY_CELL_CLASS,
        className
      )}
      {...props}
    >
      {actions ? (
        <div data-slot="table-actions" className={TABLE_ACTIONS_ROW_CLASS}>
          {acoesAbertas(children).map((no, i) => {
            if (
              !React.isValidElement<{
                "aria-label"?: unknown
                className?: string
                variant?: unknown
              }>(no)
            ) {
              return <React.Fragment key={i}>{no}</React.Fragment>
            }
            const destrutiva = no.props.variant === "destructive"
            const acao = React.cloneElement(no, {
              ...(destrutiva ? { variant: "tertiary" } : {}),
              className: cn(destrutiva ? TABLE_ACTION_DESTRUCTIVE_CLASS : TABLE_ACTION_HOVER_CLASS, no.props.className),
            })
            const rotulo = no.props["aria-label"]
            if (typeof rotulo !== "string") {
              return <React.Fragment key={i}>{acao}</React.Fragment>
            }
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>{acao}</TooltipTrigger>
                <TooltipContent size="sm">{rotulo}</TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      ) : (
        children
      )}
    </td>
  )
}

/**
 * A linha "sem resultados". Aceita texto simples (vira `Muted`) ou um
 * `EmptyState variant="plain"` inteiro para o caso que precisa de ícone e ação.
 */
function TableEmpty({
  colSpan,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"td">, "colSpan"> & { colSpan: number }) {
  return (
    <TableRow>
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

/**
 * A seta de abrir e fechar uma linha (o detalhe embaixo dela ou as sublinhas).
 * Gira 90° na mola, como o marcador do `Accordion`, e leva `aria-expanded` e
 * `aria-controls`. O nome diz o objeto: "Expandir Mercado", nunca só "Expandir".
 */
function TableExpandButton({
  expanded,
  label,
  className,
  onClick,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children"> & {
  expanded: boolean
  /** O nome da linha, para o rótulo acessível. */
  label: string
}) {
  return (
    <Button
      type="button"
      variant="tertiary"
      size="icon-xs"
      data-slot="table-expand-button"
      aria-expanded={expanded}
      aria-label={`${expanded ? "Recolher" : "Expandir"} ${label}`}
      className={cn(
        "-my-1",
        // Ghost também aberto: o `tertiary` deixa o realce aceso com `aria-expanded`
        // (menu aberto de um gatilho), mas aqui aberto é só a seta girada, e o fundo
        // aceso leria como botão pressionado. A cor volta só no cursor e no toque.
        "aria-expanded:[--button-hover:0] aria-expanded:hover:[--button-hover:1] aria-expanded:active:[--button-hover:1]",
        className
      )}
      onClick={(e) => {
        // A linha costuma ser clicável (abre a folha): a seta não é ela.
        e.stopPropagation()
        onClick?.(e)
      }}
      {...props}
    >
      <ChevronRightIcon
        aria-hidden
        className={cn(
          "transition-[rotate] duration-(--duration-spring) ease-(--ease-spring)",
          expanded && "rotate-90"
        )}
      />
    </Button>
  )
}

/**
 * O detalhe sob uma linha: uma linha de largura total que abre na mola da
 * divulgação (a altura vai de `0fr` a `1fr` numa grade, que anima sem medir) e
 * fecha na curva, porque uma mola até zero passaria por baixo de zero. Os filhos
 * sobem em cascata (`disclosure-reveal`).
 * Fechado, continua montada (com `inert`) para a curva de fechar ter o que
 * encolher; quem chama decide se a monta antes da primeira abertura. A linha de
 * cima perde o fio enquanto ela está aberta (`data-expanded`), para os dois
 * lerem como um bloco só.
 */
function TableRowDetail({
  open,
  colSpan,
  lead = 0,
  depth = 0,
  id,
  className,
  children,
}: {
  open: boolean
  colSpan: number
  /**
   * As colunas de utilidade antes do conteúdo (a caixa, a seta). O detalhe começa
   * onde o conteúdo da linha começa, e não na borda da tabela: uma célula vazia ocupa essas colunas.
   */
  lead?: number
  /** A profundidade da sublinha: o detalhe recua junto com o nome dela. */
  depth?: number
  /** O alvo do `aria-controls` da seta. */
  id?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <tr
      data-slot="table-row-detail"
      data-state={open ? "open" : "closed"}
      className={cn("border-border", open ? "border-b" : "border-b-0")}
    >
      {lead > 0 ? <td colSpan={lead} aria-hidden className="p-0" /> : null}
      <td
        colSpan={colSpan - lead}
        className="p-0"
        style={depth > 0 ? ({ "--table-depth": depth } as React.CSSProperties) : undefined}
      >
        <div
          id={id}
          inert={!open}
          className={cn(
            "grid transition-[grid-template-rows]",
            open
              ? "grid-rows-[1fr] duration-(--duration-spring) ease-(--ease-spring) starting:grid-rows-[0fr]"
              : "grid-rows-[0fr] duration-(--duration-base) ease-(--ease-out)"
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              data-state={open ? "open" : "closed"}
              className={cn(
                "px-(--table-px) pb-(--table-py)",
                depth > 0 && "ps-[calc(var(--table-px)+var(--table-depth)*1.5rem)]",
                open && "disclosure-reveal",
                className
              )}
            >
              {children}
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

/**
 * A faixa de grupo inteira: o nome, o total alinhado à coluna de valor, a caixa
 * que marca os membros e a seta que o recolhe. É o `TableRow variant="group"`
 * com as peças que as telas escreviam à mão.
 * A conta das colunas é de quem chama, porque a tabela não sabe qual é o valor:
 * `colSpan` é o total de colunas, e `trailing` quantas vêm depois da coluna do
 * total (a de ações, tipicamente 1).
 */
function TableGroupRow({
  label,
  total,
  colSpan,
  trailing = 0,
  selection,
  collapsible,
  open = true,
  onOpenChange,
  className,
  ...props
}: Omit<React.ComponentProps<"tr">, "children"> & {
  label: React.ReactNode
  /** O total do grupo, já formatado — um `MoneyDisplay`, tipicamente. */
  total?: React.ReactNode
  colSpan: number
  trailing?: number
  /** A caixa que marca o grupo; `checked` aceita `"indeterminate"`. */
  selection?: {
    checked: boolean | "indeterminate"
    onCheckedChange: (checked: boolean) => void
    label: string
    disabled?: boolean
  }
  collapsible?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const ocupadas = (selection ? 1 : 0) + (total !== undefined ? 1 + trailing : 0)
  const rotulo = typeof label === "string" ? label : "grupo"
  return (
    <TableRow
      variant="group"
      data-slot="table-group-row"
      data-state={collapsible ? (open ? "open" : "closed") : undefined}
      className={className}
      {...props}
    >
      {selection ? (
        <TableCell selection>
          <Checkbox
            checked={selection.checked}
            onCheckedChange={(v) => selection.onCheckedChange(v === true)}
            disabled={selection.disabled}
            aria-label={selection.label}
          />
        </TableCell>
      ) : null}
      <TableCell colSpan={Math.max(1, colSpan - ocupadas)}>
        <span className="inline-flex items-center gap-1">
          {collapsible ? (
            <TableExpandButton
              expanded={open}
              label={rotulo}
              className="-ms-1 normal-case"
              onClick={() => onOpenChange?.(!open)}
            />
          ) : null}
          {label}
        </span>
      </TableCell>
      {total !== undefined ? (
        <>
          <TableCell numeric className="normal-case tracking-normal font-medium text-xs">
            {total}
          </TableCell>
          {trailing > 0 ? <TableCell colSpan={trailing} /> : null}
        </>
      ) : null}
    </TableRow>
  )
}

/**
 * A falha ao buscar as linhas: uma linha de largura total com o "Tentar de
 * novo" (a seta que dá meia-volta no cursor). `role="alert"`, para quem não vê
 * saber que a lista não veio. Fala como o `ChartError`: o `EmptyState` sem
 * moldura, com o poço do ícone no tom de erro, o título (o que aconteceu) e a
 * descrição (o porquê). Um `onRetry` que devolve `Promise` troca a seta pela roda
 * e trava até ela assentar.
 */
function TableError({
  colSpan,
  title = "Não foi possível carregar",
  children = "Verifique a conexão e tente de novo.",
  onRetry,
}: {
  colSpan: number
  title?: React.ReactNode
  /** O porquê, na descrição. */
  children?: React.ReactNode
  onRetry?: () => void | Promise<unknown>
}) {
  const [tentando, setTentando] = React.useState(false)
  const tentar = async () => {
    const resultado = onRetry?.()
    if (!resultado || typeof (resultado as Promise<unknown>).then !== "function") return
    setTentando(true)
    try {
      await resultado
    } finally {
      setTentando(false)
    }
  }
  return (
    <TableRow data-slot="table-error">
      <TableCell colSpan={colSpan} className="p-0">
        <EmptyState variant="plain" size="sm" role="alert" className="py-10">
          <EmptyStateIcon tone="destructive">
            <ExclamationTriangleIcon aria-hidden />
          </EmptyStateIcon>
          <EmptyStateTitle>{title}</EmptyStateTitle>
          <EmptyStateDescription>{children}</EmptyStateDescription>
          {onRetry ? (
            <EmptyStateActions>
              <Button
                type="button"
                variant="secondary"
                iconMotion="spin"
                disabled={tentando}
                aria-busy={tentando || undefined}
                onClick={tentar}
              >
                {tentando ? <Spinner /> : <ArrowPathIcon aria-hidden />}
                {tentando ? "tentando…" : "tentar de novo"}
              </Button>
            </EmptyStateActions>
          ) : null}
        </EmptyState>
      </TableCell>
    </TableRow>
  )
}

type TableSkeletonColumn = {
  /** O rótulo real do cabeçalho — à vista enquanto as linhas não chegam. */
  label?: string
  numeric?: boolean
  selection?: boolean
  actions?: boolean
  /** A largura do osso dentro da célula; o padrão varia por linha. */
  width?: string
  /** Classe da célula — `hidden md:table-cell`, para casar com a tabela real. */
  className?: string
}

/**
 * A tabela que espera: o cabeçalho de verdade e `rows` linhas de ossos na altura
 * do degrau, dentro do `SkeletonGroup` (`role="status"`, rótulo lido, só depois
 * de 300ms). As larguras variam por linha para a coluna não ler como uma régua;
 * a linha cresce com a densidade sozinha.
 */
function TableSkeleton({
  columns,
  rows = 5,
  header = true,
  label,
  delay = true,
  headerVariant = "muted",
  headerLabels = "text",
  group = true,
  ...props
}: Omit<React.ComponentProps<typeof Table>, "children"> & {
  columns: number | TableSkeletonColumn[]
  rows?: number
  header?: boolean
  label?: string
  delay?: boolean | number
  headerVariant?: "plain" | "muted"
  /** O rótulo do cabeçalho real — `caps` nas mini-tabelas de folha. */
  headerLabels?: TableHeaderLabels
  /**
   * `false` quando a página inteira já espera num `SkeletonGroup`: dois
   * `role="status"` aninhados fazem o leitor de tela anunciar duas vezes.
   */
  group?: boolean
}) {
  const colunas: TableSkeletonColumn[] =
    typeof columns === "number" ? Array.from({ length: columns }, () => ({})) : columns
  const larguras = ["72%", "56%", "64%", "48%", "60%"]
  const tabela = (
      <Table data-slot={group ? undefined : "table-skeleton"} {...props}>
        {header ? (
          <TableHeader variant={headerVariant} labels={headerLabels}>
            <TableRow>
              {colunas.map((c, i) => (
                <TableHead
                  key={i}
                  numeric={c.numeric}
                  selection={c.selection}
                  actions={c.actions}
                  className={c.className}
                >
                  {c.selection ? <Skeleton className="size-4 rounded-sm" /> : c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        ) : null}
        <TableBody aria-hidden>
          {Array.from({ length: rows }, (_, r) => (
            <TableRow key={r}>
              {colunas.map((c, i) => (
                <TableCell
                  key={i}
                  numeric={c.numeric}
                  selection={c.selection}
                  actions={c.actions}
                  className={c.className}
                >
                  {c.selection ? (
                    <Skeleton className="size-4 rounded-sm" />
                  ) : c.actions ? (
                    <Skeleton className="ms-auto size-7 rounded-full" />
                  ) : (
                    <Skeleton
                      shape="text"
                      className={cn(c.numeric && "ms-auto")}
                      style={{ width: c.width ?? (c.numeric ? "4.5rem" : larguras[(r + i) % larguras.length]) }}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
  )
  return group ? (
    <SkeletonGroup data-slot="table-skeleton" label={label} delay={delay}>
      {tabela}
    </SkeletonGroup>
  ) : (
    tabela
  )
}

/**
 * A célula de identidade: o ladrilho ou o avatar, o nome e a legenda ("Mercado"
 * sobre "Alimentação · Nubank"). Nome sobre legenda é par de identidade: sem
 * `gap`, quem separa é a entrelinha. Os dois truncam, para a coluna não empurrar
 * o valor. Mora dentro de um `TableCell` (é o conteúdo), para a célula continuar
 * dona do recuo, do `primary` e do `pin`.
 */
function TableCellIdentity({
  media,
  title,
  description,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  media?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
}) {
  return (
    <div
      data-slot="table-cell-identity"
      className={cn("flex min-w-0 items-center gap-3", className)}
      {...props}
    >
      {media}
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{title}</span>
        {description ? (
          <span className="truncate text-xs text-muted-foreground">{description}</span>
        ) : null}
      </div>
    </div>
  )
}

/**
 * O valor em dinheiro da linha: `MoneyDisplay signed` com o tom do sinal
 * (entrada em `income`, saída em `expense`, zero neutro); lista mista pede o
 * sinal, para quem não distingue verde de vermelho.
 * `flash` acende o valor quando ele muda (`@utility table-flash`: 500ms parado,
 * 1s esmaecendo): o saldo recalculado depois de editar uma linha. A primeira
 * pintura não acende. A contagem de trocas é estado, no padrão "ajustar ao mudar
 * a prop", e é a chave que reaciona a animação.
 */
function TableCellMoney({
  value,
  flash = false,
  signed = true,
  tone = "sign",
  className,
  ...props
}: Omit<React.ComponentProps<typeof MoneyDisplay>, "value" | "tone"> & {
  value: number | null | undefined
  flash?: boolean
  /**
   * `sign` pinta pelo sinal (entrou, saiu); `none` deixa neutro (o saldo, que não
   * é dinheiro entrando nem saindo).
   */
  tone?: "sign" | "none"
}) {
  const [anterior, setAnterior] = React.useState(value)
  const [trocas, setTrocas] = React.useState(0)
  if (anterior !== value) {
    setAnterior(value)
    setTrocas((n) => n + 1)
  }
  const tom =
    tone === "none" || value == null || value === 0 ? undefined : value < 0 ? "expense" : "income"
  return (
    <span
      key={flash ? trocas : undefined}
      data-slot="table-cell-money"
      className={cn(
        "-mx-1 rounded-sm px-1",
        flash && trocas > 0 && "table-flash",
        className
      )}
    >
      <MoneyDisplay value={value} signed={signed} tone={tom} {...props} />
    </span>
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
  TableCellIdentity,
  TableCellMoney,
  TableEmpty,
  TableError,
  TableExpandButton,
  TableFooter,
  TableGroupRow,
  TableHead,
  TableHeader,
  TableRow,
  TableRowDetail,
  TableSizeContext,
  TableSkeleton,
  tableVariants,
}
export type { TableSkeletonColumn }
