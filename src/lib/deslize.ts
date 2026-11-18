/** A trava de direção do deslize: nada até 8px de movimento; depois, o eixo que andou mais. */
export function travarDirecao(dx: number, dy: number): "x" | "y" | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return null
  return Math.abs(dx) > Math.abs(dy) ? "x" : "y"
}

/** Onde a linha assenta ao soltar: aberta se passou da metade da largura das ações, senão fechada. */
export function assentarDeslize(deslocamento: number, larguraAcoes: number): number {
  return deslocamento <= -larguraAcoes / 2 ? -larguraAcoes : 0
}
