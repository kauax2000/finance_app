import { describe, expect, it } from "vitest"
import { commandFilter } from "./command-filter"

describe("commandFilter", () => {
  it("gradua o rótulo do mais ao menos exato", () => {
    expect(commandFilter("Date Picker", "datepicker")).toBe(1)
    expect(commandFilter("Select", "select")).toBe(1)
    expect(commandFilter("Dropdown Menu", "drop")).toBe(0.9)
    expect(commandFilter("Native Select", "select")).toBe(0.8)
    expect(commandFilter("Money Display", "moneydisp")).toBe(0.7)
    expect(commandFilter("Dropdown Menu", "menu drop")).toBe(0.6)
    expect(commandFilter("Button", "tton")).toBe(0.7)
    expect(commandFilter("Button", "xyz")).toBe(0)
  })

  it("o nome exato vence quem só tem a palavra", () => {
    expect(commandFilter("Select", "select")).toBeGreaterThan(
      commandFilter("Native Select", "select")
    )
    expect(commandFilter("Cores", "cor")).toBeGreaterThan(
      commandFilter("Carousel", "cor")
    )
  })

  it("ignora acento e caixa, e consulta vazia mostra tudo", () => {
    expect(commandFilter("Tipografia", "TIPOGRAFÍA")).toBe(1)
    expect(commandFilter("Gráficos", "graficos")).toBe(1)
    expect(commandFilter("Button", "")).toBe(1)
    expect(commandFilter("Button", "(")).toBe(0)
  })

  it("keywords seguem valendo 0,4 (o caminho do Combobox)", () => {
    expect(commandFilter("cat_7f3a", "mercado", ["Mercado"])).toBe(0.4)
  })
})
