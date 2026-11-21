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
        revelarVidros(html, [{ nome: "vidro-0", rect: { left: 0, top: 700 } } as unknown as Vidro], 800, 375)
        expect(chamadas).toHaveLength(2)
        expect(chamadas[0].tempo.pseudoElement).toBe("::view-transition-new(vidro-0)")
        expect(chamadas[0].quadros).toEqual(quadrosDaMascara(800, 700, false, { largura: 375, esquerda: 0 }))
        expect(chamadas[1].tempo.pseudoElement).toBe("::view-transition-old(vidro-0)")
        expect(chamadas[1].quadros).toEqual(quadrosDaMascara(800, 700, true, { largura: 375, esquerda: 0 }))
        for (const c of chamadas) expect(c.tempo.duration).toBe(AURORA.duracao)
    })

    it("a onda do vidro tem a largura da janela e começa na esquerda dela, não na do vidro", () => {
        const chamadas: { quadros: Keyframe[] }[] = []
        const html = { animate: (quadros: Keyframe[]) => chamadas.push({ quadros }) } as unknown as HTMLElement
        revelarVidros(html, [{ nome: "vidro-0", rect: { left: 20, top: 700 } } as unknown as Vidro], 800, 375)
        const nova = chamadas[0].quadros[0]
        expect(nova.maskSize).toBe("375px 1920px")
        expect(nova.webkitMaskSize).toBe("375px 1920px")
        expect(String(nova.maskPosition).startsWith("-20px ")).toBe(true)
        expect(chamadas[1].quadros[0].maskSize).toBe("375px 3840px")
        // A página segue em 100% e 0.
        expect(quadrosDaMascara(800)[0].maskSize).toBe("100% 1920px")
        expect(String(quadrosDaMascara(800)[0].maskPosition).startsWith("0 ")).toBe(true)
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
