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
  /** "masonry" empacota specs pequenos; "grid" dá ar aos grandes. */
  layout?: "masonry" | "grid"
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {layout === "grid" ? (
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
 * A amostra de um token de cor, nos dois temas ao mesmo tempo.
 *
 * Este é o motivo de a página de Cores existir: um par foreground/background que
 * passa no claro pode falhar no escuro, e ninguém descobre isso trocando de tema
 * e voltando. Aqui os dois ficam lado a lado, com a razão de contraste medida
 * pelo browser em cima da cor computada — não um valor escrito à mão que
 * envelhece na primeira vez que alguém mexe no token.
 */
export function TokenSwatch({
  name,
  token,
  /** Token do texto que se apoia sobre este, quando existe um par. */
  onToken,
}: {
  name: string
  token: string
  onToken?: string
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex shrink-0 overflow-hidden rounded-lg ring-1 ring-border ring-inset">
        <ThemeChip token={token} onToken={onToken} theme="light" />
        <ThemeChip token={token} onToken={onToken} theme="dark" />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium text-foreground">
          {name}
        </span>
        <code className="font-mono text-2xs text-muted-foreground">
          {token}
        </code>
      </div>
      {onToken ? <ContrastReadout token={token} onToken={onToken} /> : null}
    </div>
  )
}

/**
 * Metade clara ou escura da amostra. `.dark` é aplicado no próprio elemento, e
 * não no `html`, então os dois temas coexistem na mesma página.
 */
function ThemeChip({
  token,
  onToken,
  theme,
}: {
  token: string
  onToken?: string
  theme: "light" | "dark"
}) {
  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center",
        // As duas metades declaram o tema explicitamente. Sem o `.light`, a
        // metade clara herda os tokens do escuro quando a página está no
        // escuro, e as duas amostras ficam idênticas.
        theme === "dark" ? "dark" : "light"
      )}
      style={{ backgroundColor: `var(${token})` }}
      title={theme === "dark" ? "Tema escuro" : "Tema claro"}
    >
      {onToken ? (
        <span
          className="text-2xs font-semibold"
          style={{ color: `var(${onToken})` }}
        >
          Aa
        </span>
      ) : null}
    </div>
  )
}

/**
 * A razão de contraste, calculada no cliente a partir da cor que o browser
 * realmente resolveu. Vale para `oklch`, para `color-mix` e para qualquer coisa
 * que venha a substituir os dois.
 */
function ContrastReadout({
  token,
  onToken,
}: {
  token: string
  onToken: string
}) {
  const [ratios, setRatios] = React.useState<{
    light: number
    dark: number
  } | null>(null)
  const probeRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const host = probeRef.current
    if (!host) return
    const resolve = createColorResolver()
    const measure = (dark: boolean) => {
      const el = document.createElement("div")
      el.className = dark ? "dark" : "light"
      el.style.color = `var(${onToken})`
      el.style.backgroundColor = `var(${token})`
      host.append(el)
      const style = getComputedStyle(el)
      const fg = resolve(style.color)
      const bg = resolve(style.backgroundColor)
      el.remove()
      return fg && bg ? contrast(fg, bg) : null
    }
    const light = measure(false)
    const dark = measure(true)
    if (light != null && dark != null) setRatios({ light, dark })
  }, [token, onToken])

  return (
    <div className="ml-auto flex shrink-0 items-center gap-1.5" ref={probeRef}>
      {ratios ? (
        <>
          <RatioPill value={ratios.light} label="claro" />
          <RatioPill value={ratios.dark} label="escuro" />
        </>
      ) : null}
    </div>
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
 */
function RatioPill({ value, label }: { value: number; label: string }) {
  const passes = value >= 4.5
  return (
    <span
      title={`${label}: ${value.toFixed(2)}:1 ${passes ? "passa" : "falha"} em AA para texto`}
      className={cn(
        "nums inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-2xs font-medium",
        passes
          ? "bg-success-muted text-success-muted-foreground"
          : "bg-warning-muted text-warning-muted-foreground"
      )}
    >
      <span aria-hidden>{passes ? "✓" : "!"}</span>
      {value.toFixed(1)}
      <span className="sr-only">
        {`:1 de contraste no tema ${label}, ${passes ? "passa" : "falha"} em AA para texto`}
      </span>
    </span>
  )
}

/**
 * Converte a cor computada para bytes sRGB, usando o próprio browser.
 *
 * `getComputedStyle` não devolve `rgb()`: um token em `oklch` computa como
 * `oklch(...)` e um `color-mix` computa como `color(srgb ...)`. Ler os números
 * dessas strings como se fossem RGB dá lixo — foi o que fez toda razão de
 * contraste marcar 1,0 na primeira versão desta página.
 *
 * Pintar num canvas de 1×1 e ler o pixel de volta delega a conversão para quem
 * já sabe fazê-la, e continua funcionando quando aparecer o próximo espaço de
 * cor que ainda não existe.
 */
function createColorResolver() {
  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext("2d", { willReadFrequently: true })

  return (color: string): [number, number, number] | null => {
    if (!ctx) return null
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
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
