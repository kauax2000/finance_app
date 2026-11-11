import { describe, expect, it } from "vitest"

import { escolherManchete, historicoDe, normalizarDescricao, projecaoDoMes } from "./contexto"

const hoje = new Date(2026, 10, 10)
const mercado = (gasto: number, orcamento: number | null, mes = "novembro") => ({
  nome: "Mercado",
  mes,
  gasto,
  orcamento,
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
  })
  it("projeção acima do orçamento, a partir do dia 5", () => {
    const m = escolherManchete({ mesCorrente: true, hoje, categoria: mercado(400, 1000) })
    expect(sp(m!.texto)).toBe(
      "No ritmo de agora, Mercado fecha novembro em R$ 1.200,00, R$ 200,00 acima do orçamento."
    )
  })
  it("antes do dia 5 não projeta", () => {
    expect(
      escolherManchete({ mesCorrente: true, hoje: new Date(2026, 10, 4), categoria: mercado(300, 1000) })
    ).toBeNull()
  })
  it("mês passado", () => {
    const m = escolherManchete({ mesCorrente: false, hoje, categoria: mercado(1240, 1000, "outubro") })
    expect(sp(m!.texto)).toBe("Mercado fechou outubro em R$ 1.240,00, 24% acima do orçamento.")
  })
  it("preço fora do normal", () => {
    const m = escolherManchete({ mesCorrente: true, hoje, historico: { nome: "Uber", valor: 43.97, media: 28.8 } })
    expect(m?.tom).toBe("info")
    expect(sp(m!.texto)).toBe("Este Uber custou 53% mais que a sua média (R$ 28,80).")
  })
  it("abaixo de 30% não fala", () => {
    expect(
      escolherManchete({ mesCorrente: true, hoje, historico: { nome: "Uber", valor: 35, media: 28.8 } })
    ).toBeNull()
  })
  it("fim das parcelas", () => {
    const m = escolherManchete({
      mesCorrente: true,
      hoje,
      parcela: { ultimaNoMes: "dezembro", ultimaEhEsteOuProximo: true, valorParcela: 253.5 },
    })
    expect(m?.tom).toBe("success")
    expect(sp(m!.texto)).toBe("Última parcela em dezembro. Depois, R$ 253,50 a mais por mês.")
  })
  it("orçamento vence histórico e parcela", () => {
    const m = escolherManchete({
      mesCorrente: true,
      hoje,
      categoria: mercado(1120, 1000),
      historico: { nome: "Uber", valor: 100, media: 10 },
      parcela: { ultimaNoMes: "dezembro", ultimaEhEsteOuProximo: true, valorParcela: 10 },
    })
    expect(m?.texto).toMatch(/passou do orçamento/)
  })
  it("histórico vence parcela", () => {
    const m = escolherManchete({
      mesCorrente: true,
      hoje,
      historico: { nome: "Uber", valor: 100, media: 10 },
      parcela: { ultimaNoMes: "dezembro", ultimaEhEsteOuProximo: true, valorParcela: 10 },
    })
    expect(m?.tom).toBe("info")
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
