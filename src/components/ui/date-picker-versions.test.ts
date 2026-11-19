import { existsSync } from "node:fs"
import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import { DatePicker, MonthGrid, maskTypedDate, parseTypedDate, proximoIntervaloDeMes } from "./date-picker"

/** As versões do `DatePicker`. */

const CODIGO = lerFonte("src/components/ui/date-picker.tsx")

describe("as versões do DatePicker", () => {
  it("o campo digitado vira data, e uma data que não existe não vira o dia seguinte", () => {
    expect(parseTypedDate("05/04/2026")?.toDateString()).toBe(new Date(2026, 3, 5).toDateString())
    expect(parseTypedDate("5/4/26")?.toDateString()).toBe(new Date(2026, 3, 5).toDateString())
    expect(parseTypedDate("31/02/2026")).toBeNull()
    expect(parseTypedDate("abc")).toBeNull()
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)
    expect(parseTypedDate("Ontem")?.toDateString()).toBe(ontem.toDateString())
    expect(parseTypedDate("05/04")?.getFullYear()).toBe(new Date().getFullYear())
  })

  it("a máscara põe as barras nos dígitos e deixa as palavras passarem", () => {
    expect(maskTypedDate("0504")).toBe("05/04")
    expect(maskTypedDate("05042026")).toBe("05/04/2026")
    expect(maskTypedDate("050420261")).toBe("05/04/2026")
    expect(maskTypedDate("hoje")).toBe("hoje")
  })

  it("o rótulo relativo põe a palavra na frente só de ontem, hoje e amanhã", () => {
    const html = (d: Date) =>
      renderToStaticMarkup(h(DatePicker, { value: d, onChange: () => {}, displayStyle: "relative" }))
    expect(html(new Date())).toContain("Hoje · ")
    const longe = new Date()
    longe.setDate(longe.getDate() - 10)
    expect(html(longe)).not.toMatch(/Hoje|Ontem|Amanhã/)
  })

  it("o mês: a grade marca o escolhido e o atual, e o campo diz o mês por extenso", () => {
    const grade = renderToStaticMarkup(h(MonthGrid, { value: new Date(2026, 2, 1), onChange: () => {} }))
    expect(grade).toContain('aria-label="Março de 2026"')
    expect(grade).toMatch(/aria-pressed="true"[^>]*aria-label="Março de 2026"|aria-label="Março de 2026"[^>]*aria-pressed="true"/)
    const campo = renderToStaticMarkup(
      h(DatePicker, { mode: "month", value: new Date(2026, 2, 1), onChange: () => {} })
    )
    expect(campo).toContain("Março de 2026")
  })

  it("aria-label chega ao gatilho — o tipo não tinha a prop, e o JSX a engolia calado", () => {
    const html = renderToStaticMarkup(h(DatePicker, { "aria-label": "Data", onChange: () => {} }))
    expect(html).toContain('aria-label="Data"')
  })

  it("o intervalo com confirm só escreve no Aplicar, e o Calendar tem atalho de dia", () => {
    expect(CODIGO).toContain("onSelect={(r) => (props.confirm ? setRascunho(r) : props.onChange(r))}")
    expect(CODIGO).toContain("disabled={!rascunho?.from}")
    expect(lerFonte("src/components/ui/calendar.tsx")).toContain('if ("date" in p) {')
  })

  it("o calendário brota do campo no gesto do menu", () => {
    expect(CODIGO).toContain('className={cn("date-picker-bloom w-auto", popoverClassName)}')
    const css = lerFonte("src/app/globals.css")
    const bloco = css.slice(css.indexOf("@utility date-picker-bloom {"))
    expect(bloco).toMatch(/&\[data-state="open"\] \{\s*animation: menu-morph 380ms linear backwards;/)
    expect(bloco).toMatch(/&\[data-state="closed"\] \{\s*animation: menu-unmorph 210ms linear both;/)
  })

  it("no telefone a grade abre numa gaveta, com título", () => {
    expect(CODIGO).toMatch(/if \(naGaveta\) \{[\s\S]*?<Drawer open=\{open\}[\s\S]*?<DialogTitle>\{titulo\}<\/DialogTitle>/)
  })

  it("as telas migradas usam as peças, e os formulários à mão saíram", () => {
    expect(existsSync(join(process.cwd(), "src/components/transactions/transactions-date-range-form.tsx"))).toBe(false)
    expect(existsSync(join(process.cwd(), "src/components/categories/budget-month-selects.tsx"))).toBe(false)
    expect(lerFonte("src/components/transactions/transactions-filters-panel.tsx")).toMatch(/mode="range"\s*confirm/)
    expect(lerFonte("src/components/categories/categories-toolbar.tsx")).toContain("<MonthGrid")
    for (const arquivo of [
      "src/components/transactions/transaction-form-fields.tsx",
      "src/components/bills/pay-bill-dialog.tsx",
      "src/components/subscriptions/subscription-form-fields.tsx",
    ]) {
      expect(lerFonte(arquivo), arquivo).toContain('displayStyle="relative"')
    }
    expect(lerFonte("src/components/bills/bill-form-fields.tsx")).toMatch(/placeholder="Sem data final"\s*clearable/)
  })
})

describe("MonthGrid em intervalo", () => {
  const botao = (html: string, rotulo: string) =>
    html.match(new RegExp(`<button[^>]*aria-label="${rotulo}"[^>]*>[\\s\\S]*?</button>`))?.[0] ?? ""

  it("as pontas são a tecla, o meio é a faixa, e fora do intervalo não há marca", () => {
    const html = renderToStaticMarkup(
      h(MonthGrid, {
        mode: "range",
        value: { from: new Date(2026, 7, 1), to: new Date(2026, 9, 1) },
        onChange: () => {},
      })
    )
    const ago = botao(html, "Agosto de 2026")
    const set = botao(html, "Setembro de 2026")
    const out = botao(html, "Outubro de 2026")
    const jul = botao(html, "Julho de 2026")
    expect(ago).toContain('aria-pressed="true"')
    expect(ago).toContain('data-range="start"')
    expect(out).toContain('aria-pressed="true"')
    expect(out).toContain('data-range="end"')
    expect(set).toContain('data-range="middle"')
    expect(jul).not.toContain("data-range")
  })

  it("a legenda mora dentro do botão de cada mês", () => {
    const html = renderToStaticMarkup(
      h(MonthGrid, {
        value: new Date(2026, 2, 1),
        onChange: () => {},
        caption: (m: Date) => `T${m.getMonth()}`,
      })
    )
    const nomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    nomes.forEach((nome, m) => {
      expect(botao(html, `${nome} de 2026`)).toMatch(new RegExp(`data-slot="month-grid-caption"[^>]*>T${m}<`))
    })
  })

  it("o primeiro toque é um mês e vira âncora; o segundo vai até ele, em qualquer ordem", () => {
    const out = new Date(2026, 9, 1)
    const ago = new Date(2026, 7, 1)
    expect(proximoIntervaloDeMes(null, out)).toEqual({ range: { from: out, to: out }, ancora: out })
    expect(proximoIntervaloDeMes(out, ago)).toEqual({ range: { from: ago, to: out }, ancora: null })
    const nov = new Date(2025, 10, 1)
    const fev = new Date(2026, 1, 1)
    expect(proximoIntervaloDeMes(nov, fev)).toEqual({ range: { from: nov, to: fev }, ancora: null })
  })
})

describe("MonthGrid: a âncora e o ano visível", () => {
  const FONTE_DP = semComentarios(lerFonte("src/components/ui/date-picker.tsx"), "linha-inteira")
  const GRADE = FONTE_DP.slice(FONTE_DP.indexOf("export function MonthGrid"))

  it("um valor que muda por fora (atalho, ano, Remover) apaga a âncora; o próprio toque não", () => {
    expect(GRADE).toMatch(/if \(chaveDoValor !== visto\) \{[\s\S]*?if \(chaveDoValor !== emitido\) setAncora\(null\)/)
    expect(GRADE).toContain("setEmitido(chaveDe(proximo.range))")
  })

  it("onYearChange avisa o ano que a pessoa vê", () => {
    expect(GRADE.match(/onYearChange\?\.\(/g)?.length).toBeGreaterThanOrEqual(1)
  })
})

describe("o mês atual no intervalo (revisão final)", () => {
  afterEach(() => vi.useRealTimers())

  it("dentro do intervalo o atual ainda se distingue: negrito e aria-current", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 8, 12))
    const grade = renderToStaticMarkup(
      h(MonthGrid, { mode: "range", value: { from: new Date(2026, 9, 1), to: new Date(2026, 11, 1) }, onChange: () => {} })
    )
    const botao = (rotulo: string) => grade.match(new RegExp(`<button[^>]*aria-label="${rotulo}"[^>]*>`))?.[0] ?? ""
    const novembro = botao("Novembro de 2026")
    expect(novembro).toContain('aria-current="date"')
    expect(novembro).toContain('data-range="middle"')
    expect(novembro).toContain("font-semibold")
    expect(botao("Agosto de 2026")).not.toContain("font-semibold")
  })
})

describe("MonthGrid: o mês escolhido viaja como o marcador das abas", () => {
  const FONTE_DP = semComentarios(lerFonte("src/components/ui/date-picker.tsx"), "linha-inteira")
  const inicio = FONTE_DP.indexOf("export function MonthGrid")
  const GRADE = FONTE_DP.slice(inicio, FONTE_DP.indexOf("\nfunction ", inicio))
  const botao = (html: string, rotulo: string) =>
    html.match(new RegExp(`<button[^>]*aria-label="${rotulo}"[^>]*>`))?.[0] ?? ""

  it("um marcador só, medido pelo useMarcador, mora na grade", () => {
    expect(GRADE).toContain("useMarcador(")
    expect(GRADE).toContain('data-slot="month-grid-marker"')
    expect(GRADE).toMatch(/data-slot="month-grid-marker"[\s\S]*?bg-primary/)
    expect(GRADE).toContain("viajar: props.mode !== \"range\"")
  })

  it("no modo single o escolhido é tertiary com a tinta de cima; o range segue nas pontas", () => {
    expect(GRADE).not.toContain('variant={escolhido ? "primary"')
    expect(GRADE).toContain('variant={ponta ? "primary"')
    const unico = renderToStaticMarkup(h(MonthGrid, { value: new Date(2026, 2, 1), onChange: () => {} }))
    const marco = botao(unico, "Março de 2026")
    expect(marco).toContain("data-selected")
    expect(marco).toContain("text-primary-foreground")
    const intervalo = renderToStaticMarkup(
      h(MonthGrid, { mode: "range", value: { from: new Date(2026, 7, 1), to: new Date(2026, 9, 1) }, onChange: () => {} })
    )
    expect(botao(intervalo, "Agosto de 2026")).not.toContain("data-selected")
    expect(botao(intervalo, "Agosto de 2026")).toContain("bg-primary")
  })

  it("sem medida (e sem JavaScript) o escolhido se pinta sozinho", () => {
    const html = renderToStaticMarkup(h(MonthGrid, { value: new Date(2026, 2, 1), onChange: () => {} }))
    expect(html).not.toContain('data-slot="month-grid-marker"')
    expect(botao(html, "Março de 2026")).toContain("bg-primary")
    expect(botao(html, "Abril de 2026")).not.toContain("bg-primary")
  })
})
