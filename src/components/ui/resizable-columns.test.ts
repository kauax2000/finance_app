import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

/**
 * As colunas redimensionáveis (rodada 170). O arraste é nosso, e não da lib,
 * então as decisões que o fazem funcionar numa tabela só existem no código.
 */
const RESIZABLE = semComentarios(lerFonte("src/components/ui/resizable.tsx"), "numa-passada")
const TABLE = semComentarios(lerFonte("src/components/ui/table.tsx"), "numa-passada")

describe("colunas redimensionáveis", () => {
  it("1. a tabela é fixa, e a folga entra no min-width", () => {
    // Com `table-layout: fixed` a coluna declarada mede o que diz, e a coluna
    // sem largura absorve a sobra — é o que faz a costura andar com o cursor.
    expect(RESIZABLE).toContain('tableLayout: "fixed"')
    expect(RESIZABLE).toContain("minWidth: soma + fluidMinWidth")
  })

  it("2. a costura não rola a tabela nem ordena a coluna", () => {
    expect(RESIZABLE).toContain("touch-none")
    expect(RESIZABLE).toContain("setPointerCapture")
    expect(RESIZABLE).toMatch(/onClick=\{\(e\) => e\.stopPropagation\(\)\}/)
  })

  it("3. é um separador com nome e valor", () => {
    expect(RESIZABLE).toContain('role="separator"')
    expect(RESIZABLE).toContain("aria-valuenow={width}")
    expect(RESIZABLE).toMatch(/aria-label=\{`Redimensionar a coluna \$\{label\}`\}/)
  })

  it("4. só o cabeçalho que tem costura se posiciona, e ele não trunca", () => {
    // `relative` em toda célula mudaria toda tabela do app; `truncate` cortaria
    // a metade da costura que passa da borda.
    expect(TABLE).toContain("has-[>[data-slot=resizable-column-handle]]:relative")
    expect(TABLE).not.toContain("has-[>[data-slot=resizable-column-handle]]:truncate")
  })

  it("5. as larguras guardadas entram depois da hidratação", () => {
    // A lição do `useResizableLayout`: o HTML do servidor não sabe do storage.
    expect(RESIZABLE).toMatch(/React\.useEffect\(\(\) => \{\s*const guardado = lerLarguras\(id\)/)
  })
})
