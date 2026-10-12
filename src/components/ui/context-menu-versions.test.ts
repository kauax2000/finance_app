import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import { contextMenuTargets } from "./context-menu"

/** As versões do `ContextMenu`. */

const CODIGO = lerFonte("src/components/ui/context-menu.tsx")

describe("as versões do ContextMenu", () => {
  it("sobre uma linha selecionada o menu age na seleção; fora dela, só na linha", () => {
    const sel = new Set(["a", "b"])
    expect(contextMenuTargets("a", sel).sort()).toEqual(["a", "b"])
    expect(contextMenuTargets("c", sel)).toEqual(["c"])
    expect(contextMenuTargets("a", new Set<string>())).toEqual(["a"])
  })

  it("com asChild o gatilho não escreve data-slot por cima do filho", () => {
    // O `Item` saía `data-slot="context-menu-trigger"`.
    expect(CODIGO).toContain('{...(asChild ? {} : { "data-slot": "context-menu-trigger" })}')
    expect(CODIGO).toContain("data-[state=open]:bg-muted/60")
  })

  it("Shift+F10 e a tecla Menu despacham o contextmenu no elemento focado", () => {
    expect(CODIGO).toContain('e.key !== "ContextMenu" && !(e.shiftKey && e.key === "F10")')
    expect(CODIGO).toMatch(/alvo\.dispatchEvent\(\s*new MouseEvent\("contextmenu"/)
  })

  it("o toque longo é do Radix, e não há trava de clique não medida", () => {
    expect(CODIGO).not.toContain("onClickCapture")
  })

  it("a descrição vira grade — flex-wrap derrubava o rótulo para baixo do ícone", () => {
    expect(CODIGO).not.toMatch(/description && "flex-wrap"/)
    expect(CODIGO).toContain("has-[>svg]:grid-cols-[auto_minmax(0,1fr)_auto]")
    expect(CODIGO).toContain("group-has-[>svg]/menu-item:col-start-2")
  })

  it("o cabeçalho nomeia o menu, e a largura fala a escada do DropdownMenu", () => {
    expect(CODIGO).toContain("aria-labelledby={ariaLabelledBy ?? tituloId ?? undefined}")
    expect(CODIGO).toMatch(/sm: "w-44",\s*md: "w-48",\s*lg: "w-52",\s*xl: "w-56"/)
    expect(lerFonte("src/app/designsystem/docs/context-menu.tsx")).not.toContain('className="w-52"')
  })

  it("as telas migradas repetem as ações visíveis pelo botão direito", () => {
    // A tabela de transações é um `DataTable`: o menu entra por `rowContextMenu`, que calcula
    // os alvos com `contextMenuTargets`, e a linha projetada não tem menu (a função devolve
    // `null`).
    const tabela = lerFonte("src/components/transactions/transactions-table.tsx")
    expect(tabela).toMatch(/rowContextMenu=\{\(t, \{ targets, selected \}\) =>\s*isProjectedTransactionRow\(t\) \? null/)
    expect(lerFonte("src/components/ui/data-table.tsx")).toContain("contextMenuTargets(row.id, idsMarcados)")
    expect(lerFonte("src/components/bills/bill-pending-card.tsx")).toMatch(/<ContextMenuTrigger asChild>\s*<Card/)
    for (const arquivo of [
      "src/components/categories/expense-category-card.tsx",
      "src/components/categories/income-category-card.tsx",
    ]) {
      expect(lerFonte(arquivo), arquivo).toMatch(/<CategoryCardContextMenu[\s\S]*?<Card /)
    }
  })
})
