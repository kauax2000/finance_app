import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

/** A rodada 212: as versões novas do `Drawer`. */

const CODIGO = lerFonte("src/components/ui/drawer.tsx")

describe("as versões do Drawer", () => {
  it("dentro de outra gaveta, a raiz vira aninhada sozinha", () => {
    expect(CODIGO).toContain("const Raiz = pai ? DrawerPrimitive.NestedRoot : DrawerPrimitive.Root")
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
    expect(CODIGO).toContain(
      "[&>:not([data-slot=drag-handle]):not([data-slot=dialog-header]):not([data-slot=dialog-footer]):not([data-slot=dialog-close-button]):not([data-slot=dialog-body]):not([data-slot=drawer-cancel])]:overflow-y-auto"
    )
  })

  it("a folha de ações: 52px, ícone de 20, e cada ação fecha", () => {
    // A classe da linha mora em `drawerActionClassName` desde a rodada 213 (o
    // `DropdownMenu` no telefone a reaproveita); a `DrawerAction` a veste.
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

  it("os comentários não contam mais o que deixou de ser verdade", () => {
    expect(CODIGO).not.toContain("`drag-handle.test.ts` tranca")
    expect(CODIGO).not.toContain("O projeto tem quatro")
    expect(CODIGO).not.toContain("escrito uma vez em\n * `sheet.tsx`")
  })
})

describe("toda gaveta do telefone é a flush (rodada 245)", () => {
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
