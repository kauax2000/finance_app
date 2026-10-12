import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

/**
 * O alternador de tema, trancado. Três coisas quebram calado: (1) a fusão é de cor — cabeça,
 * rastro e pescoço são o mesmo `bg-background`, e um fio ou sombra numa delas desenha a emenda;
 * (2) a aritmética — trilho = 4 de recuo + três paradas de 28, viagem `i × 1.75rem`; (3) o
 * vidro não volta.
 */

// A receita da viagem mora em `lib/liquid-move.ts`, que o `Tabs` também usa: o trilho é lido
// junto com ela.
const FONTE =
    lerFonte("src/components/ui/theme-toggle.tsx") +
    "\n" +
    lerFonte("src/lib/liquid-move.ts")
/** Sem comentários: o cabeçalho deste componente cita por extenso quase tudo
 *  que se quer proibir, e varrer o texto cru testaria o comentário. */
const CODIGO = semComentarios(FONTE, "fora-de-url")

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
        // A ordem é a do menu do macOS, e é ela que o trilho desenha; trocá-la inverteria o que
        // cada posição mostra.
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

    it("3. a aritmética fecha nos três degraus: trilho = 4 + 3 paradas, e a viagem é uma parada", () => {
        // A geometria é uma tabela só e desce por estilo inline: classe montada em tempo de
        // execução não chega ao CSS.
        expect(CODIGO).toContain("sm: { altura: 28")
        expect(CODIGO).toContain("md: { altura: 32")
        expect(CODIGO).toContain("lg: { altura: 36")
        // A parada é a altura menos o recuo de 2px de cada lado (`p-0.5`).
        expect(CODIGO).toContain("const face = degrau.altura - 4")
        expect(CODIGO).toContain("p-0.5")
        expect(CODIGO).toContain("const larguraTrilho = 4 + passo * PARADAS.length")
        // O repouso da peça e a viagem da WAAPI usam o mesmo passo.
        expect(peca(PECA)).toContain("translate: `${indice * passo}px`")
        expect(CODIGO).toContain("{ x: indice * passo, y: 0 }")
        // O Skeleton de pré-montagem mede o mesmo, senão a linha do menu salta
        // de largura na hidratação.
        expect(CODIGO).toContain("style={{ width: larguraTrilho, height: degrau.altura }}")
    })

    it("3b. com rótulo o esticão tem os mesmos pixels", () => {
        // Sem a escala, a pílula de 88px esticava 19px e lia como elástico.
        expect(CODIGO).toContain("* (face / passo)")
    })

    it("4. é uma peça só — a regressão que o dono nomeou", () => {
        // Cabeça, rastro e pescoço fundidos só por cor leem como duas bolas transitando; a
        // forma única vem do esticão.
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

        // A asserção que importa: o pico do esticão e o relógio da escala têm de estar em fase
        // com a velocidade do trajeto (pico em 0,58, perto do pico de velocidade 0,667), senão
        // a forma estica parada e atravessa contraída. O relógio da escala passa do trajeto de
        // propósito (640 contra 400): os 240 que sobram são o pouso.
        expect(CODIGO).toContain("const ESTICAO = { duration: 640")
        expect(CODIGO).toContain("const TRAJETO = { duration: 400")
        expect(CODIGO).toContain("const PICO_EM = 0.58")
        // `linear` é o que faz cada `offset` do perfil valer a fração de tempo
        // que ele diz — com outra curva, o perfil amostrado sai deslocado.
        expect(CODIGO).toContain('easing: "linear"')
    })

    it("5f. o volume se conserva — esticar em X afina em Y", () => {
        // Sem isto a forma engorda em vez de esticar: a altura entra em contrafase com a
        // largura.
        expect(CODIGO).toContain("const ACOPLAMENTO_Y = 0.45")
        expect(CODIGO).toContain("amplitude * k * ACOPLAMENTO_Y")
    })

    it("5g. a origem vira no cruzamento por zero, e o degrau é de propósito", () => {
        // Correndo, a forma estica a partir da borda de trás; ao chegar, acomoda a partir da
        // borda da frente. A troca acontece onde `k` é 0 (identidade), em dois quadros a 0,0001
        // que fazem um degrau. A virada é derivada do fim do trajeto na régua da escala, não um
        // número solto.
        expect(CODIGO).toContain(
            "const VIRADA = TRAJETO.duration / ESTICAO.duration",
        )
        expect(CODIGO).toContain("[VIRADA, 0, ATRAS]")
        expect(CODIGO).toContain("[VIRADA + 0.0001, 0, FRENTE]")
        expect(CODIGO).toContain("transformOrigin: origem[lado]")
    })

    it("5h. o pouso é um mergulho só — nenhum repique", () => {
        // O pouso é uma compressão que vai e volta em 240ms: uma travessia da largura de
        // repouso depois da chegada.
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
        // O teto não é gosto: com o pico em 0,58 a borda dianteira chega a 87,7 dos 88px do
        // trilho no salto longo; em 1,26 a peça sai da pílula.
        const amp = Number(
            /AMPLITUDE_POR_SALTO = \[0, [\d.]+, ([\d.]+)\]/.exec(CODIGO)?.[1],
        )
        expect(amp).toBeLessThanOrEqual(0.22)
    })

    it("5b. quem desloca é a WAAPI, e nunca uma transição nem um rAF adiado", () => {
        // O next-themes injeta `* { transition: none !important }` com
        // `disableTransitionOnChange`; aplicar a posição dois `rAF` depois deixava o polegar
        // parado quando o rAF não corria no ritmo esperado.
        expect(CODIGO).not.toContain("requestAnimationFrame")
        expect(peca(PECA)).not.toMatch(/transition-|duration-|ease-|delay-/)
        // A animação não pode sobreviver ao próprio trajeto: quem manda no
        // repouso é o `translate` inline, e por isso `fill` é "none".
        expect(CODIGO).toContain('fill: "none"')
        // E um salto novo cancela o anterior, senão dois cliques seguidos
        // deixam duas animações disputando a mesma propriedade.
        expect(CODIGO).toContain("a.cancel()")
    })

    it("5e. a origem vira com o sentido — é o mecanismo inteiro do esticão", () => {
        // Com a origem na borda de trás e `scaleX > 1` a forma estica para a frente, na direção
        // da viagem; presa num valor fixo esticaria para trás em metade dos saltos.
        expect(CODIGO).toContain('paraDireita ? "0% 50%" : "100% 50%"')
    })

    it("5c. nascer é chegar, não viajar", () => {
        // Sem a guarda o polegar entra deslizando da esquerda toda vez que o componente nasce
        // (o conteúdo do `DropdownMenu` desmonta ao fechar).
        expect(CODIGO).toContain("jaPintou")
        expect(CODIGO).toContain("if (!montado) return")
    })

    it("5i. a bandeja é sobreposição, e não tinta chapada", () => {
        // `bg-muted` é opaco e não responde ao que está atrás; este controle não vive numa
        // superfície conhecida, então veste a superfície do campo (28 sobre a página, 40 sobre
        // o cartão, no escuro).
        const raiz = peca("theme-toggle")
        expect(raiz).toContain("bg-input-fill/50")
        expect(raiz).not.toMatch(/bg-muted\b/)
    })

    it("6. o vidro não volta, e a marca só entra pelo brilho", () => {
        expect(FONTE).not.toMatch(/glass/i)
        // O contorno de arco-íris não volta; a marca entra só pelo brilho da família
        // (`variant="brand"`).
        expect(FONTE).not.toMatch(/brand-rainbow|brand-contour/)
        expect(CODIGO).toContain('variant === "brand" && "brand-glow isolate')
        // `glass.test.ts` não cobra mais um eixo que saiu.
        const GLASS = lerFonte("src/components/ui/glass.test.ts")
        const comModo = GLASS.slice(
            GLASS.indexOf("const COM_MODO = ["),
            GLASS.indexOf("]", GLASS.indexOf("const COM_MODO = [")),
        )
        expect(comModo).not.toContain("theme-toggle")
    })

    it("7. o alvo de toque e o par de toque continuam de pé", () => {
        // A pílula tem 32 de altura; o pseudo a leva aos 44 que um dedo pede.
        expect(CODIGO).toContain("after:-inset-y-1.5")
        // `hover:` compila dentro de `@media (hover: hover)` e não existe no dedo (regra H).
        expect(CODIGO).toContain("group-hover/face:text-foreground")
        expect(CODIGO).toContain("group-active/face:text-foreground")
        // O anel de foco é o do sistema, no gatilho que recebe o foco.
        expect(CODIGO).toContain("focus-visible:ring-3 focus-visible:ring-ring/45")
    })

    it("8. a seleção segue o foco, e não a heurística do Radix", () => {
        // O Radix marca uma flag num `keydown` de `document` e o React 19 delega os eventos
        // abaixo dele: o foco muda antes de a flag subir e a seta move o foco sem escolher
        // nada.
        expect(CODIGO).toContain("onFocus=")
        expect(CODIGO).toContain("dataset?.parada")
        // O valor tem de estar no elemento que recebe o foco, senão o handler
        // lê `undefined` e nunca troca nada.
        expect(peca("theme-toggle-face")).toContain("data-parada={valor}")
    })

    it("9. movimento reduzido é perguntado à mão, porque a WAAPI escapa do bloco global", () => {
        // O bloco global de `globals.css` encurta transição, e a WAAPI não é uma: a pergunta é
        // feita no código, e a resposta é não animar.
        expect(CODIGO).toContain('matchMedia("(prefers-reduced-motion: reduce)")')
    })
})
