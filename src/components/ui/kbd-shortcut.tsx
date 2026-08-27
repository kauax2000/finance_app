"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Kbd } from "@/components/ui/kbd"

/**
 * O atalho inteiro numa tecla só — a forma que a busca do catálogo usa.
 *
 * `Kbd` desenha **uma** tecla e `KbdGroup` desenha uma **sequência**: duas
 * teclas apertadas uma depois da outra. Um acorde não é nenhum dos dois. `⌘K`
 * é um gesto: os dedos descem juntos. Separado em duas pastilhas, o olho lê
 * dois passos, e a dica ensina o atalho errado.
 *
 * Isto morava dentro do gatilho da busca, com a detecção de plataforma escrita
 * à mão e o espaço entre `Ctrl` e `K` embutido na string. Espaçamento é
 * trabalho de layout, não de dado — e a próxima tela que precisasse de um
 * atalho reescreveria os dois.
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
 * `"mod+k"` vira `["⌘", "K"]` no Apple e `["Ctrl", "K"]` no resto.
 *
 * `mod` é a convenção de quem já resolveu isto — cmdk, Mousetrap, ProseMirror:
 * o modificador principal da plataforma, sem a tela precisar saber qual é.
 */
function formatShortcut(keys: string, apple: boolean): string[] {
  return keys.split("+").map((parte) => {
    const chave = parte.trim().toLowerCase()
    const modificador = apple
      ? MODIFICADORES_APPLE[chave]
      : MODIFICADORES_PALAVRA[chave]
    if (modificador) return modificador
    if (TECLAS[chave]) return TECLAS[chave]
    return chave.length === 1 ? chave.toUpperCase() : parte.trim()
  })
}

/**
 * `null` até o cliente montar.
 *
 * A escolha depende do `navigator`, que não existe no servidor. Renderizar o
 * palpite e corrigir depois faria a tecla piscar de errada para certa na
 * primeira pintura — e trocar `Ctrl K` por `⌘K` ainda muda a largura, então o
 * salto seria duplo.
 */
function useApplePlatform() {
  const [apple, setApple] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    setApple(
      /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)
    )
  }, [])

  return apple
}

function KbdShortcut({
  keys,
  className,
  ...props
}: React.ComponentProps<typeof Kbd> & {
  /** O acorde, em partes separadas por `+`. Ex.: `"mod+k"`, `"shift+enter"`. */
  keys: string
}) {
  const apple = useApplePlatform()

  if (apple == null) return null

  const partes = formatShortcut(keys, apple)

  // A regra não é "Apple ou não" — é a largura do glifo. Símbolos encostam
  // porque cada um já se lê como uma tecla inteira (`⌘K`, `⌘⇧P`). Basta uma
  // palavra no acorde para o vão ser necessário: `CtrlK` vira uma coisa só, e
  // `⇧Enter` gruda o símbolo no verbo. A primeira versão disto amarrava o vão
  // à plataforma e produzia exatamente esse `⇧Enter`.
  const apertado = partes.every((parte) => parte.length === 1)

  return (
    <Kbd
      data-slot="kbd-shortcut"
      className={cn(apertado ? "gap-0" : "gap-1", className)}
      {...props}
    >
      {partes.map((parte, i) => (
        <span key={i}>{parte}</span>
      ))}
    </Kbd>
  )
}

export { KbdShortcut, formatShortcut }
