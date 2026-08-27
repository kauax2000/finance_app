"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { formatMoneyBrlTyping, parseMoneyBrl } from "@/lib/money-brl"
import { cn } from "@/lib/utils"

type MoneyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "defaultValue" | "onChange"
> & {
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
}

/**
 * O campo por onde o dinheiro entra.
 *
 * Ele existe por três exigências que um `Input` cru erra por omissão, e que só
 * aparecem quando alguém reclama:
 *
 * 1. **`type="text"`, nunca `number`** — o `number` aceita `e` e `+`, e no
 *    teclado pt-BR o separador decimal briga com a vírgula.
 * 2. **`inputMode="decimal"`** — sem ele o telefone abre o teclado de texto.
 * 3. **A máscara de centavo e a renormalização no `onBlur`** — os dez campos
 *    escritos à mão tinham a primeira e nenhum tinha a segunda: um valor colado
 *    ou meio digitado saía do campo como estava.
 */
const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    { className, value, onValueChange, onBlur, mono = false, inputMode = "decimal", ...props },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = formatMoneyBrlTyping(e.target.value)
      onValueChange(masked, parseMoneyBrl(masked))
    }

    return (
      <Input
        ref={ref}
        data-slot="money-input"
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        spellCheck={false}
        className={cn("nums", mono && "font-mono", className)}
        value={value}
        onChange={handleChange}
        onBlur={(e) => {
          const masked = formatMoneyBrlTyping(e.target.value)
          if (masked !== value) {
            onValueChange(masked, parseMoneyBrl(masked))
          }
          onBlur?.(e)
        }}
        {...props}
      />
    )
  }
)
MoneyInput.displayName = "MoneyInput"

export { MoneyInput, type MoneyInputProps }
