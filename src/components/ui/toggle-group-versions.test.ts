import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import { tagChipFilterSelected, tagChipNeutral } from "./badge"
import { toggleVariants } from "./toggle"
import { ToggleGroup, ToggleGroupItem } from "./toggle-group"

/** As versões do `ToggleGroup`. */

const grupo = (props: Record<string, unknown>, ...itens: Record<string, unknown>[]) =>
  renderToStaticMarkup(
    h(
      ToggleGroup,
      { type: "single", "aria-label": "Grupo", ...props } as never,
      ...itens.map((i, n) => h(ToggleGroupItem, { key: n, ...i } as never))
    )
  )

describe("ToggleGroup", () => {
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

  it("o marcador lê a caixa da escolhida", () => {
    const codigo = lerFonte("src/components/ui/toggle-group.tsx")
    expect(codigo).toContain('[data-slot="toggle-group-item"][data-state="on"]')
    expect(codigo).toContain('prefixo: "toggle-indicator"')
    expect(codigo).toContain('atributos: ["data-state"]')
  })

  it("o segmented corre como o Tabs (sem transição de CSS no marcador)", () => {
    const fonte = semComentarios(lerFonte("src/components/ui/toggle-group.tsx"), "tudo")
    expect(fonte).toMatch(/useMarcador\(/)
    expect(fonte).not.toMatch(/toggle-group-indicator[^"]*transition-/)
    // O trecho do marcador inteiro, e não só o atributo: nenhuma das peles transiciona.
    const marcador = fonte.slice(fonte.indexOf('data-slot="toggle-group-indicator"'))
    expect(marcador.slice(0, marcador.indexOf("/>"))).not.toContain("transition-")
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
    const presets = lerFonte("src/components/transactions/transactions-date-presets.tsx")
    expect(presets).not.toMatch(/aria-pressed|tagChipFilter|shadow-\[/)
    expect(presets).toContain('variant="segmented"')
    expect(presets).toContain('variant="chip"')
    const atividade = lerFonte("src/app/(app)/account/activity/page-client.tsx")
    expect(atividade).not.toMatch(/\{label\} \(/)
    expect(atividade).toContain("count={activityCounts[key]}")
  })
})

describe("ToggleGroup floating", () => {
  it("é a pílula do Tabs padrão: placa com anel, tecla em relevo, e escolha de valor e não aba", () => {
    const html = grupo(
      { variant: "floating", defaultValue: "a" },
      { value: "a", children: "A" },
      { value: "b", children: "B" }
    )
    expect(html).toMatch(/data-slot="toggle-group"[^>]*data-variant="floating"[^>]*class="[^"]*bg-popover ring-1 ring-foreground\/10[^"]*rounded-full/)
    // Sem medida, a escolhida se pinta com a tecla do Tabs floating.
    expect(html).toMatch(/data-variant="floating"[^>]*class="[^"]*rounded-full px-3[^"]*data-\[state=on\]:bg-muted/)
    expect(html).toContain('role="radio"')
    expect(html).not.toContain('role="tab"')
  })

  it("e anda como as abas: a viagem líquida, 2px para dentro, sem transição de CSS", () => {
    const fonte = lerFonte("src/components/ui/toggle-group.tsx")
    expect(fonte).toContain("useMarcador({")
    expect(fonte).toContain("insete: flutuante ? 2 : 0")
    expect(fonte).toContain('"gap-1.5 rounded-full px-3 text-control-sm pointer-coarse:h-9 duration-(--duration-base)"')
  })
})
