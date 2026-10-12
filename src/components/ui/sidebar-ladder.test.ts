import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { realcesSemParDeToque } from "@/test/regras"

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
