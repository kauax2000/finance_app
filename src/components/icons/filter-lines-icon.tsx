import type { SVGProps } from "react"

/**
 * O filtro do iOS: três linhas que encurtam de cima para baixo
 * (`line.3.horizontal.decrease`).
 *
 * Desenho próprio, por decisão do dono (15/11/2026) — o Heroicons não tem esse
 * pictograma, e é por isso que este arquivo está em `DRAWN_SVG_FILES` no
 * auditor. Fala a grade do `16/solid` (viewBox 16, preenchido) e pinta com
 * `currentColor`, então veste a tinta e o `size-4` de quem o contém.
 */
export function FilterLinesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      data-slot="icon"
      {...props}
    >
      <path d="M2.75 3.5h10.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5ZM4.75 7.25h6.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5ZM6.75 11h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1 0-1.5Z" />
    </svg>
  )
}
