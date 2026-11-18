# Troca do dia preso Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Na lista agrupada do telefone (`mobileGroups="inset"`), o dia preso não sobe mais quando o próximo chega. O próximo chega até ele, e o de cima gira no próprio eixo para trás e some, trocando por baixo.

**Architecture:**
- **Hoje** (`src/components/ui/data-table.tsx`, `GemeoDoTelefone`, ramo `inset`):
  - cada grupo é um invólucro com o cabeçalho `sticky` e o cartão;
  - o cabeçalho só gruda dentro do próprio grupo, e o próximo o empurra para cima;
  - `useCabecalhoPreso` marca `data-preso` por `IntersectionObserver`.
- **Muda:**
  - os cabeçalhos viram irmãos dos cartões, direto na lista (`data-slot="data-table-mobile"`). Assim todos grudam no mesmo ponto até o fim da lista, e o de cima não é empurrado: o próximo chega e para em cima dele.
  - um ouvinte de rolagem (`useTrocaDoDia`, no lugar do `useCabecalhoPreso`) calcula, para cada cabeçalho preso, a distância do próximo. Nos últimos `altura` px, o miolo do de cima gira e esmaece, pela função pura `trocaDoDia`.
  - o ouvinte escreve estilo e atributo direto no nó, sem `setState`.

**Tech Stack:** React 19, Tailwind v4, vitest (testes puros e de fonte com `lerFonte`/`semComentarios` de `@/test/fonte`).

**Spec:** pedido do dono (18/11/2026), sobre a rodada 397:
- "o texto de baixo chega mais próximo do texto de cima";
- "o texto de cima não continua subindo";
- "ele some para trás, girando no próprio eixo, para trocar por debaixo".

## Global Constraints

- `src/components/ui/` está autorizado pelo pedido do dono.
- O fundo do dia preso (o `::before` da rodada 397) continua igual: a tinta de `--background` a 30% e o borrão `backdrop-blur-md`. Ele sobe até o topo da tela e desce 12px se dissolvendo. Fica aceso só no cabeçalho de cima: o coberto não pinta, para não dobrar a tinta.
- O giro é do **miolo** (o texto e o valor), nunca do cabeçalho inteiro, para o fundo não girar junto. O miolo é um `<span data-slot="data-table-mobile-group-heading-text">` com os dois textos.
- O giro:
  - `transform: perspective(400px) rotateX(<giro>deg)`, com `transform-origin: center`;
  - a borda de cima afunda na tela;
  - o giro vai de 0 a 90 graus enquanto o próximo percorre os últimos `altura` px (a altura do cabeçalho, medida), e a opacidade vai de 1 a 0;
  - com movimento reduzido, o giro fica em 0 e só a opacidade muda.
- O vão entre os dias continua 24px: a margem de 8px antes de cada cabeçalho (menos o primeiro) mais o `pt-4` dele.
- O ouvinte:
  - um `scroll` em `window` (`passive: true`), coalescido num `requestAnimationFrame` por rajada, e um `resize`;
  - nunca `rAF` em laço;
  - a linha da barra vem de `topBarBottom(document)`.
- O desktop e o `mobileGroups="band"` não mudam.
- Sem prettier. Comentários em português. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Depois, `graphify update .`.
- Na mesma mudança: no `AGENTS.md`, o trecho do `mobileGroups="inset"` diz que o dia de cima gira e some quando o próximo chega; em `docs/design/HISTORICO-DESIGN-SYSTEM.md`, a "Rodada 398 — o dia preso gira e troca por baixo".
- Sem navegador no subagente: o banco é de produção. O controlador confere a tela.

## Review Focus

- **Rolar para cima:** o de cima reaparece desgirando, na ordem inversa, sem ficar meio girado.
- **Lista que troca** (filtro, mês, página nova): o ouvinte relê os cabeçalhos e não deixa estilo velho em nó reaproveitado.
- **O último grupo:** sem próximo, ele fica preso e inteiro até a lista acabar.
- **Muitos dias passados:** todos os anteriores ficam presos e empilhados no topo. Só o de cima pinta o fundo; os cobertos têm o miolo invisível e o `::before` apagado.
- **Movimento reduzido:** troca só por opacidade, sem giro.

---

### Task 1: O dia de cima gira e troca por baixo

**Files:**
- Create: `src/lib/troca-do-dia.ts`, `src/lib/troca-do-dia.test.ts`
- Modify: `src/components/ui/data-table.tsx`: o ramo `inset` do `GemeoDoTelefone` (~linha 1760) e o `useCabecalhoPreso` (~linha 1569), que sai
- Modify: `src/components/ui/data-table-agrupada.test.ts`, `AGENTS.md`, `docs/design/HISTORICO-DESIGN-SYSTEM.md`

**Interfaces:**
- Produces:
  - `export function trocaDoDia(distancia: number, altura: number, reduzido = false): { giro: number; opacidade: number }`
  - `distancia` é a distância, em px, do topo do próximo cabeçalho ao topo do preso.
  - `useTrocaDoDia(raiz: React.RefObject<HTMLElement | null>, chave: unknown): void`, privado do `data-table.tsx`.
  - Os atributos são `data-preso` (o cabeçalho está grudado) e `data-coberto` (o próximo já chegou em cima dele).

- [ ] **Step 1: Testes que falham**
  - `troca-do-dia.test.ts`:
    - `trocaDoDia(40, 40)` e `trocaDoDia(120, 40)` dão `{ giro: 0, opacidade: 1 }`;
    - `trocaDoDia(20, 40)` dá `{ giro: 45, opacidade: 0.5 }`;
    - `trocaDoDia(0, 40)` e `trocaDoDia(-5, 40)` dão `{ giro: 90, opacidade: 0 }`;
    - `trocaDoDia(20, 40, true)` dá `{ giro: 0, opacidade: 0.5 }`;
    - `trocaDoDia(10, 0)` dá `{ giro: 0, opacidade: 1 }` (sem altura medida, nada gira).
  - `data-table-agrupada.test.ts`, na fonte sem comentários do ramo `GemeoDoTelefone`:
    - contém `useTrocaDoDia(listaRef` e não contém `useCabecalhoPreso`;
    - contém `data-slot="data-table-mobile-group-heading-text"`;
    - o cabeçalho deixa de morar num invólucro por grupo: entre `grupos.map(` e `data-slot="data-table-mobile-group-heading"` não há `<div key={key} className="flex flex-col">`;
    - a classe do cabeçalho contém `not-first:mt-2` e `data-coberto:before:opacity-0`;
    - a fonte contém `passive: true` e `trocaDoDia(`.
  - Ajuste as asserções da rodada 397 que dependem do invólucro, e o teste HTML de "um cartão por grupo", se ele contar invólucros.
- [ ] **Step 2: Rodar** `npx vitest run src/lib/troca-do-dia.test.ts src/components/ui/data-table-agrupada.test.ts`. Esperado: FALHA.
- [ ] **Step 3: Implementar**
  - `trocaDoDia`: `p = clamp(1 - distancia / altura, 0, 1)` quando `altura > 0`, e `p = 0` sem altura. O resultado é `giro = reduzido ? 0 : 90 * p` e `opacidade = 1 - p`.
  - No ramo `inset`, a lista rende, por grupo, um `React.Fragment key={key}` com o cabeçalho (se houver) e o `ItemGroup`. O container perde o `gap-2`. O cabeçalho ganha `not-first:mt-2`, e o miolo vai para o `<span>` de texto (`flex min-w-0 flex-1 items-baseline justify-between gap-3`).
  - `useTrocaDoDia`: a cada quadro coalescido, lê `linha = topBarBottom(document)` e os cabeçalhos da raiz, em ordem. Para cada um:
    - **preso:** `top <= linha + 0.5`;
    - **próximo:** o cabeçalho seguinte; `distancia = próximo.top - top`;
    - **escrita:** sem próximo, ou se não estiver preso, `{ giro: 0, opacidade: 1 }`. Escreve `transform` e `opacity` no `<span>` de texto, e alterna `data-preso` e `data-coberto` (`distancia <= 0`) no cabeçalho.
    - **movimento reduzido:** por `matchMedia("(prefers-reduced-motion: reduce)")`, lido no efeito.
    - **limpeza:** tira os ouvintes, cancela o quadro pendente e limpa os estilos escritos.
    - **quando roda:** o efeito depende de `[raiz, chave]` e roda uma vez ao montar.
  - O `::before` ganha `data-coberto:before:opacity-0`, ao lado do `data-preso:before:opacity-100`.
  - Por fim, o `AGENTS.md` e o histórico.
- [ ] **Step 4: Rodar** `npx vitest run src/components src/lib src/app/designsystem`, `npx tsc --noEmit`, `npx eslint src/components/ui/data-table.tsx src/lib/troca-do-dia.ts` e `npm run ds:audit -- src/components/ui/data-table.tsx`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(data-table): no telefone, o dia preso não sobe; gira no próprio eixo e troca por baixo quando o próximo chega`.
