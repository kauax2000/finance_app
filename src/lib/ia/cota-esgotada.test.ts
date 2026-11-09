import { describe, expect, it } from "vitest"
import { cotaEsgotadaHoje, marcarCotaEsgotada } from "@/lib/ia/cota-esgotada"

function memoria() {
    const m = new Map<string, string>()
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}

describe("cota da IA esgotada neste aparelho", () => {
    it("vale só no dia marcado", () => {
        const s = memoria()
        expect(cotaEsgotadaHoje(s, "2026-11-09")).toBe(false)
        marcarCotaEsgotada(s, "2026-11-09")
        expect(cotaEsgotadaHoje(s, "2026-11-09")).toBe(true)
        expect(cotaEsgotadaHoje(s, "2026-11-10")).toBe(false)
    })

    it("sem armazenamento, não trava a paleta", () => {
        const quebrado = {
            getItem: () => {
                throw new Error("privado")
            },
            setItem: () => {
                throw new Error("privado")
            },
        }
        marcarCotaEsgotada(quebrado, "2026-11-09")
        expect(cotaEsgotadaHoje(quebrado, "2026-11-09")).toBe(false)
        expect(cotaEsgotadaHoje(null, "2026-11-09")).toBe(false)
    })
})
