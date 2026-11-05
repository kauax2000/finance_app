import type { User } from "@supabase/supabase-js"
import { beforeEach, describe, expect, it, vi } from "vitest"

type Res = { data: unknown; error: unknown }

/** O que cada leitura devolve, por tabela (ou `rpc:<nome>`). */
let respostas: Record<string, Res> = {}
/** As leituras iniciadas, na ordem. */
let iniciadas: string[] = []
/** Fechada, nenhuma leitura resolve: prova que todas saíram antes de qualquer `await` voltar. */
let abrir: () => void = () => {}
let portao: Promise<void> = Promise.resolve()

function leitura(nome: string) {
    iniciadas.push(nome)
    const builder: Record<string, unknown> = {}
    for (const m of ["select", "eq", "gte", "lte", "order", "range"]) builder[m] = () => builder
    builder.then = (ok: (r: Res) => unknown, erro: (e: unknown) => unknown) =>
        portao.then(() => respostas[nome] ?? { data: [], error: null }).then(ok, erro)
    return builder
}

vi.mock("@/lib/supabase", () => ({
    supabase: {
        from: (tabela: string) => leitura(tabela),
        rpc: (nome: string) => leitura(`rpc:${nome}`),
    },
}))

const { fetchMembersPageBundle } = await import("@/lib/queries/fetch-members-page-bundle")

const eu = { id: "u1", email: "eu@x.com", user_metadata: { full_name: "Eu Mesmo" } } as unknown as User
const membros = [
    { workspace_id: "w", user_id: "u1", role: "owner", joined_at: "2026-01-01" },
    { workspace_id: "w", user_id: "u2", role: "member", joined_at: "2026-01-02" },
]

beforeEach(() => {
    iniciadas = []
    respostas = { workspace_members: { data: membros, error: null } }
    portao = new Promise((r) => {
        abrir = r
    })
})

describe("fetchMembersPageBundle", () => {
    it("as cinco leituras (e os cartões dos lançamentos) saem numa rodada só", async () => {
        const p = fetchMembersPageBundle("w", eu)
        // Deixa correr tudo o que não depende do banco: nada pode estar esperando outra leitura.
        for (let i = 0; i < 10; i++) await Promise.resolve()
        expect([...iniciadas].sort()).toEqual(
            [
                "credit_cards",
                "rpc:workspace_member_directory",
                "transactions",
                "workspace_invites",
                "workspace_member_limits",
                "workspace_members",
            ].sort(),
        )
        abrir()
        await p
        expect(iniciadas).toHaveLength(6)
    })

    it("com o diretório, cada membro ganha o perfil dele", async () => {
        respostas["rpc:workspace_member_directory"] = {
            data: [
                { user_id: "u1", email: "eu@x.com", full_name: "Eu" },
                { user_id: "u2", email: "ela@x.com", full_name: "Ela", avatar_color: "ocean" },
            ],
            error: null,
        }
        abrir()
        const b = await fetchMembersPageBundle("w", eu)
        expect(b.members.map((m) => m.profile?.full_name)).toEqual(["Eu", "Ela"])
        expect(b.avisos).toEqual({ carga: null, diretorio: null })
        expect(b.limitesIndisponivel).toBe(false)
    })

    it("diretório vazio: o fallback mostra só o próprio perfil, e avisa", async () => {
        abrir()
        const b = await fetchMembersPageBundle("w", eu)
        expect(b.members.map((m) => m.profile?.full_name ?? null)).toEqual(["Eu Mesmo", null])
        expect(b.avisos.diretorio).toContain("Diretório de membros retornou vazio")
    })

    it("limites com erro: indisponível, e o resto da tela vem", async () => {
        respostas.workspace_member_limits = { data: null, error: { message: "relation does not exist" } }
        abrir()
        const b = await fetchMembersPageBundle("w", eu)
        expect(b.limitesIndisponivel).toBe(true)
        expect(b.limites).toEqual([])
        expect(b.members).toHaveLength(2)
    })

    it("membros com erro: o aviso de carga, sem mexer no do diretório", async () => {
        respostas.workspace_members = { data: null, error: { message: "boom", code: "42501" } }
        abrir()
        const b = await fetchMembersPageBundle("w", eu)
        expect(b.avisos.carga).toMatch(/^Membros: /)
        expect(b.avisos.diretorio).toBeUndefined()
        expect(b.members).toEqual([])
    })
})
