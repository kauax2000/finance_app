/**
 * A superfície de uma **barra de chrome** — a que tem conteúdo passando por
 * baixo dela.
 *
 * É a terceira das três superfícies de vidro da casa, e as três divergem de
 * propósito: [`menuPanelSurfaceClassName`](./menu-classes.ts) é a **flutuante**
 * (`--popover`, 85/60 sob `dark:`), [`modalSurfaceClassName`](./modal-classes.ts)
 * é a **modal** (`--background`, 85/40), e esta é a barra. O material é o mesmo
 * nas três — a `@utility glass-surface`, dona de uma propriedade só
 * (`backdrop-filter`: 24px e `saturate(1.5)`, com o guarda de
 * `prefers-reduced-transparency`) —, e o que muda é a tinta.
 *
 * Ela **não é nova**: é a receita que o cabeçalho do catálogo já rodava, e que
 * estava escrita à mão lá. Extrair é o precedente das outras duas, e é o que
 * impede a quarta cópia da mesma forma.
 *
 * ## As três escolhas, e por que cada uma diverge
 *
 * - **`--background`, e não `--popover`.** No tema escuro `--popover` e `--card`
 *   são a mesma cor (`oklch(0.205)`): uma barra `--popover` pousada num cartão
 *   sumiria. Quem define uma barra é o contraste contra a superfície em que ela
 *   pousa, e não a elevação.
 * - **95 de base, e não 85.** Sem `backdrop-filter` os 60% deixariam o conteúdo
 *   passar por trás do rótulo — e o fallback tem de ser legível sozinho. Opaco
 *   de base; translúcido só onde o borrão existe.
 * - **Sem `dark:`.** Ao contrário das outras duas, ela abre nos dois temas. No
 *   claro o efeito é quase nulo (`--background` 250 composto sobre `--card` 255
 *   dá Δ2), e isso é dito em vez de escondido: no tema claro o vidro quase não
 *   se paga, e é o mesmo teto que a rodada 47 já mediu.
 *
 * ## E ela só desenha onde há o que borrar
 *
 * `backdrop-filter` sobre cor chapada não desenha nada — a lei que
 * `globals.css` escreve. Uma barra sobre um cartão liso sai igual à opaca; o
 * material aparece quando o conteúdo passa por baixo, que é o caso do
 * cabeçalho fixo e o da fileira de menus no topo de uma região que rola.
 */
export const barSurfaceClassName = [
  "bg-background/95 glass-surface",
  "supports-backdrop-filter:bg-background/60",
  /** A cor sólida é de quem veste — a utility é dona de uma propriedade só. */
  "reduced-transparency:bg-background",
].join(" ")
