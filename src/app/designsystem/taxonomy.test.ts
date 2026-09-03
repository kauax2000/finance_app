import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { CATEGORY_ORDER, REGISTRY, movedFrom } from "./registry"

/**
 * A taxonomia do catálogo, trancada.
 *
 * Este teste existe por causa de um defeito medido: **32 dos 75 componentes
 * estavam na camada errada**, 43% do catálogo. A causa não foi desatenção — foi
 * mecânica. A categoria saía de dois `Set` escritos à mão, e o que não estava em
 * nenhum dos dois caía em "Organismos" por *fall-through* silencioso. Foi assim
 * que `Typography` (nove átomos de texto que não compõem nada) foi parar ao lado
 * da `Sidebar`.
 *
 * A asserção que de fato vale é a **2** — nenhum átomo pode compor outro
 * componente. É ela que teria pego `Field`, `InputGroup` e `SearchInput`
 * enquanto eles se declaravam átomos importando três componentes cada.
 */

const UI = "src/components/ui"

/** O grafo de composição, lido da fonte: quem importa quem dentro de `ui/`. */
function deps(slug: string): string[] {
  const src = readFileSync(join(UI, `${slug}.tsx`), "utf8")
  return [
    ...new Set(
      [...src.matchAll(/from\s+"@\/components\/ui\/([a-z0-9-]+)"/g)].map(
        (m) => m[1]
      )
    ),
  ]
}

const arquivos = new Set(
  readdirSync(UI)
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => f.replace(/\.tsx$/, ""))
)

const camadaDe = new Map(REGISTRY.map((e) => [e.slug, e.category]))
const componentes = REGISTRY.filter((e) => arquivos.has(e.slug))

describe("taxonomia", () => {
  it("1. todo componente de ui/ tem entrada e página no catálogo", () => {
    const semEntrada = [...arquivos].filter((s) => !camadaDe.has(s))
    expect(semEntrada).toEqual([])
  })

  /**
   * O teste que teria evitado a rodada inteira. Um átomo é indivisível: se ele
   * importa outro componente do sistema, ele é pelo menos uma molécula.
   */
  it("2. nenhum átomo compõe outro componente do sistema", () => {
    const violando = componentes
      .filter((e) => e.category === "Átomos")
      .map((e) => ({ slug: e.slug, deps: deps(e.slug) }))
      .filter((x) => x.deps.length > 0)
    expect(violando).toEqual([])
  })

  /**
   * Uma molécula compõe no máximo átomos. Compondo duas moléculas — ou uma
   * molécula e carregando estado próprio — ela virou organismo.
   */
  it("3. nenhuma molécula compõe duas ou mais moléculas", () => {
    const violando = componentes
      .filter((e) => e.category === "Moléculas")
      .map((e) => ({
        slug: e.slug,
        naoAtomos: deps(e.slug).filter(
          (d) => camadaDe.has(d) && camadaDe.get(d) !== "Átomos"
        ),
      }))
      .filter((x) => x.naoAtomos.length >= 2)
    expect(violando).toEqual([])
  })

  it("4. toda categoria declarada está na ordem de exibição", () => {
    const usadas = new Set(REGISTRY.map((e) => e.category))
    for (const c of usadas) expect(CATEGORY_ORDER).toContain(c)
  })

  /**
   * A marca temporária de "movido" não pode apontar para a camada em que a peça
   * já está. Duas apontavam, na primeira versão desta rodada — e uma marca que
   * mente é pior que marca nenhuma.
   */
  it("5. nenhuma marca de movido aponta para a própria camada", () => {
    const mentindo = REGISTRY.filter(
      (e) => movedFrom(e.slug) === e.category
    ).map((e) => e.slug)
    expect(mentindo).toEqual([])
  })

  /**
   * A marca é temporária, e mapa temporário apodrece: uma chave que aponta para
   * um slug que não existe mais é da família "sobreviveu à remoção" que esta
   * base já documenta três vezes.
   */
  it("6. nenhuma marca de movido aponta para um slug que não existe", () => {
    const src = readFileSync(join("src/app/designsystem", "registry.ts"), "utf8")
    const bloco = /const MOVED_FROM[^=]*= \{([\s\S]*?)\n\}/.exec(src)?.[1] ?? ""
    const chaves = [...bloco.matchAll(/^\s*"?([a-z0-9-]+)"?:/gm)].map((m) => m[1])
    expect(chaves.filter((k) => !camadaDe.has(k))).toEqual([])
    // e toda chave tem de estar de fato marcada em runtime
    expect(chaves.filter((k) => !movedFrom(k))).toEqual([])
  })

  it("7. Templates é o nível de página, e não uma terceira gaveta", () => {
    const templates = REGISTRY.filter((e) => e.category === "Templates")
    expect(templates.map((e) => e.slug).sort()).toEqual([
      "page-header",
      "page-section",
    ])
  })
})
