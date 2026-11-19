import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

describe("o cabeçalho de Categorias", () => {
    const f = semComentarios(lerFonte("src/app/(app)/categories/page-client.tsx"), "tudo")
    const esq = semComentarios(lerFonte("src/components/categories/categories-page-grid-skeleton.tsx"), "tudo")

    it("abre com PageHeader collapse e o título escondido do leitor, só fora do telefone", () => {
        expect(f).toMatch(/isMobile \? null : \(\s*<PageHeader collapse>/)
        expect(f).toMatch(/<PageHeaderTitle asChild>[\s\S]{0,80}?<p aria-hidden="true">Categorias<\/p>/)
    })

    it("Nova categoria mora no cabeçalho, primária, só para quem escreve", () => {
        expect(f).toMatch(/podeEscrever \? \(\s*<PageHeaderActions>[\s\S]*?variant="tertiary"[\s\S]*?Nova categoria/)
    })

    it("a barra só cria categoria no telefone", () => {
        expect(f).toMatch(/onNewCategory=\{podeEscrever && isMobile \? \(\) => openDialog\(\) : undefined\}/)
    })

    it("o esqueleto tem o osso do cabeçalho, escondido no telefone", () => {
        expect(esq).toContain('<PageHeaderSkeleton description={false} actions={1} className="max-md:hidden" />')
    })

    it("o seletor de mês do telefone some do md em diante, mesmo com className de quem chama", () => {
        const t = semComentarios(lerFonte("src/components/categories/categories-toolbar.tsx"), "tudo")
        expect(t).toContain('cn(className, "md:hidden")')
    })

    it("o mês vale nas duas abas", () => {
        expect(f).not.toContain('enabled: filterType === "expense"')
        expect(f).not.toContain('showMonthControls={filterType === "expense"}')
    })

    it("a receita recebe o mês", () => {
        expect(f).toContain("receitasDoMesPorCategoria(")
        expect(f).toContain("recebido={")
    })

    it("a tela não tem o assistente de primeiro uso", () => {
        const bruto = lerFonte("src/app/(app)/categories/page-client.tsx")
        expect(bruto).not.toContain("CategoriesOnboarding")
        expect(bruto).not.toContain("showOnboarding")
        expect(bruto).not.toContain("categories_onboarding_completed_at")
    })
})
