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
  it("o sinal da linha é a seta de ir ou, nas ações de criar, o +", () => {
    expect(CODIGO).toContain('variant === "add" ? PlusIcon : ArrowUpRightIcon')
    expect(lerFonte("src/components/layout/app-command-palette.tsx")).toContain('<CommandItemArrow variant="add" />')
  })

  it("a legenda mede 32, e o topo centraliza a pilha com ela (a placa mais 48)", () => {
    expect(CODIGO).toContain('"inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs whitespace-nowrap')
    expect(CODIGO).toContain("[--command-dialog-stack:calc(var(--command-dialog-h)+--spacing(12))]")
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

  it("no telefone a lupa vira a barra: camada própria, sem gaveta, com o título ligado", () => {
    expect(CODIGO).not.toMatch(/from "@\/components\/ui\/drawer"/)
    expect(CODIGO).toMatch(/if \(isMobile\) \{[\s\S]*?data-slot="command-search"[\s\S]*?<DialogTitle>\{title\}<\/DialogTitle>/)
    expect(CODIGO).toContain('data-slot="command-search-bar"')
    expect(CODIGO).toContain('data-slot="command-search-cancel"')
    expect(CODIGO).toMatch(/>\s*Cancelar\s*</)
    expect(CODIGO).toContain("origin?: React.RefObject<HTMLElement | null>")
    // A pílula nasce do retângulo da origem e anda na mola; fecha na SAIDA.
    expect(CODIGO).toMatch(/import \{[^}]*\bMOLA\b[^}]*\bSAIDA\b[^}]*\} from "@\/lib\/spring"|import \{[^}]*\bSAIDA\b[^}]*\bMOLA\b[^}]*\} from "@\/lib\/spring"/)
    expect(CODIGO).toContain("getBoundingClientRect()")
    // O teclado: o foco vai ao campo no próprio commit, sem esperar a mola.
    expect(CODIGO).toMatch(/onOpenAutoFocus=\{[\s\S]*?preventDefault\(\)[\s\S]*?\.focus\(/)
    expect(CODIGO).toMatch(/if \(isMobile\)[\s\S]*?safe-area-inset-top/)
    // A pílula nasce no círculo da lupa: um progresso só, na MOLA, escreve o
    // translateX e o recorte no próprio vidro, e o conteúdo (a lupa da
    // pílula primeiro) anda com a borda.
    expect(CODIGO.match(/animate\(0, 1, \{ \.\.\.MOLA, onUpdate: quadro \}\)/g)).toHaveLength(1)
    expect(CODIGO).toMatch(/animate\(progresso\.current, 0, \{ \.\.\.SAIDA, onUpdate: quadro \}\)/)
    const quadro = CODIGO.slice(CODIGO.indexOf("function quadroDaPilula"), CODIGO.indexOf("function pilulaEmRepouso"))
    expect(quadro).toContain("pilula.style.transform = `translateX(${(lupa.right - final.right) * resto}px)`")
    expect(quadro).toContain("const esquerda = (final.width - lupa.width) * resto")
    expect(quadro).toMatch(/pilula\.style\.clipPath = `inset\([^`]*\$\{esquerda\}px round 22px\)`/)
    expect(quadro).toContain("for (const filho of conteudo) (filho as HTMLElement).style.transform = `translateX(${esquerda}px)`")
    // O elemento não é animado pelo motion (o valor dele reescrevia o fim), e o
    // repouso tira transform, recorte e o deslocamento do conteúdo.
    expect(CODIGO).not.toMatch(/animate\(pilula, \{ clipPath/)
    const repouso = CODIGO.slice(CODIGO.indexOf("function pilulaEmRepouso"), CODIGO.indexOf("/**\n * A paleta em diálogo"))
    expect(repouso).toContain('pilula.style.transform = ""')
    expect(repouso).toContain('pilula.style.clipPath = ""')
    expect(repouso).toContain('for (const filho of pilula.children) (filho as HTMLElement).style.transform = ""')
    expect(CODIGO).toMatch(/abrindo\.then\(\(\) => \{\s*if \(ativa\) pilulaEmRepouso\(pilula\)/)
    // Sem gatilho do Radix, fechar devolve o foco à origem, e não ao body.
    expect(CODIGO).toMatch(/onCloseAutoFocus=\{[\s\S]*?origin\?\.current[\s\S]*?preventDefault\(\)[\s\S]*?\.focus\(/)
  })

  it("a origem só vale com caixa: lupa escondida não faz a pílula nascer em 0,0", async () => {
    const { origemValida } = await import("@/components/ui/command")
    expect(origemValida(null)).toBe(false)
    expect(origemValida(undefined)).toBe(false)
    expect(origemValida({ width: 0, height: 44 } as DOMRect)).toBe(false)
    expect(origemValida({ width: 44, height: 44 } as DOMRect)).toBe(true)
  })

  it("o CommandInput repassa o cursor desenhado ao SearchInput, desligado por padrão", () => {
    expect(CODIGO).toContain("caret = false,")
    expect(CODIGO).toMatch(/<SearchInput[^]*?caret=\{caret\}[^]*?<CommandPrimitive\.Input/)
  })

  it("a página não diz mais que o Combobox monta a pilha", () => {
    expect(lerFonte("src/app/designsystem/docs/command.tsx")).not.toMatch(/o CommandDialog e o Combobox a montam/)
  })
})
