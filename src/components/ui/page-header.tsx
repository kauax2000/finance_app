import * as React from "react"
import Link from "next/link"
import { ArrowLeftIcon } from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function PageHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
      {...props}
    />
  )
}

function PageHeaderBreadcrumb({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-breadcrumb"
      className={cn("order-first w-full sm:col-span-full", className)}
      {...props}
    />
  )
}

function PageHeaderTitleRow({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-title-row"
      className={cn("flex min-w-0 flex-1 flex-col gap-1", className)}
      {...props}
    />
  )
}

function PageHeaderTitle({
  className,
  ...props
}: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="page-header-title"
      className={cn(
        "font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl",
        className
      )}
      {...props}
    />
  )
}

function PageHeaderDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="page-header-description"
      className={cn("max-w-2xl text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function PageHeaderActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-actions"
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-2 sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

/** Compact “voltar” control for mobile page toolbars (pair with `PageHeader`). */
function PageHeaderBack({
  href,
  className,
}: {
  href: string
  className?: string
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "-ml-2 size-8 shrink-0 active:bg-accent group-active:bg-accent",
        className
      )}
      asChild
    >
      <Link href={href} aria-label="Voltar">
        <ArrowLeftIcon className="h-4 w-4" aria-hidden />
      </Link>
    </Button>
  )
}

export {
  PageHeader,
  PageHeaderActions,
  PageHeaderBack,
  PageHeaderBreadcrumb,
  PageHeaderDescription,
  PageHeaderTitle,
  PageHeaderTitleRow,
}
