import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

/**
 * O realce das linhas sobre vidro é o da barra lateral (rodada 325, a pedido do
 * dono: um realce só no app): `--sidebar-accent` a 50% na passagem, ainda
 * translúcido sobre a placa, e cheio ao pressionar ou com o item aberto. Foi a
 * tinta `--foreground` a 9%. `bg-accent` e `bg-muted` continuam fora: matavam a
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
]

describe("o realce das linhas sobre vidro é o da barra lateral", () => {
  it("nenhuma linha acende com cor opaca", () => {
    for (const caminho of SOBRE_VIDRO) {
      const codigo = lerFonte(caminho)
      expect(codigo, caminho).not.toMatch(/(focus|data-selected|data-open|focus-visible):bg-accent\b/)
      expect(codigo, caminho).not.toContain("hover:bg-muted active:bg-muted")
      expect(codigo, caminho).not.toMatch(/hover:bg-accent\b/)
    }
  })

  it("o realce é um só: o sidebar-accent a 50%, cheio ao pressionar", () => {
    for (const caminho of SOBRE_VIDRO) {
      const codigo = lerFonte(caminho)
      expect(codigo, caminho).toContain("bg-sidebar-accent/50")
      expect(codigo, caminho).toContain("active:bg-sidebar-accent")
      expect(codigo, caminho).not.toMatch(/bg-foreground\/9\b/)
    }
  })
})
