"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { Label } from "@/components/ui/label"
import { Radio } from "@/components/ui/radio"
import { Muted } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

/**
 * A escolha única — o grupo e as opções rotuladas.
 *
 * **Ele era um átomo, e a pergunta que o mudou foi "onde está o rótulo?".** O
 * arquivo antigo entregava dois exports e o segundo era o **círculo cru**: quem
 * chamava escrevia o `<div className="flex items-center gap-2">`, o `<Label
 * htmlFor>` e o `id` à mão, uma vez por opção. As duas únicas demonstrações do
 * catálogo faziam exatamente isso, em duas grafias — e o catálogo escrever a
 * anatomia é o sinal, já registrado nesta casa, de que **falta uma peça**.
 * Agora o círculo é o átomo `Radio`, e este arquivo compõe `Radio` + `Label`,
 * que é o que um `RadioGroupItem` sempre foi na cabeça de quem o usa.
 *
 * ## O `<label>` embrulha, e não é gosto
 *
 * `RadioGroupItem` **é** um `<label>` que contém o `Radio`. Não há `useId` nem
 * `htmlFor`: a associação implícita do HTML resolve, e o controle rotulado é o
 * `<button role="radio">` — que **é** elemento rotulável, e que o Radix emite
 * antes do `<input>` espelho.
 *
 * O `variant="card"` **exige** o embrulho: a caixa que acende, que ocupa a
 * largura toda e que é o alvo de 44px é a mesma caixa que precisa conter o
 * rádio para ler o estado dele com `:has()`. Um irmão com `htmlFor` não pinta
 * um retângulo em volta de algo que está fora dele. Como o `plain` fica correto
 * com o mesmo mecanismo, os dois usam um só — duas mecânicas para a mesma
 * associação é como uma delas envelhece sozinha.
 *
 * ## `description` só existe no cartão, e não usa `aria-describedby`
 *
 * Numa linha `plain` não há onde ela caber sem virar cartão. No cartão ela vive
 * **dentro** do `<label>` — é o que mantém a caixa inteira clicável —, e por
 * isso já entra no **nome acessível** da opção ("Pix, cai na hora"). Apontar um
 * `aria-describedby` para o mesmo texto faria o leitor de tela dizê-lo duas
 * vezes.
 *
 * ## Ordem no arquivo
 *
 * `radioGroupItemVariants` vai no topo, e é o **único** `cva` daqui:
 * `npm run ds:catalog` lê o **primeiro** `variants:` de cada fonte, e o eixo que
 * interessa a quem consulta o catálogo é o da opção. O `gap` e a orientação do
 * grupo saem por `data-*`, sem um segundo `cva` que o catálogo nunca mostraria.
 * É a lição que o `itemGroupVariants` deixou. O `export { … }` é um só, no fim,
 * pela mesma razão: `extractExports` lê só o primeiro bloco.
 */

/**
 * A opção.
 *
 * `plain` acrescenta **uma** coisa ao `Label`: o piso de 44px no ponteiro
 * grosso. A pergunta é o dedo e não a largura — a mesma régua do item de menu e
 * da célula do `Calendar`.
 *
 * `card` reusa os tokens medidos do cartão de escolha do `FieldLabel`, com os
 * seletores reescritos para **esta** anatomia: lá o filho é um `Field`
 * (`has-[>[data-slot=field]]`), aqui é o próprio `Radio`.
 */
const radioGroupItemVariants = cva("relative", {
  variants: {
    variant: {
      plain: "gap-2 pointer-coarse:min-h-11",
      card: [
        "min-h-11 w-full items-start gap-3 rounded-lg border border-input p-2.5 leading-snug font-normal transition-colors",
        // O contorno é `primary-accent` a 60% — 3,01:1 no claro e 2,99:1 no
        // escuro contra o fundo real do cartão, contra 1,35 e 1,32 do não
        // selecionado. A 100% ele sobe para 7,66 / 6,14 e lê como borda de erro
        // num cartão que só está selecionado.
        //
        // `has-data-checked:` e não `has-data-[state=checked]:`: é a grafia que
        // o `FieldLabel` já usa, e ela **funciona** — medido no cartão
        // renderizado, o variante do Tailwind cobre `[data-state=checked]`
        // mesmo o Radix nunca escrevendo `data-checked`.
        "has-data-checked:border-primary-accent/60 has-data-checked:bg-primary/5 dark:has-data-checked:bg-primary/10",
        // O par `active:` não é cortesia com a regra H: num alvo que é para o
        // dedo, `hover:` compila dentro de `@media (hover: hover)` e não vale.
        "not-has-[:disabled,[data-disabled]]:hover:bg-muted/50 not-has-[:disabled,[data-disabled]]:active:bg-muted/50",
        "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/70",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
      ].join(" "),
    },
  },
  defaultVariants: { variant: "plain" },
})

/**
 * O que o cartão ajusta no `Radio`. Três contra-classes, todas resolvidas pelo
 * `twMerge` (mesmo grupo, mesmo variante) e nenhuma por especificidade:
 *
 * 1. `after:hidden` — o alvo de 44px do átomo sangra para **fora** do cartão
 *    (16 + 2×14 = 44 contra 10px de recuo de cada lado), e ali quem manda é o
 *    cartão vizinho. O cartão já tem `min-h-11` e **é** o `<label>`: o alvo
 *    passa a ser a caixa inteira, que é maior e não invade ninguém.
 * 2. e 3. `focus-visible:ring-0` + `focus-visible:border-input` — o anel é do
 *    cartão (`has-[:focus-visible]:ring-3`). Dois anéis na mesma caixa é o
 *    defeito que `field-classes` já nomeia no `InputGroup`, e um anel de 3px em
 *    volta de um círculo de 16 dentro de um retângulo de 44 é o pior dos dois.
 *
 * Mais o `mt-0.5`, que não desliga nada: prende o rádio à primeira linha do
 * título quando há descrição (`items-start`). A opacidade do desabilitado é do
 * cartão, e o átomo não a soma porque `has-[:disabled]:opacity-50` já dima o
 * conjunto — dois 50% empilhados dariam 25%.
 */
const radioInCardClassName =
  "mt-0.5 after:hidden focus-visible:ring-0 focus-visible:border-input disabled:opacity-100"

type RadioGroupVariant = "plain" | "card"

type RadioGroupContextValue = {
  variant: RadioGroupVariant
  invalid: boolean
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({
  variant: "plain",
  invalid: false,
})

/**
 * O grupo.
 *
 * **`orientation` só é repassado ao Radix quando existe.** Sem ele, as quatro
 * setas navegam, que é o que a APG pede para um `radiogroup`; passá-lo sempre
 * restringiria a navegação a um eixo. O `data-orientation` é carimbado aqui
 * para o layout não depender dessa decisão.
 *
 * `aria-invalid` chega neste nó (a raiz do Radix é uma `div` de verdade, e é
 * quem o `FieldControl` alcança) e desce por **contexto React** até cada
 * `Radio`. Nada de seletor descendente: o `RadioGroupItem` renderiza o átomo,
 * então passa a prop. Um átomo lendo `group-*` do contêiner seria o átomo
 * conhecendo quem o contém, que é o defeito que apagou o degrau `xs` do `Item`.
 */
function RadioGroup({
  className,
  variant = "plain",
  orientation,
  children,
  "aria-invalid": ariaInvalid,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root> & {
  variant?: RadioGroupVariant
}) {
  const invalid = ariaInvalid === true || ariaInvalid === "true"
  const contexto = React.useMemo<RadioGroupContextValue>(
    () => ({ variant, invalid }),
    [variant, invalid]
  )

  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      data-variant={variant}
      data-orientation={orientation ?? "vertical"}
      orientation={orientation}
      aria-invalid={ariaInvalid}
      className={cn(
        // 12px entre linhas — o respiro que o `FieldSet` já reserva para este
        // slot (`has-[>[data-slot=radio-group]]:gap-3`).
        "grid gap-3",
        // Na horizontal são colunas iguais, e 8px basta porque cada cartão já
        // tem contorno próprio.
        "data-[orientation=horizontal]:grid-flow-col data-[orientation=horizontal]:auto-cols-fr data-[orientation=horizontal]:gap-2",
        className
      )}
      {...props}
    >
      <RadioGroupContext.Provider value={contexto}>
        {children}
      </RadioGroupContext.Provider>
    </RadioGroupPrimitive.Root>
  )
}

function RadioGroupItem({
  children,
  description,
  variant,
  className,
  radioClassName,
  ...props
}: Omit<React.ComponentProps<typeof Radio>, "children"> &
  VariantProps<typeof radioGroupItemVariants> & {
    /** O rótulo da opção. */
    children: React.ReactNode
    /** A explicação. Só tem lugar em `variant="card"` — ver o cabeçalho. */
    description?: React.ReactNode
    /** `className` veste a **caixa** (o `<label>`); esta veste o controle. */
    radioClassName?: string
  }) {
  const grupo = React.useContext(RadioGroupContext)
  const resolvido = variant ?? grupo.variant

  return (
    <Label
      data-slot="radio-group-item"
      data-variant={resolvido}
      className={cn(radioGroupItemVariants({ variant: resolvido }), className)}
    >
      <Radio
        {...props}
        aria-invalid={props["aria-invalid"] ?? (grupo.invalid || undefined)}
        className={cn(
          resolvido === "card" && radioInCardClassName,
          radioClassName
        )}
      />
      {description ? (
        // Título sobre descrição é **par de identidade**: `gap-0`, e quem os
        // separa é a entrelinha.
        <span
          data-slot="radio-group-item-content"
          className="flex min-w-0 flex-col gap-0"
        >
          <span className="font-medium text-foreground">{children}</span>
          <Muted asChild className="text-xs">
            <span>{description}</span>
          </Muted>
        </span>
      ) : (
        children
      )}
    </Label>
  )
}

export { RadioGroup, RadioGroupItem, radioGroupItemVariants }
