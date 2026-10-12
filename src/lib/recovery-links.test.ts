import { describe, expect, it } from "vitest"
import { recoveryLinks } from "./recovery-links"

describe("os links da recuperação carregam o next", () => {
  it("sem next, os destinos de sempre", () => {
    expect(recoveryLinks(null)).toEqual({
      login: "/login",
      loginUpdated: "/login?reason=password-updated",
      forgot: "/forgot-password",
      resetPath: "/reset-password",
    })
  })

  it("com next interno, ele atravessa", () => {
    const l = recoveryLinks("/invites/accept?token=abc")
    const n = encodeURIComponent("/invites/accept?token=abc")
    expect(l.login).toBe(`/login?next=${n}`)
    expect(l.loginUpdated).toBe(`/login?reason=password-updated&next=${n}`)
    expect(l.forgot).toBe(`/forgot-password?next=${n}`)
    expect(l.resetPath).toBe(`/reset-password?next=${n}`)
  })

  it("next de fora é descartado", () => {
    expect(recoveryLinks("//evil.com").login).toBe("/login")
    expect(recoveryLinks("https://evil.com").forgot).toBe("/forgot-password")
  })
})
