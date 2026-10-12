import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { esperarDepoisDeNoScrollbar } from "@/test/regras"

import { topBarVariants } from "./top-bar"

/** A rodada 237: o redesenho, as peças e os comportamentos do `TopBar`. */

const fonte = (caminho: string) => semComentarios(lerFonte(caminho), "linha-inteira")
const CODIGO = fonte("src/components/ui/top-bar.tsx")
const CSS = lerFonte("src/app/globals.css")

describe("o redesenho", () => {
  it("o fio só aparece ao rolar, no scroll", () => {
    expect(topBarVariants({})).toContain("data-[scrolled=false]:border-b-transparent")
  })

  it("a flutuante é a pílula da casa, abaixo do notch", () => {
    const flutuante = topBarVariants({ variant: "floating" })
    expect(flutuante).toContain("rounded-full")
    expect(flutuante).toContain("ring-1 ring-foreground/10")
    expect(flutuante).toContain("pt-0!")
    expect(topBarVariants({ variant: "floating", position: "fixed" })).toContain(
      "top-[calc(var(--top-bar-safe-area)+--spacing(2))]"
    )
    expect(topBarVariants({ variant: "floating", surface: "solid" })).toContain("bg-popover")
  })

  it("o título no meio, no telefone, por uma grade de pontas iguais", () => {
    expect(topBarVariants({})).toContain(
      "data-[title-align=center]:max-md:grid-cols-[minmax(0,1fr)_minmax(0,max-content)_minmax(0,1fr)]"
    )
  })

  it("o degrau lg mede 64", () => {
    expect(topBarVariants({ size: "lg" })).toContain("[--top-bar-h:4rem]")
  })

  it("a área segura passa por variável, para o iPhone do catálogo a emular", () => {
    expect(topBarVariants({})).toContain("[--top-bar-safe-area:env(safe-area-inset-top,0px)]")
    expect(topBarVariants({ position: "fixed" })).toContain("[--top-bar-safe:var(--top-bar-safe-area)]")
    expect(fonte("src/app/designsystem/ds-frame.tsx")).toContain("--top-bar-safe-area:${IPHONE_SEGURA_TOPO}px")
  })
})

describe("as peças", () => {
  it("a ação, a busca, o esqueleto e o fio de progresso", () => {
    for (const peca of ["TopBarAction", "TopBarSearch", "TopBarSkeleton", "TopBarProgress"]) {
      expect(CODIGO).toContain(`function ${peca}(`)
    }
  })

  it("a contagem da ação entra no nome, e o número fica escondido do leitor", () => {
    expect(CODIGO).toContain('const nome = temContagem ? label + ", " + (countLabel ?? count) : label')
    expect(CODIGO).toContain('{count > 99 ? "99+" : count}')
  })

  it("a busca é ícone e pílula, com as quebras por extenso", () => {
    expect(CODIGO).toContain('md: { icone: "md:hidden", pilula: "hidden md:flex" }')
    expect(CODIGO).toContain('lg: { icone: "lg:hidden", pilula: "hidden lg:flex" }')
  })

  it("todo alvo de toque ampliado da barra se ancora no próprio botão", () => {
    // Sem `relative`, o `::after` absoluto cobria a barra e engolia o ☰.
    const alvos = CODIGO.match(/"[^"]*pointer-coarse:after:absolute[^"]*"/g) ?? []
    expect(alvos.length).toBeGreaterThan(0)
    for (const alvo of alvos) expect(alvo).toMatch(/"relative /)
  })

  it("o fio de progresso é progressbar, e o indeterminado mora numa @utility depois do no-scrollbar", () => {
    expect(CODIGO).toContain('role="progressbar"')
    expect(esperarDepoisDeNoScrollbar(CSS, "@utility top-bar-progress")).toContain("prefers-reduced-motion")
  })

  it("a barra do app usa as peças, numa árvore só", () => {
    const app = fonte("src/components/layout/app-header.tsx")
    expect(app).not.toContain("hidden md:contents")
    expect(app).not.toContain('className="contents md:hidden">\n                <TopBarStart')
    expect(app).toContain("<TopBarSearch")
    expect(fonte("src/components/layout/notification-bell-link.tsx")).toContain("<TopBarAction")
  })
})

describe("os comportamentos", () => {
  it("uma árvore: phone nas pontas", () => {
    expect(CODIGO).toContain('className="contents max-md:hidden"')
    expect(CODIGO).toContain('className="hidden max-md:contents"')
  })

  it("some ao rolar, só no telefone e nunca com o foco dentro", () => {
    expect(CODIGO).toContain("if (focada || y <= el.offsetHeight) setEscondida(false)")
    expect(topBarVariants({})).toContain("max-md:data-hidden:-translate-y-")
  })

  it("tocar no título sobe ao topo, só no telefone", () => {
    expect(CODIGO).toContain('janela.matchMedia("(max-width: 767px)").matches')
    expect(CODIGO).toContain("scrollTo({ top: 0, behavior: suave })")
  })

  it("a busca escuta ⌘K e /, fora de campo de texto, e cala com listen={false}", () => {
    expect(CODIGO).toContain('slash && e.key === "/" && !isEditableTarget(e.target)')
    expect(CODIGO).toContain("if (!listen) return")
  })
})
