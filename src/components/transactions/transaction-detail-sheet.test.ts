import { describe, expect, it } from "vitest"
import type { Transaction } from "@/lib/supabase"
import { lerFonte, semComentarios } from "@/test/fonte"
import {
    direcaoDaTecla,
    ehCampoDeTexto,
    fraseDaFatura,
    linhaDoHeroi,
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
    it("a fatura em dia/mês curto", () => {
        expect(fraseDaFatura(new Date(2026, 10, 12), new Date(2026, 10, 20))).toBe("Fatura que fecha em 12/nov, vence 20/nov")
    })

    it("o herói: a data, e quem lançou só quando há nome", () => {
        expect(linhaDoHeroi("7 de novembro de 2026", "Kauã", "apple_pay")).toBe(
            "7 de novembro de 2026 · lançado por Kauã pelo Apple Pay",
        )
        expect(linhaDoHeroi("7 de novembro de 2026", null, "app")).toBe("7 de novembro de 2026")
        expect(linhaDoHeroi("7 de novembro de 2026", "Kauã", "import_sheet")).toBe(
            "7 de novembro de 2026 · lançado por Kauã pela Planilha",
        )
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

    it("o rodapé tem as três ações, com o Excluir à esquerda", () => {
        const f = fonte(SHEET)
        expect(f).toMatch(/<DialogFooter\s+start=\{[\s\S]*?Excluir[\s\S]*?Duplicar[\s\S]*?variant="primary"[\s\S]*?Editar/)
        expect(f).toContain("<DialogCloseButton placement=\"inline\" />")
        expect(f).toContain('<MoneyDisplay size="xl" signed')
        expect(f).toContain("<DescriptionList>")
    })

    it("as props de quem já usa a folha seguem, e as novas são opcionais", () => {
        const f = fonte(SHEET)
        for (const p of ["onDelete: (t: Transaction) => void", "launchInEditMode?: boolean", "onLaunchEditConsumed?: () => void", "subscriptionsHref: string"]) {
            expect(f).toContain(p)
        }
        for (const p of ["anterior?: Transaction | null", "seguinte?: Transaction | null", "onNavegar?: (t: Transaction) => void", "onDuplicar?: (t: Transaction) => void"]) {
            expect(f).toContain(p)
        }
        expect(f).toContain("useDuplicarComoNova()")
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

    it("o Excluir do rodapé e o Remover limite dividem a tinta destrutiva", () => {
        for (const arquivo of [SHEET, "src/components/members/limites-secao.tsx"]) {
            const f = fonte(arquivo)
            expect(f, arquivo).toContain("className={tertiaryDestructiveClassName}")
            expect(f, arquivo).not.toContain("destructive)_22%")
        }
    })
})
