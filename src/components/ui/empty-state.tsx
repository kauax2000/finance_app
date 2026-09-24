"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { H1, H4, Muted } from "@/components/ui/typography"

/**
 * O que a tela diz quando não há nada nela.
 *
 * ## O respiro é do pai, e não dos filhos
 *
 * As quatro peças carregavam `mb-4`, `mb-2` e `mb-6`, e o contêiner ficava em
 * `gap: normal` — medido. O layout era decidido de baixo para cima: tirar a
 * descrição mudava sozinho o respiro entre o ícone e o título, e a última peça
 * da pilha deixava 24px de margem contra a borda de baixo do bloco. Agora o
 * `gap` é do `EmptyState`, e nenhum filho declara margem.
 *
 * ## `variant` existe porque duas telas já a escreviam
 *
 * `not-found-shell.tsx` e `route-error-fallback.tsx` abrem **com a mesma
 * string**: `className="w-full border-border/80 bg-card/40 py-10"`. Duas cópias
 * idênticas de uma sobrescrita são uma variante faltando — e o
 * `border-border/80` era ainda um quarto peso de borda no app.
 *
 * ## A forma diz a situação (rodada 131)
 *
 * Os 27 estados vazios do app eram o mesmo círculo cinza, servissem ao
 * primeiro uso, a um filtro sem resultado, a um erro ou a um período vazio.
 * Agora cada situação tem uma forma. O arco-íris da marca fica só no
 * numeral das páginas de erro — quatro versões dele no primeiro uso (atrás
 * dos fantasmas e no contorno deles) foram recusadas na tela:
 *
 * | Situação | Forma |
 * | --- | --- |
 * | primeiro uso | `EmptyStateGhost` |
 * | filtro, período ou lista vazia | `EmptyStateIcon variant="stack"` |
 * | não encontrado | `size="page"` + `EmptyStateCode` ("404") |
 * | erro de runtime | `size="page"` + `EmptyStateCode` ("Ops!") |
 *
 * As referências são o `empty-state-04` do shadcnui-blocks (os fantasmas), o
 * `empty-state` do serafimcloud (o leque) e o `not-found-2` da Efferd (o
 * numeral que dissolve).
 *
 * ## O título não é um `<h2>` cravado
 *
 * Ele era, e isso põe um `h2` na página toda vez que um bloco vazio aparece —
 * inclusive dentro de uma seção que já tem o seu, que é o caso de duas das
 * quatro telas. O padrão passa a ser um `<p>` estilizado, e quem precisa de
 * cabeçalho de verdade usa `asChild` com o nível certo.
 */
const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      variant: {
        dashed: "rounded-xl border border-dashed border-border bg-muted/20",
        card: "rounded-xl border border-border bg-card/40",
        // Sem moldura, para dentro de um `Card` ou de uma célula de tabela que
        // já tem a sua. Cartão dentro de cartão é sempre errado.
        plain: "",
      },
      size: {
        sm: "gap-2 px-4 py-6 [--empty-state-icon:--spacing(9)]",
        md: "gap-3 px-6 py-10 [--empty-state-icon:--spacing(12)]",
        lg: "gap-4 px-6 py-16 [--empty-state-icon:--spacing(14)]",
        // A página de erro, que ocupa a tela como nas referências.
        page: "gap-4 px-6 py-24 [--empty-state-icon:--spacing(14)]",
      },
    },
    defaultVariants: {
      variant: "dashed",
      size: "md",
    },
  }
)

type EmptyStateSize = NonNullable<VariantProps<typeof emptyStateVariants>["size"]>

/** O degrau desce por contexto: o título de `page` é outro átomo, não outra classe. */
const EmptyStateSizeContext = React.createContext<EmptyStateSize>("md")

function EmptyState({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyStateVariants>) {
  return (
    <EmptyStateSizeContext.Provider value={size ?? "md"}>
      <div
        data-slot="empty-state"
        data-variant={variant ?? "dashed"}
        data-size={size ?? "md"}
        className={cn(
          "group/empty-state",
          emptyStateVariants({ variant, size }),
          className
        )}
        {...props}
      />
    </EmptyStateSizeContext.Provider>
  )
}

const emptyStateIconVariants = cva(
  "flex shrink-0 items-center justify-center [&_svg]:size-[calc(var(--empty-state-icon)/2)]",
  {
    variants: {
      variant: {
        circle: "size-(--empty-state-icon) rounded-full",
        // O leque não pinta a própria caixa: quem tem superfície são os
        // ladrilhos. O `tone` fica só na tinta dos ícones.
        stack: "h-(--empty-state-icon)",
      },
      // `route-error-fallback.tsx` pintava `bg-destructive-muted
      // text-destructive-muted-foreground` à mão. Um estado de erro é um estado
      // vazio de outra natureza, e a cor é do sistema.
      tone: {
        default: "text-muted-foreground",
        info: "text-info-muted-foreground",
        success: "text-success-muted-foreground",
        warning: "text-warning-muted-foreground",
        destructive: "text-destructive-muted-foreground",
      },
    },
    // A superfície tonal é só do círculo; no leque, quem tem superfície são
    // os ladrilhos, e o tom fica na tinta.
    compoundVariants: [
      { variant: "circle", tone: "default", className: "bg-muted" },
      { variant: "circle", tone: "info", className: "bg-info-muted" },
      { variant: "circle", tone: "success", className: "bg-success-muted" },
      { variant: "circle", tone: "warning", className: "bg-warning-muted" },
      { variant: "circle", tone: "destructive", className: "bg-destructive-muted" },
    ],
    defaultVariants: {
      variant: "circle",
      tone: "default",
    },
  }
)

/**
 * Os três ladrilhos do leque (a referência é o `empty-state` do
 * serafimcloud): o do meio levantado, os laterais inclinados por baixo dele.
 * Sob o cursor — ou no toque, pelo par `active:` — eles se afastam na mola da
 * casa (`--ease-spring`). Escrito por posição, porque o leque tem três lugares
 * e cada um se move para o seu lado.
 */
const TILE_POSICAO = [
  "-me-3 -rotate-8 translate-y-1 group-hover/empty-state:-rotate-14 group-hover/empty-state:-translate-x-2 group-active/empty-state:-rotate-14 group-active/empty-state:-translate-x-2",
  "z-10 group-hover/empty-state:-translate-y-1.5 group-active/empty-state:-translate-y-1.5",
  "-ms-3 rotate-8 translate-y-1 group-hover/empty-state:rotate-14 group-hover/empty-state:translate-x-2 group-active/empty-state:rotate-14 group-active/empty-state:translate-x-2",
] as const

function EmptyStateIcon({
  className,
  variant,
  tone,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof emptyStateIconVariants>) {
  const leque = variant === "stack"
  return (
    <div
      data-slot="empty-state-icon"
      data-variant={variant ?? "circle"}
      data-tone={tone ?? "default"}
      className={cn(emptyStateIconVariants({ variant, tone }), className)}
      {...props}
    >
      {leque
        ? React.Children.toArray(children)
            .slice(0, 3)
            .map((filho, i) => (
              <span
                key={i}
                data-slot="empty-state-icon-tile"
                className={cn(
                  "flex size-(--empty-state-icon) items-center justify-center rounded-xl border border-border bg-card shadow-sm",
                  "transition-[rotate,translate] duration-(--duration-spring) ease-(--ease-spring)",
                  TILE_POSICAO[i]
                )}
              >
                {filho}
              </span>
            ))
        : children}
    </div>
  )
}

/**
 * O título.
 *
 * `asChild` é a saída para quando ele precisa **ser** um cabeçalho — uma página
 * 404 inteira quer um `<h1>`; um bloco vazio no meio de uma lista não quer
 * nível nenhum. O padrão é o segundo caso, que é o comum.
 */
function EmptyStateTitle({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"p"> & { asChild?: boolean }) {
  const size = React.useContext(EmptyStateSizeContext)
  // Na página de erro o título é o da tela: o `H1` do sistema, na serifa de
  // `.page-title`, dois degraus acima — o "Page not found" das referências. E
  // ele **nasce `<h1>`**, sem `asChild`, por uma razão medida: um server
  // component (o `not-found-shell`) que passava `<h1>` por `asChild` o
  // entregava ao `Slot` do Radix como referência preguiçosa do RSC, e não
  // como elemento — o `Slot` não o reconhecia e o título sumia da página sem
  // erro nenhum. `asChild` continua valendo para quem precisa de outro nível.
  if (size === "page") {
    const PageComp = asChild ? Slot.Root : "h1"
    return (
      <H1 asChild data-slot="empty-state-title" className={cn("text-4xl sm:text-5xl", className)}>
        <PageComp {...props} />
      </H1>
    )
  }
  const Comp = asChild ? Slot.Root : "p"
  // O estilo é o do `H4` — família, peso, tracking — um degrau abaixo no corpo.
  // O elemento continua sendo o `<p>` (ou o que `asChild` trouxer): o átomo dá
  // o estilo e o filho dá o nível, e a sobrescrita fica no átomo.
  return (
    <H4 asChild data-slot="empty-state-title" className={cn("text-base text-balance", className)}>
      <Comp {...props} />
    </H4>
  )
}

function EmptyStateDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <Muted
      data-slot="empty-state-description"
      className={cn("max-w-sm text-pretty", className)}
      {...props}
    />
  )
}

/**
 * As ações.
 *
 * Ela ganha uma folga a mais que o `gap` do bloco: um botão logo abaixo de um
 * parágrafo lê como parte do parágrafo. É a mesma razão de 2 para 1 que separa
 * "outro assunto" de "mesmo assunto" no `HoverCardBody`.
 */
function EmptyStateActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-state-actions"
      className={cn(
        "mt-1 flex flex-wrap items-center justify-center gap-2",
        className
      )}
      {...props}
    />
  )
}

/**
 * Os fantasmas (a referência é o `empty-state-04` do shadcnui-blocks): linhas
 * da lista que ainda não existe, subindo devagar atrás do título e
 * dissolvendo nas bordas. Mostram o que vai aparecer ali — o primeiro uso é um
 * convite, não uma ausência.
 *
 * As props são de **forma**, e não de domínio: "transação" é conteúdo de
 * tela, "ladrilho e valor" é desenho. A tela de transações pede
 * `leading="tile" trailing="amount"`; a de cartões, `leading="card"`.
 *
 * **O laço não tem emenda porque as linhas são duplicadas e o respiro é
 * margem, não `gap`**: com `gap`, metade da altura cairia no meio de um vão e
 * o laço saltaria meio respiro a cada volta. O movimento reduzido o congela no
 * quadro 0 pelo bloco global.
 */
const GHOST_LEADING = {
  tile: "size-7 rounded-md",
  card: "h-5 w-8 rounded-sm",
  avatar: "size-7 rounded-full",
} as const

const GHOST_TRAILING = {
  amount: "h-2 w-12 rounded-full bg-muted",
  date: "h-5 w-11 rounded-md bg-muted/70",
  none: "hidden",
} as const

/** A largura do nome muda de linha a linha, senão a lista lê como carimbo. */
const GHOST_LARGURA = ["w-3/5", "w-2/5", "w-4/5", "w-1/2", "w-2/3", "w-1/3"] as const

function EmptyStateGhost({
  className,
  leading = "tile",
  trailing = "amount",
  ...props
}: React.ComponentProps<"div"> & {
  leading?: keyof typeof GHOST_LEADING
  trailing?: keyof typeof GHOST_TRAILING
}) {
  const linhas = [...GHOST_LARGURA, ...GHOST_LARGURA]
  return (
    <div
      data-slot="empty-state-ghost"
      aria-hidden
      className={cn(
        "relative h-40 w-full max-w-xs overflow-hidden",
        "[mask-image:linear-gradient(to_bottom,transparent,#000_30%,#000_70%,transparent)]",
        className
      )}
      {...props}
    >
      <div className="empty-state-drift">
        {linhas.map((largura, i) => (
          <div
            key={i}
            className="mb-2 flex h-11 items-center gap-3 rounded-lg border border-border bg-card/70 px-3"
          >
            <span className={cn("shrink-0 bg-muted", GHOST_LEADING[leading])} />
            <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
              <span className={cn("h-2 rounded-full bg-muted", largura)} />
              <span className="h-1.5 w-1/4 rounded-full bg-muted/60" />
            </span>
            <span className={cn("shrink-0", GHOST_TRAILING[trailing])} />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * O numeral — ou a palavra — da página de erro ("404", "Ops!"), sempre
 * `aria-hidden`: quem diz o que houve é o título.
 *
 * É o `not-found-2` da Efferd: enorme, na Ledger, com o arco-íris
 * **preenchendo o glifo** (o precedente do wordmark) e dissolvendo para baixo
 * até o título pousar na base — o arco-íris nunca fica sob o texto. O
 * preenchimento desliza de ida e volta, porque o `--brand-rainbow` é linear e
 * um laço só de ida emendaria a lima no teal.
 *
 * Houve uma segunda forma, `watermark` (a palavra gigante a 10% atrás do
 * título, do `not-found` do nevsky118), e ela saiu: o dono quis o erro de
 * runtime igual ao 404, com o "Ops!" acima do texto.
 */
const EMPTY_STATE_CODE = [
  "pointer-events-none select-none font-display leading-none",
  "brand-rainbow-image bg-(image:--brand-rainbow) bg-clip-text text-transparent",
  "-mb-8 text-8xl sm:-mb-12 sm:text-9xl",
  "empty-state-sheen",
  "[mask-image:linear-gradient(to_bottom,#000_30%,transparent_85%)]",
].join(" ")

function EmptyStateCode({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="empty-state-code"
      aria-hidden
      className={cn(EMPTY_STATE_CODE, className)}
      {...props}
    />
  )
}

export {
  EmptyState,
  EmptyStateCode,
  EmptyStateGhost,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
  emptyStateVariants,
}
