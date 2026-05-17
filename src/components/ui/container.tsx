import * as React from "react"

import { cn } from "@/lib/utils"

const containerSizes = {
  sm: "max-w-2xl",
  default: "max-w-5xl",
  lg: "max-w-7xl",
  full: "max-w-none",
} as const

function Container({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & {
  size?: keyof typeof containerSizes
}) {
  return (
    <div
      data-slot="container"
      data-size={size}
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        containerSizes[size],
        className
      )}
      {...props}
    />
  )
}

export { Container, containerSizes }
