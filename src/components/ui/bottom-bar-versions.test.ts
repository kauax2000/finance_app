import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import { bottomBarVariants } from "./bottom-bar"

/** O `BottomBar` com o `Tabs` de referência. */

const CODIGO = semComentarios(lerFonte("src/components/ui/bottom-bar.tsx"), "linha-inteira")
const FRAME = lerFonte("src/app/designsystem/ds-frame.tsx")

describe("o desenho do Tabs", () => {
  it("a pílula tem um anel só, o das Tabs, e nenhuma borda", () => {
    expect(CODIGO).toContain('"mobile-glass-surface shadow-lg ring-1 ring-foreground/10"')
    expect(CODIGO).not.toMatch(/mobile-glass-surface border/)
  })

  it("o marcador é a tecla em relevo, 2px para dentro, num tom que o conteúdo não usa", () => {
    expect(CODIGO).toContain('"bg-(--bottom-bar-key) ring-1 ring-foreground/10 shadow-sm"')
    expect(CODIGO).toContain("const RECUO_DO_MARCADOR = 2")
    // Não é `--muted`: o fundo das linhas que passam por trás dá ~1,09:1 sobre uma linha.
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
    // O marcador das duas é um hook só, `useMarcador`.
    expect(CODIGO).toContain('import { useMarcador } from "@/hooks/use-marcador"')
    expect(lerFonte("src/components/ui/tabs.tsx")).toContain('import { useMarcador } from "@/hooks/use-marcador"')
    // Só quando o item muda: redimensionar só reposiciona.
    expect(lerFonte("src/hooks/use-marcador.ts")).toContain("antes.el !== ativa")
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
    expect(CODIGO).toContain('acompanhar: labels === "active" ? abrirRotulo : undefined')
    expect(lerFonte("src/hooks/use-marcador.ts")).toContain("antes.el === ativa ? 0 :")
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
    const css = lerFonte("src/app/globals.css")
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
    expect(lerFonte("src/app/designsystem/docs/bottom-bar.tsx")).toContain("<IphoneFrame>")
    expect(lerFonte("src/app/designsystem/docs/touch-safe-area.tsx")).toContain("<IphoneBody")
  })

  it("o + do app é o BottomBarAction", () => {
    expect(lerFonte("src/components/layout/quick-actions.tsx")).toContain('<BottomBarAction label="Adicionar">')
  })
})

// A régua do BottomBar. O `CODIGO` daqui tira todo comentário, e o de cima só as linhas
// inteiras.
{
  /**
   * A régua da barra de baixo, trancada: o token de margem declarado e sem leitor, o
   * `duration-300 ease-out` fora da escala, as abas sem `hover:`/`focus-visible:`, a tinta do
   * ativo em `--primary-foreground`, o `grid-cols-4` cravado no consumidor e os `!important` do
   * FAB anulando a tecla do `primary`. Zero render: tudo lê o `cva` e o fonte sem comentários.
   */

  const CODIGO = semComentarios(lerFonte("src/components/ui/bottom-bar.tsx"))
  /** A medição e a viagem moram no hook que o Tabs e o ToggleGroup dividem. */
  const MARCADOR = semComentarios(lerFonte("src/hooks/use-marcador.ts"))

  const CSS = lerFonte("src/app/globals.css")

  const alturaEm = (classes: string) => {
    const m = classes.match(/\[--bottom-bar-h:([\d.]+)rem\]/)
    return m ? Number(m[1]) : NaN
  }

  const ROTULOS = [false, true] as const

  describe("régua do BottomBar", () => {
    it("1. os degraus são degraus, e nenhum par produz a mesma string", () => {
      const strings = ROTULOS.map((labels) => bottomBarVariants({ labels }))

      const alturas = strings.map(alturaEm)
      expect(alturas).toEqual([3.5, 4])
    })

    it("2. o padrão é declarado uma vez", () => {
      expect(bottomBarVariants({})).toBe(
        bottomBarVariants({ labels: false, shape: "island" })
      )
    })

    it("3. a reserva conta a margem duas vezes, e inclui a área segura", () => {
      const bloco = CSS.match(/--bottom-bar-pad:\s*calc\(([^;]+)\);/)
      expect(bloco, "--bottom-bar-pad não foi declarado").not.toBeNull()
      const conta = bloco![1].replace(/\s+/g, " ")

      // A barra tem folga **em cima e embaixo**: a conta antiga
      // (`altura + margem + safe`) reservava a margem uma vez só.
      expect(conta).toMatch(/var\(--bottom-bar-margin\)\s*\*\s*2/)
      expect(conta).toContain("env(safe-area-inset-bottom, 0px)")
      expect(conta).toContain("3.5rem")

      // E a altura não volta a ser token: ela é o degrau do eixo.
      expect(CSS).not.toMatch(/--bottom-bar-h\s*:/)
      // Os nomes antigos não voltam pela porta dos fundos.
      expect(CSS).not.toContain("--mobile-nav-island")
      expect(CSS).not.toContain("--mobile-bottom-pad")
    })

    it("4. a camada vem da escala, e não há z cru", () => {
      const base = bottomBarVariants({})
      expect(base).toContain("z-(--z-modal)")
      expect(base).not.toMatch(/\bz-(?:\d|\[)/)
    })

    it("5. o vidro é o da folha, e a peça não escreve o próprio borrão", () => {
      expect(CODIGO).toContain("MOBILE_GLASS_SURFACE_CLASSNAME")
      expect(CODIGO).not.toMatch(/\bbackdrop-blur/)
      expect(CODIGO).not.toMatch(/\bbackdrop-filter/)

      // O anel mora dentro da constante importada, e não neste arquivo: a asserção
      // `not.toMatch(/ring-1\s+ring-border/)` media a chamada e passava sem ser verdade. A
      // borda é branca (1,007 contra a pílula no claro), e quem desenha a aresta é o anel. O
      // que se tranca é a peça vestir a receita compartilhada em vez de reescrevê-la.
    })

    it("6. a margem vem do token nos três lados, sem literal", () => {
      expect(bottomBarVariants({})).toMatch(
        /pb-\[calc\(var\(--bottom-bar-margin\)\+var\(--bottom-bar-safe,0px\)\)\]/
      )
      expect(CODIGO).toContain("mx-(--bottom-bar-margin)")
      expect(CODIGO).not.toMatch(/\bmx-4\b/)
      expect(CODIGO).not.toContain("0.5rem")
    })

    it("7. todo hover: da barra tem o par active:", () => {
      const hovers = [...CODIGO.matchAll(/(?<!dark:)\bhover:([a-z-]+)/g)].map(
        (m) => m[1]
      )
      expect(hovers.length).toBeGreaterThan(0)
      for (const propriedade of new Set(hovers)) {
        expect(
          CODIGO,
          `hover:${propriedade} sem par active: — no dedo isso não existe`
        ).toMatch(new RegExp(`\\bactive:${propriedade}`))
      }
    })

    it("8. o item traz o próprio anel de foco", () => {
      expect(CODIGO).toContain("focus-visible:ring-3")
      expect(CODIGO).toContain("focus-visible:ring-ring/45")
    })

    it("9. o movimento sai da escala", () => {
      expect(CODIGO).toMatch(/duration-\(--duration-(?:instant|fast|base|slow)\)/)
      expect(CODIGO).toMatch(/ease-\(--ease-(?:out|emphasized)\)/)
      expect(CODIGO).not.toMatch(/\bduration-\d/)
      // O `(?<![-(])` é o que separa a forma crua (`ease-out`) do token
      // (`ease-(--ease-out)`): sem ele a asserção acusa o próprio conserto.
      expect(CODIGO).not.toMatch(/(?<![-(])ease-(?:linear|out|in)\b/)
      // `transition-all` traz junto o que ninguém pediu.
      expect(CODIGO).not.toContain("transition-all")
    })

    it("10. a ação lê a altura da barra, e não há !important", () => {
      expect(CODIGO).toContain("size-(--bottom-bar-h)")
      expect(CODIGO).not.toMatch(/!(?:bg|border|text|shadow)-/)
      // Ela não declara cor: quem pinta é o `variant` do `Button`.
      expect(CODIGO).not.toMatch(/bottomBarActionClassName[\s\S]{0,200}bg-primary/)
      // E o afundamento é o da base, não um segundo.
      expect(CODIGO).not.toContain("active:scale")
    })

    it("11. a tinta do ativo é o foreground, nos dois temas", () => {
      // O fundo do ativo é a tecla, num tom próprio.
      expect(CODIGO).toMatch(/group-data-\[active\]\/bottom-bar-item:bg-\(--bottom-bar-key\)/)
      expect(CODIGO).toMatch(
        /group-data-\[active\]\/bottom-bar-item:text-foreground/
      )
      // `--primary-foreground` é a tinta de **sobre o preenchimento primário** —
      // e é só ali que ela aparece: no número da contagem, sobre `bg-primary`.
      const usos = CODIGO.match(/[\w:-]*primary-foreground/g) ?? []
      expect(usos).toEqual(["text-primary-foreground"])
      expect(CODIGO).toMatch(/bg-primary px-1 text-2xs[^"]*text-primary-foreground/)
    })

    it("13. as colunas derivam da contagem de filhos", () => {
      expect(CODIGO).toContain("React.Children.toArray")
      expect(CODIGO).toContain("--bottom-bar-cols")
      expect(CODIGO).toMatch(
        /grid-cols-\[repeat\(var\(--bottom-bar-cols\),minmax\(0,1fr\)\)\]/
      )
      // O número cravado era o defeito: acrescentar uma aba estourava a grade.
      expect(CODIGO).not.toMatch(/\bgrid-cols-\d/)
    })

    it("15. toda peça que recebe children os renderiza", () => {
      // `BottomBarTabs` destruturava `children` para **contar** as colunas e
      // fechava a `<div />` sem renderizá-los: a grade saía com as 4 colunas
      // certas e **vazia**. O `tsc` não viu, o `cva` não viu, e as outras catorze
      // asserções passaram nos dois estados — quem viu foi o navegador.
      const corpos = CODIGO.split(/\nfunction /).slice(1)
      const comChildren = corpos.filter((c) => /^\s*children,?\s*$/m.test(c))
      expect(comChildren.length).toBeGreaterThan(0)

      for (const corpo of comChildren) {
        const nome = corpo.slice(0, corpo.indexOf("("))
        expect(corpo, `${nome} destrutura children e não os renderiza`).toMatch(
          /\{children\}/
        )
      }
    })

    it("16. a aba ativa troca o glifo pelo sólido, e a grade não muda", () => {
      // A convenção de tab bar do iOS. O glifo é escolhido em JS — a peça não tem
      // como saber o sólido de um ícone qualquer, e adivinhar por nome quebraria
      // no build de produção, onde o nome da função é mangled.
      expect(CODIGO).toMatch(/iconActive/)
      expect(CODIGO).toMatch(/active && IconActive \? IconActive : Icon/)
      // Sem o par, a aba ativa continua de contorno em vez de sumir.
      expect(CODIGO).toContain("iconActive?: HeroIcon")

      // E a grade continua sendo 24 dos dois lados: a regra do conjunto compara o
      // número, e trocar de grade a 24px é que entregaria um desenho que não cabe.
      expect(CODIGO).not.toMatch(/heroicons\/react\/(?:16|20)/)
    })

    it("17. o marcador viaja com os tokens do sistema", () => {
      // Até o fim do elemento, e não 900 caracteres: o corte fixo entrava no
      // fallback do item, que carrega a mesma classe de propósito.
      const inicio = CODIGO.indexOf('data-slot="bottom-bar-marker"')
      expect(inicio).toBeGreaterThan(-1)
      const marcador = CODIGO.slice(inicio, CODIGO.indexOf("/>", inicio))
      for (const eixo of ["x", "y", "w", "h"]) {
        expect(marcador).toContain(`--bottom-bar-marker-${eixo}`)
      }
      // Ele não transiciona: viaja por WAAPI (`viajarLiquido`, o trajeto macio das abas), e o
      // repouso são as variáveis.
      expect(marcador).not.toContain("transition-")
      expect(CODIGO).toContain('prefixo: "bottom-bar-marker"')
      expect(MARCADOR).toContain("viajarLiquido(peca, de, para")
      expect(MARCADOR).toContain("trajeto: TRAJETO_MACIO")
      expect(marcador).not.toMatch(/\bduration-\d/)
      expect(marcador).not.toMatch(/\bease-\[/)
      // Camada negativa escaparia para trás da própria pílula.
      expect(marcador).not.toMatch(/-z-\d/)
    })

    it("18. a medição é em coordenada de conteúdo, por observador", () => {
      expect(MARCADOR).toContain("offsetLeft")
      expect(MARCADOR).toContain("offsetTop")
      for (const fonte of [CODIGO, MARCADOR]) {
        expect(fonte).not.toContain("getBoundingClientRect")
        expect(fonte).not.toContain("requestAnimationFrame")
      }
      expect(MARCADOR).toContain("new ResizeObserver")
      expect(MARCADOR).toContain("new MutationObserver")
      expect(CODIGO).toContain('atributos: ["data-active", "data-scrub"]')
    })

    it("19. o item fica por cima, e o fallback é trocado por contexto", () => {
      // Sem `relative` o item estático pinta antes do marcador posicionado, e o
      // marcador cobre o ícone — calado, sem tsc nem teste acusarem.
      expect(CODIGO).toMatch(/group\/bottom-bar-item relative/)

      // O marcador é declarado antes dos filhos: é a ordem que o põe atrás.
      const tabs = CODIGO.slice(CODIGO.indexOf("function BottomBarTabs("))
      expect(tabs.indexOf('data-slot="bottom-bar-marker"')).toBeGreaterThan(-1)
      expect(tabs.indexOf('data-slot="bottom-bar-marker"')).toBeLessThan(
        tabs.indexOf("{children}")
      )

      // Fallback por contexto, e o alfa é o mesmo do marcador (a troca não pisca).
      expect(CODIGO).toContain("BottomBarMarkerContext")
      expect(CODIGO).toMatch(/!temMarcador && itemFallbackClassName/)
      const fallback = CODIGO.slice(CODIGO.indexOf("const itemFallbackClassName"))
        .slice(0, 300)
      // A mesma tecla do marcador: o tom próprio, o anel e a sombra.
      expect(fallback).toContain("bg-(--bottom-bar-key)")
      expect(fallback).toContain("ring-foreground/10")
      expect(fallback).toContain("shadow-sm")
      // O miolo não pinta mais o fundo do ativo: quem pinta é o marcador.
      // Cortado no fim do próprio array, e não por contagem de caracteres: 600
      // passava do `].join` e entrava no fallback, que carrega a classe de
      // propósito — a asserção acusava o conserto.
      const inicioMiolo = CODIGO.indexOf("const itemInnerClassName")
      const miolo = CODIGO.slice(
        inicioMiolo,
        CODIGO.indexOf('].join(" ")', inicioMiolo)
      )
      expect(miolo).not.toMatch(/group-data-\[active\]\/bottom-bar-item:bg-/)
    })

    it("14. o rótulo desce por contexto, e nunca por in-*", () => {
      // `in-*` compila com `:where()`, que não soma especificidade: contra o
      // `hidden` do próprio elemento, quem decidiria seria a ordem de emissão.
      expect(CODIGO).not.toMatch(/\bin-data-/)
      expect(CODIGO).toContain("React.createContext")
      expect(CODIGO).toContain("React.useContext")
    })
  })
}
