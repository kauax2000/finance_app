import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

import { dimensoesAlvo, validarArquivo } from "./anexos"

const MB = 1024 * 1024
const COTA = 26214400

describe("validarArquivo", () => {
    it("recusa tipo que não é foto nem PDF", () => {
        expect(validarArquivo({ type: "text/plain", size: 100 }, 0)).toEqual({
            ok: false,
            erro: "Tipo não aceito: use foto ou PDF.",
        })
    })

    it("recusa arquivo acima de 10 MB", () => {
        expect(validarArquivo({ type: "application/pdf", size: 11 * MB }, 0)).toEqual({
            ok: false,
            erro: "Arquivo acima de 10 MB.",
        })
    })

    it("recusa quando a carteira passaria de 25 MB (Foco 5)", () => {
        expect(validarArquivo({ type: "image/webp", size: 2 * 1024 }, COTA - 1024)).toEqual({
            ok: false,
            erro: "Sem espaço: os anexos desta carteira passaram de 25 MB.",
        })
    })

    it("aceita um PDF de 2 MB", () => {
        expect(validarArquivo({ type: "application/pdf", size: 2 * MB }, 0)).toEqual({ ok: true })
    })
})

describe("dimensoesAlvo", () => {
    it("reduz o lado maior a 1600 mantendo a proporção", () => {
        expect(dimensoesAlvo(4000, 3000)).toEqual({ largura: 1600, altura: 1200 })
    })

    it("não amplia o que já é pequeno", () => {
        expect(dimensoesAlvo(800, 600)).toEqual({ largura: 800, altura: 600 })
    })
})

describe("fonte", () => {
    it("enviarAnexo remove o objeto quando a linha falha (Foco 5)", () => {
        const fonte = semComentarios(lerFonte("src/lib/anexos.ts"), "tudo")
        const corpo = fonte.slice(fonte.indexOf("export async function enviarAnexo"))
        const fim = corpo.indexOf("\nexport ", 1)
        const envio = fim > 0 ? corpo.slice(0, fim) : corpo
        expect(envio).toMatch(/\.insert\([\s\S]*?if \(\s*\w*[eE]rror\w*\s*\)\s*\{[\s\S]*?\.remove\(/)
    })

    it("a migração: bucket privado, cota, cron e as três políticas", () => {
        const sql = semComentarios(lerFonte("supabase/migrations/20261022130000_anexos.sql"), "tudo")
        expect(sql).toMatch(/insert into storage\.buckets[\s\S]*?'attachments'[\s\S]*?false/)
        expect(sql).toContain("10485760")
        expect(sql).toContain("26214400")
        expect(sql).toContain("cota_anexos_excedida")
        expect(sql).toContain("attachments-cleanup-weekly")
        expect(sql).toContain("'0 7 * * 0'")
        for (const op of ["select", "insert", "delete"]) {
            expect(sql).toMatch(new RegExp(`on storage\\.objects\\s+for ${op}\\s+to authenticated`))
        }
        expect(sql).toContain("public.is_workspace_member(((storage.foldername(name))[1])::uuid)")
        expect(sql).toContain("when insufficient_privilege")
    })

    it("o detalhe do lançamento, o da conta e a conferência usam o wireframe de anexos", () => {
        expect(lerFonte("src/components/transactions/transaction-detail-sheet.tsx")).toContain("<AnexosWireframe")
        expect(lerFonte("src/components/bills/bill-detail-sheet.tsx")).toMatch(/billInstanceId:\s*nextInst\.id/)
        expect(lerFonte("src/components/wireframe/conferir-fatura-wireframe.tsx")).toMatch(/statementTotalId/)
    })
})
