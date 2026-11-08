import { afterEach, describe, expect, it, vi } from "vitest"
import { downloadCsv, pedirDestinoDoCsv, salvarCsv } from "./csv"

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

describe("pedirDestinoDoCsv e salvarCsv", () => {
    afterEach(() => vi.unstubAllGlobals())

    it("sem o seletor do navegador, cai no download", async () => {
        vi.stubGlobal("showSaveFilePicker", undefined)
        expect(await pedirDestinoDoCsv("x.csv")).toBe("download")
    })

    it("cancelar o Salvar como devolve null; outro erro cai no download", async () => {
        vi.stubGlobal("showSaveFilePicker", () => Promise.reject(Object.assign(new Error("x"), { name: "AbortError" })))
        expect(await pedirDestinoDoCsv("x.csv")).toBeNull()
        vi.stubGlobal("showSaveFilePicker", () => Promise.reject(Object.assign(new Error("x"), { name: "SecurityError" })))
        expect(await pedirDestinoDoCsv("x.csv")).toBe("download")
    })

    it("com o destino escolhido, grava e fecha antes de resolver", async () => {
        const passos: string[] = []
        const destino = {
            createWritable: async () => ({
                write: async () => void passos.push("write"),
                close: async () => void passos.push("close"),
            }),
        } as unknown as FileSystemFileHandle
        vi.stubGlobal("showSaveFilePicker", async () => destino)
        const d = await pedirDestinoDoCsv("x.csv")
        expect(d).toBe(destino)
        await salvarCsv(d as FileSystemFileHandle, "x.csv", "a;b")
        expect(passos).toEqual(["write", "close"])
    })

    it("se gravar no destino falhar, o download de sempre assume", async () => {
        const passos: string[] = []
        vi.stubGlobal("document", {
            createElement: () => ({ click: () => passos.push("click"), remove: () => {} }),
            body: { appendChild: () => passos.push("append") },
        })
        vi.stubGlobal("URL", { createObjectURL: () => "blob:x", revokeObjectURL: () => {} })
        vi.spyOn(console, "error").mockImplementation(() => {})
        const destino = { createWritable: () => Promise.reject(new Error("NotAllowed")) } as unknown as FileSystemFileHandle
        await salvarCsv(destino, "x.csv", "a;b")
        expect(passos).toEqual(["append", "click"])
    })
})
