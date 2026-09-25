import type * as React from "react"

/**
 * # O disco das linhas de lista, sob o ponteiro
 *
 * As linhas de menu, `Select`, `Command` e do painel do `NavigationMenu`
 * acendem como o link da navegação do catálogo — que é um `Button tertiary`:
 * um disco da cor do realce nasce **sob o cursor** e se espalha até preencher
 * a linha (`@utility button-fill`, rodada 99). O `Button` escreve a posição do
 * ponteiro em cada botão; aqui as linhas não são botões do sistema, e a escrita
 * é **delegada**: um handler por lista, no contêiner, e não um por linha.
 *
 * A conta é a do `seguirPonteiro` do `Button`: px relativos à caixa da linha,
 * em `--button-mx`/`--button-my`, por `setProperty` — sem estado, sem
 * re-render. Sem ponteiro (as setas), nada é escrito e o disco nasce do
 * centro, que é o padrão da utility.
 *
 * Ligue em `onPointerMove` e `onPointerOver`: o `over` pega a entrada na linha
 * antes do primeiro `move`, e é nele que o Radix e o cmdk acendem a linha.
 */
export function followPointerFill(e: React.PointerEvent<HTMLElement>) {
  if (!(e.target instanceof Element)) return
  const linha = e.target.closest<HTMLElement>(".button-fill")
  if (!linha || !e.currentTarget.contains(linha)) return
  const r = linha.getBoundingClientRect()
  linha.style.setProperty("--button-mx", `${e.clientX - r.left}px`)
  linha.style.setProperty("--button-my", `${e.clientY - r.top}px`)
}

/**
 * O disco da linha: a utility, a cor do realce e a transição do `tertiary`
 * (`--duration-slow`, `--ease-emphasized`). Quem acende é o estado de cada
 * superfície — `focus:` no Radix, `data-selected:` no cmdk, `hover:` no nav —,
 * escrevendo `[--button-fill:100%]`.
 *
 * A cor é `--accent`, e não o `--muted` do `tertiary`: o estado final é o
 * realce que as linhas sempre tiveram, e só a chegada muda.
 */
export const listFillClassName =
  "button-fill [--button-fill-color:var(--accent)] transition-[color,--button-fill] duration-(--duration-slow) ease-(--ease-emphasized)"

/** O tom destrutivo do disco — o `bg-destructive/10` (e `/20` no escuro) de antes. */
export const listFillDestructiveClassName =
  "data-[variant=destructive]:[--button-fill-color:color-mix(in_oklab,var(--destructive)_10%,transparent)] dark:data-[variant=destructive]:[--button-fill-color:color-mix(in_oklab,var(--destructive)_20%,transparent)]"
