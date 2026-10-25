import { describe, expect, it } from "vitest"

import { parseEdgeFunctionError } from "@/lib/edge-errors"
import { lerFonte, semComentarios } from "@/test/fonte"
import {
    destinoDoInsightDeLimite,
    ERRO_DO_CONVITE,
    montarConvite,
    podeGerenciarMembros,
    rotuloDoPapel,
} from "./papeis"

describe("papéis", () => {
    it("o rótulo de cada papel", () => {
        expect(["owner", "member", "guest"].map((r) => rotuloDoPapel(r as "owner"))).toEqual(["Dono", "Membro", "Convidado"])
    })

    it("só o dono gerencia membros", () => {
        expect(podeGerenciarMembros("owner")).toBe(true)
        expect(podeGerenciarMembros("member")).toBe(false)
        expect(podeGerenciarMembros("guest")).toBe(false)
        expect(podeGerenciarMembros(null)).toBe(false)
    })

    it("o Ver limite: o adulto vai aos limites de Membros, o convidado ao Painel", () => {
        expect(destinoDoInsightDeLimite("owner")).toBe("/members#limites")
        expect(destinoDoInsightDeLimite("member")).toBe("/members#limites")
        expect(destinoDoInsightDeLimite("guest")).toBe("/dashboard")
        expect(destinoDoInsightDeLimite(null)).toBe("/dashboard")
    })
})

describe("montarConvite", () => {
    const base = { role: "member", menor: false, consentimento: false, email: " Ana@Ex.com " }

    it("o convite de membro por e-mail, normalizado", () => {
        expect(montarConvite(base)).toEqual({
            ok: true,
            corpo: { role: "member", menor: false, consentimento: false, invited_email: "ana@ex.com" },
        })
    })

    it("o link é de membro", () => {
        expect(montarConvite({ ...base, email: null })).toEqual({
            ok: true,
            corpo: { role: "member", menor: false, consentimento: false, invite_kind: "link" },
        })
    })

    it("recusa o que a Edge recusa, com o mesmo código", () => {
        expect(montarConvite({ ...base, role: "owner" })).toEqual({ ok: false, erro: "role inválido" })
        expect(montarConvite({ ...base, role: "guest", email: null })).toEqual({ ok: false, erro: "convidado_requer_email" })
        expect(montarConvite({ ...base, role: "guest", email: "  " })).toEqual({ ok: false, erro: "convidado_requer_email" })
        expect(montarConvite({ ...base, menor: true, consentimento: true })).toEqual({ ok: false, erro: "menor_requer_convidado" })
        expect(montarConvite({ ...base, role: "guest", menor: true })).toEqual({ ok: false, erro: "consentimento_obrigatorio" })
    })

    it("o menor convidado com o consentimento", () => {
        expect(montarConvite({ ...base, role: "guest", menor: true, consentimento: true })).toEqual({
            ok: true,
            corpo: { role: "guest", menor: true, consentimento: true, invited_email: "ana@ex.com" },
        })
    })

    it("os códigos são os da Edge, e a tela os traduz", () => {
        const edge = semComentarios(lerFonte("supabase/functions/workspace-invites-create/index.ts"))
        for (const codigo of Object.keys(ERRO_DO_CONVITE)) {
            expect(edge).toContain(`error: '${codigo}'`)
            expect(parseEdgeFunctionError(JSON.stringify({ error: codigo }), "x")).toBe(
                ERRO_DO_CONVITE[codigo as keyof typeof ERRO_DO_CONVITE],
            )
        }
    })
})
