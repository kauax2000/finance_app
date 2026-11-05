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

describe("montarConvite: os ramos da ordem da Edge", () => {
    it("o consentimento sem menor não vai no corpo, e o convidado sem e-mail recusa antes do consentimento", () => {
        const r = montarConvite({ role: "guest", menor: false, consentimento: true, email: "a@b.c" })
        expect(r.ok && r.corpo.consentimento).toBe(false)
        expect(montarConvite({ role: "guest", menor: true, consentimento: false, email: null })).toEqual({
            ok: false,
            erro: "convidado_requer_email",
        })
    })
})

describe("fonte das telas de papéis e limites", () => {
    const wf = semComentarios(lerFonte("src/components/wireframe/papeis-wireframe.tsx"))
    const pagina = semComentarios(lerFonte("src/app/(app)/members/page-client.tsx"))
    const dialogo = semComentarios(lerFonte("src/components/members/workspace-invite-dialog.tsx"))
    const limites = semComentarios(lerFonte("src/components/wireframe/limites-wireframe.tsx"))

    it("o consentimento tem o texto exato da LGPD", () => {
        expect(semComentarios(lerFonte("src/components/members/papel-do-convite.tsx"))).toContain("Sou o responsável legal e autorizo o uso do app (LGPD, art. 14).")
    })

    it("trocar_papel com os três parâmetros da RPC", () => {
        expect(wf).toMatch(
            /supabase\.rpc\("trocar_papel", \{\s*p_workspace_id: workspaceId,\s*p_user_id: userId,\s*p_role: novo,\s*\}\)/,
        )
    })

    it("a troca de papel só para o dono, nunca na linha do dono nem na própria", () => {
        expect(pagina).toMatch(/\{canManageMembers && !isOwner && !isMe \? \(\s*<TrocarPapelWireframe/)
        expect(pagina.match(/<TrocarPapelWireframe/g)).toHaveLength(1)
        expect(pagina).toContain('const isOwner = member.role === "owner"')
        expect(pagina).toContain("const isMe = Boolean(user?.id === member.user_id)")
    })

    it("o link vai sem papel; o convite por e-mail passa por montarConvite", () => {
        for (const f of [pagina, dialogo]) {
            const link = f.slice(f.indexOf("const handleCreateLinkInvite"), f.indexOf("const copyPersistedLink"))
            expect(link).toMatch(/body: \{\s*workspace_id: \w+,\s*invite_kind: "link",\s*\}/)
            expect(link).not.toMatch(/role|montarConvite|papelDoConvite/)
            expect(f).toContain("montarConvite({ ...papelDoConvite, email: inviteEmail })")
            expect(f).toMatch(/body: \{ workspace_id: \w+, \.\.\.convite\.corpo \}/)
        }
    })

    it("#limites só para o adulto, e só o dono edita", () => {
        expect(pagina).toMatch(/\{isAdulto \? \(\s*<div\s+id="limites"/)
        expect(pagina).toContain("podeEditar={canManageMembers}")
        expect(limites).toMatch(/\{podeEditar \? \(\s*<form onSubmit=\{salvar\}/)
        expect(limites).toContain("lerLimiteDigitado(valor)")
        expect(limites).not.toContain('type="number"')
    })
})
