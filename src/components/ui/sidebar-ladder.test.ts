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

  it("21. sob `floating` o realce é alfa, e não token", () => {
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
    const escada = CODIGO.match(/const SIDEBAR_GLASS_STATES =\s*"([^"]+)"/)?.[1]
    expect(escada).toBeTruthy()

    const alfas = [...escada!.matchAll(/bg-current\/(\d+)/g)].map((m) => Number(m[1]))
    expect(alfas).toHaveLength(3)
    expect(new Set(alfas).size).toBe(3)
    expect([...alfas].sort((a, b) => a - b)).toEqual(alfas)

    // Os três degraus são cursor, dedo e ativo — nesta ordem de peso.
    expect(escada).toMatch(/:hover:bg-current\//)
    expect(escada).toMatch(/:active:bg-current\//)
    expect(escada).toMatch(/:data-active:bg-current\//)

    // E nenhum deles volta a ser o token opaco.
    expect(escada).not.toMatch(/sidebar-accent/)
    // A escada só vale na variante que tem degradê.
    expect(escada!.split(" ").every((c) => c.startsWith("group-data-[variant=floating]:"))).toBe(true)
    expect(CODIGO).toContain("SIDEBAR_GLASS_STATES,")
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
