import { existsSync } from "node:fs"
import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import {
  Form,
  FormActions,
  FormField,
  FormSubmit,
  FormSwitch,
  mensagemNativa,
  rotuloDeEspera,
} from "./form"

/** A rodada 214: as versões novas do `Form`. */

const CODIGO = lerFonte("src/components/ui/form.tsx")

/** Um campo com a validade que a função consulta — o ambiente é `node`. */
function campo(validity: Partial<ValidityState>, extra: Record<string, unknown> = {}) {
  return { validity, type: "text", title: "", validationMessage: "", ...extra } as unknown as HTMLInputElement
}

describe("as versões do Form", () => {
  it("o rótulo de espera sai do verbo, e o que não é verbo não muda", () => {
    expect(rotuloDeEspera("Salvar")).toBe("Salvando…")
    expect(rotuloDeEspera("Excluir")).toBe("Excluindo…")
    expect(rotuloDeEspera("Criar conta")).toBe("Criando conta…")
    expect(rotuloDeEspera("Sair")).toBe("Saindo…")
    expect(rotuloDeEspera("Próximo")).toBeNull()
    expect(rotuloDeEspera(h("span"))).toBeNull()
  })

  it("o FormSubmit enviando usa o verbo, e o pendingLabel ainda vence", () => {
    const envia = (props: Record<string, unknown>) =>
      renderToStaticMarkup(h(Form, { pending: true }, h(FormSubmit, props, "Convidar")))
    expect(envia({})).toContain("Convidando…")
    expect(envia({ pendingLabel: "Mandando" })).toContain("Mandando")
  })

  it("a validação nativa fala português", () => {
    expect(mensagemNativa(campo({ valueMissing: true }))).toBe("Preencha este campo.")
    expect(mensagemNativa(campo({ typeMismatch: true }, { type: "email" }))).toBe("Digite um e-mail válido.")
    expect(mensagemNativa(campo({ tooShort: true }, { minLength: 3 }))).toBe("Use pelo menos 3 caracteres.")
    expect(mensagemNativa(campo({ rangeOverflow: true }, { max: "10" }))).toBe("O máximo é 10.")
  })

  it("o formulário valida, e não o balão: noValidate no DOM, a tela opta por fora", () => {
    const html = renderToStaticMarkup(h(Form, null, "x"))
    expect(html.toLowerCase()).toContain("novalidate")
    // A tela que passa `noValidate` diz "eu valido" — e a checagem pula.
    expect(CODIGO).toContain("if (!noValidate) {")
    // Um controle sem `FormField` volta ao balão do navegador.
    expect(CODIGO).toContain("if (semLugar) e.currentTarget.reportValidity()")
  })

  it("onSubmit que devolve Promise segura o pending, e o foco vai ao erro", () => {
    expect(CODIGO).toMatch(/setEnviando\(true\)\s*void \(resultado as Promise<unknown>\)\.finally\(\(\) => \{\s*setEnviando\(false\)\s*focarErro\(\)/)
    expect(CODIGO).toContain("'[aria-invalid=\"true\"]'")
    // Enviando, um segundo envio não passa.
    expect(CODIGO).toMatch(/if \(pendente\) \{\s*e\.preventDefault\(\)\s*return/)
  })

  it("o FormField liga qualquer controle e mostra a frase nativa pelo id", () => {
    const html = renderToStaticMarkup(h(FormField, { label: "Data", children: h("button", { id: undefined, type: "button" }) }))
    const id = html.match(/<button[^>]*id="([^"]+)"/)?.[1]
    // O `for` do rótulo nasce no efeito do `FieldControl`; no servidor, o `id`.
    expect(id).toBeTruthy()
    expect(CODIGO).toContain("<FieldError>{error ?? form?.nativos[id]}</FieldError>")
  })

  it("a linha de preferência: a linha toda liga, e o par não tem gap", () => {
    const html = renderToStaticMarkup(h(FormSwitch, { label: "Avisos", description: "Três dias antes", variant: "card" }))
    expect(html).toContain("after:absolute after:inset-0")
    expect(html).toContain('role="switch"')
    expect(html).toContain("rounded-surface border border-border p-3")
  })

  it("a ação à esquerda vem antes no DOM; o inline empilha no telefone", () => {
    const html = renderToStaticMarkup(h(FormActions, { start: h("b", null, "voltar") }, h("i", null, "ok")))
    expect(html.indexOf("form-actions-start")).toBeLessThan(html.indexOf("<i>"))
    expect(html).toContain("sm:me-auto")
    expect(CODIGO).toContain('"flex flex-col gap-2 sm:flex-row sm:items-end sm:*:data-[slot=field]:flex-1"')
  })

  it("os comentários não contam o que deixou de ser verdade", () => {
    expect(CODIGO).not.toContain("e é uma molécula")
    expect(CODIGO).not.toContain("MobileSheetFormBody")
    expect(CODIGO).not.toContain("São 54 chamadas em 29 arquivos")
    const doc = lerFonte("src/app/designsystem/docs/form.tsx")
    expect(doc).not.toContain("variant=&quot;plain&quot;")
    expect(doc).not.toContain('type="search"')
  })

  it("o seletor com busca mora no Form, e a página dele é a do Form", () => {
    expect(existsSync(join(process.cwd(), "src/components/ui/form-picker-popover.tsx"))).toBe(false)
    expect(existsSync(join(process.cwd(), "src/app/designsystem/docs/form-picker-popover.tsx"))).toBe(false)
    expect(CODIGO).toMatch(/export \{[\s\S]*FormPickerPopoverTrigger,[\s\S]*\}/)
    expect(lerFonte("src/app/designsystem/docs/form.tsx")).toContain("<PickerDemo />")
    expect(lerFonte("src/app/designsystem/registry.ts")).not.toContain('"form-picker-popover"')
  })
})

