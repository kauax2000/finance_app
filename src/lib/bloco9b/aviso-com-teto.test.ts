import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const daily = () => semComentarios(lerFonte("supabase/functions/billing-daily/index.ts"))

describe("billing-daily: o aviso pendente tem teto (#97)", () => {
    it("a reivindicação soma a tentativa na mesma escrita do compare-and-swap", () => {
        expect(daily()).toMatch(
            /\.update\(\{ enviado_em: ctx\.iso, tentativas: tentativa \}\)[\s\S]{0,300}\.eq\('enviado_em', a\.enviado_em\)/,
        )
    })

    it("sem sucesso na última tentativa, desiste: pendente false e o log 'desistiu'", () => {
        const f = daily()
        expect(f).toContain("desisteDoAviso(tentativa)")
        expect(f).toMatch(/\.update\(\{ pendente: false \}\)/)
        expect(f).toContain("desistiu")
    })

    it("a coluna tentativas nasce na migração do Bloco 9", () => {
        expect(lerFonte("supabase/migrations/20261102120000_bloco9.sql")).toMatch(
            /add column if not exists tentativas integer not null default 0/,
        )
    })
})
