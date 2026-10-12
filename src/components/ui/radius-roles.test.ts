import { execSync } from "node:child_process"
import { readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { blocoCss, lerFonte } from "@/test/fonte"

import { buttonVariants } from "@/components/ui/button"
import { fieldSurfaceClassName } from "@/lib/field-classes"
import { menuItemGeometryClassName, menuPanelSurfaceClassName } from "@/lib/menu-classes"
import { searchFieldShapeClassName } from "@/lib/search-field-classes"
import { cn } from "@/lib/utils"

/**
 * As rodadas 240 e 240c: o raio mora na escala de Shape & Elevation. Cada
 * componente veste um degrau dela — cápsula, superfície, modal, concêntrico ou
 * a escada pequena —, e o raio de um componente se muda lá, nunca com um
 * número no arquivo do componente.
 */

const CSS = lerFonte("src/app/globals.css")
const BLOCO = blocoCss(CSS, "@theme static {", "}")
const UI = "src/components/ui"
const COMPONENTES = readdirSync(join(process.cwd(), UI))
  .filter((nome) => nome.endsWith(".tsx"))
  .map((nome) => [nome, lerFonte(join(UI, nome))] as const)
const LIB = ["field-classes.ts", "menu-classes.ts", "search-field-classes.ts"].map(
  (nome) => [nome, lerFonte(join("src/lib", nome))] as const
)
const semComentarios = (codigo: string) => codigo.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "")

describe("a escala do raio", () => {
  it("superfície 22, modal 28, linha 12 e linha alta 16, e nada mais no bloco", () => {
    expect(BLOCO).toContain("--radius-surface: 1.375rem;")
    expect(BLOCO).toContain("--radius-modal: 1.75rem;")
    expect(BLOCO).toContain("--radius-row: 0.75rem;")
    expect(BLOCO).toContain("--radius-row-lg: 1rem;")
    expect([...BLOCO.matchAll(/--radius-([a-z-]+):/g)].map((m) => m[1])).toStrictEqual(["surface", "modal", "row", "row-lg"])
  })

  it("nenhum componente escreve um raio em número", () => {
    // `rounded-[18px]`, `rounded-[1.5rem]`, `rounded-[calc(…)]`: o raio se
    // muda na escala. Ficam o `inherit` (o canto do pai) e o `var()`.
    for (const [nome, codigo] of [...COMPONENTES, ...LIB]) {
      expect(semComentarios(codigo), nome).not.toMatch(/\brounded-(?:[tblrse]{1,2}-)?\[(?!inherit\]|var\()/)
    }
  })

  it("no app, o concêntrico não sai de `ui/`: fora dele ninguém publica o pai", () => {
    // Uma caixa `concentric` numa folha ou num cartão sem recuo caía em 22 e
    // saía pílula (rodada 244c). No app a caixa veste o degrau.
    const achados = execSync("grep -rln '\\bconcentric\\b' src --include='*.tsx' || true", { encoding: "utf8" })
      .split("\n")
      .filter((f) => f && !f.startsWith("src/components/ui/") && !f.startsWith("src/app/designsystem/"))
    expect(achados).toEqual([])
  })

  it("nenhum componente usa os degraus que eram contêiner (xl, 2xl)", () => {
    for (const [nome, codigo] of COMPONENTES) {
      expect(semComentarios(codigo), nome).not.toMatch(/\brounded-(t-|b-)?(xl|2xl)\b(?!-)/)
    }
  })

  it("o catálogo também veste a escala: nenhuma moldura escrita à mão", () => {
    // As molduras do `/designsystem` (DocMeta, Preview, Spec, as caixas das
    // páginas) desenhavam `rounded-xl` à mão e não ouviam a escala (rodada 240d).
    const DS = "src/app/designsystem"
    const arquivos = [
      ...readdirSync(join(process.cwd(), DS)).filter((n) => n.endsWith(".tsx")).map((n) => join(DS, n)),
      ...readdirSync(join(process.cwd(), DS, "docs"))
        .filter((n) => n.endsWith(".tsx") && n !== "shape-elevation.tsx")
        .map((n) => join(DS, "docs", n)),
    ]
    for (const arquivo of arquivos) {
      expect(semComentarios(lerFonte(arquivo)).replace(/<code>[\s\S]*?<\/code>/g, ""), arquivo).not.toMatch(/\brounded-(t-|b-)?(xl|2xl|3xl)\b(?!-)/)
    }
  })

  it("controle é cápsula, o campo também; o que contém, superfície; o que cobre, modal", () => {
    expect(buttonVariants({}).split(/\s+/)).toContain("rounded-full")
    expect(fieldSurfaceClassName.split(/\s+/)).toContain("rounded-full")
    expect(searchFieldShapeClassName.split(/\s+/)).toContain("rounded-full")
    expect(menuPanelSurfaceClassName).toContain("rounded-surface")
    expect(lerFonte(join(UI, "card.tsx"))).toContain("rounded-surface text-sm")
    expect(lerFonte(join(UI, "dialog.tsx"))).toContain('"rounded-modal text-sm')
  })
})

describe("o concêntrico", () => {
  it("é o raio do pai menos o recuo, com mínimo", () => {
    const bloco = CSS.slice(CSS.indexOf("@utility concentric {"), CSS.indexOf("@utility concentric {") + 300)
    expect(bloco).toMatch(/max\(\s*var\(--radius-min/)
    expect(bloco).toMatch(/calc\(var\(--radius-parent, var\(--radius-surface\)\) - var\(--radius-inset, 0px\)\)/)
    expect(menuItemGeometryClassName.split(/\s+/)).toContain("concentric")
    expect(menuPanelSurfaceClassName).toContain("[--radius-parent:var(--radius-surface)]")
    expect(menuPanelSurfaceClassName).toContain("[--radius-inset:--spacing(2)]")
  })

  it("nunca divide a classe com um `rounded-*`", () => {
    // O `tailwind-merge` não sabe que os dois brigam; quem venceria é a ordem
    // de emissão do Tailwind.
    for (const [nome, codigo] of [...COMPONENTES, ...LIB]) {
      for (const literal of codigo.match(/"[^"\n]*\bconcentric\b[^"\n]*"/g) ?? []) {
        expect(literal, nome).not.toMatch(/(^|[\s"])rounded-/)
      }
    }
  })

  it("o `cn` sabe que os degraus da escala são raio", () => {
    expect(cn("rounded-lg", "rounded-surface")).toBe("rounded-surface")
    expect(cn("rounded-surface", "rounded-modal")).toBe("rounded-modal")
    expect(cn("rounded-lg", "rounded-row")).toBe("rounded-row")
    expect(cn("rounded-row", "rounded-row-lg")).toBe("rounded-row-lg")
    expect(cn("rounded-full", "rounded-t-modal")).toBe("rounded-full rounded-t-modal")
  })
})
