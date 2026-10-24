import { describe, expect, it } from "vitest"

import { PRECO_FAMILIA_CENTAVOS, PRECO_FUNDADOR_CENTAVOS } from "../../../supabase/functions/_shared/plano"
import { doze, porAno, ultimoDiaDosFundadores } from "./precos"

// O que `/precos` mostra sai das constantes: se elas mudarem, este teste diz o texto novo.
describe("textos de preço", () => {
    it("Família: 12x de R$ 29,90, R$ 358,80/ano", () => {
        expect(doze(PRECO_FAMILIA_CENTAVOS)).toMatch(/^12x de R\$\s29,90$/)
        expect(porAno(PRECO_FAMILIA_CENTAVOS)).toMatch(/^R\$\s358,80\/ano$/)
    })

    it("Fundadores: 12x de R$ 19,90 até 31/01/2027", () => {
        expect(doze(PRECO_FUNDADOR_CENTAVOS)).toMatch(/^12x de R\$\s19,90$/)
        expect(ultimoDiaDosFundadores()).toBe("31/01/2027")
    })
})
