import { describe, expect, it } from "vitest"
import { statusDaConta } from "./bill-status"

const mensal = { frequency: "monthly", end_date: null, is_active: true } as const
const hoje = "2026-11-15"

describe("statusDaConta", () => {
    it("ativa: com pendente, ou sem fim", () => {
        expect(statusDaConta(mensal, false, hoje)).toBe("ativa")
        expect(statusDaConta(mensal, true, hoje)).toBe("ativa")
    })

    it("encerrada: o end_date antes de hoje e nenhuma pendente", () => {
        const fim = { ...mensal, end_date: "2026-11-14" }
        expect(statusDaConta(fim, true, hoje)).toBe("encerrada")
        expect(statusDaConta(fim, false, hoje)).toBe("ativa")
        expect(statusDaConta({ ...mensal, end_date: hoje }, true, hoje)).toBe("ativa")
    })

    it("concluída: a única sem pendente, mesmo paga há mais de 90 dias", () => {
        const unica = { ...mensal, frequency: "one_time" } as const
        expect(statusDaConta(unica, true, hoje)).toBe("concluida")
        expect(statusDaConta(unica, false, hoje)).toBe("ativa")
    })

    it("inativa: desligada pela pessoa", () => {
        expect(statusDaConta({ ...mensal, is_active: false }, false, hoje)).toBe("inativa")
    })
})
