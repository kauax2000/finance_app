import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import { qrCodeMatriz } from "./qr-code"

const FONTE = "src/components/ui/qr-code.tsx"

describe("QrCode", () => {
  it("qrCodeMatriz desenha só os módulos escuros", () => {
    const m = qrCodeMatriz("https://app.exemplo.com/settings#no-celular")!
    expect(m.tamanho).toBeGreaterThanOrEqual(21)
    expect(m.caminho).toMatch(/^M\d+ \d+h1v1h-1z/)
  })

  it("sem valor ou além da capacidade, não lança e devolve null", () => {
    expect(qrCodeMatriz("")).toBeNull()
    expect(qrCodeMatriz("x".repeat(8000))).toBeNull()
  })

  it("a placa é clara nos dois temas, sem cor crua", () => {
    const f = semComentarios(lerFonte(FONTE))
    expect(f).toContain("bg-background text-foreground dark:bg-foreground dark:text-background")
    expect(f).not.toMatch(/bg-white|text-black|#[0-9a-f]{3,6}\b/i)
  })

  it("label é obrigatório e vira o nome do link", () => {
    const f = semComentarios(lerFonte(FONTE))
    expect(f).toMatch(/label: string/)
    expect(f).toContain("aria-label={label}")
  })

  it("o link só recebe o clique no toque, e o crescimento tem o par de toque", () => {
    const f = semComentarios(lerFonte(FONTE))
    expect(f).toContain("pointer-events-none pointer-coarse:pointer-events-auto")
    expect(f).toContain("hover:scale-110 active:scale-110")
  })

  it("copiar confirma pelo Tooltip e trata a recusa", () => {
    const f = semComentarios(lerFonte(FONTE))
    expect(f).toContain('"Link copiado"')
    expect(f).toContain('"Não deu para copiar"')
    expect(f).toMatch(/catch\s*\{\s*setEstado\("falhou"\)/)
  })

  it("a dica do Copiar link abre à direita, no lado vazio da linha", () => {
    expect(semComentarios(lerFonte(FONTE))).toContain('<TooltipContent side="right">')
  })

  it("o anel de foco do link segue a tinta da placa, não o --ring", () => {
    const f = semComentarios(lerFonte(FONTE))
    expect(f).toContain("focus-visible:ring-current/45")
    expect(f).not.toContain("focus-visible:ring-ring")
  })

  it("link={false} desenha a figura como role=img, sem o <a>", () => {
    const f = semComentarios(lerFonte(FONTE))
    expect(f).toMatch(/link = true/)
    expect(f).toMatch(/<div role="img" aria-label=\{label\} data-slot="qr-code-link"/)
  })

  it("a margem da placa é p-3.5 (14px)", () => {
    const f = semComentarios(lerFonte(FONTE))
    expect(f).toContain("rounded-row p-3.5")
  })
})
