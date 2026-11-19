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

describe("a grade espera os números do mês", () => {
    it("até o mês carregar mostra o esqueleto, e não o vazio", () => {
        const f = semComentarios(lerFonte("src/app/(app)/categories/page-client.tsx"), "tudo")
        expect(f).toMatch(/const numerosProntos = mesCarregado === budgetMonthYm/)
        expect(f).toMatch(/setMesCarregado\(budgetMonthYm\)/)
        expect(f.match(/!numerosProntos \? \(\s*<CategoriesGridLoading \/>/g)?.length).toBe(2)
    })

    it("sem contagem na barra; a ordem fica parada ao trocar de mês", () => {
        const f = semComentarios(lerFonte("src/app/(app)/categories/page-client.tsx"), "tudo")
        expect(f).not.toContain("CategoriasDoMesCabecalho")
        expect(f).not.toContain("contagem=")
        expect(f).toMatch(/const mostrarOrdem = \(filterType === "income" \? incomeCategories : expenseFiltered\)\.length > 0/)
        expect(f).toMatch(/ordem=\{\s*mostrarOrdem \?/)
        expect(f).toContain("compacta={isMobile}")
    })

    it("o sentido vai à divisão do mês e trocar o critério o zera", () => {
        const f = semComentarios(lerFonte("src/app/(app)/categories/page-client.tsx"), "tudo")
        expect(f).toContain("const [invertida, setInvertida] = useState(false)")
        expect(f.match(/criterio,\s*invertida,\s*\)/g)?.length).toBe(2)
        expect(f).toMatch(/onCriterioChange=\{\(c\) => \{\s*setCriterio\(c\)\s*setInvertida\(false\)/)
        expect(f).toContain("onInvertidaChange={setInvertida}")
    })
})
