import { describe, expect, it } from "vitest"

import {
  corteDoMesAnterior,
  descricaoSemParcela,
  diaMesCurto,
  hrefDaLista,
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
      ultimaEhEsteOuProximo: true,
      valorParcela: 253.5,
    })
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
