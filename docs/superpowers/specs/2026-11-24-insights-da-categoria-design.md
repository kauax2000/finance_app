# Insights do detalhe da categoria — design

**Data:** 24/11/2026 · **Tela:** `/categories/[id]` · **Mockup:** `docs/design/painel/insights-da-categoria.html` (catálogo e formas; o dono escolheu os 9 insights e a forma B).

## Por quê

O detalhe mostra hoje um insight só (`InsightDaCategoria`), e ele tem quatro problemas:

- é o primeiro de 3 que tem ação, então só 2 aparecem;
- é um `Item` de fundo transparente, sem título, com metade da altura vazia;
- o ✓ verde parece "concluído";
- repete o cartão Parcelas.

A carteira já detecta mais coisas (a caixa de insights do Painel, `insights-daily`), mas nada disso chega à categoria. O dono quer os insights úteis da categoria na tela, todos no mesmo desenho, um por vez.

## Objetivos

- Mostrar até 9 tipos de insight na categoria, ordenados pela urgência.
- Todos na forma A:
  - um `Card` como os vizinhos;
  - título com o assunto;
  - a ação no canto (`CardAction`, `Button tertiary` `sm`);
  - um número em destaque;
  - uma linha de apoio embaixo.
- Mais de um: um por vez, com os pontinhos e ‹ › no pé (forma B).

**Fora do escopo:**
- repaginar a caixa do Painel (ela continua o wireframe `insights-wireframe.tsx`);
- detectores novos além dos 9;
- notificação push;
- dispensar um insight pelo detalhe (ele sai quando é resolvido).

**Antimetas:**
- um insight que repete o que o cartão ao lado já diz, sem trazer número novo;
- arco-íris (o Card não é `brand`: a peça de marca da tela é a Leitura do mês);
- texto que culpa (as `PALAVRAS_PROIBIDAS` de `textos.ts` valem).

## Abordagens

1. **Ler a caixa do Painel e recortar pela categoria (escolhida).** O mesmo insight fica nos dois lugares: resolver no detalhe tira do Painel, e as ações já existem em `lib/insights/acoes.ts`. Custo: o `sazonal` não guarda a categoria, então o detector passa a guardá-la, com deploy da Edge `insights-daily` em produção.
2. **Calcular os 5 detectores na tela, com os lançamentos da categoria.** Não mexe no servidor, mas busca 12 meses a cada abertura e duplica o aviso em dois lugares, que não se enxergam.
3. **Só os 4 locais.** Descartada: o dono escolheu os 9.

## Os 9 insights

A ordem é a do carrossel: o primeiro que vale aparece primeiro. A tabela traz o título, o número, a linha de apoio e a ação de cada um. Os detalhes de cada insight vêm logo abaixo dela.

| # | Insight | Título | Número | Linha | Ação |
|---|---|---|---|---|---|
| 1 | Duplicado | "Lançamento repetido?" | o valor | "{descrição}, duas vezes em dd/mm" | "Ver os dois" |
| 2 | A conferir | "{n} para conferir" | a soma | "Lançados pelo app e ainda não vistos" | "Conferir agora" |
| 3 | Ritmo contra o limite | "Vai passar do limite" | "R$ X acima", tom de aviso | "No ritmo de hoje fecha em R$ Y; o limite é R$ Z" | "Ajustar limite" |
| 4 | Gasto do ano que volta | "{Termo} chega em {mês}" | o valor do ano passado | "Foi o que você pagou em {mês de ano}" | "Criar conta a pagar" |
| 5 | Parcela que termina | "Sobra em {mês seguinte}" | "+R$ X/mês", tom de sucesso | "{nome} termina em {mês} ({n}/{n})" | "Ver na Previsão" |
| 6 | Gasto que se repete | "{nome} todo mês" | "~R$ X/mês" | "Há {n} meses seguidos, sem cadastro" | "Virar assinatura" ou "Virar conta a pagar" |
| 7 | Assinatura mais cara | "{nome} mudou de preço" | "R$ de → R$ para" | "+R$ {(para−de)×12} por ano" | "Atualizar valor" |
| 8 | Sugestão de limite | "Sugestão de limite" | "R$ X/mês" | "Pela média dos últimos 6 meses" | "Definir limite" |
| 9 | Concentração | "Dois gastos fizeram o mês" | "{p}%" | "Sem {A} e {B}, o mês ficaria em R$ X" | "Ver os dois" |

1. **Duplicado** (caixa, `duplicidade`)
   - Aparece se os dois `ids` do payload estão nos lançamentos do mês da categoria.
   - A ação filtra a lista da página pela descrição (`setFilterDescriptionQuery`) e rola até ela, como o "Ver <grupo>" da Leitura.
2. **A conferir** (local)
   - Conta os `needs_review` nos lançamentos do mês da categoria. Aparece com 1 ou mais.
   - "Conferir agora" abre `/transactions?conferir=1&cats=<id>`.
3. **Ritmo contra o limite** (local)
   - Só no mês aberto, com limite e com `lancado + previsto > limite`. Os números são os da faixa do mês.
   - "Ajustar limite" abre o diálogo de limite da página.
4. **Gasto do ano que volta** (caixa, `sazonal`)
   - Aparece se `payload.category_id === categoryId`.
   - Ao tocar em "Criar conta a pagar", o insight vira `seen` (`statusAoTocarOLink`) e abre `/bills?new=1`.
5. **Parcela que termina** (local, `insights()` id `parcela-termina`)
   - Mantém a regra de hoje.
6. **Gasto que se repete** (caixa, `recorrencia`)
   - Aparece se `payload.category_id === categoryId`. O título usa `payload.nome`.
   - O botão abre o diálogo de recorrência no design system (abaixo).
7. **Assinatura mais cara** (caixa, `preco_assinatura`)
   - Aparece se a assinatura `payload.assinaturaId` é desta categoria.
   - "Atualizar valor" chama `atualizarPrecoDaAssinatura`, com o `pending` no botão e um toast de sucesso ou de erro.
8. **Sugestão de limite** (local, `insights()` id `limite`)
   - Só na despesa sem limite. O convidado não vê a ação, e então o insight sai do carrossel.
9. **Concentração** (local, `insights()` id `concentracao`)
   - A ação põe a lista da página em ordem de valor, do maior, e rola até ela.

O número usa `font-mono font-semibold` em `text-2xl`, na tinta do texto, salvo onde a tabela diz outro tom (`text-success`, `text-warning`).

O convidado só vê insight sem ação de escrita, na mesma regra de hoje: sem `acao`, sem cartão. Os da caixa já vêm filtrados pela RLS.

## Forma

- **Componente novo da tela:** `InsightsDaCategoria`, em `components/categories/detail/resumo/`, no lugar de `InsightDaCategoria`. A lista vem pronta e ordenada; ele desenha o cartão e o carrossel.
- **Um por vez:** o `Carousel` do design system, com `CarouselDots` e `CarouselPrevious`/`CarouselNext` no pé do cartão, só com 2 ou mais.
  - O cartão tem a altura do maior insight, para não pular ao passar.
  - No toque, o dedo arrasta.
  - Ele tem `aria-label` "Insights da categoria", e não há autoplay (é dado da pessoa).
- **Lugar e raio:** o mesmo de hoje, na coluna 4/9 ao lado do "Quem gastou" (sozinho, ocupa a linha), com o raio `rounded-surface` do `Card`. O título fica alinhado com o vizinho pela regra do `CardHeader` sem descrição.
- **O que muda no design system:** se o `Carousel` não tiver o pé compacto (pontinhos à esquerda, ‹ › à direita) dentro de um `Card`, ganha a peça ou a variant que faltar, com registry, página e teste (invariante 8, autorização permanente).
- **Diálogo de recorrência:** o do Painel é wireframe. O detalhe ganha a versão no design system, em `components/insights/dialogo-da-recorrencia.tsx`:
  - `Dialog surface="auto"` com `Form`;
  - os campos Assinatura ou Conta a pagar (`Tabs`/`ToggleGroup` segmentado), nome, valor (`FormInput money`), dia (`Select` de 1 a 31), categoria (`Combobox`) e valor variável (`FormSwitch`);
  - `FormCancel` e `FormSubmit`, com as mesmas chamadas `virarAssinatura` e `virarConta`.
  - O Painel continua com o dele.

## Servidor

- `detectarSazonais` passa a devolver `category_id`: a categoria mais comum entre os `achados`, ou `null`. O payload grava o campo. Há teste em `detectores.test.ts`.
- **Deploy da Edge `insights-daily`** (`supabase functions deploy … --use-api`, fora do sandbox).
  - É produção: pede um "sim" explícito do dono na hora, mesmo com esta abordagem aprovada.
  - Os insights sazonais já gravados não têm a categoria e não aparecem no detalhe até a próxima geração.

## Jornadas

Os links e diálogos novos são mudança de jornada:
- Transações com `conferir`;
- `/bills?new=1`;
- o diálogo de recorrência;
- o filtro e a ordem da lista.

Atualizar `docs/JORNADAS.md` e o Atlas, e republicar.

## Fica com quem constrói

- O nome das funções puras que montam cada insight. Elas devem morar em `lib/`, com teste cada uma.
- O texto exato do `aria-label` de cada cartão.
- A peça do `Carousel` que serve ao pé.

## Decisões da revisão do construtor (minhas, para o dono conferir)

1. **`/transactions?conferir=1&cats=<id>` já funciona.** `filtrosAntigos` em `lib/transactions/filtros.ts` lê `conferir=1` e `cats`, e os vira tokens do `FilterBar`. Não há tela nova.
2. **Os insights da caixa vêm de uma leitura própria do detalhe.** Não usa o `useInsights`, que pega 20 da carteira e marca `seen` ao ler. A leitura busca `insights` da carteira com `kind in (duplicidade, sazonal, recorrencia, preco_assinatura)` e `status in (new, seen)`, sem teto de 20, e recorta pela categoria.
   - **Abrir o detalhe não marca `seen`.** Quem marca é o Painel.
   - Agir marca `acted` (`marcarInsight`), como no Painel, e `sazonal` marca `seen` (`statusAoTocarOLink`).
3. **Ligação com a categoria.**
   - O `duplicidade` vale se um dos dois `ids` é desta categoria, em qualquer mês. Uma consulta pequena busca o `category_id` dos ids (o detector só olha os últimos dias, então são poucos).
   - O `preco_assinatura` vale se a assinatura `payload.assinaturaId` tem `category_id` desta categoria, também por consulta pequena.
   - O `recorrencia` usa `payload.category_id`, e o `sazonal` o `category_id` novo.
4. **Resolvido, sai.**
   - Depois da ação, a lista é relida e o carrossel fica no mesmo índice, limitado ao novo tamanho.
   - Os locais saem quando o dado muda (definir limite tira "Sugestão de limite" e pode trazer "Vai passar do limite").
   - Com zero, não há cartão.
5. **`insights()` passa a produzir todos.** A função de `categoria-resumo.ts` deixa de escolher um só e devolve todos os locais que valem: parcela termina, limite, concentração, ritmo contra o limite e a conferir.
   - A tela junta esses com os da caixa e ordena pela tabela.
   - Os testes dela mudam junto.
6. **Ordem de entrega.** O front sai antes do deploy, e o `sazonal` fica ausente (sem erro) até a Edge subir com a categoria. O deploy é o último passo, com o "sim" do dono na hora. Nada vai para `main`.
7. **Altura igual.**
   - Os slides do `Carousel` são itens de uma fileira flex, que já estica todos à altura do maior.
   - O cartão é o que contém o carrossel, então o pé fica sempre no mesmo lugar.
   - Só se o `Carousel` não esticar é que entra uma variant nova, com registry, página e teste.
