import { cn } from "@/lib/utils"

/**
 * Chip surfaces use design tokens (`success`, `warning`, `info`, `destructive`, `muted`)
 * so light/dark and brand updates stay consistent.
 */

/** Success / completed — tonal surface + readable foreground. */
export const tagChipSuccess =
  "bg-success-muted text-success-muted-foreground hover:bg-success-muted/80 dark:hover:bg-success-muted/60"

/** Danger / cancelled — generic destructive palette. */
export const tagChipDanger =
  "bg-destructive-muted text-destructive-muted-foreground hover:bg-destructive-muted/80 dark:hover:bg-destructive-muted/60"

/** Receita (finance) — income tokens; stronger than generic success chips. */
export const tagChipIncome =
  "bg-income-muted text-income-muted-foreground hover:bg-income-muted/80 dark:hover:bg-income-muted/60"

/** Despesa (finance) — expense tokens; stronger than generic destructive chips. */
export const tagChipExpense =
  "bg-expense-muted text-expense-muted-foreground hover:bg-expense-muted/80 dark:hover:bg-expense-muted/60"

/** Neutral / pending (cool). */
export const tagChipNeutral =
  "bg-muted text-muted-foreground hover:bg-muted/80 dark:hover:bg-muted/60"

/** Warning / pending (warm). */
export const tagChipWarning =
  "bg-warning-muted text-warning-muted-foreground hover:bg-warning-muted/80 dark:hover:bg-warning-muted/60"

/** Info / brand (blue). */
export const tagChipInfo =
  "bg-info-muted text-info-muted-foreground hover:bg-info-muted/80 dark:hover:bg-info-muted/60"

export const tagChipViolet =
  "bg-info-muted/80 text-info-muted-foreground hover:bg-info-muted dark:hover:bg-info-muted"

export const tagChipSky =
  "bg-info-muted text-info-muted-foreground hover:bg-info-muted/80 dark:hover:bg-info-muted/60"

/** Compact count on icon (no hover). */
export const tagChipUnreadCount =
  "bg-success-muted text-success-muted-foreground dark:bg-success-muted/70"

/** Activity filter chip — selected (tonal, not solid fill). */
export const tagChipFilterSelected = cn(
  "bg-success-muted text-success-muted-foreground ring-1 ring-success/25 dark:ring-success/40"
)

/** Activity filter chip — idle. */
export const tagChipFilterIdle =
  "bg-muted text-muted-foreground hover:bg-muted/80 dark:hover:bg-muted/60"

/** Outline trigger when a date range is active (success palette). */
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
 * Shared geometry for transaction row chips and the same visual in payment
 * previews (height, pill, typography).
 */
export const transactionRowChipShell =
  "inline-flex h-5 shrink-0 items-center justify-center rounded-full border-0 px-2 text-[10px] font-semibold leading-none transition-colors"

/** Receita — transactions table "Tipo" column. */
export const transactionIncomeTypeRowChip = cn(
  transactionRowChipShell,
  tagChipIncome
)

/** Despesa — transactions table "Tipo" column. */
export const transactionExpenseTypeRowChip = cn(
  transactionRowChipShell,
  tagChipExpense
)

/**
 * "Parcelada" row chip — same layout as other row chips; warning palette to
 * match installment chips in the payments calendar.
 */
export const transactionParceladaRowChip = cn(
  transactionRowChipShell,
  tagChipWarning
)

export const tagChipIncomeIconColor = "text-income-muted-foreground"
export const tagChipExpenseIconColor = "text-expense-muted-foreground"
