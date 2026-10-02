import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  HistogramSlider,
  contagemNaFaixa,
  marcasDoEixo,
  valorDeSaida,
} from "./histogram-slider"

/** A rodada 216: as versões novas do `HistogramSlider`. */

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")
const CODIGO = fonte("src/components/ui/histogram-slider.tsx")
const BINS = [4, 6, 10, 5, 3, 2]
const base = { label: "Faixa", bins: BINS, min: 0, max: 600 }

describe("as versões do HistogramSlider", () => {
  it("a contagem soma só as colunas acesas — a regra de contenção", () => {
    expect(contagemNaFaixa(BINS, { min: 0, max: 600, de: 100, ate: 300 })).toEqual({ dentro: 16, total: 30 })
    // Meia coluna não acende, e não conta.
    expect(contagemNaFaixa(BINS, { min: 0, max: 600, de: 150, ate: 300 }).dentro).toBe(10)
  })

  it("o eixo divide a escala por igual", () => {
    expect(marcasDoEixo(0, 6400, 5)).toEqual([0, 1600, 3200, 4800, 6400])
    expect(marcasDoEixo(0, 10, 1)).toEqual([0])
  })

  it("com a cauda aberta, o punho no fim sai Infinity", () => {
    expect(valorDeSaida([100, 600], { max: 600, openEnd: true })).toEqual([100, Infinity])
    expect(valorDeSaida([100, 600], { max: 600, openEnd: false })).toEqual([100, 600])
    expect(valorDeSaida([100, 500], { max: 600, openEnd: true })).toEqual([100, 500])
  })

  it("o Slider é sempre controlado: atalho e campo movem o punho", () => {
    expect(CODIGO).toContain("value={[...atual]}")
    expect(CODIGO).not.toMatch(/defaultValue=\{value \? undefined/)
  })

  it("a contagem, o eixo e a referência aparecem; a cauda aberta escreve +", () => {
    const html = renderToStaticMarkup(
      h(HistogramSlider, {
        ...base,
        count: true,
        axis: true,
        openEnd: true,
        references: [{ value: 300, label: "média" }],
      })
    )
    expect(html).toContain("30 de 30")
    expect(html).toContain('data-slot="histogram-slider-axis"')
    expect(html).toMatch(/R\$\s600,00\+/)
    expect(html).toContain("média")
  })

  it("format troca o dinheiro, e size a altura", () => {
    const html = renderToStaticMarkup(
      h(HistogramSlider, { ...base, format: (v: number) => `${v} dias`, size: "lg" })
    )
    expect(html).toContain("600 dias")
    expect(html).not.toContain("R$")
    expect(html).toContain("[--histogram-h:--spacing(24)]")
  })

  it("carregando: esqueleto no lugar das colunas, e o controle trava", () => {
    const html = renderToStaticMarkup(h(HistogramSlider, { ...base, pending: true, count: true }))
    expect(html).toContain('data-slot="histogram-slider-skeleton"')
    expect(html).not.toContain('data-slot="histogram-slider-bar"')
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain("Contando…")
  })

  it("editável: a leitura vira campos de dinheiro com o termo como nome", () => {
    const html = renderToStaticMarkup(h(HistogramSlider, { ...base, editable: true }))
    expect(html).toContain('aria-label="Mínimo"')
    expect(html).toContain('aria-label="Máximo"')
    // Os dois campos, além dos `<input>` escondidos que o Radix põe por punho.
    expect(html.match(/<input[^>]*data-slot="input"/g)?.length).toBe(2)
  })

  it("os atalhos são fichas, e o aviso de soltar sai do Slider", () => {
    const html = renderToStaticMarkup(
      h(HistogramSlider, { ...base, presets: [{ label: "Até R$ 100", value: [0, 100] }] })
    )
    expect(html).toContain("Até R$ 100")
    expect(CODIGO).toContain("onValueCommit={(v) =>")
  })

  it("a página não registra mais a lacuna que fechou", () => {
    const doc = fonte("src/app/designsystem/docs/histogram-slider.tsx")
    expect(doc).not.toContain("Lacuna conhecida: o leitor de tela anuncia o número cru")
    expect(doc).not.toContain("O rótulo de cada caixa")
  })
})
