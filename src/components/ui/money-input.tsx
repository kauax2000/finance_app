"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import {
  formatMoneyBrlTyping,
  parseMoneyBrl,
} from "@/lib/money-brl"
import { cn } from "@/lib/utils"

type MoneyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  value: string
  onValueChange: (raw: string, parsedReais: number | null) => void
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
}

/**
 * BRL centavo-style typing mask (see `formatMoneyBrlTyping` in `money-brl.ts`).
 */
function MoneyInput({
  className,
  value,
  onValueChange,
  onBlur,
  inputMode = "decimal",
  ...props
}: MoneyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = formatMoneyBrlTyping(e.target.value)
    onValueChange(masked, parseMoneyBrl(masked))
  }

  return (
    <Input
      data-slot="money-input"
      type="text"
      inputMode={inputMode}
      autoComplete="off"
      spellCheck={false}
      className={cn("font-mono tabular-nums", className)}
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

export { MoneyInput, type MoneyInputProps }
