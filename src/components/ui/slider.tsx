"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"
import { cva } from "class-variance-authority"

import { progressToneForBands, type ProgressBands } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

/**
 * A faixa preenchida: o único lugar onde a marca entra.
 * O arco-íris é do trilho, e a faixa é a janela que o revela: o degradê tem a
 * largura do trilho e fica atrás, então em 15% a barra é só teal e a marca só
 * completa com a barra cheia (a leitura do `Progress variant="brand"`). Escalado
 * à faixa, um valor baixo comprimiria as oito paradas em poucos pixels.
 * Recalcular pelo `value` não serve (um `Slider` costuma ser `defaultValue`, e o
 * valor congelaria no inicial), então se mede a caixa renderizada, como o
 * marcador do `Tabs`, o `useScrollFade` e a espiada do `Collapsible`.
 * Sem JavaScript não há caminho: o arco-íris no `Track` pintaria também o
 * complemento; um `::before` da faixa tem a própria faixa como bloco contentor;
 * `overflow-hidden` não recorta o absoluto; `background-size` fixo deixa trilho
 * sem pintura; e CSS não lê o `left`/`right` inline do Radix.
 * Os fallbacks das `var()` (`100%`) são carga estrutural: antes da primeira
 * medição, e sem JS, o degradê preenche a faixa e a peça degrada em vez de
 * derrubar a declaração.
 * Dois desvios de ordem de cor, não de ancoragem: no slider vertical o Radix
 * preenche de baixo para cima contra um `--brand-rainbow` fixo de 135°, então o
 * valor baixo revela a lima; `inverted` e `dir="rtl"` idem. Sem consumidor vertical no app.
 * O texto nunca pousa aqui (isenção da invariante 3, como `Progress` e `Badge brand`).
 * Divergência da 1.4.11, medida: trilho `--input-fill`, o mesmo do `Progress`,
 * então os números do claro coincidem. Escuro (trilho compositado rgb(58,58,58)):
 * pior caso 3,40 (violeta), as oito passam. Claro (rgb(222,222,222)): pior caso
 * 1,42 (lima), cinco reprovam (lima, âmbar, teal, azul, coral). No escuro o
 * `--input-fill` é translúcido (`oklch(1 0 0 / 15%)`): medi-lo cru dá número sem
 * sentido; é preciso compositá-lo sobre a superfície de baixo. O leito preto foi
 * recusado no `Progress` e aqui; o caminho de volta é um `background-color` no trilho.
 */
const sliderRangeVariants = cva(
  // `h-full` no horizontal: o Radix posiciona a faixa por `left`/`right` inline e
  // não declara altura, então sem esta classe ela mede 0.
  "absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
  {
    variants: {
      variant: {
        default: "bg-primary",
        // As cores de `bands`: o tom sai de `progressToneForBands`, a escada do `Progress`.
        success: "bg-success",
        warning: "bg-warning",
        destructive: "bg-destructive",
        // `brand-rainbow-image` não é decoração: é ela que declara `--brand-rainbow` no
        // elemento. `bg-no-repeat` porque a imagem tem a largura do trilho, e numa faixa
        // mais larga (com `inverted`) o degradê ladrilharia.
        brand: [
          "brand-rainbow-image bg-(image:--brand-rainbow) bg-no-repeat",
          "data-[orientation=horizontal]:[background-size:var(--slider-rainbow-w,100%)_100%]",
          "data-[orientation=horizontal]:[background-position-x:var(--slider-rainbow-x,0px)]",
          "data-[orientation=vertical]:[background-size:100%_var(--slider-rainbow-h,100%)]",
          "data-[orientation=vertical]:[background-position-y:var(--slider-rainbow-y,0px)]",
        ].join(" "),
      },
    },
    defaultVariants: { variant: "default" },
  }
)

/**
 * O punho mede 14px: o centro dele anda de 7px a `largura − 7px`, e não de 0 a
 * 100%. Marcas e zonas que precisam cair sob o punho usam esta régua (a conta do
 * Radix, `getThumbInBoundsOffset`, e a do `HistogramSlider`).
 */
const sobOPunho = (pct: number) => `calc(7px + (100% - 14px) * ${pct / 100})`

type SliderMark = number | { value: number; label?: React.ReactNode }

/**
 * O trilho de valor contínuo.
 * - `label` e o valor: o cabeçalho do `Progress`; o nome nomeia os punhos por
 *   `aria-labelledby` e o valor acompanha o arraste. `format` escreve o número no
 *   cabeçalho, no balão e no `aria-valuetext` de cada punho ("R$ 1.200,00").
 * - `marks`: traços nos pontos que importam, com rótulo opcional, sob o centro do
 *   punho (`sobOPunho`); os que a faixa já cobre acendem.
 * - `bubble`: o valor num balão acima do punho no arraste (`:active`, que vale no
 *   toque) ou no foco de teclado.
 * - `bands`: os cortes do `Progress`; a faixa muda de tom e o trilho mostra as
 *   zonas. Não se combina com `variant="brand"`.
 * O desenho é a razão entre trilho e punho: 8px e 14px (1,75), para o punho
 * terminar o preenchimento em vez de pousar sobre um fio. O `Range` do Radix
 * precisa de `h-full`, senão mede 0px e nunca pinta.
 */
function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  variant,
  thumbLabels,
  label,
  format,
  showValue,
  marks,
  bubble = false,
  bands,
  onValueChange,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: Omit<React.ComponentProps<typeof SliderPrimitive.Root>, "children"> & {
    /** `default` ou `brand`. As cores de `bands` são do componente. */
    variant?: "default" | "brand"
    /** Nome de cada punho. Com dois, o padrão é "Valor mínimo" e "Valor máximo". */
    thumbLabels?: string[]
    /** O nome, no cabeçalho. Ele nomeia os punhos. */
    label?: React.ReactNode
    /** Escreve o número: no cabeçalho, no balão e no `aria-valuetext`. */
    format?: (value: number) => string
    /** Mostra o valor no cabeçalho. O padrão é mostrar quando há `label`. */
    showValue?: boolean
    /** Traços no trilho, com rótulo opcional embaixo. */
    marks?: SliderMark[]
    /** O valor num balão sobre o punho, no arraste e no foco de teclado. */
    bubble?: boolean
    /** Os dois cortes da escada de cor, em % do total — os do `Progress`. */
    bands?: ProgressBands
  }) {
  const resolved = value ?? defaultValue
  const thumbCount =
    Array.isArray(resolved) && resolved.length > 0 ? resolved.length : 1

  // O valor atual, controlado ou não: cabeçalho, balão, marcas e zonas precisam
  // dele no arraste, e um slider de `defaultValue` não o conta a ninguém.
  const [atual, setAtual] = React.useState<number[]>(
    () => (Array.isArray(resolved) && resolved.length ? [...resolved] : [min])
  )
  React.useEffect(() => {
    if (value) setAtual([...value])
  }, [value])
  const escrever = format ?? ((v: number) => String(v))
  const pct = (v: number) => (max > min ? ((v - min) / (max - min)) * 100 : 0)
  const baixo = thumbCount > 1 ? Math.min(...atual) : min
  const alto = Math.max(...atual)
  // A escada de `bands` só devolve estes três; o tipo do `Progress` é mais largo.
  const tom =
    bands && variant !== "brand"
      ? (progressToneForBands(pct(alto), bands) as "success" | "warning" | "destructive")
      : undefined

  const labelId = React.useId()
  const mostrarValor = showValue ?? label != null
  const marcas = (marks ?? []).map((m) => (typeof m === "number" ? { value: m } : m))
  const comRotulos = marcas.some((m) => m.label != null)

  const trilhoRef = React.useRef<HTMLSpanElement | null>(null)
  const faixaRef = React.useRef<HTMLSpanElement | null>(null)

  /**
   * Prende a imagem do arco-íris ao trilho, medindo a caixa renderizada. Publica
   * no trilho (o pai, como a trilha do `Tabs`), com os valores de posição já
   * negados para a classe ser um `var()` puro. `offsetLeft`/`offsetTop` são
   * relativos ao trilho, e não `getBoundingClientRect` (escorregaria com a página rolada).
   * O `ResizeObserver` pega mudança de tamanho; o `MutationObserver` em `style`
   * pega a faixa andando sem mudar de tamanho (o Radix reescreve `left`/`right`
   * inline; slider de intervalo com os dois punhos juntos). Só em `brand`.
   */
  React.useLayoutEffect(() => {
    const trilho = trilhoRef.current
    const faixa = faixaRef.current
    if (variant !== "brand" || !trilho || !faixa) return

    const medir = () => {
      trilho.style.setProperty("--slider-rainbow-w", `${trilho.offsetWidth}px`)
      trilho.style.setProperty("--slider-rainbow-h", `${trilho.offsetHeight}px`)
      trilho.style.setProperty("--slider-rainbow-x", `${-faixa.offsetLeft}px`)
      trilho.style.setProperty("--slider-rainbow-y", `${-faixa.offsetTop}px`)
    }

    medir()

    const ro = new ResizeObserver(medir)
    ro.observe(trilho)
    ro.observe(faixa)

    const mo = new MutationObserver(medir)
    mo.observe(faixa, { attributes: true, attributeFilter: ["style"] })

    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [variant])

  // Quem tem papel de `slider` é o punho, não a raiz: o nome precisa chegar a ele
  // (senão um punho único fica sem nome e o par recebe "Minimum"/"Maximum" do Radix).
  const nomeDoPunho = (index: number): string | undefined =>
    thumbLabels?.[index] ??
    (thumbCount === 1
      ? ariaLabel
      : thumbCount === 2
        ? index === 0
          ? "Valor mínimo"
          : "Valor máximo"
        : undefined)

  const raiz = (
    <SliderPrimitive.Root
      data-slot="slider"
      data-variant={variant ?? "default"}
      data-tone={tom}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      onValueChange={(v) => {
        setAtual(v)
        onValueChange?.(v)
      }}
      className={cn(
        "relative flex w-full touch-none items-center select-none",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        // O estado desligado mora aqui, não no punho: `disabled:` é a pseudo-classe
        // `:disabled`, que não existe em `<span>`. O Radix marca `data-disabled` em
        // todas as partes; a raiz apaga a peça inteira.
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        ref={trilhoRef}
        data-slot="slider-track"
        className={cn(
          "relative w-full grow overflow-hidden rounded-full",
          // O mesmo token do trilho desligado do `Switch`; `bg-muted` ficaria a meio ponto
          // de cinza do cartão no claro. (Sem valores aqui: o auditor lê comentário como
          // código e um hex viraria cor literal.)
          "bg-input-fill",
          "h-2 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2"
        )}
      >
        {/*
           As zonas de `bands`, atrás da faixa: a de aviso e a de perigo a 30% do tom,
           como no `Progress`, em % do trilho porque a faixa do Radix também é.
        */}
        {bands && variant !== "brand"
          ? (
              [
                [bands[0], bands[1], "bg-warning/30"],
                [bands[1], 100, "bg-destructive/30"],
              ] as const
            ).map(([de, ate, cor]) =>
              ate > de ? (
                <span
                  key={cor}
                  aria-hidden
                  data-slot="slider-zone"
                  className={cn("absolute inset-y-0", cor)}
                  style={{ left: `${de}%`, width: `${Math.min(100, ate) - de}%` }}
                />
              ) : null
            )
          : null}
        <SliderPrimitive.Range
          ref={faixaRef}
          data-slot="slider-range"
          className={sliderRangeVariants({ variant: variant === "brand" ? "brand" : (tom ?? "default") })}
        />
        {marcas.map((m) => {
          const p = pct(m.value)
          const coberta = m.value >= baixo && m.value <= alto
          return (
            <span
              key={m.value}
              aria-hidden
              data-slot="slider-mark"
              data-covered={coberta ? "" : undefined}
              className={cn(
                "pointer-events-none absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-(--duration-fast)",
                coberta ? "bg-primary-foreground/70" : "bg-foreground/30"
              )}
              style={{ left: sobOPunho(p) }}
            />
          )
        })}
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          aria-label={nomeDoPunho(index)}
          aria-labelledby={
            thumbCount === 1 && !ariaLabel
              ? ariaLabelledBy ?? (label != null ? labelId : undefined)
              : undefined
          }
          aria-valuetext={format && atual[index] != null ? format(atual[index]) : undefined}
          className={cn(
            "group/thumb relative block size-3.5 shrink-0 rounded-full border border-primary-accent/50 bg-background shadow-sm",
            // 44px de alvo sob um punho de 14. O pseudo-elemento é a saída do `Switch`:
            // cresce a área de contato sem crescer o desenho nem a altura da peça.
            "after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2",
            // Só o anel transita: quem se move no arraste é o `<span>` de posição que
            // embrulha o punho, e nomear a propriedade diz o que se anima.
            "transition-[box-shadow] duration-(--duration-fast) ease-(--ease-out)",
            // O halo de contato é da marca e baixo (o anel de foco confundiria tocar com
            // focar). `active:` é o par de toque: no telefone `hover:` não existe.
            "ring-0 hover:ring-4 hover:ring-primary-accent/15 active:ring-4 active:ring-primary-accent/25",
            // O anel de foco do projeto: 3px em `--ring`, como no `Switch` e no `Input`. Vem
            // por último para vencer o halo.
            "focus-visible:ring-3 focus-visible:ring-ring/45 focus-visible:outline-hidden"
          )}
        >
          {bubble && atual[index] != null ? (
            // O balão acende no arraste (`:active`, que vale no dedo) e no foco de teclado,
            // e não no foco que o Radix dá ao punho num clique (ficaria aceso depois de soltar).
            <span
              aria-hidden
              data-slot="slider-bubble"
              className={cn(
                "pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 translate-y-1 rounded-md bg-foreground px-1.5 py-0.5 text-xs whitespace-nowrap text-background opacity-0 shadow-sm",
                "nums transition-[opacity,translate] duration-(--duration-fast) ease-(--ease-out)",
                "group-active/thumb:translate-y-0 group-active/thumb:opacity-100 group-focus-visible/thumb:translate-y-0 group-focus-visible/thumb:opacity-100"
              )}
            >
              {escrever(atual[index])}
            </span>
          ) : null}
        </SliderPrimitive.Thumb>
      ))}
    </SliderPrimitive.Root>
  )

  // Sem cabeçalho nem rótulos de marca, a peça é a de sempre (o `HistogramSlider` passa `className` à raiz).
  if (label == null && !mostrarValor && !comRotulos) return raiz

  return (
    <div data-slot="slider-group" className="flex w-full flex-col gap-2">
      {label != null || mostrarValor ? (
        <div data-slot="slider-header" className="flex min-w-0 items-baseline justify-between gap-3 text-sm">
          {label != null ? (
            <span id={labelId} className="min-w-0 truncate font-medium text-foreground">
              {label}
            </span>
          ) : (
            <span />
          )}
          {mostrarValor ? (
            <span aria-hidden className="nums shrink-0 text-muted-foreground">
              {thumbCount > 1
                ? `${escrever(baixo)} – ${escrever(alto)}`
                : escrever(atual[0] ?? min)}
            </span>
          ) : null}
        </div>
      ) : null}
      {raiz}
      {comRotulos ? (
        <div aria-hidden data-slot="slider-mark-labels" className="relative h-4 text-2xs text-muted-foreground">
          {marcas.map((m) =>
            m.label != null ? (
              <span
                key={m.value}
                className="nums absolute top-0 -translate-x-1/2 whitespace-nowrap"
                style={{ left: sobOPunho(pct(m.value)) }}
              >
                {m.label}
              </span>
            ) : null
          )}
        </div>
      ) : null}
    </div>
  )
}

export { Slider, sliderRangeVariants }
