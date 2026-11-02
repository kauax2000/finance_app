"use client"

import * as React from "react"
import { LinkIcon } from "@heroicons/react/16/solid"
import { encode } from "uqr"

import { Button } from "@/components/ui/button"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTimeout } from "@/hooks/use-timeout"
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
 * Os módulos escuros viram **um `<path>` só** (`M{x} {y}h1v1h-1z` por módulo),
 * sem `<rect>` por célula. `crispEdges` evita a emenda de subpixel entre eles.
 */

/** A matriz como caminho SVG, ou `null` quando não há o que codificar. */
function qrCodeMatriz(value: string): { tamanho: number; caminho: string } | null {
  if (!value) return null
  try {
    // Correção média e sem borda: a margem de silêncio é da placa.
    const { data, size } = encode(value, { ecc: "M", border: 0 })
    let caminho = ""
    data.forEach((linha, y) =>
      linha.forEach((escuro, x) => {
        if (escuro) caminho += `M${x} ${y}h1v1h-1z`
      })
    )
    return { tamanho: size, caminho }
  } catch {
    // Além da capacidade do maior QR: sem código, e a tela decide o que mostrar.
    return null
  }
}

/**
 * O código de `value`, 128px. A placa cresce no cursor e no toque (`scale-110`);
 * o link que abre `value` só recebe o clique no toque (no cursor o `<a>` não
 * recebe clique, e `Tab` e Enter ainda o alcançam). `label` nomeia o link para o leitor de tela e é obrigatório.
 * `link={false}` desenha a mesma figura sem o `<a>` (`role="img"`), para a tela
 * cujo destino é ela mesma.
 */
function QrCode({
  value,
  label,
  link = true,
  className,
}: {
  value: string
  /** Para onde o código leva, lido pelo leitor de tela. */
  label: string
  /** `false` quando o link apontaria para a própria tela. */
  link?: boolean
  className?: string
}) {
  const matriz = React.useMemo(() => qrCodeMatriz(value), [value])
  if (!matriz) return <QrCodeSkeleton className={className} />

  const figura = (
    <svg
      viewBox={`0 0 ${matriz.tamanho} ${matriz.tamanho}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className="size-full"
    >
      <path fill="currentColor" d={matriz.caminho} />
    </svg>
  )

  return (
    <div
      data-slot="qr-code"
      className={cn(
        "size-32 shrink-0 rounded-row p-3.5 ring-1 ring-foreground/10",
        "bg-background text-foreground dark:bg-foreground dark:text-background",
        "transition-[scale] duration-(--duration-fast) ease-(--ease-out) hover:scale-110 active:scale-110",
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
 * Copia `value` e confirma pela dica do botão (`Tooltip confirmation`), ligada
 * pelo **resultado**: uma cópia recusada diz "Não deu para copiar" em vez de
 * confirmar. Sem `navigator.clipboard` (contexto inseguro) cai no mesmo aviso.
 */
function QrCodeCopy({ value, className }: { value: string; className?: string }) {
  const [estado, setEstado] = React.useState<"copiado" | "falhou" | null>(null)
  const later = useTimeout()

  const copiar = async () => {
    try {
      if (!navigator.clipboard) throw new Error("sem área de transferência")
      await navigator.clipboard.writeText(value)
      setEstado("copiado")
    } catch {
      setEstado("falhou")
    }
    later(() => setEstado(null), 2000)
  }

  return (
    <div data-slot="qr-code-copy" className={className}>
      <Tooltip
        confirmation={
          estado === "copiado" ? "Link copiado" : estado === "falhou" ? "Não deu para copiar" : null
        }
      >
        <TooltipTrigger asChild>
          <Button type="button" variant="secondary" disabled={!value} onClick={() => void copiar()}>
            <LinkIcon />
            Copiar link
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Copia o link para abrir no celular</TooltipContent>
      </Tooltip>
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
