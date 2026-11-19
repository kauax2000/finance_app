import { existsSync } from "node:fs"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { arquivosTsx, lerFonte, semComentarios } from "@/test/fonte"
import { CategoryFormFields } from "./category-form-fields"

type Budget = NonNullable<Parameters<typeof CategoryFormFields>[0]["budget"]>

const render = (
    type: "income" | "expense",
    budget?: Partial<Budget>,
) =>
    renderToStaticMarkup(
        createElement(CategoryFormFields, {
            idPrefix: "t",
            name: "Mercado",
            onNameChange: () => {},
            type,
            onTypeChange: () => {},
            color: "",
            onColorChange: () => {},
            icon: "shopping-cart",
            onIconChange: () => {},
            budget: budget
                ? {
                      ym: "2026-11",
                      amount: "",
                      onAmountChange: () => {},
                      repeats: true,
                      onRepeatsChange: () => {},
                      defaultOpen: false,
                      ...budget,
                  }
                : undefined,
        }),
    )

describe("CategoryFormFields", () => {
    it("fechado, o limite é só a linha", () => {
        const html = render("expense", { defaultOpen: false })
        expect(html).toContain("Limite do mês")
        expect(html).toContain("Opcional")
        expect(html).not.toContain("Repetir todo mês")
    })

    it("aberto, o valor diz o mês e o interruptor diz o que repete", () => {
        const ligado = render("expense", { defaultOpen: true, repeats: true })
        expect(ligado).toContain("Vale para novembro de 2026")
        expect(ligado).toContain("Repetir todo mês")
        expect(ligado).toContain("Vale também nos próximos meses")
        const desligado = render("expense", { defaultOpen: true, repeats: false })
        expect(desligado).toContain("Desligado, vale só em novembro")
    })

    it("receita não tem limite", () => {
        expect(render("income", { defaultOpen: true })).not.toContain("Limite do mês")
    })

    it("a prévia vem antes do nome", () => {
        const html = render("expense")
        const tile = html.indexOf('data-slot="color-tile"')
        expect(tile).toBeGreaterThan(-1)
        expect(tile).toBeLessThan(html.indexOf(">Nome<"))
        expect(html).toContain('placeholder="Ex: Alimentação"')
    })
})

describe("os três diálogos", () => {
    const pagina = semComentarios(lerFonte("src/app/(app)/categories/page-client.tsx"), "tudo")
    const criar = semComentarios(lerFonte("src/components/categories/category-create-dialog.tsx"), "tudo")
    const detalhe = semComentarios(
        lerFonte("src/components/categories/detail/category-detail-dialogs.tsx"),
        "tudo",
    )

    it("o wireframe do Bloco 5 saiu", () => {
        expect(existsSync("src/components/wireframe/orcamento-repete-wireframe.tsx")).toBe(false)
        for (const arquivo of arquivosTsx("src")) {
            expect(lerFonte(arquivo), arquivo).not.toContain("orcamento-repete-wireframe")
        }
    })

    it("os três usam o formulário compartilhado", () => {
        for (const f of [pagina, criar, detalhe]) expect(f).toContain("<CategoryFormFields")
    })

    it("o rodapé é Cancelar + Salvar, com Remover limite no start ao editar", () => {
        expect(pagina).toContain("<FormCancel")
        for (const f of [pagina, detalhe]) {
            expect(f).toMatch(/<DialogFooter\s+start=/)
            expect(f).toContain("Remover limite")
            expect(f).not.toContain("Removendo…")
        }
    })

    it("o diálogo de fora grava a repetição", () => {
        expect(criar).toMatch(/repeats[,:]/)
        expect(criar).toContain("upsertCategoryBudget(")
    })
})
