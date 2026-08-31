/**
 * A superfície de campo — uma só, para os controles que **são** um campo.
 *
 * O que `menu-classes` é para as quatro superfícies de comando, este arquivo é
 * para os controles de formulário. E a razão de existir é a mesma: a mesma
 * decisão estava escrita quatro vezes, em quatro arquivos, e nada garantia que
 * continuassem iguais.
 *
 * | | Input | SelectTrigger | InputGroup | ComboboxTrigger |
 * | --- | --- | --- | --- | --- |
 * | superfície | inline | inline | em `has-[…]` | **`Button variant="outline"`** |
 * | anel de foco | inline | inline | em `has-[…]` | do `Button` |
 * | `aria-invalid` | inline | inline | em `has-[…]` | do `Button` |
 *
 * O `Combobox` era o que mais destoava, e não por descuido: ele era montado
 * sobre `Button variant="outline"`, que no tema claro é `border-border` +
 * `bg-background` — uma superfície **visivelmente outra** que a do `Select` ao
 * lado dele. Os dois só convergiam sob `dark:`. Um combobox é um select com
 * busca; até abrir, ele tem de ser indistinguível de um.
 *
 * ## O que entrou aqui, e o que não entrou
 *
 * Só o que era **byte a byte idêntico** entre `Input` e `SelectTrigger`. A
 * conferência achou duas divergências reais, e nenhuma das duas foi dissolvida
 * à força:
 *
 * 1. **`disabled:pointer-events-none` só existe no `Input`.** Está fora de
 *    `fieldDisabledClassName` de propósito — o `Input` continua declarando o
 *    seu inline. Somá-lo aqui seria mudar o comportamento do `SelectTrigger`
 *    dentro de um refactor que promete ser no-op, e um refactor que muda
 *    comportamento é como uma régua compartilhada perde a confiança na primeira
 *    semana. (Que os dois gatilhos, sendo elementos de botão, já bloqueiem ponteiro por `disabled`
 *    nativo é verdade, e é justamente por isso que o token do `Input` é o
 *    estranho — mas isso é conserto, não extração.)
 * 2. **`hover:` / `active:` só existem no gatilho.** Um campo de texto não tem
 *    o que insinuar ao cursor; um gatilho que abre painel tem. Por isso o par
 *    mora num export próprio, que o `Input` não importa.
 *
 * A **escada de altura** também não entrou, e não por esquecimento: os três
 * consumidores a aplicam por três mecânicas diferentes — o `Input` por
 * condicional em JS, o `SelectTrigger` por `data-[size=…]` inline, o `Button`
 * por variante de `cva`. Uma constante só serviria os do meio, e uma régua que
 * serve um terço dos casos é uma quarta grafia disfarçada de solução.
 *
 * ## Duas armadilhas mecânicas
 *
 * **Nada de `cva` aqui.** A regra A2 do auditor reprova essa fábrica de variantes fora de
 * `components/ui/`, e `src/lib/` está fora. Strings literais, como em
 * [`menu-classes`](./menu-classes.ts) e [`tag-chip-classes`](./tag-chip-classes.ts).
 *
 * **A ordem de composição é carga estrutural.** `cn` é `twMerge(clsx(…))`, e o
 * projeto estende o grupo `font-size` com `text-2xs` e `text-control-sm`. O
 * `Input size="sm"` resolve `md:text-sm` (daqui) contra `md:text-control-sm`
 * (do degrau) por esse grupo — quem compuser o degrau **antes** da constante
 * faz o `sm` perder o corpo de texto, calado. Constantes primeiro, tamanho e
 * variante por último.
 */

/**
 * O contorno, o preenchimento e o corpo do texto.
 *
 * `border-input` e não `border-border`: são o mesmo valor hoje, e continuam
 * sendo dois tokens porque a decisão registrada em `globals.css` é que o
 * contorno de campo pode voltar a divergir — ver a nota da 1.4.11 no AGENTS.md.
 *
 * `text-base md:text-sm` é a rampa que impede o zoom automático do iOS: abaixo
 * de 16px o Safari amplia a página ao focar o campo.
 */
export const fieldSurfaceClassName =
  "rounded-lg border border-input bg-input-fill/30 text-base transition-colors outline-none md:text-sm"

/**
 * O anel de foco do sistema — `ring-3`, e não `ring-2`.
 *
 * É o mesmo valor no `Button`, no `Input`, no `SelectTrigger` e no
 * `MenubarTrigger`. O `TabsTrigger` era o único em `ring-2`, e a diferença de
 * 1px só aparecia quando os dois ficavam na mesma linha.
 */
export const fieldFocusRingClassName =
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70"

/**
 * O estado inválido. Vem de `aria-invalid`, escrito por quem chama — o `Field`
 * deste projeto **não** tem contexto, e o `data-invalid` que ele carimba serve
 * ao rótulo e à mensagem, não ao controle.
 */
export const fieldInvalidClassName = [
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
  "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
].join(" ")

/**
 * O desabilitado — **sem** `pointer-events-none`. Ver a divergência 1 no
 * cabeçalho: o `Input` a declara inline, e é ele quem está fora do padrão.
 */
export const fieldDisabledClassName = [
  "disabled:cursor-not-allowed disabled:bg-input-fill/50 disabled:opacity-50",
  "dark:disabled:bg-input-fill/80",
].join(" ")

/**
 * A resposta ao ponteiro, só para o campo que **abre** alguma coisa.
 *
 * O par `active:` não é enfeite nem cortesia com a regra H do auditor: em tela
 * de toque `hover:` compila para `@media (hover: hover)` e simplesmente não
 * vale, então sem ele o gatilho não responde ao dedo. Mesmo alvo nas duas
 * entradas, mesma tinta.
 */
export const fieldTriggerHoverClassName =
  "hover:bg-input-fill/50 active:bg-input-fill/50"
