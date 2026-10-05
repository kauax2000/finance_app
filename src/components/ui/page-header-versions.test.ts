import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { pageHeaderVariants } from "./page-header"

/** A rodada 232: o redesenho, as peças e os comportamentos do `PageHeader`. */

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")
const CODIGO = fonte("src/components/ui/page-header.tsx")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "")
const CSS = fonte("src/app/globals.css")

describe("o redesenho", () => {
  it("sem régua por padrão, e a cascata ligada", () => {
    const padrao = pageHeaderVariants({})
    expect(padrao).not.toMatch(/(?:^|\s)border-b(?:\s|$)/)
    expect(padrao).toContain("page-header-reveal")
    expect(pageHeaderVariants({ reveal: false })).not.toContain("page-header-reveal")
  })

  it("no telefone a grade continua com duas colunas, e cada degrau desce um", () => {
    expect(pageHeaderVariants({})).toContain("grid-cols-[minmax(0,1fr)_auto]")
    expect(pageHeaderVariants({})).not.toContain("sm:grid-cols-")
    // O md do telefone é o que o sm tinha: 20px.
    expect(pageHeaderVariants({ size: "md" })).toContain("[--page-title:1.25rem]")
  })

  it("as ações de ícone ficam quadradas no telefone, com o rótulo como nome", () => {
    expect(CODIGO).toContain("max-sm:[&>[data-slot=button]:has(>svg)]:aspect-square")
    expect(CODIGO).toContain("max-sm:[&>[data-slot=button]:has(>svg)>[data-slot=button-label]]:sr-only")
  })

  it("o adorno desce para baixo da descrição no telefone", () => {
    expect(CODIGO).toContain('className="mt-2 flex sm:hidden"')
    expect(CODIGO).toMatch(/flex h-\(--page-title-line\) shrink-0 items-center self-start max-sm:hidden/)
  })

  it("a linha do título é o eixo: com sobrancelha, quem se alinha a ela desce junto", () => {
    expect(CODIGO).toContain("has-[[data-slot=page-header-eyebrow]]:[--page-header-lead:1.75rem]")
    // O voltar, a mídia, o adorno e as ações leem o deslocamento.
    expect(CODIGO.split("mt-[var(--page-header-lead,0px)]").length - 1).toBeGreaterThanOrEqual(4)
    // A mídia se centra na linha do título, e não no bloco.
    expect(CODIGO).not.toContain('"-me-1 flex shrink-0 self-center"')
  })

  it("o selo mora ao lado do título, por uma grade densa, e desce no telefone", () => {
    expect(CODIGO).toContain("grid-flow-row-dense grid-cols-[minmax(0,max-content)_auto_minmax(0,1fr)]")
    expect(CODIGO).toContain("[&>[data-slot=page-header-badge]]:col-span-1")
    expect(CODIGO).toContain("max-sm:[&>[data-slot=page-header-badge]]:col-span-full")
  })

  it("a cascata mora numa @utility depois do no-scrollbar, e o movimento reduzido a corta", () => {
    const i = CSS.indexOf("@utility page-header-reveal")
    expect(i).toBeGreaterThan(CSS.indexOf("@utility no-scrollbar"))
    const bloco = CSS.slice(i, CSS.indexOf("\n}\n", i))
    expect(bloco).toContain("animation: menubar-rise")
    expect(bloco).toContain("prefers-reduced-motion")
  })

  it("a faixa de fatos não tem fio, e é um <dl>", () => {
    const meta = CODIGO.slice(CODIGO.indexOf("function PageHeaderMeta"), CODIGO.indexOf("function PageHeaderStat"))
    expect(meta).not.toContain("border-t")
    expect(meta).toContain('asChild ? Slot.Root : "dl"')
  })
})

describe("as peças", () => {
  it("mídia, par da faixa, navegação e esqueleto", () => {
    for (const peca of ["PageHeaderMedia", "PageHeaderStat", "PageHeaderNav", "PageHeaderSkeleton"]) {
      expect(CODIGO).toContain(`function ${peca}(`)
    }
    // O par é rótulo sobre valor: sem gap.
    const par = CODIGO.slice(CODIGO.indexOf("function PageHeaderStat"), CODIGO.indexOf("function PageHeaderNav"))
    expect(par).toContain('"flex min-w-0 flex-col"')
    expect(par).not.toMatch(/flex-col gap-/)
  })

  it("o par tem um corpo só: o MoneyDisplay herda o do valor", () => {
    expect(CODIGO).toContain("[&_[data-slot=money-display]]:text-(length:--page-stat-value)")
    // O rótulo é texto comum, e não versalete: a sobrancelha já fala em caixa alta.
    expect(CODIGO).toContain('<dt className="text-xs text-muted-foreground">{label}</dt>')
  })

  it("não há régua: o variant ruled saiu a pedido do dono", () => {
    expect(CODIGO).not.toContain("ruled")
    expect(CODIGO).not.toMatch(/\bvariant:\s*\{/)
  })
})

describe("o alinhamento", () => {
  it("a faixa recua até a coluna do nome, medida; a navegação fica na borda", () => {
    expect(CODIGO).toContain('raiz.style.setProperty("--page-header-indent", `${Math.round(recuo)}px`)')
    expect(CODIGO).toContain("col-span-full ms-(--page-header-indent) mt-2")
    expect(CODIGO).toContain('"col-span-full min-w-0"')
  })
})

describe("os comportamentos", () => {
  it("o título sobe para a barra, medido contra o documento dele", () => {
    expect(CODIGO).toContain("publishPageTitle(doc, { text: el.textContent ?? \"\", docked: !e.isIntersecting && acima })")
    expect(CODIGO).toContain("{ root: doc, rootMargin: `-${base}px 0px 0px 0px` }")
    expect(fonte("src/components/ui/top-bar.tsx")).toContain("usePageTitleDock(doc)")
  })

  it("o ⋯ é o da Toolbar, com a conta do cabeçalho", () => {
    expect(CODIGO).toContain('useOverflowActions(ref, overflow === "menu", CASA_DO_CABECALHO)')
    expect(CODIGO).toContain("Math.min(raiz.clientWidth * 0.35, 240)")
  })

  it("o voltar volta pelo histórico só quando veio de dentro, e o href fica como saída", () => {
    expect(CODIGO).toContain("if (!veioDeDentro()) return")
    expect(CODIGO).toContain("router.back()")
    expect(CODIGO).toContain("if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return")
  })

  it("o título cortado ganha dica e foco, e vence o text-wrap do .page-title", () => {
    expect(CODIGO).toContain('truncate && "truncate text-nowrap!"')
    expect(CODIGO).toContain("tabIndex={cortado ? 0 : undefined}")
    expect(CODIGO).toContain("if (!cortado) return titulo")
  })
})
