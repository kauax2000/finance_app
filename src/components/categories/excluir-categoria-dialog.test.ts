import { describe, expect, it } from "vitest"
import { textoDaExclusaoDeCategoria } from "@/components/categories/excluir-categoria-dialog"
import { lerFonte } from "@/test/fonte"

const base = { id: "1", color: "#000000", icon: "tag" }

describe("ExcluirCategoriaDialog", () => {
  it("despesa com limite", () => {
    const t = textoDaExclusaoDeCategoria({ ...base, name: "Carro", type: "expense" }, 800)
    expect(t.titulo).toBe("Excluir Carro?")
    expect(t.descricao).toBe("Sai da carteira e não dá para desfazer.")
    expect(t.detalhe.replace(/\s/g, " ")).toBe("Despesa · limite de R$ 800,00")
    expect(t.nota).toBe(
      "Os lançamentos com Carro ficam no extrato, sem categoria, até você escolher outra. O limite dela sai junto.",
    )
  })

  it("receita sem limite", () => {
    const t = textoDaExclusaoDeCategoria({ ...base, name: "Salário", type: "income" }, null)
    expect(t.detalhe).toBe("Receita")
    expect(t.detalhe + t.nota).not.toContain("limite")
  })

  it("as duas telas usam o componente", () => {
    for (const f of ["src/app/(app)/categories/page-client.tsx", "src/components/categories/detail/category-detail-dialogs.tsx"]) {
      const src = lerFonte(f)
      expect(src).not.toContain("CategoryDeleteAlertBody")
      expect(src).toContain("<ExcluirCategoriaDialog")
    }
  })
})
