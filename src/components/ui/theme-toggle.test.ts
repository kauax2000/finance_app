import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * O alternador de tema, trancado na rodada 116.
 *
 * Ele deixou de ser um `Switch` binário de duas faces e virou um trilho de três
 * paradas — sistema, claro e escuro —, sem vidro, com a viagem orgânica: a
 * cabeça sai na frente, o rastro fica para trás e um pescoço liga os dois.
 *
 * Três coisas quebram calado aqui, e as três estão abaixo:
 *
 * 1. **A fusão é de cor.** Cabeça, rastro e pescoço são o mesmo `bg-background`,
 *    e é só isso que faz as três peças lerem como uma. Um fio ou uma sombra
 *    numa delas desenha exatamente a emenda que a fusão existe para apagar.
 * 2. **A aritmética.** O trilho é 4 de recuo mais três paradas de 28, e a
 *    viagem é `i × 1.75rem`. Mexer num dos dois números sem o outro tira a
 *    cabeça do centro da face, e nada no tipo acusa.
 * 3. **O vidro não volta.** Ele saiu por decisão do dono, e com ele a entrada
 *    em `COM_MODO` de `glass.test.ts` — que é o teste que cobrava o eixo.
 */

const FONTE = readFileSync(
    join(process.cwd(), "src/components/ui/theme-toggle.tsx"),
    "utf8",
)
/** Sem comentários: o cabeçalho deste componente cita por extenso quase tudo
 *  que se quer proibir, e varrer o texto cru testaria o comentário. */
const CODIGO = FONTE.replace(/\/\*[\s\S]*?\*\//g, " ").replace(
    /(^|[^:])\/\/.*$/gm,
    "$1",
)

/** A peça. **Uma** — ver a asserção 4. */
const PECA = "theme-toggle-thumb"

/** O bloco de classes/estilo de uma peça, achado pelo `data-slot`. */
const peca = (slot: string) => {
    const i = CODIGO.indexOf(`data-slot="${slot}"`)
    expect(i, slot).toBeGreaterThan(-1)
    return CODIGO.slice(i, CODIGO.indexOf("/>", i))
}

describe("o trilho de tema", () => {
    it("1. são três paradas, nos três valores que o next-themes entende", () => {
        for (const valor of ["system", "light", "dark"]) {
            expect(CODIGO).toContain(`valor: "${valor}"`)
        }
        // A ordem é decisão do dono (a do menu do macOS), e é ela que o trilho
        // desenha. Trocá-la sem querer inverteria o que cada posição mostra.
        expect(CODIGO.indexOf('valor: "system"')).toBeLessThan(
            CODIGO.indexOf('valor: "light"'),
        )
        expect(CODIGO.indexOf('valor: "light"')).toBeLessThan(
            CODIGO.indexOf('valor: "dark"'),
        )
    })

    it("2. não é um switch: três estados não cabem num booleano", () => {
        expect(CODIGO).toContain("RadioGroupPrimitive.Root")
        expect(CODIGO).not.toMatch(/SwitchPrimitive|role="switch"/)
        // Uma parada de tabulação e as setas passando pelas três vêm do Radix,
        // mas o nome do grupo é nosso — sem ele o leitor anuncia três rádios
        // sem dizer de quê.
        expect(CODIGO).toContain('aria-label="Tema"')
    })

    it("3. a aritmética fecha: 88 = 4 + 3 × 28, e a viagem é o mesmo 28", () => {
        // `w-22` é 88px e `p-0.5` é 2px de cada lado: sobram 84 para três
        // paradas de 28. `size-7` é a peça de 28 que ocupa uma delas.
        expect(CODIGO).toContain("h-8 w-22")
        expect(CODIGO).toContain("p-0.5")
        expect(CODIGO).toMatch(/size-7/)
        // O Skeleton de pré-montagem mede o mesmo, senão a linha do menu salta
        // de largura na hidratação.
        expect(CODIGO).toContain("h-8 w-22 shrink-0 rounded-full")

        // A viagem: 1,75rem é 28px, e o repouso sai da variável da raiz.
        expect(peca(PECA)).toContain("translate-x-[calc(var(--tt-i)*1.75rem)]")
        expect(CODIGO).toContain("const PASSO = 28")
    })

    it("4. é uma peça só — a regressão que o dono nomeou", () => {
        // A primeira versão tinha cabeça, rastro e pescoço, fundidos por serem
        // do mesmo `--background`. Na tela isso lê como **duas bolas
        // transitando**, e não como matéria: a fusão por cor apaga a costura,
        // mas não faz uma forma só.
        expect(CODIGO).not.toContain("theme-toggle-trail")
        expect(CODIGO).not.toContain("theme-toggle-neck")
        // Só um nó com `absolute` dentro do trilho.
        expect(CODIGO.match(/data-slot="theme-toggle-(thumb|trail|neck)"/g)).toEqual([
            'data-slot="theme-toggle-thumb"',
        ])
        // E ela não tem borda: o fio duro é o que denuncia a distorção quando a
        // forma estica, porque o contorno deixa de ser circular.
        expect(peca(PECA)).not.toMatch(/\bborder\b/)
        expect(peca(PECA)).toContain("shadow-sm")
    })

    it("5. o esticão anda em fase com a velocidade, e não contra ela", () => {
        // A curva do trajeto é a da referência, por decisão do dono.
        expect(CODIGO).toContain('easing: "cubic-bezier(1,0,0.4,1)"')

        // **A asserção que importa.** A referência põe o pico do esticão no meio
        // do *seu* relógio (0,44s contra 0,40s de viagem), e com esta curva isso
        // sai anticorrelacionado: medido, aos 30% do caminho a escala estava em
        // 1,33 com a velocidade a **6%** do máximo, e aos 70%, com 68% da
        // velocidade, a escala já tinha caído para 1,04 — a forma esticava
        // **parada** e atravessava contraída.
        //
        // O conserto é os dois relógios serem o mesmo e o pico ficar em 0,58,
        // perto do pico de velocidade da curva (0,667). Devolver relógios
        // diferentes desfaz a fase sem quebrar nada.
        // O relógio da escala passa do trajeto de propósito: 640 contra 400.
        // Os 240 que sobram são o pouso.
        expect(CODIGO).toContain("const ESTICAO = { duration: 640")
        expect(CODIGO).toContain("const TRAJETO = { duration: 400")
        expect(CODIGO).toContain("const PICO_EM = 0.58")
        // `linear` é o que faz cada `offset` do perfil valer a fração de tempo
        // que ele diz — com outra curva, o perfil amostrado sai deslocado.
        expect(CODIGO).toContain('easing: "linear"')
    })

    it("5f. o volume se conserva — esticar em X afina em Y", () => {
        // Sem isto a forma **engorda** em vez de esticar, que é o que separa
        // matéria elástica de uma pílula que cresce. Medido na animação real:
        // no auge a peça vai a 34,1 de largura com 25,2 de altura, e no
        // contragolpe do pouso a 26,5 por 28,7 — a altura em contrafase.
        expect(CODIGO).toContain("const ACOPLAMENTO_Y = 0.45")
        expect(CODIGO).toContain("amplitude * k * ACOPLAMENTO_Y")
    })

    it("5g. a origem vira no cruzamento por zero, e o degrau é de propósito", () => {
        // Enquanto corre, a forma estica a partir da borda de **trás** (para a
        // frente); ao chegar, ela se acomoda a partir da borda da **frente**
        // (para dentro do trilho). É o que libera a amplitude do pouso: presa
        // atrás, ela crescia contra a borda.
        //
        // A troca acontece onde `k` é 0 — escala 1, transformação identidade,
        // origem que não pinta nada —, então é invisível por construção. Os
        // dois quadros a 0,0001 fazem disso um **degrau**: interpolada, a
        // origem deslizaria com a escala fora de 1, e isso se vê.
        // A virada é derivada, e não um número solto: é onde o trajeto acaba
        // na régua da escala. Cravá-la à mão é o jeito de ela sair de fase
        // quando alguém mexer numa das duas durações.
        expect(CODIGO).toContain(
            "const VIRADA = TRAJETO.duration / ESTICAO.duration",
        )
        expect(CODIGO).toContain("[VIRADA, 0, ATRAS]")
        expect(CODIGO).toContain("[VIRADA + 0.0001, 0, FRENTE]")
        expect(CODIGO).toContain("transformOrigin: origem[lado]")
    })

    it("5h. o pouso é um mergulho só — nenhum repique", () => {
        // A primeira versão oscilava três vezes em 160ms (+0,5 · −0,28 · +0,12)
        // e ficava estalada. Hoje é uma compressão que vai e volta em 240ms.
        // Medido na animação real: **uma** travessia da largura de repouso
        // depois da chegada, com o fundo em 26,8 × 28,6.
        const pouso = CODIGO.slice(
            CODIGO.indexOf("[VIRADA + 0.0001"),
            CODIGO.indexOf("[1, 0, FRENTE]"),
        )
        const ks = [...pouso.matchAll(/\[[\d.]+, (-?[\d.]+), FRENTE\]/g)].map((m) =>
            Number(m[1]),
        )
        expect(ks.length).toBeGreaterThan(2)
        // Todos do mesmo lado do zero: um mergulho, não uma oscilação.
        expect(ks.every((k) => k <= 0)).toBe(true)
    })

    it("5d. a amplitude é proporcional à velocidade, e o teto é a borda", () => {
        // As duas viagens duram o mesmo e a longa percorre o dobro: ela corre ao
        // dobro e estica o dobro. 0,11 e 0,22.
        expect(CODIGO).toContain("const AMPLITUDE_POR_SALTO = [0, 0.11, 0.22]")
        // O teto não é gosto: com o pico em 0,58 a borda dianteira da forma
        // chega a 87,7 dos 88px do trilho no salto longo (medido por scrubbing
        // da animação real: largura 28 → 34,2 → 28, dianteira máxima em 84).
        // Em 1,26 ela passa e a peça sai da pílula.
        const amp = Number(
            /AMPLITUDE_POR_SALTO = \[0, [\d.]+, ([\d.]+)\]/.exec(CODIGO)?.[1],
        )
        expect(amp).toBeLessThanOrEqual(0.22)
    })

    it("5b. quem desloca é a WAAPI, e nunca uma transição nem um rAF adiado", () => {
        // O next-themes roda com `disableTransitionOnChange`, que injeta
        // `* { transition: none !important }`. A versão anterior fugia disso
        // aplicando a posição dois `requestAnimationFrame` depois — e quando o
        // rAF não corria no ritmo esperado o `setState` adiado **nunca rodava**
        // e o polegar ficava parado. Medido: clique, 1400ms, cabeça sem sair do
        // lugar e `document.getAnimations()` vazio.
        expect(CODIGO).not.toContain("requestAnimationFrame")
        expect(peca(PECA)).not.toMatch(/transition-|duration-|ease-|delay-/)
        // A animação não pode sobreviver ao próprio trajeto: quem manda no
        // repouso é o `--tt-i` no estilo, e por isso `fill` é "none".
        expect(CODIGO).toContain('fill: "none"')
        // E um salto novo cancela o anterior, senão dois cliques seguidos
        // deixam duas animações disputando a mesma propriedade.
        expect(CODIGO).toContain("a.cancel()")
    })

    it("5e. a origem vira com o sentido — é o mecanismo inteiro do esticão", () => {
        // Com a origem na borda **de trás** e `scaleX > 1`, a forma estica para
        // a *frente*, na direção da viagem. Presa num valor fixo, ela esticaria
        // para trás em metade dos saltos — e nada quebraria, o movimento só
        // ficaria errado. É para isto, e só para isto, que a referência mantém
        // um `data-previous` no trilho.
        expect(CODIGO).toContain('paraDireita ? "0% 50%" : "100% 50%"')
    })

    it("5c. nascer é chegar, não viajar", () => {
        // O gate de montagem leva `indice` de 0 para a parada real, e sem
        // guarda o polegar entra deslizando da esquerda **toda vez que o
        // componente nasce** — no app, a cada abertura do menu da conta, já que
        // o conteúdo de um `DropdownMenu` desmonta ao fechar. Medido depois da
        // guarda: zero animações durante a hidratação.
        expect(CODIGO).toContain("jaPintou")
        expect(CODIGO).toContain("if (!montado) return")
    })

    it("5i. a bandeja é sobreposição, e não tinta chapada", () => {
        // `bg-muted` é opaco: medido, ele pintava **38,38,38** tanto no
        // cabeçalho quanto dentro do painel de um cartão, ignorando o que está
        // atrás. Este controle não vive numa superfície conhecida — barra de
        // vidro, painel de `DropdownMenu`, `Popover` do telefone, cartão —, e
        // chapado ele lê como um bloco estrangeiro colado sobre o preto do app.
        //
        // Com a superfície do campo: **28** sobre a página e **40** sobre o
        // cartão, no escuro. Ela responde ao que está atrás, que é o ponto.
        const raiz = peca("theme-toggle")
        expect(raiz).toContain("bg-input-fill/50")
        expect(raiz).not.toMatch(/bg-muted\b/)
    })

    it("6. o vidro não volta, e a marca não entra", () => {
        expect(FONTE).not.toMatch(/glass/i)
        // O arco-íris foi proposto e recusado na tela: nada de contorno de
        // marca aqui.
        expect(FONTE).not.toMatch(/--brand-|brand-rainbow/)
        // E `glass.test.ts` não pode continuar cobrando um eixo que saiu.
        const GLASS = readFileSync(
            join(process.cwd(), "src/components/ui/glass.test.ts"),
            "utf8",
        )
        const comModo = GLASS.slice(
            GLASS.indexOf("const COM_MODO = ["),
            GLASS.indexOf("]", GLASS.indexOf("const COM_MODO = [")),
        )
        expect(comModo).not.toContain("theme-toggle")
    })

    it("7. o alvo de toque e o par de toque continuam de pé", () => {
        // A pílula tem 32 de altura; o pseudo a leva aos 44 que um dedo pede.
        expect(CODIGO).toContain("after:-inset-y-1.5")
        // `hover:` compila dentro de `@media (hover: hover)` e não existe no
        // dedo — é a regra H, e ela já custou uma rodada neste arquivo.
        expect(CODIGO).toContain("group-hover/face:text-foreground")
        expect(CODIGO).toContain("group-active/face:text-foreground")
        // O anel de foco é o do sistema, no gatilho que recebe o foco.
        expect(CODIGO).toContain("focus-visible:ring-3 focus-visible:ring-ring/45")
    })

    it("8. a seleção segue o foco, e não a heurística do Radix", () => {
        // O Radix marca uma flag num `keydown` de `document` e clica no
        // `onFocus` do item se ela estiver de pé. O React 19 delega os eventos
        // no contêiner da raiz, **abaixo** de `document`: o foco muda antes de
        // a flag subir, e a seta passa a mover o foco sem escolher nada.
        // Medido no navegador — com o teclado, o controle ficava inerte.
        expect(CODIGO).toContain("onFocus=")
        expect(CODIGO).toContain("dataset?.parada")
        // O valor tem de estar no elemento que recebe o foco, senão o handler
        // lê `undefined` e nunca troca nada.
        expect(peca("theme-toggle-face")).toContain("data-parada={valor}")
    })

    it("9. movimento reduzido é perguntado à mão, porque a WAAPI escapa do bloco global", () => {
        // O bloco de `globals.css` encurta **transição**, e a WAAPI não é uma.
        // Então aqui a pergunta é feita no código, e a resposta é não animar:
        // o `--tt-i` já pôs as três peças no lugar certo, e o estado final
        // chega igual.
        expect(CODIGO).toContain('matchMedia("(prefers-reduced-motion: reduce)")')
    })
})
