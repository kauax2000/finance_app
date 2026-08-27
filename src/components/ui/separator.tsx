"use client"

import * as React from "react"
import { Separator as SeparatorPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * O peso da régua, e por que ele é um prop.
 *
 * O app tinha **três** pesos da mesma linha escritos à mão: `bg-border` em
 * quatro chamadas, `bg-border/60` em outras quatro — `Dialog`, `AlertDialog` e
 * dois cartões de fatura —, `bg-border/80` numa, mais um `opacity-60` no painel
 * de filtros. Medidos contra o cartão dão 1,35, 1,19 e 1,26: diferenças reais,
 * nenhuma delas dita em lugar nenhum.
 *
 * A intenção por trás delas era uma só, e é legítima: a régua que **estrutura**
 * uma página pesa mais que a régua que **arruma** o interior de uma superfície
 * já delimitada. Um rodapé de diálogo não precisa gritar que ali começa outra
 * coisa — a moldura do diálogo já disse isso.
 */
const separatorVariants = cva("shrink-0", {
  variants: {
    tone: {
      default: "bg-border",
      soft: "bg-border/60",
    },
  },
  defaultVariants: {
    tone: "default",
  },
})

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  tone,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root> &
  VariantProps<typeof separatorVariants>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      data-tone={tone ?? "default"}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        separatorVariants({ tone }),
        // As medidas saem de uma condicional, e não de
        // `data-[orientation=…]:h-4` como antes. Classe com variante não entra
        // no mesmo grupo do merge do Tailwind, então uma classe crua no
        // `className` não a substituía — ela simplesmente não fazia nada.
        //
        // Custou preço duas vezes: o cabeçalho do catálogo pediu `h-5` num
        // separador vertical e continuou com 16px, e o painel de filtros de
        // transações teve que copiar o prefixo inteiro
        // (`data-[orientation=horizontal]:w-[calc(…)]`) para conseguir vencer a
        // base. Um componente que promete um ponto de extensão precisa entregá-lo.
        orientation === "horizontal" ? "h-px w-full" : "h-4 w-px self-center",
        className
      )}
      {...props}
    />
  )
}

export { Separator, separatorVariants }
