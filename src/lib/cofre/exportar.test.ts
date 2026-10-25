import { describe, expect, it, vi } from "vitest"

const tabelas: Record<string, Array<Record<string, unknown>>> = {}
const filtros: Array<[string, string, unknown]> = []

vi.mock("@/lib/supabase", () => ({
    supabase: {
        from: (tabela: string) => {
            const q = {
                select: () => q,
                in: (col: string, v: unknown) => (filtros.push([tabela, col, v]), q),
                order: () => q,
                range: async (de: number, ate: number) => ({
                    data: (tabelas[tabela] ?? []).slice(de, ate + 1),
                    error: null,
                }),
            }
            return q
        },
    },
}))

import { COLUNAS_CONHECIDAS, exportarTudo, lerTudo, TABELAS_EXPORTADAS } from "./exportar"

describe("lerTudo", () => {
    it("junta 2500 linhas em 3 páginas de 1000", async () => {
        const chamadas: Array<[number, number]> = []
        const linhas = await lerTudo<{ n: number }>(async (de, ate) => {
            chamadas.push([de, ate])
            const total = 2500
            const n = Math.max(0, Math.min(ate + 1, total) - de)
            return { data: Array.from({ length: n }, (_, i) => ({ n: de + i })), error: null }
        })
        expect(linhas).toHaveLength(2500)
        expect(linhas[2499].n).toBe(2499)
        expect(chamadas).toEqual([[0, 999], [1000, 1999], [2000, 2999]])
    })

    it("pede mais uma página quando o total é múltiplo de 1000", async () => {
        let n = 0
        await lerTudo(async (de) => {
            n++
            return { data: de < 1000 ? Array.from({ length: 1000 }, () => ({})) : [], error: null }
        })
        expect(n).toBe(2)
    })

    it("propaga o erro", async () => {
        await expect(lerTudo(async () => ({ data: null, error: new Error("falhou") }))).rejects.toThrow("falhou")
    })
})

describe("COLUNAS_CONHECIDAS", () => {
    it.each(TABELAS_EXPORTADAS)("%s: cabeçalho não vazio e sem repetição", (tabela) => {
        const cols = COLUNAS_CONHECIDAS[tabela]
        expect(cols.length).toBeGreaterThan(0)
        expect(new Set(cols).size).toBe(cols.length)
    })
})

describe("TABELAS_EXPORTADAS", () => {
    it("lista as dez tabelas da spec", () => {
        expect(TABELAS_EXPORTADAS).toHaveLength(10)
        expect(TABELAS_EXPORTADAS).toContain("bill_instances")
    })
})

describe("exportarTudo", () => {
    it("exporta tudo, escapa o CSV, deixa só o cabeçalho nas vazias e pede bill_instances pelo bill_id", async () => {
        tabelas.transactions = Array.from({ length: 1500 }, (_, i) => ({
            id: `t${i}`,
            description: i === 0 ? 'a;b "c"\nd' : "x",
        }))
        tabelas.bills = [{ id: "b1" }]
        const blob = await exportarTudo([{ id: "w1", name: "Casa" }, { id: "w2", name: "Viagem" }])
        expect(blob.type).toBe("application/zip")
        const texto = new TextDecoder().decode(new Uint8Array(await blob.arrayBuffer()))
        expect(texto).toContain('"a;b ""c""\nd"')
        expect(texto).toContain("t1499;x")
        expect(texto).toContain(COLUNAS_CONHECIDAS.categories.join(";")) // categories vazia: só o cabeçalho
        expect(texto).toContain("transactions.csv")
        expect(texto).toContain("LEIA-ME.txt")
        expect(texto).toContain("Seus dados são seus. Este arquivo foi gerado no seu aparelho.")
        expect(texto).toContain("Carteiras: Casa (w1), Viagem (w2).")
        expect(texto).toContain("ponto e vírgula (;) e números com vírgula decimal")
        expect(filtros).toContainEqual(["transactions", "workspace_id", ["w1", "w2"]])
        expect(filtros).toContainEqual(["bill_instances", "bill_id", ["b1"]])
    })
})

describe("exportarTudo — gasto privado (Bloco 7B)", () => {
    it("a privada de quem exporta sai com a descrição e a categoria dela; a de outra pessoa, mascarada", async () => {
        tabelas.transactions = [
            { id: "p1", user_id: "eu", is_private: true, description: "Gasto pessoal", category_id: null },
            { id: "p2", user_id: "ana", is_private: true, description: "Gasto pessoal", category_id: null },
        ]
        // A RLS só devolve as do autor: o mock devolve só a dele.
        tabelas.transacoes_privadas = [
            { transaction_id: "p1", user_id: "eu", description: "Farmácia", category_id: "c1", capture_meta: null },
        ]
        const blob = await exportarTudo([{ id: "w1", name: "Casa" }])
        const texto = new TextDecoder().decode(new Uint8Array(await blob.arrayBuffer()))
        expect(texto).toContain("Farmácia;c1")
        expect(texto).toMatch(/p2;ana;[^\n]*;Gasto pessoal;/)
        expect(texto.split("Farmácia").length).toBe(2)
        expect(filtros).toContainEqual(["transacoes_privadas", "workspace_id", ["w1"]])
        delete tabelas.transacoes_privadas
    })
})
