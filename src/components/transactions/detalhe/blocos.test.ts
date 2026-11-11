import { describe, expect, it } from "vitest"

import { lerFonte } from "@/test/fonte"

const pasta = "src/components/transactions/detalhe"
const ler = (nome: string) => lerFonte(`${pasta}/${nome}.tsx`)
const BLOCOS = ["bloco-categoria", "bloco-fatura", "bloco-historico", "bloco-receitas", "bloco-parcelada"]

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

  it("histórico: barras pequenas, sem eixo; as passadas neutras e esta acesa, por token", () => {
    const fonte = ler("bloco-historico")
    expect(fonte).toContain("historicoDe(")
    expect(fonte).toContain("<ChartContainer")
    expect(fonte).not.toMatch(/ChartBars|ChartXAxis|ChartYAxis|XAxis|YAxis|--chart-1/)
    expect(fonte).toContain("<Cell")
    expect(fonte).toContain('color: "var(--primary-accent)"')
    expect(fonte).toContain('operator: "contains"')
  })

  it("histórico: desligado não calcula nem manda a manchete, mesmo com cache", () => {
    const fonte = ler("bloco-historico")
    expect(fonte).toContain("if (!ligado || !consulta.data) return undefined")
  })

  it("histórico: o link leva a mesma janela de 90 dias que a contagem", () => {
    const fonte = ler("bloco-historico")
    expect(fonte).toMatch(/field: "periodo", operator: "is", values: \[de, ymd/)
    expect(fonte).toContain("addDaysYmd(ymd, -89)")
  })

  it("categoria: sem gasto no mês anterior, a comparação não aparece", () => {
    expect(ler("bloco-categoria")).toMatch(/anteriorTotal > 0/)
  })

  it("os links no singular passam pelo rotuloVerOs", () => {
    for (const nome of ["bloco-categoria", "bloco-historico", "bloco-receitas"]) {
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

  it("receitas: assinaturas de receita e o link de receitas", () => {
    const fonte = ler("bloco-receitas")
    expect(fonte).toContain("useSubscriptionsQuery")
    expect(fonte).toContain('"income"')
  })

  it("dinheiro pelo MoneyDisplay ou currencyBRL, links pelos helpers", () => {
    for (const nome of BLOCOS) {
      const fonte = ler(nome)
      expect(fonte).toMatch(/MoneyDisplay|currencyBRL/)
      expect(fonte).not.toMatch(/href=\{?["`]\/transactions/)
    }
  })
})
