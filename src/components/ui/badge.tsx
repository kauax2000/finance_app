"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { useBrandGlow } from "@/hooks/use-brand-glow"
import { cn } from "@/lib/utils"

/**
 * A superfície tonal mora aqui: as tintas `soft` do `Badge` e as telas que
 * precisam da superfície fora do componente (gatilho de menu, botão de filtro,
 * pílula de linha de tabela) leem as mesmas constantes.
 */

/** Concluído, pago, ativo. */
export const tagChipSuccess =
  "bg-success-muted text-success-muted-foreground"

/** Atrasado, cancelado, falhou. */
export const tagChipDanger =
  "bg-destructive-muted text-destructive-muted-foreground"

/** Receita — os tokens de dinheiro, mais saturados que os de status. */
export const tagChipIncome =
  "bg-income-muted text-income-muted-foreground"

/** Despesa — os tokens de dinheiro, mais saturados que os de status. */
export const tagChipExpense =
  "bg-expense-muted text-expense-muted-foreground"

/** Pendente, rascunho, sem estado. */
export const tagChipNeutral =
  "bg-muted text-muted-foreground"

/** Vence hoje, perto do limite. */
export const tagChipWarning =
  "bg-warning-muted text-warning-muted-foreground"

/** Informativo, em análise. */
export const tagChipInfo =
  "bg-info-muted text-info-muted-foreground"

/** Só o `Badge` usa: a marca em tinta suave não tem chip fora dele. */
const tagChipPrimary =
  "bg-primary-muted text-primary-muted-foreground"

/** Apelido de `info`, do tempo em que a tela escolhia o tom. Não use em código novo. */
export const tagChipViolet =
  "bg-info-muted/80 text-info-muted-foreground hover:bg-info-muted dark:hover:bg-info-muted"

/** Apelido de `info`, idêntico a ele. Não use em código novo. */
export const tagChipSky = tagChipInfo

/** Contagem sobre um ícone. Sem hover, porque não é clicável. */
export const tagChipUnreadCount =
  "bg-success-muted text-success-muted-foreground dark:bg-success-muted/70"

/** Chip de filtro selecionado — tonal, não preenchido. */
export const tagChipFilterSelected =
  "bg-primary-muted text-primary-muted-foreground ring-1 ring-primary-accent/25 dark:ring-primary-accent/40"

/** Chip de filtro disponível. */
export const tagChipFilterIdle = tagChipNeutral

/**
 * A pílula de linha do extrato e da prévia de pagamento. `text-[10px]` não é
 * degrau do `Badge` (o `xs` é 11px); fica registrado em vez de convertido.
 */
export const transactionRowChipShell =
  "inline-flex h-5 shrink-0 items-center justify-center rounded-full border-0 px-2 text-[10px] font-semibold leading-none transition-colors"

/** Receita — coluna "Tipo" da tabela de transações. */
export const transactionIncomeTypeRowChip = cn(transactionRowChipShell, tagChipIncome)

/** Despesa — coluna "Tipo" da tabela de transações. */
export const transactionExpenseTypeRowChip = cn(transactionRowChipShell, tagChipExpense)

/** "Parcelada" — a paleta de warning, a mesma do calendário de pagamentos. */
export const transactionParceladaRowChip = cn(transactionRowChipShell, tagChipWarning)

const badgeVariants = cva(
  // `gap-1` é seguro na base: sem segundo filho ele não pinta, e quem declara
  // `gap-1.5` vence no `tailwind-merge`. O corpo do glifo desce por degrau;
  // `:not([class*='size-'])` (a trava de `Button`, `Select`, `Tabs`) deixa quem
  // passa um corpo explícito mandar nele.
  "inline-flex items-center justify-center gap-1 rounded-full border border-transparent text-center font-medium transition-colors focus:outline-none focus-visible:ring-3 focus-visible:ring-ring/45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      /**
       * A forma, e só ela; a cor é o `tone` (o nome do `Alert`, `StatCard` e
       * `Progress`). Combinados, `outline` desenha contorno na cor do tom.
       */
      variant: {
        // Vazio: a base já declara `border border-transparent`.
        soft: "",
        outline: "bg-transparent",
        // Pílula grave, escura nos dois temas (não inverte): `--primary` no
        // claro e `--secondary` no escuro, sem token novo. O `tone` não pinta a
        // superfície, só o dot.
        contrast:
          "bg-primary text-primary-foreground dark:bg-secondary dark:text-secondary-foreground",
        // Em repouso é um chip neutro (`muted`, fio do sistema); o arco-íris
        // acende num arco da borda perto do ponteiro. A máscara recorta só o
        // anel; `brand-rainbow-image` declara `--brand-rainbow` no elemento e
        // `isolate` impede o pseudo de `z` negativo de cair atrás do fundo de
        // um ancestral. Intensidade cheia (`--brand-glow-opacity: 1`): num chip
        // de 22px a meia força lia como sujeira. O texto nunca pousa no
        // degradê; sem ponteiro fino não há brilho. Uma por tela.
        brand:
          "brand-rainbow-image brand-glow relative isolate border-border bg-muted text-foreground [--brand-glow-opacity:1]",
      },
      /**
       * A cor, com os nomes do resto do sistema. `primary` é a marca em tinta
       * suave. Cada tom publica `--badge-dot` (a cor cheia), que o `BadgeDot`
       * lê; a tinta sai do cruzamento com a `variant`, e por isso o dot
       * funciona igual nas quatro, inclusive na `contrast`.
       */
      tone: {
        primary: "[--badge-dot:var(--primary-accent)]",
        neutral: "[--badge-dot:var(--muted-foreground)]",
        success: "[--badge-dot:var(--success)]",
        info: "[--badge-dot:var(--info)]",
        warning: "[--badge-dot:var(--warning)]",
        destructive: "[--badge-dot:var(--destructive)]",
        income: "[--badge-dot:var(--income)]",
        expense: "[--badge-dot:var(--expense)]",
      },
      // Cada degrau tem entrelinha própria: é ela, não o padding, que manda na
      // altura de um rótulo desta escala. Altura = entrelinha + 2×py + 2 (a
      // borda transparente da base, que dá contorno ao `outline` sem mudar a
      // geometria).
      size: {
        xs: "px-1.5 py-0 text-2xs leading-3 [&_svg:not([class*='size-'])]:size-2.5",
        sm: "px-2 py-0 text-xs leading-4 [&_svg:not([class*='size-'])]:size-3",
        md: "px-2.5 py-0.5 text-xs leading-4 [&_svg:not([class*='size-'])]:size-3",
      },
    },
    /**
     * A tinta sai do cruzamento dos dois eixos: `soft` preenche com a tinta
     * suave do tom; `outline` desenha contorno e texto na cor do tom. Por isso
     * os valores de `tone` acima são vazios.
     */
    compoundVariants: [
      { variant: "soft", tone: "primary", class: tagChipPrimary },
      { variant: "soft", tone: "neutral", class: tagChipNeutral },
      { variant: "soft", tone: "success", class: tagChipSuccess },
      { variant: "soft", tone: "info", class: tagChipInfo },
      { variant: "soft", tone: "warning", class: tagChipWarning },
      { variant: "soft", tone: "destructive", class: tagChipDanger },
      { variant: "soft", tone: "income", class: tagChipIncome },
      { variant: "soft", tone: "expense", class: tagChipExpense },

      { variant: "outline", tone: "primary", class: "border-primary-accent/40 text-primary-accent" },
      { variant: "outline", tone: "neutral", class: "border-border text-foreground" },
      { variant: "outline", tone: "success", class: "border-success/40 text-success-muted-foreground" },
      { variant: "outline", tone: "info", class: "border-info/40 text-info-muted-foreground" },
      { variant: "outline", tone: "warning", class: "border-warning/40 text-warning-muted-foreground" },
      { variant: "outline", tone: "destructive", class: "border-destructive/40 text-destructive-muted-foreground" },
      { variant: "outline", tone: "income", class: "border-income/40 text-income-muted-foreground" },
      { variant: "outline", tone: "expense", class: "border-expense/40 text-expense-muted-foreground" },
    ],
    defaultVariants: {
      variant: "soft",
      tone: "primary",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * O ponto de estado, pulsando ou parado. Lê `--badge-dot`, que o `tone` do
 * `Badge` publica. É `animate-ping` e não `animate-pulse` de propósito: o bloco
 * de movimento reduzido isenta `spin` e `pulse`, e um ponto decorativo não tem
 * essa desculpa. `aria-hidden`: quem diz o estado é o texto do badge.
 */
function BadgeDot({
  pulse,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { pulse?: boolean }) {
  return (
    <span
      data-slot="badge-dot"
      aria-hidden
      className={cn("relative flex size-1.5 shrink-0", className)}
      {...props}
    >
      {pulse ? (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-(--badge-dot) opacity-75" />
      ) : null}
      <span className="relative inline-flex size-full rounded-full bg-(--badge-dot)" />
    </span>
  )
}

function Badge({ className, variant, tone, size, ...props }: BadgeProps) {
  const glowRef = useBrandGlow<HTMLSpanElement>(variant === "brand")
  return (
    // <span>, e não <div>: o chip mora dentro de parágrafo, e <div> em <p> é
    // HTML inválido.
    <span
      ref={glowRef}
      data-slot="badge"
      className={cn(badgeVariants({ variant, tone, size }), className)}
      {...props}
    />
  )
}

export { Badge, BadgeDot, badgeVariants }
