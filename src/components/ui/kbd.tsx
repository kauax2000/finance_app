"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A tecla numa dica de atalho — uma tecla, ou o acorde inteiro.
 *
 * **Duas formas, um componente.** `<Kbd>Esc</Kbd>` é a tecla;
 * `<Kbd keys="mod+k" />` é o acorde, com o símbolo que o sistema operacional de
 * quem lê usa. Isto morava em dois arquivos — `Kbd` e `KbdShortcut` —, e o
 * custo eram duas entradas de catálogo e duas páginas para um tópico só, com
 * duas tabelas da mesma prop `keys` que já tinham divergido: uma enumerava o
 * que a prop aceita, a outra explicava o `mod`, e nenhuma continha a outra.
 *
 * A **sequência** — teclas apertadas uma depois da outra — é outra coisa e mora
 * no `KbdGroup`: ela junta átomos, e por isso é molécula.
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
 * O nome de uma tecla, escrito como se escreve numa dica: `esc` → `Esc`,
 * `up` → `↑`, `k` → `K`.
 *
 * **Não depende de plataforma** — só a modificadora depende, e é por isso que
 * ela fica de fora daqui. Exportada porque o `KbdGroup` normaliza a sequência
 * dele com esta mesma tabela: duas tabelas de nome de tecla divergiriam, e este
 * componente já pagou uma divergência dessas.
 */
function formatKey(parte: string): string {
  const chave = parte.trim().toLowerCase()
  return TECLAS[chave] ?? (chave.length === 1 ? chave.toUpperCase() : parte.trim())
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
    return modificador ?? formatKey(parte)
  })
}

/**
 * `null` até o cliente montar — mas **só quando há um acorde a resolver**.
 *
 * A escolha depende do `navigator`, que não existe no servidor. Renderizar o
 * palpite e corrigir depois faria a tecla piscar de errada para certa na
 * primeira pintura — e trocar `Ctrl K` por `⌘K` ainda muda a largura, então o
 * salto seria duplo.
 *
 * O `ativo` é o que impede isso de custar um render em toda tecla da tela: sem
 * `keys` não há plataforma a esperar — `Esc`, `↑` e `↵` são a mesma tecla nos
 * dois sistemas —, e a legenda do rodapé da paleta, que são quatro `Kbd` sem
 * acorde, pintaria em branco por um quadro se esperasse por nada.
 */
function useApplePlatform(ativo: boolean) {
  const [apple, setApple] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    if (!ativo) return
    setApple(
      /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)
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
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-muted px-1 font-sans text-xs font-medium text-muted-foreground select-none [&_svg:not([class*='size-'])]:size-3",
        // O preenchimento do tema claro desce um degrau, e a assimetria é
        // medida.
        //
        // Contra o gatilho da busca, que é `input-fill/30`, a pastilha em
        // `bg-muted` media **1,04** — ela ficava *mais clara* que o campo por
        // um fio de cabelo e sumia como forma. Só o glifo aparecia. Sobre
        // cartão branco é o mesmo caso, 1,06. (Sem os valores escritos aqui: o
        // auditor lê comentário como código, e hex numa observação vira cor
        // literal no relatório.)
        //
        // Um fio de `--border` foi a primeira tentativa e não bastou: 1,19
        // contra o campo, e 1px a 1,19 não se enxerga. A mesma razão como
        // **área** se enxerga — é por isso que o degrau é de preenchimento, e
        // não de aresta.
        //
        // A tinta desce junto, e não por gosto: sobre o cinza novo o
        // `--muted-foreground` media 4,47:1, três centésimos abaixo de AA.
        // Escurecer o chão sem escurecer o glifo troca um problema por outro.
        // `foreground/80` mantém a pastilha discreta — ela é uma dica, não
        // pode gritar mais alto que o rótulo do campo ao lado — e mede 8,3:1.
        //
        // No escuro a pastilha já é mais clara que o fundo e se destaca
        // sozinha; o `dark:` devolve os dois tokens e mantém aquele tema byte
        // a byte como estava.
        "bg-input-fill text-foreground/80 dark:bg-muted dark:text-muted-foreground",
        // A regra não é "Apple ou não" — é a largura do glifo. Símbolos
        // encostam porque cada um já se lê como uma tecla inteira (`⌘K`,
        // `⌘⇧P`). Basta uma palavra no acorde para o vão ser necessário:
        // `CtrlK` vira uma coisa só, e `⇧Enter` gruda o símbolo no verbo. A
        // primeira versão disto amarrava o vão à plataforma e produzia
        // exatamente esse `⇧Enter`.
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
