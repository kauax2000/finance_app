import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = (caminho: string) => semComentarios(lerFonte(caminho))

describe("quem dispara notificação no cliente", () => {
    it.each([
        "src/app/(app)/categories/page-client.tsx",
        "src/components/categories/category-create-dialog.tsx",
        "src/components/categories/categories-onboarding-wizard.tsx",
    ])("%s não avisa a pessoa de uma categoria que ela mesma criou", (caminho) => {
        expect(fonte(caminho)).not.toContain("dispatch-notifications")
    })

    it("editar uma despesa avalia o orçamento, como criar", () => {
        const f = fonte("src/lib/transaction-detail-sheet-mutations.ts")
        expect(f.split('"evaluate-budgets"').length - 1).toBeGreaterThanOrEqual(2)
    })

    it("a compra parcelada avalia os alertas do cartão", () => {
        expect(fonte("src/components/transactions/transaction-form-persistence.ts")).toContain(
            "scheduleEvaluateCreditCardAlerts(",
        )
    })
})
