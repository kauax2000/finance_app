import { describe, expect, it } from "vitest"

import { conferirNoCiclo } from "@/lib/fatura/ciclo"
import type { LancamentoParaConferir } from "@/lib/fatura/conferir"
import { prepararItens } from "@/lib/import/importar"
import type { ItemBanco } from "@/lib/import/tipos"
import { roundCents } from "@/lib/money-brl"

import { agruparPorMotivo, impactoDaDecisao, sugerirCorrecoes } from "./correcoes"

const ciclo = { inicio: "2026-09-27", fechamento: "2026-10-26" }
const it_ = (data: string, descricao: string, valor: number, extra: Partial<ItemBanco> = {}): ItemBanco => ({
    data, descricao, valor, estorno: false, parcela: null, ...extra,
})
const ap = (id: string, date: string, description: string, amount: number, extra: Partial<LancamentoParaConferir> = {}): LancamentoParaConferir => ({
    id, date, description, amount, type: "expense", installment_sequence: null, ...extra,
})

const banco = (extra: ItemBanco[] = []) =>
    prepararItens(
        [
            it_("2026-09-25", "Gasolina", 228.13),
            it_("2026-09-26", "Pizza", 43.28),
            it_("2026-10-01", "Cafe", 23),
            it_("2026-10-01", "Labres Pizzaria", 30),
            it_("2026-10-26", "Meli+", 19.9),
            it_("2026-09-29", "Kimono", 87.45, { parcela: { k: 5, n: 5 } }),
            ...extra,
        ],
        [],
        [],
        { tipo: "cartao", cardId: "card" } as const,
    )
const lancados = [
    ap("g", "2026-09-25", "Gasolina", 228.14),
    ap("p", "2026-09-26", "Pizza", 43.28),
    ap("c", "2026-10-01", "Cafe", 24),
    ap("m", "2026-10-26", "Meli+", 20, { subscription_id: "s1" }),
    ap("k", "2026-09-29", "Kimono", 87.45, { installment_sequence: 4 }),
    ap("f", "2026-10-23", "Perfume", 107),
]
const conf = conferirNoCiclo(banco(), lancados, ciclo)
const sugerir = () => sugerirCorrecoes(conf, ciclo)
const perfume = conf.soNoApp.find((a) => a.id === "f")!

describe("correções sugeridas", () => {
    it("fora do período leva ao primeiro dia do ciclo e guarda a data real", () => {
        expect(sugerir().find((c) => c.id === "fora-do-periodo:g")).toMatchObject({
            de: "2026-09-25", para: "2026-09-27", novaDescricao: "Gasolina · compra em 25/09", impacto: 228.14,
        })
    })
    it("o mesmo lançamento fora do período e com valor diferente gera as duas, e o impacto somado é o do banco", () => {
        const doG = sugerir().filter((c) => "appId" in c && c.appId === "g")
        expect(doG.map((c) => c.motivo).sort()).toEqual(["fora-do-periodo", "valor-diferente"])
        expect(roundCents(doG.reduce((s, c) => s + c.impacto, 0))).toBe(228.13)
    })
    it("valor diferente de assinatura traz a assinatura", () => {
        expect(sugerir().find((c) => c.id === "valor-diferente:m")).toMatchObject({ de: 20, para: 19.9, assinaturaId: "s1", impacto: -0.1 })
    })
    it("parcela fora de sequência sugere o número do banco", () => {
        expect(sugerir().find((c) => c.id === "parcela:k")).toMatchObject({ de: 4, para: 5, impacto: 0 })
    })
    it("falta no app vira criar", () => {
        expect(sugerir().filter((c) => c.motivo === "falta-no-app").map((c) => c.impacto)).toEqual([30])
    })
    it("aceitar tudo e apagar o que só está no app fecha com o banco", () => {
        const soma = conf.somaApp + sugerir().reduce((s, c) => s + c.impacto, 0) + impactoDaDecisao(perfume, "apagar")
        expect(roundCents(soma)).toBe(conf.somaBanco)
    })
    it("estorno tem impacto negativo", () => {
        const c = conferirNoCiclo(banco([it_("2026-10-05", "Estorno Xyz", 10, { estorno: true })]), lancados, ciclo)
        expect(sugerirCorrecoes(c, ciclo).find((x) => x.motivo === "falta-no-app" && x.item.estorno)?.impacto).toBe(-10)
    })
    it("manter e sem decisão não mudam nada", () => {
        expect(impactoDaDecisao(perfume, "manter")).toBe(0)
        expect(impactoDaDecisao(perfume, undefined)).toBe(0)
        expect(impactoDaDecisao(perfume, { forma: "pix" })).toBe(-107)
    })
    it("agrupa na ordem dos motivos e soma o impacto", () => {
        expect(agruparPorMotivo(sugerir()).map((g) => g.titulo)).toEqual([
            "Fora do período", "Falta no app", "Valor diferente", "Parcela fora de sequência",
        ])
    })
})
