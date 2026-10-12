import type { CaixaLiquida } from "@/lib/liquid-move"

/**
 * A caixa do marcador, na régua da trilha: a do item ativo recuada `insete`
 * px nos quatro lados. Recebe `offsetLeft/Top/Width/Height` já lidos —
 * relativos à trilha, e não à janela, para o marcador acompanhar a rolagem de
 * graça (ver `useMarcador`).
 */
export function caixaDoAtivo(
  m: { left: number; top: number; width: number; height: number },
  insete: number
): CaixaLiquida {
  return { x: m.left + insete, y: m.top + insete, w: m.width - 2 * insete, h: m.height - 2 * insete }
}
