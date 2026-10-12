import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import { sheetContentVariants } from "./sheet"

/** A rodada 222: as versões novas do `Sheet`. */

const CODIGO = lerFonte("src/components/ui/sheet.tsx")
const CSS = lerFonte("src/app/globals.css")

describe("as versões do Sheet", () => {
  it("floating é o padrão, numa placa chapada com o anel das placas", () => {
    const c = sheetContentVariants({})
    expect(c).toContain("rounded-modal ring-1 ring-foreground/10")
    expect(c).toContain("bg-popover")
    expect(c).not.toContain("glass-surface")
    // O comentário conta a história do vidro; o código não o veste.
    expect(semComentarios(CODIGO, "fora-de-url")).not.toContain("modalSurfaceClassName")
  })

  it("o × de canto da folha flutuante é círculo preenchido, sem anel nem sombra", () => {
    const c = sheetContentVariants({ variant: "floating" })
    // O texto a 5%: `--popover` sumia sobre a placa, e `--muted` era claro demais.
    expect(c).toContain("[&>[data-slot=dialog-close-button]]:rounded-full [&>[data-slot=dialog-close-button]]:bg-foreground/5")
    // No escuro o texto a 5% clareia; mais escuro ali é a página.
    expect(c).toContain("dark:[&>[data-slot=dialog-close-button]]:bg-background/40")
    expect(c).not.toContain("[&>[data-slot=dialog-close-button]]:bg-popover")
    // Dentro da placa, a pílula inteira lia como uma segunda placa.
    expect(c).not.toContain("[&>[data-slot=dialog-close-button]]:ring-1")
    expect(c).not.toContain("[&>[data-slot=dialog-close-button]]:shadow-lg")
    expect(sheetContentVariants({ variant: "flush" })).not.toContain("dialog-close-button]]:rounded-full")
  })

  it("o casco de formulário é o de fábrica", () => {
    const c = sheetContentVariants({})
    expect(c).toContain("flex flex-col gap-0 overflow-hidden")
    expect(c).not.toContain("gap-4")
  })

  it("entra na mola, sai curta, e o conteúdo sobe em cascata", () => {
    const c = sheetContentVariants({})
    expect(c).toContain("data-open:animation-duration-(--duration-spring) data-open:ease-(--ease-spring)")
    expect(c).toContain("data-closed:animation-duration-[200ms]")
    expect(c).toContain("sheet-reveal")
    expect(CSS).toMatch(/@utility sheet-reveal \{[\s\S]*?animation: rise 220ms var\(--ease-out\) 80ms both;\s*--rise-distance: 3px;/)
    // O × e a costura de largura não sobem: são da superfície.
    expect(CSS).toContain('& > :not([data-slot="dialog-close-button"]):not([data-slot="sheet-resize-handle"])')
  })

  it("a escada de largura vale só nas laterais", () => {
    expect(sheetContentVariants({ size: "sm" })).toContain("sm:max-w-sm")
    expect(sheetContentVariants({ size: "md" })).toContain("sm:max-w-md")
    expect(sheetContentVariants({ size: "lg" })).toContain("sm:max-w-lg")
    expect(sheetContentVariants({ size: "full" })).toContain("sm:max-w-[calc(100%-4rem)]")
    expect(CODIGO).toContain('size: lateral ? size : "none"')
  })

  it("pending, dirty e confirmDiscard passam por um pedido só", () => {
    // A régua é a do `Dialog`, a mesma função: `dialog-versions.test.ts` tranca o `pedir`.
    expect(CODIGO).toContain("const { open, pedir, pergunta } = usePedidoDeFechar({")
    // No telefone a trava é a do `Drawer`, que respeita o `dismissible` de quem chama.
    expect(CODIGO).toContain("pending={pending}")
    expect(CODIGO).toContain("aria-busy={pending || undefined}")
    expect(CODIGO).toContain('import { usePedidoDeFechar } from "@/components/ui/dialog"')
  })

  it("folha sobre folha: o painel de baixo recua, e na gaveta empilha o Drawer", () => {
    expect(CODIGO).toContain("data-coberta={coberta ? \"\" : undefined}")
    expect(CODIGO).toContain("data-[coberta]:scale-[0.96] data-[coberta]:data-[side=right]:-translate-x-6")
    // O aninhamento é o do `drawer.tsx`: o painel o publica para cobrir, e a
    // gaveta é o `Drawer`, que vira `NestedRoot` sob outra gaveta.
    expect(CODIGO).toContain('if (pai?.superficie !== "painel" || !open) return')
    expect(CODIGO).toContain("<DrawerRaizContext.Provider value={aninhamento}>")
    expect(lerFonte("src/components/ui/drawer.tsx")).toContain(
      'pai?.superficie === "gaveta" ? DrawerPrimitive.NestedRoot : DrawerPrimitive.Root'
    )
  })

  it("no telefone a folha é o Drawer, e o aninhamento é um só", () => {
    const sheet = semComentarios(lerFonte("src/components/ui/sheet.tsx"), "tudo")
    expect(sheet).toMatch(/<DrawerContent\b/)
    expect(sheet).not.toContain("SheetPaiContext")
    expect(sheet).not.toMatch(/--sheet-drawer-h/)
  })

  it("a largura arrasta pela aresta de dentro, com teclado e guardada", () => {
    expect(CODIGO).toContain('role="separator"')
    expect(CODIGO).toContain('aria-label="Redimensionar a folha"')
    expect(CODIGO).toContain("window.localStorage.setItem(`sheet-width:${chave}`")
    expect(CODIGO).toContain("hover:after:bg-foreground/30")
  })

  it("ao lado: modal={false} não monta véu e clicar fora não fecha", () => {
    expect(CODIGO).toContain("const aoLado = modalProp === false")
    expect(CODIGO).toMatch(/if \(aoLado\) e\.preventDefault\(\)/)
  })

  it("degraus na gaveta: snapPoints só no telefone, e a gaveta mede a tela", () => {
    expect(CODIGO).toContain("snapPoints={snapPoints}")
    // Sem `fillMobileViewport`, os degraus da raiz decidem — como em qualquer `Drawer`.
    expect(CODIGO).toContain("fill={fillMobileViewport || undefined}")
  })

  it("as folhas do app ficam encostadas por enquanto", () => {
    for (const arquivo of [
      "src/components/layout/notifications-sheet.tsx",
      "src/components/transactions/transaction-detail-sheet.tsx",
      "src/components/transactions/transactions-toolbar.tsx",
      "src/components/bills/bill-detail-sheet.tsx",
      "src/components/bills/bills-toolbar.tsx",
      "src/components/subscriptions/subscription-detail-sheet.tsx",
      "src/components/dashboard/dashboard-payment-event-preview-sheet.tsx",
      "src/components/pwa/install-pwa-sheet.tsx",
    ]) {
      expect(lerFonte(arquivo), arquivo).toContain('variant="flush"')
    }
  })

  it("a página não conta o que deixou de ser verdade", () => {
    const doc = lerFonte("src/app/designsystem/docs/sheet.tsx")
    expect(doc).not.toContain("o deslize vira um fade curto")
    expect(doc).not.toContain("com <code>fillMobileViewport</code>, o keyframe de gaveta")
    expect(doc).not.toContain("O material é o mesmo em flush e floating")
  })
})
