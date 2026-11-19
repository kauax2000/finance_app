# Guia do atalho: passo 1 no palco Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refazer o passo 1 do `GuiaDoAtalho` com o celular flutuante, a legenda de vidro e o seletor Voz | Toque, e pôr o modo no nome sugerido do passo 2.

**Architecture:** Só `src/components/account/` (guia, `passo-a-passo.tsx`, um SVG novo) e o auditor; peças do design system já existentes (`ToggleGroup segmented`, tinta de vidro, `Button`).

**Tech Stack:** React, Tailwind v4 com os tokens do projeto, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-19-atalho-passo-1-palco-design.md` (mockup: `/private/tmp/claude-501/-Users-kaualeandro--claude-spares-spare-vc9NL2/0c7b41a7-5a4b-4b3a-b852-3a39b2b044c3/scratchpad/mock/passo1f.html`)

## Global Constraints

- Branch `finance-app-2.0`; stage só por caminho explícito (outras sessões commitam e fazem `git stash` aqui); sem push.
- Nada em `src/components/ui/` nem `src/app/globals.css`; token-first, zero literais de cor; Heroicons `16/solid` em slot de 16.
- Textos exatos: "E aí Siri, Lançar gasto"; botão do passo 1 "Continuar com Voz" / "Continuar com Toque"; lugares "Botão de Ação", "Costas", "Bloqueio", "Ícone"; passo 2 "O atalho se chama {nome}"; sufixos " · Voz" / " · Toque".
- O guia só aparece no iPhone com o app instalado: sem prévia no navegador.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- Trocar Voz ↔ Toque não muda a altura da caixa (fantasmas reservam o palco).
- Leitor de tela: o seletor e os ícones dos lugares têm nome; o celular e o orbe são `aria-hidden`.
- Nome editado pela pessoa não é sobrescrito ao trocar o modo; "Baixar de novo" mantém o nome do aparelho.
- Legenda da lista não repete o modo quando o nome já termina com ele.

---

### Task 1: Passo 1 no palco

**Files:**
- Modify: `src/components/account/passo-a-passo.tsx` (tamanho `palco` da `JanelaDoAparelho`), `src/components/account/guia-do-atalho.tsx`, `src/components/account/conta.test.ts`, o arquivo do auditor que declara `DRAWN_SVG_FILES` (achar com `grep -rn DRAWN_SVG_FILES scripts`)
- Create: `src/components/account/orbe-da-siri.tsx`

**Interfaces:**
- Produces: `JanelaDoAparelho tamanho="palco"`; `OrbeDaSiri({ className }: { className?: string })` (SVG `aria-hidden`).

- [ ] **Step 1: Testes que falham** (`conta.test.ts`, por fonte do guia): passo 1 tem `<ToggleGroup` com `variant="segmented"` e itens `Voz`/`Toque`; não há `<RadioGroup` no passo 1; há `tamanho="palco"`; há `<OrbeDaSiri`; o rodapé do passo 1 diz `Continuar com ${…}`; os ícones dos lugares têm `aria-label`. Rodar `npx vitest run src/components/account/conta.test.ts` → FAIL.
- [ ] **Step 2: Implementar**
  - `palco` em `JANELA`: caixa mais alta que `padrao` (o aparelho maior, ~`h-80` e `w-64`; ajuste até o degradê cortar no meio do aparelho), âncora no topo, degradê na base; sem alvo quando `tela.ponto` não vier.
  - Passo 1: título → `JanelaDoAparelho tamanho="palco"` com a tela do modo (Voz: `COMO_ABRIR.siri.tela`; Toque: a do lugar) → legenda de vidro sobrepondo a base do celular (`-mt-*`), uma linha: Voz = `OrbeDaSiri` + "E aí Siri, Lançar gasto"; Toque = ladrilho (`rounded-row bg-foreground text-background`, ícone do lugar) + nome do lugar + `ToggleGroup` só de ícones à direita → `ToggleGroup variant="segmented"` Voz | Toque (ícones `MicrophoneIcon`, `CursorArrowRippleIcon`) → `Muted` com a frase e o nome do atalho.
  - Altura fixa entre os modos: a legenda tem a mesma altura nos dois; os fantasmas incluem o passo 1 em Voz e em Toque.
  - Rodapé: no passo 1 o `FormSubmit` diz `Continuar com Voz`/`Continuar com Toque`; o `FormCancel` some (no telefone o DS já esconde; no desktop mantém — confira a regra do `DialogFooter` em AGENTS.md e não force).
  - `OrbeDaSiri`: SVG com gradientes radiais (rosa, azul, violeta) sobre fundo escuro, cores por tokens `--brand-*` quando couber; se precisar de cor literal, é desenho: entra na exceção do auditor junto do arquivo.
  - `DRAWN_SVG_FILES`: acrescentar `src/components/account/orbe-da-siri.tsx` com o motivo ("pictograma da Siri pedido pelo dono").
- [ ] **Step 3:** `npx vitest run src/components/account/conta.test.ts && npx tsc --noEmit && npm run lint && npm run ds:audit -- src/components/account` → PASS/limpo; `npm run test:unit` antes do commit.
- [ ] **Step 4:** Commit dos arquivos listados.

---

### Task 2: Modo no nome do passo 2 e na lista

**Files:**
- Modify: `src/components/account/guia-do-atalho.tsx`, `src/components/account/atalho-secao.tsx`, `src/components/account/conta.test.ts`, `docs/JORNADAS.md`, `docs/atlas/template.html` (+ `python3 docs/atlas/build.py`)

**Interfaces:**
- Consumes: `modo` do Task 1; `nomeLivre`, `legendaDoAparelho`.
- Produces: `nomeComModo(base: string, modo: Modo): string` (acrescenta " · Voz"/" · Toque", troca um sufixo existente); `legendaDoAparelho` omite o rótulo quando o nome já termina com " · Voz" ou " · Toque".

- [ ] **Step 1: Testes que falham**: `nomeComModo("iPhone de Kauã", "voz") === "iPhone de Kauã · Voz"`; `nomeComModo("iPhone de Kauã · Voz", "toque") === "iPhone de Kauã · Toque"`; `legendaDoAparelho({ ...base, name: "iPhone · Toque", atalho_gatilho: "toque" }, "Casa") === "Casa · ainda não lançou nada"`; fonte do guia contém `O atalho se chama`. Rodar → FAIL.
- [ ] **Step 2: Implementar**: sugestão ao abrir = `nomeComModo(nomeLivre(…), modo)`; ao trocar o modo, refaz a sugestão só se o nome ainda é a sugestão (não editado) e o código não existe; com `substituir`, mantém `substituir.name`. Passo 2 ganha um `Muted` "O atalho se chama {atual.nome}". `nomesEmUso` continua evitando repetição. Docs: uma frase em JORNADAS (linha "Tokens de captura") e no template; `build.py`.
- [ ] **Step 3:** testes, `tsc`, `lint`, `ds:audit` do guia; commit.
