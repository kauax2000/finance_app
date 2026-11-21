import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"
import { AURORA, quadrosDaMascara } from "./aurora-do-tema"
import { revelarVidros, type Vidro } from "./vidro-na-revelacao"

describe("a aurora nos vidros", () => {
    it("cada vidro recebe a máscara da página, deslocada pelo topo dele", () => {
        const chamadas: { quadros: Keyframe[]; tempo: KeyframeAnimationOptions }[] = []
        const html = {
            animate(quadros: Keyframe[], tempo: KeyframeAnimationOptions) {
                chamadas.push({ quadros, tempo })
            },
        } as unknown as HTMLElement
        revelarVidros(html, [{ nome: "vidro-0", rect: { top: 700 } } as unknown as Vidro], 800)
        expect(chamadas).toHaveLength(2)
        expect(chamadas[0].tempo.pseudoElement).toBe("::view-transition-new(vidro-0)")
        expect(chamadas[0].quadros).toEqual(quadrosDaMascara(800, 700))
        expect(chamadas[1].tempo.pseudoElement).toBe("::view-transition-old(vidro-0)")
        expect(chamadas[1].quadros).toEqual(quadrosDaMascara(800, 700, true))
        for (const c of chamadas) expect(c.tempo.duration).toBe(AURORA.duracao)
    })

    it("o círculo saiu", () => {
        const fonte = lerFonte("src/lib/vidro-na-revelacao.ts")
        expect(fonte).not.toContain("recorteDeFora")
        expect(fonte).not.toContain("circle(")
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
