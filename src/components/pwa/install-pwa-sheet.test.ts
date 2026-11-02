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
  it("o corpo rola num DialogBody e a folha abraça o conteúdo", () => {
    expect(f).toContain("DialogBody")
    expect(f).not.toContain("fillMobileViewport")
  })
  it("o ponto é a tinta sobre foto, nos dois temas", () => {
    expect(f).toContain("ring-scrim-foreground")
    expect(f).not.toContain("ring-foreground\"")
  })
  it("a imagem aparece borrada até carregar", () => {
    expect(f).toContain('placeholder="blur"')
  })
  it("fechar o aviso automático também o dispensa", () => {
    const auto = f.slice(f.indexOf("export function InstallPwaSheetAuto"))
    expect(auto).toContain("dispensarAviso()")
    expect(f).toContain("PWA_INSTALL_DISMISSED_KEY")
  })

  it("o aparelho dissolve no lado em que a janela o corta", () => {
    expect(f).toContain("[mask-image:linear-gradient(to_top,transparent,#000_4rem)]")
    expect(f).toContain("[mask-image:linear-gradient(to_bottom,transparent,#000_4rem)]")
  })
})
