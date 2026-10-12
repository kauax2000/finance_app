import { describe, expect, it } from "vitest"

import { arquivosTsx, lerFonte, semComentarios } from "@/test/fonte"

/**
 * Sem o desvio do Enter, quem envia é a submissão implícita do navegador: ela
 * aciona o primeiro botão de envio do formulário. O teste é por arquivo — um
 * arquivo com `type="submit"`/`FormSubmit` também tem um `<form>`/`Form` ou um
 * `form=` —, e a árvore JSX de cada formulário do app foi conferida à mão na
 * rodada 252.
 */
describe("todo submit tem um formulário no mesmo arquivo", () => {
  const arquivos = arquivosTsx("src", ["designsystem"])
  it.each(arquivos)("%s", (arquivo) => {
    const fonte = semComentarios(lerFonte(arquivo), "tudo")
    const temSubmit = /type="submit"|<FormSubmit\b/.test(fonte)
    if (!temSubmit) return
    const temForm = /<(Form|CustomForm|form)\b/.test(fonte)
    const temAtributoForm = /\bform=\{|\bform="/.test(fonte)
    expect(temForm || temAtributoForm, `${arquivo}: submit sem <form> nem form=`).toBe(true)
  })
})

/** As tags de abertura `<button …>` do fonte, com chaves e strings respeitadas. */
function botoesCrus(fonte: string): string[] {
  const tags: string[] = []
  for (const m of fonte.matchAll(/<button(?=[\s>/])/g)) {
    let i = m.index + m[0].length
    let chaves = 0
    let aspas: string | null = null
    for (; i < fonte.length; i++) {
      const c = fonte[i]
      if (aspas) {
        if (c === aspas) aspas = null
      } else if (c === '"' || c === "'" || c === "`") aspas = c
      else if (c === "{") chaves++
      else if (c === "}") chaves--
      else if (c === ">" && chaves === 0) break
    }
    tags.push(fonte.slice(m.index, i + 1))
  }
  return tags
}

/**
 * Um `<button>` sem `type` é de envio, e a submissão implícita aciona o
 * **primeiro** do formulário: um botão de ícone antes do "Salvar" roubaria o
 * Enter. O `Button` nasce `type="button"`; todo `<button>` cru escreve o seu.
 */
describe("nenhum botão vira o de envio por omissão", () => {
  it("o Button nasce type=\"button\" (fora do asChild)", () => {
    const fonte = semComentarios(lerFonte("src/components/ui/button.tsx"), "tudo")
    expect(fonte).toMatch(/type=\{asChild \? undefined : "button"\}\s*\n\s*\{\.\.\.props\}/)
  })

  const arquivos = arquivosTsx("src", ["designsystem"])
  it.each(arquivos)("%s: todo <button> cru declara type", (arquivo) => {
    const fonte = semComentarios(lerFonte(arquivo), "tudo")
    const semTipo = botoesCrus(fonte).filter((tag) => !/\btype=/.test(tag))
    expect(semTipo, arquivo).toEqual([])
  })
})
