import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { listHighlightClassName } from "@/lib/list-highlight-classes"

/** O arquivo sem comentários: um comentário citando a classe não conta. */
const fonte = (caminho: string) =>
    readFileSync(join(process.cwd(), caminho), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/(^|[^:])\/\/.*$/gm, "$1")

const SUPERFICIES = [
    "src/components/ui/command.tsx",
    "src/components/ui/select.tsx",
    "src/components/ui/dropdown-menu.tsx",
    "src/components/ui/context-menu.tsx",
    "src/components/ui/menubar.tsx",
    "src/components/ui/form-picker-popover.tsx",
    "src/components/ui/navigation-menu.tsx",
]

describe("o realce que viaja entre as opções (rodada 137)", () => {
    it("1. as sete listas montam o indicador", () => {
        for (const caminho of SUPERFICIES) {
            const src = fonte(caminho)
            expect(src, `${caminho} sem o hook`).toContain("useListHighlight(")
            expect(src, `${caminho} sem o indicador`).toContain("listHighlightClassName")
        }
    })

    it("2. nenhuma linha pinta o próprio fundo de cursor", () => {
        // Se voltar, a linha acende junto do realce e ele volta a piscar.
        // O `data-open:bg-accent` do sub-gatilho fica: ele marca o submenu
        // aberto, quando o realce do menu de cima já apagou.
        const linhas = [...SUPERFICIES, "src/lib/menu-classes.ts"].map(fonte).join("\n")
        expect(linhas).not.toMatch(/\bfocus:bg-(accent|destructive)/)
        expect(linhas).not.toMatch(/\bdata-selected:bg-accent\b/)
        expect(linhas).not.toMatch(/\bhover:bg-muted\/60\b/)
        expect(fonte("src/components/ui/navigation-menu.tsx")).not.toMatch(/\bhover:bg-accent\b/)
    })

    it("3. o movimento é a mola da casa, e o estado mora no indicador", () => {
        expect(listHighlightClassName).toContain("duration-(--duration-spring)")
        expect(listHighlightClassName).toContain("ease-(--ease-spring)")
        expect(listHighlightClassName).not.toMatch(/duration-\d|ease-\[/)
        // `in-*`/`group-*` compilam com `:where()` e perderiam do `opacity-0`.
        expect(listHighlightClassName).toContain("data-[state=on]:opacity-100")
        expect(listHighlightClassName).not.toMatch(/\b(in|group)-/)
    })

    it("4. o quadro coalesce, e não se re-agenda", () => {
        // O `rAF` que chama `rAF` de dentro de si é o laço que esta casa proíbe.
        const hook = fonte("src/hooks/use-list-highlight.ts")
        const medir = hook.slice(hook.indexOf("const medir"), hook.indexOf("const agendar"))
        expect(medir).not.toContain("requestAnimationFrame(medir)")
        expect(hook).toContain("if (!medida) medida = requestAnimationFrame(medir)")
    })
})
