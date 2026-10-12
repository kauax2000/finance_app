import { describe, expect, it } from "vitest"
import { arquivosTsx, lerFonte, semComentarios } from "@/test/fonte"

const fonte = (c: string) => semComentarios(lerFonte(c), "linha-inteira")

describe("o casco das telas de acesso", () => {
  it("no telefone, só o wordmark", () => {
    expect(fonte("src/components/layout/auth-shell.tsx")).toContain('asideMobile="logo"')
  })

  it("o painel desenha a cena que recebe, e não uma fixa", () => {
    const painel = fonte("src/components/layout/auth-brand-panel.tsx")
    expect(painel).toContain("{children}")
    expect(painel).not.toContain("const SALDO")
  })

  it("as cenas só compõem o design system: nenhuma cor crua", () => {
    for (const arq of arquivosTsx("src/components/auth/scenes")) {
      expect(fonte(arq)).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|oklch\(|(?:text|bg)-(?:gray|zinc|slate|neutral|green|red)-\d/)
    }
  })
})
