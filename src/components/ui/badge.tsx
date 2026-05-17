import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent text-center font-medium leading-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        primary:
          "bg-info-muted text-info-muted-foreground hover:bg-info-muted/80",
        secondary: "bg-muted text-muted-foreground hover:bg-muted/80",
        destructive:
          "bg-destructive-muted text-destructive-muted-foreground hover:bg-destructive-muted/80",
        outline:
          "border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground",
        success:
          "bg-success-muted text-success-muted-foreground hover:bg-success-muted/80",
        warning:
          "bg-warning-muted text-warning-muted-foreground hover:bg-warning-muted/80",
        income:
          "bg-income-muted text-income-muted-foreground hover:bg-income-muted/80",
        expense:
          "bg-expense-muted text-expense-muted-foreground hover:bg-expense-muted/80",
      },
      size: {
        xs: "px-2 py-0.5 text-[10px]",
        sm: "px-2 py-0.5 text-xs",
        default: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
