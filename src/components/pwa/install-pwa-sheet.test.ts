import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const f = semComentarios(lerFonte("src/components/pwa/install-pwa-sheet.tsx"))

describe("InstallPwaSheet", () => {
  it("quatro passos, cada um com a imagem real", () => {
    for (const a of ["instalar-1-menu.webp", "instalar-2-compartilhar.webp", "instalar-3-ver-mais.webp", "instalar-4-adicionar.webp"]) expect(f).toContain(a)
    for (const t of ["Compartilhar", "Ver Mais", "Adicionar à Tela de Início", "Adicionar"]) expect(f).toContain(t)
  })
  it("o passo volta ao 1 ao abrir", () => {
    expect(f).toMatch(/setPasso\(0\)/)
  })
  it("só o último passo dispensa", () => {
    expect(f).toContain("Entendi")
    expect(f).toContain("Próximo")
    expect(f).toContain("Voltar")
  })
  it("o ponto respeita o movimento reduzido", () => {
    expect(f).toContain("motion-safe:animate-ping")
  })
  it("o passo fica numa região viva", () => {
    expect(f).toContain('aria-live="polite"')
  })
})
