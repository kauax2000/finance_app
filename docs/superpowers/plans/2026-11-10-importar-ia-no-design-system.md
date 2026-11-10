# A IA do Importar no design system — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a faixa tracejada "WIREFRAME · Bloco 2 · Categorias pela IA" e a marca "IA" saem. No lugar entram peças do design system:
- um rótulo ✦ logo depois das abas, que abre um resumo por categoria;
- a aba "Pela IA" agrupada pela categoria sugerida.

**Architecture:**
- Um componente da tela, `RotuloDaIa` (`src/components/transactions/importar/rotulo-da-ia.tsx`). Ele compõe `Button variant="link"`, `Popover`, `Spinner`, `ColorTile` e `Item`.
- O hook ganha `desfazerIa`, e a pasta ganha uma função pura `porCategoriaDaIa`.
- A aba "Pela IA" usa o `groupBy` / `groupTotal` que o `DataTable` já tem.
- Nada muda em `src/components/ui/`.

**Tech Stack:** React 19, Tailwind v4, Radix Popover (pelo DS), Vitest (testes de fonte e de função pura).

**Spec:** decisões do dono (10/11/2026), sobre os mockups da rodada 2:
- **R1** é o resumo-mapa por categoria, sem CTA de "ver".
- **P1** é a aba agrupada por categoria.
- O rótulo segue a opção **A** e não pode parecer botão. Ele fica **à esquerda da linha, logo à direita das abas**, e não junto das Ações.
- O dono achou péssima a CTA "Ver as 28 sugeridas".

## Comportamento

### O rótulo (`RotuloDaIa`)

**Onde:**
- Tela cheia: na linha das abas, logo depois do `Tabs`, antes da sobra. A ordem é `[abas] [rótulo] … [busca] [Ações] [Ver menos]`. O invólucro das abas deixa de ser `flex-1`, e um espaçador `flex-1` (ou `ms-auto` na busca) empurra o resto à direita.
- Compacto e telefone: as abas ocupam a linha toda. O rótulo mora numa linha própria logo acima das abas, à esquerda, no lugar da antiga faixa.

**Aparência:** `Button variant="link" size="sm"`, ícone `SparklesIcon` de `@heroicons/react/16/solid`. Sem fundo e sem cápsula. Ele é o gatilho de um `Popover`.

| Estado da IA (`imp.ia.estado`) | Rótulo | Popover |
| --- | --- | --- |
| `ocioso`, `indisponivel` | nada | — |
| `lendo` | `Spinner` + "IA lendo…" (não abre nada; `disabled` não, só sem popover: é um `span` com `role="status"`) | — |
| `pronto`, `sugeridas > 0` | ✦ "28 pela IA" (`numberBR`) | resumo-mapa (abaixo) |
| `pronto`, `sugeridas === 0` | ✦ "IA sem sugestões" | texto: "A IA não achou categoria para estas linhas." mais o `ficaram`, se houver |
| `falhou` | `ExclamationTriangleIcon` 16/solid + "A IA falhou", tinta `text-warning-foreground` ou o tom de aviso do DS | `imp.ia.mensagem` + `Button variant="secondary" size="sm"` "Tentar de novo" → `imp.tentarIaDeNovo()` e fecha |

**O resumo-mapa** (`pronto`, `sugeridas > 0`; `PopoverContent size="md"`):
- `PopoverTitle`: "A IA categorizou 28" (singular: "A IA categorizou 1").
- `PopoverDescription`:
  - "Confira antes de importar."
  - Mais "N ficaram sem categoria." quando `imp.contagens.semCategoria > 0`. Use a contagem real da aba que já existe; confira o nome da chave em `contagens`.
- Lista das categorias que a IA usou, de `porCategoriaDaIa`, em ordem decrescente de contagem:
  - cada linha é um `<button type="button">` com o `ColorTile xs` da categoria (reuse `LadrilhoDaCategoria`), o nome e a contagem à direita (`nums`);
  - mostre no máximo 5 linhas; com mais, a sexta é "+ N categorias", sem clique;
  - tocar numa linha faz `imp.setFiltro("ia")`, fecha o popover e rola o grupo dela à vista (`[data-grupo-ia="<categoryId>"]`, `scrollIntoView({ block: "nearest" })` no `requestAnimationFrame` seguinte).
- No pé, só a saída: `Button variant="tertiary" size="sm"` "Desfazer as 28":
  - chama `imp.desfazerIa(ids)` e fecha;
  - depois dispara `toastUndo("Sugestões da IA desfeitas", { onUndo: devolver })` de `@/lib/toast`.
- **Sem CTA de "Ver sugeridas".**
- Com `travado`, o rótulo fica `disabled`.

### A aba "Pela IA" (P1)

Só quando `imp.filtro === "ia"` e há linhas.

- **Faixa acima da tabela:** `Alert size="sm"`, ícone `SparklesIcon` (pelo `icon`, nunca filho). O texto é "A IA sugeriu estas. Troque o que não fizer sentido: a troca vira sua." Não leva ação: o Desfazer mora no rótulo e nos grupos.
- **Ordem:** as linhas vêm ordenadas pelo nome da categoria sugerida (`localeCompare` pt-BR) e, dentro dela, pela ordem de hoje.
- **Grupos:** `groupBy` devolve `{ key: categoryId, label }` só com `filtro === "ia"` e sem ordenação ativa (`ctx.sorting.length === 0`); nos outros casos devolve `null`.
  - O `label` traz o `ColorTile xs`, o nome e "· N", e o elemento leva `data-grupo-ia={categoryId}`.
  - O `groupTotal` traz duas ações `Button variant="tertiary" size="xs"`:
    - "Trocar o grupo…" → `setPorCategoria(membros)`, o diálogo que já existe;
    - "Desfazer" → `imp.desfazerIa(membros.map(m => m.clientId))` + o mesmo `toastUndo`.
  - Se `groupTotal` não for o lugar certo no `TableGroupRow`, use o que o `DataTable` oferecer para conteúdo à direita do grupo, sem mexer em `ui/`. Diga no relatório o que usou.
- **✦ no campo:** a `MarcaIaWireframe` sai. A linha de origem "ia" põe o `SparklesIcon` (16/solid, `size-3.5`, `text-muted-foreground`, `aria-hidden`) dentro do `ComboboxTrigger`, depois do `ComboboxValue`.
  - O combo não estreita mais.
  - O `aria-label` do gatilho ganha " (sugerida pela IA)".
  - Se o gatilho não aceitar o filho extra sem quebrar o layout, ponha o ícone no `media` junto do ladrilho, e diga no relatório.
- **O gêmeo do telefone:** o `DataTable` já agrupa no telefone (`data-table-mobile-group`). Nada a mais.

### O hook

- `desfazerIa(clientIds: string[]): () => void`:
  - põe essas linhas em "Sem categoria", com a mesma escrita de `setCategoria(ids, null)`, o que já tira a origem "ia";
  - devolve `devolver`, que **apaga** essas chaves das escolhidas, e assim a sugestão da IA volta com a origem "ia";
  - ignora ids cuja origem não é "ia" no momento da chamada.
- O `ia.sugeridas` do estado não muda; o rótulo e o mapa leem a contagem viva (`imp.contagens.ia`).

## Global Constraints

- Não tocar `src/components/ui/`, `src/app/globals.css`, `CLAUDE.md` nem `graphify-out/`. O `graphify-out/` só muda por `graphify update .`, no fim.
- Ícones só Heroicons, pela régua do tamanho (`16/solid` até `size-4`).
- Sem `#hex`, sem cor crua, sem `px` arbitrário. Nada de `variant="ghost"`/`"default"`. O `Alert` não recebe `svg` filho.
- Sem prettier. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push. Outra sessão mexe em arquivos da top-bar no mesmo checkout: `git add` só nos arquivos desta tarefa.
- O banco do dev é produção. No navegador, nunca clicar Importar nem Desfazer da importação.
- Verificação de cada tarefa:
  - `npx tsc --noEmit`
  - `npx eslint src/components/transactions/importar src/components/wireframe`
  - `npx vitest run src/components/transactions/importar src/components/wireframe`
  - `npm run ds:audit -- src/components/transactions/importar`

## Review Focus

1. "Desfazer as 28", depois "Desfazer" no toast: as 28 voltam com o ✦ e a aba "Pela IA" volta a contar 28. Uma linha que a pessoa trocou à mão entre os dois cliques não é sobrescrita.
2. Aba "Pela IA" ordenada por uma coluna: os grupos somem, e as linhas não se repetem nem sobram faixas de grupo.
3. Desfazer o último grupo da aba "Pela IA": a aba esvazia. O `EmptyState` do filtro aparece, ou a aba some, como já acontece com `so_com_linhas`.
4. A IA lendo enquanto a pessoa troca de aba: o rótulo não abre popover vazio e não pisca.
5. Telefone a 375px, no compacto: o rótulo fica numa linha própria acima das abas, e as abas continuam rolando de lado.

---

### Task 1: `porCategoriaDaIa` e `desfazerIa`

**Files:**
- Modify: `src/components/transactions/importar/use-importar-extrato.ts`
- Test: `src/components/transactions/importar/use-importar-extrato.test.ts`

**Interfaces (Produces):**
```ts
/** Pura: as categorias que a IA usou nas linhas dadas, da mais usada para a menos (empate: nome pt-BR). */
export function porCategoriaDaIa(
  itens: ItemImportavel[],
  origemDe: (clientId: string) => OrigemDaCategoria | null,
  categoriaDe: (clientId: string) => number | null
): { categoryId: number; n: number }[]
// no retorno do hook:
desfazerIa: (clientIds: string[]) => () => void
```
O tipo do id de categoria é o que `categoriaDe` já devolve no hook. Se for `string`, use `string`.

- [ ] **Step 1:** testes que falham.
  - `porCategoriaDaIa` com 3 linhas "ia" (Mercado×2, Lazer×1) e 1 linha "pessoa" devolve `[{Mercado,2},{Lazer,1}]`.
  - `desfazerIa` testado pela função pura que o hook usa, no padrão do arquivo de teste. Se o hook só puder ser testado por fonte, extraia a lógica para uma pura (`escolhidasSemIa` / `escolhidasDevolvidas`) e teste-a:
    - ids "ia" viram `null` nas escolhidas;
    - `devolver` apaga essas chaves;
    - um id "pessoa" fica intocado.
- [ ] **Step 2:** `npx vitest run src/components/transactions/importar` → FAIL.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** Verificação passa.
- [ ] **Step 5:** commit `feat(importar): desfazer as sugestões da IA, com volta, e o resumo por categoria`.

### Task 2: `RotuloDaIa` no lugar da faixa

**Files:**
- Create: `src/components/transactions/importar/rotulo-da-ia.tsx`
- Modify: `src/components/transactions/importar/conferir-importacao.tsx` (onde a faixa morava, a linha das abas)
- Modify: `src/components/wireframe/importar-ia-wireframe.tsx` (some a `FaixaDaIaWireframe`; a `MarcaIaWireframe` fica até a Task 3)
- Test: `src/components/transactions/importar/importar-extrato-dialog.test.ts`, e o teste de wireframe que citar a faixa, se houver

**Interfaces:**
- Consumes: `porCategoriaDaIa` e `imp.desfazerIa` (Task 1).
- Produces: `export function RotuloDaIa({ imp, travado }: { imp: ImportarExtrato; travado: boolean }): React.ReactElement | null`. `LadrilhoDaCategoria` passa a ser exportado de `conferir-importacao.tsx`, ou vai para um arquivo próprio da pasta, para o rótulo usá-lo.

- [ ] **Step 1:** testes de fonte que falham.
  - `conferir-importacao.tsx` não contém `FaixaDaIaWireframe`.
  - Na linha das abas, `</Tabs>` vem antes de `<RotuloDaIa`, e este antes de `<BuscaQueAbre`.
  - `rotulo-da-ia.tsx` contém:
    - `variant="link"`, `PopoverTitle` e `toastUndo`;
    - `"Desfazer as "`;
    - `tentarIaDeNovo`;
    - nada que case `/Ver (as )?sugeridas/`.
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3:** implementar "O rótulo" do Comportamento, inclusive o lugar no compacto.
- [ ] **Step 4:** Verificação passa.
- [ ] **Step 5:** commit `feat(importar): o rótulo da IA depois das abas, com o resumo por categoria`.

### Task 3: a aba "Pela IA" agrupada, e o ✦ no campo

**Files:**
- Modify: `src/components/transactions/importar/conferir-importacao.tsx`
- Delete: `src/components/wireframe/importar-ia-wireframe.tsx`, e os testes que só o cobrem
- Test: `src/components/transactions/importar/importar-extrato-dialog.test.ts`

**Interfaces:** Consumes `imp.desfazerIa`, `setPorCategoria` (já existe).

- [ ] **Step 1:** testes de fonte que falham.
  - `conferir-importacao.tsx` não importa nada de `@/components/wireframe/importar-ia-wireframe`, e o arquivo não existe.
  - Contém `groupBy=`, `data-grupo-ia`, `"Trocar o grupo…"`, `SparklesIcon` e `(sugerida pela IA)`.
  - O `Alert` da aba não tem `<svg` nem `Icon className` como filho direto (use `icon={…}`).
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3:** implementar "A aba Pela IA (P1)". O `groupBy` devolve `null` com ordenação ativa ou fora do filtro "ia".
- [ ] **Step 4:** Verificação passa, mais `npm run ds:audit -- src/components/transactions/importar` sem regra nova.
- [ ] **Step 5:** commit `feat(importar): a aba Pela IA agrupada por categoria, e o ✦ dentro do campo`.

### Task 4: jornada, Atlas e conferência (controlador)

- [ ] `docs/JORNADAS.md`, na seção do Importar:
  - a faixa da IA virou o rótulo com popover (resumo, Desfazer com volta, Tentar de novo);
  - a aba "Pela IA" ganhou grupos, com "Trocar o grupo…" e "Desfazer".
  
  Depois `docs/atlas/template.html`, `python3 docs/atlas/build.py`, e republicar o Atlas no mesmo URL.
- [ ] `graphify update .`
- [ ] No navegador, com um CSV de teste (só ler; **nunca clicar Importar**), passar pelos cinco pontos do Review Focus. Mandar prints ao dono.
