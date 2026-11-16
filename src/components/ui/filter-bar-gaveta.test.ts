import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { FILTER_PERIOD_PRESETS, valorNaLista, type FilterField } from "./filter-bar"

const enumCampo = {
  id: "cat",
  label: "Categoria",
  type: "enum",
  options: [
    { value: "1", label: "Carro" },
    { value: "2", label: "Casa" },
  ],
} as FilterField
const op = (v: string) => (enumCampo as { options: { value: string; label: string }[] }).options.find((o) => o.value === v)
const nada = () => undefined

describe("valorNaLista", () => {
  it("enum: o primeiro nome e o resto", () => {
    expect(valorNaLista(enumCampo, { operator: "is", values: ["1"] }, op)).toBe("Carro")
    expect(valorNaLista(enumCampo, { operator: "is", values: ["1", "2"] }, op)).toBe("Carro +1")
  })
  it("período por atalho", () => {
    const p = FILTER_PERIOD_PRESETS.find((x) => x.id === "ultimos-7")!
    expect(valorNaLista({ id: "periodo", label: "Período", type: "period" } as FilterField, { operator: "is", values: ["ultimos-7"] }, nada)).toBe(p.label)
  })
  it("booleano ligado e texto sem aspas", () => {
    expect(valorNaLista({ id: "c", label: "A conferir", type: "boolean" } as FilterField, { operator: "is", values: [] }, nada)).toBe("Ligado")
    expect(valorNaLista({ id: "d", label: "Descrição", type: "text" } as FilterField, { operator: "contains", values: ["uber"] }, nada)).toBe("uber")
  })
  it("a gaveta não diz mais 'editar' sozinho e tem Limpar tudo", () => {
    const src = semComentarios(lerFonte("src/components/ui/filter-bar.tsx"))
    expect(src).not.toMatch(/>\s*editar\s*</)
    expect(src).toContain("Limpar tudo")
  })
})

describe("o editor da gaveta", () => {
  const src = semComentarios(lerFonte("src/components/ui/filter-bar.tsx"))
  it("tem voltar, Pronto e Remover filtro só para o que existia", () => {
    expect(src).not.toMatch(/Editar \{campo\.label/)
    expect(src).toContain("Pronto")
    expect(src).toContain("Remover filtro")
    expect(src).toMatch(/existia\s*&&[\s\S]{0,300}Remover filtro/)
    expect(src).toMatch(/onVoltar/)
  })
  it("Descrição e Valor pedem o teclado na gaveta", () => {
    expect(src).toMatch(/enterKeyHint="search"/)
    expect(src).toMatch(/enterKeyHint="done"/)
    expect(src).toMatch(/autoFocus=\{[^}]*naGaveta/)
  })
  it("voltar com rascunho não deixa filtro vazio", () => {
    expect(src).toMatch(/onVoltar[\s\S]{0,400}setRascunho\(null\)|const voltar[\s\S]{0,400}setRascunho\(null\)/)
  })
  it("a lista não mostra valor de rascunho (nada de vazio nem 'R$ NaN')", () => {
    expect(src).toMatch(/valorDe=\{[\s\S]{0,300}!t\.rascunho/)
  })
})
