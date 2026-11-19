# Troca de ano e mês que viaja na MonthGrid — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dentro do mesmo ano, a pílula do mês escolhido viaja de um mês ao outro como o marcador das abas. Entre anos, a grade desliza para o lado com desfoque e o número do ano troca no lugar. A grade também passa a seguir o ano do valor quando ele muda por fora.

**Architecture:** tudo acontece em `MonthGrid` (`src/components/ui/date-picker.tsx`). A Task 1 põe um marcador só, que viaja, no lugar do `variant="primary"` do mês escolhido, mirando o `ToggleGroup segmented`/`Tabs` (`useMarcador`). A Task 2 envolve a grade num `AnimatePresence` do `motion`, com a direção em `custom`, e troca o ano com a peça que o app já tem.

**Tech Stack:** React 19, motion, Tailwind v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-19-troca-de-ano-design.md`

## Global Constraints

- **Escopo:** só `src/components/ui/date-picker.tsx` e o que o acompanha (o teste de versões, a página do catálogo e a linha do AGENTS.md). A mudança é autorizada pelo dono.
- **Marcador:** a viagem usa `useMarcador` (`src/hooks/use-marcador.ts`) e a viagem líquida, do mesmo jeito que o `ToggleGroup variant="segmented"` (`src/components/ui/toggle-group.tsx`). Copie o uso de lá. Nada de `rAF` em laço; só `translate`/`scale`.
- **Molas e desfoque:** as molas vêm de `src/lib/spring.ts`. A entrada da grade usa `MOLA` e a saída usa `SAIDA`. O deslize é de `24px` e o desfoque de `6px`.
- **Troca do ano:** o número troca no lugar com a peça que o app já tem (`TrocaSuave`, `src/lib/troca-suave.tsx`, ou `quadroDaTroca`). Não escreva um gesto novo.
- **Movimento reduzido:** troca na hora, sem deslize, sem desfoque e sem viagem.
- **Modo `range`:** fica como está, nas pontas e na faixa.
- **Sem JS:** sem JavaScript, ou antes da primeira medida, o mês escolhido continua pintado.
- **Arquivos alheios:** não faça stage de `CLAUDE.md`, de `graphify-out/graph.json` nem de arquivos de outras sessões.

## Review Focus

1. **Toques rápidos:** dois toques rápidos na seta do ano não empilham grades nem deixam o ano errado.
2. **Valor vindo de fora em outro ano:** com as setas do rodapé indo de dezembro de 2026 para janeiro de 2027, a grade vai para 2027 e o mês fica marcado.
3. **Ano sem mês escolhido:** o marcador some e não fica preso no lugar antigo.
4. **Movimento reduzido:** nada anima, e a grade e o marcador terminam no lugar certo.
5. **Grade que sai:** fica `inert` e `aria-hidden`, e o `aria-live` do ano anuncia o ano novo.

---

### Task 1: o mês escolhido viaja

**Files:**
- Modify: `src/components/ui/date-picker.tsx` (`MonthGrid`, ~l.722-874)
- Test: `src/components/ui/date-picker-versions.test.ts`

- [ ] **Step 1: escrever os testes de fonte**, com `lerFonte`/`semComentarios`, no trecho de `function MonthGrid(`:
  - o trecho contém `useMarcador(` e um nó com `data-slot="month-grid-marker"`;
  - o mês escolhido no modo single não usa mais `variant={escolhido ? "primary"`. Ele fica `tertiary`, com a tinta de cima (`text-primary-foreground`) por baixo do marcador;
  - o modo `range` mantém as pontas como hoje;
  - existe um caminho sem medida: o mês escolhido leva `data-selected` e uma classe que o pinta enquanto o marcador não mediu, copiando o que o `ToggleGroup segmented` faz.
- [ ] **Step 2:** rodar `npx vitest run src/components/ui/date-picker-versions.test.ts`. Esperado: FAIL.
- [ ] **Step 3: implementar.**
  - O marcador fica absoluto na grade, em `bg-primary` e `rounded-full`, atrás dos botões.
  - Ele mede o botão do mês escolhido e viaja quando o mês muda dentro do mesmo ano.
  - Quando o ano mostrado não tem o mês escolhido, o marcador some.
- [ ] **Step 4:** rodar o teste (PASS), depois `npx tsc --noEmit` e `npm run ds:audit -- src/components/ui/date-picker.tsx`.
- [ ] **Step 5:** commit `feat(date-picker): o mês escolhido viaja como o marcador das abas`.

### Task 2: a grade desliza entre os anos e segue o valor de fora

**Files:**
- Modify: `src/components/ui/date-picker.tsx` (`MonthGrid`)
- Modify: `src/components/ui/date-picker-versions.test.ts`
- Modify: `src/app/designsystem/docs/date-picker.tsx`, uma frase sobre a troca de ano e o mês que viaja, onde a `MonthGrid` é descrita
- Modify: `AGENTS.md`, no bullet `**`DatePicker`**`: "a `MonthGrid` troca de ano deslizando para o lado com desfoque, e o mês escolhido viaja como o marcador das abas (19/11/2026)"

- [ ] **Step 1: escrever os testes.**
  - **Fonte:**
    - o trecho tem `AnimatePresence`, `custom=` com a direção, `SAIDA`, `MOLA`, `blur(6px)` e `24`;
    - tem um caminho de movimento reduzido (`useReducedMotion` ou `MotionConfig`), que é o padrão das peças com `motion`;
    - a grade que sai recebe `inert`;
    - o ano usa `TrocaSuave` ou `quadroDaTroca`.
  - **Render** (`renderToStaticMarkup`): `MonthGrid` com `value=new Date(2027,0,1)` renderiza `Meses de 2027`.
  - **Fonte, para o valor de fora:** existe a lógica de "ajustar o estado durante o render" que leva `ano` ao ano do valor quando o valor muda. É o padrão `visto`/`setVisto` que o arquivo já usa para a âncora.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: implementar.**
  - A direção é `+1` quando o ano novo é maior e `-1` quando é menor.
  - A grade antiga sai para `x: -24 * dir`, com `opacity: 0` e `filter: blur(6px)`, em `SAIDA`.
  - A nova entra de `x: 24 * dir`, com `opacity: 0` e `blur(6px)`, em `MOLA`.
  - O `AnimatePresence` usa `mode="popLayout"` (ou o equivalente) para as duas não empurrarem a altura.
  - Toques rápidos: a `key` do ano garante uma grade só presente e outra saindo.
- [ ] **Step 4:** rodar `npx tsc --noEmit && npm run lint && npm run test:unit` e `npm run ds:audit -- src/components/ui/date-picker.tsx`.
- [ ] **Step 5:** `graphify update .` e commit `feat(date-picker): a grade de meses desliza entre os anos e segue o valor de fora`.
