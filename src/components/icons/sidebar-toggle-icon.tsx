import type { SVGProps } from "react"

/**
 * O ícone da barra lateral: um painel com a coluna da esquerda separada.
 *
 * Desenho próprio, por decisão do dono — o Heroicons não tem o pictograma de
 * "barra lateral", e é por isso que este arquivo está em `DRAWN_SVG_FILES` no
 * auditor. Ele fala a grade do conjunto `16/solid` (viewBox 16, preenchido) e
 * pinta com `currentColor`, então veste a tinta e o `size-4` de quem o contém,
 * como qualquer Heroicon.
 */
export function SidebarToggleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      data-slot="icon"
      {...props}
    >
      <path d="M11 2C12.6569 2 14 3.34315 14 5V11C14 12.6569 12.6569 14 11 14H5C3.34315 14 2 12.6569 2 11V5C2 3.34315 3.34315 2 5 2H11ZM5 3.5C4.17157 3.5 3.5 4.17157 3.5 5V11C3.5 11.8284 4.17157 12.5 5 12.5H5.75V3.5H5ZM7.25 12.5H11C11.8284 12.5 12.5 11.8284 12.5 11V5C12.5 4.17157 11.8284 3.5 11 3.5H7.25V12.5Z" />
    </svg>
  )
}
