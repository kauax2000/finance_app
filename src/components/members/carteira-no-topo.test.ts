import { describe, expect, it, vi } from "vitest"

// A lista de Pessoas puxa o Supabase (o perfil); a conta não precisa dele.
vi.mock("@/components/members/pessoas-secao", () => ({ memberDisplayName: () => "" }))

import { rotuloDePessoas } from "@/components/members/carteira-no-topo"
import { lerFonte, semComentarios } from "@/test/fonte"

describe("o cartão da carteira no topo de Membros", () => {
    it("conta as pessoas no singular e no plural", () => {
        expect(rotuloDePessoas(1)).toBe("1 pessoa")
        expect(rotuloDePessoas(2)).toBe("2 pessoas")
        expect(rotuloDePessoas(0)).toBe("0 pessoas")
    })

    it("o ladrilho é o do seletor, a pilha é o AvatarGroup, e nada dentro se clica", () => {
        const fonte = semComentarios(lerFonte("src/components/members/carteira-no-topo.tsx"))
        expect(fonte).toContain("<WorkspaceBrandMark")
        expect(fonte).toContain("<AvatarGroup")
        expect(fonte).toContain("<AvatarGroupItem")
        expect(fonte).not.toContain("<Button")
        expect(fonte).not.toMatch(/\binteractive\b|onClick|href=/)
    })
})

describe("Membros no telefone", () => {
    const pagina = semComentarios(lerFonte("src/app/(app)/members/page-client.tsx"))
    const header = semComentarios(lerFonte("src/components/layout/app-header.tsx"))

    it("o botão largo sai; a carteira abre a tela e o convite vai para a barra", () => {
        expect(pagina).not.toContain('botaoConvidar("w-full")')
        expect(pagina).toMatch(/isMobile \? \(\s*currentWorkspace \? <CarteiraNoTopo/)
        expect(pagina).toContain("usePageChromeAction(() => setConvidarAberto(true), canManageMembers)")
    })

    it("a barra desenha um botão só, preenchido, no lugar da lupa, pela rota e pelo papel", () => {
        expect(header).toContain("mobileHeaderActionFor(pathname, ehDono)")
        const convite = header.slice(header.indexOf("const botaoConvidar"), header.indexOf("return (\n        <TopBar"))
        expect(convite).toContain('variant="primary"')
        expect(convite).toContain('size="icon-lg"')
        expect(convite).toContain('aria-label="Convidar pessoa"')
        expect(convite).toContain("<UserPlusIcon")
        expect(header).toMatch(/phone=\{\s*botaoConvidar \?\? \(\s*<TopBarActionGroup\s+morph/)
    })
})
