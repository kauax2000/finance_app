"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressIndicatorVariants = cva("h-full transition-[width] duration-300 ease-out", {
  variants: {
    tone: {
      default: "bg-primary",
      success: "bg-success",
      warning: "bg-warning",
      destructive: "bg-destructive",
    },
  },
  defaultVariants: {
    tone: "default",
  },
})

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> &
  VariantProps<typeof progressIndicatorVariants> & {
    max?: number
  }

function Progress({
  className,
  value,
  max = 100,
  tone,
  ...props
}: ProgressProps) {
  const pct =
    value != null && max > 0
      ? Math.min(100, Math.max(0, (value / max) * 100))
      : 0

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-tone={tone ?? "default"}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      value={value}
      max={max}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(progressIndicatorVariants({ tone }))}
        style={{ width: `${pct}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress, progressIndicatorVariants, type ProgressProps }
