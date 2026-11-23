# A aurora da Leitura do mês, mais calma — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O `Card variant="brand" glow="static"` ganha borda neutra em volta, com o degradê só no terço de cima, sem o brilho das laterais e com a aurora mais fraca.

**Architecture:** Uma mudança de CSS na `@utility brand-aurora` e nos tokens `--brand-aurora-opacity`, uma linha em `card.tsx`, e o registro (docs, testes, AGENTS, histórico).

**Tech Stack:** Tailwind v4 (`@utility`), vitest.

**Spec:** `docs/superpowers/specs/2026-11-23-leitura-arco-iris-calmo-design.md`. Mockup: `docs/design/painel/leitura-arco-iris-calmo.html` (opção M1).

## Global Constraints
- Vale o `AGENTS.md` inteiro: tokens com par escuro, `@utility` de marca depois de `no-scrollbar`, volume num token só (nunca nas paradas).
- Rode `graphify query` antes de buscar código e `graphify update .` depois.
- CSS novo só conta depois de servido: procure a regra em `.next/dev/static/chunks/`; se faltar, `touch src/app/globals.css`.
- O banco do dev é produção: no app só leitura; nunca troque de carteira.
- Checks: `npx tsc --noEmit`, `npm run lint`, `npx vitest run`, `npm run ds:audit -- src/components/ui/card.tsx src/components/categories/detail`.
- Não faça push. Faça stage só dos seus arquivos (`CLAUDE.md` e `graphify-out/graph.json` são de outra sessão). Nunca rode prettier `--write` em arquivo inteiro.
- Tela: Carro, `/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11`.

## Review Focus
1. Tema claro: o fio e a aurora ainda aparecem, sem sumir nem manchar o texto.
2. Os três humores (`warm`, `cool`, `neutral`): o fio usa as cores do humor.
3. A borda neutra e o degradê formam um anel só, sem linha dupla no topo.
4. Nenhum outro consumidor de `brand-aurora` além do `Card` quebra.
5. O `glow="pointer"` (o brilho de ponteiro) não muda.

---

### Task 1: A cor só em cima

**Files:**
- Modify: `src/app/globals.css` (`@utility brand-aurora`; `--brand-aurora-opacity` no `:root` e no `.dark`)
- Modify: `src/components/ui/card.tsx` (o composto `brand` + `static`)
- Modify: `src/components/ui/brand-contour.test.ts`, `src/components/ui/card-versions.test.ts`
- Modify: `src/app/designsystem/docs/card.tsx` (texto da "Marca acesa")
- Modify: `scripts/tone-contrast.mjs` só se a medição da aurora depender da geometria antiga
- Modify: `AGENTS.md` (bullet do `Card` e a lista de exceções do arco-íris sob texto), `docs/design/HISTORICO-DESIGN-SYSTEM.md` (rodada nova)

- [ ] **Step 1:** Atualize os testes para o que o spec pede: o composto `brand`+`static` não tem `border-transparent`; o `brand-aurora` não tem `box-shadow` inset; a máscara do `::before` desce a transparente aos 50% (`rgb(0 0 0 / 0.35) 22%, transparent 50%`); a borda neutra existe nos quatro lados; `--brand-aurora-opacity` é `0.3` no `:root` e `0.55` no `.dark`. Confira que falham.
- [ ] **Step 2:** Implemente conforme o spec, itens 1 a 4 (valores exatos lá). Mantenha o padrão sRGB + `@supports` `in oklch` do `::before`.
- [ ] **Step 3:** `node scripts/tone-contrast.mjs` (ou o comando que o arquivo documenta); anote o pior caso da aurora no comentário do token e no AGENTS.md.
- [ ] **Step 4:** Registro: página de docs, AGENTS.md, histórico.
- [ ] **Step 5: Navegador**, só leitura: a Carro nos dois temas e a 375px, e a página `/designsystem/card` com os três humores. Compare com o M1 do mockup.
- [ ] **Step 6:** Checks, `graphify update .` e commit `style(card): a aurora da marca fica só no topo, com borda neutra`.
