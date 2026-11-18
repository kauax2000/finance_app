/** A trava de direção do deslize: nada até 8px de movimento; depois, o eixo que andou mais. */
export function travarDirecao(dx: number, dy: number): "x" | "y" | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return null
  return Math.abs(dx) > Math.abs(dy) ? "x" : "y"
}

/** Onde a linha assenta ao soltar: aberta se passou da metade da largura das ações, senão fechada. */
export function assentarDeslize(deslocamento: number, larguraAcoes: number): number {
  return deslocamento <= -larguraAcoes / 2 ? -larguraAcoes : 0
}

/** A faixa das ações: n círculos de 44 com 8px entre eles e nas duas bordas. */
export function larguraDaFaixa(n: number): number {
  return n * 44 + (n + 1) * 8
}

/** Quanto a faixa já abriu, de 0 a 1: guia o crescimento dos círculos (`--deslize`). */
export function progressoDoDeslize(x: number, largura: number): number {
  return Math.min(1, Math.max(0, -x / largura))
}

/**
 * O arraste com elástico: dentro de [-largura, 0] a linha segue o dedo; além
 * disso ela resiste e anda um terço do que o dedo anda, nos dois sentidos,
 * como as listas do iOS.
 */
export function elastico(x: number, largura: number): number {
  if (x < -largura) return -largura + (x + largura) / 3
  if (x > 0) return x / 3
  return x
}
