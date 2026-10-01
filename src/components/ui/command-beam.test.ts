import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")

describe("o feixe da pílula de busca espera a primeira tecla (rodada 142)", () => {
  const css = fonte("src/app/globals.css")
  const paleta = fonte("src/components/ui/command.tsx")

  it("a utility mora depois de no-scrollbar, pausa sem data-waiting e pinta a marca", () => {
    const util = css.indexOf("@utility command-beam {")
    expect(util).toBeGreaterThan(css.indexOf("@utility no-scrollbar"))
    const bloco = css.slice(util, css.indexOf("\n}\n", util))
    expect(bloco).toContain("animation-play-state: paused")
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
    // O `data-waiting` vai à pílula, que desde a rodada 198 é o `SearchInput`.
    expect(campo).toContain('rootProps={{ "data-waiting": (comFeixe && esperando) || undefined }')
    expect(campo).toContain("useCommandState")
    // Só o `CommandDialog` provê o contexto do feixe: a paleta solta e o
    // `Combobox` são a pilha, mas sem a luz (rodada 143, a pedido do dono).
    const dialogo = paleta.slice(paleta.indexOf("function CommandDialog"), paleta.indexOf("function CommandInput"))
    expect(dialogo).toContain("<CommandBeamContext.Provider value>")
    expect(paleta.match(/<CommandBeamContext\.Provider/g)?.length).toBe(1)
    expect(fonte("src/components/ui/combobox.tsx")).not.toContain("CommandBeam")
  })
})
