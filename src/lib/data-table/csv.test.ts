import { afterEach, describe, expect, it, vi } from "vitest"
import { downloadCsv } from "./csv"

describe("downloadCsv", () => {
    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })

    it("anexa o link, clica, tira e só revoga a URL um minuto depois (Safari do iOS)", () => {
        vi.useFakeTimers()
        const passos: string[] = []
        const a = {
            href: "",
            download: "",
            click: () => passos.push("click"),
            remove: () => passos.push("remove"),
        }
        vi.stubGlobal("document", {
            createElement: () => a,
            body: { appendChild: () => passos.push("append") },
        })
        const revoke = vi.fn()
        vi.stubGlobal("URL", { createObjectURL: () => "blob:x", revokeObjectURL: revoke })

        downloadCsv("transacoes-2026-11-07", "a;b")

        expect(passos).toEqual(["append", "click", "remove"])
        expect(a.download).toBe("transacoes-2026-11-07.csv")
        expect(revoke).not.toHaveBeenCalled()
        vi.advanceTimersByTime(59_999)
        expect(revoke).not.toHaveBeenCalled()
        vi.advanceTimersByTime(1)
        expect(revoke).toHaveBeenCalledWith("blob:x")
    })
})
