import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { realcesSemParDeToque } from "@/test/regras"

/** O `Sidebar` flutuante é o padrão, sem vidro, e a animação revista. */

const CODIGO = lerFonte("src/components/ui/sidebar.tsx")

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
    // A mola do trilho é a asserção 24 da régua, mais abaixo, que lê o código sem comentários.
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
    expect(lerFonte("src/components/ui/top-bar.tsx")).toContain(
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
    // A pílula é a forma das peças soltas, e o botão de 20px na ponta da linha a acompanha.
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
    const app = lerFonte("src/components/layout/app-sidebar.tsx")
    expect(app).toContain('<Sidebar collapsible="icon" variant="sidebar">')
    expect(app).not.toContain("group-data-[collapsible=icon]:overflow-y-auto")
    expect(lerFonte("src/components/layout/workspace-switcher.tsx")).not.toContain("group-data-[collapsible=icon]:h-12")
    const perfil = lerFonte("src/components/layout/sidebar-user-profile.tsx")
    // O comentário do arquivo cita a classe; o que não pode voltar é ela num `className`.
    expect(perfil).not.toContain('group-data-[collapsible=icon]:p-0!"')
    expect(perfil).toContain('<SidebarMenuSkeleton size="lg" showIcon')
  })

  it("a página não fala mais de vidro nem de pílula medida", () => {
    const doc = lerFonte("src/app/designsystem/docs/sidebar.tsx")
    expect(doc).not.toContain("floating é vidro pintado")
    expect(doc).not.toContain("somando a cadeia de offsetParent")
    expect(doc).not.toContain("NativeSelect")
  })
})

// A régua da Sidebar. O `CODIGO` daqui é o fonte sem comentários, e o de cima é o fonte
// inteiro.
{
  /**
   * A régua da barra lateral, trancada: seletores `peer-data-[size=…]` que acompanham o `cva`,
   * o `SidebarRail` sem cursor de arraste, a língua do nome acessível e o primeiro `cva` do
   * arquivo (o que o `ds:catalog` lê). Zero render: tudo lê o fonte, sem comentários.
   */

  // O vidro da placa é testado em glass.test.ts (#1–#4, #7).

  const FONTE = lerFonte("src/components/ui/sidebar.tsx")

  /** Os comentários citam de propósito o que o arquivo deixou de fazer. */
  const CODIGO = semComentarios(FONTE, "fora-de-url")

  /** Os degraus que o `cva` do botão de menu de fato emite. */
  const DEGRAUS = ["sm", "md", "lg"] as const

  describe("régua da Sidebar", () => {
    it("1. nenhum seletor aponta para um degrau que o cva não emite", () => {
      // A asserção-mãe: é ela que teria pego os dois `peer-data-[size=default]`.
      const citados = [...CODIGO.matchAll(/data-\[size=([a-z]+)\]/g)].map(
        (m) => m[1]
      )
      expect(citados.length).toBeGreaterThan(0)
      const orfaos = [...new Set(citados)].filter(
        (d) => !DEGRAUS.includes(d as (typeof DEGRAUS)[number])
      )
      expect(orfaos).toStrictEqual([])
    })

    it("2. `default` não é nome de degrau nem de variante", () => {
      // O nome `default` não volta aos controles: diz o padrão em vez da medida.
      expect(CODIGO).not.toMatch(/["']default["']/)
      expect(CODIGO).not.toMatch(/size=default/)
    })

    it("3. o trilho não promete redimensionar", () => {
      // Quem redimensiona é o átomo `Resizable`, sob `SidebarProvider resizable`; um cursor de
      // redimensionar num controle que só alterna é uma promessa falsa.
      expect(CODIGO).not.toMatch(/cursor-[a-z]+-resize/)
    })

    it("4. o arraste não é reimplementado aqui", () => {
      // A régua da casa: um componente não reimplementa a camada de baixo.
      expect(CODIGO).not.toMatch(/onPointerDown|onPointerMove|onPointerUp/)
      expect(CODIGO).toContain("ResizablePanelGroup")
      expect(CODIGO).toContain("ResizableHandle")
    })

    it("5. nada que a pessoa lê está em inglês", () => {
      const visiveis = [
        ...CODIGO.matchAll(/(?:aria-label|title|placeholder)=["']([^"']+)["']/g),
      ].map((m) => m[1])
      const proibidas =
        /\b(Sidebar|Toggle|Displays|Search|Close|Menu|Open|Collapse|Expand)\b/
      expect(visiveis.filter((t) => proibidas.test(t))).toStrictEqual([])
      // O nome acessível do menu no telefone também é português.
      expect(CODIGO).not.toContain("Displays the mobile sidebar")
      expect(CODIGO).toContain("<DialogTitle>Navegação</DialogTitle>")
    })

    it("6. o cva dos eixos vem antes do cva do botão", () => {
      // É o que faz o `ds:catalog` reportar `side`/`variant`/`collapsible` em vez
      // dos eixos do botão de menu. Mesmo defeito de `itemGroupVariants`.
      const eixos = CODIGO.indexOf("const sidebarVariants")
      const botao = CODIGO.indexOf("const sidebarMenuButtonVariants")
      expect(eixos).toBeGreaterThan(-1)
      expect(botao).toBeGreaterThan(-1)
      expect(eixos).toBeLessThan(botao)
    })

    it("7. o trilho não desenha nada: sem arraste, sem fio", () => {
      // Um fio que acende na borda promete arrastar, e o trilho só alterna; quem redimensiona é
      // o modo `resizable`, que nem o monta.
      const inicio = CODIGO.indexOf("function SidebarRail")
      const trilho = CODIGO.slice(inicio, CODIGO.indexOf("\n}\n", inicio))
      expect(trilho).not.toMatch(/after:|hover:|active:|bg-/)
      expect(trilho).toContain("onClick={toggleSidebar}")
    })

    it("8. o atalho escuta o documento que contém a barra", () => {
      // Dentro de um iframe — a moldura do catálogo — `window` é o de fora, e a
      // tecla digitada lá dentro nunca chegaria ao ouvinte.
      expect(CODIGO).toContain("ownerDocument.defaultView")
      expect(CODIGO).not.toMatch(/window\.addEventListener\(["']keydown/)
    })

    it("10. a lista respira, e o grupo respira quatro vezes mais", () => {
      // A lista tem `gap`: a navegação do produto desfazia o `gap-0` à mão nos menus com mais
      // de um item.
      const trecho = (nome: string) => {
        const i = CODIGO.indexOf(`function ${nome}(`)
        return CODIGO.slice(i, CODIGO.indexOf("function ", i + 10))
      }
      expect(trecho("SidebarMenu")).toContain("gap-1")
      expect(trecho("SidebarMenu")).not.toContain("gap-0")
      // O submenu fica no mesmo degrau: quem diz o aninhamento é o fio à
      // esquerda e o recuo, e um segundo sinal seria redundante.
      expect(trecho("SidebarMenuSub")).toContain("gap-1")
      expect(trecho("SidebarGroup")).toContain("p-2")
    })

    it("12. recolhida, o recuo centra o ícone em todo degrau", () => {
      // A conta é `(32 - filho) / 2`: o degrau padrão (ícone de 16) pede 8 e o `lg` (avatar de
      // 24) pede 4; `p-0!` descentra o filho.
      const cva = CODIGO.slice(
        CODIGO.indexOf("const sidebarMenuButtonVariants"),
        CODIGO.indexOf("function SidebarMenuButton")
      )
      expect(cva).toContain("group-data-[collapsible=icon]:p-2!") // md, ícone 16
      expect(cva).toContain("group-data-[collapsible=icon]:p-1!") // lg, avatar 24
      // `p-0!` descentra: recuo zero não centra filho nenhum.
      expect(cva).not.toContain("group-data-[collapsible=icon]:p-0!")
      // E não se conserta com `justify-center`: o rótulo continua no fluxo em
      // modo ícone, a linha transborda, e centrar transbordo empurra para fora.
      expect(cva).not.toContain("group-data-[collapsible=icon]:justify-center")
    })

    it("13. a dica não é montada quando o rótulo está na tela", () => {
      const btn = CODIGO.slice(
        CODIGO.indexOf("function SidebarMenuButton"),
        CODIGO.indexOf("function SidebarMenuAction")
      )
      // `hidden` no conteúdo da dica esconde só o pixel: o Radix ainda abre a dica e liga o
      // `aria-describedby` ao botão, descrevendo cada linha com o próprio rótulo.
      expect(btn).not.toMatch(/hidden=\{/)
      // A guarda mora no retorno curto, junto da de `!tooltip`; espiando, o rótulo também está
      // na tela.
      expect(btn).toMatch(/if \(!tooltip \|\| state !== "collapsed" \|\| isMobile \|\| espiando \|\| espia\)/)
    })

    it("14. a dica não segura o ponteiro entre um ícone e o vizinho", () => {
      // O defeito mora no `Tooltip` (o polígono de graça do Radix cobre os ícones vizinhos do
      // trilho recolhido), e a asserção fica nesta suíte porque é aqui que o custo aparece.
      const tooltip = lerFonte("src/components/ui/tooltip.tsx")
      expect(tooltip).toMatch(/disableHoverableContent = true/)
    })

    it("15. a placa flutuante não declara borrão", () => {
      // Sob o painel flutuante só há `sidebar`, `sidebar-wrapper` e o `body`, e o `floating`
      // reserva a folga no fluxo: um `backdrop-filter` ali borraria cor chapada e não
      // desenharia nada.
      expect(CODIGO).not.toMatch(/backdrop-blur|backdrop-filter/)
    })

    it("17. o fio do cabeçalho é da variante, e não da tela", () => {
      // No `floating` a placa não tem `border-r` para o fio encostar: quem decide é a variável
      // que o `SidebarInset` publica, e a tela só a lê.
      expect(CODIGO).toContain("--sidebar-inset-rule:1px")
      expect(CODIGO).toContain("--sidebar-inset-rule:0px")
      // Quem desenha o cabeçalho é o `TopBar`.
      const header = lerFonte("src/components/ui/top-bar.tsx")
      expect(header).toContain("var(--sidebar-inset-rule,1px)")
    })

    it("18. a placa flutuante é chapada, uma peça só, e não veste o vidro", () => {
      // O `floating` não tem vidro: a barra reserva a própria calha, e a forma da casa é a
      // placa solta do `CommandDialog`. A `@utility glass` continua para outras peças.
      const css = lerFonte("src/app/globals.css")
      expect(css).toContain("@utility glass")
      expect(CODIGO).not.toContain("group-data-[variant=floating]:glass")
      expect(CODIGO).not.toMatch(/inset-shadow/)
      // A placa é o anel das placas do `Command` sobre o `--sidebar` chapado, e é o miolo
      // inteiro.
      const miolo = CODIGO.slice(
        CODIGO.indexOf("const miolo = ("),
        CODIGO.indexOf("if (resizable) {", CODIGO.indexOf("const miolo = ("))
      )
      expect(miolo).toContain(
        '"group-data-[variant=floating]:rounded-modal group-data-[variant=floating]:[--radius-parent:var(--radius-modal)] group-data-[variant=floating]:[--radius-inset:--spacing(2)] group-data-[variant=floating]:shadow-lg group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-foreground/10"'
      )
      expect([...CODIGO.matchAll(/group-data-\[variant=floating\]:ring-1/g)]).toHaveLength(1)
    })

    it("22. os tokens de desenhos anteriores da barra não voltaram", () => {
      // A lâmina, as nuvens e o aro moram em `glass.test.ts`; aqui ficam os tokens
      // `--sidebar-*` de desenhos que saíram.
      const css = lerFonte("src/app/globals.css")
      for (const morto of [
        "--sidebar-surface-top",
        "--sidebar-surface-bottom",
        "--sidebar-bloom",
        "--sidebar-backlight",
      ]) {
        expect(css).not.toContain(morto)
      }
    })

    it("20. nenhum realce acende no cursor e fica inerte no dedo", () => {
      // `hover:` compila dentro de `@media (hover: hover)`, então um realce sem par `active:`
      // não existe no telefone; a regra H do auditor não alcança este arquivo porque tudo mora
      // em `cva()`/`cn()`.
      expect(realcesSemParDeToque(CODIGO)).toEqual([])
    })

    it("21. o realce do ativo é o token, nas três variantes, e não alfa de vidro", () => {
      // Sem vidro a placa é chapada, e o realce é `--sidebar-accent` nas três variantes (um
      // `bg-current/N` só servia ao degradê).
      expect(CODIGO).not.toMatch(/SIDEBAR_GLASS_|bg-current\//)
      expect(CODIGO).toMatch(/absolute inset-0 -z-10 rounded-\[inherit\] bg-sidebar-accent/)
      // Quem pinta o ativo é a pílula: a base não o pinta mais, senão haveria
      // dois retângulos e a pílula viajaria por cima de um parado.
      expect(CODIGO).not.toContain("data-active:bg-sidebar-accent")
    })

    it("22b. sem o vidro, sem o reflexo", () => {
      // O `--glass-sheen` era o reflexo da lâmina de vidro e saiu com ela.
      const miolo = CODIGO.slice(
        CODIGO.indexOf("const miolo = ("),
        CODIGO.indexOf("if (resizable) {", CODIGO.indexOf("const miolo = ("))
      )
      expect(miolo.length).toBeGreaterThan(0)
      expect(miolo).not.toMatch(/hover:|active:/)
      expect(CODIGO).not.toContain("--glass-sheen")
    })

    it("26. no telefone a navegação é painel, e é a única folha que fixa isso", () => {
      // Seis links subindo do rodapé com alça de arraste é o defeito que o painel existe para
      // evitar: no telefone a navegação continua painel.
      const mobile = CODIGO.slice(
        CODIGO.indexOf("if (isMobile) {"),
        CODIGO.indexOf("const miolo = (")
      )
      expect(mobile.length).toBeGreaterThan(0)
      expect(mobile).toContain('surface="panel"')
      // A barra mora à esquerda (não há `side`), e o painel entra de onde ela mora.
      expect(mobile).toContain('side="left"')
      // `fillMobileViewport` é a altura **da gaveta**. No painel ela sai do par
      // `top`/`bottom` do `cva`, e passá-lo seria prop inerte.
      expect(mobile).not.toContain("fillMobileViewport")
      // A classe do shadcn escondia o nosso × (`display: none`); na gaveta fecha-se arrastando,
      // num painel não há arraste.
      expect(mobile).not.toContain("[&>button]:hidden")
      expect(mobile).toContain("dialog-close-button".replace("dialog-close-button", "DialogCloseButton"))
    })

    it("23. não há `side`: a barra mora à esquerda", () => {
      // Nenhuma tela usa a barra à direita: o eixo custava `order-last`, as margens espelhadas
      // do `inset` e o painel do telefone dos dois lados.
      expect(CODIGO).not.toMatch(/data-side[=\]]|\[side=|side\?: "left" \| "right"|order-last/)
      const inset = CODIGO.slice(
        CODIGO.indexOf("function SidebarInset("),
        CODIGO.indexOf("function SidebarInput(")
      )
      expect(inset).toContain(
        "md:group-has-[[data-slot=sidebar][data-variant=inset]]/sidebar-wrapper:ml-0 md:group-has-[[data-slot=sidebar][data-variant=inset][data-state=collapsed]]/sidebar-wrapper:ml-2"
      )
    })

    it("24. a página fala a curva das folhas; só as placas soltas falam a mola", () => {
      // `ease-linear` é o movimento de quem não escolheu curva. O que reflui a página anda na
      // curva das folhas; o trilho das placas soltas é `fixed` e anda na mola, para o quique
      // não sacudir o conteúdo.
      const cabecalho = lerFonte("src/components/ui/top-bar.tsx")
      expect(cabecalho).toMatch(
        /transition-\[background-color[^\]]*\] duration-\(--duration-slow\) ease-\(--ease-emphasized\)/
      )
      for (const [nome, fonte] of [
        ["sidebar", CODIGO],
        ["top-bar", cabecalho],
      ] as const) {
        expect(fonte, `${nome} tem ease-linear`).not.toContain("ease-linear")
      }
      for (const alvo of [
        "transition-[width] ",
        "transition-[margin] ",
        "transition-[margin,opacity]",
      ]) {
        const i = CODIGO.indexOf(alvo)
        expect(i, alvo).toBeGreaterThan(-1)
        expect(CODIGO.slice(i, i + 130), alvo).toContain("ease-(--ease-emphasized)")
      }
      expect(CODIGO).toContain(
        '"p-2 transition-[left,width] duration-(--duration-spring) ease-(--ease-spring)'
      )
      expect(CODIGO).toContain(
        '"transition-[left,width] duration-(--duration-slow) ease-(--ease-emphasized) group-data-[collapsible=icon]:w-(--sidebar-width-icon) border-r'
      )
    })

    it("25. a pílula do ativo é um objeto só, e viaja pelo motion", () => {
      // Quem anima a pílula é o `layoutId` (a mecânica do `Menubar`): vale nas três variantes e
      // já nasce no HTML do servidor.
      expect(CODIGO).not.toMatch(/caixaRelativa|ResizeObserver|sidebar-marker|requestAnimationFrame/)
      // O outro `layoutId` é o do gatilho, que viaja do topo à barra.
      expect([...CODIGO.matchAll(/layoutId=/g)]).toHaveLength(2)
      expect(CODIGO).toContain("layoutId={`${id}-ativo`}")
      expect(CODIGO).toContain('{ type: "spring", duration: 0.28, bounce: 0.2 }')
      expect(CODIGO).toContain("reduzido ? { duration: 0 } : MOLA_DO_REALCE")
      // Os dois botões a desenham pelo mesmo caminho — e o ativo viaja do item
      // ao subitem.
      expect([...CODIGO.matchAll(/comRealce\(children, asChild, isActive\)/g)]).toHaveLength(2)
      const menu = CODIGO.slice(
        CODIGO.indexOf("function SidebarMenu("),
        CODIGO.indexOf("function SidebarMenuItem(")
      )
      expect(menu).toMatch(/"relative flex w-full min-w-0 flex-col gap-1"/)
    })

    it("11. nenhuma tela reescreve o ritmo da lista", () => {
      // Uma tela compensando o `gap` à mão é o sinal de que o componente errou o padrão.
      const app = lerFonte("src/components/layout/app-sidebar.tsx")
      expect(app).not.toMatch(/<SidebarMenu[^>]*className="[^"]*gap-/)
    })

    it("9. o cookie não é gravado em modo controlado", () => {
      const setOpen = CODIGO.slice(
        CODIGO.indexOf("const setOpen"),
        CODIGO.indexOf("const toggleSidebar")
      )
      // Gravá-lo com `onOpenChange` presente sobrescreve pelas costas a
      // preferência de quem controla.
      expect(setOpen).toMatch(/if \(!setOpenProp\)/)
    })
  })
}
