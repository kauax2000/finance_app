import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { dragHandleClassName } from "./drag-handle"

/**
 * A régua da alça, trancada.
 *
 * Este teste existe por causa de dois defeitos medidos, e cada um deu uma
 * asserção.
 *
 * **O primeiro foi uma classe que perdia calada.** O `vaul` injeta
 * `[data-vaul-handle]` numa folha criada em tempo de execução, que entra
 * **depois** da folha do app e empata em especificidade. A régua anterior
 * escrevia `!h-1.5 !w-12 !bg-…` e, ao lado deles, `rounded-full` **sem** `!` —
 * medido no navegador, o `border-radius` computado da alça era **16px**, o do
 * `vaul`. Três classes venciam, a quarta não, e nada apontava a diferença.
 *
 * **O segundo foi a alça virar um `null` com 31 chamadas.** Ela era escrita por
 * 27 arquivos de tela, 11 deles dentro de um `{isMobile ? … : null}` que
 * escolhia entre dois nadas. A alça é da superfície, como a borda e a sombra
 * são: a asserção 5 é o que impede as 31 de voltarem.
 *
 * Zero render — todas leem a string da régua ou o fonte sem comentários.
 */

const UI = join(process.cwd(), "src/components/ui")

/** O comentário cita de propósito o que o componente deixou de fazer. */
function semComentarios(fonte: string): string {
  return fonte.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1")
}

function fontes(dir: string): { nome: string; caminho: string; texto: string }[] {
  const out: { nome: string; caminho: string; texto: string }[] = []
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const caminho = join(dir, entrada.name)
    if (entrada.isDirectory()) out.push(...fontes(caminho))
    else if (/\.tsx?$/.test(entrada.name) && !entrada.name.endsWith(".test.ts"))
      out.push({ nome: entrada.name, caminho, texto: readFileSync(caminho, "utf8") })
  }
  return out
}

const classes = dragHandleClassName.split(/\s+/).filter(Boolean)

describe("régua da alça de arraste", () => {
  /**
   * A tabela é a folha que o `vaul` injeta, propriedade por propriedade. Toda
   * classe daqui que escreva uma delas tem de vencer, e a única forma de vencer
   * um empate de especificidade contra uma folha emitida depois é `!`.
   *
   * `my-*` fica de fora de propósito: o `vaul` declara `margin-left` e
   * `margin-right`, e não a margem vertical — não há disputa, então não há `!`.
   */
  const DECLARADAS_PELO_VAUL: [propriedade: string, prefixos: RegExp][] = [
    ["margin-inline", /^!?(mx|ms|me|ml|mr)-/],
    ["height", /^!?h-/],
    ["width", /^!?w-/],
    ["background", /^!?bg-/],
    ["border-radius", /^!?rounded(-|$)/],
    ["opacity", /^!?opacity-/],
  ]

  it("1. toda propriedade que o vaul também declara leva `!` — foi o defeito", () => {
    for (const [propriedade, prefixo] of DECLARADAS_PELO_VAUL) {
      const disputam = classes.filter((c) => prefixo.test(c.replace(/^[a-z-]+:/, "")))
      // Cada uma existe: a régua não pode deixar a medida por conta do vaul.
      expect(disputam.length, propriedade).toBeGreaterThan(0)
      for (const c of disputam) {
        // `hover:!bg-…` conta: o `!` vem depois do variante, não antes.
        expect(c.replace(/^(?:[a-z-]+:)*/, ""), `${propriedade} → ${c}`).toMatch(/^!/)
      }
    }
  })

  it("2. a margem vertical não leva `!` — o vaul não a declara", () => {
    const verticais = classes.filter((c) => /^!?my-/.test(c))
    expect(verticais).toStrictEqual(["my-2.5"])
  })

  it("3. todo realce de cursor tem par de toque", () => {
    // `hover:` compila dentro de `@media (hover: hover)`, e a superfície que
    // esta peça serve é justamente a que só existe no dedo. A regra H do
    // auditor não alcança esta string, porque ela não é um `cva`.
    const hover = classes.filter((c) => c.startsWith("hover:"))
    expect(hover.length).toBeGreaterThan(0)
    for (const c of hover) {
      expect(classes).toContain(c.replace("hover:", "active:"))
    }
  })

  it("4. nenhuma superfície reimplementa a alça", () => {
    const reimplementam = fontes(UI)
      .filter((f) => f.nome !== "drag-handle.tsx")
      .filter((f) => /DrawerPrimitive\.Handle|data-vaul-handle/.test(semComentarios(f.texto)))
    // `sheet.tsx` e `drawer.tsx` escreviam os dois o mesmo elemento, com
    // `data-slot` **diferentes** — `sheet-drag-handle` contra `drawer-handle`.
    // Duas cópias de três linhas que já tinham divergido.
    expect(reimplementam.map((f) => f.nome)).toStrictEqual([])
  })

  it("5. a alça é da superfície: nenhuma tela a escreve", () => {
    const raiz = join(process.cwd(), "src")
    const telas = fontes(raiz)
      .filter((f) => !f.caminho.startsWith(UI))
      .filter((f) => /<DragHandle[\s/>]/.test(semComentarios(f.texto)))
    // Se isto falhar, alguém escreveu a alça numa tela — e no telefone seriam
    // duas, das quais só uma arrastaria.
    expect(telas.map((f) => f.caminho.slice(raiz.length + 1))).toStrictEqual([])
  })

  it("6. um `data-slot` só, e ele é o da peça", () => {
    const peça = readFileSync(join(UI, "drag-handle.tsx"), "utf8")
    expect(peça).toContain('data-slot="drag-handle"')
    const antigos = fontes(UI).filter((f) =>
      /data-slot="(?:sheet-drag-handle|drawer-handle)"/.test(f.texto)
    )
    expect(antigos.map((f) => f.nome)).toStrictEqual([])
  })
})
