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

/** O raio do vidro da cápsula, e a altura dele: a lupa ocupa `[0, 44]` e o filtro `[44, 88]`. */
export const VIDRO_R = 22
export const VIDRO_H = 44
/** Onde o calendário (16 de largura, centrado em 66) começa: a costura não passa daqui com ele aceso. */
const ANTES_DO_FILTRO = 66 - 8

/**
 * Um quadro do vidro que estica (a cápsula do cabeçalho, como os itens da
 * barra do iOS 26), no progresso `g` (0 a lupa sozinha, 1 a cápsula inteira),
 * nas coordenadas da caixa final (`[0, 88]`). Um vidro só para o olho: a borda
 * esquerda anda da lupa até a ponta da cápsula levando a lupa (`lupaDx`) e o
 * ícone do filtro acende do desfoque no lugar dele. Os dois sentidos são o
 * mesmo filme, e o balanço da mola aparece nos dois: além de 1, a cápsula
 * alarga além da ponta (o filtro estica, `esticaFiltro`, ancorado à direita,
 * para a costura não abrir); abaixo de 0, o círculo passa da lupa para a
 * direita. `esquerda` e `largura` são a caixa da cápsula visível (o anel).
 * São dois vidros de verdade, e a `costura` é onde um passa ao outro: com o
 * filtro apagado a lupa é o vidro inteiro; aceso, a costura fica antes do
 * ícone dele, e nunca antes do fim do ícone da lupa (`lupaDx + 30`).
 */
export function quadroDoVidroQueEstica(g: number): {
  lupaDx: number
  costura: number
  esquerda: number
  largura: number
  esticaFiltro: number
  icone: IconeEmVoo
} {
  const lupaDx = VIDRO_H * (1 - g)
  const o = suave(g, [0.35, 0.9])
  const fim = lupaDx + VIDRO_H
  const costura = Math.max(VIDRO_H, o > 0 ? Math.max(Math.min(fim, ANTES_DO_FILTRO), lupaDx + 30) : fim)
  const direita = Math.max(2 * VIDRO_H, fim)
  return {
    lupaDx,
    costura,
    esquerda: lupaDx,
    largura: direita - lupaDx,
    esticaFiltro: Math.max(1, (2 * VIDRO_H - fim) / VIDRO_H),
    icone: { opacidade: o, escala: 0.7 + 0.3 * o, desfoque: 4 * (1 - o) },
  }
}

/**
 * Chama `comecar` quando a pintura volta a correr. Entre o toque e o primeiro
 * quadro pintado o WebKit para 100–300ms (montando a paleta ou a cápsula, ou
 * subindo e descendo o teclado); o `animate` conta o tempo, e o gesto voltava já no fim.
 * Dois rAF seguidos a até 34ms dizem que a pintura voltou (até seis, se ela
 * seguir engasgando). Devolve o cancelamento.
 */
export function quandoPintar(comecar: () => void) {
  let quadros = 0
  let antes = 0
  let id = 0
  const esperar = (agora: number) => {
    quadros++
    if (quadros < 2 || (agora - antes > 34 && quadros < 6)) {
      antes = agora
      id = requestAnimationFrame(esperar)
      return
    }
    comecar()
  }
  id = requestAnimationFrame(esperar)
  return () => cancelAnimationFrame(id)
}
