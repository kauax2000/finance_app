import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"
import { recorteDeFora } from "./vidro-na-revelacao"

describe("o recorte de fora do círculo", () => {
    it("é retângulo menos círculo, por evenodd", () => {
        const p = recorteDeFora(362, 64, 50, -500, 300)
        expect(p.startsWith('path(evenodd, "')).toBe(true)
        // O retângulo passa 100px da caixa: a sombra do vidro não é cortada.
        expect(p).toContain("M-100 -100H462V164H-100Z")
        // O círculo, em dois arcos, com centro e raio pedidos.
        expect(p).toContain("M-250 -500a300 300 0 1 0 600 0a300 300 0 1 0 -600 0Z")
    })

    it("tem os mesmos comandos em qualquer raio, senão o navegador não interpola", () => {
        const comandos = (s: string) => s.replace(/-?\d+(\.\d+)?/g, "n")
        expect(comandos(recorteDeFora(362, 64, 50, -500, 0))).toBe(
            comandos(recorteDeFora(362, 64, 50, -500, 900)),
        )
    })
})

describe("só no WebKit", () => {
    it("fora do WebKit não nomeia nada: o Chrome já desenha o vidro na foto, e o borrão nos grupos travava a troca", () => {
        const fonte = lerFonte("src/lib/vidro-na-revelacao.ts")
        // `GestureEvent` só existe no Safari (macOS e iOS, onde todo navegador é WebKit).
        expect(fonte).toContain('"GestureEvent" in janela')
        expect(fonte).toMatch(/if \(!fotoPerdeOBorrao\(janela\)\) return \{ vidros: \[\], desfazer\(\) \{\} \}/)
    })
})

describe("a folha dos vidros", () => {
    it("é uma só, por id: uma troca pulada não deixa folha órfã", () => {
        const fonte = lerFonte("src/lib/vidro-na-revelacao.ts")
        expect(fonte).toContain('const ID_DA_FOLHA = "vidro-na-revelacao"')
        expect(fonte).toContain("doc.getElementById(ID_DA_FOLHA)")
    })
})
