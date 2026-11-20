import { describe, expect, it, vi } from "vitest"
import { naoFecharPorForaNoTelefone } from "@/lib/pointer"
import { lerFonte, semComentarios } from "@/test/fonte"

// Decisão do dono (20/11/2026): no telefone, tocar fora de um diálogo não o fecha.
function evento(telefone: boolean) {
  const matchMedia = vi.fn(() => ({ matches: telefone }))
  return {
    target: { ownerDocument: { defaultView: { matchMedia } } },
    preventDefault: vi.fn(),
  } as unknown as Event & { preventDefault: ReturnType<typeof vi.fn> }
}

describe("tocar fora no telefone não fecha o diálogo", () => {
  it("abaixo de 768px impede o fechar; acima, deixa", () => {
    const tel = evento(true)
    expect(naoFecharPorForaNoTelefone(tel)).toBe(true)
    expect(tel.preventDefault).toHaveBeenCalled()
    const desk = evento(false)
    expect(naoFecharPorForaNoTelefone(desk)).toBe(false)
    expect(desk.preventDefault).not.toHaveBeenCalled()
  })

  it.each([
    "src/components/ui/dialog.tsx",
    "src/components/ui/sheet.tsx",
    "src/components/ui/drawer.tsx",
    "src/components/ui/alert-dialog.tsx",
    "src/components/ui/command.tsx",
    "src/components/transactions/lancamento-inteligente.tsx",
  ])("%s passa o toque fora pela regra", (arquivo) => {
    expect(semComentarios(lerFonte(arquivo))).toContain("naoFecharPorForaNoTelefone(")
  })
})
