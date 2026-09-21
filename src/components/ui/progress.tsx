"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * O trilho. A altura mora aqui porque ela é do componente, não da tela.
 *
 * As três chamadas do app declaravam a própria altura em `className` — duas em
 * `h-1.5` e uma em `h-2` —, e nenhuma sabia da outra. Dois degraus nomeados
 * dizem a mesma coisa uma vez só: `sm` para barra dentro de linha de lista,
 * `md` para barra que é o assunto do bloco.
 */
const progressVariants = cva(
  cn(
    "relative w-full overflow-hidden rounded-full",
    // Era `bg-muted`, que no tema claro fica a meio ponto de cinza do cartão:
    // a parte **não** consumida sumia, e a barra lia como um traço solto em vez
    // de uma proporção. Uma barra de progresso sem o trilho visível não diz
    // "45% de", diz "45". É o mesmo token do trilho vazio do `Slider`.
    //
    // **O trilho é um só, inclusive na marca.** Houve uma versão com leito
    // preto sob o arco-íris, por contraste; o dono a viu nos dois temas e
    // pediu o trilho do sistema de volta — uma barra de marca que destoa das
    // vizinhas não é o desenho. A medição e o que ela custa estão na variante
    // `brand`, abaixo.
    "bg-input-fill"
  ),
  {
    variants: {
      size: {
        sm: "h-1.5",
        md: "h-2",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const progressIndicatorVariants = cva(
  cn(
    "h-full rounded-full",
    // `width` e não `scaleX`: a ponta é `rounded-full`, e escalar distorceria o
    // raio — a mesma medição que o marcador do `Tabs` registrou.
    "transition-[width] duration-(--duration-slow) ease-(--ease-out)"
  ),
  {
    variants: {
      // `income` e `expense` existem aqui porque esta é a barra de orçamento
      // consumido: uma categoria que estourou o limite é gasto, não erro do
      // sistema. Sem eles, a única cor disponível era `destructive`, e a
      // invariante do projeto ("success/destructive não são income/expense")
      // ficava impossível de cumprir justamente onde ela mais importa.
      //
      // **Um aviso que a página de docs repete:** `--income` é `var(--success)`
      // e `--expense` é `var(--destructive)`. No preenchimento os pares
      // desenham o **mesmo pixel**; o que separa dinheiro de estado são as
      // superfícies `-muted`, que esta barra não consome. A distinção aqui é de
      // vocabulário, e é assim de propósito até alguém decidir dar valor
      // próprio aos tokens sólidos.
      tone: {
        default: "bg-primary",
        success: "bg-success",
        warning: "bg-warning",
        destructive: "bg-destructive",
        income: "bg-income",
        expense: "bg-expense",
      },
      // Piso de largura para valor pequeno e diferente de zero. A 1% de um
      // trilho de 300px sobram 3px, que sob `rounded-full` viram uma lasca
      // quase invisível — "mal começou" desenhava igual a "não começou". O
      // piso é a própria altura da barra, então o mínimo é um ponto redondo.
      size: {
        sm: "data-filled:min-w-1.5",
        md: "data-filled:min-w-2",
      },
    },
    defaultVariants: {
      tone: "default",
      size: "md",
    },
  }
)

type Tom = NonNullable<VariantProps<typeof progressIndicatorVariants>["tone"]>

/**
 * Os dois cortes da escada de cor, em porcentagem do total.
 *
 * Abaixo do primeiro, `success`; entre eles, `warning`; acima do segundo,
 * `destructive`. Valor acima do total vence os cortes e é sempre
 * `destructive`.
 */
export type ProgressBands = readonly [number, number]

export function progressToneForBands(pct: number, [aviso, perigo]: ProgressBands): Tom {
  if (pct >= perigo) return "destructive"
  if (pct >= aviso) return "warning"
  return "success"
}

type Base = React.ComponentProps<typeof ProgressPrimitive.Root> &
  VariantProps<typeof progressVariants> & { max?: number }

/**
 * **`tone`, `bands` e `variant="brand"` são excludentes**, e o tipo cobra.
 *
 * Não é preciosismo de API: os três respondem à mesma pergunta — que cor tem o
 * preenchimento — por caminhos diferentes. `tone` é a tela decidindo, `bands` é
 * o componente derivando, e o arco-íris não tem tom nenhum. Aceitar dois juntos
 * seria aceitar que um deles não faz nada, e a união discriminada é o
 * precedente que o `Combobox` já usa em `multiple`.
 */
type ProgressProps =
  | (Base & { tone?: Tom; bands?: never; variant?: "default" })
  | (Base & { bands: ProgressBands; tone?: never; variant?: "default" })
  | (Base & { variant: "brand"; tone?: never; bands?: never })

function Progress({ className, value, max = 100, size, ...props }: ProgressProps) {
  const { tone, bands, variant = "default", ...rest } = props as Base & {
    tone?: Tom
    bands?: ProgressBands
    variant?: "default" | "brand"
  }

  const bruto = value != null && max > 0 ? (value / max) * 100 : 0
  const pct = Math.min(100, Math.max(0, bruto))

  // O Radix rejeita `value` acima de `max`: ele avisa no console e trata o
  // progresso como indeterminado, o que zera o `aria-valuenow`. Num app de
  // orçamento isso acontece justamente no caso que mais importa — a categoria
  // que estourou. A barra já era limitada a 100% visualmente; o valor enviado ao
  // primitivo passa a ser limitado junto, e o número real vai no
  // `aria-valuetext`, que aceita qualquer coisa.
  const clamped = value != null ? Math.min(max, Math.max(0, value)) : value
  const excedeu = value != null && value > max

  // O tom é derivado quando a tela entrega os cortes, e o estouro vence os dois.
  const tomFinal: Tom | undefined =
    variant === "brand"
      ? undefined
      : bands
        ? excedeu
          ? "destructive"
          : progressToneForBands(pct, bands)
        : tone

  // **O arco-íris é do trilho, e o preenchimento o revela.** O degradê tem a
  // largura do trilho inteiro, não a do preenchido: em 15% a barra é teal, em
  // 72% ela chegou no coral, e o arco-íris só fica completo em 100% — completar
  // a barra completa a marca. Escalado ao preenchido ele estaria sempre
  // inteiro, e aí a cor não diria nada sobre o valor.
  //
  // A conta: o indicador mede `pct%` do trilho, então `10000 / pct` por cento
  // da largura **dele** é a largura do trilho. `background-size` em
  // porcentagem resolve contra a caixa do próprio elemento, que é o que torna
  // isso possível sem um nó a mais.
  const fundoDaMarca =
    variant === "brand" && pct > 0
      ? { backgroundSize: `${(10000 / pct).toFixed(2)}% 100%` }
      : undefined

  // A cesura do limiar: onde o primeiro corte cai, na trilha. Ela precisa ler
  // **antes** de a barra chegar nele — é essa a utilidade — então não pode ser
  // da cor do trilho, que a esconderia enquanto o preenchimento não passa.
  const cesura = bands && bands[0] > 0 && bands[0] < 100 ? bands[0] : null

  return (
    <div
      data-slot="progress-field"
      data-over={excedeu ? "" : undefined}
      className={cn("flex w-full items-center gap-1", className)}
    >
      <ProgressPrimitive.Root
        data-slot="progress"
        data-tone={tomFinal ?? (variant === "brand" ? "brand" : "default")}
        data-over={excedeu ? "" : undefined}
        className={cn(progressVariants({ size }), "flex-1")}
        value={clamped}
        max={max}
        // Só quando excede: um `undefined` explícito apagava o texto padrão do Radix.
        {...(excedeu ? { "aria-valuetext": `${Math.round(bruto)}%` } : {})}
        {...rest}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          data-filled={pct > 0 ? "" : undefined}
          className={cn(
            progressIndicatorVariants({ tone: tomFinal, size }),
            // `brand-rainbow-image` não é decoração: é ela que declara
            // `--brand-rainbow` no elemento. Ver a medição na rodada 88.
            //
            // **E aqui mora a divergência da 1.4.11 desta peça.** O arco-íris
            // contra o trilho do sistema:
            //
            //   escuro   pior caso 4,52   as oito paradas passam
            //   claro    pior caso 1,42   **cinco reprovam** — lima 1,42,
            //                             âmbar 1,51, teal 1,73, azul 1,87,
            //                             coral 2,53
            //
            // No claro o trilho é `oklch(0.9)` e as paradas das pontas são
            // quase tão claras quanto ele. Um leito preto levava o pior caso a
            // 3,91 e foi recusado na tela: a barra de marca não pode destoar
            // das vizinhas. É a segunda divergência consciente da 1.4.11 desta
            // casa, ao lado do contorno de campo, e o caminho de volta é uma
            // declaração — `background-color: oklch(0 0 0)` no trilho, o mesmo
            // preto de `brand-field` e `brand-lava`.
            //
            // Nota de método, porque o número e o olho discordam: a razão da
            // WCAG é **só de luminância**, e um teal saturado sobre cinza
            // neutro tem contraste cromático que a fórmula não vê. Explica a
            // discordância; não a anula — lima e âmbar são frágeis de verdade.
            variant === "brand" &&
              "brand-rainbow-image bg-(image:--brand-rainbow) bg-left bg-no-repeat"
          )}
          style={{ width: `${pct}%`, ...fundoDaMarca }}
        />
        {cesura !== null && (
          <span
            data-slot="progress-threshold"
            aria-hidden
            className="absolute inset-y-0 w-px bg-foreground/40"
            style={{ left: `${cesura}%` }}
          />
        )}
      </ProgressPrimitive.Root>

      {/* **O excesso transborda, e não divide o trilho.** O trilho continua
          valendo o total sempre, então duas categorias lado a lado continuam
          comparáveis — que é o caso real, uma grade de cartões. Medido antes:
          com o excesso dividindo o trilho, a 400% o orçamento vira um quarto da
          barra e o trilho muda de significado conforme o valor.

          A pastilha é decorativa por decisão: quem carrega a verdade é o
          `aria-valuetext` e o número ao lado, que a página de docs já cobra
          como obrigatório. Ela satura, então 400% e 1000% desenham igual — uma
          mentira menor que a de hoje, em que 104% e 400% desenham igual. */}
      {excedeu && (
        <span
          data-slot="progress-over"
          aria-hidden
          className={cn(
            "shrink-0 rounded-full bg-destructive",
            size === "sm" ? "h-1.5" : "h-2"
          )}
          style={{ width: `${Math.min(28, 4 + (bruto - 100) * 0.22)}px` }}
        />
      )}
    </div>
  )
}

export { Progress, progressVariants, progressIndicatorVariants, type ProgressProps }
