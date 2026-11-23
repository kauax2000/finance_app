# "Leitura do mês" — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** O cartão de insight vira a "Leitura do mês" do I1: brilho da marca, manchete serifada, até 2 motivos com régua e uma sugestão com ação.

**Spec:** `docs/superpowers/specs/2026-11-23-leitura-do-mes-design.md`. Mockup: `docs/design/painel/insight-do-mes-v3.html` (I1).

## Global Constraints
- Vale o `AGENTS.md` inteiro: uma peça de marca por tela, nada de arco-íris sob texto, tokens, Heroicons ou o caractere ✦, dinheiro com `reaisInteiros` e o par de identidade sem gap. A autorização permanente cobre mudanças no DS, que seguem a invariante 8.
- Antes de buscar código, rode `graphify query`. No fim, rode `graphify update .`.
- O banco do dev é produção: no app, só leitura. O botão "Ver …" só filtra a tela, e pode ser testado.
- Checks:
  - `npx tsc --noEmit`;
  - `npm run lint`;
  - `npm run test:unit`;
  - `npm run ds:audit -- src/components/categories/detail`.
- Não faça push. Faça stage só dos seus arquivos, e nunca do `CLAUDE.md` nem do `graphify-out/graph.json`.
- Não use prettier `--write` nos arquivos inteiros: ele reformata tudo.
- Telas:
  - Carro: `/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11`, onde o esperado é "subiu 14%", Abastecimento +R$ 340 e Seguro carro +R$ 296, e dezembro perto de R$ 3.202;
  - Renata: `/categories/411e7afa-7f98-485d-ad03-4ef2a6fbb35d?type=expense&month=2026-11`, com Corte e hidratação "novo" e Parcelas com −R$ 405.

## Review Focus
1. Motivos na direção errada: na Renata a manchete diz "subiu", e as parcelas, que caíram, só entram se a regra do spec as escolher. Confira que a regra está implementada exatamente como escrita.
2. Mês fechado: sem sugestão.
3. Receita: as palavras e os tons invertidos.
4. Sem média ou normal: sem motivos, sem régua e sem sugestão.
5. Telefone a 375px: a sugestão empilha, sem estouro horizontal.

---

### Task 1: A conta da leitura (TDD)
**Files:** `src/lib/composicao-do-mes.ts` e o teste dele.
- [ ] Testes de `leituraDoMes(c, despesa, yearMonth, aberto)` → `{ tom, manchete: ParteDaFrase[], apoio: ParteDaFrase[], motivos: { chave?: string; nome: string; detalhe?: string; delta: number; parte: "variavel" | "fixo" }[], sugestao: { mes: string; valor: number; grupo?: { chave: string; nome: string } } | null }`. Cubra os casos do spec com os números da Carro (+14%, os motivos 340 e 296 na ordem, a sugestão 443+2759) e da Renata, mais a receita, o caso sem média e o caso normal. Confira que os testes falham antes da implementação.
- [ ] Implemente. Remova `fraseDaComposicao` se ela ficar sem uso.
- [ ] Commit: `feat(categoria): a conta da leitura do mês (manchete, motivos e sugestão)`.

### Task 2: O cartão
**Files:** `src/components/categories/detail/do-que-e-feito-o-mes.tsx` (ou um `leitura-do-mes.tsx` novo), o `page-client` (se o botão precisar do controller) e o AGENTS.md (onde a Ledger mora).
- [ ] Monte o cartão conforme o spec, com a ligação do botão à busca da lista.
- [ ] No navegador, sem gravar nada: Carro e Renata no desktop e a 375px, comparando com o I1 do mockup. Clique em "Ver Abastecimento" e confirme que a lista filtra.
- [ ] Rode os checks e faça o commit: `feat(categoria): a leitura do mês no lugar da frase`. Faça o stage também do spec, do plano e dos mockups `insight-do-mes*.html`.
