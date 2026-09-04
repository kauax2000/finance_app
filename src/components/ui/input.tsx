import * as React from "react"

import { formatMoneyBrlTyping, parseMoneyBrl } from "@/lib/money-brl"
import { cn } from "@/lib/utils"
import {
  fieldDisabledClassName,
  fieldFocusRingClassName,
  fieldInvalidClassName,
  fieldSurfaceClassName,
} from "@/lib/field-classes"

/** Mesma escada do Button, mesmos nomes: sm 28, md 32, lg 36, xl 40.
    Substitui o `size` nativo do <input>, que é largura em caracteres e
    nunca foi usado aqui. */
type InputSize = "sm" | "md" | "lg" | "xl"

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
  /** A string **já mascarada**. O modo dinheiro é sempre controlado. */
  value: string
  /**
   * Recebe a string já mascarada e o número em reais. O segundo argumento é
   * opcional para quem chama: `onValueChange={setTexto}` compila e funciona,
   * porque uma função de menos parâmetros é atribuível.
   */
  onValueChange: (raw: string, parsedReais: number | null) => void
  /**
   * Geist Mono nas figuras. **Desligado por padrão, e isso é uma correção.**
   *
   * O componente cravava `font-mono`, e era a única decisão dele que era de
   * desenho e não de comportamento — provavelmente o motivo de dez campos de
   * dinheiro do app terem sido escritos à mão em vez de usá-lo: adotar mudava
   * a cara da tela. O que resolve o problema real, o número que se desloca a
   * cada centavo digitado, é a figura tabular, e essa continua sempre ligada.
   */
  mono?: boolean
  type?: never
  defaultValue?: never
  onChange?: never
}

/**
 * Os dois ramos declaram **as mesmas chaves** — o ramo base fecha `onValueChange`
 * e `mono` com `?: never`, o de dinheiro fecha `type`, `defaultValue` e
 * `onChange`. É o idioma do `Kbd` (`keys` contra `children`), e a razão é
 * mecânica: com as chaves presentes nos dois lados, um `const { onValueChange,
 * ...rest }` compila em qualquer ramo e o `rest` não perde nada calado. Com
 * `Omit` puro, `onValueChange` sumiria do `rest` no ramo colapsado — sem aviso.
 *
 * **E é o que dispensa o estreitamento aqui dentro.** `onValueChange` colapsa
 * para `Fn | undefined`, então o corpo o chama com `?.()` e nunca precisa
 * perguntar em que ramo está.
 */
type InputProps = InputBaseProps | InputMoneyProps

/**
 * O campo de uma linha — e, com `money`, o campo por onde o dinheiro entra.
 *
 * O modo existe por três exigências que um campo cru erra por omissão, e que só
 * aparecem quando alguém reclama:
 *
 * 1. **`type="text"`, nunca `number`** — o `number` aceita `e` e `+`, e no
 *    teclado pt-BR o separador decimal briga com a vírgula.
 * 2. **`inputMode="decimal"`** — sem ele o telefone abre o teclado de texto.
 * 3. **A máscara de centavo e a renormalização no `onBlur`** — os dez campos
 *    escritos à mão tinham a primeira e nenhum tinha a segunda: um valor colado
 *    ou meio digitado saía do campo como estava.
 *
 * **Por que um modo, e não um componente.** O `MoneyInput` importava só o
 * `Input` e renderizava só um `<Input>`: era este átomo com outro nome. Ver a
 * nota da página do catálogo.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      size = "md",
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
    // Nenhum hook aqui, e é o que permite ao modo viver no corpo em vez de num
    // componente interno: dois componentes fariam o React desmontar o <input>
    // se `money` alternasse, e o campo perderia o foco no meio da digitação.
    const handleChange = money
      ? (e: React.ChangeEvent<HTMLInputElement>) => {
          const masked = formatMoneyBrlTyping(e.target.value)
          onValueChange?.(masked, parseMoneyBrl(masked))
        }
      : onChange

    // `onBlur` é **composto**, nunca deixado no spread: ele renormaliza e só
    // então chama o de quem chama. Spreadado, um `onBlur` da tela apagaria a
    // renormalização — que é justamente o que os dez campos à mão não tinham.
    const handleBlur = money
      ? (e: React.FocusEvent<HTMLInputElement>) => {
          const masked = formatMoneyBrlTyping(e.target.value)
          if (masked !== value) {
            onValueChange?.(masked, parseMoneyBrl(masked))
          }
          onBlur?.(e)
        }
      : onBlur

    return (
      <input
        ref={ref}
        // Os quatro saem do spread e voltam com `??` porque no `MoneyInput` eles
        // vinham antes de `{...props}`: quem chama podia sobrescrevê-los, e
        // continua podendo.
        type={money ? "text" : type}
        inputMode={money ? (inputMode ?? "decimal") : inputMode}
        autoComplete={money ? (autoComplete ?? "off") : autoComplete}
        spellCheck={money ? (spellCheck ?? false) : spellCheck}
        data-slot="input"
        data-size={size}
        data-money={money || undefined}
        className={cn(
          // A régua compartilhada vem primeiro; o degrau, por último. `cn` é
          // `twMerge`, e o `sm` traz `md:text-control-sm` — que só vence o
          // `md:text-sm` da superfície se vier depois dele.
          fieldSurfaceClassName,
          fieldFocusRingClassName,
          fieldInvalidClassName,
          fieldDisabledClassName,
          // `disabled:pointer-events-none` fica aqui, e não na régua: o
          // `SelectTrigger` não o tem, e igualá-los seria mudar comportamento
          // dentro de uma extração que promete não mudar nenhum.
          "w-full min-w-0 px-2.5 py-1 placeholder:text-muted-foreground disabled:pointer-events-none",
          "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          size === "sm" && "h-7 px-2 md:text-control-sm",
          size === "md" && "h-8 px-3",
          size === "lg" && "h-9 px-3",
          size === "xl" && "h-10 px-3",
          // Depois do degrau e antes do `className` de quem chama — a mesma
          // ordem que `cn("nums", mono && "font-mono", className)` produzia
          // quando o `MoneyInput` a passava como `className` do `Input`.
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
