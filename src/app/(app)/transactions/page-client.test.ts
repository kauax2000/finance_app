import { existsSync } from "node:fs"
import { describe, expect, it, vi } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

// O teto mora junto da consulta, que abre o cliente do Supabase ao carregar.
vi.mock("@/lib/supabase", () => ({ supabase: {} }))
import { mensagemDaExportacao, nomeDoCsv } from "@/lib/transactions/exportar-csv"

const PAGINA = "src/app/(app)/transactions/page-client.tsx"
const fonte = (caminho: string) => semComentarios(lerFonte(caminho), "tudo")
const importa = (f: string, nome: string, de: string) =>
    new RegExp(`import\\s*\\{[^}]*\\b${nome}\\b[^}]*\\}\\s*from\\s*["']${de.replace(/[/.]/g, "\\$&")}["']`).test(f)

describe("a página de Transações (redesenho, Tarefa 12)", () => {
    const f = fonte(PAGINA)

    it("não importa wireframe nem o controlador antigo", () => {
        expect(f).not.toContain("@/components/wireframe/")
        expect(f).not.toContain("useTransactionsListController")
        expect(existsSync("src/components/wireframe/a-conferir-lista-wireframe.tsx")).toBe(false)
        expect(existsSync("src/components/wireframe/compartilhado-aviso-wireframe.tsx")).toBe(false)
    })

    it("não declara componente além da própria página", () => {
        const funcoes = [...f.matchAll(/function\s+([A-Z]\w*)/g)].map((m) => m[1])
        expect(funcoes).toEqual(["TransactionsPageClient"])
    })

    it("compõe as peças novas", () => {
        expect(importa(f, "useTransacoesDaTela", "@/components/transactions/use-transacoes-da-tela")).toBe(true)
        expect(importa(f, "TransacoesToolbar", "@/components/transactions/transacoes-toolbar")).toBe(true)
        expect(f).not.toContain("ResumoDasTransacoes")
        expect(importa(f, "AvisoAConferir", "@/components/transactions/aviso-a-conferir")).toBe(true)
        expect(importa(f, "TransacoesTabela", "@/components/transactions/transacoes-tabela")).toBe(true)
        expect(importa(f, "CompartilhadoAviso", "@/components/transactions/compartilhado-aviso")).toBe(true)
        expect(importa(f, "ImportarExtratoDialog", "@/components/transactions/importar/importar-extrato-dialog")).toBe(true)
        expect(f).not.toContain("transactions-table")
    })

    it("o cabeçalho tem Importar e Exportar, terciários, ao lado do título: criar mora no + Adicionar da barra lateral", () => {
        expect(f).toMatch(/<PageHeader collapse>/)
        expect(f).toMatch(/<PageHeaderTitle asChild>[\s\S]{0,80}?<p aria-hidden="true">Transações<\/p>/)
        expect(f).not.toContain("TransactionNewSplitButton")
        expect(f).toMatch(/convidado \? null : \(\s*<PageHeaderActions overflow="menu">/)
        const acoes = f.slice(f.indexOf("<PageHeaderActions"), f.indexOf("</PageHeaderActions>"))
        expect(acoes).toMatch(/<Button type="button" variant="secondary" onClick=\{\(\) => pedidos\.setImportar\(true\)\}>[\s\S]{0,140}?Importar/)
        expect(acoes).toMatch(/<Button type="button" variant="tertiary" onClick=\{\(\) => void exportar\(\)\} disabled=\{exportando\}>[\s\S]{0,140}?Exportar/)
        expect(acoes).not.toContain('variant="primary"')
        // A barra da lista não tem os botões: o ⋯ dela é só do telefone.
        const barra = fonte("src/components/transactions/transacoes-toolbar.tsx")
        expect(barra).not.toContain('variant="tertiary"')
    })

    it("o convidado não vê Importar nem Exportar no ⋯, nem o Confirmar todos (spec §12)", () => {
        expect(f).toContain("onImportar={convidado ? undefined :")
        expect(f).toContain("onExportar={convidado ? undefined :")
        expect(f).toContain("exportando={exportando}")
        expect(f).toContain("podeConfirmarTodos={!convidado}")
        const barra = fonte("src/components/transactions/transacoes-toolbar.tsx")
        expect(barra).toContain("onImportar?: () => void")
        expect(barra).toContain("onExportar?: () => void")
        expect(barra).toMatch(/\{onImportar \|\| onExportar \? \(\s*<div className="hidden shrink-0 max-md:flex">/)
        expect(barra).toMatch(/\{onImportar \? \(\s*<DropdownMenuItem onSelect=\{onImportar\}>/)
        expect(barra).toMatch(/\{onExportar \? \(\s*<DropdownMenuItem onSelect=\{onExportar\} disabled=\{exportando\}>/)
        const tabela = fonte("src/components/transactions/transacoes-tabela.tsx")
        expect(tabela).toContain("const { papel, currentWorkspaceId } = useWorkspace()")
        expect(tabela).toContain('const convidado = papel === "guest"')
        expect(tabela).toMatch(/\{convidado \? null : \(\s*<Button[\s\S]{0,140}?setImportar\(true\)\}>\s*Importar extrato/)
        const aviso = fonte("src/components/transactions/aviso-a-conferir.tsx")
        expect(aviso).toContain("podeConfirmarTodos = true")
        expect(aviso).toMatch(/\{ativo && !podeConfirmarTodos \? null : \(\s*<AlertActions/)
    })

    it("no telefone a linha de filtros some, montada para o atalho do cabeçalho", () => {
        const barra = fonte("src/components/transactions/transacoes-toolbar.tsx")
        expect(barra).toMatch(/<div ref=\{raizDosFiltros\} className="[^"]*\bmax-md:hidden\b[^"]*">\s*<FilterBar\b/)
        expect(barra).toContain('querySelector<HTMLButtonElement>("[data-slot=filter-bar-add]")?.click()')
    })

    it("no telefone o ⋯ veste a pele das abas (floating); no desktop segue terciário", () => {
        const barra = fonte("src/components/transactions/transacoes-toolbar.tsx")
        expect(barra).toMatch(/variant = "tertiary"/)
        expect(barra).toMatch(/<Button type="button" variant=\{variant\} size="icon-md" aria-label="Mais ações">/)
        expect(barra).toMatch(/<MenuMaisAcoes[^>]*variant="floating"/)
        expect(f).not.toMatch(/<MenuMaisAcoes[^>]*variant=/)
    })

    it("Revisar aplica o token conferir, por data, sem os outros tokens (e Sem categoria só quando o fim da importação pede)", () => {
        expect(f).toMatch(
            /setEstado\(\{\s*filtros:\s*\[\s*\{\s*field:\s*"conferir",\s*operator:\s*"is",\s*values:\s*\[\]\s*\},\s*\.\.\.\(o\?\.semCategoria === true \? \[\{ field: "categoria", operator: "is" as const, values: \[SEM_CATEGORIA\] \}\] : \[\]\),\s*\],\s*sort:\s*\{\s*key:\s*"date",\s*dir:\s*"desc"\s*\}/,
        )
        expect(f).toMatch(/<AvisoAConferir[\s\S]*?onRevisar=\{revisar\}/)
        expect(f).toMatch(/<ImportarExtratoDialog[\s\S]*?onRevisar=\{revisar\}/)
        expect(f).not.toContain("conferir=1")
    })

    it("o detalhe navega entre vizinhos e a exclusão é o AlertDialog", () => {
        expect(f).toContain("anterior={tela.detalhe.vizinhos.anterior}")
        expect(f).toContain("seguinte={tela.detalhe.vizinhos.seguinte}")
        expect(f).toMatch(/onNavegar=\{\(t\) => tela\.detalhe\.abrir\(t\)\}/)
        expect(f).not.toContain("onDuplicar")
        expect(f).toContain("pending={exclusao.excluindo}")
        expect(f).not.toContain("window.confirm")
    })

    it("exportar leva as marcadas ou o filtro, baixa direto e só então avisa", () => {
        expect(f).toMatch(/selecionadas\.length > 0[\s\S]*fetchTransacoesParaExportar\(/)
        // Sem "Salvar como": ele abria uma segunda janela no navegador que recusava gravar.
        expect(f).not.toContain("showSaveFilePicker")
        expect(f).toMatch(/downloadCsv\(nomeDoCsv\([\s\S]*transacoesParaCsv\([\s\S]*if \(truncado\) toastWarning\(mensagemDaExportacao\(/)
        expect(f).not.toMatch(/toastSuccess\(mensagemDaExportacao/)
    })
})

describe("exportar CSV (spec §11)", () => {
    it("o nome leva a data local", () => {
        expect(nomeDoCsv(new Date(2026, 10, 7, 23, 50))).toBe("transacoes-2026-11-07.csv")
    })

    it("o toast conta e avisa o teto", () => {
        expect(mensagemDaExportacao(142, false)).toBe("142 lançamentos exportados")
        expect(mensagemDaExportacao(1, false)).toBe("1 lançamento exportado")
        expect(mensagemDaExportacao(10_000, true)).toBe("Exportados os primeiros 10.000")
    })
})

describe("o aviso do compartilhado (spec §9)", () => {
    const aviso = fonte("src/components/transactions/compartilhado-aviso.tsx")

    it("é Alert de aviso, com Abrir cartões no PDF", () => {
        expect(aviso).toContain('tone="warning"')
        expect(aviso).toContain("onDismiss={onDismiss}")
        expect(aviso).toContain("Para conferir a fatura, abra o cartão e use Conferir fatura.")
        expect(aviso).toMatch(/<AlertAction asChild>\s*<Link href=\{ROUTES\.CREDIT_CARDS\}>Abrir cartões<\/Link>/)
        expect(aviso).not.toContain("@/components/wireframe")
    })
})

describe("o esqueleto da página (spec §6.5)", () => {
    const esqueleto = fonte("src/components/transactions/transactions-page-skeleton.tsx")

    it("filtros e tabela num SkeletonGroup, sem a linha de resumo", () => {
        expect(esqueleto).toContain("<SkeletonGroup")
        expect(esqueleto).not.toContain("ResumoDasTransacoes")
        expect(esqueleto).toContain("<FilterBarSkeleton")
        // Agrupado por dia, como a tela: a faixa do dia na tabela e um cartão por dia no telefone.
        expect(esqueleto).toContain("<TableGroupRow")
        expect(esqueleto).toContain("rounded-surface bg-card")
        expect([...esqueleto.matchAll(/function\s+([A-Z]\w*)/g)].map((m) => m[1])).toEqual(["TransactionsPageSkeleton"])
    })

    it("o osso da linha de filtros some no telefone", () => {
        expect(esqueleto).toMatch(/<div className="[^"]*\bmax-md:hidden\b[^"]*">\s*<FilterBarSkeleton\b/)
    })
})
