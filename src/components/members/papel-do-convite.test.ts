import { describe, expect, it } from "vitest"

import { montarConvite } from "@/lib/papeis/papeis"
import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = semComentarios(lerFonte("src/components/members/papel-do-convite.tsx"))
const dialogo = semComentarios(lerFonte("src/components/members/workspace-invite-dialog.tsx"))

describe("PapelDoConvite", () => {
    it("RadioGroup com membro e convidado", () => {
        expect(fonte).toContain("<RadioGroup")
        expect(fonte).toMatch(/<RadioGroupItem[^>]*value="member"/)
        expect(fonte).toMatch(/<RadioGroupItem[^>]*value="guest"/)
        for (const t of ["Membro", "Convidado", "Vê e lança tudo da casa", "Lança e vê só o que é dele"]) {
            expect(fonte).toContain(t)
        }
    })

    it("menor só com convidado, consentimento só com menor, e a troca zera o consentimento", () => {
        expect(fonte).toMatch(/valor\.role === "guest" \? \(/)
        expect(fonte).toMatch(/valor\.menor \? \(/)
        expect(fonte).toContain("É menor de idade")
        expect(fonte).toContain("Sou o responsável legal e autorizo o uso do app (LGPD, art. 14).")
        expect(fonte).toMatch(/menor: [^,]+, consentimento: false/)
        expect(fonte).toContain("O link de convite é sempre de membro.")
    })

    it("sem wireframe, e o diálogo usa o componente", () => {
        expect(fonte).not.toContain("@/components/wireframe")
        expect(dialogo).toContain("<PapelDoConvite")
        expect(dialogo).not.toContain("PapelDoConviteWireframe")
    })

    it("menor sem consentimento é recusado", () => {
        expect(montarConvite({ role: "guest", menor: true, consentimento: false, email: "a@b.com" })).toEqual({
            ok: false,
            erro: "consentimento_obrigatorio",
        })
    })
})
