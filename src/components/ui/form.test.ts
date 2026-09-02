import { describe, expect, it } from "vitest"

import { ENTER_DEFERRAL_RULES, shouldDeferEnterToWidget } from "./form"

/**
 * O contrato do Enter, trancado.
 *
 * Ele não tinha teste porque `shouldDeferEnterToWidget` era privada — as sete
 * regras eram uma promessa sem asserção. E a página do catálogo redigitava a
 * lista à mão: mostrava **6** enquanto o código checava **7**, e a que faltava
 * era justamente a do seletor ancorado, que o `AGENTS.md` registra como a lição
 * mais geral do arquivo.
 *
 * O ambiente do vitest aqui é `node`, sem DOM. Em vez de trazer um jsdom só
 * para isto, os testes montam a cadeia de elementos com a superfície mínima que
 * a função consulta — `tagName`, `isContentEditable`, `getAttribute` e
 * `closest`. É a função de verdade sendo exercida, e não uma reimplementação.
 */
type Spec = { tag?: string; editable?: boolean; slot?: string; role?: string }

/** Do ancestral mais externo até o alvo. Devolve o alvo. */
function cadeia(...specs: Spec[]): HTMLElement {
  let parent: Stub | null = null
  let alvo: Stub | null = null

  type Stub = {
    tagName: string
    isContentEditable: boolean
    getAttribute: (name: string) => string | null
    closest: (selector: string) => Stub | null
    _parent: Stub | null
  }

  for (const spec of specs) {
    const self: Stub = {
      tagName: (spec.tag ?? "input").toUpperCase(),
      isContentEditable: spec.editable ?? false,
      _parent: parent,
      getAttribute(name) {
        if (name === "role") return spec.role ?? null
        if (name === "data-slot") return spec.slot ?? null
        return null
      },
      closest(selector) {
        const m = /^\[(data-slot|role)="(.+)"\]$/.exec(selector)
        if (!m) return null
        const [, attr, value] = m
        let cur: Stub | null = self
        while (cur) {
          if (cur.getAttribute(attr) === value) return cur
          cur = cur._parent
        }
        return null
      },
    }
    parent = self
    alvo = self
  }

  return alvo as unknown as HTMLElement
}

describe("shouldDeferEnterToWidget", () => {
  it("defere onde o próprio controle usa o Enter", () => {
    expect(shouldDeferEnterToWidget(cadeia({ tag: "textarea" }))).toBe(true)
    expect(shouldDeferEnterToWidget(cadeia({ tag: "select" }))).toBe(true)
    expect(shouldDeferEnterToWidget(cadeia({ editable: true }))).toBe(true)
    expect(
      shouldDeferEnterToWidget(cadeia({ role: "combobox" }))
    ).toBe(true)
    expect(shouldDeferEnterToWidget(cadeia({ role: "listbox" }))).toBe(true)
  })

  it("defere por ancestral, e não só pelo próprio elemento", () => {
    expect(
      shouldDeferEnterToWidget(cadeia({ slot: "select-trigger" }, {}))
    ).toBe(true)
    expect(shouldDeferEnterToWidget(cadeia({ role: "combobox" }, {}))).toBe(true)
    expect(shouldDeferEnterToWidget(cadeia({ role: "listbox" }, {}))).toBe(true)
  })

  it("defere na busca do seletor ancorado — a regra que já custou um bug", () => {
    // Medido: sem ela, o Enter enquanto se busca uma categoria **salvava a
    // transação**. O popover é portalizado, mas o evento sobe pela árvore do
    // React, e a raiz do seletor é filha do formulário.
    expect(
      shouldDeferEnterToWidget(
        cadeia({ slot: "form-picker-popover-search" }, { tag: "input" })
      )
    ).toBe(true)
  })

  it("não defere num campo de texto comum — ali o Enter envia", () => {
    expect(shouldDeferEnterToWidget(cadeia({ tag: "input" }))).toBe(false)
    expect(
      shouldDeferEnterToWidget(cadeia({ slot: "card" }, { tag: "input" }))
    ).toBe(false)
  })
})

describe("ENTER_DEFERRAL_RULES", () => {
  it("tem as sete regras — a página mostrava seis", () => {
    expect(ENTER_DEFERRAL_RULES).toHaveLength(7)
  })

  it("cada regra tem um porquê, e nenhum se repete sem motivo", () => {
    for (const rule of ENTER_DEFERRAL_RULES) {
      expect(rule.match).toBeTruthy()
      expect(rule.why).toBeTruthy()
    }
  })

  it("toda regra que nomeia um seletor está mesmo no código", () => {
    // A guarda contra a divergência que já aconteceu: a lista é a fonte, então
    // ela não pode descrever uma regra que a função não implementa.
    const fonte = shouldDeferEnterToWidget.toString()
    const seletores = ENTER_DEFERRAL_RULES.map((r) => r.match).filter((m) =>
      /^\[?(data-slot|role)=/.test(m)
    )
    expect(seletores.length).toBeGreaterThanOrEqual(4)
    for (const seletor of seletores) {
      const valor = /="([^"]+)"/.exec(seletor)?.[1]
      expect(valor).toBeTruthy()
      expect(fonte).toContain(valor as string)
    }
  })
})
