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
 * ## `description` vive dentro do rótulo, e não usa `aria-describedby`
 *
 * Nos cartões e, desde a rodada 197, na linha `plain` — o cabeçalho dizia que
 * ali ela "não cabia sem virar cartão", e cabe: é a nota miúda sob o rótulo,
 * com o rádio preso à primeira linha. Ela vive **dentro** do `<label>` — é o
 * que mantém a caixa inteira clicável —, e por isso já entra no **nome
 * acessível** da opção ("PIX, cai na hora"). Apontar um `aria-describedby`
 * para o mesmo texto faria o leitor de tela dizê-lo duas vezes. O `trailing`
 * (o valor à direita) entra no nome pelo mesmo caminho.
 *
 * ## Rodada 197
 *
 * - **`variant="chip"`**: a ficha em pílula, na superfície dos chips de filtro
 *   do `Badge`. O rádio fica `sr-only` — a ficha **é** o indicador —, e a
 *   semântica continua de rádio: a forma de pagamento da transação era
 *   `role="group"` com `aria-pressed`, que anuncia seis botões de alternar
 *   para uma escolha única.
 * - **`deselectable`**: tocar na opção marcada volta a vazio. É para a escolha
 *   **opcional** (a forma de pagamento pode ficar em branco); o rádio do HTML
 *   não desmarca, e o Radix também não.
 * - **`icon`**: na linha e no cartão ele fica antes do rótulo; num grupo
 *   horizontal de cartões ele vai **em cima**, e o rádio sobe ao canto — o
 *   ladrilho de escolha.
 * - **`trailing`**: o valor na outra ponta, alinhado ao fim.
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
 *
 * `brandCard` é o mesmo cartão, com o mesmo realce de seleção, e a borda que
 * acende em arco-íris conforme o ponteiro se aproxima — o brilho do `Card
 * brand`. O rádio dentro dele **não** leva `variant="brand"`: dois brilhos
 * aninhados são o defeito de "dois anéis na mesma caixa" que o
 * `radioInCardClassName` já nomeia.
 */
/** O que os dois cartões têm em comum — só o brilho de marca os separa. */
const CARTAO = [
  "min-h-11 w-full items-start gap-3 rounded-row-lg border border-input p-2.5 leading-snug font-normal transition-colors",
  // O par `active:` não é cortesia com a regra H: num alvo que é para o
  // dedo, `hover:` compila dentro de `@media (hover: hover)` e não vale.
  "not-has-[:disabled,[data-disabled]]:hover:bg-muted/50 not-has-[:disabled,[data-disabled]]:active:bg-muted/50",
  "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/45",
  "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
].join(" ")

/**
 * O realce de seleção dos dois cartões. O contorno é `primary-accent` a 60% —
 * 3,01:1 no claro e 2,99:1 no escuro contra o fundo real do cartão, contra
 * 1,35 e 1,32 do não selecionado. A 100% ele sobe para 7,66 / 6,14 e lê como
 * borda de erro num cartão que só está selecionado.
 *
 * `has-data-checked:` e não `has-data-[state=checked]:`: é a grafia que o
 * `FieldLabel` já usa, e ela **funciona** — medido no cartão renderizado, o
 * variante do Tailwind cobre `[data-state=checked]` mesmo o Radix nunca
 * escrevendo `data-checked`.
 */
const SELECAO =
  "has-data-checked:border-primary-accent/60 has-data-checked:bg-primary/5 dark:has-data-checked:bg-primary/10"

/**
 * A ficha (rodada 197). Repouso e escolha são, classe a classe, `tagChipNeutral`
 * e `tagChipFilterSelected` do `Badge` — reescritas sob `has-data-checked:`
 * porque quem sabe da escolha é o rádio de dentro, e uma constante não se
 * prefixa. `radio-group-versions.test.ts` cobra a igualdade. O foco é
 * `outline` e não `ring`: o anel de 1px da escolha é `ring`, e os dois
 * disputariam a mesma sombra.
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
      // Com nota, o rádio desce para a primeira linha e o par ganha
      // entrelinha — o `leading-none` do `Label` colaria as duas linhas.
      plain:
        "gap-2 pointer-coarse:min-h-11 has-data-[slot=radio-group-item-content]:items-start has-data-[slot=radio-group-item-content]:leading-snug",
      card: [CARTAO, SELECAO].join(" "),
      /**
       * O `card` com o brilho de marca na borda (rodada 169). Até a 168 era um
       * contorno de arco-íris parado que acendia **no lugar** do realce de
       * seleção; com o brilho, quem acende é o ponteiro e não o estado, então
       * a seleção volta a ser dita pelo realce do `card`, e os dois se somam
       * sem disputar: o arco vive na aresta, a lavagem no miolo. A máscara do
       * brilho recorta só o anel, e não há núcleo para acertar a cor de fundo.
       * O anel de foco continua o do cartão. Uma por tela.
       */
      brandCard: [CARTAO, SELECAO, "brand-glow isolate"].join(" "),
      chip: FICHA,
    },
  },
  defaultVariants: { variant: "plain" },
})

/**
 * O que os cartões (`card` e `brandCard`) ajustam no `Radio`. Três
 * contra-classes, todas resolvidas pelo `twMerge` (mesmo grupo, mesmo
 * variante) e nenhuma por especificidade:
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

/**
 * O ladrilho (rodada 197): cartão num grupo horizontal, com ícone. O ícone e o
 * rótulo empilham, e o rádio sobe ao canto, no recuo do cartão.
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
  deselectable = false,
  value,
  defaultValue,
  onValueChange,
  "aria-invalid": ariaInvalid,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root> & {
  variant?: RadioGroupVariant
  /**
   * Tocar na opção marcada a desmarca, e `onValueChange` recebe `""`. Para a
   * escolha opcional; uma escolha obrigatória não deve poder voltar a vazio.
   */
  deselectable?: boolean
}) {
  const invalid = ariaInvalid === true || ariaInvalid === "true"
  // Desmarcar exige saber o valor: sem `value`, o grupo o guarda. Sem
  // `deselectable` o Radix continua dono do estado, como sempre foi.
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
        // 12px entre linhas — o respiro que o `FieldSet` já reserva para este
        // slot (`has-[>[data-slot=radio-group]]:gap-3`).
        "grid gap-3",
        // Na horizontal são colunas iguais, e 8px basta porque cada cartão já
        // tem contorno próprio.
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
          // Antes do Radix: ele só marca o que não está marcado, então a
          // opção marcada chega aqui intacta e só nós a desmarcamos.
          if (grupo.limpar && e.currentTarget.dataset.state === "checked") {
            grupo.limpar()
          }
        }}
        aria-invalid={props["aria-invalid"] ?? (grupo.invalid || undefined)}
        className={cn(
          cartao && radioInCardClassName,
          resolvido === "plain" && nota && "mt-0.5",
          ladrilho && radioNoLadrilhoClassName,
          // A ficha é o indicador; o rádio continua o controle, para o leitor
          // de tela e para o teclado. O `absolute` explícito é o que tira o
          // `relative` do átomo pelo `twMerge` — o `sr-only` sozinho não é do
          // grupo de posição, e o rádio ficava no fluxo empurrando o rótulo.
          ficha && "sr-only absolute",
          radioClassName
        )}
      />
      {icon ? (
        <span
          data-slot="radio-group-item-icon"
          aria-hidden
          className={cn(
            // 16px em toda forma, e quem chama passa `16/solid` — o contrato
            // do `icon` do `Alert`, da `AnnouncementBar` e da `Timeline`.
            "flex shrink-0 text-muted-foreground transition-colors [&>svg]:size-4",
            // Numa linha com nota, o ícone fica na primeira linha.
            !ladrilho && nota && "mt-0.5",
            // Escolhida, o ícone ganha a tinta do rótulo. A ficha já tinge
            // pelo `currentColor` dela.
            ficha
              ? "text-current"
              : "group-has-data-checked/radio-item:text-foreground"
          )}
        >
          {icon}
        </span>
      ) : null}
      {nota ? (
        // Título sobre descrição é **par de identidade**: `gap-0`, e quem os
        // separa é a entrelinha.
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
