# Limites recolhidos, com resumo e vazio bonito — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A seção Limites de Membros nasce recolhida, com um resumo curto no cabeçalho, e o estado "nenhum limite definido" ganha um vazio bonito.

**Architecture:** `LimitesSecao` troca o `PageSection` + `Card` por um `Collapsible variant="card"` com `CollapsibleRow` (título "Limites", resumo em `trailing`). O resumo é função pura em `src/lib/limites/limites.ts`. O vazio é o `EmptyState` do design system dentro do conteúdo, acima das linhas (que seguem com "Definir").

**Tech Stack:** Next.js, React, design system (`Collapsible`, `EmptyState`), vitest.

**Spec:** pedido do dono em 07/11/2026: "deixe essa feature meio escondida (não colapsável alguma coisa assim) … e crie também um anti-state mais bonito … não é a feature prioritária dessa tela". Ele respondeu à pergunta do resumo repetindo as duas opções; **decisão do controlador: resumo curto** no cabeçalho recolhido.

## Global Constraints

- Design system do `AGENTS.md`: nada novo em `src/components/ui/` nem em `globals.css`; sem cor crua. Componentes: `Collapsible` (`variant="card"`), `CollapsibleRow` (`trailing`), `CollapsibleContent`, `EmptyState` (`variant="plain"`, `size="sm"`), `EmptyStateIcon`, `EmptyStateTitle`, `EmptyStateDescription`. Ícone Heroicons `24/outline` no vazio (corpo do `EmptyStateIcon` pelo degrau).
- **Recolhida por padrão.** Abre sozinha quando o endereço traz `#limites` (links "Ver limite" dos avisos e do Painel, `src/lib/papeis/papeis.ts` → `destinoDoInsightDeLimite`), e `aria-controls`/foco seguem o `Collapsible`. Isso é **mudança de jornada**: atualizar `docs/JORNADAS.md` (linha do destino de "Ver limite", ~linha 1790, e a de Membros, ~397) e `docs/atlas/template.html`, rodar `python3 docs/atlas/build.py`; a republicação do Atlas é do controlador.
- O `id="limites"` e o contêiner em `page-client.tsx` ficam; o título dentro do cabeçalho é "Limites" (a `PageSectionDescription` sai de cima e vai para dentro do conteúdo aberto).
- Resumo (copy fixa, em `trailing`, texto muted, sem "R$"):
  - sem nenhum limite: `Nenhum limite definido`
  - com limites, ninguém acima: `{n} com limite` (`1 com limite`, `2 com limite`)
  - com alguém em 80% ou mais e ninguém acima de 100%: `{n} com limite · {m} perto`
  - com alguém acima de 100%: `{n} com limite · {k} acima` (k = quantos passaram 100%; "perto" não aparece junto)
- Vazio (só quando **ninguém** tem limite; copy fixa): título `Sem limites por enquanto`; descrição `Defina quanto cada pessoa pode gastar por mês. A pessoa e o dono recebem um aviso ao chegar a 80% e a 100% do limite.`; para quem não é dono, a descrição vira `O dono da carteira pode definir quanto cada pessoa gasta por mês.`; ícone `BellAlertIcon` (ou o que o catálogo tiver e combinar com "aviso"). As linhas das pessoas aparecem abaixo do vazio (o dono as usa para "Definir").
- O estado `indisponivel`, o diálogo de edição, o botão de ícone (lápis, `icon-lg`) e a barra com as faixas 80/100 não mudam. A frase de apoio vigente ("Defina quanto cada pessoa pode gastar por mês. A pessoa e o dono recebem um aviso ao chegar a 80% e a 100% do limite.") vai para dentro do conteúdo aberto quando há limites.
- Banco de dev = produção: não gravar nem remover limite ao testar.
- Commit só dos arquivos da tarefa (`git add <arquivos>`, nunca `-A`); trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`; sem `git stash`; `graph.json` fora do commit.

## Review Focus

1. Abrir `/members#limites` (ou clicar num "Ver limite") com a seção recolhida → ela abre e rola até o `#limites`. Teste de fonte + checagem no navegador.
2. Ninguém com limite e quem olha não é dono → o vazio não promete ação ("O dono … pode definir"), sem botão. Teste de fonte.
3. `indisponivel` (tabela fora do ar) → continua o estado neutro de hoje, sem resumo de "0 com limite". Teste de fonte.
4. Contagem do resumo com 1 pessoa só e com limite exatamente em 100% → "1 com limite · 1 perto" (100% não é "acima": acima é `> 100`). Teste da função pura.
5. Recolhida, o leitor de tela lê "Limites, {resumo}" e o estado expandido. Conferir o `CollapsibleRow` (não escrever `aria` à mão).

---

### Task 1: Seção recolhida, resumo e vazio

**Files:**
- Modify: `src/lib/limites/limites.ts` (+ `src/lib/limites/limites.test.ts`)
- Modify: `src/components/members/limites-secao.tsx`
- Modify: `src/app/(app)/members/page-client.tsx` (só se o contêiner `#limites` precisar do hash; senão não tocar)
- Test: `src/components/members/limites-secao.test.ts`, `src/components/members/membros.test.ts`
- Modify: `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html` (gerado)

**Interfaces:**
- Produces: `export function resumoDosLimites(linhas: LinhaDoLimite[]): string` em `limites.ts`, com a copy fixa acima (usa `nivelDoLimite`/`situacaoDoLimite` já existentes; "perto" = `pct >= 80 && pct <= 100`, "acima" = gasto > limite).

- [ ] **Step 1: Testes que falham** — `resumoDosLimites([])` → `"Nenhum limite definido"`; todas sem limite → idem; duas com limite, 29% e 40% → `"2 com limite"`; uma em 85% e outra em 29% → `"2 com limite · 1 perto"`; uma em 221% e outra em 85% → `"2 com limite · 1 acima"`; uma em exatamente 100% → `"1 com limite · 1 perto"`. Fonte de `limites-secao.tsx`: contém `<Collapsible`, `variant="card"`, `<CollapsibleRow`, `trailing={`, `resumoDosLimites(`, `<EmptyState`, `Sem limites por enquanto`, `O dono da carteira pode definir`, `window.location.hash`, e o ramo `indisponivel` não contém `resumoDosLimites`.
- [ ] **Step 2:** `npx vitest run src/lib/limites src/components/members` → FAIL.
- [ ] **Step 3: Implementar.** Recolhida por padrão: `defaultOpen` vem de `window.location.hash === "#limites"` lido num efeito (o servidor renderiza fechada; o efeito abre e rola `scrollIntoView` no `#limites`), e também em `hashchange`. A descrição de apoio e as linhas ficam em `CollapsibleContent`; o vazio entra antes das linhas quando `limites.length === 0`.
- [ ] **Step 4:** testes passam; `npx tsc --noEmit`; `npx eslint src/components/members src/lib/limites`; `npm run ds:audit -- src/components/members/limites-secao.tsx` sem achado; no navegador (`http://localhost:3000/members`, dono logado) conferir: recolhida com o resumo `2 com limite · 1 acima`; abrir; e `http://localhost:3000/members#limites` já abre. Para ver o vazio sem gravar nada, conferir pelo catálogo ou por um teste que renderize o ramo (não apagar os limites reais).
- [ ] **Step 5: Jornadas** — atualizar `docs/JORNADAS.md` e `docs/atlas/template.html` (os destinos "Ver limite" abrem a seção recolhida; o cabeçalho recolhido traz o resumo; o vazio) e rodar `python3 docs/atlas/build.py`.
- [ ] **Step 6: Commit** — `feat(membros): Limites recolhidos, com resumo e vazio` (com os docs e o `atlas-jornadas.html`).
