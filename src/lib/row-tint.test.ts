import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

/**
 * O realce das linhas sobre vidro é a tinta `--foreground`, a pedido do dono:
 * 9% na passagem e 15% ao pressionar ou com o item aberto. O `--sidebar-accent`
 * (rodada 325), mesmo com alfa, é um cinza escuro: sobre o que estava atrás lia
 * como faixa sólida. `bg-accent` e `bg-muted` continuam fora: matavam a
 * transparência da placa e da gaveta.
 */

const SOBRE_VIDRO = [
  "src/lib/menu-classes.ts",
  "src/components/ui/command.tsx",
  "src/components/ui/select.tsx",
  "src/components/ui/menubar.tsx",
  "src/components/ui/navigation-menu.tsx",
  "src/components/ui/drawer.tsx",
  "src/components/ui/calendar.tsx",
  "src/components/layout/notification-row.tsx",
]

describe("o realce das linhas sobre vidro é a tinta do texto", () => {
  it("nenhuma linha acende com cor opaca", () => {
    for (const caminho of SOBRE_VIDRO) {
      const codigo = lerFonte(caminho)
      expect(codigo, caminho).not.toMatch(/(focus|data-selected|data-open|focus-visible):bg-accent\b/)
      expect(codigo, caminho).not.toContain("hover:bg-muted active:bg-muted")
      expect(codigo, caminho).not.toMatch(/hover:bg-accent\b/)
    }
  })

  it("o realce é um só: a tinta a 9%, a 15% ao pressionar", () => {
    for (const caminho of SOBRE_VIDRO) {
      const codigo = lerFonte(caminho)
      expect(codigo, caminho).toContain("bg-foreground/9")
      expect(codigo, caminho).toContain("active:bg-foreground/15")
      expect(codigo, caminho).not.toMatch(/:bg-sidebar-accent\b/)
    }
  })
})
