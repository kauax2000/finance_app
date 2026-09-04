"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Kbd, formatKey } from "@/components/ui/kbd"

/**
 * A sequência: teclas apertadas **uma depois da outra**, cada uma na própria
 * pastilha — o atalho de dois tempos, como o `g h` do GitHub.
 *
 * O **acorde** (`⌘K`) é outra coisa: os dedos descem juntos, e ele é uma
 * pastilha só. Mora no `Kbd`, em `keys`. Trocar um pelo outro ensina o atalho
 * errado, e é o defeito que a página do `Kbd` narra.
 *
 * ## Por que ele é molécula, e por que `keys` existe
 *
 * Ele importava **zero** componentes: os `<Kbd>` vinham de quem chamava, e uma
 * molécula que não compõe nada é o padrão fraco que este catálogo já mediu —
 * 26 das 38 moléculas importavam zero. `keys` faz a classificação virar
 * verdade: um `Kbd` por tecla, o átomo importado de fato.
 *
 * ## Por que ele é cliente, sem ter hook nenhum
 *
 * `kbd.tsx` é módulo cliente, e **todo export de um módulo cliente vira uma
 * *client reference*** quando um componente de servidor o importa — inclusive o
 * que não é componente. Sem a diretiva, o `formatKey()` abaixo seria chamado no
 * servidor e estouraria. Hoje nenhum consumidor é servidor, então isto é
 * prevenção; e ela custa zero, porque o `Kbd` que ele renderiza já arrasta o
 * limite de qualquer jeito.
 */
type KbdGroupProps = Omit<React.ComponentProps<"kbd">, "children"> &
  (
    | { keys: string[]; children?: never }
    | { keys?: undefined; children?: React.ReactNode }
  )

function KbdGroup({ keys, className, children, ...props }: KbdGroupProps) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    >
      {keys
        ? keys.map((tecla, i) => <Kbd key={i}>{formatKey(tecla)}</Kbd>)
        : children}
    </kbd>
  )
}

export { KbdGroup }
