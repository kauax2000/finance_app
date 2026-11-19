import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

/** O `ButtonGroup variant="rail"`: o trilho do `Tabs floating`, para um par de navegação. */

const GRUPO = lerFonte("src/components/ui/button-group.tsx")
const TABS = lerFonte("src/components/ui/tabs.tsx")
const rail = GRUPO.slice(GRUPO.indexOf("const RAIL = ["), GRUPO.indexOf("const VERTICAL"))

describe("ButtonGroup variant=rail", () => {
  it("veste a moldura do Tabs floating", () => {
    for (const c of ["rounded-full", "bg-popover", "p-0.5", "ring-1", "ring-foreground/10", "h-9", "pointer-coarse:h-11"]) {
      expect(rail, c).toContain(c)
      expect(TABS.includes(c.replace("pointer-coarse:", "")), c).toBe(true)
    }
  })

  it("as peças de dentro medem 32 (40 no dedo) e vencem a altura da Toolbar", () => {
    expect(rail).toContain("h-8!")
    expect(rail).toContain("size-8!")
    expect(rail).toContain("pointer-coarse:[&>button:not([data-size^=icon])]:h-10!")
  })

  it("mede todo filho botão, não só data-slot=button (o gatilho de popover leva outro slot)", () => {
    expect(rail).not.toContain("data-slot=button")
    expect(rail).toContain("[&>button:not([data-size^=icon])]:h-8!")
  })

  it("sem emenda, filete nem canto achatado", () => {
    expect(rail).not.toMatch(/-ml-px|rounded-l-none|rounded-r-none|before:/)
    expect(GRUPO).toContain('variant !== "rail" && JUNTA')
  })

  it("sem variant, a emenda de hoje continua", () => {
    expect(GRUPO).toContain("not-has-[>[data-slot=input]]:[&>*:not(:first-child)]:-ml-px")
    expect(GRUPO).toContain('variant === "rail" ? RAIL : orientation === "vertical" ? VERTICAL : HORIZONTAL')
  })
})
