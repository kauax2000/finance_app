"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { CheckIcon, MinusIcon } from "@heroicons/react/16/solid"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * A caixa de escolha booleana.
 *
 * ## O eixo `variant`, e por que ele existe
 *
 * `default` é a caixa do sistema: marcada, ela é a tecla `--primary` com o
 * tique branco. `brand` é a mesma caixa com o arco-íris da marca por contorno —
 * **só quando marcada**. Desmarcada ela é pixel a pixel a `default`, e isso é
 * decisão e não economia: a passagem do fio cinza para o arco-íris *é* a
 * comemoração, e cinco caixas desmarcadas numa lista com cinco anéis de acento
 * deixam de ter acento nenhum. Uma por tela, como as outras peças de marca.
 *
 * ## `brand` não tem halo, e isso é limite de mecanismo
 *
 * O `Button` e o `Badge` desenham a marca em duas camadas: o contorno no
 * `::before` e um halo borrado no `::after`. Aqui o `::after` **já é o alvo de
 * toque de 44px**, e ele não se move. Sobra o contorno — que é o precedente do
 * `brandOutline`, e é o certo nesta escala de qualquer forma: um halo a
 * `-inset-1` sangra 4px e encosta na linha vizinha de uma lista com `gap-3`.
 */
const checkboxVariants = cva(
  [
    "group peer relative size-4 shrink-0 rounded border border-input bg-background shadow-xs outline-none transition-colors",
    // O controle desenhado tem 16px; o pseudo-elemento leva a área de
    // toque aos 44px que um dedo pede, sem mexer no layout. É a mesma
    // técnica do `Switch`. Não substitui envolver o item num `Label`
    // clicável numa lista — soma a ela.
    //
    // Ele mora na **base**, e não numa variante: o alvo de toque não é
    // assunto de aparência.
    "after:absolute after:-inset-3.5 after:content-['']",
    // O par de toque: `hover:` compila dentro de `@media (hover: hover)`.
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
          "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
          "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
        ].join(" "),
        // A receita do `Button variant="brand"`, reduzida ao contorno.
        //
        // **O núcleo vai no pseudo, e não no elemento.** Numa raiz de
        // empilhamento o fundo *e a borda* do elemento pintam **antes** dos
        // filhos de `z` negativo, então o `::before` a `-z-10` pinta por cima
        // deles. É a armadilha documentada em `button.tsx`, e aqui ela
        // trabalha a favor: com o pseudo a `-inset-px` ele cobre a borda
        // `border-input` inteira, e nada precisa ser anulado — quem liga e
        // desliga as duas coisas é uma opacidade só.
        //
        // **`opacity` e não montar/desmontar a camada:** `background-image`
        // não interpola entre um degradê e `none`, então trocar a pintura
        // faria o contorno estalar. Com o pseudo sempre presente, ele esmaece
        // no `--duration-fast` da casa — o mesmo ritmo do halo do botão.
        //
        // **`brand-rainbow-image` não é decoração e não se apaga**: é ela que
        // declara `--brand-rainbow` no elemento, e o pseudo herda daqui o
        // valor já substituído. Ver a rodada 88.
        //
        // O tique continua `--primary-foreground` sobre `--primary`: o miolo
        // marcado é chapado, o arco-íris só aparece por 1px de borda, e o
        // contraste do conteúdo é **o mesmo de hoje**. Arco-íris sob texto
        // continua proibido.
        brand: [
          "brand-rainbow-image isolate [--brand-fill:var(--primary)]",
          "data-[state=checked]:text-primary-foreground data-[state=indeterminate]:text-primary-foreground",
          "before:absolute before:-inset-px before:-z-10 before:rounded-[inherit] before:border before:border-transparent",
          "before:[background:linear-gradient(var(--brand-fill),var(--brand-fill))_padding-box,var(--brand-rainbow)_border-box]",
          "before:opacity-0 before:transition-opacity before:duration-(--duration-fast)",
          "data-[state=checked]:before:opacity-100 data-[state=indeterminate]:before:opacity-100",
        ].join(" "),
      },
    },
    defaultVariants: { variant: "default" },
  },
)

function Checkbox({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> &
  VariantProps<typeof checkboxVariants>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      data-variant={variant ?? "default"}
      className={cn(checkboxVariants({ variant }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={cn(
          "flex size-full items-center justify-center text-current",
        )}
      >
        <CheckIcon className="size-3.5 hidden group-data-[state=checked]:block" />
        <MinusIcon className="size-3.5 hidden group-data-[state=indeterminate]:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox, checkboxVariants }
