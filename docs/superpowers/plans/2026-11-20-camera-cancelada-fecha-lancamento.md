# Câmera cancelada fecha o lançamento inteligente — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No telefone, sair da câmera do "Adicionar recibo" sem tirar foto fecha o lançamento inteligente e volta à tela de antes, em vez de deixar o campo aberto sem teclado.

**Architecture:** Hoje o `cancel` do `<input type="file">` chama `voltar`, que dá `focus()` no campo — no iOS, `focus()` fora de um gesto não abre o teclado, e o campo fica na tela sem ele. O ouvinte passa a seguir a mesma regra do ✓ do teclado (o `onBlur` do campo): com frase, lê; vazio, fecha (`onOpenChange(false)`).

**Tech Stack:** Next.js / React, Vitest (testes de fonte com `lerFonte`).

**Spec:** pedido do dono em 20/11/2026 (esta conversa): "se eu sair da câmera antes de tirar a foto, feche o campo de lançamento inteligente e volte para a tela que estava antes".

## Global Constraints

- Só no telefone (o efeito já é guardado por `open && telefone`). Desktop não muda.
- Mudança de caminho de cancelar = mudança de jornada (AGENTS.md): `docs/JORNADAS.md`, `docs/atlas/template.html`, `python3 docs/atlas/build.py` e republicar o Atlas no mesmo URL.
- Nada em `src/components/ui/` nem `globals.css`.

## Review Focus

- Frase já digitada antes de abrir a câmera: não perder o texto em silêncio — lê, como o ✓.
- Leitura em andamento ou salvando (`lendoIA`, `saving`) ou revisão aberta (`placa`): o cancel não fecha nem relê.
- Foto escolhida (o `change`, não o `cancel`): segue lendo, sem fechar.
- Desktop: o seletor de arquivo cancelado não fecha nada.

---

### Task 1: O `cancel` da câmera fecha (ou lê a frase)

**Files:**
- Modify: `src/components/transactions/lancamento-inteligente.tsx:325-349` (o efeito do `tocou` com o ouvinte `cancel`)
- Test: `src/components/transactions/lancamento-inteligente.test.ts:68-72`

**Interfaces:**
- Consumes: `onOpenChange`, `leitura.interpretar()`, `leitura.texto`, `placa`, `lendoIA`, `saving` — já no escopo do componente.
- Produces: nada novo.

- [ ] **Step 1: Trocar a asserção do teste "no telefone o campo não fica sem teclado"**

Troque `expect(fonte).toMatch(/addEventListener\("cancel", voltar\)/)` por:

```ts
expect(fonte).toMatch(/addEventListener\("cancel", cancelou\)/)
expect(fonte).toMatch(/const cancelou = \(\) => \{[\s\S]{0,300}onOpenChange\(false\)/)
expect(fonte).not.toContain("addEventListener(\"cancel\", voltar)")
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/transactions/lancamento-inteligente.test.ts`
Expected: FAIL no teste "no telefone o campo não fica sem teclado".

- [ ] **Step 3: Implementar**

No efeito, troque `voltar` por `cancelou`, com a guarda do `onBlur`: retorna se `placa || lendoIA || saving`; com `leitura.texto.trim()`, `leitura.interpretar()`; senão `onOpenChange(false)`. Atualize o comentário ("Câmera cancelada: …") para dizer que segue a regra do ✓. Acrescente às dependências do efeito o que o ouvinte lê (ou leia por ref, se o efeito não puder re-rodar a cada tecla — ele registra o `pointerdown`; o mais simples é um `useRef` com a função atual, padrão `xRef.current = …` a cada render).

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/components/transactions/lancamento-inteligente.test.ts && npx tsc --noEmit && npm run lint -- src/components/transactions/lancamento-inteligente.tsx`
Expected: PASS, sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/components/transactions/lancamento-inteligente.tsx src/components/transactions/lancamento-inteligente.test.ts
git commit -m "fix(lancamento): sair da câmera sem foto fecha o lançamento"
```

### Task 2: Jornada e Atlas

**Files:**
- Modify: `docs/JORNADAS.md:943` (linha "Lançamento inteligente" da tabela de regras)
- Modify: `docs/atlas/template.html:647`
- Generate: `docs/atlas/atlas-jornadas.html`

- [ ] **Step 1:** Em `JORNADAS.md:943`, depois de "A foto entra pela pílula do recibo, por colar ou por soltar (…)", acrescente: "No telefone, sair da câmera sem tirar foto segue a regra do ✓ do teclado: vazio, fecha e volta à tela de antes; com frase, lê."
- [ ] **Step 2:** Em `template.html:647`, a mesma frase em linguagem da página, logo antes de "Fechar descarta, sem perguntar."
- [ ] **Step 3:** Run `python3 docs/atlas/build.py`. Expected: gera `docs/atlas/atlas-jornadas.html` sem erro.
- [ ] **Step 4:** Commit `docs(jornadas): câmera cancelada fecha o lançamento`.
- [ ] **Step 5 (controlador):** republicar `docs/atlas/atlas-jornadas.html` no URL do Atlas (https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL) e rodar `graphify update .`.
