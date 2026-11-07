# Transações — redesenho do zero (07/11/2026)

Revisão de tela da rota `/transactions`, no desktop e no telefone, junto com
tudo o que ela abre: o detalhe, o formulário de criar e editar, a importação de
extrato, a revisão "a conferir" e os avisos de compartilhamento. Os wireframes
dos Blocos 2, 3A e 7C que moram nessa tela viram componentes do design system.

O dono pulou a rodada de perguntas ("pular, busque referências no Mobbin").
Todas as escolhas abaixo são do Claude e estão marcadas assim quando não vêm do
`AGENTS.md`, do ICP ou dos estudos de concorrentes.

---

## 1. Por quê

A tela de hoje é uma tabela de seis colunas sem nenhum total. Ela não responde
à pergunta que o ICP traz quando abre Transações à noite, no sofá: **"para onde
foi o dinheiro, e o que eu preciso corrigir?"**

- **ICP** ("O CFO da casa", `docs/produto/2026-10-20-icp.md`): uma pessoa,
  quase sempre a mulher, de 28 a 45 anos, organiza o dinheiro de uma casa com
  parceiro e filhos. O gasto pequeno e variável vaza. O cartão é o "buraco
  negro". Ela tem três janelas de uso:
  1. **Na rua**: captura em segundos. Isso não é esta tela: é o "+", o Atalho e
     o Apple Pay.
  2. **À noite**: revisão em lote. Corrigir categoria, conferir o que entrou
     sozinho, ver quem gastou. **Esta é a janela da tela de Transações.**
  3. **No dia da fatura**: conciliar o cartão. Hoje isso mora em Cartões; aqui
     ela precisa achar rápido "o que caiu no Nubank este mês".
- **Comparativo de UX** (`docs/produto/concorrentes/2026-10-28-comparativo-ux.md`,
  §11). Os itens que esta tela resolve:
  - nº 6: "a conferir" com ação no lugar;
  - nº 7: lote completo, com categorizar, marcar conferido e a soma da seleção;
  - nº 9: setas ↑↓ na folha e folha ao tocar na linha;
  - nº 14: revisar em sequência sem fechar (pelas setas, não pelo detalhe fixo);
  - nº 10: rótulos de resumo inteiros a 375 px.
- **O `FilterBar` do DS** diz na própria página: "nenhuma tela do app usa
  ainda; o primeiro lugar natural é Transações". É o "filtro novo no topo" que o
  dono pediu.

### Referências do Mobbin

**Desktop:**
- [Mercury — lista com filtros em pílula e resumo de entradas e saídas](https://mobbin.com/screens/a8225239-95e8-4be6-8f48-2cbf3e15ed05):
  o "Net change · Money in · Money out" acima da tabela é o modelo da faixa de
  resumo.
- [Copilot — agrupado por dia, "+ Add filter" no topo](https://mobbin.com/screens/af445d77-66cf-4448-8cc5-3a1b57f035f4):
  tokens de filtro e grupo por dia com total.
- [Rocket Money — lote com "Change Category"](https://mobbin.com/screens/bc83c91d-784c-4f47-9db1-f09c964b79bf):
  a barra flutuante que categoriza em lote.
- [Midday — detalhe ao lado com ↑↓ e Esc](https://mobbin.com/screens/19da6460-e187-41dc-b969-a5a8159f974b)
  e [Monarch — folha com setas ↑↓](https://mobbin.com/screens/e75d351a-b5cc-42e5-a134-79688e30f988):
  revisar em sequência.
- [Origin — detalhe com valor grande, categoria logo abaixo e lista de campos](https://mobbin.com/screens/d035d51f-2db6-4963-b212-eafb71218d41):
  o modelo do cabeçalho do detalhe.

**Telefone:**
- [Monzo — busca, filtros, "Total spent" e lista por dia](https://mobbin.com/screens/2c2b2c81-2083-425b-aea7-aa3ea8bd861f).
- [Wise — chips de filtro que rolam de lado](https://mobbin.com/screens/5dc18076-e10a-4499-b945-ce99f74f31ae).
- [Copilot iOS — grupo por dia e total do mês](https://mobbin.com/screens/b945aba6-956f-47a7-973f-f37c4159e8e0).
- [Origin iOS — detalhe em folha](https://mobbin.com/screens/5e009b3e-54a7-408b-8a67-5f91b99671aa).

---

## 2. Metas, não-metas e antimetas

### Metas

1. **Responder "quanto entrou, quanto saiu" do recorte filtrado**, com números
   que batem com a lista.
2. **Filtrar adicionando tokens no topo** (`FilterBar`), com mais dimensões que
   hoje: quem lançou, a conferir, origem da captura, projeto, recorrente e
   "não é".
3. **Revisar à noite sem fricção**: aviso "N a conferir" com "Revisar", confirmar
   na linha, categorizar em lote, ↑↓ no detalhe.
4. **Detalhe legível**: valor e categoria no topo, os dados numa lista, as
   seções (parcelamento, divisão, anexos) no design system.
5. **Telefone com a mesma estrutura em forma nativa**: lista por dia, folha ao
   tocar, filtros numa faixa que rola de lado.
6. **Nenhum wireframe na tela nem no que ela abre.**
7. **Nenhum link que entra na tela quebra**: os parâmetros antigos continuam
   valendo.

### Não-metas

- **Desfazer e lixeira**: o excluir continua físico. Isso pede `deleted_at` no
  banco e mexer em todos os leitores. É o item nº 2 do comparativo, mas é outro
  projeto. Fica como lacuna no `JORNADAS.md`.
- **Regras automáticas** ("sempre categorizar X como Y").
- **Detalhe fixo em três colunas** (Copilot, YNAB). As setas ↑↓ dão a revisão em
  sequência com uma fração do custo.
- **Mudar o lançamento inteligente**, a frase, a foto do recibo ou o Apple Pay.
- **Trocar as abas da BottomBar** (o item nº 3 do comparativo).
- **Migrar os wireframes de anexos, divisão e projetos fora de Transações**:
  Contas a pagar, Painel e `/projetos` continuam com os deles.
- **Busca no servidor por outros campos** além da descrição.

### Antimetas (falha mesmo que funcione)

- Um total que não bate com a soma do que está filtrado.
- Um link antigo (`?cats=`, `?card=…&preset=last30`, `?plan=`, `?sub=`, `?inst=1`,
  `?conferir=1`, `?txn=`, `?new=`, `?importar=1`, `?compartilhado=`, `?frase=`)
  que abre a tela sem o filtro ou sem a ação.
- Gravar dado no banco durante a verificação. O `next dev` aponta para
  produção (memória `dev-usa-banco-de-producao`): só navegar e ler.
- Componente declarado em `src/app/`, cor crua ou markup "por enquanto".
- Duas árvores `md:hidden` / `hidden md:flex` para o mesmo conteúdo.

---

## 3. Restrições

- **`AGENTS.md` é a régua.** Antes de qualquer JSX: `npm run ds:catalog`. No
  fim: `npm run ds:audit -- src/app/(app)/transactions src/components/transactions`,
  `npx tsc --noEmit && npm run lint && npm run test:unit`.
- **`src/components/ui/` e `globals.css` exigem autorização humana**
  (invariante 6). Este redesenho foi pensado para caber no catálogo de hoje.
  A única mudança de `ui/` é a da §10.1, e o harness pede confirmação ao
  editar.
- **Componentes da tela moram em `src/components/transactions/`**, nunca em
  `src/app/` (invariante 1).
- **Mudança de jornada atualiza o `docs/JORNADAS.md` e o Atlas na mesma
  mudança**. Esta é uma: a lista "a conferir" vira filtro, a importação vira
  diálogo, entram "Duplicar" e "Confirmar", o formato da URL muda.
- Branch `finance-app-2.0`. **Não vai para `main`** (memória
  `finance-app-2-0-so-no-fim`).
- Testes de fonte (`lerFonte` / `toContain`) que travam o desenho antigo
  (`wireframe.test.ts`, `a-conferir.test.ts`, `table-versions.test.ts:226`,
  `top-bar-versions.test.ts:343`…) são reescritos para travar o desenho novo,
  e nunca apagados sem substituto.

---

## 4. Arquitetura da tela

### 4.1 Desktop (≥ 768 px)

```
┌ PageHeader collapse ─────────────────────────────────────────────────────┐
│ Transações                     [Exportar] [Importar] [Nova transação ▾]  │
└──────────────────────────────────────────────────────────────────────────┘
┌ Alert tone=info (só com N > 0) ──────────────────────────────────────────┐
│ ⓘ 8 lançamentos a conferir                                   [Revisar]   │
│   Entraram pelo Atalho, Apple Pay ou importação.                         │
└──────────────────────────────────────────────────────────────────────────┘
┌ StatCardGroup joined, size sm ───────────────────────────────────────────┐
│ Saídas            │ Entradas          │ Resultado          │ Lançamentos  │
│ −R$ 6.412,30      │ +R$ 9.800,00      │ +R$ 3.387,70       │ 142          │
└──────────────────────────────────────────────────────────────────────────┘
┌ Toolbar ─────────────────────────────────────────────────────────────────┐
│ [Todas|Despesas|Receitas]   [🔍 Buscar descrição]                         │
│ FilterBar: [Período · é · Este mês ×] [Categoria · é um de · Mercado +1 ×]│
│            [+ Filtro]  [Limpar]                     8 de 142 lançamentos │
└──────────────────────────────────────────────────────────────────────────┘
┌ DataTable (TablePanel) ──────────────────────────────────────────────────┐
│ ☐ Descrição              Categoria     Pagamento        Quem   Valor   ⋯ │
│ HOJE · sex, 7 nov                                            −R$ 539,46  │
│ ☐ ▣ Mercado              ● Mercado     Nubank · Aberta   (K)  −R$ 213,70 │
│ ☐ ▣ Lentes (1/2) ▸Parcel ● Renata      Nubank · Aberta   (K)  −R$ 109,95 │
│ ☐ ▣ Uber  [A conferir]   ● Transporte  Crédito           (R)   −R$ 26,93 │
│ ONTEM · qui, 6 nov                                           −R$ 254,35  │
│ …                                                                        │
│ 142 lançamentos                                         ‹ 1 2 › (100/pág)│
└──────────────────────────────────────────────────────────────────────────┘
```

O detalhe abre no `Sheet` da direita (`variant="flush"`, `size="md"`), com
↑↓ (§6).

### 4.2 Telefone (< 768 px)

A rota é a mesma. A casca escreve o título grande "Transações" e o cabeçalho
com a carteira, a lupa e o filtro colado nela
(`mobileHeaderFilterFor(TRANSACTIONS) === "filter"`, sem mudar).

```
 (sino)       Carteira ▾        (🔍|⚲)
 Transações
 ┌ Alert sm "8 a conferir" [Revisar] [Agora não]┐   (só com N > 0)
 ┌ StatCardGroup joined sm ─────────────────────┐
 │ Saídas −R$ 6.412,30 │ Entradas +R$ 9.800,00 │
 └──────────────────────────────────────────────┘
 [Todas | Despesas | Receitas]            [⋯]
 FilterBar mobile="scroll": [Este mês ×][Mercado +1 ×][+ Filtro] →
 HOJE · sex, 7 nov                  −R$ 539,46
 ▣ Mercado                       −R$ 213,70
   Mercado · Nubank
 ▣ Uber                           −R$ 26,93
   Transporte · Crédito · A conferir
 …
                          (BottomBar + "+")
```

- O `DataTable` desenha o gêmeo do telefone (`meta.mobile`). **Nenhuma segunda
  árvore.** As linhas são `Item` com o ladrilho da categoria, o título, a
  linha de apoio e o valor.
- **Tocar na linha** abre o detalhe numa gaveta: o `Sheet` vira `Drawer`
  sozinho abaixo de 768 px. **Segurar** abre o menu de contexto: Abrir,
  Selecionar, Confirmar, Duplicar, Excluir. Com uma linha selecionada, o toque
  seleciona e a barra flutuante do lote aparece.
- O **filtro do cabeçalho** abre o "+ Filtro" do `FilterBar` (§5.4). A **lupa**
  segue sendo a paleta.
- O **⋯** da `Toolbar` reúne Importar extrato e Exportar CSV. No telefone não
  há "Nova transação": o "+" da `BottomBar` já abre o formulário.
- O "Resultado" e a contagem saem da faixa de resumo no telefone. A contagem
  já aparece no `FilterBar` ("8 de 142"). Dois cartões cabem a 375 px com o
  rótulo inteiro (comparativo nº 10).

**Decisão do Claude: o telefone não é uma tela diferente.** É a mesma
estrutura e os mesmos componentes, na forma que cada componente já tem no
telefone (o `Drawer`, o gêmeo do `DataTable`, o `FilterBar` em faixa). O M e o
Y fazem assim, e o comparativo §9 julga isso o certo para nós.

---

## 5. Filtros

### 5.1 Onde

- **Tipo**: o `TransactionTypeSegment` (`Tabs`), à esquerda da `Toolbar`.
  Escolha única entre três é `Tabs`, como diz a página do `FilterBar`.
- **Busca por descrição**: `ToolbarSearch`, que grava em `q` e espera 300 ms
  antes de buscar. Não é um token: é o gesto mais frequente e merece um campo
  sempre à vista.
- **Todo o resto**: `FilterBar` (`size` da `Toolbar`, `tone="neutral"`,
  `mobile="scroll"`, `count` e `total` com o noun
  `["lançamento", "lançamentos"]`). **Sem `onMatchChange`**: o E/OU não
  aparece, e todo filtro é "todos". O servidor não sabe fazer OU entre campos.
  **Sem `urlParam`**: a URL é do controlador (§5.3).
- **Some**: o `Sheet` de filtros (`transactions-filters-panel.tsx`), as fichas
  (`transactions-active-filters-chips.tsx`), o `ToolbarFilterButton` e
  `transactions-date-presets.tsx`.

### 5.2 Campos (`FilterField[]`)

| id | label | type | Opções / regra | Servidor |
|---|---|---|---|---|
| `periodo` | Período | `period` | os presets do `FilterBar` (`ultimos-7`, `ultimos-30`, `este-mes`, `mes-passado`…) ou `[de, até]` | `date gte/lte` (por `filterPeriodRange`) |
| `categoria` | Categoria | `enum`, `multiple` | as categorias do tipo da aba (as duas com "Todas"), `media` = `ColorTile xs`, mais "Sem categoria" (`__none__`); `is` e `is-not` | `in` / `not.in` / `is null`; "não é Sem categoria" vira `not.is.null` |
| `pagamento` | Pagamento | `enum`, `multiple` | `PAYMENT_METHOD_VALUES` com `paymentMethodLabel` | `in` / `not.in payment_method` |
| `cartao` | Cartão | `enum`, `multiple` | os cartões da carteira (`ColorTile` com a cor do cartão) | `in payment_credit_card_id`. **Não depende mais de "Crédito" estar marcado** |
| `valor` | Valor | `money` | between, gte, lte | `amount gte/lte` |
| `conferir` | A conferir | `boolean` | "Sim" | `needs_review = true` |
| `captura` | Entrou por | `enum`, `multiple` | App, Frase, Atalho, Apple Pay, IA conectada, Compartilhar, Importação (`import_pdf`, `import_sheet` e `import_statement` juntos), Recorrente | `in source` |
| `pessoa` | Lançado por | `enum`, `multiple` | os membros (`Avatar xs`); só com 2 membros ou mais, e nunca para o convidado | `in user_id` |
| `pagou` | Quem pagou | `enum`, `multiple` | os adultos; só em carteira `split` | `in paid_by` |
| `projeto` | Projeto | `enum`, `multiple` | os projetos ativos; só se houver algum | `in project_id` |
| `parcelada` | Parcelada | `boolean` | | `not.is.null installment_plan_id` |
| `plano` | Compra parcelada | `enum` | os planos (`loadOptions`, que busca pela descrição) | `eq installment_plan_id` |
| `assinatura` | Assinatura | `enum` | as assinaturas | `eq subscription_id` |
| `recorrente` | Recorrente | `boolean` | | `is_recurring = true` |

- O `is-not` vale para `categoria`, `pagamento`, `cartao`, `captura`, `pessoa`
  e `projeto`. Os campos `enum` de valor único (`plano`, `assinatura`) só
  aceitam `is`.
- A ordem da lista do "+ Filtro" segue a frequência estimada do ICP: Período,
  Categoria, Cartão, Pagamento, Valor, A conferir, Lançado por, Quem pagou,
  Entrou por, Projeto, Parcelada, Compra parcelada, Assinatura, Recorrente.

### 5.3 URL e compatibilidade

- O **formato novo** é `?type=&q=&f=<serializeFilters>&sort=&page=`.
  `type`, `q`, `sort` e `page` continuam com os nomes de hoje. O controlador
  escreve por `router.replace`, como hoje, e preserva os parâmetros que não
  são dele (`txn`, `new`…).
- **Parâmetros antigos** são lidos uma vez, traduzidos em tokens e reescritos
  no formato novo com `replace`:

  | Antigo | Token |
  |---|---|
  | `preset=last7` · `last30` · `monthToToday` | `periodo` `ultimos-7` · `ultimos-30` · `este-mes` |
  | `preset=last15` | `periodo` `[hoje−14, hoje]` |
  | `from` / `to` | `periodo` `[from, to]` (com uma ponta só, a outra fica aberta: hoje ou 2000-01-01) |
  | `cats=a,b` · `uncat=1` | `categoria is [a,b]` · `categoria is [__none__]` |
  | `pm=` · `card=` | `pagamento is […]` · `cartao is […]` |
  | `min` / `max` | `valor` gte / lte / between |
  | `inst=1` · `plan=` · `sub=` | `parcelada` · `plano` · `assinatura` |
  | `conferir=1` | `conferir` |

- **Período padrão: "Este mês"**, mas só quando a URL chega sem nenhum filtro
  (sem `f` e sem parâmetro antigo de filtro). Assim o resumo fala do mês e os
  links de outras telas não ganham um corte que não pediram. `?txn=` sozinho
  conta como "sem filtro": a folha busca a linha pelo id se ela não estiver na
  página. **Decisão do Claude.**
- A tradução mora num módulo puro,
  `src/lib/transactions/filtros-da-url.ts` (`lerFiltrosDaUrl`,
  `escreverFiltrosNaUrl`), coberto por um teste de ida e volta, que hoje não
  existe. `transactions-list-search-params.ts` passa a ser só o leitor dos
  parâmetros antigos e o `buildTransactionsListSearchParams` que outras telas
  usam (Categorias). O formato antigo segue valendo como entrada.

### 5.4 Filtro do cabeçalho no telefone

Tocar no filtro do cabeçalho rola até o topo e abre o "+ Filtro" do
`FilterBar`. O `FilterBar` não tem uma API imperativa de abrir. A tela guarda
um ref da raiz e clica no botão "+ Filtro" pelo `data-slot` dele. O comentário
no código:
`// shortcut: clica no "+ Filtro" pelo data-slot; trocar por uma prop open quando o FilterBar ganhar uma`.
O `disabled` do filtro publicado acompanha o `disabled` da barra (sem dados e
carregando).

---

## 6. Lista

### 6.1 Dados

- `fetchTransactionsListPage` ganha os filtros da §5.2. A montagem dos filtros
  vira uma função só, `aplicarFiltros(query, filtros)`, que a página, o resumo e
  a exportação usam. **Uma regra de filtro, três leitores.**
- **Resumo**: `fetchTransactionsSummary(filtros)` lê só `type, amount` com os
  mesmos filtros, aos lotes de 1000, até 10.000 linhas, e soma no cliente.
  Comentário no código:
  `// shortcut: soma no cliente até 10.000 linhas; trocar por RPC de agregação quando uma carteira passar disso`.
  Acima do teto, o resumo mostra o que somou e a nota "Somando os primeiros
  10.000".
- **As linhas projetadas ("Previsto") não entram no resumo**: não são
  transações gravadas.
- O tamanho da página continua 100, numa constante só, exportada do módulo da
  consulta. Hoje há duas cópias (lacuna achada no inventário).

### 6.2 Colunas (desktop)

| Coluna | Conteúdo | `meta.mobile` | Ordenável |
|---|---|---|---|
| ☐ | seleção (não nas projetadas) | — | — |
| **Descrição** (`primary`) | `ColorTile xs` com a cor e o ícone da categoria; a descrição (senão o nome da categoria, senão "Sem descrição"); à direita do texto, `Badge`s `xs`: **A conferir** (`tone="info"`), **Previsto**, **Parcelada k/n** (o `HoverCard` de hoje), **Assinatura** (link para `/subscriptions`), **Recorrente** | `media` = ladrilho; `title` = descrição | não |
| **Categoria** | o ponto de cor e o nome; "Sem categoria" em `muted` | `description` (1º) | não |
| **Pagamento** | a forma, o cartão (nome curto) e o chip da fatura (Aberta, Fechada, Paga, Anterior) com o `HoverCard` de hoje | `description` (2º): "Nubank" ou "Pix" | não |
| **Quem** | `Avatar xs` de quem lançou (em carteira `split`: de quem pagou, com a dica "Pagou: Nome"); só com 2 membros ou mais | — | não |
| **Data** | `formatTransactionDmyPtBr` curta (07/11); **só quando a ordem não é por data** (com o grupo por dia ela se repetiria) | — | sim |
| **Valor** (`numeric`) | `MoneyDisplay` com sinal; a receita em `income` | `trailing` | sim |
| ⋯ | ações da linha (§6.4) | — | — |

- A coluna **Tipo** sai: o sinal e a cor já dizem.
- A coluna **Data** some quando a lista está agrupada. Para isso o `DataTable`
  precisa de `columnVisibility` controlado. Se ele não aceitar, a coluna fica
  e o grupo por dia fica igual. **O construtor confere no `data-table.tsx`
  antes de decidir. Não vale mudar `ui/` para isso.**
- Menu de colunas e densidade: `toolbar.view` do `DataTable`, com
  `id="transactions"` para lembrar a escolha.

### 6.3 Grupo, ordem, rodapé

- **Agrupado por dia** quando a ordem é por data (`groupByLocalDay` +
  `formatDayHeadingPtBr`: "Hoje", "Ontem", "qua, 5 nov"). O `groupTotal` é o
  resultado do dia (receitas − despesas), em `MoneyDisplay` com sinal. O mês
  some como grupo. O período já está no token, e o dia é a unidade da revisão
  noturna.
- Ordem por **data** (padrão, desc) ou **valor**. Com valor, sem grupo.
- `countLabel`: "142 lançamentos". `Pagination` de 100.
- O gêmeo do telefone usa o mesmo grupo, com o cabeçalho do dia grudado
  (`ItemGroupLabel sticky`, que o `DataTable` já põe).

### 6.4 Ações

**Na linha** (`rowActions`):
- **Confirmar** (`primary`, ícone de tique): só quando `needs_review`. Grava
  `needs_review=false`. Toast "Conferido".
- No ⋯: **Editar**, **Duplicar**, **Excluir** (`destructive`).
- Nenhuma ação na linha projetada.

**Menu de contexto** (`rowContextMenu`): Abrir, Editar, Duplicar, Confirmar
(quando cabe), Selecionar ou Desmarcar, Excluir. Sobre uma linha selecionada,
age na seleção: "N lançamentos", Categorizar, Marcar conferidos, Excluir N.

**Lote** (`bulkActions`):
- **Categorizar**: abre um `Dialog` `sm` com um `Combobox` de categoria. Com
  despesas e receitas misturadas, a ação fica desligada e a dica diz "Selecione
  só despesas ou só receitas". Grava `category_id` e `needs_review=false` nas
  ids marcadas. Toast "N lançamentos em Mercado".
- **Marcar conferidos**: só quando alguma marcada tem `needs_review`.
- **Editar**: só com uma marcada.
- **Excluir**: o `AlertDialog` de hoje, com a lista de até 8, o aviso da
  parcelada e o cascade.
- **A soma da seleção** na barra: "3 selecionadas · −R$ 412,30". Ver a §10.1.

**Duplicar** abre o formulário de criar com os campos da linha (tipo, valor,
descrição, categoria, forma, cartão, projeto), a data de hoje e sem o
`needs_review`. A parcelada duplica como **despesa simples** do valor da
parcela, e a descrição perde o "(k/n)". O construtor confere se o
`useTransactionForm` aceita valores iniciais. Se não aceitar, ganha um
`initialValues` no mesmo formato que a frase do compartilhar já usa.

### 6.5 Estados

| Estado | O que aparece |
|---|---|
| Carregando, primeira vez | o `loading.tsx` / `TransactionsPageSkeleton` novo: `StatCard` em esqueleto, `FilterBarSkeleton`, `TableSkeleton group={false}` dentro do `SkeletonGroup` |
| Recarregando (troca de filtro) | `pending` no `DataTable` e no `FilterBar`; o resumo mantém o número anterior esmaecido (`keepPreviousData`) |
| Carteira sem nenhuma transação | `EmptyStateGhost`: "Seu primeiro lançamento" / "Registre um gasto ou traga o extrato do banco." Ações: Nova transação (`primary`) e Importar extrato (`tertiary`) |
| Filtro sem resultado | `EmptyStateIcon variant="stack"`: "Nenhum lançamento com esses filtros", com "Limpar filtros" |
| Filtro "A conferir" sem resultado | `EmptyStateIcon variant="done"`: "Tudo conferido", com "Ver todos" (tira o token) |
| Erro | `error` do `DataTable` com "Tentar novamente" |

---

## 7. A conferir

- **O aviso**: um `Alert tone="info"` entre o cabeçalho e o resumo, quando a
  carteira tem N > 0 `needs_review` (a contagem do índice parcial, a mesma do
  Painel). Título "N lançamentos a conferir"; descrição "Entraram pelo Atalho,
  Apple Pay, IA ou importação. Confira categoria e valor." A
  `AlertAction` é **Revisar**: aplica o token `conferir`, ordena por data e
  limpa os outros tokens.
  - Com o token aplicado, o aviso troca: "Conferindo N" e a ação **Confirmar
    todos** abre um `AlertDialog` `variant="primary"` ("Confirmar N
    lançamentos?") e grava em lote.
  - Some com zero. Não se dispensa: é uma contagem, não uma novidade.
- **`?conferir=1`** (manifest, lembrete das 20h, Painel, jornada) vira o token.
  O `AConferirListaWireframe` sai.
- **Na linha**: o `Badge` "A conferir" e o "Confirmar" (§6.4).
- **No detalhe**: §8.3.

---

## 8. Detalhe da transação

`TransactionDetailSheet`, reescrito. Abre pelo clique na linha, por
`?txn=<id>` (as regras de hoje) e pelo "Ver" dos toasts.

### 8.1 Casca

- `Sheet` `side="right"` `variant="flush"` `size="md"`. No telefone é o
  `Drawer`.
- **Cabeçalho** (`DialogHeaderRow`):
  - à esquerda, ↑ e ↓ (`Button icon-md tertiary`, com `Tooltip` e o
    `shortcut` "↑"/"↓"), só no desktop e só abertos pela lista;
  - à direita, ⋯ (Editar, Duplicar, Excluir) e o ×
    (`DialogCloseButton placement="inline"`).
- **As setas** e as teclas ↑/↓ e J/K (fora de campo de texto) vão à linha
  anterior ou à seguinte da página atual, sem fechar. Na ponta da página ficam
  desligadas. Não pulam de página.
- **Herói**:
  - `ColorTile md` da categoria;
  - a descrição como título (`DialogTitle`);
  - o valor em `MoneyDisplay` `size="xl"` com sinal;
  - abaixo, `Muted`: "sex, 7 de nov de 2026 · lançado por Kauã pelo Apple Pay"
    (`formatDateLongPtBr` + o nome do membro + a origem). O "lançado por" só
    aparece com 2 membros ou mais.

### 8.2 Corpo (`DialogBody`), de cima para baixo

1. **A conferir**, quando cabe (§8.3).
2. **`DescriptionList`**, `columns` 1:
   - Categoria: ponto e nome; "Sem categoria".
   - Pagamento: forma · cartão · •• final, e o chip da fatura com a frase
     "Fatura que fecha em 12/nov, vence 20/nov".
   - Data.
   - Recorrência: "Todo mês". Só quando recorrente.
   - Assinatura: link para `/subscriptions?sub=id`.
   - Projeto: link para `/projetos/<id>`.
   - Entrou por: o rótulo da origem.
   - Lançado por e Quem pagou: só com mais de um membro.
3. **Parcelamento**: o `InstallmentPurchaseSection` e o `ImpactoDaParcela` de
   hoje, que já estão no DS. O construtor confere no `ds:audit`. Se algo
   reprovar, corrige ali.
4. **Divisão** (`PartesDaDespesa`, componente novo da tela, §9.3). Só em
   carteira `split`, só para despesa e só para adulto.
5. **Anexos** (`AnexosDoLancamento`, §9.4).

### 8.3 Bloco "A conferir"

Um `Alert tone="info" size="sm"`, condicionado como hoje (`needs_review`,
`import_batch_id`, ou Apple Pay com `walletCard`).

- **Título**: "Importado · a conferir", "Capturado pelo Apple Pay · a
  conferir", ou "Conferido" (`tone="success"`, quando só sobra o "Lembrar").
- **Ações** (`AlertActions`), três pesos (decisão de 07/11):
  - **Confirmar** (`primary`): `needs_review=false`.
  - **Lembrar "Nubank Ultra" como este cartão** (`secondary`): grava
    `wallet_alias`, até 60 caracteres. Só com `walletCard` e um cartão
    escolhido. Vira "Trocar…" quando o alias já existe.
  - **Desfazer importação** (`tertiary`): abre um `AlertDialog` destrutivo,
    "Apagar os N lançamentos desta importação?", no lugar do
    `window.confirm`. Fecha a folha.

### 8.4 Rodapé

`DialogFooter` com três ações, que o `TresAcoesContext` pesa sozinho:
- `start`: **Excluir** (sem fundo, tinta destrutiva);
- **Duplicar**;
- **Editar** (`primary`).

### 8.5 Edição

O corpo troca para o `TransactionFormSurface variant="detail-sheet"`, como
hoje: a pergunta "esta parcela ou o plano", o salvar que volta à leitura, o
`needs_review=false`. O cabeçalho mantém ↑↓ desligados enquanto edita.

---

## 9. O que sai do wireframe

| Wireframe | Vira | Onde |
|---|---|---|
| `AConferirListaWireframe` (página) | token `conferir` + `Alert` (§7) | `transactions/` |
| `AConferirWireframe` (detalhe) | `AConferirNoDetalhe` (§8.3) | `components/transactions/a-conferir-no-detalhe.tsx` |
| `ImportarExtratoWireframe` + `ImportarExtratoLink` + `mapeamento-csv.tsx` | `ImportarExtratoDialog` (§9.2) | `components/transactions/importar/` |
| `CompartilhadoAvisoWireframe` | `Alert tone="warning"` com `onDismiss` e, no PDF, a `AlertAction` "Abrir cartões" | `components/transactions/compartilhado-aviso.tsx` |
| `PartesDaDespesaWireframe` (detalhe) | `PartesDaDespesa` (§9.3) | `components/transactions/partes-da-despesa.tsx` |
| `AnexosWireframe` (detalhe) | `AnexosDoLancamento` (§9.4) | `components/transactions/anexos-do-lancamento.tsx` |
| `ProjetoDoLancamentoWireframe` (formulário) | `FormField` + `Combobox` "Projeto (opcional)", com a mesma regra de visibilidade | `transaction-form-fields.tsx` |
| `QuemPagouWireframe` (formulário) | `FormField` + `Select` "Quem pagou" (os adultos, `Avatar xs` no item) | idem |
| `PesosDaParceladaWireframe` (formulário) | `FormField` por adulto com `Input` de peso, e a soma em `Caption` | idem |

**Os arquivos de wireframe só são apagados quando ninguém mais os importa.**
Saem: `a-conferir-lista-wireframe.tsx`, `a-conferir-wireframe.tsx`,
`importar-extrato-wireframe.tsx` e `compartilhado-aviso-wireframe.tsx`.
`mapeamento-csv.tsx` sai se a conferência da fatura não o usar. **Ficam**, por
serem usados fora daqui: `anexos-wireframe.tsx` (Contas a pagar),
`divisao-wireframe.tsx` (Painel: Saldo e acerto) e `projetos-wireframe.tsx`
(`/projetos`, Painel). Neles saem só as exportações que ficaram sem uso.

A **lógica** (consultas, gravações, validações) dos wireframes vai para
hooks ou para `src/lib/` antes de ganhar a nova cara. **O comportamento não
muda.** Cada regra listada na seção do `JORNADAS.md` continua valendo: cota,
compressão, URL assinada, `client_id`, desfazer o lote, soma das partes.

### 9.1 Princípio

Funcionou no wireframe, funciona igual no DS. Se o comportamento precisar
mudar, é outra mudança.

### 9.2 Importar extrato (`ImportarExtratoDialog`)

- **Entradas**: o "Importar" do cabeçalho (o ⋯ no telefone), o vazio da
  carteira, `?importar=1` (consumido e removido, como hoje) e a jornada
  (`jornada.ts`).
- **Superfície**: `Dialog surface="auto" size="lg"` com `DialogSteps`. A altura
  fixa do `DialogSteps` já é do sistema.
- **Passo 1, "Arquivo"**:
  - `Tabs`: Extrato do banco (CSV ou OFX) ou Planilha (CSV).
  - O arquivo: um `Button secondary` "Escolher arquivo" sobre o input
    escondido. O nome e o tamanho aparecem num `Item`.
  - Destino: `RadioGroup variant="card"` com "Cartão de crédito" e "Conta"; o
    `Select` do cartão ou o `Select` da forma (Pix, Débito, Outro).
- **Passo 2, "Colunas"** (só CSV): um `Select` por papel (data, descrição,
  valor, categoria na planilha), com a prévia da primeira linha em `Caption`.
  As regras do `mapeamento-csv.tsx` continuam.
- **Passo 3, "Conferir"**:
  - `Table` `size="sm"` com as 20 primeiras: data, descrição, categoria
    sugerida, valor.
  - `DescriptionList`: total de itens, período, soma.
  - As categorias novas que serão criadas, em `Badge`.
  - Rodapé: Voltar (`tertiary`) e **Importar N lançamentos** (`primary`).
- **Fim**: `EmptyState` `done`, "N lançamentos importados, todos a conferir".
  Ações: **Revisar agora** (fecha e aplica o token `conferir`) e **Desfazer
  importação** (`AlertDialog` destrutivo). Fechar invalida a lista e o resumo.
- `pending` trava o fechar durante a gravação. `dirty` + `confirmDiscard`
  depois de escolher o arquivo.

### 9.3 Partes da despesa (`PartesDaDespesa`)

- `PageSection` `size="sm"`, título "Divisão".
- "Pagou: Nome" num `Item` com o `Avatar`.
- A lista das partes: `Item` por pessoa, com o `Avatar`, o nome, a parte em
  `MoneyDisplay` e o `Badge` "manual" quando é o caso.
- **Editar à mão** abre um `Form` no lugar: `FormInput money` por adulto, a
  soma ao vivo ("Faltam R$ 12,00" em `FormError`), e `FormActions` com Cancelar
  e Salvar.
- **Voltar ao automático**: `Button tertiary`, com confirmação por
  `AlertDialog primary`.
- Os dois passam pela RPC `definir_partes`, sem mudança.

### 9.4 Anexos (`AnexosDoLancamento`)

- `PageSection` `size="sm"`, título "Anexos", e a ação "Adicionar" (`Button`
  com o ícone de clipe, abrindo o input de foto ou PDF).
- Cada anexo é um `Item`:
  - ícone de documento ou miniatura;
  - nome, tamanho e data;
  - "Abrir" (a URL assinada numa aba aberta no clique; com o popup bloqueado, o
    link "Abrir anexo");
  - ⋯ com "Apagar" (`AlertDialog`).
- O boleto da conta paga aparece como item só de leitura.
- Vazio: `EmptyState layout="inline"`, "Sem anexos. Guarde o recibo ou o
  boleto aqui."
- `pending` no envio, o erro de cota em `CardMessage destructive`.

---

## 10. O que muda no design system

### 10.1 `DataTable`: a soma da seleção (pede o ok do dono)

- **Prop nova**: `selectionSummary?: (rows: T[]) => React.ReactNode`. O nó
  aparece na barra flutuante depois da contagem ("3 selecionadas · −R$
  412,30").
- **Uso real**: Transações (o lote do comparativo nº 7, padrão do YNAB). As
  outras telas com `DataTable` (Assinaturas, Contas, Membros) não mudam: a
  prop é opcional.
- **Na mesma mudança**:
  - o exemplo na página `/designsystem/data-table` (um interruptor
    "selectionSummary");
  - uma linha no `table-versions.test.ts`;
  - o bullet do `DataTable` no `AGENTS.md`;
  - a rodada no `HISTORICO-DESIGN-SYSTEM.md`.
- **Se o dono recusar** no pedido do harness, a soma não aparece, e o resto do
  lote segue igual (invariante 7).

### 10.2 Nada mais

Todos os outros elementos vêm do catálogo de hoje: `PageHeader`, `Alert`,
`StatCardGroup`, `Toolbar`, `Tabs`, `ToolbarSearch`, `FilterBar`, `DataTable`,
`Badge`, `ColorTile`, `Avatar`, `HoverCard`, `Sheet`, `DescriptionList`,
`Item`, `PageSection`, `Dialog`, `DialogSteps`, `RadioGroup`, `Select`,
`Combobox`, `Table`, `EmptyState`, `AlertDialog`, `Form*`.

Se o construtor achar um elemento sem correspondência, **para e pergunta**
(`AGENTS.md`, "Parar e perguntar"), em vez de escrever markup solto.

---

## 11. Exportar CSV

- "Exportar" no cabeçalho (`tertiary`) e no ⋯ do telefone.
- Busca tudo com os filtros atuais (`aplicarFiltros`, até 10.000 linhas) e
  gera `transacoes-AAAA-MM-DD.csv`. Colunas: data, descrição, categoria, tipo,
  valor com sinal e vírgula decimal, forma, cartão, lançado por, a conferir. O
  separador é `;`, que o Excel em português abre direto.
- Toast "142 lançamentos exportados". Acima do teto, o toast avisa
  "Exportados os primeiros 10.000".
- Lê o banco e não grava nada.

---

## 12. Cabeçalho e ações da página

- **Desktop**: `PageHeader collapse` + `PageHeaderTitle asChild` com
  `<p aria-hidden>`, como as telas revisadas.
- `PageHeaderActions`, três pesos:
  - **Nova transação** (`primary`, o `TransactionNewSplitButton` de hoje com o
    menu "Mais tipos");
  - **Importar** (`secondary`);
  - **Exportar** (`tertiary`).
- O convidado não vê Importar nem Exportar, e a "Nova receita" segue escondida
  para ele.
- **Telefone**: o título é da casca (`TituloDaTela`). A `Toolbar` leva as abas
  de tipo e o ⋯ (Importar extrato, Exportar CSV).

---

## 13. Acessibilidade e teclado

- O resumo é `StatCardGroup`; cada número tem rótulo inteiro.
- Atalhos:
  - `F` abre o "+ Filtro" (padrão do `FilterBar`);
  - ↑/↓ e J/K no detalhe;
  - Esc fecha o detalhe;
  - ⌘K segue a paleta.
- "Confirmar" na linha tem nome acessível com a descrição: "Confirmar Uber".
- O `Badge` "A conferir" tem texto. Não depende de cor.
- No toque, todo alvo tem 44 px. As peças do DS já garantem.

---

## 14. Jornadas e Atlas

**Mudam** (atualizar o `docs/JORNADAS.md` na mesma mudança, na ordem da
seção "Jornadas do app" do `AGENTS.md`):

- a lista "A conferir" sai e vira o token + o aviso. A lacuna "vira filtro na
  revisão de tela" é corrigida;
- a importação sai de cima da barra para um diálogo, aberto pelo cabeçalho;
- entram Duplicar, Confirmar na linha, Categorizar em lote e Marcar conferidos
  em lote;
- o formato da URL (`f=`), a tradução dos parâmetros antigos e o padrão "Este
  mês";
- as setas ↑↓ do detalhe;
- o aviso do compartilhado vira `Alert`;
- os filtros novos (quem lançou, quem pagou, origem, projeto, recorrente, "não
  é");
- **lacunas novas**: o excluir segue físico, sem desfazer; o resumo soma no
  cliente até 10.000 linhas.

Depois: `docs/atlas/template.html`, `python3 docs/atlas/build.py` e republicar
o Atlas no mesmo URL.

---

## 15. Verificação

- `ds:audit` limpo nos arquivos da tela; `tsc`, `lint` e `test:unit` verdes.
- **Testes novos**:
  - ida e volta de `filtros-da-url` (cada parâmetro antigo e o formato novo);
  - `aplicarFiltros` (cada campo e cada operador gera a chamada certa, com o
    cliente do Supabase falso);
  - a soma do resumo ignora as projetadas;
  - o CSV (separador, sinal, vírgula).
- **Testes de fonte reescritos** para o desenho novo: a tela importa o
  `FilterBar` e não importa nenhum wireframe; `conferir=1` vira o token; o
  detalhe usa `AConferirNoDetalhe`; e os demais.
- **No navegador**, só leitura, contra o banco de produção:
  - 1440 px e 375 px, nos temas claro e escuro;
  - cada link antigo da §5.3 abre com o token certo;
  - ↑↓ no detalhe;
  - o "+ Filtro" pelo cabeçalho do telefone;
  - o diálogo de importar até o passo 3, **sem clicar em Importar**;
  - **nenhum clique em Confirmar, Categorizar, Excluir, Salvar nem Importar**.
    As gravações ficam cobertas pelos testes de unidade e pela leitura do
    código.

---

## 16. Decisões do Claude (para o dono conferir)

1. O tipo fica nas `Tabs`, e não num token.
2. A busca por descrição é um campo, e não um token.
3. Sem E/OU no `FilterBar`.
4. "Este mês" como padrão, só sem filtro na URL.
5. Grupo por dia com o total do dia; a coluna Data só aparece fora do grupo.
6. A coluna Tipo sai; entram Quem e o ladrilho da categoria.
7. O telefone é a mesma tela, sem "Resultado" e sem a contagem no resumo.
8. A importação vira diálogo de passos.
9. A soma do resumo é feita no cliente até 10.000 linhas, sem migração.
10. O excluir continua físico.
11. A única mudança de `ui/` é o `selectionSummary`.
12. Os wireframes de anexos, divisão e projetos continuam fora de Transações.
