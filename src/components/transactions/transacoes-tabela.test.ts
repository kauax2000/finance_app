import { describe, expect, expectTypeOf, it } from "vitest"
import { PROJECTED_TRANSACTION_ID_PREFIX } from "@/lib/category-expense-month-rows"
import type { Transaction } from "@/lib/supabase"
import { signedCurrencyBRL } from "@/lib/formatters"
import type { FonteDaTabela } from "./transacoes-tabela"
import type { TelaDeTransacoes } from "./use-transacoes-da-tela"
import { lerFonte, semComentarios } from "@/test/fonte"
import {
    diaLocalDe,
    ordemDepoisDoClique,
    parcelaDe,
    tipoDoLote,
    totalDoDia,
    totalDoDiaEmTexto,
} from "./transacoes-tabela-regras"

const tx = (p: Partial<Transaction>) => ({ id: "x", type: "expense", amount: 10, date: "2026-11-07", ...p }) as Transaction

describe("regras da tabela de transações", () => {
    it("o total do dia é receitas − despesas, sem as projetadas", () => {
        expect(totalDoDia([tx({ type: "income", amount: 100 }), tx({ amount: 30.1 }), tx({ amount: 9.9 })])).toBe(60)
        expect(totalDoDia([tx({ amount: 5, id: `${PROJECTED_TRANSACTION_ID_PREFIX}1` })])).toBe(0)
    })
    it("o total do dia no telefone soma as saídas, ou as entradas se nada saiu", () => {
        expect(totalDoDiaEmTexto([tx({ amount: 29.09 }), tx({ amount: 213.36 }), tx({ type: "income", amount: 5 })])).toBe(signedCurrencyBRL(-242.45))
        expect(totalDoDiaEmTexto([tx({ type: "income", amount: 1200 })])).toBe(signedCurrencyBRL(1200))
        expect(totalDoDiaEmTexto([tx({ amount: 5, id: `${PROJECTED_TRANSACTION_ID_PREFIX}1` })])).toBeNull()
    })
    it("a parcela do fim da descrição vira \"2 de 3\"", () => {
        expect(parcelaDe("Botox Renata (2/3)")).toBe("2 de 3")
        expect(parcelaDe("Mercado")).toBeNull()
        expect(parcelaDe("Zara (1/12)")).toBe("1 de 12")
    })
    it("o gasto sai sem vermelho e a parcela vai para a legenda do telefone", () => {
        const fonte = semComentarios(lerFonte("src/components/transactions/transacoes-tabela.tsx"))
        expect(fonte).toContain('accessor: valorComSinal, tone: "income"')
        expect(fonte).toContain("{descricaoNaTabela(t)}")
        expect(fonte).toContain("parcelaDe(")
    })
    it("a tela liga o cartão por dia e tira o pagamento único da legenda", () => {
        const fonte = semComentarios(lerFonte("src/components/transactions/transacoes-tabela.tsx"))
        expect(fonte).toContain('mobileGroups="inset"')
        expect(fonte).toContain('mobile: pagamentoUnico ? undefined : "description"')
    })
    it("o tipo do lote é nulo vazio ou misturado", () => {
        expect(tipoDoLote([])).toBeNull()
        expect(tipoDoLote([tx({}), tx({})])).toBe("expense")
        expect(tipoDoLote([tx({}), tx({ type: "income" })])).toBeNull()
    })
    it("clicar na mesma coluna inverte; outra começa decrescente", () => {
        expect(ordemDepoisDoClique({ key: "date", dir: "desc" }, "date")).toEqual({ key: "date", dir: "asc" })
        expect(ordemDepoisDoClique({ key: "date", dir: "asc" }, "amount")).toEqual({ key: "amount", dir: "desc" })
    })
    it("o dia local não volta um dia pelo fuso", () => {
        expect(new Date(diaLocalDe(tx({ date: "2026-11-07" }))).getDate()).toBe(7)
    })
})

describe("fonte da tabela", () => {
    const fonte = semComentarios(lerFonte("src/components/transactions/transacoes-tabela.tsx"))
    it("agrupa por dia com os helpers de data", () => {
        expect(fonte).toContain("groupByLocalDay")
        expect(fonte).toContain("formatDayHeadingPtBr(g.data, undefined, { semana: true })")
        expect(fonte).toContain("groupTotal")
    })
    it("sem forma de pagar, a legenda do telefone não ganha o \"—\"", () => {
        expect(fonte).toContain("mobileWhen: (t: Transaction) => Boolean(t.payment_method)")
    })
    it("não tem a coluna Tipo", () => {
        expect(fonte).not.toMatch(/header:\s*"Tipo"/)
    })
    it("o lote tem Categorizar e Marcar conferidos; a linha, Confirmar", () => {
        expect(fonte).toMatch(/bulkActions[\s\S]*"Categorizar"[\s\S]*"Marcar conferidos"/)
        expect(fonte).toContain('label: "Confirmar"')
        expect(fonte).toContain('id = "transactions"')
        expect(fonte).toContain("{barra}")
        expect(fonte).toMatch(/toolbar=\{\{ start: .*\{barra\}.* \}\}/)
        expect(fonte).toContain("Selecione só despesas ou só receitas")
    })
    it("a Categoria é só o nome; a cor fica no ladrilho da Descrição", () => {
        expect(fonte).not.toContain("tileColorFor")
        expect(fonte).not.toContain("--badge-dot")
        expect(fonte.match(/<ColorTile size="xs" color=\{/g)?.length).toBe(1)
        expect(fonte).toContain("return parcela ? `${c.name} · ${parcela}` : c.name")
        expect(fonte).toContain('label: "Categoria", mobile: "description", desktop: false')
        expect(fonte).not.toContain("block truncate")
    })
    it("os vazios da §6.5", () => {
        expect(fonte).toContain("Seu primeiro lançamento")
        expect(fonte).toContain("Nenhum lançamento com esses filtros")
        expect(fonte).toContain("Tudo conferido")
        expect(fonte).toContain('variant="done"')
    })
})

describe("o total do dia de um dia só de previstas", () => {
    it("não existe", async () => {
        const { totalDoDiaEmTexto } = await import("./transacoes-tabela-regras")
        expect(totalDoDiaEmTexto([])).toBeNull()
    })
})

describe("o contrato estreito da tabela", () => {
    const fonte = () => semComentarios(lerFonte("src/components/transactions/transacoes-tabela.tsx"))
    it("a tabela lê a FonteDaTabela, não a TelaDeTransacoes", () => {
        expect(fonte()).toMatch(/export type FonteDaTabela/)
        expect(fonte()).not.toMatch(/tela:\s*TelaDeTransacoes/)
        expectTypeOf<TelaDeTransacoes>().toMatchTypeOf<FonteDaTabela>()
    })
    it("filtroNaBarra segura a barra à vista no vazio por filtro", () => {
        expect(fonte()).toMatch(/vazioPorFiltro && !filtroNaBarra && "max-md:hidden"/)
    })
    it("onEditarFiltros vence o filtro publicado no cabeçalho", () => {
        expect(fonte()).toMatch(/onEditarFiltros \?\? \(\(\) => filtroPublicado\?\.onOpen\?\.\(\)\)/)
    })
    it("semCategoria tira a coluna da categoria e o nome dela ao lado da descrição", () => {
        expect(fonte()).toMatch(/colunas\([^)]*semCategoria\)\.filter\(\(c\) => !\(semCategoria && c\.id === "category"\)\)/)
        expect(fonte()).toMatch(/!semCategoria && t\.category && t\.description \?/)
    })
    it("vazio, id e ariaLabel entram por prop", () => {
        expect(fonte()).toMatch(/id=\{id\}/)
        expect(fonte()).toMatch(/aria-label=\{ariaLabel\}/)
        expect(fonte()).toMatch(/estado\.filtros\.length === 0 && !estado\.q && vazioDeFora/)
        expect(fonte()).toMatch(/tela\.pedidosDeAbertura \?/)
    })
})
