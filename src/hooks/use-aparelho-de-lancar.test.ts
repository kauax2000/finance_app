import { describe, expect, it } from "vitest"
import { aparelhoDeLancar, ehIphone } from "./use-aparelho-de-lancar"

describe("aparelhoDeLancar", () => {
    it("instalado decide antes da largura", () => {
        expect(aparelhoDeLancar({ celular: false, instalado: true, iphone: true })).toBe("iphone-instalado")
        expect(aparelhoDeLancar({ celular: true, instalado: true, iphone: true })).toBe("iphone-instalado")
        expect(aparelhoDeLancar({ celular: true, instalado: true, iphone: false })).toBe("android-instalado")
    })
    it("no navegador, a largura separa celular de computador", () => {
        expect(aparelhoDeLancar({ celular: true, instalado: false, iphone: true })).toBe("navegador-iphone")
        expect(aparelhoDeLancar({ celular: true, instalado: false, iphone: false })).toBe("navegador-android")
        expect(aparelhoDeLancar({ celular: false, instalado: false, iphone: false })).toBe("computador")
    })
})

describe("ehIphone", () => {
    it("só o iPhone", () => {
        expect(ehIphone("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe(true)
        expect(ehIphone("Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)")).toBe(false)
        expect(ehIphone("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe(false)
        expect(ehIphone("Mozilla/5.0 (Linux; Android 15; Pixel 9)")).toBe(false)
    })
})
