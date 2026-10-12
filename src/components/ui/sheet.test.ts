import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { realcesSemParDeToque } from "@/test/regras"

/**
 * A régua da folha, trancada. Cada asserção nomeia o defeito que a produziu e foi verificada
 * reintroduzindo-o (o procedimento de `glass.test.ts` e `scroll-fade.test.ts`). Zero render:
 * tudo lê o fonte.
 */

const ler = (nome: string) => lerFonte(`src/components/ui/${nome}.tsx`)

/** Os comentários citam de propósito o que o arquivo deixou de fazer. */
const CODIGO = semComentarios(ler("sheet"), "fora-de-url")

/** Só o `cva` — o único do arquivo, então o `ds:catalog` lê este. */
const CVA = CODIGO.slice(
  CODIGO.indexOf("const sheetContentVariants"),
  CODIGO.indexOf("type SheetSurface")
)

const fatia = (abre: string, fecha: string) =>
  CVA.slice(CVA.indexOf(abre), CVA.indexOf(fecha))

const EIXO_SIDE = fatia("side: {", "variant: {")
const EIXO_VARIANT = fatia("variant: {", "compoundVariants")
const COMPOSTAS = fatia("compoundVariants", "defaultVariants")

const LADOS = ["top", "right", "bottom", "left"] as const

describe("régua do Sheet", () => {
  it("1. `h-full` não aparece no eixo side", () => {
    // Em `flush` ele é redundante (o bloco contentor de um `fixed` é o viewport); sob
    // `floating`, com `top: 8px` e altura definida, o painel transborda 8px na base.
    expect(EIXO_SIDE).not.toMatch(/\bh-full\b/)
    // E a altura das laterais vem do par de âncoras, não de uma medida.
    for (const lado of ["right", "left"] as const) {
      // A fatia para no lado seguinte: ir até o fim do eixo deixava `right`
      // passar com os tokens de `left`.
      const i = EIXO_SIDE.indexOf(`${lado}:`)
      expect(i, lado).toBeGreaterThan(-1)
      const depois = LADOS.map((o) => EIXO_SIDE.indexOf(`${o}:`, i + 1)).filter((n) => n > i)
      const l = EIXO_SIDE.slice(i, depois.length ? Math.min(...depois) : undefined)
      expect(l, lado).toContain("--sheet-gap-block-start")
      expect(l, lado).toContain("--sheet-gap-block-end")
    }
  })

  it("2. `default` não é nome de variante", () => {
    // O nome `default` não volta: dizia o padrão em vez do que a peça faz.
    expect(CVA).not.toMatch(/\bdefault:/)
    expect(CODIGO).not.toMatch(/variant=["']default["']/)
  })

  it("3. a calha só é declarada pelo floating, e todo uso tem fallback", () => {
    // Duas declarações da mesma propriedade no mesmo elemento — uma na base e
    // uma no `floating` — empatam em especificidade, e quem venceria seria a
    // ordem de emissão do Tailwind. Sem declaração não há disputa, e `flush` é
    // no-op por construção: é o mecanismo de `--glass-ink`.
    const declaracoes = (t: string) => [
      ...t.matchAll(/\[--sheet-gap[a-z-]*:/g),
    ].length
    expect(declaracoes(EIXO_VARIANT)).toBe(3)
    expect(declaracoes(CVA) - declaracoes(EIXO_VARIANT)).toBe(0)

    // E o `flush` não declara nada — é o que torna o no-op estrutural.
    const flush = EIXO_VARIANT.slice(
      EIXO_VARIANT.indexOf("flush:"),
      EIXO_VARIANT.indexOf("floating:")
    )
    expect(flush).not.toContain("--sheet-gap")

    // Todo uso lê com o próprio `0px`. Sem o fallback, `flush` sairia com
    // `top: ` vazio e a declaração inteira cairia.
    const usos = [...EIXO_SIDE.matchAll(/var\(--sheet-gap[a-z-]*[^)]*\)/g)]
    expect(usos.length).toBeGreaterThan(0)
    for (const [uso] of usos) expect(uso, uso).toMatch(/,0px\)$/)
  })

  it("4. o gume é composto, e só sob flush", () => {
    // `floating` desenha as quatro bordas e `flush` desenha uma, que muda com o
    // lado. Empilhar `border` sobre `border-l` e contar com o `twMerge`
    // funciona por acidente — quem vence depende da ordem em que o `cva` emite
    // `side` e `variant`.
    expect(EIXO_SIDE).not.toMatch(/\bborder(-[trbl])?\b/)
    // E a aba: a cópia da placa para fora da tela, que cobre o quique da mola.
    for (const [lado, gume, aba] of [
      ["top", "border-b", "0_-4rem_0"],
      ["right", "border-l", "4rem_0_0"],
      ["bottom", "border-t", "0_4rem_0"],
      ["left", "border-r", "-4rem_0_0"],
    ] as const) {
      expect(COMPOSTAS, lado).toContain(
        `{ variant: "flush", side: "${lado}", class: "${gume} shadow-[${aba}_var(--color-popover),var(--shadow-lg)]" }`
      )
    }
    // Nenhuma composta fora do encostado: o flutuante fecha a borda sozinho com o anel das
    // placas soltas, e não com `border`.
    expect(COMPOSTAS).not.toContain('variant: "floating"')
    const flutuante = EIXO_VARIANT.slice(EIXO_VARIANT.indexOf("floating:"))
    expect(flutuante).toContain("ring-1 ring-foreground/10")
    expect(flutuante).not.toMatch(/\bborder\b/)
  })

  it("5. a área segura entra nas duas verticais e em nenhuma horizontal", () => {
    // Uma calha medida a partir do viewport põe o canto de baixo atrás do indicador de home num
    // iPhone. A horizontal fica de fora: `safe-area-inset-left/right` não aparece no
    // repositório, e é lacuna da casca do app.
    expect(EIXO_VARIANT).toContain("env(safe-area-inset-top,0px)")
    expect(EIXO_VARIANT).toContain("env(safe-area-inset-bottom,0px)")
    expect(CODIGO).not.toMatch(/safe-area-inset-(left|right)/)
  })

  it("6. nenhum realce acende no cursor e fica inerte no dedo", () => {
    // `hover:` compila dentro de `@media (hover: hover)`, então um realce sem par `active:` não
    // existe no telefone; a regra H do `ds:audit` não enxerga dentro de `cva()` nem de `cn()`.
    expect(realcesSemParDeToque(CODIGO)).toEqual([])
  })

  it("7. o eixo vale no ramo painel e não vaza para a gaveta", () => {
    // O tipo do `SheetContent` herda o eixo por `VariantProps`; sem destruturar, `side` e
    // `variant` caem em `{...props}` e vão ao `DrawerPrimitive.Content`. Os cortes são
    // ancorados a partir do início de `SheetContent`: um `indexOf` solto acha o
    // `useSheetSurface()` do `SheetOverlay` e a fatia sai vazia.
    const inicio = CODIGO.indexOf("function SheetContent(")
    expect(inicio).toBeGreaterThan(-1)
    const assinatura = CODIGO.slice(
      inicio,
      CODIGO.indexOf("const surface = useSheetSurface()", inicio)
    )
    expect(assinatura.length).toBeGreaterThan(0)
    expect(assinatura).toMatch(/^\s*variant,\s*$/m)
    expect(assinatura).toMatch(/^\s*side = "right",\s*$/m)

    const painel = CODIGO.indexOf("<SheetPrimitive.Portal", inicio)
    expect(painel).toBeGreaterThan(-1)
    const gaveta = CODIGO.slice(
      CODIGO.indexOf('if (surface === "drawer")', inicio),
      painel
    )
    expect(gaveta.length).toBeGreaterThan(0)
    expect(gaveta).not.toContain("variant")
    // `side` na gaveta é o literal `data-side="bottom"`, e nunca a prop.
    expect(gaveta).not.toMatch(/side=\{side\}/)

    const desktop = CODIGO.slice(painel)
    expect(desktop).toContain('sheetContentVariants({ side, variant, size: lateral ? size : "none" })')
  })

  it("9. a superfície é eixo, e `auto` continua sendo o padrão de todo mundo", () => {
    // A navegação vira painel no telefone e a regra das outras folhas não muda: o eixo existe e
    // o padrão é `auto`; se virar `panel`, as ~40 folhas param de virar gaveta.
    const modo = CODIGO.slice(
      CODIGO.indexOf("type SheetSurfaceMode"),
      CODIGO.indexOf("const SheetSurfaceContext")
    )
    expect(modo).toContain('"auto" | "panel"')
    // Nada de forçar a gaveta: uma superfície que é gaveta em toda largura já
    // tem arquivo, e é o `Drawer`.
    expect(modo).not.toContain('"drawer"')

    const raiz = CODIGO.slice(
      CODIGO.indexOf("function Sheet("),
      CODIGO.indexOf("function SheetTrigger(")
    )
    expect(raiz.length).toBeGreaterThan(0)
    expect(raiz).toMatch(/surface:\s*modo = "auto"/)
    // `auto` é o que deriva; `panel` fixa. A derivação continua vindo da
    // largura, e não de um `if` na tela.
    expect(raiz).toContain('isMobile && modo === "auto" ? "drawer" : "panel"')
    expect(raiz).toContain("useIsMobile()")

    // O valor do painel deixou de se chamar `sheet` — circular dentro de um
    // componente chamado `Sheet`, e impossível de usar como valor de prop.
    expect(CODIGO).not.toMatch(/surface === "sheet"|data-surface="sheet"/)
    expect(CODIGO).toContain('data-surface="panel"')
  })

  it("8. o cva é único no arquivo — o ds:catalog lê os dois eixos", () => {
    // O catálogo lê o **primeiro** `cva` do fonte. É o defeito que o `Item`
    // registrou com `itemGroupVariants` e a `Sidebar` com o cva do botão de
    // menu; aqui ele não é alcançável enquanto houver um só.
    expect([...CODIGO.matchAll(/\bcva\(/g)].length).toBe(1)
    for (const lado of LADOS) expect(EIXO_SIDE).toContain(`${lado}:`)
  })
})
