# Insights do detalhe da categoria: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** trocar o insight único do detalhe da categoria por até 9 tipos, cada um num `Card` com título, número, linha e ação, mostrados um por vez num carrossel.

**Architecture:**
- Uma lib pura (`src/lib/insights-da-categoria.ts`) monta os insights locais e recorta os da caixa da carteira, num formato único, já ordenado.
- Um hook lê a caixa (`insights`) por conta própria.
- O componente `InsightsDaCategoria` desenha o carrossel, e as ações reusam `lib/insights/acoes.ts`.
- O detector `sazonal` passa a guardar a categoria. O deploy da Edge fica fora do plano, com o controlador.

**Tech Stack:** Next 16, React 19, Tailwind v4, TanStack Query, Supabase JS, vitest, Embla (o `Carousel` do design system).

**Spec:** `docs/superpowers/specs/2026-11-24-insights-da-categoria-design.md` (com a seção "Decisões da revisão do construtor"). Mockup: `docs/design/painel/insights-da-categoria.html`.

## Global Constraints

- **Os 9, na ordem:** 1 duplicado · 2 a conferir · 3 ritmo contra o limite · 4 gasto do ano que volta · 5 parcela que termina · 6 gasto que se repete · 7 assinatura mais cara · 8 sugestão de limite · 9 concentração. Título, número, linha e ação de cada um são os da tabela do spec, literalmente.
- **Valores no número:**
  - em reais inteiros, com `reaisInteiros` (`src/components/categories/detail/regua-do-mes-contas`);
  - o preço da assinatura com centavos (`currencyBRL`);
  - "/mês" quando a tabela diz.
- **Tom do número:** `success` só na parcela que termina e `warning` só no ritmo contra o limite. Os outros ficam na tinta do texto.
- **O convidado** (`!podeEscrever`) não vê insight cuja ação escreve: limite, ajustar limite, recorrência, atualizar preço e conta a pagar.
- **O detalhe não marca `seen` ao abrir.** Agir marca `acted` (`marcarInsight`). O `sazonal` marca `seen` ao tocar (`statusAoTocarOLink`).
- **Copy:** nenhuma das `PALAVRAS_PROIBIDAS` (`supabase/functions/_shared/insights/textos.ts`).
- **Design system:**
  - só peças de `src/components/ui/`, raio da escala;
  - sem arco-íris;
  - o `Card` é o padrão (`outline`), e a ação vai em `CardAction` com `Button variant="tertiary" size="sm"`;
  - peça ou variant nova no design system entra com registry, página e teste.
- **Banco de produção, só leitura** na verificação: nenhum teste ou conferência executa uma ação que grava.
- **Git e deploy:**
  - não fazer push nem deploy;
  - não fazer stage de `CLAUDE.md` nem de `graphify-out/graph.json`;
  - não rodar `prettier --write` em arquivo inteiro.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **Insight da caixa de outra categoria:** nunca aparece. Testes de `insightsDaCaixa` com uma linha de cada tipo fora da categoria (Tarefa 1).
- **Payload antigo ou incompleto:** o `sazonal` sem `category_id` e a `recorrencia` sem `nome` somem sem quebrar (Tarefa 1).
- **Convidado:** só fica o que não escreve: a conferir, parcela que termina, duplicado, concentração e o sazonal sem a ação de criar conta. Teste do filtro `paraQuemLe` (Tarefa 1).
- **Resolver o insight do meio:** a lista encolhe e o índice fica dentro dela, sem slide vazio (Tarefa 4).
- **A caixa falha ou não existe:** os locais aparecem do mesmo jeito (Tarefa 3, devolve `[]`).

---

### Task 1: a lib dos insights da categoria

**Files:**
- Create: `src/lib/insights-da-categoria.ts`
- Create: `src/lib/insights-da-categoria.test.ts`
- Modify: `src/lib/categoria-resumo.ts` (remover `insights()`, linhas ~278–330) e `src/lib/categoria-resumo.test.ts` (remover `describe("insights")`; os casos migram para o teste novo)

**Interfaces:**
- Produces:
  ```ts
  export type AcaoDoInsight =
      | { tipo: "previsao" }                                    // Link /previsao
      | { tipo: "limite" }                                      // abre o diálogo de limite da página
      | { tipo: "link"; href: string }                          // a conferir: /transactions?conferir=1&cats=<id>
      | { tipo: "filtrar"; descricao: string }                  // filtra a lista da página
      | { tipo: "ordenar-por-valor" }                           // lista por valor, do maior
      | { tipo: "conta-a-pagar"; insightId: string }            // sazonal: marca seen e abre /bills?new=1
      | { tipo: "recorrencia"; insightId: string }              // abre o diálogo de recorrência
      | { tipo: "atualizar-preco"; insightId: string }          // atualizarPrecoDaAssinatura
  export type InsightDaCategoria = {
      id: string; ordem: 1|2|3|4|5|6|7|8|9
      titulo: string; numero: string; tom?: "success" | "warning"; linha: string
      rotulo: string; acao: AcaoDoInsight
  }
  export function insightsLocais(a: {
      tipo: TipoDaCategoria; categoryId: string; yearMonth: string; aberto: boolean
      lancado: number; previsto: number; media: number | null; limite: number | null
      txs: Transaction[]; compromissos: Compromissos
  }): InsightDaCategoria[]                // ordens 2, 3, 5, 8, 9
  export function insightsDaCaixa(linhas: Insight[], c: {
      categoryId: string
      assinaturas: { id: string; category_id: string | null }[]
      categoriaDoLancamento: Record<string, string | null>
  }): InsightDaCategoria[]                // ordens 1, 4, 6, 7
  export function paraQuemLe(xs: InsightDaCategoria[], podeEscrever: boolean): InsightDaCategoria[]
  export function ordenarInsights(xs: InsightDaCategoria[]): InsightDaCategoria[]   // por ordem, estável
  ```
  - `Insight` vem de `@/lib/insights/acoes`.
  - `Compromissos`, `TipoDaCategoria`, `Transaction` e `maioresLancamentos` são os que `categoria-resumo.ts` já usa.
  - Os rótulos são os da tabela do spec, com a inicial maiúscula.
  - A recorrência é "Virar assinatura" se `payload.destino === "assinatura"`, senão "Virar conta a pagar".

- [ ] **Step 1: Testes que falham.** Em `insights-da-categoria.test.ts`:
  - **Casos que migram do `describe("insights")` de hoje:**
    - parcela que termina: `ordem` 5, `tom` `"success"`, `numero` `"+R$ 2.000/mês"`, `titulo` começando com `"Sobra em "`;
    - sugestão de limite: média 2342,5 dá `numero` `"R$ 2.400/mês"`, `ordem` 8;
    - concentração: 2 maiores acima de 70%, `ordem` 9, `numero` em `%`, com `acao` `{ tipo: "ordenar-por-valor" }`;
    - receita sem limite e mês vazio dão `[]`.
  - **Novos, locais:**
    - a conferir: 2 txs com `needs_review: true` dão `titulo` `"2 para conferir"` e `acao` `{ tipo: "link", href: "/transactions?conferir=1&cats=cat" }`;
    - ritmo: `aberto` com `lancado` 3500, `previsto` 400 e `limite` 3500 dá `numero` `"R$ 400 acima"`, `tom` `"warning"`;
    - ritmo some com o mês fechado ou sem limite.
  - **Novos, da caixa:**
    - cada tipo dentro e fora da categoria;
    - `duplicidade` com um dos `ids` da categoria (pelo `categoriaDoLancamento`) dá `titulo` `"Lançamento repetido?"`, `acao` `{ tipo: "filtrar", descricao }`;
    - `sazonal` sem `category_id` não aparece;
    - `preco_assinatura` dá `numero` `"R$ 21,90 → R$ 23,90"` e `linha` `"+R$ 24 por ano"`;
    - `recorrencia` com `destino: "assinatura"` dá `rotulo` `"Virar assinatura"`.
  - **Ordem e leitor:**
    - `ordenarInsights` põe `[9,1,5]` em `[1,5,9]`;
    - `paraQuemLe(xs, false)` tira os de ação `limite`, `recorrencia`, `atualizar-preco` e `conta-a-pagar`.
- [ ] **Step 2:** `npx vitest run src/lib/insights-da-categoria.test.ts`. Esperado: FAIL (módulo não existe).
- [ ] **Step 3:** Implemente `src/lib/insights-da-categoria.ts`. Mova a lógica de hoje (parcela, concentração, limite) de `insights()` para cá e remova `insights()` e o teste dele. O `page-client.tsx` ainda o importa: troque o uso por `insightsLocais(...)[0]` só para compilar. A Tarefa 4 refaz a ligação.
- [ ] **Step 4:** `npx vitest run src/lib && npx tsc --noEmit`. Esperado: PASS e tsc limpo.
- [ ] **Step 5:** Commit: `feat(categoria): a lib dos insights do detalhe da categoria`.

### Task 2: o sazonal guarda a categoria

**Files:**
- Modify: `supabase/functions/_shared/insights/detectores.ts` (`detectarSazonais`, ~linha 344)
- Modify: `supabase/functions/_shared/insights/detectores.test.ts`
- Check: `supabase/functions/insights-daily/index.ts` (~linha 454). O payload grava o que o detector devolve; se ele monta o payload campo a campo, inclua `category_id`.

**Interfaces:**
- Produces: `detectarSazonais(...)` devolve `{ chave, termo, mesAnterior, valor, category_id: string | null }`. A categoria é a mais frequente entre os `achados`; no empate, a do lançamento mais antigo; `null` se nenhum tem categoria.

- [ ] **Step 1:** Teste em `detectores.test.ts`: dois lançamentos "IPVA" em jan do ano anterior, ambos com `category_id: "carro"`, dão `category_id: "carro"`; sem categoria dão `null`.
- [ ] **Step 2:** `npx vitest run supabase/functions/_shared/insights/detectores.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** Implemente. O arquivo é sem import (roda no Deno e no Node).
- [ ] **Step 4:** O mesmo comando, e `npx vitest run src/lib/insights`. Esperado: PASS.
- [ ] **Step 5:** Commit: `feat(insights): o sazonal guarda a categoria do gasto do ano passado`. **Sem deploy.**

### Task 3: a leitura da caixa no detalhe

**Files:**
- Create: `src/lib/insights/use-insights-da-categoria.ts`
- Test: `src/lib/insights/use-insights-da-categoria.test.ts` (só a parte pura)

**Interfaces:**
- Consumes: `insightsDaCaixa` (Tarefa 1).
- Produces:
  ```ts
  export const KINDS_DA_CATEGORIA = ["duplicidade", "sazonal", "recorrencia", "preco_assinatura"] as const
  export function idsDosLancamentos(linhas: Insight[]): string[]   // os ids do payload das duplicidades, sem repetir
  export function useInsightsDaCaixa(workspaceId: string | null): {
      linhas: Insight[]; categoriaDoLancamento: Record<string, string | null>; recarregar: () => Promise<void>
  }
  ```
  - A consulta é `from("insights").select("id,workspace_id,kind,dedupe_key,payload,status,created_at").eq("workspace_id", id).in("kind", KINDS_DA_CATEGORIA).in("status", ["new","seen"])`, sem `limit`.
  - Ela não marca `seen`.
  - Depois, `from("transactions").select("id,category_id").in("id", idsDosLancamentos(linhas))`, só com ids.
  - Tabela ausente (`isPostgrestRelationMissingError`) ou erro dá `linhas: []`, sem lançar.
  - A `queryKey` é `["insights-da-categoria", workspaceId]`.
  - O `recarregar` invalida esta chave e a `["insights", workspaceId]` do Painel.

- [ ] **Step 1:** Teste de `idsDosLancamentos`: duas duplicidades com ids `["a","b"]` e `["b","c"]` mais um `sazonal` dão `["a","b","c"]`.
- [ ] **Step 2:** Rode o teste. Esperado: FAIL.
- [ ] **Step 3:** Implemente, no molde de `src/lib/insights/use-insights.ts`, sem o efeito que marca `seen`.
- [ ] **Step 4:** `npx vitest run src/lib/insights && npx tsc --noEmit`. Esperado: PASS.
- [ ] **Step 5:** Commit: `feat(insights): leitura da caixa para o detalhe da categoria`.

### Task 4: o diálogo da recorrência e o carrossel na tela

**Files:**
- Create: `src/components/insights/dialogo-da-recorrencia.tsx`
- Create: `src/components/categories/detail/resumo/insights-da-categoria.tsx`
- Delete: `src/components/categories/detail/resumo/insight-da-categoria.tsx`
- Modify: `src/app/(app)/categories/[categoryId]/page-client.tsx` (o `analise`, ~linhas 457–500; o slot `insight`, ~linha 687)
- Modify: `docs/JORNADAS.md`, `docs/atlas/template.html`. Depois rode `python3 docs/atlas/build.py`; o controlador republica.

**Interfaces:**
- Consumes:
  - Tarefa 1 (`insightsLocais`, `insightsDaCaixa`, `paraQuemLe`, `ordenarInsights`, os tipos);
  - Tarefa 3 (`useInsightsDaCaixa`);
  - de `@/lib/insights/acoes`: `marcarInsight`, `virarAssinatura`, `virarConta`, `atualizarPrecoDaAssinatura`, `lancamentosDaRecorrencia`, `sugerirValorVariavel`, `statusAoTocarOLink`.
- Produces:
  ```tsx
  export function DialogoDaRecorrencia(p: { insight: Insight | null; categorias: { id: string; name: string }[]; onFechar: () => void; onFeito: () => void })
  export function InsightsDaCategoria(p: {
      insights: InsightDaCategoria[]
      onAcao: (i: InsightDaCategoria) => void | Promise<void>
  })
  ```

- [ ] **Step 1: `DialogoDaRecorrencia`.** Porte o diálogo de `src/components/wireframe/insights-wireframe.tsx` (`DialogoDaRecorrencia`, ~linhas 195–325) para o design system, com o mesmo estado, as mesmas chamadas e o mesmo `sugerirValorVariavel` ao abrir.
  - **Peças:**
    - `Dialog surface="auto"` e `Form`;
    - "Virar em" por `Tabs` sem painel (o trilho segmentado do app), com Assinatura e Conta a pagar;
    - `FormInput` do nome;
    - `FormInput money` do valor;
    - dia num `Select` de 1 a 31;
    - categoria num `Combobox`;
    - "O valor muda todo mês" num `FormSwitch`;
    - `FormActions` com `FormCancel` e `FormSubmit` ("Criar").
  - **Ao salvar:** `virarAssinatura` ou `virarConta`, depois `marcarInsight(id, "acted")`, toast de sucesso por `@/lib/toast`, `onFeito`; um erro vai no `FormError`.
  - O wireframe do Painel não muda.
- [ ] **Step 2: `InsightsDaCategoria`.** Com zero insights, devolve `null`. Com um ou mais:
  - **Cartão:** um `Card` com o `Carousel` do design system dentro (`aria-label="Insights da categoria"`, sem autoplay). Cada `CarouselItem` traz:
    - um `CardHeader` com `CardTitle size="sm"` e `CardAction` com o `Button tertiary sm`. A ação `previsao` e a `link` usam `asChild` + `Link`;
    - o número em `nums font-mono font-semibold text-2xl`, com `text-success` ou `text-warning` pelo `tom`;
    - a linha em `text-sm text-muted-foreground`, assentados no pé (`mt-auto`).
  - **Pé:** com 2 ou mais, `CarouselDots` à esquerda e `CarouselPrevious`/`CarouselNext` à direita. Se o `Carousel` não tiver essa composição dentro de um `Card`, crie a peça ou variant no design system (registry, página, teste, AGENTS) em vez de markup solto.
  - **Altura:** todos os slides do tamanho do maior.
  - **Índice:** quando a lista encolhe, fica dentro do novo tamanho.
  - **Botão:** enquanto `onAcao` devolve `Promise`, o botão fica `pending`.
- [ ] **Step 3: Página.**
  - **No `analise`:**
    - `insightsLocais({... categoryId, previsto: mes.previsto, aberto ...})`;
    - mais `insightsDaCaixa(useInsightsDaCaixa(workspaceId).linhas, { categoryId, assinaturas: subscriptions, categoriaDoLancamento })`;
    - passados por `paraQuemLe(…, podeEscrever)` e `ordenarInsights`.
  - **O `onAcao`:**
    - `previsao` e `link` são links;
    - `limite` chama `openLimitDialog`;
    - `filtrar` chama `txController.setFilterDescriptionQuery(descricao)` e rola até `LANCAMENTOS_DO_MES_ID`, como o `onVer` da Leitura;
    - `ordenar-por-valor` põe a ordem da lista em valor, decrescente (o controller tem `sortKey`/`sortDir`; use o setter que ele expõe), e rola;
    - `conta-a-pagar` marca `seen` (`statusAoTocarOLink`) e `router.push("/bills?new=1")`;
    - `recorrencia` abre o `DialogoDaRecorrencia`;
    - `atualizar-preco` chama `atualizarPrecoDaAssinatura`, marca `acted`, mostra toast e chama `recarregar`.
  - **Encerramento:** `onFeito` do diálogo chama `recarregar`. Apague `insight-da-categoria.tsx` e o import dele.
- [ ] **Step 4: Docs.**
  - Em `docs/JORNADAS.md`, na linha "Detalhe" da tabela de Categorias (~1301), troque a frase do insight único pelos 9, a ordem, o carrossel e o destino de cada ação.
  - Em `docs/atlas/template.html`, o mesmo, numa frase.
  - Rode `python3 docs/atlas/build.py`.
- [ ] **Step 5: Verificação.** Rode `npx tsc --noEmit && npm run lint && npx vitest run src/lib src/components && npm run ds:audit -- src/components/categories/detail/resumo src/components/insights`. Esperado:
  - tsc limpo;
  - lint sem erros (61 avisos já existiam);
  - vitest verde, menos a falha conhecida de `src/lib/papeis/migracao-papeis.test.ts`;
  - auditor sem achado.
- [ ] **Step 6:** Commit: `feat(categoria): insights do detalhe em carrossel, com os da caixa da carteira`. Inclua `docs/atlas/atlas-jornadas.html`.
