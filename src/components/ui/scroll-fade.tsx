"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Área rolável cujas bordas desaparecem em gradiente enquanto há mais conteúdo.
 *
 * Resolve o problema de saber que a lista continua: uma lista cortada em seco na
 * borda de um cartão lê como lista terminada. Os gradientes aparecem só do lado
 * em que ainda há conteúdo, então quando tudo cabe eles não aparecem nunca.
 *
 * `pointer-events-none` nas máscaras é o que impede que elas comam o clique dos
 * itens que ficam debaixo delas.
 */
function ScrollFade({
  className,
  viewportClassName,
  orientation = "vertical",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  orientation?: "vertical" | "horizontal"
  viewportClassName?: string
}) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = React.useState(true)
  const [atEnd, setAtEnd] = React.useState(true)

  const sync = React.useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    const [pos, size, client] =
      orientation === "vertical"
        ? [el.scrollTop, el.scrollHeight, el.clientHeight]
        : [el.scrollLeft, el.scrollWidth, el.clientWidth]
    setAtStart(pos <= 1)
    // 1px de folga: alturas fracionárias nunca fecham a conta exatamente.
    setAtEnd(pos + client >= size - 1)
  }, [orientation])

  React.useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    for (const child of Array.from(el.children)) observer.observe(child)
    return () => observer.disconnect()
  }, [sync])

  const isVertical = orientation === "vertical"

  return (
    <div
      data-slot="scroll-fade"
      data-orientation={orientation}
      className={cn("relative min-h-0", className)}
      {...props}
    >
      <div
        ref={viewportRef}
        onScroll={sync}
        className={cn(
          "min-h-0 overscroll-contain",
          isVertical
            ? "h-full touch-pan-y overflow-y-auto"
            : "touch-pan-x overflow-x-auto",
          viewportClassName
        )}
      >
        {children}
      </div>
      <span
        aria-hidden
        data-visible={atStart ? undefined : ""}
        className={cn(
          "pointer-events-none absolute opacity-0 transition-opacity duration-(--duration-fast) data-visible:opacity-100",
          isVertical
            ? "inset-x-0 top-0 h-6 bg-gradient-to-b from-card to-transparent"
            : "inset-y-0 left-0 w-6 bg-gradient-to-r from-card to-transparent"
        )}
      />
      <span
        aria-hidden
        data-visible={atEnd ? undefined : ""}
        className={cn(
          "pointer-events-none absolute opacity-0 transition-opacity duration-(--duration-fast) data-visible:opacity-100",
          isVertical
            ? "inset-x-0 bottom-0 h-6 bg-gradient-to-t from-card to-transparent"
            : "inset-y-0 right-0 w-6 bg-gradient-to-l from-card to-transparent"
        )}
      />
    </div>
  )
}

export { ScrollFade }
