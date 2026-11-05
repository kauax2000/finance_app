import { describe, expect, it } from "vitest"
import { lerLinkDeRecuperacao, recoveryLinks } from "./recovery-links"

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

describe("lerLinkDeRecuperacao", () => {
  it("tokens no hash", () => {
    expect(lerLinkDeRecuperacao("#access_token=a&refresh_token=r&type=recovery", "")).toEqual({ tipo: "tokens", accessToken: "a", refreshToken: "r" })
  })
  it("link vencido no hash vale como erro, mesmo com token junto", () => {
    expect(lerLinkDeRecuperacao("#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid", "")).toEqual({ tipo: "erro" })
    expect(lerLinkDeRecuperacao("#access_token=a&error_code=otp_expired", "")).toEqual({ tipo: "erro" })
  })
  it("error_description sozinho também é erro", () => {
    expect(lerLinkDeRecuperacao("#error_description=x", "")).toEqual({ tipo: "erro" })
  })
  it("erro na query", () => {
    expect(lerLinkDeRecuperacao("", "?error=access_denied&error_description=x")).toEqual({ tipo: "erro" })
  })
  it("nada no endereço (o cliente já consumiu o hash)", () => {
    expect(lerLinkDeRecuperacao("", "?next=%2Fdashboard")).toEqual({ tipo: "nada" })
  })
  it("token sem refresh vira refresh vazio", () => {
    expect(lerLinkDeRecuperacao("access_token=a", "")).toEqual({ tipo: "tokens", accessToken: "a", refreshToken: "" })
  })
})
