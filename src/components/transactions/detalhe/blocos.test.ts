import { describe, expect, it } from "vitest"

import { lerFonte } from "@/test/fonte"

const pasta = "src/components/transactions/detalhe"
const ler = (nome: string) => lerFonte(`${pasta}/${nome}.tsx`)
const BLOCOS = ["bloco-categoria", "bloco-fatura", "bloco-historico", "bloco-receitas", "bloco-parcelada", "bloco-saldo-do-mes", "bloco-receitas-no-tempo"]

describe("os blocos de contexto do detalhe", () => {
  it("a casca é Card + CardToolbar do design system, com esqueleto", () => {
    const casca = ler("bloco-contexto")
    expect(casca).toContain('from "@/components/ui/card"')
    expect(casca).toContain("<CardToolbar")
    expect(casca).toContain("CardSkeleton")
  })

  it.each(BLOCOS)("%s veste a casca, com esqueleto", (nome) => {
    const fonte = ler(nome)
    expect(fonte).toContain("<BlocoContexto")
    expect(fonte).toContain("<BlocoContextoEsqueleto")
  })

  // A Parcelada lê o resumo que o painel já calculou: não tem consulta para falhar.
  it.each(BLOCOS.filter((n) => n !== "bloco-parcelada"))("%s some no erro da leitura", (nome) => {
    expect(ler(nome)).toMatch(/isError[^\n]*\) return null/)
  })

  it.each(BLOCOS.filter((n) => n !== "bloco-parcelada"))("%s lê pelos hooks de consulta, sem supabase direto", (nome) => {
    const fonte = ler(nome)
    expect(fonte).toMatch(/use\w+Query\(/)
    expect(fonte).not.toContain("supabase.from")
  })

  it("categoria: o orçamento na régua do sistema, com o traço do ritmo", () => {
    const fonte = ler("bloco-categoria")
    expect(fonte).toContain("bands={BUDGET_BANDS}")
    expect(fonte).toContain("marker={")
    expect(fonte).toContain("useCategoryDetailBundleQuery")
    expect(fonte).toContain("categoryDetailPath(")
    expect(fonte).toContain("hrefDaLista(")
    expect(fonte).toContain('papel === "guest"')
  })

  it("fatura: o cálculo de Cartões, e o convidado não a vê", () => {
    const fonte = ler("bloco-fatura")
    for (const t of [
      "invoiceWindowForPurchaseDate",
      "sumCreditCardExpensesInWindow",
      "sumCreditCardRefundsInWindow",
      "creditCardInvoiceBadgeForRow",
      "chavesDeFaturasPagas",
      "creditCardDetailPath(",
      'papel === "guest"',
    ]) {
      expect(fonte).toContain(t)
    }
  })

  it("a casca recua o corpo como o título da tira", () => {
    expect(ler("bloco-contexto")).toMatch(/<CardContent className="[^"]*px-\(--card-strip-px\)/)
  })

  it("histórico (U1): esta contra a média no selo, barras sem eixo com a régua da média, esta acesa", () => {
    const fonte = ler("bloco-historico")
    expect(fonte).toContain("historicoDe(")
    expect(fonte).toContain("<ChartContainer")
    expect(fonte).not.toMatch(/ChartBars|ChartXAxis|ChartYAxis|XAxis|YAxis|--chart-1/)
    expect(fonte).toContain("<Cell")
    expect(fonte).toContain('<ChartReferenceLine y={historico.media} tone="average"')
    expect(fonte).toContain("contraAMedia(valor, historico.media)")
    // O selo mora no canto da tira, no lugar do "Ver os N".
    expect(fonte).toContain("canto={")
    expect(fonte).not.toContain("rotuloVerOs(")
    expect(fonte).toContain('color: "var(--primary-accent)"')
    expect(fonte).toContain('operator: "contains"')
  })

  it("histórico: desligado não calcula nem manda a manchete, mesmo com cache", () => {
    const fonte = ler("bloco-historico")
    expect(fonte).toContain("if (!ligado || !consulta.data) return { historico: undefined, duplicado: null }")
  })

  it("histórico: o link leva a mesma janela de 90 dias que a contagem", () => {
    const fonte = ler("bloco-historico")
    expect(fonte).toMatch(/field: "periodo", operator: "is", values: \[de, ymd/)
    expect(fonte).toContain("addDaysYmd(ymd, -89)")
  })

  it("categoria: C4, a fatia do lançamento e o peso", () => {
    const fonte = ler("bloco-categoria")
    for (const t of [
      "fatiaDoLancamento(",
      "rotuloDoPeso(",
      "rotuloDaVariacao(",
      '"ver a categoria"',
      'variant="secondary"',
    ]) {
      expect(fonte).toContain(t)
    }
  })

  it("categoria: a fatia e o peso só com o lançamento no mês (o cartão conta no fechamento)", () => {
    const fonte = ler("bloco-categoria")
    expect(fonte).toMatch(/const noMes = gasto > 0 && bundle\.txs\.some\(\(x\) => x\.id === t\.id\)/)
    expect(fonte).toContain("highlight={fatia}")
    expect(fonte).toMatch(/noMes \? fatiaDoLancamento\(/)
    // Sem orçamento, a barra só existe com gasto: `max={gasto}` nunca chega a 0.
    expect(fonte).toMatch(/\{gasto > 0\s*\?\s*\(?\s*<BarraNaCor/)
  })

  it("categoria: sem gasto no mês anterior, a comparação não aparece", () => {
    expect(ler("bloco-categoria")).toMatch(/anteriorTotal > 0/)
  })

  it("os links no singular passam pelo rotuloVerOs", () => {
    for (const nome of ["bloco-categoria", "bloco-receitas"]) {
      const fonte = ler(nome)
      expect(fonte, nome).toContain("rotuloVerOs(")
      expect(fonte, nome).not.toMatch(/`ver (os|as) \$/)
    }
  })

  it("categoria: sem compromisso no mês, cai no lançado, como a tela da categoria", () => {
    expect(ler("bloco-categoria")).not.toMatch(/committedTotal \?\? 0\b/)
  })

  it("parcelada: as casas do plano e o link ?plan=", () => {
    const fonte = ler("bloco-parcelada")
    expect(fonte).toContain("segments={")
    expect(fonte).toContain("?plan=")
  })

  it("parcelada: a folha do plano", () => {
    const folha = ler("folha-do-plano")
    for (const t of [
      "linhasDoPlano(",
      "estadoDoPlano(",
      "encerrarInstallmentPlan(",
      "<AlertDialog",
      "Encerrar parcelamento",
      "Excluir compra",
      "Editar plano",
      "<DropdownMenu",
      "segments=",
    ]) {
      expect(folha).toContain(t)
    }
    expect(ler("bloco-parcelada")).toContain("onVerParcelas")
    const detalhe = lerFonte("src/components/transactions/transaction-detail-sheet.tsx")
    expect(detalhe).toContain("<FolhaDoPlano")
    expect(detalhe).toContain("fetchTransactionForDetailSheet(")
  })

  it("receitas: assinaturas de receita e o link de receitas", () => {
    const fonte = ler("bloco-receitas")
    expect(fonte).toContain("useSubscriptionsQuery")
    expect(fonte).toContain('"income"')
  })

  it("receitas: a barra com a fatia desta receita e a legenda", () => {
    const fonte = ler("bloco-receitas")
    expect(fonte).toContain("legendaDaReceita(")
    expect(fonte).toContain("maximoDaBarra(")
    expect(fonte).toMatch(/<Progress[\s\S]*?highlight=/)
    expect(fonte).toContain("Esta, ")
  })

  it("dinheiro pelo MoneyDisplay ou currencyBRL, links pelos helpers", () => {
    for (const nome of BLOCOS) {
      const fonte = ler(nome)
      expect(fonte).toMatch(/MoneyDisplay|currencyBRL/)
      expect(fonte).not.toMatch(/href=\{?["`]\/transactions/)
    }
  })

  it("as manchetes novas: cada bloco manda a sua fatia, e o vazio quando não vale", () => {
    const h = ler("bloco-historico")
    expect(h).toContain("duplicadoDe(")
    expect(h).toContain("addDaysYmd(ymd, 2)")
    expect(h).toContain("outros")
    expect(h).toContain("duplicado:")
    expect(ler("bloco-categoria")).toContain("hrefOrcamento")
    const f = ler("bloco-fatura")
    expect(f).toContain("onManchete")
    expect(f).toContain("{ fatura: null }")
    expect(f).toContain("tituloDaFatura(")
    const r = ler("bloco-receitas")
    expect(r).toContain("onManchete")
    expect(r).toContain("{ receitas: null }")
    expect(ler("bloco-parcelada")).toMatch(/primeira:/)
    expect(ler("bloco-contexto")).toContain('"duplicado" | "fatura" | "receitas"')
  })

  it("o card da fatura: o total, vence e esta compra numa linha, sem folhinha, barra nem ponto, e a cor da categoria mora num lugar só", () => {
    const f = ler("bloco-fatura")
    expect(f).toContain("vence ${diaMesCurto(estado.dueYmd)}")
    expect(f).not.toContain("DateTile")
    expect(f).not.toContain("esta compra")
    expect(f).toContain("<CreditCardIcon")
    expect(f).toContain('estado?.slot === "open"')
    for (const fora of ["<Progress", "BarraNaCor", "PontoNaCor", "rotuloDoPesoNaFatura", "% da fatura"]) expect(f).not.toContain(fora)
    expect(ler("bloco-contexto")).toContain("tile-vivid")
    for (const nome of ["bloco-fatura", "bloco-categoria"]) expect(ler(nome)).not.toContain("tile-vivid")
  })

  it("o saldo do mês: as contas do Painel, entrou, saiu e sobra, e o link do mês", () => {
    const s = ler("bloco-saldo-do-mes")
    for (const t of ["aggregateIncomeExpenseForMonth", "buildCreditCardClosingLookup", "useCreditCardsQuery", '"Saldo de "', '"entrou"', '"saiu"', '"sobra"', '"Ver o mês"'])
      expect(s).toContain(t)
    expect(s).not.toMatch(/tone="(success|destructive)"/)
    expect(lerFonte("src/components/transactions/transaction-detail-sheet.tsx")).toContain("<BlocoSaldoDoMes")
  })

  it("as receitas nos últimos 6 meses: as somas por mês, o selo contra o anterior e as barras", () => {
    const f = ler("bloco-receitas-no-tempo")
    for (const t of ["receitasPorMes(", "seloContraOAnterior(", "<ChartContainer", '"Receitas nos últimos 6 meses"', "var(--income)", "canto={"])
      expect(f).toContain(t)
    expect(f).not.toMatch(/var\(--success\)/)
    expect(lerFonte("src/components/transactions/transaction-detail-sheet.tsx")).toContain("<BlocoReceitasNoTempo")
  })
})
