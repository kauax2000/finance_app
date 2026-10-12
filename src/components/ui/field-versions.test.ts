import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { arquivosTsx, lerFonte, semComentarios } from "@/test/fonte"

import {
  Field,
  FieldChecklist,
  FieldControl,
  FieldCounter,
  fieldTextScale,
  fieldVariants,
} from "./field"
import { esperarDistintos } from "@/test/regras"

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

/**
 * A escada do `Field`, trancada — e os cinco seletores mortos, trancados fora.
 *
 * O eixo `size` nasceu de uma contagem: **29 `<Label className="text-xs">`** no
 * app (os formulários novos reduzem o rótulo, os antigos não) e **73 textos de
 * ajuda em `text-xs`/`text-2xs`** enquanto `FieldDescription` era `text-sm`.
 * Um degrau existindo sem nome.
 *
 * A asserção que de fato vale é a de número 2, herdada do teste do `Item`:
 * **nenhum par de degraus produz a mesma string**. Foi assim que se descobriu
 * que `Item` tinha `default` e `sm` idênticos.
 */
const FONTE = lerFonte("src/components/ui/field.tsx")

/** O arquivo **narra** os defeitos antigos. Sem tirar os comentários, os
 *  testes de ausência proibiriam o componente de explicar a própria história. */
const CODIGO = semComentarios(FONTE, "linha-inteira")

const DEGRAUS = ["sm", "md"] as const
const PECAS = ["label", "title", "description", "error", "legend"] as const

describe("escada do Field", () => {
  it("1. tem exatamente os dois degraus, e cada um cobre as cinco peças", () => {
    expect(Object.keys(fieldTextScale).sort()).toEqual([...DEGRAUS].sort())
    for (const degrau of DEGRAUS) {
      for (const peca of PECAS) {
        expect(fieldTextScale[degrau][peca]).toBeTruthy()
      }
    }
  })

  it("2. nenhum par de degraus produz a mesma string — foi o defeito do Item", () => {
    for (const peca of PECAS) {
      expect(fieldTextScale.sm[peca]).not.toBe(fieldTextScale.md[peca])
    }
  })

  it("3. o degrau mede texto, e nunca a altura de um controle", () => {
    // Ancorar a escada de altura no contêiner é o defeito cometido quatro
    // vezes nesta base. Um `Field` não sabe que controle carrega.
    for (const degrau of DEGRAUS) {
      for (const peca of PECAS) {
        expect(fieldTextScale[degrau][peca]).not.toMatch(
          /(?:^|\s)(?:min-)?(?:h|size)-/
        )
      }
    }
  })

  it("4. as três orientações existem e nenhuma repete a outra", () => {
    esperarDistintos(
      (["vertical", "horizontal", "responsive"] as const).map((orientation) => fieldVariants({ orientation }))
    )
    expect(fieldVariants()).toBe(fieldVariants({ orientation: "vertical" }))
  })

  it("5. os cinco seletores mortos não voltaram", () => {
    // Nenhum destes casava com coisa alguma. Família "sobreviveu à remoção".
    expect(CODIGO).not.toContain("checkbox-group")
    expect(CODIGO).not.toContain("variant=outline]/field-group")
    // Estes dois passaram a valer porque o componente agora os carimba —
    // então têm de continuar sendo escritos por ele.
    expect(CODIGO).toContain("data-invalid={isInvalid || undefined}")
    expect(CODIGO).toContain("data-disabled={disabled || undefined}")
  })

  it("6. `FieldLabel` e `FieldTitle` não dividem mais um `data-slot`", () => {
    expect(CODIGO).toContain('data-slot="field-title"')
    expect(CODIGO.match(/data-slot="field-label"/g)?.length).toBe(1)
  })

  it("7. par de identidade: `FieldContent` não separa título de descrição", () => {
    // "Não declare `gap` entre eles, nem `gap-1`." Mesmo defeito que
    // `ItemContent` e `StatCard` já corrigiram.
    expect(CODIGO).toContain("flex flex-1 flex-col gap-0 leading-snug")
    expect(CODIGO).not.toMatch(/field-content[\s\S]{0,200}gap-0\.5/)
  })

  it("8. traço com alfa é acento, e todo hover tem par de toque", () => {
    // `--primary` a 30% sobre a página escura cai para ~2:1 e some.
    expect(CODIGO).not.toMatch(/border-primary\/\d/)
    const hovers = CODIGO.match(/hover:bg-[a-z-]+\/\d+/g) ?? []
    for (const hover of hovers) {
      expect(CODIGO).toContain(hover.replace("hover:", "active:"))
    }
  })

  it("9. o rótulo só aponta para um controle que existe", () => {
    // Apontar para um `id` ausente deixa o rótulo órfão — a medição do Popover.
    expect(CODIGO).toContain(
      "htmlFor={htmlFor ?? (field?.hasControl ? field.controlId : undefined)}"
    )
  })
})
