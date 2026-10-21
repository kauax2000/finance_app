import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { arquivosTsx, lerFonte, semComentarios } from "@/test/fonte"

import { WireframeBox } from "./wireframe-box"

describe("WireframeBox", () => {
  it("a cara fixa do wireframe: etiqueta, borda tracejada e mono", () => {
    const html = renderToStaticMarkup(WireframeBox({ bloco: 2, titulo: "Conferir fatura", children: "x" }))
    expect(html).toContain("WIREFRAME · Bloco 2 · Conferir fatura")
    expect(html).toContain('aria-label="WIREFRAME · Bloco 2 · Conferir fatura"')
    expect(html).toContain("border-dashed")
    expect(html).toContain("font-mono")
  })
})

describe("fonte dos wireframes", () => {
  const arquivos = arquivosTsx("src/components/wireframe")

  it.each(arquivos)("%s: nenhuma peça do design system", (arquivo) => {
    expect(semComentarios(lerFonte(arquivo), "tudo")).not.toMatch(/from\s+["']@\/components\/ui\//)
  })

  it.each(arquivos)("%s: todo <button> declara type", (arquivo) => {
    const fonte = semComentarios(lerFonte(arquivo), "tudo")
    // O `type` vem primeiro: o `>` de um `=>` no `onClick` cortaria uma regex de tag.
    const botoes = fonte.match(/<button\b/g) ?? []
    const comTipo = fonte.match(/<button\s+type="(button|submit)"/g) ?? []
    expect(comTipo.length, arquivo).toBe(botoes.length)
  })

  it("conferir fatura: PDF com senha pede a senha e diz quando ela está errada (Foco 1)", () => {
    const fonte = semComentarios(lerFonte("src/components/wireframe/conferir-fatura-wireframe.tsx"), "tudo")
    expect(fonte).toContain("precisaSenha")
    expect(fonte).toContain("Senha incorreta")
    expect(fonte).toContain('type="password"')
  })

  it("conferir fatura: o clientId nasce uma vez e fica no estado (Foco 3)", () => {
    const fonte = semComentarios(lerFonte("src/components/wireframe/conferir-fatura-wireframe.tsx"), "tudo")
    expect(fonte).toMatch(/useState/)
    expect(fonte).toMatch(/set\w+\(\s*prepararItens\(/)
  })

  it("o auditor pula a pasta dos wireframes", () => {
    expect(lerFonte(".claude/skills/design-system-guard/scripts/audit.mjs")).toContain("components/wireframe/")
  })
})

describe("importar extrato, estorno e a conferir (Tarefa 7)", () => {
  const fonte = (arquivo: string) => semComentarios(lerFonte(arquivo), "tudo")

  it("cada tela importa o seu wireframe", () => {
    expect(fonte("src/app/(app)/transactions/page-client.tsx")).toMatch(
      /import\s*\{[^}]*\bImportarExtratoWireframe\b[^}]*\}\s*from\s*["']@\/components\/wireframe\/importar-extrato-wireframe["']/,
    )
    expect(fonte("src/components/transactions/transaction-detail-sheet.tsx")).toMatch(
      /import\s*\{[^}]*\bAConferirWireframe\b[^}]*\}\s*from\s*["']@\/components\/wireframe\/a-conferir-wireframe["']/,
    )
    expect(fonte("src/components/transactions/transaction-form-fields.tsx")).toMatch(
      /import\s*\{[^}]*\bEstornoWireframe\b[^}]*\}\s*from\s*["']@\/components\/wireframe\/estorno-wireframe["']/,
    )
  })

  it("importar: prepara uma vez no estado, importa e desfaz (Foco 3)", () => {
    const f = fonte("src/components/wireframe/importar-extrato-wireframe.tsx")
    expect(f).toMatch(/set\w+\(\s*prepararItens\(/)
    expect(f).toContain("importarLancamentos(")
    expect(f).toContain("desfazerImportacao(")
    expect(f).toContain('"import_sheet"')
    expect(f).toContain('"import_statement"')
    // A categoria nova também nasce com um client_id guardado: o retry não a duplica.
    expect(f).toMatch(/onConflict:\s*"workspace_id,client_id"/)
  })

  it("a conferir: confirma e desfaz o lote com confirmação", () => {
    const f = fonte("src/components/wireframe/a-conferir-wireframe.tsx")
    expect(f).toContain("Importado · a conferir")
    expect(f).toMatch(/needs_review:\s*false/)
    expect(f).toContain('window.confirm("Desfazer a importação inteira deste lote?")')
    expect(f).toContain("desfazerImportacao(")
  })

  it("o detalhe mostra o a conferir só para importado ou a revisar", () => {
    expect(fonte("src/components/transactions/transaction-detail-sheet.tsx")).toMatch(
      /t\.needs_review \|\| t\.import_batch_id \? \(\s*<AConferirWireframe/,
    )
  })
})

describe("?importar=1", () => {
  it("é consumido e sai da URL, como o new", async () => {
    const { consumirParametroImportar } = await import("@/lib/transactions-list-search-params")
    expect(consumirParametroImportar(new URLSearchParams("importar=1&type=expense"))).toBe("type=expense")
    expect(consumirParametroImportar(new URLSearchParams("importar=1"))).toBe("")
    expect(consumirParametroImportar(new URLSearchParams("type=expense"))).toBeNull()
    expect(consumirParametroImportar(null)).toBeNull()
  })
})

describe("estorno no formulário (Decisão 6)", () => {
  it("receita com cartão de estorno grava credit_card e o cartão", async () => {
    const { formaDoPayload } = await import("@/components/transactions/transaction-form-use")
    expect(
      formaDoPayload({ type: "income", paymentMethod: null, paymentCreditCardId: "", estornoCartaoId: "card-1" }),
    ).toEqual({ paymentMethod: "credit_card", paymentCreditCardId: "card-1" })
    expect(
      formaDoPayload({ type: "income", paymentMethod: "pix", paymentCreditCardId: "x", estornoCartaoId: null }),
    ).toEqual({ paymentMethod: null, paymentCreditCardId: null })
  })

  it("a despesa segue como era, e ignora o estorno", async () => {
    const { formaDoPayload } = await import("@/components/transactions/transaction-form-use")
    expect(
      formaDoPayload({ type: "expense", paymentMethod: "credit_card", paymentCreditCardId: "c2", estornoCartaoId: "c9" }),
    ).toEqual({ paymentMethod: "credit_card", paymentCreditCardId: "c2" })
    expect(
      formaDoPayload({ type: "expense", paymentMethod: "pix", paymentCreditCardId: "c2", estornoCartaoId: null }),
    ).toEqual({ paymentMethod: "pix", paymentCreditCardId: null })
    expect(
      formaDoPayload({ type: "expense", paymentMethod: "credit_card", paymentCreditCardId: "", estornoCartaoId: null }),
    ).toEqual({ paymentMethod: "credit_card", paymentCreditCardId: null })
  })
})
