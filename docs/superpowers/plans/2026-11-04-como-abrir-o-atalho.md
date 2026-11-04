# Passo "Como abrir o atalho" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No passo 6 do `GuiaDoAtalho`, o trilho de abas para de alargar o diálogo, e cada aba (Siri, Botão de Ação, Toque traseiro, Tela de início) mostra a sua tela do iPhone.

**Architecture:** As quatro maneiras de abrir já são a tabela `COMO_ABRIR` em `guia-do-atalho.tsx`; cada linha ganha a sua `tela: Tela` e o passo desenha `JanelaDoAparelho` com a tela da aba escolhida, no lugar do `como === "siri"`. O transbordo é de largura mínima: o `TabsList scrollable` contribui a largura das quatro abas (417px) para o tamanho mínimo dos ancestrais, e o corpo do diálogo (465px) passa da placa (448px).

**Tech Stack:** Next/React, Tailwind v4, vitest (testes de fonte com `lerFonte`/`semComentarios`).

**Spec:** sem documento; o dono pediu "Ajuste o design que está quebrado dentro dos passos para 6 e traga exemplos como tem no Siri nos outros" e "decida tudo". As decisões estão abaixo, marcadas como do construtor.

## Decisões (do construtor)

- As imagens são capturas reais do simulador do iOS 27, emolduradas por `scripts/atalho/moldura.py`, já em `src/components/account/assets/`:
  - `atalho-11-botao-de-acao.webp`: Ajustes › Botão de Ação na página "Atalho", com o botão "Escolher um Atalho…". Ponto `{ x: 50, y: 71.9 }`, âncora `"baixo"`.
  - `atalho-12-acessibilidade.webp`: a raiz de Ajustes. O simulador não tem Toque traseiro; a tela mostra o primeiro toque do caminho, Acessibilidade. Ponto `{ x: 30, y: 41.1 }`, âncora `"topo"`.
  - `atalho-13-tela-de-inicio.webp`: o menu do toque longo em "Lançar gasto" no app Atalhos. Ponto em Compartilhar, `{ x: 32, y: 67 }`, âncora `"baixo"`.
- O texto do Botão de Ação segue a tela real: `Ajustes › Botão de Ação › deslize até Atalho › Escolher um Atalho › Lançar gasto.`
- O trilho continua o `TabsList scrollable` do design system; quem conserta é a cadeia de largura mínima, não outro componente.

## Global Constraints

- Design system do `AGENTS.md`: nada em `src/components/ui/`, `globals.css` nem `designsystem/`; sem literais de cor ou medida (`p-[13px]`).
- Não rode prettier nos arquivos de `src/components/account/` (reformata o arquivo inteiro).
- Commit só dos arquivos da tarefa, por caminho explícito.

## Review Focus

- Diálogo a 448px (desktop) e gaveta a 375px (telefone): nenhum descendente passa da borda direita da placa; as abas que não cabem rolam.
- Trocar de aba troca a imagem sem pular a altura de forma brusca (a altura já anda na mola do `useAlturaAnimada`).
- A aba Siri continua com a mesma imagem e sem ponto.

---

### Task 1: Uma tela por maneira de abrir, e o trilho dentro da placa

**Files:**
- Modify: `src/components/account/guia-do-atalho.tsx` (imports das imagens, `TELA_DA_SIRI`, `COMO_ABRIR`, o bloco `{ultimo ? (...)}`)
- Add (já existem no disco, sem commit): `src/components/account/assets/atalho-11-botao-de-acao.webp`, `atalho-12-acessibilidade.webp`, `atalho-13-tela-de-inicio.webp`
- Test: `src/components/account/conta.test.ts` (o `it("o último passo ensina a abrir o atalho")`)

**Interfaces:**
- Consumes: `Tela` e `JanelaDoAparelho` de `@/components/account/passo-a-passo` (`Tela = { imagem, ponto?: { x, y }, ancora: "topo" | "baixo" }`).
- Produces: nada para fora; `COMO_ABRIR` continua local.

- [ ] **Step 1: Atualizar o teste**

No `it("o último passo ensina a abrir o atalho")`:
- troque a frase `"Ajustes › Botão de Ação › Atalho › Lançar gasto."` por `"Ajustes › Botão de Ação › deslize até Atalho › Escolher um Atalho › Lançar gasto."`;
- acrescente:

```ts
for (const a of ["atalho-5-siri", "atalho-11-botao-de-acao", "atalho-12-acessibilidade", "atalho-13-tela-de-inicio"])
    expect(g).toContain(`from "./assets/${a}.webp"`)
expect(g).toMatch(/tela=\{[^}]*COMO_ABRIR[^}]*\.tela\}/)
expect(g).not.toContain('como === "siri"')
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/account/conta.test.ts -t "o último passo ensina a abrir o atalho"`
Expected: FAIL (os imports novos e o texto novo não existem).

- [ ] **Step 3: Implementar**

- Importe as três imagens como as outras (`import acao from "./assets/atalho-11-botao-de-acao.webp"` etc.).
- Cada linha de `COMO_ABRIR` ganha `tela: Tela` com os valores das Decisões; a da Siri usa a tela que hoje é `TELA_DA_SIRI` (a constante sai). O `as const` não pode estreitar `tela` de forma que quebre o tipo `Tela`: declare a tabela com `satisfies` ou tipe as linhas.
- No passo 6, troque `{como === "siri" ? <JanelaDoAparelho tela={TELA_DA_SIRI} /> : null}` por uma `JanelaDoAparelho` só, com `tela={COMO_ABRIR.find((o) => o.valor === como)!.tela}` (ou equivalente que case o regex do teste), e `key={como}` se a imagem não trocar sem remontar.
- O transbordo: medido no navegador, `dialog-body` e `form` ficam com 465px dentro de uma placa de 448px, porque um ancestral do trilho tem `min-width: auto`. Dê `min-w-0` ao `PecaDoPasso` do passo 6 e, se ainda transbordar, ao ancestral flex/grid que medir mais que a placa, até o `scrollWidth` do `form` igualar o `clientWidth`. Sem `w-[…]` nem `max-w-[…]` literal.

- [ ] **Step 4: Rodar os testes e as checagens**

Run: `npx vitest run src/components/account/conta.test.ts && npx tsc --noEmit && npx eslint src/components/account/guia-do-atalho.tsx && npm run ds:audit -- src/components/account/guia-do-atalho.tsx`
Expected: tudo passa; o auditor sem achado novo.

- [ ] **Step 5: Commit**

```bash
git add src/components/account/guia-do-atalho.tsx src/components/account/conta.test.ts src/components/account/assets/atalho-11-botao-de-acao.webp src/components/account/assets/atalho-12-acessibilidade.webp src/components/account/assets/atalho-13-tela-de-inicio.webp
git commit -m "fix(atalho): o passo Como abrir mostra a tela de cada jeito e o trilho cabe no guia"
```
