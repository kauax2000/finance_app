import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { ChevronRightIcon } from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import { Muted } from "@/components/ui/typography"
import { Separator } from "@/components/ui/separator"

/**
 * A linha de uma lista: mídia, conteúdo, ações.
 *
 * ## A escada mede recuo, e não altura
 *
 * `Button`, `Input` e `Tabs` medem altura porque são controles: a caixa é
 * conhecida antes do conteúdo. Uma linha de lista é o contrário — ela cresce
 * com o que carrega, e um título que quebra em duas linhas tem que empurrar a
 * linha, não ser recortado. Então `size` aqui governa **recuo, `gap` e a
 * mídia**, e a altura sai da soma.
 *
 * Os nomes, porém, são os mesmos do resto do sistema, e por isso `default`
 * saiu: ele dizia "o padrão" e apontava para uma string **idêntica** à de `sm`
 * (`gap-2.5 px-3 py-2.5`) — duas variantes, uma medida. `xs` saiu junto, e por
 * um motivo próprio: a única coisa que o distinguia era
 * `in-data-[slot=dropdown-menu-content]:p-0`, um componente conhecendo o
 * contêiner de outro. É a família do `in-data-[variant=dialog]` que o
 * `Command` já teve que enterrar.
 */
const itemVariants = cva(
  [
    "group/item flex w-full items-center rounded-row-lg border text-start text-sm transition-colors duration-(--duration-instant) outline-none",
    // **Só quebra quando há faixa** (rodada 194): `ItemHeader` e
    // `ItemFooter` ocupam a largura toda (`basis-full`) e precisam descer de
    // linha; sem eles, conteúdo e ações ficam lado a lado e o título trunca.
    // Era `flex-wrap` sempre, e seis linhas do app o desligavam à mão — a ação
    // caía embaixo do título numa tela estreita. E `text-start` de fábrica:
    // sete linhas-botão escreviam `text-left`, porque o `<button>` centraliza.
    "flex-nowrap has-[>[data-slot=item-header]]:flex-wrap has-[>[data-slot=item-footer]]:flex-wrap",
  ].join(" "),
  {
    variants: {
      variant: {
        plain: "border-transparent",
        outline: "border-border",
        muted: "border-transparent bg-muted/50",
        /**
         * **Rente** (rodada 194): a linha que ocupa um `Card padding="none"`,
         * sem borda nem canto, com o recuo de 16px da tira do cartão — o
         * mesmo que o `CardToolbar` usa, então título e linhas alinham. Três
         * listas do app escreviam `rounded-none border-0 px-4 py-3`. Num
         * `ItemGroup divided` o fio continua, porque a borda é transparente e
         * não zerada.
         */
        flush: "rounded-none border-transparent",
      },
      size: {
        // O raio é a linha (rodada 244c): com a superfície (22), uma linha de
        // 38 a 44px saía cápsula. `sm` (38) veste a linha, os outros a alta.
        sm: "gap-2 px-2.5 py-2 rounded-row",
        md: "gap-2.5 px-3 py-2.5",
        lg: "gap-3 px-4 py-3.5",
      },
      // Antes o realce era `[a]:hover:bg-muted` — implícito, e só quando o
      // próprio `Item` fosse um `<a>` (via `asChild`). Uma linha que navega
      // porque tem um `<Link>` dentro, ou que é `<button>`, ficava sem resposta
      // nenhuma. E não havia par `active:`: o realce compila dentro de
      // `@media (hover: hover)`, verificado no CSS emitido, então no telefone
      // ele não existia em caso nenhum.
      //
      // Agora é explícito, como o `interactive` que o `Card` já documenta.
      /**
       * A linha atual ou escolhida (rodada 194): o contorno e o fundo do
       * cartão de escolha do `FieldLabel` — `--primary-accent` a 60%, o
       * primeiro degrau que alcança 3:1 de traço nos dois temas, e `--primary`
       * a 5%/10%. Vem com `aria-current`. A sessão atual e a categoria em foco
       * escreviam as próprias classes, e a primeira a 30%, abaixo da norma.
       */
      selected: {
        true: "border-primary-accent/60 bg-primary/5 dark:bg-primary/10",
        false: "",
      },
      interactive: {
        true: [
          "cursor-pointer hover:bg-muted active:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/45 pointer-coarse:min-h-11",
          // O que a `ItemChevron` lê: só a linha que navega a faz andar. Uma
          // variante empilhada (`group-hover` + `group-data-[interactive]`)
          // apontaria para o mesmo ancestral e não casaria com nada — a
          // medição do alternador de tema; a saída é a variável.
          "hover:[--item-nudge:--spacing(0.5)] active:[--item-nudge:--spacing(0.5)] hover:[--item-chevron:var(--color-foreground)] active:[--item-chevron:var(--color-foreground)]",
        ].join(" "),
        false: "",
      },
    },
    compoundVariants: [
      { variant: "flush", size: "sm", className: "px-4 py-2 rounded-none" },
      { variant: "flush", size: "md", className: "px-4 py-3" },
      { variant: "flush", size: "lg", className: "px-4 py-3.5" },
    ],
    defaultVariants: {
      variant: "plain",
      size: "md",
      selected: false,
      interactive: false,
    },
  }
)

const itemGroupVariants = cva("group/item-group flex w-full flex-col", {
  variants: {
    // Duas formas, e a escolha é sobre o que separa uma linha da seguinte.
    // `spaced` separa por respiro — linhas que são cartões. `divided` separa
    // por fio, que é a categoria que nunca o perde: um separador de itens
    // repetidos não divide superfície, ele é o que torna a lista varrível.
    variant: {
      spaced: "gap-4 has-data-[size=sm]:gap-2.5",
      // **Não é `divide-y divide-border`**, e a diferença foi medida: `divide-*`
      // compila com `:where(& > :not(:last-child))`, que não soma
      // especificidade, e o `Item` traz `border-transparent` **no próprio
      // elemento**. Um seletor de zero especificidade contra uma classe local
      // perde, e os fios saíam com a cor transparente do próprio `Item` — a
      // lista dividida sem nenhuma divisão, calada. Medido.
      //
      // O seletor arbitrário abaixo tem classe + atributo + pseudo-classe, e
      // ganha. Ele também é o contrato honesto: só linhas viram fio, e um
      // cabeçalho de seção no meio do grupo não vira.
      //
      // A largura já vem do `border` da base do `Item`; aqui só se declara a
      // cor. (No `DescriptionList` o mesmo `divided` usa `divide-y` e funciona,
      // porque lá o item não declara borda nenhuma para disputar.)
      //
      // **E o raio sai.** Uma borda de baixo num elemento `rounded-lg` curva
      // nas duas pontas — 10px neste tema, medidos —, então o fio saía com as
      // duas extremidades subindo: um traço arqueado no meio de uma lista. O
      // sintoma é visível; a causa é que **uma linha de lista dividida não é um
      // cartão**, e cartão é a única coisa que tem canto.
      //
      // É o que o resto do sistema já faz: `TableRow` desenha `border-b` e o
      // arquivo inteiro não tem um `rounded`; o `AccordionItem` desenha
      // `not-last:border-b` e o raio mora no contêiner (`overflow-hidden
      // rounded-xl`), nunca na linha. Em `spaced` o raio fica, porque ali a
      // linha **é** um cartão.
      //
      // O segundo ganho não é o fio: com `interactive`, o realce de uma linha
      // dividida vira uma faixa de largura inteira em vez de uma pílula
      // flutuando dentro da lista.
      //
      // O raio das pontas é de quem contém — `Card padding="none"` e a moldura
      // do catálogo já recortam com `overflow-hidden`. Cravar aqui um
      // `first:rounded-t-lg` seria copiar para dentro do componente um número
      // do contêiner, que é o defeito que a variante `bare` do `Command`
      // enterrou.
      divided:
        "gap-0 [&>[data-slot=item]]:rounded-none [&>[data-slot=item]:not(:last-child)]:border-b-border",
    },
  },
  defaultVariants: {
    variant: "spaced",
  },
})

function ItemGroup({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof itemGroupVariants>) {
  return (
    <div
      // Sem `role="list"`: o `Item` não é `listitem` (ele pode ser um link), e
      // uma lista sem itens é o que o leitor de tela anuncia errado. Quem é
      // lista de verdade passa `role` e marca os itens.
      data-slot="item-group"
      data-variant={variant ?? "spaced"}
      className={cn(itemGroupVariants({ variant, className }))}
      {...props}
    />
  )
}

/**
 * O fio explícito, para a lista que separa por seção e não a cada linha.
 * `ItemGroup variant="divided"` cobre o caso comum sem que ninguém posicione
 * n−1 destes à mão.
 */
function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      className={cn("my-2", className)}
      {...props}
    />
  )
}

function Item({
  className,
  variant = "plain",
  size = "md",
  interactive = false,
  selected = false,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof itemVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div"
  return (
    <Comp
      data-slot="item"
      data-variant={variant}
      data-size={size}
      data-interactive={interactive ? "true" : undefined}
      data-selected={selected || undefined}
      aria-current={selected ? "true" : undefined}
      className={cn(itemVariants({ variant, size, interactive, selected, className }))}
      {...props}
    />
  )
}

const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        plain: "bg-transparent",
        icon: "[&_svg:not([class*='size-'])]:size-4",
        // O raio acompanha a medida: `rounded-sm` cravado deixava um retângulo
        // de 40px com 2px de canto ao lado de um sistema que arredonda em 10.
        image:
          "size-10 overflow-hidden rounded-lg group-data-[size=sm]/item:size-8 group-data-[size=sm]/item:rounded-md group-data-[size=lg]/item:size-12 [&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "plain",
    },
  }
)

function ItemMedia({
  className,
  variant = "plain",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant, className }))}
      {...props}
    />
  )
}

/**
 * Título sobre descrição é **par de identidade**: o mesmo dado em duas linhas,
 * e quem os separa é a entrelinha. O `gap-1` que estava aqui media 4px, e a
 * própria página do catálogo já dizia o contrário — "`ItemContent` já entrega a
 * entrelinha". A documentação estava certa e o código é que discordava.
 */
function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn(
        // `min-w-0`: sem ele, numa linha que não quebra, um título longo
        // empurraria as ações para fora em vez de truncar.
        "flex min-w-0 flex-1 flex-col gap-0 [&+[data-slot=item-content]]:flex-none",
        className
      )}
      {...props}
    />
  )
}

function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn(
        // Sem `line-clamp-1`: medido, o `flex` vencia o `-webkit-box` e o corte nunca
        // acontecia. Quem precisa cortar põe o texto num `span` com `truncate`.
        // `flex-wrap`: numa linha que não quebra (rodada 194) o título
        // encolhe, e um `Badge` dentro dele era espremido em três linhas — medido
        // a 360px, "Vence em 3 dias". Assim ele desce inteiro.
        "flex w-fit flex-wrap items-center gap-x-2 gap-y-0.5 text-sm leading-snug font-medium underline-offset-4",
        className
      )}
      {...props}
    />
  )
}

function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <Muted
      data-slot="item-description"
      className={cn(
        "line-clamp-2 text-left leading-normal font-normal group-data-[size=sm]/item:text-xs [&>a]:underline [&>a]:underline-offset-4 [&>a]:hover:text-primary-accent [&>a:active]:text-primary-accent",
        className
      )}
      {...props}
    />
  )
}

function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

function ItemHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-header"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}

function ItemFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-footer"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}

/**
 * A seta da linha que navega (rodada 194): apagada em repouso, e no cursor e
 * no toque **de uma linha `interactive`** ela ganha a tinta cheia e anda 2px
 * no sentido do clique — a língua do marcador da divulgação. Numa linha que
 * não navega ela fica parada. Duas telas a escreviam à mão, uma a 70% e outra
 * com a própria animação. Decorativa: quem diz para onde vai é a linha.
 */
function ItemChevron({ className, ...props }: React.ComponentProps<typeof ChevronRightIcon>) {
  return (
    <ChevronRightIcon
      data-slot="item-chevron"
      aria-hidden
      className={cn(
        "size-4 shrink-0 transition-[translate,color] duration-(--duration-base) ease-(--ease-out)",
        "translate-x-(--item-nudge,0px) text-(--item-chevron,var(--color-muted-foreground))",
        className
      )}
      {...props}
    />
  )
}

export {
  Item,
  ItemChevron,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
  itemVariants,
}
