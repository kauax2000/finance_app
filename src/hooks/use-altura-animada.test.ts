import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

import { animaAAltura } from "./use-altura-animada"

describe("animaAAltura", () => {
  it.each(["collapsible-down", "collapsible-up", "accordion-down", "accordion-up"])(
    "%s anima a altura",
    (nome) => expect(animaAAltura(nome)).toBe(true),
  )
  it.each(["rise", "menu-content-in", "zoom-in", ""])("%j não anima a altura", (nome) =>
    expect(animaAAltura(nome)).toBe(false),
  )
})

describe("useAlturaAnimada — filho que anima a altura", () => {
  const fonte = semComentarios(lerFonte("src/hooks/use-altura-animada.ts"))

  it("pergunta ao navegador pelas animações do subárvore e só conta as de altura em voo", () => {
    expect(fonte).toContain("getAnimations?.({ subtree: true })")
    expect(fonte).toContain("animaAAltura")
    expect(fonte).toContain('playState === "running"')
    expect(fonte).toContain("?.target !== el")
    expect(fonte).toContain("CSSAnimation")
  })

  it("retorna sem animar, e o data-altura-em-voo manual continua valendo", () => {
    expect(fonte).toMatch(/\[data-altura-em-voo\]"\) \|\| filhoEmVoo\(el\)/)
  })
})
