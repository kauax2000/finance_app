# Leitura do mês: aurora com humor — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** O `Card glow="static"` vira a aurora de três luzes com borda integrada, e a prop `mood` (warm, cool ou neutral) escolhe a paleta. A Leitura do mês passa o `mood` pelo tom.

**Spec:** `docs/superpowers/specs/2026-11-23-leitura-aurora-humor-design.md`. Mockup: `docs/design/painel/leitura-do-mes-v4.html` (P1c, e o P1a como `neutral`).

## Global Constraints
- Vale o AGENTS.md: tokens com par escuro, `@utility` de marca depois de `no-scrollbar` (`glass.test.ts`) e a invariante 8 (página do Card, teste, bullet). Uma peça de marca por tela. A autorização permanente cobre mudanças no DS.
- Depois de mudar o CSS, confirme que a regra chegou em `.next/dev/static/chunks/*.css`. Se não chegou, rode `touch src/app/globals.css`.
- Rode `graphify query` antes de buscar e `graphify update .` no fim.
- No app, só leitura. A aba pode abrir na carteira "Teste · Detalhe": **não troque de carteira**, porque a troca grava `user_settings`. Use uma categoria dessa carteira (Mercado: `/categories/3fa71a92-b86f-416f-a2d0-3f3ce36ff33f?type=expense&month=2026-11`, que é o caso "sem média", `neutral`) e a página `/designsystem/card` para ver os três humores.
- Checks:
  - `npx tsc --noEmit`;
  - `npm run lint`;
  - `npm run test:unit`;
  - `npm run ds:audit -- src/components/categories/detail src/components/ui/card.tsx`.
- Não faça push, não use prettier `--write` nos arquivos inteiros e não faça stage do `CLAUDE.md` nem do `graphify-out/graph.json`.

## Review Focus
1. O tema claro: a aurora não pode sujar o texto (meça).
2. O `glow="pointer"` dos outros cartões de marca não muda.
3. O texto sobre a aurora mantém o contraste nos três humores.
4. A 375px a aurora não estoura o cartão (`overflow-clip`).
5. Os testes de marca (`brand-contour`, `glass`, `card-versions`) acompanham a mudança, sem perder as trancas que valem.

### Task 1: A aurora no DS e na Leitura
- [ ] Faça o CSS (`@utility brand-aurora` ou um nome equivalente, com `data-mood` ou uma variável por humor) e a prop `mood` no `Card`. Remova o que sobrar do `static` antigo.
- [ ] Atualize a página do Card, mostrando os três humores lado a lado, o teste em `card-versions` e o bullet e a exceção no AGENTS.md.
- [ ] Na Leitura do mês, passe o `mood` pelo `leitura.tom` e escreva o ✦ em arco-íris.
- [ ] Confira no navegador: `/designsystem/card` nos dois temas e a Mercado. Compare com o mockup.
- [ ] Rode os checks e faça o commit `feat(ds): a aurora de marca com humor (Leitura do mês)`, com o stage do spec, do plano e dos mockups `leitura-do-mes*.html`.
