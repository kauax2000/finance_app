/**
 * A viagem líquida: a peça que muda de lugar corre como matéria, e não desliza
 * (`ThemeToggle`, `Tabs`, `BottomBar`). É uma pílula só; o orgânico vem de três
 * coisas: um trajeto com inércia, um esticão com pico no meio do caminho
 * (squash-and-stretch) e a origem presa na borda de trás do movimento, para a
 * forma esticar na direção da viagem. Continua em WAAPI porque o next-themes
 * injeta `transition: none !important` ao trocar o tema, que mata uma transição
 * de CSS mas não a animação. A posição de repouso é o `translate` inline; as
 * animações têm `fill: "none"` e só cobrem o trajeto.
 */

/** O trajeto. A curva da referência: quase parada, dispara, pousa macio. */
export const TRAJETO = { duration: 400, easing: "cubic-bezier(1,0,0.4,1)" }

/**
 * O esticão anda no relógio do trajeto, em fase com a velocidade, que nesta
 * curva pica em 0,667; o pico do esticão fica em 0,58, perto o bastante para
 * acompanhar a corrida e cedo o bastante para não cair na borda do trilho. Com
 * o pico no meio do relógio a forma esticaria parada e atravessaria contraída.
 * O perfil é meia-senoide de cada lado do pico: um vértice reto lê como repuxão.
 */
export const ESTICAO = { duration: 640, easing: "linear" }
export const PICO_EM = 0.58

export const ATRAS = "atras" as const
export const FRENTE = "frente" as const
export type Lado = typeof ATRAS | typeof FRENTE

/** Onde o trajeto acaba, na régua da escala. Também é onde `k` cruza zero. */
export const VIRADA = TRAJETO.duration / ESTICAO.duration

/**
 * O relógio da escala passa do trajeto de propósito (640 contra 400): os 400
 * primeiros são o esticão em fase com a corrida e os 240 que sobram são o
 * pouso. As frações do esticão são as do trajeto vezes `VIRADA`, então o auge
 * continua caindo em 0,58 do trajeto. `k` vale 0 em repouso, 1 no auge e
 * negativo no pouso; a amplitude multiplica tudo. O pouso é um mergulho só
 * (uma travessia por zero, nenhum repique).
 */
export const PERFIL: [number, number, Lado][] = [
    [0, 0, ATRAS],
    [0.15 * VIRADA, 0.395, ATRAS],
    [0.3 * VIRADA, 0.726, ATRAS],
    [0.45 * VIRADA, 0.939, ATRAS],
    [PICO_EM * VIRADA, 1, ATRAS],
    [0.7 * VIRADA, 0.901, ATRAS],
    [0.82 * VIRADA, 0.624, ATRAS],
    [0.92 * VIRADA, 0.294, ATRAS],
    [VIRADA, 0, ATRAS],
    // A origem vira aqui, e a troca é invisível: `k` é 0, a escala é 1 e uma
    // identidade não tem origem que importe (os dois quadros distam 0,0001).
    [VIRADA + 0.0001, 0, FRENTE],
    // O mergulho do pouso, ancorado na borda da frente: compacta para trás, para dentro do trilho.
    [0.7, -0.16, FRENTE],
    [0.78, -0.22, FRENTE],
    [0.86, -0.17, FRENTE],
    [0.93, -0.08, FRENTE],
    [1, 0, FRENTE],
]

/**
 * O volume se conserva: esticando em X, a forma afina em Y. O acoplamento é
 * 0,45 do esticão (0,90 no auge), não o `1/√x` da física, que tiraria 3px de
 * uma peça de 28px.
 */
export const ACOPLAMENTO_Y = 0.45

/**
 * A amplitude é proporcional à velocidade (mesmo tempo, o dobro do caminho,
 * o dobro do esticão). O teto é a borda do trilho, conta fechada no auge e no
 * contragolpe do pouso, que é o apertado: com 0,22 a borda dianteira chega a
 * 87,7 dos 88px. Acima disso a peça sai da pílula, e só a tela acusa.
 */
export const AMPLITUDE_POR_SALTO = [0, 0.11, 0.22]

/** A viagem macia das abas: saída menos presa e 80ms a mais, porque a peça anda 300px. Serve o `Tabs` e o `BottomBar`. */
export const TRAJETO_MACIO = { duration: 480, easing: "cubic-bezier(0.65,0,0.25,1)" }

/** Uma caixa na régua do trilho, em px: onde a peça está e o tamanho dela. */
export type CaixaLiquida = { x: number; y: number; w: number; h: number }

/** Só a posição: a peça do `ThemeToggle` não muda de tamanho, e o tamanho não anima. */
type PontoLiquido = Pick<CaixaLiquida, "x" | "y"> & Partial<CaixaLiquida>

const quadro = ({ x, y, w, h }: PontoLiquido) => ({
  translate: `${x}px ${y}px`,
  ...(w === undefined ? null : { width: `${w}px` }),
  ...(h === undefined ? null : { height: `${h}px` }),
})

/**
 * Anima a peça da caixa `de` até a caixa `para`: trajeto com inércia na posição
 * e no tamanho, esticão no mesmo relógio, origem atrás enquanto corre e à frente
 * no pouso. A posição de repouso é de quem chama; cancelar as animações nunca
 * deixa a peça fora do lugar. `amplitude` é o quanto ela estica no auge (0,11
 * por parada no `ThemeToggle`); no eixo vertical o esticão é em Y. Movimento
 * reduzido é perguntado aqui, porque a WAAPI escapa do bloco global que só corta
 * transição.
 */
export function viajarLiquido(
  peca: HTMLElement,
  de: PontoLiquido,
  para: PontoLiquido,
  {
    amplitude,
    eixo = "x",
    trajeto = TRAJETO,
  }: {
    amplitude: number
    eixo?: "x" | "y"
    /** Outro trajeto (o `Tabs` usa um mais macio); o relógio do esticão acompanha, dividido por `VIRADA`. */
    trajeto?: { duration: number; easing: string }
  }
): Animation[] {
  if (typeof window === "undefined") return []
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return []
  const vertical = eixo === "y"
  const avanca = vertical ? para.y > de.y : para.x > de.x
  const origem: Record<Lado, string> = vertical
    ? { [ATRAS]: avanca ? "50% 0%" : "50% 100%", [FRENTE]: avanca ? "50% 100%" : "50% 0%" }
    : { [ATRAS]: avanca ? "0% 50%" : "100% 50%", [FRENTE]: avanca ? "100% 50%" : "0% 50%" }
  const escala = (k: number) => {
    const longo = (1 + amplitude * k).toFixed(4)
    const curto = (1 - amplitude * k * ACOPLAMENTO_Y).toFixed(4)
    return vertical ? `${curto} ${longo}` : `${longo} ${curto}`
  }
  return [
    peca.animate([quadro(de), quadro(para)], { ...trajeto, fill: "none" }),
    peca.animate(
      PERFIL.map(([offset, k, lado]) => ({ offset, transformOrigin: origem[lado], scale: escala(k) })),
      { ...ESTICAO, duration: Math.round(trajeto.duration / VIRADA), fill: "none" }
    ),
  ]
}
