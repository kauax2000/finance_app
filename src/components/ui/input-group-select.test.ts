import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const GRUPO = semComentarios(lerFonte("src/components/ui/input-group.tsx"))

describe("InputGroupSelect", () => {
    it("é o Select do app, não um <select> nativo, e acende o anel do grupo", () => {
        expect(GRUPO).toMatch(/function InputGroupSelect[\s\S]*?<Select\b[\s\S]*?<SelectTrigger[\s\S]*?data-slot="input-group-control"/)
        expect(GRUPO).not.toMatch(/<select\b/)
    })

    it("o InputGroupInput aceita o dinheiro do Input", () => {
        expect(GRUPO).toContain("(InputBaseProps | InputMoneyProps)")
        expect(GRUPO).toMatch(/if \(todas\.money\)/)
    })
})
