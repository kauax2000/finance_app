import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import { Popover, PopoverHeader, PopoverTitle, popoverContentVariants } from "./popover"

/** As versões do `Popover`. */

const CODIGO = lerFonte("src/components/ui/popover.tsx")

describe("as versões do Popover", () => {
  it("a largura é uma escada, com md de padrão e a do gatilho", () => {
    expect(popoverContentVariants({})).toContain("w-72")
    expect(popoverContentVariants({ size: "sm" })).toContain("w-56")
    expect(popoverContentVariants({ size: "lg" })).toContain("w-88")
    expect(popoverContentVariants({ size: "trigger" })).toContain("w-(--radix-popover-trigger-width)")
    expect(popoverContentVariants({ size: "auto" })).toContain("w-auto")
  })

  it("o movimento é um eixo: brota do gatilho, desdobra do campo, ou nenhum", () => {
    expect(popoverContentVariants({})).toContain("popover-sprout")
    expect(popoverContentVariants({ motion: "field" })).toContain("field-bloom")
    const nenhum = popoverContentVariants({ motion: "none" })
    expect(nenhum).not.toMatch(/popover-sprout|field-bloom|animate-in/)
  })

  it("o × do cabeçalho fica preso ao topo do título", () => {
    const html = renderToStaticMarkup(
      h(Popover, null, h(PopoverHeader, { closeButton: true }, h(PopoverTitle, null, "Total")))
    )
    expect(html).toContain('data-slot="popover-header-close"')
    expect(html).toContain('aria-label="Fechar"')
    expect(html).toContain("grid-cols-[minmax(0,1fr)_auto] items-start")
  })

  it("a seta espelha a tinta da placa", () => {
    expect(CODIGO).toMatch(/function PopoverArrow[\s\S]*?fill-popover\/85 supports-backdrop-filter:fill-popover\/60 reduced-transparency:fill-popover/)
  })

  it("a confirmação curta é alertdialog, trava com a Promise e fecha ao assentar", () => {
    expect(CODIGO).toMatch(/function PopoverConfirm[\s\S]*?role="alertdialog"/)
    expect(CODIGO).toMatch(/setPendente\(true\);\s*void \(r as Promise<unknown>\)\.finally\(\(\) => \{\s*setPendente\(false\);\s*fechar\(\);/)
    expect(CODIGO).toMatch(/<Button type="button" variant="tertiary" size="sm" disabled=\{pendente\}>/)
  })

  it("na moldura do catálogo, o portal vai à janela dela — senão o clique lá dentro não fecha", () => {
    expect(CODIGO).toContain("const janela = useViewportWindow();")
    expect(CODIGO).toContain("<PopoverPrimitive.Portal container={janela?.document.body}>")
  })

  it("no telefone, a gaveta: o gatilho, o fechar e o título passam a ser dela", () => {
    expect(CODIGO).toContain('const folha = mobile === "sheet" && isMobile;')
    expect(CODIGO).toContain('if (folha) return <DrawerTrigger data-slot="popover-trigger" {...props} />;')
    expect(CODIGO).toMatch(/if \(folha\) \{\s*return \(\s*<DialogTitle/)
  })

  it("o nome: label vira título sr-only, e sem nome há aviso em desenvolvimento", () => {
    expect(CODIGO).toContain('<PopoverTitle className="sr-only">{label}</PopoverTitle>')
    expect(CODIGO).toContain("PopoverContent sem nome")
    // Filho do Content (fechado não monta) e o título pelo DOM, não pelo estado.
    expect(CODIGO).toMatch(/\{children\}\s*<\/div>\s*\{process\.env\.NODE_ENV !== "production" &&[\s\S]*?<PopoverNameWarning/)
    expect(CODIGO).toContain(".getElementById(titleId)")
  })

  it("as telas: sem largura nem rolagem à mão, e os seletores de mês com nome", () => {
    const filtros = lerFonte("src/components/transactions/transactions-filters-panel.tsx")
    expect(filtros).toContain('size="trigger"')
    expect(filtros).not.toContain("w-[var(--radix-popover-trigger-width)]")
    expect(lerFonte("src/components/categories/categories-toolbar.tsx")).toContain('label="Escolher mês"')
    const calendario = lerFonte("src/components/dashboard/dashboard-payments-calendar.tsx")
    expect(calendario).toContain("<PopoverArrow")
    expect(calendario).not.toContain("w-[min(calc(100vw-2rem),18rem)]")
  })

  it("a página não afirma que o surface none tem consumidor", () => {
    const doc = lerFonte("src/app/designsystem/docs/popover.tsx")
    expect(doc).not.toContain("como a pilha do Command no Combobox.")
  })

  it("a casca não rola: quem rola é o viewport, e a seta fica fora do recorte", () => {
    // A seta é um span absoluto fora da caixa, contido pela casca; se a casca
    // rola, ela cai no próprio recorte (6px de rolagem em repouso, seta sumida).
    for (const padding of ["default", "none"] as const) {
      expect(popoverContentVariants({ padding })).not.toMatch(/overflow-(y-)?(auto|scroll|visible)/)
      expect(popoverContentVariants({ padding })).not.toMatch(/(^| )p-/)
    }
    expect(popoverContentVariants({})).toContain("[--popover-pad:--spacing(2.5)]")
    expect(popoverContentVariants({ padding: "none" })).toContain("[--popover-pad:0px]")
    const viewport = CODIGO.match(/const popoverViewportClassName = cn\(([\s\S]*?)\);/)?.[1] ?? ""
    expect(viewport).toContain("overflow-y-auto")
    expect(viewport).toContain("[gap:inherit] p-(--popover-pad)")
    expect(viewport).toContain("has-[[data-slot=popover-body]]:overflow-hidden")
    // Posicionado ou transformado, ele viraria o bloco que contém a seta.
    expect(viewport).not.toMatch(/\b(relative|absolute|transform|translate|filter|backdrop)/)
    expect(CODIGO).toMatch(/data-slot="popover-viewport" className=\{popoverViewportClassName\}>[\s\S]*?\{children\}\s*<\/div>/)
  })
})
