import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { buttonVariants } from "./button"

/**
 * O primário é uma tecla (rodada 78): corpo chapado, contorno e plinto mais
 * escuros, um fio de luz de 1px no topo, e um realce por token que escurece
 * nos dois temas. Cada asserção tranca um defeito que existiu ou que as
 * rodadas de vidro deixaram medido.
 */

const RAIZ = resolve(process.cwd(), "src")
const CSS = readFileSync(join(RAIZ, "app/globals.css"), "utf8")
const PRIMARIO = buttonVariants({ variant: "primary" }).split(/\s+/)

function bloco(inicio: string) {
  const i = CSS.indexOf(inicio)
  expect(i, `bloco ${inicio} não achado`).toBeGreaterThan(-1)
  return CSS.slice(i, CSS.indexOf("\n}\n", i))
}
const CLARO = bloco(":root,\n.light {")
const ESCURO = bloco("\n.dark {")

/** A claridade de um `oklch(L …)` declarado no bloco. */
function claridade(blocoCss: string, token: string) {
  const m = blocoCss.match(new RegExp(`\\n\\s*${token}:\\s*oklch\\(([\\d.]+)`))
  expect(m, `${token} sem oklch`).not.toBeNull()
  return Number(m![1])
}

function arquivosTsx(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) return arquivosTsx(caminho)
    return caminho.endsWith(".tsx") ? [caminho] : []
  })
}

describe("o primário é uma tecla", () => {
  it("1. o realce é token, nunca alfa sobre a superfície", () => {
    expect(PRIMARIO).toContain("hover:bg-primary-hover")
    expect(PRIMARIO.join(" ")).not.toMatch(/bg-primary\/\d/)
  })

  it("2. nenhuma cor literal — a elevação vem de token", () => {
    expect(PRIMARIO.join(" ")).not.toMatch(/oklch\(|rgba?\(|#[0-9a-f]{3}|\bwhite\b|\bblack\b/i)
  })

  it("3. repouso: aresta, plinto, fio de luz e sombra de fora num token só", () => {
    for (const c of ["border-primary-edge", "shadow-(--primary-shadow-value)"]) {
      expect(PRIMARIO, c).toContain(c)
    }
    // `inset-shadow-(…)` prefixa `inset`: com o `inset` do token vira
    // `inset inset …`, inválido, e a cadeia de `box-shadow` inteira cai para
    // `none` — o anel de foco junto. Medido no navegador.
    expect(PRIMARIO.filter((c) => c.includes("inset-shadow-"))).toStrictEqual([])
  })

  it("4. o toque afunda a tecla e pinta o mesmo que o cursor", () => {
    for (const c of [
      "active:bg-primary-hover",
      "aria-expanded:bg-primary-hover",
      "active:shadow-(--primary-shadow-pressed-value)",
    ]) {
      expect(PRIMARIO, c).toContain(c)
    }
  })

  it("5. enviando fica afundada e com opacidade cheia; desabilitado achata", () => {
    // `aria-busy:` sozinho empataria com `disabled:` e perderia por ordem de
    // emissão; os dois juntos vencem.
    for (const c of [
      "aria-busy:disabled:shadow-(--primary-shadow-pressed-value)",
      "aria-busy:disabled:opacity-100",
      "disabled:shadow-none",
    ]) {
      expect(PRIMARIO, c).toContain(c)
    }
  })

  it("6. a transição é enumerada e usa a curva da casa, em todo peso", () => {
    for (const variant of ["primary", "secondary", "tertiary", "outline", "destructive", "link"] as const) {
      const classes = buttonVariants({ variant })
      expect(classes, variant).not.toContain("transition-all")
      expect(classes, variant).toContain("duration-(--duration-fast)")
      expect(classes, variant).toContain("ease-(--ease-out)")
    }
  })

  it("7. os tokens existem nos dois temas e o hover escurece nos dois", () => {
    const tokens = [
      "--primary-hover",
      "--primary-edge",
      "--primary-highlight",
      "--primary-shadow-value",
      "--primary-shadow-pressed-value",
    ]
    for (const t of tokens) {
      expect(CLARO, `${t} no :root`).toContain(`${t}:`)
      expect(ESCURO, `${t} no .dark`).toContain(`${t}:`)
    }
    expect(CSS).toContain("--color-primary-hover: var(--primary-hover)")
    expect(CSS).toContain("--color-primary-edge: var(--primary-edge)")

    // A elevação é escura: aresta < hover < corpo, nos dois temas.
    for (const [nome, b] of [["claro", CLARO], ["escuro", ESCURO]] as const) {
      const corpo = claridade(b, "--primary")
      const hover = claridade(b, "--primary-hover")
      const aresta = claridade(b, "--primary-edge")
      expect(hover, `${nome}: hover escurece`).toBeLessThan(corpo)
      expect(aresta, `${nome}: aresta abaixo do hover`).toBeLessThan(hover)
    }
  })

  it("8. nenhuma tela remenda o hover do primário à mão", () => {
    const culpados = arquivosTsx(RAIZ)
      .filter((f) => !f.includes(`${join("components", "ui")}`))
      .filter((f) => readFileSync(f, "utf8").includes("hover:bg-primary/90"))
    expect(culpados).toStrictEqual([])
  })
})
