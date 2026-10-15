import * as React from "react"

import { formatMoneyBrlTyping, normalizeMoneyBrlOnBlur, parseMoneyBrl } from "@/lib/money-brl"
import { cn } from "@/lib/utils"
import {
  fieldControlClassName,
  fieldControlHeightClassName,
  fieldControlPaddingClassName,
  type FieldControlSize,
} from "@/lib/field-classes"

/** Mesma escada do Button (sm 28, md 32, lg 36, xl 40); no dedo os três de baixo sobem ao piso de 40. Substitui o `size` nativo do <input>. */
type InputSize = FieldControlSize

/** O campo de texto. `money` ausente ou `false`. */
type InputBaseProps = Omit<React.ComponentProps<"input">, "size"> & {
  size?: InputSize
  money?: false
  onValueChange?: never
  mono?: never
}

/** O campo por onde o dinheiro entra. */
type InputMoneyProps = Omit<
  React.ComponentProps<"input">,
  "size" | "type" | "defaultValue" | "onChange"
> & {
  size?: InputSize
  money: true
  /** A string já mascarada. O modo dinheiro é sempre controlado. */
  value: string
  /**
   * Recebe a string mascarada e o número em reais; o segundo argumento é
   * opcional para quem chama.
   */
  onValueChange: (raw: string, parsedReais: number | null) => void
  /** Geist Mono nas figuras. Desligado por padrão; a figura tabular fica sempre ligada. */
  mono?: boolean
  type?: never
  defaultValue?: never
  onChange?: never
}

/**
 * Os dois ramos declaram as mesmas chaves (uma fechada com `?: never` no outro),
 * para um `const { onValueChange, ...rest }` compilar em qualquer ramo sem o
 * `rest` perder nada calado; é o idioma do `Kbd`.
 */
type InputProps = InputBaseProps | InputMoneyProps

/**
 * O campo de uma linha; com `money`, o campo por onde o dinheiro entra:
 * `type="text"` (o `number` aceita `e` e briga com a vírgula pt-BR),
 * `inputMode="decimal"`, e a máscara de centavo com renormalização no `onBlur`.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      size = "lg",
      money,
      mono,
      value,
      inputMode,
      autoComplete,
      spellCheck,
      onChange,
      onBlur,
      onValueChange,
      ...props
    },
    ref
  ) => {
    // Nenhum hook aqui: dois componentes fariam o React desmontar o <input> se
    // `money` alternasse, e o campo perderia o foco no meio da digitação.
    const handleChange = money
      ? (e: React.ChangeEvent<HTMLInputElement>) => {
          const masked = formatMoneyBrlTyping(e.target.value)
          onValueChange?.(masked, parseMoneyBrl(masked))
        }
      : onChange

    // `onBlur` é composto, não deixado no spread: um `onBlur` da tela apagaria
    // a renormalização.
    const handleBlur = money
      ? (e: React.FocusEvent<HTMLInputElement>) => {
          // Não é a máscara de digitação: um valor posto por código ("250") é
          // lido como reais.
          const masked = normalizeMoneyBrlOnBlur(e.target.value)
          if (masked !== value) {
            onValueChange?.(masked, parseMoneyBrl(masked))
          }
          onBlur?.(e)
        }
      : onBlur

    return (
      <input
        ref={ref}
        // Saem do spread e voltam com `??`; quem chama pode sobrescrevê-los.
        type={money ? "text" : type}
        inputMode={money ? (inputMode ?? "decimal") : inputMode}
        autoComplete={money ? (autoComplete ?? "off") : autoComplete}
        spellCheck={money ? (spellCheck ?? false) : spellCheck}
        data-slot="input"
        data-size={size}
        data-money={money || undefined}
        className={cn(
          // O degrau vem por último: o `sm` traz `md:text-control-sm`, que só
          // vence o `md:text-sm` da superfície se vier depois.
          fieldControlClassName,
          // `disabled:pointer-events-none` fica aqui, e não na régua: o
          // `SelectTrigger` não o tem.
          // A partir de `md` (texto de 14px), 3 em cima e 5 embaixo: o `<input>`
          // nativo assentava o texto 1px abaixo do gatilho de mesma altura (o "0"
          // nas linhas 14–23 de 36, contra 13–22 no `FormPickerPopoverTrigger`).
          // Com os 16px do telefone ele já fica no centro, e o 3/5 passava do ponto.
          "w-full min-w-0 py-1 md:pt-0.75 md:pb-1.25 placeholder:text-muted-foreground disabled:pointer-events-none",
          "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Altura e recuo saem do mesmo registro dos outros campos.
          fieldControlHeightClassName[size],
          fieldControlPaddingClassName[size],
          // Depois do degrau e antes do `className` de quem chama.
          money && "nums",
          money && mono && "font-mono",
          className
        )}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
export type { InputProps, InputBaseProps, InputMoneyProps, InputSize }
