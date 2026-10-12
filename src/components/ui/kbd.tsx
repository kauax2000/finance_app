"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A tecla numa dica de atalho — uma tecla (`<Kbd>Esc</Kbd>`) ou o acorde
 * inteiro (`<Kbd keys="mod+k" />`, com o símbolo da plataforma de quem lê).
 * A sequência (teclas uma depois da outra) mora no `KbdGroup`.
 */

const MODIFICADORES_APPLE: Record<string, string> = {
  mod: "⌘",
  cmd: "⌘",
  meta: "⌘",
  shift: "⇧",
  alt: "⌥",
  opt: "⌥",
  ctrl: "⌃",
  control: "⌃",
}

const MODIFICADORES_PALAVRA: Record<string, string> = {
  mod: "Ctrl",
  cmd: "Ctrl",
  meta: "Ctrl",
  shift: "Shift",
  alt: "Alt",
  opt: "Alt",
  ctrl: "Ctrl",
  control: "Ctrl",
}

const TECLAS: Record<string, string> = {
  esc: "Esc",
  escape: "Esc",
  enter: "Enter",
  return: "Enter",
  space: "Space",
  tab: "Tab",
  del: "Del",
  delete: "Del",
  backspace: "⌫",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
}

/**
 * O nome de uma tecla, escrito como numa dica: `esc` → `Esc`, `up` → `↑`.
 * Exportada porque o `KbdGroup` usa a mesma tabela; só a modificadora depende
 * de plataforma.
 */
function formatKey(parte: string): string {
  const chave = parte.trim().toLowerCase()
  return TECLAS[chave] ?? (chave.length === 1 ? chave.toUpperCase() : parte.trim())
}

/** `"mod+k"` vira `["⌘", "K"]` no Apple e `["Ctrl", "K"]` no resto. */
function formatShortcut(keys: string, apple: boolean): string[] {
  return keys.split("+").map((parte) => {
    const chave = parte.trim().toLowerCase()
    const modificador = apple
      ? MODIFICADORES_APPLE[chave]
      : MODIFICADORES_PALAVRA[chave]
    return modificador ?? formatKey(parte)
  })
}

/**
 * `null` até o cliente montar, mas só quando há um acorde a resolver: o
 * `navigator` não existe no servidor, e renderizar o palpite faria a tecla
 * piscar. Sem `keys` a tecla é igual nos dois sistemas e não espera nada.
 */
function useApplePlatform(ativo: boolean) {
  const [apple, setApple] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    if (!ativo) return
    setApple(
      /mac|iphone|ipad|ipod/i.test(
        (navigator as Navigator & { userAgentData?: { platform?: string } })
          .userAgentData?.platform || navigator.userAgent
      )
    )
  }, [ativo])

  return apple
}

type KbdProps = Omit<React.ComponentProps<"kbd">, "children"> &
  (
    | { keys: string; children?: never }
    | { keys?: undefined; children?: React.ReactNode }
  )

function Kbd({ keys, className, children, ...props }: KbdProps) {
  const apple = useApplePlatform(keys != null)
  const partes =
    keys != null && apple != null ? formatShortcut(keys, apple) : null

  // Espera só o acorde. Ver `useApplePlatform`.
  if (keys != null && partes == null) return null

  return (
    <kbd
      data-slot="kbd"
      className={cn(
        // `rounded-md`: a proporção do campo ao lado.
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-md bg-muted px-1 font-sans text-xs font-medium text-muted-foreground select-none [&_svg:not([class*='size-'])]:size-3",
        // No claro o preenchimento desce um degrau: `bg-muted` ficava mais claro
        // que o gatilho de busca (`input-fill/30`) e a pastilha sumia como
        // forma; um fio de `--border` não bastou. A tinta desce junto, senão o
        // `--muted-foreground` cairia abaixo de AA. No escuro a pastilha já se
        // destaca, e o `dark:` devolve os tokens originais. (Sem hex aqui: o
        // auditor lê comentário como código.)
        "bg-input-fill text-foreground/80 dark:bg-muted dark:text-muted-foreground",
        // A regra é a largura do glifo, não a plataforma: símbolos encostam
        // (`⌘K`), mas uma palavra no acorde pede vão, senão sai `CtrlK`.
        partes && (partes.every((p) => p.length === 1) ? "gap-0" : "gap-1"),
        className
      )}
      {...props}
    >
      {partes
        ? partes.map((parte, i) => <span key={i}>{parte}</span>)
        : children}
    </kbd>
  )
}

export { Kbd, formatKey }
