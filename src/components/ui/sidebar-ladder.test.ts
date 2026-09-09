import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

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

const FONTE = readFileSync(
  join(process.cwd(), "src/components/ui/sidebar.tsx"),
  "utf8"
)

/** Os comentários citam de propósito o que o arquivo deixou de fazer. */
const CODIGO = FONTE.replace(/\/\*[\s\S]*?\*\//g, " ").replace(
  /(^|[^:])\/\/.*$/gm,
  "$1"
)

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

  it("7. o realce do trilho responde ao toque, e não só ao cursor", () => {
    // `hover:` compila dentro de `@media (hover: hover)`. A regra H do auditor
    // não alcança esta string, porque ela não é um `cva`.
    const trilho = CODIGO.slice(
      CODIGO.indexOf("function SidebarRail"),
      CODIGO.indexOf("function SidebarInset")
    )
    const hovers = [...trilho.matchAll(/hover:([a-z-]+:)*(bg|after:bg)-\S+/g)]
    expect(hovers.length).toBeGreaterThan(0)
    for (const [classe] of hovers) {
      expect(trilho).toContain(classe.replace("hover:", "active:"))
    }
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
    // A guarda mora no retorno curto, junto da que já existia para `!tooltip`.
    expect(btn).toMatch(/if \(!tooltip \|\| state !== "collapsed" \|\| isMobile\)/)
  })

  it("14. a dica não segura o ponteiro entre um ícone e o vizinho", () => {
    // O defeito foi medido aqui, mas mora no `Tooltip`: o Radix mantém a dica
    // aberta enquanto o ponteiro caminha dentro de um polígono de graça até
    // ela. No trilho recolhido os ícones ficam a 36px e a dica abre à direita,
    // então o polígono cobre os vizinhos — passando por "Início" e indo até
    // "Carteiras", a dica continuava escrita "Início" e o `aria-describedby`
    // continuava no primeiro botão. A asserção mora nesta suíte porque é aqui
    // que o custo aparece.
    const tooltip = readFileSync(
      join(process.cwd(), "src/components/ui/tooltip.tsx"),
      "utf8"
    )
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
    const header = readFileSync(
      join(process.cwd(), "src/components/layout/app-header.tsx"),
      "utf8"
    )
    expect(header).toContain("var(--sidebar-inset-rule,1px)")
  })

  it("18. o aro é gradiente vertical, e há uma receita só", () => {
    // Reflexo é gradiente; borda é constante. E a direção importa: o aro nasceu
    // em 158°, um eixo diagonal, e foi corrigido para 180° olhando — numa
    // coluna alta e estreita a luz que convence vem de cima, reta.
    // Duas receitas para a mesma aresta é a borda de volta com outro nome.
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")
    expect(css).toContain("@utility glass")
    expect(CODIGO).toContain("group-data-[variant=floating]:glass")
    expect(CODIGO).not.toMatch(/inset-shadow/)
    expect(CODIGO).not.toMatch(/group-data-\[variant=floating\]:ring-1/)

    // **O brilho da borda é o que faz a peça ler como vidro**, e ele é
    // independente de onde está a luz do corpo. Ele chegou a cair de 34% para
    // 18% sob o argumento de que "contraluz não tem especular" — e o argumento
    // estava errado: sem o brilho a peça vira um retângulo escuro. O piso é 28.
    const escuro = css.slice(css.indexOf(".dark {"))
    const pico = escuro.match(/--glass-rim:\s*oklch\(1 0 0 \/ (\d+)%\)/)
    expect(pico).toBeTruthy()
    expect(Number(pico![1])).toBeGreaterThanOrEqual(28)
  })

  it("22. a lâmina puxa para o chão do próprio tema, e nunca para o preto no claro", () => {
    // O pedido foi "puxando mais para o preto", e a leitura ingênua — preto com
    // alfa nos dois temas — introduziria no claro um cinza que o tema **não tem
    // em lugar nenhum**: medido, ele é inteiramente acromático (croma 0 em
    // `--background`, `--card`, `--muted`, `--border`, `--sidebar`) e a página
    // é `oklch(0.985)`, com o branco de verdade morando no `--card`. A regra é
    // que a lâmina afunda um passo além da página **na direção do chão daquele
    // tema**: preto no escuro, a família neutra própria dele no claro.
    //
    // Mesma mecânica de `--secondary-hover`, que puxa a base na direção do
    // próprio contato em vez de usar um alfa único para os dois.
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")
    const claro = css.slice(0, css.indexOf(".dark {"))
    const escuro = css.slice(css.indexOf(".dark {"))

    // No escuro o chão é o preto.
    expect(escuro).toMatch(/--glass-tint:\s*oklch\(0 0 0 \/ \d+%\)/)
    // No claro ele não é — e o guarda é a claridade, não a ausência do literal.
    const tintaClara = claro.match(/--glass-tint:\s*oklch\(([\d.]+) /)
    expect(tintaClara).toBeTruthy()
    expect(Number(tintaClara![1])).toBeGreaterThan(0.8)

    // As nuvens são brancas nos dois: verde tingiria a navegação num app em que
    // verde significa "entrou dinheiro" — medido, ΔE 43 do `--income`, e ainda
    // assim errado (a rodada 37 registrou que ΔE não decide isso).
    for (const tema of [claro, escuro]) {
      expect(tema).toMatch(/--glass-cloud:\s*oklch\(1 0 0 \/ \d+%\)/)
    }

    // E os tokens de desenhos anteriores não voltaram pela porta dos fundos —
    // é a família "sobreviveu à remoção" que esta base já pagou cinco vezes.
    for (const morto of [
      "--sidebar-surface-top",
      "--sidebar-surface-bottom",
      "--sidebar-bloom",
      "--sidebar-backlight",
    ]) {
      expect(css).not.toContain(morto)
    }

    const receita = css.slice(
      css.indexOf("@utility glass"),
      css.indexOf("@utility glass-control")
    )

    // **A lâmina é pintada por cima das nuvens, e é isso que as põe atrás.**
    // Filtradas por 55% de preto, 30% de branco viram ~37 na tela contra um
    // corpo de 5. Pintadas por cima, as mesmas nuvens leriam como manchas *na*
    // placa. Alfa alto, resultado baixo: a atenuação constrói o "atrás".
    const lamina = receita.indexOf("var(--glass-tint)")
    const primeiraNuvem = receita.indexOf("radial-gradient")
    expect(lamina).toBeGreaterThan(-1)
    expect(lamina).toBeLessThan(primeiraNuvem)

    // São focos, e não uma rampa. Houve uma versão com uma queda vertical de
    // altura inteira chegando a rgb 62 no topo, e ela lia como degradê de fundo
    // dos anos 2000 — forte demais, branca demais, com o eixo à vista. O único
    // gradiente com ângulo que sobra é o aro, no `border-box`.
    expect((receita.match(/radial-gradient/g) ?? []).length).toBeGreaterThanOrEqual(1)
    // Um único gradiente carrega eixo, e ele é o aro — no `border-box`, ou seja
    // no fio de 1px. Qualquer outro gradiente com direção nas camadas de corpo
    // é a lavagem de volta.
    const comEixo = receita.match(/var\(--glass-rim-angle\)/g) ?? []
    expect(comEixo).toHaveLength(1)
    expect(receita.slice(receita.indexOf("var(--glass-rim-angle)"))).toContain("border-box")

    // E nenhuma nuvem tem centro no eixo do painel: três focos alinhados em
    // `50%` voltariam a desenhar a rampa que esta versão existe para não ser.
    for (const [, cx] of receita.matchAll(/radial-gradient\(\s*[\d.]+% [\d.]+% at ([\d.]+)%/g)) {
      expect(Number(cx)).not.toBe(50)
    }
  })

  it("19. o vidro não precisa de máscara, e não tem faixa diagonal", () => {
    // `mask-image: none` num composite apaga o elemento, e a ordem de emissão
    // de `mask-composite` e `-webkit-mask-composite` não se controla. A técnica
    // escolhida — `padding-box` para a superfície, `border-box` para o aro —
    // não precisa de máscara, e o raio sobrevive (medido).
    //
    // E são **três** camadas: houve um brilho diagonal em `soft-light`, e ele
    // saiu. Numa superfície de navegação a faixa cruza a lista de links e
    // compete com ela.
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")
    const receita = css.slice(
      css.indexOf("@utility glass"),
      css.indexOf("@utility glass-control")
    )
    expect(receita).toContain("padding-box")
    expect(receita).toContain("border-box")
    expect(receita).not.toMatch(/mask-composite|-webkit-mask/)
    expect(receita).not.toMatch(/soft-light|background-blend-mode/)

    // **O eixo do aro é um token, e não um número na receita**, porque hoje ele
    // difere por tema: inclinado no escuro para concentrar o brilho no canto
    // superior-esquerdo, reto no claro, onde não há brilho para concentrar.
    // Isso reverte a rodada 37, que o tinha posto em 180° — e a reversão é
    // legítima porque a peça mudou: lá o corpo era uma rampa vertical com que
    // um aro diagonal brigava; hoje é preto plano.
    expect(receita).toContain("var(--glass-rim-angle)")
    expect(receita).not.toMatch(/linear-gradient\(\s*\d+deg/)

    const claro = css.slice(0, css.indexOf(".dark {"))
    const escuro = css.slice(css.indexOf(".dark {"))
    const anguloClaro = Number(claro.match(/--glass-rim-angle:\s*(\d+)deg/)?.[1])
    const anguloEscuro = Number(escuro.match(/--glass-rim-angle:\s*(\d+)deg/)?.[1])
    // Tomba para a esquerda (o pico sobe do topo para o canto superior-esquerdo)
    // sem virar diagonal de 45°, que seria outra peça.
    expect(anguloEscuro).toBeGreaterThan(140)
    expect(anguloEscuro).toBeLessThan(180)
    // **É o mesmo eixo nos dois temas, girado 180°** — a geometria é idêntica e
    // só a polaridade inverte: no escuro o pico é luz e mora no canto superior-
    // esquerdo; no claro ele é sombra, e sombra de uma placa acesa por cima-à-
    // esquerda mora no canto oposto. Um valor solto em cada tema deixaria os
    // dois biséis apontando para direções diferentes sem ninguém perceber.
    expect(anguloClaro).toBe((anguloEscuro + 180) % 360)
  })

  it("20. nenhum realce acende no cursor e fica inerte no dedo", () => {
    // `hover:` compila dentro de `@media (hover: hover)` — verificado no CSS
    // emitido nas rodadas anteriores —, então um realce sem par `active:` não
    // existe no telefone. A regra **H** do auditor não alcança este arquivo:
    // ela varre `className="…"`, e aqui tudo mora dentro de `cva()` e `cn()`.
    // É o ponto cego que o `AGENTS.md` já registra três vezes, e foi ele que
    // deixou a variante `outline` acendendo a sombra só no cursor.
    const semPar: string[] = []
    for (const [, classes] of CODIGO.matchAll(/"([^"]*hover:(?:bg|shadow)-[^"]*)"/g)) {
      for (const familia of ["bg", "shadow"]) {
        const acendeNoCursor = new RegExp(`(?:^|\\s|:)hover:${familia}-`).test(classes)
        const acendeNoDedo = new RegExp(`(?:^|\\s|:)active:${familia}-`).test(classes)
        if (acendeNoCursor && !acendeNoDedo) semPar.push(`${familia}: ${classes.slice(0, 70)}…`)
      }
    }
    expect(semPar).toEqual([])
  })

  it("21. sob `floating` o realce é alfa, e nunca o token opaco", () => {
    // A superfície virou degradê na rodada 37, e um retângulo **opaco** em
    // cima dela apaga o degradê dentro do próprio realce — e muda de força
    // conforme a altura do item. Medido antes: o mesmo hover dava 1,09 no
    // botão do workspace (8% do painel) e 1,21 no da conta (92%), com a
    // assimetria **invertendo** entre os temas. Depois: variação de 0,04 no
    // escuro e 0,003 no claro.
    //
    // A tinta é `currentColor`, e não `white/N`: dentro do painel ela é
    // `--sidebar-foreground`, quase-branca no escuro e quase-preta no claro —
    // vira de direção sozinha, sem par `dark:`. É a mesma escolha que o
    // `AlertAction` e o `AnnouncementBarAction` já registram.
    //
    // *(Rodada 65: o degrau do **ativo** mudou de casa — ele mora no marcador
    // que viaja, e a classe do botão é o fallback de antes da primeira
    // medição. O cursor e o toque continuam aqui.)*
    const partes = Object.fromEntries(
      ["SIDEBAR_GLASS_STATES", "SIDEBAR_GLASS_ACTIVE", "SIDEBAR_GLASS_MARKER"].map(
        (nome) => [
          nome,
          CODIGO.match(new RegExp(`const ${nome} =\\s*"([^"]+)"`))?.[1],
        ]
      )
    ) as Record<string, string | undefined>

    for (const [nome, valor] of Object.entries(partes)) {
      expect(valor, `${nome} não achada`).toBeTruthy()
      // Nada sob `floating` volta ao token opaco, e nada escapa do escopo.
      expect(valor, nome).not.toMatch(/sidebar-accent/)
      expect(
        valor!.split(" ").every((c) => c.startsWith("group-data-[variant=floating]:")),
        nome
      ).toBe(true)
    }

    // Os três degraus, distintos e em ordem — cursor e toque no botão, o do
    // ativo no marcador. O repouso do item é transparente: em repouso ele é a
    // própria placa.
    const marcador = CODIGO.slice(CODIGO.indexOf('data-slot="sidebar-marker"'))
    const alfaDoMarcador = Number(marcador.match(/bg-current\/(\d+)/)?.[1])
    const alfas = [
      ...[...partes.SIDEBAR_GLASS_STATES!.matchAll(/bg-current\/(\d+)/g)].map((m) =>
        Number(m[1])
      ),
      alfaDoMarcador,
    ]
    expect(alfas).toHaveLength(3)
    expect(new Set(alfas).size).toBe(3)
    expect([...alfas].sort((a, b) => a - b)).toEqual(alfas)

    // E nenhum degrau sem estado no nome: o repouso do item é a placa.
    expect(partes.SIDEBAR_GLASS_STATES).not.toMatch(
      /group-data-\[variant=floating\]:bg-current\//
    )
    expect(partes.SIDEBAR_GLASS_STATES).toMatch(/:hover:bg-current\//)
    expect(partes.SIDEBAR_GLASS_STATES).toMatch(/:active:bg-current\//)
    expect(partes.SIDEBAR_GLASS_ACTIVE).toMatch(/:data-active:bg-current\//)
    // O fallback repete o alfa do marcador: a troca não pode piscar.
    expect(Number(partes.SIDEBAR_GLASS_ACTIVE!.match(/bg-current\/(\d+)/)?.[1])).toBe(
      alfaDoMarcador
    )

    expect(CODIGO).toContain("SIDEBAR_GLASS_STATES,")
    expect(CODIGO).toContain(
      "temMarcador ? SIDEBAR_GLASS_MARKER : SIDEBAR_GLASS_ACTIVE"
    )
    // **Ceder é apagar**, e não deixar de declarar: a base do `cva` pinta
    // `data-active:bg-sidebar-accent` e não conhece a variante.
    expect(partes.SIDEBAR_GLASS_MARKER).toBe(
      "group-data-[variant=floating]:data-active:bg-transparent"
    )
  })

  it("22b. o reflexo da placa é repouso, e não estado", () => {
    // Ele chegou a acender **sob o cursor**, e o defeito era de alvo: a placa é
    // do tamanho da coluna, e apontar para *um item* acendia a barra inteira.
    // A decisão foi levar o valor do hover ao repouso: o `--glass-sheen` é
    // produzido pela placa sem variante de estado nenhuma.
    const miolo = CODIGO.slice(
      CODIGO.indexOf("const miolo = ("),
      CODIGO.indexOf("if (resizable) {", CODIGO.indexOf("const miolo = ("))
    )
    expect(miolo.length).toBeGreaterThan(0)
    expect(miolo).not.toMatch(/hover:|active:/)
    const producao = miolo.match(/"[^"]*--glass-sheen[^"]*"/g) ?? []
    expect(producao).toHaveLength(1)
    // Só no escuro (no claro a lâmina já está no teto), e sob `floating`.
    expect(producao[0]).toMatch(/dark:group-data-\[variant=floating\]:\[--glass-sheen:/)
    // Estático não interpola nada, então nenhum `@property` o registra —
    // sem transição, o registro seria peso morto.
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")
    expect(css).not.toMatch(/@property\s+--glass-sheen/)
    expect(miolo).not.toContain("transition-[--glass-sheen]")
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
    // O painel segue o eixo da barra: `side="right"` abre pela direita também
    // no telefone.
    expect(mobile).toMatch(/side=\{side\}/)
    // `fillMobileViewport` é a altura **da gaveta**. No painel ela sai do par
    // `top`/`bottom` do `cva`, e passá-lo seria prop inerte.
    expect(mobile).not.toContain("fillMobileViewport")
    // A classe do shadcn que escondia o nosso × — medido, `display: none`. Na
    // gaveta passava (fecha-se arrastando); num painel não há arraste.
    expect(mobile).not.toContain("[&>button]:hidden")
    expect(mobile).toContain("dialog-close-button".replace("dialog-close-button", "DialogCloseButton"))
  })

  it("23. o `side` manda no layout, e as margens de `inset` são espelhadas", () => {
    // Medido a 926px antes do conserto: com `side="right"` o trilho ia para
    // `l670 r926` e a folga continuava em `l0 r256` — 256px vazios de um lado
    // e a placa cobrindo **240px do conteúdo** do outro. A ordem no DOM não
    // muda (os `peer-*` do `SidebarInset` dependem dela); quem inverte é o flex.
    expect(CODIGO).toContain("data-[side=right]:order-last")
    // O `rotate-180` da folga era herança do shadcn sobre uma `div` vazia e
    // transparente — inerte, e saiu junto.
    expect(CODIGO).not.toContain("group-data-[side=right]:rotate-180")

    const inset = CODIGO.slice(
      CODIGO.indexOf("function SidebarInset("),
      CODIGO.indexOf("function SidebarInput(")
    )
    expect(inset.length).toBeGreaterThan(0)
    for (const classe of [
      "peer-data-[side=left]:ml-0",
      "peer-data-[side=right]:mr-0",
      "peer-data-[state=collapsed]:peer-data-[side=left]:ml-2",
      "peer-data-[state=collapsed]:peer-data-[side=right]:mr-2",
    ]) {
      expect(inset, classe).toContain(classe)
    }
    // E nenhuma margem lateral sem o lado dito — era assim que só a esquerda
    // existia.
    for (const [todo] of inset.matchAll(
      /peer-data-\[variant=inset\]:m[lr]-\d/g
    )) {
      expect(todo, `${todo} sem side`).toBeUndefined()
    }
  })

  it("24. a barra e o cabeçalho falam a mesma curva", () => {
    // `ease-linear` é o movimento de quem não escolheu curva. O gesto de
    // recolher move a folga, o trilho, o rótulo de grupo e a altura do
    // cabeçalho — quatro nós, e duas curvas leem como duas animações que por
    // acaso começaram juntas. A curva é a das folhas.
    const cabecalho = readFileSync(
      join(process.cwd(), "src/components/layout/app-header.tsx"),
      "utf8"
    )
    for (const [nome, fonte] of [
      ["sidebar", CODIGO],
      ["app-header", cabecalho],
    ] as const) {
      expect(fonte, `${nome} tem ease-linear`).not.toContain("ease-linear")
    }
    for (const alvo of [
      "transition-[width]",
      "transition-[left,right,width]",
      "transition-[margin,opacity]",
    ]) {
      const i = CODIGO.indexOf(alvo)
      expect(i, alvo).toBeGreaterThan(-1)
      expect(CODIGO.slice(i, i + 130), alvo).toContain("ease-(--ease-emphasized)")
    }
    expect(cabecalho).toMatch(
      /transition-\[height\][^"]*ease-\(--ease-emphasized\)/
    )
  })

  it("25. o marcador soma a cadeia de offsetParent, e não lê a caixa da tela", () => {
    // O `<li>` do menu é `relative`, então ele — e não a trilha — é o
    // `offsetParent` do botão: lido direto, `offsetLeft` valeria zero para
    // todos, e o primeiro item acertaria por acidente. É o defeito que o
    // `NavigationMenu` mediu na rodada 32b.
    const fn = CODIGO.slice(
      CODIGO.indexOf("function caixaRelativa("),
      CODIGO.indexOf("function SidebarMenu(")
    )
    expect(fn.length).toBeGreaterThan(0)
    expect(fn).toContain("offsetParent")
    expect(fn).toMatch(/x \+= no\.offsetLeft/)
    expect(fn).toMatch(/y \+= no\.offsetTop/)

    const menu = CODIGO.slice(
      CODIGO.indexOf("function SidebarMenu("),
      CODIGO.indexOf("function SidebarMenuItem(")
    )
    // Coordenada de conteúdo, nunca de viewport: o `SidebarContent` rola.
    expect(menu).not.toContain("getBoundingClientRect")
    // Nada de laço por quadro — dois observadores, como no `Tabs`.
    expect(menu).not.toContain("requestAnimationFrame")
    expect(menu).toContain("ResizeObserver")
    expect(menu).toContain("MutationObserver")
    // A trilha não declara altura: ela cresce com os itens.
    expect(menu).toMatch(/"relative flex w-full min-w-0 flex-col gap-1"/)
    // O marcador é um nó só, e vem **antes** dos itens: `relative` com
    // `z-index: auto` não cria contexto de empilhamento, então um `-z-*` o
    // mandaria para trás da própria placa. Quem o põe atrás é a ordem.
    expect([...menu.matchAll(/data-slot="sidebar-marker"/g)]).toHaveLength(1)
    expect(menu).not.toMatch(/sidebar-marker[\s\S]{0,500}?-z-\d/)
    expect(menu.indexOf('data-slot="sidebar-marker"')).toBeLessThan(
      menu.lastIndexOf("{children}")
    )
  })

  it("11. nenhuma tela reescreve o ritmo da lista", () => {
    // Uma tela compensando o `gap` à mão é o sinal de que o componente errou o
    // padrão — foi assim que este defeito foi achado.
    const app = readFileSync(
      join(process.cwd(), "src/components/layout/app-sidebar.tsx"),
      "utf8"
    )
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
