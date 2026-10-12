import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { arquivosTsx, lerFonte, semComentarios } from "@/test/fonte"

/**
 * A opção e a lista do `Select` são do componente (rodada 173). Doze opções
 * reescreviam a geometria e perdiam o piso de toque, oito listas somavam
 * `p-1` ao respiro do viewport, e oito seletores escreviam a ausência à mão.
 */
const RAIZ = join(process.cwd(), "src/components")
const TELAS = arquivosTsx(RAIZ, ["ui"]).map((f) => [f, lerFonte(f)] as const)
const SELECT = lerFonte(join(RAIZ, "ui/select.tsx"))

describe("as opções do Select", () => {
  it("1. nenhuma tela reescreve a geometria da opção nem o respiro da lista", () => {
    for (const [f, src] of TELAS) {
      for (const m of src.matchAll(/<SelectItem\b[^>]*className="([^"]*)"/g)) {
        expect(m[1], f).not.toMatch(/\b(py|pl|pr|px|p)-/)
      }
      for (const m of src.matchAll(/<SelectContent\b[^>]*className="([^"]*)"/g)) {
        expect(m[1], f).not.toMatch(/\bp-1\b|radix-select-trigger-width/)
      }
    }
  })

  it("2. a ausência é variant=\"none\", e não uma opção com travessões", () => {
    for (const [f, src] of TELAS) {
      expect(src, f).not.toMatch(/<SelectItem[^>]*>\s*— [^<]+ —\s*</)
    }
    // Ela traz o próprio separador, e a tinta mora dentro do `ItemText`.
    expect(SELECT).toMatch(/if \(variant !== "none"\) return item/)
    expect(SELECT).toContain('<span className="text-muted-foreground">{children}</span>')
  })

  it("3. a descrição fica fora do ItemText, e o ItemText é achado pelo data-slot", () => {
    // O `ItemText` do Radix descarta `className`: só atributos chegam.
    expect(SELECT).toContain('<SelectPrimitive.ItemText data-slot="select-item-text">')
    expect(SELECT).toContain("**:data-[slot=select-item-text]:flex")
    expect(semComentarios(SELECT, "numa-passada")).not.toMatch(/\*:\[span\]:last:/)
  })
})
