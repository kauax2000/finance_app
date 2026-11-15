# Telefone: telas de aba sem título — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** no telefone, as telas sem voltar deixam de mostrar o título grande; a subpágina segue com o nome na barra.

**Architecture:** `TituloDaTela` passa a renderizar `null` sempre; o `useEffect` que publica o nome da subpágina na barra (`publishPageTitle`) fica intacto. Nenhum componente de `src/components/ui/` muda.

**Tech Stack:** Next 16, React 19, Vitest (testes de fonte).

**Spec:** `docs/superpowers/specs/2026-11-15-telefone-sem-titulo-design.md`

## Global Constraints

- Não tocar em `src/components/ui/` nem em `src/app/globals.css`.
- A casca continua montando `<TituloDaTela … subpagina={Boolean(defaultMobileBackHref(pathname))} />` em `sidebar-app-shell.tsx` (o efeito da subpágina mora nele).
- Sem prettier. `git add` só dos arquivos da tarefa (nunca `graphify-out/graph.json`). Commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push.
- Comentários em português, no tom dos vizinhos.

## Review Focus

- Subpágina continua publicando o nome na barra ao rolar — o teste mantém as asserções do efeito.
- Membros e configurações da Você seguem com o nome fixo — `settings-rotas.test.ts` mantém `ROTAS_COM_TITULO_NA_BARRA.includes(pathname)` e `docked: fixo ||`.
- Imports que sobram (`PageHeader`, `PageHeaderTitle`, `ROUTES` se não usados) saem, para o lint passar.

---

### Task 1: `TituloDaTela` sem título grande

**Files:**
- Modify: `src/components/layout/titulo-da-tela.tsx`
- Test: `src/components/layout/titulo-da-tela.test.ts`
- Check: `src/app/(app)/settings/settings-rotas.test.ts` (deve seguir passando sem mudança)

**Interfaces:**
- Produces: `TituloDaTela({ pathname, titleMode, subpagina }): null` e `defaultMobileTitle` com a mesma assinatura (o `app-header.tsx` a importa).

- [ ] **Step 1: Write the failing test**

Em `titulo-da-tela.test.ts`, trocar o `describe` para "o nome da tela no telefone" e o `it` "só existe no telefone, menos na página Você, sobe para a barra…" por:

```ts
it("as telas de aba não têm título: nenhum PageHeader na casca do telefone", () => {
    expect(TITULO).not.toContain("<PageHeader")
    expect(TITULO).not.toContain("<PageHeaderTitle")
    expect(TITULO).toMatch(/return null\s*\}\s*$/)
})
```

No `it` da subpágina, tirar a asserção `if (!isMobile || subpagina || pathname === ROUTES.ME) return null` e manter as outras (o efeito). Manter os `it` da casca e de `chrome?.title ?? defaultMobileTitle(pathname, titleMode)`.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/layout/titulo-da-tela.test.ts`
Expected: o `it` novo FAIL.

- [ ] **Step 3: Implement**

O corpo de `TituloDaTela` termina em `return null` depois do `useEffect`; tirar o `PageHeader` e os imports que sobrarem. Reescrever o docstring: no telefone as telas de aba não têm título (a aba acesa diz onde se está); o componente só publica o nome da subpágina na barra ao rolar, ou fixo em `ROTAS_COM_TITULO_NA_BARRA`.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/components/layout/titulo-da-tela.test.ts "src/app/(app)/settings/settings-rotas.test.ts" && npx tsc --noEmit && npx eslint src/components/layout/titulo-da-tela.tsx`
Expected: PASS, sem erro de tipo nem de lint.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/titulo-da-tela.tsx src/components/layout/titulo-da-tela.test.ts
git commit -m "feat(telefone): as telas de aba abrem sem título

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2 (controlador): conferir e documentar

- [ ] A 375px: Painel, Transações e Categorias sem título, respiro abaixo da barra, carteira parada ao rolar; detalhe de uma categoria mostra o nome na barra ao rolar.
- [ ] `AGENTS.md` (Page chrome), `docs/JORNADAS.md` ("Nome da tela e voltar"), `docs/atlas/template.html` (texto e data), `python3 docs/atlas/build.py`, republicar o Atlas.
- [ ] Memória "header em toda tela revisada"; regra do `CLAUDE.md` sobre o título grande.
- [ ] `graphify update .`; commit dos docs.
