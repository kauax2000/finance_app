import { describe, expect, it } from "vitest"
import { ROUTES } from "@/config/navigation"
import { decidirRotaDoConvidado, rotaPermitidaAoConvidado } from "@/lib/papeis/rotas-do-convidado"
import { MODELOS_DE_CARTEIRA, REGRA_DA_ESCOLHA } from "./modelos"

describe("os modelos de carteira (Decisão 3)", () => {
    it("são os seis, com o propósito e o modo da RPC", () => {
        expect(MODELOS_DE_CARTEIRA.map((m) => [m.id, m.purpose, m.split_mode])).toEqual([
            ["casa", "everyday", "pooled"],
            ["casal", "everyday", "split"],
            ["pessoal", "everyday", "pooled"],
            ["viagem", "project", "split"],
            ["reforma", "project", "split"],
            ["evento", "project", "split"],
        ])
        for (const m of MODELOS_DE_CARTEIRA) {
            expect(m.rotulo).not.toBe("")
            expect(m.descricao).not.toBe("")
        }
    })

    it("a regra da escolha é a frase do spec", () => {
        expect(REGRA_DA_ESCOLHA).toBe(
            "Vai usar o cartão da casa e são as mesmas pessoas? É um projeto. Gente de fora ou dinheiro separado? É uma carteira.",
        )
    })
})

describe("o convidado não tem /projetos (Ruling 3)", () => {
    it("a rota e o detalhe ficam fora da lista dele", () => {
        expect(ROUTES.PROJETOS).toBe("/projetos")
        expect(rotaPermitidaAoConvidado(ROUTES.PROJETOS)).toBe(false)
        expect(rotaPermitidaAoConvidado(`${ROUTES.PROJETOS}/abc`)).toBe(false)
        expect(decidirRotaDoConvidado("guest", `${ROUTES.PROJETOS}/abc`)).toBe(ROUTES.DASHBOARD)
        expect(decidirRotaDoConvidado("member", ROUTES.PROJETOS)).toBe("ok")
    })
})
