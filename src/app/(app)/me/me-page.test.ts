import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const PAGINA = semComentarios(lerFonte("src/app/(app)/me/page-client.tsx"))
const ROTA = semComentarios(lerFonte("src/app/(app)/me/page.tsx"))

describe("a página Você", () => {
    it("adia a montagem com o esqueleto da rota", () => {
        expect(ROTA).toContain("<AdiarMontagem fallback={<Loading />}>")
    })
    it("os grupos vêm da regra e das abas que saíram", () => {
        expect(PAGINA).toContain("getVoceGroups(useAbasFora())")
        expect(PAGINA).toContain('<VoceAvatar size="xl" />')
    })
    it("cada linha é um link com ícone mini, nome e chevron", () => {
        expect(PAGINA).toContain("<ItemChevron")
        expect(PAGINA).toContain("miniIconFor(")
        // Nenhum componente declarado na tela (invariante 1): só o default export.
        expect(PAGINA.match(/function \w+\(/g)).toHaveLength(1)
    })
})
