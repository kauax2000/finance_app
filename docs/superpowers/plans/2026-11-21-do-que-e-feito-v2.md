# "Do que é feito o mês" v2 — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O bloco passa a começar pelo que se controla: frase nova, o variável à esquerda na cor da categoria, o fixo compacto à direita e um rodapé comum.

**Architecture:** São duas mudanças:
- a frase e os dados que faltam, em `src/lib/composicao-do-mes.ts` (com TDD);
- a interface, em `src/components/categories/detail/do-que-e-feito-o-mes.tsx`.

**Tech Stack:** React 19, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-do-que-e-feito-v2-design.md`. Mockup: `docs/design/painel/do-que-e-feito-v2.html`.

## Global Constraints
- Vale o `AGENTS.md` inteiro: tokens, design system, par de identidade sem `gap`, helpers de dinheiro e de data, e nenhum componente em `src/app/`.
- Rode `graphify query` antes de buscar código e `graphify update .` depois de mudar.
- O banco do dev é produção: só leitura no app.
- Checks:
  - `npx tsc --noEmit`;
  - `npm run lint`;
  - `npx vitest run`;
  - `npm run ds:audit -- src/components/categories/detail`.
- Não faça push. Faça stage só dos seus arquivos (`CLAUDE.md` e `graphify-out/graph.json` são de outra sessão).
- Telas para conferir:
  - Renata: procure no app a categoria "Renata", de despesa, em `/categories`, mês 2026-11;
  - Carro: `/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11`.

## Review Focus
1. Variável normal e fixo puxando o mês: a frase não fala de "subiu/caiu" no variável.
2. Mais de 3 itens fixos: 3 linhas mais a soma, e a soma bate com o total da coluna.
3. Parcela com mais de 12 vezes: só "N/T", sem pontinhos.
4. Sem fixo: sem a coluna da direita, sem a barra e sem o rodapé; o variável ocupa a largura toda.
5. Receita: as palavras e os tons invertidos.

---

### Task 1: A frase nova e a interface v2

**Files:**
- Modify: `src/lib/composicao-do-mes.ts` e `src/lib/composicao-do-mes.test.ts`
- Modify: `src/components/categories/detail/do-que-e-feito-o-mes.tsx`
- Modify: a descrição do bloco no G9, em `docs/JORNADAS.md` e `docs/atlas/template.html`. Depois rode `python3 docs/atlas/build.py`. Não republique.

- [ ] **Step 1: Testes da frase**, com a concatenação exata do texto:
  - **Renata:** variável de 776 contra um normal de 464 (+67%), grupo novo "Corte e hidratação" de R$ 480, fixo caindo, total 4% abaixo. O texto é "O que você controla subiu 67%: R$ 776, R$ 312 acima do seu normal, puxado por Corte e hidratação (novo, R$ 480). As parcelas caíram, e o mês ficou 4% abaixo da média." Use o nome do grupo como `composicaoDoMes` o exibe; o teste monta o objeto à mão.
  - O variável dentro de ±5% cai nos casos de hoje, sem o "só por causa".
  - O fixo dentro de ±5% tira "As parcelas subiram/caíram".
  - A receita tem o tom invertido.
  - Se uma linha nova precisar da data do último lançamento do grupo, acrescente `ultimaYmd` ao grupo, com teste.

  Confira que os testes falham.
- [ ] **Step 2:** Implemente a frase.
- [ ] **Step 3: Interface**, conforme o spec:
  - a ordem e o peso das colunas;
  - os totais no cabeçalho de cada coluna;
  - a barra na ordem nova;
  - as linhas do variável com data e variação em reais;
  - o fixo compacto, com no máximo 3 linhas mais a soma;
  - o rodapé comum;
  - sem o "novembro".

  Os pontinhos do progresso:
  1. procure no catálogo (`npm run ds:catalog`) uma peça que sirva (`Stepper variant`, `Progress segments`);
  2. se servir, use;
  3. se não, crie a peça no DS, com registry, página de docs e teste (invariante 8, autorização permanente do dono).
- [ ] **Step 4: Navegador**, só leitura. Confira Renata e Carro nos dois temas e a 375px, e compare com o mockup.
- [ ] **Step 5:** Checks, `graphify update .` e commit `feat(categoria): "Do que é feito o mês" começa pelo que você controla`.
