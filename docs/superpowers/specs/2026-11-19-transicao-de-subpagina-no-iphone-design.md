# Transição de subpágina no iPhone — design curto

Data: 19/11/2026 · Tamanho: mudança pequena (2 arquivos + teste)

## Intenção

No PWA do iPhone, abrir uma tela da Você (Cartões, Preferências de notificação…)
deve parecer o push do iOS: a tela nova corre da direita sobre a Você, num
movimento que se acompanha com o olho. Hoje a pessoa vê o topo da Você e depois
um corte seco.

## O que o simulador mostrou (iPhone 17, Safari, 30 fps)

1. `telaPronta` desiste em 1,2s **mesmo com a rota ainda velha**. A foto "nova"
   sai da Você (já rolada ao topo pelo Next), o deslize anda Você → Você, e a
   tela de verdade chega segundos depois **sem animação**.
2. Quando o gesto roda, são 300ms em `--ease-out` (0,16/1/0,3/1), que faz quase
   todo o caminho no começo; o Safari perde os primeiros quadros montando o
   React, e sobram ~2 quadros visíveis.

## Abordagens

- **A — consertar a atual (escolhida pelo dono).** Mantém a regra de não mostrar
  esqueleto na troca.
- B — entrar na hora com o esqueleto da tela nova. Recusada: desfaz a decisão
  "sem esqueleto à vista".
- C — animar com `motion` na rota. Descartada: briga com o App Router e é a
  maior.

## Design

1. **A espera tem duas fases** (`transicao-de-subpagina.tsx`):
   - até a rota mudar (`location.pathname !== rotaDeAntes`), com teto de
     **4s** (o limite do Chrome para a promessa). Passou disso, a transição é
     pulada (`skipTransition()`): a tela troca sem gesto, mas nunca anima a
     Você sobre ela mesma;
   - depois da rota, o sossego de esqueleto que já existe, com o teto de
     **1,2s contado a partir da troca de rota**.
2. **O movimento do iOS** (`globals.css`, só as quatro regras do gesto):
   `--duration-spring` (500ms) em `--ease-emphasized` (0,32/0,72/0/1, a curva
   das folhas do vaul), no lugar de `--duration-slow` + `--ease-out`. Tokens
   existentes; nenhum token novo.
3. **A tela de baixo escurece um pouco** ao recuar (opacidade até 0,85 no
   `subpagina-esquerda`, e o inverso no `subpagina-vem-esquerda`), como o
   push do iOS.
4. Testes: `transicao-de-subpagina.test.ts` passa a cobrar as duas fases e o
   `skipTransition`, e a nova curva.

## Não-objetivos

- Animar o título e o voltar da barra do topo (fica para depois, se o dono
  quiser).
- Mudar o voltar do navegador (o gesto do Safari já anima).
- Pré-carregar à mão: o `Link` da Você já pré-carrega em produção.

## Fica com o construtor

- O valor exato da opacidade da tela de baixo (0,8–0,9), conferido no simulador.
- Em dev, a primeira abertura de uma rota compila por vários segundos e cai no
  `skipTransition`: conferir sempre na segunda abertura.
