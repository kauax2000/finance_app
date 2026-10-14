import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

/**
 * Com o Auth fora do ar, um pedido pendurado prende o `getSession()` (o auth-js
 * não põe teto por pedido e segura um lock), e a abertura girava para sempre.
 */
describe("a abertura não gira para sempre", () => {
    it("o AuthProvider sai do carregamento mesmo quando o getSession falha", () => {
        const fonte = semComentarios(lerFonte("src/components/providers.tsx"))
        expect(fonte).toMatch(/\}\)\.catch\(\(\) => \{\s*setSession\(null\)\s*setUser\(null\)/)
    })

    it("depois do teto, a abertura troca a roda por Tentar novamente", () => {
        const fonte = semComentarios(lerFonte("src/components/layout/app-bootstrap-screen.tsx"))
        expect(fonte).toContain("STALL_MS = 15_000")
        expect(fonte).toContain('iconMotion="spin"')
        expect(fonte).toContain("Tentar novamente")
        expect(fonte).toContain("window.location.reload()")
    })
})
