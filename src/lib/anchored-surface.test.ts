/**
 * A regra das superfícies ancoradas, trancada por asserção (como `tailwind-hover-
 * policy.test.ts`): `DropdownMenu`, `ContextMenu`, `Menubar` e `Tooltip` abriam com
 * `collisionPadding` 0 e `max-w-…-available-width` existia em 3 arquivos de 11. Os fontes são
 * lidos sem comentários, porque vários citam o que deixaram de fazer. As classes proibidas são
 * montadas por concatenação: o Tailwind varre `.ts` e citar a classe aqui a manteria na folha
 * de estilo.
 */
import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import { ANCHORED_COLLISION_PADDING } from "./anchored-surface"

/**
 * As superfícies que a regra alcança: arquivo → nome da primitiva no Radix. É o alcance
 * declarado e o que o teste itera; uma superfície ancorada nova entra aqui na mesma mudança.
 * Ficam fora: `combobox.tsx` e `date-picker.tsx` (compõem `PopoverContent`), `command.tsx` (não
 * é ancorado; o teto é `--command-list-max-h`) e `navigation-menu.tsx` (sem Popper; o trilho é
 * feito à mão em `medir()`).
 */
const ANCHORED_SURFACES = {
  "popover.tsx": "popover",
  "dropdown-menu.tsx": "dropdown-menu",
  "context-menu.tsx": "context-menu",
  "menubar.tsx": "menubar",
  "select.tsx": "select",
  "tooltip.tsx": "tooltip",
  "hover-card.tsx": "hover-card",
} as const

const UI = join(import.meta.dirname, "..", "components", "ui")
const RAIZ = join(import.meta.dirname, "..")

function fonte(caminho: string) {
  return semComentarios(lerFonte(caminho), "linha-inteira")
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
        // O tooltip escreve o teto dentro de um `min()`, junto do teto de leitura:
        // com duas classes `max-w-*` o twMerge apagaria uma delas.
        expect(src).toMatch(
          new RegExp(`max-w-(\\(|\\[min\\([^\\]]*var\\()--radix-${primitiva}-content-available-width\\)`),
        )
        // Nas listas suspensas o teto de altura mora num `min()` com
        // `--menu-max-h`; o espaço disponível continua valendo.
        expect(src).toMatch(
          new RegExp(`max-h-(\\(|\\[min\\(var\\()--radix-${primitiva}-content-available-height\\)`),
        )
      })

      it("4. não desliga a prevenção de colisão", () => {
        expect(src).not.toMatch(/avoidCollisions=\{?\s*false/)
      })
    })
  }

  it("5. o Select não volta para item-aligned", () => {
    // Naquele modo `collisionPadding`, `avoidCollisions`, `side` e `sideOffset` não existem no
    // Radix: a superfície ignora a borda da janela.
    const src = fonte(join(UI, "select.tsx"))
    expect(src).toContain('position = "popper"')
    expect(src).not.toContain('position = "item-aligned"')
    // A altura do viewport não volta a ser a do gatilho (o painel abria com 36px em vez dos 92
    // do conteúdo).
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
    // É a única superfície ancorada que não é portalizada: o viewport é filho da raiz, então
    // ele sobe a árvore procurando quem recorta (um clamp contra a janela deixava 9px do painel
    // fora no `Preview`).
    const src = fonte(join(UI, "navigation-menu.tsx"))
    expect(src).toContain('overflowX !== "visible"')
    expect(src).toContain("--navigation-menu-panel-max-w")
    // O teto tem de descer da casca: declarado dentro do `cva` do painel, o valor local vence o
    // herdado e a medida nunca chega.
    const cvaDoPainel = src.slice(
      src.indexOf("const navigationMenuPanelVariants"),
      src.indexOf("const navigationMenuLinkVariants")
    )
    expect(cvaDoPainel).toContain("max-w-(--navigation-menu-panel-max-w)")
    expect(cvaDoPainel).not.toContain("[--navigation-menu-panel-max-w:")
  })

  it("8. nenhuma tela decide a geometria de colisão", () => {
    // A folga da borda é do sistema: nenhuma chamada a escreve, nem com `undefined`, que
    // anularia o default e devolveria a folga a zero.
    const fora = todosOsTsx(RAIZ, ["components/ui", "app/designsystem"])
    const culpados = fora.filter((f) => {
      const src = fonte(f)
      return /collisionPadding=/.test(src) || /position="popper"/.test(src)
    })
    expect(culpados).toEqual([])
  })
})
