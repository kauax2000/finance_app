import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { TOOLBAR_SIZES, toolbarClassName } from "./toolbar"

/** A rodada 229: a barra presa, a placa, a escada, as peças e o teclado. */

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")
const FONTE = fonte("src/components/ui/toolbar.tsx")
const CODIGO = FONTE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome)
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho]
  })
}

describe("a escada", () => {
  it("sm 28 · md 32 · lg 36, e o piso do dedo continua 40 nos três", () => {
    expect(TOOLBAR_SIZES).toEqual({ sm: 28, md: 32, lg: 36 })
    expect(CODIGO).toContain('sm: "[--toolbar-control:--spacing(7)]"')
    expect(CODIGO).toContain('lg: "[--toolbar-control:--spacing(9)]"')
    expect(toolbarClassName).toContain("pointer-coarse:[--toolbar-control:--spacing(10)]")
  })

  it("o controle filho direto de uma peça lê a altura — escrito por extenso, sem template literal", () => {
    for (const slot of ["select-trigger", "combobox-trigger", "search-input"]) {
      expect(CODIGO).toContain(`>[data-slot=${slot}]]:h-(--toolbar-control)`)
    }
    expect(CODIGO).toContain(">[data-slot=button]:not([data-size^=icon])]:h-(--toolbar-control)")
    expect(CODIGO).toContain(">[data-slot=button][data-size^=icon]]:size-(--toolbar-control)")
    // O Tailwind lê o fonte como texto: classe montada não chega ao CSS.
    expect(CODIGO).not.toMatch(/`\[\$\{/)
    // Filho direto, e não descendente: o × da busca e o da ficha ficam fora.
    expect(CODIGO).not.toContain("[&_[data-slot=button]]")
  })

  it("não há divisor nem grupo: saíram a pedido do dono", () => {
    expect(CODIGO).not.toContain("ToolbarSeparator")
    expect(CODIGO).not.toContain("ToolbarGroup")
    expect(CODIGO).not.toContain("toolbar-group")
  })

  it("o menor fica por fora: a ordem é do DOM, sem order de CSS", () => {
    expect(CODIGO).not.toMatch(/\border-(?:first|last|-?\d)/)
  })

  it("o degrau desce aos botões pelo ButtonSizeContext", () => {
    expect(CODIGO).toContain("<ButtonSizeContext.Provider value={size}>")
  })
})

describe("as superfícies", () => {
  it("não há placa flutuante: a barra é a linha solta, e só presa ganha superfície", () => {
    expect(CODIGO).not.toContain("menuPanelTintClassName")
    expect(CODIGO).not.toContain("floating")
  })

  it("presa: abaixo da barra do topo, a placa só presa e sem mudar a altura", () => {
    expect(CODIGO).toContain("sticky top-[calc(var(--toolbar-top,0px)+--spacing(2))] z-(--z-sticky)")
    expect(CODIGO).toContain("barSurfaceClassName")
    expect(CODIGO).toContain("absolute -inset-y-2")
    expect(CODIGO).toContain("group-data-stuck/toolbar:opacity-100")
    // Num contêiner arredondado a placa segue o raio de dentro dele: o vidro
    // escapa do recorte arredondado no Chrome, e os cantos vazavam.
    expect(CODIGO).toContain("rounded-t-(--toolbar-plate-r,0px)")
    expect(CODIGO).toContain('el.style.setProperty("--toolbar-plate-r"')
    // A medição é a da TopBar, dividida com o Toaster.
    expect(CODIGO).toContain("useTopBarBottom(Boolean(sticky), undefined, raiz)")
  })

  it("some ao rolar só no telefone, e nunca com o foco dentro", () => {
    expect(CODIGO).toContain("max-md:data-hidden:-translate-y-[calc(100%+--spacing(4))]")
    expect(CODIGO).toContain("el.contains(doc.activeElement)")
  })
})

describe("o teclado", () => {
  // Desde a rodada 245 o foco itinerante mora num hook que o `FilterBar` divide.
  const TECLADO = fonte("src/hooks/use-toolbar-keyboard.ts")

  it("o papel só vem com o comportamento", () => {
    expect(CODIGO).toContain('role={keyboard ? "toolbar" : undefined}')
    expect(CODIGO).toContain("useToolbarKeyboard(raiz, keyboard)")
    expect(TECLADO).toContain('e.key === "ArrowRight"')
    expect(TECLADO).toContain('e.key === "Home"')
  })

  it("campo de texto guarda as setas, e o Tabs cuida das dele", () => {
    expect(TECLADO).toContain('alvo.matches("input:not([type=checkbox]):not([type=radio]), textarea, select")')
    expect(TECLADO).toContain("if (e.defaultPrevented")
    expect(TECLADO).toContain('if (n.getAttribute("role") === "tab") continue')
  })
})

describe("as peças", () => {
  it("o botão que encolhe guarda o rótulo como nome, e a maiúscula do CTA", () => {
    expect(CODIGO).toContain('<span data-slot="button-label" className={cn(collapse && "max-md:sr-only")}>')
    expect(CODIGO).toContain('collapse && "max-md:w-(--toolbar-control,--spacing(8)) max-md:px-0"')
    // O que vem depois do rótulo some com ele; a marca fica no botão quadrado.
    expect(CODIGO).toContain('<span className="contents max-md:hidden">{children}</span>')
  })

  it("o botão de filtros: contagem rotulada, ponto no telefone, estado no nome", () => {
    expect(CODIGO).toContain("`${label} — ${count} ${count === 1 ? \"ativo\" : \"ativos\"}`")
    expect(CODIGO).toContain('<Badge aria-hidden size="xs" className="nums">')
    expect(CODIGO).toContain('marker={ligado ? <ToolbarFilterIndicator className="md:hidden" /> : null}')
  })

  it("as fichas são uma linha própria, e a contagem é região viva", () => {
    expect(CODIGO).toContain('"flex basis-full flex-wrap items-center gap-1.5"')
    expect(CODIGO).toContain('role="status"')
    expect(CODIGO).toContain('shortcut = "/"')
  })

  it("o ⋯ clica o próprio botão, não tira a última ação nem um gatilho de menu", () => {
    expect(CODIGO).toContain("onSelect={() => f.el.click()}")
    // O item leva o ícone do botão (uma cópia do svg) e a maiúscula do rótulo.
    expect(CODIGO).toContain("{f.icone ? <IconeCopiado svg={f.icone} /> : null}")
    expect(CODIGO).toContain('icone: f.querySelector("svg")')
    expect(CODIGO).toContain("label: maiuscula(")
    expect(CODIGO).toContain("i === filhos.length - 1")
    expect(CODIGO).toContain('f.hasAttribute("aria-haspopup")')
    // O grupo flex-1 é medido pelo conteúdo, não pela sobra.
    expect(CODIGO).toContain('f.style.flex = "0 0 auto"')
  })
})

describe("o app", () => {
  it("nenhuma barra escreve a altura de um controle à mão com md:", () => {
    const telas = arquivos(join(process.cwd(), "src"))
      .filter((f) => /\.tsx$/.test(f) && !f.includes("/components/ui/") && !f.includes("/designsystem/"))
      .filter((f) => readFileSync(f, "utf8").includes('from "@/components/ui/toolbar"'))
    expect(telas.length).toBeGreaterThan(4)
    for (const f of telas) {
      expect(readFileSync(f, "utf8"), f).not.toMatch(/md:size-auto md:h-\(--toolbar-control\)/)
    }
  })
})
