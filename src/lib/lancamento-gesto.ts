/**
 * Os quadros puros do lançamento inteligente, aprovados quadro a quadro
 * (`docs/superpowers/specs/2026-10-28-lancamento-gesto-final.md`, protótipos em
 * `docs/superpowers/prototipos/lancamento-gesto-*.html`). O Enter (ou o fim da
 * leitura da foto) dispara três fases, cada uma num relógio do `motion`:
 *
 * 1. **Colar**: a busca do telefone fechando, com o código dela
 *    (`quadroDasBolhas`), a câmera colada no campo; com o vão zero, um vidro só
 *    (`contornoDaUniao`).
 * 2. **Absorver**: uma cápsula só, alargada até a ponta da câmera, com a ponta
 *    direita recuando até a do campo.
 * 3. **Abrir**: o campo vira o painel, revelado por recorte do retângulo do
 *    campo ao do painel — a altura na `MOLA`, a largura na `MOLA_PALCO` —, o
 *    conteúdo andando com o vidro e as peças chegando em cascata.
 *
 * Sem React nem DOM, para o teste: quem escreve o quadro é o componente, nos
 * vidros e nos filhos deles, nunca num ancestral (lá o `transform` e o
 * `clip-path` desligariam o `backdrop-filter`).
 */
import { contornoDaUniao, quadroDasBolhas } from "@/components/ui/command"
import { lerp, preso, suave, TINTA_DO_VOO } from "@/lib/header-morph"
import { MOLA, MOLA_PALCO } from "@/lib/spring"

/** Uma caixa de tela completa (o que o `getBoundingClientRect` dá). */
export type Caixa = { left: number; top: number; right: number; bottom: number; width: number; height: number }

export const caixa = (left: number, top: number, width: number, height: number): Caixa => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
})

/** A volta da busca do telefone (a mesma do `CommandDialog`): o colar. */
export const VOLTA_DA_PILULA = { duration: 0.32, ease: [0.2, 0, 0, 1] } as const
/** O absorver: a ponta da câmera recua para dentro do campo. */
export const ABSORVER = { duration: 0.26, ease: [0.4, 0, 0.2, 1] } as const
/** O colar acaba (e o absorver começa) quando o progresso das bolhas cai a isto. */
export const COLADO_EM = 0.02
/** O abrir começa quando o absorver passa disto (~125ms depois de começar). */
export const ABRE_EM = 0.75
/** O vão que a câmera fecha ao colar (`gap-2` da linha). */
export const VAO_DA_CAMERA = 8

/**
 * Um quadro do colar, no progresso `p` (1 as duas pílulas separadas, 0
 * coladas): `quadroDasBolhas` com `m = { lupa: campo, deX: a câmera colada no
 * campo, pilula: campo, x: câmera }`. A união (um vidro só, sem fio na costura)
 * existe só com o vão zero.
 */
export function quadroDoColar(campo: Caixa, camera: Caixa, p: number, dpr: number) {
  const deX = caixa(campo.right, camera.top, camera.width, camera.height)
  const f = quadroDasBolhas({ lupa: campo, deX, pilula: campo, x: camera, dpr }, p)
  return { f, uniao: f.vao === 0 ? contornoDaUniao(f, { pilula: campo, x: camera }) : null }
}

/**
 * O recorte do absorver, no progresso `u` (0 a cápsula até a ponta da câmera, 1
 * só o campo): a ponta direita recua `larguraDaCamera × u`, sempre redonda.
 */
export function recorteDoAbsorver(u: number, larguraDaCamera: number, raio: number) {
  return `inset(0px ${larguraDaCamera * u}px 0px 0px round ${raio}px)`
}

/** Quando a frase (a cópia no lugar do campo) já saiu, em fração da altura. */
export const FRASE_SAI = [0, 0.28] as const
/** O quanto a frase sobe do que a borda de cima subiu. */
export const FRASE_SOBE = 0.35
/** A tinta do voo some quando a altura passa daqui. */
export const TINTA_SOME = [0.85, 1] as const

/** Um retângulo pelas bordas, em coordenadas de tela. */
export type Bordas = { topo: number; direita: number; base: number; esquerda: number }

/**
 * Um quadro do abrir: `py` é a mola da altura, `px` a da largura (as duas
 * passam de 1 e voltam). O vidro vai do retângulo do campo (`C`) ao do painel
 * (`F`), o raio do campo ao do painel acompanhando a altura, a tinta do voo
 * some no fim da altura. O conteúdo, no lugar final, anda com o vidro (o
 * centro e a borda de cima, também no passe da mola), e a frase sai no
 * desfoque subindo com uma fração da borda de cima.
 */
export function quadroDoAbrir(
  py: number,
  px: number,
  C: Caixa,
  F: Caixa,
  raio: { de: number; ate: number }
) {
  const topo = lerp(C.top, F.top, py)
  const base = lerp(C.bottom, F.bottom, py)
  const esquerda = lerp(C.left, F.left, px)
  const direita = lerp(C.right, F.right, px)
  const sai = suave(py, FRASE_SAI)
  return {
    vidro: { topo, direita, base, esquerda } satisfies Bordas,
    raio: lerp(raio.de, raio.ate, preso(py, 0, 1)),
    /** Em % de `--foreground`. */
    tinta: TINTA_DO_VOO * (1 - suave(Math.min(py, 1), TINTA_SOME)),
    conteudo: { dx: (esquerda + direita) / 2 - (F.left + F.right) / 2, dy: topo - F.top },
    frase: { opacidade: 1 - sai, desfoque: 8 * sai, dy: (topo - C.top) * FRASE_SOBE },
  }
}

/** O `inset()` de um retângulo de tela dentro de uma caixa (negativo fora dela). */
export function insetDe(r: Bordas, em: Caixa, raio: number) {
  return `inset(${r.topo - em.top}px ${em.right - r.direita}px ${em.bottom - r.base}px ${r.esquerda - em.left}px round ${raio}px)`
}

/** O intervalo entre uma peça e a seguinte, em ms. */
export const CASCATA_MS = 28
/** As peças começam quando a altura passa disto. */
export const REVELA_EM = 0.12
/** A duração mínima de uma peça, em ms. */
export const PECA_MIN_MS = 160
/** A curva da chegada de cada peça. */
export const REVELA_EASE = [0.2, 0.8, 0.2, 1] as const

type Mola = { stiffness: number; damping: number }

/**
 * Os marcos das duas molas do abrir (massa 1, Euler semi-implícito em passos de
 * 0,5ms, como o protótipo): quando a altura passa de `REVELA_EM` e quando as
 * duas assentam (a 1% do alvo, amostrado de 5 em 5ms).
 */
function marcos(altura: Mola, largura: Mola) {
  const dt = 1 / 2000
  const a = { x: 0, v: 0 }
  const l = { x: 0, v: 0 }
  const passo = (s: { x: number; v: number }, m: Mola) => {
    s.v += (-m.stiffness * (s.x - 1) - m.damping * s.v) * dt
    s.x += s.v * dt
  }
  let comeca = -1
  for (let meio = 1; meio <= 6000; meio++) {
    passo(a, altura)
    passo(l, largura)
    if (meio % 2) continue
    const ms = meio / 2
    if (comeca < 0 && a.x > REVELA_EM) comeca = ms
    if (ms % 5 === 0 && Math.abs(a.x - 1) < 0.01 && Math.abs(l.x - 1) < 0.01) return { comeca, assenta: ms }
  }
  return { comeca, assenta: 3000 }
}

const MARCOS = marcos(MOLA, MOLA_PALCO)

/**
 * A cascata de `n` peças no abrir, em ms desde o começo dele: cada uma chega
 * do desfoque (10 → 0, só opacidade e desfoque, sem subir) `CASCATA_MS` depois
 * da anterior, a primeira quando a altura passa de 12%, e a última termina
 * quando as duas molas assentam.
 */
export function cascata(n: number) {
  const { comeca, assenta } = MARCOS
  const duracao = Math.max(PECA_MIN_MS, assenta - comeca - (n - 1) * CASCATA_MS)
  return { comeca, assenta, duracao, atraso: (i: number) => comeca + i * CASCATA_MS }
}

/** Uma caixa de tela: o que o `getBoundingClientRect` dá. */
export type CaixaDeTela = { left: number; top: number; right: number; bottom: number }

/**
 * Um quadro da abertura no telefone, no progresso `p` (0 a gota no botão "+"
 * da barra de baixo, 1 a linha pousada acima do teclado; a `SEPARACAO` passa
 * de 1 e volta). O campo é uma gota — o círculo da ponta direita dele — que
 * sai do centro do "+" e sobe (`dx`, `dy`), esticando para a esquerda até a
 * pílula inteira (`esquerda`, o recorte); a câmera nasce dentro da ponta (35%
 * do raio) e se separa até o lugar dela. O conteúdo do campo acende quando
 * ele já é pílula.
 */
export function quadroDoMais(
  p: number,
  m: { mais: CaixaDeTela; campo: CaixaDeTela; camera: CaixaDeTela }
): {
  campo: { dx: number; dy: number; esquerda: number; conteudo: number }
  camera: { dx: number; dy: number; escala: number; opacidade: number }
} {
  const R = (m.campo.bottom - m.campo.top) / 2
  const resto = 1 - p
  const maisX = (m.mais.left + m.mais.right) / 2
  const maisY = (m.mais.top + m.mais.bottom) / 2
  // O centro da ponta direita do campo, no lugar final.
  const pontaX = m.campo.right - R
  const pontaY = m.campo.top + R
  const dx = (maisX - pontaX) * resto
  const dy = (maisY - pontaY) * resto
  const esquerda = (m.campo.right - m.campo.left - 2 * R) * (1 - suave(p, [0.15, 0.75]))
  const nasce = suave(p, [0.35, 1])
  const cameraX = (m.camera.left + m.camera.right) / 2
  const cameraY = (m.camera.top + m.camera.bottom) / 2
  return {
    campo: { dx, dy, esquerda, conteudo: suave(p, [0.55, 0.85]) },
    camera: {
      dx: lerp(pontaX + dx, cameraX, nasce) - cameraX,
      dy: lerp(pontaY + dy, cameraY, nasce) - cameraY,
      escala: Math.min(1, 0.35 + 0.65 * nasce),
      opacidade: suave(p, [0.35, 0.5]),
    },
  }
}
