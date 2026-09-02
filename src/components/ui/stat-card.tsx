"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * O número que a tela veio dizer, com o rótulo que o explica.
 *
 * ## Ele compõe o `Card`, e não reimplementa um
 *
 * A versão anterior montava a superfície à mão: `rounded-xl border
 * border-border/80 bg-card p-4 shadow-xs ring-1 ring-foreground/5`. Cada
 * pedaço disso é um eixo que o `Card` já governa — e o `border-border/80` era um
 * **quarto peso de borda** no app, exatamente o que o `tone` do `Separator`
 * existe para não deixar acontecer.
 *
 * O que fica sendo do `StatCard` é o **tom de dinheiro**, e é a divisão certa:
 * o `AGENTS.md` diz que `Card` **não** tem tom de entrada e saída, e que
 * superfície tingida de dinheiro é trabalho daqui.
 *
 * ## O rótulo e o valor não levam `gap`
 *
 * Eram `gap-2` — 8px medidos entre "Total pago 90d" e o número. É o par de
 * identidade que o `AGENTS.md` nomeia com estas palavras ("rótulo sobre
 * valor"), e o invariante diz "nem `gap-1`". O mesmo defeito que o
 * `ItemContent` teve na rodada 08.
 *
 * O respiro volta a existir **entre** o par e a variação, que é outra coisa —
 * e é o contêiner quem o declara, não a variação que o carrega.
 */
const statCardVariants = cva("", {
  variants: {
    tone: {
      default: "",
      income: "border-income/25 bg-income-muted/40 dark:bg-income-muted/25",
      expense: "border-expense/20 bg-expense-muted/50 dark:bg-expense-muted/30",
      warning: "border-warning/25 bg-warning-muted/50 dark:bg-warning-muted/30",
      info: "border-info/25 bg-info-muted/50 dark:bg-info-muted/30",
    },
    // O corpo do número, o recuo, e o respiro **da variação** — que é o único
    // respiro vertical do cartão. `md` é o cartão de painel; `sm` é o de dentro
    // de uma folha, onde quatro deles dividem a largura.
    //
    // Um `gap` no contêiner separaria os três filhos por igual, e o rótulo
    // ficaria a 8px do valor — que é exatamente o defeito medido. Aqui a base é
    // `gap-0` e quem recebe a folga é a variação, **declarada pelo pai**: ela é
    // outra coisa, e não a segunda linha do mesmo dado.
    //
    // Não é "compensar geometria por seletor": é o contêiner dizendo qual dos
    // filhos abre um bloco novo, como o `ItemGroup variant="divided"` faz.
    size: {
      sm: "gap-0 p-3 [--stat-card-value:var(--text-lg)] [&>[data-slot=stat-card-delta]]:mt-1.5",
      md: "gap-0 p-4 [--stat-card-value:var(--text-2xl)] [&>[data-slot=stat-card-delta]]:mt-2",
    },
  },
  defaultVariants: {
    tone: "default",
    size: "md",
  },
})

function StatCard({
  className,
  tone,
  size,
  interactive,
  asChild,
  ...props
}: React.ComponentProps<typeof Card> &
  VariantProps<typeof statCardVariants>) {
  return (
    <Card
      data-slot="stat-card"
      data-tone={tone ?? "default"}
      data-size={size ?? "md"}
      // `padding="none"` porque o recuo é do `size` daqui — o do `Card` não
      // conhece o corpo do número. `interactive` e `asChild` descem inteiros:
      // o cartão que abre a lista filtrada é o caso óbvio, e o `Card` já traz
      // elevação, par de toque e anel de foco.
      padding="none"
      interactive={interactive}
      asChild={asChild}
      className={cn(statCardVariants({ tone, size }), className)}
      {...props}
    />
  )
}

/** O ícone que o `gap-2` do rótulo já reservava e que não tinha slot. */
function StatCardIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="stat-card-icon"
      aria-hidden
      className={cn(
        "flex shrink-0 items-center [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function StatCardLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-card-label"
      className={cn(
        "flex items-center gap-2 text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

/**
 * O valor.
 *
 * Ele reimplementava `MoneyDisplay size="2xl"` à mão — `font-mono text-2xl
 * font-semibold tracking-tight tabular-nums` — e divergia num ponto:
 * **`letter-spacing: -0,6px` contra `normal`**, medidos. A face mono está
 * certa, e é decisão registrada do `MoneyDisplay` para figura-herói ("o saldo é
 * o herói deste produto"); o que não estava certo era existirem duas
 * definições da mesma figura, diferentes por um `tracking-tight`.
 *
 * O `tracking-tight` saiu, e agora as duas produzem o mesmo resultado
 * computado. **Quando o valor é dinheiro, componha um `MoneyDisplay` dentro** —
 * é ele que sabe formatar, sinalizar e tingir de entrada ou saída —, com o
 * degrau que casa: `2xl` no cartão `md`, `xl` no `sm`. Quando não é dinheiro
 * ("3 atrasos", "12 transações"), o texto cru já sai na figura certa.
 *
 * O corpo vem de `--stat-card-value`, declarado pelo `size` do cartão, e não de
 * um `text-2xl` cravado: é a mesma mecânica de `--card-strip-py` e
 * `--accordion-px`, e é o que faz o esqueleto acompanhar sem repetir a medida.
 */
function StatCardValue({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-card-value"
      className={cn(
        // `.nums` e não `tabular-nums` cru: a utility existe, e é o que o resto
        // do sistema escreve.
        "nums font-mono font-semibold text-foreground",
        "text-(length:--stat-card-value)",
        className
      )}
      {...props}
    />
  )
}

/**
 * A variação, e por que ela não deduz o tom do sinal.
 *
 * **Em finanças a direção não determina se é boa notícia.** Despesa caindo é
 * bom; entrada caindo é ruim. Um componente que pintasse de verde tudo que sobe
 * mentiria em metade dos cartões deste app — então `direction` desenha a seta e
 * `tone` continua sendo escolha de quem chama.
 *
 * O neutro se chama `default`, como no `StatCard` e em todo componente com
 * `tone`. Ele era `neutral` **só aqui** — e o comentário no topo deste mesmo
 * arquivo já dizia que renomear tinha sido feito justamente porque "trocar de
 * componente exigia reabrir o fonte para lembrar qual das duas palavras valia".
 * O arquivo contradizia o próprio comentário; nenhuma tela usava o delta, então
 * corrigir custou nada.
 */
const statCardDeltaVariants = cva(
  "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium nums [&_svg]:size-3",
  {
    variants: {
      tone: {
        default: "bg-muted text-muted-foreground",
        income:
          "bg-income-muted text-income-muted-foreground dark:bg-income-muted/60",
        expense:
          "bg-expense-muted text-expense-muted-foreground dark:bg-expense-muted/60",
        warning:
          "bg-warning-muted text-warning-muted-foreground dark:bg-warning-muted/60",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  }
)

function StatCardDelta({
  className,
  tone,
  direction = "none",
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof statCardDeltaVariants> & {
    direction?: "up" | "down" | "none"
  }) {
  return (
    <div
      data-slot="stat-card-delta"
      data-tone={tone ?? "default"}
      data-direction={direction}
      className={cn(statCardDeltaVariants({ tone }), className)}
      {...props}
    >
      {direction === "up" ? <ArrowUpIcon aria-hidden /> : null}
      {direction === "down" ? <ArrowDownIcon aria-hidden /> : null}
      {children}
    </div>
  )
}

/**
 * O esqueleto na medida do valor.
 *
 * Um cartão de número é *a* coisa que espera dado, e sem isto cada tela
 * inventava a própria espera. A altura sai de `--stat-card-value`, então ela
 * acompanha o `size` do cartão em vez de ser uma medida chutada em pixels.
 */
function StatCardValueSkeleton({
  className,
  ...props
}: React.ComponentProps<typeof Skeleton>) {
  return (
    <Skeleton
      data-slot="stat-card-value-skeleton"
      className={cn(
        "h-[calc(var(--stat-card-value)*1.2)] w-24 rounded-md",
        className
      )}
      {...props}
    />
  )
}

export {
  StatCard,
  StatCardDelta,
  StatCardIcon,
  StatCardLabel,
  StatCardValue,
  StatCardValueSkeleton,
  statCardVariants,
}
