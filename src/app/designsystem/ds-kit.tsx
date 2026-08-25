"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Code } from "@/components/ui/code"

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
  /**
   * "masonry" empacota specs pequenos; "grid" dá ar aos grandes; "flow" não
   * fatia nada — para um grupo cujo conteúdo já governa a própria largura.
   */
  layout?: "masonry" | "grid" | "flow"
  children: React.ReactNode
}) {
  return (
    // O mesmo cabeçalho de seção das páginas de componente: fio em cima, título
    // em `font-heading` e a legenda grudada nele. As sete páginas de Fundações
    // usam este grupo em vez de `DocSection`, e sem isso eram as únicas do
    // catálogo em que as seções não tinham começo visível.
    <section id={id} className="scroll-mt-24 border-t border-border pt-8">
      <div className="mb-4 flex flex-col">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {layout === "flow" ? (
        <div className="flex flex-col gap-6">{children}</div>
      ) : layout === "grid" ? (
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {children}
        </div>
      ) : (
        <div className="columns-[19rem] gap-4 [column-fill:_balance]">
          {children}
        </div>
      )}
    </section>
  )
}

/** Um cartão de especificação dentro do grupo. */
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
    <div
      className={cn(
        "mb-4 break-inside-avoid overflow-hidden rounded-xl bg-card ring-1 ring-border",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {meta ? <Code className="shrink-0">{meta}</Code> : null}
      </div>
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </div>
  )
}

/** Uma linha rotulada de exemplos. */
export function Row({
  label,
  className,
  children,
}: {
  label?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <span className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
      ) : null}
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        {children}
      </div>
    </div>
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
 * O painel de um espécime.
 *
 * Ele já mostrou os dois temas lado a lado, e a troca é deliberada: a página
 * agora segue o tema escolhido no alternador do cabeçalho, e mostra só metade
 * da informação de uma vez. O que se perdeu — comparar claro e escuro sem
 * trocar de tema — voltou onde ele realmente pesa: a medição de contraste
 * continua sendo feita nos **dois** temas, e o outro tema só se anuncia quando
 * reprova. Ver que passou nunca foi a parte útil.
 *
 * Sem `.light` ou `.dark` forçados aqui dentro, os `var(--token)` dos espécimes
 * resolvem sozinhos para o tema que está valendo.
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
        "flex min-w-0 flex-col gap-3 overflow-hidden rounded-xl p-4 ring-1 ring-border ring-inset",
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
 * As superfícies como elas são: uma dentro da outra.
 *
 * A hierarquia background → card → popover estava escrita na legenda do grupo e
 * desenhada em lugar nenhum: seis linhas de amostra, todas do mesmo tamanho e
 * lado a lado, não dizem que uma se apoia na outra. Aqui o aninhamento é o
 * desenho, e cada camada carrega o próprio texto na cor que lhe corresponde —
 * então a superfície e o texto que ela sustenta aparecem juntos, que é como a
 * tela os usa.
 *
 * Cada camada leva um fio próprio. Sem ele, duas camadas de mesmo valor —
 * `--card` e `--popover` são a mesma cor nos dois temas — apareciam como uma
 * caixa só, e o desenho parecia quebrado justamente onde ele tinha algo a
 * dizer. Com o fio, a igualdade é visível como igualdade, e a `note` de cada
 * camada conta o que de fato as separa na tela.
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
            className="rounded-lg px-2.5 py-1.5 font-mono text-xs"
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
      className="flex flex-col gap-2.5 rounded-xl p-4 ring-1 ring-border ring-inset"
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

/**
 * Uma rampa categórica, encostada.
 *
 * O teste de uma rampa é se as faixas se distinguem **umas das outras**, e cinco
 * amostras em cinco linhas separadas não respondem isso: o olho compara o que
 * está junto. O vão de 4px entre elas deixa o cartão aparecer, então a mesma
 * imagem também mostra cada cor contra a superfície em que ela é desenhada —
 * que é a outra pergunta, a dos 3:1.
 */
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
            className="h-20 flex-1 rounded-lg"
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
 * A identidade na forma em que ela existe: discos com iniciais.
 *
 * Estes tokens não são cor de gráfico nem de estado — são o fundo de um avatar
 * com as iniciais de alguém em cima. Mostrados como faixa, a única pergunta que
 * dava para fazer era "são seis matizes diferentes?"; mostrados como disco, dá
 * para ver a pergunta que importa, que é se as iniciais se leem.
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
 * O contrato de um token de cor — a pergunta que a tela faz dele.
 *
 * Um token não é bom ou ruim em abstrato. `--primary` sustenta texto branco,
 * então a pergunta é AA para texto (4,5:1). `--border` é o contorno de um
 * controle, então a pergunta é a da WCAG 1.4.11: 3:1 contra a superfície. E
 * `--skeleton` não responde a nenhuma das duas — um osso de carregamento com
 * 3:1 seria berrante, e carimbar "falha" nele faria a página mentir para o
 * outro lado.
 *
 * Por isso a regra é declarada e não adivinhada: sem regra, a amostra mede e
 * mostra o número, e não dá veredito nenhum.
 */
export type SwatchRule = "text" | "ui"

const RULE_MIN: Record<SwatchRule, number> = { text: 4.5, ui: 3 }

const RULE_NAME: Record<SwatchRule, string> = {
  text: "AA para texto (4,5:1)",
  ui: "WCAG 1.4.11 para peça de interface (3:1)",
}

/**
 * A amostra de um token: um campo de cor.
 *
 * Antes era uma linha de tabela — dois quadrados de 40px, o nome, o token e
 * duas pílulas —, e numa página chamada Cores a cor ocupava um oitavo da
 * largura enquanto o resto era metadado. Aqui ela é a superfície: o ladrilho
 * tem a altura de um cartão e o texto de exemplo é grande o bastante para se
 * julgar de fato.
 *
 * O ladrilho era cortado ao meio entre os dois temas. Agora é inteiro, e mostra
 * o tema que está valendo — o corte gastava metade do campo de cor para exibir
 * o que ninguém está olhando naquele momento. `var(--token)` resolve sozinho
 * conforme o `.dark` da página.
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
        // O cartão por baixo é o que faz um token translúcido — `--border` é
        // branco a 10%, `--overlay` é 60% de preto — aparecer composto, que é
        // como a tela o mostra, e não como a cor declarada.
        className="relative flex h-24 items-center justify-center overflow-hidden rounded-xl bg-card ring-1 ring-border ring-inset"
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
          <code className="font-mono text-2xs break-all text-muted-foreground">
            {token}
          </code>
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
 * A razão de contraste, calculada no cliente a partir da cor que o browser
 * realmente resolveu. Vale para `oklch`, para `color-mix` e para qualquer coisa
 * que venha a substituir os dois.
 *
 * O que se mede depende do contrato: com par de texto, o texto contra o token;
 * sem ele, o token contra o cartão em que ele é desenhado.
 *
 * Os **dois** temas continuam sendo medidos, mesmo com a página mostrando um só.
 * Na tela aparece o número do tema que está valendo; o outro só se anuncia
 * quando reprova — e aí ele é exatamente a informação que ninguém descobriria
 * sem trocar de tema e refazer a comparação de memória.
 *
 * Quem escolhe o que aparece é o CSS, e não um `useTheme`: a variante `dark` do
 * projeto é `&:is(.dark *)`, então basta um par `dark:hidden` / `hidden
 * dark:inline-flex`. Sem estado, sem re-render, e sem risco de o servidor
 * renderizar um tema e o cliente outro.
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
      // A pilha começa no fundo da página, e não no token: `--border` vale
      // `oklch(1 0 0 / 10%)` e `--overlay` vale 60% de preto. Medir a cor
      // declarada de um token translúcido responde por uma cor que a tela
      // nunca mostra.
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

/**
 * O tema que não está na tela reprovou.
 *
 * É o único caso em que mostrar um tema de cada vez custaria alguma coisa, e por
 * isso é o único que atravessa. Quando o outro tema passa, nada aparece: ver que
 * passou nunca ajudou ninguém a decidir coisa nenhuma.
 */
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
 * O veredito não pode chegar só pela cor.
 *
 * Antes, verde significava passa e âmbar significava falha, com a palavra
 * escondida num `title` — que leitor de tela nem sempre anuncia e que o toque
 * nunca revela. Numa página que argumenta contra depender de cor, era o pior
 * lugar possível para depender de cor. Agora o número traz um símbolo e um
 * texto só para leitor de tela.
 *
 * Sem regra declarada não há símbolo nem cor de estado: o número aparece em
 * cinza, porque medir não é o mesmo que reprovar.
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
 * Achata uma pilha de camadas de cor numa cor sRGB, usando o próprio browser.
 *
 * `getComputedStyle` não devolve `rgb()`: um token em `oklch` computa como
 * `oklch(...)` e um `color-mix` computa como `color(srgb ...)`. Ler os números
 * dessas strings como se fossem RGB dá lixo — foi o que fez toda razão de
 * contraste marcar 1,0 na primeira versão desta página.
 *
 * Pintar num canvas de 1×1 e ler o pixel de volta delega a conversão para quem
 * já sabe fazê-la, e continua funcionando quando aparecer o próximo espaço de
 * cor que ainda não existe.
 *
 * As camadas vêm de baixo para cima e o `source-over` do canvas compõe o alpha
 * de cada uma. Antes se lia uma cor só, com o canvas limpo por baixo, e o
 * `getImageData` devolvia os bytes **sem** o alpha aplicado: `--border`, que é
 * branco a 10%, respondia como branco puro.
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
