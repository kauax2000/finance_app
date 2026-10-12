import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggleAll,
  AccordionTrigger,
} from "./accordion"

/** As versões da rodada 200. */

const FONTE = lerFonte("src/components/ui/accordion.tsx")

const item = (value: string, trigger: Record<string, unknown>, content: Record<string, unknown> = {}) =>
  h(
    AccordionItem,
    { key: value, value },
    h(AccordionTrigger, trigger as never),
    h(AccordionContent, { children: "Resposta.", ...content } as never)
  )

const render = (props: Record<string, unknown>, ...filhos: ReturnType<typeof h>[]) =>
  renderToStaticMarkup(h(Accordion, props as never, ...filhos))

describe("Accordion, rodada 200", () => {
  it("o gatilho leva ícone e descrição, e só o rótulo sublinha", () => {
    const html = render(
      { type: "single", collapsible: true },
      item("a", { icon: h("svg"), description: "4 transações", children: "Mercado" })
    )
    expect(html).toMatch(/data-slot="accordion-trigger-icon" aria-hidden="true"/)
    expect(html).toMatch(/data-slot="accordion-trigger-content" class="flex min-w-0 flex-1 flex-col"/)
    expect(html).toMatch(/data-slot="accordion-trigger-description" class="[^"]*font-normal/)
    expect(html).not.toMatch(/data-slot="accordion-trigger-description" class="[^"]*underline/)
  })

  it("o conteúdo alinha com o rótulo, somando a seta e o ícone", () => {
    expect(FONTE).toContain(
      "ps-[calc(var(--accordion-px)+var(--accordion-marker-ps,0px)+var(--accordion-icon-ps,0px))]"
    )
    const html = render(
      { type: "single", markerSide: "start" },
      item("a", { icon: h("svg"), children: "Mercado" })
    )
    expect(html).toContain("[--accordion-marker-ps:--spacing(7)]")
    expect(html).toContain("has-[[data-slot=accordion-trigger-icon]]:[--accordion-icon-ps:--spacing(7)]")
  })

  it("o abrir todos só existe no multiple, e lê o estado", () => {
    const unico = render({ type: "single" }, h(AccordionToggleAll, { key: "t" }), item("a", { children: "A" }))
    expect(unico).not.toContain('data-slot="accordion-toggle-all"')
    const varios = render(
      { type: "multiple", defaultValue: [] },
      h(AccordionToggleAll, { key: "t" }),
      item("a", { children: "A" })
    )
    expect(varios).toContain('data-slot="accordion-toggle-all"')
    expect(varios).toContain("Abrir todos")
    expect(varios).toContain('aria-expanded="false"')
  })

  it("o encontrável fica montado, e a mecânica é a do hook", () => {
    const html = render({ type: "single", collapsible: true }, item("a", { children: "A" }, { findable: true }))
    // Fechado e montado: a resposta está no HTML para o ⌘F achar.
    expect(html).toContain("Resposta.")
    expect(FONTE).toContain("useUntilFound(")
    expect(FONTE).toContain("forceMount={findable ? true : forceMount}")
    // Quem abre tira o atributo antes de o Radix medir.
    expect(FONTE).toMatch(/revelar\(raiz\.current, proximo\.filter/)
  })

  it("o estado mora na raiz, com defaultValue como semente", () => {
    const html = render(
      { type: "multiple", defaultValue: ["b"] },
      item("a", { children: "A" }),
      item("b", { children: "B" })
    )
    expect(html).toMatch(/data-value="b"[^>]*data-state="open"|data-state="open"[^>]*data-value="b"/)
    expect(html).toMatch(/data-value="a"[^>]*data-state="closed"|data-state="closed"[^>]*data-value="a"/)
  })
})
