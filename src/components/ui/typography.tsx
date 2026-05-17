import * as React from "react"

import { cn } from "@/lib/utils"

function H1({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="typography-h1"
      className={cn(
        "font-heading scroll-m-20 text-3xl font-bold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function H2({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="typography-h2"
      className={cn(
        "font-heading scroll-m-20 border-b border-border pb-2 text-2xl font-semibold tracking-tight text-foreground first:mt-0",
        className
      )}
      {...props}
    />
  )
}

function H3({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="typography-h3"
      className={cn(
        "font-heading scroll-m-20 text-xl font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function H4({ className, ...props }: React.ComponentProps<"h4">) {
  return (
    <h4
      data-slot="typography-h4"
      className={cn(
        "font-heading scroll-m-20 text-lg font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function Lead({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="typography-lead"
      className={cn("text-lg text-muted-foreground", className)}
      {...props}
    />
  )
}

function P({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="typography-p"
      className={cn("text-sm leading-relaxed text-foreground", className)}
      {...props}
    />
  )
}

function Muted({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="typography-muted"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function Small({ className, ...props }: React.ComponentProps<"small">) {
  return (
    <small
      data-slot="typography-small"
      className={cn("text-xs font-medium leading-none text-foreground", className)}
      {...props}
    />
  )
}

function Caption({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="typography-caption"
      className={cn("text-xs leading-snug text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Caption, H1, H2, H3, H4, Lead, Muted, P, Small }
