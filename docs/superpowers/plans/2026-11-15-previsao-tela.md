# A tela de Previsão no design system — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/previsao` deixa de ser wireframe e vira a versão A do design (herói com ritmo, "De onde vem", 6 meses, fatura acima do normal, "E se eu parcelar?"), e a Previsão entra na barra lateral e na página Você.

**Architecture:** as contas novas são funções puras em `src/lib/previsao/` (testadas); a tela é feita de componentes em `src/components/previsao/`, só com peças de `src/components/ui/`; `page.tsx` monta `PrevisaoTela` no `AdiarMontagem`. A navegação muda em `src/config/navigation.ts` e `src/config/mobile-navigation.ts`.

**Tech Stack:** Next 16, React 19, TanStack Query (`usePrevisao`), Recharts via `ChartContainer`, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-14-previsao-tela-design.md`

## Global Constraints

- Só componentes de `src/components/ui/` e tokens existentes. **Nada novo em `src/components/ui/` nem em `globals.css`**; se faltar uma peça, parar e reportar (BLOCKED), não escrever markup solto.
- Nenhum componente declarado em `src/app/` (invariante 1). Os da tela moram em `src/components/previsao/`.
- Dinheiro: `income`/`expense` (tokens, `MoneyDisplay tone`, `--chart-income`/`--chart-expense`); nunca `success`/`destructive` para dinheiro; nenhum arco-íris ou peça `brand` na tela.
- Textos exatos: "Previsão", "Seguro para gastar em <mês>", "R$ X por dia · N dias, contando hoje", "Sem folga até o fim do mês", "Gasto pela data da compra", "Ritmo até o fim do mês", "Sem receita prevista neste mês", "De onde vem", "Entra", "Despesas fora do cartão", "Nenhuma fatura vence neste mês", "Sobra do mês", "Reserva do mês", "Seguro para gastar", "Já comprometido na próxima fatura: R$ X", "Contas sem valor: …", "A fatura conta no mês em que vence. Cada mês começa do zero.", "Editar reserva", "Só quem é dono da carteira altera a reserva", "Próximos 6 meses", "Sobra", "<Mês> fica no vermelho", "Nada muda nos próximos meses", "Ver mês a mês", "Fatura do <cartão> X% acima do normal", "Ver fatura", "E se eu parcelar?", "Lançar esta compra", "Cadastre o salário para prever os próximos meses", "Adicionar receita recorrente", "Ainda não há o que prever", "Adicionar lançamento", "Tentar de novo".
- Datas por `src/lib/transaction-date.ts`; meses por `formatMonthLongPtBr`/`labelYearMonthPt`; valores por `currencyBRL`.
- Nenhuma gravação nova no banco (a reserva já grava em `workspaces.monthly_savings_target`); **o dev usa o banco de produção: não salve a reserva para testar**.
- `npm run ds:audit -- <arquivos>` limpo, `npx tsc --noEmit`, `npm run lint`, vitest dos arquivos tocados.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; `git add` só dos próprios arquivos (nunca `graphify-out/graph.json`); sem push; sem prettier. Depois: `graphify update .`.

## Review Focus

- Dia 1 do mês: o gráfico do ritmo com um ponto, sem erro.
- `entra − reserva ≤ 0`: a reta some e a legenda diz "Sem receita prevista neste mês".
- Seguro negativo: o herói em `expense` e "Sem folga até o fim do mês".
- Cartão com menos de 3 faturas fechadas: nenhum aviso de fatura alta.
- Quem não é dono: "Editar reserva" desligado com a dica.

---

### Task 1: as contas novas

**Files:**
- Create: `src/lib/previsao/gasto-acumulado.ts` + `.test.ts`
- Create: `src/lib/previsao/fatura-alta.ts` + `.test.ts`
- Modify: `src/lib/previsao/fluxo.ts` (`projecaoMensal`), `src/lib/previsao/tipos.ts` (`MesDaLinha`), e o teste de `fluxo`

**Interfaces — Produces:**
- `gastoAcumuladoDoMes(dados: DadosDaPrevisao, ym: string): Array<{ dia: number; acumulado: number }>` — um ponto por dia do dia 1 até hoje (se `ym` é o mês de `hojeYmd`) ou até o último dia (mês passado); soma toda despesa (`type === "expense"`) do mês pela data local da transação, inclusive no cartão; a receita no cartão (estorno, `type === "income"` com `payment_method === "credit_card"`) abate no dia dela; receita fora do cartão não entra. Em centavos, devolvendo reais.
- `metaDoRitmo(seguro: Seguro): number` — `seguro.entra − seguro.reserva` (pode ser ≤ 0).
- `MesDaLinha.fimDeParcelamentos: Array<{ planoId: string; descricao: string; valor: number }>` — `valor` é o `installment_amount` do plano.
- `faturasAcimaDoNormal(dados: DadosDaPrevisao): Array<{ cardId: string; nome: string; closeYmd: string; dueYmd: string; prevista: number; media: number; percentual: number }>` — por cartão ativo: a fatura aberta (o total previsto da janela aberta, como `faturaPrevista`) somada às parcelas projetadas que caem nela, contra as 3 últimas fechadas (o total do banco se gravado; fatura sem movimento não conta); dispara pela mesma conta de `avaliarTendencia` (`supabase/functions/_shared/fatura-tendencia.ts`: centavos, `aberta × n × 5 > soma × 6`, `n ≥ 3`).

- [ ] **Step 1: testes.**
  - `gastoAcumuladoDoMes` com `hojeYmd = "2026-11-14"`: despesa Pix 100 em 03/11 e cartão 50 em 05/11, estorno no cartão 20 em 06/11, receita Pix 8000 em 05/11 → ponto do dia 5 = 150, dia 6 = 130, último ponto é o dia 14 (14 pontos); mês de fevereiro de 2026 passado inteiro → 28 pontos; `hojeYmd = "2026-11-01"` → 1 ponto.
  - `metaDoRitmo` com `entra 8000, reserva 500` → 7500.
  - `projecaoMensal`: um plano terminando no mês leva `valor = installment_amount`.
  - `faturasAcimaDoNormal`: roda os casos `tendencia` de `src/lib/fixtures/fatura-tendencia-vectors.json` contra a regra portada (mesmo `dispara`/`percentual`/`media`), e um caso de ponta a ponta com 3 fechadas de 100 e aberta 130 → dispara, `percentual` 30; com 2 fechadas → `[]`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS, `tsc`, `lint`.
- [ ] **Step 5: Commit** `feat(previsao): gasto pela data da compra, fim de parcelamento com valor e fatura acima do normal no cliente`.

### Task 2: o herói, o "De onde vem" e a reserva

**Files:**
- Create: `src/components/previsao/heroi-do-seguro.tsx`, `de-onde-vem.tsx`, `reserva-dialog.tsx`
- Test: `src/components/previsao/previsao.test.ts` (leitura de fonte, com `lerFonte`/`semComentarios` de `src/test/fonte.ts`)

**Interfaces — Consumes:** `Seguro`, `gastoAcumuladoDoMes`, `metaDoRitmo` (Task 1); `useWorkspace` (`currentWorkspace`, `isWorkspaceOwner`, `refreshWorkspaces`).
**Produces:** `HeroiDoSeguro({ seguro, gasto, temReceitaRecorrente })`, `DeOndeVem({ seguro, onEditarReserva })`, `ReservaDialog({ open, onOpenChange })`.

- [ ] **Step 1: teste de fonte:** os três arquivos usam só `@/components/ui/*`; o herói usa `ChartLine`, `ChartAnnotation` e contém "Gasto pela data da compra" e "Ritmo até o fim do mês"; `de-onde-vem.tsx` usa `DescriptionList` e contém "Sobra do mês" e "A fatura conta no mês em que vence"; `reserva-dialog.tsx` usa `Form`, `FormInput money` e `monthly_savings_target`; nenhum arquivo contém `#`hex, `success`, `destructive` nem `brand`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar conforme a spec, itens 2, 3, 5 e 8:
  - herói: `Card` com `StatCard`/`MoneyDisplay` (negativo em `expense`), a linha do por dia, o gráfico (`ChartContainer`, a série do gasto em `--foreground`, a reta em série tracejada neutra por `config.dashed`, `ChartAnnotation` "hoje"); sem reta quando `metaDoRitmo ≤ 0`; a linha "Cadastre o salário…" com `Button` "Adicionar receita recorrente" (`useQuickCreateSubscription`, receita) quando `!temReceitaRecorrente`.
  - "De onde vem": `Card padding="none"` + `CardToolbar` com a ação "Editar reserva" (desligada com `Tooltip` "Só quem é dono…" para quem não é dono); `DescriptionList` com os itens da spec, `DescriptionHint` para recebidas/previstas e pagas/previstas, `Badge` "paga"/"total do banco"; `Separator`; `Muted` com o comprometido, as contas sem valor e a nota do regime.
  - reserva: `Dialog surface="auto"` com `Form` → `FormInput money` → `FormActions` (`FormCancel`, `FormSubmit` "Salvar"); a mesma escrita do wireframe (`supabase.from("workspaces").update(...)`, vazio grava `null`, sem linha → "Só quem é dono…" no `FormError`), remontando por carteira.
- [ ] **Step 4:** testes, `tsc`, `lint`, `ds:audit` dos arquivos → limpos.
- [ ] **Step 5: Commit** `feat(previsao): o herói com o ritmo, de onde vem o número e a reserva`.

### Task 3: os 6 meses, a fatura alta, o simulador e a tela

**Files:**
- Create: `src/components/previsao/proximos-meses.tsx`, `faturas-acima-do-normal.tsx`, `simulador-de-parcela.tsx`, `previsao-tela.tsx`, `previsao-skeleton.tsx`
- Modify: `src/app/(app)/previsao/page.tsx`, `src/app/(app)/previsao/loading.tsx`
- Modify: `src/components/wireframe/seguro-para-gastar-wireframe.tsx` (fica só o cartão compacto do Painel: `SeguroDoPainelWireframe` e o que ele usa); Delete: `src/components/wireframe/linha-do-tempo-wireframe.tsx`; Modify: `src/components/wireframe/wireframe.test.ts` onde citar o que saiu
- Test: `src/components/previsao/previsao.test.ts`

**Interfaces — Consumes:** Task 1 e Task 2; `ImpactoDaParcela` (`src/components/transactions/impacto-da-parcela.tsx`, `{ proposto: PlanoProposto }`); `useQuickCreateTransaction` (`src/components/layout/quick-actions.tsx`); `creditCardInvoicePath` (`src/config/navigation.ts`).

- [ ] **Step 1: teste de fonte:** `proximos-meses.tsx` usa `ChartBars`, `--chart-income`, `--chart-expense`, `Collapsible` e contém "Ver mês a mês" e "Nada muda nos próximos meses"; `faturas-acima-do-normal.tsx` usa `Alert` e `creditCardInvoicePath`; `simulador-de-parcela.tsx` usa `ImpactoDaParcela` e contém "E se eu parcelar?" e "Lançar esta compra"; `page.tsx` monta `PrevisaoTela` e não importa `@/components/wireframe`; o arquivo `linha-do-tempo-wireframe.tsx` não existe.
- [ ] **Step 2:** FAIL. **Step 3:** implementar conforme a spec, itens 1, 4, 6 e 7 e os estados:
  - `PrevisaoTela`: `PageHeader collapse` "Previsão" (como as telas revisadas: `PageHeaderTitle asChild` + `<p aria-hidden>`), herói, alertas de fatura alta, a grade (De onde vem | Próximos 6 meses no desktop, coluna no telefone), o simulador; o `ReservaDialog` aberto pelo "De onde vem".
  - 6 meses: `ChartBars` da sobra (cor por sinal), o mês atual destacado, `ChartTooltipContent` com entra/sai/sobra, `Badge tone="expense"` "<Mês> fica no vermelho", a lista de `Item` (primeiro mês no vermelho; fim de parcelamentos com "A partir de <mês seguinte>, R$ X a menos por mês", somando os `valor`), e o `Collapsible` com a `Table` (mês, entra, sai, sobra, fim de parcelamentos).
  - Fatura alta: um `Alert tone="warning"` por item de `faturasAcimaDoNormal`, com `AlertAction` "Ver fatura" (`<Link href={creditCardInvoicePath(cardId, closeYmd)}>`).
  - Simulador: `Card` + `Form` (valor `FormInput money`, parcelas `FormInput type="number"` 2–48, cartão `Select` opcional dos cartões ativos); com valor e parcelas válidos, `<ImpactoDaParcela proposto={…} />`; "Lançar esta compra" chama `useQuickCreateTransaction()("installment")` (o formulário abre em Parcelada; sem preenchimento — o opener não aceita valores).
  - Estados: carregando → `PrevisaoSkeleton` (na forma dos blocos, `SkeletonGroup`), também no `loading.tsx`; erro → `EmptyState` com "Tentar de novo" (`refetch`); carteira sem nenhum dado → `EmptyState` "Ainda não há o que prever" + "Adicionar lançamento".
- [ ] **Step 4:** testes (`previsao.test.ts`, `wireframe.test.ts`, `adiar-montagem.test.ts`), `tsc`, `lint`, `ds:audit -- src/components/previsao src/app/(app)/previsao` → limpos.
- [ ] **Step 5: Commit** `feat(previsao): a tela no design system (6 meses, fatura alta, simulador) e o wireframe sai`.

### Task 4: a Previsão na navegação

**Files:**
- Modify: `src/config/navigation.ts` (`MAIN_NAVIGATION`), `src/config/mobile-navigation.ts` (`getVoceGroups`, `isVoceTabActive`)
- Test: o teste existente de navegação (procure com `graphify query "MAIN_NAVIGATION test"`) e o de `mobile-navigation`

- [ ] **Step 1: testes:** `MAIN_NAVIGATION[1]` é `{ name: "Previsão", href: ROUTES.PREVISAO }`; no grupo Carteira de `getVoceGroups([], "owner")`, a Previsão vem antes de Cartões; `isVoceTabActive("/previsao", [])` é `true`; o convidado não recebe a linha (`getVoceGroups([], "guest")`) se a rota não está em `rotas-do-convidado.ts`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar; ícone `ArrowTrendingUpIcon` de `@heroicons/react/24/outline` (o mesmo nas duas listas); o filtro do convidado segue o mecanismo que as outras linhas já usam.
- [ ] **Step 4:** testes, `tsc`, `lint`. **Step 5: Commit** `feat(navegacao): a Previsão na barra lateral e na página Você`.

### Task 5: a jornada

**Files:** `docs/JORNADAS.md` (seção 13, o mapa geral, a seção do menu do telefone), `docs/atlas/template.html` (jornada 13, apêndice de rotas, data da capa 15/11/2026); gera `docs/atlas/atlas-jornadas.html`.

- [ ] **Step 1:** seção 13: a rota passa a ter porta na barra lateral e na Você (Carteira); o fluxograma ganha as entradas "barra lateral" e "Você › Carteira", o "Ver fatura" do aviso de fatura alta (→ G6 com `?fatura=`), o "Lançar esta compra" (→ G5b Parcelada) e o "Adicionar receita recorrente" (→ G8); a tabela de regras troca "sem entrada no menu" e ganha as linhas do ritmo (pela data da compra), da fatura alta no cliente e do simulador. `%%{init}%%` em todo bloco; nenhum id reservado.
- [ ] **Step 2:** o mesmo no `template.html`. **Step 3:** `python3 docs/atlas/build.py` sem erro.
- [ ] **Step 4: Commit** `docs(jornadas): a Previsão na navegação e as portas novas da tela`. (A republicação do Atlas é do controlador.)
