import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { HomeIcon, CreditCardIcon } from "@heroicons/react/20/solid"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import { DeviceFrame, DeviceFrameSkeleton, useDeviceFrame } from "./device-frame"

/** O `DeviceFrame`: as peças de cada forma, as proibições e as exigências do palco. */

const CODIGO = semComentarios(lerFonte("src/components/ui/device-frame.tsx"))

const NAV = [{ icon: HomeIcon, active: true }, { icon: CreditCardIcon }]

const moldura = (props: Record<string, unknown>, ...filhos: unknown[]) =>
  renderToStaticMarkup(h(DeviceFrame, props as never, ...(filhos as never[])))

/** O trecho do `className` do elemento que leva o `data-slot`. */
const classeDo = (html: string, slot: string) => {
  const tag = html.match(new RegExp(`<[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ""
  return tag.match(/class="([^"]*)"/)?.[1] ?? ""
}

describe("DeviceFrame", () => {
  it("publica data-form nas três formas, na moldura e na tela", () => {
    for (const form of ["browser", "tablet", "phone"]) {
      const html = moldura({ form })
      expect(html).toMatch(new RegExp(`data-slot="device-frame"[^>]*data-form="${form}"|data-form="${form}"[^>]*data-slot="device-frame"`))
      expect(html).toMatch(new RegExp(`data-slot="device-frame-screen"[^>]*data-form="${form}"|data-form="${form}"[^>]*data-slot="device-frame-screen"`))
    }
  })

  it("navegador: barra com três bolinhas neutras e o endereço como breadcrumb, sem barra de status", () => {
    const html = moldura({ form: "browser", url: "Finance › Painel" })
    expect(html.match(/data-slot="device-frame-dot"/g)).toHaveLength(3)
    expect(classeDo(html, "device-frame-dot")).toContain("bg-foreground/15")
    expect(classeDo(html, "device-frame-bar")).toMatch(/\bbg-muted\b.*\btext-muted-foreground\b/)
    expect(html).toMatch(/data-slot="device-frame-island"[^>]*data-state="url"/)
    expect(html).toContain("Finance › Painel")
    expect(html).not.toContain('data-slot="device-frame-status"')
  })

  it("sem url, o navegador não desenha a barra de endereço", () => {
    expect(moldura({ form: "browser" })).not.toContain('data-slot="device-frame-island"')
  })

  it("celular: barra de status com a hora, sinal, wi-fi e bateria, e a ilha", () => {
    const html = moldura({ form: "phone", url: "Finance › Painel" })
    expect(html).toContain('data-slot="device-frame-status"')
    expect(html).toContain("9:41")
    expect(html.match(/<svg/g)?.length).toBeGreaterThanOrEqual(3)
    expect(html).toMatch(/data-slot="device-frame-island"[^>]*data-state="island"/)
    expect(html).not.toContain('data-slot="device-frame-bar"')
  })

  it("tablet: barra de status fina com a hora e a bateria, sem endereço nem ilha", () => {
    const html = moldura({ form: "tablet", url: "Finance › Painel" })
    expect(html).toContain("9:41")
    expect(classeDo(html, "device-frame-status")).toContain("h-6")
    expect(html).not.toContain('data-slot="device-frame-island"')
    expect(html).not.toContain('data-slot="device-frame-bar"')
  })

  it("a navegação é trilho no navegador e no tablet e barra de abas no celular", () => {
    expect(moldura({ form: "browser", nav: NAV })).toMatch(/data-slot="device-frame-nav"[^>]*data-orientation="vertical"/)
    expect(moldura({ form: "tablet", nav: NAV })).toMatch(/data-slot="device-frame-nav"[^>]*data-orientation="vertical"/)
    const celular = moldura({ form: "phone", nav: NAV })
    expect(celular).toMatch(/data-slot="device-frame-nav"[^>]*data-orientation="horizontal"/)
    expect(celular.match(/data-slot="device-frame-nav-item"/g)).toHaveLength(2)
    expect(celular).toMatch(/data-slot="device-frame-nav-item"[^>]*data-active="true"/)
    // O trilho estreito do tablet.
    expect(classeDo(moldura({ form: "tablet", nav: NAV }), "device-frame-nav")).toContain("w-10")
  })

  it("o aviso: a ilha vira cartão no celular; no navegador, um cartão no canto da tela", () => {
    const aviso = h("p", null, "Seu código de acesso chegou")
    const celular = moldura({ form: "phone", notification: aviso })
    expect(celular).toMatch(/data-slot="device-frame-island"[^>]*data-state="card"/)
    expect(celular).toContain("Seu código de acesso chegou")
    const navegador = moldura({ form: "browser", notification: aviso })
    expect(classeDo(navegador, "device-frame-notification")).toMatch(/end-3 top-3/)
    expect(classeDo(navegador, "device-frame-notification")).toContain("bg-card")
  })

  it("a tela é a superfície com a própria tinta, concêntrica e um container", () => {
    const tela = classeDo(moldura({ form: "phone" }), "device-frame-screen")
    for (const c of ["bg-background", "text-foreground", "concentric", "@container/screen"]) expect(tela).toContain(c)
  })

  it("moldura de celular e tablet no token do aparelho, com o fio", () => {
    for (const form of ["phone", "tablet"]) {
      const quadro = classeDo(moldura({ form }), "device-frame")
      expect(quadro).toContain("bg-(--device-bezel)")
      expect(quadro).toContain("ring-(--device-bezel-edge)")
    }
  })

  it("dentro do herói do palco a moldura o preenche; fora, tem tamanho próprio", () => {
    const quadro = classeDo(moldura({ form: "browser" }), "device-frame")
    expect(quadro).toContain("in-data-[slot=showcase-hero]:size-full")
    expect(quadro).toContain("max-w-xl")
    expect(quadro).toContain("aspect-16/10")
    expect(classeDo(moldura({ form: "phone" }), "device-frame")).toContain("aspect-18/39")
    expect(classeDo(moldura({ form: "tablet" }), "device-frame")).toContain("aspect-3/4")
  })

  it("as sondas de raio: rounded-surface, rounded-modal e concentric, escondidas", () => {
    const html = moldura({ form: "browser" })
    for (const c of ["rounded-surface", "rounded-modal", "concentric"]) {
      expect(html).toMatch(new RegExp(`<span hidden=""[^>]*data-slot="device-frame-probe"[^>]*class="${c}"`))
    }
  })

  it("useDeviceFrame lê a forma, e fora de uma moldura lança", () => {
    const Leitor = () => h("i", null, useDeviceFrame().form)
    expect(moldura({ form: "tablet" }, h(Leitor))).toContain("<i>tablet</i>")
    expect(() => renderToStaticMarkup(h(Leitor))).toThrow(/dentro de um DeviceFrame/)
  })

  it("o esqueleto veste a caixa da forma e espera num SkeletonGroup", () => {
    const html = renderToStaticMarkup(h(DeviceFrameSkeleton, { form: "phone" }))
    expect(html).toContain('role="status"')
    expect(html).toMatch(/data-slot="device-frame-skeleton"[^>]*data-form="phone"/)
    expect(renderToStaticMarkup(h(DeviceFrameSkeleton, { form: "tablet", group: false }))).not.toContain('role="status"')
  })
})

describe("DeviceFrame — o fonte", () => {
  it("proíbe imagem, rAF, raio em número e scale()", () => {
    expect(CODIGO).not.toMatch(/<img\b/)
    expect(CODIGO).not.toContain("next/image")
    expect(CODIGO).not.toContain("requestAnimationFrame")
    expect(CODIGO).not.toMatch(/\brounded-(?:[tblrse]{1,2}-)?\[(?!inherit\])/)
    expect(CODIGO).not.toMatch(/borderRadius:\s*["'`]?\d/)
    expect(CODIGO).not.toMatch(/\bscale\(|\bscale-\d/)
  })

  it("o raio sai das sondas por getComputedStyle e vai a style.borderRadius, animado", () => {
    expect(CODIGO).toContain("getComputedStyle(el).borderTopLeftRadius")
    expect(CODIGO).toMatch(/style=\{\{ borderRadius: raio, rotateY: giro \}\}/)
    expect(CODIGO).toMatch(/animate\(raio, alvo, MOLA_PALCO\)/)
  })

  it("o giro é uma curva de três quadros sobre um motion value, e só na troca", () => {
    expect(CODIGO).toContain("useMotionValue(0)")
    expect(CODIGO).toMatch(/animate\(giro, \[0, -6 \* turn, 0\], \{ duration: 0\.65, ease: "easeInOut" \}\)/)
    // O motion 13 recusa mola com três quadros.
    expect(CODIGO).not.toMatch(/animate\(giro[^)]*type: "spring"/)
  })

  it("a troca acaba pelo giro mesmo quando a caixa não muda, uma vez só", () => {
    // O motion só chama onLayoutAnimationComplete quando a projeção anima; o giro termina sempre.
    expect(CODIGO).toMatch(/animate\(giro, [^\n]*\)\.then\(\(\) => encerrarTroca\(id\)\)/)
    expect(CODIGO).toMatch(/onLayoutAnimationComplete=\{\(\) => encerrarTroca\(voo\.current\)\}/)
    // Idempotente: o primeiro sinal zera o voo, e o sinal de uma troca velha não encerra a nova.
    expect(CODIGO).toMatch(/if \(!id \|\| id !== voo\.current\) return\s*voo\.current = 0/)
  })

  it("movimento reduzido: layout e giro pulam", () => {
    expect(CODIGO).toContain("useReducedMotion()")
    expect(CODIGO).toMatch(/reduced \? INSTANTANEO : MOLA_PALCO/)
  })

  it("will-change só no voo, e o layoutId é interno", () => {
    expect(CODIGO).toMatch(/emTroca && "will-change-transform"/)
    expect(CODIGO).toContain("React.useId()")
    expect(CODIGO).toMatch(/layoutId=\{`\$\{uid\}-nav-\$\{i\}`\}/)
    expect(CODIGO).toMatch(/layoutId=\{`\$\{uid\}-island`\}/)
  })

  it("toda superfície desenhada declara a tinta", () => {
    expect(CODIGO).toContain("bg-background text-foreground")
    expect(CODIGO).toContain("bg-muted px-3 text-muted-foreground")
    expect(CODIGO).toMatch(/"relative bg-card p-3 text-foreground"/)
    expect(CODIGO).toMatch(/justify-between text-foreground/)
  })

  it("nenhuma cor crua", () => {
    expect(CODIGO).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|oklch\(|\b(?:bg|text|ring)-(?:white|black|gray|zinc|neutral|slate)-?/i)
  })
})
