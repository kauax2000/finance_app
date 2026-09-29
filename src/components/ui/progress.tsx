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

/**
 * O preenchimento por tom, em fundo e em traço. Mora fora da `cva` porque três
 * formas o leem: a barra, a casa da segmentada e o arco do anel, que pinta
 * `stroke` e não `background`.
 */
const TOM_FUNDO = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  income: "bg-income",
  expense: "bg-expense",
} as const

const TOM_TRACO = {
  default: "stroke-primary",
  success: "stroke-success",
  warning: "stroke-warning",
  destructive: "stroke-destructive",
  income: "stroke-income",
  expense: "stroke-expense",
} as const

const progressIndicatorVariants = cva(
  cn(
    // `relative` põe o preenchimento acima das zonas do trilho, que são
    // absolutas e vêm antes no DOM.
    "relative h-full rounded-full",
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
      tone: TOM_FUNDO,
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
  VariantProps<typeof progressVariants> & {
    max?: number
    /**
     * Divide a barra em N casas, cada uma cheia ou vazia: parcelas pagas,
     * etapas de um fluxo. A casa acende quando o valor a cobre inteira.
     */
    segments?: number
    /**
     * A linha de cima (`ProgressHeader`) e a de baixo (`ProgressFooter`). São
     * props, e não filhos reconhecidos pelo tipo: o Fast Refresh troca a
     * função a cada edição e `c.type === Peca` deixa de bater calado — a
     * lição do `TablePanel`, trancada em `table-ladder.test.ts`.
     */
    header?: React.ReactNode
    footer?: React.ReactNode
  }

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
  | (Base & { tone?: Tom; bands?: never; zones?: never; variant?: "default" })
  | (Base & {
      bands: ProgressBands
      /**
       * Pinta no trilho a faixa de aviso e a de perigo, para a pessoa ver onde
       * a barra vai entrar antes de ela chegar lá. Substitui o traço do corte.
       */
      zones?: boolean
      tone?: never
      variant?: "default"
    })
  | (Base & { variant: "brand"; tone?: never; bands?: never; zones?: never })

/**
 * O que as peças de texto leem: o rótulo registra o `id` para a barra apontar
 * `aria-labelledby` (só quando ele existe — apontar para um `id` ausente deixa
 * o nome vazio, a lição do `PopoverTitle`), e o valor lê a porcentagem.
 */
type ProgressContextValue = {
  labelId: string
  setHasLabel: (tem: boolean) => void
  bruto: number
  size: "sm" | "md" | "lg"
}

const ProgressContext = React.createContext<ProgressContextValue | null>(null)

/** O `id` do rótulo e o registro dele, para a barra e para o anel. */
function useProgressLabel() {
  const labelId = React.useId()
  const [hasLabel, setHasLabel] = React.useState(false)
  return { labelId, hasLabel, setHasLabel }
}

/** O teto da segmentada: acima disso a barra é contínua. */
const MAX_CASAS = 24

function porcentagem(value: number | null | undefined, max: number) {
  const bruto = value != null && max > 0 ? (value / max) * 100 : 0
  return { bruto, pct: Math.min(100, Math.max(0, bruto)) }
}

function Progress({
  className,
  value,
  max = 100,
  size,
  segments,
  header,
  footer,
  ...props
}: ProgressProps) {
  const { tone, bands, zones, variant = "default", ...rest } = props as Base & {
    tone?: Tom
    bands?: ProgressBands
    zones?: boolean
    variant?: "default" | "brand"
  }

  const { bruto, pct } = porcentagem(value, max)
  const { labelId, hasLabel, setHasLabel } = useProgressLabel()
  const pecas = header != null || footer != null
  // Um `aria-label` escrito na chamada vence o `ProgressLabel`: ele costuma ser
  // mais rico que o rótulo visível ("Uso do orçamento na categoria Mercado:
  // 45% de R$ 800,00"), e `aria-labelledby` o apagaria.
  const nomeado = props["aria-label"] != null

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
  // Com zonas o corte já está pintado, e o traço seria o segundo sinal.
  const cesura = bands && !zones && bands[0] > 0 && bands[0] < 100 ? bands[0] : null

  // **As casas.** Cada uma acende quando o valor a cobre inteira — 7 de 12
  // parcelas são sete casas, nunca sete e meia. O `1e-9` absorve o erro de
  // ponto flutuante de `7 / 12 * 100 / 100 * 12`.
  //
  // Acima de 24 a barra volta a ser contínua: um parcelamento de 48 vezes numa
  // barra de 200px dá casas de 2px entre 47 frestas, que leem como tracejado e
  // não como contagem.
  const casas =
    segments && segments > 1 && segments <= MAX_CASAS ? Math.floor(segments) : null
  const cheias = casas ? Math.floor((pct / 100) * casas + 1e-9) : 0

  const barra = (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-tone={tomFinal ?? (variant === "brand" ? "brand" : "default")}
      data-over={excedeu ? "" : undefined}
      data-segments={casas ?? undefined}
      className={cn(
        progressVariants({ size }),
        "flex-1",
        // A segmentada não tem trilho contínuo: cada casa é o próprio trilho.
        casas && "flex overflow-visible rounded-none bg-transparent",
        casas && (size === "sm" ? "gap-0.5" : "gap-1")
      )}
      value={clamped}
      max={max}
      aria-labelledby={nomeado ? undefined : hasLabel ? labelId : undefined}
      // Só quando excede: um `undefined` explícito apagava o texto padrão do Radix.
      {...(excedeu ? { "aria-valuetext": `${Math.round(bruto)}%` } : {})}
      {...rest}
    >
      {casas ? (
        Array.from({ length: casas }, (_, i) => {
          const acesa = i < cheias
          return (
            <span
              key={i}
              data-slot="progress-segment"
              data-filled={acesa ? "" : undefined}
              className={cn(
                "h-full flex-1 rounded-full bg-input-fill transition-colors duration-(--duration-slow) ease-(--ease-out)",
                acesa && variant !== "brand" && TOM_FUNDO[tomFinal ?? "default"],
                // Na marca cada casa mostra a sua fatia do arco-íris: o degradê
                // tem a largura da barra inteira, e a posição é a da casa — a
                // conta aritmética do `HistogramSlider`.
                acesa &&
                  variant === "brand" &&
                  "brand-rainbow-image bg-(image:--brand-rainbow) bg-no-repeat"
              )}
              style={
                acesa && variant === "brand"
                  ? {
                      backgroundSize: `${casas * 100}% 100%`,
                      backgroundPosition: `${(i / (casas - 1)) * 100}% 0`,
                    }
                  : undefined
              }
            />
          )
        })
      ) : (
        <>
          {zones && bands ? <ProgressZones bands={bands} /> : null}
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
        </>
      )}
    </ProgressPrimitive.Root>
  )

  const linha = (
    <div
      data-slot="progress-field"
      data-over={excedeu ? "" : undefined}
      className={cn("flex w-full items-center gap-1", !pecas && className)}
    >
      {barra}

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

  // Sem peças de texto, a barra é o que sempre foi — nenhuma chamada muda.
  if (!pecas) return linha

  // O rodapé vai depois da barra **no DOM**, e não por `order`: o leitor de
  // tela lê na ordem da árvore, e "75%" antes da barra não teria referente.
  return (
    <ProgressContext.Provider
      value={{ labelId, setHasLabel, bruto, size: size ?? "md" }}
    >
      <div
        data-slot="progress-group"
        className={cn("flex w-full flex-col gap-2", className)}
      >
        {header}
        {linha}
        {footer}
      </div>
    </ProgressContext.Provider>
  )
}

/**
 * As zonas do trilho: a faixa de aviso e a de perigo, pintadas a 30% do tom.
 * Ficam atrás do preenchimento (que é `relative` e vem depois), então a barra
 * as cobre conforme avança, e o que sobra à frente é o risco que vem.
 */
function ProgressZones({ bands: [aviso, perigo] }: { bands: ProgressBands }) {
  const faixa = (de: number, ate: number, tom: string) =>
    ate > de ? (
      <span
        aria-hidden
        data-slot="progress-zone"
        className={cn("absolute inset-y-0", tom)}
        style={{ left: `${de}%`, width: `${ate - de}%` }}
      />
    ) : null
  const a = Math.min(100, Math.max(0, aviso))
  const p = Math.min(100, Math.max(0, perigo))
  return (
    <>
      {faixa(a, p, "bg-warning/30")}
      {faixa(p, 100, "bg-destructive/30")}
    </>
  )
}

/** A linha de cima, pela prop `header`: o nome à esquerda, o valor, o estado ou um `Badge` à direita. */
function ProgressHeader({ className, ...props }: React.ComponentProps<"div">) {
  const ctx = React.useContext(ProgressContext)
  return (
    <div
      data-slot="progress-header"
      className={cn(
        "flex min-w-0 items-center justify-between gap-3",
        ctx?.size === "sm" ? "text-xs" : "text-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * A linha de baixo, mais quieta: o que foi consumido de quanto, a porcentagem.
 * Entra pela prop `footer` do `Progress`, que a põe depois da barra.
 */
function ProgressFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="progress-footer"
      className={cn(
        "flex min-w-0 items-center justify-between gap-3 text-xs text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

/** O nome da barra. Ele a nomeia: a barra aponta `aria-labelledby` para ele. */
function ProgressLabel({ className, id, ...props }: React.ComponentProps<"span">) {
  const ctx = React.useContext(ProgressContext)
  const setHasLabel = ctx?.setHasLabel
  React.useLayoutEffect(() => {
    if (!setHasLabel || id) return
    setHasLabel(true)
    return () => setHasLabel(false)
  }, [setHasLabel, id])
  return (
    <span
      data-slot="progress-label"
      id={id ?? ctx?.labelId}
      className={cn("min-w-0 truncate font-medium text-foreground", className)}
      {...props}
    />
  )
}

/**
 * O número. Sem filhos, escreve a porcentagem do valor **bruto** — 104% numa
 * categoria que estourou, e não os 100 que a barra desenha. Com filhos, escreve
 * o que receber ("2 de 5", "R$ 3.750"). É visual: quem anuncia é a barra.
 */
function ProgressValue({ className, children, ...props }: React.ComponentProps<"span">) {
  const ctx = React.useContext(ProgressContext)
  return (
    <span
      data-slot="progress-value"
      aria-hidden
      className={cn("nums shrink-0 text-muted-foreground", className)}
      {...props}
    >
      {children ?? `${Math.round(ctx?.bruto ?? 0)}%`}
    </span>
  )
}

/**
 * O anel. Sem `ctx.size` de barra: o degrau é o diâmetro (`sm` 32, `md` 64,
 * `lg` 128) e a espessura acompanha, em unidades do `viewBox` de 100.
 */
const RING = {
  sm: { box: "size-8", traco: 14, texto: "sr-only" },
  md: { box: "size-16", traco: 10, texto: "text-xs" },
  lg: { box: "size-32", traco: 8, texto: "text-2xl" },
} as const

type ProgressRingProps = Omit<
  React.ComponentProps<typeof ProgressPrimitive.Root>,
  "children"
> & {
  max?: number
  size?: keyof typeof RING
  /** O miolo. Sem ele, o anel escreve a porcentagem (menos no `sm`). */
  children?: React.ReactNode
} & (
    | { tone?: Tom; bands?: never }
    | { bands: ProgressBands; tone?: never }
  )

/**
 * **O `Progress` dobrado em círculo, para um valor só** — o que o `ChartRadial`
 * não é: ele é gráfico de várias categorias, com legenda. Mesmo trilho, mesmos
 * tons, mesmos cortes e o mesmo estouro (cheio e vermelho, com o número real no
 * `aria-valuetext`). Não há marca aqui: um arco-íris dobrado em anel troca de
 * cor pela volta e não diz nada sobre o valor.
 */
function ProgressRing({
  className,
  value,
  max = 100,
  size = "md",
  tone,
  bands,
  children,
  ...props
}: ProgressRingProps) {
  const { bruto, pct } = porcentagem(value, max)
  const excedeu = value != null && value > max
  const clamped = value != null ? Math.min(max, Math.max(0, value)) : value
  const tom: Tom = bands
    ? excedeu
      ? "destructive"
      : progressToneForBands(pct, bands)
    : (tone ?? "default")
  const { labelId, hasLabel, setHasLabel } = useProgressLabel()
  const r = RING[size]
  const raio = 50 - r.traco / 2

  return (
    <ProgressContext.Provider value={{ labelId, setHasLabel, bruto, size: size === "lg" ? "md" : "sm" }}>
      <ProgressPrimitive.Root
        data-slot="progress-ring"
        data-tone={tom}
        data-over={excedeu ? "" : undefined}
        value={clamped}
        max={max}
        aria-labelledby={props["aria-label"] != null ? undefined : hasLabel ? labelId : undefined}
        {...(excedeu ? { "aria-valuetext": `${Math.round(bruto)}%` } : {})}
        className={cn("relative inline-grid shrink-0 place-items-center", r.box, className)}
        {...props}
      >
        <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full -rotate-90">
          <circle cx="50" cy="50" r={raio} fill="none" strokeWidth={r.traco} className="stroke-input-fill" />
          {pct > 0 ? (
            // `pathLength` 100 faz o traço valer a porcentagem direto. A ponta
            // redonda dá ao 1% um ponto, como o piso da barra.
            <circle
              cx="50"
              cy="50"
              r={raio}
              fill="none"
              strokeWidth={r.traco}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${pct} 100`}
              className={cn(
                TOM_TRACO[tom],
                "transition-[stroke-dasharray] duration-(--duration-slow) ease-(--ease-out)"
              )}
            />
          ) : null}
        </svg>
        <span
          data-slot="progress-ring-center"
          className={cn("relative flex flex-col items-center text-center leading-tight", r.texto)}
        >
          {children ?? (
            <span aria-hidden className="nums font-semibold text-foreground">
              {Math.round(bruto)}%
            </span>
          )}
        </span>
      </ProgressPrimitive.Root>
    </ProgressContext.Provider>
  )
}

export {
  Progress,
  ProgressFooter,
  ProgressHeader,
  ProgressLabel,
  ProgressRing,
  ProgressValue,
  progressVariants,
  progressIndicatorVariants,
  type ProgressProps,
}
