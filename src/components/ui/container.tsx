import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Os degraus de largura, como tabela.
 *
 * Ela existe separada do `cva` para as páginas que desenham a régua poderem
 * iterá-la — e `page-chrome-ladder.test.ts` tranca que as duas não divergem. É
 * a mesma forma do `Tabs`: o Tailwind varre o código como **texto**, então o
 * `cva` fica com os literais e a tabela fica com os nomes.
 *
 * **Os números são contados, e não escolhidos.** A escada anterior oferecia
 * 672 / 1024 / 1280, com 1024 de padrão. Medido nas nove cascas de página
 * escritas à mão no app: **576px em seis delas**, 448 em duas, 672 em uma — e
 * **1024 em nenhuma, no repositório inteiro**. A rodada anterior renomeou
 * `default` para `md` e deixou o número sem examinar; o nome ficou certo
 * apontando para uma largura que nenhuma tela pediu, que é a mesma lição de
 * "padrão que ninguém escolhe não é padrão" reintroduzida um round depois de
 * registrada.
 *
 * `max-w-5xl` saiu por isso. Devolver um degrau no dia em que uma tela pedir é
 * uma linha; mantê-lo agora é manter a ficção.
 */
const containerSizes = {
  /** 448 — a casca de erro e a de confirmação. */
  sm: "max-w-md",
  /** 576 — o padrão, e a largura de seis das nove cascas do app. */
  md: "max-w-xl",
  /** 672 — o detalhe de cartão. */
  lg: "max-w-2xl",
  /** 1280 — a casca do catálogo. */
  xl: "max-w-7xl",
  /** Sem teto: quem já tem largura de fora. */
  full: "max-w-none",
} as const

/**
 * A calha lateral, e ela é opt-in.
 *
 * **Era o que tornava o componente inadotável.** A casca do app
 * (`sidebar-app-shell.tsx`) já é dona da calha — `px-4 … md:p-6` —, e uma tela
 * que adotasse o `Container` a dobrava: medido a 375px, o conteúdo caía de
 * **343 para 311px**; a 1280, de 1232 para **960**, com 56px de calha por
 * lado. É palavra por palavra o defeito que a documentação deste componente
 * descrevia enquanto ele o cometia.
 *
 * Das nove cascas de página do app, **nenhuma** declara calha horizontal — a
 * única que tenta escreve `px-1 sm:px-0`, quatro pixels que somem em 640. Por
 * isso `none` é o padrão: a largura é o trabalho, a calha é a exceção.
 *
 * E `page` fala a gramática que o app **renderiza** — um degrau, quebrando em
 * 768 — e não a que este arquivo inventava, com dois degraus quebrando em 640
 * e 1024. Duas gramáticas para a mesma calha, e a do app é a que 100% das
 * telas mostram.
 */
const containerGutters = {
  none: "",
  page: "px-4 md:px-6",
} as const

/**
 * O ritmo vertical do que ele contém.
 *
 * Este eixo é a fusão que faltava. Havia uma Fundação chamada "Espaçamento e
 * **largura**" cuja fonte declarada era este arquivo — ela documentava as duas
 * coisas, e o componente entregava só uma. O ritmo era escrito à mão em toda
 * chamada: `flex flex-col gap-8` quatro vezes nas páginas, `flex gap-8` no
 * casco do catálogo, `flex min-w-0 flex-1 flex-col gap-4` na casca do app.
 *
 * Os degraus leem os tokens semânticos em vez de cravar um número: `block` é o
 * respiro entre blocos e `section` o respiro entre seções, e a razão de 2 para
 * 1 entre eles é o que separa "mesmo assunto" de "outro assunto".
 */
const containerStacks = {
  none: "",
  block: "flex flex-col gap-(--space-block)",
  section: "flex flex-col gap-(--space-section)",
} as const

const containerVariants = cva("mx-auto w-full", {
  variants: {
    size: {
      sm: "max-w-md",
      md: "max-w-xl",
      lg: "max-w-2xl",
      xl: "max-w-7xl",
      full: "max-w-none",
    },
    gutter: {
      none: "",
      page: "px-4 md:px-6",
    },
    stack: {
      none: "",
      block: "flex flex-col gap-(--space-block)",
      section: "flex flex-col gap-(--space-section)",
    },
  },
  defaultVariants: { size: "md", gutter: "none", stack: "none" },
})

/** O degrau que `defaultVariants` aplica, para o `data-size` não o adivinhar. */
const DEFAULT_CONTAINER_SIZE = "md" satisfies keyof typeof containerSizes

function Container({
  className,
  size,
  gutter,
  stack,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof containerVariants>) {
  return (
    <div
      data-slot="container"
      // O padrão é declarado uma vez, no `cva`. Antes ele vinha também na
      // desestruturação, e um `Omit<VariantProps<…>, "size">` no tipo das props
      // não fazia nada: com uma variante só, omiti-la deixa `{}` — verificado,
      // `keyof` resolve para `never`.
      data-size={size ?? DEFAULT_CONTAINER_SIZE}
      className={cn(containerVariants({ size, gutter, stack }), className)}
      {...props}
    />
  )
}

export {
  Container,
  containerGutters,
  containerSizes,
  containerStacks,
  containerVariants,
  DEFAULT_CONTAINER_SIZE,
}
