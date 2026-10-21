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

    it("a cota usa o tamanho real do objeto, não o que o cliente manda", () => {
        const sql = semComentarios(lerFonte("supabase/migrations/20261022130000_anexos.sql"), "tudo")
        expect(sql).toMatch(/\(o\.metadata->>'size'\)::bigint[\s\S]*?from storage\.objects o/)
        expect(sql).toContain("raise exception 'anexo_sem_objeto'")
        expect(sql).toMatch(/new\.size_bytes := v_tamanho;[\s\S]*?sum\(size_bytes\)/)
        // A pasta que não é UUID não derruba a política com erro de cast.
        expect(sql.match(/case when \(storage\.foldername\(name\)\)\[1\] ~ /g)).toHaveLength(3)
    })

    it("a limpeza não lê os caminhos de attachments sem limite (o PostgREST corta em 1000)", () => {
        const fonte = semComentarios(lerFonte("supabase/functions/attachments-cleanup/index.ts"), "tudo")
        const consulta = fonte.slice(fonte.indexOf(".from('attachments')"))
        expect(consulta.slice(0, 200)).toMatch(/\.(in|range)\(/)
    })

    it("a linha sai antes do objeto: no lançamento e no anexo", () => {
        const mut = semComentarios(lerFonte("src/lib/transactions/mutations.ts"), "tudo")
        expect(mut).toMatch(
            /caminhosDaTransacao\([\s\S]*?from\("transactions"\)\.delete\(\)[\s\S]*?removerObjetos\(/,
        )
        const fonte = semComentarios(lerFonte("src/lib/anexos.ts"), "tudo")
        const apagar = fonte.slice(fonte.indexOf("export async function apagarAnexo"))
        expect(apagar.indexOf(".delete()")).toBeGreaterThan(-1)
        expect(apagar.indexOf(".delete()")).toBeLessThan(apagar.indexOf("removerObjetos("))
    })

    it("o detalhe do lançamento, o da conta e a conferência usam o wireframe de anexos", () => {
        expect(lerFonte("src/components/transactions/transaction-detail-sheet.tsx")).toContain("<AnexosWireframe")
        expect(lerFonte("src/components/bills/bill-detail-sheet.tsx")).toMatch(/billInstanceId:\s*nextInst\.id/)
        expect(lerFonte("src/components/wireframe/conferir-fatura-wireframe.tsx")).toMatch(/statementTotalId/)
    })
})
