/**
 * Os quadros puros das animações do cabeçalho do telefone: a troca de tela
 * (o ícone que sai, o que entra, o afundar do vidro) e a gota que leva a lupa
 * à cápsula `[lupa | filtro]`. Sem React nem DOM, para o teste: quem escreve
 * o quadro na pele é o componente que o chama, nos vidros e nos filhos deles,
 * nunca num ancestral (um `transform` ali desligaria o `backdrop-filter`).
 */

/** O smoothstep de `x` entre `de` e `ate`: 0 antes, 1 depois, curva suave no meio. */
export const suave = (x: number, [de, ate]: readonly [number, number]) => {
  const t = Math.min(Math.max((x - de) / (ate - de), 0), 1)
  return t * t * (3 - 2 * t)
}

/** `a` em `t` 0, `b` em `t` 1, reta no meio (e fora). */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** `x` preso em `[de, ate]`. */
export const preso = (x: number, de: number, ate: number) => Math.min(Math.max(x, de), ate)

/** Um ícone no voo: opacidade, escala e desfoque (px) a escrever nele. */
export type IconeEmVoo = { opacidade: number; escala: number; desfoque: number }

/**
 * Um quadro da troca de tela, no progresso `p` (0 a tela de antes, 1 a de
 * depois; a mola passa de 1 e volta). O ícone que sai encolhe e desfoca até o
 * meio, o que entra chega do desfoque a partir de um quinto, e o vidro afunda
 * 14% no meio (`afundar`) e volta — `p` preso em [0, 1], para o passe da mola
 * não afundar de novo.
 */
export function quadroDaTroca(p: number, afundar: boolean): { escala: number; sai: IconeEmVoo; entra: IconeEmVoo } {
  const s = suave(p, [0, 0.55])
  const e = suave(p, [0.2, 0.8])
  return {
    escala: afundar ? 1 - 0.14 * Math.sin(Math.PI * preso(p, 0, 1)) : 1,
    sai: { opacidade: 1 - s, escala: 1 - 0.3 * s, desfoque: 4 * s },
    entra: { opacidade: e, escala: 0.7 + 0.3 * e, desfoque: 4 * (1 - e) },
  }
}

/**
 * O quanto a tinta do voo puxa os vidros para o `--foreground`, em %: a
 * silhueta de um vidro em voo, que o recorte tira o anel (a busca que se
 * divide; a gota do filtro no cabeçalho voa sem ela). Numa camada de `background-image` que o
 * `clip-path` recorta junto; fundidos, dois vidros são uma tinta só.
 */
export const TINTA_DO_VOO = 8

/** O raio da gota na cápsula cheia, e a altura dela: a lupa ocupa `[0, 44]` e o filtro `[44, 88]`. */
export const GOTA_R = 22
export const GOTA_H = 44

/**
 * Um quadro da gota do filtro, no progresso `g` (0 a lupa sozinha, 1 a cápsula
 * inteira), nas coordenadas da caixa final da cápsula. A lupa anda do filtro
 * para a esquerda (`lupaDx`), a gota cresce de 30% a 100% do raio e corre da
 * sombra da lupa até o centro do filtro, a cintura da emenda fecha no fim e o
 * ícone do filtro acende por último. No passe da mola (`g` até 1,05) a lupa
 * passa um pouco do zero (−2,2px no pico, como o `desenharGota` espera) e a
 * gota fica dentro da borda direita.
 */
export function quadroDaGotaDoFiltro(g: number): {
  lupaDx: number
  gota: { cx: number; r: number }
  cintura: number
  icone: IconeEmVoo
} {
  const o = suave(g, [0.4, 0.95])
  const lupaDx = GOTA_H * (1 - preso(g, 0, 1.05))
  return {
    lupaDx,
    gota: {
      cx: lerp(lupaDx + 24, 66, suave(g, [0, 0.8])),
      r: GOTA_R * (0.3 + 0.7 * suave(g, [0, 0.7])),
    },
    cintura: suave(g, [0.55, 1]),
    icone: { opacidade: o, escala: 0.7 + 0.3 * o, desfoque: 4 * (1 - o) },
  }
}
