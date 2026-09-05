/**
 * A regra das superfícies ancoradas, trancada por asserção.
 *
 * Ela existe pelo mesmo motivo que
 * [`tailwind-hover-policy.test.ts`](./tailwind-hover-policy.test.ts): uma
 * política do design system se verifica por asserção, e não por captura de
 * tela. O defeito que ela guarda foi medido antes de existir — quatro
 * superfícies (`DropdownMenu`, `ContextMenu`, `Menubar`, `Tooltip`) abriam com
 * `collisionPadding` **0**, encostando na borda da janela, e
 * `max-w-…-available-width` existia em **3 arquivos de 11**.
 *
 * **Os fontes são lidos sem comentários.** Vários deles citam de propósito o
 * que deixaram de fazer — o `select.tsx` explica por extenso a classe
 * a classe de altura que saiu do viewport, e o `navigation-menu.tsx` fala do
 * `collisionPadding` do `Popover`. Assertar sobre o texto cru testaria o
 * comentário, não o código; é a mesma correção que a rodada do gráfico fez.
 *
 * E as classes proibidas são **montadas por concatenação**, nunca escritas por
 * extenso: o Tailwind varre `.ts` junto com o `.tsx`, e citar a classe aqui a
 * faria voltar para a folha de estilo — verificado, ela continuou emitida
 * depois de sair do JSX, mantida viva só por este arquivo. É a armadilha que
 * esta base documenta em três lugares, usada a favor.
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { ANCHORED_COLLISION_PADDING, ANCHORED_SURFACES } from "./anchored-surface"

const UI = join(import.meta.dirname, "..", "components", "ui")
const RAIZ = join(import.meta.dirname, "..")

function fonte(caminho: string) {
  return readFileSync(caminho, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
}

function todosOsTsx(dir: string, fora: string[] = []): string[] {
  const saida: string[] = []
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome)
    if (fora.some((f) => caminho.includes(f))) continue
    if (statSync(caminho).isDirectory()) saida.push(...todosOsTsx(caminho, fora))
    else if (nome.endsWith(".tsx")) saida.push(caminho)
  }
  return saida
}

describe("toda superfície ancorada cabe inteira na janela", () => {
  it("1. a folga é uma só, e é um número", () => {
    expect(ANCHORED_COLLISION_PADDING).toBe(8)
    expect(Number.isInteger(ANCHORED_COLLISION_PADDING)).toBe(true)
  })

  for (const [arquivo, primitiva] of Object.entries(ANCHORED_SURFACES)) {
    describe(arquivo, () => {
      const src = fonte(join(UI, arquivo))

      it("2. declara a folga vinda da régua, e nunca um número", () => {
        expect(src).toContain("collisionPadding = ANCHORED_COLLISION_PADDING")
        // O default sozinho não faz nada: sem repassar ao Radix, o prop é
        // engolido pelo `...props`. Foi o que o `DropdownMenuContent` fez na
        // primeira escrita desta regra.
        expect(src).toContain("collisionPadding={collisionPadding}")
        expect(src).not.toMatch(/collisionPadding=\{\s*\d/)
        expect(src).not.toMatch(/collisionPadding\s*=\s*\d/)
      })

      it("3. encolhe para o espaço disponível nos dois eixos", () => {
        // Escritas por extenso, com o nome da própria primitiva: o Tailwind
        // varre o código como texto, e uma classe montada em runtime nunca
        // chega ao CSS.
        expect(src).toContain(`max-w-(--radix-${primitiva}-content-available-width)`)
        expect(src).toContain(`max-h-(--radix-${primitiva}-content-available-height)`)
      })

      it("4. não desliga a prevenção de colisão", () => {
        expect(src).not.toMatch(/avoidCollisions=\{?\s*false/)
      })
    })
  }

  it("5. o Select não volta para item-aligned", () => {
    // Naquele modo `collisionPadding`, `avoidCollisions`, `side` e `sideOffset`
    // **não existem** no Radix: a superfície ignora a borda da janela. Era o
    // padrão, e 9 das 36 chamadas do app já escreviam `position="popper"` à mão
    // para escapar dele.
    const src = fonte(join(UI, "select.tsx"))
    expect(src).toContain('position = "popper"')
    expect(src).not.toContain('position = "item-aligned"')
    // E a altura do viewport não volta a ser a do gatilho: medido, o painel
    // abria com 36px — a caixa do gatilho — em vez dos 92 do conteúdo.
    expect(src).not.toContain("h-(--radix-select-trigger" + "-height)")
  })

  it("6. o NavigationMenu lê a régua em vez de copiar o número", () => {
    // Ele não é Popper — o Radix não faz colisão nesta primitiva —, então o
    // trilho é à mão. O número, não.
    const src = fonte(join(UI, "navigation-menu.tsx"))
    expect(src).toContain("ANCHORED_COLLISION_PADDING")
    expect(src).not.toMatch(/const folga = \d/)
  })

  it("7. o NavigationMenu clampa ao retângulo que o recorta, não à janela", () => {
    // Ele é a **única** superfície ancorada que não é portalizada: as outras
    // vão para o `body` e escapam de qualquer `overflow`, e o viewport daqui é
    // filho da raiz. Medido dentro do `Preview` do catálogo — janela de 0 a
    // 420, recorte real de 17 a 403 —, um clamp contra a janela deixava 9px do
    // painel fora. Ele sobe a árvore procurando quem recorta.
    const src = fonte(join(UI, "navigation-menu.tsx"))
    expect(src).toContain('overflowX !== "visible"')
    expect(src).toContain("--navigation-menu-panel-max-w")
    // O teto tem de **descer da casca**: declarado dentro do cva do painel, o
    // valor local vence o herdado e a medida nunca chega — medido, o
    // `max-width` computado saía 884px enquanto a raiz publicava 304.
    const cvaDoPainel = src.slice(
      src.indexOf("const navigationMenuPanelVariants"),
      src.indexOf("const navigationMenuLinkVariants")
    )
    expect(cvaDoPainel).toContain("max-w-(--navigation-menu-panel-max-w)")
    expect(cvaDoPainel).not.toContain("[--navigation-menu-panel-max-w:")
  })

  it("8. nenhuma tela decide a geometria de colisão", () => {
    // A folga da borda é do sistema. Eram 12 chamadas em 8 arquivos, com cinco
    // grafias — incluindo um `undefined` que anulava o default e devolvia a
    // folga a zero.
    const fora = todosOsTsx(RAIZ, ["components/ui", "app/designsystem"])
    const culpados = fora.filter((f) => {
      const src = fonte(f)
      return /collisionPadding=/.test(src) || /position="popper"/.test(src)
    })
    expect(culpados).toEqual([])
  })
})
