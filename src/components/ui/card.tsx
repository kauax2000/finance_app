import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { Muted } from "@/components/ui/typography"

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
 */
const cardVariants = cva(
  [
    "group/card relative flex min-w-0 flex-col overflow-hidden rounded-xl text-sm",
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
      padding: {
        none: "gap-0 py-0 [--card-px:0px] [--card-strip-px:--spacing(4)]",
        sm: "gap-3 py-3 [--card-px:--spacing(3)] [--card-strip-px:--spacing(3)]",
        md: "gap-4 py-4 [--card-px:--spacing(4)] [--card-strip-px:--spacing(4)]",
        lg: "gap-6 py-6 [--card-px:--spacing(6)] [--card-strip-px:--spacing(6)]",
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
      interactive: {
        true: [
          "cursor-pointer outline-none",
          "transition-[box-shadow,border-color] duration-(--duration-fast) ease-(--ease-out)",
          "hover:shadow-md active:shadow-md",
          "focus-visible:ring-3 focus-visible:ring-ring/70",
        ],
        false: "",
      },
    },
    defaultVariants: {
      variant: "outline",
      padding: "md",
      interactive: false,
    },
  }
)

function Card({
  className,
  variant,
  padding,
  interactive,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & {
    /** Torna o cartão o próprio `<Link>` ou `<button>`. Vem com `interactive`. */
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "div"
  return (
    <Comp
      data-slot="card"
      data-variant={variant ?? "outline"}
      data-padding={padding ?? "md"}
      data-interactive={interactive ? "" : undefined}
      className={cn(cardVariants({ variant, padding, interactive }), className)}
      {...props}
    />
  )
}

/**
 * Título, descrição e ação — o cabeçalho **dentro** do respiro do cartão.
 *
 * Ele não é a barra de topo: quem tem fio embaixo e fundo tingido é o
 * `CardToolbar`. Aqui o cabeçalho compartilha a superfície do corpo, e o que o
 * separa do conteúdo é o `gap` do casco.
 *
 * O `pt-4` que ele carregava saiu. Somado ao `py-4` do casco, dava **32px acima
 * do título contra 16 abaixo do conteúdo** — um cartão que abria torto, em
 * todas as 30 chamadas com cabeçalho. O respiro vertical é do casco, o recuo
 * horizontal é daqui, e nenhum dos dois é escrito duas vezes.
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 px-(--card-px)",
        "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        "has-data-[slot=card-description]:grid-rows-[auto_auto]",
        // Quem põe um fio no cabeçalho o transforma em tira, e uma tira precisa
        // do próprio pé. Continua atendido — mas o caminho novo é `CardToolbar`,
        // que já vem com fio, tinta e altura mínima.
        className
      )}
      {...props}
    />
  )
}

function CardTitle({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & {
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
      className={cn(
        "font-heading text-lg leading-snug font-medium text-balance",
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

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardNote,
  CardTitle,
  CardToolbar,
  cardVariants,
}
