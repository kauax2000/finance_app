"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Card, CardToolbar } from "@/components/ui/card"
import { Code } from "@/components/ui/code"
import { Separator } from "@/components/ui/separator"
import {
  PageSection,
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/ui/page-section"

/** Um grupo nomeado de specs dentro de uma página de fundação. */
export function Group({
  id,
  title,
  description,
  layout = "masonry",
  children,
}: {
  id?: string
  title: string
  description?: React.ReactNode
  /** "masonry" e "grid" são a mesma grade `auto-fit`; "flow" não fatia nada (o conteúdo governa a própria largura). */
  layout?: "masonry" | "grid" | "flow"
  children: React.ReactNode
}) {
  return (
    // O cabeçalho de seção é o mesmo das páginas de componente; do `Group` fica só o `layout`.
    <PageSection
      id={id}
      variant="ruled"
      size="lg"
      className="scroll-mt-24"
    >
      <PageSectionHeader>
        <PageSectionTitle>{title}</PageSectionTitle>
        {description ? (
          <PageSectionDescription>{description}</PageSectionDescription>
        ) : null}
      </PageSectionHeader>
      {/* Ocupa a largura da coluna: `auto-fit` colapsa as trilhas vazias (colunas por altura largavam a terceira vazia). */}
      <div
        className={
          layout === "flow"
            ? "flex flex-col gap-6"
            : "grid grid-cols-[repeat(auto-fit,minmax(min(100%,19rem),1fr))] items-start gap-4 *:mb-0"
        }
      >
        {children}
      </div>
    </PageSection>
  )
}

/** Um cartão de especificação: o `Card` do sistema, para a escala de Shape & Elevation chegar ao catálogo. */
export function Spec({
  title,
  meta,
  className,
  bodyClassName,
  children,
}: {
  title: string
  meta?: string
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}) {
  return (
    <Card padding="none" className={cn("mb-4 break-inside-avoid", className)}>
      <CardToolbar variant="title">
        <h3>{title}</h3>
        {meta ? <Code className="shrink-0">{meta}</Code> : null}
      </CardToolbar>
      {/* O fio sob o título é do `Spec`: o `CardToolbar` não desenha fio, e sem a régua o título lia como a primeira linha da lista. */}
      <Separator />
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </Card>
  )
}

/**
 * A lista de dentro de um `Spec` com `bodyClassName="p-0"`: uma linha por item, termo à esquerda
 * e corpo à direita. O fio entre linhas é `Separator tone="soft"` recuado; com o peso cheio a lista lia como grade.
 */
export function SpecList({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const linhas = React.Children.toArray(children)
  return (
    <dl className={className}>
      {linhas.map((linha, i) => (
        <React.Fragment key={i}>
          {i > 0 ? (
            <div aria-hidden className="ps-4">
              <Separator tone="soft" />
            </div>
          ) : null}
          {linha}
        </React.Fragment>
      ))}
    </dl>
  )
}

/** Uma linha da `SpecList`. Com `term`, duas colunas a partir de `sm` (largura `termWidth`), empilhadas no telefone. */
export function SpecRow({
  term,
  termWidth = "8rem",
  align = "baseline",
  className,
  children,
}: {
  term?: React.ReactNode
  termWidth?: string
  align?: "baseline" | "start" | "center"
  className?: string
  children: React.ReactNode
}) {
  if (!term) {
    return <div className={cn("px-4 py-3.5", className)}>{children}</div>
  }
  return (
    <div
      className={cn(
        "grid gap-x-6 gap-y-0.5 px-4 py-3.5 sm:grid-cols-[var(--spec-term-w)_minmax(0,1fr)]",
        align === "baseline" ? "items-baseline" : align === "center" ? "sm:items-center" : "items-start",
        className
      )}
      style={{ "--spec-term-w": termWidth } as React.CSSProperties}
    >
      <dt className="text-sm font-medium text-foreground">{term}</dt>
      <dd className="flex min-w-0 flex-col">{children}</dd>
    </div>
  )
}

/** A descrição de uma `SpecRow`: o corpo do texto, no cinza de apoio. */
export function SpecRowDescription({ children }: { children: React.ReactNode }) {
  return <span className="text-sm text-pretty text-muted-foreground">{children}</span>
}

/** Os chips de código de uma `SpecRow` — as peças, os tokens. */
export function SpecChips({ items, className }: { items: readonly string[]; className?: string }) {
  if (!items.length) return null
  return (
    <span className={cn("mt-2 flex flex-wrap gap-1.5", className)}>
      {items.map((w) => (
        <Code key={w}>{w}</Code>
      ))}
    </span>
  )
}

/** Empilha filhos com folga vertical dentro do corpo de um Spec. */
export function Stack({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn("flex flex-col gap-4", className)}>{children}</div>
}

/**
 * O painel de um espécime. Segue o tema do alternador; a medição de contraste cobre os dois
 * temas e o outro só se anuncia quando reprova.
 */
export function SpecimenPanel({
  surface = "card",
  className,
  children,
}: {
  /** A superfície de fundo do painel. `card` é a referência das medições. */
  surface?: "card" | "background"
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        // Painel e o que mora dentro vestem a superfície da escala; o concêntrico dava 6 dentro de um cartão.
        `rounded-surface flex min-w-0 flex-col gap-3 overflow-hidden p-4 ring-1 ring-border ring-inset`,
        surface === "card" ? "bg-card" : "bg-background",
        className
      )}
    >
      {children}
    </div>
  )
}

export type SurfaceLayer = {
  token: string
  onToken: string
  /** O que separa esta camada da anterior, quando não é a cor. */
  note?: string
}

/**
 * As superfícies como elas são: uma dentro da outra, cada camada com o texto na sua cor e um fio próprio
 * (`--card` e `--popover` são a mesma cor e sem fio liam como uma caixa só). O canto é
 * `rounded-surface` nas camadas e cápsula nos preenchimentos; o concêntrico batia no piso de 6.
 */
export function SurfaceNest({
  layers,
  fills,
}: {
  layers: SurfaceLayer[]
  /** Preenchimentos que moram dentro da camada mais funda. */
  fills?: SurfaceLayer[]
}) {
  const [layer, ...rest] = layers
  if (!layer) {
    return fills?.length ? (
      <div className="flex flex-wrap gap-2">
        {fills.map((fill) => (
          <span
            key={fill.token}
            className="rounded-full px-3 py-1.5 font-mono text-xs"
            style={{
              backgroundColor: `var(${fill.token})`,
              color: `var(${fill.onToken})`,
            }}
          >
            {fill.token}
          </span>
        ))}
      </div>
    ) : null
  }
  return (
    <div
      className="rounded-surface flex flex-col gap-2.5 p-4 ring-1 ring-border ring-inset"
      style={{ backgroundColor: `var(${layer.token})` }}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span
          className="font-mono text-xs"
          style={{ color: `var(${layer.onToken})` }}
        >
          {layer.token}
        </span>
        {layer.note ? (
          <span className="text-2xs text-muted-foreground">{layer.note}</span>
        ) : null}
      </div>
      <SurfaceNest layers={rest} fills={fills} />
    </div>
  )
}

/** Uma rampa categórica, encostada: o olho compara o que está junto; o vão de 4px deixa o cartão aparecer (a pergunta dos 3:1). */
export function Ramp({
  label,
  tokens,
}: {
  label?: string
  tokens: { token: string; name: string }[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <span className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
      ) : null}
      <div className="flex gap-1">
        {tokens.map((t) => (
          <div
            key={t.token}
            className="rounded-surface h-20 flex-1"
            style={{ backgroundColor: `var(${t.token})` }}
          />
        ))}
      </div>
      <div className="flex gap-1">
        {tokens.map((t) => (
          <span
            key={t.token}
            className="nums flex-1 truncate text-center font-mono text-2xs text-muted-foreground"
          >
            {t.name}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * A identidade como disco com iniciais, e não como `TokenTile`: o ladrilho mede uma cor contra uma
 * superfície, e aqui o que importa é a tinta em cima.
 */
export function IdentityDiscs({
  label,
  items,
}: {
  label?: string
  items: { surface: string; onToken: string; initials: string }[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <span className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
      ) : null}
      <div className="flex flex-wrap gap-2.5">
        {items.map((item) => (
          <span
            key={item.surface}
            className="flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
            style={{
              backgroundColor: `var(${item.surface})`,
              color: `var(${item.onToken})`,
            }}
          >
            {item.initials}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * O contrato de um token de cor: a pergunta que a tela faz dele (AA de texto, 3:1 de 1.4.11, ou nenhuma).
 * Sem regra declarada a amostra mede e mostra o número, sem veredito.
 */
export type SwatchRule = "text" | "ui"

const RULE_MIN: Record<SwatchRule, number> = { text: 4.5, ui: 3 }

const RULE_NAME: Record<SwatchRule, string> = {
  text: "AA para texto (4,5:1)",
  ui: "WCAG 1.4.11 para peça de interface (3:1)",
}

/**
 * A amostra de um token: um campo de cor. Mostra o tema que está valendo; `var(--token)` resolve pelo `.dark` da página.
 */
export function TokenTile({
  name,
  token,
  /** Token do texto que se apoia sobre este, quando existe um par. */
  onToken,
  /** O que escrever sobre a cor. Só aparece quando há par de texto. */
  sample = "Aa",
  /** Sem isto, um par de texto vale AA e o resto é informativo. */
  rule = onToken ? "text" : undefined,
}: {
  name: string
  token: string
  onToken?: string
  sample?: string
  rule?: SwatchRule
}) {
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <div
        // O cartão por baixo faz um token translúcido (`--border`, `--overlay`) aparecer composto, como a tela o mostra.
        className="rounded-surface relative flex h-24 items-center justify-center overflow-hidden bg-card ring-1 ring-border ring-inset"
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `var(${token})` }}
        />
        {onToken ? (
          <span
            className="relative px-3 text-center text-lg leading-tight font-medium text-balance"
            style={{ color: `var(${onToken})` }}
          >
            {sample}
          </span>
        ) : null}
      </div>
      {/* Nome sobre token é o mesmo dado em duas linhas: separa a entrelinha. */}
      <figcaption className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-foreground">
          {name}
        </span>
        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          {/* Nome e valor do token são o mesmo dado: ficam juntos. */}
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
            <code className="font-mono text-2xs break-all text-muted-foreground">
              {token}
            </code>
            <SwatchHex token={token} />
          </span>
          <SwatchContrast token={token} onToken={onToken} rule={rule} />
        </div>
      </figcaption>
    </figure>
  )
}

const GRID_COLS: Record<2 | 3 | 4, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
}

export function TokenGrid({
  label,
  meta,
  columns = 3,
  children,
}: {
  label?: string
  meta?: string
  /** Quantos ladrilhos por linha. Um conjunto de quatro quer os quatro juntos. */
  columns?: 2 | 3 | 4
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      {label ? (
        <div className="flex items-baseline justify-between gap-2 border-b border-border pb-1.5">
          <span className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </span>
          {meta ? <Code className="shrink-0">{meta}</Code> : null}
        </div>
      ) : null}
      <div className={cn("grid gap-x-4 gap-y-5", GRID_COLS[columns])}>
        {children}
      </div>
    </div>
  )
}

/**
 * O hexadecimal do token, no tema que está valendo, lido da cor que o browser resolveu. É uma projeção
 * em sRGB (num monitor P3 a tela mostra mais cor); para editar o token, o valor é o de `globals.css`.
 * Token translúcido responde com a cor de base mais o alpha.
 */
function SwatchHex({ token }: { token: string }) {
  const [values, setValues] = React.useState<{
    light: string
    dark: string
  } | null>(null)
  const probeRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const host = probeRef.current
    if (!host) return
    const read = createColorReader()

    const measure = (dark: boolean) => {
      const el = document.createElement("div")
      el.className = dark ? "dark" : "light"
      el.style.backgroundColor = `var(${token})`
      host.append(el)
      const css = getComputedStyle(el).backgroundColor
      el.remove()
      return read(css)
    }

    const light = measure(false)
    const dark = measure(true)
    if (light && dark) setValues({ light, dark })
  }, [token])

  return (
    <span className="contents" ref={probeRef}>
      {values ? (
        <>
          <code className="font-mono text-2xs text-foreground dark:hidden">
            {values.light}
          </code>
          <code className="hidden font-mono text-2xs text-foreground dark:inline">
            {values.dark}
          </code>
        </>
      ) : null}
    </span>
  )
}

/** Lê uma cor CSS resolvida como `#RRGGBB`, com o alpha atrás quando existe (`getImageData` devolve os bytes sem o alpha aplicado). */
function createColorReader() {
  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext("2d", { willReadFrequently: true })

  const paint = (color: string) => {
    ctx!.clearRect(0, 0, 1, 1)
    ctx!.fillStyle = color
    ctx!.fillRect(0, 0, 1, 1)
    return ctx!.getImageData(0, 0, 1, 1).data
  }

  return (css: string): string | null => {
    if (!ctx) return null

    const [r, g, b, a] = paint(css)
    if (a === 0) return null

    // A base sai de `rgb(from … r g b / 1)`: sem o `/ 1` a sintaxe relativa herda o alpha da origem, e o pixel
    // translúcido (26 níveis por canal a 10%) não reconstrói a cor. O sentinela detecta browser sem sintaxe relativa.
    ctx.fillStyle = "#123456"
    ctx.fillStyle = `rgb(from ${css} r g b / 1)`
    const base = ctx.fillStyle === "#123456" ? [r, g, b] : paint(ctx.fillStyle)

    const hex = `#${[base[0], base[1], base[2]]
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")}`.toUpperCase()
    return a === 255 ? hex : `${hex} ${Math.round((a / 255) * 100)}%`
  }
}

/**
 * A razão de contraste, calculada no cliente a partir da cor que o browser resolveu. Com par de texto mede o
 * texto contra o token; sem ele, o token contra o cartão. Os dois temas são medidos; quem escolhe o que
 * aparece é o CSS (`dark:hidden`), sem `useTheme`, para servidor e cliente não divergirem.
 */
function SwatchContrast({
  token,
  onToken,
  rule,
}: {
  token: string
  onToken?: string
  rule?: SwatchRule
}) {
  const [ratios, setRatios] = React.useState<{
    light: number
    dark: number
  } | null>(null)
  const probeRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const host = probeRef.current
    if (!host) return
    const flatten = createColorCompositor()

    const measure = (dark: boolean) => {
      const resolve = (css: string) => {
        const el = document.createElement("div")
        el.className = dark ? "dark" : "light"
        el.style.backgroundColor = css
        host.append(el)
        const value = getComputedStyle(el).backgroundColor
        el.remove()
        return value
      }
      // A pilha começa no fundo da página: medir a cor declarada de um token translúcido responde por uma cor que a tela nunca mostra.
      const under = [resolve("var(--background)"), resolve("var(--card)")]
      const surface = flatten([...under, resolve(`var(${token})`)])
      const card = flatten(under)
      if (!surface || !card) return null
      if (!onToken) return contrast(surface, card)
      const text = flatten([
        ...under,
        resolve(`var(${token})`),
        resolve(`var(${onToken})`),
      ])
      return text ? contrast(text, surface) : null
    }

    const light = measure(false)
    const dark = measure(true)
    if (light != null && dark != null) setRatios({ light, dark })
  }, [token, onToken])

  const min = rule ? RULE_MIN[rule] : null
  const paired = Boolean(onToken)

  return (
    <div className="flex shrink-0 items-center gap-1" ref={probeRef}>
      {ratios ? (
        <>
          <RatioPill
            value={ratios.light}
            theme="claro"
            rule={rule}
            pairedWithText={paired}
            className="dark:hidden"
          />
          <RatioPill
            value={ratios.dark}
            theme="escuro"
            rule={rule}
            pairedWithText={paired}
            className="hidden dark:inline-flex"
          />
          {rule && min != null && ratios.dark < min ? (
            <OtherThemeAlert
              theme="escuro"
              value={ratios.dark}
              rule={rule}
              pairedWithText={paired}
              className="dark:hidden"
            />
          ) : null}
          {rule && min != null && ratios.light < min ? (
            <OtherThemeAlert
              theme="claro"
              value={ratios.light}
              rule={rule}
              pairedWithText={paired}
              className="hidden dark:inline-flex"
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}

/** O tema que não está na tela reprovou — o único caso em que ele atravessa. */
function OtherThemeAlert({
  theme,
  value,
  rule,
  pairedWithText,
  className,
}: {
  theme: "claro" | "escuro"
  value: number
  rule: SwatchRule
  pairedWithText: boolean
  className?: string
}) {
  const what = pairedWithText
    ? "entre o texto e o fundo"
    : "entre a cor e o cartão"
  const frase = `No tema ${theme}, ${value.toFixed(2)}:1 ${what} — falha em ${RULE_NAME[rule]}`
  return (
    <span
      title={frase}
      className={cn(
        "nums inline-flex items-center gap-0.5 rounded-full bg-warning-muted px-1.5 py-0.5 text-2xs font-medium text-warning-muted-foreground",
        className
      )}
    >
      <span aria-hidden>!</span>
      {theme}
      <span className="sr-only">{frase}</span>
    </span>
  )
}

/**
 * O veredito não pode chegar só pela cor: o número traz um símbolo e um texto para leitor de tela.
 * Sem regra declarada, aparece em cinza (medir não é reprovar).
 */
function RatioPill({
  value,
  theme,
  rule,
  pairedWithText,
  className,
}: {
  value: number
  theme: "claro" | "escuro"
  rule?: SwatchRule
  pairedWithText: boolean
  className?: string
}) {
  const min = rule ? RULE_MIN[rule] : null
  const passes = min == null ? null : value >= min
  const verdict = passes == null ? "" : passes ? "passa" : "falha"
  const what = pairedWithText
    ? "entre o texto e o fundo"
    : "entre a cor e o cartão"
  const reading =
    rule && passes != null
      ? `${what} no tema ${theme} — ${verdict} em ${RULE_NAME[rule]}`
      : `${what} no tema ${theme}`

  return (
    <span
      title={`${value.toFixed(2)}:1 ${reading}`}
      className={cn(
        "nums inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-2xs font-medium",
        passes == null
          ? "bg-muted text-muted-foreground"
          : passes
            ? "bg-success-muted text-success-muted-foreground"
            : "bg-warning-muted text-warning-muted-foreground",
        className
      )}
    >
      {passes == null ? null : <span aria-hidden>{passes ? "✓" : "!"}</span>}
      {value.toFixed(1)}
      <span className="sr-only">{`:1 de contraste ${reading}`}</span>
    </span>
  )
}

/**
 * Achata uma pilha de camadas de cor numa cor sRGB, pintando num canvas de 1×1 (o `getComputedStyle` não
 * devolve `rgb()`). As camadas vão de baixo para cima e o `source-over` compõe o alpha de cada uma.
 */
function createColorCompositor() {
  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext("2d", { willReadFrequently: true })

  return (layers: string[]): [number, number, number] | null => {
    if (!ctx) return null
    ctx.clearRect(0, 0, 1, 1)
    for (const layer of layers) {
      ctx.fillStyle = layer
      ctx.fillRect(0, 0, 1, 1)
    }
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return [r, g, b]
  }
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const f = (u: number) => {
    const c = u / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

function contrast(
  fg: [number, number, number],
  bg: [number, number, number]
): number {
  const a = relativeLuminance(fg)
  const b = relativeLuminance(bg)
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}
