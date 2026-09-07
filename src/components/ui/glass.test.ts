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

/** Só o corpo da receita, sem o preset e sem o vizinho. */
const RECEITA = CSS.slice(
    CSS.indexOf("@utility glass {"),
    CSS.indexOf("@utility glass-control")
)

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

    it("7. sem máscara, sem blur, sem blend", () => {
        // `mask-image: none` num composite apaga o elemento, e a ordem de
        // emissão das duas propriedades de composite não se controla pelo
        // Tailwind — daí `padding-box`/`border-box`, que não precisa de máscara.
        // O blur fica de fora porque a premissa desta receita é que **não há
        // conteúdo atrás**: borrar cor chapada não desenha nada.
        expect(RECEITA).toContain("padding-box")
        expect(RECEITA).toContain("border-box")
        expect(RECEITA).not.toMatch(/mask-composite|-webkit-mask|mask-image/)
        expect(RECEITA).not.toMatch(/backdrop-filter|backdrop-blur/)
        expect(RECEITA).not.toMatch(/soft-light|background-blend-mode/)
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
})
