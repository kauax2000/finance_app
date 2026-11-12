import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

/** As quatro telas que excluem lançamentos confirmam pelo mesmo diálogo (E1). */
const TELAS = [
  "src/app/(app)/transactions/page-client.tsx",
  "src/app/(app)/credit-cards/[cardId]/page-client.tsx",
  "src/app/(app)/dashboard/page-client.tsx",
  "src/components/categories/detail/category-embedded-transactions.tsx",
]

describe("ExcluirLancamentosDialog nas telas", () => {
  it.each(TELAS)("%s usa o diálogo compartilhado, sem o texto antigo", (tela) => {
    const fonte = semComentarios(lerFonte(tela))
    expect(fonte).toContain("<ExcluirLancamentosDialog")
    expect(fonte).not.toContain("Excluir transação?")
  })
})
