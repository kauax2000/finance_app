# Menu de ordem (ordem + sentido) — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o menu de ordem de Categorias ganha título, ícones, tique na escolhida e um trilho de sentido que inverte a ordem.

**Architecture:** o `DropdownMenuRadioItem` ganha `indicator="check"` (design system). A `ordenarCategorias`/`dividirDoMes` ganha `invertida`. A `OrdemDasCategorias` monta o menu novo, e a página guarda `invertida` ao lado de `criterio`.

**Tech Stack:** React 19, Radix (DropdownMenu, ToggleGroup), Tailwind v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-19-menu-de-ordem-design.md`

## Global Constraints

- **Tique:** `indicator="check"` é uma variante nova de `DropdownMenuRadioItem` (`src/components/ui/dropdown-menu.tsx`).
  - Quando marcada, mostra o tique (`CheckIcon`, Heroicons `16/solid`) à direita, na tinta do texto, e acende a linha em `bg-foreground/9`.
  - O padrão continua `"dot"`. A mudança em `ui/` foi autorizada pelo dono.
- **Ordens:** valores `maior`/`nome`/`variacao`. Rótulos "Gasto" (ou "Receita" na aba de receitas), "Nome" e "Variação". Título "Ordenar por".
- **Sentido:** `invertida: boolean`. Rótulos do trilho por ordem:
  - maior: "Maior primeiro" | "Menor primeiro";
  - nome: "A → Z" | "Z → A";
  - variacao: "Mais subiu" | "Mais caiu".
  - Trocar de ordem zera `invertida` para `false`.
- **Gatilho:** continua o ⇅. O `aria-label` é "Ordenar categorias: <ordem em minúscula>, <sentido em minúscula>", por exemplo "Ordenar categorias: gasto, maior primeiro".
- **Ícones:** só Heroicons, no conjunto que o tamanho pede (o auditor, regra G, decide).
- **Arquivos alheios:** não faça stage de `CLAUDE.md`, de `graphify-out/graph.json` nem de arquivos de outras sessões. Faça stage por caminho e commit com `git commit <caminhos>`. Sem push. Cada commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Teclado no menu:** setas andam pelas ordens, o trilho de sentido é alcançável, e Esc fecha.
2. **Empate com o sentido invertido:** a ordem continua estável e não embaralha.
3. **Trocar de ordem com o sentido invertido:** o sentido volta ao natural.
4. **Os outros menus do app:** continuam com o ponto.
5. **Telefone:** o mesmo menu cabe a 375px.

---

### Task 1: `DropdownMenuRadioItem indicator="check"`

**Files:**
- Modify: `src/components/ui/dropdown-menu.tsx` (`DropdownMenuRadioItem`, l.~922)
- Test: `src/components/ui/dropdown-menu-versions.test.ts`
- Modify: `src/app/designsystem/docs/dropdown-menu.tsx`, com uma frase e um exemplo do `indicator="check"` onde o rádio é descrito
- Modify: `AGENTS.md`, no bullet do `DropdownMenu`: "`DropdownMenuRadioItem indicator="check"`: o tique à direita e a linha acesa, para o menu de ordem (19/11/2026)"

- [ ] **Step 1: testes.**
  - Fonte: o tipo aceita `"check"`.
  - Render (`renderToStaticMarkup` com o item dentro de `DropdownMenu` aberto, como os testes vizinhos já fazem, ou pela fonte, se o portal impedir) mostra `data-indicator="check"`.
  - O ramo `"check"` renderiza `CheckIcon` e não o ponto.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** PASS. Rodar `npx tsc --noEmit`, `npm run ds:audit -- src/components/ui/dropdown-menu.tsx` e `npm run ds:docs-map`, se a página mudou de forma.
- [ ] **Step 5:** commit `feat(dropdown-menu): o rádio com tique (indicator="check")`.

### Task 2: o sentido na ordenação

**Files:**
- Modify: `src/lib/categoria-situacao.ts` (`ordenarCategorias`, `dividirDoMes`)
- Test: o teste existente de `categoria-situacao`, ou `src/lib/categoria-situacao.test.ts`

- [ ] **Step 1: testes.**
  - `ordenarCategorias(itens, "maior", true)` põe o menor total primeiro.
  - `"nome", true` dá Z→A.
  - `"variacao", true` põe primeiro a que mais caiu.
  - Com empate, invertida mantém a ordem de entrada entre os empatados.
  - `dividirDoMes(itens, c, true).comMovimento` vem invertida.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** acrescentar o parâmetro `invertida = false` aos dois. Inverta o comparador (`(a, b) => cmp(b, a)`), não o array, para manter a estabilidade.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** commit `feat(categorias): a ordem pode inverter o sentido`.

### Task 3: o menu novo e o estado na página

**Files:**
- Modify: `src/components/categories/categorias-do-mes.tsx` (`OrdemDasCategorias`)
- Modify: `src/app/(app)/categories/page-client.tsx`, com `const [invertida, setInvertida] = useState(false)`, passado a `dividirDoMes` e à peça
- Test: `src/components/categories/categorias-do-mes.test.ts` e `src/app/(app)/categories/page-client.test.ts`

**Interfaces:**
- `OrdemDasCategorias({ tipo, criterio, onCriterioChange, invertida, onInvertidaChange, compacta })`.
- `onCriterioChange` leva a página a também `setInvertida(false)`.

- [ ] **Step 1: testes.**
  - Fonte da peça: contém `"Ordenar por"`, `indicator="check"`, os seis rótulos de sentido e os ícones.
  - Render do gatilho: `aria-label="Ordenar categorias: gasto, maior primeiro"`; e com `invertida` e `nome`, "nome, z → a".
  - Fonte da página: `invertida` vai a `dividirDoMes` e trocar o critério zera o sentido.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: implementar.**
  - O trilho de sentido é `ToggleGroup variant="segmented" type="single"` no pé do menu.
  - Se ele quebrar o teclado do menu (as setas do Radix menu), use um segundo `DropdownMenuRadioGroup` com o rótulo "Sentido" e diga isso no relatório.
  - O gatilho do desktop e o do telefone são os de hoje.
- [ ] **Step 4:** PASS. Rodar `npx tsc --noEmit`, `npm run lint` e `npm run ds:audit -- src/components/categories "src/app/(app)/categories"`.
- [ ] **Step 5:** `graphify update .` e commit `feat(categorias): o menu de ordem com título, ícones e sentido`.
