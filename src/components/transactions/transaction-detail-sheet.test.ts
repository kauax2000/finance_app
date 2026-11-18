import { describe, expect, it } from "vitest"
import type { Transaction } from "@/lib/supabase"
import { lerFonte, semComentarios } from "@/test/fonte"
import {
    direcaoDaTecla,
    ehCampoDeTexto,
    notaComAutor,
    notaDaOrigem,
    momentoDoRegistro,
    linhaDaEdicao,
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
    it("a nota da origem, com pelo/pela", () => {
        expect(notaDaOrigem("app")).toBe("Lançado pelo app")
        expect(notaDaOrigem("apple_pay")).toBe("Lançado pelo Apple Pay")
        expect(notaDaOrigem("import_sheet")).toBe("Lançado pela Planilha")
    })

    it("a nota com o autor, com pelo/pela", () => {
        expect(notaComAutor("app", "Kauã")).toBe("Kauã lançou pelo app")
        expect(notaComAutor("import_sheet", "Kauã")).toBe("Kauã lançou pela Planilha")
        expect(notaComAutor("apple_pay", "Renata")).toBe("Renata lançou pelo Apple Pay")
    })

    it("o momento do registro: hoje, ontem, dia do mês e o ano só se for outro", () => {
        const agora = new Date(2026, 10, 13, 18, 0)
        expect(momentoDoRegistro(new Date(2026, 10, 13, 9, 5).toISOString(), agora)).toBe("hoje, 09:05")
        expect(momentoDoRegistro(new Date(2026, 10, 12, 23, 59).toISOString(), agora)).toBe("ontem, 23:59")
        expect(momentoDoRegistro(new Date(2026, 10, 11, 14, 32).toISOString(), agora)).toBe("11 nov, 14:32")
        expect(momentoDoRegistro(new Date(2025, 0, 2, 8, 0).toISOString(), agora)).toBe("2 jan 2025, 08:00")
        expect(momentoDoRegistro("lixo", agora)).toBeNull()
    })

    it("a edição só aparece depois de um minuto da criação", () => {
        const agora = new Date(2026, 10, 13, 18, 0)
        const criado = new Date(2026, 10, 11, 14, 32).toISOString()
        expect(linhaDaEdicao(criado, criado, agora)).toBeNull()
        expect(linhaDaEdicao(criado, new Date(2026, 10, 11, 14, 32, 40).toISOString(), agora)).toBeNull()
        expect(linhaDaEdicao(criado, null, agora)).toBeNull()
        expect(linhaDaEdicao(criado, new Date(2026, 10, 13, 9, 10).toISOString(), agora)).toBe("Editado hoje às 09:10")
        expect(linhaDaEdicao(criado, new Date(2026, 10, 12, 9, 10).toISOString(), agora)).toBe("Editado ontem às 09:10")
        expect(linhaDaEdicao(criado, new Date(2026, 10, 11, 20, 0).toISOString(), agora)).toBe("Editado em 11 nov às 20:00")
    })

    it("a recorrência", () => {
        expect(rotuloDaRecorrencia("monthly")).toBe("Todo mês")
    })
})

describe("fonte do detalhe", () => {
  it("recorrência, assinatura e projeto são etiquetas; quem pagou vai na data e quem lançou no rodapé", () => {
    const f = fonte(SHEET)
    expect(f).toContain("rotuloDaRecorrencia(")
    expect(f).toContain("projetoDetailPath(")
    expect(f).toContain("?sub=")
    expect(f).not.toContain('pago por "')
    expect(f).toMatch(/<FotoDoMembro membro=\{membroQuePagou\} size="2xs" \/>/)
    expect(f).toContain("aria-label={`Pago por ${pagou}`}")
    expect(f).not.toMatch(/<\/FotoDoMembro>|<FotoDoMembro[^>]*\/>\s*\{pagou\}/)
    expect(f).toMatch(/<RodapeDaOrigem[\s\S]*?autor=/)
  })

  it("ao rolar, o cabeçalho resume o lançamento: ladrilho, nome e valor em cinza (H2a/A5, 11/nov/2026)", () => {
    const f = fonte(SHEET)
    expect(f).toContain("useDialogHeaderDock")
    expect(f).toMatch(/centerShown=\{nomeSubiu\}/)
    expect(f).toMatch(/<ColorTile size="xs"/)
    expect(f).toMatch(/<MoneyDisplay[^>]*size="md"[^>]*tone="muted"|<MoneyDisplay[^>]*tone="muted"[^>]*size="md"/)
  })

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
        expect(f).not.toContain("<DescriptionList")
        expect(f).not.toContain("<DescriptionTerm>Quem</DescriptionTerm>")
        expect(f).not.toContain("<DescriptionTerm>Recorrência</DescriptionTerm>")
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
        expect(f).toContain('<Button type="button" variant="primary"')
        expect(f).toContain('<Button type="button" variant="tertiary"')
        expect(f).not.toMatch(/<Button[^>]*size=/)
        expect(f).not.toMatch(/<Button[^>]*size="sm"/)
        expect(f).toContain('<div className="flex gap-2 pointer-coarse:flex-col pointer-coarse:items-stretch">')
    })

    it("o a conferir K2c: selo no topo, o card Como chegou antes da manchete, Confirmar + Editar e o link embaixo", () => {
        const sheet = fonte(SHEET)
        expect(sheet).toMatch(/t\.needs_review && conferidoNaFolha !== t\.id \? \(\s*<Badge size="md" tone="info">\s*<BadgeDot \/>\s*A conferir/)
        expect(sheet).toContain('if (o === "confirmado") setConferidoNaFolha(t.id)')
        expect(sheet).toContain("onEditar={editar}")
        // O card sobe: vem antes da manchete e dos blocos de contexto.
        expect(sheet.indexOf("<AConferirNoDetalhe")).toBeLessThan(sheet.indexOf("{manchete ? ("))
        const f = fonte("src/components/transactions/a-conferir-no-detalhe.tsx")
        expect(f).not.toContain("@/components/ui/alert\"")
        expect(f).toContain("Como chegou")
        expect(f).toContain("<blockquote>{original}</blockquote>")
        for (const q of ['"lido pela IA"', '"importação"', '"Apple Pay"', '"IA conectada"', '"Atalho"']) expect(f).toContain(q)
        expect(f).toMatch(/variant="primary" className="grow"[\s\S]*?>\s*confirmar\s*</)
        expect(f).toMatch(/variant="tertiary"[^>]*onClick=\{onEditar\}>\s*editar/)
        expect(f).toMatch(/variant="link" className="self-center"[^>]*onClick=\{\(\) => void lembrar\(\)\}/)
        expect(f).toMatch(/<AlertDialogTrigger asChild>\s*<Button type="button" variant="link" className="self-center"/)
        expect(f).toContain('<Caption role="alert"')
    })

    it("a conferir B2: o card leva tone=\"info\" e o ponto do selo só enquanto pede Confirmar", () => {
        const f = fonte("src/components/transactions/a-conferir-no-detalhe.tsx")
        expect(f).toContain('tone={mostraConfirmar ? "info" : undefined}')
        expect(f).toMatch(/\{mostraConfirmar \? \(\s*<span[^>]*>\s*<BadgeDot className="\[--badge-dot:var\(--info\)\]" \/>\s*<span className="truncate">A conferir · como chegou<\/span>/)
        expect(f).toMatch(/\) : \(\s*<span className="min-w-0 truncate">Como chegou<\/span>/)
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
        expect(f).toMatch(/<RodapeDaOrigem\s+transaction=\{t\}/)
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

    it("a manchete desenha a ação, e a Fatura e as Receitas mandam a fatia", () => {
        const f = fonte(SHEET)
        expect(f).toContain('<AlertActions placement={manchete.texto.length > 60 ? "block" : "inline"}>')
        expect(f).toContain("<AlertAction asChild>")
        expect(f).toContain("manchete.acao")
        expect(f).toMatch(/<BlocoFatura[^>]*onManchete=\{aoMudarManchete\}/)
        expect(f).toMatch(/<BlocoReceitas[^>]*onManchete=\{aoMudarManchete\}/)
    })

    it("o formulário abre no escopo do plano e as parcelas recarregam", () => {
        expect(fonte("src/components/transactions/transaction-form-use.tsx")).toMatch(/initialInstallmentEditScope/)
        expect(fonte("src/components/transactions/installment-purchase-section.tsx")).toMatch(
            /useInstallmentSlices\(\s*planId[^)]*versao/
        )
        const f = fonte(SHEET)
        expect(f).toContain("initialInstallmentEditScope: escopoAoEditar")
        expect(f).toContain("const editarPlano")
    })
})

describe("folha do plano: releitura e versão", () => {
    it("o embed do plano da categoria leva categoria e pagamento", () => {
        const f = lerFonte("src/lib/queries/fetch-category-detail-bundle.ts")
        const embed = f.match(/workspace_installment_plans\(([^)]*)\)/)?.[1] ?? ""
        for (const c of ["category_id", "payment_method", "payment_credit_card_id"]) expect(embed).toContain(c)
    })

    it("a versão das parcelas zera ao fechar e ao trocar de plano", () => {
        const f = fonte(SHEET)
        expect(f).toContain("setVersaoDasParcelas(0)")
        expect(f).toMatch(/\[t\?\.installment_plan_id\]/)
    })

    it("editar plano fica desligado enquanto a releitura não volta", () => {
        expect(fonte(SHEET)).toContain("editarDesabilitado={lendoPlano}")
        expect(fonte("src/components/transactions/detalhe/folha-do-plano.tsx")).toContain("disabled={editarDesabilitado}")
    })
})
