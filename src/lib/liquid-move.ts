/**
 * A viagem líquida (rodada 181 no `ThemeToggle`, rodada 226 no `Tabs`): a peça
 * que muda de lugar **corre como matéria**, e não desliza. A receita mora aqui
 * desde que o segundo componente a pediu — o alternador de tema e o marcador
 * das abas são o mesmo movimento, e duas cópias divergiriam na primeira
 * correção.
 *
 * O relógio da viagem, e **por que ela é uma peça só**.
 *
 * ## Três nós nunca iam ler como um
 *
 * A primeira versão tinha cabeça, rastro e pescoço: dois discos iguais viajando
 * em relógios diferentes com uma barra entre eles, fundidos por serem do mesmo
 * `--background`. Na tela isso lê como **duas bolas transitando**, e não como
 * matéria — a fusão por cor apaga a costura, mas não faz uma forma só.
 *
 * A saída é a do switcher de vidro do 21st (Dennys Dionigi), lido do bundle do
 * preview: **uma pílula**, e o orgânico vem de três coisas, não de três nós.
 *
 * 1. **Um trajeto com inércia.** `cubic-bezier(1, 0, 0.4, 1)` quase não sai do
 *    lugar no começo, dispara no meio e pousa macio. É o que dá peso à forma.
 * 2. **Um esticão com pico no meio do caminho**, em `scale`, voltando a 1 na
 *    chegada — squash-and-stretch clássico.
 * 3. **A origem presa na borda de trás do movimento.** Com `transform-origin`
 *    atrás e `scaleX > 1`, a forma **estica para a frente**, na direção da
 *    viagem. É para isto, e só para isto, que a referência mantém um
 *    `data-previous` no trilho — aqui já temos o `anterior`.
 *
 * ## O que a leitura do bundle desmentiu
 *
 * A referência declara dois filtros SVG (`feImage` + `feDisplacementMap`), e é
 * tentador copiar a refração. **Ela não está ligada**: `filter` e
 * `backdrop-filter` computam `none` nos elementos. O que faz o "líquido" ali é
 * a aresta mais o esticão.
 *
 * E o esticão dela **não** depende da distância — o pico sai do destino (1,1 nas
 * pontas, 1,2 no meio). Aqui ele sai de quanto se andou, que é a régua desta
 * casa: um salto de duas paradas estica mais que um de uma.
 *
 * ## Continua em WAAPI
 *
 * O next-themes roda com `disableTransitionOnChange`, que injeta
 * `* { transition: none !important }` enquanto troca a classe do tema. Uma
 * transição de CSS morre ali; a WAAPI não é uma transição e escapa. A posição de
 * repouso é o `translate` inline, e a animação (com `fill: "none"`) só cobre o trajeto.
 */

/** O trajeto. A curva da referência: quase parada, dispara, pousa macio. */
export const TRAJETO = { duration: 400, easing: "cubic-bezier(1,0,0.4,1)" }

/**
 * **O esticão anda no mesmo relógio do trajeto, e em fase com a velocidade.**
 *
 * A referência põe o pico no meio do *seu* relógio (0,44s contra 0,40s de
 * viagem), e com esta curva isso sai **anticorrelacionado**: medido, aos 30% do
 * caminho a escala está em 1,33 com a velocidade a **6%** do máximo, e aos 70%,
 * com 68% da velocidade, a escala já caiu para 1,04. Na tela a forma **estica
 * parada** e depois atravessa contraída — o contrário do que matéria faz.
 *
 * A velocidade desta curva pica em **0,667**. O pico do esticão fica em 0,58:
 * perto o bastante para acompanhar a corrida, cedo o bastante para o auge não
 * cair em cima da borda do trilho.
 *
 * O perfil é uma meia-senoide de cada lado do pico, e não um triângulo: um
 * vértice reto no auge lê como um repuxão.
 */
export const ESTICAO = { duration: 640, easing: "linear" }
export const PICO_EM = 0.58

export const ATRAS = "atras" as const
export const FRENTE = "frente" as const
export type Lado = typeof ATRAS | typeof FRENTE

/** Onde o trajeto acaba, na régua da escala. Também é onde `k` cruza zero. */
export const VIRADA = TRAJETO.duration / ESTICAO.duration

/**
 * **O relógio da escala passa do trajeto de propósito**: 640 contra 400. Os 400
 * primeiros são o esticão em fase com a corrida; os 240 que sobram são o
 * **pouso**. As frações do esticão são as do trajeto multiplicadas por
 * `VIRADA`, então o auge continua caindo em 0,58 **do trajeto**, que é onde ele
 * tem de cair.
 *
 * `k` vale 0 em repouso, 1 no auge do esticão, e **negativo** no pouso, quando
 * a forma encolhe. A amplitude multiplica tudo, então um salto curto balança
 * menos sem precisar de tabela própria.
 *
 * **O pouso é um mergulho só, e não um quique.** A primeira versão oscilava
 * três vezes em 160ms (+0,5 · −0,28 · +0,12) e ficava estalada — o dono pediu
 * mais suave. Hoje é **uma** compressão que vai e volta em 240ms: a forma bate
 * na parada, o corpo compacta atrás e relaxa. Uma travessia por zero, nenhum
 * repique.
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
    // **A origem vira aqui, e a troca é invisível por construção**: neste
    // instante `k` é 0, a escala é 1, e uma transformação identidade não tem
    // origem que importe. Os dois quadros a 0,0001 de distância fazem disso um
    // degrau em vez de uma varredura — a origem deslizando com a escala fora de
    // 1 seria bem visível.
    [VIRADA + 0.0001, 0, FRENTE],
    // O mergulho do pouso, ancorado na borda **da frente**: a forma bate na
    // parada e compacta **para trás**, para dentro do trilho.
    [0.7, -0.16, FRENTE],
    [0.78, -0.22, FRENTE],
    [0.86, -0.17, FRENTE],
    [0.93, -0.08, FRENTE],
    [1, 0, FRENTE],
]

/**
 * **O volume se conserva**, e é isso que faz a forma ler como matéria em vez de
 * uma pílula que engorda: esticando em X, ela **afina em Y**.
 *
 * O acoplamento não é o `1/√x` da física — a 1,22 ele daria 0,905, e numa peça
 * de 28px tirar 3px de altura é mais do que o olho aceita num controle. 0,45 do
 * esticão dá 0,90 no auge, que é o quanto se lê sem a peça parecer amassada.
 */
export const ACOPLAMENTO_Y = 0.45

/**
 * A amplitude, **proporcional à velocidade**: as duas viagens duram o mesmo, e
 * a de duas paradas percorre o dobro do caminho — então ela corre ao dobro e
 * estica o dobro.
 *
 * O teto é a borda do trilho, e é conta fechada em **dois** pontos, não um: o
 * auge do esticão — que acontece no meio do caminho, onde sobra espaço — e o
 * **contragolpe do pouso**, que acontece com a forma já na parada final e por
 * isso é o apertado. Com 0,22 a borda dianteira chega a **87,7** dos 88px no
 * contragolpe. Quem subir isto põe a peça para fora da pílula — e ninguém vai
 * reclamar em teste, só na tela.
 */
export const AMPLITUDE_POR_SALTO = [0, 0.11, 0.22]


/**
 * A viagem macia das abas (rodada 226, pedido do dono): a saída menos presa
 * que o `cubic-bezier(1,0,0.4,1)` do alternador, e 80ms a mais — numa fileira
 * em que a peça anda 300px, o trajeto do alternador lia seco. Serve o `Tabs` e
 * o `BottomBar`.
 */
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
 * Anima a peça da caixa `de` até a caixa `para` — o trajeto com inércia na
 * posição e no tamanho, e o esticão no mesmo relógio, com a origem atrás
 * enquanto corre e à frente no pouso. A posição de repouso é de quem chama
 * (variáveis, estilo inline); estas animações têm `fill: "none"` e só cobrem o
 * caminho, então cancelá-las nunca deixa a peça fora do lugar.
 *
 * `amplitude` é o quanto ela estica no auge (0,11 por parada no
 * `ThemeToggle`); no eixo vertical o esticão é em Y e o afinamento em X.
 *
 * **Movimento reduzido é perguntado aqui**: a WAAPI escapa do bloco global de
 * `globals.css`, que só corta transição. Com ele, nada anima e a peça já está
 * no repouso.
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
    /**
     * Outro trajeto — o `Tabs` usa um mais macio. **O esticão estica junto**:
     * o relógio dele é o do trajeto dividido por `VIRADA`, para o pouso e o
     * auge continuarem caindo nas mesmas frações da viagem.
     */
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
