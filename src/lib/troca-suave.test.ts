import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = semComentarios(lerFonte("src/lib/troca-suave.tsx"))

describe("a forma título troca como o título da barra do telefone", () => {
    it("6px para cima, o desfoque blur-xs e 200ms em --ease-out", () => {
        expect(fonte).toContain('const TITULO_ABAIXO = { opacity: 0, y: 6, filter: "blur(4px)" }')
        expect(fonte).toContain('const TITULO_ACIMA = { opacity: 0, y: -6, filter: "blur(4px)" }')
        expect(fonte).toContain("const TROCA_DO_TITULO = { duration: 0.2, ease: [0.16, 1, 0.3, 1] } as const")
    })
    it("a saída usa o mesmo tempo da chegada, como as duas metades da barra", () => {
        expect(fonte).toContain("{ ...TITULO_ACIMA, transition: TROCA_DO_TITULO }")
    })
})
