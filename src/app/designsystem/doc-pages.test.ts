import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { REGISTRY } from "./registry"

/**
 * A forma das páginas de componente, trancada (`docs/design/COMPONENTE-NOVO.md`,
 * seção 4). As rodadas 223 a 235 refizeram página por página o mesmo trabalho
 * — juntar as demonstrações repetidas num trilho de eixos, tirar o retângulo
 * tracejado, pôr a tabela de props —, e este teste é o que impede a próxima
 * página de nascer precisando dele.
 */

const DOCS = "src/app/designsystem/docs"
const pagina = (slug: string) => readFileSync(join(DOCS, `${slug}.tsx`), "utf8")

const COMPONENTES = REGISTRY.filter((e) => e.category !== "Foundations")

describe("as páginas de componente", () => {
  it("toda entrada tem página", () => {
    const sem = REGISTRY.filter((e) => !existsSync(join(DOCS, `${e.slug}.tsx`))).map((e) => e.slug)
    expect(sem).toEqual([])
  })

  it("abrem com o quando usar e fecham com a tabela de props", () => {
    const sem = COMPONENTES.filter((e) => {
      const p = pagina(e.slug)
      return !p.includes("<Usage") || !p.includes("<PropsTable")
    }).map((e) => e.slug)
    expect(sem).toEqual([])
  })

  it("nenhuma redeclara os controles da demonstração: Eixo e Interruptor moram no ds-doc", () => {
    const aMao = readdirSync(DOCS)
      .filter((f) => f.endsWith(".tsx"))
      .filter((f) => /^function (Eixo|Interruptor)\b/m.test(readFileSync(join(DOCS, f), "utf8")))
    expect(aMao).toEqual([])
  })

  it("nenhuma usa conteúdo de mentira no lugar do conteúdo de produto", () => {
    const vazias = readdirSync(DOCS)
      .filter((f) => f.endsWith(".tsx"))
      .filter((f) => /Conteúdo da seção|lorem ipsum/i.test(readFileSync(join(DOCS, f), "utf8")))
    expect(vazias).toEqual([])
  })
})
