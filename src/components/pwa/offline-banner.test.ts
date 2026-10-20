import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const CODIGO = semComentarios(lerFonte("src/components/pwa/offline-banner.tsx"))
const NAV = semComentarios(lerFonte("src/components/layout/mobile-bottom-nav.tsx"))

/** Rodadas 347 e 348: no telefone o aviso de offline é a pílula no acessório da barra. */
describe("o aviso de offline", () => {
  it("no telefone é a pílula no acessório da barra de baixo, sem conta de altura por fora", () => {
    expect(NAV).toContain("accessory={<OfflinePill />}")
    expect(CODIGO).not.toContain("--bottom-bar-pad")
  })

  it("a pílula é vidro no tom de aviso, cápsula, e anuncia o estado", () => {
    expect(CODIGO).toContain("supports-backdrop-filter:bg-warning-muted/75")
    expect(CODIGO).toContain("text-warning-muted-foreground")
    expect(CODIGO).toContain('role="status"')
    expect(CODIGO).toContain("rounded-full")
  })

  it("brota no gesto dos menus e termina cápsula", () => {
    expect(CODIGO).toContain("[animation:menu-morph_380ms_linear_backwards]")
    expect(CODIGO).toContain("[--morph-radius:calc(infinity*1px)]")
  })

  it("no desktop continua a faixa", () => {
    expect(CODIGO).toMatch(/<AnnouncementBar[\s\S]*className="hidden md:flex"/)
  })
})
