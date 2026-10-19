import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"
import { esperarDepoisDeNoScrollbar } from "@/test/regras"

describe("o feixe da pílula de busca espera a primeira tecla", () => {
  const css = lerFonte("src/app/globals.css")
  const paleta = lerFonte("src/components/ui/command.tsx")

  it("a utility mora depois de no-scrollbar, pausa sem data-waiting e pinta a marca", () => {
    const bloco = esperarDepoisDeNoScrollbar(css, "@utility command-beam {")
    expect(bloco).toContain("animation-play-state: running, paused, paused, paused")
    expect(bloco).toMatch(/&\[data-waiting\] \{[^}]*running/)
    expect(bloco).toMatch(/var\(--brand-teal\)[\s\S]*var\(--brand-green\)/)
    // A cor fica parada e a janela anda; e uma máscara só por pseudo.
    expect(bloco).not.toMatch(/hue-rotate/)
    expect(bloco).not.toMatch(/mask-composite/)
  })

  it("o trajeto é o do preset line: de 0,06 a 0,94", () => {
    const k = css.slice(css.indexOf("@keyframes command-beam-travel"), css.indexOf("@keyframes command-beam-edge"))
    expect(k).toContain("--command-beam-x: 0.06")
    expect(k).toContain("--command-beam-x: 0.94")
  })

  it("só a pílula do diálogo veste o feixe, e liga pelo campo vazio", () => {
    const campo = paleta.slice(paleta.indexOf("function CommandInput"), paleta.indexOf("function CommandScope"))
    expect(campo).toContain('comFeixe && "command-beam"')
    // O `data-waiting` vai à pílula, que é o `SearchInput`.
    expect(campo).toContain('rootProps={{ "data-waiting": (comFeixe && esperando) || undefined }')
    expect(campo).toContain("useCommandState")
    // Só o `CommandDialog` provê o contexto do feixe: a paleta solta e o `Combobox` são a
    // pilha, mas sem a luz.
    const dialogo = paleta.slice(paleta.indexOf("function CommandDialog"), paleta.indexOf("function CommandInput"))
    expect(dialogo).toContain("<CommandBeamContext.Provider value>")
    expect(paleta.match(/<CommandBeamContext\.Provider/g)?.length).toBe(1)
    expect(lerFonte("src/components/ui/combobox.tsx")).not.toContain("CommandBeam")
  })
})
