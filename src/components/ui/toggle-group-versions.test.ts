import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { tagChipFilterSelected, tagChipNeutral } from "./badge"
import { toggleVariants } from "./toggle"
import { ToggleGroup, ToggleGroupItem } from "./toggle-group"

/** As versões da rodada 199. */

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")

const grupo = (props: Record<string, unknown>, ...itens: Record<string, unknown>[]) =>
  renderToStaticMarkup(
    h(
      ToggleGroup,
      { type: "single", "aria-label": "Grupo", ...props } as never,
      ...itens.map((i, n) => h(ToggleGroupItem, { key: n, ...i } as never))
    )
  )

describe("ToggleGroup, rodada 199", () => {
  it("a ficha é, classe a classe, o chip de filtro do Badge", () => {
    const ficha = toggleVariants({ variant: "chip" }).split(/\s+/)
    for (const c of tagChipNeutral.split(/\s+/)) expect(ficha).toContain(c)
    for (const c of tagChipFilterSelected.split(/\s+/)) {
      const [variante, classe] = c.startsWith("dark:") ? ["dark:", c.slice(5)] : ["", c]
      expect(ficha).toContain(`${variante}data-[state=on]:${classe}`)
    }
  })

  it("o segmentado é a bandeja, e a escolhida se pinta sozinha antes do marcador", () => {
    const html = grupo(
      { variant: "segmented", defaultValue: "a" },
      { value: "a", children: "A" },
      { value: "b", children: "B" }
    )
    expect(html).toMatch(/data-slot="toggle-group"[^>]*data-variant="segmented"[^>]*class="[^"]*bg-muted[^"]*p-0\.5/)
    // Sem JavaScript não há caixa para medir: nenhum marcador, e o item ligado
    // carrega a superfície dele.
    expect(html).not.toContain('data-slot="toggle-group-indicator"')
    expect(html).toMatch(/data-variant="segmented"[^>]*class="[^"]*data-\[state=on\]:bg-background/)
    expect(html).toContain('role="radio"')
  })

  it("o marcador lê a caixa da escolhida, e transiciona", () => {
    const codigo = fonte("src/components/ui/toggle-group.tsx")
    expect(codigo).toContain('[data-slot="toggle-group-item"][data-state="on"]')
    expect(codigo).toMatch(/translate-x-\(--toggle-indicator-x\)[\s\S]*transition-\[translate,width,height\]/)
    expect(codigo).toContain("new MutationObserver(medir)")
  })

  it("a contagem entra no nome com um espaço, no peso normal", () => {
    const html = grupo({ variant: "chip" }, { value: "t", count: 8, children: "Transações" })
    const texto = html.replace(/<[^>]+>/g, "")
    expect(texto).toBe("Transações 8")
    expect(html).toMatch(/data-slot="toggle-count" class="font-normal tabular-nums"/)
  })

  it("stretch divide a largura", () => {
    const html = grupo({ stretch: true }, { value: "a", children: "A" })
    expect(html).toMatch(/data-stretch="true"[^>]*class="[^"]*w-full[^"]*\[&amp;&gt;\[data-slot=toggle-group-item\]\]:flex-1/)
  })

  it("nenhuma tela escreve a escolha de período nem a contagem à mão", () => {
    const presets = fonte("src/components/transactions/transactions-date-presets.tsx")
    expect(presets).not.toMatch(/aria-pressed|tagChipFilter|shadow-\[/)
    expect(presets).toContain('variant="segmented"')
    expect(presets).toContain('variant="chip"')
    const atividade = fonte("src/app/(app)/account/activity/page-client.tsx")
    expect(atividade).not.toMatch(/\{label\} \(/)
    expect(atividade).toContain("count={activityCounts[key]}")
  })
})
