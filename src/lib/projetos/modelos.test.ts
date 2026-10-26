import { describe, expect, it } from "vitest"
import { ROUTES } from "@/config/navigation"
import { decidirRotaDoConvidado, rotaPermitidaAoConvidado } from "@/lib/papeis/rotas-do-convidado"
import { camposDaCarteiraProjeto, MODELOS_DE_CARTEIRA, REGRA_DA_ESCOLHA } from "./modelos"

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

describe("as datas e o orçamento da carteira de projeto (I1)", () => {
    it("lê o dinheiro em pt-BR e deixa vazio como nulo", () => {
        expect(camposDaCarteiraProjeto({ inicio: "2026-11-01", fim: "2026-11-20", orcamento: "1.234,56" })).toEqual({
            ok: true,
            campos: { starts_on: "2026-11-01", ends_on: "2026-11-20", budget_total: 1234.56 },
        })
        expect(camposDaCarteiraProjeto({ inicio: "", fim: "", orcamento: "" })).toEqual({
            ok: true,
            campos: { starts_on: null, ends_on: null, budget_total: null },
        })
    })

    it("o fim não vem antes do começo, e o orçamento é maior que zero", () => {
        expect(camposDaCarteiraProjeto({ inicio: "2026-11-20", fim: "2026-11-01", orcamento: "" })).toEqual({
            ok: false,
            erro: "O fim não pode vir antes do começo.",
        })
        expect(camposDaCarteiraProjeto({ inicio: "2026-11-20", fim: "2026-11-20", orcamento: "" }).ok).toBe(true)
        expect(camposDaCarteiraProjeto({ inicio: "", fim: "", orcamento: "0,00" })).toEqual({
            ok: false,
            erro: "O orçamento total precisa ser maior que zero.",
        })
        expect(camposDaCarteiraProjeto({ inicio: "", fim: "", orcamento: "abc" }).ok).toBe(false)
    })
})
