/** A trava de direção do deslize: nada até 8px de movimento; depois, o eixo que andou mais. */
export function travarDirecao(dx: number, dy: number): "x" | "y" | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return null
  return Math.abs(dx) > Math.abs(dy) ? "x" : "y"
}

/** Onde a linha assenta ao soltar: aberta se passou da metade da largura das ações, senão fechada. */
export function assentarDeslize(deslocamento: number, larguraAcoes: number): number {
  return deslocamento <= -larguraAcoes / 2 ? -larguraAcoes : 0
}

/** A faixa das ações: n círculos de 44, cada um com 8px depois dele (entre eles e até a borda direita). */
export function larguraDaFaixa(n: number): number {
  return n * 52
}

/** Quanto a faixa já abriu, de 0 a 1: guia o crescimento dos círculos (`--deslize`). */
export function progressoDoDeslize(x: number, largura: number): number {
  return Math.min(1, Math.max(0, -x / largura))
}
