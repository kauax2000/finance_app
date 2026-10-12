import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselMore,
  CarouselProgress,
  CarouselSkeleton,
  CarouselStatus,
  carouselEffectClasses,
  carouselUntilTrack,
} from "./carousel"

/** A rodada 205: as versões novas do `Carousel`. */

const carrossel = (props: Record<string, unknown>, ...filhos: React.ReactNode[]) =>
  renderToStaticMarkup(h(Carousel, { "aria-label": "Teste", ...props }, ...filhos))
const itens = (n: number) =>
  h(CarouselContent, null, ...Array.from({ length: n }, (_, i) => h(CarouselItem, { key: i }, `item ${i}`)))

describe("as versões do Carousel", () => {
  it("until vira grade a partir do degrau, com a calha do gap, e esconde os controles", () => {
    const html = carrossel({ until: "md" }, itens(3), h(CarouselDots), h(CarouselStatus))
    expect(html).toContain('data-until="md"')
    expect(html).toContain("md:grid")
    expect(html).toContain("md:gap-4")
    expect(html).toContain("md:pl-0")
    expect(html).toMatch(/data-slot="carousel-status"[^>]*group-data-\[until=md\]\/carousel:md:hidden/)
    // Literal por degrau e por calha: classe montada não chega à folha.
    for (const degrau of Object.values(carouselUntilTrack)) {
      expect(Object.values(degrau).every((c) => /(md|lg):grid /.test(c))).toBe(true)
    }
  })

  it("fade é efeito com utility própria e força a calha zero", () => {
    expect(carouselEffectClasses.fade).toBe("carousel-effect-fade")
    const html = carrossel({ effect: "fade", gap: "lg" }, itens(2))
    expect(html).not.toContain("-ml-6")
    expect(html).toContain("carousel-effect-fade")
    const css = lerFonte("src/app/globals.css")
    expect(css).toMatch(/@utility carousel-effect-fade \{[\s\S]*?translate: calc\(var\(--carousel-slide-s, 0\) \* -100%\) 0;/)
    expect(css).toMatch(/carousel-effect-fade[\s\S]*?:not\(\[data-selected\]\) \{\s*pointer-events: none;/)
  })

  it("snap free liga o dragFree; a roda e o clique no item cortado são padrão", () => {
    expect(carrossel({ snap: "free" }, itens(2))).toContain('data-snap="free"')
    const codigo = lerFonte("src/components/ui/carousel.tsx")
    expect(codigo).toContain('...(snap === "free" && { dragFree: true })')
    expect(codigo).toContain("selectOnClick = true")
    expect(codigo).toContain("wheel = true")
    // O ouvinte nativo, não passivo: o onWheel do React não pode cancelar o gesto.
    expect(codigo).toContain('addEventListener("wheel", aoRolar, { passive: false })')
    expect(codigo).toContain("onClickCapture={trazerParaVista}")
  })

  it("a barra de progresso é decorativa e começa invisível sem medida", () => {
    const html = carrossel({}, itens(3), h(CarouselProgress))
    expect(html).toMatch(/data-slot="carousel-progress"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-slot="carousel-progress"/)
    expect(html).toContain("data-empty:invisible")
  })

  it("a contagem sobre a foto é a pílula de vidro", () => {
    const html = carrossel({}, itens(3), h(CarouselStatus, { placement: "overlay" }))
    expect(html).toMatch(/data-slot="carousel-status"[^>]*data-placement="overlay"/)
    expect(html).toContain("rounded-full")
  })

  it("CarouselMore é um item, e o link recebe a superfície do lugar vazio", () => {
    const html = carrossel(
      {},
      h(CarouselContent, null, h(CarouselItem, { key: 0 }, "a"), h(CarouselMore, { key: 1, count: 12, children: h("a", { href: "/x" }, "Ver todos") }))
    )
    expect(html).toMatch(/<a[^>]*data-slot="carousel-more"[^>]*href="\/x"|<a[^>]*href="\/x"[^>]*data-slot="carousel-more"/)
    expect(html).toContain("border-dashed")
    expect(html).toContain("12 no total")
    expect(html).toContain('aria-label="2 de 2"')
  })

  it("o esqueleto anuncia uma vez e tem o basis do item", () => {
    const html = renderToStaticMarkup(h(CarouselSkeleton, { count: 2, itemClassName: "basis-1/2" }))
    expect(html).toContain('role="status"')
    expect((html.match(/basis-1\/2/g) ?? []).length).toBe(2)
  })

  it("a tela cheia é opaca nos dois temas e devolve o índice", () => {
    const codigo = lerFonte("src/components/ui/carousel.tsx")
    expect(codigo).toMatch(/data-slot="carousel-fullscreen"[\s\S]*?bg-background[\s\S]*?dark:bg-background"/)
    expect(codigo).toContain("principal?.scrollTo(interna.selectedScrollSnap(), true)")
  })
})
