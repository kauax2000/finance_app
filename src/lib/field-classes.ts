/**
 * A superfície de campo — uma só, para os controles que **são** um campo.
 *
 * O que `menu-classes` é para as quatro superfícies de comando, este arquivo é
 * para os controles de formulário. E a razão de existir é a mesma: a mesma
 * decisão estava escrita quatro vezes, em quatro arquivos, e nada garantia que
 * continuassem iguais.
 *
 * Quem veste, hoje: `Input`, `Textarea`, `NativeSelect`, `SelectTrigger`,
 * `ComboboxTrigger`, `DatePicker` e `FormPickerPopoverTrigger` — inline, no
 * próprio controle —, e o `InputGroup`, que é uma **moldura** em volta de um
 * controle e por isso lê os estados pelo que está dentro: são as variantes
 * `fieldGroup*ClassName`, no fim do arquivo, com os mesmos tokens sob `has-`.
 * `field-classes.test.ts` tranca que as duas grafias não se separem.
 *
 * O `InputOTPSlot` **não** veste, e é decisão: ele é uma célula de superfície
 * segmentada — `border-y border-r`, canto só nas pontas, foco por
 * `data-[active]` porque o `<input>` real é invisível por cima. Três de quatro
 * declarações da régua seriam anuladas; vestir seria reimplementar ao contrário.
 *
 * (Quando isto nasceu, a tabela tinha quatro colunas — `Input`,
 * `SelectTrigger`, `InputGroup` em `has-[…]` e `ComboboxTrigger` sobre
 * `Button variant="outline"` — e é a essa quarta que o parágrafo abaixo se
 * refere.)
 *
 * O `Combobox` era o que mais destoava, e não por descuido: ele era montado
 * sobre `Button variant="outline"`, que no tema claro é `border-border` +
 * `bg-background` — uma superfície **visivelmente outra** que a do `Select` ao
 * lado dele. Os dois só convergiam sob `dark:`. Um combobox é um select com
 * busca; até abrir, ele tem de ser indistinguível de um.
 *
 * ## A escada entrou, e com ela o piso de toque
 *
 * Por duas rodadas este cabeçalho argumentou que a altura não podia morar aqui,
 * porque os consumidores a aplicavam por mecânicas diferentes — condicional em
 * JS no `Input`, `data-[size=…]` inline no `SelectTrigger` e no
 * `ComboboxTrigger`, um registro local no `InputGroup`, e a constante daqui nos
 * outros três. O argumento estava certo sobre a mecânica e errado sobre a
 * conclusão: **cinco grafias da mesma escada não são cinco decisões, são uma
 * decisão sem dono**, e nenhum teste as via (grep em todo `*.test.ts`: zero
 * asserções sobre `h-7`).
 *
 * Hoje a altura e o recuo são dois registros, indexados em JS por quem já tem
 * o `size` em mãos. Ver `fieldControlHeightClassName` e
 * `fieldControlPaddingClassName`, no fim do arquivo.
 *
 * ## Duas armadilhas mecânicas
 *
 * **Nada de `cva` aqui.** A regra A2 do auditor reprova essa fábrica de variantes fora de
 * `components/ui/`, e `src/lib/` está fora. Strings literais, como em
 * [`menu-classes`](./menu-classes.ts) e [`scroll-fade-classes`](./scroll-fade-classes.ts).
 *
 * **A ordem de composição é carga estrutural.** `cn` é `twMerge(clsx(…))`, e o
 * projeto estende o grupo `font-size` com `text-2xs` e `text-control-sm`. O
 * `Input size="sm"` resolve `md:text-sm` (daqui) contra `md:text-control-sm`
 * (do degrau) por esse grupo — quem compuser o degrau **antes** da constante
 * faz o `sm` perder o corpo de texto, calado. Constantes primeiro, tamanho e
 * variante por último.
 *
 * ## Um teto conhecido, e ele não é consertado aqui
 *
 * O piso de toque pergunta ao **ponteiro** (`pointer-coarse`), e a regra de
 * 16px do `@layer base` em `globals.css` pergunta à **largura**
 * (`max-width: 767px`). Uma janela de desktop com 700px ganha texto de
 * 16px/24px numa caixa de 32 — 24 de linha, 8 de recuo e 2 de borda dão 34 — e
 * **nenhum piso**, porque o ponteiro dela é fino. Já era o comportamento antes
 * desta rodada, o campo apenas recorta, e cruzar os dois eixos é uma decisão
 * própria: ou o piso passa a perguntar pela largura também, ou a regra de
 * fonte passa a perguntar pelo ponteiro. Fica anotado em vez de resolvido de
 * passagem.
 */

/**
 * O contorno, o preenchimento e o corpo do texto.
 *
 * `border-input` e não `border-border`: são dois tokens porque medem coisas
 * diferentes — `--border` separa superfícies, `--input` **identifica um
 * controle**. Hoje os dois valem o mesmo no claro, e é decisão: o fio do campo
 * quase some (1,16:1 contra o fill) e quem identifica o controle é o
 * **preenchimento**, a `/50` — a conta do `border-beam` do 21st, que o dono
 * trouxe como referência. Fora da 1.4.11 de propósito; a nota está em
 * `globals.css`, no próprio token, com a saída registrada.
 *
 * `text-base md:text-sm` é a rampa que impede o zoom automático do iOS: abaixo
 * de 16px o Safari amplia a página ao focar o campo.
 */
export const fieldSurfaceClassName =
  "rounded-lg border border-input bg-input-fill/50 text-base transition-colors outline-none md:text-sm"

/**
 * O anel de foco do sistema — `ring-3`, e não `ring-2`.
 *
 * É o mesmo valor no `Button`, no `Input`, no `SelectTrigger` e no
 * `MenubarTrigger`. O `TabsTrigger` era o único em `ring-2`, e a diferença de
 * 1px só aparecia quando os dois ficavam na mesma linha.
 *
 * **E ele é o único indicador de foco do campo.** Houve cinco rodadas pondo
 * marca aqui — contorno estático, feixe animado, halo por sombra, a receita do
 * `Button brand`, e ela com teto de croma e de luz —, e o dono as recusou na
 * tela: arco-íris no campo não funciona neste app. O que sobra é o que sempre
 * esteve certo — `--ring`, que é quase preto no claro e quase branco no
 * escuro. `field-control-ladder.test.ts` proíbe a sexta tentativa.
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
 * As mesmas três réguas, para a **moldura** que acende pelo controle de dentro
 * — o `InputGroup`. Ele não é o campo: é uma `div` em volta de um `<input>`, e
 * o foco, o inválido e o desabilitado vivem no filho. Por isso cada token
 * aparece aqui sob `has-…`, e **escrito por extenso**: montar a variante por
 * `.replace()` em runtime seria classe que o Tailwind nunca vê — a armadilha que
 * o AGENTS.md registra três vezes. A paridade com as constantes de cima é
 * trancada em `field-classes.test.ts`, token a token.
 *
 * O foco é só o do controle (`data-slot="input-group-control"`), e não de
 * qualquer descendente: um botão acoplado tem anel próprio, e dois anéis na
 * mesma caixa é o defeito.
 */
export const fieldGroupFocusRingClassName =
  "has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/70"

export const fieldGroupInvalidClassName = [
  "has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20",
  "dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40",
].join(" ")

export const fieldGroupDisabledClassName = [
  "has-disabled:cursor-not-allowed has-disabled:bg-input-fill/50 has-disabled:opacity-50",
  "dark:has-disabled:bg-input-fill/80",
].join(" ")

/**
 * A resposta ao ponteiro, só para o campo que **abre** alguma coisa.
 *
 * O par `active:` não é enfeite nem cortesia com a regra H do auditor: em tela
 * de toque `hover:` compila para `@media (hover: hover)` e simplesmente não
 * vale, então sem ele o gatilho não responde ao dedo. Mesmo alvo nas duas
 * entradas, mesma tinta.
 *
 * **Ele fica sem efeito enquanto o campo está focado**, e é consequência e não
 * defeito: o contorno de marca pinta `background`, que é uma camada acima de
 * `background-color`, e ainda vence em especificidade (0,3,0 contra 0,2,0). Um
 * gatilho focado já está dizendo o que o realce diria.
 */
export const fieldTriggerHoverClassName =
  "hover:bg-input-fill/50 active:bg-input-fill/50"

/** A escada de controle do projeto: os mesmos nomes do `Button` e do `Tabs`. */
export type FieldControlSize = "sm" | "md" | "lg" | "xl"

/**
 * Os números, para um teste poder afirmar que eles não se mexeram.
 *
 * Enquanto a escada era cinco strings espalhadas, não havia como comparar dois
 * degraus — é o defeito que o `Item` teve (`default` e `sm` com a **mesma
 * string**) e que só apareceu quando a escada virou um objeto inspecionável.
 */
export const FIELD_CONTROL_HEIGHTS = {
  sm: 28,
  md: 32,
  lg: 36,
  xl: 40,
} as const satisfies Record<FieldControlSize, number>

/**
 * A altura do controle, com o **piso de toque** embutido.
 *
 * Medido a 375px com ponteiro grosso, antes desta rodada: `sm` 28, `md` 32,
 * `lg` 36 — três degraus abaixo do piso, e o `sm` era uma caixa de 28px
 * carregando uma linha de 24. No dedo a hierarquia de altura não é usável: ela
 * só produz alvos pequenos de tamanhos diferentes.
 *
 * **O piso é 40, e a pergunta é o apontador.** É o degrau que a `Toolbar`
 * publica em `--toolbar-control`, o mesmo que o `Tabs` aplica, e a altura que
 * o app já renderiza no telefone. A pergunta é sobre o **ponteiro** e não sobre
 * a largura da janela, pela mesma razão que `hover: hover` é: um telefone em
 * paisagem continua grosso, um desktop estreito continua fino.
 *
 * `xl` **não** leva o piso: ele já é 40, e um piso redundante é uma segunda
 * grafia esperando para divergir.
 *
 * **Duas armadilhas, as duas medidas em outros componentes desta casa:**
 *
 * 1. **Literais, nunca template.** O Tailwind varre o código como texto; uma
 *    classe montada em runtime nunca chega ao CSS. O `Tabs` pagou essa medição.
 * 2. **Quem decide entre `h-8` e `pointer-coarse:h-10` é a ordem de emissão, e
 *    não a especificidade** — uma media query soma zero, e os dois seletores
 *    empatam. O Tailwind emite a utility com mais variantes depois, no mesmo
 *    arquivo e no mesmo build. E `twMerge` chaveia por modificadores + grupo,
 *    então os dois nunca colapsam um no outro.
 *
 * **Sem prefixo de `data-size`, e isso é carga estrutural para o `InputGroup`.**
 * Ele tem escapes `has-[>textarea]:h-auto` e `has-[>[data-align=block-end]]:h-auto`,
 * ambos (0,2,0), que vencem um `h-8` limpo (0,1,0). Numa grafia
 * `data-[size=…]:h-8` os dois empatariam em (0,2,0) e **um textarea dentro de um
 * grupo ficaria travado em 32px na sorte da ordem**. Indexado em JS, o registro
 * emite a classe crua e o escape continua ganhando.
 */
export const fieldControlHeightClassName = {
  sm: "h-7 pointer-coarse:h-10",
  md: "h-8 pointer-coarse:h-10",
  lg: "h-9 pointer-coarse:h-10",
  xl: "h-10",
} as const satisfies Record<FieldControlSize, string>

/**
 * O recuo de **início** e o corpo do texto.
 *
 * Medido antes desta rodada: `Input md` recuava 12px, `Textarea` 10 e
 * `NativeSelect` 10. Empilhados num formulário, a borda esquerda do texto saía
 * serrilhada — 2px é pouco para nomear a olho e suficiente para o olho notar.
 *
 * **A ponta final não entra aqui, e é de propósito:** `NativeSelect` precisa de
 * `pr-8` para o chevron, `SelectTrigger` e `ComboboxTrigger` de `pr-2.5`, e o
 * `Input` de nenhum. Quem tem chevron sobrescreve `pe-*` **depois** deste
 * registro — `twMerge` mantém os dois e a ponta vence, que é o resultado certo.
 *
 * O `md:text-control-sm` do `sm` vem junto porque ele é o degrau e não a
 * superfície: composto antes de `fieldSurfaceClassName`, o `md:text-sm` de lá
 * o apagaria pelo grupo `font-size`.
 */
export const fieldControlPaddingClassName = {
  sm: "px-2 md:text-control-sm",
  md: "px-3",
  lg: "px-3",
  xl: "px-3",
} as const satisfies Record<FieldControlSize, string>

