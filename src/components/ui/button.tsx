import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&>[data-slot=button-label]]:first-letter:uppercase [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      // A hierarquia é uma escada, e ela desce em peso visual, não só em nome:
      // `primary` preenche de verde, `secondary` preenche de cinza,
      // `tertiary` não preenche nada. Uma tela tem um `primary` só.
      //
      // `outline` fica de fora da escada de propósito: é a exceção, para
      // quando um controle precisa de contorno próprio (um par de navegação,
      // um filtro que alterna) e nenhum dos três degraus serve.
      //
      // `success` e `warning` foram removidos: nomeavam um estado, não um
      // peso, e nenhuma tela do app chegou a usá-los. Estado de sucesso e de
      // atenção continua sendo trabalho do `Badge` e do `Alert`.
      variant: {
        primary:
          "border-primary bg-primary text-primary-foreground hover:border-primary/90 hover:bg-primary/90 [a]:hover:bg-primary/90",
        // Sem borda visível — e sem o anel vazado que havia antes. O culpado
        // não era a borda transparente da base, era o `bg-clip-padding` que a
        // acompanha: ele recortava o preenchimento na caixa de padding, então o
        // cinza pintava 30px dentro de uma caixa de 32. `bg-clip-border` faz o
        // preenchimento passar por baixo da borda e chegar à aresta.
        //
        // Preferido a `border-0` porque a borda de 1px é o que mantém a
        // geometria igual entre as variantes: com `border-0` o rótulo do
        // `secondary` recuava para 12px contra os 13px das outras, e os chips
        // que alternam entre `secondary` e `outline` saltavam 2px ao selecionar.
        secondary:
          "bg-clip-border bg-secondary text-secondary-foreground hover:bg-secondary-hover aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        tertiary:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input-fill/30 dark:hover:bg-input-fill/50",
        destructive:
          "bg-destructive/10 text-destructive-muted-foreground hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary-accent underline-offset-4 hover:underline",
      },
      // Uma escada só, de 24 a 40 em degraus de 4, e a coluna `icon-*` espelha
      // a de texto degrau a degrau: `md` casa com `icon-md`, `lg` com
      // `icon-lg`. Não existe `default` na escala — o nome dizia "o padrão" e
      // apontava para 36, que deixou de ser o padrão; um rótulo que promete
      // uma coisa e entrega outra custa mais caro que um degrau a mais.
      //
      // O padrão é `md` (32), o corpo da ação comum. `lg` (36) é a altura de
      // `Input` e `SelectTrigger`: botão colado a campo pede `lg` e alinha sem
      // ajuste.
      size: {
        xs: "h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 text-control-sm has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        lg: "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xl: "h-10 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-md": "size-8",
        "icon-lg": "size-9",
        "icon-xl": "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  // A maiúscula inicial é do design system, não de quem escreve o rótulo — mas
  // `::first-letter` não se aplica a `inline-flex`, e o botão precisa ser flex
  // para alinhar ícone. O texto cru vira um `span`, que como item de flex é
  // blocado e aí aceita o pseudo-elemento.
  //
  // Só texto cru. Quem passa um elemento assume a caixa alta — é a saída para
  // um rótulo que precisa de minúscula, como os nomes de prop do catálogo.
  // Com `asChild` nada é embrulhado: o Slot exige um filho único.
  const wrapText = (nodes: React.ReactNode) =>
    React.Children.map(nodes, (child) =>
      typeof child === "string" || typeof child === "number" ? (
        <span data-slot="button-label">{child}</span>
      ) : (
        child
      )
    )

  // Com `asChild` o Slot exige um filho único, então o embrulho desce um nível:
  // clona o filho e embrulha o texto **dele**. Sem isto, `<Button asChild>` com
  // um `<Link>` — que é a forma documentada de botão que navega — ficaria de
  // fora da regra, e ela vale para todo CTA.
  const content =
    asChild && React.isValidElement<{ children?: React.ReactNode }>(children)
      ? React.cloneElement(children, undefined, wrapText(children.props.children))
      : wrapText(children)

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {content}
    </Comp>
  )
}

export { Button, buttonVariants }
