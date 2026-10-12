"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { composeRefs } from "radix-ui/internal"
import { useBrandGlow } from "@/hooks/use-brand-glow"
import { cn } from "@/lib/utils"

/**
 * O rádio: o anel de 16px e o ponto dentro dele; quem carrega o rótulo é o
 * `RadioGroupItem`.
 * Não renderiza sozinho: o Radix não exporta rádio independente, e
 * `RadioGroup.Item` lança fora de um `RadioGroup.Root`. Reimplementar o
 * `role="radio"`, o foco itinerante e o `<input>` espelho seria trocar uma
 * primitiva testada por uma cópia pior; o catálogo demonstra dentro de um grupo.
 * Dentro de um `<form>` o Radix acrescenta um `<input type="radio" aria-hidden>`
 * (`absolute`, sem layout) para o envio nativo; num `<label>` o controle
 * rotulado continua sendo o `<button role="radio">`.
 * O estado é `data-state` (`data-[state=checked]`), nunca `data-checked`.
 * Marcar acende o anel (`--primary-accent`) e o ponto nasce na mola
 * (`zoom-in-0`), como o tique do `Checkbox`.
 * `brand` é o anel cuja borda acende em arco-íris conforme o ponteiro se
 * aproxima (`@utility brand-glow` + `useBrandGlow`). Longe do ponteiro, e no
 * toque, é igual à `default`; a máscara recorta só o anel e o `::after` segue o
 * alvo de 44px. Uma por tela.
 */
const radioVariants = cva(
  [
    "relative aspect-square size-4 shrink-0 rounded-full border border-input text-primary-accent shadow-xs outline-none transition-colors duration-(--duration-fast)",
    // O fundo escurecido do escuro é o da caixa do sistema; a marca o divide, já
    // que o brilho recorta só o anel.
    "dark:bg-input-fill/30",
    // Marcado, o anel ganha a tinta do ponto.
    "data-[state=checked]:border-primary-accent",
    // O par de toque do `Checkbox`: `hover:` compila dentro de `@media (hover:
    // hover)`. E o par `dark:hover:`, porque `dark:` empata com `hover:` e é
    // emitido depois.
    "hover:bg-muted/60 active:bg-muted/60 dark:hover:bg-muted/60 dark:active:bg-muted/60",
    // O alvo de toque, igual ao do `Checkbox` e do `Switch`: desenho de 16px,
    // tocável de 44 (16 + 2 × 14, `inset: -14px`).
    "after:absolute after:-inset-3.5 after:content-['']",
    // O anel segue o dos controles de escolha (`Checkbox`, `Switch`), e não
    // `fieldFocusRingClassName`: um controle redondo não veste `fieldSurfaceClassName`
    // (três das quatro declarações seriam anuladas), e importar só o anel esconderia
    // que o resto diverge. Precedente do `InputOTPSlot`.
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/45",
    // Byte a byte `fieldInvalidClassName`, com o `ring-3` (largura do anel) junto da cor.
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    // Sem `pointer-events-none` de propósito: com ele o `cursor-not-allowed`
    // não chega a aparecer, porque o elemento deixa de receber o ponteiro.
    "disabled:cursor-not-allowed disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "",
        // A borda que acende perto do ponteiro, em intensidade cheia: num anel de 16px o arco tem poucos pixels.
        brand: "brand-glow isolate [--brand-glow-opacity:1]",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

function Radio({
  className,
  variant,
  ref,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> &
  VariantProps<typeof radioVariants>) {
  const glowRef = useBrandGlow<HTMLButtonElement>(variant === "brand")
  return (
    <RadioGroupPrimitive.Item
      ref={composeRefs(glowRef, ref)}
      data-slot="radio"
      data-variant={variant ?? "default"}
      className={cn(radioVariants({ variant }), className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-indicator"
        className="flex size-full items-center justify-center"
      >
        {/*
           Um ponto não precisa ser SVG: `rounded-full` com a cor de fundo o desenha. A
           tinta é `currentColor`, o que dá trabalho ao `text-primary-accent` do anel (o
           ponto é marca sobre o fundo, não carrega texto); `bg-current` faz
           `<Radio className="text-destructive">` retingir sem tocar aqui.
        */}

        <span className="size-2.5 rounded-full bg-current animate-in zoom-in-0 animation-duration-(--duration-spring) ease-(--ease-spring)" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { Radio, radioVariants }
