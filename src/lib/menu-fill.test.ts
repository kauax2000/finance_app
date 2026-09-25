import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { listFillClassName } from "@/lib/pointer-fill"

/** O arquivo sem comentários: um comentário citando a classe não conta. */
const fonte = (caminho: string) =>
    readFileSync(join(process.cwd(), caminho), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/(^|[^:])\/\/.*$/gm, "$1")

const LINHAS = [
    "src/lib/menu-classes.ts",
    "src/components/ui/select.tsx",
    "src/components/ui/command.tsx",
    "src/components/ui/navigation-menu.tsx",
]

const LISTAS = [
    "src/components/ui/dropdown-menu.tsx",
    "src/components/ui/context-menu.tsx",
    "src/components/ui/menubar.tsx",
    "src/components/ui/select.tsx",
    "src/components/ui/command.tsx",
    "src/components/ui/navigation-menu.tsx",
]

describe("a linha acende como o link do catálogo (rodada 137)", () => {
    it("1. as linhas vestem o disco, e não um fundo de cursor", () => {
        for (const caminho of LINHAS) {
            const src = fonte(caminho)
            expect(src, `${caminho} sem o disco`).toContain("listFillClassName")
            expect(src, `${caminho} com fundo de cursor`).not.toMatch(
                /\b(focus|data-selected|data-open):bg-(accent|destructive)/
            )
        }
        expect(fonte("src/components/ui/navigation-menu.tsx")).not.toMatch(/\bhover:bg-accent\b/)
    })

    it("2. o disco nasce sob o ponteiro: cada lista escreve a posição", () => {
        for (const caminho of LISTAS) {
            expect(fonte(caminho), `${caminho} sem a origem`).toContain(
                "onPointerMove={followPointerFill}"
            )
        }
    })

    it("3. o ritmo é o do tertiary, o peso que o link do catálogo veste", () => {
        expect(listFillClassName).toContain("button-fill")
        expect(listFillClassName).toContain("duration-(--duration-slow)")
        expect(listFillClassName).toContain("ease-(--ease-emphasized)")
        expect(listFillClassName).toContain("--button-fill]")
        const tertiary = fonte("src/components/ui/button.tsx")
        expect(tertiary).toMatch(/button-fill \[--button-fill-color:var\(--muted\)\][^"]*duration-\(--duration-slow\) ease-\(--ease-emphasized\)/)
    })
})
