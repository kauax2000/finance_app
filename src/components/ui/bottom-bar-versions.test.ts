import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { bottomBarVariants } from "./bottom-bar"

/** A rodada 230: o `BottomBar` com o `Tabs` de referência. */

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")
const CODIGO = fonte("src/components/ui/bottom-bar.tsx")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "")
const VIDRO = fonte("src/lib/mobile-glass-surface.ts")
const FRAME = fonte("src/app/designsystem/ds-frame.tsx")

describe("o desenho do Tabs", () => {
  it("a pílula tem um anel só, o das Tabs, e nenhuma borda", () => {
    expect(VIDRO).toContain('"mobile-glass-surface shadow-lg ring-1 ring-foreground/10"')
    expect(VIDRO).not.toMatch(/mobile-glass-surface border/)
  })

  it("o marcador é a tecla em relevo, 2px para dentro, num tom que o conteúdo não usa", () => {
    expect(CODIGO).toContain('"bg-(--bottom-bar-key) ring-1 ring-foreground/10 shadow-sm"')
    expect(CODIGO).toContain("const RECUO_DO_MARCADOR = 2")
    // Era `--muted` — o fundo das linhas que passam por trás: ~1,09:1 sobre uma linha.
    expect(CODIGO).toContain('"[--bottom-bar-key:color-mix(in_oklab,var(--foreground)_12%,var(--popover))]"')
    expect(CODIGO).toContain('"dark:[--bottom-bar-key:color-mix(in_oklab,var(--foreground)_18%,var(--popover))]"')
    // A pílula mais densa, redeclarada só aqui: a gaveta e o menu ficam no token.
    expect(CODIGO).toContain('"[--mobile-glass-bg:color-mix(in_oklab,var(--popover)_82%,transparent)]"')
    const marcador = CODIGO.slice(CODIGO.indexOf('data-slot="bottom-bar-marker"'))
    expect(marcador.slice(0, 600)).not.toContain("bg-muted")
  })

  it("glass é o vidro do TabsList, sobre o mesmo tom da tecla", () => {
    expect(CODIGO).toContain('[glassControlSurfaceClassName, "shadow-sm [--glass-tone:var(--bottom-bar-key)]"]')
  })

  it("e viaja líquido, com o trajeto que as Tabs dividem", () => {
    expect(CODIGO).toContain('import { TRAJETO_MACIO, viajarLiquido, type CaixaLiquida } from "@/lib/liquid-move"')
    expect(fonte("src/components/ui/tabs.tsx")).toContain("const TRAJETO_DAS_ABAS = TRAJETO_MACIO")
    // Só quando o item muda: redimensionar só reposiciona.
    expect(CODIGO).toContain("antes.el !== alvo")
  })

  it("a ação é da mesma família: o anel e a sombra da pílula", () => {
    expect(CODIGO).toContain('"size-(--bottom-bar-h) shrink-0 rounded-full p-0 ring-1 ring-foreground/10 shadow-lg"')
  })

  it("rótulo só na ativa: 56 de altura, e as outras nunca abaixo de 44", () => {
    expect(bottomBarVariants({ labels: "active" })).toContain("[--bottom-bar-h:3.5rem]")
    expect(CODIGO).toContain('"w-auto min-w-11 flex-auto"')
  })

  it("o rótulo abre no relógio do marcador: a largura anda, não salta", () => {
    // Montado em todas as abas e fechado nas inativas — é a largura dele que anima.
    expect(CODIGO).toContain('cn("block min-w-0 overflow-hidden", !ativo && "w-0 opacity-0")')
    expect(CODIGO).toContain('[{ width: "0px", opacity: 0 }, { width: final + "px", opacity: 1 }]')
    expect(CODIGO).toContain("{ ...TRAJETO_MACIO, fill: \"none\" }")
    // Só o rótulo mudou (depois do arraste): o marcador acompanha sem esticar.
    expect(CODIGO).toContain("antes.el === alvo ? 0 :")
  })
})

describe("as peças", () => {
  it("a contagem é aria-hidden e o número entra no nome", () => {
    expect(CODIGO).toMatch(/aria-hidden\s+data-slot="bottom-bar-count"/)
    expect(CODIGO).toContain('{count > 99 ? "99+" : count}')
    expect(CODIGO).toContain("aria-label={nomeComContagem(ariaLabel ?? label, count, countLabel)}")
  })

  it("a aba sem href é um botão com aria-pressed", () => {
    expect(CODIGO).toContain("aria-pressed={active ?? false}")
  })

  it("a ação tem o nome obrigatório, e o esqueleto ocupa o mesmo lugar", () => {
    expect(CODIGO).toMatch(/function BottomBarAction\([\s\S]*?label: string/)
    expect(CODIGO).toContain('data-slot="bottom-bar-skeleton" className={cn(bottomBarVariants({ labels }), className)}')
  })
})

describe("os comportamentos", () => {
  it("o arraste começa a 8px e acha o item pelo documento da pílula", () => {
    expect(CODIGO).toContain("if (Math.abs(e.clientX - s.x0) < 8) return")
    expect(CODIGO).toContain("trilha?.ownerDocument.elementFromPoint(x, y)")
    // `instanceof HTMLElement` diz falso para um nó do iframe do catálogo.
    expect(CODIGO).not.toContain("instanceof HTMLElement")
    expect(CODIGO).toContain("touch-pan-y")
  })

  it("tocar na ativa sobe ao topo de quem rolou por último", () => {
    expect(CODIGO).toContain("subirAoTopo()")
    expect(CODIGO).toContain("ultimo.current = alvo")
  })

  it("some ao rolar: a pílula e a ação afundam juntas, e nunca com o foco dentro", () => {
    expect(CODIGO).toContain("group-data-hidden/bottom-bar:translate-y-[calc(100%+var(--bottom-bar-margin)+var(--bottom-bar-safe,0px))]")
    expect(CODIGO).toContain("nav.contains(doc.activeElement)")
    // Sai devagar (ease-in-out) e volta na mola, as duas em 700ms.
    expect(CODIGO).toContain('"origin-bottom transition-[translate,scale,opacity] duration-(--duration-gentle) ease-(--ease-spring)"')
    expect(CODIGO).toContain('"group-data-hidden/bottom-bar:ease-(--ease-in-out)"')
    // A ação veste a mesma régua: uma ação sozinha no canto lê como esquecida.
    expect(CODIGO).toContain('cn("flex h-(--bottom-bar-h) shrink-0 items-center", someAoRolarClassName)')
    expect(CODIGO).toContain("group-data-hidden/bottom-bar:scale-95 group-data-hidden/bottom-bar:opacity-0")
    // Os dois tokens existem no tema, com o par de valores combinado.
    const css = fonte("src/app/globals.css")
    expect(css).toContain("--duration-gentle: 700ms;")
    expect(css).toContain("--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);")
  })

  it("o toque com mola, e o estalo só quando a aba passa a ativa", () => {
    expect(CODIGO).toContain("group-active/bottom-bar-item:scale-88")
    expect(CODIGO).toContain("if (!ativo || era || !el) return")
  })
})

describe("o catálogo e o app", () => {
  it("o iPhone é peça do ds-frame, com uma viewport de verdade e sem scale()", () => {
    expect(FRAME).toContain("function IphoneFrame(")
    expect(FRAME).toContain("<ViewportFrame")
    expect(fonte("src/app/designsystem/docs/bottom-bar.tsx")).toContain("<IphoneFrame>")
    expect(fonte("src/app/designsystem/docs/touch-safe-area.tsx")).toContain("<IphoneBody")
  })

  it("o + do app é o BottomBarAction", () => {
    expect(fonte("src/components/layout/quick-actions.tsx")).toContain('<BottomBarAction label="Adicionar">')
  })
})
