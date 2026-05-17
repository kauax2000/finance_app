"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const statCardVariants = cva(
  "group/stat-card flex flex-col gap-2 rounded-xl border border-border/80 bg-card p-4 text-card-foreground shadow-xs ring-1 ring-foreground/5",
  {
    variants: {
      tone: {
        neutral: "",
        income: "border-income/25 bg-income-muted/40 dark:bg-income-muted/25",
        expense: "border-expense/20 bg-expense-muted/50 dark:bg-expense-muted/30",
        warning: "border-warning/25 bg-warning-muted/50 dark:bg-warning-muted/30",
        info: "border-info/25 bg-info-muted/50 dark:bg-info-muted/30",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

function StatCard({
  className,
  tone,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof statCardVariants>) {
  return (
    <div
      data-slot="stat-card"
      data-tone={tone ?? "neutral"}
      className={cn(statCardVariants({ tone }), className)}
      {...props}
    />
  )
}

function StatCardLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
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

function StatCardValue({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-card-value"
      className={cn(
        "font-mono text-2xl font-semibold tracking-tight text-foreground tabular-nums",
        className
      )}
      {...props}
    />
  )
}

function StatCardDelta({
  className,
  tone = "neutral",
  ...props
}: React.ComponentProps<"div"> & {
  tone?: "neutral" | "income" | "expense" | "warning"
}) {
  return (
    <div
      data-slot="stat-card-delta"
      data-delta-tone={tone}
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        tone === "income" &&
          "bg-income-muted text-income-muted-foreground dark:bg-income-muted/60",
        tone === "expense" &&
          "bg-expense-muted text-expense-muted-foreground dark:bg-expense-muted/60",
        tone === "warning" &&
          "bg-warning-muted text-warning-muted-foreground dark:bg-warning-muted/60",
        tone === "neutral" && "bg-muted text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { StatCard, StatCardDelta, StatCardLabel, StatCardValue, statCardVariants }
