import { readdirSync, readFileSync } from "node:fs"
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
      // O diálogo e a folha saíram desta lista na rodada 57, e a paleta na 58:
      // nenhum deles monta mais as camadas — a asserção 16 é quem tranca isso,
      // e a 17 tranca o que ficou no lugar (só a máscara).
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
    // A medição de faixa que a rodada 56 pôs aqui saiu com ela: sem consumidor,
    // era código morto — e um hook que mede layout por conta própria é o tipo
    // de peça que se esquece de tirar.
    expect(HOOK).not.toContain("bands")
    expect(HOOK).not.toContain("offsetParent")
  })

  it("14. a paleta é só máscara — as camadas de borrão saíram", () => {
    const codigo = semComentarios(readFileSync("src/components/ui/command.tsx", "utf8"))
    // Ela foi a última a ter o borrão nas pontas. Dentro de um casco que já
    // borra a 24px, três `backdrop-filter` aninhados por ponta re-borravam a
    // placa e a aresta de cada um saía como uma linha de tom atravessando a
    // lista — três em cima, duas embaixo, "como se a resolução fosse baixa".
    expect(codigo).not.toContain("ScrollFadeBlurLayers")
    expect(codigo).not.toContain("scroll-fade-material")
    // Sem camada irmã não há o que espelhar na casca.
    expect(codigo).not.toMatch(/shell:\s*true/)
    // …**e a máscara fica.** As três faixas desta paleta não pintam nada,
    // então é a rampa quem esconde o conteúdo sob o campo de busca.
    expect(codigo).toContain("scrollFadeViewportClassName")
    expect(codigo).not.toContain("data-scroll-fade-mode")
  })

  it("15. nenhuma utility de borrão declara sobra", () => {
    // A rodada 55 deu à camada uma **sobra** de 44px para fora do rolável,
    // apostando que a aresta cairia em fundo chapado. Ela não resolveu e
    // piorou: o trecho era borrão cheio, então a área afetada dobrou e virou um
    // slab — "muito grande e blocado", com a linha ainda visível. A aresta não
    // era o problema; a ausência de faixa era.
    for (const [eixo, camada] of CAMADAS) {
      expect(camada, `${eixo} ainda tem a sobra`).not.toContain(
        "--scroll-fade-blur-over"
      )
      expect(camada, `${eixo} ainda tem a variável local da sobra`).not.toContain(
        "--scroll-fade-blur-o"
      )
    }
    expect(REGUA, "a régua ainda exporta a sobra").not.toContain(
      "scrollFadeChromeOverhangClassName"
    )
  })

  it("16. nenhuma peça de ui/ monta as camadas de borrão", () => {
    // A camada é um `backdrop-filter`, e a borda de um `backdrop-filter` é
    // dura: sem faixa a aresta cai no meio da superfície; com faixa medida, a
    // máscara leva o conteúdo ao piso e o borrão fica sem o que borrar; dentro
    // de um casco que já borra, cada aresta vira uma linha de tom. Medido no
    // diálogo, na folha e por fim na paleta. A peça fica em `scroll-fade.tsx`
    // para o `edge="blur|material"` de quem não tem casca própria — e só lá.
    const montam = readdirSync("src/components/ui")
      .filter((f) => f.endsWith(".tsx") && f !== "scroll-fade.tsx")
      .filter((f) =>
        semComentarios(readFileSync(`src/components/ui/${f}`, "utf8")).includes(
          "ScrollFadeBlurLayers"
        )
      )
    expect(montam, "ninguém fora do ScrollFade monta camadas de borrão").toEqual([])
  })

  it("17. diálogo e folha estão em modo sem faixa — só a máscara", () => {
    // O que o dono pediu depois de três reprovações: o fade mínimo de todo
    // componente da casa, na própria borda do rolável, e nada somado a ele. Sem
    // faixa medida, sem sangramento, sem modo material, sem casca em volta —
    // o corpo é só o rolável, e o `useScrollFade()` não espelha nada porque não
    // há irmão para ler.
    const semImports = (t: string) =>
      t.replace(/import\s*\{[\s\S]*?\}\s*from\s*"[^"]*"/g, "")
    for (const nome of ["dialog"] as const) {
      const src = semImports(
        semComentarios(readFileSync(`src/components/ui/${nome}.tsx`, "utf8"))
      )
      expect(src, `${nome} sangra`).not.toContain("scrollFadeBleedClassName")
      expect(src, `${nome} mede faixa`).not.toMatch(/bands:\s*true/)
      expect(src, `${nome} desliga a máscara`).not.toContain("data-scroll-fade-mode")
      expect(src, `${nome} espelha sem irmão`).not.toMatch(/useScrollFade\(\{\s*shell/)
      expect(src, `${nome} perdeu a máscara`).toContain("scrollFadeViewportClassName")
      // E o piso é zero: a borda do rolável é a emenda com a tira, que não
      // pinta nada. A 0,06 o texto que a atravessa é recortado em seco a 6–15%
      // — uma linha nítida sob o título, medida. Por variável, no próprio nó:
      // herda e não disputa, e os 0,06 da casa ficam para a paleta.
      expect(src, `${nome} recorta a emenda`).toContain("[--scroll-fade-floor:0]")
    }
  })

  it("17b. as três tiras não pintam nada, nem fio", () => {
    // Elas chegaram a pintar um degradê `from-popover` → transparente para "a
    // cor cheia encostar na dissolução". Sobre a placa translúcida (`--popover`
    // a 60%) o opaco do topo é **mais claro** que ela, e saía como banda atrás
    // da alça da gaveta — medido. Cor com alfa não tem cor cheia pintável sem
    // empilhar; e a tira não precisa: o corpo é irmão dela e se mascara sozinho,
    // então o fundo da tira já é a placa. Sem fio também — regra **J**.
    const semImports = (t: string) =>
      t.replace(/import\s*\{[\s\S]*?\}\s*from\s*"[^"]*"/g, "")
    const dialog = semImports(semComentarios(readFileSync("src/components/ui/dialog.tsx", "utf8")))
    const form = semComentarios(readFileSync("src/components/ui/form.tsx", "utf8"))

    // Cortes ancorados no **fim** do próprio bloco, nunca no vizinho seguinte:
    // `DialogHeaderRow` vem *antes* de `DialogHeader` no arquivo, e o valor de
    // `sticky` mora na mesma linha — família do "corte por indexOf que acerta
    // por vazio".
    const fatia = (src: string, de: string, ate: string) => {
      const i = src.indexOf(de)
      const f = src.indexOf(ate, i + de.length)
      return i === -1 || f === -1 ? "" : src.slice(i, f)
    }
    const funcao = (src: string, nome: string) =>
      fatia(src, `function ${nome}(`, "\nfunction ")
    for (const [nome, trecho] of [
      ["DialogHeader", funcao(dialog, "DialogHeader")],
      ["DialogFooter", funcao(dialog, "DialogFooter")],
      ["FormActions sticky", fatia(form, "sticky:", '",')],
    ] as const) {
      expect(trecho.length, `${nome}: não achei a tira`).toBeGreaterThan(0)
      expect(trecho, `${nome}: tinta sobre a placa translúcida`).not.toMatch(/\bbg-(?:linear|radial|conic|popover|background|card|muted)\b|\bfrom-/)
      expect(trecho, `${nome}: fio mais tinta é a regra J`).not.toMatch(/\bborder-[tb]\b/)
    }
  })

  it("18. a gaveta portaliza para a janela ativa, como o painel de borda", () => {
    // Sem `container` o portal do `vaul` escapa do `<iframe>` da moldura do
    // catálogo e cobre a página inteira — a moldura já faz o `useIsMobile` ler
    // a janela de dentro, então é o ramo gaveta que renderiza ali. Fora da
    // moldura o contexto é `null` e o vaul usa o próprio documento.
    for (const [nome, arquivo] of [
      ["sheet", "src/components/ui/sheet.tsx"],
      ["drawer", "src/components/ui/drawer.tsx"],
    ] as const) {
      const src = semComentarios(readFileSync(arquivo, "utf8"))
      expect(src, `${nome} não lê a janela ativa`).toContain("useViewportWindow")
      expect(src, `${nome} portaliza sem container`).toMatch(
        /DrawerPrimitive\.Portal\s+container=\{janela\?\.document\.body\}/
      )
    }
  })
})
