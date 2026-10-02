import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { Stepper, StepperContent, StepperItem } from "./stepper"

/** A rodada 224: o redesenho do `Stepper` e o fluxo controlado. */

const CODIGO = readFileSync(join(process.cwd(), "src/components/ui/stepper.tsx"), "utf8")

const fila = (props: Record<string, unknown>, ...itens: unknown[]) =>
  renderToStaticMarkup(h(Stepper, props, ...(itens as never[])))

describe("as versões do Stepper", () => {
  it("com value, cada item deriva o próprio estado do índice", () => {
    const html = fila(
      { value: 1, onValueChange: () => {} },
      h(StepperItem, { key: "a" }, "Conta"),
      h(StepperItem, { key: "b" }, "Carteiras"),
      h(StepperItem, { key: "c" }, "Pronto")
    )
    expect(html.match(/data-slot="stepper-item" data-state="(\w+)"/g)).toEqual([
      'data-slot="stepper-item" data-state="complete"',
      'data-slot="stepper-item" data-state="current"',
      'data-slot="stepper-item" data-state="upcoming"',
    ])
    // A concluída volta ao clique; a atual e a futura (linear) não.
    expect(html.match(/<button[^>]*data-slot="stepper-trigger"[^>]*>/g)?.map((b) => b.includes('disabled=""'))).toEqual([
      false,
      true,
      true,
    ])
    // A troca é anunciada.
    expect(html).toContain('aria-live="polite"')
    expect(html).toContain("Passo 2 de 3, Carteiras")
  })

  it("state vence o que a lista deriva — é como uma etapa fica error", () => {
    const html = fila({ value: 2 }, h(StepperItem, { key: "a", state: "error" }, "Pagamento"), h(StepperItem, { key: "b" }, "Fim"))
    expect(html).toContain('data-state="error"')
    expect(html).toContain("com erro")
  })

  it("a trilha enche na mola, o tique estala e a atual tem anel", () => {
    expect(CODIGO).toContain("transition-[scale] duration-(--duration-spring) ease-(--ease-spring)")
    expect(CODIGO).toContain('concluida ? "[scale:1_1]" : direcao === "x" ? "[scale:0_1]" : "[scale:1_0]"')
    expect(CODIGO).toContain("animate-in zoom-in-50 animation-duration-(--duration-spring)")
    expect(CODIGO).toContain("ring-4 ring-primary-accent/15")
  })

  it("no modo interativo todo item é botão: a estrutura não troca ao concluir", () => {
    expect(CODIGO).toContain("disabled={!clicavel}")
    expect(CODIGO).toMatch(/"flex min-w-0 flex-col text-left"/)
  })

  it("descrição, ícone e opcional", () => {
    const html = fila(
      {},
      h(StepperItem, { key: "a", description: "Nome e e-mail", optional: true, icon: h("svg", { "data-icone": "" }) }, "Conta")
    )
    expect(html).toContain("Nome e e-mail")
    expect(html).toContain("Opcional")
    expect(html).toContain("data-icone")
  })

  it("a barra e a contagem compacta dizem o passo e o nome", () => {
    const barra = fila({ value: 1, variant: "bar" }, h(StepperItem, { key: "a" }, "Conta"), h(StepperItem, { key: "b" }, "Categorias"))
    expect(barra).toContain("Passo 2 de 2 · Categorias")
    const responsiva = fila({ value: 0, orientation: "responsive" }, h(StepperItem, { key: "a" }, "Conta"), h(StepperItem, { key: "b" }, "Fim"))
    expect(responsiva).toContain('data-slot="stepper-compact"')
    expect(responsiva).toContain("max-sm:hidden")
  })

  it("o painel só monta na etapa atual, e o Continuar espera a Promise", () => {
    const html = fila(
      { value: 1 },
      h(StepperItem, { key: "a" }, "A"),
      h(StepperItem, { key: "b" }, "B"),
      h(StepperContent, { key: "p0", value: 0 }, "painel zero"),
      h(StepperContent, { key: "p1", value: 1 }, "painel um")
    )
    expect(html).not.toContain("painel zero")
    expect(html).toContain("painel um")
    expect(CODIGO).toMatch(/setEsperando\(true\)\s*void \(r as Promise<boolean \| void>\)\s*\.then\(avancar\)\s*\.finally/)
    expect(CODIGO).toContain('(ultimo ? "concluir" : "continuar")')
  })

  it("as setas andam entre as etapas que clicam", () => {
    expect(CODIGO).toContain('"[data-slot=stepper-trigger]:not(:disabled)"')
    expect(CODIGO).toMatch(/e\.key === "Home" \? 0 : e\.key === "End"/)
  })
})
