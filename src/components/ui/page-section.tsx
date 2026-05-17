import * as React from "react"

import { cn } from "@/lib/utils"

function PageSection({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="page-section"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function PageSectionHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-section-header"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
}

function PageSectionTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="page-section-title"
      className={cn(
        "font-heading text-base font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function PageSectionDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="page-section-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function PageSectionContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div data-slot="page-section-content" className={cn("", className)} {...props} />
  )
}

export {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
}
