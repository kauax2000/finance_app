"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { composeRefs, useBrandGlow } from "@/hooks/use-brand-glow"
import { Muted } from "@/components/ui/typography"
import { Skeleton, SkeletonText } from "@/components/ui/skeleton"

/**
 * O casco do cartão.
 *
 * A versão anterior descrevia um cartão que o app não constrói. Ela vinha com
 * anel (`ring-1 ring-foreground/10`), respiro vertical e um `size="sm"` que
 * significava "sem padding" — e 46 chamadas do produto abriam com a **mesma
 * string** para desligar tudo isso:
 *
 *     <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
 *
 * Cinquenta e duas delas carregavam `shadow-none` num componente **sem sombra
 * nenhuma** — classe morta copiada adiante por quem não tinha como saber. E o
 * cabeçalho e o rodapé que essas telas realmente usam não existiam aqui: 24
 * barras de topo e 18 faixas de pé feitas à mão, em cinco e nove grafias
 * diferentes, contra dois usos de `CardFooter` no app inteiro.
 *
 * Então os eixos passaram a ser os dois que as telas já separavam na prática:
 *
 * - **`variant`** decide a **borda e a superfície** — o cartão está chapado
 *   sobre a página, levantado dela, rebaixado nela, ou não tem borda alguma.
 * - **`padding`** decide o **ritmo interno** — e `none` é o painel: casco sem
 *   respiro, para o conteúdo sangrar de borda a borda.
 *
 * Os dois eixos são independentes de propósito. O painel do app é
 * `outline` + `none`; o cartão de conteúdo é `outline` + `md`; e nenhuma das
 * duas combinações precisa de uma terceira palavra para existir.
 *
 * ## Rodada 204
 *
 * Um levantamento das telas achou o que elas escreviam em volta do cartão, e
 * cada versão abaixo nasce de uma contagem:
 *
 * - **`CardField`** — o ladrilho "rótulo + valor" aninhado, em 24 cópias e um
 *   `FieldCard` local.
 * - **`CardHeader media`** — o ícone, o ladrilho de cor ou o avatar à
 *   esquerda do título, montado com grade à mão nos cartões de conta e de
 *   categoria.
 * - **`CardLink`** — o link esticado: o cartão inteiro clica, e os botões do
 *   rodapé e o menu continuam alvos próprios. Cinco cartões o faziam à mão,
 *   porque `interactive asChild` não aceita botão dentro.
 * - **`CardTitle size`** — `md` (`text-base`) passa a ser o padrão: 9 dos 10
 *   títulos do app o escreviam por `className`.
 * - **`inactive`**, **`selected`**, **`orientation`** e
 *   **`variant="dashed"`** no casco; **`CardMessage`** e **`CardSkeleton`**
 *   como peças.
 */
const cardVariants = cva(
  [
    "group/card relative flex min-w-0 flex-col overflow-hidden rounded-surface text-sm [--radius-parent:var(--radius-surface)] [--radius-inset:var(--card-px)]",
    // O `overflow-hidden` já recorta os cantos de todo filho. Por isso não há
    // `rounded-t-xl` no cabeçalho nem `rounded-b-xl` no rodapé: eram três
    // declarações mantendo à mão o que o casco resolve uma vez, e que saíam de
    // sincronia assim que o raio mudasse.
    //
    // Uma tira sangra até a borda; o respiro vertical do casco a empurraria
    // para dentro, deixando um filete de `bg-card` acima ou abaixo dela. O
    // casco recolhe o próprio padding **daquele lado** — e só quando a tira
    // está na ponta, porque uma barra no meio da pilha não toca borda nenhuma.
    // O ritmo vertical da tira, e ele é **constante** em todas as variantes de
    // `padding`. A razão está três linhas abaixo: os `has-[]` recolhem o respiro
    // do casco daquele lado sempre que a tira está na ponta, então quem dá o ar
    // acima do rótulo é a própria tira — em `padding="none"` e em `md` igual.
    //
    // 12px, e a conta é neutra: a tira tingida media `py-2.5` (10) + `text-xs`
    // (16) = 36, forçados a 40 pelo `min-h-10`. Aqui 12+16+12 = **40**. Nenhuma
    // tira muda de altura ao perder o fio e a tinta, e é isso que torna a
    // migração das cópias verificável: qualquer deslocamento é bug.
    "[--card-strip-py:--spacing(3)]",
    "has-[>[data-slot=card-toolbar]:first-child]:pt-0",
    "has-[>[data-slot=card-footer]:last-child]:pb-0",
    "has-[>[data-slot=card-note]:last-child]:pb-0",
    "has-[>img:first-child]:pt-0",
    "has-[>img:last-child]:pb-0",
    // A capa encosta nas bordas como a imagem crua encostava.
    "has-[>[data-slot=card-media]:first-child]:pt-0",
    "has-[>[data-slot=card-media]:last-child]:pb-0",
    // O link esticado (`CardLink`, rodada 204): o cartão responde ao cursor e
    // ao foco do link como se fosse ele, e todo outro alvo de dentro — os
    // botões do rodapé, o menu — sobe acima da película do link.
    "has-[[data-slot=card-link]]:transition-[box-shadow,border-color] has-[[data-slot=card-link]]:duration-(--duration-fast)",
    "has-[[data-slot=card-link]:hover]:shadow-md has-[[data-slot=card-link]:active]:shadow-md",
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
         * Contêiner de segunda ordem: material diferente do cartão, para o
         * bloco de apoio que não deve disputar com ele.
         *
         * `bg-muted` inteiro, e não um alfa dele, porque um alfa não atravessa
         * os dois temas: a 40% ele dava 0,976 no claro — a um passo do branco
         * do cartão *e* do fundo da página — e 0,243 no escuro, contra os 0,205
         * do cartão. Invisível dos dois lados. O tingido cheio é o único valor
         * que se lê nos dois, e é o mesmo `--muted` que a barra e a nota usam.
         */
        muted: "border border-border/60 bg-muted text-foreground",
        /** Sem borda e sem preenchimento: só agrupa, onde a superfície já existe. */
        plain: "border border-transparent bg-transparent text-foreground",
        /**
         * **O brilho de marca** — o `outline` com a borda que se ilumina num
         * arco de arco-íris conforme o ponteiro se aproxima, o mesmo do
         * `Alert variant="brand"` (`@utility brand-glow` e `useBrandGlow`).
         *
         * **O recorte deixa 4px de folga**, e isso foi medido duas vezes. O
         * casco tem `overflow-hidden` para recortar os cantos dos filhos, e o
         * anel do `Alert` mora 2px **fora** da caixa: recortado ali, sumia
         * inteiro. Pôr o anel **dentro** da borda o salvou só pela metade — o
         * borrão de 2px sangra para fora e era cortado, e o arco quase não se
         * via. A saída é `overflow: clip` com `overflow-clip-margin`: o
         * conteúdo continua recortado nos cantos, e sobram 4px para o anel e o
         * borrão. **A folga é `var(--spacing)` cru**, porque o Chrome rejeita
         * `calc()` nessa propriedade — medido, `calc(var(--spacing)*2)`
         * computava `0px`. Sem suporte à propriedade, o recorte fica na
         * borda e o brilho sai tímido, como na primeira versão.
         *
         * `isolate` é obrigatório pela mesma medição do `Alert` — sem ele o
         * pseudo de `z` negativo cai atrás do fundo de um ancestral.
         *
         * Uma por tela, como toda peça de marca. Sem ponteiro fino (telefone)
         * não há brilho, e ela fica igual ao `outline`.
         */
        brand: [
          "brand-rainbow-image brand-glow isolate overflow-clip [overflow-clip-margin:var(--spacing)]",
          "border border-border bg-card text-card-foreground",
        ].join(" "),
        /**
         * O tracejado (rodada 204): o lugar de um cartão que ainda não existe —
         * o "adicionar" no fim de uma grade, o vazio de uma lista de cartões.
         * Sem preenchimento, porque não há nada ali ainda.
         */
        dashed: "border border-dashed border-border bg-transparent text-muted-foreground",
      },
      /**
       * Uma medida, dois destinos: `--card-px` é o recuo do **corpo** (cabeçalho,
       * conteúdo) e `--card-strip-px` é o das **tiras** (barra, rodapé, nota).
       *
       * Eles só divergem em `none`, e é o ponto inteiro do painel: o corpo perde
       * o recuo para a lista sangrar até a borda, enquanto a barra de topo
       * continua com os seus 16px — que é exatamente o que as 24 barras feitas à
       * mão escreviam (`px-4`) dentro de cartões `py-0`.
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
       * O cartão inteiro é o alvo.
       *
       * Existia no app antes de existir aqui: os cartões de categoria embrulham
       * o `Card` num `<Link>` e penduram `group-hover:shadow-md` de fora. Com
       * `interactive` + `asChild` o link **é** o cartão — um nó a menos, o foco
       * no lugar certo, e o `active:` que o toque exige (regra H) vindo junto,
       * em vez de depender de quem lembrar de escrevê-lo.
       */
      /**
       * Inativo (rodada 204): o cartão continua legível e clicável, só recua.
       * Era `opacity-[0.82]` em três telas, sempre ao lado de um `Badge`
       * "Inativo" — que continua sendo de quem chama: a opacidade sozinha não
       * diz o porquê.
       */
      inactive: {
        true: "opacity-80",
        false: "",
      },
      /**
       * Escolhido (rodada 204): o contorno e o tingido do cartão de escolha do
       * `RadioGroup` e do `Item` — a 60%, porque cheio lê como erro. O papel
       * (`aria-pressed`, `aria-current`) é de quem chama: o cartão não sabe se
       * é uma opção ou "você" numa lista.
       */
      selected: {
        true: "border-primary-accent/60 bg-primary/5 dark:bg-primary/10",
        false: "",
      },
      /**
       * Horizontal (rodada 204): a mídia — capa, face do cartão, ícone grande —
       * à esquerda e o `CardBody` à direita, a partir de `sm`; abaixo, empilha.
       * O casco perde o respiro vertical ao deitar, e quem o devolve é o
       * `CardBody`, para a mídia sangrar de cima a baixo.
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
 * Título, descrição e ação — o cabeçalho **dentro** do respiro do cartão.
 *
 * Ele não é a barra de topo: essa é o `CardToolbar`, uma tira que sangra até a
 * borda (sem fio nem tinta — ver as tiras). Aqui o cabeçalho compartilha a superfície do corpo, e o que o
 * separa do conteúdo é o `gap` do casco.
 *
 * O `pt-4` que ele carregava saiu. Somado ao `py-4` do casco, dava **32px acima
 * do título contra 16 abaixo do conteúdo** — um cartão que abria torto, em
 * todas as 30 chamadas com cabeçalho. O respiro vertical é do casco, o recuo
 * horizontal é daqui, e nenhum dos dois é escrito duas vezes.
 */
function CardHeader({
  className,
  media,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /**
   * O ícone, o ladrilho de cor ou o avatar à esquerda do título e da
   * descrição (rodada 204), centrado nas duas linhas. Os cartões de conta e
   * de categoria montavam essa grade à mão.
   */
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
        // Quem põe um fio no cabeçalho o transforma em tira, e uma tira precisa
        // do próprio pé. Continua atendido — mas o caminho novo é `CardToolbar`,
        // a tira que sangra até a borda com altura mínima.
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
  /**
   * O corpo do título (rodada 204). `md` (`text-base`) é o padrão: era `lg`,
   * e 9 dos 10 títulos do app o rebaixavam por `className`. `lg` fica para o
   * cartão que é a seção da tela; `sm`, para o cartão denso numa grade.
   */
  size?: keyof typeof CARD_TITLE_SIZE
  /**
   * O título é `div` porque um cartão dentro de uma lista de doze não deve
   * despejar doze headings na árvore. Quando o cartão **é** uma seção da
   * página, `asChild` devolve o `<h2>` — e aí a navegação por cabeçalho do
   * leitor de tela encontra o que o olho já encontrava.
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
 *
 * É a peça que faltava. O app tem 24 delas escritas à mão, em cinco grafias —
 * `flex min-h-10 shrink-0 items-center border-b border-border bg-muted/30 px-4
 * py-2.5`, com e sem `justify-end`, com e sem `gap-3` —, o que é o invariante 1
 * do design system sendo violado 24 vezes por culpa deste arquivo, que não
 * oferecia o slot.
 *
 * `justify-between` é o padrão porque com **um** filho ele desenha igual a
 * `flex-start`, e com dois desenha o que a barra quer. O tipo já vem posto para
 * o caso comum — texto curto e apagado —; `Badge` e `Button` dentro trazem o
 * próprio.
 */
const cardToolbarVariants = cva(
  [
    "flex shrink-0 flex-wrap items-center justify-between gap-3",
    "px-(--card-strip-px) py-(--card-strip-py)",
  ],
  {
    variants: {
      /**
       * **Sem tinta, o tipo é o componente.**
       *
       * Enquanto a barra era tingida, título e rótulo dentro dela liam como a
       * mesma coisa — a banda dizia "isto é uma tira" e a letra só variava. Sem
       * a tinta, a letra é a única coisa que distingue tira de conteúdo, e
       * cravar um tipo só faria as chamadas de título sobrescreverem por
       * `className` no mesmo dia. A divisão sai de contagem: das 23 barras
       * escritas à mão no app, **8 são título** (o mês do dashboard, o período
       * da fatura) e 7 são rótulo.
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
 * O rodapé de ações: onde ficam os botões que fecham o cartão.
 *
 * **Sem fio e sem tinta**, como a barra de topo e a nota. Barra e rodapé são a
 * mesma coisa — estrutura que emoldura o corpo —, e o que os separa do corpo é o
 * respiro que eles trazem (`--card-strip-py`), não um degrau de cor. Quem é mais
 * quieto é a `CardNote`, e ela é mais quieta porque é letra miúda, não porque
 * está embaixo.
 *
 * O tingido já foi `bg-muted/50`, depois `bg-muted/30`. Ele saiu inteiro: uma
 * tira pintada é uma **superfície diferente** do corpo, e é o mesmo defeito que
 * o rodapé da paleta de comandos e o do seletor de formulário já registraram ao
 * perder o deles.
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
 * A letra miúda no pé: a contagem, a origem do número, a ressalva.
 *
 * São 18 no app, em nove grafias. **Sem fio e sem tinta**: o par
 * `bg-muted/15 dark:bg-muted/25` existia porque 15% de `--muted` sobre `--card`
 * desaparece no escuro — um remendo que só era preciso porque havia tinta. Sem
 * ela não há o que medir, e quem dá profundidade ao pé é o respiro.
 *
 * Não é `CardFooter`. Um rodapé de ações tem alvos de toque e pesa; uma nota
 * não se clica e não deve pesar. Eram dois papéis usando um nome — e como o
 * nome já estava ocupado pelo papel errado, as 18 notas nasceram fora do
 * design system.
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
 * A capa do cartão — a imagem, e opcionalmente o texto sobre ela (rodada 134).
 *
 * Nasceu para as galerias do carrossel ("carta com informação em imagem, ou só
 * imagem"), e mora no `Card` porque serve qualquer cartão com capa.
 *
 * **O texto sobre a foto não é o do tema.** Ele pousa num véu `--scrim` (preto
 * a 62%, subindo da base) com a tinta `--scrim-foreground` (branca), e os dois
 * são iguais nos dois temas: a foto não muda com o tema, e o texto sobre ela
 * também não pode.
 *
 * A imagem é `object-cover` na proporção pedida; `auto` deixa a altura com
 * quem chama (`h-full` dentro de um carrossel com altura fixa, por exemplo).
 * O recorte é da própria capa (`overflow-hidden`), que é o que os efeitos do
 * carrossel (`parallax`, `zoom`) precisam para a imagem andar dentro dela.
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
 * O link esticado (rodada 204): o cartão inteiro clica, e os outros alvos de
 * dentro — o menu da linha do título, os botões do rodapé — continuam sendo
 * alvos próprios. **Vai no título**: o nome do link é o nome do cartão, e não
 * um `aria-label` que apaga o conteúdo. A película (`::after`) cobre o cartão;
 * o casco sobe os outros botões acima dela e acende o anel e a sombra quando o
 * link tem foco ou cursor.
 *
 * `interactive asChild` continua certo para o cartão que é **só** a ação. Com
 * um botão dentro ele não serve — botão dentro de link é inválido —, e era por
 * isso que cinco cartões do app faziam a película à mão.
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

/**
 * A coluna de conteúdo do cartão horizontal (rodada 204): devolve o respiro
 * vertical que o casco perde ao deitar, para a mídia sangrar de cima a baixo.
 */
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
 * O ladrilho "rótulo + valor" de dentro de um cartão ou de uma folha (rodada
 * 204). Era escrito à mão 24 vezes — `rounded-lg border border-border/60
 * bg-background/80 p-3` com o rótulo em `text-xs font-medium` — e havia um
 * `FieldCard` local na folha de prévia de pagamento. O valor é `children`, e
 * o rótulo e o valor são par de identidade: o respiro entre eles é a
 * entrelinha mais 4px, não um `gap` maior.
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
        // O ladrilho veste a linha alta (16; rodada 242d), e não o
        // concêntrico: no cartão `md` ele fica a 16px da borda, e 22 − 16 caía
        // no mínimo de 6 — e no `padding="none"` (recuo 0) saía 22, o raio do
        // próprio cartão. Longe da borda, a peça veste o próprio degrau.
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
 * A mensagem que ocupa o cartão (rodada 204): o erro de carregar, o "nenhuma
 * carteira", a lista vazia curta. Eram 16 `CardContent` com `py-6` ou
 * `py-8` e a tinta escrita à mão. `destructive` é `role="alert"`; o resto é
 * texto. Para o vazio que pede ação, o `EmptyState`.
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
 * O cartão esperando dado (rodada 204): a barra, as linhas e o rodapé na
 * forma do cartão de verdade. Os esqueletos do app escreviam o casco à mão
 * (`rounded-xl border bg-card`, um com um `ring` morto) e dois arquivos
 * tinham o mesmo `CardSectionShell`. `children` troca as linhas pelo miolo
 * próprio. Ele não anuncia nada: quem espera é o `SkeletonGroup` da página.
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
