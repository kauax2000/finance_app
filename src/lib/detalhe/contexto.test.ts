import { describe, expect, it } from "vitest"

import { duplicadoDe, escolherManchete, historicoDe, normalizarDescricao, projecaoDoMes } from "./contexto"

const hoje = new Date(2026, 10, 10)
const mercado = (gasto: number, orcamento: number | null, mes = "novembro", lancado = gasto) => ({
  nome: "Mercado",
  mes,
  gasto,
  lancado,
  orcamento,
  hrefOrcamento: orcamento === null ? null : "/categories/mercado?month=2026-11",
})
const verOrcamento = { href: "/categories/mercado?month=2026-11", label: "Ver orçamento" }
const hist = (valor: number, media: number, outros: number[] = [10, 50]) => ({
  nome: "Uber",
  valor,
  media,
  outros,
  href: "/h",
})
const parc = (o = {}) => ({
  ultimaNoMes: "dezembro",
  ultimaComAno: "dezembro de 2026",
  ultimaEhEsteOuProximo: true,
  valorParcela: 10,
  primeira: null,
  ...o,
})
const sp = (s: string) => s.replace(/\s/g, " ")

describe("normalizarDescricao", () => {
  it("tira parcela, acento, caixa e espaço duplo", () => {
    expect(normalizarDescricao("Pão  (1/2)")).toBe("pao")
    expect(normalizarDescricao("  UBER   Trip ")).toBe("uber trip")
  })
})

describe("projecaoDoMes", () => {
  it("projeta pelo dia do mês", () => {
    expect(projecaoDoMes(400, hoje)).toBe(1200)
  })
})

describe("escolherManchete", () => {
  it("orçamento estourado", () => {
    const m = escolherManchete({ mesCorrente: true, hoje, categoria: mercado(1120, 1000) })
    expect(m?.tom).toBe("warning")
    expect(sp(m!.texto)).toBe("Mercado passou do orçamento de novembro em R$ 120,00.")
    expect(m?.acao).toEqual(verOrcamento)
  })
  it("projeção acima do orçamento, a partir do dia 5", () => {
    const m = escolherManchete({ mesCorrente: true, hoje, categoria: mercado(400, 1000) })
    expect(sp(m!.texto)).toBe(
      "No ritmo de agora, Mercado fecha novembro em R$ 1.200,00, R$ 200,00 acima do orçamento."
    )
    expect(m?.acao).toEqual(verOrcamento)
  })
  it("antes do dia 5 não projeta", () => {
    expect(
      escolherManchete({ mesCorrente: true, hoje: new Date(2026, 10, 4), categoria: mercado(300, 1000) })
    ).toBeNull()
  })
  it("mês passado", () => {
    const m = escolherManchete({ mesCorrente: false, hoje, categoria: mercado(1240, 1000, "outubro") })
    expect(sp(m!.texto)).toBe("Mercado fechou outubro em R$ 1.240,00, 24% acima do orçamento.")
    expect(m?.acao).toEqual(verOrcamento)
  })
  it("sem hrefOrcamento (convidado), sem ação", () => {
    const m = escolherManchete({
      mesCorrente: true,
      hoje,
      categoria: { ...mercado(1120, 1000), hrefOrcamento: null },
    })
    expect(m?.acao).toBeUndefined()
  })
  it("o agendado não entra no ritmo: aluguel do dia 25, nada lançado, não projeta", () => {
    const aluguel = { nome: "Moradia", mes: "novembro", gasto: 2000, lancado: 0, orcamento: 2600, hrefOrcamento: null }
    expect(escolherManchete({ mesCorrente: true, hoje, categoria: aluguel })).toBeNull()
  })
  it("projeta o lançado e soma o agendado", () => {
    // 300 lançados até o dia 10 → 900 no mês, mais 200 agendados = 1.100.
    const m = escolherManchete({ mesCorrente: true, hoje, categoria: mercado(500, 1000, "novembro", 300) })
    expect(sp(m!.texto)).toBe(
      "No ritmo de agora, Mercado fecha novembro em R$ 1.100,00, R$ 100,00 acima do orçamento."
    )
  })
  it("mês passado por pouco diz 1%, nunca 0%", () => {
    const m = escolherManchete({ mesCorrente: false, hoje, categoria: mercado(1000.4, 1000, "outubro") })
    expect(sp(m!.texto)).toBe("Mercado fechou outubro em R$ 1.000,40, 1% acima do orçamento.")
  })
  it("preço fora do normal", () => {
    const m = escolherManchete({ mesCorrente: true, hoje, historico: hist(43.97, 28.8) })
    expect(m?.tom).toBe("info")
    expect(sp(m!.texto)).toBe("Este Uber custou 53% mais que a sua média (R$ 28,80).")
  })
  it("abaixo de 30% não fala", () => {
    expect(
      escolherManchete({ mesCorrente: true, hoje, historico: hist(35, 28.8) })
    ).toBeNull()
  })
  it("fim das parcelas", () => {
    const m = escolherManchete({
      mesCorrente: true,
      hoje,
      parcela: parc({ valorParcela: 253.5 }),
    })
    expect(m?.tom).toBe("success")
    expect(sp(m!.texto)).toBe("Última parcela em dezembro. Depois, R$ 253,50 a mais por mês.")
  })
  it("orçamento vence histórico e parcela", () => {
    const m = escolherManchete({
      mesCorrente: true,
      hoje,
      categoria: mercado(1120, 1000),
      historico: hist(100, 10),
      parcela: parc(),
    })
    expect(m?.texto).toMatch(/passou do orçamento/)
  })
  it("histórico vence parcela", () => {
    const m = escolherManchete({
      mesCorrente: true,
      hoje,
      historico: hist(100, 10),
      parcela: parc(),
    })
    expect(m?.tom).toBe("info")
  })
})

describe("manchetes novas", () => {
  const dup = { nome: "Netflix", valor: 55.9, dia: "10 de nov", href: "/transactions?f=x" }
  const fat = (total: number, valor: number) => ({ rotulo: "fatura de dezembro", total, valor })

  it("N1 repetido, com ação, vence orçamento estourado", () => {
    const m = escolherManchete({ mesCorrente: true, hoje, duplicado: dup, categoria: mercado(1120, 1000) })
    expect(m?.tom).toBe("destructive")
    expect(sp(m!.texto)).toBe("Parece repetido: há outro Netflix de R$ 55,90 em 10 de nov.")
    expect(m?.acao).toEqual({ href: "/transactions?f=x", label: "Ver os 2" })
  })
  it("N2 subiu, com ação do histórico", () => {
    const m = escolherManchete({ mesCorrente: true, hoje, historico: hist(59.9, 55.9, [55.9, 55.9]) })
    expect(m?.tom).toBe("warning")
    expect(sp(m!.texto)).toBe("Uber subiu de R$ 55,90 para R$ 59,90 (+7%).")
    expect(m?.acao).toEqual({ href: "/h", label: "Ver cobranças" })
  })
  it("N2 vale mesmo abaixo de 30% e vence o 4 quando só ele valeria", () => {
    expect(escolherManchete({ mesCorrente: true, hoje, historico: hist(100, 50, [50, 50]) })?.texto).toMatch(/subiu de/)
  })
  it("N2 não vale com outros diferentes", () => {
    const m = escolherManchete({ mesCorrente: true, hoje, historico: hist(31, 28.8, [28, 31, 27]) })
    expect(m).toBeNull()
  })
  it("N2 não vale se esta não é maior", () => {
    expect(escolherManchete({ mesCorrente: true, hoje, historico: hist(10, 10, [10, 10]) })).toBeNull()
  })
  it("caso 3 (ritmo) vence N2", () => {
    const m = escolherManchete({
      mesCorrente: true,
      hoje,
      categoria: mercado(400, 1000),
      historico: hist(60, 50, [50, 50]),
    })
    expect(m?.texto).toMatch(/No ritmo de agora/)
  })
  it("N3 perto do orçamento", () => {
    const m = escolherManchete({
      mesCorrente: true,
      hoje: new Date(2026, 10, 4),
      categoria: mercado(850, 1000),
    })
    expect(m?.tom).toBe("warning")
    expect(sp(m!.texto)).toBe("Mercado já usou 85% do orçamento de novembro. Restam R$ 150,00.")
    expect(m?.acao).toEqual(verOrcamento)
  })
  it("N3 não vale com 79%, nem no mês passado", () => {
    const antes = new Date(2026, 10, 4)
    expect(escolherManchete({ mesCorrente: true, hoje: antes, categoria: mercado(790, 1000) })).toBeNull()
    expect(escolherManchete({ mesCorrente: false, hoje: antes, categoria: mercado(850, 1000) })).toBeNull()
  })
  it("N3 vale com exatamente 80%", () => {
    const m = escolherManchete({ mesCorrente: true, hoje: new Date(2026, 10, 4), categoria: mercado(800, 1000) })
    expect(sp(m!.texto)).toBe("Mercado já usou 80% do orçamento de novembro. Restam R$ 200,00.")
  })
  it("N3 vence o 4", () => {
    const m = escolherManchete({
      mesCorrente: true,
      hoje: new Date(2026, 10, 4),
      categoria: mercado(850, 1000),
      historico: hist(100, 10),
    })
    expect(m?.texto).toMatch(/já usou/)
  })
  it("N4 fatura, sem ação", () => {
    const m = escolherManchete({ mesCorrente: true, hoje, fatura: fat(1000, 200) })
    expect(m?.tom).toBe("info")
    expect(sp(m!.texto)).toBe("Esta compra é 20% da fatura de dezembro (R$ 1.000,00).")
    expect(m?.acao).toBeUndefined()
  })
  it("N4 não vale com 19% nem com total 0", () => {
    expect(escolherManchete({ mesCorrente: true, hoje, fatura: fat(1000, 190) })).toBeNull()
    expect(escolherManchete({ mesCorrente: true, hoje, fatura: fat(0, 10) })).toBeNull()
  })
  it("4 (acima da média) vence N4", () => {
    const m = escolherManchete({ mesCorrente: true, hoje, fatura: fat(1000, 500), historico: hist(100, 10) })
    expect(m?.texto).toMatch(/custou/)
  })
  it("N4 vence N5", () => {
    const m = escolherManchete({ mesCorrente: true, hoje, fatura: fat(1000, 500), historico: hist(10, 100) })
    expect(m?.texto).toMatch(/da fatura/)
  })
  it("N5 mais barato", () => {
    const m = escolherManchete({ mesCorrente: true, hoje, historico: hist(20, 30) })
    expect(m?.tom).toBe("success")
    expect(sp(m!.texto)).toBe("Este Uber saiu 33% mais barato que a sua média (R$ 30,00).")
    expect(m?.acao).toBeUndefined()
  })
  it("N5 não vale com 29%", () => {
    expect(escolherManchete({ mesCorrente: true, hoje, historico: hist(71, 100) })).toBeNull()
  })
  it("N5 vence a última parcela", () => {
    const m = escolherManchete({ mesCorrente: true, hoje, historico: hist(10, 100), parcela: parc() })
    expect(m?.texto).toMatch(/mais barato/)
  })
  it("N6 receita: info abaixo do esperado, success no igual", () => {
    const i = escolherManchete({ mesCorrente: true, hoje, receitas: { mes: "novembro", total: 3000, esperado: 5000 } })
    expect(i?.tom).toBe("info")
    expect(sp(i!.texto)).toBe("Com esta, entraram R$ 3.000,00 de R$ 5.000,00 previstos para novembro.")
    const s = escolherManchete({ mesCorrente: true, hoje, receitas: { mes: "novembro", total: 5000, esperado: 5000 } })
    expect(s?.tom).toBe("success")
    expect(sp(s!.texto)).toBe("Com esta, entraram R$ 5.000,00 — tudo o que era previsto para novembro.")
    expect(s?.acao).toBeUndefined()
  })
  it("N6 não vale com esperado 0", () => {
    expect(escolherManchete({ mesCorrente: true, hoje, receitas: { mes: "novembro", total: 10, esperado: 0 } })).toBeNull()
  })
  it("5 (última parcela) vence N6", () => {
    const m = escolherManchete({
      mesCorrente: true,
      hoje,
      parcela: parc(),
      receitas: { mes: "novembro", total: 1, esperado: 2 },
    })
    expect(m?.texto).toMatch(/Última parcela/)
  })
  it("N7 primeira parcela, só com primeira", () => {
    const m = escolherManchete({
      mesCorrente: true,
      hoje,
      parcela: parc({
        ultimaEhEsteOuProximo: false,
        ultimaComAno: "outubro de 2027",
        valorParcela: 253.5,
        primeira: { n: 12 },
      }),
    })
    expect(m?.tom).toBe("info")
    expect(sp(m!.texto)).toBe("1ª de 12 parcelas: R$ 253,50 por mês até outubro de 2027.")
    expect(m?.acao).toBeUndefined()
    expect(escolherManchete({ mesCorrente: true, hoje, parcela: parc({ ultimaEhEsteOuProximo: false }) })).toBeNull()
  })
})

describe("duplicadoDe", () => {
  const d = (id: string, date: string, amount = 55.9, description: string | null = "Netflix") => ({
    id,
    description,
    amount,
    date,
  })
  const alvo = d("a", "2026-11-08")
  it("acha o de 2 dias depois, o de antes, e o mais perto", () => {
    expect(duplicadoDe(alvo, [alvo, d("b", "2026-11-10")])?.id).toBe("b")
    expect(duplicadoDe(alvo, [alvo, d("b", "2026-11-06T12:00:00Z")])?.id).toBe("b")
    expect(duplicadoDe(alvo, [d("b", "2026-11-10"), d("c", "2026-11-09")])?.id).toBe("c")
  })
  it("ignora 3 dias, o próprio id, outro valor e outra descrição", () => {
    expect(duplicadoDe(alvo, [alvo, d("b", "2026-11-11")])).toBeNull()
    expect(duplicadoDe(alvo, [d("b", "2026-11-09", 55.91)])).toBeNull()
    expect(duplicadoDe(alvo, [d("b", "2026-11-09", 55.9, "Spotify")])).toBeNull()
  })
  it("normaliza a descrição (caixa, parcela)", () => {
    expect(duplicadoDe(alvo, [d("b", "2026-11-09", 55.9, "NETFLIX (1/3)")])?.id).toBe("b")
  })
})

describe("historicoDe", () => {
  const d = (id: string, date: string, amount: number, description = "Uber") => ({
    id,
    description,
    amount,
    date,
  })
  const alvo = d("9", "2026-11-09", 40)

  it("null com menos de 3 vezes", () => {
    expect(historicoDe(alvo, [alvo, d("1", "2026-11-01", 20)])).toBeNull()
  })
  it("conta o alvo, média das outras, normaliza", () => {
    const h = historicoDe(alvo, [
      alvo,
      d("1", "2026-11-01", 20, "UBER (1/2)"),
      d("2", "2026-11-05", 30, "uber"),
      d("3", "2026-11-06", 999, "Mercado"),
    ])
    expect(h).toMatchObject({ vezes: 3, total: 90, media: 25 })
    expect(h!.barras.map((b) => b.valor)).toEqual([20, 30, 40])
    expect(h!.barras.at(-1)?.atual).toBe(true)
  })
  it("ignora o que é depois do alvo e limita a 8 barras", () => {
    const outras = Array.from({ length: 10 }, (_, i) => d(`o${i}`, `2026-10-${String(i + 1).padStart(2, "0")}`, 10 + i))
    const h = historicoDe(alvo, [alvo, ...outras, d("f", "2026-11-20", 500)])
    expect(h!.barras).toHaveLength(8)
    expect(h!.vezes).toBe(11)
    expect(h!.barras.at(-1)).toEqual({ valor: 40, atual: true })
  })
})
