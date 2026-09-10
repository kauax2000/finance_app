import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * **A superfície tonal, e ela mora aqui.**
 *
 * Estas constantes viviam em `lib/tag-chip-classes.ts`, e as tintas `soft` do
 * `Badge` eram uma segunda cópia das mesmas sete strings — já divergente: o
 * `Badge` não tinha o par `dark:hover:`. Hoje as tintas abaixo leem daqui, e a
 * tela que precisa da superfície **fora** do componente (gatilho de menu, botão
 * de filtro, pílula de linha de tabela) importa as mesmas constantes do mesmo
 * arquivo. Os nomes ficaram, para a mudança nas telas ser só de caminho.
 */

/** Concluído, pago, ativo. */
export const tagChipSuccess =
  "bg-success-muted text-success-muted-foreground hover:bg-success-muted/80 dark:hover:bg-success-muted/60"

/** Atrasado, cancelado, falhou. */
export const tagChipDanger =
  "bg-destructive-muted text-destructive-muted-foreground hover:bg-destructive-muted/80 dark:hover:bg-destructive-muted/60"

/** Receita — os tokens de dinheiro, mais saturados que os de status. */
export const tagChipIncome =
  "bg-income-muted text-income-muted-foreground hover:bg-income-muted/80 dark:hover:bg-income-muted/60"

/** Despesa — os tokens de dinheiro, mais saturados que os de status. */
export const tagChipExpense =
  "bg-expense-muted text-expense-muted-foreground hover:bg-expense-muted/80 dark:hover:bg-expense-muted/60"

/** Pendente, rascunho, sem estado. */
export const tagChipNeutral =
  "bg-muted text-muted-foreground hover:bg-muted/80 dark:hover:bg-muted/60"

/** Vence hoje, perto do limite. */
export const tagChipWarning =
  "bg-warning-muted text-warning-muted-foreground hover:bg-warning-muted/80 dark:hover:bg-warning-muted/60"

/** Informativo, em análise. */
export const tagChipInfo =
  "bg-info-muted text-info-muted-foreground hover:bg-info-muted/80 dark:hover:bg-info-muted/60"

/** Só o `Badge` usa: a marca em tinta suave não tem chip fora dele. */
const tagChipPrimary =
  "bg-primary-muted text-primary-muted-foreground hover:bg-primary-muted/80 dark:hover:bg-primary-muted/60"

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
  "bg-success-muted text-success-muted-foreground ring-1 ring-success/25 dark:ring-success/40"

/** Chip de filtro disponível. */
export const tagChipFilterIdle = tagChipNeutral

/** Gatilho de menu com período ativo, na paleta de success. */
export const tagChipSuccessMenuTrigger = cn(
  tagChipSuccess,
  "border-0 shadow-none hover:border-0",
  "aria-expanded:border-0 aria-expanded:bg-success-muted/90 aria-expanded:text-success-muted-foreground",
  "data-[state=open]:border-0 data-[state=open]:bg-success-muted/90 data-[state=open]:text-success-muted-foreground",
  "dark:border-0 dark:hover:border-0",
  "dark:aria-expanded:bg-success-muted dark:aria-expanded:text-success-foreground",
  "dark:data-[state=open]:bg-success-muted dark:data-[state=open]:text-success-foreground"
)

/**
 * A pílula de linha do extrato e da prévia de pagamento. `text-[10px]` não é
 * degrau do `Badge` (o `xs` é 11px), e trocar mudaria pixel em cinco telas —
 * fica registrado em vez de convertido.
 */
export const transactionRowChipShell =
  "inline-flex h-5 shrink-0 items-center justify-center rounded-full border-0 px-2 text-[10px] font-semibold leading-none transition-colors"

/** Receita — coluna "Tipo" da tabela de transações. */
export const transactionIncomeTypeRowChip = cn(transactionRowChipShell, tagChipIncome)

/** Despesa — coluna "Tipo" da tabela de transações. */
export const transactionExpenseTypeRowChip = cn(transactionRowChipShell, tagChipExpense)

/** "Parcelada" — a paleta de warning, a mesma do calendário de pagamentos. */
export const transactionParceladaRowChip = cn(transactionRowChipShell, tagChipWarning)

export const tagChipIncomeIconColor = "text-income-muted-foreground"
export const tagChipExpenseIconColor = "text-expense-muted-foreground"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent text-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      /**
       * A **forma**, e só ela.
       *
       * Este eixo carregava três coisas ao mesmo tempo: peso (`primary`,
       * `secondary`), forma (`outline`) e **tom** (`success`, `warning`,
       * `income`, `expense`). Tom é o que `Alert`, `StatCard`, `Timeline`,
       * `Progress`, `Separator` e `AnnouncementBar` chamam de `tone` — o
       * `Badge` era o único a discordar, que é palavra por palavra a correção
       * que a rodada do `Alert` já tinha feito quando ele era o único.
       *
       * Com os dois eixos separados, uma combinação que antes não existia
       * passa a existir: contorno **na cor do tom**. Antes, `outline` só sabia
       * ser cinza.
       */
      variant: {
        // Vazio: a base já declara `border border-transparent`, então o valor
        // que morava aqui era a mesma classe escrita duas vezes.
        soft: "",
        outline: "bg-transparent",
      },
      /**
       * A **cor**, com o mesmo nome e os mesmos valores do resto do sistema.
       *
       * `primary` é a marca em tinta suave. Ela rendia `bg-info-muted`, ou seja
       * **azul**, num sistema em que `primary` é o verde em todo o resto —
       * medido, 4/44/67 em RGB. O par `--primary-muted` foi criado para isto.
       */
      tone: {
        primary: "",
        neutral: "",
        success: "",
        warning: "",
        destructive: "",
        income: "",
        expense: "",
      },
      // Cada degrau tem entrelinha própria porque é ela, não o padding, que
      // manda na altura de um rótulo desta escala: `leading-tight` na base
      // resolvia para 16px tanto no texto de 11px quanto no de 12px, e por isso
      // `xs` e `sm` saíam com a mesma altura — três nomes, duas alturas.
      //
      // Altura = entrelinha + 2×py + 2 (a borda transparente da base, que fica
      // para o `outline` ter contorno sem mudar a geometria dos outros).
      //
      // `default` saiu do tipo: o nome dizia *o padrão* em vez de dizer a
      // medida, e é o mesmo que já saiu de `Button`, `Input`, `SelectTrigger`,
      // `NativeSelect` e `Container`.
      size: {
        xs: "px-1.5 py-0 text-2xs leading-3",
        sm: "px-2 py-0 text-xs leading-4",
        md: "px-2.5 py-0.5 text-xs leading-4",
      },
    },
    /**
     * A tinta sai do cruzamento dos dois eixos.
     *
     * `soft` preenche com a tinta suave do tom — **as mesmas constantes** que as
     * telas usam fora do componente, declaradas no topo; `outline` desenha o
     * contorno e o texto **na cor do tom**, sem preencher. É por isso que os
     * valores de `tone` acima são vazios: sozinho, um tom não sabe se pinta
     * fundo ou borda.
     */
    compoundVariants: [
      { variant: "soft", tone: "primary", class: tagChipPrimary },
      { variant: "soft", tone: "neutral", class: tagChipNeutral },
      { variant: "soft", tone: "success", class: tagChipSuccess },
      { variant: "soft", tone: "warning", class: tagChipWarning },
      { variant: "soft", tone: "destructive", class: tagChipDanger },
      { variant: "soft", tone: "income", class: tagChipIncome },
      { variant: "soft", tone: "expense", class: tagChipExpense },

      { variant: "outline", tone: "primary", class: "border-primary-accent/40 text-primary-accent hover:bg-primary-muted/40" },
      { variant: "outline", tone: "neutral", class: "border-border text-foreground hover:bg-muted" },
      { variant: "outline", tone: "success", class: "border-success/40 text-success-muted-foreground hover:bg-success-muted/40" },
      { variant: "outline", tone: "warning", class: "border-warning/40 text-warning-muted-foreground hover:bg-warning-muted/40" },
      { variant: "outline", tone: "destructive", class: "border-destructive/40 text-destructive-muted-foreground hover:bg-destructive-muted/40" },
      { variant: "outline", tone: "income", class: "border-income/40 text-income-muted-foreground hover:bg-income-muted/40" },
      { variant: "outline", tone: "expense", class: "border-expense/40 text-expense-muted-foreground hover:bg-expense-muted/40" },
    ],
    defaultVariants: {
      variant: "soft",
      tone: "primary",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, tone, size, ...props }: BadgeProps) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant, tone, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
