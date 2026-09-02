import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { fieldTextScale, fieldVariants } from "./field"

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
const FONTE = readFileSync(new URL("./field.tsx", import.meta.url), "utf8")

/** O arquivo **narra** os defeitos antigos. Sem tirar os comentários, os
 *  testes de ausência proibiriam o componente de explicar a própria história. */
const CODIGO = FONTE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

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
    expect(JSON.stringify(fieldTextScale.sm)).not.toBe(
      JSON.stringify(fieldTextScale.md)
    )
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
    const strings = (["vertical", "horizontal", "responsive"] as const).map(
      (orientation) => fieldVariants({ orientation })
    )
    expect(new Set(strings).size).toBe(3)
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
