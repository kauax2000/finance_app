import { describe, expect, it } from "vitest"

import {
  corteDoMesAnterior,
  descricaoSemParcela,
  diaMesCurto,
  fatiaDoLancamento,
  hrefDaLista,
  rotuloDaVariacao,
  rotuloDoPeso,
  rotuloDoResto,
  rotuloVerOs,
  marcadorDoMes,
  mesPorExtenso,
  tituloDaFatura,
  totalAteODia,
  ultimaParcela,
} from "./blocos"

const hoje = new Date(2026, 10, 10)

describe("marcadorDoMes", () => {
  it("é o dia sobre os dias do mês, em %", () => {
    expect(marcadorDoMes(hoje)).toBeCloseTo((10 / 30) * 100)
  })
})

describe("o mês anterior até o mesmo dia", () => {
  it("corta no mesmo dia, ou no último do mês mais curto", () => {
    expect(corteDoMesAnterior("2026-11", 10)).toBe("2026-10-10")
    expect(corteDoMesAnterior("2026-03", 31)).toBe("2026-02-28")
  })

  it("soma as despesas até o corte e abate o estorno no cartão", () => {
    const txs = [
      { type: "expense", amount: 100, date: "2026-10-03T12:00:00Z" },
      { type: "expense", amount: 140, date: "2026-10-10T12:00:00Z" },
      { type: "expense", amount: 999, date: "2026-10-11T12:00:00Z" },
      { type: "income", amount: 40, date: "2026-10-05", payment_method: "credit_card", payment_credit_card_id: "c" },
      { type: "income", amount: 500, date: "2026-10-05" },
    ]
    expect(totalAteODia(txs, "2026-10-10")).toBe(200)
  })
})

describe("textos", () => {
  it("o mês por extenso e o dia curto", () => {
    expect(mesPorExtenso("2026-10")).toBe("outubro")
    expect(diaMesCurto("2026-12-09")).toBe("9/dez")
  })

  it("a fatura leva o mês do vencimento, e sem ele o do fechamento", () => {
    expect(tituloDaFatura("2026-12-05", "2026-11-26")).toBe("Fatura de dezembro")
    expect(tituloDaFatura(null, "2026-11-26")).toBe("Fatura de novembro")
  })

  it("o link no singular lê natural; no plural, ver os N", () => {
    expect(rotuloVerOs(1, "despesa")).toBe("ver o lançamento")
    expect(rotuloVerOs(3, "despesa")).toBe("ver os 3")
    expect(rotuloVerOs(1, "receita")).toBe("ver a receita")
    expect(rotuloVerOs(2, "receita")).toBe("ver as 2")
  })

  it("a descrição sai sem o (k/n)", () => {
    expect(descricaoSemParcela("Geladeira (1/2)")).toBe("Geladeira")
  })
})

describe("hrefDaLista", () => {
  it("escreve f= que a lista lê de volta", () => {
    const href = hrefDaLista([{ field: "descricao", operator: "contains", values: ["a:b"] }], "income")
    const p = new URL(href, "http://x").searchParams
    expect(href.startsWith("/transactions?")).toBe(true)
    expect(p.get("type")).toBe("income")
    expect(p.get("f")).toBe("descricao:contains:a%3Ab")
  })
})

describe("ultimaParcela", () => {
  const plano = { next_billing_date: "2026-12-09", installment_amount: 253.5 }
  it("estima a última pelas pendentes a partir da próxima cobrança", () => {
    const linhas = [
      { date: "2026-11-09", status: "posted" as const },
      { date: null, status: "pending" as const },
    ]
    expect(ultimaParcela(plano, linhas, hoje)).toEqual({
      ultimaNoMes: "dezembro",
      ultimaComAno: "dezembro de 2026",
      ultimaEhEsteOuProximo: true,
      valorParcela: 253.5,
    })
  })

  it("o ano vem sempre, no mês e no ano", () => {
    const linhas = [{ date: "2027-10-09", status: "posted" as const }]
    expect(ultimaParcela(plano, linhas, hoje)?.ultimaComAno).toBe("outubro de 2027")
  })

  it("longe do fim não é este nem o próximo", () => {
    const linhas = [
      { date: "2026-11-09", status: "posted" as const },
      { date: null, status: "pending" as const },
      { date: null, status: "pending" as const },
      { date: null, status: "pending" as const },
    ]
    expect(ultimaParcela(plano, linhas, hoje)?.ultimaEhEsteOuProximo).toBe(false)
  })

  it("sem data nem próxima cobrança, não diz nada", () => {
    expect(ultimaParcela({ next_billing_date: null, installment_amount: 10 }, [{ date: null, status: "pending" }], hoje)).toBeNull()
  })
})

describe("rotuloDoResto", () => {
  it("dias que faltam no mês corrente, no singular e no último dia", () => {
    expect(rotuloDoResto(100, true, 5).replace(/\s/g, " ")).toBe("faltam R$ 100,00 · 5 dias")
    expect(rotuloDoResto(100, true, 1).replace(/\s/g, " ")).toBe("faltam R$ 100,00 · 1 dia")
    expect(rotuloDoResto(100, true, 0).replace(/\s/g, " ")).toBe("faltam R$ 100,00 · último dia")
  })
  it("mês passado e estouro", () => {
    expect(rotuloDoResto(100, false, 0).replace(/\s/g, " ")).toBe("sobraram R$ 100,00")
    expect(rotuloDoResto(-50, true, 3).replace(/\s/g, " ")).toBe("R$ 50,00 acima do orçamento")
  })
})

describe("C4: a fatia do lançamento no mês", () => {
  it("a fatia termina no gasto e começa o valor antes, sem passar de zero", () => {
    expect(fatiaDoLancamento(920, 220)).toEqual({ from: 700, to: 920 })
    expect(fatiaDoLancamento(30.2, 50)).toEqual({ from: 0, to: 30.2 })
  })

  it("o peso do lançamento no mês", () => {
    expect(rotuloDoPeso(30.2, 30.2, 1)).toBe("este lançamento é o único do mês")
    expect(rotuloDoPeso(220, 920, 9).replace(/\s/g, " ")).toBe("este lançamento: R$ 220,00 (24% do mês)")
    expect(rotuloDoPeso(10, 0, 3).replace(/\s/g, " ")).toBe("este lançamento: R$ 10,00")
  })

  it("a variação contra o mês anterior, e nada sem base ou sem mudança", () => {
    expect(rotuloDaVariacao(30.2, 57.6, "setembro", null)).toEqual({ texto: "\u221248% que setembro", bom: true })
    expect(rotuloDaVariacao(142, 118, "outubro", 11)).toEqual({ texto: "+20% que outubro até dia 11", bom: false })
    expect(rotuloDaVariacao(10, 0, "outubro", null)).toBeNull()
    expect(rotuloDaVariacao(10, 10, "outubro", null)).toBeNull()
  })
})
