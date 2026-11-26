import { describe, expect, it, vi } from "vitest"

// A lista de Pessoas puxa o Supabase (o perfil); a conta não precisa dele.
vi.mock("@/components/members/pessoas-secao", () => ({ memberDisplayName: () => "" }))

import { rotuloDePessoas } from "@/components/members/carteira-no-topo"
import { lerFonte, semComentarios } from "@/test/fonte"

describe("a carteira no topo de Membros", () => {
    const fonte = semComentarios(lerFonte("src/components/members/carteira-no-topo.tsx"))

    it("conta as pessoas no singular e no plural", () => {
        expect(rotuloDePessoas(1)).toBe("1 pessoa")
        expect(rotuloDePessoas(2)).toBe("2 pessoas")
        expect(rotuloDePessoas(0)).toBe("0 pessoas")
    })

    it("centrada e sem moldura: o maior ladrilho, o nome em H3, a pilha e a contagem", () => {
        expect(fonte).toContain("items-center")
        expect(fonte).toContain("text-center")
        expect(fonte).not.toMatch(/<Card\b|<Item\b/)
        expect(fonte).toMatch(/<WorkspaceBrandMark[^>]*size="2xl"/)
        expect(fonte).toMatch(/<H3 asChild[^>]*>\s*<p>\{carteira\.name\}<\/p>/)
        expect(fonte).toContain("<AvatarGroup")
        expect(fonte).toContain("<AvatarGroupItem")
        expect(fonte).toContain("{rotuloDePessoas(pessoas.length)}")
    })

    it("o convite é o secundário de tamanho padrão, e só existe com `onConvidar`", () => {
        expect(fonte).toMatch(/onConvidar \? \(\s*<Button type="button" variant="secondary"[^>]*onClick=\{onConvidar\}>/)
        expect(fonte).not.toMatch(/<Button[^>]*\bsize=/)
        expect(fonte).toContain("<UserPlusIcon aria-hidden />")
        expect(fonte).toContain("Convidar pessoa")
    })
})

describe("Membros no telefone", () => {
    const pagina = semComentarios(lerFonte("src/app/(app)/members/page-client.tsx"))
    const header = semComentarios(lerFonte("src/components/layout/app-header.tsx"))

    it("a carteira abre a tela, e só o dono recebe o convite dentro dela", () => {
        expect(pagina).toMatch(/isMobile \? \(\s*currentWorkspace \? \(\s*<CarteiraNoTopo/)
        expect(pagina).toContain("onConvidar={canManageMembers ? () => setConvidarAberto(true) : undefined}")
        expect(pagina).not.toContain("usePageChromeAction")
    })

    it("a barra volta à lupa de sempre: nenhum convite nela", () => {
        expect(header).not.toMatch(/mobileHeaderActionFor|usePageChromeActionFor|botaoConvidar|UserPlusIcon/)
        expect(header).toMatch(/<TopBarActionGroup trailingKey=\{filtro\?\.icon\} end=\{menu\}>\s*\{lupa\(true\)\}\s*\{filtroNoCabecalho\}/)
    })
})
