import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it, vi } from "vitest"

import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { tableVariants } from "./table"
import { TablePanel, TablePanelToolbar } from "./table-panel"

const UI = "src/components/ui"

/**
 * A escada do `Table`, trancada.
 *
 * Três degraus (`sm`/`md`/`lg`), medidos contra o que o app já escrevia à
 * mão em 8 lugares (`h-11 px-4 py-0` nos painéis, `h-8 px-2` nas folhas). O
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
const PANEL_CODE = semComentarios(readFileSync(join(UI, "table-panel.tsx"), "utf8"))
const DEGRAUS = ["sm", "md", "lg"] as const

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
  it("1. tem exatamente os três degraus do sistema, e `md` é o padrão", () => {
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

  it("3. px, py e a altura do cabeçalho crescem monotonicamente", () => {
    const valores = DEGRAUS.map(medidas)
    for (const eixo of ["px", "py", "headH"] as const) {
      const seq = valores.map((v) => v[eixo])
      expect(seq.every(Number.isFinite)).toBe(true)
      expect(seq).toStrictEqual([...seq].sort((a, b) => a - b))
      expect(new Set(seq).size).toBe(seq.length)
    }
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
    expect(bloco).toContain("overflow-hidden rounded-lg border border-border")
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

  it('9. table-panel.tsx não escreve role="toolbar", e provê `lg` por contexto', () => {
    expect(PANEL_CODE).not.toContain('role="toolbar"')
    expect(PANEL_CODE).toContain('TableSizeContext.Provider value="lg"')
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
    expect(tabela).toContain('useScrollFade(fundo ? { axis: "y", sides: "end", shell: true } : { axis: "x" })')
    // O viewport de baixo não veste máscara nenhuma: só o recuo e a folga de rolagem.
    expect(tabela).toContain(
      'fundo ? "pb-(--scroll-fade-foot-h) [scroll-padding-block-end:calc(var(--scroll-fade-foot-h)+var(--scroll-fade-h)+0.25rem)]" : scrollFadeViewportXClassName'
    )
    // A casca sangra por baixo do rodapé e segura o véu.
    expect(tabela).toContain(
      '"relative -mb-(--scroll-fade-foot-h) [--scroll-fade-h:--spacing(8)] [--scroll-fade-foot-h:var(--table-panel-foot-h,0px)]"'
    )
    expect(tabela).toContain('<div aria-hidden data-slot="table-fade-veil" className={scrollFadeVeilClassName} />')
    // Sem borrão de faixa: num corpo com rodapé ele virou retângulo de tom três vezes.
    expect(CODE).not.toContain("ScrollFadeBlurLayers")
  })

  it("19. o rodapé do painel publica a própria altura e pinta por cima das linhas", () => {
    const rodape = PANEL_CODE.slice(PANEL_CODE.indexOf("function TablePanelFooter"))
    expect(PANEL_CODE.startsWith('"use client"')).toBe(true)
    expect(rodape).toContain("new ResizeObserver(")
    expect(rodape).toContain('painel.style.setProperty("--table-panel-foot-h", `${el.offsetHeight}px`)')
    expect(rodape).toContain('painel.style.removeProperty("--table-panel-foot-h")')
    // Sem `relative` o viewport posicionado pintaria por cima do rodapé.
    expect(rodape).toMatch(/"relative flex-col/)
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
      '"[&:not(:has(>[data-slot=table-panel-footer]))_[data-slot=table-viewport]>table>tbody>tr:last-child]:border-b-0"'
    )
    expect(PANEL_CODE).not.toContain("data-fade=bottom")
  })

  it("24. o rodapé do painel mede o mesmo que uma linha da tabela", () => {
    // Linha `lg`: 12 + 20 + 12 = 44. Rodapé: recuo + botão xs (24) + recuo.
    // Com o recuo das tiras (12) ele saía 48; com 10 fecha em 44.
    const rodape = PANEL_CODE.slice(PANEL_CODE.indexOf("function TablePanelFooter"))
    expect(rodape).toContain('"py-2.5"')
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
  })

  it("28. as molduras recortam com `clip-path`, e o fio da linha segue sendo borda", () => {
    // O borrão do cabeçalho fixo vira camada própria, e escapa do recorte
    // arredondado de um `overflow` no Chrome acelerado.
    expect(CODE).toContain("[clip-path:inset(0_round_var(--radius-lg))]")
    expect(PANEL_CODE).toContain('"[clip-path:inset(0_round_var(--radius-xl))]"')
    // Com o véu pintando por cima de tudo, o fio não precisa virar sombra da
    // célula — a volta que a máscara no `<tbody>` exigia saiu com ela.
    expect(CODE).not.toContain("[&>tr]:border-b-0")
    expect(PANEL_CODE).not.toContain("tr:last-child>td]:shadow-none")
  })
})
