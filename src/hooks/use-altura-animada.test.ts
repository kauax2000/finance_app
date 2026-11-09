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

describe("useAlturaAnimada — a largura anda junto", () => {
  const fonte = semComentarios(lerFonte("src/hooks/use-altura-animada.ts"))

  it("lê a largura e escreve as duas propriedades na mesma mola", () => {
    expect(fonte).toContain("offsetWidth")
    expect(fonte).toContain(
      '"height var(--duration-spring) var(--ease-spring), width var(--duration-spring) var(--ease-spring)"',
    )
  })

  it("abaixo de 768px (a gaveta) só a altura anda", () => {
    expect(fonte).toContain('"(max-width: 47.99rem)"')
  })

  it("o limpar solta a largura, e o fim só limpa quando as que andaram terminaram", () => {
    expect(fonte).toContain('el.style.width = ""')
    expect(fonte).toContain('el.style.maxWidth = ""')
    expect(fonte).toContain('el.style.maxWidth = "none"')
    expect(fonte).toContain("pendentes")
  })
})
