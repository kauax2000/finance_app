import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { progressoDaCurva, TRAJETO_MACIO, VIRADA, viajarLiquido } from "@/lib/liquid-move"

type Quadro = { offset?: number; scale?: string; translate?: string }

/** Uma peça falsa que guarda os quadros que a WAAPI receberia. */
function pecaFalsa(w: number, h: number) {
    const chamadas: Quadro[][] = []
    const peca = {
        offsetWidth: w,
        offsetHeight: h,
        animate: (quadros: Quadro[]) => {
            chamadas.push(quadros)
            return {} as Animation
        },
    } as unknown as HTMLElement
    return { peca, chamadas }
}

describe("viajarLiquido com limite", () => {
    const original = globalThis.window
    beforeEach(() => {
        globalThis.window = { matchMedia: () => ({ matches: false }) } as unknown as Window & typeof globalThis
    })
    afterEach(() => {
        globalThis.window = original
    })

    it("a curva de tempo vai de 0 a 1", () => {
        expect(progressoDaCurva(TRAJETO_MACIO.easing, 0)).toBeCloseTo(0, 5)
        expect(progressoDaCurva(TRAJETO_MACIO.easing, 1)).toBeCloseTo(1, 5)
        expect(progressoDaCurva("linear", 0.3)).toBe(0.3)
    })

    it("o salto até a última ponta estica sem a frente passar da trilha", () => {
        // O trilho do formulário: três itens de 127, repouso de 4 a 396.
        const { peca, chamadas } = pecaFalsa(127, 28)
        const limite = { inicio: 4, fim: 396 }
        viajarLiquido(peca, { x: 4, y: 4 }, { x: 269, y: 4 }, { amplitude: 0.18, trajeto: TRAJETO_MACIO, limite })
        const esticao = chamadas[1]!
        for (const q of esticao) {
            const k = Number(q.scale!.split(" ")[0])
            const t = Math.min(1, (q.offset ?? 0) / VIRADA)
            const x = 4 + 265 * progressoDaCurva(TRAJETO_MACIO.easing, t)
            if (k > 1) expect(x + 127 * k).toBeLessThanOrEqual(396.5)
        }
        // E ainda estica no meio do caminho: o limite só corta perto da ponta.
        expect(Math.max(...esticao.map((q) => Number(q.scale!.split(" ")[0])))).toBeGreaterThan(1.1)
    })

    it("de volta à primeira ponta, a borda de trás vira a frente e também para no limite", () => {
        const { peca, chamadas } = pecaFalsa(127, 28)
        viajarLiquido(peca, { x: 269, y: 4 }, { x: 4, y: 4 }, {
            amplitude: 0.18,
            trajeto: TRAJETO_MACIO,
            limite: { inicio: 4, fim: 396 },
        })
        for (const q of chamadas[1]!) {
            const k = Number(q.scale!.split(" ")[0])
            const t = Math.min(1, (q.offset ?? 0) / VIRADA)
            const x = 269 - 265 * progressoDaCurva(TRAJETO_MACIO.easing, t)
            if (k > 1) expect(x + 127 - 127 * k).toBeGreaterThanOrEqual(3.5)
        }
    })
})
