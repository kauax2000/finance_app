# Movimento do Importar extrato — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** os três momentos em que o diálogo Importar extrato muda de forma deixam de saltar: Inverter, Ver todos / Recolher e a chegada na conferência. Cada um ganha resposta imediata ao toque e uma coreografia em fases.

**Architecture:**
- A caixa do diálogo passa a andar a largura além da altura. É o `useAlturaAnimada`, que o `DialogContent` já usa.
- O conteúdo troca com os gestos que o app já tem:
  - `TrocaSuave` para número e rótulo;
  - `useCountUp` para contagem;
  - `@utility dialog-step` para a troca de passo;
  - `menu-content-in` em escada para linhas que chegam.
- Nada de movimento novo.

**Tech Stack:** React 19, Tailwind v4, motion/react, Vitest (testes de fonte e de unidade).

**Spec:** pedido do dono (09/11/2026), "melhore e refine a animação: quando inverto todos, quando o diálogo abre e tudo expande, informações novas vêm para a tela; organize para ficar profissional". O dono pulou as perguntas. As medidas abaixo são do navegador, nesta data.

## O que acontece hoje (medido)

| Momento | Hoje |
| --- | --- |
| Inverter | ~1s sem nenhum sinal (a leitura refaz a checagem de duplicados). Depois as abas (Saídas 56 → 4), as cores e o saldo trocam no mesmo quadro. |
| Ver todos | ~400ms congelado (a tabela de 60 linhas monta). Depois a caixa salta de 576 para 1253px de largura, e a altura muda num segundo salto. |
| Recolher | Salta de volta no mesmo quadro. |
| Arquivo → Conferir | ~1s lendo. Depois a largura salta de 512 para 576, e o título e o corpo trocam secos. |

## Princípios (decisão minha, sem consulta)

1. **O toque responde em menos de 100ms**, mesmo quando o resultado demora: o botão entra em espera e a área que vai mudar esmaece. Esperar não é esqueleto, porque o conteúdo velho fica à vista.
2. **Um momento, três fases, nesta ordem:**
   - o que sai some rápido (`SAIDA`, 150ms);
   - a caixa anda na mola do sistema (`--duration-spring` / `--ease-spring`);
   - o que chega surge do desfoque em escada (`menu-content-in`, 30ms entre peças, teto de 6).

   A chegada começa quando a caixa passou da metade, nunca depois que ela parou.
3. **Modal é sóbrio** (memória `modais-pedem-movimento-sobrio`): sem balanço, sem escala no diálogo, sem morph de menu na caixa. Só largura e altura em px, opacidade e desfoque curto.
4. **Número que muda conta; rótulo que muda troca no lugar.** Contagem por `useCountUp`, rótulo e valor por `TrocaSuave`.
5. **Movimento reduzido:** tudo troca na hora. Os hooks e utilities já respeitam isso; nada novo escapa.

## Global Constraints

- Tokens só: durações e curvas de `--duration-*` / `--ease-*` e de `lib/spring` (`MOLA`, `SAIDA`). Nenhum `ms` cru fora dos já usados pelas utilities.
- `src/hooks/use-altura-animada.ts` atinge todo `Dialog`. É mudança de sistema, autorizada no ok deste plano (invariante 6). `src/components/ui/` e `globals.css` ficam como estão. Se uma tarefa precisar deles, ela para e relata.
- O banco do dev é produção: no navegador, nunca clicar Importar nem Desfazer.
- Sem prettier. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push.
- Verificação de cada tarefa:
  - `npx tsc --noEmit`
  - `npx eslint src/components/transactions/importar src/hooks`
  - `npx vitest run src/components/transactions/importar src/hooks src/components/ui/dialog-versions.test.ts`
  - `npm run ds:audit -- src/components/transactions/importar`

## Review Focus

1. Tocar Inverter duas vezes rápido: a segunda leitura vence (o `vez.vale(n)` já cuida), e a lista não fica presa esmaecida.
2. Ver todos e Recolher no meio da viagem: a caixa segue de onde está, sem saltar para o tamanho antigo.
3. Telefone (gaveta abaixo de 768px): a largura não anima (a gaveta é do `vaul`). Nada quebra o arraste.
4. Movimento reduzido: as três trocas acontecem na hora, sem opacidade presa.
5. Outros diálogos que trocam de tamanho (Novo lançamento: Despesa ↔ Parcelada) continuam animando só a altura, como hoje.

---

### Task 1: a caixa anda a largura

**Files:**
- Modify: `src/hooks/use-altura-animada.ts`
- Test: `src/hooks/use-altura-animada.test.ts` (criar se não existir) e `src/components/ui/dialog-versions.test.ts` (só se uma asserção existente citar `height` sozinho)

**Interfaces:** `useAlturaAnimada<T>()` mantém o nome e a assinatura, porque o `dialog.tsx` não muda.

- [x] **Step 1: testes que falham.**
  - Fonte do hook: contém `offsetWidth`, e a transição escreve `width` e `height` juntas: `"height var(--duration-spring) var(--ease-spring), width var(--duration-spring) var(--ease-spring)"`.
  - O `limpar` zera `style.width`.
  - O `fim` só limpa quando as duas propriedades terminaram, ou quando a que andou terminou.
- [x] **Step 2:** rodar → FAIL.
- [x] **Step 3: implementar.**
  - `ultima` vira `{ w, h }`. Anima quando qualquer uma das duas muda.
  - A que não mudou fica fixa em px durante a viagem.
  - Abaixo de 768px (`matchMedia("(max-width: 47.99rem)")`, a gaveta) só a altura anda, como hoje.
  - A caixa centrada cresce dos dois lados. Confira no navegador que o `translate(-50%)` do `DialogContent` segura o centro. Se não segurar, relate e não mude o `dialog.tsx`.
- [x] **Step 4:** Verificação passa.
- [x] **Step 5:** commit `feat(dialog): a caixa do diálogo anda a largura junto com a altura`.

### Task 2: Inverter responde e troca em fases

**Files:**
- Modify: `src/components/transactions/importar/conferir-importacao.tsx`
- Create, se precisar: `src/components/transactions/importar/contagem-que-anda.tsx`. É o número que conta, sobre `useCountUp`, para a contagem das abas e o saldo.
- Test: `src/components/transactions/importar/importar-extrato-dialog.test.ts`

**Comportamento:**
- Com `imp.pendente === "lendo"`:
  - o botão Inverter fica desabilitado, com `Spinner` como ícone de início;
  - a lista compacta, as abas e o saldo esmaecem a 60% (`transition-opacity duration-(--duration-fast)`, `aria-busy`);
  - o conteúdo velho fica à vista.
- Quando a leitura chega:
  - a opacidade volta;
  - as contagens das abas e o saldo **contam** do valor antigo ao novo (`useCountUp`, `troca` em `--duration-slow`);
  - o valor de cada linha visível troca no lugar com `TrocaSuave` (chave: o sinal e o valor), em escada de 30ms por linha, até 6.
- A chave da linha é o `clientId`. Se a releitura gerar `clientId` novo para a mesma linha, use uma chave estável (índice no arquivo) e diga no relatório.

- [x] **Step 1: testes de fonte que falham.** `conferir-importacao.tsx` contém:
  - `pendente === "lendo"`, `aria-busy` e `Spinner`;
  - `TrocaSuave` no valor da linha;
  - o componente de contagem nas abas (`count=`).
- [x] **Step 2:** rodar → FAIL.
- [x] **Step 3:** implementar.
- [x] **Step 4:** Verificação passa.
- [x] **Step 5:** commit `feat(importar): Inverter responde no toque e troca os números contando`.

### Task 3: Ver todos e Recolher em três fases

**Files:**
- Modify: `src/components/transactions/importar/conferir-importacao.tsx`, `importar-extrato-dialog.tsx`
- Test: `importar-extrato-dialog.test.ts`

**Comportamento:**
- **Toque:**
  - `setExpandido` vai dentro de `startTransition` (`useTransition`), para o quadro do toque pintar antes da tabela montar;
  - o botão mostra a espera (`Spinner`) enquanto `isPending`.
- **Expandir:**
  - fase 1: a lista compacta sai (opacidade a 0, `SAIDA`);
  - fase 2: a caixa anda até `full` (Task 1);
  - fase 3: as linhas da tabela surgem com `menu-content-in` em escada, 30ms, teto de 8, a partir de `--duration-fast` depois do toque. Use a `@utility dialog-step` num invólucro com `key` se ela couber; senão, a escada por `stagger-ladder` no `tbody`, só por classe.
- **Recolher:** o espelho, mais curto. A tabela sai em `SAIDA`, a caixa volta e a lista compacta surge em escada.
- **O cabeçalho da tabela não pisca:** a barra de busca e as ações surgem junto com a primeira linha.

- [x] **Step 1: testes de fonte que falham.**
  - `useTransition` no Ver todos;
  - a classe de escada (`dialog-step` ou `stagger-ladder`) no invólucro da tabela e da lista compacta.
- [x] **Step 2:** rodar → FAIL.
- [x] **Step 3:** implementar.
- [x] **Step 4:** Verificação passa.
- [x] **Step 5:** commit `feat(importar): Ver todos e Recolher saem, crescem e chegam em fases`.

### Task 4: a chegada na conferência

**Files:**
- Modify: `src/components/transactions/importar/importar-extrato-dialog.tsx`
- Test: `importar-extrato-dialog.test.ts`

**Comportamento:**
- O corpo de cada passo vai num invólucro com `key={imp.passo}` e a `@utility dialog-step`. As peças do passo novo surgem em escada enquanto a caixa anda (Task 1).
- O título troca no lugar com `TrocaSuave` ("Importar extrato" → "60 lançamentos para o Bradesco…"). O pai é `relative`.
- O `FormSubmit` já entra em espera pelo `onSubmit` que devolve `Promise`. Confira que `continuar()` devolve a promessa da leitura. Se não devolver, faça devolver.

- [x] **Step 1: testes de fonte que falham.**
  - `key={imp.passo}` com `dialog-step`;
  - `TrocaSuave` no `DialogTitle`.
- [x] **Step 2:** rodar → FAIL.
- [x] **Step 3:** implementar.
- [x] **Step 4:** Verificação passa.
- [x] **Step 5:** commit `feat(importar): a troca de passo chega em escada e o título troca no lugar`.

### Task 5: conferir no navegador e registrar (controlador)

- [x] Medir de novo, quadro a quadro, cada momento da tabela de cima (só ler; **nunca clicar Importar**):
  - resposta no toque em menos de 100ms;
  - nenhuma propriedade saltando entre quadros;
  - fim no tamanho certo.

  Medir também a 375px e com movimento reduzido.
- [x] Gravar um GIF ou uma sequência de prints dos três momentos para o dono.
- [x] Uma linha no `AGENTS.md`, na seção do `Dialog`: "a caixa anda a altura e a largura" (no lugar de "A altura anda na mola").
