import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { blocoCss, lerFonte, semComentarios } from "@/test/fonte"

import { Seal, SealSkeleton } from "./seal"

/** O `Seal`: o botão com nome, o metal por tom, o anel, a exceção do arco-íris e as proibições. */

const CODIGO = semComentarios(lerFonte("src/components/ui/seal.tsx"))
const CSS = lerFonte("src/app/globals.css")

const selo = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    h(Seal, { label: "Membro desde março de 2026", ring: "MEMBRO DESDE · MAR 2026 · ", ...props } as never)
  )

const classeDo = (html: string, slot: string) => {
  const tag = html.match(new RegExp(`<[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ""
  return tag.match(/class="([^"]*)"/)?.[1] ?? ""
}

describe("Seal", () => {
  it("é um botão de 40 com o nome acessível, que abre um diálogo", () => {
    const html = selo()
    expect(html).toMatch(/<button[^>]*type="button"[^>]*aria-label="Membro desde março de 2026"/)
    expect(html).toContain('aria-haspopup="dialog"')
    expect(classeDo(html, "seal")).toMatch(/(^|\s)size-10(\s|$)/)
  })

  it("o alvo de toque cresce pelo ::after, sem mudar o desenho", () => {
    const c = classeDo(selo(), "seal")
    expect(c).toContain("after:absolute")
    expect(c).toContain("pointer-coarse:after:-inset-1")
  })

  it("o metal é a utility do tom, por extenso, e silver é o padrão", () => {
    expect(classeDo(selo(), "seal-disc")).toMatch(/(^|\s)seal-silver(\s|$)/)
    expect(classeDo(selo({ tone: "gold" }), "seal-disc")).toMatch(/(^|\s)seal-gold(\s|$)/)
    expect(selo({ tone: "gold" })).toContain('data-tone="gold"')
  })

  it("o anel grava o texto numa volta, e o ícone mora no miolo", () => {
    const html = selo({ icon: h("svg", { "data-x": "logo" }) })
    expect(html).toContain("MEMBRO DESDE · MAR 2026 · ")
    expect(html).toMatch(/<textPath[^>]*textLength="238"/)
    expect(html).toMatch(/data-slot="seal-icon"[^>]*>.*data-x="logo"/)
    expect(selo()).not.toContain('data-slot="seal-icon"')
  })

  it("parado, balança", () => {
    expect(classeDo(selo(), "seal-disc")).toMatch(/(^|\s)seal-sway(\s|$)/)
  })

  it("o esqueleto é o círculo de 40", () => {
    const html = renderToStaticMarkup(h(SealSkeleton))
    expect(html).toContain('data-shape="circle"')
    expect(html).toMatch(/size-10/)
  })
})

describe("Seal — o fonte e o CSS", () => {
  it("o ponteiro escreve variáveis, sem render por evento, e só o cursor inclina", () => {
    expect(CODIGO).toContain("ehCursor(e)")
    expect(CODIGO).toMatch(/style\.setProperty\("--seal-ry"/)
    expect(CODIGO).not.toContain("requestAnimationFrame")
    expect(CODIGO).not.toContain("document.addEventListener")
  })

  it("o giroscópio pede permissão no toque e escuta só com o selo aberto", () => {
    expect(CODIGO).toMatch(/onClick=\{pedirGiroscopio\}/)
    expect(CODIGO).toContain('addEventListener("deviceorientation"')
    expect(CODIGO).toMatch(/useGiroscopio\(grandeRef, aberto\)/)
  })

  it("a volta não roda com movimento reduzido, e o balanço tem o bloco do reduzido", () => {
    expect(CODIGO).toMatch(/if \(!el \|\| reduzido\) return/)
    expect(blocoCss(CSS, "@utility seal-sway")).toContain("prefers-reduced-motion: reduce")
  })

  it("o holográfico usa as paradas da marca, com o volume num token e a máscara no ponteiro", () => {
    const holo = blocoCss(CSS, "@utility seal-holo")
    expect(holo).toContain("--seal-holo-opacity")
    expect(holo).toMatch(/var\(--brand-magenta\)/)
    expect(holo).toMatch(/mask-image: radial-gradient\(circle at var\(--seal-x/)
  })

  it("as utilities do selo moram depois de no-scrollbar", () => {
    const fim = CSS.indexOf("@utility no-scrollbar")
    for (const u of ["seal-silver", "seal-gold", "seal-metal", "seal-holo", "seal-glare", "seal-sway"]) {
      expect(CSS.indexOf(`@utility ${u}`), u).toBeGreaterThan(fim)
    }
  })

  it("proíbe cor crua e classe montada no componente", () => {
    expect(CODIGO).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|oklch\(|hsl\(|\b(?:bg|text|ring|fill|stroke)-(?:white|black|gray|zinc|neutral|slate)/i)
    expect(CODIGO).not.toMatch(/seal-\$\{/)
  })
})
