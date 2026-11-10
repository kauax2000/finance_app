# Busca que abre, na tela cheia do Importar — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** na tela cheia ("Ver todos") do Importar extrato, a busca deixa a linha própria. Ela vira uma lupa fechada à direita, na linha das abas, antes das Ações. Tocar abre o campo animando, como a lupa do cabeçalho do telefone se estica em cápsula.

**Architecture:**
- Um componente novo da tela, `BuscaQueAbre`, em `src/components/transactions/importar/`. Ele fica fora de `src/components/ui/`, porque é peça de uma tela só.
- O componente compõe o `SearchInput` do design system e anima a largura com o `animate` do `motion`.
- A busca do `DataTable` passa a ser controlada (`globalFilter` / `onGlobalFilterChange`, props que já existem).
- O `toolbar` do `DataTable` vira só o publicador `<VisiveisDaTabela>` como elemento. Com isso a linha da barra some, e as Ações continuam contando as linhas filtradas pela busca.

**Tech Stack:** React 19, Tailwind v4, motion/react, Vitest (testes de fonte e de função pura; não há biblioteca de DOM).

**Spec:** pedido do dono (09/11/2026): "mova o campo de busca fechado para o lado direito junto com as ações e faça ele animar e abrir, como no mobile acontece, para pesquisar algo". O dono pulou as perguntas. As decisões abaixo são minhas.

## Comportamento (decisões minhas)

- **Onde:** só na tela cheia. Linha das abas: `[abas, à esquerda] … [busca] [Ações] [Ver menos]`. A busca vem antes das Ações, porque filtra o que as Ações vão alcançar.
- **Fechada:** um círculo de 36px (a altura das Ações e do Ver menos), na superfície de campo do `SearchInput`, só com a lupa. Nome acessível: "Buscar descrição".
- **Aberta:** o mesmo `SearchInput` (`size="lg"`, 36), a 18rem (288px) de largura, com o placeholder "Buscar descrição" e o × (`onClear`) quando há texto. O foco vai ao campo ao abrir.
- **A animação:** a pílula estica do círculo de 36 até os 288px, ancorada à direita, crescendo para a esquerda. É um elemento só: a lupa fica no mesmo lugar visual e o campo nasce dela, como a cápsula do cabeçalho do telefone. A largura anda na `MOLA_PALCO` de `lib/spring`, sem passar do alvo, porque modal pede movimento sóbrio. O texto do campo (placeholder e valor) esmaece ao chegar, depois que a largura passou da metade. Fechar faz o espelho, em `SAIDA`. Com movimento reduzido, troca na hora.
- **Quando fecha:** ao perder o foco com o campo vazio, ou com Esc e o campo vazio. Com texto, a pílula fica aberta.
- **Esc:**
  - com texto, o primeiro Esc limpa;
  - com o campo vazio, o Esc fecha a pílula e devolve o foco à lupa.
  
  Nos dois casos `stopPropagation`: o Esc não pode chegar ao diálogo, que perguntaria "Descartar alterações?".
- **`/`:** fora de campo de texto, abre e foca (o atalho que a barra do `DataTable` dava). Use o `shortcut="/"` do próprio `SearchInput` se ele funcionar com a pílula fechada; senão, um `keydown` no `document` com `isEditableTarget` / `matchShortcut` de `lib/shortcut`.
- **Recolher:** ao voltar ao compacto, a busca zera, porque a lista compacta não a usa.
- **Telefone:** a tela cheia no telefone é rara, mas a regra é a mesma. Fechada, a pílula mede 44 no toque (piso do `SearchInput`). Aberta, o teto é `min(18rem, 100%)` e as abas rolam como hoje.

## Global Constraints

- Não tocar `src/components/ui/`, `src/app/globals.css`, `CLAUDE.md`, `graphify-out/` (exceto `graphify update .`). Só tokens: durações e curvas de `--duration-*` / `--ease-*` e as molas de `lib/spring` (`MOLA_PALCO`, `SAIDA`).
- Ícones Heroicons pela régua do tamanho (`16/solid` para o de 16).
- Sem prettier. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push.
- O banco do dev é produção: no navegador, nunca clicar Importar nem Desfazer.
- Verificação de cada tarefa:
  - `npx tsc --noEmit`
  - `npx eslint src/components/transactions/importar`
  - `npx vitest run src/components/transactions/importar`
  - `npm run ds:audit -- src/components/transactions/importar`

## Review Focus

1. Esc com a pílula aberta não abre o "Descartar alterações?" do diálogo.
2. Buscar "Uber" e abrir Ações: o menu conta só as linhas filtradas (hoje dá "todos os 4" no CSV de teste).
3. Recolher com texto na busca e voltar a "Ver todos": a busca está vazia e a tabela mostra todas.
4. Tocar a lupa duas vezes rápido ou perder o foco no meio da animação: a largura segue de onde está, sem saltar.
5. Movimento reduzido: abre e fecha na hora, sem largura presa no meio.

---

### Task 1: `BuscaQueAbre`

**Files:**
- Create: `src/components/transactions/importar/busca-que-abre.tsx`
- Test: `src/components/transactions/importar/importar-extrato-dialog.test.ts` (o `describe` de fonte que já lê os arquivos da pasta, com o `ler(...)` de lá)

**Interfaces:**
- Produces:
  ```ts
  export function BuscaQueAbre(props: {
      value: string
      onChange: (v: string) => void
      /** Placeholder e nome acessível da lupa fechada. */
      label: string
      disabled?: boolean
  }): React.ReactElement
  /** Pura: o que o Esc faz com a pílula. */
  export function efeitoDoEsc(valor: string): "limpar" | "fechar"
  ```

- [ ] **Step 1: testes que falham.**
  - `efeitoDoEsc("Uber")` é `"limpar"`; `efeitoDoEsc("")` é `"fechar"`.
  - A fonte de `busca-que-abre.tsx` contém:
    - `SearchInput`, `size="lg"`;
    - `MOLA_PALCO` e `SAIDA`;
    - `stopPropagation`;
    - `prefers-reduced-motion` (ou o `useReducedMotion` do motion);
    - `18rem`.
- [ ] **Step 2:** `npx vitest run src/components/transactions/importar` → FAIL.
- [ ] **Step 3: implementar o "Comportamento".**
  - `aberta = foco || value !== ""`.
  - A largura do invólucro anda por `animate(el, { width }, …)` do `motion`, a partir da largura atual medida, para a interrupção não saltar.
  - Fechada, um `<button type="button">` cobre a pílula e abre. Ele tem `aria-label={label}` e `aria-expanded={false}`. Nada de `Button` do design system por cima de outro controle se isso duplicar o foco; o `input` fechado fica `tabIndex={-1}` e `aria-hidden`.
  - Sem `#hex` nem `px` arbitrário fora de `18rem` e do 36 que a escada já dá (`size-9`).
  - O `ds:audit` precisa passar. Se ele reprovar algo inevitável, diga no relatório e não mexa no auditor.
- [ ] **Step 4:** a Verificação passa.
- [ ] **Step 5:** commit `feat(importar): a busca que abre da lupa, para a tela cheia`.

### Task 2: a busca na linha das abas

**Files:**
- Modify: `src/components/transactions/importar/conferir-importacao.tsx`
- Test: `src/components/transactions/importar/importar-extrato-dialog.test.ts`

**Interfaces:**
- Consumes: `BuscaQueAbre` (Task 1).
- O `DataTable` aceita `globalFilter?: string`, `onGlobalFilterChange?: (v: string) => void` e `toolbar` como elemento React, que é desenhado cru, sem a linha da barra.

- [ ] **Step 1: testes de fonte que falham.**
  - Some o `/toolbar=\{\{ search: "Buscar descrição"/` atual.
  - `conferir-importacao.tsx` contém `toolbar={<VisiveisDaTabela onChange={setDaTabela} />}`, `globalFilter={busca}` e `onGlobalFilterChange={setBusca}`.
  - Na linha das abas, em ordem: `<BuscaQueAbre` antes de `<AcoesDasVisiveis imp={imp} itens={daTabela ?? imp.visiveis}`, e esta antes de `botaoRecolher`.
  - O Recolher zera a busca: `setBusca("")` aparece no caminho do `alternar`/`trocar` que volta ao compacto.
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3:** implementar. `const [busca, setBusca] = React.useState("")` em `ConferirImportacao`; `<BuscaQueAbre value={busca} onChange={setBusca} label="Buscar descrição" disabled={travado} />` na linha das abas, só com `imp.expandido`.
- [ ] **Step 4:** a Verificação passa.
- [ ] **Step 5:** commit `feat(importar): na tela cheia a busca mora fechada na linha das abas`.

### Task 3: conferir no navegador (controlador)

- [ ] No Importar com o CSV de teste, em "Ver todos" (só ler; **nunca clicar Importar**), passe pelos cinco pontos do Review Focus:
  - lupa fechada à direita;
  - tocar abre esticando;
  - digitar filtra;
  - Ações contam as filtradas;
  - Esc limpa e depois fecha, sem o "Descartar alterações?";
  - Recolher zera.

  Mande prints ao dono.
