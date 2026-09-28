import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")

describe("as linhas da paleta sobem ao aparecer (rodada 139)", () => {
  const css = fonte("src/app/globals.css")
  const paleta = fonte("src/components/ui/command.tsx")

  it("a utility mora depois de no-scrollbar e lê --command-reveal, 0s por padrão", () => {
    const util = css.indexOf("@utility command-reveal {")
    expect(util).toBeGreaterThan(css.indexOf("@utility no-scrollbar"))
    const bloco = css.slice(util, css.indexOf("@utility", util + 1))
    expect(bloco).toMatch(/disclosure-rise var\(--command-reveal, 0s\) var\(--ease-spring\)/)
    expect(bloco).toMatch(/nth-child\(n \+ 5\)/)
  })

  it("a lista veste a utility e só a pilha liga a duração", () => {
    const lista = paleta.slice(paleta.indexOf("function CommandList"), paleta.indexOf("function CommandEmpty"))
    expect(lista).toContain('"command-reveal"')
    // Desde a rodada 143 quem liga é a variante `panel` — a pilha, no diálogo,
    // solta e no Combobox. `plain` fica em `0s`.
    const cva = paleta.slice(paleta.indexOf("const commandVariants"), paleta.indexOf("defaultVariants"))
    expect(cva).toMatch(/panel: "[^"]*\[--command-reveal:var\(--duration-spring\)\]/)
    expect(paleta.replace(cva, "")).not.toContain("--command-reveal:")
  })

  it("o escopo é texto pintado, não Badge, e o campo tem o slot", () => {
    expect(paleta).toMatch(/function CommandScope/)
    expect(paleta).toMatch(/leading\?: React\.ReactNode/)
    const chip = paleta.slice(paleta.indexOf("function CommandScope"), paleta.indexOf("function CommandList"))
    expect(chip).toContain("text-(--command-scope-ink)")
    expect(chip).not.toContain("bg-info-muted")
    expect(chip).not.toContain("<Badge")
    expect(paleta).not.toContain("@/components/ui/badge")
    // Sem ×: o escopo sai em dois Backspace, e armado acende o fundo.
    expect(chip).not.toContain("XMarkIcon")
    expect(chip).toContain("data-armed:bg-(--command-scope-ink)/20")
    expect(chip).toContain('aria-live="polite"')
  })
})
