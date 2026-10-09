import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it, vi } from "vitest"

import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { tableVariants } from "./table"
import { TablePanel, TablePanelToolbar } from "./data-table"

const UI = "src/components/ui"

/**
 * A escada do `Table`, trancada.
 *
 * Cinco degraus desde a rodada 225 (`xs` 32 · `sm` 36 · `md` 44 · `lg` 52 ·
 * `xl` 64, a altura da linha); eram três (`sm`/`md`/`lg`), medidos contra o
 * que o app já escrevia à mão em 8 lugares (`h-11 px-4 py-0` nos painéis,
 * `h-8 px-2` nas folhas). O
 * teste garante o que as rodadas anteriores desta base já aprenderam a
 * exigir de uma escada: nenhum par produz a mesma string, as medidas sobem
 * de verdade, e nenhuma delas foi montada em tempo de execução — o Tailwind
 * varre o código como texto, e um template literal nunca chegaria ao CSS.
 *
 * As duas invariantes da dissolução (`table-viewport` não desenha nada, e a
 * moldura mora fora dele) e a regra J do auditor (fio + tinta numa mesma
 * string) também são verificadas aqui, lendo o arquivo como texto — do
 * mesmo jeito que o auditor faz. As buscas estruturais rodam sobre o código
 * **sem comentários**: a prosa do próprio arquivo cita `bg-`, `border` e
 * `role="toolbar"` para explicar o que evita, e um corte que não distingue
 * comentário de código acusa a explicação em vez do defeito.
 */
function semComentarios(src: string) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")
}

const SRC = readFileSync(join(UI, "table.tsx"), "utf8")
const CODE = semComentarios(SRC)
// O `TablePanel` mora no `data-table.tsx` desde a rodada 231: a fatia é a da moldura.
const DT_SRC = readFileSync(join(UI, "data-table.tsx"), "utf8")
const PANEL_CODE = semComentarios(
  DT_SRC.slice(DT_SRC.indexOf("/* A moldura: o TablePanel"), DT_SRC.indexOf("/**\n * A tabela de dados"))
)
const DEGRAUS = ["xs", "sm", "md", "lg", "xl"] as const

/** A entrelinha do corpo de cada degrau, para a conta da altura da linha. */
const ENTRELINHA = { xs: 16, sm: 20, md: 20, lg: 20, xl: 24 } as const

function medidas(size: (typeof DEGRAUS)[number]) {
  const classes = tableVariants({ variant: "plain", size })
  const pegar = (nome: string) => {
    const m = classes.match(new RegExp(`--${nome}:--spacing\\(([\\d.]+)\\)`))
    return m ? Number(m[1]) : NaN
  }
  return {
    px: pegar("table-px"),
    py: pegar("table-py"),
    headH: pegar("table-head-h"),
  }
}

describe("escada do Table", () => {
  it("1. tem os cinco degraus, e `md` é o padrão", () => {
    const padrao = tableVariants({ variant: "plain" })
    expect(padrao).toBe(tableVariants({ variant: "plain", size: "md" }))
    for (const size of DEGRAUS) {
      expect(tableVariants({ variant: "plain", size })).toBeTruthy()
    }
  })

  it("2. nenhum par de degraus produz a mesma string", () => {
    const strings = DEGRAUS.map((size) => tableVariants({ variant: "plain", size }))
    expect(new Set(strings).size).toBe(DEGRAUS.length)
  })

  it("3. a linha mede 32 · 36 · 44 · 52 · 64, e o cabeçalho e o recuo nunca descem", () => {
    const valores = DEGRAUS.map(medidas)
    // A altura da linha é 2 × py mais a entrelinha do corpo; `--spacing` é 4px.
    const alturas = DEGRAUS.map((d, i) => valores[i].py * 4 * 2 + ENTRELINHA[d])
    expect(alturas).toStrictEqual([32, 36, 44, 52, 64])
    // O cabeçalho sobe a cada degrau; o recuo não desce — do `md` para cima ele
    // fica em 16, o `--card-strip-px`, que alinha a coluna com a barra do painel.
    const cabecalho = valores.map((v) => v.headH)
    expect(cabecalho).toStrictEqual([...cabecalho].sort((a, b) => a - b))
    expect(new Set(cabecalho).size).toBe(cabecalho.length)
    const recuo = valores.map((v) => v.px)
    expect(recuo).toStrictEqual([...recuo].sort((a, b) => a - b))
    expect(recuo.slice(2)).toStrictEqual([4, 4, 4])
  })

  it("4. nenhum degrau é montado em tempo de execução — todo literal, sem `${`", () => {
    for (const size of DEGRAUS) {
      const classes = tableVariants({ variant: "plain", size })
      expect(classes).not.toContain("${")
    }
  })

  it("5. `TableRow interactive` traz hover + active + foco; sem ele, nenhum hover", () => {
    expect(CODE).toMatch(
      /interactive &&\s*\n\s*"cursor-pointer hover:bg-muted\/30 active:bg-muted\/30/
    )
    // A base do `<tr>` — fora do ramo `interactive` — não pode conter `hover:`.
    const baseRow = CODE.slice(
      CODE.indexOf("function TableRow"),
      CODE.indexOf("interactive &&", CODE.indexOf("function TableRow"))
    )
    expect(baseRow).not.toContain("hover:")
  })

  it("6. o table-viewport não desenha nada — invariante 2 da dissolução", () => {
    const inicio = CODE.indexOf('data-slot="table-viewport"')
    const bloco = CODE.slice(inicio, CODE.indexOf("</div>", inicio))
    for (const proibida of ["bg-", "ring-", "rounded-", "shadow-", "border-"]) {
      expect(bloco).not.toContain(proibida)
    }
  })

  it('7. a moldura (variant="outline") existe como nó próprio, com border+rounded', () => {
    // O viewport (testado acima) não pinta nada; quem carrega border/rounded
    // só pode ser este segundo nó, `data-slot="table-frame"`.
    const molduraIdx = CODE.indexOf('data-slot="table-frame"')
    expect(molduraIdx).toBeGreaterThan(-1)
    const bloco = CODE.slice(molduraIdx, CODE.indexOf(">", molduraIdx) + 1)
    expect(bloco).toContain("overflow-hidden rounded-surface border border-border")
  })

  it('8. TableHeader variant="muted" nunca junta fio e tinta na mesma string — regra J', () => {
    const bloco = CODE.slice(
      CODE.indexOf("function TableHeader"),
      CODE.indexOf("function TableBody")
    )
    // Cada linha do fonte, e não a string de classe isolada: por isso o
    // limite de fronteira aceita aspas além de espaço — é o caractere que de
    // fato precede uma classe no código-fonte, e não só em `classes[1]`
    // extraído (que é o que o auditor de verdade enxerga).
    for (const linha of bloco.split("\n")) {
      const temFio = /(?:^|\s|")border-[bt](?:\s|"|$)/.test(linha)
      const temTinta = /(?:^|\s|")(?:dark:)?bg-muted\/\d+(?:\s|"|$)/.test(linha)
      expect(temFio && temTinta).toBe(false)
    }
  })

  it('9. a moldura não escreve role="toolbar", e provê `md` por contexto', () => {
    expect(PANEL_CODE).not.toContain('role="toolbar"')
    // O `md` de 44 é o `lg` de antes da rodada 225 — a mesma linha dos painéis.
    expect(PANEL_CODE).toContain('TableSizeContext.Provider value="md"')
  })

  /** As três classes da coluna de ações, lidas do código. */
  const ACOES = [...CODE.matchAll(/const TABLE_ACTIONS_(\w+) =\s*"([^"]+)"/g)]
  const acao = (nome: string) => ACOES.find((m) => m[1] === nome)?.[2] ?? ""

  it("10. a coluna `actions` encolhe, alinha à direita e monta a fileira", () => {
    expect(ACOES).toHaveLength(3)
    expect(acao("HEAD_CLASS")).toBe("w-px whitespace-nowrap text-right")
    expect(acao("CELL_CLASS")).toMatch(/(?:^|\s)w-px(?:\s|$)/)
    expect(CODE).toMatch(/actions && TABLE_ACTIONS_HEAD_CLASS/)
    expect(CODE).toMatch(/actions && TABLE_ACTIONS_CELL_CLASS/)

    // A célula monta a fileira — o `<div>` que as duas telas reais escrevem à
    // mão, e que o catálogo teria de escrever de novo.
    expect(acao("ROW_CLASS")).toMatch(/(?:^|\s)flex(?:\s|$)/)
    expect(acao("ROW_CLASS")).toContain("justify-end")
    expect(CODE).toMatch(/data-slot="table-actions" className=\{TABLE_ACTIONS_ROW_CLASS\}/)

    // O cabeçalho não mostra rótulo, mas não fica sem nome: um `<th>` vazio é
    // anunciado como coluna sem nome.
    expect(CODE).toMatch(
      /actions \? \(\s*<span className="sr-only">\{children \?\? "Ações"\}<\/span>/
    )
  })

  it("11. o recuo horizontal da coluna vem de `--table-px`, e o vertical sai", () => {
    // A coluna de seleção crava `px-2` e ignora a densidade; esta não repete.
    for (const [, nome, classes] of ACOES) {
      expect(classes, `${nome} crava recuo horizontal`).not.toMatch(
        /(?:^|\s)(?:p|px|ps|pe|pl|pr)-/
      )
    }
    // O botão (28) é mais alto que a linha de texto (20): com o recuo do
    // degrau, a linha de ações cresceria de 44 para 52.
    expect(acao("CELL_CLASS")).toMatch(/(?:^|\s)py-0(?:\s|$)/)
  })

  it("12. os botões crescem no toque, e nada na coluna depende do cursor", () => {
    expect(acao("ROW_CLASS")).toContain("pointer-coarse:size-11")
    for (const [, nome, classes] of ACOES) {
      expect(classes, `${nome} esconde algo atrás do cursor`).not.toMatch(
        /hover:|opacity-0/
      )
    }
  })

  it("13. `sticky` é opaco na base e vidro sob `fade=\"bottom\"` — tinta translúcida só com borrão", () => {
    const bloco = CODE.slice(
      CODE.indexOf("function TableHeader"),
      CODE.indexOf("function TableBody")
    )
    // A base continua a composição opaca em srgb: é o que fica sem `backdrop-filter`.
    expect(bloco).toMatch(
      /sticky &&\s*variant === "muted" &&\s*"bg-\[color-mix\(in_srgb,var\(--color-muted\)_50%,var\(--color-card\)\)\]"/
    )
    // O vidro só existe onde o viewport não se mascara — ver a 27.
    expect(bloco).toContain('const vidro = sticky && fade === "bottom"')
    expect(bloco).toMatch(/vidro && "glass-surface"/)
    // 20% passando, e não 50: é o que segura os rótulos acima de 4,5 com o
    // texto claro de uma linha borrado atrás deles.
    expect(bloco).toContain(
      '"supports-backdrop-filter:bg-[color-mix(in_srgb,color-mix(in_srgb,var(--color-muted)_62.5%,var(--color-card))_80%,transparent)] reduced-transparency:bg-[color-mix(in_srgb,var(--color-muted)_50%,var(--color-card))]"'
    )
    // Nunca uma tinta translúcida solta num cabeçalho fixo: sem borrão as
    // linhas passariam nítidas por baixo — o que as duas telas escrevem à mão.
    for (const linha of bloco.split("\n")) {
      // `(?<!!)`: a linha do `muted` **parado** (`!sticky && …`) é translúcida de propósito.
      if (!/(?<!!)\bsticky &&|\bvidro &&/.test(linha)) continue
      for (const m of linha.matchAll(/(\S*)bg-(?:muted|card)\/\d+/g)) {
        expect(m[1].endsWith("supports-backdrop-filter:")).toBe(true)
      }
      for (const m of linha.matchAll(/(\S*)bg-\[[^\s"]*transparent\)\]/g)) {
        expect(m[1].endsWith("supports-backdrop-filter:")).toBe(true)
      }
    }
  })

  it("14. `sticky` sem `muted` é `bg-card`, vidro em `card/80`, e o `muted` parado não muda", () => {
    expect(CODE).toMatch(/sticky && variant !== "muted" && "bg-card"/)
    expect(CODE).toContain('"supports-backdrop-filter:bg-card/80 reduced-transparency:bg-card"')
    expect(CODE).toMatch(/!sticky && variant === "muted" && "bg-muted\/50"/)
  })

  it("15. o nome da linha sublinha no cursor e no toque, e só sob `interactive`", () => {
    const primaria = CODE.match(/const TABLE_PRIMARY_CELL_CLASS =\s*"([^"]+)"/)?.[1] ?? ""
    expect(primaria).toContain("group-hover/table-row:underline")
    expect(primaria).toContain("group-active/table-row:underline")
    expect(primaria).toContain("underline-offset-4")
    // Um `hover:` solto sublinharia o nome ao apontar a própria célula, também
    // numa linha que não responde ao cursor.
    expect(primaria).not.toMatch(/(?:^|\s)(?:hover|active):underline/)
    expect(CODE).toMatch(/primary && TABLE_PRIMARY_CELL_CLASS/)

    // O grupo só existe no ramo interativo: é o que desliga o traço fora dele.
    const linha = CODE.slice(CODE.indexOf("function TableRow"), CODE.indexOf("const TABLE_NUMERIC_HEAD_CLASS"))
    const interativo = linha.match(/interactive &&\s*\n\s*"([^"]+)"/)?.[1] ?? ""
    expect(interativo).toMatch(/(?:^|\s)group\/table-row(?:\s|$)/)
    expect(linha.replace(interativo, "")).not.toContain("group/table-row")
  })

  it("16. cada ação com nome ganha um tooltip `sm`, e o alvo de dedo não depende do `data-slot`", () => {
    const celula = CODE.slice(CODE.indexOf("function TableCell"), CODE.indexOf("function TableEmpty"))
    expect(celula).toContain('["aria-label"]')
    expect(celula).toContain("<TooltipTrigger asChild>{acao}</TooltipTrigger>")
    expect(celula).toContain('<TooltipContent size="sm">{rotulo}</TooltipContent>')
    // Um helper que devolve `<>…</>` chegaria como um filho só, sem nome: os
    // fragmentos são abertos antes do embrulho.
    expect(celula).toContain("acoesAbertas(children)")
    expect(CODE).toMatch(/no\.type === React\.Fragment\s*\?\s*acoesAbertas\(/)
    // O `TooltipTrigger asChild` troca o `data-slot` do botão por
    // `tooltip-trigger`: um seletor por `data-slot=button` deixaria de casar, e
    // o alvo de 44px sumiria calado no toque.
    expect(acao("ROW_CLASS")).not.toContain("data-slot=button")
    expect(acao("ROW_CLASS")).toContain("[&>button]:pointer-coarse:size-11")
  })

  it("17. o realce do botão se separa da linha acesa, e vence o `tertiary` nos dois temas", () => {
    const realce = CODE.match(/const TABLE_ACTION_HOVER_CLASS =\s*"([^"]+)"/)?.[1] ?? ""
    // Os quatro: cursor e toque, e o par `dark:` que vence o `dark:hover` do botão.
    for (const v of ["hover:", "active:", "dark:hover:", "dark:active:"]) {
      expect(realce.split(" "), v).toContain(`${v}bg-current/10`)
    }
    // Por `className`, para o `twMerge` remover o realce do `tertiary` — e o de
    // quem chama vem por último, para a exceção continuar possível.
    expect(CODE).toContain(
      "className: cn(destrutiva ? TABLE_ACTION_DESTRUCTIVE_CLASS : TABLE_ACTION_HOVER_CLASS, no.props.className)"
    )
  })

  it("21. a ação destrutiva é neutra em repouso e vira o botão `destructive` no cursor e no toque", () => {
    const perigo = CODE.match(/const TABLE_ACTION_DESTRUCTIVE_CLASS =\s*"([^"]+)"/)?.[1] ?? ""
    const classes = perigo.split(" ")
    // A superfície de repouso do `Button destructive`, nos dois temas e nos dois gatilhos.
    for (const c of [
      "hover:bg-destructive/10",
      "active:bg-destructive/10",
      "dark:hover:bg-destructive/20",
      "dark:active:bg-destructive/20",
      "hover:text-destructive-muted-foreground",
      "active:text-destructive-muted-foreground",
    ]) {
      expect(classes, c).toContain(c)
    }
    // Nada de vermelho em repouso: nenhuma classe sem variante de estado.
    for (const c of classes) expect(c, `${c} pinta em repouso`).toMatch(/^(?:dark:)?(?:hover|active):/)
    // A célula troca a intenção por `tertiary` — senão o vermelho ficaria em toda linha.
    expect(CODE).toContain('const destrutiva = no.props.variant === "destructive"')
    expect(CODE).toContain('...(destrutiva ? { variant: "tertiary" } : {})')
  })

  it("18. `fade` escolhe um eixo só; o de baixo é um véu irmão, e o viewport não se mascara", () => {
    const tabela = CODE.slice(CODE.indexOf("function Table("), CODE.indexOf("function TableHeader"))
    expect(tabela).toContain('fade = "sides"')
    // Só a ponta de baixo, espelhada na casca para o véu (irmão) poder ler.
    // `arrows` no eixo x publica `data-scroll-more-*`, que a sombra da coluna
    // fixa lê (rodada 225).
    expect(tabela).toMatch(
      /useScrollFade\(\s*fundo \? \{ axis: "y", sides: "end", shell: true \} : \{ axis: "x", arrows: true \}\s*\)/
    )
    // O viewport de baixo não veste máscara nenhuma: só o recuo e a folga de
    // rolagem. E `none` não veste a lateral.
    expect(tabela).toContain(
      '"pb-(--scroll-fade-foot-h) [scroll-padding-block-end:calc(var(--scroll-fade-foot-h)+var(--scroll-fade-h)+0.25rem)]"'
    )
    expect(tabela).toContain('fade === "sides" && scrollFadeViewportXClassName')
    // A casca sangra por baixo do rodapé e segura o véu.
    expect(tabela).toContain(
      '"relative -mb-(--scroll-fade-foot-h) [--scroll-fade-h:--spacing(8)] [--scroll-fade-foot-h:var(--table-panel-foot-h,0px)]"'
    )
    expect(tabela).toContain('<div aria-hidden data-slot="table-fade-veil" className={scrollFadeVeilClassName} />')
    // Sem borrão de faixa: num corpo com rodapé ele virou retângulo de tom três vezes.
    expect(CODE).not.toContain("ScrollFadeBlurLayers")
  })

  it("19. o rodapé do painel sai da moldura, embaixo, e não publica faixa", () => {
    const rodape = PANEL_CODE.slice(PANEL_CODE.indexOf("function TablePanelFooter"))
    expect(DT_SRC.startsWith('"use client"')).toBe(true)
    // Rodada 231: fora da moldura não há linhas passando por baixo dele.
    expect(rodape).not.toContain("--table-panel-foot-h")
    const painel = PANEL_CODE.slice(PANEL_CODE.indexOf("function TablePanel("), PANEL_CODE.indexOf("function TablePanelToolbar"))
    expect(painel.indexOf("{footer}")).toBeGreaterThan(painel.indexOf("</Card>"))
  })

  it("20. a barra sai da moldura, sem fundo e sem fio", () => {
    const painel = PANEL_CODE.slice(
      PANEL_CODE.indexOf("function TablePanel("),
      PANEL_CODE.indexOf("function TablePanelToolbar")
    )
    // A barra é prop, renderizada antes da moldura — nunca caçada entre os
    // filhos, que é o que o Fast Refresh quebrava.
    expect(painel).toContain("toolbar?: React.ReactNode")
    expect(painel.indexOf("{toolbar}")).toBeGreaterThan(-1)
    expect(painel.indexOf("{toolbar}")).toBeLessThan(painel.indexOf("<Card"))
    expect(painel).not.toContain("React.Children")
    expect(painel).not.toMatch(/\.type\s*[!=]==/)
    // O recuo de tira mora no `Card`: fora dele cairia a zero.
    expect(painel).toContain('"[--card-strip-px:--spacing(4)]"')
    const barra = PANEL_CODE.slice(
      PANEL_CODE.indexOf("function TablePanelToolbar"),
      PANEL_CODE.indexOf("function TablePanelFooter")
    )
    // O fio transparente das laterais alinha o texto com as células; tinta, não.
    // Sem recuo vertical, e a altura do botão de ação (`sm`): a seleção não faz a barra pular.
    expect(barra).toContain('cn("min-h-7 border-x border-transparent py-0", className)')
    expect(barra).not.toMatch(/\bbg-/)
    expect(barra).not.toMatch(/border-border|border-b(?:\s|")/)
  })

  it("22. no cabeçalho fixo o divisor é sombra da célula, e não a borda da grade", () => {
    const bloco = CODE.slice(
      CODE.indexOf("function TableHeader"),
      CODE.indexOf("function TableBody")
    )
    // Com `border-collapse` a borda é da grade, e rola com o corpo.
    expect(bloco).toContain(
      '"[&_tr]:border-b-0 [&_th]:shadow-[inset_0_-1px_0_var(--color-border)]"'
    )
    // Só sob `sticky`: o cabeçalho parado continua com o fio de sempre.
    expect(bloco).toMatch(/sticky &&\s*"\[&_tr\]:border-b-0/)
    expect(bloco).toContain('"[&_tr]:border-b"')
  })

  it("23. no painel, a última linha só perde o fio quando não há rodapé", () => {
    // Sem rodapé, o fio dela empilharia com a borda de baixo da moldura; com
    // rodapé, é ele que separa as linhas do rodapé.
    expect(PANEL_CODE).toContain(
      '"[&_[data-slot=table-viewport]>table>tbody>tr:last-child]:border-b-0"'
    )
    expect(PANEL_CODE).not.toContain("data-fade=bottom")
  })

  it("24. o rodapé do painel é a barra de cima espelhada", () => {
    // Fora da moldura (rodada 231) ele não mede mais uma linha: tem a forma da
    // `TablePanelToolbar` — sem recuo vertical, `min-h-7` e o fio transparente.
    const rodape = PANEL_CODE.slice(PANEL_CODE.indexOf("function TablePanelFooter"))
    expect(rodape).toContain('"min-h-7 border-x border-transparent py-0"')
  })

  it("25. a barra é slot: sai da moldura por construção, e como filho avisa", () => {
    const h = React.createElement
    const moldura = 'data-slot="table-panel"'
    const barra = 'data-slot="table-panel-toolbar"'
    const foraDaMoldura = (html: string) =>
      html.includes(barra) &&
      html.indexOf(barra) < html.indexOf(moldura) &&
      !html.slice(html.indexOf(moldura)).includes(barra)

    const erro = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      // (a) a barra pela prop
      const direta = renderToStaticMarkup(
        h(TablePanel, { toolbar: h(TablePanelToolbar, null, "3 transações") }, h("div", null, "corpo"))
      )
      expect(foraDaMoldura(direta)).toBe(true)
      // (b) embrulhada noutro componente — o caso que a detecção por tipo nunca
      // acharia, e o que o `DropdownMenu` registra para o `UserMenu`
      const Embrulho = () => h(TablePanelToolbar, null, "embrulhada")
      const embrulhada = renderToStaticMarkup(
        h(TablePanel, { toolbar: h(Embrulho) }, h("div", null, "corpo"))
      )
      expect(foraDaMoldura(embrulhada)).toBe(true)
      expect(erro).not.toHaveBeenCalled()
      // (c) como filho ela cai dentro da moldura, e o componente avisa
      renderToStaticMarkup(h(TablePanel, null, h(TablePanelToolbar, null, "x")))
      expect(erro).toHaveBeenCalledWith(expect.stringContaining("toolbar="))
    } finally {
      erro.mockRestore()
    }
  })

  it("26. nenhuma peça de ui/ reconhece filho pela identidade da função", () => {
    // O Fast Refresh troca a função a cada edição, e `c.type === Peca` deixa de
    // bater calado — foi assim que a barra do `TablePanel` voltava para dentro
    // da moldura. Só `React.Fragment` é estável. Quem precisa de uma peça num
    // lugar certo a recebe por prop, o idioma do `DropdownMenu`.
    const achados = readdirSync(UI)
      .filter((f) => f.endsWith(".tsx"))
      .flatMap((f) => {
        const codigo = semComentarios(readFileSync(join(UI, f), "utf8"))
        return [...codigo.matchAll(/\.type\s*[!=]==?\s*(?!React\.Fragment\b)([A-Z]\w*)/g)].map(
          (m) => `${f}: ${m[0]}`
        )
      })
    expect(achados).toEqual([])
  })

  it("27. o viewport de um cabeçalho de vidro não se mascara — a borda de baixo é véu", () => {
    // Medido no Chromium: `backdrop-filter` dentro de um elemento mascarado não
    // borra, e a máscara num `<tbody>` não é redesenhada ao mudar (100%
    // transparente, as linhas seguiam visíveis). Nada nesta tabela se mascara.
    expect(CODE).not.toContain("scrollFadeViewportClassName")
    expect(CODE).not.toMatch(/mask-image/)
    const css = readFileSync("src/app/globals.css", "utf8")
    expect(css).not.toContain("scroll-fade-y-content")
    const inicio = css.indexOf("@utility scroll-fade-veil-y {")
    expect(inicio).toBeGreaterThan(-1)
    const util = semComentarios(css.slice(inicio, css.indexOf("\n}\n", inicio) + 2))
    expect(util).not.toMatch(/mask/)
    expect(util).toContain("pointer-events: none")
    expect(util.match(/linear-gradient\(/g)?.length).toBe(1)
    // A mesma curva e o mesmo piso da rampa, e a cor da superfície por variável.
    expect(util).toContain("calc((1 - var(--scroll-fade-floor)) * 100%)")
    // A rampa atravessa a faixa (chega ao piso a 3/4 dela), e a curva é
    // suave nas duas pontas — terminando no topo da faixa ela desenhava borda.
    expect(util).toContain(
      "--scroll-fade-veil-l: calc(var(--scroll-fade-veil-z) + var(--scroll-fade-foot-h, 0px) * 0.75)"
    )
    expect(util.match(/color-mix\(/g)?.length).toBeGreaterThanOrEqual(10)
    expect(util).toContain("var(--scroll-fade-surface, var(--color-card))")
    expect(util).toContain('[data-scroll-fade="off"] > &')
    // E fecha opaco na borda de baixo: no piso a linha seguinte aparece a 6% e
    // é cortada pela borda, e a moldura lê como se não tivesse borda embaixo.
    expect(util).toMatch(/var\(--scroll-fade-veil-c\) 100%\s*\)/)
  })

  it("28. as molduras recortam com `clip-path`, e o fio da linha segue sendo borda", () => {
    // O borrão do cabeçalho fixo vira camada própria, e escapa do recorte
    // arredondado de um `overflow` no Chrome acelerado.
    expect(CODE).toContain("[clip-path:inset(0_round_var(--radius-surface))]")
    expect(PANEL_CODE).toContain('"[clip-path:inset(0_round_var(--radius-surface))]"')
    // Com o véu pintando por cima de tudo, o fio não precisa virar sombra da
    // célula — a volta que a máscara no `<tbody>` exigia saiu com ela.
    expect(CODE).not.toContain("[&>tr]:border-b-0")
    expect(PANEL_CODE).not.toContain("tr:last-child>td]:shadow-none")
    // O `clip-path` recorta pelo raio de fora e não protege o arco da borda: o
    // véu é um retângulo encostado nos cantos, e os de baixo leem o raio de
    // dentro que a moldura publica (rodada 46c). Por variável, e não
    // `inherit`: entre a moldura e o véu costuma haver um embrulho sem raio.
    expect(CODE).toContain("[--scroll-fade-veil-r:calc(var(--radius-surface)_-_1px)]")
    expect(PANEL_CODE).toContain('"[--scroll-fade-veil-r:calc(var(--radius-surface)_-_1px)]"')
    const css = readFileSync("src/app/globals.css", "utf8")
    const inicio = css.indexOf("@utility scroll-fade-veil-y {")
    const util = semComentarios(css.slice(inicio, css.indexOf("\n}\n", inicio) + 2))
    expect(util).toContain("border-bottom-left-radius: var(--scroll-fade-veil-r, 0px)")
    expect(util).toContain("border-bottom-right-radius: var(--scroll-fade-veil-r, 0px)")
  })
})

describe("a linha de totais do DataTable", () => {
  it("recebe as colunas à vista, e nenhum colSpan cravado passa da conta", () => {
    // Com 7 + 1 + 1 numa tabela de 8, a nona coluna era um vão na ponta de toda linha.
    expect(DT_SRC).toContain("footer(table.getPrePaginatedRowModel().rows.map((r) => r.original), { columns: nColunas })")
    const doc = readFileSync(join(process.cwd(), "src/app/designsystem/docs/data-table.tsx"), "utf8")
    expect(doc).not.toMatch(/colSpan=\{\d+\}/)
  })
})

describe("o painel Exibir do DataTable", () => {
  const painel = DT_SRC.slice(DT_SRC.indexOf("export function DataTableViewOptions"), DT_SRC.indexOf("/** O CSV do que está filtrado"))
  it("a coluna é uma linha inteira, a última não sai, e há o que redefinir", () => {
    expect(painel).toContain("menuItemGeometryClassName")
    expect(painel).toContain("const ultima = ligada && visiveis === 1")
    expect(painel).toContain("{mudou ? (")
    expect(painel).toContain('<Popover mobile="sheet">')
    // A densidade diz o nome e a altura da linha, e não só a sigla.
    expect(painel).toContain("{atual.label} · {atual.altura}px")
  })
})

describe("a seta de expandir", () => {
  it("é ghost também aberta: o realce só no cursor e no toque", () => {
    expect(SRC).toContain(
      '"aria-expanded:[--button-hover:0] aria-expanded:hover:[--button-hover:1] aria-expanded:active:[--button-hover:1]"'
    )
  })
})

describe("o detalhe da linha", () => {
  it("começa onde o conteúdo da linha começa, e recua com a sublinha", () => {
    expect(SRC).toContain("{lead > 0 ? <td colSpan={lead} aria-hidden className=\"p-0\" /> : null}")
    expect(SRC).toContain('depth > 0 && "ps-[calc(var(--table-px)+var(--table-depth)*1.5rem)]"')
    expect(DT_SRC).toContain('lead={Math.max(0, folhas.findIndex((f) => !f.id.startsWith("__")))}')
  })
})
