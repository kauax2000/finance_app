import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { arquivosTsx, lerFonte } from "@/test/fonte"

import {
  InputGroup,
  InputGroupInput,
  InputGroupPasswordToggle,
  InputGroupTextarea,
} from "./input-group"

/** O grupo de campo, trancado na rodada 193. */

describe("InputGroup", () => {
  it("a senha nasce escondida, com o olho rotulado", () => {
    const html = renderToStaticMarkup(
      h(InputGroup, null, h(InputGroupInput, { type: "password" }), h(InputGroupPasswordToggle))
    )
    expect(html).toContain('type="password"')
    expect(html).toContain('aria-label="Mostrar senha"')
    expect(html).toContain('aria-pressed="false"')
  })

  it("nenhuma tela escreve o olho da senha à mão", () => {
    const culpados = arquivosTsx(join(process.cwd(), "src"))
      .filter((c) => !c.includes("components/ui/"))
      .filter((c) => /\? "text" : "password"/.test(lerFonte(c)))
    expect(culpados).toEqual([])
  })

  it("o textarea com teto continua filho direto do grupo", () => {
    // O contador do `Textarea` embrulharia o campo, e `has-[>textarea]` deixaria
    // de valer: o grupo travaria na altura de uma linha.
    const html = renderToStaticMarkup(
      h(InputGroup, null, h(InputGroupTextarea, { maxLength: 140, defaultValue: "abc" }))
    )
    expect(html).not.toContain('data-slot="textarea-root"')
    expect(html).toMatch(/<div data-slot="input-group"[^>]*><textarea/)
    expect(html).toContain("3/140")
  })

  it("carregando, o Spinner toma a ponta e o grupo diz que está ocupado", () => {
    const html = renderToStaticMarkup(h(InputGroup, { pending: true }, h(InputGroupInput)))
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('data-pending=""')
  })
})
