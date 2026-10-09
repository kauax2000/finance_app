import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/** A rodada 221: o `Sidebar` flutuante como padrão, sem vidro, e a animação revista. */

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")
const CODIGO = fonte("src/components/ui/sidebar.tsx")

describe("as versões do Sidebar", () => {
  it("floating é o padrão, no cva e nas props", () => {
    expect(CODIGO).toContain('defaultVariants: { variant: "floating", collapsible: "offcanvas" }')
    expect(CODIGO).toMatch(/function Sidebar\(\{\s*variant: variante = "floating",/)
  })

  it("a placa flutuante é uma peça só, sem o +2px da borda do vidro", () => {
    expect(CODIGO).not.toContain("sidebar-content-plate")
    expect(CODIGO).not.toContain("(--spacing(4))+2px")
    expect(CODIGO).toContain("group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]")
  })

  it("o trilho das placas soltas anda na mola; a folga da página, na curva", () => {
    expect(CODIGO).toContain('"p-2 transition-[left,width] duration-(--duration-spring) ease-(--ease-spring)')
    expect(CODIGO).toContain(
      '"relative w-(--sidebar-width) bg-transparent transition-[width] duration-(--duration-slow) ease-(--ease-emphasized)"'
    )
  })

  it("os rótulos saem antes de a largura fechar e entram depois dela", () => {
    expect(CODIGO).toContain("[&>:not(:first-child):not([data-slot=sidebar-menu-highlight])]:delay-120")
    expect(CODIGO).toContain(
      "group-data-[collapsible=icon]:[&>:not(:first-child):not([data-slot=sidebar-menu-highlight])]:opacity-0"
    )
    expect(CODIGO).toContain("[transition-delay:0ms,120ms] group-data-[collapsible=icon]:[transition-delay:0ms]")
    // A pílula entra por último, e o `truncate` continua achando o rótulo.
    expect(CODIGO).toContain("[&>span:nth-last-child(2):has(+[data-slot=sidebar-menu-highlight])]:truncate")
  })

  it("peek: abre por cima, sem mexer na folga nem no estado", () => {
    expect(CODIGO).toContain('data-collapsible={state === "collapsed" && !espiando ? collapsible : ""}')
    expect(CODIGO).toContain('data-peek={espiando ? "" : undefined}')
    expect(CODIGO).toContain("group-data-[peek]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]")
    expect(CODIGO).toContain("group-data-[peek]:z-(--z-sheet)")
    expect(CODIGO).toMatch(/if \(e\.pointerType === "mouse"\) agendar\(true, 300\)/)
    expect(CODIGO).toContain("onPointerLeave: () => agendar(false, 200)")
  })

  it("ao lado do floating, o cabeçalho não pinta e o gatilho é pílula", () => {
    expect(CODIGO).toContain(
      "md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:[&_[data-slot=top-bar]:not([data-surface=glass]):not([data-scrolled=true])]:bg-transparent"
    )
    expect([...CODIGO.matchAll(/SIDEBAR_INSET_BAR,/g)]).toHaveLength(2)
    // E o conteúdo também, para a sombra da placa passar por cima dele.
    expect(CODIGO).toContain("sidebar-wrapper:bg-transparent\"")
    // O painel da barra deixa a placa pintar por fora da costura.
    expect(CODIGO).toContain('className="overflow-visible!"')
    expect(CODIGO).toContain("md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:rounded-full")
    // Pelo invólucro e não pelo irmão: no redimensionável barra e conteúdo
    // moram em painéis diferentes, e o `peer` não os alcançava.
    expect(CODIGO).not.toMatch(/peer-data-\[variant|\.peer\[data-variant/)
    expect(CODIGO).toContain("className={cn(!naBarra && SIDEBAR_TRIGGER_FLOATING, className)}")
  })

  it("recolhida em ícone no floating, o gatilho viaja para a barra", () => {
    // Um botão, dois lugares, o mesmo `layoutId`: o motion o leva na mola.
    expect([...CODIGO.matchAll(/layoutId=\{gatilhoId\}/g)]).toHaveLength(1)
    expect(CODIGO).toContain('{ type: "spring", duration: 0.45, bounce: 0.15 }')
    expect(CODIGO).toContain("gatilhoNaBarra: gatilhoMovel && state === \"collapsed\" && !isMobile")
    expect(CODIGO).toContain('value={variant === "floating" && collapsible === "icon"}')
    expect(CODIGO).toContain("{gatilhoNaBarra ? <SidebarTriggerButton naBarra /> : null}")
    expect(CODIGO).toContain("{gatilhoNaBarra ? null : <SidebarTriggerButton {...props} />}")
    // A vaga encolhe em vez de sumir, e a ponta do topo devolve o `gap`.
    expect(CODIGO).toContain("inline-flex w-8 shrink-0 transition-[width,margin] duration-(--duration-slow) ease-(--ease-emphasized) data-vazio:w-0")
    expect(fonte("src/components/ui/top-bar.tsx")).toContain(
      "has-[>[data-slot=sidebar-trigger-slot][data-vazio]:only-child]:-me-2"
    )
  })

  it("redimensionável, o modo ícone das soltas soma a calha", () => {
    // 48 da placa, mais a calha: 8 à esquerda no floating (a direita é a
    // costura), 8 dos dois lados no inset.
    expect(CODIGO).toMatch(/variant === "floating"\s*\? 56\s*: variant === "inset"\s*\? 64\s*: 48/)
    expect(CODIGO).toContain('floating: "py-2 pl-2"')
    // Uma regra de costura para as três: a borda acendendo, a 2px.
    expect(CODIGO).toContain("className={SIDEBAR_COSTURA[variant]}")
    expect(CODIGO).not.toContain("before:w-px")
    expect(CODIGO).not.toContain("-translate-x-2")
    expect(CODIGO).toContain("my-2 h-auto before:inset-y-2.5 before:rounded-full data-[separator=hover]:before:bg-foreground/30")
    // O rail da versão normal não desenha nada: ali não há arraste.
    expect(CODIGO).not.toContain("hover:after:bg-foreground/30")
    // O offcanvas não deixa o recuo e o anel transbordando do painel zerado.
    expect(CODIGO).toContain("data-[collapsible=offcanvas]:invisible")
  })

  it("numa barra que espia, as dicas de dentro não montam", () => {
    expect(CODIGO).toContain("<SidebarPeekContext.Provider value={peek && collapsible === \"icon\"}>")
    expect(CODIGO).toContain('if (!tooltip || state !== "collapsed" || isMobile || espiando || espia) {')
    expect(CODIGO).toContain("{naBarra && espia ? (")
    // E ali o gatilho é uma linha: o ícone, o texto e o atalho.
    expect(CODIGO).toContain("<span>Manter aberta</span>")
    expect(CODIGO).toMatch(/<Kbd\s+aria-hidden\s+keys=\{`mod\+\$\{SIDEBAR_KEYBOARD_SHORTCUT\}`\}/)
  })

  it("ao lado da placa aberta, o gatilho fica a 8px dela", () => {
    expect(CODIGO).toContain(
      "md:group-has-[[data-slot=sidebar][data-variant=floating][data-state=expanded]]/sidebar-wrapper:-ml-4"
    )
    expect(CODIGO).toMatch(/className,\s*SIDEBAR_TRIGGER_GAP,/)
    // No redimensionável a calha mora no conteúdo, e o gatilho não encosta na
    // borda do painel que rola.
    expect(CODIGO).toContain("md:group-has-[[data-slot=sidebar][data-variant=floating][data-state=expanded]]/sidebar-wrapper:pl-2")
  })

  it("as ações de grupo e de linha são círculos", () => {
    // Rodada 221: a pílula é a forma das peças soltas, e o botão de 20px que
    // mora na ponta da linha a acompanha.
    expect(CODIGO).toContain('"absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-full p-0')
    expect(CODIGO).toContain('"absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-full p-0')
  })

  it("no telefone o floating flutua também", () => {
    expect(CODIGO).toContain('variant={variant === "floating" ? "floating" : "flush"}')
  })

  it("o inset é placa com anel, e a margem anima", () => {
    expect(CODIGO).toContain(
      "transition-[margin] duration-(--duration-slow) ease-(--ease-emphasized) md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:m-2 md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:rounded-modal md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:ring-1"
    )
    expect(CODIGO).not.toContain("peer-data-[variant=inset]:shadow-sm")
  })

  it("o que o app escrevia à mão é do componente, e o app fica rente", () => {
    expect(CODIGO).toContain("[interpolate-size:allow-keywords] group-data-[collapsible=icon]:h-12")
    expect(CODIGO).toContain('"h-12 p-2 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!"')
    const app = fonte("src/components/layout/app-sidebar.tsx")
    expect(app).toContain('<Sidebar collapsible="icon" variant="sidebar">')
    expect(app).not.toContain("group-data-[collapsible=icon]:overflow-y-auto")
    expect(fonte("src/components/layout/workspace-switcher.tsx")).not.toContain("group-data-[collapsible=icon]:h-12")
    const perfil = fonte("src/components/layout/sidebar-user-profile.tsx")
    // O comentário do arquivo cita a classe; o que não pode voltar é ela num `className`.
    expect(perfil).not.toContain('group-data-[collapsible=icon]:p-0!"')
    expect(perfil).toContain('<SidebarMenuSkeleton size="lg" showIcon')
  })

  it("a página não fala mais de vidro nem de pílula medida", () => {
    const doc = fonte("src/app/designsystem/docs/sidebar.tsx")
    expect(doc).not.toContain("floating é vidro pintado")
    expect(doc).not.toContain("somando a cadeia de offsetParent")
    expect(doc).not.toContain("NativeSelect")
  })
})
