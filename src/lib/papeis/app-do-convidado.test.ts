import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

/** O app do convidado (Bloco 7A, Tarefa 5): o que a tela tranca pela fonte. */
const fonte = (arquivo: string) => semComentarios(lerFonte(arquivo), "tudo")

describe("o Painel pelo papel", () => {
    const escolha = fonte("src/components/dashboard/painel-por-papel.tsx")
    const rota = fonte("src/app/(app)/dashboard/page.tsx")

    it("o Painel da casa entra como filho da escolha, e não direto na rota", () => {
        expect(rota).toMatch(/<PainelPorPapel>\s*<DashboardPageClient \/>\s*<\/PainelPorPapel>/)
    })

    it("o convidado e o papel a caminho saem antes do Painel da casa", () => {
        const convidado = escolha.indexOf('if (papel === "guest") return <ConvidadoPainelWireframe />')
        const esperando = escolha.indexOf("if (papel === null && loading) return <DashboardPageSkeleton />")
        const casa = escolha.indexOf("return children")
        expect(convidado).toBeGreaterThan(-1)
        expect(esperando).toBeGreaterThan(convidado)
        expect(casa).toBeGreaterThan(esperando)
        // A régua é o papel: `!isAdulto` mandaria o adulto sem carteira ao esqueleto para sempre.
        expect(escolha).not.toContain("isAdulto")
    })

    it("o page-client do Painel não escolhe por papel (um componente só no arquivo)", () => {
        const cliente = fonte("src/app/(app)/dashboard/page-client.tsx")
        expect(cliente).not.toContain("ConvidadoPainelWireframe")
        expect(cliente.match(/\bfunction [A-Z]\w*\(/g)).toEqual(["function DashboardPageClient("])
    })
})

describe("as chamadas da casa só com o adulto", () => {
    it("garantir os orçamentos do mês", () => {
        const f = fonte("src/hooks/use-garantir-orcamentos-do-mes.ts")
        expect(f).toContain("if (!workspaceId || !isAdulto) return")
        expect(f).toMatch(/\}, \[workspaceId, queryClient, isAdulto\]\)/)
    })

    it("registrar o seguro baixo", () => {
        const f = fonte("src/lib/insights/use-insights.ts")
        expect(f).toContain("if (!workspaceId || !dados || !isAdulto) return")
        expect(f).toMatch(/\}, \[workspaceId, dados, aoRegistrar, isAdulto\]\)/)
        // É a única chamada do cliente ao registrar_insight.
        expect(f.match(/rpc\("registrar_insight"/g)).toHaveLength(1)
    })
})

describe("só leitura para quem não é adulto (Ruling 8)", () => {
    it("Categorias: sem criar, editar, apagar nem o assistente", () => {
        const f = fonte("src/app/(app)/categories/page-client.tsx")
        expect(f).toContain("const podeEscrever = isAdulto")
        expect(f).toMatch(/const showOnboarding =\s*podeEscrever &&/)
        expect(f).toContain("onNewCategory={podeEscrever && isMobile ? () => openDialog() : undefined}")
        expect(f.match(/onEdit=\{podeEscrever \? \(\) => openDialog\(category\) : undefined\}/g)).toHaveLength(2)
        // O único `openDialog()` fora dos guardados é o do vazio, que mora dentro de `podeEscrever ? (`.
        const vazio = f.slice(f.indexOf("Criar primeira categoria") - 400, f.indexOf("Criar primeira categoria"))
        expect(vazio).toContain("{podeEscrever ? (")
    })

    it("o detalhe da categoria: sem editar nem excluir (e com eles, a folha do orçamento)", () => {
        const f = fonte("src/app/(app)/categories/[categoryId]/page-client.tsx")
        expect(f).toContain("onEdit={podeEscrever ? openEditDialog : undefined}")
        expect(f).toContain("onDelete={podeEscrever ? () => setDeleteDialogOpen(true) : undefined}")
    })

    it("os cartões da categoria e o herói escondem o menu sem as ações", () => {
        for (const arquivo of [
            "src/components/categories/expense-category-card.tsx",
            "src/components/categories/income-category-card.tsx",
            "src/components/categories/category-card-context-menu.tsx",
            "src/components/categories/detail/category-detail-hero.tsx",
        ]) {
            expect(fonte(arquivo), arquivo).toContain("onEdit && onDelete ? (")
        }
    })

    it("Cartões: sem cadastrar, sem o ?new=1, e o ladrilho não é link (Ruling 9)", () => {
        const f = fonte("src/app/(app)/credit-cards/page-client.tsx")
        expect(f).toContain("if (!podeEscrever) return")
        expect(f).toMatch(/\{podeEscrever \? \(\s*<ToolbarActions>/)
        expect(f).toContain("onAddCard={podeEscrever ? () => setCreateOpen(true) : undefined}")
        expect(f).toContain("somenteLeitura={!podeEscrever}")
        const tile = fonte("src/components/credit-cards/credit-card-tile.tsx")
        expect(tile).toMatch(/somenteLeitura \? \(\s*<Card inactive=\{!card\.is_active\} className="group">/)
    })

    it("o formulário de lançamento não cadastra categoria nem cartão", () => {
        const f = fonte("src/components/transactions/transaction-form-fields.tsx")
        expect(f).toContain('{isAdulto ? "Gerenciar categorias" : "Ver categorias"}')
        expect(f.match(/Cadastrar cartão/g)).toHaveLength(2)
        expect(f.match(/\{isAdulto \? \(/g)).toHaveLength(2)
    })
})

describe("o convidado só lança despesa (Ruling 11)", () => {
    it("a paleta tira a Nova receita do convidado", () => {
        const f = fonte("src/components/layout/app-command-palette.tsx")
        expect(f).toContain('todasAsAcoes.filter((a) => a.id === "expense" || a.id === "installment")')
        expect(f).not.toMatch(/a\.id === "income"/)
    })

    it("a tela de transações não tem botão de criar (o convidado cria pelo + Adicionar)", () => {
        // A tela de Transações não tem mais botão de criar: o convidado cria pelo + Adicionar, que abre a despesa.
        expect(fonte("src/app/(app)/transactions/page-client.tsx")).not.toContain("TransactionNewSplitButton")
    })

    it("o trilho do formulário esconde a Receita: na criação sai a aba, na edição sai o trilho", () => {
        const seg = fonte("src/components/transactions/transaction-type-segment.tsx")
        expect(seg).toContain('const abas = semReceita ? FORM_KIND_TABS.filter((t) => t.value !== "income") : FORM_KIND_TABS')
        expect(seg).toMatch(/\{abas\.map\(\(t\) =>/)
        const campos = fonte("src/components/transactions/transaction-form-fields.tsx")
        expect(campos).toContain('const semReceita = useWorkspace().papel === "guest"')
        expect(campos).toContain('if (segmentMode === "edit" && (hasInstallmentPlan || semReceita)) return null')
        expect(campos).toContain("<TransactionFormKindSegment value={formKind} onChange={setFormKind} semReceita={semReceita} />")
    })

    it("toda porta de receita (paleta, ?new=receita, casca) abre o formulário do convidado em despesa", () => {
        const f = fonte("src/components/transactions/transaction-form-use.tsx")
        expect(f).toContain('papel === "guest" && defaultLaunchKind === "income" ? "expense" : defaultLaunchKind')
        expect(f).toContain("formKind: kindInicial,")
        expect(f).toContain('type: kindInicial === "income" ? "income" : "expense",')
        expect(f).toMatch(/\}, \[active, editingTransaction, kindInicial[,\]]/)
    })
})
