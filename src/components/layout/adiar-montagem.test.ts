import { existsSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { describe, expect, it } from "vitest"
import { arquivosTsx, lerFonte, semComentarios } from "@/test/fonte"

const APP = "src/app/(app)"
const paginas = arquivosTsx(APP).filter((f) => f.endsWith("/page.tsx"))

function loadingMaisProximo(pagina: string): string {
    let dir = dirname(pagina)
    while (!existsSync(join(dir, "loading.tsx"))) dir = dirname(dir)
    return join(dir, "loading.tsx")
}

/**
 * A troca de tela acontece no clique, e a página carrega depois: o
 * `loading.tsx` deixa o Next trocar sem esperar o servidor, e o
 * `AdiarMontagem` deixa o React trocar sem esperar a página montar.
 */
describe("a navegação troca de tela na hora", () => {
    it("toda rota do app tem uma fronteira de carregamento", () => {
        expect(existsSync(join(APP, "loading.tsx"))).toBe(true)
    })

    it("a página com esqueleto próprio monta depois da troca, com o esqueleto do loading", () => {
        for (const pagina of paginas) {
            const loading = loadingMaisProximo(pagina)
            if (loading === join(APP, "loading.tsx")) continue
            const fonte = semComentarios(lerFonte(pagina))
            const caminho = relative(dirname(pagina), loading).replace(/\.tsx$/, "")
            expect(fonte, pagina).toContain("<AdiarMontagem fallback={<Loading />}>")
            expect(fonte, pagina).toContain(`import Loading from "${caminho.startsWith(".") ? caminho : `./${caminho}`}"`)
        }
    })
})
