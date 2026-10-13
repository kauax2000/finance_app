import { createElement as h, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import {
  SHOWCASE_SLOTS,
  ShowcaseCaption,
  ShowcaseDots,
  ShowcaseFlight,
  ShowcaseHero,
  ShowcaseScatter,
  ShowcaseScatterItem,
  ShowcaseSkeleton,
  ShowcaseStage,
  ShowcaseSwap,
} from "./showcase"

/** O `Showcase`: o palco decorativo, os 12 lugares, os níveis, a paralaxe e as proibições. */

const CODIGO = semComentarios(lerFonte("src/components/ui/showcase.tsx"))
const DOC = lerFonte("src/app/designsystem/docs/showcase.tsx")

const palco = (...filhos: ReactNode[]) => renderToStaticMarkup(h(ShowcaseStage, null, ...filhos))

const tagDo = (html: string, slot: string) => html.match(new RegExp(`<[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ""
const classeDo = (html: string, slot: string) =>
  (tagDo(html, slot).match(/class="([^"]*)"/)?.[1] ?? "").replace(/&gt;/g, ">").replace(/&amp;/g, "&")

describe("ShowcaseStage", () => {
  it("é decorativo e opaco: inert, aria-hidden e data-opaque", () => {
    const tag = tagDo(palco(), "showcase-stage")
    expect(tag).toMatch(/\sinert=""/)
    expect(tag).toContain('aria-hidden="true"')
    expect(tag).toContain('data-opaque=""')
  })

  it("é o container showcase, com perspectiva, recorte e contexto próprio", () => {
    const classe = classeDo(palco(), "showcase-stage")
    for (const c of ["showcase-stage", "relative", "isolate", "overflow-clip", "perspective-distant"]) {
      expect(classe.split(" ")).toContain(c)
    }
  })

  it("a legenda levanta os lugares do pé por CSS", () => {
    expect(classeDo(palco(), "showcase-stage")).toContain("has-[[data-slot=showcase-caption]]:[--showcase-caption:1]")
  })
})

describe("SHOWCASE_SLOTS — os 12 lugares da seção 6", () => {
  const TABELA = [
    [84, 9, 6, "near", "top", "XS", false, 0],
    [6, 88, -7, "near", "start", "XS", false, 25],
    [92, 86, 4, "mid", "end", "XS", false, 50],
    [97, 40, -5, "far", "end", "S", false, 75],
    [2, 30, 5, "mid", "start", "S", false, 100],
    [50, 97, -2, "far", "bottom", "S", true, 125],
    [60, 4, -4, "mid", "top", "M", true, 150],
    [3, 62, -3, "far", "start", "M", false, 175],
    [98, 66, 7, "mid", "end", "M", false, 200],
    [30, 96, 3, "mid", "bottom", "L", true, 225],
    [76, 98, -6, "far", "bottom", "L", false, 250],
    [99, 14, -8, "far", "end", "L", false, 275],
  ] as const

  it("x, y, rot, profundidade, borda, nível, baixo e atraso, por extenso", () => {
    expect(SHOWCASE_SLOTS).toHaveLength(12)
    SHOWCASE_SLOTS.forEach((s, i) => {
      const [x, y, rot, depth, edge, level, short, delay] = TABELA[i]
      expect({ x: s.x, y: s.y, rot: s.rot, depth: s.depth, edge: s.edge, level: s.level, short: s.short, delay: s.delay }).toEqual({
        x, y, rot, depth, edge, level, short, delay,
      })
    })
  })

  it("só os lugares do pé sobem com a legenda: s5, s9 e s10", () => {
    expect(SHOWCASE_SLOTS.flatMap((s, i) => (s.caption ? [i] : []))).toEqual([5, 9, 10])
  })
})

describe("ShowcaseScatter e ShowcaseScatterItem", () => {
  const item = (slot: number) =>
    palco(
      h(ShowcaseScatter, { clear: "browser" }, h(ShowcaseScatterItem, { slot: slot as 0, itemKey: "a" }, h("p", null, "cartão")))
    )

  it("o afastamento por forma, incluindo o tablet", () => {
    const k = (clear: "browser" | "tablet" | "phone") =>
      tagDo(renderToStaticMarkup(h(ShowcaseScatter, { clear })), "showcase-scatter")
    expect(k("browser")).toMatch(/--clear-kx:1;--clear-ky:1\.12/)
    expect(k("tablet")).toMatch(/--clear-kx:1\.08;--clear-ky:1\.06/)
    expect(k("phone")).toMatch(/--clear-kx:1\.14;--clear-ky:1/)
  })

  it("o de fora publica a borda e a profundidade, entra no atraso do lugar e anda pelo afastamento", () => {
    const tag = tagDo(item(3), "showcase-scatter-item")
    expect(tag).toContain('data-edge="end"')
    expect(tag).toContain('data-depth="far"')
    expect(tag).toContain("--slot-delay:75ms")
    expect(tag).toMatch(/translate:calc\(\(var\(--slot-x\) - 50\) \* \(var\(--clear-kx, 1\) - 1\) \* 1cqw\)/)
    const classe = classeDo(item(3), "showcase-scatter-item")
    expect(classe).toContain("showcase-enter")
    expect(classe).toContain("transition-[translate]")
    expect(classe).toContain("delay-(--slot-delay)")
  })

  it("os níveis por container query: XS sempre, S a 28rem, M a 36rem, L a 48rem; o baixo esconde s5, s6 e s9", () => {
    expect(classeDo(item(0), "showcase-scatter-item")).toMatch(/(^|\s)block(\s|$)/)
    expect(classeDo(item(3), "showcase-scatter-item")).toContain("hidden @md/showcase:block")
    expect(classeDo(item(6), "showcase-scatter-item")).toContain("hidden @xl/showcase:block")
    expect(classeDo(item(9), "showcase-scatter-item")).toContain("hidden @3xl/showcase:block")
    for (const i of [5, 6, 9]) expect(classeDo(item(i), "showcase-scatter-item")).toContain("showcase-short:hidden")
    for (const i of [0, 1, 2, 3, 4, 7, 8, 10, 11]) expect(classeDo(item(i), "showcase-scatter-item")).not.toContain("showcase-short:hidden")
  })

  it("a profundidade é ordem e sombra: near em z-20, a sombra no cartão por [&>*]:", () => {
    expect(classeDo(item(0), "showcase-scatter-item")).toContain("z-20")
    expect(classeDo(item(3), "showcase-scatter-item")).toContain("z-0")
    expect(classeDo(item(0), "showcase-scatter-card")).toContain("[&>*]:shadow-lg")
    expect(classeDo(item(2), "showcase-scatter-card")).toContain("[&>*]:shadow-md")
    expect(classeDo(item(3), "showcase-scatter-card")).toContain("[&>*]:shadow-sm")
  })

  it("nada de escala, desfoque ou opacidade de profundidade nos invólucros", () => {
    for (let i = 0; i < 12; i++) {
      const html = item(i)
      for (const slot of ["showcase-scatter-item", "showcase-scatter-card"]) {
        expect(classeDo(html, slot)).not.toMatch(/(^|\s)(blur|opacity-|scale-|backdrop-blur)/)
      }
    }
  })

  it("a largura do cartão por nível: w-44, w-48 no S, w-56 do M em diante", () => {
    expect(classeDo(item(0), "showcase-scatter-card")).toContain("w-44 @md/showcase:w-48 @xl/showcase:w-56")
  })

  it("os lugares do pé sobem 6cqh com a legenda", () => {
    expect(tagDo(item(5), "showcase-scatter-item")).toContain("6cqh * var(--showcase-caption, 0)")
    expect(tagDo(item(0), "showcase-scatter-item")).not.toContain("6cqh")
  })
})

describe("ShowcaseHero", () => {
  it("o herói publica a forma nas três, e a moldura mora dentro dele", () => {
    for (const form of ["browser", "tablet", "phone"] as const) {
      const html = palco(h(ShowcaseHero, { form }, h("p", null, "tela")))
      expect(tagDo(html, "showcase-hero")).toContain(`data-form="${form}"`)
      expect(html).toContain('data-slot="device-frame"')
      expect(classeDo(html, "showcase-hero-point")).toContain("showcase-enter")
      expect(tagDo(html, "showcase-hero-point")).toContain("--slot-delay:120ms")
    }
  })
})

describe("ShowcaseFlight, ShowcaseSwap, ShowcaseDots, ShowcaseCaption e ShowcaseSkeleton", () => {
  it("o ponto ativo do primeiro quadro já nasce pousado; o fantasma não tem texto", () => {
    const html = palco(h(ShowcaseFlight, { layoutId: "busca", active: true }, "Buscar"))
    expect(tagDo(html, "showcase-flight")).toContain('data-landed="true"')
    expect(html).toMatch(/<div[^>]*data-slot="showcase-flight-ghost"[^>]*><\/div>/)
    expect(classeDo(html, "showcase-flight-ghost")).toContain("bg-popover")
  })

  it("o ponto inativo não desenha o fantasma e guarda o lugar transparente", () => {
    const html = palco(h(ShowcaseFlight, { layoutId: "busca", active: false }, "Buscar"))
    expect(html).not.toContain("showcase-flight-ghost")
    expect(classeDo(html, "showcase-flight-content")).toContain("opacity-0")
  })

  it("a troca publica o efeito", () => {
    expect(renderToStaticMarkup(h(ShowcaseSwap, { swapKey: "a", effect: "rise" }, "x"))).toContain('data-effect="rise"')
  })

  it("os capítulos: count pontos, o ativo com o preenchimento", () => {
    const html = renderToStaticMarkup(h(ShowcaseDots, { count: 3, active: 1, fill: 0.5 }))
    expect(html.match(/data-slot="showcase-dot"/g)).toHaveLength(3)
    expect(html).toMatch(/data-slot="showcase-dot" data-active="true"/)
    expect(html).toContain('data-slot="showcase-dot-fill"')
    expect(tagDo(html, "showcase-dots")).toContain('aria-hidden="true"')
  })

  it("a legenda: Card elevated no pé, à esquerda, texto sans, a descrição some no XS", () => {
    const html = palco(h(ShowcaseCaption, { title: "Seu mês num relance", description: "A mesma conta.", dots: h(ShowcaseDots, { count: 3, active: 0 }) }))
    expect(classeDo(html, "showcase-caption")).toMatch(/start-4 bottom-4/)
    expect(tagDo(html, "card")).toContain('data-variant="elevated"')
    expect(classeDo(html, "showcase-caption-title")).toContain("text-sm font-medium")
    expect(classeDo(html, "showcase-caption-description")).toContain("text-xs text-muted-foreground @max-md/showcase:hidden")
    expect(html).toContain('data-slot="showcase-dots"')
    expect(html).not.toMatch(/font-display|page-title|wordmark/)
  })

  it("o esqueleto: o herói em ossos no palco, anunciado", () => {
    const html = renderToStaticMarkup(h(ShowcaseSkeleton, { form: "phone" }))
    expect(html).toContain('role="status"')
    expect(tagDo(html, "showcase-hero")).toContain('data-form="phone"')
    expect(classeDo(html, "showcase-skeleton")).toContain("showcase-stage")
  })
})

describe("Showcase — o fonte", () => {
  it("o movimento: reducedMotion do sistema, LayoutGroup, presença sem quadro inicial", () => {
    expect(CODIGO).toContain('<MotionConfig reducedMotion="user">')
    expect(CODIGO).toContain("<LayoutGroup")
    expect(CODIGO).toContain('mode="popLayout" initial={false}')
    expect(CODIGO).toContain('layout="position"')
    expect(CODIGO).toContain("useInView(stageRef)")
  })

  it("a paralaxe: motion values numa mola, um deslocamento por plano, só cursor, nunca no document", () => {
    expect(CODIGO).toContain("useMotionValue(0)")
    expect(CODIGO).toMatch(/useSpring\(px, \{ stiffness: MOLA\.stiffness, damping: MOLA\.damping \}\)/)
    expect(CODIGO).toContain("useTransform(")
    expect(CODIGO).toMatch(/const PARALAXE: Record<Plano, number> = \{ far: 2, mid: 4, hero: 6, near: 8, float: 8 \}/)
    expect(CODIGO).toContain("ehCursor(e)")
    expect(CODIGO).toContain('matchMedia("(hover: hover)")')
    expect(CODIGO).toContain("deDedo(el)")
    expect(CODIGO).toContain("useReducedMotion()")
    expect(CODIGO).toMatch(/pai\.addEventListener\("pointermove"/)
    expect(CODIGO).not.toContain('document.addEventListener("pointermove"')
    expect(CODIGO).not.toMatch(/ownerDocument\.addEventListener|window\.addEventListener\("pointermove"/)
  })

  it("congela durante a troca de forma e não renderiza por evento", () => {
    expect(CODIGO).toMatch(/if \(!ehCursor\(e\) \|\| !emRepouso\.current\) return/)
    const mover = CODIGO.slice(CODIGO.indexOf("const mover"), CODIGO.indexOf("const sair"))
    expect(mover).not.toMatch(/set[A-Z]\w*\(/)
  })

  it("o cursor mede a âncora pelo lugar de layout, depois do repouso e a cada mudança de tamanho", () => {
    expect(CODIGO).toContain("[data-showcase-anchor=")
    expect(CODIGO).toContain("new ResizeObserver")
    expect(CODIGO).toMatch(/if \(!el \|\| !settled\) return/)
    expect(CODIGO).toContain("function caixaNoPalco(")
    expect(CODIGO).toContain("<PresenceCursor")
  })

  it("o cursor é dono da presença: open (padrão true), sai em 150ms e zera a espera ao fechar", () => {
    expect(CODIGO).toMatch(/click = false,\n  open = true,/)
    expect(CODIGO).toMatch(/if \(!open \|\| !active \|\| !medido\) return/)
    expect(CODIGO).toMatch(/clearTimeout\(t\)\n      setVisivel\(false\)/)
    expect(CODIGO).toMatch(/<AnimatePresence initial=\{false\}>\n      \{mostrar \?/)
  })

  it("o voo revela o pouso antes da cauda da mola, na mola do palco", () => {
    expect(CODIGO).toMatch(/REVELA_O_POUSO_MS = 450/)
    expect(CODIGO).toContain("transition={{ layout: MOLA_PALCO }}")
  })

  it("proíbe rAF, marca, desfoque e cor crua", () => {
    expect(CODIGO).not.toContain("requestAnimationFrame")
    expect(CODIGO).not.toContain('variant="brand"')
    expect(CODIGO).not.toMatch(/\bblur\b|backdrop-blur/)
    expect(CODIGO).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|oklch\(|hsl\(|\b(?:bg|text|fill|stroke)-(?:white|black|gray|zinc|neutral|slate|red|green|blue)-?/i)
  })

  it("a página do catálogo é um palco genérico: nada do app de acesso", () => {
    expect(DOC).not.toMatch(/components\/auth/)
  })

  it("a página só usa o que o componente oferece: nada de motion (camada do app)", () => {
    expect(DOC).not.toMatch(/from ["']motion/)
  })
})
