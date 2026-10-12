import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * O título que nomeia o menu — do `DropdownMenu` e do `ContextMenu`.
 *
 * O conteúdo guarda o `id` num estado e o publica por este contexto em volta
 * da faixa de cima; o cabeçalho com `title` se registra, e o conteúdo aponta
 * `aria-labelledby` para ele só enquanto ele existe — apontar para um `id`
 * ausente deixaria o nome vazio.
 */
export const MenuTitleContext = React.createContext<
  ((id: string | null) => void) | null
>(null)

/** O `id` do título, registrado no menu enquanto `ativo`. */
export function useMenuTitleId(ativo = true) {
  const id = React.useId()
  const registrar = React.useContext(MenuTitleContext)
  React.useEffect(() => {
    if (!ativo) return
    registrar?.(id)
    return () => registrar?.(null)
  }, [registrar, id, ativo])
  return id
}

/**
 * A faixa do alvo: o nome e uma legenda. Título sobre legenda é par de
 * identidade — sem `gap`. `slot` é o `data-slot` de cada menu.
 */
export function MenuTitleHeader({
  slot,
  titleId,
  className,
  title,
  description,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  slot: string
  titleId: string
  title: React.ReactNode
  description?: React.ReactNode
}) {
  return (
    <div
      data-slot={slot}
      className={cn("flex min-w-0 flex-col px-3 py-2 text-sm", className)}
      {...props}
    >
      <span id={titleId} className="truncate font-medium">
        {title}
      </span>
      {description ? (
        <span className="truncate text-xs text-muted-foreground nums">
          {description}
        </span>
      ) : null}
    </div>
  )
}
