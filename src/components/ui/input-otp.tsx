"use client"

import { MinusIcon } from "@heroicons/react/16/solid"
import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"

import { cn } from "@/lib/utils"

/**
 * A escada é a do projeto (28, 32, 36, 40). Ela termina em 40 e o piso de toque
 * é 44, que o contêiner trata.
 */
type InputOTPSize = "sm" | "md" | "lg" | "xl"

/**
 * O degrau e o erro, descendo do campo para as casas. O `aria-invalid` cai no
 * `<input>` do `OTPInput`, que é irmão dos grupos, então o `has-aria-invalid`
 * do grupo nunca casaria; por isso o erro vem por contexto.
 */
const InputOTPContext = React.createContext<{ size: InputOTPSize; invalid: boolean }>({
  size: "md",
  invalid: false,
})

/**
 * `Omit` comum achataria a união de props do `OTPInput` (`children` **ou**
 * `render`); distribuí-lo por membro preserva a escolha.
 */
type OmitDistributivo<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never

const slotSizes: Record<InputOTPSize, string> = {
  sm: "size-7 text-control-sm",
  md: "size-8 text-sm",
  lg: "size-9 text-base",
  xl: "size-10 text-lg",
}

/** O cursor falso é pouco mais da metade da casa, como num campo de texto. */
const caretSizes: Record<InputOTPSize, string> = {
  sm: "h-3.5",
  md: "h-4",
  lg: "h-5",
  xl: "h-5",
}

const separatorSizes: Record<InputOTPSize, string> = {
  sm: "px-1 [&_svg:not([class*='size-'])]:size-3.5",
  md: "px-1 [&_svg:not([class*='size-'])]:size-4",
  lg: "px-1.5 [&_svg:not([class*='size-'])]:size-4",
  xl: "px-1.5 [&_svg:not([class*='size-'])]:size-5",
}

function InputOTP({
  className,
  containerClassName,
  size = "md",
  "aria-invalid": ariaInvalid,
  ...props
}: OmitDistributivo<React.ComponentProps<typeof OTPInput>, "size"> & {
  containerClassName?: string
  /** Substitui o `size` nativo do `<input>`, que é largura em caracteres e
      não tem sentido num campo cujas casas são desenhadas à parte. */
  size?: InputOTPSize
}) {
  return (
    <InputOTPContext.Provider
      value={{ size, invalid: ariaInvalid === true || ariaInvalid === "true" }}
    >
      <OTPInput
        aria-invalid={ariaInvalid}
        data-slot="input-otp"
        data-size={size}
        containerClassName={cn(
          "flex items-center has-disabled:opacity-50",
          // O `<input>` real é um só, esticado sobre o contêiner: o alvo de
          // toque é este retângulo. Em ponteiro grosso ele cresce a 44 sem
          // crescer o desenho.
          "pointer-coarse:min-h-11",
          containerClassName
        )}
        spellCheck={false}
        className={cn("disabled:cursor-not-allowed", className)}
        {...props}
      />
    </InputOTPContext.Provider>
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn(
        // O raio é o do campo (cápsula), nas pontas do grupo e nas casas da ponta.
        "flex items-center rounded-full has-data-invalid:ring-3 has-data-invalid:ring-destructive/20 dark:has-data-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number
}) {
  const { size, invalid } = React.useContext(InputOTPContext)
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      data-invalid={invalid || undefined}
      className={cn(
        // `nums`: sem figuras tabulares o "1" é mais estreito que o "8" e a
        // fileira treme. O anel da casa ativa é o do campo.
        "nums relative flex items-center justify-center border-y border-r border-input bg-input-fill/30 transition-all outline-none first:rounded-l-full first:border-l last:rounded-r-full data-invalid:border-destructive data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-3 data-[active=true]:ring-ring/30 data-[active=true]:data-invalid:border-destructive data-[active=true]:data-invalid:ring-destructive/20 dark:data-[active=true]:data-invalid:ring-destructive/40",
        slotSizes[size],
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "w-px animate-caret-blink bg-foreground",
              caretSizes[size]
            )}
          />
        </div>
      )}
    </div>
  )
}

function InputOTPSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { size } = React.useContext(InputOTPContext)

  return (
    <div
      data-slot="input-otp-separator"
      // Sem `role="separator"`: o campo é um `<input>` só e o traço é desenho;
      // anunciá-lo partiria a leitura de um valor sem duas partes.
      aria-hidden
      className={cn(
        "flex items-center text-muted-foreground",
        separatorSizes[size],
        className
      )}
      {...props}
    >
      <MinusIcon />
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
