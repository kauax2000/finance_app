import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * As invariantes do vidro.
 *
 * Elas moravam em `sidebar-ladder.test.ts` enquanto a receita era da barra. Com
 * a extração, o que é do **vidro** vem para cá e o que é da **barra** fica lá —
 * a de lá continua trancando que a placa flutuante veste a peça.
 *
 * Cada asserção aqui saiu de um defeito medido nas rodadas 36 a 39, e o
 * comentário de cada uma diz qual.
 */

const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")

/**
 * Só o corpo da receita.
 *
 * O corte ia até `@utility glass-control` e **engolia o doc-comment inteiro do
 * vizinho** — 17 linhas de prosa que a asserção 7 varria como se fossem código.
 * Hoje ele para no próximo doc-comment de topo; os comentários internos da
 * receita são indentados, então `\n/**` não casa com nenhum deles.
 */
const RECEITA = CSS.slice(
    CSS.indexOf("@utility glass {"),
    CSS.indexOf("\n/**", CSS.indexOf("@utility glass {"))
)

/**
 * Os blocos de tema **de verdade**.
 *
 * `CLARO` e `ESCURO` são fatias abertas — a segunda vai de `.dark {` até o fim
 * do arquivo e engole todas as `@utility`. Serve para procurar a declaração de
 * um token, não para provar que ele **não** é declarado num tema: o preset
 * redondo publica `--glass-rim-image`, e a busca aberta o encontraria ali.
 */
const bloco = (abre: string) => {
    const i = CSS.indexOf(abre)
    return CSS.slice(i, CSS.indexOf("\n}", i))
}
const TEMA_CLARO = bloco(":root {")
const TEMA_ESCURO = bloco(".dark {")

/** O preset da peça redonda. */
const REDONDO = CSS.slice(
    CSS.indexOf("@utility glass-round {"),
    CSS.indexOf("@utility glass-material {")
).replace(/\/\*[\s\S]*?\*\//g, " ")

/** A superfície das peças que flutuam — menus, seletor, popover, prévia. */
/** Lê um arquivo do repositório sem comentários — o corte que a 26 já usava. */
const semComentariosDe = (caminho: string) =>
    readFileSync(join(process.cwd(), caminho), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/(^|[^:])\/\/.*$/gm, "$1")

const SUPERFICIE_FLUTUANTE = readFileSync(
    join(process.cwd(), "src/lib/menu-classes.ts"),
    "utf8"
).replace(/\/\*[\s\S]*?\*\//g, " ")

/** O modo material, e os dois degraus fora do meio. */
const MATERIAL = CSS.slice(
    CSS.indexOf("@utility glass-material {"),
    CSS.indexOf("@utility no-scrollbar")
).replace(/\/\*[\s\S]*?\*\//g, " ")

/**
 * A receita **sem comentários**.
 *
 * Ela cita de propósito o que deixou de fazer — o `color-mix(--glass-rim 45%)`
 * que o extremo do aro era antes de virar token. Uma asserção que varre o texto
 * cru testa o comentário e não o código, e este projeto já pagou essa medição
 * na rodada do gráfico.
 */
const RECEITA_CODIGO = RECEITA.replace(/\/\*[\s\S]*?\*\//g, " ")

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
        // Houve uma versão com um radial de `105%` cobrindo a placa toda,
        // chegando a **rgb 62** no topo. Ela lia como degradê de fundo dos anos
        // 2000 — forte demais, branca demais, com o eixo à vista. O que importa
        // não é a família da curva, é a **escala**: luz que ocupa a peça inteira
        // é fundo, não é luz.
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

    it("7. a receita base nunca borra; o material sempre", () => {
        // `mask-image: none` num composite apaga o elemento, e a ordem de
        // emissão das duas propriedades de composite não se controla pelo
        // Tailwind — daí `padding-box`/`border-box`, que não precisa de máscara.
        expect(RECEITA).toContain("padding-box")
        expect(RECEITA).toContain("border-box")
        expect(RECEITA).not.toMatch(/mask-composite|-webkit-mask|mask-image/)
        expect(RECEITA).not.toMatch(/soft-light|background-blend-mode/)

        // **A varredura é no código, não no texto cru.** Esta asserção lia
        // `RECEITA` com os comentários dentro: um comentário que apenas
        // *mencionasse* `backdrop-filter` já a reprovava, sem mudança nenhuma
        // de código. É a lição que a rodada do gráfico registrou.
        expect(RECEITA_CODIGO).not.toMatch(/backdrop-filter|backdrop-blur/)

        // E o outro lado da régua: o modo material borra, e é o que ele é.
        expect(MATERIAL).toMatch(/backdrop-filter:\s*blur\(/)
        expect(MATERIAL).toMatch(/-webkit-backdrop-filter:\s*blur\(/)
        expect(MATERIAL).not.toMatch(/mask-composite|-webkit-mask|mask-image/)
        expect(MATERIAL).not.toMatch(/soft-light|background-blend-mode/)
    })

    it("20. o aro e o realce são contrato, e sem produtor nada muda", () => {
        // As duas camadas viraram `var(--x, <o valor de hoje>)`. O fallback é o
        // que garante que o painel e o `ColorTile` não se mexem — medido no
        // navegador: as duas superfícies saem byte a byte iguais às de antes.
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

    it("21. o redondo é preset de imagem, e o cônico só existe nele", () => {
        // Mesmo guarda do `glass-control`: preset move a variável, nunca a
        // propriedade. Duas utilities escrevendo `background` seriam decididas
        // pela ordem de emissão do Tailwind.
        expect(REDONDO).not.toMatch(/^\s*background:/m)
        expect(REDONDO).toContain("--glass-rim-image:")
        expect(REDONDO).toContain("--glass-sheen-image:")

        // **O cônico não pode vazar para o `glass-control`.** Ele serve o
        // `ColorTile`, que é `rounded-md`: um bisel polar num quadrado
        // arredondado põe as transições nos cantos errados.
        // Cortada no **próprio** fechamento: entre `glass-control` e
        // `no-scrollbar` moram o `glass-round` e o `glass-material`, e uma
        // fatia até o vizinho seguinte engoliria os dois.
        const controle = CSS.slice(
            CSS.indexOf("@utility glass-control {"),
            CSS.indexOf("\n}", CSS.indexOf("@utility glass-control {"))
        )
        expect(controle).not.toContain("conic-gradient")
        expect(RECEITA_CODIGO).not.toContain("conic-gradient")
        expect(REDONDO).toContain("conic-gradient")
    })

    it("22. o bisel polar cobre o perímetro, e o pico não cai fora dele", () => {
        // O defeito que este preset existe para consertar: num círculo, as
        // pontas do gradiente **linear** caem nos cantos da caixa — medido, 0%
        // do perímetro via o pico e 57,5% via só o vale. Num cônico cada ponto
        // do perímetro mapeia para um ângulo, então não há canto a perder — mas
        // só se as paradas forem angulares e fecharem o ciclo.
        const conico = REDONDO.slice(REDONDO.indexOf("conic-gradient"))
        // O `from -45deg` é a **origem**, não uma parada — sem tirá-lo, o 45
        // entra na lista e a checagem de ciclo lê o número errado.
        const semOrigem = conico.slice(conico.indexOf("deg,") + 4)
        const paradas = [...semOrigem.matchAll(/(\d+)deg\s*[,)]/g)].map((m) => Number(m[1]))
        expect(paradas.length).toBeGreaterThanOrEqual(5)

        // Nenhuma parada em porcentagem: num cônico isso mede o **raio**, não o
        // arco, e o bisel deixaria de acompanhar a borda.
        const corpo = conico.slice(conico.indexOf("("), conico.indexOf("\n  );"))
        expect(corpo).not.toMatch(/\d+%\s*[,)]/)

        // O ciclo fecha: a primeira e a última parada valem o mesmo tom, senão
        // sobra uma emenda dura no ponto onde 360° encontra 0°.
        expect(paradas[0]).toBe(0)
        expect(paradas[paradas.length - 1]).toBe(360)
        expect(conico).toContain("from -45deg")

        // E o preset precisa **chegar** na peça redonda. Sem isto, tirar
        // `glass-round` da régua devolve o avatar ao aro linear — o defeito que
        // esta rodada conserta — e nenhuma outra asserção percebe.
        const regua = readFileSync(
            join(process.cwd(), "src/lib/glass-classes.ts"),
            "utf8"
        ).replace(/\/\*[\s\S]*?\*\//g, " ")
        expect(regua).toMatch(/glassRoundSurfaceClassName\s*=\s*"[^"]*\bglass-round\b/)

        // O `Avatar` o veste **por forma**: num `shape="rounded"` os cantos
        // existem e o aro linear continua certo.
        const avatar = readFileSync(
            join(process.cwd(), "src/components/ui/avatar.tsx"),
            "utf8"
        ).replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1")
        expect(avatar).toContain("glassRoundSurfaceClassName")
        expect(avatar).toMatch(/=== "circle"/)
    })

    it("23. as duas réguas vestem o mesmo material do iOS, cada uma no seu token", () => {
        // Uma superfície elevada tem conteúdo passando por baixo — é o lado do
        // `backdrop-filter` da régua dos dois vidros, e o material é o do
        // cabeçalho. **Os tokens são dois, e a tela decidiu**: a modal chegou a
        // ser `--popover` para igualar o DatePicker, e a 60% sobre a página
        // velada ela compôs acima de tudo atrás e leu como opaca. `--background`
        // afunda no véu, e é o borrão que a distingue.
        for (const [nome, regua, ancora, token] of [
            ["flutuante", SUPERFICIE_FLUTUANTE, "menuPanelSurfaceClassName", "popover"],
            ["modal", semComentariosDe("src/lib/modal-classes.ts"), "modalSurfaceClassName", "background"],
        ] as const) {
            const i = regua.indexOf(ancora)
            expect(i, `${nome}: régua não achada`).toBeGreaterThan(-1)
            const receita = regua.slice(i, regua.indexOf("].join(", i))
            expect(receita, `${nome}: sem material`).toContain("glass-surface")
            // Ancorado na classe de borrão: o variante `supports-backdrop-filter:`
            // contém a string `backdrop-filter` de propósito.
            expect(receita, `${nome}: borrão próprio`).not.toMatch(/\bbackdrop-blur/)
            expect(receita, `${nome}: sem guarda`).toContain(`reduced-transparency:bg-${token}`)
            expect(receita, `${nome}: token errado`).not.toMatch(new RegExp(`bg-${token === "popover" ? "background" : "popover"}`))
            // O escuro abre mais, e só onde o borrão existe.
            const base = Number(receita.match(new RegExp(`(?<!dark:)bg-${token}/(\\d+)`))?.[1])
            const escuro = Number(receita.match(new RegExp(`supports-backdrop-filter:dark:bg-${token}/(\\d+)`))?.[1])
            expect(base, `${nome}: alfa base`).toBeGreaterThan(0)
            expect(escuro, `${nome}: alfa do escuro`).toBeGreaterThan(0)
            expect(escuro).toBeLessThan(base)
        }
    })

    it("24. uma placa por superfície — o Command hospedado não pinta", () => {
        // Duas placas a 60% empilhadas dão 84%: o Combobox (popover + `Command`)
        // saía mais claro que o DatePicker (o mesmo popover, uma placa). Era o
        // que lia como "fundo quebrado" — o tom, não o material. Quem hospeda
        // pinta; o `Command` só pinta na variante `panel`, solto numa página.
        const paleta = semComentariosDe("src/components/ui/command.tsx")
        const cva = paleta.slice(paleta.indexOf("const commandVariants"), paleta.indexOf("defaultVariants", paleta.indexOf("const commandVariants")))
        const base = cva.slice(0, cva.indexOf("variants:"))
        expect(base, "a base do Command pinta").not.toContain("menuPanelSurfaceClassName")
        expect(base, "a base do Command tem tinta").not.toMatch(/\bbg-popover/)
        expect(cva, "a variante panel perdeu a placa").toMatch(/panel:\s*menuPanelSurfaceClassName/)
        // E o casco do `CommandDialog` pinta — sem neutralizador nenhum. (O
        // `bg-transparent` do campo de busca, mais abaixo, é outro elemento.)
        const dialogo = paleta.slice(paleta.indexOf("function CommandDialog"), paleta.indexOf("function CommandInput"))
        expect(dialogo.length, "bloco do CommandDialog não achado").toBeGreaterThan(0)
        expect(dialogo).not.toMatch(/\bbg-transparent\b/)
        // E pinta o tom do popover, nos três estados da régua — a paleta é uma
        // superfície de comandos, não um diálogo.
        expect(dialogo).toContain("bg-popover/85 supports-backdrop-filter:dark:bg-popover/60 reduced-transparency:bg-popover")
        expect(paleta).not.toContain("supports-backdrop-filter:dark:bg-transparent")
        expect(paleta).not.toContain("reduced-transparency:bg-transparent")
    })

    it("25. a receita é uma só — as cópias à mão não voltam", () => {
        // Ela esteve escrita em **cinco** lugares: a régua e cópias em `Select`,
        // `Popover`, `HoverCard` e `Tooltip`, com o doc da régua afirmando ter
        // extraído as quatro. A do `Tooltip` ainda divergia — `rounded-md` e
        // `border` contra o `rounded-lg` e o `ring` de todas as outras.
        for (const nome of ["select", "popover", "hover-card", "command", "tooltip"] as const) {
            const src = semComentariosDe(`src/components/ui/${nome}.tsx`)
            expect(src, `${nome} precisa vestir a régua`).toContain("menuPanelSurfaceClassName")
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
        // O `Sheet` traz os dois ramos no mesmo arquivo desde a rodada 64: a
        // placa do painel mora no `cva` e a da gaveta no ramo do `vaul`.
        for (const nome of ["dialog", "sheet", "drawer"] as const) {
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

    it("16. o material é preset de variável, e nunca uma segunda propriedade", () => {
        // A `glass` escreve `background`; o material escreve `backdrop-filter`.
        // Propriedades diferentes não disputam — é o que torna a composição
        // `glass glass-material` segura, e é o mecanismo do `glass-control`.
        expect(MATERIAL).not.toMatch(/^\s*background:/m)
        expect(MATERIAL).not.toMatch(/^\s*background-color:/m)

        // **Só a utility do meio declara `--glass-tint`.** Os degraus movem uma
        // variável intermediária; se cada um escrevesse a lâmina direto, quem
        // venceria seria a ordem de emissão do Tailwind — e os guardas abaixo,
        // que moram na regra do meio, perderiam para o degrau.
        const meio = MATERIAL.slice(0, MATERIAL.indexOf("@utility glass-material-"))
        const degraus = MATERIAL.slice(MATERIAL.indexOf("@utility glass-material-"))
        expect(meio).toContain("--glass-tint: var(--glass-material-step,")
        expect(degraus).not.toMatch(/--glass-tint:/)
        expect(degraus.match(/--glass-material-step:/g) ?? []).toHaveLength(2)
    })

    it("17. um raio e uma vibrância para a casa", () => {
        // O material do vidro e o da superfície leem as **mesmas** variáveis.
        // Dois números escritos em dois lugares divergem no dia em que um mudar.
        for (const tok of ["--glass-surface-blur", "--glass-surface-sat"]) {
            expect(MATERIAL, tok).toContain(`var(${tok}`)
        }
        const superficie = CSS.slice(CSS.indexOf("@utility glass-surface {"))
        const daCasa = superficie.match(/--glass-surface-sat,\s*([\d.]+)/)?.[1]
        const meu = MATERIAL.match(/--glass-surface-sat,\s*([\d.]+)/)?.[1]
        expect(daCasa).toBeDefined()
        expect(meu).toBe(daCasa)
    })

    it("18. os dois guardas devolvem o pintado", () => {
        // Sem borrão, uma lâmina aberta é só uma superfície fraca. `inherit`
        // numa custom property devolve o valor computado do pai — o token do
        // tema, que é exatamente o pintado.
        for (const guarda of [
            /@media \(prefers-reduced-transparency: reduce\)/,
            /@supports not \(backdrop-filter: blur\(1px\)\)/,
        ]) {
            const i = MATERIAL.search(guarda)
            expect(i, String(guarda)).toBeGreaterThan(-1)
            const bloco = MATERIAL.slice(i, MATERIAL.indexOf("}", i))
            expect(bloco, String(guarda)).toContain("--glass-tint: inherit")
            expect(bloco, String(guarda)).toContain("--glass-cloud: inherit")
        }
        // E o de transparência reduzida tira o borrão junto.
        const reduce = MATERIAL.slice(MATERIAL.search(/prefers-reduced-transparency/))
        expect(reduce.slice(0, reduce.indexOf("}"))).toContain("backdrop-filter: none")
    })

    it("19. os três degraus existem, se distinguem, e as nuvens saem", () => {
        const alfa = (bloco: string, nome: string) =>
            Number(
                bloco.match(
                    new RegExp(`--glass-material-${nome}:\\s*oklch\\([^)]*?/\\s*([\\d.]+)%`)
                )?.[1]
            )
        for (const tema of [CLARO, ESCURO]) {
            const [fino, medio, grosso] = ["thin", "regular", "thick"].map((n) =>
                alfa(tema, n)
            )
            expect(fino).toBeGreaterThan(0)
            // Mais fino deixa passar mais: a lâmina abre.
            expect(fino).toBeLessThan(medio)
            expect(medio).toBeLessThan(grosso)
            // E nenhum chega ao pintado, senão o degrau não seria material.
            const pintado = Number(
                tema.match(/--glass-tint:\s*oklch\([^)]*?\/\s*([\d.]+)%/)?.[1]
            )
            expect(grosso).toBeLessThan(pintado)
        }
        // As nuvens simulam luz atrás de uma placa sem nada atrás; com conteúdo
        // real e borrado ali, o simulacro disputa com a coisa.
        expect(MATERIAL).toContain("--glass-cloud: transparent")
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
        // A receita nasceu como `sidebar-glass` com cinco tokens `--sidebar-*`.
        // Manter os dois nomes seria a mesma "duas receitas para a mesma borda"
        // que a rodada 36 removeu — e é a família "sobreviveu à remoção" que
        // este projeto já pagou cinco vezes.
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
        // **O que faz um vidro brilhar não é o realce sozinho: é o par.** O
        // extremo `100%` do aro já foi derivado do pico
        // (`color-mix(--glass-rim 45%, transparent)`), o que vale enquanto os
        // dois extremos são da mesma natureza — no escuro os dois são luz.
        //
        // No claro **não são**: ali o pico é sombra, e derivado o outro extremo
        // só podia ser uma sombra mais fraca. Medido: os quatro cantos saíam em
        // 210, 232, 232 e 235 contra uma placa de 255 — todos **abaixo** dela.
        // Isso é um contorno, não um bisel; a peça não tinha lado aceso.
        //
        // Com o token próprio: 205 na sombra contra **255** no realce, e a placa
        // cedeu para 252 para o realce ter onde existir. Amplitude 50, contra 25.
        expect(RECEITA).toContain("var(--glass-rim-far)")

        // A proibição é **derivar um extremo do outro na declaração do token**,
        // que é onde o defeito morava. Ela ficava escrita contra a receita
        // (`RECEITA_CODIGO.not.toMatch(/color-mix[^)]*--glass-rim/)`) e passou a
        // valer nada quando a receita ganhou o `color-mix` do tingimento: o
        // `[^)]*` não atravessa o `)` de `var(--glass-ink)`, então ela seguia
        // verde por acidente. Agora ela olha os blocos de tema.
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
        // **A ordem é o mecanismo.** As nuvens ficam abaixo da lâmina de
        // propósito — é a atenuação por 82% de preto que as faz ler como
        // estando *atrás*. O tom é o oposto: ele é a cor do próprio material, e
        // abaixo da lâmina seria esmagado para quase nada.
        //
        // E o realce fica acima do tom, senão ele mudaria de força conforme a
        // cor da peça.
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

        // **O aro e as nuvens não tingem.** Vidro colorido tinge o corpo; o
        // reflexo da aresta é a luz do ambiente, não a cor do material — um aro
        // verde faria a peça ler como plástico pintado.
        const aro = RECEITA_CODIGO.slice(RECEITA_CODIGO.indexOf("var(--glass-rim-angle)"))
        expect(aro).not.toContain("--glass-tone")
        const nuvens = RECEITA_CODIGO.slice(nuvem, RECEITA_CODIGO.indexOf("var(--glass-rim-angle)"))
        expect(nuvens).not.toContain("--glass-tone")
    })

    it("13. os dois átomos traduzem cor, e o eixo é eixo — não embrulho mudado de lugar", () => {
        // Houve cinco peças separadas — `GlassButton`, `GlassBadge`,
        // `GlassAvatar`, `GlassCheckbox`, `GlassColorTile` —, cada uma
        // importando **um** átomo e renderizando **um** elemento. Foram
        // absorvidas como o eixo `glass`, pela terceira vez que este projeto faz
        // isso: `MoneyInput` virou `<Input money>` e `KbdShortcut` virou
        // `<Kbd keys>`.
        //
        // A régua que sobrou: o que decide "componente ou modo?" **não é haver
        // tradução** — é a tradução precisar de uma peça para existir.
        //
        // **Sem comentários.** Os doc-comments destes arquivos explicam a
        // tradução e citam `--glass-tone` por extenso; varrer o texto cru
        // testaria o comentário e não o código. Verificado: com a tradução
        // removida do `Button`, a versão que lia o texto cru **passava**.
        const base = (nome: string) =>
            readFileSync(join(process.cwd(), `src/components/ui/${nome}.tsx`), "utf8")
                .replace(/\/\*[\s\S]*?\*\//g, " ")
                .replace(/(^|[^:])\/\/.*$/gm, "$1")

        const ATOMOS = ["avatar", "color-tile"]

        // 1. A tradução existe, em qualquer das três formas: tabela semântica,
        //    tabela de identidade, ou `--glass-tone` literal (o `Checkbox`, sob
        //    `data-[state=checked]:`, e o `ColorTile`, cuja cor é de runtime e
        //    por isso não cabe em tabela nenhuma).
        for (const nome of ATOMOS) {
            expect(base(nome)).toMatch(/GLASS_TONES|GLASS_IDENTITY_TONES|--glass-tone/)
        }

        // 2. O eixo é eixo: a palavra aparece como prop/variante, e não só como
        //    a classe da utility. Sem isto, "vestir vidro" voltaria a ser algo
        //    que só quem chama sabe fazer.
        for (const nome of ATOMOS) {
            expect(base(nome)).toMatch(/\bglass\??:/)
        }

        // 3. A identidade não entra na tabela semântica: identidade distingue
        //    pessoas, tom significa estado, e a régua separa as duas famílias.
        expect(base("avatar")).toContain("GLASS_IDENTITY_TONES")
        expect(base("avatar")).not.toContain("GLASS_TONES")

        // 4. **A asserção que prova que a absorção é eixo.** Onde o eixo
        //    dispensa o neutralizador, ele não pode existir: nestes quatro, a
        //    superfície que o vidro apagaria simplesmente não é escrita no ramo
        //    de vidro. Como embrulho, os quatro empilhavam `bg-transparent` — e
        //    o `Badge` deixava o `bg-primary-muted` da linha `soft` **vivo na
        //    lista**, perdendo calado para o shorthand `background`.
        //
        //    O `Button` fica de fora, e o motivo é escrito: ali o `tertiary` é
        //    base de verdade, e os seis neutralizadores dele são reais.
        //
        //    O que se proíbe é o **neutralizador**, e não a palavra: um
        //    `bg-transparent` cru é superfície legítima — é o que o `outline` do
        //    `Badge` declara. Neutralizador é o que vem com prefixo de variante
        //    (`hover:`, `data-[state=checked]:`) ou com par `dark:`, porque
        //    ele existe para desfazer uma classe que outra regra emitiu. E
        //    `ring-0` só aparece para anular um anel.
        for (const nome of ATOMOS) {
            expect(base(nome)).not.toMatch(/[:\]]bg-transparent|dark:bg-transparent|ring-0\b/)
        }

        // 5. E a peça separada não volta pela porta dos fundos. `glass.tsx` é a
        //    superfície; qualquer outro `glass-*.tsx` em `ui/` é a forma que
        //    esta rodada enterrou.
        const sobrando = readdirSync(join(process.cwd(), "src/components/ui"))
            .filter((f) => f.startsWith("glass-") && f.endsWith(".tsx"))
        expect(sobrando).toEqual([])
    })

    it("14. o tingimento é opt-in, e o padrão é idêntico ao vidro sem cor", () => {
        // A cor do elemento entra por `--glass-ink`, e **não** por
        // `--glass-tone`: o tom é uma camada com alfa próprio que pinta o
        // corpo, a tinta é só um matiz de onde o aro e as nuvens puxam. Manter
        // as duas separadas é o que deixa a asserção 12 continuar verdadeira.
        //
        // O padrão precisa ser um no-op **exato**, porque a barra lateral
        // flutuante veste a utility sem declarar cor nenhuma. Duas coisas o
        // garantem, e as duas se checam aqui.
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
        // O escopo é decisão, e fica trancado em vez de combinado.
        //
        // **Dentro:** os dois extremos do aro e as duas nuvens. **Fora:** o
        // vale do bisel (`--glass-rim-shade`), que a 5% e 10% de alfa não
        // carrega matiz que se enxergue, e o realce de cursor
        // (`--glass-sheen`), que é a cor da **fonte de luz** e não do material.
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
        // O Tailwind varre o código como texto. Uma classe interpolada não chega
        // ao CSS, e o defeito é calado: a classe fica no elemento e a regra não
        // existe. Este projeto já pagou essa medição três vezes — e uma quarta
        // ao escrever esta própria peça.
        const regua = readFileSync(join(process.cwd(), "src/lib/glass-classes.ts"), "utf8")
        const semComentarios = regua
            .replace(/\/\*[\s\S]*?\*\//g, " ")
            .replace(/(^|[^:])\/\/.*$/gm, "$1")
        expect(semComentarios).not.toMatch(/`[^`]*\$\{[^}]*\}[^`]*`/)

        const sidebar = readFileSync(
            join(process.cwd(), "src/components/ui/sidebar.tsx"),
            "utf8"
        )
        expect(sidebar).toContain('"group-data-[variant=floating]:glass"')
    })

    it("27. a barra é a terceira régua, e na fileira só a que se sustenta sozinha", () => {
        // As três superfícies de vidro da casa divergem de propósito: a
        // flutuante é `--popover` e abre só no escuro, a modal é `--background`
        // a 40%, e a barra é `--background` a 60% **nos dois temas** — porque
        // uma barra tem conteúdo real passando por baixo em qualquer tema. Por
        // isso ela não cabe na asserção 23, que exige o `dark:`.
        const barra = semComentariosDe("src/lib/bar-classes.ts")
        const i = barra.indexOf("barSurfaceClassName")
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

        // Os dois consumidores: a extração só é real com dois, e é o que
        // impede a cópia à mão do cabeçalho de voltar.
        const shell = semComentariosDe("src/app/designsystem/ds-shell.tsx")
        const menubar = semComentariosDe("src/components/ui/menubar.tsx")
        expect(shell, "o cabeçalho não veste a régua").toContain("barSurfaceClassName")
        expect(shell, "a cópia do cabeçalho voltou").not.toContain(
            "bg-background/95 glass-surface"
        )
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
        // A área segura é **da superfície**. Até a rodada 60 quem a dava era uma
        // classe que as telas importavam do chrome de folha, e por isso 19
        // folhas a tinham e 7 não — as que não tinham punham o botão de salvar
        // sob a barra de gestos do iPhone. O `DrawerContent` já fazia certo; o
        // ramo gaveta do `SheetContent` passou a fazer também.
        const folha = semComentariosDe("src/components/ui/sheet.tsx")
        const gaveta = folha.slice(
            folha.indexOf('data-surface="drawer"'),
            folha.indexOf("{...props}", folha.indexOf('data-surface="drawer"'))
        )
        expect(gaveta.length, "o ramo gaveta não foi achado").toBeGreaterThan(0)
        expect(gaveta, "a folha não dá área segura").toContain(
            "pb-(--sheet-drawer-safe)"
        )
        // `[^)]*` não serve: o `)` de `--spacing(6)` vem antes do `env(`.
        expect(gaveta, "a fórmula do env() não está aqui").toMatch(
            /--sheet-drawer-safe:calc\([\s\S]*?env\(safe-area-inset-bottom/
        )

        // E o chrome não volta: quem o substituiu é a cromagem do `Dialog`, que
        // é a regra da casa ("a cromagem da folha vem do `Dialog`") — ele era o
        // quarto, e anterior a ela.
        const arquivos = readdirSync("src/components/ui")
        expect(
            arquivos.filter((f) => f.startsWith("mobile-sheet-form-chrome")),
            "o quarto chrome voltou"
        ).toEqual([])
    })
})