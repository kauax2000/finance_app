import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { arquivosTsx, lerFonte } from "@/test/fonte"

import { Field, FieldChecklist, FieldControl, FieldCounter } from "./field"

/** As peças da rodada 192. */

describe("Field, rodada 192", () => {
  it("o contador só aparece perto do teto", () => {
    const longe = renderToStaticMarkup(h(FieldCounter, { value: "abc", max: 40 }))
    expect(longe).not.toContain('data-slot="field-counter"')
    const perto = renderToStaticMarkup(h(FieldCounter, { value: "x".repeat(25), max: 40 }))
    expect(perto).toContain("25/40")
    expect(perto).toContain("Restam 15 caracteres")
  })

  it("a lista diz o estado de cada regra ao leitor de tela", () => {
    const html = renderToStaticMarkup(
      h(FieldChecklist, {
        items: [
          { label: "número", met: true },
          { label: "símbolo", met: false },
        ],
      })
    )
    expect(html).toContain("— atendido")
    expect(html).toContain("— falta")
    expect(html).toContain('aria-live="polite"')
  })

  it("a lista é descrição do controle", () => {
    // O registro é por efeito, que não roda no servidor: o que se tranca aqui é
    // o `id` da lista, e a soma no `FieldControl` está no fonte.
    const html = renderToStaticMarkup(
      h(Field, null, h(FieldControl, null, h("input")), h(FieldChecklist, { items: [] }))
    )
    expect(html).toMatch(/data-slot="field-checklist" id="[^"]+-checklist"/)
    const fonte = lerFonte("src/components/ui/field.tsx")
    expect(fonte).toContain("field.hasChecklist ? field.checklistId : undefined")
  })

  it("nenhuma tela declara a própria lista de requisitos", () => {
    const culpados = arquivosTsx(join(process.cwd(), "src"))
      .filter((c) => !c.includes("components/ui/"))
      .filter((c) => /function ReqRow\b/.test(lerFonte(c)))
    expect(culpados).toEqual([])
  })

  it("o empilhado não estica controle de medida própria", () => {
    // Um `Switch` num `responsive` empilhado virava um trilho de 406px.
    const fonte = lerFonte("src/components/ui/field.tsx")
    expect(fonte).toContain("*:not-data-[slot=switch]:not-data-[slot=checkbox]:not-data-[slot=radio]:w-full")
    expect(fonte).not.toMatch(/"flex-col \*:w-full/)
  })
})
