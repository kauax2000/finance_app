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

describe("privacidade e IA em Configurações (Bloco 3B, Decisão 13)", () => {
  const fonte = (arquivo: string) => semComentarios(lerFonte(arquivo), "tudo")

  it("/privacidade é pública: mora fora de (app) e só importa o wireframe", () => {
    const pagina = fonte("src/app/privacidade/page.tsx")
    expect(pagina).toMatch(
      /import\s*\{\s*PrivacidadeWireframe\s*\}\s*from\s*["']@\/components\/wireframe\/privacidade-wireframe["']/,
    )
    expect(pagina).not.toContain("AuthGuard")
  })

  it("a política cita os provedores, a transferência, o que sai e como apagar", async () => {
    const { PrivacidadeWireframe } = await import("./privacidade-wireframe")
    const html = renderToStaticMarkup(PrivacidadeWireframe())
    for (const trecho of ["Groq", "Cloudflare", "transferência internacional", "tenta tirar automaticamente", "pode falhar em formatos incomuns", "CPF e CNPJ", "Fotos vão como estão", "30 chamadas de IA por dia", "Excluir conta", "Supabase", "O código do link de convite", "&lt;EMAIL_DE_CONTATO&gt;"]) {
      expect(html, trecho).toContain(trecho)
    }
  })

  it("a política diz o que vai ao Asaas e o que guardamos da cobrança (Bloco 8)", async () => {
    const { PrivacidadeWireframe } = await import("./privacidade-wireframe")
    const html = renderToStaticMarkup(PrivacidadeWireframe())
    for (const trecho of ["Asaas", "nunca passa pelo app", "O app não guarda o CPF", "token do cartão", "os 4 últimos dígitos, a bandeira", "endereço IP da compra", "NFS-e"]) {
      expect(html, trecho).toContain(trecho)
    }
    expect(fonte("src/components/wireframe/cofre-aberto-wireframe.tsx")).toContain("O nome, o CPF, o e-mail e o cartão ficam só no Asaas")
  })

  it("Configurações mostra a IA com o link da política", async () => {
    expect(fonte("src/app/(app)/settings/page-client.tsx")).toContain("<IaConfiguracoesWireframe />")
    const { IaConfiguracoesWireframe } = await import("./ia-configuracoes-wireframe")
    const html = renderToStaticMarkup(IaConfiguracoesWireframe())
    expect(html).toContain("IA: Groq e Cloudflare, grátis, sem treino")
    expect(html).toContain("30")
    expect(html).toContain('href="/privacidade"')
  })
})

describe("Piloto Automático (Bloco 4)", () => {
  const f = semComentarios(lerFonte("src/components/wireframe/piloto-automatico-wireframe.tsx"), "tudo")

  it("a rota importa o wireframe, e o desfazer confirma antes de apagar", () => {
    expect(semComentarios(lerFonte("src/app/(app)/piloto/page.tsx"), "tudo")).toContain("<PilotoAutomaticoWireframe />")
    expect(f).toContain("window.confirm(texto)")
    expect(f).toContain("textoDesfazerImportacao(g.total)")
    expect(f).toContain("Apagar este lançamento? O app não o lança de novo.")
    expect(f).toContain("desfazerImportacao(supabase, ws, g.loteId)")
    expect(f).toContain("desfazerLancamento(ws, i.id)")
  })
})

describe("Cofre aberto (Bloco 4)", () => {
  const f = semComentarios(lerFonte("src/components/wireframe/cofre-aberto-wireframe.tsx"), "tudo")

  it("a rota importa o wireframe; a exportação só lê e o apagar reusa o fluxo de hoje", () => {
    expect(semComentarios(lerFonte("src/app/(app)/cofre/page.tsx"), "tudo")).toContain("<CofreAbertoWireframe />")
    expect(f).toContain("exportarTudo(workspaces.map((w) => ({ id: w.id, name: w.name })))")
    expect(f).toContain("URL.revokeObjectURL(url), 60_000")
    expect(f).toContain("finance-app-${localYmdFromDate(new Date())}.zip")
    expect(f).toContain("<DeleteAccountDialog open={apagando} onOpenChange={setApagando} />")
    expect(f).toContain("ROUTES.PILOTO")
  })
})

describe("Previsão (Bloco 5)", () => {
  const regime = "Caixa: o dinheiro que sai neste mês. A fatura conta no mês em que vence."

  async function seguroDeTeste(over: Parameters<typeof import("@/lib/previsao/dados-de-teste").dados>[0]) {
    const { dados } = await import("@/lib/previsao/dados-de-teste")
    const { seguroParaGastar } = await import("@/lib/previsao/fluxo")
    return seguroParaGastar(dados(over))
  }

  it("compacto: o número, o por dia, o regime e o link para /previsao", async () => {
    const { createElement } = await import("react")
    const { ROUTES } = await import("@/config/navigation")
    const { SeguroParaGastarWireframe } = await import("./seguro-para-gastar-wireframe")
    const seguro = await seguroDeTeste({ hojeYmd: "2026-10-24" })
    const html = renderToStaticMarkup(createElement(SeguroParaGastarWireframe, { seguro, compacto: true }))
    expect(html).toContain("WIREFRAME · Bloco 5 · Seguro para gastar")
    expect(html).toContain(regime)
    expect(html).toContain("por dia")
    expect(html).toContain(`href="${ROUTES.PREVISAO}"`)
    expect(ROUTES.PREVISAO).toBe("/previsao")
    expect(html).not.toContain("Reserva do mês")
  })

  it("detalhe: decomposição, comprometido, contas sem valor e a reserva", async () => {
    const { createElement } = await import("react")
    const { SeguroParaGastarWireframe } = await import("./seguro-para-gastar-wireframe")
    const seguro = { ...(await seguroDeTeste({ hojeYmd: "2026-10-24" })), contasSemValor: ["Luz"] }
    const html = renderToStaticMarkup(createElement(SeguroParaGastarWireframe, { seguro }))
    expect(html).toContain(regime)
    expect(html).toContain("Já comprometido na próxima fatura:")
    expect(html).toContain("Contas sem valor: Luz")
    expect(html).toContain("Reserva do mês")
  })

  it("linha do tempo: entra, sai, sobra e o primeiro mês no vermelho", async () => {
    const { createElement } = await import("react")
    const { dados, tx } = await import("@/lib/previsao/dados-de-teste")
    const { projecaoMensal } = await import("@/lib/previsao/fluxo")
    const { LinhaDoTempoWireframe } = await import("./linha-do-tempo-wireframe")
    const projecao = projecaoMensal(dados({ hojeYmd: "2026-10-24", transacoes: [tx("expense", 50, "2026-11-10")] }))
    expect(projecao.primeiroMesNegativo).toBe("2026-11")
    const html = renderToStaticMarkup(createElement(LinhaDoTempoWireframe, { projecao }))
    expect(html).toContain("WIREFRAME · Bloco 5 · Linha do tempo")
    expect(html.match(/Primeiro mês no vermelho/g)).toHaveLength(1)
    for (const t of ["Entra", "Sai", "Sobra", "Fim de"]) expect(html).toContain(t)
  })

  it("a rota e o Painel montam os wireframes; a reserva só o dono altera", () => {
    expect(semComentarios(lerFonte("src/app/(app)/previsao/page.tsx"), "tudo")).toContain("<PrevisaoWireframe />")
    expect(semComentarios(lerFonte("src/app/(app)/dashboard/page-client.tsx"), "tudo")).toContain("<SeguroDoPainelWireframe")
    const f = semComentarios(lerFonte("src/components/wireframe/seguro-para-gastar-wireframe.tsx"), "tudo")
    expect(f).toContain("A previsão é do mês corrente")
    expect(f).toContain("Só quem é dono da carteira altera a reserva.")
    expect(f).toContain(".update({ monthly_savings_target:")
    expect(f).toContain("formatSupabasePostgrestError(")
    // Trocar de carteira remonta o campo: o rascunho de uma não vai para a outra.
    expect(f).toContain('<CampoDaReserva key={currentWorkspaceId ?? "nenhuma"} />')
  })
})

describe("Projetos e modelos de carteira (Bloco 7C)", () => {
  const fonte = (arquivo: string) => semComentarios(lerFonte(arquivo), "tudo")

  it("o project_id só vai quando muda algo, e a privada e a receita não o levam (M7)", async () => {
    const { projetoDoSalvar } = await import("@/components/transactions/transaction-form-use")
    expect(projetoDoSalvar({ escolhido: "", original: undefined, privado: false, type: "expense" })).toBeUndefined()
    expect(projetoDoSalvar({ escolhido: "p1", original: undefined, privado: false, type: "expense" })).toBe("p1")
    expect(projetoDoSalvar({ escolhido: "p1", original: "p1", privado: false, type: "expense" })).toBeUndefined()
    expect(projetoDoSalvar({ escolhido: "", original: "p1", privado: false, type: "expense" })).toBeNull()
    expect(projetoDoSalvar({ escolhido: "p1", original: undefined, privado: true, type: "expense" })).toBeUndefined()
    expect(projetoDoSalvar({ escolhido: "p1", original: "p1", privado: true, type: "expense" })).toBeNull()
    expect(projetoDoSalvar({ escolhido: "p1", original: "p1", privado: false, type: "income" })).toBeNull()
  })

  it("sem a tabela ou a RPC no banco, a leitura é indisponível e não quebra (Ruling 8)", async () => {
    const { tabelaTolerante } = await import("@/lib/projetos/dados")
    const resposta = (data: unknown, error: { code: string; message: string } | null) => Promise.resolve({ data, error })
    await expect(tabelaTolerante(resposta(null, { code: "PGRST205", message: "x" }))).resolves.toEqual({ disponivel: false })
    await expect(tabelaTolerante(resposta([1], null))).resolves.toEqual({ disponivel: true, dados: [1] })
    await expect(tabelaTolerante(resposta(null, { code: "42501", message: "x" }))).rejects.toThrow()
    expect(fonte("src/lib/projetos/dados.ts")).toMatch(/RPC_AUSENTE = new Set\(\["PGRST202"/)
  })

  it("marcar a privada limpa o projeto, e o seletor some nela", () => {
    expect(fonte("src/components/transactions/transaction-form-use.tsx")).toMatch(/setIsPrivateBruto\(v\)\s*if \(v\) setProjectId\(""\)/)
    expect(fonte("src/components/transactions/transaction-form-fields.tsx")).toMatch(
      /!isPrivate &&[\s\S]{0,200}<ProjetoDoLancamentoWireframe/,
    )
  })

  it("o Painel da carteira de projeto troca o seguro pelo resumo", () => {
    expect(fonte("src/app/(app)/dashboard/page-client.tsx")).toMatch(
      /currentWorkspace\?\.purpose === "project" \? \([\s\S]*?<ResumoDaCarteiraProjetoWireframe[\s\S]*?<SeguroDoPainelWireframe/,
    )
  })

  it("criar carteira mostra os modelos, e /comecar cria a Casa", () => {
    expect(fonte("src/components/workspace/project-form-dialog.tsx")).toContain("<ModelosDeCarteiraWireframe")
    expect(fonte("src/app/(app)/comecar/page.tsx")).toContain("<CriarACasaWireframe />")
    expect(fonte("src/components/wireframe/modelos-de-carteira-wireframe.tsx")).toContain('criarCarteiraDeModelo("casa", "Casa")')
  })

  it("a etiqueta e a regra da escolha no wireframe de modelos", async () => {
    const { createElement } = await import("react")
    const { REGRA_DA_ESCOLHA } = await import("@/lib/projetos/modelos")
    const { ModelosDeCarteiraWireframe } = await import("./modelos-de-carteira-wireframe")
    const html = renderToStaticMarkup(createElement(ModelosDeCarteiraWireframe, { modelo: null, onModeloChange: () => {} }))
    expect(html).toContain("WIREFRAME · Bloco 7 · Modelos de carteira")
    expect(html).toContain(REGRA_DA_ESCOLHA)
    for (const r of ["Casa", "Casal", "Pessoal", "Viagem", "Reforma", "Evento"]) expect(html).toContain(r)
  })
})

describe("Carteira de projeto, fix 1 (Bloco 7C)", () => {
  const fonte = (arquivo: string) => semComentarios(lerFonte(arquivo), "tudo")

  it("I1: o dono edita as datas e o orçamento da carteira, nas configurações e logo depois de criar", () => {
    expect(fonte("src/lib/projetos/dados.ts")).toMatch(/from\("workspaces"\)\s*\.update\(campos\)\s*\.eq\("id", workspaceId\)/)
    const w = fonte("src/components/wireframe/projetos-wireframe.tsx")
    expect(w).toContain("isWorkspaceOwner(alvo.id)")
    expect(w).toContain("camposDaCarteiraProjeto(")
    // O orçamento do projeto passa pelo mesmo parser pt-BR, e "0" é recusado.
    expect(w).toContain("orcamentoTotal(orcamento)")
    expect(w).not.toContain("Number(orcamento)")
    expect(w).toContain("formatMoneyBrlInput(")
    expect(fonte("src/app/(app)/settings/page-client.tsx")).toContain("<DatasDaCarteiraProjetoWireframe />")
    expect(fonte("src/components/workspace/project-form-dialog.tsx")).toContain("<DatasDaCarteiraProjetoWireframe")
  })

  it("I2: o resumo da carteira lê todas as páginas", () => {
    expect(fonte("src/lib/projetos/dados.ts")).toMatch(/fetchAllRows<LancamentoDoResumo>\([\s\S]*?\.order\("id"\)\s*\.range\(from, to\)/)
  })

  it("I3: o convidado não monta o resumo da carteira de projeto", () => {
    expect(fonte("src/app/(app)/dashboard/page-client.tsx")).toMatch(
      /currentWorkspace\?\.purpose === "project" \? \(\s*isAdulto \? \(\s*<ResumoDaCarteiraProjetoWireframe/,
    )
  })

  it("o seletor: só os ativos, mais o atual arquivado", async () => {
    const { opcoesDoProjeto } = await import("./projetos-wireframe")
    const p = (id: string, archived_at: string | null) => ({ id, archived_at }) as never
    const lista = [p("a", null), p("b", "2026-10-01"), p("c", "2026-10-02")]
    expect(opcoesDoProjeto(lista, "").map((x: { id: string }) => x.id)).toEqual(["a"])
    expect(opcoesDoProjeto(lista, "b").map((x: { id: string }) => x.id)).toEqual(["a", "b"])
  })

  it("PROJETO_ARQUIVADO em português", async () => {
    const { formatSupabasePostgrestError } = await import("@/lib/supabase-errors")
    expect(formatSupabasePostgrestError({ message: "PROJETO_ARQUIVADO", code: "P0001" })).toBe(
      "Este projeto está arquivado e não aceita lançamento novo.",
    )
  })

  it("rpcTolerante: sem a RPC, indisponível; com ela, os dados", async () => {
    const { supabase } = await import("@/lib/supabase")
    const { rpcTolerante } = await import("@/lib/projetos/dados")
    const cliente = supabase as unknown as { rpc: unknown }
    cliente.rpc = vi.fn().mockResolvedValueOnce({ data: null, error: { code: "PGRST202", message: "x" } })
    await expect(rpcTolerante("criar_carteira_de_modelo", {})).resolves.toEqual({ disponivel: false })
    cliente.rpc = vi.fn().mockResolvedValueOnce({ data: "ws-1", error: null })
    await expect(rpcTolerante("criar_carteira_de_modelo", {})).resolves.toEqual({ disponivel: true, dados: "ws-1" })
    cliente.rpc = vi.fn().mockResolvedValueOnce({ data: null, error: { code: "P0001", message: "MODELO_DESCONHECIDO" } })
    await expect(rpcTolerante("criar_carteira_de_modelo", {})).rejects.toThrow("Escolha um dos modelos da lista.")
  })

  it("buildTransactionRow: o project_id só entra quando vem", async () => {
    const { buildTransactionRow } = await import("@/lib/transactions/mutations")
    const base = {
      editingId: null, categoryId: null, type: "expense" as const, amount: 10, description: null,
      dateIso: "2026-10-25T12:00:00.000Z", isRecurring: false, recurringInterval: null,
      paymentMethod: null, paymentCreditCardId: null,
    }
    const ctx = { userId: "u", workspaceId: "w" }
    expect(buildTransactionRow(ctx, base)).not.toHaveProperty("project_id")
    expect(buildTransactionRow(ctx, { ...base, projectId: null })).toHaveProperty("project_id", null)
    expect(buildTransactionRow(ctx, { ...base, projectId: "p1" })).toHaveProperty("project_id", "p1")
  })
})

describe("Divisão: quem pagou, partes, modo e saldo (Bloco 7C)", () => {
  const fonte = (arquivo: string) => semComentarios(lerFonte(arquivo), "tudo")
  const W = "src/components/wireframe/divisao-wireframe.tsx"

  it("o paid_by só vai quando a pessoa troca o padrão; nunca na privada nem na receita", async () => {
    const { pagadorDoSalvar } = await import("@/components/transactions/transaction-form-use")
    const a = { padrao: "eu", privado: false, type: "expense" as const }
    expect(pagadorDoSalvar({ ...a, escolhido: "" })).toBeUndefined()
    expect(pagadorDoSalvar({ ...a, escolhido: "eu" })).toBeUndefined()
    expect(pagadorDoSalvar({ ...a, escolhido: "ana" })).toBe("ana")
    expect(pagadorDoSalvar({ ...a, escolhido: "ana", privado: true })).toBeUndefined()
    expect(pagadorDoSalvar({ ...a, escolhido: "ana", type: "income" })).toBeUndefined()
  })

  it("buildTransactionRow: o paid_by só entra quando vem", async () => {
    const { buildTransactionRow } = await import("@/lib/transactions/mutations")
    const base = {
      editingId: null, categoryId: null, type: "expense" as const, amount: 10, description: null,
      dateIso: "2026-10-25T12:00:00.000Z", isRecurring: false, recurringInterval: null,
      paymentMethod: null, paymentCreditCardId: null,
    }
    const ctx = { userId: "u", workspaceId: "w" }
    expect(buildTransactionRow(ctx, base)).not.toHaveProperty("paid_by")
    expect(buildTransactionRow(ctx, { ...base, paidBy: "ana" })).toHaveProperty("paid_by", "ana")
  })

  it("Quem pagou: só na carteira dividida, para o adulto, entre os adultos, e some na privada", () => {
    const w = fonte(W)
    expect(w).toContain('currentWorkspace?.split_mode === "split" && isAdulto')
    expect(fonte("src/lib/divisao/dados.ts")).toContain('.in("role", ["owner", "member"])')
    expect(fonte("src/components/transactions/transaction-form-fields.tsx")).toMatch(/!isPrivate &&[\s\S]{0,200}<QuemPagouWireframe/)
  })

  it("as partes mostradas vêm de transaction_shares, e o editor confere o fechamento antes do definir_partes", () => {
    expect(fonte("src/lib/divisao/dados.ts")).toMatch(/from\("transaction_shares"\)\.select\("\*"\)\.eq\("transaction_id", transactionId\)/)
    const w = fonte(W)
    expect(w).toMatch(/if \(!fecha\) return setAviso\(PARTES_NAO_FECHAM\)\s*void gravar\(/)
    expect(w).toContain("gravar(null)")
    expect(fonte("src/components/transactions/transaction-detail-sheet.tsx")).toContain("<PartesDaDespesaWireframe transaction={t} />")
  })

  it("o modo e os pesos são do dono; o saldo é do adulto, no Painel, com quem saiu marcado", () => {
    const w = fonte(W)
    expect(w).toMatch(/currentWorkspace\.type === "personal" \|\| !isWorkspaceOwner\(currentWorkspace\.id\)/)
    expect(w).toContain("saiu da carteira")
    expect(w).toContain("a.created_by === meuId")
    expect(fonte("src/app/(app)/settings/page-client.tsx")).toContain("<ModoEPesosDaCarteiraWireframe />")
    expect(fonte("src/app/(app)/dashboard/page-client.tsx")).toContain("<SaldoEAcertoWireframe />")
  })

  it("os pesos da parcelada vão por update no plano, depois da RPC, sem mudar a assinatura dela", () => {
    const p = fonte("src/components/transactions/transaction-form-persistence.ts")
    expect(p).toMatch(/\.from\("workspace_installment_plans"\)\s*\.update\(\{ split_weights: payload\.splitWeights \}\)\s*\.eq\("id", id\)/)
    expect(p.indexOf('"create_workspace_installment_plan"')).toBeLessThan(p.indexOf("split_weights: payload.splitWeights"))
    expect(p).not.toContain("p_split_weights")
  })

  it("Ruling 8: o acerto lista quem saiu e exige que quem grava seja uma das partes", () => {
    const w = fonte(W)
    expect(w).toContain("pessoasDoAcerto(lista, saldos.data?.saldos ?? [])")
    expect(w).toMatch(/if \(!acertoEhMeu\(meuId, de, para\)\) return setAviso\(/)
    expect(w).toContain("acertoEhMeu(meuId, s.de, s.para) ?")
    expect(w).not.toContain("quem saiu não entra num acerto novo")
    // As duas listas do acerto são as pessoas do saldo, e não só os adultos.
    expect(w.slice(w.indexOf("function SaldoEAcerto"))).not.toMatch(/\{lista\.map\(\(a\) => \(\s*<option/)
  })

  it("a etiqueta de cada peça", () => {
    const w = fonte(W)
    for (const t of ["Quem pagou", "Partes desta despesa", "Modo e pesos da carteira", "Saldo e acerto", "Pesos desta parcelada"]) {
      expect(w).toContain(`titulo="${t}"`)
    }
  })
})
