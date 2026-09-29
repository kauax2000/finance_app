"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

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
 * ## O eixo `variant`
 *
 * `brand` é o anel com o arco-íris da marca por contorno, e **só quando
 * marcado** — desmarcado ele é pixel a pixel a `default`. As razões são as do
 * `Checkbox`, e a nota sobre o halo ausente também: o `::after` daqui já é o
 * alvo de toque de 44px, então sobra o contorno. Uma por tela.
 */
const radioVariants = cva(
  [
    "relative aspect-square size-4 shrink-0 rounded-full border border-input text-primary-accent shadow-xs outline-none transition-colors",
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
        // O fundo escurecido do tema escuro é da caixa **do sistema**. A
        // `brand` não o leva: marcada, o pseudo cobre o elemento inteiro, e
        // conviver com um núcleo `--background` deixaria o desmarcado e o
        // marcado em duas superfícies diferentes.
        default: "dark:bg-input-fill/30",
        // A receita que o `Checkbox variant="brand"` tinha até a rodada 153
        // (hoje ele desliza e floresce), com um núcleo diferente: o
        // anel marcado **não se preenche** — quem marca é o ponto —, então o
        // `--brand-fill` só precisa ser opaco, para o arco-íris não vazar pelo
        // miolo. Com `transparent` a camada `border-box` aparece no meio e o
        // controle inteiro vira degradê.
        //
        // O ponto continua `bg-current` lendo `text-primary-accent` da base, e
        // ele pinta **por cima** do pseudo: um `::before` a `-z-10` entra na
        // ordem antes dos descendentes em fluxo.
        brand: [
          "brand-rainbow-image isolate [--brand-fill:var(--background)]",
          "before:absolute before:-inset-px before:-z-10 before:rounded-[inherit] before:border before:border-transparent",
          "before:[background:linear-gradient(var(--brand-fill),var(--brand-fill))_padding-box,var(--brand-rainbow)_border-box]",
          "before:opacity-0 before:transition-opacity before:duration-(--duration-fast)",
          "data-[state=checked]:before:opacity-100",
        ].join(" "),
      },
    },
    defaultVariants: { variant: "default" },
  },
)

function Radio({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> &
  VariantProps<typeof radioVariants>) {
  return (
    <RadioGroupPrimitive.Item
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
        <span className="size-2.5 rounded-full bg-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { Radio, radioVariants }
