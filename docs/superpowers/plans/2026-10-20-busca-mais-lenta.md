# Abertura da busca mais lenta — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A abertura e o fechamento da busca do telefone ficam ~20–25% mais lentos nos dois caminhos (com filtro: a cápsula se divide; sem filtro: a lupa vira o campo), sem mudar o gesto.

**Architecture:** Só números: a mola `SEPARACAO`, a `VOLTA_DA_PILULA`, as durações da placa no `CommandDialog` e a espera da casca. As fases (`PINCA`, `PARTE`, `GOTA`…) não mudam: são frações do progresso, então andam junto com a mola.

**Tech Stack:** `motion/react` (`animate` com mola), Tailwind v4 (animações em classe arbitrária), vitest (ambiente `node`, testes de fonte e o gerador `spring` do `motion`).

**Spec:** aprovado pelo dono no chat em 2026-10-20 (medição e proposta abaixo). Medido com o gerador do `motion`, passos de 1ms: hoje os dois caminhos usam a mesma `SEPARACAO` 180/22 (p chega a 1 aos 330ms, pico 1,011, repouso aos 690ms), a mesma `VOLTA_DA_PILULA` (260ms) e a mesma placa (`menu-morph` 380ms, 60ms depois de o vão abrir; `menu-unmorph` 210ms). O que difere é o meio do gesto (com filtro o vão abre aos 134ms e o × acende aos 155ms; sem filtro, 211ms e 317ms) — isso é do gesto e **fica**. A proposta aprovada: mola 140/20 (p chega a 1 aos ~408ms, pico ~1,007, repouso ~770ms); fechar em 320ms; placa 460ms ao brotar e 260ms ao recolher; a casca segura a saída 60ms a mais; o teste de repouso vai a ≤800ms.

## Global Constraints

- O gesto não muda: nenhuma fase, fórmula ou ordem em `quadroDasBolhas`, `quadroDaGota`, `desenharBolhas`, `desenharGota`.
- `menu-morph`/`menu-unmorph` são compartilhados por todos os menus (`overlay-motion.test.ts` trava 380/210 lá): muda **só** o uso na placa da busca, na classe do `CommandDialog`.
- `SEPARACAO` só é usada pela busca (`src/components/ui/command.tsx`); `MOLA` não muda.
- Comentários em português, no tom do arquivo; números nos comentários que citam tempos ficam verdadeiros (remeça com o gerador e escreva os medidos).
- `src/components/ui/` pede confirmação do harness: o dono autorizou esta mudança.
- Verificação: `npx tsc --noEmit && npm run lint && npm run test:unit`.

## Review Focus

1. **Fechar logo depois de abrir** (toque no × antes de a mola repousar): a volta parte de onde está e a casca não desmonta antes de a pílula pousar na lupa → a espera da casca cobre a espera da pintura (até ~100ms) + 320ms + o pouso; teste de fonte no Step 1.
2. **A placa e a cascata das linhas** não ficam descompassadas da mola mais lenta: a placa ainda brota 60ms depois de o vão abrir (o atraso é do progresso, não do relógio) → teste de fonte no Step 1.
3. **Movimento reduzido** continua no esmaecer de hoje (`SAIDA`/`MOLA` no ramo sem viagem) → inalterado; o Step 1 confere que o ramo não usa `SEPARACAO`.
4. **Os outros menus** (`DropdownMenu`, `Select`…) seguem em 380/210 → `overlay-motion.test.ts` continua passando sem edição.
5. **A leitura da divisão** (cintura e pinça) na mola nova continua acima dos mínimos de hoje (cintura ≥ 90ms, pinça ≥ 100 quadros de 1ms) → o teste existente, com o repouso novo.

---

### Task 1: A busca respira mais devagar

**Files:**
- Modify: `src/lib/spring.ts:25-34` (`SEPARACAO` e o comentário dela)
- Modify: `src/components/ui/command.tsx` (`VOLTA_DA_PILULA` e o comentário; as classes `presence-hold_calc(...)`, `menu-morph_380ms...` e `menu-unmorph_210ms...` da casca do telefone; o comentário em `:211` com os tempos da cintura e da pinça; o comentário da casca "260ms… 400ms ao todo")
- Modify: `AGENTS.md:1357` ("volta em 260ms na `VOLTA_DA_PILULA`") e a menção da placa da busca, se houver
- Modify: `docs/design/HISTORICO-DESIGN-SYSTEM.md` (nova `### Rodada 350 — a busca abre mais devagar`, depois da 349, com a tabela medida de antes e depois)
- Test: `src/components/ui/command-versions.test.ts`

**Interfaces:**
- Produces: `SEPARACAO = { type: "spring", stiffness: 140, damping: 20 } as const`; `VOLTA_DA_PILULA = { duration: 0.32, ease: [0.2, 0, 0, 1] } as const`.

- [ ] **Step 1: Testes que falham** (`command-versions.test.ts`)
  - `:124` passa a esperar `const VOLTA_DA_PILULA = { duration: 0.32, ease: [0.2, 0, 0, 1] } as const`.
  - `:125` passa a esperar `data-closed:[animation:presence-hold_calc(var(--duration-slow)+var(--duration-instant)+60ms)]` (Review Focus 1: 300 + 100 + 60 = 460ms cobre a espera da pintura, os 320 e o pouso).
  - `:143` passa a esperar `data-open:[&_[data-slot=command-dialog-panel]]:[animation:menu-morph_460ms_linear_60ms_backwards]` (Review Focus 2: o atraso de 60ms fica; a placa segue pausada pelo efeito até o vão abrir).
  - `:144` passa a esperar `data-closed:[&_[data-slot=command-dialog-panel]]:[animation:menu-unmorph_260ms_linear_both]`.
  - Novo `it("a mola da busca é 140/20: p chega a 1 entre 380 e 440ms e passa do alvo menos que 1%")`: com `spring({ keyframes: [0, 1], ...SEPARACAO })` em passos de 1ms, o primeiro `t` com `value >= 1` fica em `[380, 440]` e o pico `< 1.01`; e `expect(SEPARACAO).toEqual({ type: "spring", stiffness: 140, damping: 20 })`.
  - Os dois testes de repouso (`:378` e `:472`) passam a `toBeLessThanOrEqual(800)` e o nome diz "repouso ≤ 800ms"; os mínimos de cintura (≥ 90) e pinça (≥ 100) ficam (Review Focus 5).
  - Review Focus 3: o ramo sem viagem continua sem `SEPARACAO` — o teste de `:110` (uma ocorrência só de `animate(de, 1, { ...SEPARACAO, onUpdate: quadro })`) já garante; não mude.
- [ ] **Step 2:** `npx vitest run src/components/ui/command-versions.test.ts` → FAIL nos asserts novos.
- [ ] **Step 3:** Trocar os números em `spring.ts` e `command.tsx`. Remedir com o gerador do `motion` (passos de 1ms) e reescrever os comentários com os números medidos: o de `SEPARACAO` (quando p cruza 0,1 / 0,6 / 0,7 / 1, o pico e o repouso; a cintura e a pinça), o de `:211` e o da casca ("a espera da pintura, a `VOLTA_DA_PILULA` (320ms) e o pouso; 460ms ao todo"); o comentário da placa ("…o `menu-unmorph` a recolhe ao mesmo ponto em 260ms").
- [ ] **Step 4:** `npx vitest run src/components/ui/command-versions.test.ts src/components/ui/overlay-motion.test.ts` → PASS (o segundo sem edição: Review Focus 4); depois a verificação global.
- [ ] **Step 5:** `AGENTS.md` e a Rodada 350 do histórico (grep "Rodada 349" para achar o fim; não leia o arquivo inteiro): o pedido ("levemente mais lento para apreciar"), a tabela de antes e depois medida, e que o meio do gesto difere entre os caminhos por desenho.
- [ ] **Step 6:** Commit `feat(busca): a abertura respira mais devagar` com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
