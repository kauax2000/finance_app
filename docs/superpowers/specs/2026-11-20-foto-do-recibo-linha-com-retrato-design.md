# Foto do recibo: linha com retrato — design

Data: 20/11/2026 · Pedido do dono · Tamanho: mudança pequena

## Por quê

No painel de revisão do lançamento inteligente, a foto do recibo aparece num
`Avatar` redondo com o título "Recibo" e um ×. O círculo corta um recibo em pé,
"Recibo" não diz nada, a foto não abre grande, e o × da foto fica logo abaixo do
× do painel — dá para confundir os dois.

## Objetivo

A linha da foto mostra o recibo em pé, diz o que é e que dá para ver, abre a foto
grande no toque e troca o × por ações com nome.

Fora: mexer na leitura da IA, no anexo depois de salvar, ou no lugar da linha no
painel (continua logo abaixo do valor).

## Abordagens

- **A · Linha com retrato** (escolhida pelo dono): miniatura em pé, "Foto do
  recibo · Toque para ver", "Trocar" e lixeira.
- B · Faixa no topo: recibo largo no alto. Recusada: ocupa ~120px.
- C · Ao lado do valor: miniatura no lugar do "IA". Recusada pelo dono.

## Desenho

`MiniaturaDoRecibo`, em `src/components/transactions/lancamento-inteligente.tsx`:

- `Item size="sm" interactive` (realce com o raio da linha, 12px, passando 10px para fora com `-mx-2.5 w-auto`):
  - **Mídia:** `ItemMedia variant="image"` com a foto em pé, `h-14 w-11`,
    `rounded-row`, `object-cover` alinhado ao topo (onde fica o nome da loja).
    *Minha decisão:* classe local sobre a variante que existe, sem componente
    nem variante nova no DS.
  - **Texto:** `ItemTitle` "Foto do recibo" e `ItemDescription` "Toque para ver".
    O alvo é um `ItemLink` (a linha inteira toca), `aria-label` "Ver a foto do recibo".
  - **Ações:** `Button variant="tertiary" size="md"` "Trocar" (sem fundo, 44px no dedo; abre a câmera,
    o mesmo `arquivoRef` da pílula) e `Button variant="tertiary" size="icon-md"`
    com `TrashIcon`, `aria-label` "Tirar a foto" (o `leitura.tirarFoto` de hoje).
    As duas desabilitam com `saving`.
- **Ver grande:** um `Dialog surface="auto"` (`size="xl"`) aberto pela linha,
  título "Foto do recibo", a foto inteira (`object-contain`), só com o × para
  fechar. Mesma forma do `VisualizadorDeAnexo`, mas lendo a URL local do
  `File` (o anexo ainda não existe).
- **Trocar** com a câmera cancelada não fecha nada: o `cancel` já não age com a
  revisão aberta (`placa`).

## Fica com quem constrói

Nome interno do diálogo, o teste de fonte que tranca a linha nova, e passar o
`arquivoRef` (ou um `onTrocar`) até a `Revisao`.
