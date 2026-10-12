import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

/** As versões do `Drawer`. */

const CODIGO = lerFonte("src/components/ui/drawer.tsx")

describe("as versões do Drawer", () => {
  it("dentro de outra gaveta, a raiz vira aninhada sozinha — e dentro de um painel, não", () => {
    // O aninhamento é um só: o painel do `Sheet` também o publica, e uma gaveta dentro dele é
    // raiz.
    expect(CODIGO).toMatch(
      /const Raiz =\s*pai\?\.superficie === "gaveta" \? DrawerPrimitive\.NestedRoot : DrawerPrimitive\.Root/
    )
  })

  it("salvando: dismissible desliga E o pedido de fechar é barrado — a alça fecha quando dismissible é falso", () => {
    expect(CODIGO).toContain("dismissible={pending ? false : dismissible}")
    expect(CODIGO).toMatch(/const pedir = \(proximo: boolean\) => \{\s*if \(!proximo && pending\) return/)
    // `pedir` vence o `onOpenChange` de quem chama: vem depois do espalhamento.
    expect(CODIGO).toMatch(/\{\.\.\.props\}\s*dismissible=\{pending \? false : dismissible\}\s*open=\{open\}\s*onOpenChange=\{pedir\}/)
  })

  it("o fundo que encolhe tem o invólucro na raiz do app", () => {
    expect(CODIGO).toContain("shouldScaleBackground={scaleBackground}")
    expect(lerFonte("src/app/layout.tsx")).toContain('data-vaul-drawer-wrapper=""')
  })

  it("a altura acompanha com um observador só: o elemento mora em estado, não numa ref de função", () => {
    expect(CODIGO).toContain("const [el, setEl] = React.useState<HTMLDivElement | null>(null)")
    expect(CODIGO).toContain("useAlturaQueAcompanha(el, !alta)")
    expect(CODIGO).toMatch(/return \(\) => ro\.disconnect\(\)\s*\}, \[el, ativo\]\)/)
  })

  it("o meio que rola está escrito por extenso — classe montada não existe no CSS", () => {
    expect(CODIGO).not.toMatch(/\$\{MEIO\}/)
    for (const classe of ["min-h-0", "overflow-y-auto", "overscroll-contain", "scroll-fade-y", "[--scroll-fade-floor:0]"]) {
      expect(CODIGO).toContain(`"[&>[data-drawer-meio]]:${classe}"`)
    }
  })

  it("o meio é achado pela marca, e a cadeia de :not() não se repete", () => {
    const fonte = semComentarios(lerFonte("src/components/ui/drawer.tsx"), "tudo")
    expect(fonte).toContain("data-drawer-meio")
    expect(fonte.match(/:not\(\[data-slot=/g)?.length ?? 0).toBeLessThanOrEqual(6)
  })

  it("a marca acompanha os filhos: um observador de childList repete a busca", () => {
    expect(CODIGO).toMatch(/new MutationObserver\(marcar\)/)
    expect(CODIGO).toMatch(/observe\(el, \{ childList: true \}\)/)
  })

  it("a folha de ações: 52px, ícone de 20, e cada ação fecha", () => {
    // A classe da linha mora em `drawerActionClassName` (o `DropdownMenu` no telefone a
    // reaproveita); a `DrawerAction` a veste.
    expect(CODIGO).toMatch(/const drawerActionClassName = cn\(\s*"flex min-h-13/)
    expect(CODIGO).toMatch(/function DrawerAction\([\s\S]*?<DrawerPrimitive\.Close asChild>[\s\S]*?drawerActionClassName/)
    expect(CODIGO).toContain("[&_svg]:size-5")
  })

  it("os menus do telefone são gavetas, e o vidro escrito à mão saiu", () => {
    const fab = lerFonte("src/components/layout/quick-actions.tsx")
    expect(fab).toMatch(/if \(isFab\) \{[\s\S]*?<Drawer[\s\S]*?<DrawerActions>/)
    expect(fab).not.toContain("MOBILE_GLASS")
    const conta = lerFonte("src/components/layout/mobile-account-menu.tsx")
    expect(conta).toContain("<Drawer open={open} onOpenChange={setOpen} scaleBackground>")
    expect(conta).not.toMatch(/from "@\/components\/ui\/popover"|MOBILE_GLASS|createCenteredViewportAnchor/)
    expect(lerFonte("src/components/ui/bottom-bar.tsx")).not.toContain("MOBILE_GLASS_MENU")
  })
})

describe("toda gaveta do telefone é a flush", () => {
  it("nenhum consumidor pede inset — só a página do catálogo o demonstra", () => {
    const consumidores = [
      "src/components/ui/popover.tsx",
      "src/components/ui/dropdown-menu.tsx",
      "src/components/ui/menubar.tsx",
      "src/components/ui/navigation-menu.tsx",
      "src/components/layout/quick-actions.tsx",
      "src/components/layout/mobile-account-menu.tsx",
    ]
    for (const caminho of consumidores) {
      expect(lerFonte(caminho), caminho).not.toMatch(/<DrawerContent[^>]*variant="inset"/)
    }
    // E o padrão continua sendo a flush.
    expect(CODIGO).toMatch(/defaultVariants: \{\s*fill: false,\s*variant: "flush"/)
  })
})
