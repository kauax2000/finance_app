"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { composeRefs, useBrandGlow } from "@/hooks/use-brand-glow"
import { cn } from "@/lib/utils"

/**
 * O rádio: o anel de 16px e o ponto dentro dele. É o controle inteiro, e nada
 * além dele — quem carrega o rótulo é o `RadioGroupItem`.
 *
 * ## Ele não renderiza sozinho, e isso é limite da primitiva
 *
 * Este é o primeiro átomo do sistema que **exige um contexto** para existir. O
 * Radix não exporta rádio independente: `RadioGroup.Item` chama
 * `useRadioGroupContext`, que **lança** fora de um `RadioGroup.Root` —
 * verificado no fonte de `@radix-ui/react-radio-group`, não deduzido do tipo.
 * Reimplementar o `role="radio"`, o foco itinerante e o `<input>` espelho à mão
 * para ganhar independência seria trocar uma primitiva testada por uma cópia
 * pior.
 *
 * A pergunta que sobra — *isto é componente ou anatomia?* — se responde pela
 * régua do `LAYER`: o anel **é a unidade**, e o grupo é quem compõe. Um rádio
 * solto também não existe como ideia: "escolha única" precisa de um conjunto
 * para ser única em relação a quê. O custo aceito é que a página deste átomo
 * demonstra dentro de um `RadioGroup`, e diz por quê.
 *
 * ## Dentro de um `<form>` ele renderiza dois nós
 *
 * O Radix acrescenta um `<input type="radio" aria-hidden tabIndex={-1}>` quando
 * há um formulário ancestral, para o valor participar do envio nativo — medido:
 * fora de um `<form>` ele não existe. Ele é `position:absolute; opacity:0
 * pointer-events:none`, então **não conta como filho de layout**; e num `<label>`
 * que embrulhe o rádio o controle rotulado continua sendo o `<button
 * role="radio">`, que o Radix emite primeiro e que **é** elemento rotulável.
 *
 * ## O estado é `data-state`, e nunca `data-checked`
 *
 * Quem for ler o estado deste átomo de fora escreve `data-[state=checked]`.
 * (`data-checked:` do Tailwind também casa — medido —, mas o atributo que o
 * Radix escreve é `data-state`, e é por ele que se procura no DOM.)
 *
 * ## Marcar acende o anel e faz o ponto nascer (rodada 169)
 *
 * O anel passa de `--input` para `--primary-accent` e o ponto cresce do nada
 * na mola da casa (`zoom-in-0`, `--ease-spring`) — a mesma entrada do tique do
 * `Checkbox`. O ponto tem a tinta do anel marcado, então os dois chegam
 * juntos.
 *
 * ## O eixo `variant`
 *
 * `brand` é o anel com a **borda que acende em arco-íris conforme o ponteiro
 * se aproxima** — a família do brilho (`@utility brand-glow` + `useBrandGlow`),
 * a do `Checkbox brand` desde a rodada 155. Até a rodada 168 ele era o
 * contorno parado que só acendia marcado; saiu para as duas peças de escolha
 * falarem a mesma marca. Longe do ponteiro, e no toque, é pixel a pixel a
 * `default`. A máscara do brilho recorta só o anel, então o ponto e o fundo
 * aparecem intactos, e o `::after` continua sendo o alvo de 44px. Uma por tela.
 */
const radioVariants = cva(
  [
    "relative aspect-square size-4 shrink-0 rounded-full border border-input text-primary-accent shadow-xs outline-none transition-colors duration-(--duration-fast)",
    // O fundo escurecido do escuro é o da caixa do sistema, e a marca o
    // divide desde que o brilho recorta só o anel.
    "dark:bg-input-fill/30",
    // Marcado, o anel ganha a tinta do ponto.
    "data-[state=checked]:border-primary-accent",
    // O par de toque do `Checkbox`: `hover:` compila dentro de
    // `@media (hover: hover)`. E o par `dark:hover:`, porque `dark:` empata
    // com `hover:` e é emitido depois — sem ele o realce morre no escuro.
    "hover:bg-muted/60 active:bg-muted/60 dark:hover:bg-muted/60 dark:active:bg-muted/60",
    // O alvo de toque, igual ao do `Checkbox` e ao do `Switch`: o desenho
    // tem 16px, o tocável tem 44 (16 + 2 × 14). Medido: `inset: -14px`.
    "after:absolute after:-inset-3.5 after:content-['']",
    // Era byte a byte `fieldFocusRingClassName` até a rodada 162, quando o anel
    // do campo ficou mais claro a pedido do dono; o do rádio segue
    // o dos controles de escolha (`Checkbox`, `Switch`). Não é importado de
    // `field-classes` pela mesma razão que o `Checkbox` e o `Switch` não
    // importam: um controle redondo não veste `fieldSurfaceClassName` —
    // três das quatro declarações dela seriam anuladas (`rounded-lg` →
    // `rounded-full`, o preenchimento, a rampa de corpo de texto) —, e
    // importar só o anel esconderia que o resto diverge. É o precedente do
    // `InputOTPSlot`.
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/45",
    // Byte a byte `fieldInvalidClassName` — e o `ring-3` é a correção: a
    // versão anterior escrevia a **cor** do anel sem a largura dele, então
    // o estado inválido trocava só a borda. Mesma família do botão
    // "Desfazer" do toast, que tinha `border-color` e nenhum `border-style`.
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
        // A borda que acende perto do ponteiro. Intensidade cheia, a do
        // `Checkbox brand`: num anel de 16px o arco tem poucos pixels.
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
        {/* Um ponto não precisa ser SVG. O Heroicons é um conjunto de interface
            e não traz círculo puro — e nem deveria: `rounded-full` com a cor de
            fundo desenha a mesma coisa sem uma requisição.

            A tinta é `currentColor`, e é isso que dá trabalho ao
            `text-primary-accent` do anel — que até aqui era **declaração
            morta**, porque o ponto era `bg-primary` e nada lia a cor do texto.
            Medido contra a página: no claro os dois tokens dão 7,34:1 (são a
            mesma cor); no escuro, `--primary` dá 3,64:1 e `--primary-accent` dá
            6,78:1. Nenhum reprova os 3:1 de traço não-textual, e é justamente
            por isso que quem decide é a régua e não a norma: "se ela mesma
            precisa ser enxergada contra a página, é `--primary-accent`". O
            ponto não carrega texto por cima; ele é marca sobre o fundo.

            E `bg-current` em vez de `bg-primary-accent` cravado: dá o mesmo
            pixel, revive a classe do anel em vez de deixá-la morta, e faz
            `<Radio className="text-destructive">` retingir sem tocar aqui. */}
        <span className="size-2.5 rounded-full bg-current animate-in zoom-in-0 animation-duration-(--duration-spring) ease-(--ease-spring)" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { Radio, radioVariants }
