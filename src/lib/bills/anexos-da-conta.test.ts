import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

import { podeApagarAnexo } from "@/lib/anexos"

import { anexosDoLancamento } from "./anexos-da-conta"

type Linha = Record<string, unknown>

/** Um supabase de mentira: `from(tabela).select().eq(coluna, valor)[.order()]` filtra as linhas. */
function fake(tabelas: Record<string, Linha[]>) {
    return {
        from: (tabela: string) => ({
            select: () => ({
                eq: (coluna: string, valor: unknown) => {
                    const r = Promise.resolve({
                        data: (tabelas[tabela] ?? []).filter((l) => l[coluna] === valor),
                        error: null,
                    })
                    return Object.assign(r, { order: () => r })
                },
            }),
        }),
    } as unknown as SupabaseClient
}

const anexo = (id: string, path: string, vinculo: Linha) => ({ id, path, created_at: "2026-10-01T00:00:00Z", ...vinculo })

describe("anexosDoLancamento", () => {
    it("junta o anexo do lançamento e o da instância ligada", async () => {
        const supabase = fake({
            bill_instances: [{ id: "i1", transaction_id: "t1" }],
            attachments: [
                anexo("a1", "w/nota.webp", { transaction_id: "t1" }),
                anexo("a2", "w/boleto.pdf", { bill_instance_id: "i1" }),
                anexo("a3", "w/outro.pdf", { bill_instance_id: "i2" }),
            ],
        })
        const r = await anexosDoLancamento(supabase, "t1")
        expect(r.map((a) => a.path).sort()).toEqual(["w/boleto.pdf", "w/nota.webp"])
    })

    it("não repete o mesmo path", async () => {
        const supabase = fake({
            bill_instances: [{ id: "i1", transaction_id: "t1" }],
            attachments: [
                anexo("a1", "w/x.pdf", { transaction_id: "t1" }),
                anexo("a2", "w/x.pdf", { bill_instance_id: "i1" }),
            ],
        })
        const r = await anexosDoLancamento(supabase, "t1")
        expect(r.map((a) => a.id)).toEqual(["a1"])
    })

    it("sem instância ligada, devolve só os do lançamento", async () => {
        const supabase = fake({ attachments: [anexo("a1", "w/n.webp", { transaction_id: "t1" })] })
        expect(await anexosDoLancamento(supabase, "t1")).toHaveLength(1)
    })
})

describe("fonte", () => {
    it("o diálogo de pagar mostra o boleto só para leitura", () => {
        const f = semComentarios(lerFonte("src/components/bills/pay-bill-dialog.tsx"), "tudo")
        expect(f).toMatch(/<AnexosWireframe[\s\S]*billInstanceId: input\.instance\.id[\s\S]*somenteLeitura/)
    })

    it("o detalhe do lançamento lista pelo anexosDoLancamento", () => {
        expect(lerFonte("src/components/transactions/anexos-do-lancamento.tsx")).toContain("anexosDoLancamento(supabase, t.id)")
        expect(semComentarios(lerFonte("src/components/transactions/transaction-detail-sheet.tsx"), "tudo")).toContain(
            "<AnexosDoLancamento key={t.id} transaction={t} />",
        )
    })
})

describe("podeApagarAnexo", () => {
    it("o boleto da instância não se apaga pelo lançamento", () => {
        expect(podeApagarAnexo({ bill_instance_id: "i1" }, { transactionId: "t1" })).toBe(false)
    })

    it("o anexo do lançamento e o da própria instância se apagam", () => {
        expect(podeApagarAnexo({ bill_instance_id: null }, { transactionId: "t1" })).toBe(true)
        expect(podeApagarAnexo({ bill_instance_id: "i1" }, { billInstanceId: "i1" })).toBe(true)
    })

    it("o bloco de anexos usa a regra no botão Apagar", () => {
        const f = semComentarios(lerFonte("src/components/wireframe/anexos-wireframe.tsx"), "tudo")
        expect(f).toContain("somenteLeitura || !podeApagarAnexo(a, vinculo)")
        // No detalhe do lançamento, o boleto da conta fica sem o ⋯ de apagar.
        // Sem semComentarios: o "image/*" do accept abriria um comentário de bloco.
        const d = lerFonte("src/components/transactions/anexos-do-lancamento.tsx")
        expect(d).toContain("const boleto = !podeApagarAnexo(a, vinculo)")
        expect(d).toMatch(/\{boleto \? null : \(\s*<DropdownMenu>/)
        expect(d).toContain("<AlertDialog")
        expect(d).not.toContain("window.confirm")
    })
})
