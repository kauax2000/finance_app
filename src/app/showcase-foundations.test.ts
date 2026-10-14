import { describe, expect, it } from "vitest"
import { MOLA_PALCO, MOLA_PALCO_LAYOUT, SAIDA } from "@/lib/spring"
import { blocoCss, lerFonte, semComentarios } from "@/test/fonte"
import { esperarDepoisDeNoScrollbar } from "@/test/regras"

// As fundações do palco do `Showcase` (tela de acesso): tokens, variante, escopo
// opaco, as utilities e as molas.
const CSS = semComentarios(lerFonte("src/app/globals.css"), "bloco")

describe("O cursor de texto desenhado", () => {
  it("`type-caret` é visível no estilo base e congela aceso sem movimento", () => {
    const caret = esperarDepoisDeNoScrollbar(CSS, "@utility type-caret {")
    const base = caret.slice(0, caret.indexOf("@media"))
    expect(base).toContain("background-color: var(--color-foreground)")
    expect(base).toContain("height: 1lh")
    expect(base).not.toMatch(/opacity:\s*0/)
    expect(base).not.toMatch(/visibility:\s*hidden/)
    expect(base).toMatch(/animation: type-caret-blink 1s steps\(1\) infinite;/)
    expect(caret).toMatch(/prefers-reduced-motion: reduce\) \{\s*animation: none;/)
  })

  it("`type-caret-blink` não segura quadro (sem `forwards`/`both`)", () => {
    const blink = esperarDepoisDeNoScrollbar(CSS, "@keyframes type-caret-blink {")
    expect(blink).toMatch(/50% \{\s*opacity: 0;\s*\}/)
    for (const uso of CSS.match(/animation:[^;]*type-caret-blink[^;]*;/g) ?? []) {
      expect(uso).not.toMatch(/\b(forwards|both)\b/)
    }
    expect(CSS).not.toMatch(/animation-fill-mode:\s*(forwards|both)[^}]*type-caret-blink/)
  })

  // `caret-blink` é do `tw-animate-css` (o cursor do `InputOTP`): redefinido aqui,
  // o build guarda um só e o outro cursor troca de ritmo sem aviso.
  it("não redefine o `caret-blink` do `tw-animate-css`", () => {
    expect(CSS).not.toMatch(/@keyframes\s+caret-blink\b/)
  })
})

describe("As utilities do palco", () => {
  it("moram depois de `no-scrollbar` e fora do bloco das sobreposições", () => {
    const cru = lerFonte("src/app/globals.css")
    const sobreposicoes = cru.indexOf("/* ── O movimento do que se sobrepõe à tela")
    for (const nome of ["type-caret", "showcase-enter", "showcase-stage", "showcase-ripple"]) {
      esperarDepoisDeNoScrollbar(CSS, `@utility ${nome} {`)
      expect(cru.indexOf(`@utility ${nome} {`), nome).toBeLessThan(sobreposicoes)
    }
  })

  it("`showcase-enter` reaproveita o `rise` único, no `--slot-delay`, sem atraso no movimento reduzido", () => {
    const entrada = blocoCss(CSS, "@utility showcase-enter {")
    expect(entrada).toMatch(/animation: rise /)
    expect(entrada).toContain("animation-delay: var(--slot-delay, 0s)")
    expect(entrada).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*animation-delay: 0s !important/)
    expect(CSS.match(/@keyframes rise \{/g)).toHaveLength(1)
  })

  it("`showcase-stage` declara o container e o tamanho das três formas por extenso", () => {
    const palco = blocoCss(CSS, "@utility showcase-stage {")
    expect(palco).toContain("container: showcase / size")
    for (const forma of ["browser", "tablet", "phone"]) {
      expect(palco, forma).toContain(`[data-slot="showcase-hero"][data-form="${forma}"]`)
    }
    expect(palco).toContain("width: min(86cqw, 140cqh)")
    expect(palco).toContain("width: min(92cqw, 140cqh)")
    expect(palco).toContain("height: min(72cqh, 120cqw)")
    expect(palco).toContain("height: min(66cqh, 120cqw)")
    expect(palco).toContain("height: min(72cqh, 160cqw)")
    expect(palco).toContain("height: min(70cqh, 160cqw)")
  })

  it("o palco estreito (< 24rem): navegador 6/5, tablet 2/3, celular centrado quando alto", () => {
    const palco = blocoCss(CSS, "@utility showcase-stage {")
    const estreitos = palco.split("@container showcase (width < 24rem) {").slice(1).map((b) => b.slice(0, b.indexOf("}")))
    expect(estreitos).toHaveLength(2)
    expect(estreitos[0]).toContain("aspect-ratio: 6 / 5")
    expect(estreitos[1]).toContain("height: min(72cqh, 135cqw)")
    expect(estreitos[1]).toContain("aspect-ratio: 2 / 3")
    // o celular só centra no estreito **e alto**: mais baixo, os cartões de cima e de baixo cairiam sobre ele
    expect(palco).toMatch(/@container showcase \(width < 24rem\) and \(height >= 56rem\) \{\s*margin-inline-end: 0;/)
  })

  it("`showcase-ripple` respira uma vez", () => {
    expect(CSS).toMatch(/@keyframes showcase-ripple \{\s*50% \{\s*scale: 1\.04;\s*\}\s*\}/)
    const respiro = blocoCss(CSS, "@utility showcase-ripple {")
    expect(respiro).not.toContain("infinite")
  })

  it("nenhum `animate-[…]` para o palco", () => {
    expect(CSS).not.toMatch(/animate-\[[^\]]*(caret|showcase)/)
  })
})

describe("Tokens, variante e escopo opaco", () => {
  it("`--device-bezel` e `--device-bezel-edge` têm par no `.dark`", () => {
    const claro = blocoCss(CSS, ":root,\n.light {", "\n}")
    const escuro = blocoCss(CSS, ".dark {", "\n}")
    for (const token of ["--device-bezel:", "--device-bezel-edge:"]) {
      expect(claro, token).toContain(token)
      expect(escuro, token).toContain(token)
    }
  })

  it("a variante `showcase-short` pergunta à altura do container `showcase`", () => {
    expect(CSS).toContain("@custom-variant showcase-short (@container showcase (height < 44rem));")
  })

  it("`reduced-transparency` e `glass-surface` ganham o ramo `[data-opaque]`", () => {
    const variante = blocoCss(CSS, "@custom-variant reduced-transparency {")
    expect(variante).toMatch(/&:is\(\[data-opaque\]\[data-opaque\] \*\) \{\s*@slot;/)
    expect(variante).toContain("prefers-reduced-transparency: reduce")
    const vidro = blocoCss(CSS, "@utility glass-surface {")
    expect(vidro).toMatch(
      /&:is\(\[data-opaque\]\[data-opaque\] \*\) \{\s*backdrop-filter: none;\s*-webkit-backdrop-filter: none;/
    )
  })
})

describe("As molas do palco", () => {
  it("`MOLA_PALCO` e `SAIDA` (espelho de `--ease-in-out`)", () => {
    expect(MOLA_PALCO).toEqual({ type: "spring", stiffness: 220, damping: 30 })
    // Na projeção (0 a 1000) o repouso não espera a cauda subpixel: a moldura assenta aos ~610ms, e não aos ~800.
    expect(MOLA_PALCO_LAYOUT).toEqual({ ...MOLA_PALCO, restSpeed: 20, restDelta: 2 })
    expect(SAIDA).toEqual({ duration: 0.15, ease: [0.65, 0, 0.35, 1] })
    expect(CSS).toContain("--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)")
  })
})
