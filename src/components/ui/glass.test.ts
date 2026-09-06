import { readFileSync } from "node:fs"
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
        expect(RECEITA_CODIGO).not.toMatch(/color-mix[^)]*--glass-rim/)

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

    it("13. as quatro peças traduzem cor, e não são só o átomo com uma classe", () => {
        // É a asserção que as separa de `<Glass asChild><Base /></Glass>`, que
        // compila e sai **sem cor nenhuma** porque o shorthand apaga o
        // `background-color`.
        //
        // Ela existe porque este projeto já absorveu duas especializações que
        // eram o átomo com outro nome — `MoneyInput` virou `<Input money>` e
        // `KbdShortcut` virou `<Kbd keys>`. A pergunta é sempre "componente ou
        // modo?", e a resposta aqui é componente **enquanto** houver tradução.
        // **Sem comentários.** Os doc-comments destas peças explicam a tradução
        // e citam `--glass-tone` por extenso; varrer o texto cru testaria o
        // comentário e não o código. Verificado: com a tradução removida do
        // `GlassButton`, a versão que lia o texto cru **passava**.
        const peca = (nome: string) =>
            readFileSync(join(process.cwd(), `src/components/ui/glass-${nome}.tsx`), "utf8")
                .replace(/\/\*[\s\S]*?\*\//g, " ")
                .replace(/(^|[^:])\/\/.*$/gm, "$1")

        // O que se exige é a **tradução**, não a forma dela. Três compõem uma
        // tabela da régua; a `GlassCheckbox` escreve o tom inline, porque ele
        // vive sob `data-[state=checked]:` e um prefixo montado em tempo de
        // execução não chegaria ao CSS — a regra da casa.
        for (const nome of ["button", "badge", "avatar", "checkbox"]) {
            expect(peca(nome)).toMatch(/GLASS_TONES|GLASS_IDENTITY_TONES|--glass-tone/)
        }
        // E a identidade não entra na tabela semântica: identidade distingue
        // pessoas, tom significa estado, e a régua separa as duas famílias.
        expect(peca("avatar")).toContain("GLASS_IDENTITY_TONES")
        expect(peca("avatar")).not.toContain("GLASS_TONES")

        // E nenhuma delas pode manter uma `bg-*` de estado viva: sobre vidro ela
        // pinta **atrás** das camadas e o realce morre calado.
        for (const nome of ["button", "badge", "checkbox"]) {
            const fonte = peca(nome).replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1")
            for (const [, classe] of fonte.matchAll(/"([^"]*(?:hover|active|data-\[state=checked\]):bg-[^"]*)"/g)) {
                expect(classe).toMatch(/:bg-transparent/)
            }
        }
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
