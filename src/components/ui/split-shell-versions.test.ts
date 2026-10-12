import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { esperarDepoisDeNoScrollbar } from "@/test/regras"

/** A rodada 235: o redesenho, as peças e os comportamentos do `SplitShell`. */

const fonte = (caminho: string) => semComentarios(lerFonte(caminho), "linha-inteira")
const CODIGO = fonte("src/components/ui/split-shell.tsx")
const CSS = lerFonte("src/app/globals.css")
const PAINEL = fonte("src/components/layout/auth-brand-panel.tsx")

describe("o redesenho", () => {
  it("quebra pelo casco, e não pela janela", () => {
    expect(CODIGO).toContain("@container/split-shell")
    expect(CODIGO).toContain("@3xl/split-shell:grid")
    expect(CODIGO).not.toMatch(/(?:^|[\s"])lg:/)
  })

  it("lado e proporção, com as classes escritas por extenso", () => {
    for (const cols of ["grid-cols-[5fr_6fr]", "grid-cols-[1fr_2fr]", "grid-cols-[6fr_5fr]", "grid-cols-[2fr_1fr]"]) {
      expect(CODIGO).toContain(`@3xl/split-shell:${cols}`)
    }
    expect(CODIGO).toContain('side === "end" && "@3xl/split-shell:order-last"')
  })

  it("a coluna em três faixas: o voltar, o conteúdo e o pé", () => {
    expect(CODIGO).toContain('data-slot="split-shell-back-row"')
    expect(CODIGO).toContain("{footer ? (")
  })
})

describe("as peças", () => {
  it("o campo, o pé, o voltar e o esqueleto", () => {
    for (const peca of ["SplitShellAside", "SplitShellFooter", "SplitShellBack", "SplitShellSkeleton"]) {
      expect(CODIGO).toContain(`function ${peca}(`)
    }
  })

  it("a área segura do campo passa por variável, para a prévia num iPhone a emular", () => {
    expect(CODIGO).toContain("[--split-shell-safe-top:env(safe-area-inset-top,0px)]")
    expect(CODIGO).toContain("pb-[calc(--spacing(6)+var(--split-shell-safe-bottom))]")
    expect(fonte("src/app/designsystem/ds-frame.tsx")).toContain("[data-slot=split-shell]{--split-shell-safe-top:")
  })

  it("o painel de marca do app veste a peça, e não escreve a geometria à mão", () => {
    expect(PAINEL).toContain("<SplitShellAside")
    expect(PAINEL).not.toContain("safe-area-inset-top")
    expect(PAINEL).not.toMatch(/(?:^|[\s"])lg:/)
  })
})

describe("os comportamentos", () => {
  it("o campo no telefone: cartão, faixa, só a marca ou nada", () => {
    expect(CODIGO).toContain('type SplitShellAsideMobile = "card" | "band" | "logo" | "hidden"')
    expect(CODIGO).toContain('data-slot="split-shell-aside-logo"')
    expect(CODIGO).toContain('asideMobile === "hidden" && "@max-3xl/split-shell:hidden"')
    expect(CODIGO).toContain('(asideMobile === "band" || soLogo) && "@max-3xl/split-shell:hidden"')
  })

  it("recolhe com o teclado, só no toque e abaixo da quebra", () => {
    expect(CODIGO).toMatch(/pointer-coarse:@max-3xl\/split-shell:group-has-\[\[data-slot=split-shell-main\]_:is\(input/)
  })

  it("o passo desliza e leva o foco ao título, só quando muda", () => {
    expect(CODIGO).toContain("if (anterior.current === step) return")
    expect(CODIGO).toContain("titulo.current?.focus({ preventScroll: true })")
    expect(esperarDepoisDeNoScrollbar(CSS, "@utility split-shell-step")).toContain("prefers-reduced-motion")
  })

  it("o campo fica preso na altura da janela", () => {
    expect(CODIGO).toContain("@3xl/split-shell:sticky @3xl/split-shell:top-0 @3xl/split-shell:h-svh")
  })
})
