/**
 * A régua do vidro. As classes de verdade moram em `globals.css`, na
 * `@utility glass`; aqui ficam as combinações nomeadas e as três armadilhas de
 * quem veste vidro numa superfície que já existe.
 *
 * 1. O shorthand `background` da receita apaga o `background-color`: vestir
 *    vidro substitui o preenchimento da peça, não soma a ele. Uma `bg-*` que
 *    sobreviva ao lado é código morto.
 * 2. `border: 1px solid transparent` toma a borda (o aro mora nela): com
 *    `box-sizing: border-box` o conteúdo encolhe 2px, e um filho absoluto
 *    calibrado (o polegar de um switch) desloca 1px.
 * 3. A utility não declara `border-radius`: ela herda o do consumidor, e é isso
 *    que a torna portátil (`rounded-full` num controle, `rounded-xl` num painel).
 *
 * O preset de controle sobrescreve só a variável de geometria
 * (`--glass-cloud-rx/ry`), nunca a propriedade: duas utilities escrevendo
 * `background` seriam decididas pela ordem de emissão do Tailwind.
 */

/**
 * A superfície numa caixa pequena. Porcentagem escala, percepção não: a nuvem
 * de `100% 18%` são 76px de luz difusa numa placa de 424px e 5,7px num controle
 * de 32px, onde lê como aresta dura — o preset corrige a medida absoluta.
 */
export const glassControlSurfaceClassName = "glass glass-control"

/*
 * O tom do vidro entra pela variável `--glass-tone` (a camada de cima, acima da
 * lâmina), com a cor dos pares `-muted` que já existem; o aro e as nuvens
 * puxam a cor por `--glass-ink`, e o matiz se compra com croma
 * (`--glass-ink-boost`), nunca com alfa — o alfa é o que engrossa o aro.
 *
 * O tom é opaco (ou quase): a lâmina translúcida por baixo escurecia o corpo em
 * 20% contra a versão opaca da mesma cor.
 *
 * Estado (`hover:bg-*`, `data-[state=checked]:bg-*`) declara só
 * `background-color`, que o shorthand da utility não apaga — passa a pintar
 * atrás das camadas e morre calado. Quem veste vidro move o estado para
 * `--glass-tone`, não para o fundo.
 *
 * A camada `var(--glass-sheen, transparent)` fica na `@utility` como ponto de
 * contrato: quem a produz é o marcador de vidro do `Tabs`.
 */

/*
 * As três tintas de vidro por papel moram aqui juntas, para uma não virar alias
 * da outra sem ninguém ver as duas lado a lado: barra, flutuante e modal. Todas
 * vestem a `@utility glass-surface`; o que as separa é o token e o alfa.
 */

/**
 * A superfície de uma barra de chrome (conteúdo passando por baixo: cabeçalho,
 * fileira de menus). `--background` e não `--popover`: no escuro `--popover` e
 * `--card` são a mesma cor, e uma barra pousada num cartão sumiria. 95 de base
 * para o fallback sem `backdrop-filter` ser legível sozinho; sem `dark:`, porque
 * abre nos dois temas. Sobre cor chapada o borrão não desenha nada — o material
 * só aparece quando há conteúdo passando por baixo.
 */
export const barSurfaceClassName = [
  "bg-background/95 glass-surface",
  "supports-backdrop-filter:bg-background/60",
  /** A cor sólida é de quem veste — a utility é dona de uma propriedade só. */
  "reduced-transparency:bg-background",
].join(" ")

/**
 * As camadas da borda da barra (`TopBar surface="edge"`), da mais longa e fraca à mais curta e forte; cada
 * uma borra o que a de baixo já compôs, e o raio efetivo cresce em direção à borda (uma
 * camada só daria raio constante com opacidade variável). Cobrem a barra e 24px abaixo
 * dela: a de 4px fica cheia até a base da barra, e as de 12 e 24px se apagam antes — no
 * topo somam ~27px, no meio da barra ~13, e o conteúdo chega nítido 24px abaixo dela.
 * Sem o borrão (transparência reduzida, alto contraste, sem `backdrop-filter`) as camadas
 * saem e a barra fica com o fundo cheio da superfície.
 */
export const barEdgeLayerBaseClassName = [
  "pointer-events-none absolute inset-x-0 top-0 -z-10 h-[calc(100%+--spacing(6))] bg-(--top-bar-edge-tint) backdrop-saturate-150",
  "reduced-transparency:hidden forced-colors:hidden not-supports-[backdrop-filter:blur(1px)]:hidden",
].join(" ")

export const barEdgeLayerClassNames = [
  "backdrop-blur-[4px] [mask-image:linear-gradient(to_bottom,#000_66%,transparent)]",
  "backdrop-blur-[12px] [mask-image:linear-gradient(to_bottom,#000_45%,transparent_80%)]",
  "backdrop-blur-[24px] [mask-image:linear-gradient(to_bottom,#000_20%,transparent_60%)]",
] as const

/**
 * A tinta da placa flutuante (`Popover`, `Select`, menus, `HoverCard`,
 * `Tooltip`, `Command`, calendário do `DatePicker`): só tinta e material, sem
 * raio, sombra nem fio — a casa inteira é `menuPanelSurfaceClassName`.
 *
 * `--popover` a 85%, abrindo a 60% onde há borrão — nos dois temas, como a
 * barra: no claro ela ficava a 85% e, sobre a página clara, lia como chapa sem
 * vidro. Custo assumido: `--popover` e
 * `--card` são a mesma cor, então sobre um cartão a placa se confunde com ele e
 * quem a separa é o anel e a sombra. A tinta da barra (`--background`) virava
 * uma chapa escura sem vidro.
 */
export const menuPanelTintClassName = [
  "bg-popover/85 glass-surface",
  "supports-backdrop-filter:bg-popover/60",
  /** A cor sólida é de quem veste — a utility é dona de uma propriedade só. */
  "reduced-transparency:bg-popover",
].join(" ")

/**
 * A tinta da pílula da `BottomBar`: a receita flutuante no tom próprio
 * `--bottom-bar-surface`. O `--popover` empata com o `--card` nos dois temas, e
 * sobre um cartão a barra sumia.
 */
export const bottomBarTintClassName = [
  "bg-bottom-bar-surface/85 glass-surface",
  "supports-backdrop-filter:bg-bottom-bar-surface/60",
  "reduced-transparency:bg-bottom-bar-surface",
].join(" ")

/**
 * A superfície das peças modais (`Dialog`, `AlertDialog`, `Sheet`, `Drawer`).
 * `--background` e não `--popover`: sobre a página velada, `--popover` a 60%
 * compõe bem acima do que está atrás e a placa lê como opaca; `--background`
 * afunda no véu e o borrão é o que a distingue. Nenhuma tira pinta por cima
 * dela — um degradê opaco numa tira vira banda no topo da gaveta.
 */
export const modalSurfaceClassName = [
  "bg-background/85 glass-surface",
  // 50% no escuro (era 40; rodada 319, um pouco mais escura a pedido do dono): a
  // placa cobre página quase uniforme e a 60% lia como fosca. No claro, 85% já é
  // o teto de contraste (4,38).
  "supports-backdrop-filter:dark:bg-background/50",
  /** A cor sólida é de quem veste — a utility é dona de uma propriedade só. */
  "reduced-transparency:bg-background",
].join(" ")
