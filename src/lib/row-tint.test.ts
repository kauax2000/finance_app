import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * A rodada 245: o realce das linhas sobre vidro é uma **tinta** — o
 * `--foreground` a 9% por cima do que estiver atrás —, e não uma cor opaca.
 * `bg-accent` e `bg-muted` matavam a transparência da placa e da gaveta: a
 * linha acesa virava um retângulo chapado. A 9% a tinta lê como o `accent`
 * lia (1,21:1 no claro, 1,25:1 no escuro, contra a placa composta).
 */

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")

const SOBRE_VIDRO = [
  "src/lib/menu-classes.ts",
  "src/components/ui/command.tsx",
  "src/components/ui/select.tsx",
  "src/components/ui/menubar.tsx",
  "src/components/ui/navigation-menu.tsx",
  "src/components/ui/drawer.tsx",
  "src/components/ui/calendar.tsx",
]

describe("o realce das linhas sobre vidro é tinta", () => {
  it("nenhuma linha acende com cor opaca", () => {
    for (const caminho of SOBRE_VIDRO) {
      const codigo = fonte(caminho)
      expect(codigo, caminho).not.toMatch(/(focus|data-selected|data-open|focus-visible):bg-accent\b/)
      expect(codigo, caminho).not.toContain("hover:bg-muted active:bg-muted")
      expect(codigo, caminho).not.toMatch(/hover:bg-accent\b/)
    }
  })

  it("a tinta é uma só: o foreground a 9%", () => {
    for (const caminho of SOBRE_VIDRO) {
      expect(fonte(caminho), caminho).toContain("bg-foreground/9")
    }
  })
})
