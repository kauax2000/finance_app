import { describe, expect, it } from "vitest"

import { descricaoDaLista, iaNaVoce, lancarNaVoce } from "@/components/me/estado-na-voce"

const vazia = { carregando: false, erro: false, quantos: 0 }

describe("iaNaVoce", () => {
    it("o cartão só com a lista carregada e vazia", () => {
        expect(iaNaVoce({ ...vazia, carregando: true })).toBe("linha")
        expect(iaNaVoce({ ...vazia, erro: true })).toBe("linha")
        expect(iaNaVoce(vazia)).toBe("cartao")
        expect(iaNaVoce({ ...vazia, quantos: 2 })).toBe("linha")
    })
})

describe("lancarNaVoce", () => {
    it("no iPhone instalado, o cartão até o primeiro aparelho", () => {
        expect(lancarNaVoce("iphone-instalado", vazia)).toBe("cartao")
        expect(lancarNaVoce("iphone-instalado", { ...vazia, carregando: true })).toBe("linha")
        expect(lancarNaVoce("iphone-instalado", { ...vazia, erro: true })).toBe("linha")
        expect(lancarNaVoce("iphone-instalado", { ...vazia, quantos: 1 })).toBe("linha")
    })
    it("no navegador do iPhone, o convite; fora do iPhone, nada", () => {
        expect(lancarNaVoce("navegador-iphone", vazia)).toBe("convite")
        for (const a of ["navegador-android", "android-instalado", "computador", "sabendo"] as const) {
            expect(lancarNaVoce(a, vazia)).toBeNull()
        }
    })
})

describe("descricaoDaLista", () => {
    it("nomes por extenso até dois, depois a contagem", () => {
        expect(descricaoDaLista([], "IAs")).toBeUndefined()
        expect(descricaoDaLista(["Claude"], "IAs")).toBe("Claude")
        expect(descricaoDaLista(["Claude", "ChatGPT"], "IAs")).toBe("Claude, ChatGPT")
        expect(descricaoDaLista(["Claude", "ChatGPT", "Gemini"], "IAs")).toBe("3 IAs")
    })
})
