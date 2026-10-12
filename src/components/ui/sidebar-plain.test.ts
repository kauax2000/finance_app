import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

/**
 * O `Sidebar variant="plain"`, a barra sem placa da navegação do catálogo, e o catálogo
 * usando-a em vez de uma lista à mão.
 */

const fonte = (caminho: string) => semComentarios(lerFonte(caminho), "linha-inteira")
const SIDEBAR = fonte("src/components/ui/sidebar.tsx")
const SHELL = fonte("src/app/designsystem/ds-shell.tsx")

describe("o plain", () => {
  it("é uma variante do Sidebar, sem superfície, e só no none", () => {
    expect(SIDEBAR).toContain('variant?: "sidebar" | "floating" | "inset" | "plain"')
    expect(SIDEBAR).toContain('variante === "plain" && "bg-transparent"')
    // Fora do `none`, cai na rente.
    expect(SIDEBAR).toContain('const variant = variante === "plain" ? "sidebar" : variante')
  })

  it("as peças leem a variante: o fio entre grupos, o rótulo em caixa alta, a linha apagada", () => {
    expect(SIDEBAR).toContain("group-data-[variant=plain]:not-first:border-t")
    expect(SIDEBAR).toContain("group-data-[variant=plain]:uppercase")
    expect(SIDEBAR).toContain("group-data-[variant=plain]:text-muted-foreground")
    expect(SIDEBAR).toContain("group-data-[variant=plain]:pointer-coarse:min-h-11")
  })
})

describe("o catálogo", () => {
  it("a navegação é o Sidebar plain, e não uma lista de botões à mão", () => {
    expect(SHELL).toContain('<Sidebar collapsible="none" variant="plain"')
    expect(SHELL).toContain("<SidebarMenuButton asChild isActive={active}>")
    expect(SHELL).not.toMatch(/<Button[\s\S]{0,40}variant="tertiary"[\s\S]{0,40}size="md"/)
  })

  it("o provedor é controlado, para o ⌘B não gravar o cookie da barra do app", () => {
    expect(SHELL).toContain("<SidebarProvider open onOpenChange={() => {}}")
  })
})
