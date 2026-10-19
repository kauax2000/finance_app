/**
 * A superfície de campo: uma só, para os controles que são um campo (`Input`,
 * `Textarea`, `NativeSelect`, `SelectTrigger`, `ComboboxTrigger`, `DatePicker`,
 * `FormPickerPopoverTrigger`). O `InputGroup` é uma moldura em volta de um
 * controle e lê os estados por `has-`: são as variantes `fieldGroup*ClassName`,
 * e `field-classes.test.ts` tranca que as duas grafias não se separem. O
 * `InputOTPSlot` não veste: é célula segmentada, e a régua seria anulada.
 *
 * Sem `cva` aqui (regra A2 do auditor: fora de `components/ui/`); strings
 * literais, como em `menu-classes`.
 *
 * A ordem de composição é carga estrutural: `cn` é `twMerge(clsx(…))` e o
 * projeto estende o grupo `font-size` com `text-2xs` e `text-control-sm`. Quem
 * compuser o degrau antes da constante faz o `sm` perder o corpo de texto,
 * calado — constantes primeiro, tamanho e variante por último.
 *
 * Teto conhecido: o piso de toque pergunta ao ponteiro (`pointer-coarse`) e a
 * regra de 16px do `@layer base` pergunta à largura (`max-width: 767px`); uma
 * janela de desktop com 700px ganha texto de 16px numa caixa de 32 e nenhum piso.
 */

/**
 * O contorno, o preenchimento e o corpo do texto. `border-input` e não
 * `border-border`: `--border` separa superfícies, `--input` identifica um
 * controle — e quem o identifica é o preenchimento a `/50`, fora da 1.4.11 de
 * propósito (a nota está em `globals.css`, no token). `text-base md:text-sm`
 * impede o zoom do iOS abaixo de 16px. Cápsula; quem cresce em altura
 * (`Textarea`, `InputGroup` com bloco) sobrescreve com `rounded-row-lg`.
 */
export const fieldSurfaceClassName =
  "rounded-full border border-input bg-input-fill/50 text-base transition-colors outline-none md:text-sm"

/**
 * O anel de foco do sistema: `ring-3` de `--ring` a 30%, e único indicador de
 * foco do campo (`escadas.test.ts` proíbe marca
 * de arco-íris aqui). Fora dos 3:1 da 1.4.11 por decisão do dono: pior caso
 * 1,99 no claro e 2,53 no escuro, contra as sete superfícies; o caminho de
 * volta é `/45` (3,05 e 4,12, piso de 3:1 nos dois temas). Sem script de guarda:
 * mexer em `--secondary` ou `--accent` derruba o foco sem nenhum teste cair.
 * `transition-colors` não cobre `box-shadow`, então o anel estala.
 */
export const fieldFocusRingClassName =
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"

/** O estado inválido vem de `aria-invalid`, escrito por quem chama; o `data-invalid` do `Field` serve ao rótulo, não ao controle. */
export const fieldInvalidClassName = [
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
  "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
].join(" ")

/** O desabilitado, sem `pointer-events-none`. */
export const fieldDisabledClassName = [
  "disabled:cursor-not-allowed disabled:bg-input-fill/50 disabled:opacity-50",
  "dark:disabled:bg-input-fill/80",
].join(" ")

/**
 * As mesmas três réguas para a moldura que acende pelo controle de dentro (o
 * `InputGroup`), cada token escrito por extenso sob `has-…` — montar a variante
 * em runtime é classe que o Tailwind nunca vê. O foco é só o de
 * `data-slot="input-group-control"`: um botão acoplado tem anel próprio, e dois
 * anéis na mesma caixa é o defeito.
 */
export const fieldGroupFocusRingClassName =
  "has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/30"

export const fieldGroupInvalidClassName = [
  "has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20",
  "dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40",
].join(" ")

export const fieldGroupDisabledClassName = [
  "has-disabled:cursor-not-allowed has-disabled:bg-input-fill/50 has-disabled:opacity-50",
  "dark:has-disabled:bg-input-fill/80",
].join(" ")

/**
 * A resposta ao ponteiro, só para o campo que abre alguma coisa. O par `active:`
 * é o que faz o gatilho responder ao dedo (`hover:` não vale no toque). Fica sem
 * efeito com o campo focado: o foco já diz o que o realce diria.
 */
export const fieldTriggerHoverClassName =
  "hover:bg-input-fill/50 active:bg-input-fill/50"

/** Superfície, foco, inválido e desabilitado, nessa ordem; vem primeiro no `cn`, antes do degrau. */
export const fieldControlClassName = [
  fieldSurfaceClassName,
  fieldFocusRingClassName,
  fieldInvalidClassName,
  fieldDisabledClassName,
].join(" ")

/** A mesma régua, mais o realce do ponteiro: o campo que **abre** alguma coisa. */
export const fieldTriggerClassName = [
  fieldControlClassName,
  fieldTriggerHoverClassName,
].join(" ")

/** A escada de controle do projeto: os mesmos nomes do `Button` e do `Tabs`. */
export type FieldControlSize = "sm" | "md" | "lg" | "xl"

/** Os números, para um teste poder comparar os degraus. */
export const FIELD_CONTROL_HEIGHTS = {
  sm: 28,
  md: 32,
  lg: 36,
  xl: 40,
} as const satisfies Record<FieldControlSize, number>

/**
 * A altura do controle, com o piso de toque embutido: 44 no dedo (o alvo do
 * iOS e o degrau da `Toolbar`; era 40 até a rodada 332), perguntado ao ponteiro
 * e não à largura. `xl` também sobe. Literais, nunca template (o Tailwind varre texto). `h-8` e
 * `pointer-coarse:h-11` não colapsam no `twMerge`, e a ordem de emissão decide.
 * Sem prefixo `data-size`: os escapes `has-[>textarea]:h-auto` do `InputGroup`
 * (0,2,0) precisam vencer a altura, e `data-[size=…]:h-8` empataria com eles.
 */
export const fieldControlHeightClassName = {
  sm: "h-7 pointer-coarse:h-11",
  md: "h-8 pointer-coarse:h-11",
  lg: "h-9 pointer-coarse:h-11",
  xl: "h-10 pointer-coarse:h-11",
} as const satisfies Record<FieldControlSize, string>

/**
 * O recuo de início e o corpo do texto. A ponta final fica de fora: quem tem
 * chevron sobrescreve `pe-*` depois deste registro, e a ponta vence. O
 * `md:text-control-sm` do `sm` é o degrau, e `fieldSurfaceClassName` o apagaria
 * se fosse composto antes.
 */
export const fieldControlPaddingClassName = {
  sm: "px-2 md:text-control-sm",
  md: "px-3",
  lg: "px-3",
  xl: "px-3",
} as const satisfies Record<FieldControlSize, string>

