import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { blocoCss, lerFonte, semComentarios } from "@/test/fonte"
import { esperarSemClasseMontada } from "@/test/regras"

import { barSurfaceClassName, menuPanelTintClassName } from "@/lib/glass-classes"

/**
 * As invariantes do vidro. O que é da barra mora na régua da Sidebar (a placa flutuante não
 * veste mais a peça); cada asserção aqui diz qual defeito tranca.
 */

const CSS = lerFonte("src/app/globals.css")

/**
 * Só o corpo da receita: o corte para no próximo doc-comment de topo, para a asserção 7 não
 * varrer a prosa do vizinho como se fosse código.
 */
const RECEITA = blocoCss(CSS, "@utility glass {", "\n/**")

/**
 * Os blocos de tema de verdade. `ESCURO` vai até o fim do arquivo e engole as `@utility`: serve
 * para achar a declaração de um token, não para provar que ele não é declarado num tema.
 */
const TEMA_CLARO = blocoCss(CSS, ":root {", "\n}")
const TEMA_ESCURO = blocoCss(CSS, ".dark {", "\n}")

/** Lê um arquivo do repositório sem comentários — o corte que a 26 já usava. */
const semComentariosDe = (caminho: string) => semComentarios(lerFonte(caminho), "fora-de-url")

const SUPERFICIE_FLUTUANTE = semComentarios(lerFonte("src/lib/menu-classes.ts"), "bloco")

/**
 * A receita sem comentários: ela cita de propósito o que deixou de fazer, e uma asserção sobre
 * o texto cru testaria o comentário e não o código.
 */
const RECEITA_CODIGO = semComentarios(RECEITA, "bloco")

const CLARO = CSS.slice(0, CSS.indexOf(".dark {"))
const ESCURO = CSS.slice(CSS.indexOf(".dark {"))

describe("a superfície de vidro", () => {
    it("1. a lâmina é declarada antes das nuvens, e é isso que as põe atrás", () => {
        // A lâmina é pintada **por cima**, então as nuvens chegam ao olho
        // filtradas: 48% de branco sobre a página dá rgb 128, e a lâmina o leva
        // a 23 contra um corpo de 2. Pintadas por cima, as mesmas nuvens dariam
        // 128 e leriam como manchas *na* placa. Alfa alto, resultado baixo — é a
        // atenuação que constrói o "atrás".
        const lamina = RECEITA.indexOf("var(--glass-tint)")
        const primeiraNuvem = RECEITA.indexOf("radial-gradient")
        expect(lamina).toBeGreaterThan(-1)
        expect(primeiraNuvem).toBeGreaterThan(-1)
        expect(lamina).toBeLessThan(primeiraNuvem)
    })

    it("2. a luz são focos, e nunca uma rampa de altura inteira", () => {
        // O que importa não é a família da curva, é a escala: luz que ocupa a peça inteira (um
        // radial de 105% chegava a rgb 62) lê como fundo, não como luz.
        expect((RECEITA.match(/radial-gradient/g) ?? []).length).toBeGreaterThanOrEqual(1)

        // Um único gradiente carrega eixo, e ele é o aro — no `border-box`, ou
        // seja no fio de 1px. Direção nas camadas de corpo é a lavagem de volta.
        const comEixo = RECEITA.match(/var\(--glass-rim-angle\)/g) ?? []
        expect(comEixo).toHaveLength(1)
        expect(RECEITA.slice(RECEITA.indexOf("var(--glass-rim-angle)"))).toContain("border-box")
        expect(RECEITA).not.toMatch(/linear-gradient\(\s*\d+deg/)

        // E nenhum foco no eixo do painel: focos alinhados em `50%` voltariam a
        // desenhar a rampa que esta receita existe para não ser.
        for (const [, cx] of RECEITA.matchAll(/at\s+([\d.]+)%\s+[\d.]+%/g)) {
            expect(Number(cx)).not.toBe(50)
        }
    })

    it("3. os dois temas usam o mesmo eixo, girado 180°", () => {
        // A geometria é idêntica e só a polaridade inverte: no escuro o pico do
        // aro é luz e mora no canto superior-esquerdo; no claro ele é sombra, e
        // sombra de uma placa acesa por cima-à-esquerda mora no canto oposto.
        // Com dois valores soltos, os dois biséis podiam apontar para direções
        // diferentes sem ninguém perceber.
        const claro = Number(CLARO.match(/--glass-rim-angle:\s*(\d+)deg/)?.[1])
        const escuro = Number(ESCURO.match(/--glass-rim-angle:\s*(\d+)deg/)?.[1])
        expect(escuro).toBeGreaterThan(140)
        expect(escuro).toBeLessThan(180)
        expect(claro).toBe((escuro + 180) % 360)
    })

    it("4. a lâmina puxa para o chão do próprio tema, e nunca para o preto no claro", () => {
        // O tema claro é inteiramente acromático e a página é `oklch(0.985)`:
        // preto com alfa ali introduziria um cinza que ele não tem em lugar
        // nenhum. A regra é a mesma dos dois lados — a lâmina se afasta da
        // página na direção do chão daquele tema —, e as distâncias batem: 1,049
        // no escuro contra 1,040 no claro.
        expect(ESCURO).toMatch(/--glass-tint:\s*oklch\(0 0 0 \/ \d+%\)/)
        const tintaClara = CLARO.match(/--glass-tint:\s*oklch\(([\d.]+) /)
        expect(tintaClara).toBeTruthy()
        expect(Number(tintaClara![1])).toBeGreaterThan(0.8)

        // As nuvens são brancas nos dois: verde tingiria a navegação num app em
        // que verde significa "entrou dinheiro".
        for (const tema of [CLARO, ESCURO]) {
            expect(tema).toMatch(/--glass-cloud:\s*oklch\(1 0 0 \/ \d+%\)/)
        }
    })

    it("5. o brilho da borda não é opcional, e o piso é 28%", () => {
        // Ele chegou a cair de 34% para 18%, sob o argumento de que "contraluz
        // não tem especular". **Estava errado**: o aro não descreve de onde vem
        // a luz do corpo — ele é a aresta da lâmina pegando luz, e é o que faz a
        // peça ler como vidro em vez de retângulo escuro.
        const pico = ESCURO.match(/--glass-rim:\s*oklch\(1 0 0 \/ (\d+)%\)/)
        expect(pico).toBeTruthy()
        expect(Number(pico![1])).toBeGreaterThanOrEqual(28)
    })

    it("6. o raio é do consumidor, e é isso que torna a peça portátil", () => {
        // A utility não declara `border-radius`: ela herda. É o que faz
        // `rounded-full` num controle e `rounded-xl` num painel funcionarem sem
        // eixo nenhum — a mesma decisão que a variante `bare` do `Command`
        // registrou ao parar de copiar um número do contêiner para dentro do
        // componente.
        expect(RECEITA).not.toMatch(/border-radius|rounded-/)
    })

    it("7. a receita base nunca borra", () => {
        // `mask-image: none` num composite apaga o elemento, e a ordem de
        // emissão das duas propriedades de composite não se controla pelo
        // Tailwind — daí `padding-box`/`border-box`, que não precisa de máscara.
        expect(RECEITA).toContain("padding-box")
        expect(RECEITA).toContain("border-box")
        expect(RECEITA).not.toMatch(/mask-composite|-webkit-mask|mask-image/)
        expect(RECEITA).not.toMatch(/soft-light|background-blend-mode/)

        // A varredura é no código, não no texto cru: um comentário que mencionasse `backdrop-
        // filter` não pode reprovar a asserção.
        expect(RECEITA_CODIGO).not.toMatch(/backdrop-filter|backdrop-blur/)
    })

    it("20. o aro e o realce são contrato, e sem produtor nada muda", () => {
        // As duas camadas são `var(--x, <valor>)`: o fallback garante que o painel e o preset
        // de controle saem byte a byte iguais.
        expect(RECEITA_CODIGO).toContain("var(\n        --glass-rim-image,")
        expect(RECEITA_CODIGO).toContain("var(\n        --glass-sheen-image,")

        // O fallback do aro continua sendo o linear com o eixo por token…
        const aro = RECEITA_CODIGO.slice(RECEITA_CODIGO.indexOf("--glass-rim-image"))
        expect(aro).toContain("linear-gradient(")
        expect(aro).toContain("var(--glass-rim-angle)")
        // …e o do realce, o chapado que ninguém produz hoje.
        const realce = RECEITA_CODIGO.slice(
            RECEITA_CODIGO.indexOf("--glass-sheen-image"),
            RECEITA_CODIGO.indexOf("--glass-tone")
        )
        expect(realce).toContain("var(--glass-sheen, transparent)")

        // Nenhum tema declara as duas: sem produtor, o fallback é o resultado.
        for (const tema of [TEMA_CLARO, TEMA_ESCURO]) {
            expect(tema).not.toMatch(/--glass-rim-image:/)
            expect(tema).not.toMatch(/--glass-sheen-image:/)
        }
    })

    it("23. três superfícies, três tintas — lado a lado em glass-classes", () => {
        // Uma superfície elevada tem conteúdo passando por baixo (o lado do `backdrop-filter`
        // da régua dos vidros, com o material do cabeçalho). As três tintas moram juntas, para
        // nenhuma virar alias de outra.
        expect(existsSync(join(process.cwd(), "src/lib/bar-classes.ts")), "bar-classes voltou").toBe(false)
        expect(existsSync(join(process.cwd(), "src/lib/modal-classes.ts")), "modal-classes voltou").toBe(false)

        // A flutuante tem receita própria e não é a barra: `--popover` a 85, abrindo a 60 só no
        // escuro (a tinta da barra virava uma chapa escura sem vidro).
        expect(menuPanelTintClassName, "a flutuante voltou a ser a barra").not.toBe(barSurfaceClassName)
        expect(SUPERFICIE_FLUTUANTE, "a flutuante voltou a ser alias").not.toMatch(
            /menuPanelTintClassName\s*=\s*barSurfaceClassName/
        )

        // A modal continua distinta, e a tela decidiu: ela chegou a ser
        // `--popover` para igualar o DatePicker, e a 60% sobre a página velada
        // compôs acima de tudo atrás e leu como opaca. `--background` afunda no
        // véu, e é o borrão que a distingue.
        const reguas = semComentariosDe("src/lib/glass-classes.ts")
        for (const [nome, ancora, token, aberto] of [
            ["barra", "barSurfaceClassName", "background", /supports-backdrop-filter:bg-background\/(\d+)/],
            ["flutuante", "menuPanelTintClassName", "popover", /supports-backdrop-filter:bg-popover\/(\d+)/],
            ["modal", "modalSurfaceClassName", "background", /supports-backdrop-filter:dark:bg-background\/(\d+)/],
        ] as const) {
            const i = reguas.indexOf(`${ancora} = [`)
            expect(i, `${nome}: régua não achada`).toBeGreaterThan(-1)
            const receita = reguas.slice(i, reguas.indexOf("].join(", i))
            expect(receita, `${nome}: sem material`).toContain("glass-surface")
            // Ancorado na classe de borrão: o variante `supports-backdrop-filter:`
            // contém a string `backdrop-filter` de propósito.
            expect(receita, `${nome}: borrão próprio`).not.toMatch(/\bbackdrop-blur/)
            expect(receita, `${nome}: sem guarda`).toContain(`reduced-transparency:bg-${token}`)
            // A base é o alfa que anda junto do material — é ela o fallback sem
            // `backdrop-filter`, e tem de ser legível sozinha.
            const base = Number(receita.match(new RegExp(`bg-${token}/(\\d+) glass-surface`))?.[1])
            const comBorrao = Number(receita.match(aberto)?.[1])
            expect(base, `${nome}: alfa base`).toBeGreaterThan(0)
            expect(comBorrao, `${nome}: alfa aberto`).toBeGreaterThan(0)
            // Abre só onde o borrão existe.
            expect(comBorrao).toBeLessThan(base)
        }
    })

    it("23b. a seta do HoverCard espelha a placa, e é o único espelho", () => {
        // Um triângulo vetorial se pinta com `fill` e não com `background`, então
        // esta é a única receita repetida fora da régua. Um triângulo opaco na
        // ponta de uma placa translúcida sai mais escuro que ela.
        const seta = semComentariosDe("src/components/ui/hover-card.tsx")
        for (const classe of [
            "fill-popover/85",
            "supports-backdrop-filter:fill-popover/60",
            "reduced-transparency:fill-popover",
        ]) {
            expect(seta, classe).toContain(classe)
        }
        // E os alfas são os mesmos da placa que ela termina.
        for (const classe of ["bg-popover/85", "supports-backdrop-filter:bg-popover/60"]) {
            expect(menuPanelTintClassName, classe).toContain(classe)
        }
    })

    it("24. uma placa por superfície — o Command hospedado não pinta", () => {
        // Duas placas a 60% empilhadas dão 84%: o Combobox (popover + `Command`) saía mais
        // claro que o DatePicker. Quem hospeda pinta; o `Command` só pinta na variante `panel`,
        // solto numa página.
        const paleta = semComentariosDe("src/components/ui/command.tsx")
        const cva = paleta.slice(paleta.indexOf("const commandVariants"), paleta.indexOf("defaultVariants", paleta.indexOf("const commandVariants")))
        const base = cva.slice(0, cva.indexOf("variants:"))
        expect(base, "a base do Command pinta").not.toContain("menuPanelSurfaceClassName")
        expect(base, "a base do Command tem tinta").not.toMatch(/\bbg-popover/)
        // A variante `panel` é a pilha: a raiz não pinta, e quem pinta são a pílula e a placa.
        expect(cva, "a variante panel voltou a pintar").not.toMatch(/panel:\s*menuPanelSurfaceClassName/)
        // O `CommandDialog` não neutraliza nada: é uma coluna que não pinta por não declarar
        // fundo, e não por um `bg-transparent` (o do `<input>`, mais abaixo, é outro elemento).
        const dialogo = paleta.slice(paleta.indexOf("function CommandDialog"), paleta.indexOf("function CommandInput"))
        expect(dialogo.length, "bloco do CommandDialog não achado").toBeGreaterThan(0)
        expect(dialogo).not.toMatch(/\bbg-transparent\b/)
        // Quem pinta, no diálogo, são as duas faixas: a pílula de busca e a
        // placa da lista, cada uma com o tom do popover nos três estados da
        // régua — a paleta é uma superfície de comandos, não um diálogo. Elas
        // vestem a tinta da régua em vez de repetir a string: os três estados
        // são os da asserção 23, e uma cópia aqui divergiria dela.
        const campo = paleta.slice(paleta.indexOf("function CommandInput"), paleta.indexOf("function CommandScope"))
        const lista = paleta.slice(paleta.indexOf("function CommandList"), paleta.indexOf("function CommandEmpty"))
        // A tinta chega pela receita da busca, que a importa da régua.
        expect(campo, "a pílula de busca não pinta").toMatch(/<SearchInput\s+surface=\{surface \?\? \(naPilha \? "plate" : "field"\)\}/)
        expect(
            lerFonte("src/lib/search-field-classes.ts"),
            "a receita veste a tinta da régua"
        ).toMatch(/import \{ menuPanelTintClassName \} from "@\/lib\/glass-classes"[\s\S]*plate: `[^`]*\$\{menuPanelTintClassName\}`/)
        expect(lista, "a placa da lista não pinta").toMatch(/command-dialog-panel[\s\S]*menuPanelTintClassName/)
        expect(paleta).not.toContain("supports-backdrop-filter:dark:bg-transparent")
        expect(paleta).not.toContain("reduced-transparency:bg-transparent")
    })

    it("25. a receita é uma só — as cópias à mão não voltam", () => {
        // Ela esteve escrita em **cinco** lugares: a régua e cópias em `Select`,
        // `Popover`, `HoverCard` e `Tooltip`, com o doc da régua afirmando ter
        // extraído as quatro. A do `Tooltip` ainda divergia — `rounded-md` e
        // `border` contra o `rounded-lg` e o `ring` de todas as outras.
        for (const nome of ["select", "popover", "hover-card", "command", "tooltip", "chart"] as const) {
            const src = semComentariosDe(`src/components/ui/${nome}.tsx`)
            // O `command` pinta por peças (a pílula e a placa da pilha) e veste a tinta da
            // régua, a metade da receita que as peças soltas usam.
            const regua = nome === "command" ? "menuPanelTintClassName" : "menuPanelSurfaceClassName"
            expect(src, `${nome} precisa vestir a régua`).toContain(regua)
            expect(src, `${nome} tem cópia da superfície`).not.toMatch(
                /rounded-lg[^"]*bg-popover[^"]*ring-foreground\/10/
            )
            expect(src, `${nome} escreve borrão próprio`).not.toMatch(/\bbackdrop-blur/)
        }
        // O `Select` repintava a superfície nos dois botões de rolagem: com a
        // casca translúcida, um `bg-popover` opaco ali vira uma faixa sólida.
        expect(semComentariosDe("src/components/ui/select.tsx")).not.toMatch(/justify-center bg-popover/)
    })

    it("26. as quatro superfícies modais vestem a régua, e nada repinta por dentro", () => {
        // O `Sheet` traz os dois ramos no mesmo arquivo (a placa do painel no `cva`, a da
        // gaveta no ramo do `vaul`). A folha veste o vidro modal do `Dialog` pela régua
        // (2026-10-18, pedido do dono), e nunca por cópia.
        const folha = semComentariosDe("src/components/ui/sheet.tsx")
        expect(folha).toContain("modalSurfaceClassName")
        expect(folha).not.toContain("bg-clip-padding bg-popover")
        for (const nome of ["dialog", "drawer", "sheet"] as const) {
            const src = semComentariosDe(`src/components/ui/${nome}.tsx`)
            expect(src, `${nome} precisa vestir a régua`).toContain("modalSurfaceClassName")
            // A marca da cópia, nos dois tokens que a placa já teve.
            expect(src, `${nome} tem cópia da superfície`).not.toMatch(/\bbg-(?:background|popover) text-sm shadow-lg/)
            // Nenhuma peça interna repinta por cima da placa translúcida — é o
            // defeito que os `ScrollButton` do `Select` tiveram, e que as tiras
            // repetiram com um degradê `from-popover`: cor com alfa não tem cor
            // cheia pintável, e o opaco saía como banda (17b em `scroll-fade`).
            expect(src, `${nome} repinta a placa por dentro`).not.toMatch(/"[^"]*\bbg-(?:background|popover)(?![-/])/)
            expect(src, `${nome} pinta degradê sobre a placa`).not.toMatch(/\bfrom-(?:background|popover)\b/)
        }
        for (const arquivo of ["src/components/ui/form.tsx"]) {
            expect(semComentariosDe(arquivo), `${arquivo}: degradê sobre a placa`).not.toMatch(/\bfrom-(?:background|popover)\b/)
        }
    })

    it("8. o preset de controle move a variável, e nunca a propriedade", () => {
        // Duas utilities escrevendo `background` seriam decididas por ordem de
        // emissão do Tailwind e não pelo que se escreveu. A `glass` lê
        // `var(--glass-cloud-ry, 18%)` e **não declara** a variável; só o preset
        // a declara. Variável herda e não disputa.
        const preset = CSS.slice(
            CSS.indexOf("@utility glass-control"),
            CSS.indexOf("@utility no-scrollbar")
        )
        expect(preset).toMatch(/--glass-cloud-ry:\s*\d+%/)
        expect(preset).not.toContain("background")
        expect(RECEITA).toContain("var(--glass-cloud-ry, 18%)")
        expect(RECEITA).not.toMatch(/^\s*--glass-cloud-ry:/m)
    })

    it("9. os tokens antigos não voltaram pela porta dos fundos", () => {
        // A receita não volta a ter dois nomes (`sidebar-glass` e `glass`): seriam duas
        // receitas para a mesma borda.
        for (const morto of [
            "--sidebar-glass-tint",
            "--sidebar-cloud",
            "--sidebar-rim",
            "sidebar-glass",
        ]) {
            expect(CSS).not.toContain(morto)
        }
    })

    it("11. o bisel tem um lado aceso, e no claro ele só existe por token próprio", () => {
        // O que faz um vidro brilhar é o par realce/sombra: no claro o pico do aro é sombra, e
        // derivar o outro extremo dele só dá uma sombra mais fraca (sem lado aceso). Cada
        // extremo tem token próprio.
        expect(RECEITA).toContain("var(--glass-rim-far)")

        // A proibição é derivar um extremo do outro na declaração do token, e a asserção olha
        // os blocos de tema (um `[^)]*` contra a receita não atravessa o `)` de `var(--glass-
        // ink)`).
        for (const tema of [CLARO, ESCURO]) {
            const decl = tema.match(/--glass-rim-far:\s*([^;]+);/)?.[1] ?? ""
            expect(decl).not.toContain("--glass-rim")
        }

        const alvo = (bloco: string, token: string) =>
            bloco.match(new RegExp(`${token}:\\s*oklch\\(([\\d.]+)`))?.[1]

        // No escuro os dois extremos são luz — mesma natureza, e o pico é maior.
        expect(ESCURO).toMatch(/--glass-rim-far:\s*oklch\(1 0 0/)

        // No claro eles têm polaridades **opostas**: o pico é sombra (claridade
        // 0) e o extremo é luz. Sem isso não há lado aceso.
        expect(Number(alvo(CLARO, "--glass-rim"))).toBeLessThan(0.1)
        expect(Number(alvo(CLARO, "--glass-rim-far"))).toBeGreaterThan(0.9)

        // E a lâmina clara não pode encostar no teto: em branco puro ela fica em
        // 255 e o realce não tem espaço acima do corpo.
        expect(Number(alvo(CLARO, "--glass-tint"))).toBeLessThan(1)
    })

    it("12. o tom fica acima da lâmina, e o realce acima de tudo", () => {
        // A ordem é o mecanismo: as nuvens ficam abaixo da lâmina (a atenuação as faz ler como
        // atrás), o tom é a cor do material, e o realce fica acima do tom para não mudar de
        // força com a cor da peça.
        const realce = RECEITA_CODIGO.indexOf("var(--glass-sheen")
        const tom = RECEITA_CODIGO.indexOf("var(--glass-tone")
        const lamina = RECEITA_CODIGO.indexOf("var(--glass-tint)")
        const nuvem = RECEITA_CODIGO.indexOf("radial-gradient")
        expect(realce).toBeGreaterThan(-1)
        expect(realce).toBeLessThan(tom)
        expect(tom).toBeLessThan(lamina)
        expect(lamina).toBeLessThan(nuvem)

        // Quem não pede tom nem realce não paga nada.
        expect(RECEITA_CODIGO).toContain("var(--glass-tone, transparent)")
        expect(RECEITA_CODIGO).toContain("var(--glass-sheen, transparent)")

        // **O aro e as nuvens não leem o tom do corpo.** Eles puxam matiz de
        // `--glass-ink` (asserções 14 e 15), com o alfa preso; ler `--glass-tone`
        // engrossaria a aresta, que é o que fazia a peça ler como plástico.
        const aro = RECEITA_CODIGO.slice(RECEITA_CODIGO.indexOf("var(--glass-rim-angle)"))
        expect(aro).not.toContain("--glass-tone")
        const nuvens = RECEITA_CODIGO.slice(nuvem, RECEITA_CODIGO.indexOf("var(--glass-rim-angle)"))
        expect(nuvens).not.toContain("--glass-tone")
    })

    it("13. quem tem o modo traduz cor, e o eixo é eixo — não embrulho mudado de lugar", () => {
        // O eixo `glass` absorveu as peças separadas; o que decide "componente ou modo" é a
        // tradução precisar de uma peça para existir. A varredura é sem comentários, porque os
        // doc-comments citam `--glass-tone` por extenso.
        const base = (nome: string) => semComentariosDe(`src/components/ui/${nome}.tsx`)

        /**
         * As peças que vestem o eixo `glass`. Nenhuma peça de vidro é clicável: no `Tabs` quem
         * recebe o clique é o gatilho e no alternador é a raiz; o polegar é superfície e fica
         * atrás dela.
         */
        const COM_MODO = [
            "tabs",
        ]

        // 1. A tradução existe, em qualquer das três formas: tabela semântica,
        //    tabela de identidade, ou `--glass-tone` literal — a forma que o
        //    `ColorTile` usava, com cor de runtime que não cabe em tabela
        //    nenhuma.
        for (const nome of COM_MODO) {
            expect(base(nome)).toMatch(/GLASS_TONES|GLASS_IDENTITY_TONES|--glass-tone/)
        }

        // 2. O eixo é eixo: a palavra aparece como prop/variante, e não só como
        //    a classe da utility. Sem isto, "vestir vidro" voltaria a ser algo
        //    que só quem chama sabe fazer.
        for (const nome of COM_MODO) {
            expect(base(nome)).toMatch(/\bglass\??:/)
        }

        // 3. A identidade distingue pessoas e o tom significa estado; ela não entra na tabela
        // semântica.

        // 4. A asserção que prova que a absorção é eixo: onde o eixo dispensa o neutralizador,
        // ele não pode existir (um `bg-transparent` empilhado deixava o `bg-primary-muted` do
        // `Badge` vivo na lista). O `Button` fica de fora, onde o `tertiary` é base de verdade.
        // Neutralizador é o que vem com prefixo de variante ou par `dark:`; `bg-transparent`
        // cru é superfície legítima e `ring-0` só aparece para anular um anel.
        for (const nome of COM_MODO) {
            expect(base(nome)).not.toMatch(/[:\]]bg-transparent|dark:bg-transparent|ring-0\b/)
        }

        // 5. A peça separada não volta pela porta dos fundos: o vidro é a `@utility glass` com
        // a régua de `lib/glass-classes.ts`, e nenhum `glass-*.tsx` existe em `ui/`.
        const sobrando = readdirSync(join(process.cwd(), "src/components/ui"))
            .filter((f) => f.startsWith("glass-") && f.endsWith(".tsx"))
        expect(sobrando).toEqual([])
    })

    it("14. o tingimento é opt-in, e o padrão é idêntico ao vidro sem cor", () => {
        // A cor do elemento entra por `--glass-ink`, e não por `--glass-tone` (uma camada com
        // alfa próprio que pinta o corpo). O padrão precisa ser um no-op exato, porque a barra
        // lateral veste a utility sem declarar cor; as duas garantias se checam aqui.
        expect(CLARO).toMatch(/--glass-ink-amount:\s*0%/)

        // **E o no-op é estrutural, não uma consequência da quantidade.** Cada
        // camada lê a tinta com o **próprio neutro como fallback**, então sem
        // tinta a mistura é o neutro consigo mesmo — o neutro em qualquer
        // quantidade. `--glass-ink` não é declarada em tema nenhum: fosse, seria
        // uma cor sem par no `.dark`, e o `ds:catalog` a acusaria com razão.
        expect(CLARO).not.toMatch(/^\s*--glass-ink:/m)
        expect(ESCURO).not.toMatch(/^\s*--glass-ink:/m)
        for (const neutro of ["--glass-rim", "--glass-rim-far", "--glass-cloud"]) {
            expect(RECEITA_CODIGO).toContain(`var(--glass-ink, var(${neutro}))`)
        }
    })

    it("15. tinge o aro e as nuvens, e nada além deles", () => {
        // O escopo é decisão: dentro, os dois extremos do aro e as duas nuvens; fora, o vale do
        // bisel (`--glass-rim-shade`, sem matiz que se enxergue) e o realce de cursor
        // (`--glass-sheen`, cor da fonte de luz).
        const camada = (de: string, ate?: string) => {
            const i = RECEITA_CODIGO.indexOf(de)
            const f = ate ? RECEITA_CODIGO.indexOf(ate) : RECEITA_CODIGO.length
            return RECEITA_CODIGO.slice(i, f)
        }
        const nuvens = camada("radial-gradient", "var(--glass-rim-angle)")
        const aro = camada("var(--glass-rim-angle)")

        // `var\(--glass-ink[,)]` e não `var\(--glass-ink\)`: a tinta é lida com
        // o próprio neutro como fallback, então a forma tem vírgula.
        const tintas = (b: string) => (b.match(/var\(--glass-ink[,)]/g) ?? []).length

        for (const bloco of [nuvens, aro]) {
            expect(tintas(bloco)).toBeGreaterThan(0)
            expect(bloco).toContain("var(--glass-ink-amount)")
        }

        // As duas nuvens tingem, não só uma.
        expect(tintas(nuvens)).toBe(2)
        // Os dois extremos do aro tingem — o pico e o `100%`.
        expect(tintas(aro)).toBe(2)

        // E o vale não: ele aparece duas vezes no aro, sempre cru.
        for (const trecho of aro.split("var(--glass-rim-shade)").slice(1)) {
            expect(trecho.trimStart().startsWith("color-mix")).toBe(false)
        }
        // O realce de estado nunca vê a tinta.
        const realce = camada("var(--glass-sheen", "var(--glass-tone")
        expect(realce).not.toContain("--glass-ink")
    })

    it("10. a régua não monta nome de classe em tempo de execução", () => {
        // O Tailwind varre o código como texto: uma classe interpolada fica no elemento e a
        // regra não existe, sem erro.
        esperarSemClasseMontada(semComentariosDe("src/lib/glass-classes.ts"))

        const sidebar = lerFonte("src/components/ui/sidebar.tsx")
        // A `Sidebar` flutuante é placa chapada e não pode voltar a vestir o vidro.
        expect(sidebar).not.toContain("group-data-[variant=floating]:glass")
    })

    it("27. a barra é a terceira régua, e na fileira só a que se sustenta sozinha", () => {
        // As três superfícies de vidro da casa divergem de propósito: a
        // flutuante é `--popover` e abre só no escuro, a modal é `--background`
        // a 40%, e a barra é `--background` a 60% **nos dois temas** — porque
        // uma barra tem conteúdo real passando por baixo em qualquer tema. Por
        // isso ela não cabe na asserção 23, que exige o `dark:`.
        const barra = semComentariosDe("src/lib/glass-classes.ts")
        const i = barra.indexOf("barSurfaceClassName = [")
        const receita = barra.slice(i, barra.indexOf("].join(", i))

        expect(receita, "sem material").toContain("glass-surface")
        // Ancorado na classe: o variante `supports-backdrop-filter:` contém a
        // string `backdrop-filter` de propósito.
        expect(receita, "borrão próprio").not.toMatch(/\bbackdrop-blur/)
        expect(receita, "sem guarda").toContain("reduced-transparency:bg-background")
        expect(receita, "token errado").not.toMatch(/bg-popover/)

        // Opaca de base, aberta só onde o borrão existe. A lookbehind é
        // necessária: sem ela `supports-backdrop-filter:bg-background/60`
        // casaria como se fosse a base.
        const base = Number(receita.match(/(?<!:)bg-background\/(\d+)/)?.[1])
        const aberta = Number(
            receita.match(/supports-backdrop-filter:bg-background\/(\d+)/)?.[1]
        )
        expect(base, "alfa base").toBeGreaterThan(0)
        expect(aberta, "alfa aberto").toBeGreaterThan(0)
        expect(aberta).toBeLessThan(base)
        expect(receita, "a barra não é de tema").not.toMatch(
            /supports-backdrop-filter:dark:/
        )

        // Os dois consumidores (o `TopBar` do catálogo e o do app) impedem a cópia à mão do
        // cabeçalho de voltar e não escrevem borrão próprio.
        const topo = semComentariosDe("src/components/ui/top-bar.tsx")
        const menubar = semComentariosDe("src/components/ui/menubar.tsx")
        expect(topo, "o cabeçalho não veste a régua").toContain("barSurfaceClassName")
        expect(topo, "o cabeçalho escreve borrão próprio").not.toMatch(/\bbackdrop-blur/)
        for (const casca of [
            "src/app/designsystem/ds-shell.tsx",
            "src/components/layout/app-header.tsx",
        ]) {
            const fonte = semComentariosDe(casca)
            expect(fonte, `${casca} não veste o TopBar`).toContain("<TopBar")
            expect(fonte, `${casca} escreve borrão próprio`).not.toMatch(/\bbackdrop-blur/)
            expect(fonte, `a cópia da régua voltou em ${casca}`).not.toContain(
                "bg-background/95 glass-surface"
            )
        }
        expect(menubar, "a fileira não veste a régua").toContain("barSurfaceClassName")
        expect(menubar, "a fileira escreve borrão próprio").not.toMatch(/\bbackdrop-blur/)

        // Uma variante só. `solid` a 60% cai de rgb 38 para 27 sobre a página e
        // deixa de ler como bandeja; `plain` mora dentro de um cabeçalho que já
        // tem o vidro.
        const cva = menubar.slice(
            menubar.indexOf("const menubarVariants"),
            menubar.indexOf("const menubarTriggerVariants")
        )
        expect(cva.length, "o cva da fileira não foi achado").toBeGreaterThan(0)
        expect(cva, "a outline perdeu a régua").toMatch(
            /outline:\s*`[^`]*\$\{barSurfaceClassName\}/
        )
        expect(
            cva.match(/barSurfaceClassName/g) ?? [],
            "mais de uma variante veste a régua"
        ).toHaveLength(1)
        expect(cva, "solid perdeu a bandeja").toMatch(/solid:\s*"[^"]*bg-muted/)
        expect(cva, "plain deixou de ser transparente").toMatch(
            /plain:\s*"[^"]*bg-transparent/
        )
    })

    it("28. a folha carrega a própria área segura, e o quarto chrome não volta", () => {
        // A área segura é da superfície: com a classe importada pelas telas, 19 folhas a tinham
        // e 7 punham o botão de salvar sob a barra de gestos. O ramo gaveta do `SheetContent` é
        // o `DrawerContent`, com a área segura dele.
        const folha = semComentariosDe("src/components/ui/sheet.tsx")
        expect(folha, "o ramo gaveta da folha não é o DrawerContent").toMatch(
            /if \(surface === "drawer"\) \{[\s\S]*?<DrawerContent\b/
        )
        const gaveta = semComentariosDe("src/components/ui/drawer.tsx")
        expect(gaveta, "a gaveta não dá área segura").toContain(
            "data-[vaul-drawer-direction=bottom]:pb-(--drawer-safe)"
        )
        // `[^)]*` não serve: o `)` de `--spacing(6)` vem antes do `env(`.
        expect(gaveta, "a fórmula do env() não está aqui").toMatch(
            /--drawer-safe:calc\([\s\S]*?env\(safe-area-inset-bottom/
        )

        // O chrome de folha não volta: quem o substituiu é a cromagem do `Dialog`, a regra da
        // casa.
        const arquivos = readdirSync("src/components/ui")
        expect(
            arquivos.filter((f) => f.startsWith("mobile-sheet-form-chrome")),
            "o quarto chrome voltou"
        ).toEqual([])
    })
})
describe("o borrão chega ao Chrome", () => {
    it("o -webkit-backdrop-filter vem antes do backdrop-filter", () => {
        // O Turbopack (lightningcss) junta as duas declarações numa só e fica com a última:
        // com o prefixo por último, o Chrome (que não lê o prefixo) ficava sem vidro.
        const codigo = semComentarios(CSS)
        expect(codigo).not.toMatch(/(^|[\s;{])backdrop-filter\s*:[^;]*;\s*-webkit-backdrop-filter\s*:/)
    })
})
