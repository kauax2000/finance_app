import { describe, expect, it } from "vitest"

import { arquivosTsx, lerFonte, semComentarios } from "@/test/fonte"

/**
 * Sem o desvio do Enter, quem envia é a submissão implícita do navegador: o
 * botão `type="submit"` precisa pertencer ao formulário — estar dentro do
 * `<form>`/`Form` no mesmo arquivo, ou levar `form=`. Um `FormSubmit` dentro de
 * um `DialogFooter` que fica fora do `Form` precisa do `form=`.
 */
describe("todo submit pertence a um formulário", () => {
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
