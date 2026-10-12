"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { useBrandGlow } from "@/hooks/use-brand-glow"
import { Label } from "@/components/ui/label"
import { Radio } from "@/components/ui/radio"
import { Muted } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

/**
 * A escolha única: o grupo e as opções rotuladas; o círculo cru é o átomo
 * `Radio`, e este arquivo compõe `Radio` + `Label`.
 * `RadioGroupItem` **é** um `<label>` que contém o `Radio`: sem `useId` nem
 * `htmlFor`, a associação implícita do HTML resolve. O `card` exige o embrulho
 * (a caixa que acende e é o alvo de 44px precisa conter o rádio para ler o
 * estado com `:has()`), e `plain` usa o mesmo mecanismo.
 * `description` vive dentro do rótulo, o que mantém a caixa inteira clicável e
 * a põe no nome acessível ("PIX, cai na hora"); um `aria-describedby` para o
 * mesmo texto o diria duas vezes. O `trailing` entra no nome pelo mesmo caminho.
 * `variant="chip"` é a ficha em pílula (o rádio fica `sr-only`, a ficha é o
 * indicador; semântica de rádio, e não seis botões de alternar). `deselectable`
 * volta a vazio ao tocar na marcada (escolha opcional). `icon` fica antes do
 * rótulo, ou em cima num grupo horizontal de cartões.
 * Ordem: `radioGroupItemVariants` é o único `cva` e vai no topo, e o `export`
 * é um só no fim, porque o `ds:catalog` lê só o primeiro `variants:` e
 * `extractExports` só o primeiro bloco.
 */

/**
 * A opção. `plain` acrescenta ao `Label` o piso de 44px no ponteiro grosso (o
 * dedo, não a largura). `card` reusa os tokens do cartão de escolha do
 * `FieldLabel`, com seletores reescritos para esta anatomia (o filho é o
 * próprio `Radio`). `brandCard` é o mesmo cartão com o brilho de marca na borda;
 * o rádio dentro dele não leva `variant="brand"` (dois brilhos aninhados).
 * O que os dois cartões têm em comum; só o brilho de marca os separa.
 */
const CARTAO = [
  "min-h-11 w-full items-start gap-3 rounded-row-lg border border-input p-2.5 leading-snug font-normal transition-colors",
  // O par `active:` é da regra H: em alvo de dedo, `hover:` compila dentro de
  // `@media (hover: hover)` e não vale.
  "not-has-[:disabled,[data-disabled]]:hover:bg-muted/50 not-has-[:disabled,[data-disabled]]:active:bg-muted/50",
  "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/45",
  "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
].join(" ")

/**
 * O realce de seleção dos dois cartões. O contorno é `primary-accent` a 60%:
 * 3,01:1 no claro e 2,99:1 no escuro contra o fundo do cartão (1,35 e 1,32 o
 * não selecionado); a 100% lê como borda de erro.
 * `has-data-checked:` é a grafia do `FieldLabel` e funciona: o variante cobre
 * `[data-state=checked]` mesmo sem o Radix escrever `data-checked`.
 */
const SELECAO =
  "has-data-checked:border-primary-accent/60 has-data-checked:bg-primary/5 dark:has-data-checked:bg-primary/10"

/**
 * A ficha. Repouso e escolha são, classe a classe, `tagChipNeutral` e
 * `tagChipFilterSelected` do `Badge`, reescritas sob `has-data-checked:` porque
 * quem sabe da escolha é o rádio de dentro (`radio-group-versions.test.ts`
 * cobra a igualdade). O foco é `outline`: o anel de 1px da escolha é `ring`.
 */
const FICHA = [
  "h-8 gap-1.5 rounded-full px-3 text-xs leading-none font-semibold transition-colors pointer-coarse:min-h-10",
  "bg-muted text-muted-foreground",
  "not-has-[:disabled]:hover:text-foreground not-has-[:disabled]:active:text-foreground",
  "has-data-checked:bg-primary-muted has-data-checked:text-primary-muted-foreground has-data-checked:ring-1 has-data-checked:ring-primary-accent/25 dark:has-data-checked:ring-primary-accent/40",
  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
  "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
].join(" ")

const radioGroupItemVariants = cva("group/radio-item relative", {
  variants: {
    variant: {
      // Com nota, o rádio desce para a primeira linha e o par ganha entrelinha (o
      // `leading-none` do `Label` colaria as linhas).
      plain:
        "gap-2 pointer-coarse:min-h-11 has-data-[slot=radio-group-item-content]:items-start has-data-[slot=radio-group-item-content]:leading-snug",
      card: [CARTAO, SELECAO].join(" "),
      /**
       * O `card` com o brilho de marca na borda. Quem acende é o ponteiro e não o
       * estado, então a seleção continua dita pelo realce do `card`, e os dois se
       * somam: o arco vive na aresta, a lavagem no miolo. Uma por tela.
       */
      brandCard: [CARTAO, SELECAO, "brand-glow isolate"].join(" "),
      chip: FICHA,
    },
  },
  defaultVariants: { variant: "plain" },
})

/**
 * O que os cartões ajustam no `Radio`, três contra-classes resolvidas pelo `twMerge`:
 * 1. `after:hidden`: o alvo de 44px do átomo sangraria para fora do cartão; o
 *    alvo passa a ser a caixa inteira (o cartão **é** o `<label>`).
 * 2. e 3. `focus-visible:ring-0` + `focus-visible:border-input`: o anel é do
 *    cartão (`has-[:focus-visible]:ring-3`); dois anéis na mesma caixa não.
 * Mais o `mt-0.5`, que prende o rádio à primeira linha do título. A opacidade do
 * desabilitado é do cartão: o átomo não a soma (dois 50% dariam 25%).
 */
const radioInCardClassName =
  "mt-0.5 after:hidden focus-visible:ring-0 focus-visible:border-input disabled:opacity-100"

/**
 * O ladrilho: cartão num grupo horizontal, com ícone. Ícone e rótulo empilham, e
 * o rádio sobe ao canto, no recuo do cartão.
 */
const ladrilhoClassName = "flex-col gap-2 pe-9"
const radioNoLadrilhoClassName = "absolute end-2.5 top-2.5 mt-0"

type RadioGroupVariant = "plain" | "card" | "brandCard" | "chip"

type RadioGroupContextValue = {
  variant: RadioGroupVariant
  invalid: boolean
  horizontal: boolean
  /** Só com `deselectable`: volta o grupo a vazio. */
  limpar?: () => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({
  variant: "plain",
  invalid: false,
  horizontal: false,
})

/**
 * O grupo. `orientation` só é repassado ao Radix quando existe: sem ele as
 * quatro setas navegam (o que a APG pede); `data-orientation` é carimbado aqui
 * para o layout não depender disso.
 * `aria-invalid` chega neste nó (a raiz do Radix é uma `div`, que o
 * `FieldControl` alcança) e desce por contexto até cada `Radio`, sem seletor
 * descendente: o átomo não deve conhecer quem o contém.
 */
function RadioGroup({
  className,
  variant = "plain",
  orientation,
  children,
  deselectable = false,
  value,
  defaultValue,
  onValueChange,
  "aria-invalid": ariaInvalid,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root> & {
  variant?: RadioGroupVariant
  /** Tocar na marcada a desmarca e `onValueChange` recebe `""`. Para escolha opcional. */
  deselectable?: boolean
}) {
  const invalid = ariaInvalid === true || ariaInvalid === "true"
  // Desmarcar exige saber o valor: sem `value`, o grupo o guarda. Sem
  // `deselectable` o Radix segue dono do estado.
  const [interno, setInterno] = React.useState(defaultValue ?? "")
  const controlado = value !== undefined
  const mudar = React.useCallback(
    (proximo: string) => {
      if (!controlado) setInterno(proximo)
      onValueChange?.(proximo)
    },
    [controlado, onValueChange]
  )
  const estado = deselectable
    ? { value: controlado ? value : interno, onValueChange: mudar }
    : { value, defaultValue, onValueChange }
  const horizontal = orientation === "horizontal"
  const contexto = React.useMemo<RadioGroupContextValue>(
    () => ({
      variant,
      invalid,
      horizontal,
      limpar: deselectable ? () => mudar("") : undefined,
    }),
    [variant, invalid, horizontal, deselectable, mudar]
  )

  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      data-variant={variant}
      data-orientation={orientation ?? "vertical"}
      orientation={orientation}
      aria-invalid={ariaInvalid}
      {...estado}
      className={cn(
        // 12px entre linhas: o respiro que o `FieldSet` reserva para este slot.
        "grid gap-3",
        // Na horizontal são colunas iguais, e 8px basta porque cada cartão tem contorno próprio.
        "data-[orientation=horizontal]:grid-flow-col data-[orientation=horizontal]:auto-cols-fr data-[orientation=horizontal]:gap-2",
        // As fichas correm e quebram, na largura de cada uma.
        "data-[variant=chip]:flex data-[variant=chip]:flex-wrap data-[variant=chip]:gap-2",
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
  icon,
  trailing,
  variant,
  className,
  radioClassName,
  onClick,
  ...props
}: Omit<React.ComponentProps<typeof Radio>, "children" | "variant"> &
  VariantProps<typeof radioGroupItemVariants> & {
    /** O rótulo da opção. */
    children: React.ReactNode
    /** A nota miúda sob o rótulo. Não vale na ficha. */
    description?: React.ReactNode
    /** O ícone antes do rótulo; num grupo horizontal de cartões, em cima. */
    icon?: React.ReactNode
    /** O valor na outra ponta — prazo, parcela, taxa. Não vale na ficha. */
    trailing?: React.ReactNode
    /** `className` veste a **caixa** (o `<label>`); esta veste o controle. */
    radioClassName?: string
  }) {
  const grupo = React.useContext(RadioGroupContext)
  const resolvido = variant ?? grupo.variant
  const glowRef = useBrandGlow<HTMLLabelElement>(resolvido === "brandCard")
  const ficha = resolvido === "chip"
  const cartao = resolvido === "card" || resolvido === "brandCard"
  const ladrilho = cartao && grupo.horizontal && icon != null
  const nota = ficha ? null : description

  return (
    <Label
      ref={glowRef}
      data-slot="radio-group-item"
      data-variant={resolvido}
      className={cn(
        radioGroupItemVariants({ variant: resolvido }),
        ladrilho && ladrilhoClassName,
        className
      )}
    >
      <Radio
        {...props}
        onClick={(e) => {
          onClick?.(e)
          // Antes do Radix: ele só marca o que não está marcado, então a opção marcada
          // chega aqui intacta e só nós a desmarcamos.
          if (grupo.limpar && e.currentTarget.dataset.state === "checked") {
            grupo.limpar()
          }
        }}
        aria-invalid={props["aria-invalid"] ?? (grupo.invalid || undefined)}
        className={cn(
          cartao && radioInCardClassName,
          resolvido === "plain" && nota && "mt-0.5",
          ladrilho && radioNoLadrilhoClassName,
          // A ficha é o indicador; o rádio segue o controle, para leitor de tela e
          // teclado. O `absolute` explícito é o que tira o `relative` do átomo pelo
          // `twMerge` (o `sr-only` sozinho não é do grupo de posição).
          ficha && "sr-only absolute",
          radioClassName
        )}
      />
      {icon ? (
        <span
          data-slot="radio-group-item-icon"
          aria-hidden
          className={cn(
            // 16px em toda forma; quem chama passa `16/solid` (contrato do `icon` do
            // `Alert`, da `AnnouncementBar` e da `Timeline`).
            "flex shrink-0 text-muted-foreground transition-colors [&>svg]:size-4",
            // Numa linha com nota, o ícone fica na primeira linha.
            !ladrilho && nota && "mt-0.5",
            // Escolhida, o ícone ganha a tinta do rótulo; a ficha já tinge pelo `currentColor`.
            ficha
              ? "text-current"
              : "group-has-data-checked/radio-item:text-foreground"
          )}
        >
          {icon}
        </span>
      ) : null}
      {nota ? (
        // Título sobre descrição é par de identidade: `gap-0`, quem separa é a entrelinha.
        <span
          data-slot="radio-group-item-content"
          className="flex min-w-0 flex-col gap-0"
        >
          <span className="font-medium text-foreground">{children}</span>
          <Muted asChild className="text-xs">
            <span>{nota}</span>
          </Muted>
        </span>
      ) : (
        children
      )}
      {trailing != null && !ficha ? (
        <span
          data-slot="radio-group-item-trailing"
          className={cn(
            "ms-auto shrink-0 ps-2 text-end text-muted-foreground tabular-nums",
            ladrilho && "ms-0 ps-0 text-start"
          )}
        >
          {trailing}
        </span>
      ) : null}
    </Label>
  )
}

export { RadioGroup, RadioGroupItem, radioGroupItemVariants }
