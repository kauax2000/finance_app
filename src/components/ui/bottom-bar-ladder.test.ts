import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { bottomBarVariants } from "./bottom-bar"

/**
 * A régua da barra de baixo, trancada.
 *
 * Ela nasceu de **seis arquivos** em `components/layout/` sem um teste sequer,
 * e cada defeito medido virou uma asserção: o token de margem declarado e sem
 * leitor (a ilha escrevia `mx-4` e `0.5rem` literais, e a reserva contava a
 * margem uma vez só), o `duration-300 ease-out` fora da escala, as abas sem
 * `hover:` e sem `focus-visible:`, a tinta do ativo em `--primary-foreground`
 * (o token de *sobre o preenchimento primário*, sobre um fundo `foreground/12`),
 * o `grid-cols-4` cravado no consumidor, e os **seis `!important`** do FAB
 * anulando a tecla que o `primary` virou na rodada 78.
 *
 * Zero render: tudo lê o `cva` e o fonte **sem comentários** — a prosa do
 * arquivo cita de propósito o que ele deixou de fazer, e uma varredura ingênua
 * se acusaria sozinha.
 */

const CODIGO = readFileSync(
  join(process.cwd(), "src/components/ui/bottom-bar.tsx"),
  "utf8"
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "")

const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")

const alturaEm = (classes: string) => {
  const m = classes.match(/\[--bottom-bar-h:([\d.]+)rem\]/)
  return m ? Number(m[1]) : NaN
}

const ROTULOS = [false, true] as const

describe("régua do BottomBar", () => {
  it("1. os degraus são degraus, e nenhum par produz a mesma string", () => {
    const strings = ROTULOS.map((labels) => bottomBarVariants({ labels }))
    expect(new Set(strings).size).toBe(strings.length)

    const alturas = strings.map(alturaEm)
    expect(alturas).toEqual([3.5, 4])
    // Ligar o rótulo só pode **subir** a barra.
    expect(alturas[1]).toBeGreaterThan(alturas[0])
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

    // Aqui havia um `not.toMatch(/ring-1\s+ring-border/)`, e ele **passava sem
    // ser verdade**: o anel mora dentro da constante importada, não neste
    // arquivo — a asserção media a chamada, e não o resultado. Quem viu foi o
    // navegador. O anel fica: a borda é branca e mede **1,007** contra a pílula
    // no tema claro — ali quem desenha a aresta é o anel, e no escuro a conta
    // se inverte. O que sobra a trancar é a peça **vestir** a receita
    // compartilhada em vez de reescrevê-la, que é a linha acima.
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
    expect(CODIGO).toContain("focus-visible:ring-ring/70")
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
    expect(CODIGO).toMatch(/group-data-\[active\]\/bottom-bar-item:bg-foreground/)
    expect(CODIGO).toMatch(
      /group-data-\[active\]\/bottom-bar-item:text-foreground/
    )
    // `--primary-foreground` é a tinta de **sobre o preenchimento primário**.
    expect(CODIGO).not.toContain("primary-foreground")
  })

  it("12. nenhuma classe é montada em tempo de execução", () => {
    // O Tailwind varre o código como texto: uma classe interpolada nunca chega
    // ao CSS. Esta base já pagou a medição cinco vezes.
    //
    // O que se proíbe é **classe**, e não template literal: o marcador escreve
    // a própria caixa em `setProperty("--bottom-bar-marker-x", `${…}px`)`, que
    // é valor de variável em runtime — o que o `Tabs` e a `Sidebar` fazem.
    // Essas linhas saem antes da varredura; qualquer outra interpolação reprova.
    const semValoresDeVariavel = CODIGO.replace(/^.*\.setProperty\(.*$/gm, "")
    expect(semValoresDeVariavel).not.toMatch(/`[^`]*\$\{[^}]*\}[^`]*`/)
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
    const marcador = CODIGO.slice(CODIGO.indexOf('data-slot="bottom-bar-marker"'))
      .slice(0, 900)
    for (const eixo of ["x", "y", "w", "h"]) {
      expect(marcador).toContain(`--bottom-bar-marker-${eixo}`)
    }
    expect(marcador).toContain("transition-[translate,width,height]")
    expect(marcador).toContain("duration-(--duration-base)")
    expect(marcador).toContain("ease-(--ease-out)")
    expect(marcador).not.toMatch(/\bduration-\d/)
    expect(marcador).not.toMatch(/\bease-\[/)
    // Camada negativa escaparia para trás da própria pílula.
    expect(marcador).not.toMatch(/-z-\d/)
  })

  it("18. a medição é em coordenada de conteúdo, por observador", () => {
    expect(CODIGO).toContain("offsetLeft")
    expect(CODIGO).toContain("offsetTop")
    expect(CODIGO).not.toContain("getBoundingClientRect")
    expect(CODIGO).not.toContain("requestAnimationFrame")
    expect(CODIGO).toContain("new ResizeObserver")
    expect(CODIGO).toContain("new MutationObserver")
    expect(CODIGO).toMatch(/attributeFilter:\s*\["data-active"\]/)
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
    expect(fallback).toContain("bg-foreground/10")
    expect(fallback).toContain("bg-foreground/12")
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
