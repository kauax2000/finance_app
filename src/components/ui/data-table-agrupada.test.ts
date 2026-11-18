import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import { DataTable, type DataTableColumnDef } from "./data-table"

/** `mobileGroups="inset"`: no telefone, um cartão por grupo, com o cabeçalho por fora (rodada 396). */

type L = { id: string; nome: string; valor: number; dia: string }
const LINHAS: L[] = [
  { id: "a", nome: "Mercado", valor: -10, dia: "Hoje" },
  { id: "b", nome: "Farmácia", valor: -4, dia: "Hoje" },
  { id: "c", nome: "Cinema", valor: -5, dia: "Ontem" },
]
const COLUNAS: DataTableColumnDef<L>[] = [
  { id: "nome", accessorFn: (l) => l.nome, header: "Nome", meta: { label: "Nome", mobile: "title" } },
  { id: "valor", accessorFn: (l) => l.valor, header: "Valor", meta: { label: "Valor", numeric: true, mobile: "trailing" } },
]
const base = { columns: COLUNAS, data: LINHAS, getRowId: (l: L) => l.id, getRowLabel: (l: L) => l.nome, pageSize: false as const }
const gemeo = (html: string) => html.slice(html.indexOf('data-slot="data-table-mobile"'))
const conta = (html: string, s: string) => html.split(s).length - 1

describe('DataTable mobileGroups="inset"', () => {
  const fonte = semComentarios(lerFonte("src/components/ui/data-table.tsx"))

  it("declara a prop, o `aside` do grupo e o cabeçalho", () => {
    expect(fonte).toContain('mobileGroups?: "band" | "inset"')
    expect(fonte).toContain("aside?: React.ReactNode")
    expect(fonte).toContain('data-slot="data-table-mobile-group-heading"')
    expect(fonte).toContain('mobileGroups = "band"')
  })

  it("o ramo `inset` monta um `ItemGroup divided` por grupo", () => {
    const ramo = fonte.slice(fonte.indexOf("function GemeoDoTelefone"), fonte.indexOf("function EditorDeCelula"))
    expect(ramo).toMatch(/grupos\.map\([\s\S]{0,2400}<ItemGroup\s+variant="divided"/)
  })

  it("o cabeçalho gruda sob a barra até o próximo grupo, e a moldura não o recorta (rodada 397)", () => {
    const ramo = fonte.slice(fonte.indexOf("function GemeoDoTelefone"), fonte.indexOf("function EditorDeCelula"))
    expect(ramo).toMatch(/data-slot="data-table-mobile-group-heading"\s+className="sticky top-\(--top-bar-bottom\) [^"]*z-10 [^"]*pt-4/)
    expect(ramo).not.toMatch(/data-slot="data-table-mobile-group-heading"\s+className="[^"]*\sbg-/)
    expect(ramo).toMatch(/data-slot="data-table-mobile-group-heading"\s+className="[^"]*before:-top-\(--top-bar-bottom\)[^"]*before:backdrop-blur-md[^"]*data-preso:before:opacity-100/)
    expect(fonte).toContain('"max-md:overflow-visible max-md:border-transparent max-md:bg-transparent"')
  })

  it("o dia de cima não sobe: gira no próprio eixo e o próximo passa por cima (rodada 398)", () => {
    const ramo = fonte.slice(fonte.indexOf("function GemeoDoTelefone"), fonte.indexOf("function EditorDeCelula"))
    expect(ramo).toContain("useTrocaDoDia(lista,")
    expect(ramo).toContain("ref={setLista}")
    expect(fonte).toContain("[transform:perspective(1200px)_rotateX(var(--dia-giro,0deg))]")
    expect(fonte).toContain("transition-[transform,opacity] duration-(--duration-base)")
    expect(ramo).not.toContain("useCabecalhoPreso")
    expect(fonte).not.toContain("useCabecalhoPreso")
    expect(ramo).toContain('data-slot="data-table-mobile-group-heading-text"')
    const ate = ramo.slice(ramo.indexOf("grupos.map("), ramo.indexOf('data-slot="data-table-mobile-group-heading"'))
    expect(ate).not.toContain('<div key={key} className="flex flex-col">')
    expect(ramo).toMatch(/data-slot="data-table-mobile-group-heading"\s+className="[^"]*not-first:mt-2/)
    // Um fundo aceso só: o dia coberto não é `data-preso`, e a tinta não se soma ao rolar.
    expect(fonte).toContain('c.toggleAttribute("data-preso", preso && !coberto)')
    expect(fonte).not.toContain("data-coberto")
    expect(fonte).toContain("passive: true")
    // A troca dispara de uma vez (rodada 399): o ouvinte só marca `data-saindo`, sem escrever giro.
    expect(fonte).toContain('c.toggleAttribute("data-saindo", preso && distancia < alturas[i])')
    expect(fonte).toContain("data-saindo:[--dia-giro:90deg] data-saindo:[--dia-opacidade:0] motion-reduce:data-saindo:[--dia-giro:0deg]")
    expect(fonte).not.toContain("style.transform")
    // Começa quando o texto do próximo encosta: a medida é a linha do miolo, não o cabeçalho.
    expect(fonte).toMatch(/const alturas = cabecalhosAgora\.map\(\s*\(c\) => c\.querySelector<HTMLElement>\("\[data-slot=data-table-mobile-group-heading-text\]"\)\?\.offsetHeight/)
  })

  it("um cartão por grupo, com o nome e o `aside` por fora", () => {
    const html = gemeo(
      renderToStaticMarkup(
        h(DataTable<L>, {
          ...base,
          mobileGroups: "inset",
          groupBy: (l: L) => ({ key: l.dia, label: l.dia, aside: `total ${l.dia}` }),
        })
      )
    )
    expect(conta(html, 'data-slot="data-table-mobile-group"')).toBe(2)
    expect(conta(html, 'data-slot="data-table-mobile-group-heading"')).toBe(2)
    expect(html).toContain("total Hoje")
    // O fio começa no texto: o do `divided` sai, e só a linha que não fecha o cartão leva o seu.
    expect(html).not.toContain(":border-b-border")
    expect(conta(html, "after:bg-border")).toBe(1)
    // O cabeçalho vem antes do cartão, fora dele.
    expect(html.indexOf("data-table-mobile-group-heading")).toBeLessThan(html.indexOf('data-slot="data-table-mobile-group"'))
  })

  it("sem grupo (`null`), um cartão só, sem cabeçalho", () => {
    const html = gemeo(renderToStaticMarkup(h(DataTable<L>, { ...base, mobileGroups: "inset", groupBy: () => null })))
    expect(conta(html, 'data-slot="data-table-mobile-group"')).toBe(1)
    expect(html).not.toContain("data-table-mobile-group-heading")
  })

  it("no telefone a moldura do painel some; o padrão segue com a faixa", () => {
    const inset = renderToStaticMarkup(
      h(DataTable<L>, { ...base, mobileGroups: "inset", groupBy: (l: L) => ({ key: l.dia, label: l.dia }) })
    )
    expect(inset).toContain("max-md:bg-transparent")
    const faixa = renderToStaticMarkup(h(DataTable<L>, { ...base, groupBy: (l: L) => ({ key: l.dia, label: l.dia }) }))
    expect(faixa).not.toContain("max-md:bg-transparent")
    expect(faixa).not.toContain("data-table-mobile-group-heading")
    expect(conta(gemeo(faixa), 'data-slot="data-table-mobile-group"')).toBe(2)
  })
})

describe("o gêmeo do telefone não segue as colunas escondidas do desktop", () => {
  it("lê todas as células da linha", async () => {
    const { lerFonte, semComentarios } = await import("@/test/fonte")
    const fonte = semComentarios(lerFonte("src/components/ui/data-table.tsx"))
    expect(fonte).toContain("const cells = row.getAllCells()")
  })
})
