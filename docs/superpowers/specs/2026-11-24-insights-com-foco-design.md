# Insights da categoria: cada um com o seu foco — design

**Data:** 24/11/2026 · **Tela:** `/categories/[id]`, o cartão de insights (`InsightsDaCategoria`) · **Mockup:** `docs/design/painel/insights-foco.html`. O dono escolheu a forma B e os 9 como estão.

## Por quê

Hoje os 9 insights têm a mesma forma: título, número, linha e um link no canto. Ficam dois problemas:
- quem pede para *fazer* algo esconde a ação num link discreto;
- quem quer *explicar* algo mostra só um número solto.

O dono quer que cada insight lidere pelo que importa nele: o dado ou a ação.

## Objetivos

- **Insight de dado** (3, 5 e 9): um mini visual do design system no corpo. A ação continua no canto (`CardAction`, `tertiary sm`).
- **Insight de ação** (1, 2, 4, 6, 7 e 8):
  - um botão `Button variant="secondary"` de largura toda, no pé, acima dos pontos;
  - o rótulo com verbo e objeto;
  - o canto do título fica vazio, ou mostra um número de apoio em `Caption`.
- **O que não muda:** a ordem, os textos dos títulos, as condições de cada insight e o carrossel (pílula e setas).

**Fora do escopo:**
- tipos novos de insight;
- dispensar insight;
- o Painel.

**Antimetas:**
- dois botões cheios no mesmo cartão;
- `primary` (a tela já tem o seu);
- arco-íris;
- markup solto: visual sem peça do design system.

## Abordagens

- **A · Link no canto para todos (hoje).** Descartada: esconde a ação.
- **B · Botão secundário no pé, nos de ação (escolhida).** O cartão cresce cerca de 40px. O carrossel já iguala a altura dos slides.
- **C · Botão compacto ao lado dos pontos.** Descartada: aperta o telefone e tira as setas.

## Os 9

| # | Insight | Foco | Corpo | Ação |
|---|---|---|---|---|
| 1 | Duplicado | ação | os dois lançamentos lado a lado, em duas caixinhas `bg-muted rounded-row`, cada uma com a descrição, "dd/mm · forma" em `text-xs` e o valor em `font-mono` | botão "Ver os dois na lista" (o `filtrar` de hoje) |
| 2 | A conferir | ação | as 2 primeiras linhas (`needs_review` do mês da categoria) com o dia, a descrição e o valor; com mais, a linha "e mais N". O total vai no canto, em `Caption` | botão "Conferir agora" (link de hoje) |
| 3 | Ritmo contra o limite | dado | o número "R$ X acima" (âmbar), o `Progress` com `value` = lançado, `projected` = previsto, `max` = limite (o excesso vira a pastilha do componente) e a linha "Fecha em R$ Y · limite R$ Z" | link no canto "Ajustar limite" |
| 4 | Gasto do ano que volta | ação | o `DateTile` (`size="md"`) com a data do ano passado, ao lado do valor e da linha "Foi o que você pagou em {mês/aa}"; sem data no payload, sem a folhinha | botão "Criar conta do {Termo}" (marca `seen` e abre `/bills?new=1`, como hoje) |
| 5 | Parcela que termina | dado | o número "+R$ X/mês" (verde), o `Progress segments={total} segmentShape="tile" size="lg"` com `value` = atual na cor da categoria (`fillColor`) e a linha "{nome} · {atual} de {total} · termina em {mês}" | link no canto "Ver na Previsão" |
| 6 | Gasto que se repete | ação | colunas dos meses dos lançamentos da recorrência (`lancamentosDaRecorrencia`, lido quando o slide monta), a última na cor da categoria, com o mês curto embaixo. O canto mostra "~R$ X" em `Caption`. Enquanto lê, um esqueleto do mesmo tamanho; sem dados, sem colunas | botão "Virar assinatura" ou "Virar conta a pagar" (o diálogo de hoje) |
| 7 | Assinatura mais cara | ação | o preço antigo riscado (`line-through text-muted-foreground`) e o novo, em `font-mono`; a linha "±R$ X por ano" no tom de aviso quando sobe e de sucesso quando cai | botão "Atualizar para R$ {para}" |
| 8 | Sugestão de limite | ação | o número "R$ X/mês", o `Progress` com `value` = lançado, `max` = sugerido e `fillColor` da categoria, e a linha "Este mês: R$ Y · pela média de 6 meses" | botão "Definir R$ X": o diálogo de limite abre já preenchido com X |
| 9 | Concentração | dado | o número "{p}%", o `ChartSplit labels="none"` com os 2 maiores (cor da categoria) e o resto (`--muted`), e a linha "{A} e {B} · resto R$ X" | link no canto "Ver os dois" |

- Os títulos são os de hoje.
- O número grande segue `font-mono font-semibold text-2xl`.
- O raio da escala: caixinha `rounded-row`, o `Progress` e o `DateTile` com o raio deles. Nada de `rounded-*` à mão fora da escala.

## Mudanças de dado

- **O tipo `InsightDaCategoria`** ganha:
  - `foco: "dado" | "acao"`;
  - `corpo`, uma união discriminada por insight, com só os dados que o desenho pede (ids e linhas do duplicado e do conferir, números do ritmo e do limite, `atual`/`total` da parcela, `dataYmd` do sazonal, `de`/`para`, as partes da concentração).
  - Para o duplicado e o conferir, a lib recebe os `txs` do mês, que a página já tem.
- **`dataYmd` no sazonal:** `detectarSazonais` passa a devolver `dataYmd`, a data do primeiro lançamento do mês anterior.
  - Isso pede um novo deploy da `insights-daily`, com o sim do dono na hora.
  - Payload antigo (sem `dataYmd`) desenha sem a folhinha.
- **Limite pré-preenchido:** o diálogo de limite aceita um valor inicial. Hoje o `openLimitDialog()` não recebe nada; passa a aceitar `valorInicial?: number`.

## Fica com quem constrói

- Os nomes dos campos de `corpo`.
- O componente de cada corpo, num arquivo próprio em `components/categories/detail/resumo/`, sem componente novo em `ui/`, salvo se uma peça faltar (aí com registry, página e teste).
- O `aria-label` dos visuais.
