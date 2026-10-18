import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import { highlightParts } from "./command"
import { ariaShortcut, matchShortcut } from "@/lib/shortcut"
import { rememberRecent } from "@/hooks/use-command-recents"

/** As versões do `Command`. */

const CODIGO = lerFonte("src/components/ui/command.tsx")

const tecla = (key: string, mods: Partial<Record<"metaKey" | "ctrlKey" | "altKey", boolean>> = {}) => ({
  key,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  ...mods,
})

describe("as versões do Command", () => {
  it("a legenda mede 36, e o topo centraliza a pilha com ela (a placa mais 52)", () => {
    expect(CODIGO).toContain('"inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs')
    expect(CODIGO).toContain("[--command-dialog-stack:calc(var(--command-dialog-h)+--spacing(13))]")
  })

  it("o ícone da linha não passa dos 36 da pilha: caixa de 24 de largura e 20 de altura", () => {
    expect(CODIGO).toContain('"flex h-5 w-6 shrink-0 items-center justify-center')
    expect(CODIGO).not.toContain('"flex size-6 shrink-0 items-center justify-center text-muted-foreground')
  })

  it("o destaque acha o trecho sem acento dos dois lados, e não inventa", () => {
    expect(highlightParts("Saúde", "saude")).toEqual([{ text: "Saúde", match: true }])
    expect(highlightParts("Mercado", "erc")).toEqual([
      { text: "M", match: false },
      { text: "erc", match: true },
      { text: "ado", match: false },
    ])
    expect(highlightParts("Educação", "cacao")).toEqual([
      { text: "Edu", match: false },
      { text: "cação", match: true },
    ])
    expect(highlightParts("Lazer", "xyz")).toEqual([{ text: "Lazer", match: false }])
    expect(highlightParts("Lazer", "  ")).toEqual([{ text: "Lazer", match: false }])
  })

  it("o atalho é um só para o SearchInput e o CommandItem", () => {
    expect(matchShortcut("mod+e", tecla("e", { metaKey: true }))).toBe(true)
    expect(matchShortcut("mod+e", tecla("e", { ctrlKey: true }))).toBe(true)
    expect(matchShortcut("mod+e", tecla("e"))).toBe(false)
    // Sem modificadora pedida, nenhuma pode estar descida.
    expect(matchShortcut("/", tecla("/", { metaKey: true }))).toBe(false)
    expect(matchShortcut("alt+n", tecla("n", { altKey: true }))).toBe(true)
    expect(ariaShortcut("mod+k")).toBe("Meta+K Control+K")
    expect(lerFonte("src/components/ui/search-input.tsx")).toContain('from "@/lib/shortcut"')
    expect(lerFonte("src/components/ui/search-input.tsx")).not.toMatch(/function casaAtalho/)
  })

  it("os recentes guardam destinos, sem duplicata, o último primeiro, no teto", () => {
    expect(rememberRecent(["a", "b", "c"], "b", 5)).toEqual(["b", "a", "c"])
    expect(rememberRecent(["a", "b", "c"], "d", 3)).toEqual(["d", "a", "b"])
  })

  it("a busca no servidor descarta a resposta de uma consulta cancelada", () => {
    const codigo = lerFonte("src/hooks/use-command-search.ts")
    expect(codigo).toContain("controle.abort()")
    expect(codigo.match(/if \(controle\.signal\.aborted\) return/g)?.length).toBe(2)
  })

  it("as sub-páginas: Backspace em dois toques, e o campo esvazia a cada passo", () => {
    expect(CODIGO).toMatch(/e\.key === "Backspace" && !texto[\s\S]*?if \(paginas\.armed\) paginas\.pop\(\)\s*else paginas\.setArmed\(true\)/)
    expect(CODIGO).toMatch(/if \(paginas\) mudarRef\.current\(""\)[\s\S]*?\}, \[profundidade\]\)/)
  })

  it("o atalho da linha só dispara com o foco na própria paleta", () => {
    expect(CODIGO).toContain('const raiz = ref.current?.closest("[cmdk-root]")')
    expect(CODIGO).toContain("raiz.contains(document.activeElement)")
  })

  it("no telefone o diálogo é gaveta, e o título continua ligado", () => {
    expect(CODIGO).toMatch(/if \(isMobile\) \{[\s\S]*?<Drawer \{\.\.\.props\}>[\s\S]*?<DialogTitle>\{title\}<\/DialogTitle>/)
  })

  it("o CommandInput repassa o cursor desenhado ao SearchInput, desligado por padrão", () => {
    expect(CODIGO).toContain("caret = false,")
    expect(CODIGO).toMatch(/<SearchInput[^]*?caret=\{caret\}[^]*?<CommandPrimitive\.Input/)
  })

  it("a página não diz mais que o Combobox monta a pilha", () => {
    expect(lerFonte("src/app/designsystem/docs/command.tsx")).not.toMatch(/o CommandDialog e o Combobox a montam/)
  })
})
