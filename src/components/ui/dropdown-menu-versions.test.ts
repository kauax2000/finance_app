import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/** A rodada 213: as versões novas do `DropdownMenu`. */

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")
const CODIGO = fonte("src/components/ui/dropdown-menu.tsx")
const DOC = fonte("src/app/designsystem/docs/dropdown-menu.tsx")

describe("as versões do DropdownMenu", () => {
  it("no telefone, com mobile=sheet, a raiz é o Drawer e cada peça se desenha como folha", () => {
    expect(CODIGO).toContain('const folha = mobile === "sheet" && isMobile')
    expect(CODIGO).toMatch(/folha \? \(\s*<Drawer open=\{open\} onOpenChange=\{mudar\}>/)
    expect(CODIGO).toContain('<DrawerContent variant="inset" data-slot="dropdown-menu-sheet">')
    // Na folha o título é do Radix: um `id` próprio apontava o nome para o vazio.
    expect(CODIGO).not.toMatch(/<DialogTitle id=\{id\}>/)
    // O ícone fica no corpo do conjunto que veio (16), e não esticado a 20.
    expect(CODIGO).toContain('"[&_svg]:size-4",')
  })

  it("na folha, o onClick da tela roda antes do da linha, que fecha a gaveta", () => {
    expect(CODIGO).toMatch(/const \{ onClick: aoClicar, \.\.\.resto \}[\s\S]*?\{\.\.\.resto\}\s*onClick=/)
  })

  it("confirm: o primeiro toque só arma, e a ação da tela (onSelect ou onClick) espera", () => {
    expect(CODIGO).toMatch(/if \(confirm && !armado\) \{\s*setArmado\(true\)\s*return false/)
    expect(CODIGO).toContain("if (confirm && !armado) return")
    expect(CODIGO).toContain("if (!(confirm && !armado)) aoClicar?.(e)")
  })

  it("um onSelect que devolve Promise carrega, e o menu fecha no fim", () => {
    expect(CODIGO).toMatch(/typeof \(resultado as Promise<unknown>\)\.then === "function"[\s\S]*?\.finally\(\(\) => \{[\s\S]*?fechar\(\)/)
  })

  it("a caixa não fecha o menu, e a página não diz mais o contrário do que o Radix faz", () => {
    expect(CODIGO).toContain("closeOnSelect = false")
    expect(CODIGO).toContain("if (!closeOnSelect) e.preventDefault()")
    expect(DOC).not.toContain("O menu fica aberto ao marcar um checkbox e fecha ao escolher um radio.")
  })

  it("a busca filtra pelo nome, e a tecla é texto no campo — o Radix buscaria por digitação", () => {
    expect(CODIGO).toContain("commandFilter(texto, estado.busca) <= 0")
    expect(CODIGO).toMatch(/if \(e\.key === "Escape"\) return[\s\S]*?e\.stopPropagation\(\)/)
  })

  it("a tecla abre o menu da linha focada, ou o da tela quando nada tem foco", () => {
    expect(CODIGO).toMatch(/const vale = escopo\s*\? escopo\.contains\(ativo\)\s*: ativo === alvo \|\| ativo === document\.body \|\| ativo === null/)
  })

  it("a página não escreve largura à mão nem diz que o cabeçalho traz o fio", () => {
    expect(DOC).not.toMatch(/<DropdownMenuContent[^>]*className="w-(44|48|52|56)"/)
    expect(DOC).not.toContain("sangra até a borda e traz o fio embaixo")
  })

  it("o submenu sai do menu num portal — dentro, o vidro e o overflow o recortavam", () => {
    for (const [arquivo, prim] of [
      ["dropdown-menu", "DropdownMenuPrimitive"],
      ["context-menu", "ContextMenuPrimitive"],
      ["menubar", "MenubarPrimitive"],
    ]) {
      const codigo = readFileSync(join(process.cwd(), `src/components/ui/${arquivo}.tsx`), "utf8")
      expect(codigo, arquivo).toMatch(new RegExp(`<${prim}\\.Portal>\\s*<${prim}\\.SubContent`))
    }
  })

  it("o menu com busca mede como o Combobox: pílula de 32 a 8px, linhas de 32 a 8px", () => {
    const codigo = readFileSync(join(process.cwd(), "src/components/ui/dropdown-menu.tsx"), "utf8")
    const combobox = readFileSync(join(process.cwd(), "src/components/ui/combobox.tsx"), "utf8")
    expect(codigo).toContain('const LINHA_DA_BUSCA = "gap-2 px-2 py-1.5"')
    expect(combobox).toContain('"gap-2 px-2 py-1.5 pr-8"')
    expect(combobox).toContain('"px-2 pt-(--scroll-fade-band-h) pb-2"')
    expect(codigo).toContain('search && "px-2 pt-0 pb-2"')
    expect(codigo).toMatch(/data-slot="dropdown-menu-search"\s*className="relative z-10 shrink-0 p-2"/)
    // A pílula é a `md` do Combobox, não a `sm` de antes.
    const busca = codigo.slice(codigo.indexOf('data-slot="dropdown-menu-search"'))
    expect(busca.slice(0, busca.indexOf("/>"))).not.toContain('size="sm"')
  })
})

