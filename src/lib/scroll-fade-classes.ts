/**
 * A régua da dissolução de bordas: uma lista cortada em seco numa borda lê como
 * lista terminada, então o conteúdo se dissolve por máscara (alfa, não cor — serve
 * qualquer superfície). As classes de verdade moram em `globals.css`
 * (`scroll-fade-y` / `scroll-fade-x`); aqui ficam as combinações.
 *
 * Invariantes:
 * 1. `data-scroll-fade` só alimenta o que não é layout: alimentar o `pb` criou
 *    histerese (a lista declarada rolável acrescentava recuo ao próprio conteúdo).
 * 2. O elemento mascarado não desenha nada (sem `bg`, `ring`, `radius`, `shadow`):
 *    a máscara recorta o alfa do elemento inteiro. Onde a casca também rola,
 *    use um viewport interno.
 * 3. Um gradiente por elemento, nunca `mask-composite`: `mask-image: none` é uma
 *    camada preta transparente e apaga o elemento num `intersect`.
 * 4. Todo `-` binário dentro de um `calc()` arbitrário se escreve `_-_`; com
 *    espaço literal a classe é cortada, a variável não é declarada e a máscara
 *    cai para `none`.
 * 5. O borrão é irmão do rolável, nunca ele nem filho: o `backdrop-filter` no
 *    mascarado é recortado pela própria rampa. A casca hospeda os dois (daí a
 *    opção `shell` do `useScrollFade`).
 * 6. A camada de borrão não convive com a máscara: sem faixa a borda dura do
 *    `backdrop-filter` vira um retângulo na superfície, e com faixa a rampa leva
 *    o conteúdo ao piso de 6% e o borrão fica sem o que borrar. O `Command`
 *    (faixa escrita à mão) monta as camadas; `DialogBody` (tiras de altura
 *    desconhecida) usa só a máscara, mais um degradê no fundo da tira.
 */

/**
 * Vai na casca, o único elemento que enxerga as faixas como irmãs do rolável:
 * publica as duas medidas em zero, e cada superfície escreve o próprio `has-[…]`
 * ao lado (o seletor depende do `data-slot` da faixa e classe montada em
 * runtime nunca chega ao CSS). Quem não tem faixa não precisa desta string.
 *
 * ```
 * scrollFadeBandsClassName,
 * "has-[[data-slot=command-input-wrapper]]:[--scroll-fade-band-h:calc(--spacing(8)+--spacing(4))]",
 * ```
 */
export const scrollFadeBandsClassName =
  "[--scroll-fade-band-h:0px] [--scroll-fade-foot-h:0px]"

/**
 * Vai no elemento que rola, no eixo vertical: âncoras, rampa, máscara e folga
 * de rolagem. A rolagem em si é de quem chama (`overflow-y-auto`).
 */
export const scrollFadeViewportClassName = "scroll-fade-y"

/** O mesmo, no eixo horizontal. Os dois não se combinam (invariante 3). */
export const scrollFadeViewportXClassName = "scroll-fade-x"

/**
 * O véu da borda de baixo, para o rolável que carrega vidro. Vai num nó irmão
 * do rolável, dentro de uma casca `relative` que recebe as variáveis
 * (`useScrollFade` com `shell`). Ver `@utility scroll-fade-veil-y`.
 */
export const scrollFadeVeilClassName = "scroll-fade-veil-y"

/**
 * O sangramento sob as faixas: o conteúdo sobe para trás delas e devolve o
 * mesmo tanto em recuo, dando à rampa o que dissolver. Só para faixa de altura
 * fixa e conhecida (margem negativa mexe em layout); faixa que cresce com o
 * conteúdo usa o modo sem faixa.
 */
export const scrollFadeBleedClassName = [
  "-mt-(--scroll-fade-band-h) pt-[calc(var(--scroll-fade-band-h)+--spacing(1))]",
  "-mb-(--scroll-fade-foot-h) pb-[calc(var(--scroll-fade-foot-h)+--spacing(1))]",
].join(" ")

/**
 * As camadas do borrão progressivo, no eixo vertical, na casca como irmãs do
 * rolável (invariante 5). São três por ponta, com o índice por
 * `style={{ "--scroll-fade-blur-i": i }}`, nunca por classe. Geometria,
 * guardas e rampa moram na `@utility scroll-fade-blur-y`, por
 * `data-edge="start" | "end"`. A camada herda o raio só nos dois cantos da
 * própria ponta, para não pintar sobre o fio da borda.
 */
export const scrollFadeBlurClassName = "scroll-fade-blur-y"

/** O mesmo, no eixo horizontal. */
export const scrollFadeBlurXClassName = "scroll-fade-blur-x"

/**
 * O material do iOS, aplicado junto com a camada de borrão (é um preset de
 * variáveis). Substitui a dissolução: o conteúdo passa nítido e o borrão o
 * esconde, com o `data-scroll-fade-mode="material"` no rolável desligando a
 * máscara. A tinta nasce `transparent`; quem sabe a superfície escreve
 * `--scroll-fade-blur-tint`.
 */
export const scrollFadeMaterialClassName = "scroll-fade-material"

/** Quantas camadas cada ponta empilha: com uma o raio é constante e só a opacidade varia; três dão gradiente de borrão. */
export const SCROLL_FADE_BLUR_LAYERS = [1, 2, 3] as const
