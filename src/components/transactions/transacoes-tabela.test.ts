import { describe, expect, it } from "vitest"
import { PROJECTED_TRANSACTION_ID_PREFIX } from "@/lib/category-expense-month-rows"
import type { Transaction } from "@/lib/supabase"
import { lerFonte, semComentarios } from "@/test/fonte"
import {
    diaLocalDe,
    ordemDepoisDoClique,
    tipoDoLote,
    totalDoDia,
} from "./transacoes-tabela-regras"

const tx = (p: Partial<Transaction>) => ({ id: "x", type: "expense", amount: 10, date: "2026-11-07", ...p }) as Transaction

describe("regras da tabela de transações", () => {
    it("o total do dia é receitas − despesas, sem as projetadas", () => {
        expect(totalDoDia([tx({ type: "income", amount: 100 }), tx({ amount: 30.1 }), tx({ amount: 9.9 })])).toBe(60)
        expect(totalDoDia([tx({ amount: 5, id: `${PROJECTED_TRANSACTION_ID_PREFIX}1` })])).toBe(0)
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
        expect(fonte).toContain("formatDayHeadingPtBr")
        expect(fonte).toContain("groupTotal")
    })
    it("não tem a coluna Tipo", () => {
        expect(fonte).not.toMatch(/header:\s*"Tipo"/)
    })
    it("o lote tem Categorizar e Marcar conferidos; a linha, Confirmar", () => {
        expect(fonte).toMatch(/bulkActions[\s\S]*"Categorizar"[\s\S]*"Marcar conferidos"/)
        expect(fonte).toContain('label: "Confirmar"')
        expect(fonte).toContain('id="transactions"')
        expect(fonte).toContain("toolbar={{ view: !isMobile }}")
        expect(fonte).toContain("Selecione só despesas ou só receitas")
    })
    it("a Categoria é só o nome; a cor fica no ladrilho da Descrição", () => {
        expect(fonte).not.toContain("tileColorFor")
        expect(fonte).not.toContain("--badge-dot")
        expect(fonte.match(/<ColorTile size="xs" color=\{/g)?.length).toBe(1)
        expect(fonte).toMatch(/\n\s*return c\.name\n/)
        expect(fonte).toContain('label: "Categoria", mobile: "description", cellClassName: "max-w-40 truncate"')
        expect(fonte).not.toContain("block truncate")
    })
    it("os vazios da §6.5", () => {
        expect(fonte).toContain("Seu primeiro lançamento")
        expect(fonte).toContain("Nenhum lançamento com esses filtros")
        expect(fonte).toContain("Tudo conferido")
        expect(fonte).toContain('variant="done"')
    })
})
