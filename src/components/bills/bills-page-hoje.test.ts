import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const pagina = semComentarios(lerFonte("src/app/(app)/bills/page-client.tsx"))

describe("o hoje da tela de contas", () => {
    it("não nasce congelado num useMemo com dependência vazia", () => {
        expect(pagina).not.toMatch(/useMemo\(\s*\(\)\s*=>\s*localYmdFromDate\(new Date\(\)\),\s*\[\]\s*\)/)
        expect(pagina).toContain("useHojeYmd()")
    })

    it("o hook volta a ler o dia no foco da janela e na virada", () => {
        const hook = semComentarios(lerFonte("src/hooks/use-hoje-ymd.ts"))
        expect(hook).toContain('addEventListener("focus"')
        expect(hook).toContain("setTimeout(")
        expect(hook).toContain('addEventListener("visibilitychange"')
    })
})
