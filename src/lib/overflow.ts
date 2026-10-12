/**
 * Quem sai para o "⋯" quando a fileira não cabe (`Tabs`, `ToolbarActions`,
 * `PageHeaderActions`). Tira da `ponta` — as abas do fim, as ações do começo —
 * pulando os `fixos` (a aba ativa, a última ação) e quem `podeSair` recusa,
 * até a soma caber em `cabe` com a `reserva` do botão ⋯.
 */
export function quemSai(
  larguras: number[],
  cabe: number,
  { ponta, fixos, podeSair = () => true, reserva, gap = 0 }: {
    ponta: "inicio" | "fim"
    fixos: Set<number>
    podeSair?: (i: number) => boolean
    reserva: number
    gap?: number
  }
): number[] {
  const soma = (idx: number[]) =>
    idx.reduce((s, i) => s + larguras[i], 0) + gap * Math.max(0, idx.length - 1)
  const todos = larguras.map((_, i) => i)
  if (soma(todos) <= cabe + 0.5) return []
  const ordem = ponta === "fim" ? [...todos].reverse() : todos
  const ficam = new Set(todos)
  for (const i of ordem) {
    if (soma([...ficam]) + reserva + gap <= cabe + 0.5) break
    if (fixos.has(i) || !podeSair(i)) continue
    ficam.delete(i)
  }
  return todos.filter((i) => !ficam.has(i))
}

/** Tira o `hidden` que o mecanismo pôs — ao desligar o transbordo. */
export function limparExcesso(els: Iterable<HTMLElement>) {
  for (const el of els) el.removeAttribute("hidden")
}
