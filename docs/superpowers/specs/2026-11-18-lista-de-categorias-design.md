# Cartões de Categorias (opção B2·b) — desenho

Data: 18/11/2026.

**Escolhas do dono, na ordem:**
1. Começou pela **A1** (lista densa).
2. Trocou para manter os cartões: **B2**.
3. Ficou com o refino **B2·b**, a linha de área na cor da categoria, com a média tracejada.

**Autorizações do dono em `src/components/ui/`:**
- a prop `projected` em `progress.tsx`;
- a prop `reference` em `ChartSparkline` (`chart.tsx`);
- a cor da categoria na faísca.

## Por quê

A pessoa abre Categorias para responder duas perguntas: **onde foi o dinheiro este mês** e **alguma
coisa está fora do normal**.

**O cartão de hoje:**
- repete "Ver categoria" e "Sem orçamento · Participação" em todos;
- o chip de variação não diz contra o quê;
- não separa o que já foi lançado do que ainda vai cair;
- não mostra se o mês está acima do normal da categoria.

**Por que cartão e não lista:** o dono preferiu manter os cartões. O cartão tem espaço para a série de 6
meses, que responde "fora do normal?" melhor que uma porcentagem. A análise com total e gráficos
grandes continua no Painel.

## O que muda

### O cartão de despesa

```
┌───────────────────────────────────────┐
│ [🛒] Mercado                       ⋯ │   ⋯ só no cursor/toque longo
│ R$ 1.752,78                 = out.   │   total do mês · variação
│ R$ 1.652,78 lançado + R$ 100 previsto│   (só com previsto)
│ ╱╲__╱‾‾╲___╱‾‾‾  - - - - - - média  │   6 meses, área na cor da categoria
│ ███████████████▒▒|                   │   lançado · previsto · ritmo
│ R$ 252,78 acima do limite de R$ 1.500│   frase de estado
└───────────────────────────────────────┘
```

- **Cabeçalho:** o `ColorTile` e o nome. O ⋯ (Editar, Excluir) aparece só no cursor; o toque longo e o
  botão direito abrem o `CategoryCardContextMenu` de hoje, só para quem escreve (`podeEscrever`).
- **Valor:** o total do mês (lançado + previsto), com a variação à direita:
  - `↑ N% vs out.` em `text-expense`, `↓ N% vs out.` em `text-income`;
  - `= out.` neutro quando a variação é "estável" (`isMomFlat`, ±5%);
  - `novo` quando não houve gasto no mês anterior.
- **Linha do previsto**, só quando há previsto: `R$ X lançado + R$ Y previsto`.
- **A série:** uma `ChartSparkline variant="area"` dos últimos 6 meses, com o mês da tela no fim:
  - a cor é a da categoria;
  - a `reference` é a média dos 5 meses anteriores, como linha tracejada neutra;
  - o nome acessível segue o modelo "Gasto em Mercado nos últimos 6 meses: de R$ 1.500 a R$ 1.752; média R$ 1.640".
- **A barra:** `Progress` com `projected`. A parte cheia é o lançado, a tracejada é o previsto.
  - **Com limite:** mede contra o limite, com o `marker` no ritmo do mês e as `bands` do orçamento
    (`[85, 100]`).
  - **Sem limite:** mede contra o maior total do mês entre os cartões da aba; neutra e sem ritmo.
- **A frase de estado:**
  - Sem limite: `N% das despesas do mês`.
  - Passou do limite: `R$ X acima do limite de R$ Y`.
  - Dentro do limite e acima do ritmo: `Faltam R$ X de R$ Y · acima do ritmo`, no tom de aviso.
    "Acima do ritmo" quer dizer que a fração gasta passou o ritmo em mais de 10 pontos.
  - Dentro do limite e no ritmo: `Faltam R$ X de R$ Y · no ritmo`.
- **O ritmo:** no mês atual é o dia de hoje ÷ os dias do mês; em mês passado, 100; em mês futuro, sem traço.
- **O cartão inteiro abre o detalhe** (`CardLink`, `categoryDetailPath`), o mesmo destino de hoje. Sai o
  "Ver categoria".

### O cartão de receita

- A mesma forma. O valor é recebido + previsto, e a linha embaixo diz `R$ X recebido + R$ Y previsto`.
- A série é a de receitas, com a média.
- A barra é a de participação (sem limite e sem ritmo), e a frase é `N% das receitas do mês`.
- A variação inverte as cores: `↑` em `text-income`, `↓` em `text-expense`.

### A grade

- **Linha acima da grade:** à esquerda, `N categorias com gasto em <mês>`; à direita, um `Select` pequeno
  de ordenação (Maior gasto · Nome · Variação), igual no telefone. Abre em "Maior gasto" e fica em
  memória.
- **Grade:** 3 colunas no `xl`, 2 no `md` e 1 no telefone, como hoje, com os cartões da mesma altura.
- **Categorias sem gasto no mês** saem da grade. No pé, uma linha diz "Sem gasto em novembro: A, B", e
  cada nome é link para o detalhe. Nas receitas: "Sem receita em novembro: …".
- **Aba sem nenhum gasto no mês:** um `EmptyState` com o leque (`variant="stack"`) e "Nenhum gasto em
  novembro", com o rodapé abaixo.
- **Telefone:** os mesmos cartões, empilhados. O cabeçalho (mês no calendário, abas, +) não muda.

### Os dados

- **Mês da tela (já existe, mesma base):**
  - lançado = `postedByCategoryId`;
  - previsto = `projectedInstallments + projectedSubscriptions`;
  - total = `spendByCategoryId` (`committedTotal`);
  - variação: `committedTotal` contra o `prevSpendByCategoryId` (`committedTotal` do mês anterior), sem
    conta proporcional no meio do mês, como o cartão de hoje.
  - Nas receitas: `receitasDoMesPorCategoria` do mês e do mês anterior.
- **Série de 6 meses (nova):**
  - uma consulta só, por carteira, das transações de despesa e receita dos 5 meses anteriores ao mês da
    tela, com as colunas que `buildMonthlySeries` lê;
  - a série de cada categoria sai de `buildMonthlySeries` (`detail/category-detail-utils.ts`), com os
    cartões de crédito para a atribuição por fechamento, como no detalhe;
  - o último ponto é o total do mês da tela (lançado + previsto);
  - a média é a dos 5 meses anteriores, contando os meses sem gasto como 0;
  - a consulta não bloqueia a tela: enquanto carrega, a faísca mostra o esqueleto dela.

### `Progress` ganha `projected` (autorizado)

- **`projected?: number`**, na unidade do `value`. Depois do trecho cheio, desenha um trecho tracejado na mesma
  tinta, até `min(value + projected, max)`. Se `value >= max`, não há tracejado.
- **Escala:** o `marker` e as cesuras das `bands` não mudam. Com `bands`, o tom sai do total. A pastilha de
  excesso conta o total.
- **Combinações proibidas:** `never` com `zones`, `segments` e `variant="brand"`. O `ProgressRing` não ganha a prop.
- **Leitor de tela:** o `aria-valuetext` diz lançado e previsto.
- **Pele:** o tracejado é um `repeating-linear-gradient` de `currentColor`, por `@utility` em `globals.css`
  se precisar.

### `ChartSparkline` ganha `reference` (autorizado)

- **`reference?: number`**, na unidade de `y`. Uma linha horizontal tracejada, em
  `--color-muted-foreground`, sem rótulo e atrás da série. Ela entra no nome acessível pela `description`
  de quem chama.
- **A cor da categoria:** passa pelo `config` (`{ [y]: { color } }`). A cor sai de `tileColorFor`, a mesma
  normalização do `ColorTile`, e não do valor cru do banco. É a exceção autorizada pelo dono à regra de
  que a cor da pessoa mora só no ladrilho: ela pinta só traço e área, nunca sob texto.

### Na mesma mudança (design system)

- As páginas do `Progress` e do `Chart` no catálogo ganham o interruptor e o exemplo.
- Os testes de versões das duas peças trancam a pele.
- O AGENTS.md ganha uma linha em cada bullet e registra a exceção da cor da categoria na faísca.

## Abordagens

1. **Escolhida:** cartões B2·b. A faísca de área com `reference` é feita no design system, a barra com
   `projected` também, e a série sai de `buildMonthlySeries` numa consulta de 6 meses.
2. A faísca sem a média. Recusada: perde a comparação com o normal da categoria.
3. A faísca neutra. Recusada pelo dono: preferiu a cor da categoria.
4. Lista densa (A1). Desenhada e aprovada antes, e trocada pelo dono por cartões.

## Fora

- Resumo do mês, total grande e gráfico grande: a análise mora no Painel.
- Comparar com a média em vez de com o mês anterior na variação (a ideia da B2·c): a média aparece
  só na faísca.
- Mudar o detalhe da categoria, o diálogo de criar e editar, o assistente de primeiro uso e o vazio sem
  categorias.

## Restrições

- Fora de `progress.tsx`, `chart.tsx` e do necessário em `globals.css`, nada muda em `src/components/ui/`.
- Dinheiro com `currencyBRL` / `MoneyDisplay`.
- **Jornadas:** o clique no cartão continua indo a `categoryDetailPath`, e Editar e Excluir continuam
  abrindo os mesmos diálogos. Os links do rodapé "Sem gasto" são caminho novo para o detalhe: se pela
  régua do AGENTS.md isso conta como mudança de jornada, atualize `docs/JORNADAS.md` e o Atlas na mesma
  mudança.
- O esqueleto da grade (`categories-page-grid-skeleton.tsx`) acompanha a forma nova do cartão.

## Fica para quem implementa

- O nome e o lugar das funções puras da frase, do ritmo, da variação e da média (por exemplo,
  `lib/categoria-situacao.ts`, com teste).
- Se a consulta de 6 meses vira um hook (`useSerieDasCategorias`) e a chave de cache dela.
- A altura da faísca no cartão: entre 32 e 44px.
