"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { CheckIcon, MinusIcon } from "@heroicons/react/16/solid"
import { cva, type VariantProps } from "class-variance-authority"

import { composeRefs, useBrandGlow } from "@/hooks/use-brand-glow"
import { cn } from "@/lib/utils"

/**
 * A caixa de escolha booleana.
 *
 * ## Marcar floresce (rodada 154)
 *
 * O preenchimento marcado não troca de cor: ele **floresce do centro**, a
 * flor que foi do `Button` até a rodada 240 e hoje é só daqui (`@utility
 * button-bloom`, `--button-bloom` de 0 a 1),
 * na mola da casa ao marcar e em `--ease-out` ao desmarcar. O tique entra
 * junto, crescendo de 50%; e como ele tem a cor do fundo desmarcado, é a flor
 * que o revela. A borda vira `--primary` no mesmo ritmo.
 *
 * ## O eixo `variant`, e por que ele existe
 *
 * `default` é a caixa do sistema: marcada, ela é a tecla `--primary` com o
 * tique branco. `brand` é a mesma caixa com a **borda que acende em
 * arco-íris conforme o ponteiro se aproxima** (rodada 155) — a família do
 * brilho, a do `Alert`, do `Card`, do `Badge` e do `Button brand`
 * (`@utility brand-glow` + `useBrandGlow`). Longe do ponteiro, e no toque, ela
 * é pixel a pixel a `default`. Uma por tela, como as outras peças de marca.
 *
 * ## O brilho só pinta a borda, e o `::after` continua sendo o alvo
 *
 * O anel do brilho é recortado na máscara da `brand-glow` (rodada 156): o
 * meio da caixa nunca é pintado, e o preenchimento marcado, a flor e o hover
 * aparecem intactos sob o arco. O `::after` segue sendo o alvo de toque de
 * 44px — o brilho não precisa dele.
 */
const checkboxVariants = cva(
  [
    "group peer relative size-4 shrink-0 rounded-sm border border-input bg-background shadow-xs outline-none",
    // A flor do marcado: a cor, a variável ligada nos dois estados cheios, e o
    // ritmo de cada lado — mola ao marcar, `--ease-out` ao desmarcar. A lista
    // de `transition` enumera a variável; `transition-colors` a deixaria de
    // fora, e a flor estalaria.
    "button-bloom [--button-bloom-fill:var(--primary)]",
    "data-[state=checked]:[--button-bloom:1] data-[state=indeterminate]:[--button-bloom:1]",
    "transition-[color,background-color,border-color,box-shadow,--button-bloom] duration-(--duration-slow) ease-(--ease-out)",
    "data-[state=checked]:duration-(--duration-spring) data-[state=checked]:ease-(--ease-spring)",
    "data-[state=indeterminate]:duration-(--duration-spring) data-[state=indeterminate]:ease-(--ease-spring)",
    // O controle desenhado tem 16px; o pseudo-elemento leva a área de
    // toque aos 44px que um dedo pede, sem mexer no layout. É a mesma
    // técnica do `Switch`. Não substitui envolver o item num `Label`
    // clicável numa lista — soma a ela.
    //
    // Ele mora na **base**, e não numa variante: o alvo de toque não é
    // assunto de aparência.
    "after:absolute after:-inset-3.5 after:content-['']",
    // O par de toque: `hover:` compila dentro de `@media (hover: hover)`.
    // Marcada, a flor cobre a caixa, e o realce fica por baixo dela.
    "hover:bg-muted/60 active:bg-muted/60",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/45",
    // O estado inválido do `Radio`, que a caixa não tinha: um termo de uso
    // obrigatório desmarcado não mudava de aparência nenhuma.
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
          "data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-primary-foreground",
        ].join(" "),
        // A borda que acende perto do ponteiro (rodada 155). Intensidade
        // cheia, a do `Badge` e do `Button`: numa caixa de 16px o arco tem
        // poucos pixels. As cores do marcado são as da `default`.
        brand: [
          "brand-glow isolate [--brand-glow-opacity:1]",
          "data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
          "data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-primary-foreground",
        ].join(" "),
      },
    },
    defaultVariants: { variant: "default" },
  },
)

function Checkbox({
  className,
  variant,
  ref,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> &
  VariantProps<typeof checkboxVariants>) {
  const glowRef = useBrandGlow<HTMLButtonElement>(variant === "brand")
  return (
    <CheckboxPrimitive.Root
      ref={composeRefs(glowRef, ref)}
      data-slot="checkbox"
      data-variant={variant ?? "default"}
      className={cn(checkboxVariants({ variant }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={cn(
          // A tinta do tique é a do marcado desde o primeiro quadro, e não
          // `currentColor`: a cor da raiz faz transição do texto para
          // `--primary-foreground`, e o tique nascia escuro antes da flor
          // chegar. Cravado, ele tem a cor do fundo desmarcado e só aparece
          // quando a flor passa por baixo dele.
          "flex size-full items-center justify-center text-primary-foreground",
        )}
      >
        {/* O tique entra crescendo de 50%, na mesma mola da flor. */}
        <CheckIcon className="size-3.5 hidden group-data-[state=checked]:block animate-in zoom-in-50 animation-duration-(--duration-spring) ease-(--ease-spring)" />
        <MinusIcon className="size-3.5 hidden group-data-[state=indeterminate]:block animate-in zoom-in-50 animation-duration-(--duration-spring) ease-(--ease-spring)" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox, checkboxVariants }
