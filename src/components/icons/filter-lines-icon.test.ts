import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

describe("FilterLinesIcon", () => {
  it("o cabeçalho e a Toolbar filtram com o FilterLinesIcon", () => {
    for (const f of ["src/components/layout/app-header.tsx", "src/components/ui/toolbar.tsx"]) {
      const fonte = semComentarios(lerFonte(f))
      expect(fonte).toContain('from "@/components/icons/filter-lines-icon"')
      expect(fonte).not.toContain("AdjustmentsHorizontalIcon")
    }
    expect(semComentarios(lerFonte("src/components/ui/data-table.tsx"))).toContain("AdjustmentsHorizontalIcon")
  })

  it("é um desenho nomeado no auditor, na grade 16/solid", () => {
    expect(lerFonte(".claude/skills/design-system-guard/scripts/audit.mjs")).toContain('"filter-lines-icon"')
    const icone = lerFonte("src/components/icons/filter-lines-icon.tsx")
    expect(icone).toContain('viewBox="0 0 16 16"')
    expect(icone).toContain('fill="currentColor"')
    expect(icone).toContain('data-slot="icon"')
  })
})
