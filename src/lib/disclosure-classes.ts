/**
 * A régua da **divulgação** — a linha que abre e fecha um bloco.
 *
 * `Accordion` e `Collapsible` são a mesma interação. O AGENTS.md já dizia isso
 * ao consertar a animação do segundo ("dois componentes com a mesma interação e
 * comportamentos diferentes, o que faz a escolha entre eles virar uma decisão de
 * movimento em vez de uma decisão de estrutura"), e o conserto de lá parou na
 * altura animada. Tudo o mais continuou divergindo, porque **um deles desenhava
 * a linha e o outro não desenhava nada**:
 *
 * | | Accordion | Collapsible |
 * | --- | --- | --- |
 * | altura da linha | `py-2.5` (~40px, não nomeada) | do que o consumidor puser |
 * | marcador | dois ícones trocando | escrito à mão em cada tela |
 * | rotação | nenhuma (troca de glifo) | `rotate-180` e `rotate-90`, duas grafias |
 * | realce de cursor | `hover:underline` | do consumidor |
 * | alvo de toque | nenhum | do consumidor |
 * | anel de foco | `ring-3` + um `after:` que não existe | do consumidor |
 *
 * Os dois consumidores reais do `Collapsible` — `credit-card-form-fields` e a
 * gaveta de código do próprio catálogo — montavam a linha por conta própria, em
 * **duas grafias diferentes** (`ChevronDown` girando 180 contra `ChevronRight`
 * girando 90, `size-3.5` contra o corpo padrão). É o invariante 1 acontecendo
 * dentro do design system: quando o componente não desenha a linha, cada tela a
 * desenha um pouco diferente.
 *
 * Segue o precedente de [`menu-classes`](./menu-classes.ts) e de
 * [`field-classes`](./field-classes.ts): régua compartilhada mora em `lib/`, sem
 * `cva` (regra A2 do auditor), e cada componente compõe o que é seu.
 */

/**
 * A escada, e ela é **a escada de controles do sistema** — não uma nova.
 *
 * `xs` 24, `sm` 28, `md` 32, `lg` 36, `xl` 40. Uma linha de divulgação não desce
 * abaixo de 32: ela carrega um rótulo de frase inteira, e não um rótulo de
 * botão. Então a janela que ela oferece é `md` | `lg` | `xl`, com **os mesmos
 * números que esses nomes têm em `Button`, `Input` e `Tabs`** — que é a regra
 * inteira do AGENTS.md sobre a escada: nem todo controle oferece todos os
 * degraus, mas nenhum usa um nome para uma altura diferente.
 *
 * O `py-2.5` anterior do `Accordion` dava ~40px sem nome nenhum. Ele existe
 * agora, e se chama `xl`.
 *
 * A medida é **`min-h`**, e não `h`: o rótulo de um acordeão quebra em duas
 * linhas, e um `h-8` fixo transformaria a quebra em recorte.
 */
export const DISCLOSURE_ROW_HEIGHTS = { md: 32, lg: 36, xl: 40 } as const

export type DisclosureSize = keyof typeof DISCLOSURE_ROW_HEIGHTS

/**
 * Escrito por extenso, um por degrau: o Tailwind varre o código como **texto**,
 * e uma classe montada em tempo de execução nunca chega ao CSS. É a mesma razão
 * pela qual `menu-classes` não carrega o `max-h-(--radix-*)`.
 */
export const DISCLOSURE_ROW_HEIGHT_CLASS = {
  32: "min-h-8",
  36: "min-h-9",
  40: "min-h-10",
} as const

/**
 * A geometria da linha.
 *
 * `w-full` e não `flex-1`: a linha ocupa a largura do bloco que ela abre, sempre
 * — é o que a torna clicável no espaço vazio à direita do rótulo, que é metade
 * do alvo.
 */
export const disclosureRowClassName = [
  "group/disclosure flex w-full items-center gap-3 text-left text-sm font-medium",
  "text-foreground",
  "transition-colors duration-(--duration-fast) ease-(--ease-out)",
  "disabled:pointer-events-none disabled:opacity-50",
  /**
   * O empurrão do marcador, **como variável na raiz** — e essa forma não é
   * estilo, é obrigação.
   *
   * O valor depende de dois estados ao mesmo tempo: de a linha estar sob o
   * cursor **e** de ela estar aberta. Escrito como variante empilhada
   * (`group-hover/disclosure:group-data-[state=open]/disclosure:`), o Tailwind
   * compila uma **cadeia de descendente** — e quando as duas apontam para o
   * mesmo elemento o seletor não casa com nada. Este projeto já pagou essa
   * medição no `AppThemeToggle`, e a saída registrada lá é esta: o estado mora
   * numa variável na raiz, e o hover só troca **qual** variável o filho lê.
   * Cada classe fica com um variante só.
   */
  "[--disclosure-nudge:0.125rem] data-[state=open]:[--disclosure-nudge:-0.125rem]",
  /**
   * O alvo de toque, pela mesma pergunta que `menu-classes` faz: sobre o
   * **apontador**, e não sobre a largura da janela. Um telefone em paisagem
   * continua grosso; um desktop estreito continua fino.
   */
  "pointer-coarse:min-h-11",
].join(" ")

/**
 * O rótulo — e é **aqui** que o realce de cursor mora, não na linha.
 *
 * ## Por que o fundo saiu
 *
 * A linha chegou a acender com `bg-accent/60`, que é a língua do menu, da
 * lateral e do pé do catálogo. Só que aqueles três sabem sobre o que estão
 * pousados, e um acordeão não: ele mora dentro de `Card`, dentro de `muted`,
 * dentro de diálogo e direto na página. **Um realce que troca a cor de fundo
 * precisa combinar com a superfície de baixo, e esta peça não conhece a
 * superfície de baixo** — sobre `bg-muted` o `accent` quase some, e sobre
 * `bg-card` num dos temas ele é quase o próprio cartão. Realce não pode depender
 * de uma informação que o componente não tem.
 *
 * ## E por que ele não voltou a ser o `hover:underline` de antes
 *
 * O original sublinhava **o botão inteiro**, e `text-decoration` desce para todo
 * descendente em linha: o valor da direita — o total em dinheiro do slot
 * `trailing` — vinha sublinhado junto. Traço sob número lê como rasura, e num
 * app de finanças essa é a pior leitura possível. Um sublinhado atravessando
 * 700px de linha também não lê como link; lê como marcação.
 *
 * Escopado ao rótulo, o traço faz o que um sublinhado faz: marca **a palavra**
 * que responde ao clique. O `trailing` fica de fora, e a linha inteira continua
 * sendo o alvo.
 *
 * `decoration-from-font` deixa a espessura sair da métrica da fonte em vez de um
 * pixel cravado — é a mesma razão de `underline-offset-4` e não um número
 * arbitrário: o traço acompanha o corpo do texto quando o degrau da escada muda.
 *
 * O par `active:` vem junto porque no telefone `hover:` não existe — a variante
 * compila para `@media (hover: hover)` —, e esta linha é tocada.
 */
export const disclosureLabelClassName = [
  "min-w-0 flex-1 text-pretty",
  "underline-offset-4 decoration-from-font",
  "group-hover/disclosure:underline group-active/disclosure:underline",
].join(" ")

/**
 * O anel de foco é **interno**, e essa é a única divergência consciente em
 * relação ao `ring-3` externo do resto do sistema.
 *
 * A linha de divulgação sangra até a borda do bloco que a contém. Um anel
 * externo tem só dois destinos ali, e os dois são defeito: dentro de
 * `variant="contained"` a casca é `overflow-hidden` e o anel some nos quatro
 * lados da primeira e da última linha; em `plain`, ele cavalga o fio que separa
 * a linha da vizinha e produz um traço duplo de 4px.
 *
 * `inset-ring` resolve os dois sem exceção por variante: o anel mora dentro da
 * própria caixa da linha, que é onde o foco de uma linha de lista pertence.
 */
export const disclosureRowFocusClassName =
  "outline-none focus-visible:inset-ring-3 focus-visible:inset-ring-ring/70"

/**
 * O marcador — **um** ícone que gira, e não dois que se revezam.
 *
 * O `Accordion` trazia um `ChevronDownIcon` e um `ChevronUpIcon`, um escondendo
 * o outro por `group-aria-expanded`. É a mesma decisão que a rodada do `Tabs`
 * já julgou e reverteu: dois marcadores piscando não dizem o que um marcador se
 * movendo diz. Aqui o custo era ainda mais barato de evitar — a seta para baixo
 * girando 180° **é** a seta para cima, com o trajeto de graça.
 *
 * Ele é o **segundo sinal de cursor**, e os dois que dá não tocam em fundo
 * nenhum: a tinta sobe de `muted` para `foreground`, e a seta **se desloca no
 * sentido em que o clique vai levar** — dois pixels para baixo quando o bloco
 * vai abrir, dois para cima quando vai fechar. A direção sai da variável que a
 * linha publica; ver `disclosureRowClassName`.
 *
 * `translate` e `rotate` são propriedades **independentes** no Tailwind v4, e o
 * `translate` é resolvido antes do `rotate` — então os 2px descem na tela mesmo
 * com a seta de cabeça para baixo. É o que mantém o sinal legível no estado
 * aberto, e é também por isso que a transição nomeia as três propriedades em vez
 * de `transition-transform`: o que se move aqui não é `transform`.
 */
export const disclosureMarkerClassName = [
  "pointer-events-none size-4 shrink-0 text-muted-foreground",
  "transition-[rotate,translate,color] duration-(--duration-base) ease-(--ease-out)",
  "group-hover/disclosure:text-foreground group-active/disclosure:text-foreground",
  "group-hover/disclosure:translate-y-(--disclosure-nudge) group-active/disclosure:translate-y-(--disclosure-nudge)",
  "group-data-[state=open]/disclosure:rotate-180",
].join(" ")

/**
 * O trajeto da altura, para quem anima com os keyframes do `tw-animate-css`.
 *
 * Os keyframes já existem (`accordion-down/up`, `collapsible-down/up`, ligados
 * às variáveis de altura do Radix) e leem `--tw-duration` / `--tw-ease`. O que
 * faltava era o projeto **declarar os seus**: o `Accordion` rodava no padrão de
 * fábrica (200ms `ease-out` do Tailwind) enquanto o `Collapsible` já pedia
 * `--duration-base` com `--ease-out`. Dois componentes com a mesma interação
 * abrindo em curvas diferentes.
 */
export const disclosureMotionClassName =
  "overflow-hidden duration-(--duration-base) ease-(--ease-out)"
