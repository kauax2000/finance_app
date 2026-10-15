"use client"

import * as React from "react"
import { EllipsisHorizontalIcon } from "@heroicons/react/16/solid"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/** O que saiu da fileira para o ⋯: o nome, o ícone (se houver) e o que fazer. */
export type ItemNoExcesso = {
  key: string
  label: string
  icone?: SVGElement | null
  onSelect: () => void
}

/**
 * O ⋯ do que não coube na fileira — o mesmo no `Tabs`, na `ToolbarActions` e
 * no `PageHeaderActions`. Quem decide quem sai é o `quemSai` de
 * `lib/overflow`; aqui mora só o menu. O gatilho leva `data-overflow-more`,
 * que é o que a medição pula ao ler os vizinhos.
 */
export function OverflowMenu({
  items,
  label,
  align = "end",
  size = "icon-lg",
}: {
  items: ItemNoExcesso[]
  label: string
  align?: "start" | "end"
  /** O degrau do ⋯ na escada de ícone do `Button` — o `Tabs` passa o da aba. */
  size?: "icon-xs" | "icon-sm" | "icon-md" | "icon-lg"
}) {
  return (
    <DropdownMenu mobile="sheet">
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size={size} data-overflow-more="" aria-label={label}>
          <EllipsisHorizontalIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} size="lg">
        {items.map((f) => (
          <DropdownMenuItem key={f.key} onSelect={f.onSelect}>
            {f.icone ? <IconeCopiado svg={f.icone} /> : null}
            {f.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * O ícone do botão escondido, no item do ⋯: uma cópia do `svg` dele, então o
 * menu mostra o mesmo desenho sem a tela declarar o ícone duas vezes. O corpo
 * é o da linha do menu, que dimensiona o `svg`.
 */
function IconeCopiado({ svg }: { svg: SVGElement }) {
  return (
    <span
      aria-hidden
      className="flex shrink-0"
      ref={(no) => {
        if (no && !no.firstChild) no.append(svg.cloneNode(true))
      }}
    />
  )
}
