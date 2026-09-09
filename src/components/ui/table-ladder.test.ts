import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { tableVariants } from "./table"

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
      /interactive &&\s*\n\s*"cursor-pointer hover:bg-muted\/50 active:bg-muted\/50/
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
})
