import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { CATEGORY_ORDER, REGISTRY } from "./registry"

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
 * A régua que ele tranca é a hierarquia que **cresce**: átomo é indivisível,
 * molécula é feita de átomos, organismo é feito de moléculas. O que cada
 * asserção mede é só a parte mecânica dela — o grafo de imports dentro de
 * `ui/` —, e a parte que o grafo não alcança (a anatomia interna de um
 * `Select`, a diferença entre especializar e compor) é decisão de quem
 * classifica, escrita no `LAYER`.
 */

const UI = "src/components/ui"

/**
 * O grafo de composição, lido da fonte: quem importa quem dentro de `ui/`.
 * Só enxerga `@/components/ui/...` — hoje não há import relativo em `ui/`
 * (medido), e um `./button` futuro escaparia daqui.
 */
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

/**
 * A camada que vale **no grafo**. `typography` está em Fundações porque a
 * página dele é a Fundação de tipo — mas os nove componentes do arquivo são
 * átomos pelo teste do arquivo (nenhum compõe outro), e é como átomos que o
 * resto do sistema os veste: `PageHeaderTitle` sobre `H1`, `CardDescription`
 * sobre `Muted`, `SelectLabel` sobre `Caption`. Vestir a Fundação de tipo não é
 * compor, e sem esta linha `select.tsx` reprovaria na asserção 2 por importar
 * um "não-átomo".
 */
const camadaNoGrafo = (slug: string) =>
  slug === "typography" ? "Átomos" : camadaDe.get(slug)

/** A mesma collation para todo mundo: `sort` sem locale põe "Ã" depois de "Z". */
const porNome = (a: string, b: string) =>
  a.localeCompare(b, "pt-BR", { sensitivity: "base" })

describe("taxonomia", () => {
  it("1. todo componente de ui/ tem entrada e página no catálogo", () => {
    const semEntrada = [...arquivos].filter((s) => !camadaDe.has(s))
    expect(semEntrada).toEqual([])
  })

  /**
   * A asserção que valia aqui era "nenhum átomo importa nada de `ui/`". Ela
   * media o embrulho, e não a peça: `Slider` passava como átomo renderizando
   * quatro primitivas Radix por dentro (root, track, range, thumb), enquanto
   * `MoneyInput` — um `Input` com máscara — reprovava por importar `Input`. A
   * diferença entre os dois era só onde a composição mora: dentro do arquivo
   * ou num import. E `Select`, com zero imports e dez exports, tinha ido para
   * Moléculas pelo estilo do embrulho.
   *
   * A régua agora é a do modelo: átomo é indivisível, e **especializar** um
   * átomo continua átomo. O que o tira de lá é **compor** — dois ou mais
   * componentes do sistema, ou qualquer peça que não seja átomo. O teste tranca
   * só a parte mecânica: um átomo que importa um único átomo para o compor, e
   * não para o especializar, passa aqui e é decisão de quem classifica.
   *
   * *(Os dois exemplos que a cláusula tinha morreram, e pelo mesmo motivo.
   * `KbdShortcut` foi absorvido pelo `Kbd` como `keys`; `MoneyInput` foi
   * absorvido pelo `Input` como `money`. Nos dois casos o especializador
   * importava **um** componente e renderizava **um** elemento — era o átomo com
   * outro nome, cobrando do catálogo uma segunda página. Entre os átomos a
   * cláusula ficou com **zero** casos, e é o resultado que se devia esperar:
   * especializar um átomo num arquivo à parte é quase sempre um `prop`
   * procurando virar componente. Ela continua valendo uma camada acima, onde a
   * especialização é real — `StatCard` sobre `Card`. Se um átomo voltar a
   * importar um átomo, a pergunta a fazer é a desta rodada: **isto é um
   * componente ou um modo?**)*
   */
  it("2. um átomo importa no máximo um componente de ui/, e ele é átomo", () => {
    const violando = componentes
      .filter((e) => e.category === "Átomos")
      .map((e) => ({ slug: e.slug, deps: deps(e.slug) }))
      .filter(
        (x) =>
          x.deps.length > 1 ||
          x.deps.some((d) => camadaNoGrafo(d) !== "Átomos")
      )
    expect(violando).toEqual([])
  })

  /**
   * Uma molécula é feita de átomos. Compondo duas ou mais peças que não são
   * átomos ela é organismo — e compondo **um** organismo também, porque quem
   * contém organismo é organismo (o `Breadcrumb` está em Organismos por
   * carregar um `DropdownMenu` no miolo dobrado).
   */
  it("3. nenhuma molécula compõe duas peças que não são átomos, nem um organismo", () => {
    const violando = componentes
      .filter((e) => e.category === "Moléculas")
      .map((e) => ({
        slug: e.slug,
        naoAtomos: deps(e.slug).filter(
          (d) => camadaDe.has(d) && camadaNoGrafo(d) !== "Átomos"
        ),
      }))
      .filter(
        (x) =>
          x.naoAtomos.length >= 2 ||
          x.naoAtomos.some((d) => camadaDe.get(d) === "Organismos")
      )
    expect(violando).toEqual([])
  })

  it("4. toda categoria declarada está na ordem de exibição", () => {
    const usadas = new Set(REGISTRY.map((e) => e.category))
    for (const c of usadas) expect(CATEGORY_ORDER).toContain(c)
  })

  it("5. Templates é o nível de página, e não uma terceira gaveta", () => {
    const templates = REGISTRY.filter((e) => e.category === "Templates")
    expect(templates.map((e) => e.slug).sort()).toEqual([
      "page-header",
      "page-section",
    ])
  })

  /**
   * A asserção que faltava, e que deixou duas páginas para o mesmo arquivo
   * viverem duas rodadas: `Tipografia` (Fundação) e `Typography` (Átomo)
   * declaravam **o mesmo `source`**, renderizavam os mesmos nove componentes com
   * as mesmas strings, e cada uma tinha a própria cópia da tabela de props — que
   * já tinha divergido. Nenhuma das outras asserções olha para isso: elas
   * trancam a *taxonomia*, e duas páginas para o mesmo arquivo sempre foram
   * legais.
   *
   * `Padrões` fica de fora, e não é escapatória: `formularios`,
   * `vazio-carregando` e `graficos` apontam de propósito para `form.tsx`,
   * `empty-state.tsx` e `chart.tsx`, porque um Padrão é uma decisão que
   * atravessa telas cuja casa por acaso é um componente. Uma segunda página *de
   * componente* para o mesmo arquivo é que é duplicação.
   */
  it("6. nenhum arquivo de ui/ é fonte de duas entradas fora de Padrões", () => {
    const porFonte = new Map<string, string[]>()
    for (const e of REGISTRY) {
      if (e.category === "Padrões" || !e.source?.startsWith(UI)) continue
      porFonte.set(e.source, [...(porFonte.get(e.source) ?? []), e.slug])
    }
    const duplicadas = [...porFonte].filter(([, slugs]) => slugs.length > 1)
    expect(duplicadas).toEqual([])
  })

  /**
   * A ordem dentro de cada categoria era a ordem em que cada `entry()` foi
   * escrita — 75 chamadas acumuladas em rodadas —, e os comentários
   * `// ── Átomos ──` do array já apontavam para um bloco com doze moléculas
   * dentro. Alfabética pelo `name` exibido, e não pelo slug (`sonner` é
   * "Toast"), porque é o nome que a lateral e o índice mostram, e é por ele
   * que se procura. A ordem é literal no array e só trancada aqui: o app não
   * ordena em runtime, então não há ICU de navegador para divergir do Node.
   */
  it("7. dentro de cada categoria, o REGISTRY está em ordem alfabética pelo name", () => {
    for (const category of CATEGORY_ORDER) {
      const nomes = REGISTRY.filter((e) => e.category === category).map(
        (e) => e.name
      )
      expect(nomes, category).toEqual([...nomes].sort(porNome))
    }
  })
})
