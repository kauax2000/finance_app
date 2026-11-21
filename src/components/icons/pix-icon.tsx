import type { SVGProps } from "react"

/**
 * O símbolo do PIX: o losango de quatro pétalas.
 *
 * É uma marca, e não um ícone: o Heroicons não a tem, e é por isso que este
 * arquivo está em `DRAWN_SVG_FILES` no auditor, como as bandeiras de cartão.
 * Pinta com `currentColor`, então veste a tinta e o tamanho de quem o contém.
 */
export function PixIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      data-slot="icon"
      {...props}
    >
      <path d="M12 2.6c.6 0 1.1.2 1.5.6l2.9 2.9h-.6c-.8 0-1.6.3-2.2.9L12 8.6l-1.6-1.6c-.6-.6-1.4-.9-2.2-.9h-.6l2.9-2.9c.4-.4.9-.6 1.5-.6Zm-6.4 4.9h2.6c.4 0 .8.2 1.1.5l1.8 1.8c.5.5 1.3.5 1.8 0L14.7 8c.3-.3.7-.5 1.1-.5h2.6l2 2c.8.8.8 2.2 0 3l-2 2h-2.6c-.4 0-.8-.2-1.1-.5l-1.8-1.8c-.5-.5-1.3-.5-1.8 0L9.3 14c-.3.3-.7.5-1.1.5H5.6l-2-2c-.8-.8-.8-2.2 0-3l2-2Zm2 9.9h.6c.8 0 1.6-.3 2.2-.9l1.6-1.6 1.6 1.6c.6.6 1.4.9 2.2.9h.6l-2.9 2.9c-.8.8-2.2.8-3 0l-2.9-2.9Z" />
    </svg>
  )
}
