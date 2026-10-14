import { existsSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { blocoCss, lerFonte } from "@/test/fonte"

/** Todo `.ts`/`.tsx` de `src`, menos os testes. */
function fontes(dir = "src"): string[] {
    return readdirSync(join(process.cwd(), dir)).flatMap((nome) => {
        const caminho = `${dir}/${nome}`
        if (statSync(join(process.cwd(), caminho)).isDirectory()) return fontes(caminho)
        return /\.tsx?$/.test(nome) && !/\.test\.tsx?$/.test(nome) ? [caminho] : []
    })
}

describe("Tailwind hover policy (touch-safe defaults)", () => {
    it("does not override hover to bare :hover in globals.css", () => {
        const css = lerFonte("src/app/globals.css")
        expect(css).not.toMatch(/@variant\s+hover\s*\(\s*&?:hover/)
    })

    it("when .next exists, emitted CSS wraps hover utilities with hover-capable media", () => {
        const chunksDir = join(process.cwd(), ".next/static/chunks")
        if (!existsSync(chunksDir)) {
            return
        }
        const cssFiles = readdirSync(chunksDir).filter((f) => f.endsWith(".css"))
        const combined = cssFiles
            .map((f) => lerFonte(join(chunksDir, f)))
            .join("\n")
        if (!combined.includes("hover:hover")) {
            return
        }
        expect(combined).toMatch(/@media\s*\(\s*hover:\s*hover\s*\)/)
    })
})

/**
 * No telefone, o que depende de um cursor parado em cima fica desarmado. O par `active:`
 * continua sendo a resposta do dedo (regra H).
 */
describe("o hover desarmado no toque", () => {
    it("a variante `hover` mantém a mídia e exclui a moldura do iPhone", () => {
        const css = lerFonte("src/app/globals.css")
        const variante = blocoCss(css, "@custom-variant hover {", "\n}")
        expect(variante).toContain("@media (hover: hover)")
        expect(variante).toContain('&:hover:not(:where([data-pointer="coarse"] *))')
    })

    it("o `link-sweep` só acende no `:hover` dentro da mídia", () => {
        const css = lerFonte("src/app/globals.css")
        const utility = blocoCss(css, "@utility link-sweep {", "\n}")
        const midia = utility.indexOf("@media (hover: hover)")
        expect(midia).toBeGreaterThan(-1)
        expect(utility.indexOf("&:hover")).toBeGreaterThan(midia)
    })

    it("nenhum `:hover` à mão fora de `@media (hover: hover)` nas classes", () => {
        const soltos = fontes().flatMap((arquivo) =>
            (lerFonte(arquivo).match(/[^\s"'`]*:hover\][^\s"'`]*/g) ?? [])
                .filter((t) => !t.includes("[@media(hover:hover)]:"))
                .map((t) => `${arquivo}: ${t}`)
        )
        expect(soltos).toEqual([])
    })

    it("todo ouvinte de 'passou por cima' pergunta se é cursor", () => {
        // O `onMouseEnter` da barra lateral só pré-carrega a rota: não desenha nada.
        const semEfeito = new Set(["src/components/layout/app-sidebar.tsx"])
        const sem = fontes().filter((arquivo) => {
            const codigo = lerFonte(arquivo)
            return (
                /on(?:PointerEnter|MouseEnter|MouseMove)=/.test(codigo) &&
                !/ehCursor\(|pointerType/.test(codigo) &&
                !semEfeito.has(arquivo)
            )
        })
        expect(sem).toEqual([])
    })

    it("as teclas de atalho somem no toque", () => {
        expect(lerFonte("src/lib/menu-classes.ts")).toMatch(/menuShortcutClassName =\s*"[^"]*pointer-coarse:hidden/)
        expect(lerFonte("src/lib/search-field-classes.ts")).toMatch(
            /searchFieldShortcutClassName =\s*"[^"]*pointer-coarse:hidden/
        )
        const ui = (nome: string) => lerFonte(`src/components/ui/${nome}.tsx`)
        expect(ui("command")).toMatch(/group-data-selected\/command-item:text-accent-foreground pointer-coarse:hidden/)
        expect(ui("dropdown-menu")).toContain('data-slot="dropdown-menu-item-shortcut" className="ms-auto pointer-coarse:hidden"')
        expect(ui("context-menu")).toContain('data-slot="context-menu-shortcut" className="ml-auto pointer-coarse:hidden"')
        expect(ui("tooltip")).toContain('<Kbd keys={shortcut} className="pointer-coarse:hidden" />')
        expect(ui("sidebar")).toContain('className="ml-auto pointer-coarse:hidden"')
    })
})

/** O anel de foco é do teclado: depois de um clique, o foco devolvido pelo Radix não acende. */
describe("focus-visible só no teclado", () => {
    it("a variante ignora o foco sob data-modality=pointer, e o layout monta quem marca", () => {
        expect(lerFonte("src/app/globals.css")).toContain(
            '@custom-variant focus-visible (&:focus-visible:not(:where([data-modality="pointer"] *)));'
        )
        const marca = lerFonte("src/app/focus-modality.tsx")
        expect(marca).toMatch(/addEventListener\("pointerdown", ponteiro, true\)/)
        expect(marca).toMatch(/addEventListener\("keydown", teclado, true\)/)
        expect(lerFonte("src/app/layout.tsx")).toContain("<FocusModality />")
    })
})
