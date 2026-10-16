import { describe, expect, it } from "vitest"
import { blocoCss, lerFonte } from "@/test/fonte"

/**
 * O `Skeleton`. A linha de texto depende de uma `@utility` do `globals.css`; se ela some, a
 * classe continua no elemento, a regra deixa de existir e todo `shape="text"` fica com altura
 * zero, sem erro.
 */
const CSS = lerFonte("src/app/globals.css")
const SRC = lerFonte("src/components/ui/skeleton.tsx")

describe("Skeleton", () => {
  it("1. a linha de texto tem a utility que lhe dá altura", () => {
    expect(SRC).toContain('base: "skeleton-text rounded-sm"')
    expect(CSS.indexOf("@utility skeleton-text {"), "a @utility skeleton-text sumiu do globals.css").toBeGreaterThan(-1)
    const bloco = blocoCss(CSS, "@utility skeleton-text {", "}")
    expect(bloco).toContain("height: 0.8em")
    expect(bloco).toContain("margin-block: calc((1lh - 0.8em) / 2)")
  })

  it("2. um movimento só: o pulso", () => {
    expect(SRC).toContain('"animate-pulse bg-skeleton"')
    expect(CSS).not.toMatch(/skeleton-shimmer|--skeleton-highlight/)
  })
})

describe("o osso do avatar é o círculo do Avatar", () => {
  it("na conta, nos membros e na conta da barra lateral, no mesmo degrau da peça", () => {
    // Eram quadrados (`rounded-lg`) esperando um avatar redondo, e o dos membros media 36
    // contra o `Avatar size="sm"` de 32.
    expect(lerFonte("src/components/account/account-page-skeleton.tsx")).toContain('<Skeleton shape="circle" size="lg" />')
    expect(lerFonte("src/components/members/members-section-skeleton.tsx")).toContain('<Skeleton shape="circle" size="sm" />')
    expect(lerFonte("src/components/layout/sidebar-user-profile.tsx")).toContain('<SidebarMenuSkeleton size="lg" showIcon media="avatar"')
    expect(lerFonte("src/components/ui/sidebar.tsx")).toContain('{ shape: "circle" as const, size: "sm" as const }')
  })
})
