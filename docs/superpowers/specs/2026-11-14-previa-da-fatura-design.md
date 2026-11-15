# A prévia da fatura fechada e anterior — design

**Pedido (14/11/2026):** melhorar o design, o layout e a usabilidade da prévia
(o `HoverCard`) que abre no chip "Fechada" e "Anterior" da lista de
transações. O dono escolheu, entre as versões do artefato
(https://claude.ai/artifact/NKsq65RzNGRBc5kYaUmwjy), a **F3**.

**Por quê:** hoje a prévia repete o status (no chip e no selo do cabeçalho),
encadeia três travessões na nota, mostra datas soltas sem dizer "quando" e o
"Ver cartão" abre o ciclo de hoje, não a fatura da compra.

## Abordagens consideradas

- F1 (limpa), F2 (linha do tempo), F3 (F1 + link para a fatura), F4 (a
  folhinha `DateTile`), F5 (aviso), F6 (total da fatura, pede consulta nova),
  F7 (botão "Marcar como paga", grava do hover), F8 (uma frase).
- Escolhida: **F3**. Custa uma mudança de jornada (um parâmetro novo na página
  do cartão), e é ela que conserta o link que leva ao lugar errado.

## A prévia

- **Cabeçalho:** o cartão (nome) e o mês da fatura. Sem o selo de status
  repetido.
- **Linha de status:** um ponto na cor do tom do chip + a frase do estado
  ("Fechada, não paga", "Vencida, não paga", "Paga"…), a partir do `tone` e do
  `note` que `creditCardInvoiceBadgeForRow` já calcula. Nada de travessões
  encadeados.
- **Datas:** `DescriptionList` com **Fechou** e **Vence/Venceu** (o verbo pelo
  passado ou futuro), cada uma com o relativo ("há 4 dias", "em 3 dias",
  "hoje"). O relativo do vencimento vai em `warning` quando faltam ≤ 3 dias
  sem pagamento e em `destructive` quando venceu sem pagamento; o resto,
  neutro.
- **Rodapé:** `HoverCardLink` "Ver fatura de <mês>" → a página do cartão
  aberta **naquele ciclo**.
- Slots: vale para `last_closed` e `earlier`. A "Aberta" não muda.

## A mudança de jornada

- `/credit-cards/[cardId]?fatura=YYYY-MM-DD` (a data de fechamento): a página
  calcula o `cycleOffset` desse fechamento e abre nele, presa em
  `cycleOffsetBoundsForCard`. Data inválida ou fora do intervalo: o ciclo de
  hoje, como agora. Trocar de ciclo na página não reescreve a URL.
- Atualizar `docs/JORNADAS.md` (seção 6, a ponte G5b/lista → detalhe do
  cartão), `docs/atlas/template.html`, rodar `python3 docs/atlas/build.py` e
  republicar o Atlas.

## Restrições

- Só componentes e tokens existentes; nada novo em `ui/` nem em `globals.css`.
- Datas pelos helpers de `src/lib/transaction-date.ts`.
- Nenhuma gravação no banco.
- `bloco-fatura.tsx` (o detalhe) também usa o badge: a mudança de texto não
  pode quebrá-lo.

## Fica para quem constrói

- O nome do mês no link segue o que o seletor de ciclo da página do cartão
  mostra para aquele fechamento, para o link e a tela dizerem o mesmo mês.
- Se o relativo vem de `formatRelativeDayPtBr` ou de um helper novo em
  `lib/` (testado).
