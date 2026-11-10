import { describe, expect, it, vi } from "vitest"
import type { Category, CreditCard, Project } from "@/lib/supabase"
import { CAMPOS_BASE, SEM_CATEGORIA } from "@/lib/transactions/filtros"
import { lerFonte, semComentarios } from "@/test/fonte"
import type { FilterValue } from "@/components/ui/filter-bar"
import { montarCampos, podarCategoriasDoTipo, semCamposOcultos, type DadosDosCampos } from "./use-campos-de-filtro"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

const TOOLBAR = semComentarios(lerFonte("src/components/transactions/transacoes-toolbar.tsx"), "tudo")
const CAMPOS = lerFonte("src/components/transactions/use-campos-de-filtro.ts")

describe("transacoes-toolbar (fonte)", () => {
    it("usa o FilterBar do sistema, sem E/OU e sem URL própria", () => {
        expect(TOOLBAR).toContain('from "@/components/ui/filter-bar"')
        expect(TOOLBAR).not.toContain("onMatchChange")
        expect(TOOLBAR).not.toContain("urlParam")
    })

    it("publica o filtro do cabeçalho e clica no + Filtro pelo data-slot", () => {
        expect(TOOLBAR).toContain("usePageChromeFilter")
        expect(TOOLBAR).toContain("[data-slot=filter-bar-add]")
        expect(lerFonte("src/components/transactions/transacoes-toolbar.tsx")).toContain(
            '// shortcut: clica no "+ Filtro" pelo data-slot; trocar por uma prop open quando o FilterBar ganhar uma',
        )
    })

    it("é uma árvore só", () => {
        expect(TOOLBAR).not.toContain("md:hidden")
    })

    it("a FilterBar é a linha com o +N (overflow=\"menu\"), sem mobile=", () => {
        expect(TOOLBAR).toContain('overflow="menu"')
        expect(TOOLBAR).not.toMatch(/\bmobile=/)
    })

    it("a quebra é da própria linha (container), não da janela, e sem flex-wrap na raiz", () => {
        const raiz = TOOLBAR.match(/return \(\s*<div className="([^"]*)"/)?.[1] ?? ""
        expect(raiz).toMatch(/@container\/[\w-]+/)
        expect(raiz).not.toContain("flex-wrap")
        expect(TOOLBAR).toMatch(/@max-3xl\/[\w-]+:flex-wrap/)
        expect(TOOLBAR).toMatch(/@max-3xl\/[\w-]+:basis-full/)
        expect(TOOLBAR).not.toMatch(/\border-/)
    })

    it("o ⋯ segue o cabeçalho da página (que some abaixo do md), não a largura da linha", () => {
        expect(TOOLBAR).toContain('className="hidden shrink-0 max-md:flex"')
    })

    it("os campos partem de CAMPOS_BASE", () => {
        expect(CAMPOS).toContain("CAMPOS_BASE")
    })
})

const cat = (id: string, type: "income" | "expense") => ({ id, name: id, type, color: null, icon: null }) as Category
const base: DadosDosCampos = {
    type: "all",
    categorias: [cat("mercado", "expense"), cat("salario", "income")],
    cartoes: [{ id: "nu", name: "Nubank", last_four: "1234" } as CreditCard],
    membros: [
        { user_id: "a", email: "a@x", full_name: "Ana" },
        { user_id: "b", email: "b@x", full_name: null },
    ],
    convidado: false,
    adultos: [{ user_id: "a", nome: "Ana" }],
    divide: true,
    projetos: [{ id: "p1", name: "Reforma", archived_at: null } as Project, { id: "p2", name: "Velho", archived_at: "2026-01-01" } as Project],
    planos: [{ id: "pl", description: null }],
    assinaturas: [{ id: "s", name: "Netflix" }],
}
const ids = (d: DadosDosCampos) => montarCampos(d).map((c) => c.id)
const opcoes = (d: DadosDosCampos, id: string) => {
    const c = montarCampos(d).find((x) => x.id === id)
    return c && c.type === "enum" ? (c.options ?? []).map((o) => o.value) : null
}

describe("montarCampos", () => {
    it("com tudo à mão, mantém os ids e a ordem de CAMPOS_BASE", () => {
        expect(ids(base)).toEqual(CAMPOS_BASE.map((c) => c.id))
    })

    it("as categorias seguem a aba, com Sem categoria no fim", () => {
        expect(opcoes(base, "categoria")).toEqual(["mercado", "salario", SEM_CATEGORIA])
        expect(opcoes({ ...base, type: "expense" }, "categoria")).toEqual(["mercado", SEM_CATEGORIA])
        expect(opcoes({ ...base, type: "income" }, "categoria")).toEqual(["salario", SEM_CATEGORIA])
    })

    it("Lançado por some para o convidado e com menos de 2 membros", () => {
        expect(ids({ ...base, convidado: true })).not.toContain("pessoa")
        expect(ids({ ...base, membros: base.membros.slice(0, 1) })).not.toContain("pessoa")
    })

    it("Quem pagou só em carteira split; Projeto só com projeto ativo", () => {
        expect(ids({ ...base, divide: false })).not.toContain("pagou")
        expect(opcoes(base, "projeto")).toEqual(["p1"])
        expect(ids({ ...base, projetos: [base.projetos[1]] })).not.toContain("projeto")
    })
})

describe("podarCategoriasDoTipo", () => {
    const tok = (field: string, values: string[]): FilterValue => ({ field, operator: "is", values })
    const filtros = [tok("periodo", ["este-mes"]), tok("categoria", ["mercado", "salario", SEM_CATEGORIA])]

    it("guarda só as do tipo novo e Sem categoria", () => {
        expect(podarCategoriasDoTipo(filtros, "income", base.categorias)).toEqual([
            filtros[0],
            tok("categoria", ["salario", SEM_CATEGORIA]),
        ])
    })

    it("tira o token sem valor; Todas não poda", () => {
        const so = [tok("categoria", ["mercado"])]
        expect(podarCategoriasDoTipo(so, "income", base.categorias)).toEqual([])
        expect(podarCategoriasDoTipo(filtros, "all", base.categorias)).toBe(filtros)
    })
})

describe("semCamposOcultos", () => {
    const f = (field: string): FilterValue => ({ field, operator: "is", values: ["x"] })
    const campos = CAMPOS_BASE.filter((c) => c.id !== "pessoa")

    it("tira o token de um campo que a barra não mostra (o f= escrito à mão)", () => {
        expect(semCamposOcultos([f("periodo"), f("pessoa"), f("categoria")], campos)).toEqual([f("periodo"), f("categoria")])
    })

    it("sem campo oculto, devolve a mesma lista", () => {
        const lista = [f("periodo")]
        expect(semCamposOcultos(lista, campos)).toBe(lista)
    })

    it("a tela poda só com os campos prontos, antes da chave e da contagem", () => {
        const hook = semComentarios(lerFonte("src/components/transactions/use-transacoes-da-tela.ts"), "tudo")
        expect(hook).toMatch(/camposProntos\s*\?\s*semCamposOcultos\(/)
        expect(CAMPOS).toContain("prontos")
    })
})
