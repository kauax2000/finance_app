import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import {
  HoverCard,
  HoverCardHeader,
  HoverCardLink,
  HoverCardSkeleton,
  HoverCardTitle,
  HoverCardTrigger,
} from "./hover-card"

/** A rodada 217: as versões novas do `HoverCard`. */

const CODIGO = lerFonte("src/components/ui/hover-card.tsx")
const TABELA = lerFonte("src/components/transactions/transactions-table.tsx")

describe("as versões do HoverCard", () => {
  it("o cabeçalho põe o avatar antes do par, centrado, e o par continua sem gap", () => {
    const html = renderToStaticMarkup(
      h(HoverCardHeader, { media: h("i", null, "AR") }, h(HoverCardTitle, null, "Ana"))
    )
    expect(html.indexOf("hover-card-header-media")).toBeLessThan(html.indexOf("Ana"))
    expect(html).toContain("grid-cols-[auto_minmax(0,1fr)]")
    expect(html).toContain('class="flex min-w-0 flex-col"')
  })

  it("o gatilho no texto é um botão focável, pontilhado", () => {
    const html = renderToStaticMarkup(h(HoverCard, null, h(HoverCardTrigger, { variant: "inline" }, "Ana")))
    expect(html).toMatch(/<button type="button"[^>]*decoration-dotted/)
  })

  it("o link de ver mais é um link pequeno, à direita", () => {
    const html = renderToStaticMarkup(h(HoverCardLink, null, "Ver fatura"))
    expect(html).toContain('data-variant="link"')
    expect(html).toContain("ms-auto")
  })

  it("o esqueleto anuncia que carrega, e o conteúdo pendente o mostra", () => {
    const html = renderToStaticMarkup(h(HoverCardSkeleton))
    expect(html).toContain('role="status"')
    expect(html).toContain("Carregando prévia")
    expect(CODIGO).toContain("{pending ? <HoverCardSkeleton /> : children}")
  })

  it("o grupo zera o atraso enquanto há uma aberta, e esfria depois", () => {
    expect(CODIGO).toContain("openDelay={grupo?.aquecido ? 0 : openDelay}")
    expect(CODIGO).toMatch(/if \(abertasRef\.current > 0\) return/)
    // O Radix pede `false` de novo para uma que já fechou: conta a transição.
    expect(CODIGO).toContain("if (proximo !== abertaRef.current) {")
  })

  it("no toque, segurar abre, o clique do soltar é engolido e o contextmenu para no gatilho", () => {
    expect(CODIGO).toMatch(/e\.pointerType !== "touch"\) return[\s\S]*?}, 500\)/)
    expect(CODIGO).toMatch(/onClickCapture: [\s\S]*?if \(abriuNoToqueRef\.current\) \{[\s\S]*?e\.preventDefault\(\)\s*e\.stopPropagation\(\)/)
    expect(CODIGO).toMatch(/onContextMenu: [\s\S]*?ultimoToqueRef\.current\) \{\s*e\.preventDefault\(\)/)
  })

  it("a prévia se desvela e sai dissolvendo no lugar (rodada 248)", () => {
    expect(CODIGO).toContain('"hover-card-unveil"')
    expect(CODIGO).not.toContain("data-open:zoom-in-90")
  })

  it("a lista de lançamentos: os chips viram prévia, e o clique continua indo à linha", () => {
    expect(TABELA).toContain("<HoverCardGroup>")
    expect(TABELA).toMatch(/function CreditInvoiceChip[\s\S]*?<HoverCardLink/)
    expect(TABELA).toMatch(/function InstallmentChip[\s\S]*?<HoverCardContent/)
    // O chip não engole o clique: a linha abre o detalhe, como antes.
    const chip = TABELA.slice(TABELA.indexOf("function CreditInvoiceChip"), TABELA.indexOf("<HoverCardContent", TABELA.indexOf("function CreditInvoiceChip")))
    expect(chip).not.toContain("onClick=")
  })

  it("os comentários não contam o que deixou de ser verdade", () => {
    expect(CODIGO).not.toContain("(O `space-y-1` de lá está no backlog.)")
    expect(CODIGO).not.toContain("No telefone este componente não acontece.")
  })
})
