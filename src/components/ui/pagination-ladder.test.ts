import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { paginationSteps, paginationVariants } from "./pagination"

/**
 * A escada da `Pagination`, trancada.
 *
 * Medido antes dela: a fileira inteira em **14px** — número, extremo e status
 * no corpo de um parágrafo —, e o tamanho decidido em quatro lugares que não se
 * conheciam, com a reticência cravada em `size-8`. E um buraco do `Button` que
 * só esta peça expõe: os degraus `icon-*` não declaram `font-size`, então
 * encolher a caixa sozinha daria um dígito de 14px numa caixa de 28.
 *
 * O fonte é lido **sem comentários**: a prosa do arquivo cita de propósito o
 * `size-8` cravado que deixou de existir, e uma varredura ingênua se acusaria.
 */

const FONTE = readFileSync(join(__dirname, "pagination.tsx"), "utf8")
const CODIGO = FONTE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

const DEGRAUS = ["xs", "sm", "md", "lg"] as const

/** A caixa, em px, de cada forma de escrever a medida. */
const CAIXA_DO_NUMERO = {
  "icon-xs": 24,
  "icon-sm": 28,
  "icon-md": 32,
  "icon-lg": 36,
} as const
const CAIXA_DO_EXTREMO = { xs: 24, sm: 28, md: 32, lg: 36 } as const
const passos = (classe: string) => Number(classe.match(/size-(\d+)/)?.[1]) * 4

function corpo(inicio: string, fim: string) {
  const i = CODIGO.indexOf(inicio)
  const f = CODIGO.indexOf(fim, i + inicio.length)
  return CODIGO.slice(i, f)
}

describe("escada da Pagination", () => {
  it("1. nenhum par de degraus produz a mesma geometria — o defeito do `Item`", () => {
    const tabelas = DEGRAUS.map((s) => JSON.stringify(paginationSteps[s]))
    expect(new Set(tabelas).size).toBe(DEGRAUS.length)

    const raizes = DEGRAUS.map((size) => paginationVariants({ size }))
    expect(new Set(raizes).size).toBe(DEGRAUS.length)
  })

  it("2. as medidas sobem monotonicamente, e `xs` é o padrão", () => {
    const numeros = DEGRAUS.map((s) => CAIXA_DO_NUMERO[paginationSteps[s].numero])
    expect(numeros).toStrictEqual([24, 28, 32, 36])

    expect(paginationVariants({})).toBe(
      paginationVariants({ align: "center", size: "xs" })
    )
    // O padrão mora em três lugares que precisam concordar. O do contexto é o
    // que decide o status que vive **fora** da raiz — no rodapé do
    // `TablePanel` ele é irmão da `Pagination` e não herda nada. Esquecido em
    // "sm", a fileira sairia em 12px e o status ao lado em 12,8, calado.
    expect(CODIGO).toMatch(/createContext<PaginationSize>\("xs"\)/)
    expect(CODIGO).toMatch(/size = "xs",/)
  })

  it("3. a caixa e o tipo descem juntos — a lição do `Tabs`", () => {
    // `icon-*` não declara `font-size`: sem isto, `sm` seria um dígito de 14px
    // numa caixa de 28 — pior proporção que a de antes, e não melhor.
    // `xs` usa o corpo que o próprio `Button xs` usa — e `icon-xs`, como todo
    // `icon-*`, não o declara sozinho.
    expect(paginationSteps.xs.tipo).toBe("text-xs")
    expect(paginationSteps.sm.tipo).toBe("text-control-sm")
    expect(paginationSteps.md.tipo).toBe("text-control-sm")
    // `lg` volta ao corpo da página, como o `TabsTrigger` de `lg` e `xl`.
    expect(paginationSteps.lg.tipo).toBe("text-sm")

    // E as quatro peças o escrevem — nenhuma confia em herança, que perde para
    // o `text-sm` declarado na base do `Button`.
    for (const peca of [
      ["function PaginationStatus", "function PaginationItem"],
      ["function PaginationLink", "function PaginationEdge"],
      ["function PaginationEdge", "function PaginationPrevious"],
      ["function PaginationEllipsis", "export {"],
    ] as const) {
      expect(corpo(peca[0], peca[1]), `${peca[0]} não escreve o tipo do degrau`).toContain(
        "degrau.tipo"
      )
    }
  })

  it("4. as quatro medidas concordam em cada degrau, e nenhuma está cravada", () => {
    for (const s of DEGRAUS) {
      const d = paginationSteps[s]
      const caixa = CAIXA_DO_NUMERO[d.numero]
      expect(CAIXA_DO_EXTREMO[d.extremo], `${s}: extremo`).toBe(caixa)
      expect(passos(d.quadrado), `${s}: quadrado do telefone`).toBe(caixa)
      expect(passos(d.salto), `${s}: reticência`).toBe(caixa)
    }

    // A reticência era `size-8` cravado, e o quadrado do telefone era o mesmo
    // número escrito à mão. Fora da tabela não sobra medida literal nenhuma.
    const tabela = corpo("const paginationSteps", "as const satisfies")
    const fora = CODIGO.replace(tabela, "")
    expect(fora).not.toMatch(/(?:^|[\s"'])(?:max-sm:)?size-\d/)
  })

  it("5. o número é sempre o par `icon-*` do extremo", () => {
    // "Botão de ícone ao lado de botão de texto usa o par, não o vizinho."
    for (const s of DEGRAUS) {
      expect(paginationSteps[s].numero).toBe(`icon-${paginationSteps[s].extremo}`)
    }
  })

  it("6. o alvo de dedo sobrevive ao encolhimento", () => {
    // 28 é caixa de mouse. No toque o controle cresce de verdade a 44 — não por
    // pseudo-elemento, porque áreas expandidas se sobreporiam a 4px de gap.
    for (const peca of [
      ["function PaginationLink", "function PaginationEdge"],
      ["function PaginationEdge", "function PaginationPrevious"],
    ] as const) {
      expect(corpo(peca[0], peca[1])).toContain(
        "pointer-coarse:min-h-11 pointer-coarse:min-w-11"
      )
    }
  })

  it("7. nada montado em tempo de execução, e o contexto tem a diretiva", () => {
    expect(CODIGO).not.toMatch(/`[^`]*\$\{[^`]*`/)
    // Contexto em módulo de servidor lança. As peças são netas da raiz, então
    // o clone da `Timeline` não serve aqui.
    expect(FONTE.trimStart().startsWith('"use client"')).toBe(true)
  })

  it("8. a página atual e as outras têm a mesma caixa; só o fundo muda", () => {
    const link = FONTE.slice(FONTE.indexOf("function PaginationLink"), FONTE.indexOf("function PaginationEdge") > FONTE.indexOf("function PaginationLink") ? FONTE.indexOf("function PaginationEdge") : undefined)
    // O `secondary` pinta até a borda e o `tertiary` não: sem fixar o recorte,
    // o quadrado da atual sai 2px maior que o realce das outras.
    expect(link).toContain('"bg-clip-border"')
    expect(link).toContain('variant={isActive ? "secondary" : "tertiary"}')
    // E os extremos no mesmo recorte: o realce deles é o mesmo `tertiary`.
    const extremo = FONTE.slice(FONTE.indexOf("function PaginationEdge"), FONTE.indexOf("function PaginationPrevious"))
    expect(extremo).toContain('"bg-clip-border"')
  })
})
