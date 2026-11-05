import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

const pagina = semComentarios(lerFonte("src/app/(app)/members/page-client.tsx"))
const pessoas = semComentarios(lerFonte("src/components/members/pessoas-secao.tsx"))
const convites = semComentarios(lerFonte("src/components/members/convites-pendentes-secao.tsx"))

describe("Membros no layout A", () => {
    it("o topo convida pelo diálogo e recarrega ao fechar", () => {
        expect(pagina).toContain("<WorkspaceInviteDialog")
        expect(pagina).toContain("Convidar pessoa")
        expect(pagina).toMatch(/if \(!aberto\) void fetchMembersAndInvites\(\)/)
    })

    it("as três seções, com as âncoras das outras jornadas", () => {
        for (const s of ["<PessoasSecao", "<ConvitesPendentesSecao", "<LimitesSecao", 'id="limites"', 'id="workspace-invites"']) {
            expect(pagina).toContain(s)
        }
        expect(pagina.indexOf("<ConvitesPendentesSecao")).toBeLessThan(pagina.indexOf("<LimitesSecao"))
    })

    it("saem o formulário, o link e os wireframes", () => {
        for (const s of ["PapelDoConviteWireframe", "TrocarPapelWireframe", "LimitesWireframe", "Gerar link de convite", "Apenas o owner"]) {
            expect(pagina).not.toContain(s)
        }
    })

    it("o ⋯ da pessoa só para o dono, nunca na linha do dono nem na própria", () => {
        expect(pessoas).toContain('podeGerenciar && pessoa.role !== "owner" && pessoa.user_id !== meuUserId')
        for (const s of ["Tornar convidado", "Tornar membro", "Remover da carteira"]) expect(pessoas).toContain(s)
    })

    it("o ⋯ do convite reenvia, gera um novo link e cancela", () => {
        for (const s of ["Reenviar", "Gerar novo link", "Cancelar convite", "Nenhum convite pendente"]) expect(convites).toContain(s)
        expect(convites).not.toContain("Copiar link")
    })
})
