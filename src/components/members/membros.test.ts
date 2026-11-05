import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

const pagina = semComentarios(lerFonte("src/app/(app)/members/page-client.tsx"))
const pessoas = semComentarios(lerFonte("src/components/members/pessoas-secao.tsx"))
const convites = semComentarios(lerFonte("src/components/members/convites-pendentes-secao.tsx"))

describe("Membros no layout A", () => {
    it("o topo convida pelo diálogo e recarrega ao fechar", () => {
        expect(pagina).toContain("<WorkspaceInviteDialog")
        expect(pagina).toContain("Convidar pessoa")
        expect(pagina).toMatch(/if \(!aberto\) void recarregar\(\)/)
    })

    it("a tela lê um pacote só, com cache, e abre inteira", () => {
        expect(pagina).toContain("fetchMembersPageBundle(currentWorkspaceId!, user)")
        expect(pagina).toContain("membersPageBundleKeys.bundle(")
        expect(pagina).toContain("staleTime: 60_000")
        expect(pagina).toContain("queryClient.invalidateQueries({")
        expect(pagina).toMatch(/if \(bundleQuery\.isPending\) \{\s*return <Loading \/>/)
        expect(pagina).not.toContain("useState<MemberWithProfile[]>")
        expect(pagina).not.toMatch(/\.from\("workspace_invites"\)\s*\.select/)
        expect(pagina).toContain("onMudou={recarregar}")
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

    it("o ⋯ está em toda linha: na própria edita o perfil, nas outras só o dono gerencia, e sem ação o lugar fica reservado", () => {
        expect(pessoas).toContain("const minha = pessoa.user_id === meuUserId")
        expect(pessoas).toContain('podeGerenciar && pessoa.role !== "owner"')
        expect(pessoas).toContain("Editar perfil")
        expect(pessoas).toContain("<EditProfileDialog open={editarAberto}")
        expect(pessoas).toContain('<span aria-hidden className="size-8 shrink-0 pointer-coarse:size-11" />')
        for (const s of ["Tornar convidado", "Tornar membro", "Remover da carteira"]) expect(pessoas).toContain(s)
    })

    it("o ⋯ do convite reenvia e cancela, e o link não é um convite pendente", () => {
        for (const s of ["Reenviar", "Revogar convite", "Nenhum convite pendente"]) expect(convites).toContain(s)
        expect(convites).not.toContain("Cancelar convite")
        expect(convites).not.toContain("rounded-row")
        expect(pagina).toContain("Revogar o convite?")
        expect(convites).not.toContain("Copiar link")
        expect(convites).not.toContain("Gerar novo link")
        expect(pagina).toContain("invites.filter((i) => i.invited_email != null)")
    })

    it("os vazios moram dentro do Card, não soltos", () => {
        expect(convites).not.toContain("<Muted")
        expect(convites).toMatch(/<Card padding="none">\s*<Item[^>]*>\s*<ItemContent>\s*<ItemDescription>Nenhum convite pendente/)
    })
})
