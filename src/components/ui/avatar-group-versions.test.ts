import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import {
  AvatarGroup,
  AvatarGroupAdd,
  AvatarGroupItem,
  AvatarGroupSkeleton,
  resumirNomes,
} from "./avatar-group"

/** O `AvatarGroup`. */

const CODIGO = lerFonte("src/components/ui/avatar-group.tsx")

const NOMES = ["Ana Ribeiro", "Bruno Lima", "Carla Mendes", "Diego Souza", "Elisa Prado", "Fábio Nunes", "Gabriela Torres"]

const pilha = (props: Record<string, unknown> = {}, itens = NOMES.map((name) => h(AvatarGroupItem, { key: name, name }))) =>
  renderToStaticMarkup(h(AvatarGroup, { label: "Membros da carteira Casa", ...props } as never, ...itens))

describe("AvatarGroup", () => {
  it("é um grupo com nome, e cada rosto tem o nome da pessoa", () => {
    const html = pilha()
    expect(html).toMatch(/data-slot="avatar-group"[^>]*role="group"[^>]*aria-label="Membros da carteira Casa"/)
    expect(html.match(/data-slot="avatar-group-item"/g)).toHaveLength(7)
    expect(html).toContain('role="img"')
    expect(html).toContain('aria-label="Gabriela Torres"')
  })

  it("é uma parada de Tab só: o primeiro rosto 0, o resto -1", () => {
    const tabs = [...pilha().matchAll(/tabindex="(-?\d)"/g)].map((m) => m[1])
    expect(tabs[0]).toBe("0")
    expect(tabs.slice(1).every((t) => t === "-1")).toBe(true)
  })

  it("max corta a pilha, e o +N diz quantas e quem", () => {
    const html = pilha({ max: 4 })
    expect(html.match(/data-slot="avatar-group-item"/g)).toHaveLength(4)
    expect(html).toMatch(/data-slot="avatar-group-count"/)
    expect(html).toContain('aria-label="Mais 3: Elisa, Fábio e Gabriela"')
    expect(html).toMatch(/>\+(<!-- -->)?3</)
    // O +N abre a lista: é um gatilho de popover.
    expect(html).toMatch(/aria-haspopup="dialog"[^>]*data-slot="avatar-group-count"|data-slot="avatar-group-count"[^>]*aria-haspopup="dialog"/)
  })

  it("o + de convidar vem por prop, no fim, com nome", () => {
    const html = pilha({ max: 4, add: h(AvatarGroupAdd, { label: "Convidar pessoa" }) })
    const ordem = [...html.matchAll(/data-slot="avatar-group-(item|count|add)"/g)].map((m) => m[1])
    expect(ordem.at(-1)).toBe("add")
    expect(ordem.at(-2)).toBe("count")
    expect(html).toMatch(/<button[^>]*type="button"[^>]*aria-label="Convidar pessoa"/)
  })

  it("quem fica por cima: o primeiro, ou o último", () => {
    const z = (stacking: string) => [...pilha({ stacking }).matchAll(/z-index:(\d+)/g)].map((m) => Number(m[1]))
    const primeiro = z("first")
    expect(primeiro[0]).toBeGreaterThan(primeiro.at(-1)!)
    const ultimo = z("last")
    expect(ultimo[0]).toBeLessThan(ultimo.at(-1)!)
    expect(pilha({ stacking: "last" })).toContain('data-stacking="last"')
  })

  it("a sobreposição é um quarto do diâmetro em cada degrau", () => {
    const margem = (size: string) => pilha({ size }).match(/data-slot="avatar-group-slot"[^>]*class="[^"]*(-ms-[\d.]+)/g)?.[0]
    expect(margem("xs")).toContain("-ms-1.5")
    expect(margem("sm")).toContain("-ms-2")
    expect(margem("md")).toContain("-ms-2.5")
    expect(margem("lg")).toContain("-ms-3")
    expect(margem("xl")).toContain("-ms-3.5")
  })

  it("o resumo escreve os primeiros nomes e descreve o grupo", () => {
    const html = pilha({ summary: true })
    expect(html).toContain("Ana, Bruno e mais 5")
    const id = html.match(/aria-describedby="([^"]+)"/)?.[1]
    expect(id).toBeTruthy()
    expect(html).toContain(`id="${id}" data-slot="avatar-group-summary"`)
    expect(resumirNomes(["Ana Ribeiro", "Bruno Lima"])).toBe("Ana e Bruno")
    expect(resumirNomes(["Ana Ribeiro", "Bruno Lima", "Carla Mendes"])).toBe("Ana, Bruno e Carla")
  })

  it("o selo entra no nome, e o rosto vira botão ou link", () => {
    const html = pilha({}, [
      h(AvatarGroupItem, { key: "a", name: "Ana Ribeiro", status: "info", statusLabel: "Dona da carteira", onSelect: () => {} }),
      h(AvatarGroupItem, { key: "b", name: "Bruno Lima", href: "/membros/bruno" }),
    ])
    expect(html).toMatch(/<button type="button"[^>]*aria-label="Ana Ribeiro, Dona da carteira"/)
    expect(html).toMatch(/<a [^>]*aria-label="Bruno Lima"[^>]*href="\/membros\/bruno"/)
    expect(html).toMatch(/data-slot="avatar-group-status"[^>]*class="[^"]*\[--badge-dot:var\(--info\)\]/)
  })

  it("o esqueleto espera com nome e o anel do grupo", () => {
    const html = renderToStaticMarkup(h(AvatarGroupSkeleton, { count: 3, summary: true }))
    expect(html).toMatch(/role="status"/)
    expect(html.match(/data-shape="circle"/g)).toHaveLength(3)
    expect(html).toMatch(/data-shape="text"/)
    expect(renderToStaticMarkup(h(AvatarGroupSkeleton, { group: false }))).not.toContain('role="status"')
  })

  it("a dica é uma só, viaja na mola da referência e repete o nome sem anunciá-lo", () => {
    expect(CODIGO).toContain('data-slot="avatar-group-tooltip"')
    expect(CODIGO).toMatch(/aria-hidden\s+data-slot="avatar-group-tooltip"/)
    expect(CODIGO).toContain("stiffness: 300, damping: 35")
    expect(CODIGO).toContain("stiffness: 300, damping: 17")
    expect(CODIGO).toContain("tooltipContentVariants")
    // Fecha no Esc, ao rolar, ao redimensionar e no toque fora.
    for (const evento of ['"keydown"', '"scroll"', '"resize"', '"pointerdown"']) expect(CODIGO).toContain(evento)
    expect(lerFonte("src/components/ui/tooltip.tsx")).toMatch(/export \{[^}]*tooltipContentVariants/)
  })

  it("proibições: a variável da tela vence a automática, e o +N não é bg-muted", () => {
    expect(CODIGO).toContain("var(--avatar-group-ring,var(--avatar-group-surface,var(--color-background)))")
    expect(CODIGO).not.toMatch(/in-data-\[slot=card\]:\[--avatar-group-ring/)
    expect(CODIGO).not.toMatch(/justify-center bg-muted/)
    expect(CODIGO).not.toMatch(/\.type\s*===/)
    expect(CODIGO).not.toContain("env(")
  })
})
