"use client"

import { MinusIcon } from "@heroicons/react/16/solid"
import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"

import { cn } from "@/lib/utils"

/**
 * A escada é a do projeto, com os mesmos nomes e as mesmas alturas: 28, 32, 36,
 * 40. Um código de verificação nunca fica ao lado de um botão numa linha de
 * formulário — o motivo original da escada não se aplica aqui —, mas a promessa
 * de que `lg` mede 36 em qualquer componente vale mesmo onde o alinhamento não
 * cobra. Um nome que significa duas alturas custa mais caro que um degrau que
 * sobra.
 *
 * O que a escada **não** resolve é o alvo de toque: ela termina em 40 e o piso
 * confortável é 44. Isso está tratado no contêiner, não aqui.
 */
type InputOTPSize = "sm" | "md" | "lg" | "xl"

const InputOTPContext = React.createContext<InputOTPSize>("md")

/**
 * `Omit` comum achataria a união de props do `OTPInput` — ele aceita `children`
 * **ou** `render`, e um `Omit` sobre a união inteira apaga a distinção e faz o
 * `children` deixar de compilar. Distribuir o `Omit` por cada membro preserva
 * a escolha.
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
  ...props
}: OmitDistributivo<React.ComponentProps<typeof OTPInput>, "size"> & {
  containerClassName?: string
  /** Substitui o `size` nativo do `<input>`, que é largura em caracteres e
      não tem sentido num campo cujas casas são desenhadas à parte. */
  size?: InputOTPSize
}) {
  return (
    <InputOTPContext.Provider value={size}>
      <OTPInput
        data-slot="input-otp"
        data-size={size}
        containerClassName={cn(
          "flex items-center has-disabled:opacity-50",
          // O campo real é um `<input>` só, esticado por cima do contêiner
          // inteiro — então o alvo de toque é este retângulo, e não cada casa.
          // A 32px de altura ele fica 12px abaixo do piso de
          // /designsystem/mobile-toque, e mesmo o degrau `xl` para em 40.
          //
          // Em ponteiro grosso o contêiner cresce para 44 sem crescer o
          // desenho: as casas continuam na altura do degrau, centradas na
          // faixa. Mesma saída do link da navegação do catálogo.
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
        "flex items-center rounded-lg has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40",
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
  const size = React.useContext(InputOTPContext)
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        // `nums` porque isto é uma grade de dígitos: sem figuras tabulares o
        // "1" é mais estreito que o "8", e cada casa centra o próprio glifo
        // num lugar diferente. A 32px passa; a 40 a fileira treme.
        "nums relative flex items-center justify-center border-y border-r border-input bg-input-fill/30 transition-all outline-none first:rounded-l-lg first:border-l last:rounded-r-lg aria-invalid:border-destructive data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-3 data-[active=true]:ring-ring/70 data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40",
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
  const size = React.useContext(InputOTPContext)

  return (
    <div
      data-slot="input-otp-separator"
      // Sem `role="separator"`. O campo é um `<input>` só, com rótulo próprio;
      // o traço entre os blocos é desenho. Anunciá-lo como separador punha uma
      // fronteira no meio da leitura de um valor que não tem duas partes.
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
