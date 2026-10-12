import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"
import { esperarDepoisDeNoScrollbar } from "@/test/regras"

describe("as linhas da paleta sobem ao aparecer", () => {
  const css = lerFonte("src/app/globals.css")
  const paleta = lerFonte("src/components/ui/command.tsx")

  it("a utility mora depois de no-scrollbar e lê --command-reveal, 0s por padrão", () => {
    const bloco = esperarDepoisDeNoScrollbar(css, "@utility command-reveal {", { fecha: "@utility" })
    expect(bloco).toMatch(/rise var\(--command-reveal, 0s\) var\(--ease-spring\) both;\s*--rise-distance: 6px;/)
    // A escada para na quinta linha: 30ms por degrau, teto de quatro (120ms).
    expect(bloco).toMatch(/& \[cmdk-item\] \{\s*--stagger-base: 0ms;\s*--stagger-step: 30ms;\s*--stagger-cap: 4;\s*@apply stagger-ladder;/)
  })

  it("a lista veste a utility e só a pilha liga a duração", () => {
    const lista = paleta.slice(paleta.indexOf("function CommandList"), paleta.indexOf("function CommandEmpty"))
    expect(lista).toContain('"command-reveal"')
    // Quem liga é a variante `panel` (a pilha, no diálogo, solta e no Combobox); `plain` fica
    // em `0s`.
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
