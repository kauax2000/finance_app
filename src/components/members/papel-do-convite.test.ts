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
        for (const t of ["Membro", "Convidado", "Vê e lança tudo da casa", "Lança e vê só o seu"]) {
            expect(fonte).toContain(t)
        }
    })

    it("não pergunta de menor de idade", () => {
        expect(fonte).not.toMatch(/menor de idade|responsável legal|Checkbox/)
        expect(fonte).not.toContain("sempre de membro")
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
