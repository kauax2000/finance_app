# Filtro de período por unidade (Dias · Meses · Ano) — design

Data: 08/11/2026. Escolha do dono: opção **C** do comparativo de layouts
(atalhos em dias, grade de meses e lista de anos, em abas). O dono pulou as
perguntas; as decisões marcadas **(decisão do Claude)** são minhas e podem ser
revistas.

## Por quê

O editor de período do `FilterBar` (o token "Período" da tela de transações)
mostra quatro atalhos e dois meses de calendário lado a lado. Quem filtra
lançamentos pensa em unidades — "março", "o trimestre", "o ano passado" — e
hoje precisa clicar dia a dia e navegar mês a mês para isso. Além disso:

- o segundo mês exibido é o seguinte ao atual (dezembro), quando quem filtra
  olha para trás;
- nada no editor diz qual intervalo está escolhido nem quantos dias ele tem;
- o token mostra datas ("1 ago e 31 out") mesmo quando o intervalo é um mês ou
  um ano inteiro.

## Objetivo

Escolher um período em **um ou dois toques** na unidade em que a pessoa pensa:

- **Dias** — atalhos (Hoje, 7, 30 e 90 dias) e o calendário de intervalo;
- **Meses** — uma grade de 12 meses, escolhendo de um mês a outro;
- **Ano** — um ano inteiro.

## Fora do escopo

- Datas digitadas (dd/mm/aaaa) — foi a opção B.
- Comparar períodos, períodos móveis salvos, semana como unidade.
- Mudar o `DatePicker` ou os atalhos que ele mostra.
- Mudar a consulta de transações: o valor continua `[atalho]` ou
  `[deYmd, ateYmd]`, e `filterPeriodRange` continua sendo a única tradução.

## Anti-objetivos

- URLs salvas antigas (`periodo:is:este-mes`, `periodo:is:mes-passado`,
  `periodo:is:2026-10-01:2026-10-15`) deixarem de abrir o filtro.
- O filtro emitir um valor incompleto (a regra do `FilterBar`: grava ao vivo,
  nunca o incompleto).
- Uma segunda forma do editor para o telefone: a gaveta é a mesma árvore.

## Como funciona

### Abas

`Tabs` (`variant` padrão, `stretch`) no topo do editor, abaixo do cabeçalho
"Editar período" / "Remover". Três abas: **Dias**, **Meses**, **Ano**.

A aba que abre depende do valor atual:

| Valor | Aba |
| --- | --- |
| ano inteiro (1/jan a 31/dez do mesmo ano) | Ano |
| meses inteiros (dia 1 de um mês ao último dia de outro, ou do mesmo) | Meses |
| qualquer outro, ou um atalho de dias | Dias |
| vazio (filtro novo) | **Meses** (decisão do Claude: é a razão da opção C) |

Trocar de aba não muda o valor; só troca o painel.

### Dias

O `Calendar mode="range"` que existe hoje, com duas mudanças:

- os atalhos passam a ser **Hoje, Últimos 7 dias, Últimos 30 dias, Últimos 90
  dias** (os de mês e ano saem daqui: viram toques nas outras abas);
- os meses exibidos terminam no **mês atual** (desktop: mês anterior + atual;
  o `defaultMonth` com valor continua sendo o mês do início do intervalo).

### Meses

`MonthGrid` ganha um modo de intervalo (`mode="range"`):

- Primeiro toque num mês: o valor vira aquele mês inteiro (dia 1 ao último) e
  é gravado na hora. O mês fica como **âncora**.
- Segundo toque: o valor vira da âncora ao mês tocado (em qualquer ordem: o
  menor é o início), gravado na hora; a âncora some.
- Toque seguinte recomeça (novo mês inteiro, nova âncora).
- Pintura: as pontas são a tecla `primary`; os meses do meio, a faixa
  (`bg-accent`/a mesma do intervalo do `Calendar`); o mês atual sem escolha,
  `secondary` (como hoje).
- O ano entre setas continua; trocar de ano preserva a âncora (dá para ir de
  nov/2025 a fev/2026).
- **Totais por mês** (opcional): uma legenda pequena sob o nome do mês com o
  total de despesas daquele mês ("R$ 4,1 mil"). O `MonthGrid` recebe
  `caption?: (mes: Date) => React.ReactNode`; o `FilterBar` repassa o que o
  campo declarar. Sem `caption`, a grade fica só com os nomes.

### Ano

Uma coluna de anos, do atual para trás, até 5 anos (o mesmo alcance do
`DatePicker`). Cada linha é uma escolha única (o ano inteiro, 1/jan a 31/dez),
com o total do ano à direita quando o campo der totais. O ano escolhido é a
linha selecionada. (decisão do Claude: `ToggleGroup`/linhas de `Item` — quem
implementa escolhe o componente do catálogo que já é escolha única em lista.)

### Resumo

Abaixo do painel, em todas as abas, uma linha: o intervalo por extenso e a
duração — "1 ago – 31 out · 3 meses", "2025 · ano inteiro", "2 nov – 8 nov ·
7 dias". Sem valor, a linha não aparece.

### O token

O rótulo do token passa a falar a unidade:

| Valor | Rótulo | Operador |
| --- | --- | --- |
| atalho | o nome do atalho ("Últimos 90 dias") | é |
| um mês inteiro | "nov 2026" | é |
| meses inteiros | "ago – out 2026" (ou "nov 2025 – fev 2026") | é |
| ano inteiro | "2025" | é |
| um dia | "8 nov" (como hoje) | é |
| outro intervalo | "1 ago e 15 ago" (como hoje) | entre |

O `falado` (leitor de tela) segue a mesma ideia por extenso.

### Atalhos e compatibilidade

- `hoje` e `ultimos-90` são atalhos novos **do filtro**, não do `DatePicker`:
  uma lista própria do `FilterBar` = `DATE_RANGE_PRESETS` + esses dois. O
  `DatePicker` não muda.
- `este-mes` e `mes-passado` continuam válidos (URL antiga, `normalizar`,
  `filterPeriodRange`, rótulo); só não aparecem como botões. "Este mês" vale
  1º ao dia de hoje, como hoje; tocar o mês atual na grade dá o mês inteiro.
- "Um intervalo igual ao de um atalho é o atalho" continua valendo no Dias.

### Telefone

A gaveta já usada pelo editor. Abas esticadas, grade de meses com alvos de 44
(o `MonthGrid` já sobe no toque), anos em linhas de 44.

## Restrições

- `src/components/ui/` exige autorização: a escolha da opção C pelo dono é a
  autorização para mudar `filter-bar.tsx`, `date-picker.tsx` (`MonthGrid`) e,
  se preciso, `calendar.tsx`. Nada de componente novo em `ui/`.
- Componente alterado atualiza a página do catálogo (`/designsystem/date-picker`
  ganha o `MonthGrid` em intervalo; `/designsystem/filter-bar` mostra o período
  em abas) e o `<comp>-versions.test.ts` na mesma mudança.
- Token-first, Heroicons, `Tabs` como trilho, sem `isMobile` trocando árvore.
- Não é mudança de jornada (nenhuma rota, destino ou parâmetro de URL muda).
- Não rodar prettier. Banco de dev é produção: só leitura.

## O que fica para quem constrói

- O componente exato da lista de anos (do catálogo).
- A consulta dos totais: despesas do ano por mês, no padrão de
  `transacoes-filtradas.ts` (páginas de `range`, teto `LIMITE_DE_SOMA`),
  em cache do React Query por ano. Se o teto cortar, os totais não aparecem
  (nunca um total errado).
- O formato curto do dinheiro ("R$ 4,1 mil") pelos helpers de
  `lib/formatters.ts`; se não houver, um helper novo lá.
