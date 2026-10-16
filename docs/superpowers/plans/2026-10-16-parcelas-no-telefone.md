# Linha Valor + Parcelas no telefone — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Na Compra parcelada do formulário de lançamento, Valor e Parcelas ocupam uma linha cada no telefone, e o Parcelas vira três peças soltas: um círculo com o −, o campo e um círculo com o +.

**Architecture:** Só a tela muda (`transaction-form-fields.tsx`). O `FieldRow` empilha abaixo de `md` (768px, onde o diálogo vira gaveta) e volta às duas colunas no desktop, com a coluna das parcelas alargada a 10rem para caber as três peças. O stepper sai do `InputGroup` (botões dentro do campo) e passa a ser um `ButtonGroup` com um `Input` no meio: o grupo já separa campo e botões por 8px e leva tudo a 40px no toque (`button-group.tsx:37-38`). Nenhum componente de `ui/` muda.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, Vitest (testes de fonte por `lerFonte`/`semComentarios`).

**Spec:** sem documento. O pedido do dono (2026-10-16), na íntegra: "No mobile eu quero que o valor e o parcelas cada um ocupa sua linha, sem ocupar a mesma linha dividida em duas colunas e o parcelas eu quero que fique fácil o clique de usar então você pode separar em três instâncias então o menos separado em um círculo, o campo de parcelas e o mais separado em outro." O dono pulou as perguntas; as decisões abaixo marcadas "Decisão" são do controlador.

## Global Constraints

- `src/components/ui/` e `src/app/globals.css` não mudam (exigem autorização do dono).
- Uma árvore só: nada de duas versões com `md:hidden` / `hidden md:flex`.
- Ícones: `MinusIcon`/`PlusIcon` de `@heroicons/react/16/solid` (já importados).
- Sem commit: o dono comita só quando pede, e o arquivo já tem outras mudanças não comitadas.
- Não rodar dev server novo: a prévia usa `dev-attach` (o `next dev` já roda em :3000).

## Decisões

- Decisão: o stepper separado vale também no desktop (uma árvore só; o dono pediu "fácil de clicar", o que não piora no mouse). Só o empilhamento é exclusivo do telefone.
- Decisão: círculos `Button variant="secondary" size="icon-lg"` (36 no desktop, 40 no toque). `secondary` é o botão de peso médio que não disputa com o `primary` do rodapé.
- Decisão: o empilhamento corta em `md` (768px), o mesmo ponto em que `<Dialog surface="auto">` vira gaveta, e não no `sm` do `FieldRow stack`.

## Review Focus

1. Parcelas em 2 → o − continua desabilitado (`parcelas <= 2`), e o + sobe para 3.
2. O campo vazio (`installmentCount === ""`) → o + leva a 2 (o `Math.max(2, …)` atual), sem `NaN`.
3. O rótulo "Parcelas" continua ligado ao campo (o `FieldControl` envolve o `Input` direto, que precisa continuar filho direto do `ButtonGroup` para o seletor `>[data-slot=input]` casar).
4. A prévia (`tx-inst-preview`) continua na descrição do campo de parcelas.
5. No desktop (≥768px) as três peças cabem em 10rem sem o número cortar (36 + 8 + 72 + 8 + 36 = 160px).

---

### Task 1: Linha empilhada no telefone e stepper em três peças

**Files:**
- Modify: `src/components/transactions/transaction-form-fields.tsx:4-24` (imports) e `:531-613` (o `FieldRow` da parcelada)
- Test: `src/components/transactions/transaction-form-layout.test.ts:139-150` (o caso "a parcelada: − e + nas parcelas…")

**Interfaces:**
- Consumes: `ButtonGroup` de `@/components/ui/button-group`; `Button` de `@/components/ui/button` (já importado); `Input` de `@/components/ui/input`; `FieldControl` de `@/components/ui/field` (já importado).
- Produces: nada para outras tarefas.

- [ ] **Step 1: Escrever o teste que falha**

No `it("a parcelada: − e + nas parcelas, resumo sempre à vista, crédito de saída", …)`, acrescente:

```ts
// No telefone cada campo ocupa a sua linha; no desktop as parcelas ganham 10rem.
expect(CAMPOS).toContain('className="grid-cols-1 md:grid-cols-[minmax(0,1fr)_10rem]"')
expect(CAMPOS).not.toContain("grid-cols-[minmax(0,1fr)_8rem]")
// O − e o + são círculos soltos, fora do campo: um ButtonGroup com o Input no meio.
expect(CAMPOS).toMatch(/<ButtonGroup>[\s\S]{0,300}aria-label="Uma parcela a menos"[\s\S]{0,900}<FieldControl>\s*<Input[\s\S]{0,900}aria-label="Uma parcela a mais"[\s\S]{0,300}<\/ButtonGroup>/)
expect(CAMPOS).not.toMatch(/<InputGroupButton/)
expect(CAMPOS.match(/variant="secondary"\s+size="icon-lg"/g)?.length).toBe(2)
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/transactions/transaction-form-layout.test.ts`
Expected: FAIL no caso da parcelada (a classe `grid-cols-1 md:…` não existe).

- [ ] **Step 3: Implementar**

Em `transaction-form-fields.tsx`:
- `FieldRow stack={false} className="grid-cols-1 md:grid-cols-[minmax(0,1fr)_10rem]"` (o `cn` do `FieldRow` resolve o `grid-cols-2` do `stack={false}`).
- O `Field` das parcelas: troque o `InputGroup` por `<ButtonGroup>` com três filhos diretos, nesta ordem: `Button variant="secondary" size="icon-lg"` com `aria-label="Uma parcela a menos"`, o `disabled` e o `onClick` atuais e `<MinusIcon />`; `<FieldControl><Input … /></FieldControl>` com os mesmos props do `InputGroupInput` de hoje (`id="tx-inst-n"`, `type="number"`, `inputMode="numeric"`, `min={2}`, `step={1}`, `value`, `onChange`, `placeholder="12"`, `aria-describedby="tx-inst-preview"`) e `className="nums px-0 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"`; `Button variant="secondary" size="icon-lg"` com `aria-label="Uma parcela a mais"`, o `onClick` atual e `<PlusIcon />`.
- Imports: adicione `ButtonGroup` e `Input`; remova `InputGroupAddon` e `InputGroupButton` se nada mais os usar (o `InputGroup` do Valor continua).
- Atualize o comentário do bloco, se houver, para dizer por que o stepper saiu do campo (alvo de toque).

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/components/transactions src/components/ui`
Expected: PASS.

- [ ] **Step 5: Tipos, lint e auditor**

Run: `npx tsc --noEmit && npx eslint src/components/transactions/transaction-form-fields.tsx src/components/transactions/transaction-form-layout.test.ts && npm run ds:audit -- src/components/transactions/transaction-form-fields.tsx`
Expected: sem erros; o auditor sem violação nova nesse trecho.

- [ ] **Step 6: Conferir na prévia (controlador)**

`preview_start dev-attach`, viewport 375×812, abrir "+" → Parcelada. Medir por DOM: as linhas de Valor e Parcelas com `top` diferentes; o − e o + com 40×40 e `border-radius` de círculo; 8px entre cada peça; o − desabilitado com 2. Em 1280px: as duas colunas lado a lado, coluna de 160px, número inteiro à vista.
