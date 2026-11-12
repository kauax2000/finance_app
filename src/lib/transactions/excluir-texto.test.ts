import { describe, expect, it } from "vitest"
import type { LinhaAExcluir } from "./excluir-texto"
import { textoDaExclusao } from "./excluir-texto"

const comum = (over: Partial<LinhaAExcluir> = {}): LinhaAExcluir => ({
  id: "u1",
  description: "Uber",
  date: "2026-11-11",
  amount: 15,
  installment_plan_id: null,
  installment_plan: null,
  payment_method: "pix",
  payment_card: null,
  category: undefined,
  ...over,
})

const plano = (generated_count: number, total_installments = 3) => ({
  id: "p1",
  total_installments,
  installment_amount: 60,
  final_installment_amount: 60,
  generated_count,
  is_active: true,
  next_billing_date: "2026-12-11",
  description: "Cadeira",
  category_id: null,
  payment_method: "pix" as const,
  payment_credit_card_id: null,
})

const parcela = (id: string, k: number, generated = 1): LinhaAExcluir =>
  comum({
    id,
    description: `Cadeira (${k}/3)`,
    amount: 60,
    installment_plan_id: "p1",
    installment_plan: plano(generated) as LinhaAExcluir["installment_plan"],
  })

describe("textoDaExclusao", () => {
  it("um lançamento comum: o título nomeia, o cartão mostra dia e meio", () => {
    const t = textoDaExclusao([comum()])
    expect(t.titulo).toBe("Excluir Uber?")
    expect(t.descricao).toBe("Sai do extrato e não dá para desfazer.")
    expect(t.acao).toBe("excluir")
    expect(t.itens).toHaveLength(1)
    expect(t.itens[0].detalhe).toMatch(/^11 nov · /)
    expect(t.itens[0].valor).toBe(15)
    expect(t.nota).toBeNull()
  })

  it("sem descrição usa a categoria; sem nada, 'lançamento'", () => {
    const cat = { name: "Mercado" } as LinhaAExcluir["category"]
    expect(textoDaExclusao([comum({ description: "", category: cat })]).titulo).toBe("Excluir Mercado?")
    expect(textoDaExclusao([comum({ description: null })]).titulo).toBe("Excluir lançamento?")
  })

  it("uma parcela: a compra inteira, com lançadas e previstas no plural certo", () => {
    const t = textoDaExclusao([parcela("c1", 1)])
    expect(t.titulo).toBe("Excluir a compra parcelada Cadeira?")
    expect(t.descricao).toBe("As 3 parcelas saem: 1 lançada e 2 previstas. Não dá para desfazer.")
    expect(t.acao).toBe("excluir compra")
    expect(t.itens[0].nome).toBe("Cadeira")
    expect(t.itens[0].detalhe).toMatch(/^3× de R\$\s?60,00 · /)
    expect(t.itens[0].valor).toBe(180)
  })

  it("plural nos dois lados e singular na prevista", () => {
    expect(textoDaExclusao([parcela("c1", 1, 2)]).descricao).toBe(
      "As 3 parcelas saem: 2 lançadas e 1 prevista. Não dá para desfazer."
    )
  })

  it("todas lançadas: omite a parte zerada", () => {
    expect(textoDaExclusao([parcela("c1", 3, 3)]).descricao).toBe("As 3 parcelas lançadas saem. Não dá para desfazer.")
  })

  it("sem plano embutido: a frase genérica e o valor da parcela", () => {
    const t = textoDaExclusao([comum({ description: "Cadeira (1/3)", amount: 60, installment_plan_id: "p1" })])
    expect(t.titulo).toBe("Excluir a compra parcelada Cadeira?")
    expect(t.descricao).toBe("A compra parcelada inteira sai, com todas as parcelas. Não dá para desfazer.")
    expect(t.itens[0].valor).toBe(60)
  })

  it("duas parcelas do mesmo plano contam 1 item (e viram o caso da compra)", () => {
    const t = textoDaExclusao([parcela("c1", 1), parcela("c2", 2)])
    expect(t.itens).toHaveLength(1)
    expect(t.titulo).toBe("Excluir a compra parcelada Cadeira?")
  })

  it("seleção: conta cada compra uma vez e põe a nota", () => {
    const t = textoDaExclusao([comum(), comum({ id: "q", description: "Queijo" }), parcela("c1", 1), parcela("c2", 2)])
    expect(t.titulo).toBe("Excluir 3 itens?")
    expect(t.descricao).toBe("Saem do extrato e não dá para desfazer.")
    expect(t.acao).toBe("excluir 3")
    expect(t.nota).toBe("A Cadeira é uma compra parcelada: as 3 parcelas saem juntas.")
  })

  it("seleção com várias compras: a nota no plural; sem compra, sem nota", () => {
    const outra = comum({ id: "x", description: "Sofá (1/2)", installment_plan_id: "p2" })
    expect(textoDaExclusao([parcela("c1", 1), outra]).nota).toBe("2 compras parceladas saem inteiras, com todas as parcelas.")
    expect(textoDaExclusao([comum(), comum({ id: "q" })]).nota).toBeNull()
  })
})
