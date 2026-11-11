import { describe, expect, it } from "vitest"
import type { Transaction } from "@/lib/supabase"
import { lerFonte, semComentarios } from "@/test/fonte"
import {
    direcaoDaTecla,
    ehCampoDeTexto,
    linhaDeQuem,
    notaDaOrigem,
    podeNavegar,
    rotuloDaRecorrencia,
} from "@/components/transactions/detalhe-regras"

const T = { id: "x" } as Transaction
const SHEET = "src/components/transactions/transaction-detail-sheet.tsx"
const fonte = (arquivo: string) => semComentarios(lerFonte(arquivo), "tudo")

describe("podeNavegar", () => {
    it("com os dois vizinhos e sem edição, as duas setas andam", () => {
        expect(podeNavegar({ anterior: T, seguinte: T }, false)).toEqual({ anterior: true, seguinte: true })
    })

    it("na ponta da página, a seta daquele lado fica desligada", () => {
        expect(podeNavegar({ seguinte: T }, false)).toEqual({ anterior: false, seguinte: true })
    })

    it("editando, nenhuma anda", () => {
        expect(podeNavegar({ anterior: T, seguinte: T }, true)).toEqual({ anterior: false, seguinte: false })
    })

    it("a linha que saiu da lista não tem vizinhos", () => {
        expect(podeNavegar(null, false)).toEqual({ anterior: false, seguinte: false })
        expect(podeNavegar({}, false)).toEqual({ anterior: false, seguinte: false })
    })
})

describe("as teclas", () => {
    const tecla = (key: string, mod: Partial<KeyboardEvent> = {}) =>
        direcaoDaTecla({ key, metaKey: false, ctrlKey: false, altKey: false, ...mod })

    it("↑ e K vão à anterior; ↓ e J à seguinte", () => {
        expect(tecla("ArrowUp")).toBe("anterior")
        expect(tecla("k")).toBe("anterior")
        expect(tecla("ArrowDown")).toBe("seguinte")
        expect(tecla("j")).toBe("seguinte")
        expect(tecla("x")).toBeNull()
    })

    it("com modificadora, a tecla é de outro atalho", () => {
        expect(tecla("ArrowDown", { metaKey: true })).toBeNull()
        expect(tecla("k", { ctrlKey: true })).toBeNull()
    })

    it("campo de texto fica com as setas", () => {
        expect(ehCampoDeTexto({ tagName: "INPUT" })).toBe(true)
        expect(ehCampoDeTexto({ tagName: "TEXTAREA" })).toBe(true)
        expect(ehCampoDeTexto({ tagName: "DIV", isContentEditable: true })).toBe(true)
        expect(ehCampoDeTexto({ tagName: "BUTTON", closest: () => null })).toBe(false)
        expect(ehCampoDeTexto(null)).toBe(false)
    })
})

describe("as frases do detalhe", () => {
    it("quem: lançou e pagou juntos, ou pagou · lançou", () => {
        expect(linhaDeQuem("Kauã", "Kauã", true)).toBe("Kauã lançou e pagou")
        expect(linhaDeQuem("Kauã", "Renata", false)).toBe("Renata pagou · Kauã lançou")
        expect(linhaDeQuem("Kauã", null, false)).toBe("Kauã lançou")
        expect(linhaDeQuem(null, null, false)).toBeNull()
    })

    it("a nota da origem, com pelo/pela", () => {
        expect(notaDaOrigem("app")).toBe("Lançado pelo app")
        expect(notaDaOrigem("apple_pay")).toBe("Lançado pelo Apple Pay")
        expect(notaDaOrigem("import_sheet")).toBe("Lançado pela Planilha")
    })

    it("a recorrência", () => {
        expect(rotuloDaRecorrencia("monthly")).toBe("Todo mês")
    })
})

describe("fonte do detalhe", () => {
    it("o a conferir é o do design system, sem wireframe nem window.confirm", () => {
        const f = fonte(SHEET)
        expect(f).not.toContain("@/components/wireframe/a-conferir-wireframe")
        expect(f).not.toContain("window.confirm")
        expect(f).toContain("<AConferirNoDetalhe")
        expect(fonte("src/components/transactions/a-conferir-no-detalhe.tsx")).not.toContain("window.confirm")
    })

    it("o atalho de seta é um keydown que ignora campo de texto e só vale sem edição", () => {
        const f = fonte(SHEET)
        expect(f).toContain('document.addEventListener("keydown", aoTeclar)')
        expect(f).toContain('document.removeEventListener("keydown", aoTeclar)')
        expect(f).toContain("ehCampoDeTexto(e.target)")
        expect(f).toContain('detailMode === "edit"')
        const regras = fonte("src/components/transactions/detalhe-regras.ts")
        for (const alvo of ['"input"', '"textarea"', "isContentEditable", "[contenteditable]"]) expect(regras).toContain(alvo)
    })

    it("sem rodapé na leitura: Editar e Excluir moram só no ⋯ (pedido do dono, 11/nov/2026); sem o Duplicar", () => {
        const f = fonte(SHEET)
        expect(f).not.toContain("<DialogFooter")
        expect(f).toMatch(/<DropdownMenuItem onClick=\{editar\}>[\s\S]*?<DropdownMenuItem variant="destructive" onClick=\{excluir\}>/)
        expect(f).not.toContain("Duplicar")
        expect(f).toContain("<DialogCloseButton placement=\"inline\" />")
        expect(f).toContain('<MoneyDisplay size="3xl" signed')
        expect(f).toContain("<DescriptionList>")
    })

    it("o topo é o C1 + D4 + E2/E5: a data relativa sob o valor, a categoria num chip com o ponto da cor dela (11/nov/2026)", () => {
        const f = fonte(SHEET)
        expect(f).toMatch(/<MoneyDisplay size="3xl"[^>]*\/>\s*<Caption>\s*<span className="text-foreground">\{quandoRelativo\}<\/span>/)
        expect(f).toContain('"tile-vivid [--badge-dot:var(--tile-surface)]"')
        expect(f).toContain("{t.category ? <BadgeDot /> : null}")
        expect(f).toContain('{t.category?.name ?? "Sem categoria"}')
        expect(f).not.toContain("<DescriptionTerm>Categoria</DescriptionTerm>")
    })

    it("as props de quem já usa a folha seguem, e as novas são opcionais", () => {
        const f = fonte(SHEET)
        for (const p of ["onDelete: (t: Transaction) => void", "launchInEditMode?: boolean", "onLaunchEditConsumed?: () => void", "subscriptionsHref: string"]) {
            expect(f).toContain(p)
        }
        for (const p of ["anterior?: Transaction | null", "seguinte?: Transaction | null", "onNavegar?: (t: Transaction) => void"]) {
            expect(f).toContain(p)
        }
    })

    it("as ações do a conferir chegam a 44 no dedo e empilham", () => {
        const f = fonte("src/components/transactions/a-conferir-no-detalhe.tsx")
        expect(f).toContain('<Button type="button" variant="primary" size="md"')
        expect(f).toContain('<Button type="button" variant="secondary" size="md"')
        expect(f).not.toMatch(/<Button[^>]*size="sm"/)
        expect(f).toContain('<AlertActions className="pointer-coarse:flex-col pointer-coarse:items-stretch">')
    })

    it("a recarga das listas não vira erro da ação", () => {
        const f = fonte("src/components/transactions/a-conferir-no-detalhe.tsx")
        expect(f).toMatch(/try \{\s*await invalidateWorkspaceData\([^)]*\)\s*\} catch \{/)
    })

    it("o Remover limite veste a tinta destrutiva do terciário", () => {
        for (const arquivo of ["src/components/members/limites-secao.tsx"]) {
            const f = fonte(arquivo)
            expect(f, arquivo).toContain("className={tertiaryDestructiveClassName}")
            expect(f, arquivo).not.toContain("destructive)_22%")
        }
    })

    it("abre com o foco no título, e não na seta (a dica não salta ao abrir)", () => {
        const f = fonte(SHEET)
        expect(f).toMatch(/onOpenAutoFocus=\{[^}]*preventDefault/)
        expect(f).toMatch(/<DialogTitle[^>]*tabIndex=\{-1\}/)
    })

    it("o painel novo: a manchete, os cinco blocos e a nota da origem", () => {
        const f = fonte(SHEET)
        expect(f).not.toContain("<DescriptionTerm>Data</DescriptionTerm>")
        expect(f).not.toContain("Entrou por")
        expect(f).not.toContain("Lançado por")
        expect(f).not.toContain("<InstallmentPurchaseSection")
        expect(f).toContain("escolherManchete(")
        expect(f).toMatch(/<Alert tone=\{manchete\.tom\}/)
        for (const b of ["<BlocoCategoria", "<BlocoFatura", "<BlocoHistorico", "<BlocoParcelada", "<BlocoReceitas"]) {
            expect(f).toContain(b)
        }
        expect(f).toContain("<ImpactoDaParcela")
        expect(f).toContain("<Caption>{notaDaOrigem(t.source)}</Caption>")
        expect(f).toContain("formatWeekdayDayMonthShortPtBr(t.date)")
    })

    it("a manchete e os blocos recomeçam quando muda o que decide os blocos, não só o id", () => {
        const f = fonte(SHEET)
        expect(f).toContain("`${t.id}:${t.type}:${t.category_id}:${t.installment_plan_id}`")
        expect(f).toContain("fatias.chave === chaveDosBlocos")
        for (const b of ["categoria", "fatura", "historico", "parcelada", "receitas"]) {
            expect(f).toContain(`key={\`${b}:\${chaveDosBlocos}\`}`)
        }
    })
})
