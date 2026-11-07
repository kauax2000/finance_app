# Limites: vazio como convite e linha em largura cheia — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o desenho da seção Limites de Membros: o vazio vira um convite (cartão tracejado com botão), a lista das pessoas ocupa a largura inteira, e o cabeçalho deixa de ser um cartão só.

**Architecture:** Só `src/components/members/limites-secao.tsx` (+ testes e docs). Sem limite nenhum e sem ter clicado: título "Limites" fora do cartão (`PageSection`, como Pessoas) e um `EmptyState variant="dashed"` com ícone, título, frase e um `Button` "Definir limites". Com limite, ou depois do clique: o `Collapsible variant="card"` de hoje, com as linhas **sem recuo duplicado**. O resumo curto continua no cabeçalho recolhido.

**Tech Stack:** Next.js, React, design system (`PageSection`, `EmptyState`, `Collapsible`, `Item`), vitest.

**Spec:** pedido do dono em 07/11/2026: "não gostei de tudo ser um card só com empty state e as pessoas embaixo; a linha da pessoa está ocupando só 80% da largura". Escolheu a **opção B** do mockup `public/_mockups/limites-vazio.html`.

## Global Constraints

- Design system do `AGENTS.md`: nada novo em `src/components/ui/` nem em `globals.css`; sem cor crua. Botão do vazio: `Button` (variant padrão `primary` não: **`secondary`**, já que o vazio é a única ação da área; uma `primary` por tela é do "Convidar pessoa").
- Copy fixa:
  - vazio, dono: título `Controle o gasto de cada pessoa`; descrição `Defina um valor por mês e a pessoa e o dono são avisados ao chegar a 80% e a 100%.`; botão `Definir limites`.
  - vazio, quem não é dono: título `Controle o gasto de cada pessoa`; descrição `O dono da carteira pode definir quanto cada pessoa gasta por mês.`; **sem botão**.
  - O ícone do vazio fica o `BellAlertIcon` de hoje (`EmptyStateIcon variant="circle"`).
- Estados:
  1. `indisponivel`: como hoje (inalterado).
  2. Ninguém com limite (`linhas.every(l => l.limite == null)`) e `definindo` falso: `PageSection` com `PageSectionTitle` "Limites" e o vazio. Não é recolhível (o vazio já é pequeno).
  3. Com limite, ou `definindo` verdadeiro: o `Collapsible variant="card"` de hoje (aberto quando vem `#limites` ou do clique em "Definir limites"), com o resumo no `trailing`. A frase de apoio vigente continua no topo do conteúdo.
  - O botão "Definir limites" põe `definindo = true` e abre o `Collapsible`; sem ação de volta (a seta do cabeçalho recolhe).
- **Linha em largura cheia:** o recuo duplicado sai. Dentro do `Collapsible variant="card"` o conteúdo não pode somar `--collapsible-px` (16) com o `px-4` do `Item`: as linhas ficam rente às bordas do cartão com o `px-4` do próprio `Item`, de modo que o lápis alinhe com o ⋯ de Pessoas (mesma coluna à direita). Conferir medindo `getBoundingClientRect` do lápis contra o ⋯ de Pessoas (mesma distância da borda direita do cartão).
- O diálogo, o lápis (`icon-lg`), a barra com as faixas 80/100, a porcentagem sobre a ponta direita, a abertura por `#limites` (mount, `hashchange` e clique em link `#limites`) e `indisponivel` não mudam.
- Banco de dev = produção: não gravar nem remover limite ao testar. A carteira ativa do dono hoje é "Viagem G4 Valley" (sem limites, 1 pessoa): serve para ver o vazio; **não trocar a carteira ativa**.
- Jornadas: o vazio e o botão mudam um passo da jornada de Membros — atualizar `docs/JORNADAS.md` (linha de Membros ~397 e a de Limites ~1790) e `docs/atlas/template.html`, rodar `python3 docs/atlas/build.py`. A republicação do Atlas é do controlador.
- Commit só dos arquivos da tarefa (`git add <arquivos>`, nunca `-A`); trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`; sem `git stash`; `graph.json` fora.

## Review Focus

1. Quem não é dono, sem limites: o vazio não tem botão e a frase não promete ação. Teste de fonte.
2. Clique em "Definir limites" → a lista aparece e o cabeçalho recolhível abre; recolher depois mostra "Nenhum limite definido". Navegador.
3. Com limites (outra carteira) a lista é a de hoje, em largura cheia. Só por teste/medida se não der para ver.
4. `indisponivel` não ganha o vazio. Teste de fonte.
5. O lápis e o ⋯ de Pessoas na mesma coluna. Medida no navegador.

---

### Task 1: O vazio como convite e a lista em largura cheia

**Files:**
- Modify: `src/components/members/limites-secao.tsx`
- Test: `src/components/members/limites-secao.test.ts`, `src/components/members/membros.test.ts` (se algo depender do antigo)
- Modify: `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html` (gerado)

- [ ] **Step 1: Testes que falham** (fonte sem comentários de `limites-secao.tsx`): contém `Controle o gasto de cada pessoa`, `Definir limites`, `O dono da carteira pode definir`, `<EmptyState`, `variant="dashed"`, `definindo`; o botão `Definir limites` está dentro do ramo `podeEditar` (não aparece no ramo de quem só lê); o ramo `indisponivel` não contém `EmptyState`; o `Collapsible variant="card"` continua com `resumoDosLimites(`; não há `Sem limites por enquanto`.
- [ ] **Step 2:** `npx vitest run src/components/members src/lib/limites` → FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4:** testes passam; `npx tsc --noEmit`; `npx eslint src/components/members`; `npm run ds:audit -- src/components/members/limites-secao.tsx`; no navegador em `http://localhost:3000/members` (carteira "Viagem G4 Valley"): o vazio, o clique em "Definir limites" (sem salvar nada), o lápis alinhado com o ⋯ de Pessoas por medida; telefone a 375 px.
- [ ] **Step 5: Jornadas** e `python3 docs/atlas/build.py`.
- [ ] **Step 6: Commit** — `feat(membros): Limites com o vazio como convite e a lista em largura cheia`.
