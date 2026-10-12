"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { composeRefs } from "radix-ui/internal"
import { useBrandGlow } from "@/hooks/use-brand-glow"
import { Muted } from "@/components/ui/typography"
import { Skeleton, SkeletonText } from "@/components/ui/skeleton"

/**
 * O casco do cartão, com dois eixos independentes: `variant` decide a borda e a
 * superfície, `padding` o ritmo interno (`none` é o painel, que sangra de borda
 * a borda). Peças: `CardField` (ladrilho rótulo/valor), `CardHeader media`,
 * `CardLink` (link esticado), `CardTitle size`, `inactive`, `selected`,
 * `orientation`, `CardMessage` e `CardSkeleton`.
 */
const cardVariants = cva(
  [
    "group/card relative flex min-w-0 flex-col overflow-hidden rounded-surface text-sm [--radius-parent:var(--radius-surface)] [--radius-inset:var(--card-px)]",
    // O `overflow-hidden` já recorta os cantos de todo filho, então cabeçalho e
    // rodapé não levam raio próprio. Uma tira sangra até a borda: o casco
    // recolhe o próprio padding daquele lado, só quando a tira está na ponta.
    // O ritmo vertical da tira é constante em todos os `padding` (12+16+12 =
    // 40), porque quem dá o ar acima do rótulo é a
    // própria tira.
    "[--card-strip-py:--spacing(3)]",
    "has-[>[data-slot=card-toolbar]:first-child]:pt-0",
    "has-[>[data-slot=card-footer]:last-child]:pb-0",
    "has-[>[data-slot=card-note]:last-child]:pb-0",
    "has-[>img:first-child]:pt-0",
    "has-[>img:last-child]:pb-0",
    // A capa encosta nas bordas como a imagem crua encostava.
    "has-[>[data-slot=card-media]:first-child]:pt-0",
    "has-[>[data-slot=card-media]:last-child]:pb-0",
    // O link esticado: o cartão responde ao cursor e ao foco do link, e todo
    // outro alvo de dentro sobe acima da película.
    "has-[[data-slot=card-link]]:transition-[box-shadow,border-color] has-[[data-slot=card-link]]:duration-(--duration-fast)",
    "[@media(hover:hover)]:has-[[data-slot=card-link]:hover]:shadow-md has-[[data-slot=card-link]:active]:shadow-md",
    "has-[[data-slot=card-link]:focus-visible]:ring-3 has-[[data-slot=card-link]:focus-visible]:ring-ring/45",
    "has-[[data-slot=card-link]]:[&_:is(button,a,[role=button]):not([data-slot=card-link])]:relative has-[[data-slot=card-link]]:[&_:is(button,a,[role=button]):not([data-slot=card-link])]:z-10",
  ],
  {
    variants: {
      variant: {
        /** Chapado sobre a página. O cartão do app. */
        outline: "border border-border bg-card text-card-foreground",
        /** O mesmo, levantado. Para o que flutua sobre uma lista atrás. */
        elevated: "border border-border bg-card text-card-foreground shadow-sm",
        /**
         * Contêiner de segunda ordem, para o bloco de apoio. `bg-muted` inteiro
         * e não um alfa: um alfa não atravessa os dois temas (invisível nos dois).
         */
        muted: "border border-border/60 bg-muted text-foreground",
        /** Sem borda e sem preenchimento: só agrupa, onde a superfície já existe. */
        plain: "border border-transparent bg-transparent text-foreground",
        /**
         * O brilho de marca: o `outline` com a borda que se ilumina num arco de
         * arco-íris conforme o ponteiro se aproxima, como o `Alert
         * variant="brand"` (`@utility brand-glow` e `useBrandGlow`). O recorte
         * é `overflow: clip` com `overflow-clip-margin`, para sobrar 4px ao anel
         * e ao borrão; a folga é `var(--spacing)` cru, porque o Chrome rejeita
         * `calc()` nessa propriedade. `isolate` é obrigatório (sem ele o
         * pseudo de `z` negativo cai atrás do fundo de um ancestral). Uma por
         * tela; sem ponteiro fino fica igual ao `outline`.
         */
        brand: [
          "brand-rainbow-image brand-glow isolate overflow-clip [overflow-clip-margin:var(--spacing)]",
          "border border-border bg-card text-card-foreground",
        ].join(" "),
        /** O tracejado: o lugar de um cartão que ainda não existe (o "adicionar", a lista vazia). */
        dashed: "border border-dashed border-border bg-transparent text-muted-foreground",
      },
      /**
       * `--card-px` é o recuo do corpo (cabeçalho, conteúdo) e `--card-strip-px`
       * o das tiras (barra, rodapé, nota). Só divergem em `none`: o corpo perde
       * o recuo para a lista sangrar, e a barra mantém os 16px.
       */
      // `--card-gap` e `--card-py` repetem o `gap` e o `py` do casco para o
      // `CardBody` do cartão horizontal, que é quem os aplica ali.
      padding: {
        none: "gap-0 py-0 [--card-px:0px] [--card-strip-px:--spacing(4)] [--card-gap:0px] [--card-py:0px]",
        sm: "gap-3 py-3 [--card-px:--spacing(3)] [--card-strip-px:--spacing(3)] [--card-gap:--spacing(3)] [--card-py:--spacing(3)]",
        md: "gap-4 py-4 [--card-px:--spacing(4)] [--card-strip-px:--spacing(4)] [--card-gap:--spacing(4)] [--card-py:--spacing(4)]",
        lg: "gap-6 py-6 [--card-px:--spacing(6)] [--card-strip-px:--spacing(6)] [--card-gap:--spacing(6)] [--card-py:--spacing(6)]",
      },
      /**
       * O cartão inteiro é o alvo: com `asChild` o link é o cartão, e o
       * `active:` que o toque exige vem junto.
       */
      /** Inativo: continua legível e clicável, só recua. O `Badge` "Inativo" é de quem chama. */
      inactive: {
        true: "opacity-80",
        false: "",
      },
      /**
       * Escolhido: contorno e tingido a 60% (cheio lê como erro). O papel
       * (`aria-pressed`, `aria-current`) é de quem chama.
       */
      selected: {
        true: "border-primary-accent/60 bg-primary/5 dark:bg-primary/10",
        false: "",
      },
      /**
       * Horizontal: a mídia à esquerda e o `CardBody` à direita a partir de
       * `sm`; abaixo, empilha. O casco perde o respiro vertical, que o
       * `CardBody` devolve.
       */
      orientation: {
        vertical: "",
        horizontal: [
          "sm:flex-row sm:gap-0 sm:py-0",
          "sm:[&>[data-slot=card-media]]:aspect-auto sm:[&>[data-slot=card-media]]:w-2/5 sm:[&>[data-slot=card-media]]:max-w-56 sm:[&>[data-slot=card-media]]:shrink-0 sm:[&>[data-slot=card-media]]:self-stretch",
        ],
      },
      interactive: {
        true: [
          "cursor-pointer outline-none",
          "transition-[box-shadow,border-color] duration-(--duration-fast) ease-(--ease-out)",
          "hover:shadow-md active:shadow-md",
          "focus-visible:ring-3 focus-visible:ring-ring/45",
        ],
        false: "",
      },
    },
    defaultVariants: {
      variant: "outline",
      padding: "md",
      inactive: false,
      selected: false,
      orientation: "vertical",
      interactive: false,
    },
  }
)

function Card({
  className,
  variant,
  padding,
  interactive,
  inactive,
  selected,
  orientation,
  asChild = false,
  ref,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & {
    /** Torna o cartão o próprio `<Link>` ou `<button>`. Vem com `interactive`. */
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "div"
  const glowRef = useBrandGlow(variant === "brand")
  return (
    <Comp
      data-slot="card"
      ref={composeRefs(glowRef, ref)}
      data-variant={variant ?? "outline"}
      data-padding={padding ?? "md"}
      data-interactive={interactive ? "" : undefined}
      data-inactive={inactive ? "" : undefined}
      data-selected={selected ? "" : undefined}
      data-orientation={orientation ?? "vertical"}
      className={cn(
        cardVariants({ variant, padding, interactive, inactive, selected, orientation }),
        className
      )}
      {...props}
    />
  )
}

/**
 * Título, descrição e ação, dentro do respiro do cartão. Não é a barra de topo
 * (essa é o `CardToolbar`, que sangra até a borda); o separador do conteúdo é o
 * `gap` do casco. O respiro vertical é do casco e o recuo horizontal é daqui.
 */
function CardHeader({
  className,
  media,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /** O ícone, o ladrilho de cor ou o avatar à esquerda do título e da descrição, centrado nas duas linhas. */
  media?: React.ReactNode
}) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 px-(--card-px)",
        "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        "has-data-[slot=card-description]:grid-rows-[auto_auto]",
        // Com mídia, a grade ganha uma coluna à esquerda; o título e a
        // descrição vão para a segunda, a ação para a terceira.
        "has-[>[data-slot=card-header-media]]:grid-cols-[auto_minmax(0,1fr)] has-[>[data-slot=card-header-media]]:gap-x-3",
        "has-[>[data-slot=card-header-media]]:has-data-[slot=card-action]:grid-cols-[auto_minmax(0,1fr)_auto]",
        "has-[>[data-slot=card-header-media]]:[&>[data-slot=card-title]]:col-start-2 has-[>[data-slot=card-header-media]]:[&>[data-slot=card-description]]:col-start-2",
        "has-[>[data-slot=card-header-media]]:[&>[data-slot=card-action]]:col-start-3",
        // Quem põe um fio no cabeçalho o transforma em tira; o caminho novo é
        // o `CardToolbar`.
        className
      )}
      {...props}
    >
      {media ? (
        <div
          data-slot="card-header-media"
          // Duas linhas só quando há descrição: sem ela, a segunda linha
          // vazia somaria o `gap` sob o título.
          className="col-start-1 row-start-1 flex shrink-0 items-center self-center group-has-data-[slot=card-description]/card-header:row-span-2"
        >
          {media}
        </div>
      ) : null}
      {children}
    </div>
  )
}

const CARD_TITLE_SIZE = {
  sm: "text-sm font-semibold",
  md: "text-base",
  lg: "text-lg",
} as const

function CardTitle({
  className,
  asChild = false,
  size = "md",
  ...props
}: React.ComponentProps<"div"> & {
  /** O corpo do título: `md` (padrão), `lg` para o cartão que é a seção da tela, `sm` para o denso. */
  size?: keyof typeof CARD_TITLE_SIZE
  /**
   * O título é `div` para um cartão numa lista de doze não despejar doze
   * headings; quando o cartão é uma seção da página, `asChild` devolve o `<h2>`.
   */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "div"
  return (
    <Comp
      data-slot="card-title"
      data-size={size}
      className={cn(
        "font-heading leading-snug font-medium text-balance",
        CARD_TITLE_SIZE[size],
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  // `Muted` dá corpo e tinta; o elemento continua `div`, pela mesma razão do
  // título — um cartão numa lista não despeja parágrafos na árvore.
  return (
    <Muted asChild data-slot="card-description" className={cn("text-pretty", className)}>
      <div {...props} />
    </Muted>
  )
}

/** A ação que mora na linha do título, encostada à direita. */
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("min-w-0 px-(--card-px)", className)}
      {...props}
    />
  )
}

/**
 * A barra de topo: rótulo à esquerda, contagem ou ação à direita.
 * `justify-between` é o padrão porque com um filho desenha igual a `flex-start`.
 */
const cardToolbarVariants = cva(
  [
    "flex shrink-0 flex-wrap items-center justify-between gap-3",
    "px-(--card-strip-px) py-(--card-strip-py)",
  ],
  {
    variants: {
      /**
       * Sem tinta, o tipo é o componente: título (o dado que nomeia o cartão) e
       * rótulo se distinguem só pela letra.
       */
      variant: {
        /** `text-xs font-medium text-muted-foreground` — o mesmo `menuLabelClassName`. */
        label: "text-xs font-medium text-muted-foreground",
        /** O dado que nomeia o cartão: um mês, um período, um total. */
        title: "text-sm font-semibold leading-snug text-foreground",
      },
    },
    defaultVariants: { variant: "label" },
  }
)

function CardToolbar({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardToolbarVariants>) {
  return (
    <div
      data-slot="card-toolbar"
      data-variant={variant ?? "label"}
      className={cn(cardToolbarVariants({ variant }), className)}
      {...props}
    />
  )
}

/**
 * O rodapé de ações: onde ficam os botões que fecham o cartão. Sem fio e sem
 * tinta, como a barra de topo e a nota: o que o separa do corpo é o respiro
 * (`--card-strip-py`), e uma tira pintada seria outra superfície.
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-2",
        "px-(--card-strip-px) py-(--card-strip-py)",
        className
      )}
      {...props}
    />
  )
}

/**
 * A letra miúda no pé: a contagem, a origem do número, a ressalva. Sem fio e
 * sem tinta. Não é `CardFooter`: uma nota não se clica e não deve pesar.
 */
function CardNote({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-note"
      className={cn(
        "flex shrink-0 items-start gap-2",
        "px-(--card-strip-px) py-(--card-strip-py)",
        "text-xs leading-relaxed text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

/**
 * A capa do cartão: a imagem e, opcionalmente, o texto sobre ela. O texto pousa
 * num véu `--scrim` com a tinta `--scrim-foreground`, iguais nos dois temas
 * (a foto não muda com o tema). `auto` deixa a altura com quem chama; o
 * `overflow-hidden` deixa os efeitos do carrossel moverem a imagem dentro dela.
 */
const CARD_MEDIA_ASPECT = {
  video: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  auto: "",
} as const

function CardMedia({
  src,
  alt,
  aspect = "video",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  src: string
  alt: string
  aspect?: keyof typeof CARD_MEDIA_ASPECT
}) {
  return (
    <div
      data-slot="card-media"
      className={cn(
        "relative overflow-hidden",
        CARD_MEDIA_ASPECT[aspect],
        className
      )}
      {...props}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a capa vem de
          fora do app (URL de quem chama), e o `next/image` exigiria a lista de
          domínios no `next.config`. */}
      <img src={src} alt={alt} className="size-full object-cover" />
      {children ? (
        <div
          data-slot="card-media-caption"
          className="absolute inset-x-0 bottom-0 flex flex-col bg-linear-to-t from-scrim via-scrim/60 to-transparent px-(--card-strip-px,--spacing(4)) pt-12 pb-4 text-scrim-foreground"
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

/**
 * O link esticado: o cartão inteiro clica e os outros alvos de dentro (menu,
 * botões do rodapé) continuam próprios. Vai no título, para o nome do link ser
 * o nome do cartão. A película (`::after`) cobre o cartão. `interactive
 * asChild` serve ao cartão que é só a ação (botão dentro de link é inválido).
 */
function CardLink({
  asChild = false,
  className,
  ...props
}: React.ComponentProps<"a"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "a"
  return (
    <Comp
      data-slot="card-link"
      className={cn(
        "text-inherit no-underline outline-none",
        "after:absolute after:inset-0 after:rounded-[inherit] after:content-['']",
        className
      )}
      {...props}
    />
  )
}

/** A coluna de conteúdo do cartão horizontal: devolve o respiro vertical que o casco perde ao deitar. */
function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-body"
      className={cn("flex min-w-0 flex-1 flex-col gap-(--card-gap) sm:py-(--card-py)", className)}
      {...props}
    />
  )
}

/**
 * O ladrilho "rótulo + valor" de dentro de um cartão ou de uma folha. O valor é
 * `children`; rótulo e valor são par de identidade (entrelinha mais 4px, sem
 * `gap`).
 */
function CardField({
  label,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  /** Sem rótulo, quando quem nomeia é a seção em volta (as observações). */
  label?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="card-field"
      className={cn(
        // Veste a linha alta (16), não o concêntrico: a 16px da borda 22 − 16
        // cairia no mínimo de 6, e em `padding="none"` sairia 22.
        "rounded-row-lg flex min-w-0 flex-col gap-1 border border-border/60 bg-background/80 p-3 text-sm",
        className
      )}
      {...props}
    >
      {label ? (
        <p data-slot="card-field-label" className="text-xs font-medium text-muted-foreground">
          {label}
        </p>
      ) : null}
      {children}
    </div>
  )
}

/**
 * A mensagem que ocupa o cartão (erro de carregar, lista vazia curta);
 * `destructive` é `role="alert"`. Para o vazio que pede ação, o `EmptyState`.
 */
function CardMessage({
  tone = "default",
  className,
  ...props
}: React.ComponentProps<"div"> & { tone?: "default" | "destructive" }) {
  return (
    <div
      data-slot="card-message"
      data-tone={tone}
      role={tone === "destructive" ? "alert" : undefined}
      className={cn(
        "px-(--card-strip-px) py-6 text-sm",
        tone === "destructive" ? "text-destructive" : "text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

/**
 * O cartão esperando dado, na forma do cartão de verdade; `children` troca as
 * linhas pelo miolo próprio. Não anuncia nada: quem espera é o `SkeletonGroup`
 * da página.
 */
function CardSkeleton({
  toolbar = true,
  lines = 3,
  footer = false,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Card>, "padding" | "children"> & {
  /** A barra de topo, com o rótulo. */
  toolbar?: boolean
  /** Linhas de texto no corpo, quando não há `children`. */
  lines?: number
  /** O rodapé com dois botões. */
  footer?: boolean
  children?: React.ReactNode
}) {
  return (
    <Card padding="none" aria-hidden className={className} {...props}>
      {toolbar ? (
        <CardToolbar>
          <Skeleton shape="text" className="w-36 max-w-[60%]" />
        </CardToolbar>
      ) : null}
      <CardContent className={cn(children == null && "px-4 py-4", !toolbar && children == null && "pt-4")}>
        {children ?? <SkeletonText lines={lines} />}
      </CardContent>
      {footer ? (
        <CardFooter className="justify-end">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </CardFooter>
      ) : null}
    </Card>
  )
}

export {
  Card,
  CardAction,
  CardBody,
  CardContent,
  CardDescription,
  CardField,
  CardFooter,
  CardHeader,
  CardLink,
  CardMedia,
  CardMessage,
  CardNote,
  CardSkeleton,
  CardTitle,
  CardToolbar,
  cardVariants,
}
