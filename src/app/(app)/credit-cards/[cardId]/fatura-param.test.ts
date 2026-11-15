import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = semComentarios(lerFonte("src/app/(app)/credit-cards/[cardId]/page-client.tsx"))

describe("?fatura= na página do cartão", () => {
  it("lê o parâmetro e resolve o ciclo por cycleOffsetForCloseYmd", () => {
    expect(fonte).toContain("useSearchParams")
    expect(fonte).toContain('.get("fatura")')
    expect(fonte).toContain("cycleOffsetForCloseYmd(")
  })

  it("aplica uma vez por cartão, só com os dados carregados", () => {
    expect(fonte).toContain("faturaAplicadaPara")
    expect(fonte).toMatch(/if \(loading \|\| !card \|\| card\.id !== cardId \|\| faturaAplicadaPara/)
  })
})
