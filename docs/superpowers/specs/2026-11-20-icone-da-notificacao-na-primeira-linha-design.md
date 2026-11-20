# Ícone da notificação na 1ª linha do título — design

Data: 20/11/2026 · Pedido do dono · Tamanho: mudança pequena

## Por quê

Na linha de notificação (`src/components/layout/notification-row.tsx`) o ladrilho de 32
fica preso no topo e o título centraliza numa fileira mais alta (a da hora, do ponto e
do ⋯). Medido: com título de uma linha o centro do ícone fica 4px acima do título; com
duas linhas, 6px abaixo do centro da 1ª linha, entre as duas. O dono se incomoda,
sobretudo com o título de uma linha.

## Abordagens

- **A · Na 1ª linha do título** (escolhida): o ícone e a 1ª linha do título dividem o
  centro, com 1 ou 2 linhas. Padrão do iOS (Central de Notificações, Mail) e das listas
  de várias linhas do Material.
- B · No meio do texto todo: com descrição longa o ícone desce para o meio do parágrafo.
- C · No meio do título: com 2 linhas o ícone fica entre elas.

## Desenho

Só em `notification-row.tsx`, nada em `src/components/ui/`:

- A fileira do título mede o ladrilho (32, `min-h-8`) e alinha pelo topo
  (`items-start`); o título ganha recuo de cima de `(32 − 1 linha) / 2`, para a 1ª linha
  centrar nos 16 do ícone; as linhas seguintes descem dali.
- A hora, o ponto e o ⋯ (e o ✓ e o excluir no cursor) ficam centrados na altura do
  ícone (32).
- O `ItemMedia variant="tile"` desce 2px quando a linha tem descrição
  (`group-has-data-[slot=item-description]/item:translate-y-0.5`, do `Item`); nesta linha
  o deslocamento sai, para o ícone e a fileira do título começarem no mesmo topo.

Pronto quando: a 375px e no desktop, centro do ícone = centro da 1ª linha do título
(±1px), com título de 1 e de 2 linhas.
