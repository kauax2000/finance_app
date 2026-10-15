import type { TransactionFormKind } from "@/components/transactions/transaction-type-segment"

/** O título do formulário de lançamento: o tipo, em criar ou editar. */
export function transactionFormTitle({
    editing,
    formKind,
    type,
    hasInstallmentPlan,
    installmentEditScope,
}: {
    editing: boolean
    formKind: TransactionFormKind
    type: "income" | "expense"
    hasInstallmentPlan: boolean
    installmentEditScope: "slice" | "plan"
}): string {
    if (editing) {
        if (hasInstallmentPlan && installmentEditScope === "plan") return "Editar compra parcelada"
        return type === "income" ? "Editar receita" : "Editar despesa"
    }
    if (formKind === "installment") return "Nova compra parcelada"
    return formKind === "income" ? "Nova receita" : "Nova despesa"
}
