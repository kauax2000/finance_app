import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

/** As versões do `DropdownMenu`. */

const CODIGO = lerFonte("src/components/ui/dropdown-menu.tsx")
const DOC = lerFonte("src/app/designsystem/docs/dropdown-menu.tsx")

describe("as versões do DropdownMenu", () => {
  it("no telefone, com mobile=sheet, a raiz é o Drawer e cada peça se desenha como folha", () => {
    expect(CODIGO).toContain('const folha = mobile === "sheet" && isMobile')
    expect(CODIGO).toMatch(/folha \? \(\s*<Drawer open=\{open\} onOpenChange=\{mudar\}>/)
    // Toda gaveta do telefone é a `flush`, o padrão.
    expect(CODIGO).toContain('<DrawerContent data-slot="dropdown-menu-sheet">')
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
      const codigo = lerFonte(`src/components/ui/${arquivo}.tsx`)
      expect(codigo, arquivo).toMatch(new RegExp(`<${prim}\\.Portal>\\s*<${prim}\\.SubContent`))
    }
  })

  it("o menu com busca mede como o Combobox: pílula de 32 a 8px, linhas de 32 a 8px", () => {
    const codigo = lerFonte("src/components/ui/dropdown-menu.tsx")
    const combobox = lerFonte("src/components/ui/combobox.tsx")
    expect(codigo).toContain('const LINHA_DA_BUSCA = "gap-2 px-2 py-2"')
    expect(combobox).toContain('"gap-2 px-2 py-2 pr-8"')
    expect(combobox).toContain('"px-2 pt-(--scroll-fade-band-h) pb-2"')
    expect(codigo).toContain('search && "px-2 pt-0 pb-2"')
    expect(codigo).toMatch(/data-slot="dropdown-menu-search"\s*className="relative z-10 shrink-0 p-2"/)
    // A pílula é a `md` do Combobox, não a `sm` de antes.
    const busca = codigo.slice(codigo.indexOf('data-slot="dropdown-menu-search"'))
    expect(busca.slice(0, busca.indexOf("/>"))).not.toContain('size="sm"')
  })
})

describe("o ponto do rádio", () => {
  it("é um bloco: inline dentro do indicador, o size-2 media 0×0", () => {
    for (const arquivo of ["dropdown-menu.tsx", "context-menu.tsx", "menubar.tsx"]) {
      const fonte = lerFonte(`src/components/ui/${arquivo}`)
      expect(fonte, arquivo).not.toMatch(/ItemIndicator>\s*(\{\/\*[\s\S]*?\*\/\}\s*)?<span className="size-2/)
      expect(fonte, arquivo).toMatch(/className="block size-2[^"]*rounded-full bg-current/)
    }
  })
})

describe("o rádio que marca a escolha atual", () => {
  it("indicator=\"media\": o halo na cor da própria opção, a prévia no foco e a tinta esmaecida", () => {
    const fonte = lerFonte("src/components/ui/dropdown-menu.tsx")
    expect(fonte).toContain('indicator?: "dot" | "media"')
    // O halo nasce colado e transparente, e cresce na curva do sistema.
    expect(fonte).toContain("[&>[data-slot=color-tile]]:outline-2 [&>[data-slot=color-tile]]:outline-solid [&>[data-slot=color-tile]]:outline-offset-0 [&>[data-slot=color-tile]]:outline-transparent")
    // Escolhida: a cor do ladrilho puxada para a tinta (contraste nos dois temas).
    expect(fonte).toContain("data-[state=checked]:[&>[data-slot=color-tile]]:outline-offset-2 data-[state=checked]:[&>[data-slot=color-tile]]:outline-[color-mix(in_oklab,var(--tile-surface)_60%,var(--foreground))]")
    // No foco de outra, a prévia do mesmo halo, esmaecida.
    expect(fonte).toContain("data-[state=unchecked]:focus:[&>[data-slot=color-tile]]:outline-offset-2")
    expect(fonte).toContain("data-[state=unchecked]:not-focus:text-muted-foreground")
    // A escolhida tem fundo leve (5% da tinta), abaixo do realce de passagem (9%): os dois
    // estados se distinguem. Não é o `bg-muted`, que pesava como o realce.
    expect(fonte).toContain("data-[state=checked]:not-focus:bg-foreground/5")
    // Entre duas linhas de mídia, 4px (o respiro dos itens da barra lateral): os fundos não se colam.
    expect(fonte).toContain("[[data-indicator=media]+&]:mt-1")
    expect(fonte).not.toContain("data-[state=checked]:bg-muted")
  })
})
