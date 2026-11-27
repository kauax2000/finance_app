import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import type { CorpoDoInsight as Corpo } from "@/lib/insights-da-categoria"
import { CorpoDoInsight } from "./corpo-do-insight"

// A recorrência lê o banco ao montar; aqui só o import precisa existir.
vi.mock("@/lib/supabase", () => ({ supabase: {} }))

type Linha = Extract<Corpo, { tipo: "conferir" }>["linhas"][number]

const linha: Linha = { dataYmd: "2026-11-25", origem: "apple_pay", descricao: "Estacionamento", valor: 7 }

const html = (linhas: Linha[], resto = 0) =>
    renderToStaticMarkup(
        h(CorpoDoInsight, {
            corpo: { tipo: "conferir", linhas, resto, total: 7 },
            corDaSerie: "red",
            numero: "R$ 7",
            linha: "",
        }),
    )

// O `Intl` escreve "R$ 7" com espaço não separável; o texto do teste usa o comum.
const texto = (linhas: Linha[], resto = 0) =>
    html(linhas, resto)
        .replace(/<[^>]+>/g, " ")
        .replace(/ /g, " ")

describe("CorpoDoInsight — para conferir", () => {
    it("a linha no formato das notificações: ladrilho, descrição, dia e origem, valor", () => {
        const t = texto([linha])
        expect(t).toContain("Estacionamento")
        expect(t).toContain("25 de nov · Apple Pay")
        expect(t).toContain("R$ 7")
        expect(html([linha])).toContain('data-slot="item-media"')
    })

    it("origem sem rótulo é pelo app", () => {
        expect(texto([{ ...linha, origem: "app" }])).toContain("25 de nov · pelo app")
    })

    it("descrição vazia diz Sem descrição", () => {
        expect(texto([{ ...linha, descricao: "" }])).toContain("Sem descrição")
    })

    it("o resto vira e mais N", () => {
        expect(texto([linha], 2)).toContain("e mais 2")
    })

    it("o ladrilho é info e a descrição trunca", () => {
        const fonte = semComentarios(lerFonte("src/components/categories/detail/resumo/corpo-do-insight.tsx"))
        expect(fonte).toContain('tone="info"')
        expect(fonte).toContain("truncate")
    })

    it("no carrossel o conferir não tem canto e o corpo dele não leva mt-auto", () => {
        const fonte = semComentarios(lerFonte("src/components/categories/detail/resumo/insights-da-categoria.tsx"))
        const canto = fonte.slice(fonte.indexOf("const canto"), fonte.indexOf("const c ="))
        expect(canto).not.toBe("")
        expect(canto).not.toContain('"conferir"')
        expect(fonte).toMatch(/tipo !== "conferir" && "mt-auto"/)
    })
})
