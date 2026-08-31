/**
 * A régua da dissolução de bordas — o que `menu-classes` é para as superfícies
 * de comando, este arquivo é para as regiões roláveis.
 *
 * O problema que ela resolve: **uma lista cortada em seco numa borda lê como
 * lista terminada**. A resposta do projeto é dissolver o conteúdo, e não pintar
 * um véu por cima — máscara é alfa, não cor, então ela serve qualquer superfície
 * sem precisar saber de que cor é o fundo. Foi por isso que o `ScrollFade` de
 * gradiente pintado (`from-card` cravado) desenhava uma faixa clara dentro de um
 * popover.
 *
 * As classes de verdade moram em `globals.css` (`scroll-fade-y` / `scroll-fade-x`),
 * porque a rampa tem catorze paradas e precisa existir uma vez só para o sistema.
 * Aqui ficam as combinações que as superfícies compõem.
 *
 * ## As quatro invariantes
 *
 * 1. **`data-scroll-fade` só pode alimentar o que não é layout.** Já alimentou o
 *    `pb` de uma lista, e o resultado foi histerese: declarar "esta rola"
 *    acrescentava recuo ao próprio conteúdo e realimentava a condição, então uma
 *    lista que transbordava 20px virava rolável para sempre. Corolário: escrever
 *    `dataset` de dentro de um `ResizeObserver` só é seguro enquanto isso valer.
 * 2. **O elemento mascarado não desenha nada.** Sem `bg`, sem `ring`, sem
 *    `radius`, sem `shadow` — a máscara recorta o alfa do elemento inteiro, e um
 *    painel com os quatro cantos apagados e os lados opacos lê como bug de
 *    renderização. Onde a casca também rola (`PopoverContent`, os menus), é
 *    preciso um viewport interno.
 * 3. **Um gradiente por elemento.** Nunca `mask-composite`: a spec define
 *    `mask-image: none` como camada preta transparente, então `none` num
 *    `intersect` dá alfa zero e apaga o elemento.
 * 4. **Todo `-` binário dentro de um `calc()` arbitrário se escreve `_-_`.** Não
 *    é "espaço quebra": o Tailwind normaliza o espaçamento em torno de `+`, `*` e
 *    `/`, mas não pode fazer isso com `-` — seria indistinguível de `--var` e de
 *    número negativo. Escrito com espaço literal, a classe é cortada no meio, a
 *    variável não é declarada, a rampa vira inválida em cascata e a máscara cai
 *    para `none`. Medido.
 */

/**
 * Vai na **casca** — o único elemento que enxerga as faixas como irmãs do
 * rolável. Ela publica as duas medidas em zero, e cada superfície escreve o
 * próprio `has-[…]` ao lado para levantá-las:
 *
 * ```
 * scrollFadeBandsClassName,
 * "has-[[data-slot=command-input-wrapper]]:[--scroll-fade-band-h:calc(--spacing(8)+--spacing(4))]",
 * "has-[[data-slot=command-footer]]:[--scroll-fade-foot-h:--spacing(9)]",
 * ```
 *
 * O seletor não pode morar aqui porque ele depende do `data-slot` da faixa, e
 * **classe montada em tempo de execução nunca chega ao CSS** — o Tailwind varre
 * o código como texto. É a mesma razão pela qual `menu-classes` não carrega o
 * `max-h-(--radix-*-content-available-height)`.
 *
 * Quem não tem faixa nenhuma não precisa desta string: os `var(…, 0px)` da
 * utility já caem no fallback.
 */
export const scrollFadeBandsClassName =
  "[--scroll-fade-band-h:0px] [--scroll-fade-foot-h:0px]"

/**
 * Vai no elemento que **rola**, no eixo vertical. Traz as âncoras, a rampa, a
 * máscara e a folga de rolagem; a rolagem em si continua sendo de quem chama
 * (`overflow-y-auto`), porque cada superfície tem a própria (`no-scrollbar`,
 * `overscroll-contain`, `touch-pan-y`).
 */
export const scrollFadeViewportClassName = "scroll-fade-y"

/** O mesmo, no eixo horizontal. Os dois não se combinam — ver invariante 3. */
export const scrollFadeViewportXClassName = "scroll-fade-x"

/**
 * O sangramento sob as faixas: o conteúdo sobe para trás delas e devolve o mesmo
 * tanto em recuo, então ele **passa por baixo** em vez de parar numa borda. É o
 * que dá à rampa o que dissolver.
 *
 * Separado do viewport de propósito. `scroll-padding` é sempre correto e anda
 * com a máscara; margem negativa mexe em layout, e só faz sentido para faixa de
 * **altura fixa e conhecida**. Uma faixa que cresce com o conteúdo (o cabeçalho
 * de um diálogo, o de uma barra lateral) usa o modo sem faixa: dissolve na
 * própria borda do rolável.
 */
export const scrollFadeBleedClassName = [
  "-mt-(--scroll-fade-band-h) pt-[calc(var(--scroll-fade-band-h)+--spacing(1))]",
  "-mb-(--scroll-fade-foot-h) pb-[calc(var(--scroll-fade-foot-h)+--spacing(1))]",
].join(" ")
