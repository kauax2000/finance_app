import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

import { rangeDentroDe } from "@/lib/queries/use-transactions-range"
import { janelaDaPrevisao } from "@/lib/previsao/use-previsao"
import { lerFonte, semComentarios } from "@/test/fonte"

/** O Painel pedia três janelas de transações que se sobrepõem; os dois meses dele cabem na da previsão. */
describe("a janela que cobre", () => {
    const janela = janelaDaPrevisao("2026-11-05")

    it("os dois meses do Painel cabem na janela da previsão", () => {
        expect(rangeDentroDe({ from: "2026-10-01T00:00:00.000Z", to: "2026-12-31T23:59:59.999Z" }, janela)).toBe(true)
        expect(rangeDentroDe({ from: "2026-09-01T00:00:00.000Z", to: "2026-11-30T23:59:59.999Z" }, janela)).toBe(true)
    })

    it("um mês antigo do calendário não cabe, e busca o seu", () => {
        expect(rangeDentroDe({ from: "2026-05-01T00:00:00.000Z", to: "2026-07-31T23:59:59.999Z" }, janela)).toBe(false)
    })

    it("o Painel passa a janela da previsão às duas consultas", () => {
        const painel = semComentarios(lerFonte("src/components/dashboard/use-dashboard-data.ts"))
        expect(painel.match(/cover: janelaPrevisao/g)).toHaveLength(2)
    })
})
