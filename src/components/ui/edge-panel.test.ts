import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * A régua do painel de borda, trancada.
 *
 * O arquivo não tinha teste nenhum até o eixo `floating` entrar — o único que o
 * tocava era `glass.test.ts`, que só verifica que ele veste a placa modal.
 *
 * Cada asserção aqui nomeia o defeito que a produziu, e as sete foram
 * verificadas **reintroduzindo** esse defeito. É o procedimento que
 * `glass.test.ts` e `scroll-fade.test.ts` já usam, e é o único jeito de saber
 * que a asserção testa o código e não o comentário.
 *
 * Zero render: tudo lê o fonte.
 */

const ler = (nome: string) =>
  readFileSync(join(process.cwd(), `src/components/ui/${nome}.tsx`), "utf8")

/** Os comentários citam de propósito o que o arquivo deixou de fazer. */
const semComentarios = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1")

const CODIGO = semComentarios(ler("edge-panel"))
const SHEET = semComentarios(ler("sheet"))

/** Só o `cva` — o único do arquivo, então o `ds:catalog` lê este. */
const CVA = CODIGO.slice(
  CODIGO.indexOf("const edgePanelContentVariants"),
  CODIGO.indexOf("const EDGE_PANEL_OVERLAY_CLASS")
)

const fatia = (abre: string, fecha: string) =>
  CVA.slice(CVA.indexOf(abre), CVA.indexOf(fecha))

const EIXO_SIDE = fatia("side: {", "variant: {")
const EIXO_VARIANT = fatia("variant: {", "compoundVariants")
const COMPOSTAS = fatia("compoundVariants", "defaultVariants")

const LADOS = ["top", "right", "bottom", "left"] as const

describe("régua do EdgePanel", () => {
  it("1. `h-full` não aparece no eixo side", () => {
    // Ele era redundante em `flush` — o bloco contentor de um `fixed` é o
    // viewport, então `height: 100%` e o par `top: 0`/`bottom: 0` resolvem no
    // mesmo número. Sob `floating` ele deixa de ser: com `top: 8px` e altura
    // definida o painel mede a tela inteira 8px abaixo e **transborda 8px na
    // base**, com o canto de baixo fora da tela.
    expect(EIXO_SIDE).not.toMatch(/\bh-full\b/)
    // E a altura das laterais vem do par de âncoras, não de uma medida.
    for (const lado of ["right", "left"] as const) {
      const l = EIXO_SIDE.slice(EIXO_SIDE.indexOf(`${lado}:`))
      expect(l, lado).toContain("--edge-panel-gap-block-start")
      expect(l, lado).toContain("--edge-panel-gap-block-end")
    }
  })

  it("2. `default` não é nome de variante", () => {
    // O nome saiu de `Button`, `Input`, `SelectTrigger`, `NativeSelect`,
    // `Container`, `Badge`, `Item` e `Sidebar` por dizer *o padrão* em vez de
    // dizer o que a peça faz.
    expect(CVA).not.toMatch(/\bdefault:/)
    expect(CODIGO).not.toMatch(/variant=["']default["']/)
  })

  it("3. a calha só é declarada pelo floating, e todo uso tem fallback", () => {
    // Duas declarações da mesma propriedade no mesmo elemento — uma na base e
    // uma no `floating` — empatam em especificidade, e quem venceria seria a
    // ordem de emissão do Tailwind. Sem declaração não há disputa, e `flush` é
    // no-op por construção: é o mecanismo de `--glass-ink`.
    const declaracoes = (t: string) => [
      ...t.matchAll(/\[--edge-panel-gap[a-z-]*:/g),
    ].length
    expect(declaracoes(EIXO_VARIANT)).toBe(3)
    expect(declaracoes(CVA) - declaracoes(EIXO_VARIANT)).toBe(0)

    // E o `flush` não declara nada — é o que torna o no-op estrutural.
    const flush = EIXO_VARIANT.slice(
      EIXO_VARIANT.indexOf("flush:"),
      EIXO_VARIANT.indexOf("floating:")
    )
    expect(flush).not.toContain("--edge-panel-gap")

    // Todo uso lê com o próprio `0px`. Sem o fallback, `flush` sairia com
    // `top: ` vazio e a declaração inteira cairia.
    const usos = [...EIXO_SIDE.matchAll(/var\(--edge-panel-gap[a-z-]*[^)]*\)/g)]
    expect(usos.length).toBeGreaterThan(0)
    for (const [uso] of usos) expect(uso, uso).toMatch(/,0px\)$/)
  })

  it("4. o gume é composto, e só sob flush", () => {
    // `floating` desenha as quatro bordas e `flush` desenha uma, que muda com o
    // lado. Empilhar `border` sobre `border-l` e contar com o `twMerge`
    // funciona por acidente — quem vence depende da ordem em que o `cva` emite
    // `side` e `variant`.
    expect(EIXO_SIDE).not.toMatch(/\bborder(-[trbl])?\b/)
    for (const [lado, gume] of [
      ["top", "border-b"],
      ["right", "border-l"],
      ["bottom", "border-t"],
      ["left", "border-r"],
    ] as const) {
      expect(COMPOSTAS, lado).toMatch(
        new RegExp(
          `variant:\\s*"flush",\\s*side:\\s*"${lado}",\\s*class:\\s*"${gume}"`
        )
      )
    }
    // Nenhuma composta fora do encostado: o flutuante fecha a borda sozinho.
    expect(COMPOSTAS).not.toContain('variant: "floating"')
    expect(EIXO_VARIANT.slice(EIXO_VARIANT.indexOf("floating:"))).toContain(
      "border"
    )
  })

  it("5. a área segura entra nas duas verticais e em nenhuma horizontal", () => {
    // Uma calha medida a partir do viewport põe o canto de baixo atrás do
    // indicador de home num iPhone, e o telefone é onde vive o consumidor
    // principal deste componente. A horizontal fica de fora porque
    // `safe-area-inset-left/right` não aparece nenhuma vez no repositório — o
    // dono dessa lacuna é a casca do app, e fechá-la só aqui seria a segunda
    // gramática para a mesma coisa.
    expect(EIXO_VARIANT).toContain("env(safe-area-inset-top,0px)")
    expect(EIXO_VARIANT).toContain("env(safe-area-inset-bottom,0px)")
    expect(CODIGO).not.toMatch(/safe-area-inset-(left|right)/)
  })

  it("6. nenhum realce acende no cursor e fica inerte no dedo", () => {
    // `hover:` compila dentro de `@media (hover: hover)`, então um realce sem
    // par `active:` não existe no telefone. Hoje são zero — é guarda, e existe
    // porque a regra **H** do `ds:audit` varre `className="…"` e não enxerga
    // dentro de `cva()` nem de `cn()`.
    const semPar: string[] = []
    for (const [, classes] of CODIGO.matchAll(
      /"([^"]*hover:(?:bg|shadow)-[^"]*)"/g
    )) {
      for (const familia of ["bg", "shadow"]) {
        const cursor = new RegExp(`(?:^|\\s|:)hover:${familia}-`).test(classes)
        const dedo = new RegExp(`(?:^|\\s|:)active:${familia}-`).test(classes)
        if (cursor && !dedo) semPar.push(`${familia}: ${classes.slice(0, 70)}…`)
      }
    }
    expect(semPar).toEqual([])
  })

  it("7. o Sheet repassa o eixo no desktop e não o deixa vazar para a gaveta", () => {
    // O tipo do `SheetContent` herda o eixo sozinho, por
    // `VariantProps<typeof edgePanelContentVariants>`. Sem destruturar,
    // `variant` cai em `{...props}` e é espalhado no `DrawerPrimitive.Content`
    // do ramo telefone — atributo desconhecido no DOM, com aviso do React.
    // Os cortes são ancorados a partir do início de `SheetContent`: um
    // `indexOf` solto acha o `useSheetSurface()` do `SheetOverlay`, que vem
    // antes no arquivo, e a fatia sai **vazia** — uma asserção que acerta por
    // vazio. Este teste caiu nisso na primeira escrita.
    const inicio = SHEET.indexOf("function SheetContent(")
    expect(inicio).toBeGreaterThan(-1)
    const assinatura = SHEET.slice(
      inicio,
      SHEET.indexOf("const surface = useSheetSurface()", inicio)
    )
    expect(assinatura.length).toBeGreaterThan(0)
    expect(assinatura).toMatch(/^\s*variant,\s*$/m)

    const gaveta = SHEET.slice(
      SHEET.indexOf('if (surface === "drawer")', inicio),
      SHEET.indexOf("<EdgePanelContent", inicio)
    )
    expect(gaveta.length).toBeGreaterThan(0)
    expect(gaveta).not.toContain("variant")

    const desktop = SHEET.slice(SHEET.indexOf("<EdgePanelContent", inicio))
    expect(desktop).toContain("variant={variant}")
  })

  it("8. o cva é único no arquivo — o ds:catalog lê os dois eixos", () => {
    // O catálogo lê o **primeiro** `cva` do fonte. É o defeito que o `Item`
    // registrou com `itemGroupVariants` e a `Sidebar` com o cva do botão de
    // menu; aqui ele não é alcançável enquanto houver um só.
    expect([...CODIGO.matchAll(/\bcva\(/g)].length).toBe(1)
    for (const lado of LADOS) expect(EIXO_SIDE).toContain(`${lado}:`)
  })
})
