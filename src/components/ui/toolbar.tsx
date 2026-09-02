import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A linha de ações e filtros acima de uma tabela ou lista.
 *
 * **Sem `role="toolbar"`, de propósito.** Esse papel é um contrato de teclado:
 * o grupo inteiro ocupa uma parada de tabulação e as setas andam entre os
 * controles. Aqui cada controle é tabulável por conta própria, então o papel
 * anunciava um widget que não existia — pior que não anunciar nada, porque
 * quem navega por teclado tentava as setas e nada acontecia. Enquanto o
 * comportamento não existir, isto é o que de fato é: uma linha de layout.
 * Para nomear o grupo, passe `role="group"` com `aria-label`.
 *
 * A regra existe porque foi violada: o app escreve `role="toolbar"` à mão em
 * **4 lugares** — `transactions-table.tsx:264,320` e
 * `subscriptions/page-client.tsx:545,608`, sendo os dois últimos cópia verbatim
 * dos dois primeiros —, e nenhum implementa foco itinerante.
 *
 * ## A tese anterior estava errada
 *
 * Este arquivo dizia "no telefone os itens quebram em linhas em vez de
 * encolher", e a página do catálogo repetia. **Nenhuma das 6 barras reais
 * quebra em linhas.** Todas trocam de conteúdo: uma árvore `md:hidden` com um
 * botão só de ícone, e outra `hidden md:flex` com o mesmo comando rotulado.
 * O que existe é substituição, não quebra — e é `ToolbarRow` que a torna
 * escrevível sem duplicar árvore.
 *
 * O `flex-wrap` fica: `bills-toolbar.tsx:152` de fato quebra no telefone. O que
 * saiu foi a afirmação de que essa é a forma do padrão.
 *
 * ## Zero eixos, e isso é a leitura honesta das contagens
 *
 * Não há `cva` aqui, como em `Container` e `PageSection`. Cada candidato a eixo
 * foi contado e reprovado:
 *
 * - **`sticky`** — zero barras fixas no app. O único `sticky top-0` é o
 *   `TableHeader`, e `--z-sticky` tem um consumidor no projeto inteiro.
 * - **`align`** — 4 grafias (`justify-between`, `md:justify-between`,
 *   `ml-auto`, `md:justify-end`), mas as 6 querem a mesma coisa. Uma
 *   `ms-auto` em `ToolbarActions` as substitui — ver abaixo.
 * - **`layout` / empilhar no telefone** — parece 2 de 6, e não é: o `flex-col`
 *   de `subscriptions-toolbar.tsx:78` é vestigial, porque na largura de
 *   telefone a raiz tem **um** filho visível. Só `transactions-toolbar`
 *   empilha de verdade, e só porque tem um terceiro grupo — o que `flex-wrap`
 *   mais `w-full` naquele filho já entrega. 1 de 6 não é eixo.
 * - **`size`** — mediria o **contêiner**, que é o defeito cometido quatro
 *   vezes nesta base (`Menubar` 24px, `Tabs` 27px, `Item` com dois degraus
 *   iguais, `Calendar` prometendo 36 e medindo 28). A barra não tem altura
 *   própria, e por isso também **não carimba `data-size`**: um atributo que não
 *   corresponde a uma caixa é pior que atributo nenhum.
 */

/**
 * Os dois degraus da densidade, com os nomes da escada do sistema
 * (xs 24, sm 28, md 32, lg 36, xl 40).
 *
 * O app escreve `h-10 … md:h-8` — 40 no toque, 32 no desktop — em 19 lugares,
 * mais 6 esqueletos, mais quatro constantes `monthNavDense*` cujo ramo `false`
 * é código morto (os 6 chamadores passam `dense`).
 */
export const TOOLBAR_CONTROL_HEIGHTS = { fine: 32, coarse: 40 } as const

/**
 * A raiz publica a densidade; ela **não** declara altura nenhuma.
 *
 * **E a pergunta é o dedo, não a largura.** As 6 barras perguntam `md:`, e o
 * `AGENTS.md` já julgou isso no item de menu: *"a linha cresce no toque, não no
 * telefone… um telefone em paisagem continua grosso, um desktop estreito
 * continua fino"*. Com `md:`, um desktop com a janela em 700px recebe controles
 * de 40px que ninguém pede, e um tablet em paisagem recebe 32px que o dedo não
 * acerta. O `Calendar` já resolve pelo ponteiro
 * (`pointer-coarse:[--cell-size:--spacing(11)]`), e esta barra faz igual.
 *
 * Aqui isso não custa migração nenhuma: o componente tem zero consumidores,
 * então não há aritmética a preservar. Quem migrar as 6 barras troca `md:` por
 * ponteiro de graça.
 */
const toolbarClassName = [
  "flex min-w-0 flex-wrap items-center gap-2 md:gap-3",
  "[--toolbar-control:--spacing(8)] pointer-coarse:[--toolbar-control:--spacing(10)]",
].join(" ")

/**
 * Para um controle de texto dentro da barra. **Só vale dentro de um
 * `Toolbar`** — fora dele a variável não existe e a altura cai para o
 * conteúdo.
 *
 * Ela chega por `className`, e não por seletor descendente, e a razão é
 * medida: `in-*` e `group-*` compilam com `:where()`, que **não soma
 * especificidade** — um `in-data-[size=xl]:h-10` empata com o `h-8` que o
 * próprio `Button` traz e perde por ordem de emissão. Por `className` quem
 * decide é o `twMerge`, que **remove** o degrau conflitante em vez de disputar
 * com ele. É o mesmo caminho que o app já usa ao escrever `h-10 md:h-8` num
 * `Button`.
 */
export const toolbarControlClassName = "h-(--toolbar-control)"

/** O mesmo, para botão de ícone: `size-*` governa os dois eixos. */
export const toolbarIconControlClassName = "size-(--toolbar-control)"

/**
 * A linha do telefone que **se dissolve** na barra a partir de `md`.
 *
 * `display: contents` faz a caixa desaparecer e promove os filhos a itens de
 * flex da própria `Toolbar`. É o que permite escrever uma árvore só para o
 * segmento e o botão de ícone que o acompanha no telefone, e ainda assim ter o
 * segmento medido pela barra no desktop. Aparece **5×** no app, escrita à mão.
 *
 * **A dissolução leva a caixa junto.** Em `md` esta `div` não existe: o
 * `min-w-0`, o `gap` e qualquer `flex-1` dela deixam de valer. Por isso não se
 * põe `role` nem `aria-label` aqui — some do layout e confunde a árvore; para
 * nomear o grupo existe `ToolbarFilters`. E um filho que trunca precisa
 * carregar o próprio `min-w-0`.
 */
const toolbarRowClassName = "flex min-w-0 items-center gap-2 md:contents"

/**
 * O ponto de "há filtro ativo" — e **só para botão sem rótulo**.
 *
 * Num botão com rótulo a marca é a **contagem**, num `Badge` dentro do fluxo:
 * ela diz *quantos* filtros há em vez de só que há, e não sobrepõe nada.
 * Medido, o ponto absoluto ali encostava no "s" de "Filtros" — 2px, nos dois
 * eixos. (Ele **não** ficava em cima da borda, ao contrário do que a primeira
 * medição desta rodada afirmou: a folga até a curva era de 4,59px. O defeito
 * era o texto, e a primeira leitura confundiu folga com sobreposição.)
 *
 * **A âncora é `top-1 right-1`, e os dois números saem de medição.** Com
 * `top-1.5` o ponto invadia a caixa do ícone em **3px**; a 1 ele invade **1**,
 * e a folga até a curva do canto continua em **4,59px** — a mesma de antes,
 * porque a distância ao centro do arco é simétrica em torno dele. Descer para
 * `top-0.5` zera a invasão do ícone mas derruba a folga da curva para 1,76,
 * e aí o ponto passa mesmo a ler como estando na borda.
 *
 * Quatro grafias no app para a mesma marca, em três arquivos. A que saiu é
 * `transactions-toolbar.tsx:202`, `-top-1 -right-1 size-3` com
 * `border-2 border-background`: ela sai da caixa do botão (some sob qualquer
 * `overflow-hidden` no caminho) e o anel `border-background` **afirma** o que
 * há atrás dela, o que é falso assim que a barra estiver sobre outra
 * superfície.
 *
 * `bg-primary-accent`, e não `bg-primary`: a regra é um teste, não gosto — se a
 * cor vai carregar texto claro por cima, é `--primary`; se ela mesma precisa
 * ser enxergada contra a página, é `--primary-accent`. Um ponto de 8px não
 * carrega nada.
 *
 * `aria-hidden` de fábrica: o estado já tem de estar no `aria-label` do
 * controle, e os quatro chamadores fazem isso.
 */
const toolbarFilterIndicatorClassName =
  "pointer-events-none absolute top-1 right-1 size-2 rounded-full bg-primary-accent"

function Toolbar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="toolbar"
      className={cn(toolbarClassName, className)}
      {...props}
    />
  )
}

function ToolbarRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="toolbar-row"
      className={cn(toolbarRowClassName, className)}
      {...props}
    />
  )
}

/**
 * O grupo da esquerda: o trilho segmentado e os gatilhos de filtro. Cresce e
 * encolhe com o espaço.
 *
 * Chamava-se `ToolbarSearch`, e o nome era falso duas vezes: **nenhuma** barra
 * do app tem campo de busca — a de transações mora dentro da folha de filtros —
 * e o que o grupo carrega em 5 das 6 é um controle segmentado. O nome descrevia
 * a demonstração do catálogo, que por sua vez não descrevia tela nenhuma.
 */
function ToolbarFilters({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="toolbar-filters"
      className={cn("flex min-w-0 flex-1 items-center gap-2", className)}
      {...props}
    />
  )
}

/**
 * O grupo da direita: as ações. Nunca encolhe.
 *
 * **`ms-auto`, e não `justify-between` na raiz.** As duas dão o mesmo resultado
 * com dois grupos, e só a margem acerta os outros dois casos: com **um** grupo
 * — o `dashboard-toolbar`, que só tem o seletor de mês — `justify-between`
 * renderiza `flex-start` e joga o grupo para a esquerda; com **três** grupos, o
 * `transactions-toolbar` chega a alternar `md:justify-between` ↔
 * `md:justify-end` em tempo de execução conforme exista o grupo do meio, que é
 * exatamente a conta que a margem automática dispensa.
 *
 * Ela é a **única** margem automática do arquivo, e isso é carga estrutural:
 * duas `ms-auto` na mesma linha dividem a sobra em partes iguais em vez de
 * empurrar a segunda para a borda — a medição já registrada no
 * `AccordionTrigger`. O teste de régua tranca a contagem.
 */
function ToolbarActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="toolbar-actions"
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-end gap-2 ms-auto",
        className
      )}
      {...props}
    />
  )
}

function ToolbarFilterIndicator({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="toolbar-filter-indicator"
      className={cn(toolbarFilterIndicatorClassName, className)}
      {...props}
    />
  )
}

export {
  Toolbar,
  ToolbarActions,
  ToolbarFilterIndicator,
  ToolbarFilters,
  ToolbarRow,
  toolbarClassName,
  toolbarFilterIndicatorClassName,
  toolbarRowClassName,
}
