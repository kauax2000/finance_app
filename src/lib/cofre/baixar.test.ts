import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const exportarTudo = vi.fn()
vi.mock("@/lib/cofre/exportar", () => ({ exportarTudo: (...a: unknown[]) => exportarTudo(...a) }))

import { baixarExportacao } from "@/lib/cofre/baixar"

// O ambiente é `node`: um `document` mínimo basta para o link anexado.
function documentoFalso() {
    const links: Array<{ href: string; download: string; click: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> }> = []
    const doc = {
        createElement: (tag: string) => {
            expect(tag).toBe("a")
            const a = { href: "", download: "", click: vi.fn(), remove: vi.fn() }
            links.push(a)
            return a
        },
        body: { appendChild: vi.fn() },
    }
    return { doc, links }
}

describe("baixarExportacao", () => {
    let criar: ReturnType<typeof vi.spyOn>
    let revogar: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        vi.useFakeTimers()
        exportarTudo.mockReset()
        criar = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x")
        revogar = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
    })
    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it("baixa o zip por um link anexado e revoga a URL depois de 60s", async () => {
        const { doc, links } = documentoFalso()
        vi.stubGlobal("document", doc)
        const blob = new Blob(["zip"])
        exportarTudo.mockResolvedValue(blob)

        await baixarExportacao([{ id: "w", name: "W" }])

        expect(exportarTudo).toHaveBeenCalledWith([{ id: "w", name: "W" }])
        expect(criar).toHaveBeenCalledWith(blob)
        expect(links).toHaveLength(1)
        expect(links[0].href).toBe("blob:x")
        expect(links[0].download).toMatch(/^finance-app-\d{4}-\d{2}-\d{2}\.zip$/)
        expect(doc.body.appendChild).toHaveBeenCalledWith(links[0])
        expect(links[0].click).toHaveBeenCalledOnce()
        expect(links[0].remove).toHaveBeenCalledOnce()
        expect(revogar).not.toHaveBeenCalled()
        vi.advanceTimersByTime(60_000)
        expect(revogar).toHaveBeenCalledWith("blob:x")
    })

    it("propaga o erro da exportação sem criar link", async () => {
        const { doc, links } = documentoFalso()
        vi.stubGlobal("document", doc)
        exportarTudo.mockRejectedValue(new Error("rede"))

        await expect(baixarExportacao([{ id: "w", name: "W" }])).rejects.toThrow("rede")
        expect(links).toHaveLength(0)
        expect(criar).not.toHaveBeenCalled()
    })
})
