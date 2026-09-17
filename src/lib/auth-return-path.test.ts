import { describe, expect, it } from "vitest"

import { getSafeInternalNextPath } from "@/lib/auth-return-path"

/**
 * Esta função é a **única** defesa do app contra redirecionamento aberto, e até
 * aqui não tinha teste nenhum. O valor que ela devolve vai direto para
 * `router.push()` depois do login e do cadastro — quem a convencer a devolver
 * um destino externo leva embora quem acabou de entrar.
 */
describe("getSafeInternalNextPath", () => {
    it("aceita caminho interno, com e sem query", () => {
        expect(getSafeInternalNextPath("/dashboard")).toBe("/dashboard")
        expect(getSafeInternalNextPath("/invites/accept?token=abc")).toBe(
            "/invites/accept?token=abc",
        )
        // O espaço em volta é ruído de URL, não intenção.
        expect(getSafeInternalNextPath("  /transactions  ")).toBe("/transactions")
    })

    it("recusa o que não é caminho", () => {
        expect(getSafeInternalNextPath(null)).toBeNull()
        expect(getSafeInternalNextPath("")).toBeNull()
        expect(getSafeInternalNextPath("dashboard")).toBeNull()
        expect(getSafeInternalNextPath("https://exemplo.com")).toBeNull()
    })

    it("recusa as formas que viram destino externo", () => {
        // `//host` é URL relativa a protocolo: o navegador sai do domínio.
        expect(getSafeInternalNextPath("//exemplo.com/roubo")).toBeNull()
        // A barra invertida é normalizada para `/` por vários navegadores.
        expect(getSafeInternalNextPath("/\\exemplo.com")).toBeNull()
        expect(getSafeInternalNextPath("/redir?u=http://exemplo.com")).toBeNull()
        expect(getSafeInternalNextPath("/http:evil")).toBeNull()
    })

    it("recusa esquema executável", () => {
        expect(getSafeInternalNextPath("/javascript:alert(1)")).toBeNull()
        expect(getSafeInternalNextPath("/JavaScript:alert(1)")).toBeNull()
        expect(getSafeInternalNextPath("/data:text/html,<script>")).toBeNull()
    })

    it("recusa quebra de linha e nulo, que partem cabeçalho", () => {
        expect(getSafeInternalNextPath("/a\nSet-Cookie: x")).toBeNull()
        expect(getSafeInternalNextPath("/a\r\n/b")).toBeNull()
        expect(getSafeInternalNextPath("/a\0b")).toBeNull()
    })

    it("recusa caminho absurdamente longo", () => {
        expect(getSafeInternalNextPath(`/${"a".repeat(4096)}`)).toBeNull()
    })
})
