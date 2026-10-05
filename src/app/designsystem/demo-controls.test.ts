import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

/**
 * A rodada 238: os controles das demonstrações saem do mostrador. Os eixos são
 * a pílula `floating` (a do `Tabs` padrão, sem sombra), os interruptores são
 * `Toggle` fantasmas soltos, e os dois moram em `Controles`, acima da moldura,
 * numa linha só.
 */

const DOCS = "src/app/designsystem/docs"
const DS_DOC = readFileSync("src/app/designsystem/ds-doc.tsx", "utf8")
const paginas = readdirSync(DOCS)
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => [f, readFileSync(join(DOCS, f), "utf8")] as const)

describe("os controles da demonstração", () => {
  it("o eixo é a pílula floating, e o interruptor é um Toggle fantasma solto", () => {
    const eixo = DS_DOC.slice(DS_DOC.indexOf("export function Eixo"), DS_DOC.indexOf("type InterruptorProps"))
    expect(eixo).toContain('variant="floating"')
    const interruptor = DS_DOC.slice(DS_DOC.indexOf("export function Interruptor("))
    expect(interruptor).toContain("<Toggle")
    expect(interruptor).toContain('variant="plain"')
    expect(DS_DOC.slice(DS_DOC.indexOf("export function Interruptores"), DS_DOC.indexOf("export function Interruptor("))).not.toContain("ToggleGroup")
  })

  it("moram acima da moldura, por portal no slot do Preview", () => {
    expect(DS_DOC).toContain('data-slot="preview-controls"')
    expect(DS_DOC).toContain("createPortal(conteudo, slot)")
  })

  it("toda página com Eixo ou Interruptor os põe em Controles", () => {
    const soltas = paginas
      .filter(([, s]) => /<(Eixo|Interruptor)\b/.test(s) && !s.includes("<Controles"))
      .map(([f]) => f)
    expect(soltas).toEqual([])
  })

  it("nenhuma página escreve a bandeja segmentada como controle (fora do espécime do ToggleGroup)", () => {
    const aMao = paginas
      .filter(([f]) => f !== "toggle-group.tsx")
      .filter(([, s]) => s.includes('variant="segmented"'))
      .map(([f]) => f)
    expect(aMao).toEqual([])
  })

  it("nenhuma redeclara Controles nem Interruptores", () => {
    const aMao = paginas.filter(([, s]) => /^function (Controles|Interruptores)\b/m.test(s)).map(([f]) => f)
    expect(aMao).toEqual([])
  })
})
