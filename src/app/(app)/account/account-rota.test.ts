import { existsSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const CLIENTE = "src/app/(app)/account/page-client.tsx"

describe("/account só redireciona", () => {
    it("no celular a Você, no desktop o Painel, por replace e sem montar nada", () => {
        const f = semComentarios(lerFonte(CLIENTE))
        expect(f).toContain("router.replace(isMobile ? ROUTES.ME : ROUTES.DASHBOARD)")
        expect(f).toContain("return null")
        for (const t of ["EditProfileDialog", "Seal", "SeloDeMembro", "AccountPageSkeleton"]) expect(f).not.toContain(t)
    })

    it("sem esqueleto próprio: a fronteira é a vazia do app", () => {
        expect(existsSync("src/app/(app)/account/(raiz)/loading.tsx")).toBe(false)
    })

    it("nenhum lugar do app leva mais a /account", () => {
        const fontes = codigo("src").filter(
            (f) =>
                !/\.test\.tsx?$/.test(f) &&
                !f.endsWith("src/config/navigation.ts") &&
                // A lista do convidado deixa o link antigo passar até o redirecionamento.
                !f.endsWith("src/lib/papeis/rotas-do-convidado.ts") &&
                !f.includes("src/app/(app)/account/"),
        )
        expect(fontes.length).toBeGreaterThan(100)
        const achados = fontes.filter((f) => {
            const s = semComentarios(lerFonte(f))
            return s.includes("ROUTES.ACCOUNT") || /['"`]\/account\b/.test(s)
        })
        expect(achados).toEqual([])
    })
})

/** Todo `.ts` e `.tsx` debaixo de `dir`. */
function codigo(dir: string): string[] {
    return readdirSync(dir).flatMap((nome) => {
        const caminho = join(dir, nome)
        if (statSync(caminho).isDirectory()) return codigo(caminho)
        return /\.tsx?$/.test(nome) ? [caminho] : []
    })
}
