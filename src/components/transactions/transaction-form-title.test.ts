import { describe, expect, it } from "vitest"
import { transactionFormTitle } from "./transaction-form-title"

const base = {
    editing: false,
    formKind: "expense" as const,
    type: "expense" as const,
    hasInstallmentPlan: false,
    installmentEditScope: "slice" as const,
}

describe("o título do formulário segue o tipo e o modo", () => {
    it("ao criar", () => {
        expect(transactionFormTitle(base)).toBe("Nova despesa")
        expect(transactionFormTitle({ ...base, formKind: "installment" })).toBe("Nova compra parcelada")
        expect(transactionFormTitle({ ...base, formKind: "income", type: "income" })).toBe("Nova receita")
    })

    it("ao editar", () => {
        const editar = { ...base, editing: true }
        expect(transactionFormTitle(editar)).toBe("Editar despesa")
        expect(transactionFormTitle({ ...editar, type: "income" })).toBe("Editar receita")
    })

    it("ao editar uma parcela, o escopo decide", () => {
        const parcela = { ...base, editing: true, hasInstallmentPlan: true }
        expect(transactionFormTitle(parcela)).toBe("Editar despesa")
        expect(transactionFormTitle({ ...parcela, installmentEditScope: "plan" })).toBe("Editar compra parcelada")
    })
})
