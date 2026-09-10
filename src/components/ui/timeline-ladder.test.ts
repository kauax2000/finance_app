import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import {
  TIMELINE_TONES,
  timelineMarkerVariants,
  timelineToneVariants,
  timelineVariants,
} from "./timeline"

/**
 * A escada da `Timeline`, trancada.
 *
 * Cada asserção existe por causa de um defeito **medido**, e quase todos já
 * tinham sido pagos noutro componente desta casa antes de aparecerem aqui:
 *
 * - o ponto a **4,4px** do centro óptico do título (`mt-0.5` cravado contra uma
 *   caixa de 22,75px) — a família do ícone do `Alert`;
 * - `isLast` como prop de quem chama — o defeito que o `Stepper` e a
 *   `BreadcrumbList` já tinham corrigido, e que aqui sobreviveu **com a página
 *   do catálogo afirmando o contrário**;
 * - `ring-4 ring-background` supondo a superfície — a régua do `Accordion`;
 * - `in-*` para propagar orientação, que compila com `:where()` e perde para a
 *   classe base — o defeito do `DescriptionList`;
 * - classe montada em tempo de execução, que o Tailwind nunca emite — esta base
 *   já pagou essa lição **cinco** vezes.
 *
 * O arquivo é lido **sem comentários**: a prosa acima cita de propósito o que o
 * componente deixou de fazer, e uma varredura ingênua se acusaria sozinha. É o
 * conserto que o auditor já tinha feito em `lineOf`, e que os testes do `Chart`
 * e do `Sheet` repetem.
 */

const FONTE = readFileSync(join(__dirname, "timeline.tsx"), "utf8")

/** Remove blocos `/* *\/` e linhas `//`. Comentário não é código. */
function semComentarios(src: string) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
}

const CODIGO = semComentarios(FONTE)

const DEGRAUS = ["sm", "md", "lg"] as const
const MARCADORES = ["dot", "icon", "avatar", "none"] as const

/** Extrai o valor de uma variável `--tl-*` da string de um degrau. */
function medida(size: (typeof DEGRAUS)[number], nome: string) {
  const classes = timelineVariants({ size })
  const achado = classes.match(
    new RegExp(`\\[--tl-${nome}:([^\\]]+)\\]`)
  )?.[1]
  return achado
}

/** `--spacing(2.5)` → 2.5. O sistema mede em passos de 4px. */
function passos(valor: string | undefined) {
  return Number(valor?.match(/--spacing\(([\d.]+)\)/)?.[1])
}

describe("escada da Timeline", () => {
  it("1. nenhum par de degraus produz a mesma string — o defeito do `Item`", () => {
    const strings = DEGRAUS.map((size) => timelineVariants({ size }))
    expect(new Set(strings).size).toBe(DEGRAUS.length)
  })

  it("2. as medidas sobem monotonicamente, e `md` é o padrão", () => {
    for (const eixo of ["dot", "well-size", "icon", "pad", "rail-gap"]) {
      const seq = DEGRAUS.map((s) => passos(medida(s, eixo)))
      expect(seq.every(Number.isFinite), `${eixo} tem degrau ilegível`).toBe(true)
      expect(seq).toStrictEqual([...seq].sort((a, b) => a - b))
      expect(new Set(seq).size, `${eixo} repete degrau`).toBe(seq.length)
    }

    // O poço `md` é 32px — 8 passos —, que é a medida que `account/activity`
    // já renderiza à mão. Âncora real, e não escala inventada.
    expect(passos(medida("md", "well-size"))).toBe(8)
    expect(timelineVariants({})).toBe(
      timelineVariants({ orientation: "vertical", marker: "dot", size: "md" })
    )
  })

  it("3. nada é montado em tempo de execução — o Tailwind varre o código como texto", () => {
    expect(CODIGO).not.toMatch(/`[^`]*\$\{[^`]*`/)
  })

  it("4. o deslocamento do marcador deriva do degrau, e não é número mágico", () => {
    // A conta do `Alert`: `(entrelinha − marcador) / 2`. O `max(0px, …)` é o
    // que faz o poço — maior que uma linha — alinhar pelo topo em vez de subir
    // para fora do bloco, com uma fórmula só.
    expect(CODIGO).toMatch(/margin-block-start:max\(0px,calc\(/)
    expect(CODIGO).toContain("var(--tl-lead)")

    // `--tl-lead` é fonte única: o título a veste como `line-height` e a
    // fórmula a lê como entrelinha. Foram duas fontes por uma medição — o
    // `text-(length:…)` derrubou o `leading-relaxed` do `P`, e o ponto saiu
    // 0,88px fora do centro com o código "certo".
    expect(CODIGO).toMatch(/leading-\(--tl-lead\)/)
    for (const size of DEGRAUS) {
      expect(timelineVariants({ size }), `${size} não publica --tl-lead`).toMatch(
        /\[--tl-lead:calc\(var\(--text-(?:xs|sm)\)\*1\.625\)\]/
      )
    }
    expect(CODIGO).toContain("var(--tl-center)")

    // Todo `-` binário dentro de um `calc()` arbitrário se escreve `_-_`: o
    // Tailwind normaliza espaço em torno de `+`, `*` e `/`, mas não de `-`.
    const formula = CODIGO.match(/\[margin-block-start:[^\]]+\]/)?.[0] ?? ""
    expect(formula).toContain("_-_")
    expect(formula).not.toMatch(/\s/)

    // O `mt-0.5` cravado não volta: era ele que punha o ponto 4,4px acima.
    expect(CODIGO).not.toMatch(/(?:^|\s)mt-0\.5(?:\s|"|')/)

    // E a centragem é ligada pela orientação, nunca por um segundo `mt`.
    expect(timelineVariants({ orientation: "vertical" })).toContain("[--tl-center:1]")
    expect(timelineVariants({ orientation: "horizontal" })).toContain("[--tl-center:0]")
  })

  it("5. o anel não volta — um componente não sabe sobre que superfície está", () => {
    expect(CODIGO).not.toContain("ring-background")
    expect(CODIGO).not.toMatch(/ring-\d/)
  })

  it("6. todo `hover:` tem par `active:` — a regra H não alcança `cva`", () => {
    const familias = (fonte: string, variante: "hover" | "active") =>
      new Set(
        [...fonte.matchAll(new RegExp(`${variante}:([a-z]+)-`, "g"))].map(
          (m) => m[1]
        )
      )
    for (const f of familias(CODIGO, "hover")) {
      expect(familias(CODIGO, "active"), `hover:${f}- sem par de toque`).toContain(f)
    }
  })

  it("7. a lista deriva `isLast` e `marker` — o defeito do `Stepper`", () => {
    // O contêiner sabe o índice e a calha; o item não. Quem clona é a lista.
    expect(CODIGO).toMatch(/React\.Children\.toArray/)
    expect(CODIGO).toMatch(/isLast:\s*i === itens\.length - 1/)
    // E um `marker` escrito no item vence o que a lista injeta.
    expect(CODIGO).toMatch(/\.props\s*\n?\s*\.marker \?\?|props\.marker \?\?/)
  })

  it("8. a orientação viaja por variável, e o último não estica", () => {
    // `in-*` compila com `:where()`, que não soma especificidade: ele perderia
    // para a classe base no mesmo elemento. É o defeito do `DescriptionList`.
    expect(CODIGO).not.toMatch(/in-data-\[orientation/)
    expect(CODIGO).not.toMatch(/group-data-\[orientation/)

    expect(timelineVariants({ orientation: "horizontal" })).toContain(
      "[--tl-grow:1_1_0%]"
    )
    // ~192px de vão morto foi o que o `Stepper` mediu com o último esticado.
    expect(CODIGO).toContain("[--tl-grow:0_0_auto]")

    // As duas orientações declaram o mesmo conjunto de variáveis: uma que
    // faltasse de um lado só falharia calada, e num eixo só.
    const vars = (o: "vertical" | "horizontal") =>
      new Set(
        [...timelineVariants({ orientation: o }).matchAll(/\[(--tl-[a-z-]+):/g)].map(
          (m) => m[1]
        )
      )
    expect([...vars("vertical")].sort()).toStrictEqual([...vars("horizontal")].sort())
  })

  it("9. o separador não desenha fio e tinta — regra J", () => {
    const sep = CODIGO.slice(
      CODIGO.indexOf("function TimelineSeparator"),
      CODIGO.indexOf("function TimelineTitle")
    )
    expect(sep.length).toBeGreaterThan(200)
    expect(sep).not.toMatch(/\bborder-[bty]\b|\bborder-b\b/)
    expect(sep).not.toMatch(/\bbg-(muted|card|accent)/)
    // O fio da calha continua através dela: a data rotula a cronologia, não a
    // interrompe.
    expect(sep).toContain("bg-border")

    // A `Timeline` clona todos os filhos, e a faixa é um deles: sem
    // desestruturar, `isLast` e `marker` vazam para o `<li>`. Medido no
    // console antes do conserto, três vezes na mesma página.
    expect(sep).toMatch(/isLast: _isLast/)
    expect(sep).toMatch(/marker: _marker/)
  })

  it("12. o vidro alcança toda forma que pinta superfície — a uniformidade", () => {
    // O pedido do dono, virado teste: numa `Timeline` de vidro **não existe
    // marcador chapado**. Como `marker` é sobrescrevível por item, escopar o
    // vidro a uma forma só deixaria escrever a lista inconsistente — um poço de
    // vidro ao lado de um avatar chapado. Nenhuma forma fica de fora.
    const COM_SUPERFICIE = ["dot", "icon", "avatar"] as const

    for (const marker of COM_SUPERFICIE) {
      expect(
        timelineMarkerVariants({ marker, glass: true }),
        `${marker} não veste vidro`
      ).toMatch(/(?:^|\s)glass(?:\s|$)/)
      expect(
        timelineMarkerVariants({ marker, glass: false }),
        `${marker} veste vidro sem pedir`
      ).not.toMatch(/(?:^|\s)glass(?:\s|$)/)
    }

    // `none` é só o fio da faixa de data: não há superfície a vestir.
    for (const glass of [true, false]) {
      expect(timelineMarkerVariants({ marker: "none", glass })).not.toContain(
        "glass"
      )
    }

    // E as três vestem o preset **cônico**: o aro linear põe o pico nos cantos
    // da caixa, e num círculo eles não existem — 0% do perímetro, medido no
    // `Avatar`.
    for (const marker of COM_SUPERFICIE) {
      expect(timelineMarkerVariants({ marker, glass: true })).toContain(
        "glass-round"
      )
    }
  })

  it("13. o ramo de vidro não escreve fundo — a armadilha nº 1", () => {
    // O shorthand `background` da utility apaga o `background-color` de quem a
    // veste, **calado**. E a asserção 13 de `glass.test.ts` proíbe o
    // neutralizador: onde o eixo dispensa a classe, ela não pode existir.
    for (const marker of ["dot", "icon", "avatar"] as const) {
      const vidro = timelineMarkerVariants({ marker, glass: true })
      expect(vidro, `${marker} empilha fundo sob vidro`).not.toMatch(
        /\[background:/
      )
      expect(vidro).not.toMatch(/bg-transparent|ring-0\b/)
    }
    // E o chapado escreve, senão o eixo não estaria decidindo nada.
    expect(timelineMarkerVariants({ marker: "dot", glass: false })).toContain(
      "[background:var(--tl-fill)]"
    )
    expect(timelineMarkerVariants({ marker: "icon", glass: false })).toContain(
      "[background:var(--tl-well)]"
    )
  })

  it("14. o tom sai da própria peça, e o avatar não tem tom", () => {
    // "Quem veste vidro declara `--glass-tone` e `--glass-ink` com a cor que já
    // tem; não há tabela intermediária a consultar."
    expect(CODIGO).not.toContain("GLASS_TONES")
    expect(CODIGO).toContain("glassRoundSurfaceClassName")

    expect(timelineMarkerVariants({ marker: "dot", glass: true })).toContain(
      "[--glass-tone:var(--tl-fill)]"
    )
    expect(timelineMarkerVariants({ marker: "icon", glass: true })).toContain(
      "[--glass-tone:var(--tl-well)]"
    )
    // O corpo vem da família `-muted`, que é opaca nos dois temas — a regra da
    // rodada 44: tom translúcido deixa a lâmina quase preta atravessar, e a
    // peça sai 20% mais escura que a chapada.
    expect(timelineToneVariants({ tone: "income" })).toContain(
      "[--tl-well:var(--color-income-muted)]"
    )

    // O avatar é o único sem tom: a cor dele é a identidade da pessoa, que mora
    // dentro do avatar. Tingir a moldura competiria com ela.
    expect(
      timelineMarkerVariants({ marker: "avatar", glass: true })
    ).not.toContain("--glass-tone")

    // A tinta é `--tl-ink`, e foi medida contra `--tl-fill`: o aro contra o
    // corpo dá 3,66 contra 3,15 no escuro e 2,07 contra 1,77 no claro, com o
    // pior caso (`default` no escuro) indo de **2,60 para 3,48**. O token já
    // inverte por tema sozinho, então o par `dark:` não é necessário.
    for (const marker of ["dot", "icon", "avatar"] as const) {
      expect(timelineMarkerVariants({ marker, glass: true })).toContain(
        "[--glass-ink:var(--tl-ink)]"
      )
    }
    expect(CODIGO).not.toMatch(/dark:\[--glass-/)
  })

  it("15. a lista sobrescreve o vidro, e é isso que trava a uniformidade", () => {
    // `marker` é preenchido com `??` — o item pode fugir da forma. `glass` é
    // atribuído direto: o acabamento é da trilha, e a exceção não existe. Se
    // isto virar `glass: props.glass ?? glass`, a lista inconsistente volta a
    // ser escrevível.
    expect(CODIGO).toMatch(/\n\s*glass,\n/)
    expect(CODIGO).not.toMatch(/glass:\s*[^,\n]*\.props\.glass/)
    expect(CODIGO).not.toMatch(/props\.glass\s*\?\?/)

    // E o padrão é chapado, nos dois níveis.
    expect(timelineMarkerVariants({ marker: "icon" })).toBe(
      timelineMarkerVariants({ marker: "icon", glass: false })
    )
    expect(CODIGO).toMatch(/glass = false/)
  })

  it("16. o bisel do avatar é recuo, e o filho encolhe para dentro dele", () => {
    const vidro = timelineMarkerVariants({ marker: "avatar", glass: true })
    // O recuo é o que **faz** o bisel: sem ele a foto cobre a casca inteira e o
    // vidro fica invisível — a razão pela qual esta forma quase ficou fora.
    expect(vidro).toMatch(/(?:^|\s)p-0\.5(?:\s|$)/)
    // E o `size-full` fica: é ele que faz o filho resolver contra a caixa de
    // conteúdo já descontada da borda e do recuo. Tirá-lo deixaria um avatar de
    // 32 dentro de uma casca de 26, recortado pelo `overflow-hidden`.
    expect(vidro).toContain("[&>*]:size-full")
    expect(vidro).toContain("overflow-hidden")
  })

  it("17. a calha alinha ao topo — o último marcador não se centra", () => {
    // O conector é `flex-1`: com ele não sobra espaço livre, e `justify-content`
    // não decide nada. Sem ele — no último item — um `justify-center` centrava
    // o marcador sozinho na altura da calha: medido, **23,44px** abaixo do
    // centro do título, contra 0 nos outros três. O defeito só existia na
    // última linha de cada trilha, que é o que o fez atravessar a rodada 69.
    //
    // Quem alinha o marcador é `MARCADOR_OFFSET`. Um `justify` que só age
    // quando falta um irmão sobrescreve a fórmula pelas costas.
    const calhas = CODIGO.match(
      /flex shrink-0 items-center justify-\w+ \[flex-direction/g
    ) ?? []
    expect(calhas.length, "as duas calhas — do evento e da faixa").toBe(2)
    for (const c of calhas) expect(c).toContain("justify-start")

    // E o poço **mantém** o dele: ali `justify-center` centra o glifo dentro do
    // marcador, que é outro eixo e está certo.
    expect(CODIGO).toContain(
      '"flex shrink-0 items-center justify-center rounded-full"'
    )
  })

  it("18. a medida do marcador mora no item, e o conteúdo a enxerga", () => {
    // A raiz publica `--tl-marker` como largura da **calha**, uniforme para a
    // faixa de data alinhar. Mas o deslocamento vertical e a centragem
    // horizontal precisam da medida do marcador **renderizado** — e as duas
    // divergem no item que sobrescreve o `marker`: um ponto de 10px numa
    // trilha de poço lia 32 e saía 6,38px acima do centro do título.
    //
    // Ela mora no `<li>` e não no marcador porque o conteúdo é **irmão** do
    // marcador, e custom property não atravessa para o lado.
    expect(CODIGO).toMatch(/const MEDIDA_DO_MARCADOR/)
    expect(CODIGO).toMatch(/MEDIDA_DO_MARCADOR\[forma\]/)
    for (const m of MARCADORES) {
      expect(
        timelineMarkerVariants({ marker: m }),
        `${m} não pode declarar a medida no marcador — o conteúdo não a veria`
      ).not.toContain("[--tl-marker:")
    }
    expect(timelineVariants({ orientation: "vertical" })).toContain(
      "[--tl-rail-w:var(--tl-marker)]"
    )
  })

  it("19. na horizontal o texto se centra no marcador; na vertical é no-op", () => {
    // Medido antes: o centro da caixa de texto ficava a **161,4px** do centro
    // do marcador — o olho lia a palavra pendurada na trilha em vez de presa
    // ao evento. É o defeito que o `Stepper` mediu em 127px.
    const h = timelineVariants({ orientation: "horizontal" })
    const v = timelineVariants({ orientation: "vertical" })

    expect(h).toContain("[--tl-content-center:1]")
    expect(h).toContain("[--tl-content-tx:-50%]")
    expect(h).toContain("[--tl-content-align:center]")
    // `max-content` é o que encolhe a caixa até o texto; sem isso ela ocupa a
    // célula inteira e não há o que centrar.
    expect(h).toContain("[--tl-content-w:max-content]")

    // Na vertical os quatro são o neutro, e o `translate` é **`none`** e não
    // `0`: qualquer valor cria bloco de contenção e mudaria o significado de
    // um filho absoluto que a tela ponha no conteúdo.
    expect(v).toContain("[--tl-content-center:0]")
    expect(v).toContain("[--tl-content-tx:none]")
    expect(v).toContain("[--tl-content-align:start]")
    expect(v).toContain("[--tl-content-w:auto]")

    // O recuo é `calc(medida/2 * centro)` **no conteúdo**, e não uma variável
    // pronta da raiz: `var(--tl-marker)` precisa resolver no item, com a
    // medida do marcador dele.
    expect(CODIGO).toContain(
      "[margin-inline-start:calc(var(--tl-marker)/2*var(--tl-content-center))]"
    )

    // As duas orientações declaram o mesmo conjunto: uma que faltasse de um
    // lado só falharia calada, e num eixo só.
    const vars = (o: "vertical" | "horizontal") =>
      new Set(
        [...timelineVariants({ orientation: o }).matchAll(/\[(--tl-[a-z-]+):/g)].map(
          (m) => m[1]
        )
      )
    expect([...vars("vertical")].sort()).toStrictEqual([...vars("horizontal")].sort())
  })

  it("11. o `cva` da raiz vem primeiro — o `ds:catalog` lê só o primeiro", () => {
    // O `Item` passou uma rodada inteira reportando os eixos do grupo como se
    // fossem os dele, por causa da ordem no arquivo. Escrever o comentário
    // "este é o primeiro de propósito" não basta: nesta mesma rodada ele foi
    // escrito acima do `cva` errado, e o catálogo saiu reportando `tone`.
    const ordem = [...CODIGO.matchAll(/const (\w+) = cva\(/g)].map((m) => m[1])
    expect(ordem[0]).toBe("timelineVariants")

    // E os três eixos da raiz são de fato três eixos: cada um muda a string.
    const base = timelineVariants({})
    expect(timelineVariants({ orientation: "horizontal" })).not.toBe(base)
    expect(timelineVariants({ size: "lg" })).not.toBe(base)
    expect(timelineVariants({ marker: "icon" })).not.toBe(base)
  })

  it("10. os sete tons publicam as três variáveis, e o poço desfaz o colapso", () => {
    expect(TIMELINE_TONES).toHaveLength(7)

    for (const tone of TIMELINE_TONES) {
      const s = timelineToneVariants({ tone })
      for (const v of ["--tl-fill", "--tl-ink", "--tl-well"]) {
        expect(s, `${tone} não publica ${v}`).toContain(`[${v}:`)
      }
    }

    // `--income` é declarado como `var(--success)`, então na cor cheia os dois
    // saem idênticos — é o colapso que o catálogo documentava. Na família
    // `-muted` eles divergem, e é por isso que o poço é onde sete tons rendem
    // sete cores.
    const poço = (t: (typeof TIMELINE_TONES)[number]) =>
      timelineToneVariants({ tone: t }).match(/\[--tl-well:([^\]]+)\]/)?.[1]
    expect(poço("income")).not.toBe(poço("success"))
    expect(poço("expense")).not.toBe(poço("destructive"))

    // E o ponto usa a cor cheia, o poço usa a superfície tingida com a tinta
    // dela — nunca o contrário.
    expect(timelineMarkerVariants({ marker: "dot" })).toContain("var(--tl-fill)")
    expect(timelineMarkerVariants({ marker: "icon" })).toContain("var(--tl-well)")
    expect(timelineMarkerVariants({ marker: "icon" })).toContain("var(--tl-ink)")
    // O avatar não tinge: a identidade traz a cor dela.
    expect(timelineMarkerVariants({ marker: "avatar" })).not.toContain("--tl-well)")
    for (const m of MARCADORES) expect(timelineMarkerVariants({ marker: m })).toBeTruthy()
  })
})
