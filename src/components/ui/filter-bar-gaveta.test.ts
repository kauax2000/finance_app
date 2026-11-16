import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { FILTER_PERIOD_PRESETS, rotuloVerResultados, valorNaLista, type FilterField } from "./filter-bar"

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

describe("a lista da gaveta", () => {
  const src = semComentarios(lerFonte("src/components/ui/filter-bar.tsx"))
  it("mantém o booleano ligado na lista da gaveta, com a seta empurrada à ponta quando não há valor", () => {
    expect(src).toMatch(/naGaveta \|\| !\(f\.type === "boolean" && usados\.includes\(f\.id\)\)/)
    expect(src).toMatch(/!usados\.includes\(f\.id\) && "ms-auto"/)
  })
  it("na gaveta os modos do Valor são chips de rádio que quebram linha; no desktop, o trilho", () => {
    expect(src).toMatch(/naGaveta \? \(\s*<RadioGroup variant="chip"[\s\S]{0,200}aria-label="Modo"/)
    expect(src).toMatch(/<ToggleGroup[\s\S]{0,120}variant="floating"[\s\S]{0,200}aria-label="Modo"/)
  })
  it("o título do editor encolhe no telefone", () => {
    expect(src).toContain("grid-cols-[1fr_minmax(0,auto)_1fr]")
  })
})

describe("o cabeçalho e o rodapé da lista na gaveta", () => {
  const src = semComentarios(lerFonte("src/components/ui/filter-bar.tsx"))
  it("rótulo do Ver", () => {
    const n: [string, string] = ["lançamento", "lançamentos"]
    expect(rotuloVerResultados(undefined)).toBe("Ver resultados")
    expect(rotuloVerResultados(1, n)).toBe("Ver 1 lançamento")
    expect(rotuloVerResultados(12, n)).toBe("Ver 12 lançamentos")
    expect(rotuloVerResultados(3, undefined)).toBe("Ver 3 resultados")
  })
  it("título Filtros, Ver primary e Limpar tudo tertiary na mesma linha; o Limpar solto sumiu", () => {
    expect(src).toMatch(/<PopoverTitle[^>]*>Filtros<\/PopoverTitle>/)
    expect(src).toMatch(/<div className="flex gap-2 px-2 pb-2">\s*\{usados\.length > 0 \? \(\s*<Button[^>]*variant="tertiary"[^>]*onClick=\{onLimparTudo\}>\s*Limpar tudo[\s\S]{0,120}<Button[^>]*variant="primary"[\s\S]{0,80}\{verLabel\}/)
    expect(src).toContain("verLabel={rotuloVerResultados(count, noun)}")
    expect(src).not.toContain('<div className="flex justify-end px-2 pb-2">')
  })
  it("um título só: o label 'Adicionar filtro' some na gaveta, onde o 'Filtros' visível é o título", () => {
    expect(src).toContain('label={aberto?.tipo === "campos" && !listaNaGaveta ? "Adicionar filtro" : undefined}')
  })
})
