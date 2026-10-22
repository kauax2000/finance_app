import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { arquivosTsx, lerFonte, semComentarios } from "@/test/fonte"

import { WireframeBox } from "./wireframe-box"

// O `ciclosFechados` mora no arquivo do wireframe, que importa o cliente.
vi.mock("@/lib/supabase", () => ({ supabase: {} }))

describe("WireframeBox", () => {
  it("a cara fixa do wireframe: etiqueta, borda tracejada e mono", () => {
    const html = renderToStaticMarkup(WireframeBox({ bloco: 2, titulo: "Conferir fatura", children: "x" }))
    expect(html).toContain("WIREFRAME · Bloco 2 · Conferir fatura")
    expect(html).toContain('aria-label="WIREFRAME · Bloco 2 · Conferir fatura"')
    expect(html).toContain("border-dashed")
    expect(html).toContain("font-mono")
  })
})

describe("ciclosFechados", () => {
  it("no dia do fechamento o ciclo já está fechado, como no snapshot do cartão", async () => {
    const { ciclosFechados } = await import("./conferir-fatura-wireframe")
    expect(ciclosFechados(10, new Date(2026, 9, 10))[0]).toEqual({ inicio: "2026-09-11", fechamento: "2026-10-10" })
    expect(ciclosFechados(10, new Date(2026, 9, 9))[0]).toEqual({ inicio: "2026-08-11", fechamento: "2026-09-10" })
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

  it("o detalhe mostra o a conferir para importado, a revisar ou Apple Pay com o cartão da Wallet", () => {
    expect(fonte("src/components/transactions/transaction-detail-sheet.tsx")).toMatch(
      /t\.needs_review \|\| t\.import_batch_id \|\| \(t\.source === "apple_pay" && t\.capture_meta\?\.walletCard\) \? \(\s*<AConferirWireframe/,
    )
  })

  it("o quadro remonta quando o lançamento ou o needs_review muda", () => {
    expect(fonte("src/components/transactions/transaction-detail-sheet.tsx")).toMatch(
      /<AConferirWireframe[\s\S]*?key=\{`\$\{t\.id\}:\$\{t\.needs_review\}`\}/,
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

describe("captura sem abrir o app (Bloco 3A, Tarefa 4)", () => {
  const fonte = (arquivo: string) => semComentarios(lerFonte(arquivo), "tudo")

  it("tokens: cria, revoga e mostra o token uma vez só", () => {
    const f = fonte("src/components/wireframe/captura-tokens-wireframe.tsx")
    expect(f).toContain('rpc("create_capture_token"')
    expect(f).toContain('rpc("revoke_capture_token"')
    expect(f).toContain("Guarde agora: ele não aparece de novo.")
    expect(f).toContain("/functions/v1/capture")
    expect(f).toContain("docs/captura/atalho-iphone.md")
    // Só as sete colunas que o authenticated lê: `select('*')` dá 42501.
    expect(f).not.toMatch(/select\(\s*["']\*["']\s*\)/)
    // Lido sem cortar comentário: o `tudo` come o `//` da URL.
    expect(lerFonte("src/components/wireframe/captura-tokens-wireframe.tsx")).toContain(
      "https://github.com/kauax2000/finance_app/blob/main/docs/captura/atalho-iphone.md",
    )
  })

  it("tokens: o token vive só no estado do componente (Foco 2)", () => {
    const f = fonte("src/components/wireframe/captura-tokens-wireframe.tsx")
    expect(f).not.toMatch(/localStorage|sessionStorage|setQueryData\(\s*\[\s*["']capture_tokens|console\./)
  })

  it("tokens: os erros do banco em português", async () => {
    const { mensagemDoErroDeToken } = await import("./captura-tokens-wireframe")
    expect(mensagemDoErroDeToken({ code: "P0001", message: "nao_membro" })).toBe("Você não é membro dessa carteira.")
    expect(mensagemDoErroDeToken({ code: "P0001", message: "limite_tokens" })).toBe(
      "Limite de 10 tokens ativos. Revogue um para criar outro.",
    )
    expect(mensagemDoErroDeToken({ code: "23514", message: "x" })).toBe("Nome do aparelho: de 1 a 60 caracteres.")
    expect(mensagemDoErroDeToken({ code: "23502", message: "x" })).toBe("Nome do aparelho: de 1 a 60 caracteres.")
  })

  it("a conta mostra o wireframe dos tokens", () => {
    expect(fonte("src/app/(app)/account/page-client.tsx")).toMatch(
      /import\s*\{[^}]*\bCapturaTokensWireframe\b[^}]*\}\s*from\s*["']@\/components\/wireframe\/captura-tokens-wireframe["']/,
    )
  })

  it("o guia não traz URL de projeto nem token", () => {
    const guia = lerFonte("docs/captura/atalho-iphone.md")
    expect(guia).not.toContain("supabase.co")
    expect(guia).not.toMatch(/fac_[0-9a-f]/i)
    expect(guia).toContain("<TOKEN>")
    expect(guia).toContain("<URL>")
    expect(guia).toContain("Cartão ou Passe")
    expect(guia).toContain("iCloud")
  })

  it("a conferir: o Apple Pay aprende o cartão pelo wallet_alias", () => {
    const f = fonte("src/components/wireframe/a-conferir-wireframe.tsx")
    expect(f).toContain("wallet_alias")
    expect(f).toContain("como este cartão")
    // Já lembrado, sem botão: a comparação ignora caixa e acento.
    expect(f).toContain("Cartão já lembrado.")
    expect(f).toContain("normalizeSearchText(")
    // Fora de lote e conferido, só o bloco do lembrar.
    expect(f).toMatch(/confirmado \|\| soLembrar \? null/)
    expect(f).toContain("Capturado · a conferir")
    // Zero linhas atualizadas não é sucesso; o apelido novo vai direto ao cache.
    expect(f).toMatch(/\.update\(\{ wallet_alias: walletCard \}\)\s*\.eq\("id", cartaoId\)\s*\.select\("id"\)/)
    expect(f).toContain("data?.length !== 1")
    expect(f).toContain("setQueryData(chaveDoAlias, walletCard)")
    expect(f).toContain("Trocar '${aliasAtual.data}' por '${walletCard}'")
    expect(f).toContain("Nome da Wallet longo demais para lembrar.")
  })
})
