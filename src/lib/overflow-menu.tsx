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
 * no `PageHeaderActions` (rodada 252). Quem decide quem sai é o `quemSai` de
 * `lib/overflow`; aqui mora só o menu. O gatilho leva `data-overflow-more`,
 * que é o que a medição pula ao ler os vizinhos.
 */
export function OverflowMenu({
  items,
  label,
  align = "end",
}: {
  items: ItemNoExcesso[]
  label: string
  align?: "start" | "end"
}) {
  return (
    <DropdownMenu mobile="sheet">
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="icon-md" data-overflow-more="" aria-label={label}>
          <EllipsisHorizontalIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} size="lg">
        {items.map((f) => (
          <DropdownMenuItem key={f.key} onSelect={f.onSelect}>
            {f.icone ? <IconeCopiado svg={f.icone} /> : null}
            {maiuscula(f.label)}
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

/** A maiúscula inicial que o `Button` dá ao rótulo (`::first-letter`) e o item de menu não. */
const maiuscula = (t: string) => t.charAt(0).toLocaleUpperCase("pt-BR") + t.slice(1)
