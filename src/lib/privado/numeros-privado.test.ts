import { describe, expect, it } from "vitest"
import { faturaPrevista } from "@/lib/previsao/fatura-prevista"
import { fluxoDoMes, seguroParaGastar } from "@/lib/previsao/fluxo"
import { cartao, dados, noCartao, tx } from "@/lib/previsao/dados-de-teste"
import type { Transaction } from "@/lib/supabase"
import { MASCARA_PRIVADA } from "./detalhes"

/** A forma que o gatilho deixa na linha: o valor fica, a descrição e a categoria saem. */
const mascarar = (t: Transaction): Transaction => ({
    ...t,
    is_private: true,
    description: MASCARA_PRIVADA,
    category_id: null,
    capture_meta: null,
})

describe("o total da casa não muda ao marcar privado (Bloco 7B)", () => {
    const card = { ...cartao("c", 5, 12), holder_user_id: "u" }
    const farmacia = tx("expense", 180, "2026-11-08", { description: "Farmácia", category_id: "saude" })
    const presente = noCartao("expense", 320, "2026-11-02", "c", { description: "Presente", category_id: "lazer" })
    const resto = [tx("income", 5000, "2026-11-05"), tx("expense", 900, "2026-11-03", { category_id: "casa" })]
    const antes = dados({ hojeYmd: "2026-11-10", transacoes: [farmacia, presente, ...resto], cartoes: [card] })
    const depois = dados({
        hojeYmd: "2026-11-10",
        transacoes: [mascarar(farmacia), mascarar(presente), ...resto],
        cartoes: [card],
    })

    it("fluxoDoMes e seguroParaGastar dão o mesmo, com a forma mascarada como entrada", () => {
        expect(fluxoDoMes(depois, "2026-11")).toEqual(fluxoDoMes(antes, "2026-11"))
        expect(seguroParaGastar(depois)).toEqual(seguroParaGastar(antes))
        // A privada pesa: sem ela o total seria outro.
        expect(fluxoDoMes(antes, "2026-11").despesas.pagas).toBe(1080)
    })

    it("a fatura do cartão do titular é a mesma", () => {
        const f = (d: typeof antes) => faturaPrevista(card, "2026-11", d)
        expect(f(depois)).toEqual(f(antes))
        expect(f(antes).total).toBeGreaterThanOrEqual(320)
    })
})
