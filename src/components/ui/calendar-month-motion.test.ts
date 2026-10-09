import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * A rodada 245: a troca de mês do `Calendar` anima — o mês que entra vem do
 * lado para onde se andou, 24px e da mola da casa; o que sai some depressa
 * para o outro lado. A mecânica é a do `react-day-picker` (`animate`), o
 * movimento é a `@utility calendar-month-motion`.
 */

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")
const CALENDARIO = fonte("src/components/ui/calendar.tsx")
const CSS = fonte("src/app/globals.css")
const utility = CSS.slice(CSS.indexOf("@utility calendar-month-motion"))
const bloco = utility.slice(0, utility.indexOf("\n}\n"))

describe("a troca de mês", () => {
  it("liga a mecânica da biblioteca fora da agenda, e quem chama pode desligar", () => {
    expect(CALENDARIO).toContain("animate={!agenda}")
    expect(CALENDARIO).toContain('!agenda && "calendar-month-motion"')
    // Antes do espalhamento: é padrão, não imposição.
    expect(CALENDARIO.indexOf("animate={!agenda}")).toBeLessThan(
      CALENDARIO.indexOf("{...props}", CALENDARIO.indexOf("animate={!agenda}"))
    )
  })

  it("as quatro direções têm movimento, e a entrada é a mola", () => {
    for (const classe of [
      "rdp-weeks_after_enter",
      "rdp-weeks_before_exit",
      "rdp-weeks_before_enter",
      "rdp-weeks_after_exit",
      "rdp-caption_after_enter",
      "rdp-caption_before_exit",
      "rdp-caption_before_enter",
      "rdp-caption_after_exit",
    ]) {
      expect(bloco, classe).toContain(`& .${classe} {`)
    }
    expect(bloco).toContain("animation: calendar-weeks-in var(--duration-spring) var(--ease-spring) both;")
    // 24px, e não a largura inteira.
    expect(bloco).toContain("--calendar-weeks-from: 1.5rem;")
    expect(bloco).toContain("--calendar-weeks-from: -1.5rem;")
  })

  it("a legenda que sai dura a mola inteira — é no animationend dela que a biblioteca limpa", () => {
    expect(bloco.match(/calendar-caption-out var\(--duration-spring\)/g)).toHaveLength(2)
  })

  it("o seletor de mês e de ano veste a linha, e não a cápsula, com o realce das linhas", () => {
    expect(CALENDARIO).toContain(
      'className="w-fit gap-1 rounded-row border-transparent bg-transparent px-2 font-medium hover:bg-foreground/9 active:bg-foreground/9"'
    )
  })

  it("a faixa das setas fica acima da legenda animada", () => {
    expect(CALENDARIO).toMatch(/\[&>button\]:pointer-events-auto",[\s\S]{0,600}"z-10",/)
  })

  it("na abertura do DatePicker, o clone do mês que sai não ganha a subida", () => {
    expect(CSS).toContain(
      ':is(.rdp-nav, .rdp-month_caption, .rdp-weekdays, .rdp-week):not([aria-hidden="true"] *)'
    )
  })
})
