import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import {
  SCROLL_FADE_BLUR_LAYERS,
  scrollFadeBlurClassName,
  scrollFadeBlurXClassName,
  scrollFadeViewportClassName,
} from "@/lib/scroll-fade-classes"

/**
 * O `scroll-fade` viveu sem teste próprio: as quatro invariantes dele só eram
 * cobradas de raspão por `carousel-ladder.test.ts`, contra **um** consumidor.
 * A rodada do borrão fechou isso.
 *
 * O corte é o de `glass.test.ts`, e a razão é a mesma: **asserção que varre
 * texto cru testa o comentário, não o código** — os comentários daqui citam de
 * propósito `mask-composite` e `backdrop-filter` como o que não se faz.
 */
const CSS = readFileSync("src/app/globals.css", "utf8")

const semComentarios = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

const fatia = (de: string, ate: string) => {
  const i = CSS.indexOf(de)
  const f = CSS.indexOf(ate, i + de.length)
  expect(i, `não achei "${de}"`).toBeGreaterThan(-1)
  expect(f, `não achei "${ate}" depois de "${de}"`).toBeGreaterThan(i)
  return CSS.slice(i, f)
}

const BLUR_Y = semComentarios(
  fatia("@utility scroll-fade-blur-y {", "@utility scroll-fade-blur-x")
)
const BLUR_X = semComentarios(
  fatia("@utility scroll-fade-blur-x {", "\n/**")
)
const RAMPA_Y = semComentarios(
  fatia("@utility scroll-fade-y {", "@utility scroll-fade-x")
)
const MATERIAL = semComentarios(
  fatia("@utility scroll-fade-material {", "\n/**")
)

const COMPONENTE = semComentarios(
  readFileSync("src/components/ui/scroll-fade.tsx", "utf8")
)
const REGUA = semComentarios(
  readFileSync("src/lib/scroll-fade-classes.ts", "utf8")
)

const CAMADAS = [
  ["y", BLUR_Y],
  ["x", BLUR_X],
] as const

describe("a dissolução das bordas", () => {
  it("1. o borrão é irmão do rolável, e nunca o próprio", () => {
    // O nó mascarado e o nó borrado são elementos diferentes. Um
    // `backdrop-filter` no mascarado seria recortado pela rampa: forte onde a
    // máscara é opaca, ausente justo na ponta — invertido.
    for (const camada of [scrollFadeBlurClassName, scrollFadeBlurXClassName]) {
      expect(scrollFadeViewportClassName).not.toContain(camada)
      expect(camada).not.toContain(scrollFadeViewportClassName)
    }

    // **A camada é uma peça só, e cada consumidor a declara depois do
    // rolável.** O bloco de JSX chegou a estar escrito em três lugares — aqui,
    // na paleta e no corpo modal —, e virou `ScrollFadeBlurLayers`. A asserção
    // deixou de olhar a posição de um `<div>` e passa a olhar a **ordem** em
    // cada consumidor: o rolável primeiro, a peça depois.
    expect(COMPONENTE).toContain('data-slot="scroll-fade-blur"')
    for (const [nome, caminho, ancoraDoRolavel] of [
      ["scroll-fade", "src/components/ui/scroll-fade.tsx", "ref={ref}"],
      // Na paleta o rolável é **outro componente**, e o que a casca declara é
      // `{children}`. A ordem que importa é a do DOM, e é essa que a âncora lê.
      ["command", "src/components/ui/command.tsx", "{children}"],
      ["dialog", "src/components/ui/dialog.tsx", 'data-slot="dialog-body"'],
      [
        "mobile-sheet-form-chrome",
        "src/components/ui/mobile-sheet-form-chrome.tsx",
        'data-slot="mobile-sheet-form-body"',
      ],
    ] as const) {
      const src = readFileSync(caminho, "utf8")
      const rolavel = src.indexOf(ancoraDoRolavel)
      // A **chamada**, e não a definição: em `scroll-fade.tsx` a peça é
      // declarada acima do componente que a usa, então procurar o `data-slot`
      // acharia a definição e a ordem sairia invertida.
      const camada = src.indexOf("<ScrollFadeBlurLayers")
      expect(rolavel, `${nome}: âncora do rolável`).toBeGreaterThan(-1)
      expect(camada, `${nome}: a camada precisa existir`).toBeGreaterThan(-1)
      expect(camada, `${nome}: a camada vem depois do rolável`).toBeGreaterThan(
        rolavel
      )
    }

    // E a rampa nunca borra.
    expect(RAMPA_Y).not.toMatch(/backdrop-filter/)
  })

  it("2. um gradiente por elemento — nunca mask-composite", () => {
    for (const [eixo, css] of CAMADAS) {
      expect(css, eixo).not.toMatch(/mask-composite/)
      expect(css.match(/linear-gradient\(/g) ?? [], eixo).toHaveLength(1)
    }
  })

  it("3. as camadas empilham: o raio cresce e a extensão encurta com o índice", () => {
    expect(SCROLL_FADE_BLUR_LAYERS.length).toBeGreaterThanOrEqual(3)
    for (let i = 1; i < SCROLL_FADE_BLUR_LAYERS.length; i++) {
      expect(SCROLL_FADE_BLUR_LAYERS[i]).toBeGreaterThan(
        SCROLL_FADE_BLUR_LAYERS[i - 1]!
      )
    }

    for (const [eixo, css] of CAMADAS) {
      // Raio = base × índice.
      expect(css, eixo).toMatch(
        /blur\(\s*calc\(\s*var\(--scroll-fade-blur-r\)\s*\*\s*var\(--scroll-fade-blur-i, 1\)\s*\)\s*\)/
      )
      // Extensão = 100% ÷ índice: a que mais borra é a que menos avança.
      expect(css, eixo).toContain(
        "--scroll-fade-blur-e: calc(100% / var(--scroll-fade-blur-i, 1))"
      )
      // Com o par -webkit-, como `.mobile-glass-surface`.
      expect(css, eixo).toMatch(/-webkit-backdrop-filter:/)
      expect(css, eixo).toMatch(/-webkit-mask-image:/)
    }
  })

  it("4. os quatro guardas existem, e cada um tira a camada do DOM pintado", () => {
    const guardas = [
      /\[data-scroll-fade="off"\] > & \{\s*display: none;/,
      /@media \(prefers-reduced-transparency: reduce\) \{\s*display: none;/,
      /@media \(forced-colors: active\) \{\s*display: none;/,
      /@supports not \(backdrop-filter: blur\(1px\)\) \{\s*display: none;/,
    ]
    for (const [eixo, css] of CAMADAS) {
      for (const guarda of guardas) {
        expect(css, `${eixo}: ${guarda}`).toMatch(guarda)
      }
    }
  })

  it("5. a camada não come clique — ela fica por cima do conteúdo", () => {
    for (const [eixo, css] of CAMADAS) {
      expect(css, eixo).toMatch(/pointer-events: none;/)
    }
    expect(COMPONENTE).toContain("aria-hidden")
  })

  it("6. a faixa do borrão não pode divergir da faixa que dissolve", () => {
    // As duas leem as mesmas variáveis vivas e o mesmo teto de distância, então
    // não há como uma crescer sem a outra.
    expect(BLUR_Y).toContain(
      "clamp(0px, var(--scroll-fade-start, 0px), var(--scroll-fade-h))"
    )
    expect(BLUR_Y).toContain(
      "clamp(0px, var(--scroll-fade-end, 0px), var(--scroll-fade-h))"
    )
    expect(BLUR_X).toContain(
      "clamp(0px, var(--scroll-fade-start, 0px), var(--scroll-fade-x-h))"
    )
    expect(BLUR_X).toContain(
      "clamp(0px, var(--scroll-fade-end, 0px), var(--scroll-fade-x-h))"
    )

    // **E a faixa é somada à medida, nunca usada como âncora.**
    //
    // Esta metade da asserção era por substring — ela exigia que
    // `var(--scroll-fade-band-h, 0px)` *aparecesse*, e não **onde**. Passava
    // com a camada deslocada (`top: band-h`) e passava com ela somada, ou
    // seja: não provava nada. É o defeito que este projeto já registrou duas
    // vezes — *asserção que casa a forma do texto testa a digitação*.
    //
    // O que ela protege agora é a geometria: a camada começa na borda da casca
    // e **cobre** a faixa, que é a mesma conta que `--scroll-fade-top-h` faz na
    // rampa. Deslocada, o borrão começava depois do cabeçalho e o conteúdo
    // atrás dele saía dissolvido a 6% porém **nítido** — fantasma legível
    // colado a um borrão, com uma aresta entre os dois.
    const pontas = [
      ["Y", BLUR_Y, "top", "bottom", "height", "--scroll-fade-h"],
      ["X", BLUR_X, "inset-inline-start", "inset-inline-end", "width", "--scroll-fade-x-h"],
    ] as const
    for (const [eixo, css, inicio, fim, medida, teto] of pontas) {
      for (const [ancora, faixa, viva] of [
        [inicio, "--scroll-fade-band-h", "--scroll-fade-start"],
        [fim, "--scroll-fade-foot-h", "--scroll-fade-end"],
      ] as const) {
        // A âncora é zero — nunca a variável da faixa.
        expect(css, `${eixo}: ${ancora} precisa ancorar em 0`).toMatch(
          new RegExp(`${ancora}:\\s*0;`)
        )
        expect(css, `${eixo}: ${ancora} não pode ancorar na faixa`).not.toMatch(
          new RegExp(`${ancora}:\\s*var\\(${faixa}`)
        )
        // E a medida soma a faixa ao `clamp` — com o fallback `, 0px`, que é o
        // que mantém isto no-op para quem não tem faixa (`ScrollFade`,
        // `Carousel`): `calc(0px + clamp(…))` é a geometria de sempre.
        expect(css, `${eixo}: ${medida} precisa somar ${faixa}`).toMatch(
          new RegExp(
            `${medida}:\\s*calc\\(\\s*var\\(${faixa}, 0px\\)\\s*\\+\\s*clamp\\(0px, var\\(${viva}, 0px\\), var\\(${teto}\\)\\)\\s*\\);`
          )
        )
      }
    }
  })

  it("7. o material substitui a dissolução, e não soma a ela", () => {
    // O que separa um material de um véu: o conteúdo passa por baixo nítido.
    for (const rampa of [RAMPA_Y, semComentarios(fatia("@utility scroll-fade-x {", "\n/*"))]) {
      expect(rampa).toContain('&[data-scroll-fade-mode="material"]')
      // A regra vem **depois** da que liga a máscara: as duas empatam em
      // especificidade, e ali quem decide é a ordem de emissão.
      expect(rampa.indexOf('data-scroll-fade-mode="material"')).toBeGreaterThan(
        rampa.indexOf('&[data-scroll-fade="on"]')
      )
      // A folga de rolagem fica: o item ativo não pode parar debaixo da faixa.
      expect(rampa).toMatch(/scroll-padding/)
    }
    expect(COMPONENTE).toContain('data-scroll-fade-mode={material ? "material" : undefined}')
  })

  it("8. o material é preset de variável, e nunca uma segunda propriedade", () => {
    // O precedente é `glass-control`: sobrescrever a variável, nunca a
    // propriedade — senão quem vence é a ordem de emissão do Tailwind.
    expect(MATERIAL).not.toMatch(/backdrop-filter|background-color|mask-image/)
    expect(MATERIAL).toContain("--scroll-fade-blur-r: 7px")
    expect(MATERIAL).toContain("--scroll-fade-blur-sat: 1.5")

    // A tinta e a vibrância são no-op por padrão, então `blur` não muda.
    for (const [eixo, css] of CAMADAS) {
      expect(css, eixo).toContain(
        "background-color: var(--scroll-fade-blur-tint, transparent)"
      )
      expect(css, eixo).toContain("saturate(var(--scroll-fade-blur-sat, 1))")
    }

    // E a tinta NÃO nasce de uma cor: cravá-la é o defeito que enterrou o
    // ScrollFade pintado, e `--mobile-glass-bg` segue superfícies diferentes
    // em cada tema.
    expect(MATERIAL).not.toMatch(/--scroll-fade-blur-tint/)
    for (const [eixo, css] of CAMADAS) {
      expect(css, eixo).not.toMatch(/--mobile-glass/)
    }
  })

  it("9. a vibrância é a mesma do outro vidro da casa", () => {
    // Uma vibrância só, e ela mora na `@utility glass-surface` — a receita de
    // material de superfície. A versão anterior desta asserção lia o número a
    // partir de `indexOf(".mobile-glass-surface")`, e a primeira ocorrência
    // dessa string é um **comentário**: ela media a coisa certa por acidente.
    const SUPERFICIE = semComentarios(
      fatia("@utility glass-surface {", "\n/**")
    )
    const daCasa = SUPERFICIE.match(/--glass-surface-sat,\s*([\d.]+)/)?.[1]
    const meu = MATERIAL.match(/--scroll-fade-blur-sat:\s*([\d.]+)/)?.[1]
    expect(daCasa, "a utility precisa declarar a vibrância").toBeDefined()
    expect(meu).toBe(daCasa)

    // E a folha do telefone **herda** a receita em vez de repetir os números —
    // duas declarações do mesmo material divergem no dia em que uma mudar.
    const folha = CSS.slice(CSS.indexOf("  .mobile-glass-surface {"))
    const bloco = semComentarios(folha.slice(0, folha.indexOf("}")))
    expect(bloco).toContain("@apply glass-surface")
    expect(bloco).not.toMatch(/backdrop-filter|saturate\(/)
  })

  it("10. a camada arredonda só os cantos que encostam nos da casca", () => {
    // A camada preenche o padding box da casca. Com canto reto, ela avança
    // sobre a curva e pinta por cima do fio da borda — o borrão vaza para fora
    // do arredondamento. Herdar os **quatro** seria o erro oposto: a aresta de
    // dentro corre no meio da caixa, e ali não há canto nenhum a acompanhar.
    const ponta = (css: string, edge: "start" | "end") => {
      const i = css.indexOf(`&[data-edge="${edge}"]`)
      expect(i, edge).toBeGreaterThan(-1)
      return css.slice(i, css.indexOf("}", i))
    }

    // Eixo Y: a ponta de cima pega os dois cantos de cima; a de baixo, os de baixo.
    const CANTOS = {
      y: {
        start: ["start-start", "start-end"],
        end: ["end-start", "end-end"],
      },
      // Eixo X: a ponta de início pega o lado de início — um canto de cima e um
      // de baixo —, e a de fim, o lado de fim.
      x: {
        start: ["start-start", "end-start"],
        end: ["start-end", "end-end"],
      },
    } as const

    const TODOS = ["start-start", "start-end", "end-start", "end-end"]

    for (const [eixo, css] of CAMADAS) {
      for (const edge of ["start", "end"] as const) {
        const bloco = ponta(css, edge)
        const esperados: readonly string[] = CANTOS[eixo][edge]
        for (const canto of TODOS) {
          const regra = `border-${canto}-radius: inherit`
          if (esperados.includes(canto)) {
            expect(bloco, `${eixo}/${edge}: falta ${canto}`).toContain(regra)
          } else {
            expect(bloco, `${eixo}/${edge}: sobra ${canto}`).not.toContain(regra)
          }
        }
      }
      // E nunca o atalho, que arredondaria os quatro de uma vez.
      expect(css, eixo).not.toMatch(/^\s*border-radius:/m)
    }
  })

  it("11. a régua nunca monta classe em tempo de execução", () => {
    // O Tailwind varre o código como texto: um nome interpolado não chega ao
    // CSS. O índice desce por custom property inline, e não por classe.
    expect(REGUA).not.toMatch(/`[^`]*\$\{/)
    expect(COMPONENTE).toContain('"--scroll-fade-blur-i"')
    expect(COMPONENTE).toMatch(/edge\?: "fade" \| "blur" \| "material"/)
    expect(COMPONENTE).not.toMatch(/`scroll-fade-blur[^`]*\$\{/)
  })

  it("12. o elemento mascarado não desenha nada — a invariante 2", () => {
    // A máscara recorta o alfa do elemento inteiro, borda e sombra junto: um
    // retângulo com os cantos apagados e os lados opacos lê como bug de
    // renderização. Mesma varredura mecânica da asserção 10a do carrossel.
    const i = COMPONENTE.indexOf("ref={ref}")
    expect(i).toBeGreaterThan(-1)
    const bloco = COMPONENTE.slice(i, COMPONENTE.indexOf("{children}", i))
    for (const proibida of ["bg-", "ring-", "rounded-", "shadow-", "border-"]) {
      expect(bloco, proibida).not.toMatch(
        new RegExp('"[^"]*\\b' + proibida.replace("-", "\\-"))
      )
    }
  })

  it("13. o espelho na casca é opt-in, e ele limpa o que escreveu", () => {
    const HOOK = semComentarios(
      readFileSync("src/hooks/use-scroll-fade.ts", "utf8")
    )
    // Sem `shell` não há casca, e nenhum consumidor do Radix ou do cmdk recebe
    // mutação de atributo que não pediu.
    expect(HOOK).toContain("shell = false")
    expect(HOOK).toContain("shell ? el.parentElement : null")
    // E o cleanup desfaz as três escritas.
    expect(HOOK).toContain('casca.style.removeProperty("--scroll-fade-start")')
    expect(HOOK).toContain('casca.style.removeProperty("--scroll-fade-end")')
    expect(HOOK).toContain("delete casca.dataset.scrollFade")
    expect(HOOK).toContain("[axis, sides, shell]")
  })

  it("14. a paleta soma o material à rampa, e não o substitui", () => {
    const paleta = readFileSync(
      "src/components/ui/command.tsx",
      "utf8"
    )
    const codigo = paleta
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/(^|[^:])\/\/.*$/gm, "$1")

    // O borrão do iOS entra nas duas pontas, pela peça compartilhada — ela
    // já nasce `material`, que é o raio e a vibrância do iOS.
    expect(codigo).toContain("<ScrollFadeBlurLayers")

    // …**mas a máscara fica.** As três faixas desta paleta não pintam nada,
    // então é a rampa quem esconde o conteúdo sob o campo de busca. Trocar para
    // o modo `material` — que desliga `--scroll-fade-mask` — faria o texto
    // aparecer atrás do input.
    expect(codigo).not.toContain("data-scroll-fade-mode")

    // A camada é **irmã** do rolável: ela mora na casca, depois de `children`,
    // e não dentro do `CommandList`. Um `backdrop-filter` no nó mascarado sai
    // recortado pela própria rampa.
    const casca = codigo.indexOf("data-slot=\"command\"")
    const lista = codigo.indexOf("data-slot=\"command-list\"")
    const camada = codigo.indexOf("<ScrollFadeBlurLayers")
    expect(camada).toBeGreaterThan(casca)
    expect(camada).toBeLessThan(lista)

    // E irmão não lê custom property de irmão: sem `shell`, as duas variáveis
    // ficariam só na lista e a camada nasceria com altura zero para sempre.
    expect(codigo).toMatch(/useScrollFade\(\{\s*shell:\s*true\s*\}\)/)

    // Sem bloco de contenção na casca, o absoluto resolve contra um ancestral
    // qualquer — foi o defeito medido no `Carousel`.
    expect(codigo).toMatch(/"relative flex size-full flex-col/)
  })
})
