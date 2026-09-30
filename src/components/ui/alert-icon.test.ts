import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/** O alerta (rodada 186) e a faixa (rodada 187). */

const ALERT = readFileSync(join(process.cwd(), "src/components/ui/alert.tsx"), "utf8")
const BARRA = readFileSync(join(process.cwd(), "src/components/ui/announcement-bar.tsx"), "utf8")

const arquivos = (dir: string): string[] =>
  readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome)
    return statSync(caminho).isDirectory()
      ? arquivos(caminho)
      : /\.tsx$/.test(nome)
        ? [caminho]
        : []
  })

const TELAS = arquivos(join(process.cwd(), "src")).map((caminho) => ({
  caminho,
  texto: readFileSync(caminho, "utf8"),
}))

describe("o alerta", () => {
  it("o ícone é do tom, e nenhuma chamada o escreve como filho", () => {
    // Seis telas escolhiam o ícone à mão, e o destrutivo saía triângulo em
    // cinco e círculo no catálogo. Quem quer outro passa `icon`.
    // Vale para a `AnnouncementBar` desde a rodada 187, com a mesma API.
    const filho = /<(?:Alert|AnnouncementBar)\b[^>]*>\s*(?:\{\/\*[\s\S]*?\*\/\}\s*)?<[A-Z]\w*Icon\b/
    const culpados = TELAS.filter(({ texto }) => filho.test(texto)).map(
      ({ caminho }) => caminho
    )
    expect(culpados).toEqual([])
    expect(ALERT).toContain("destructive: <XCircleIcon />")
    expect(BARRA).toContain("destructive: <XCircleIcon />")
  })

  it("a faixa centralizada tira o × do fluxo, e a marca não perde o sticky", () => {
    expect(BARRA).toContain("group-data-[align=center]/announcement:absolute")
    // O `relative` do véu é do `static`: na marca ele vencia o `sticky`.
    expect(BARRA).toContain('static: "relative')
    expect(BARRA).not.toMatch(/"relative isolate/)
  })

  it("a quebra da palavra longa é do título, não da tela", () => {
    expect(ALERT).toContain("wrap-break-word")
    const culpados = TELAS.filter(({ texto }) =>
      /<Alert(?:Title|Description)\b[^>]*\bbreak-words\b/.test(texto)
    ).map(({ caminho }) => caminho)
    expect(culpados).toEqual([])
  })

  it("a ação na linha vence a do pé por atributo, não por ordem", () => {
    // Por condição em JS, `col-[-2/-1]` e `col-start-2` empatariam em
    // especificidade e a ordem de emissão decidiria.
    expect(ALERT).toContain("@md/alert:data-[placement=inline]:col-[-2/-1]")
    // E o contêiner só existe com ela: `inline-size` num pai que encolhe ao
    // conteúdo levaria o alerta a 0.
    expect(ALERT).toContain("has-[>[data-placement=inline]]:@container/alert")
  })

  it("a entrada é CSS, sem timer", () => {
    expect(ALERT).toContain("starting:opacity-0")
  })
})
