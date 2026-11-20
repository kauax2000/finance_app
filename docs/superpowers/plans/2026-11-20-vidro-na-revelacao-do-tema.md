# O vidro na revelação do tema — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No iPhone, durante a revelação circular do tema (`ThemeToggle`), a barra de baixo (e todo vidro `.glass-surface` à vista) continua de vidro, sem ficar transparente. Nada muda no visual nem na animação.

**Causa raiz (provada no WebKit do Simulador, página mínima em scratchpad):** o WebKit não desenha `backdrop-filter` dentro da foto da View Transition. A pílula entra nas fotos velha e nova só com a tinta a 60% (`bottomBarTintClassName`), e a página aparece nítida atrás dela. O CSS `.theme-reveal::view-transition-old/new(root) { animation: none }` vale no WebKit (conferido): o esmaecimento não é a causa.

**Correção (provada na mesma página):** durante a troca, cada vidro visível ganha um `view-transition-name` próprio. O borrão passa a ser desenhado no `::view-transition-group` dele (mesmo `backdrop-filter` e mesmo raio do elemento), sobre a foto da página. As duas fotos do vidro ficam, e o círculo da revelação passa por elas como pela página: o mesmo `circle()` na nova e o recorte inverso (`path(evenodd, …)`, retângulo menos o círculo) na velha. O nome só existe durante a troca (nome permanente quebra o vidro, regra do AGENTS.md).

**Architecture:** um módulo novo em `src/lib/vidro-na-revelacao.ts` (sem `cva`, fora de `ui/`), usado pelo `trocar` do `ThemeToggle`. A regra do commit `d90aa91e` (fundo opaco na troca) sai do `globals.css`: mudava o visual e não pegava.

**Tech Stack:** Next 16, React, View Transitions API, Web Animations API, Vitest (ambiente `node`, testes por leitura de fonte com `@/test/fonte`).

---

### Task 1: O módulo `vidro-na-revelacao`

**Files:**
- Create: `src/lib/vidro-na-revelacao.ts`
- Test: `src/lib/vidro-na-revelacao.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest"
import { recorteDeFora } from "./vidro-na-revelacao"

describe("o recorte de fora do círculo", () => {
    it("é retângulo menos círculo, por evenodd", () => {
        const p = recorteDeFora(362, 64, 50, -500, 300)
        expect(p.startsWith('path(evenodd, "')).toBe(true)
        // O retângulo passa 100px da caixa: a sombra do vidro não é cortada.
        expect(p).toContain("M-100 -100H462V164H-100Z")
        // O círculo, em dois arcos, com centro e raio pedidos.
        expect(p).toContain("M-250 -500a300 300 0 1 0 600 0a300 300 0 1 0 -600 0Z")
    })

    it("tem os mesmos comandos em qualquer raio, senão o navegador não interpola", () => {
        const comandos = (s: string) => s.replace(/-?\d+(\.\d+)?/g, "n")
        expect(comandos(recorteDeFora(362, 64, 50, -500, 0))).toBe(
            comandos(recorteDeFora(362, 64, 50, -500, 900)),
        )
    })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/vidro-na-revelacao.test.ts`
Expected: FAIL (módulo não existe)

- [ ] **Step 3: Write the module**

```ts
/**
 * O vidro na revelação do tema. No WebKit (iPhone) a foto da View Transition não desenha
 * `backdrop-filter`: na troca de tema a barra de baixo (e todo `.glass-surface` à vista) entrava
 * nas duas fotos só com a tinta, e a página aparecia nítida atrás dela. Durante a troca, cada
 * vidro visível ganha um nome próprio: o borrão passa a ser desenhado no grupo dele, sobre a foto
 * da página, e o círculo da revelação passa pelas duas fotos dele como pela página. O nome só
 * existe durante a troca: `view-transition-name` permanente tira o borrão (AGENTS.md).
 */

export type Vidro = { el: HTMLElement; nome: string; rect: DOMRect }

/** Folga do retângulo além da caixa, para a sombra do vidro não ser cortada. */
const FOLGA = 100

/** O que fica fora do círculo, na caixa do vidro: retângulo menos círculo. Os comandos não mudam com o raio, então o navegador interpola. */
export function recorteDeFora(w: number, h: number, cx: number, cy: number, r: number) {
    const ret = `M${-FOLGA} ${-FOLGA}H${w + FOLGA}V${h + FOLGA}H${-FOLGA}Z`
    const circ = `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`
    return `path(evenodd, "${ret} ${circ}")`
}

function borrao(estilo: CSSStyleDeclaration) {
    const f = estilo.backdropFilter || estilo.getPropertyValue("-webkit-backdrop-filter")
    return f && f !== "none" ? f : null
}

/** Dá nome a cada vidro à vista e devolve como desfazer. Chame antes de `startViewTransition`. */
export function nomearVidros(doc: Document) {
    const janela = doc.defaultView ?? window
    const vidros: Vidro[] = []
    const regras: string[] = []
    doc.querySelectorAll<HTMLElement>(".glass-surface").forEach((el) => {
        const rect = el.getBoundingClientRect()
        const naTela =
            rect.width > 0 &&
            rect.height > 0 &&
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < janela.innerHeight &&
            rect.left < janela.innerWidth
        if (!naTela) return
        if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return
        const estilo = janela.getComputedStyle(el)
        const filtro = borrao(estilo)
        if (!filtro) return
        const nome = `vidro-${vidros.length}`
        el.style.viewTransitionName = nome
        vidros.push({ el, nome, rect })
        regras.push(
            `::view-transition-group(${nome}){animation:none;border-radius:${estilo.borderRadius};-webkit-backdrop-filter:${filtro};backdrop-filter:${filtro}}`,
            `::view-transition-old(${nome}),::view-transition-new(${nome}){animation:none;mix-blend-mode:normal}`,
        )
    })
    const folha = doc.createElement("style")
    folha.textContent = regras.join("\n")
    doc.head.append(folha)
    return {
        vidros,
        desfazer() {
            folha.remove()
            for (const { el } of vidros) el.style.viewTransitionName = ""
        },
    }
}

/** O círculo da revelação passando pelas fotos de cada vidro. Chame no `ready`, com o mesmo tempo da raiz. */
export function revelarVidros(
    html: HTMLElement,
    vidros: Vidro[],
    x: number,
    y: number,
    raio: number,
    tempo: KeyframeAnimationOptions,
) {
    for (const { nome, rect } of vidros) {
        const cx = x - rect.left
        const cy = y - rect.top
        html.animate(
            { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${raio}px at ${cx}px ${cy}px)`] },
            { ...tempo, pseudoElement: `::view-transition-new(${nome})` },
        )
        html.animate(
            { clipPath: [recorteDeFora(rect.width, rect.height, cx, cy, 0), recorteDeFora(rect.width, rect.height, cx, cy, raio)] },
            { ...tempo, pseudoElement: `::view-transition-old(${nome})` },
        )
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/vidro-na-revelacao.test.ts`
Expected: PASS

### Task 2: O `ThemeToggle` usa o módulo, e a regra opaca sai

**Files:**
- Modify: `src/components/ui/theme-toggle.tsx` (função `trocar`, ~linha 138–179)
- Modify: `src/app/globals.css` (apagar o bloco `@media (width < 48rem) { .theme-reveal .glass-surface:is(…) {…} }` e o comentário dele, logo depois de `.theme-reveal::view-transition-new(root)`)
- Test: `src/components/ui/theme-toggle.test.ts`

- [ ] **Step 1: Write the failing test** — no fim do `describe` de `theme-toggle.test.ts`:

```ts
    it("o vidro à vista ganha nome só durante a revelação (no WebKit a foto não desenha borrão)", () => {
        expect(CODIGO).toContain("nomearVidros(document)")
        expect(CODIGO).toContain("revelarVidros(html, vidros.vidros, x, y, raio, REVELACAO)")
        expect(CODIGO).toMatch(/finished\.finally\(\(\) => \{[^}]*vidros\.desfazer\(\)/)
        const css = lerFonte("src/app/globals.css")
        expect(css).not.toContain(".theme-reveal\n    .glass-surface")
    })
```

- [ ] **Step 2: Run it, expect FAIL**

Run: `npx vitest run src/components/ui/theme-toggle.test.ts`

- [ ] **Step 3: Implement** — em `trocar`, importar `{ nomearVidros, revelarVidros }` de `@/lib/vidro-na-revelacao`; logo depois de `html.classList.add("theme-reveal")`: `const vidros = nomearVidros(document)`; no `.then` do `ready`, depois do `html.animate` da raiz: `revelarVidros(html, vidros.vidros, x, y, raio, REVELACAO)`; trocar o `finished.finally` por `transicao.finished.finally(() => { html.classList.remove("theme-reveal"); vidros.desfazer() })`. Atualizar o comentário de `REVELACAO` com uma linha citando o vidro. Apagar a regra opaca do `globals.css`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/ui/theme-toggle.test.ts src/lib/vidro-na-revelacao.test.ts src/components/ui/glass.test.ts && npx tsc --noEmit && npx eslint src/components/ui/theme-toggle.tsx src/lib/vidro-na-revelacao.ts`
Expected: tudo verde.

### Task 2b: Um toque, uma transição

**Causa raiz 2 (provada com instrumentação no Simulador):** um toque numa parada chama `trocar` duas vezes, com ~22ms de diferença: o `onFocus` do `RadioGroupPrimitive.Root` (o toque foca a parada) e o `onValueChange` do clique (o tema ainda não trocou, então o Radix escolhe de novo). A segunda `startViewTransition` pula a primeira, e o `finished.finally` da primeira tira `theme-reveal` e os nomes dos vidros antes da foto da segunda: o WebKit aplica o esmaecimento padrão (`-ua-view-transition-fade-out/in` + `plus-lighter`) e a página e a barra ficam lavadas. Instrumentação: `trocas=dark@6906 dark@6928`, `cls=h-full,antialiased,dark` (sem `theme-reveal`) com as animações da transição vivas.

**Files:**
- Modify: `src/components/ui/theme-toggle.tsx` (função `trocar`)
- Modify: `src/lib/vidro-na-revelacao.ts` (uma folha só, por `id`)
- Test: `src/components/ui/theme-toggle.test.ts`, `src/lib/vidro-na-revelacao.test.ts`

- [ ] **Step 1: Failing tests** — em `theme-toggle.test.ts`, no `describe`:

```ts
    it("um toque é uma transição: o foco e o clique da mesma parada não abrem duas", () => {
        // O toque foca a parada (o `onFocus` escolhe) e depois clica (o `onValueChange`): a segunda
        // transição pulava a primeira, e o `finally` dela tirava o `.theme-reveal` no meio da segunda.
        expect(CODIGO).toMatch(/if \(revelacao\.current\?\.valor === valor\) return/)
        expect(CODIGO).toMatch(/finished\.finally\(\(\) => \{\s*if \(revelacao\.current !== esta\) return/)
    })
```

e em `vidro-na-revelacao.test.ts`:

```ts
import { lerFonte } from "@/test/fonte"

describe("a folha dos vidros", () => {
    it("é uma só, por id: uma troca pulada não deixa folha órfã", () => {
        const fonte = lerFonte("src/lib/vidro-na-revelacao.ts")
        expect(fonte).toContain('const ID_DA_FOLHA = "vidro-na-revelacao"')
        expect(fonte).toContain("doc.getElementById(ID_DA_FOLHA)")
    })
})
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement.**
  - `theme-toggle.tsx`: `const revelacao = useRef<{ valor: Tema } | null>(null)` junto dos outros refs. No caminho da revelação de `trocar` (depois do `return` sem API), primeira linha: `if (revelacao.current?.valor === valor) return` com um comentário de uma linha (o toque chama pelo foco e pelo clique). Antes de `html.classList.add`: `const esta = { valor }` e `revelacao.current = esta`. O `finished.finally` passa a ser `() => { if (revelacao.current !== esta) return; revelacao.current = null; html.classList.remove("theme-reveal"); vidros.desfazer() }` (a transição pulada não limpa o que a seguinte já preparou).
  - `vidro-na-revelacao.ts`: `const ID_DA_FOLHA = "vidro-na-revelacao"`; em `nomearVidros`, reusar `doc.getElementById(ID_DA_FOLHA)` se existir (senão criar `<style id>`), trocando o `textContent`; antes de nomear, tirar o `view-transition-name` inline de quem o tinha de uma troca pulada (`doc.querySelectorAll<HTMLElement>(".glass-surface")` → `el.style.viewTransitionName = ""`).

- [ ] **Step 4: Run** os mesmos comandos da Task 2 Step 4. Expected: verde.

### Task 3: Verificar

- [ ] No Simulador iOS, em `/me`, com `REVELACAO.duration` temporariamente alto: a barra de baixo e os botões de vidro do topo ficam de vidro, revelados pelo círculo. Voltar a duração a 320.
- [ ] No Chrome a 375px: a troca segue igual.
- [ ] `graphify update .`
