"use client"

import * as React from "react"
import { Toggle as TogglePrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Um estado, não uma ação — e a silhueta precisa dizer isso antes do rótulo.
 *
 * O desenho anterior era um `Button variant="secondary"` com outro nome: canto
 * `xl`, contorno visível quando ligado, preenchimento cinza, e no `outline`
 * ainda um `shadow-xs`. Três sinais que a interface reserva para "clique aqui
 * para fazer algo", num controle que só responde "isto está ligado".
 *
 * Agora ele é fantasma: **em repouso não tem cromo nenhum** — sem borda, sem
 * preenchimento, sem sombra, e a tinta é a apagada. Ligado, a tinta fica cheia
 * sobre o cinza do `secondary`. O chão sozinho não seria sinal — ele quase
 * empata com o do `hover` —, e é por isso que o salto de tinta é que responde.
 *
 * Duas diferenças de propósito em relação ao `Button`:
 *
 * - **Sem `active:translate-y-px`.** O botão afunda porque foi pressionado e
 *   algo aconteceu. O toggle não é pressionado, ele passa a valer — e o
 *   deslocamento sugeria um retorno que não existe.
 * - **A pele sem contorno não se chama `tertiary`.** No `Button` o nome diz um
 *   degrau de uma escada de três; o toggle não tem escada, tem duas peles, e o
 *   nome descreve o cromo em vez de uma posição que não existe. Ela se chama
 *   `plain`, que é a palavra do sistema para "não desenha nada" — medido,
 *   `plain` estava em 5 componentes contra `plain` em 4 e `bare` em 1.
 */
const toggleVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-transparent",
    // Desligado é tinta apagada. É metade do sinal: sem essa diferença de
    // tinta, ligar só acrescentaria um fundo, e o fundo sozinho é a caixa que
    // fazia o controle parecer botão.
    "text-sm font-medium whitespace-nowrap text-muted-foreground",
    "transition-colors duration-(--duration-fast) ease-(--ease-out) outline-none",
    // `active:` é o par de toque do `hover:` — no telefone `hover` não existe,
    // e sem ele encostar no controle não devolvia nada.
    //
    // O chão do hover é o mesmo cinza de sempre; o que saiu foi a troca de
    // tinta que vinha junto. `--muted` e `--secondary` são o mesmo valor no
    // escuro e ficam a 1,01 no claro, então o chão sozinho não separa hover de
    // ligado — com a tinta trocando também, passar o ponteiro num toggle
    // desligado o deixava idêntico a um ligado. Mantendo a tinta apagada, o
    // hover diz "estou aqui" e só o ligado diz "estou valendo".
    "hover:bg-muted active:bg-muted",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70",
    "disabled:pointer-events-none disabled:opacity-50",
    // Ligado é o cinza do `secondary`, não o verde da marca. O verde já é a
    // ação principal e, num app de finanças, também é dinheiro que entra: um
    // toggle aceso de verde competia com o CTA da tela e pedia para ser lido
    // como sinal de valor. Estado não gasta a cor que a ação precisa.
    //
    // Quem carrega o sinal continua sendo a tinta — apagada desligado, cheia
    // ligado —, e o chão só confirma. É a diferença para o desenho antigo, que
    // era o mesmo cinza somado a borda visível e sombra.
    "data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground",
    "data-[state=on]:hover:bg-secondary-hover data-[state=on]:active:bg-secondary-hover",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  ),
  {
    variants: {
      variant: {
        plain: "",
        // A exceção, para o toggle que aparece sozinho numa superfície sem
        // nenhuma outra pista de que ali se clica. Sem o `shadow-xs` de antes:
        // sombra é o que levanta a peça da página, e estado não levanta.
        outline: "border-border",
      },
      // As alturas já eram a escada do projeto — 28, 32, 36 —, só que o degrau
      // do meio se chamava `default`. O nome foi removido de `Button`, `Input`,
      // `SelectTrigger` e `NativeSelect` justamente para o compilador acusar
      // quem o escrevesse; este era o último lugar que ainda o dizia.
      size: {
        sm: "h-7 min-w-7 px-1.5 text-xs",
        md: "h-8 min-w-8 px-2",
        lg: "h-9 min-w-9 px-2.5",
      },
    },
    defaultVariants: {
      variant: "plain",
      size: "md",
    },
  }
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
