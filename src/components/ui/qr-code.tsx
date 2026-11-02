"use client"

import * as React from "react"
import { CheckIcon, ExclamationCircleIcon, LinkIcon } from "@heroicons/react/16/solid"
import { animate, useReducedMotion } from "motion/react"
import { encode } from "uqr"

import { Button } from "@/components/ui/button"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { useTimeout } from "@/hooks/use-timeout"
import { MOLA } from "@/lib/spring"
import { TrocaSuave } from "@/lib/troca-suave"
import { cn } from "@/lib/utils"

/**
 * O código que a câmera lê, desenhado em SVG com tokens.
 *
 * A placa é **clara nos dois temas** (`bg-background` no claro, `bg-foreground`
 * no escuro, com a tinta do módulo no par oposto): decisão do dono, e a
 * polaridade do padrão do código (módulo escuro sobre fundo claro). O
 * `BarcodeDetector` do Chromium decodificou o caminho do código desenhado num
 * canvas; a câmera de telefone não foi medida. O `p-3.5` deixa 14px de margem
 * e 100px de área: 3,03px por módulo no link de 33 módulos da demo, 4,6
 * módulos de margem (4,06 com 29). Não reduza.
 *
 * Os módulos escuros viram **um `<path>` por diagonal** (`M{x} {y}h1v1h-1z` por
 * módulo), sem `<rect>` por célula: a onda anima dezenas de nós, e não centenas.
 * A diagonal 0 é o canto de baixo à esquerda, de onde a onda parte.
 * `crispEdges` evita a emenda de subpixel entre os módulos.
 */

/** A onda: cada diagonal esmaece e volta, 13ms depois da anterior. */
const ONDA_PASSO_MS = 13
const ONDA_DURACAO_MS = 300
const ONDA_QUADROS = [{ opacity: 1 }, { opacity: 0.12, offset: 0.4 }, { opacity: 1 }]

/** A matriz em caminhos SVG, um por diagonal, ou `null` quando não há o que codificar. */
function qrCodeMatriz(value: string): { tamanho: number; diagonais: string[] } | null {
  if (!value) return null
  try {
    // Correção média e sem borda: a margem de silêncio é da placa.
    const { data, size } = encode(value, { ecc: "M", border: 0 })
    const diagonais = Array.from({ length: 2 * size - 1 }, () => "")
    data.forEach((linha, y) =>
      linha.forEach((escuro, x) => {
        if (escuro) diagonais[x + size - 1 - y] += `M${x} ${y}h1v1h-1z`
      })
    )
    return { tamanho: size, diagonais }
  } catch {
    // Além da capacidade do maior QR: sem código, e a tela decide o que mostrar.
    return null
  }
}

/**
 * O código de `value`, 128px. O link que abre `value` só recebe o clique no toque (no cursor o `<a>` não
 * recebe clique, e `Tab` e Enter ainda o alcançam). `label` nomeia o link para o leitor de tela e é obrigatório.
 * `link={false}` desenha a mesma figura sem o `<a>` (`role="img"`), para a tela
 * cujo destino é ela mesma. Cada valor novo de `wave` toca a onda, que parte do
 * canto de baixo à esquerda; `0` não toca.
 */
function QrCode({
  value,
  label,
  link = true,
  wave = 0,
  className,
}: {
  value: string
  /** Para onde o código leva, lido pelo leitor de tela. */
  label: string
  /** `false` quando o link apontaria para a própria tela. */
  link?: boolean
  /** Contador: quem soma 1 toca a onda. */
  wave?: number
  className?: string
}) {
  const matriz = React.useMemo(() => qrCodeMatriz(value), [value])
  const desenho = React.useRef<SVGSVGElement>(null)
  const reduzido = useReducedMotion()

  React.useEffect(() => {
    if (!wave || reduzido) return
    desenho.current?.querySelectorAll("path").forEach((diagonal, i) => {
      diagonal.animate(ONDA_QUADROS, {
        duration: ONDA_DURACAO_MS,
        delay: i * ONDA_PASSO_MS,
        easing: "ease-in-out",
      })
    })
  }, [wave, reduzido])

  if (!matriz) return <QrCodeSkeleton className={className} />

  const figura = (
    <svg
      ref={desenho}
      viewBox={`0 0 ${matriz.tamanho} ${matriz.tamanho}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className="size-full"
    >
      {matriz.diagonais.map((caminho, i) => (
        <path key={i} fill="currentColor" d={caminho} />
      ))}
    </svg>
  )

  return (
    <div
      data-slot="qr-code"
      className={cn(
        "size-32 shrink-0 rounded-row p-3.5 ring-1 ring-foreground/10",
        "bg-background text-foreground dark:bg-foreground dark:text-background",
        className
      )}
    >
      {link ? (
        <a
          href={value}
          aria-label={label}
          data-slot="qr-code-link"
          className="block size-full rounded-md pointer-events-none pointer-coarse:pointer-events-auto focus-visible:ring-3 focus-visible:ring-current/45 focus-visible:outline-none"
        >
          {figura}
        </a>
      ) : (
        <div role="img" aria-label={label} data-slot="qr-code-link" className="size-full">
          {figura}
        </div>
      )}
    </div>
  )
}

/**
 * Copia `value` e confirma **no próprio botão**: o ícone vira tique, o rótulo
 * troca e a largura anda na mola. `onCopied` só corre com a cópia feita, e é por
 * onde a tela toca a onda do `QrCode`. Uma cópia recusada, ou sem
 * `navigator.clipboard` (contexto inseguro), não confirma: o botão diz "Não deu
 * para copiar".
 */
function QrCodeCopy({
  value,
  onCopied,
  className,
}: {
  value: string
  /** Depois da cópia feita, e só dela. */
  onCopied?: () => void
  className?: string
}) {
  const [estado, setEstado] = React.useState<"copiado" | "falhou" | null>(null)
  const later = useTimeout()
  const reduzido = useReducedMotion()
  const botao = React.useRef<HTMLButtonElement>(null)
  const largura = React.useRef(0)
  const rotulo = estado === "copiado" ? "Copiado" : estado === "falhou" ? "Não deu para copiar" : "Copiar link"

  // O `popLayout` já tirou o rótulo velho do fluxo: a medida aqui é a do novo.
  React.useLayoutEffect(() => {
    const el = botao.current
    if (!el) return
    const antes = largura.current
    const depois = el.offsetWidth
    largura.current = depois
    if (!antes || antes === depois || reduzido) return
    const mola = animate(el, { width: [antes, depois] }, MOLA)
    void mola.then(() => {
      el.style.width = ""
    })
    return () => mola.stop()
  }, [estado, reduzido])

  const copiar = async () => {
    if (estado) return
    try {
      if (!navigator.clipboard) throw new Error("sem área de transferência")
      await navigator.clipboard.writeText(value)
      setEstado("copiado")
      onCopied?.()
    } catch {
      setEstado("falhou")
    }
    later(() => setEstado(null), 2000)
  }

  return (
    <div data-slot="qr-code-copy" className={className}>
      <Button
        ref={botao}
        type="button"
        variant="secondary"
        disabled={!value}
        onClick={() => void copiar()}
        className="relative overflow-hidden"
      >
        <span className="relative size-4">
          <TrocaSuave chave={estado ?? "copiar"} className="absolute inset-0 flex items-center justify-center">
            {estado === "copiado" ? (
              <CheckIcon className="text-success" />
            ) : estado === "falhou" ? (
              <ExclamationCircleIcon className="text-destructive" />
            ) : (
              <LinkIcon />
            )}
          </TrocaSuave>
        </span>
        <TrocaSuave chave={estado ?? "copiar"} className="inline-block">
          {rotulo}
        </TrocaSuave>
      </Button>
      <span role="status" className="sr-only">
        {estado === "copiado" ? "Link copiado" : estado === "falhou" ? rotulo : ""}
      </span>
    </div>
  )
}

/**
 * O osso do código, na caixa de 128 da peça real. `group={false}` é para quem
 * já está dentro de um `SkeletonGroup`.
 */
function QrCodeSkeleton({ group = true, className }: { group?: boolean; className?: string }) {
  const osso = <Skeleton className={cn("size-32 rounded-row", className)} />
  return (
    <div data-slot="qr-code-skeleton" className="contents">
      {group ? <SkeletonGroup label="Preparando o código">{osso}</SkeletonGroup> : osso}
    </div>
  )
}

export { QrCode, QrCodeCopy, QrCodeSkeleton, qrCodeMatriz }
