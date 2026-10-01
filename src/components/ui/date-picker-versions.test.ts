import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { DatePicker, MonthGrid, maskTypedDate, parseTypedDate } from "./date-picker"

/** A rodada 210: as versões novas do `DatePicker`. */

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")
const CODIGO = fonte("src/components/ui/date-picker.tsx")

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
    expect(fonte("src/components/ui/calendar.tsx")).toContain('if ("date" in p) {')
  })

  it("o calendário brota do campo, e o recorte não fica valendo depois", () => {
    expect(CODIGO).toContain('className={cn("date-picker-bloom w-auto", popoverClassName)}')
    const css = fonte("src/app/globals.css")
    // `inset(-1rem)` e `backwards`: `inset(0)` cortaria o anel e a sombra, e
    // `both` deixaria o recorte valendo para sempre.
    expect(css).toMatch(/@keyframes date-picker-bloom \{[\s\S]*?clip-path: inset\(-1rem round 0\);/)
    expect(css).toMatch(/animation: date-picker-bloom var\(--duration-spring\) var\(--ease-spring\)\s*backwards;/)
    expect(css).toMatch(/&\[data-side="top"\] \{\s*--date-picker-bloom-clip: inset\(100%/)
  })

  it("no telefone a grade abre numa gaveta, com título", () => {
    expect(CODIGO).toMatch(/if \(naGaveta\) \{[\s\S]*?<Drawer open=\{open\}[\s\S]*?<DialogTitle>\{titulo\}<\/DialogTitle>/)
  })

  it("as telas migradas usam as peças, e os formulários à mão saíram", () => {
    expect(existsSync(join(process.cwd(), "src/components/transactions/transactions-date-range-form.tsx"))).toBe(false)
    expect(existsSync(join(process.cwd(), "src/components/categories/budget-month-selects.tsx"))).toBe(false)
    expect(fonte("src/components/transactions/transactions-filters-panel.tsx")).toMatch(/mode="range"\s*confirm/)
    expect(fonte("src/components/categories/categories-toolbar.tsx")).toContain("<MonthGrid")
    for (const arquivo of [
      "src/components/transactions/transaction-form-fields.tsx",
      "src/components/bills/pay-bill-dialog.tsx",
      "src/components/subscriptions/subscription-form-fields.tsx",
    ]) {
      expect(fonte(arquivo), arquivo).toContain('displayStyle="relative"')
    }
    expect(fonte("src/components/bills/bill-form-fields.tsx")).toMatch(/placeholder="Sem data final"\s*clearable/)
  })
})
