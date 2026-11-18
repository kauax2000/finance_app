import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import { DataTable, type DataTableColumnDef } from "./data-table"

/** `mobileSwipe`: no telefone, deslizar a linha revela as ações dela (rodada 401). */

type L = { id: string; nome: string; prevista?: boolean }
const LINHAS: L[] = [
  { id: "a", nome: "Mercado" },
  { id: "b", nome: "Aluguel", prevista: true },
]
const COLUNAS: DataTableColumnDef<L>[] = [
  { id: "nome", accessorFn: (l) => l.nome, header: "Nome", meta: { label: "Nome", mobile: "title" } },
]
const ACOES = [
  { label: "Editar", onSelect: () => undefined, hidden: (l: L) => Boolean(l.prevista) },
  { label: "Excluir", variant: "destructive" as const, onSelect: () => undefined, hidden: (l: L) => Boolean(l.prevista) },
]
const base = { columns: COLUNAS, data: LINHAS, getRowId: (l: L) => l.id, getRowLabel: (l: L) => l.nome, pageSize: false as const }
const conta = (html: string, s: string) => html.split(s).length - 1

describe("DataTable mobileSwipe", () => {
  const fonte = semComentarios(lerFonte("src/components/ui/data-table.tsx"))
  const ramo = fonte.slice(fonte.indexOf("function LinhaDeslizavel"), fonte.indexOf("function GemeoDoTelefone"))

  it("declara a prop, desligada por padrão, e o gesto só do dedo com a trava de direção", () => {
    expect(fonte).toContain("mobileSwipe?: boolean")
    expect(fonte).toContain("mobileSwipe = false,")
    expect(fonte).toContain('if (e.pointerType === "touch") return true')
    // Temporário (18/11/2026): o mouse desliza numa janela de celular, para testar no computador.
    expect(fonte).toContain('matchMedia("(max-width: 47.99rem)")')
    expect(ramo).toContain("travarDirecao(")
    expect(ramo).toContain("assentarDeslize(")
    // Abrir no balanço do app, fechar na mola macia (rodada 403).
    expect(ramo).toContain("...(alvo ? BALANCO : MOLA)")
    expect(ramo).toContain("elastico(g.base + dx, largura)")
    // Como no Mail do iOS 26: fundo da página atrás dos botões, linha arredondada e fio parado.
    expect(ramo).toContain('"relative overflow-hidden bg-background"')
    expect(ramo).toContain('linha.toggleAttribute("data-solta", x < 0)')
    expect(ramo).toContain("data-solta:[&_[data-slot=item-content]]:after:opacity-0")
    expect(ramo).toContain("has-data-solta:after:start-(--fio-inicio,0px)")
    expect(ramo).toContain('data-slot="data-table-mobile-swipe-actions"')
    expect(ramo).toContain("tabIndex={aberta ? 0 : -1}")
  })

  it("o ícone de 20 é o `swipeIcon` (20/solid); sem ele, o `icon` fica nos 16 (fix 1)", () => {
    expect(fonte).toContain("swipeIcon?: React.ReactNode")
    expect(ramo).toContain('a.swipeIcon ? "[&_svg]:size-5" : "[&_svg]:size-4"')
    expect(ramo).toContain("{a.swipeIcon ?? a.icon}")
    const transacoes = lerFonte("src/components/transactions/transacoes-tabela.tsx")
    expect(transacoes).toContain('from "@heroicons/react/20/solid"')
    expect(conta(transacoes, "swipeIcon:")).toBe(3)
  })

  it("os botões são círculos de 44 só com ícone, que crescem com o arraste (rodada 402)", () => {
    expect(fonte).not.toContain("LARGURA_DA_ACAO")
    expect(ramo).toContain("larguraDaFaixa(")
    expect(ramo).toContain("size-11 rounded-full")
    expect(ramo).toContain("--deslize")
    expect(ramo).not.toContain("{a.label}</span>")
    expect(ramo).not.toContain("<span>")
    expect(ramo).toContain("bg-secondary text-secondary-foreground active:brightness-90")
    expect(ramo).not.toContain("active:bg-secondary-hover")
  })

  it("Excluir é o vermelho cheio, sem alfa (fix 1)", () => {
    expect(ramo).toContain('"bg-destructive text-destructive-foreground')
    expect(ramo).not.toMatch(/bg-destructive\//)
  })

  it("os ouvintes de fora não se reinscrevem a cada render, e a mola não reinicia no mesmo alvo (fix 1)", () => {
    expect(ramo).toContain("}, [aberta])")
    expect(ramo).toContain("if (mola.current && alvoDaMola.current === alvo) return")
  })

  it("só a linha com ação visível desliza, e as ações ficam fora do Tab fechadas", () => {
    const html = renderToStaticMarkup(h(DataTable<L>, { ...base, rowActions: ACOES, mobileSwipe: true }))
    expect(conta(html, 'data-slot="data-table-mobile-swipe"')).toBe(1)
    expect(html).toMatch(/data-slot="data-table-mobile-swipe-actions" aria-hidden="true"/)
    const acoes = html.slice(html.indexOf('data-slot="data-table-mobile-swipe-actions"'), html.indexOf('data-slot="data-table-mobile-swipe-row"'))
    expect(conta(acoes, 'tabindex="-1"')).toBe(2)
    expect(html).toContain('aria-label="Excluir Mercado"')
  })

  it("desligado, nada muda", () => {
    const html = renderToStaticMarkup(h(DataTable<L>, { ...base, rowActions: ACOES }))
    expect(html).not.toContain("data-table-mobile-swipe")
  })

  it("Transações liga", () => {
    expect(lerFonte("src/components/transactions/transacoes-tabela.tsx")).toMatch(/^\s+mobileSwipe$/m)
  })

  it("em repouso a faixa das ações fica escondida, para o vermelho não vazar pelos cantos", () => {
    const fonte = semComentarios(lerFonte("src/components/ui/data-table.tsx"))
    expect(fonte).toContain('className="invisible absolute inset-y-0 end-0 flex items-center gap-2 px-2"')
    expect(fonte).toContain('faixa.style.visibility = x < 0 ? "visible" : ""')
  })
})
