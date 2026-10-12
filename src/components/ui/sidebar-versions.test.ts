import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { realcesSemParDeToque } from "@/test/regras"

/** A rodada 221: o `Sidebar` flutuante como padrão, sem vidro, e a animação revista. */

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

// A régua da Sidebar. O bloco guarda as constantes dela: o `CODIGO` daqui é o
// fonte sem comentários, e o de cima é o fonte inteiro.
{
  /**
   * A régua da barra lateral, trancada.
   *
   * Este teste existe por causa de quatro defeitos medidos, e cada um deu uma
   * asserção.
   *
   * **O primeiro estava em produção e era visível.** O `cva` foi renomeado de
   * `default` para `md`, e dois seletores ficaram para trás:
   * `peer-data-[size=default]/menu-button:top-1.5` em `SidebarMenuAction` e em
   * `SidebarMenuBadge`. Com `data-size="md"` nenhuma regra casava, o badge caía
   * para a posição estática e renderizava **20px abaixo da própria linha**, em
   * cima do item seguinte. Medido antes: `top: 32px`, centro 26px fora do centro
   * do botão. Depois: `top: 6px`, desalinho **zero**.
   *
   * **O segundo era o cursor.** `SidebarRail` declarava `cursor-w-resize` e um
   * fio de 2px que acende no cursor — a gramática inteira de uma costura de
   * arraste — e o `onClick` só alternava. É a quarta ocorrência da família que o
   * `SheetDragHandle`, o `Drawer` e a alça do `vaul` já custaram, e a pior: aqui
   * quem mentia era o cursor do sistema operacional.
   *
   * **O terceiro era a língua.** O nome acessível do menu no telefone era a
   * palavra inglesa "Sidebar", e a descrição era "Displays the mobile sidebar" —
   * uma frase de desenvolvedor. É o achado do `Calendar`, na navegação primária.
   *
   * **O quarto era de catálogo.** O `ds:catalog` lê o primeiro `cva` do arquivo,
   * e o único era o do botão de menu — então ele reportava `plain | outline` como
   * se fossem os eixos da barra.
   *
   * Zero render: todas leem o fonte, sem comentários.
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
      // O nome saiu de `Button`, `Input`, `SelectTrigger`, `NativeSelect`,
      // `Container`, `Badge` e `Item` por dizer *o padrão* em vez da medida.
      // A barra era o último lugar de `ui/` onde ele sobrevivia.
      expect(CODIGO).not.toMatch(/["']default["']/)
      expect(CODIGO).not.toMatch(/size=default/)
    })

    it("3. o trilho não promete redimensionar", () => {
      // Quem redimensiona é o átomo `Resizable`, sob `SidebarProvider resizable`.
      // Um cursor de redimensionar num controle que só alterna é a promessa mais
      // forte que uma interface consegue fazer, e ela era falsa.
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
      // E o nome acessível do menu no telefone, que era a pior das três.
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
      // Rodada 221: um fio que acende na borda promete arrastar, e o trilho só
      // alterna. Quem redimensiona é o modo `resizable`, que nem o monta.
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
      // A lista era `gap-0` — as linhas se encostavam —, e a navegação do produto
      // desfazia isso à mão nos dois menus que têm mais de um item. Padrão que
      // ninguém escolhe não é padrão. Medido depois: 4px entre itens e 16 entre o
      // conteúdo de dois grupos (o `p-2` de cada lado).
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
      // A conta é `(32 - filho) / 2`. O degrau padrão carrega um ícone de 16 e
      // pede 8; o `lg` carrega um avatar de 24 e pede 4. O arquivo escrevia
      // `p-0!` no `lg`, e o avatar encostava na esquerda — 4px fora do centro,
      // medidos, numa coluna em que todo o resto está no meio. Depois: zero.
      const cva = CODIGO.slice(
        CODIGO.indexOf("const sidebarMenuButtonVariants"),
        CODIGO.indexOf("function SidebarMenuButton")
      )
      expect(cva).toContain("group-data-[collapsible=icon]:p-2!") // md, ícone 16
      expect(cva).toContain("group-data-[collapsible=icon]:p-1!") // lg, avatar 24
      // `p-0!` era o defeito: recuo zero não centra filho nenhum.
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
      // A versão anterior passava `hidden` ao conteúdo, e isso esconde pixel e
      // mais nada: medido com a barra expandida — o estado padrão do app —, o
      // Radix continuava abrindo a dica e ligando o `aria-describedby` do botão a
      // ela. O item "Início" saía descrito por uma dica invisível escrita
      // "Início": o mesmo texto do rótulo, em cada linha, para leitor de tela.
      expect(btn).not.toMatch(/hidden=\{/)
      // A guarda mora no retorno curto, junto da que já existia para `!tooltip`
      // — e, desde a rodada 221, espiando o rótulo também está na tela.
      expect(btn).toMatch(/if \(!tooltip \|\| state !== "collapsed" \|\| isMobile \|\| espiando \|\| espia\)/)
    })

    it("14. a dica não segura o ponteiro entre um ícone e o vizinho", () => {
      // O defeito foi medido aqui, mas mora no `Tooltip`: o Radix mantém a dica
      // aberta enquanto o ponteiro caminha dentro de um polígono de graça até
      // ela. No trilho recolhido os ícones ficam a 36px e a dica abre à direita,
      // então o polígono cobre os vizinhos — passando por "Início" e indo até
      // "Carteiras", a dica continuava escrita "Início" e o `aria-describedby`
      // continuava no primeiro botão. A asserção mora nesta suíte porque é aqui
      // que o custo aparece.
      const tooltip = lerFonte("src/components/ui/tooltip.tsx")
      expect(tooltip).toMatch(/disableHoverableContent = true/)
    })

    it("15. a placa flutuante não declara borrão", () => {
      // Medido com `elementsFromPoint`: sob o painel flutuante há `sidebar` e
      // `sidebar-wrapper`, os dois transparentes, e depois o `body`. O `floating`
      // reserva a folga no fluxo, então o conteúdo **não passa por baixo** — um
      // `backdrop-filter` ali borraria cor chapada e não desenharia nada. É a lei
      // que a paleta de comandos escreveu e que nunca tinha sido trancada.
      expect(CODIGO).not.toMatch(/backdrop-blur|backdrop-filter/)
    })

    it("17. o fio do cabeçalho é da variante, e não da tela", () => {
      // No `floating` a placa não tem `border-r` para o fio encostar, e ele fica
      // pendurado: medido, a placa termina em x=248 e o fio ia de x=256 a 778 —
      // 522px começando a 8px de nada. Quem decide agora é a variável que o
      // `SidebarInset` publica; a tela só a lê.
      expect(CODIGO).toContain("--sidebar-inset-rule:1px")
      expect(CODIGO).toContain("--sidebar-inset-rule:0px")
      // Desde a rodada 80 quem desenha o cabeçalho é o `TopBar`.
      const header = lerFonte("src/components/ui/top-bar.tsx")
      expect(header).toContain("var(--sidebar-inset-rule,1px)")
    })

    it("18. a placa flutuante é chapada, uma peça só, e não veste o vidro", () => {
      // Rodada 221: o dono tirou o vidro do `floating`. A barra reserva a própria
      // calha, então nada passa por baixo dela — o vidro era o aro e as nuvens
      // pintados sobre uma lâmina, e a forma da casa hoje é a placa solta do
      // `CommandDialog`. A `@utility glass` continua: outras peças a vestem.
      const css = lerFonte("src/app/globals.css")
      expect(css).toContain("@utility glass")
      expect(CODIGO).not.toContain("group-data-[variant=floating]:glass")
      expect(CODIGO).not.toMatch(/inset-shadow/)
      // A placa é o anel das placas do `Command`, sobre o `--sidebar` chapado —
      // e é o miolo inteiro: o dono pediu uma peça só, sem dividir as faixas.
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
      // A lâmina, as nuvens e o aro são do vidro e moram em `glass.test.ts`
      // (#1–#4 e #7). Fica aqui o que é da barra: os tokens `--sidebar-*` de
      // desenhos que saíram — a família "sobreviveu à remoção" que esta base já
      // pagou cinco vezes. O `glass.test.ts` #9 cobre só os nomes da receita
      // `sidebar-glass`; estes quatro são de outro desenho.
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
      // `hover:` compila dentro de `@media (hover: hover)` — verificado no CSS
      // emitido nas rodadas anteriores —, então um realce sem par `active:` não
      // existe no telefone. A regra **H** do auditor não alcança este arquivo:
      // ela varre `className="…"`, e aqui tudo mora dentro de `cva()` e `cn()`.
      // É o ponto cego que o `AGENTS.md` já registra três vezes, e foi ele que
      // deixou a variante `outline` acendendo a sombra só no cursor.
      expect(realcesSemParDeToque(CODIGO)).toEqual([])
    })

    it("21. o realce do ativo é o token, nas três variantes, e não alfa de vidro", () => {
      // O alfa `bg-current/N` existia porque a placa era degradê, e um token
      // opaco apagava o degradê dentro do realce. Sem o vidro (rodada 221) a
      // placa é chapada, e o realce volta a ser `--sidebar-accent` — o mesmo nas
      // três variantes.
      expect(CODIGO).not.toMatch(/SIDEBAR_GLASS_|bg-current\//)
      expect(CODIGO).toMatch(/absolute inset-0 -z-10 rounded-\[inherit\] bg-sidebar-accent/)
      // Quem pinta o ativo é a pílula: a base não o pinta mais, senão haveria
      // dois retângulos e a pílula viajaria por cima de um parado.
      expect(CODIGO).not.toContain("data-active:bg-sidebar-accent")
    })

    it("22b. sem o vidro, sem o reflexo", () => {
      // O `--glass-sheen` era o reflexo da lâmina de vidro, e saiu com ela.
      const miolo = CODIGO.slice(
        CODIGO.indexOf("const miolo = ("),
        CODIGO.indexOf("if (resizable) {", CODIGO.indexOf("const miolo = ("))
      )
      expect(miolo.length).toBeGreaterThan(0)
      expect(miolo).not.toMatch(/hover:|active:/)
      expect(CODIGO).not.toContain("--glass-sheen")
    })

    it("26. no telefone a navegação é painel, e é a única folha que fixa isso", () => {
      // Medido antes da rodada 66, na moldura de 375px: `data-surface="drawer"`,
      // `data-side="bottom"`, com `[data-vaul-handle]`. Um menu de seis links
      // subindo do rodapé com alça de arraste é o defeito que o `EdgePanel`
      // existiu para consertar — e o comportamento voltou como prop, não como
      // arquivo.
      const mobile = CODIGO.slice(
        CODIGO.indexOf("if (isMobile) {"),
        CODIGO.indexOf("const miolo = (")
      )
      expect(mobile.length).toBeGreaterThan(0)
      expect(mobile).toContain('surface="panel"')
      // A barra mora à esquerda (não há `side` desde a rodada 221), e o painel
      // entra de onde ela mora.
      expect(mobile).toContain('side="left"')
      // `fillMobileViewport` é a altura **da gaveta**. No painel ela sai do par
      // `top`/`bottom` do `cva`, e passá-lo seria prop inerte.
      expect(mobile).not.toContain("fillMobileViewport")
      // A classe do shadcn que escondia o nosso × — medido, `display: none`. Na
      // gaveta passava (fecha-se arrastando); num painel não há arraste.
      expect(mobile).not.toContain("[&>button]:hidden")
      expect(mobile).toContain("dialog-close-button".replace("dialog-close-button", "DialogCloseButton"))
    })

    it("23. não há `side`: a barra mora à esquerda", () => {
      // Rodada 221, decisão do dono: nenhuma tela usa a barra à direita. O eixo
      // custava a ordem visual invertida (`order-last`), as margens espelhadas
      // do `inset`, o trilho e o painel do telefone dos dois lados.
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
      // `ease-linear` é o movimento de quem não escolheu curva. O que reflui a
      // página — a folga, a margem do `inset`, o rótulo de grupo e o fundo do
      // cabeçalho — anda na curva das folhas, junto. **O trilho das placas
      // soltas anda na mola** (rodada 221): ele é `fixed` e não reflui nada,
      // então o quique fica nas placas e não sacode o conteúdo. A rente, que
      // encosta no conteúdo, fica na curva.
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
      // Rodada 221: a medição à mão (`offsetParent`, dois observadores, o
      // `<li>` marcador) saiu. Quem anima é o `layoutId` — a mecânica do
      // `Menubar` —, e por isso a pílula vale nas três variantes e já nasce no
      // HTML do servidor.
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
      // Uma tela compensando o `gap` à mão é o sinal de que o componente errou o
      // padrão — foi assim que este defeito foi achado.
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
