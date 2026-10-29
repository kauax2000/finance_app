# Estorno no cartão no formulário — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o wireframe "Estorno no cartão" da aba Receita do formulário de lançamento por peças do design system, na mesma linguagem do diálogo.

**Architecture:** O comportamento fica igual (`estornoCartaoId` e `setEstornoCartaoId` do `useTransactionForm`; `formaDoPayload` grava `credit_card` com o cartão). Só a apresentação muda, dentro de `transaction-form-fields.tsx`, e o arquivo do wireframe é apagado (regra do AGENTS.md "Funcionalidade nova entra em wireframe": na revisão, o wireframe vira design system e o arquivo sai).

**Tech Stack:** Next 16, React 19, design system de `src/components/ui/`.

**Spec:** este documento (o dono pediu "faça tudo", sem perguntas; as decisões abaixo são do executor).

## Global Constraints

- Nada em `src/components/ui/` nem `globals.css`. Tokens apenas; Heroicons pela régua de tamanho; `<button>` cru com `type`.
- Banco de produção: nada se grava em teste manual.
- Testes: `npx tsc --noEmit && npm run lint && npm run test:unit` e `npm run ds:audit -- src/components/transactions/transaction-form-fields.tsx` limpos.

## O desenho (decisão do executor)

Na aba **Receita** (sem parcelas), no lugar do quadro tracejado, uma linha de preferência:

1. **`FormSwitch`** (a linha inteira clicável, como em Configurações), rótulo **"Estorno no cartão"**, descrição **"A compra voltou para o cartão: abate a fatura em vez de contar como receita."** Ligado ⇔ `estornoCartaoId != null`. Ligar escolhe o cartão pré-escolhido do formulário (o mesmo que o campo Cartão da despesa usa; senão o primeiro ativo); desligar grava `null`.
2. **Sem cartão ativo** (e nada gravado): o `FormSwitch` fica `disabled` e a descrição vira **"Cadastre um cartão para registrar um estorno."** — sem link extra (o vazio do campo Cartão da despesa já tem o botão "Cadastrar cartão").
3. **Ligado**: logo abaixo, o campo **"Cartão"** com o **mesmo seletor** que o campo Cartão da despesa usa neste arquivo (mesmo componente, mesmas linhas com a marca do cartão), valor `estornoCartaoId`. Um cartão gravado que saiu da lista (inativo) continua escolhido e aparece como **"Cartão inativo"**.
4. **Ligado**: uma nota curta abaixo do seletor (`FieldDescription` ou `Caption` muted): **"Abate a fatura do ciclo em que cai. A categoria é a da compra: o estorno desconta o orçamento dela."**
5. O espaçamento segue os `Field` vizinhos (`size="sm"`), sem moldura nova.

## Review Focus

- Cartão gravado inativo (fora de `activeCards`): continua escolhido, rotulado "Cartão inativo", e desligar o interruptor limpa.
- Sem cartões e sem valor: interruptor desabilitado, nada gravável.
- Trocar para Despesa/Parcelada esconde o bloco e o salvar ignora o estorno (comportamento atual de `formaDoPayload`).
- Enter: o interruptor e o seletor não enviam o formulário (regra "Forms and Enter-to-submit" do AGENTS.md).

---

### Task 1: O estorno em peças do design system

**Files:**
- Modify: `src/components/transactions/transaction-form-fields.tsx` (import L80; uso ~L809-815)
- Delete: `src/components/wireframe/estorno-wireframe.tsx`
- Modify: `src/components/wireframe/wireframe.test.ts` (L62-80: a asserção de import do `EstornoWireframe`) — trocar pela asserção nova
- Test: um `it` de fonte novo (em `wireframe.test.ts` ou no teste do formulário que já exista em `src/components/transactions/`) com `lerFonte`/`semComentarios` de `@/test/fonte`

**Interfaces:**
- Consumes: `estornoCartaoId: string | null`, `setEstornoCartaoId(id: string | null)`, `activeCards`, `creditCards` do `fieldsProps` (já no componente), e o pré-escolhido do campo Cartão (veja como o campo Cartão da despesa, ~L817, decide o cartão inicial; reuse a mesma função/valor).
- Produces: nada novo.

- [ ] **Step 1: Teste de fonte que falha**: o fonte sem comentários de `transaction-form-fields.tsx` não contém `EstornoWireframe`; contém `FormSwitch` com `"Estorno no cartão"`; o arquivo `src/components/wireframe/estorno-wireframe.tsx` não existe (`existsSync`).
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3:** implementar o desenho acima; apagar o wireframe; ajustar o teste antigo.
- [ ] **Step 4:** `npx tsc --noEmit && npm run lint && npm run test:unit` e o `ds:audit` do arquivo limpos.
- [ ] **Step 5:** `graphify update .`; commits `feat(lancamento): estorno no cartão em peças do design system` e `chore(graph): …`, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; nunca `CLAUDE.md` nem `.superpowers/`.
