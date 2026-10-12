/**
 * A régua da divulgação, a linha que abre e fecha um bloco. `Accordion` e
 * `Collapsible` são a mesma interação e dividem esta régua; sem `cva` (regra A2
 * do auditor), cada componente compõe o que é seu.
 */

/**
 * A escada é a de controles do sistema, sem degrau novo: uma linha de frase
 * não desce abaixo de 32, e os números são os mesmos de `Button`, `Input` e
 * `Tabs`. A medida é `min-h` e nunca `h`: o rótulo quebra em duas linhas, e uma
 * altura fixa transformaria a quebra em recorte.
 */
export const DISCLOSURE_ROW_HEIGHTS = { md: 32, lg: 36, xl: 40 } as const

export type DisclosureSize = keyof typeof DISCLOSURE_ROW_HEIGHTS

/** Escrito por extenso, um por degrau: classe montada em runtime nunca chega ao CSS. */
export const DISCLOSURE_ROW_HEIGHT_CLASS = {
  32: "min-h-8",
  36: "min-h-9",
  40: "min-h-10",
} as const

/** A geometria da linha. `w-full` e não `flex-1`: o espaço vazio à direita do rótulo é metade do alvo. */
export const disclosureRowClassName = [
  "group/disclosure flex w-full items-center gap-3 text-left text-sm font-medium",
  "text-foreground",
  "transition-colors duration-(--duration-fast) ease-(--ease-out)",
  "disabled:pointer-events-none disabled:opacity-50",
  /**
   * O empurrão do marcador mora numa variável na raiz: o valor depende de duas
   * coisas (cursor e aberto), e uma variante empilhada
   * (`group-hover/disclosure:group-data-[state=open]/disclosure:`) compila para
   * uma cadeia de descendente que não casa quando os dois apontam para o mesmo
   * elemento. O hover só troca qual variável o filho lê.
   */
  "[--disclosure-nudge:0.125rem] data-[state=open]:[--disclosure-nudge:-0.125rem]",
  // O alvo de toque pergunta ao apontador, não à largura.
  "pointer-coarse:min-h-11",
].join(" ")

/**
 * O rótulo carrega o realce de cursor, não a linha, e o realce não é fundo: a
 * peça mora sobre `Card`, `muted`, diálogo e página, e um fundo de realce
 * precisaria conhecer a superfície de baixo. O sublinhado escopado ao rótulo
 * marca a palavra que responde ao clique e deixa o `trailing` (o total em
 * dinheiro) fora — traço sob número lê como rasura. O par `active:` existe
 * porque `hover:` não vale no toque.
 */
export const disclosureLabelClassName = [
  "min-w-0 flex-1 text-pretty",
  "underline-offset-4 decoration-from-font",
  "group-hover/disclosure:underline group-active/disclosure:underline",
].join(" ")

/**
 * O anel de foco é interno, a única divergência consciente do `ring-3` do
 * sistema: a linha sangra até a borda do bloco, e um anel externo é cortado
 * pelo `overflow-hidden` do `contained` ou cavalga o fio da vizinha em `plain`.
 */
export const disclosureRowFocusClassName =
  "outline-none focus-visible:inset-ring-3 focus-visible:inset-ring-ring/45"

/**
 * O marcador é um ícone que gira (a seta para baixo a 180° é a seta para
 * cima), e o segundo sinal de cursor: a tinta sobe de `muted` para `foreground`
 * e a seta se desloca 2px no sentido em que o clique levará. `translate` e
 * `rotate` são independentes no Tailwind v4 e o `translate` resolve antes, então
 * os 2px descem na tela mesmo com a seta de cabeça para baixo; por isso a
 * transição nomeia as três propriedades em vez de `transition-transform`.
 */
export const disclosureMarkerClassName = [
  "pointer-events-none size-4 shrink-0 text-muted-foreground",
  "transition-[rotate,translate,color] duration-(--duration-base) ease-(--ease-out)",
  "group-hover/disclosure:text-foreground group-active/disclosure:text-foreground",
  "group-hover/disclosure:translate-y-(--disclosure-nudge) group-active/disclosure:translate-y-(--disclosure-nudge)",
  "group-data-[state=open]/disclosure:rotate-180",
].join(" ")

/**
 * O trajeto da altura (keyframes `accordion-*`/`collapsible-*`, que leem
 * `--tw-duration` e `--tw-ease`). Abrir é mola (`--ease-spring`), fechar é
 * curva: uma mola até zero passa por baixo de zero e o bloco para seco no meio.
 */
export const disclosureMotionClassName =
  "overflow-hidden data-open:animation-duration-(--duration-spring) data-open:ease-(--ease-spring) data-closed:animation-duration-(--duration-base) data-closed:ease-(--ease-out)"

/**
 * O conteúdo que aparece: cada filho sobe em cascata, na mesma mola da altura
 * (`@utility disclosure-reveal`, em `globals.css`). Quem já nasce aberto toca a
 * cascata no carregamento, e a espiada do `Collapsible` não a veste.
 */
export const disclosureRevealClassName = "disclosure-reveal"
