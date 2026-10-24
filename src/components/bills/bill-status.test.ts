import { describe, expect, it } from "vitest"
import { statusDaConta } from "./bill-status"

const mensal = { frequency: "monthly", end_date: null, is_active: true } as const
const hoje = "2026-11-15"

describe("statusDaConta", () => {
    it("ativa: com pendente, ou sem fim", () => {
        expect(statusDaConta(mensal, [{ status: "pending" }], hoje)).toBe("ativa")
        expect(statusDaConta(mensal, [], hoje)).toBe("ativa")
    })

    it("encerrada: o end_date antes de hoje e nenhuma pendente", () => {
        const fim = { ...mensal, end_date: "2026-11-14" }
        expect(statusDaConta(fim, [{ status: "paid" }], hoje)).toBe("encerrada")
        expect(statusDaConta(fim, [{ status: "pending" }], hoje)).toBe("ativa")
        expect(statusDaConta({ ...mensal, end_date: hoje }, [], hoje)).toBe("ativa")
    })

    it("concluída: a única sem pendente e com uma paga", () => {
        const unica = { ...mensal, frequency: "one_time" } as const
        expect(statusDaConta(unica, [{ status: "paid" }], hoje)).toBe("concluida")
        expect(statusDaConta(unica, [{ status: "pending" }], hoje)).toBe("ativa")
        expect(statusDaConta(unica, [{ status: "skipped" }], hoje)).toBe("ativa")
    })

    it("inativa: desligada pela pessoa", () => {
        expect(statusDaConta({ ...mensal, is_active: false }, [{ status: "pending" }], hoje)).toBe("inativa")
    })
})
