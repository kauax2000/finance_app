import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"
import { esperarDepoisDeNoScrollbar } from "@/test/regras"

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "./menubar"

/** A rodada 218: o redesenho do `Menubar`. */

const CODIGO = lerFonte("src/components/ui/menubar.tsx")
const CSS = lerFonte("src/app/globals.css")

const barra = (props: Record<string, unknown> = {}, gatilho: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    h(
      Menubar,
      props,
      h(
        MenubarMenu,
        null,
        h(MenubarTrigger, gatilho, "Arquivo"),
        h(MenubarContent, null, h(MenubarItem, { shortcut: "mod+e" }, "Exportar"))
      )
    )
  )

describe("o redesenho do Menubar", () => {
  it("o realce é um objeto só, na mola da referência, e as linhas não ganham o realce que viaja", () => {
    expect(CODIGO).toContain("layoutId={`${bar.barId}-realce`}")
    expect(CODIGO).toContain('{ type: "spring", duration: 0.28, bounce: 0.2 }')
    // O realce que corre entre as linhas foi recusado na rodada 137.
    expect(CODIGO.match(/layoutId=/g)).toHaveLength(1)
  })

  it("trocar de menu aberto desliza: o novo entra de onde o antigo estava, e o antigo some", () => {
    expect(CODIGO).toContain("setTroca({ ate: proximo, dx: antes.offsetLeft - depois.offsetLeft })")
    expect(CODIGO).toContain('"--tw-enter-translate-x": `${bar.troca!.dx}px`')
    expect(CODIGO).toContain("data-[trocando]:data-closed:animate-none")
  })

  it("a entrada é a mola de 97%, as linhas sobem em cascata e o tique estala", () => {
    expect(CODIGO).toContain("data-open:zoom-in-[0.97] data-[side=bottom]:slide-in-from-top-1.5")
    expect(CODIGO).toContain('"menubar-reveal"')
    expect(CSS).toMatch(/@utility menubar-reveal \{\s*& > \[role\^="menuitem"\] \{\s*animation: rise 160ms var\(--ease-out\) 40ms both;\s*--rise-distance: 3px;/)
    // A escada é a compartilhada (rodada 252): 40, 70… até 190ms na sexta
    // linha. Era `:nth-of-type`, que conta igual porque rótulo e fio são `div`.
    const cascata = esperarDepoisDeNoScrollbar(CSS, "@utility menubar-reveal {", { fecha: "@utility" })
    expect(cascata).toMatch(/--stagger-base: 40ms;\s*--stagger-step: 30ms;\s*--stagger-cap: 5;\s*@apply stagger-ladder;/)
    expect(cascata).not.toContain("nth-of-type")
    expect(CODIGO).toMatch(/<CheckIcon[\s\S]{0,120}zoom-in-50/)
  })

  it("a pílula flutuante veste a tinta flutuante, e só a outline veste a régua de barra", () => {
    expect(CODIGO).toMatch(/floating: `rounded-full p-1 shadow-lg ring-1 ring-foreground\/10 \$\{menuPanelTintClassName\}`/)
    expect(barra({ variant: "floating" })).toContain('data-variant="floating"')
  })

  it("o gatilho: ícone, contagem, seta que gira e letra de acesso", () => {
    const html = barra({}, { icon: h("svg", { "data-i": "" }), count: 2, chevron: true, mnemonic: "a" })
    expect(html).toContain("data-i")
    expect(html).toContain(">2<")
    expect(html).toContain("group-data-[state=open]/menubar-trigger:rotate-180")
    expect(html).toContain('aria-keyshortcuts="Alt+A"')
  })

  it("o índice: as linhas se registram fechadas, e a tecla funciona com a barra na tela", () => {
    expect(CODIGO).toContain("<IndiceContext.Provider value={true}>{children}</IndiceContext.Provider>")
    expect(CODIGO).toMatch(/if \(matchShortcut\(c\.shortcut, e\)\) \{\s*e\.preventDefault\(\)\s*c\.executar\(\)/)
    // F10 foca a barra; Alt + letra pelo `code`, porque no Mac Alt+A escreve "å".
    expect(CODIGO).toContain('e.key === "F10" && !e.shiftKey')
    expect(CODIGO).toContain("/^Key[A-Z]$/.test(e.code)")
    // Com várias barras, a primeira visível atende.
    expect(CODIGO).toContain("if (e.defaultPrevented || !raizRef.current?.offsetParent) return")
    // Re-registrar não muda a ordem.
    expect(CODIGO).toContain("nova[i] = c")
  })

  it("a caixa não fecha o menu, e a linha confirma e carrega", () => {
    expect(CODIGO).toMatch(/closeOnSelect = false,[\s\S]*?if \(!closeOnSelect\) e\.preventDefault\(\)/)
    expect(CODIGO).toMatch(/onSelect=\{\(e\) => \{\s*if \(!escolher\(e\)\) e\.preventDefault\(\)/)
  })

  it("a busca e a folha leem o índice", () => {
    expect(CODIGO).toMatch(/function MenubarSearch[\s\S]*?bar\.comandos/)
    expect(CODIGO).toMatch(/function MenubarFolha[\s\S]*?bar\.comandos/)
    expect(barra({ search: "Buscar…" })).toContain('data-slot="menubar-search"')
  })

  it("contas a pagar: um Menubar com rádios no lugar dos dois menus soltos", () => {
    const barraDeContas = lerFonte("src/components/bills/bills-toolbar.tsx")
    expect(barraDeContas).toContain("<Menubar")
    expect(barraDeContas).toContain("<MenubarRadioGroup")
    expect(barraDeContas).not.toContain("<DropdownMenu>")
  })

  it("a pílula flutuante é o padrão", () => {
    expect(CODIGO).toContain('defaultVariants: { variant: "floating" },')
    expect(CODIGO).toContain('variant = "floating",')
    expect(barra()).toContain('data-variant="floating"')
  })
})

