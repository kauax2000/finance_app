import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  ALTURA_CLASS,
  defaultTabsSize,
  TABS_SIZES,
  TABS_TRAY_HEIGHTS,
  TABS_TRIGGER_HEIGHTS,
  tabsIndicatorVariants,
  tabsListFrameVariants,
  tabsListTrackVariants,
  tabsTriggerVariants,
} from "./tabs"

/**
 * A escada do `Tabs`, trancada.
 *
 * Este teste existe por causa de um defeito específico e medido: o gatilho das
 * abas media **27px**. A lista era `h-9` (36) com `p-1` (8), o que deixa 28 de
 * caixa de conteúdo, e o gatilho era `h-[calc(100%-1px)]` — 27, um pixel abaixo
 * do piso da escada de controles do projeto.
 *
 * O que o deixou passar não foi a falta de teste; foi a **direção da âncora**.
 * Com a altura declarada no contêiner, a do gatilho é um resto de subtração, e
 * um resto de subtração não tem nome para ninguém conferir. É o mesmo defeito
 * que o `Menubar` teve (lá, 24px), e o conserto é o mesmo: a escada nomeia o
 * gatilho, e o contêiner cresce em volta.
 *
 * Por isso a asserção que de fato vale é a de número 4 — **a lista não pode
 * declarar altura nenhuma**. As outras são baratas e ficam; essa é a que
 * impediria a regressão de voltar pela mesma porta.
 *
 * Segue o idioma de `src/lib/tailwind-hover-policy.test.ts`: uma política do
 * design system trancada por asserção, e não por captura de tela.
 */

const SIZES = ["sm", "md", "lg", "xl"] as const
const VARIANTS = ["solid", "underline", "plain"] as const

/** O piso da escada de controles: `xs` (24) é para dentro de outro controle. */
const PISO = 28

/** `(?:^|\s)` e não `\b`: `\b` casaria dentro de `min-h-11`. */
const DECLARA_ALTURA = /(?:^|\s)h-(?!full\b)/

describe("a escada mede a bandeja", () => {
  it("a bandeja nunca desce do piso de 28 — o gatilho pode, e deve", () => {
    for (const size of SIZES) {
      // A bandeja é o controle que se posiciona: ela respeita o piso.
      expect(TABS_TRAY_HEIGHTS[size]).toBeGreaterThanOrEqual(PISO)
    }
    // O gatilho de `sm` cai a 24 — o degrau `xs`, que a escada do sistema
    // reserva justamente para "dentro de outro controle". É onde ele está.
    expect(TABS_TRIGGER_HEIGHTS.sm).toBe(24)
  })

  it("degraus de 4px, estritamente crescentes", () => {
    const alturas = SIZES.map((s) => TABS_TRAY_HEIGHTS[s])
    for (let i = 1; i < alturas.length; i++) {
      expect(alturas[i] - alturas[i - 1]).toBe(4)
    }
  })

  it("os nomes batem com os do resto do sistema", () => {
    // A **bandeja** é o que `Button`, `Input`, `SelectTrigger` e
    // `NativeSelect` chamam pelos mesmos nomes — porque é ela a caixa que um
    // layout posiciona. O gatilho é peça interna e deriva.
    expect(TABS_TRAY_HEIGHTS).toEqual({ sm: 28, md: 32, lg: 36, xl: 40 })
    expect(TABS_TRIGGER_HEIGHTS).toEqual({ sm: 24, md: 28, lg: 32, xl: 36 })
  })

  it("o gatilho declara a classe de altura da sua derivada", () => {
    const classe = { 24: "h-6", 28: "h-7", 32: "h-8", 36: "h-9" } as const
    for (const size of SIZES) {
      expect(tabsTriggerVariants({ size })).toContain(
        classe[TABS_TRIGGER_HEIGHTS[size]]
      )
    }
  })
})

describe("quem declara a altura é a moldura", () => {
  /**
   * Esta asserção era o **oposto** até esta rodada: ela exigia que a moldura
   * não declarasse altura nenhuma, para o gatilho ser a fonte da verdade.
   * Invertê-la é a rodada inteira — e o que a torna segura é que os dois
   * números continuam sendo degraus reais e continuam escritos, que é
   * exatamente o que faltava quando o componente entregava 27.
   */
  it("a moldura declara a bandeja — e só na horizontal", () => {
    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        const classe = tabsListFrameVariants({ variant, size })
        // A altura existe…
        expect(classe).toMatch(/data-\[orientation=horizontal\]:h-\d/)
        // …e **nunca** solta: na vertical `size` não significa altura, e uma
        // classe incondicional deixava a moldura com 36px para 106px de
        // conteúdo, com o fio parado ao lado da primeira aba.
        expect(classe).not.toMatch(DECLARA_ALTURA)
      }
      expect(tabsListTrackVariants({ variant })).not.toMatch(DECLARA_ALTURA)
    }
  })

  it("o gatilho não mede por porcentagem do pai — a forma exata do defeito", () => {
    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        expect(tabsTriggerVariants({ variant, size })).not.toContain("calc(100%")
      }
    }
  })

  it("`h-[calc(100%…)]` não volta ao fonte por outro caminho", () => {
    // Sem os comentários: o arquivo **descreve** o defeito antigo, e um guarda
    // que lê prosa proibiria o componente de explicar a própria história.
    const codigo = readFileSync(join(__dirname, "tabs.tsx"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
    expect(codigo).not.toMatch(/h-\[calc\(100%/)
  })
})

describe("o anel de foco é o do sistema", () => {
  it("`ring-3`, e não o `ring-2` que só o Tabs usava", () => {
    const classes = tabsTriggerVariants({})
    expect(classes).toContain("focus-visible:ring-3")
    expect(classes).not.toContain("focus-visible:ring-2")
  })
})

describe("o marcador viaja com os tokens do sistema", () => {
  const VARIANTS_ = ["solid", "underline", "plain"] as const

  it("a duração e a curva vêm de token, nunca de um número solto", () => {
    // A página de Movimento é explícita: "não invente um número novo em
    // milissegundos". Um `duration-200` aqui teria o mesmo valor de hoje e
    // deixaria de acompanhar o sistema no dia em que o token mudar.
    for (const variant of VARIANTS_) {
      const classes = tabsIndicatorVariants({ variant })
      expect(classes).toContain("duration-(--duration-base)")
      expect(classes).toContain("ease-(--ease-out)")
      expect(classes).not.toMatch(/\bduration-\d/)
      expect(classes).not.toMatch(/\bease-\[/)
    }
  })

  it("a caixa vem das quatro variáveis publicadas pela trilha", () => {
    const classes = tabsIndicatorVariants({})
    for (const eixo of ["x", "y", "w", "h"]) {
      expect(classes).toContain(`--tabs-indicator-${eixo}`)
    }
  })

  it("não usa camada negativa — ela o esconderia atrás da moldura", () => {
    // A moldura pinta `bg-muted` e não cria contexto de empilhamento, então um
    // `-z-*` mandaria o marcador para trás dela. A ordem no DOM já resolve.
    for (const variant of VARIANTS_) {
      expect(tabsIndicatorVariants({ variant })).not.toMatch(/-z-\d/)
    }
  })

  it("o rótulo do gatilho compartilha o relógio do marcador", () => {
    // Relógios diferentes fariam a aba acender antes de o realce chegar.
    const classes = tabsTriggerVariants({})
    expect(classes).toContain("duration-(--duration-base)")
    expect(classes).toContain("ease-(--ease-out)")
  })
})

describe("a escada do Tabs — `size` nomeia a bandeja", () => {
  /**
   * O defeito que originou isto: `size="md"` entregava um componente de **40**
   * numa linha de controles de 32, e a promessa da casa — *"alinha sem ninguém
   * dizer `size`"*, escrita nas páginas do `Button`, do `Input` e do `Toggle` —
   * era falsa só aqui, porque o `Tabs` era o único em que `size` nomeava uma
   * peça interna.
   */
  const ESCADA = [24, 28, 32, 36, 40] as const
  const DEGRAUS = ["sm", "md", "lg", "xl"] as const

  it("1. os oito números são degraus da escada — nenhum é inventado", () => {
    for (const size of DEGRAUS) {
      expect(ESCADA).toContain(TABS_SIZES[size].tray)
      expect(ESCADA).toContain(TABS_SIZES[size].trigger)
    }
  })

  it("2. `md` é 32 — a mesma altura de um `Button md`", () => {
    // É a promessa da casa, e a asserção que fecha a rodada.
    expect(TABS_SIZES.md.tray).toBe(32)
    expect(TABS_TRAY_HEIGHTS.md).toBe(32)
  })

  it("3. o gatilho deriva da bandeja, sempre", () => {
    for (const size of DEGRAUS) {
      expect(TABS_SIZES[size].trigger).toBe(TABS_SIZES[size].tray - 4)
    }
  })

  it("4. nenhum par de degraus produz a mesma bandeja", () => {
    const bandejas = DEGRAUS.map((s) => TABS_SIZES[s].tray)
    expect(new Set(bandejas).size).toBe(DEGRAUS.length)
    const gatilhos = DEGRAUS.map((s) => TABS_SIZES[s].trigger)
    expect(new Set(gatilhos).size).toBe(DEGRAUS.length)
  })

  it("5. a escada sobe monotonicamente", () => {
    const bandejas = DEGRAUS.map((s) => TABS_SIZES[s].tray)
    expect([...bandejas].sort((a, b) => a - b)).toEqual(bandejas)
  })

  it("6. o piso de toque é o degrau que a Toolbar publica", () => {
    // A `Toolbar` vai a 40 no ponteiro grosso; a bandeja acompanha, e o
    // `pointer-coarse:min-h-11` que empurrava tudo para 48 saiu.
    expect(TABS_SIZES.xl.tray).toBe(40)
    const fonte = readFileSync(
      join(import.meta.dirname, "tabs.tsx"),
      "utf8"
    ).replace(/\/\*[\s\S]*?\*\//g, "")
    expect(fonte).not.toContain("min-h-11")
    expect(fonte).toContain("pointer-coarse:")
  })

  it("7. os literais de altura batem com a escada — e são literais", () => {
    // A armadilha que esta rodada pagou: `pointer-coarse:h-9` montada por
    // template literal ficava no elemento e nunca chegava ao CSS. As classes
    // são escritas por extenso; este teste é quem garante que elas não
    // divergem da tabela.
    for (const size of DEGRAUS) {
      expect(tabsListFrameVariants({ size })).toContain(
        `data-[orientation=horizontal]:${ALTURA_CLASS[TABS_SIZES[size].tray]}`
      )
      expect(tabsTriggerVariants({ size })).toContain(
        ALTURA_CLASS[TABS_SIZES[size].trigger]
      )
    }
    const piso = ALTURA_CLASS[TABS_SIZES.xl.tray]
    for (const size of ["sm", "md", "lg"] as const) {
      expect(tabsListFrameVariants({ size })).toContain(
        `pointer-coarse:data-[orientation=horizontal]:${piso}`
      )
    }
  })

  it("8. cada variante tem o seu degrau padrão — as três não são a mesma coisa", () => {
    // O defeito medido: sem `size` declarado, `solid`, `underline` e `plain`
    // saíam idênticos — moldura 32, gatilho 28, fonte 12,8px nas três.
    expect(defaultTabsSize("solid")).toBe("md")
    expect(defaultTabsSize("underline")).toBe("lg")
    expect(defaultTabsSize("plain")).toBe("lg")

    // `solid` é controle segmentado: a bandeja fica rente a um `Button md`.
    expect(TABS_SIZES[defaultTabsSize("solid")].tray).toBe(32)
    // As abas de página ficam um degrau acima.
    expect(TABS_SIZES[defaultTabsSize("underline")].tray).toBe(36)
  })

  it("9. `lg` e `xl` não carregam o texto miúdo — é a razão do padrão", () => {
    // Se alguém acrescentar `text-control-sm` a `lg`, o motivo de `underline` e
    // `plain` terem padrão `lg` evapora em silêncio: eles vão para lá porque é
    // ali que o rótulo volta ao corpo de texto da página (14px).
    for (const size of ["sm", "md"] as const) {
      expect(tabsTriggerVariants({ size })).toContain("text-control-sm")
    }
    for (const size of ["lg", "xl"] as const) {
      expect(tabsTriggerVariants({ size })).not.toContain("text-control-sm")
    }
  })

  it("10. o recuo é um só, e não voltou a ser eixo", () => {
    const fonte = readFileSync(join(import.meta.dirname, "tabs.tsx"), "utf8")
    expect(fonte).not.toMatch(/padding\?: TabsPadding/)
    expect(fonte).toContain("const TABS_TRACK_PADDING = 2")
  })
})

/**
 * O modo de vidro do marcador.
 *
 * Ele é o *thumb* que viaja, e a decisão que este bloco tranca é **onde** o
 * vidro entra: na peça que se move, e nunca na bandeja. A bandeja foi medida
 * numa fileira idêntica a esta — o `Menubar solid`, rodada 59 —, e a 60% no
 * escuro ela cai de rgb 38 para 27 e deixa de ler como bandeja.
 *
 * A garantia que faz a troca ser segura é aritmética, e é a asserção 2: o corpo
 * do marcador de vidro é o **mesmo** do chapado, porque `--glass-tone` é
 * `--background` opaco. O que entra é o aro. Nenhum contraste se move.
 */
describe("o vidro do marcador do Tabs", () => {
  const FONTE = readFileSync(join(import.meta.dirname, "tabs.tsx"), "utf8")

  it("1. o ramo de vidro veste a régua e não escreve o que ela apagaria", () => {
    const vidro = tabsIndicatorVariants({ variant: "solid", glass: true })

    // A régua, e não a classe montada à mão: `glass-classes` é onde as strings
    // moram, porque o Tailwind varre o código como texto.
    expect(vidro).toContain("glass")
    expect(vidro).toContain("glass-control")
    expect(vidro).toContain("[--glass-tone:var(--background)]")

    // **A asserção que prova que é eixo, e não embrulho.** A superfície que o
    // shorthand `background` da utility apagaria simplesmente não é escrita —
    // nada de `bg-background` vivo na lista, nada de `bg-transparent` para
    // desfazê-lo. É a mesma régua da asserção 13 de `glass.test.ts`.
    expect(vidro).not.toContain("bg-background")
    expect(vidro).not.toContain("border-border/80")
    expect(vidro).not.toMatch(/[:\]]bg-transparent|dark:bg-transparent|ring-0\b/)
  })

  it("2. o ramo chapado não se moveu — é o marcador de sempre", () => {
    const chapado = tabsIndicatorVariants({ variant: "solid" })
    expect(chapado).toBe(tabsIndicatorVariants({ variant: "solid", glass: false }))

    for (const classe of [
      "rounded-md",
      "border",
      "border-border/80",
      "bg-background",
      "shadow-xs",
    ]) {
      expect(chapado).toContain(classe)
    }
    expect(chapado).not.toContain("glass")
  })

  it("3. `glass` é no-op fora de `solid`", () => {
    // No `underline` o marcador é um fio de 2px, sem corpo onde um aro more; o
    // `plain` nunca é montado. O prop não pode vazar para nenhum dos dois — e
    // quem o barra de verdade é a resolução no `TabsList`, checada abaixo.
    for (const variant of ["underline", "plain"] as const) {
      expect(tabsIndicatorVariants({ variant, glass: true })).toBe(
        tabsIndicatorVariants({ variant, glass: false })
      )
    }
    expect(FONTE).toContain('const vidro = glass && variant === "solid"')
  })

  it("4. o realce tem o par de toque e vira de direção com o tema", () => {
    const trilha = tabsListTrackVariants({ variant: "solid", glass: true })

    /**
     * Por token, e não por regex sobre a string inteira: o seletor tem
     * colchetes **aninhados** (`has-[[data-slot=…][data-state=…]:hover]`), e um
     * `[^\]]*` para no primeiro `]` — reprovou código correto na primeira
     * escrita deste teste. Separar os tokens também deixa a conta explícita.
     */
    const realces = trilha.split(/\s+/).filter((c) => c.includes("--glass-sheen"))
    const claros = realces.filter((c) => !c.startsWith("dark:"))
    const escuros = realces.filter((c) => c.startsWith("dark:"))

    expect(claros).toHaveLength(2)
    expect(escuros).toHaveLength(2)

    // O par `:active` não é simetria: um `:hover` dentro de um seletor
    // arbitrário não ganha o `@media (hover: hover)` da variante do Tailwind,
    // mas também não existe no dedo. Sem ele o controle fica inerte no
    // telefone — a regra H, que o auditor não alcança dentro de um `cva`.
    for (const grupo of [claros, escuros]) {
      expect(grupo.some((c) => c.includes(":hover]"))).toBe(true)
      expect(grupo.some((c) => c.includes(":active]"))).toBe(true)
    }

    // E o realce vira de direção com o tema: a lâmina clara é 92% branca,
    // então um realce branco ali não desenha nada. Ele puxa na direção do
    // contato — escurece no claro, clareia no escuro. Os `_` são exigência do
    // Tailwind dentro de classe arbitrária, não cosmética.
    for (const c of claros) expect(c).toContain("oklch(0_0_0")
    for (const c of escuros) expect(c).toContain("oklch(1_0_0")

    // Quem acende é o gatilho **ativo**, e não qualquer um: um realce que
    // seguisse o cursor por abas inativas pintaria o marcador que está noutro
    // lugar.
    for (const c of realces) {
      expect(c).toContain("[data-slot=tabs-trigger][data-state=active]")
    }

    // A variável mora na trilha porque o marcador é filho dela. Publicá-la no
    // gatilho não funcionaria: custom property não atravessa para irmão.
    expect(tabsListTrackVariants({ variant: "solid", glass: false })).not.toContain(
      "--glass-sheen"
    )
  })

  it("5. o marcador de vidro continua obedecendo a régua do marcador", () => {
    const vidro = tabsIndicatorVariants({ variant: "solid", glass: true })

    // A caixa continua vindo das quatro variáveis publicadas pela trilha.
    for (const eixo of ["x", "y", "w", "h"]) {
      expect(vidro).toContain(`--tabs-indicator-${eixo}`)
    }
    // Sem camada negativa: ela o mandaria para trás da moldura, que pinta
    // `bg-muted` e não cria contexto de empilhamento.
    expect(vidro).not.toMatch(/-z-\d/)
    // Duração e curva de token, como no chapado.
    expect(vidro).toContain("duration-(--duration-base)")
    expect(vidro).toContain("ease-(--ease-out)")
    expect(vidro).not.toMatch(/\bduration-\d/)
    // O raio é herdado do próprio marcador: a utility não declara nenhum.
    expect(vidro).toContain("rounded-md")
  })
})
