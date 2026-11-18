import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { blocoCss, lerFonte, semComentarios } from "@/test/fonte"

import { DataTable, type DataTableColumnDef } from "./data-table"

/** O filtro brota e a lista se refaz (rodada 407): o token que nasce com a barra montada brota no `menu-morph`, e a troca de filtro refaz a lista em cascata (`stagger-ladder` + `rise`). */

type L = { id: string; nome: string }
const COLUNAS: DataTableColumnDef<L>[] = [
  { id: "nome", accessorFn: (l) => l.nome, header: "Nome", meta: { label: "Nome", mobile: "title" } },
]
const LINHAS: L[] = [
  { id: "a", nome: "Mercado" },
  { id: "b", nome: "Farmácia" },
]

const css = lerFonte("src/app/globals.css")
const filtro = semComentarios(lerFonte("src/components/ui/filter-bar.tsx"))
const tabela = semComentarios(lerFonte("src/components/ui/data-table.tsx"))

describe("o token do filtro brota", () => {
  it("a utility brota no gesto dos menus, sem keyframe novo, e para no movimento reduzido", () => {
    const bloco = blocoCss(css, "@utility token-sprout")
    expect(bloco).toContain("animation: menu-morph 380ms linear backwards")
    expect(bloco).toMatch(/prefers-reduced-motion: reduce[\s\S]*animation: none/)
    expect(css).not.toMatch(/@keyframes token-sprout/)
  })

  it("só o token que nasce com a barra montada a veste, e lido uma vez, ao nascer", () => {
    expect(filtro).toContain("montada={Boolean(cabeca)}")
    expect(filtro).toContain("const [brota] = React.useState(montada && !reduzir)")
    expect(filtro).toContain('brota && "token-sprout"')
  })
})

describe("a lista se refaz em cascata", () => {
  it("a `list-reveal` usa a escada e a subida do sistema e para no movimento reduzido", () => {
    const bloco = blocoCss(css, "@utility list-reveal")
    expect(bloco).toContain("animation: rise")
    expect(bloco).toContain("@apply stagger-ladder")
    expect(bloco).toMatch(/prefers-reduced-motion: reduce[\s\S]*animation: none/)
    // Depois de `no-scrollbar` (a faixa do `glass.test.ts`).
    expect(css.indexOf("@utility list-reveal")).toBeGreaterThan(css.indexOf("@utility no-scrollbar"))
    expect(css.indexOf("@utility token-sprout")).toBeGreaterThan(css.indexOf("@utility no-scrollbar"))
  })

  it("a troca da chave arma, e a cascata toca quando a busca assenta, nunca com movimento reduzido", () => {
    expect(tabela).toContain("revealKey?: string | null")
    expect(tabela).toMatch(/if \(revealKey !== chaveVista\) \{\s*setChaveVista\(revealKey\)\s*setArmada\(\{ ids: idsDoRenderAnterior\.current \}\)/)
    // Só com outras linhas, comparadas com as do render de antes da troca: nem as velhas animam,
    // nem a troca que chega junto com os dados do cache fica sem cascata.
    expect(tabela).toMatch(/if \(armada && idsAgora !== armada\.ids && !loading\) \{[\s\S]{0,80}if \(comMovimento && !reduzir\) setRefaz/)
  })

  it("no desktop o `<tbody>` remonta pela troca; no telefone o gêmeo veste a classe até o fim da última linha", () => {
    expect(tabela).toContain("key={animar ? `pagina-${pagination.pageIndex}-${refaz}` : undefined}")
    expect(tabela).toContain("refazendo={refaz > refeito}")
    expect(tabela.match(/refazendo && "list-reveal"/g)?.length).toBe(2)
    // Consome-se por tempo, chaveada na troca: sem linhas ou com o gêmeo escondido não há `animationend`.
    expect(tabela).toMatch(/if \(refaz === 0\) return\s*const t = window\.setTimeout\(\(\) => setRefeito\(refaz\), 700\)/)
    expect(tabela).not.toContain("onAnimationEnd")
  })

  it("a primeira carga não se refaz", () => {
    const html = renderToStaticMarkup(
      h(DataTable<L>, {
        columns: COLUNAS,
        data: LINHAS,
        getRowId: (l) => l.id,
        getRowLabel: (l) => l.nome,
        pageSize: false,
        revealKey: "categoria:is:x",
      })
    )
    expect(html).toContain('data-slot="data-table-mobile"')
    expect(html).not.toContain("list-reveal")
  })

  it("Transações passa a chave dos filtros", () => {
    const tela = lerFonte("src/components/transactions/transacoes-tabela.tsx")
    expect(tela).toContain("revealKey={serializeFilters(estado.filtros)}")
  })
})

describe("Limpar tudo fecha a gaveta", () => {
  it("no FilterBar, o Limpar tudo da lista de campos é o `limpar`, que fecha o que está aberto", () => {
    expect(filtro).toContain("onLimparTudo={limpar}")
    expect(filtro).toMatch(/const limpar = \(\) => \{[\s\S]{0,120}emitir\(\[\]\)\s*if \(aberto\) fechar\(false\)/)
  })

  it("na folha antiga de Transações, também fecha", () => {
    const folha = semComentarios(lerFonte("src/components/transactions/transactions-toolbar.tsx"))
    expect(folha).toMatch(/resetAllFilters\(\)\s*setFiltersSheetOpen\(false\)/)
  })
})
