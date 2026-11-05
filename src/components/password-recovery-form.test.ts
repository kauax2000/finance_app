import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

const FONTE = semComentarios(lerFonte("src/components/password-recovery-form.tsx"))

describe("recuperação de senha por link", () => {
  it("não há mais código", () => {
    expect(FONTE).not.toMatch(/verifyOtp|InputOTP|OTP_LENGTH|"code"/)
  })
  it("o passo sent avisa o e-mail e reenvia o link", () => {
    expect(FONTE).toContain('scene="recovery.sent"')
    expect(FONTE).toContain('icon="mail"')
    expect(FONTE).toContain('label="Reenviar link"')
    expect(FONTE).toContain("Enviar link")
  })
  it("o link é lido por lerLinkDeRecuperacao, e o erro vence a sessão", () => {
    expect(FONTE).toContain("lerLinkDeRecuperacao(window.location.hash, window.location.search)")
    expect(FONTE.indexOf('tipo === "erro"')).toBeLessThan(FONTE.indexOf("getSession"))
  })
  it("vencido pede um link novo", () => {
    expect(FONTE).toContain("Pedir novo link")
  })
})
