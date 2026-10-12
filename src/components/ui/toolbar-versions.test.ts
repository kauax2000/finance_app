import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import {
  TOOLBAR_SIZES,
  toolbarClassName,
  TOOLBAR_CONTROL_HEIGHTS,
  toolbarControlClassName,
  toolbarFilterIndicatorClassName,
  toolbarIconControlClassName,
  toolbarRowClassName,
} from "./toolbar"

/** A rodada 229: a barra presa, a placa, a escada, as peças e o teclado. */

const FONTE = lerFonte("src/components/ui/toolbar.tsx")
const CODIGO = semComentarios(FONTE, "linha-inteira")

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
  const TECLADO = lerFonte("src/hooks/use-toolbar-keyboard.ts")

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
    expect(CODIGO).toContain("onSelect: () => f.click()")
    // O item leva o ícone do botão (uma cópia do svg) e a maiúscula do rótulo.
    const MENU = lerFonte("src/lib/overflow-menu.tsx")
    expect(MENU).toContain("{f.icone ? <IconeCopiado svg={f.icone} /> : null}")
    expect(MENU).toContain("{maiuscula(f.label)}")
    expect(CODIGO).toContain('icone: f.querySelector("svg")')
    // Saem do começo; a última fica, e um gatilho de menu não pode sair.
    expect(CODIGO).toContain('ponta: "inicio"')
    expect(CODIGO).toContain("fixos: new Set([filhos.length - 1])")
    expect(CODIGO).toContain('!filhos[i].hasAttribute("aria-haspopup")')
    // O grupo flex-1 é medido pelo conteúdo, não pela sobra.
    expect(CODIGO).toContain('f.style.flex = "0 0 auto"')
  })
})

describe("o app", () => {
  it("nenhuma barra escreve a altura de um controle à mão com md:", () => {
    const telas = arquivos(join(process.cwd(), "src"))
      .filter((f) => /\.tsx$/.test(f) && !f.includes("/components/ui/") && !f.includes("/designsystem/"))
      .filter((f) => lerFonte(f).includes('from "@/components/ui/toolbar"'))
    expect(telas.length).toBeGreaterThan(4)
    for (const f of telas) {
      expect(lerFonte(f), f).not.toMatch(/md:size-auto md:h-\(--toolbar-control\)/)
    }
  })
})

/**
 * A densidade da barra, trancada.
 *
 * A asserção que de fato vale é a de número 2, e ela é descendente direta do
 * teste do `Tabs` ("a lista não declara altura nenhuma"): quatro rodadas da
 * história deste design system são um contêiner nomeando a altura de um
 * controle — `Menubar` entregou 24px, `Tabs` entregou 27, `Item` teve dois
 * degraus com a mesma string, `Calendar` prometeu 36 e mediu 28.
 */
const ESCADA = { xs: 24, sm: 28, md: 32, lg: 36, xl: 40 } as const

/** `\b` casaria dentro de `min-h-11`; `h-full` não é medida da escada. */
const DECLARA_ALTURA = /(?:^|\s)(?:min-)?h-(?!full\b)/

const PECAS = [
  toolbarRowClassName,
  toolbarControlClassName,
  toolbarIconControlClassName,
  toolbarFilterIndicatorClassName,
]

describe("densidade do Toolbar", () => {
  it("1. os dois degraus têm nome na escada do sistema", () => {
    const degraus = Object.values(ESCADA)
    expect(degraus).toContain(TOOLBAR_CONTROL_HEIGHTS.fine)
    expect(degraus).toContain(TOOLBAR_CONTROL_HEIGHTS.coarse)
    expect([TOOLBAR_CONTROL_HEIGHTS.fine, TOOLBAR_CONTROL_HEIGHTS.coarse]).toEqual([
      ESCADA.md,
      ESCADA.xl,
    ])
  })

  it("2. a raiz não declara altura nenhuma — ela declara a dos filhos", () => {
    expect(toolbarClassName).not.toMatch(DECLARA_ALTURA)
    expect(toolbarClassName).not.toMatch(/(?:^|\s)size-\d/)
  })

  it("3. a variável é declarada só na raiz", () => {
    expect(toolbarClassName).toContain("[--toolbar-control:")
    for (const peca of PECAS) {
      expect(peca).not.toContain("[--toolbar-control:")
    }
  })

  it("4. as réguas leem a variável, e mais nada", () => {
    expect(toolbarControlClassName).toBe("h-(--toolbar-control)")
    expect(toolbarIconControlClassName).toBe("size-(--toolbar-control)")
    expect(toolbarControlClassName).not.toContain("md:")
    expect(toolbarIconControlClassName).not.toContain("md:")
  })

  it("5. nenhuma altura literal sobreviveu no fonte", () => {
    // `--spacing(8)` e `--spacing(10)` são a declaração da variável, não uma
    // classe de altura — por isso a borda de palavra em `-`.
    expect(CODIGO).not.toMatch(/(?:^|\s|:)(?:md:)?(?:h|size)-(?:8|9|10|11)\b/)
  })

  it("6. uma margem automática, e ela é lógica", () => {
    // Duas `ms-auto` na mesma linha dividem a sobra em partes iguais em vez de
    // empurrar a segunda para a borda — a medição do `AccordionTrigger`.
    expect(CODIGO.match(/\bm[sleritxy]?-auto\b/g)).toEqual(["ms-auto"])
    expect(CODIGO).not.toContain("ml-auto")
  })

  it("7. a raiz não declara `justify-*` — as 4 grafias não voltam por ali", () => {
    expect(toolbarClassName).not.toMatch(/\bjustify-/)
  })

  it("8. `role=\"toolbar\"` não é carimbado", () => {
    expect(CODIGO).not.toContain('role="toolbar"')
  })

  it("9. o ponto não pinta hover, e não intercepta o ponteiro", () => {
    expect(toolbarFilterIndicatorClassName).toContain("pointer-events-none")
    expect(toolbarFilterIndicatorClassName).not.toContain("hover:")
    // Traço/marca que precisa ser vista contra a página é acento, não fill.
    expect(toolbarFilterIndicatorClassName).toContain("bg-primary-accent")
  })

  it("10. o indicador cabe dentro do canto arredondado, e sai da frente do ícone", () => {
    // A geometria, trancada em aritmética — foi ela que originou esta rodada, e
    // a primeira medição a leu ao contrário (confundiu folga com sobreposição).
    const RAIO = 10 // `rounded-lg` do Button, medido
    const BORDA = 1
    const DIAMETRO = 8 // `size-2`
    const ancora = Number(
      /top-(\d+(?:\.\d+)?)/.exec(toolbarFilterIndicatorClassName)?.[1]
    )
    expect(ancora).toBe(1)
    expect(toolbarFilterIndicatorClassName).toContain("right-1 ")
    expect(toolbarFilterIndicatorClassName).toContain("size-2")

    const px = ancora * 4 + BORDA // do canto da caixa de borda
    const centro = px + DIAMETRO / 2
    const distAoCentroDoArco = Math.hypot(RAIO - centro, RAIO - centro)
    const folgaAteACurva = RAIO - (distAoCentroDoArco + DIAMETRO / 2)

    // Dentro do botão: a borda do ponto não alcança a curva.
    expect(folgaAteACurva).toBeGreaterThan(0)
    expect(+folgaAteACurva.toFixed(2)).toBe(4.59)

    // E longe o bastante do ícone no botão de 40 (o do telefone, onde esta
    // peça vive). No de 32 a invasão seria de 5px — por isso ela é documentada
    // como marca de botão sem rótulo na barra do telefone, e não em geral.
    const invasaoDoIcone = px + DIAMETRO - (40 - 16) / 2
    expect(invasaoDoIcone).toBeLessThanOrEqual(1)
  })

  it("11. a pergunta é o ponteiro, e não a largura", () => {
    // "A linha do menu cresce no toque, não no telefone." O `Calendar` já
    // resolve assim: `pointer-coarse:[--cell-size:--spacing(11)]`.
    expect(toolbarClassName).toContain("pointer-coarse:[--toolbar-control:")
    expect(toolbarClassName).not.toMatch(/md:\[--toolbar-control:/)
  })
})
