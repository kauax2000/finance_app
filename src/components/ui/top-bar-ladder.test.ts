import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { barSurfaceClassName } from "@/lib/bar-classes"
import { topBarVariants } from "./top-bar"

/**
 * A régua da barra do topo, trancada.
 *
 * Ela nasceu da fusão de duas barras escritas à mão, e cada divergência medida
 * entre elas virou uma asserção: o `AppHeader` media o fio **por fora** da
 * altura (o telefone ficava 1px mais alto que `--mobile-header-offset`),
 * escrevia o próprio borrão (8px, sem `saturate`, sem guarda de transparência
 * reduzida), vivia num `z-10` cru e animava o fundo em `duration-200` com a
 * curva do navegador.
 *
 * Zero render: tudo lê o `cva` e o fonte sem comentários.
 */

const CODIGO = readFileSync(
  join(process.cwd(), "src/components/ui/top-bar.tsx"),
  "utf8"
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "")

const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")

const alturaEm = (classes: string, prefixo = "") => {
  const m = classes.match(
    new RegExp(
      `(?:^|\\s)${prefixo.replace(/[[\]/]/g, "\\$&")}\\[--top-bar-h:([\\d.]+)rem\\]`
    )
  )
  return m ? Number(m[1]) : NaN
}

const TAMANHOS = ["sm", "md"] as const
const POSICOES = ["static", "sticky", "fixed", "auto"] as const

describe("régua do TopBar", () => {
  it("1. os degraus são degraus: 48 e 56, e nenhum par repete a string", () => {
    const alturas = TAMANHOS.map((size) => alturaEm(topBarVariants({ size })))
    expect(alturas).toEqual([3, 3.5])
    const strings = TAMANHOS.map((size) => topBarVariants({ size }))
    expect(new Set(strings).size).toBe(strings.length)
  })

  it("2. o padrão é 48 em qualquer largura, sem acompanhar a barra lateral", () => {
    const padrao = topBarVariants({})
    expect(alturaEm(padrao)).toBe(3)
    expect(padrao).not.toMatch(/md:\[--top-bar-h/)
    expect(padrao).not.toContain("group-has")
    expect(padrao).not.toContain("transition-[height")
  })

  it("3. o padrão é declarado uma vez, e é a forma de uma barra de página", () => {
    expect(topBarVariants({})).toBe(
      topBarVariants({
        size: "sm",
        position: "sticky",
        surface: "solid",
        gutter: "bar",
      })
    )
  })

  it("4. a altura contém o fio e a área segura, e bate com --mobile-header-offset", () => {
    const base = topBarVariants({})
    expect(base).toContain(
      "h-[calc(var(--top-bar-h)+var(--top-bar-safe,0px))]"
    )
    expect(base).toContain("pt-[var(--top-bar-safe,0px)]")
    expect(base).not.toMatch(/\bbox-content\b/)

    const safe = "[--top-bar-safe:env(safe-area-inset-top,0px)]"
    expect(topBarVariants({ position: "fixed" })).toContain(safe)
    expect(topBarVariants({ position: "auto" })).toContain(`max-md:${safe}`)
    expect(topBarVariants({ position: "sticky" })).not.toContain(safe)

    // O token que a casca do app usa para empurrar o conteúdo é o degrau
    // padrão mais a mesma área segura — sem o 1px do fio por fora.
    const token = CSS.match(
      /--mobile-header-offset:\s*calc\(([\d.]+)rem \+ env\(safe-area-inset-top, 0px\)\)/
    )
    expect(token, "o token mudou de forma").not.toBeNull()
    expect(Number(token![1])).toBe(alturaEm(topBarVariants({})))
  })

  it("5. grudada fica abaixo da faixa de aviso; fixa fica na camada do cabeçalho", () => {
    expect(topBarVariants({ position: "sticky" })).toContain("z-(--z-sticky)")
    expect(topBarVariants({ position: "sticky" })).not.toContain("--z-header")
    expect(topBarVariants({ position: "fixed" })).toContain("z-(--z-header)")
    const auto = topBarVariants({ position: "auto" })
    expect(auto).toContain("max-md:z-(--z-header)")
    expect(auto).toContain("md:z-(--z-sticky)")
    for (const position of POSICOES) {
      expect(topBarVariants({ position })).not.toMatch(/\bz-(?:\d|\[)/)
    }
  })

  it("6. o vidro é a régua de barra, e o arquivo não escreve borrão próprio", () => {
    expect(topBarVariants({ surface: "glass" })).toContain(barSurfaceClassName)
    expect(topBarVariants({ surface: "solid" })).toContain("bg-background")
    expect(topBarVariants({ surface: "solid" })).not.toContain("glass-surface")
    expect(CODIGO).not.toMatch(/\bbackdrop-blur/)
  })

  it("7. `scroll` escolhe entre as duas pinturas inteiras, e nada é montado", () => {
    expect(CODIGO).toMatch(/rolou \? "glass" : "solid"/)
    expect(CODIGO).not.toMatch(/`[^`]*\$\{[^}]*\}[^`]*`/)
  })

  it("8. o fio é o da variante da barra lateral, com 1px fora dela", () => {
    expect(topBarVariants({})).toContain(
      "border-b-[length:var(--sidebar-inset-rule,1px)]"
    )
  })

  it("10. o título é o da barra de exemplo da página da Sidebar", () => {
    const titulo = CODIGO.slice(
      CODIGO.indexOf('data-slot="top-bar-title"'),
      CODIGO.indexOf("{...props}", CODIGO.indexOf('data-slot="top-bar-title"'))
    )
    expect(titulo.length, "o título não foi achado").toBeGreaterThan(0)
    expect(titulo).toContain("text-sm font-medium")
    expect(titulo).not.toMatch(/\btext-base\b|\bfont-semibold\b/)
  })

  it("11. o vidro arredonda pelo raio da própria barra, não pelo recorte de fora", () => {
    // O `backdrop-filter` ignora o recorte de ancestral: numa caixa arredondada
    // o borrão saía com os cantos de cima quadrados. Só o raio do elemento vale.
    expect(topBarVariants({})).toContain("rounded-t-[var(--top-bar-r,0px)]")
  })

  it("9. a altura fala a curva da barra lateral, e nada fica com a do navegador", () => {
    expect(topBarVariants({})).toContain(
      "duration-(--duration-slow) ease-(--ease-emphasized)"
    )
    expect(CODIGO).not.toContain("ease-linear")
    expect(CODIGO).not.toMatch(/\bduration-\d/)
  })
})
