import * as React from "react"

import { cn } from "@/lib/utils"
import { Muted } from "@/components/ui/typography"
import { scrollFadeViewportXClassName } from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      ref={useScrollFade({ axis: "x" })}
      data-slot="table-viewport"
      className={cn(
        "relative w-full overflow-x-auto",
        "overscroll-x-contain [-webkit-overflow-scrolling:touch]",
        "[scrollbar-gutter:stable]",
        // A dissolução lateral diz que **há mais coluna**, e substitui o
        // "Arraste para ver mais →" que a tela de transações escrevia à mão.
        // A barra fica: as duas dizem coisas diferentes — a barra, onde você
        // está; a dissolução, que continua.
        //
        // Este nó pode ser mascarado direto porque ele não desenha nada. Quem
        // pinta é a `<table>` de dentro.
        //
        // A distância aqui é `--scroll-fade-x-h` (32) e não os 44 do eixo
        // vertical: uma célula mede ~100px, e 44 dissolveria quase metade de
        // uma coluna.
        scrollFadeViewportXClassName
      )}
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border transition-colors hover:bg-muted/50 active:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
        className={cn(
        "h-8 px-2.5 text-left align-middle text-xs font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
        className={cn(
        "px-2.5 py-2 align-middle text-sm [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <Muted asChild data-slot="table-caption" className={cn("mt-4", className)}>
      <caption {...props} />
    </Muted>
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
