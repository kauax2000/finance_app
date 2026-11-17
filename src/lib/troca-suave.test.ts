import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = semComentarios(lerFonte("src/lib/troca-suave.tsx"))

describe("a forma título gira como um tambor", () => {
    it("o novo vem de baixo e o de antes sai pelo alto, tombando", () => {
        expect(fonte).toContain('const TITULO_ABAIXO = { opacity: 0, y: "100%", rotateX: -60, filter: "blur(2px)", transformPerspective: 400 }')
        expect(fonte).toContain('const TITULO_ACIMA = { opacity: 0, y: "-100%", rotateX: 60, filter: "blur(2px)", transformPerspective: 400 }')
        expect(fonte).toContain("const TROCA_DO_TITULO = { duration: 0.3, ease: [0.16, 1, 0.3, 1] } as const")
    })
    it("a saída usa o mesmo tempo da chegada", () => {
        expect(fonte).toContain("{ ...TITULO_ACIMA, transition: TROCA_DO_TITULO }")
    })
})
