# Seção Quem do detalhe do lançamento: no rodapé, com quem pagou no topo

Pedido do dono (18/11/2026). Ele escolheu a opção C2 do artefato "Seção Quem"
(https://claude.ai/artifact/BPfarJECuPNW1Aj7yNFYDR) e pediu também quem pagou no topo (o que a C3
fazia).

## Hoje

Abaixo dos cartões do detalhe, um `DescriptionList` solto lista Recorrência, Assinatura, Projeto e
Quem ("Renata pagou · Kauã Leandro lançou", de `linhaDeQuem`). No fim da folha, o `RodapeDaOrigem`
diz de onde veio ("Lançado pelo app · 17/11 às 14:02") e, se mudou, "Editado …".

## Como fica

- **O `DescriptionList` solto sai.**
- **Recorrência, Assinatura e Projeto viram etiquetas** na fileira do topo (os `Badge` de pagamento e
  categoria), depois da categoria:
  - recorrência: "↻ Todo mês", de `rotuloDaRecorrencia`, com o ícone de repetir;
  - assinatura: o nome dela, com o ícone de assinatura, levando à assinatura (o mesmo link de hoje);
  - projeto: "Projeto", com o ícone de pasta, levando ao projeto (o mesmo link de hoje).
  As que são link mantêm o destino e o alvo de toque de 44 no dedo.
- **Quem pagou no topo**, na linha da data: "Ontem · ter, 17 de nov · pago por [foto]" (pedido do dono, 18/11: só a foto, sem o nome à vista; o nome fica no nome acessível "Pago por Renata" e numa dica). Só em
  despesa, numa carteira com duas pessoas ou mais (a mesma condição de hoje para `pagou`). No telefone
  a linha quebra se não couber.
- **Quem lançou no rodapé de origem:** o rodapé troca "Lançado pelo app" por "[foto] Kauã lançou pelo
  app · 17/11 às 14:02". O "Editado …" continua embaixo. Numa carteira de uma pessoa, ou sem autor
  conhecido, o rodapé fica como hoje.
- **Sem repetição:** quem pagou não aparece no rodapé, e quem lançou não aparece no topo, mesmo
  quando é a mesma pessoa ("pago por Kauã" em cima, "Kauã lançou pelo app" embaixo).
- **A foto** é a do membro, ou as iniciais no tom de `identityToneFor`, no degrau `xs`, como o
  `QuemLancou` da lista de Transações (`transacoes-tabela.tsx`).
- **Computador:** o painel lateral é a mesma folha, e vale o mesmo.

## Abordagens

1. **Escolhida:** as pessoas no rodapé de origem que já existe, e quem pagou junto da data. A folha
   termina num ponto só, e o que decide o acerto (quem pagou) fica perto do valor.
2. Um cartão "Detalhes" (opção A). Recusada pelo dono.
3. Uma linha solta antes dos Anexos (C1). Recusada: repetia "lançou" com o rodapé.

## Restrições

- Só peças do design system: `Badge`, `Avatar`/`AvatarFallback`, `Caption`. Nada novo em `ui/`.
- `linhaDeQuem` deixa de ser usada no detalhe. Se nada mais a usar, sai junto com o teste dela.
- O destino dos links de Assinatura e Projeto não muda, então não é mudança de jornada.
