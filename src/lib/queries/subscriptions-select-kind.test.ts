import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

function arquivos(dir: string): string[] {
    return readdirSync(dir).flatMap((nome) => {
        const caminho = join(dir, nome)
        if (statSync(caminho).isDirectory()) return arquivos(caminho)
        return /\.tsx?$/.test(nome) && !/\.test\.tsx?$/.test(nome) ? [caminho] : []
    })
}

/** Uma lista de colunas sem `kind` entrega a receita recorrente ao cliente como despesa. */
describe("select de workspace_subscriptions", () => {
    const re = /from\("workspace_subscriptions"\)\s*\.select\(\s*"([^"]+)"/g
    const achados = arquivos("src").flatMap((f) =>
        [...semComentarios(lerFonte(f)).matchAll(re)].map((m) => ({ f, colunas: m[1] })),
    )

    it("acha as listas de colunas do cliente", () => {
        expect(achados.filter((a) => a.colunas.includes("billing_anchor_day")).length).toBeGreaterThanOrEqual(4)
    })

    it.each(achados.filter((a) => a.colunas.includes("billing_anchor_day")))(
        "$f traz kind",
        ({ colunas }) => {
            expect(colunas.split(",").map((c) => c.trim())).toContain("kind")
        },
    )
})
