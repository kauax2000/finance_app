import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import { CATEGORY_ORDER, REGISTRY } from "./registry"

/**
 * A taxonomia do catálogo, trancada. A categoria saía de dois `Set` escritos à mão e o que não
 * estava em nenhum caía em "Organisms" por fall-through silencioso (32 de 75 componentes na
 * camada errada). A régua é a hierarquia que cresce: átomo é indivisível, molécula é feita de
 * átomos, organismo é feito de moléculas. O teste mede só o grafo de imports dentro de `ui/`; o
 * resto é decisão de quem classifica, no `layer()` de cada bloco do `REGISTRY`.
 */

const UI = "src/components/ui"

/**
 * O grafo de composição, lido da fonte: quem importa quem dentro de `ui/`. Só enxerga
 * `@/components/ui/...`; um `./button` relativo escaparia daqui.
 */
function deps(slug: string): string[] {
  const src = lerFonte(join(UI, `${slug}.tsx`))
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
 * A camada que vale no grafo: `typography` está em Fundações pela página, mas os nove
 * componentes são átomos (nenhum compõe outro) e é como átomos que o sistema os veste. Sem esta
 * linha `select.tsx` reprovaria na asserção 2.
 */
const camadaNoGrafo = (slug: string) =>
  slug === "typography" ? "Atoms" : camadaDe.get(slug)

/** A mesma collation para todo mundo: `sort` sem locale põe "Ã" depois de "Z". */
const porNome = (a: string, b: string) =>
  a.localeCompare(b, "pt-BR", { sensitivity: "base" })

describe("taxonomia", () => {
  it("1. todo componente de ui/ tem entrada e página no catálogo", () => {
    const semEntrada = [...arquivos].filter((s) => !camadaDe.has(s))
    expect(semEntrada).toEqual([])
    // O nome prometia a página e só conferia a entrada.
    const semPagina = [...arquivos].filter(
      (s) => !existsSync(join("src/app/designsystem/docs", `${s}.tsx`))
    )
    expect(semPagina).toEqual([])
  })

  /**
   * A régua do átomo é a do modelo: indivisível, e especializar um átomo continua átomo; o que
   * o tira de lá é compor dois ou mais componentes do sistema, ou qualquer peça que não seja
   * átomo. O teste tranca só a parte mecânica. Se um átomo voltar a importar um átomo, a
   * pergunta é: isto é um componente ou um modo?
   */
  it("2. um átomo importa no máximo um componente de ui/, e ele é átomo", () => {
    const violando = componentes
      .filter((e) => e.category === "Atoms")
      .map((e) => ({ slug: e.slug, deps: deps(e.slug) }))
      .filter(
        (x) =>
          x.deps.length > 1 ||
          x.deps.some((d) => camadaNoGrafo(d) !== "Atoms")
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
      .filter((e) => e.category === "Molecules")
      .map((e) => ({
        slug: e.slug,
        naoAtomos: deps(e.slug).filter(
          (d) => camadaDe.has(d) && camadaNoGrafo(d) !== "Atoms"
        ),
      }))
      .filter(
        (x) =>
          x.naoAtomos.length >= 2 ||
          x.naoAtomos.some((d) => camadaDe.get(d) === "Organisms")
      )
    expect(violando).toEqual([])
  })

  it("4. toda categoria declarada está na ordem de exibição", () => {
    const usadas = new Set(REGISTRY.map((e) => e.category))
    for (const c of usadas) expect(CATEGORY_ORDER).toContain(c)
  })

  /**
   * `table-panel` mora dentro do `data-table`. A moldura compõe `Card`, `Table` e `Pagination`
   * (dois ou mais organismos dispostos num layout): os templates são feitos de organismos.
   */
  it("5. Templates é o nível de página, e não uma terceira gaveta", () => {
    const templates = REGISTRY.filter((e) => e.category === "Templates")
    expect(templates.map((e) => e.slug).sort()).toEqual([
      "bottom-bar",
      // O motor da tabela: o `TablePanel` com o estado.
      "data-table",
      "page-header",
      "page-section",
      // A casca da página com navegação: o `SidebarProvider` e o `SidebarInset` dispõem a barra
      // e o conteúdo.
      "sidebar",
      // Casco de página inteira, fora da casca do app. Ele entrou com
      // autorização humana, como manda a invariante 6, e recebe o campo por
      // **slot**: o que o campo mostra é conteúdo de produto, e conteúdo de
      // produto não mora em `ui/`. É o que separa este Template do
      // `AuthShell`, que fica em `components/layout/` amarrando os dois.
      "split-shell",
      // A barra de uma lista: dispõe filtros, ações e fichas, e prende sob o `TopBar`.
      "toolbar",
      "top-bar",
    ])
  })

  /**
   * Duas páginas não podem apontar para o mesmo `source`: cada uma teria a própria cópia da
   * tabela de props, e elas divergem. As outras asserções trancam a taxonomia e não olham para
   * isso.
   */
  it("6. nenhum arquivo de ui/ é fonte de duas entradas", () => {
    const porFonte = new Map<string, string[]>()
    for (const e of REGISTRY) {
      if (!e.source?.startsWith(UI)) continue
      porFonte.set(e.source, [...(porFonte.get(e.source) ?? []), e.slug])
    }
    const duplicadas = [...porFonte].filter(([, slugs]) => slugs.length > 1)
    expect(duplicadas).toEqual([])
  })

  /**
   * A ordem dentro de cada categoria é alfabética pelo `name` exibido (não pelo slug: `sonner`
   * é "Toast"), porque é por ele que se procura. A ordem é literal no array e só trancada aqui;
   * o app não ordena em runtime.
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
