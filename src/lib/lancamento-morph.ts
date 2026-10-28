/**
 * Os quadros puros do lançamento inteligente: o campo que vira a placa, no
 * espírito do Liquid Glass. Um vidro só — a placa já está no lugar final, e o
 * que anda é o recorte (`clip-path`) dela, da pílula até a caixa inteira; a
 * câmera é uma segunda gota que se funde ao campo antes. Sem React nem DOM,
 * para o teste: quem escreve o quadro é o componente, no vidro e nos filhos
 * dele, nunca num ancestral (lá o `transform` desligaria o `backdrop-filter`).
 */
import { lerp, preso, quadroDaTroca, suave, type IconeEmVoo } from "@/lib/header-morph"

/** O raio da placa: o `rounded-surface`. */
export const RAIO_DA_PLACA = 22
/** O vão entre a pílula da frase e a da câmera (`gap-2`). */
export const VAO_DAS_PILULAS = 8
/** O quanto o vidro afina no meio da subida do telefone, em fração da largura. */
export const AFINA = 0.04
/** O quanto a borda de cima corre à frente na subida do telefone, em fração da altura da placa. */
export const ADIANTA = 0.04

/** Uma caixa em px, nas coordenadas da placa (0, 0 é o canto de cima à esquerda dela). */
export type Retangulo = { esquerda: number; topo: number; direita: number; base: number }

/**
 * Um quadro da fusão, no progresso `n` (0 as duas pílulas separadas, 1 uma
 * pílula só). A câmera estica para a esquerda até encostar no campo (o vão de
 * 8 fecha pela escala, com a origem na direita), os cantos da costura vão de
 * cápsula a retos (`emenda`, o raio dos dois lados que se tocam) e o ícone
 * dela sai no desfoque. Em `fundida` a câmera some e o vidro do campo cobre a
 * linha inteira: a silhueta é a mesma (a cápsula de ponta a ponta).
 */
export function quadroDaFusao(
  n: number,
  camera: { largura: number; raio: number }
): { escalaX: number; emenda: number; icone: IconeEmVoo; fundida: boolean } {
  const f = preso(n, 0, 1)
  return {
    escalaX: 1 + (VAO_DAS_PILULAS * f) / camera.largura,
    emenda: camera.raio * (1 - f),
    icone: quadroDaTroca(f, false).sai,
    fundida: n >= 1,
  }
}

/**
 * Um quadro do vidro que cresce, no progresso `g` (0 a pílula `de`, 1 a placa
 * `para`; a mola pode passar de 1). Devolve o recorte (`inset` de cada lado,
 * em px da caixa da placa), o raio (de cápsula a 22, acompanhando a altura), o
 * `ty` do passe da mola e onde o cabeçalho fica (`cabeca`, a borda de cima: a
 * frase viaja com ela).
 *
 * No telefone a pílula está embaixo e o vidro sobe: no meio da subida ele
 * estica no sentido do movimento (a borda de cima corre à frente, `ADIANTA`) e
 * afina dos dois lados (`AFINA`), e o passe da mola o leva acima do lugar
 * (`ty`) e volta — o recorte não passa da caixa, que é tudo o que pinta. No
 * desktop a borda de cima fica presa, a largura nunca afina e o passe não
 * aparece (`g` preso em 1).
 */
export function quadroDaPlaca(
  g: number,
  de: Retangulo,
  para: Retangulo,
  telefone: boolean
): {
  recorte: Retangulo
  raio: number
  ty: number
  cabeca: number
  tinta: number
} {
  const q = preso(g, 0, 1)
  const k = telefone ? Math.sin(Math.PI * q) : 0
  const afina = (AFINA / 2) * (para.direita - para.esquerda) * k
  const esquerda = lerp(de.esquerda, para.esquerda, q) + afina
  const direita = lerp(de.direita, para.direita, q) - afina
  const topo = Math.max(para.topo, lerp(de.topo, para.topo, q) - ADIANTA * (para.base - para.topo) * k)
  const base = lerp(de.base, para.base, q)
  return {
    recorte: {
      esquerda: esquerda - para.esquerda,
      topo: topo - para.topo,
      direita: para.direita - direita,
      base: para.base - base,
    },
    raio: Math.min((base - topo) / 2, RAIO_DA_PLACA),
    ty: telefone && g > 1 ? (1 - g) * (de.topo - para.topo) : 0,
    cabeca: topo - para.topo,
    // A silhueta no voo (o recorte tira o anel): cheia na viagem, some no pouso.
    tinta: 1 - suave(q, [0.85, 1]),
  }
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
