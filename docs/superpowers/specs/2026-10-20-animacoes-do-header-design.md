# Animações do cabeçalho do telefone: a troca de tela e a busca sem filtro

Data: 2026-10-20. Saiu de uma conversa com o dono e de dois protótipos
comparados lado a lado (escolhidos: **B** na troca de tela, **C** na busca sem
filtro). Os protótipos são HTML com SVG e um filtro "goo"; a implementação não
usa o filtro (ver Restrições).

## Intenção

O cabeçalho do telefone muda de botões quando a pessoa troca de tela, e hoje a
troca é seca: o sino some e o voltar aparece no mesmo quadro, e a lupa ganha ou
perde o filtro colado de uma vez. A busca com filtro já abre num gesto
orgânico (a cápsula `[lupa | filtro]` se divide em duas bolhas), mas a busca
sem filtro não tem a mesma vida. O dono quer as duas coisas com o movimento
orgânico da abertura do `Command`, inspirado no iOS 26 (o vidro que se comporta
como gota).

O sucesso é: trocar de tela no telefone e ver o vidro reagir como líquido; abrir
a busca numa tela só com a lupa e ver o círculo virar o campo e o × pingar dele.

## Metas

1. **Troca de tela (B, "Líquido").** No telefone, quando a tela nova muda os
   botões do cabeçalho:
   - **Sino ↔ voltar** (a ponta esquerda, `TopBarStart phone`): o círculo de
     vidro é o mesmo e não some. Ele afunda e volta na mola (escala
     `1 − 0,14·sen(π·p)`, só quando o ícone muda) enquanto o ícone de antes sai
     no desfoque (opacidade 1→0, escala 1→0,7, desfoque 0→4px, em p 0–0,55) e
     o novo entra do desfoque (opacidade 0→1, escala 0,7→1, desfoque 4→0px, em
     p 0,2–0,8).
   - **Lupa → `[lupa | filtro]`** (a ponta direita, `TopBarActions phone`): o
     filtro pinga do flanco direito da lupa. A lupa corre de x 315 a 271 (44px
     para a esquerda); a gota do filtro nasce dentro da lupa com 30% do raio e
     cresce até o raio inteiro enquanto o centro dela vai do flanco da lupa até
     x 337; a cintura entre os dois se enche (de 0 à altura inteira, em g
     0,55–1) até virar a cápsula. O ícone do filtro acende do desfoque em g
     0,4–0,95.
   - **`[lupa | filtro]` → lupa:** o mesmo ao contrário — a cintura afina, a
     gota encolhe e é reabsorvida pela lupa, que volta ao lugar.
   - **Entre duas telas com filtro** (calendário ↔ ajustes): a cápsula não se
     mexe; o ícone do filtro troca no lugar, como o do sino ↔ voltar (sem o
     afundar). O ponto de "filtro ativo" segue o ícone.
   - A mola é a `MOLA` da casa (300/25).
2. **Busca sem filtro (C, "A lupa vira o campo, o × pinga dela").** Ao abrir a
   paleta numa tela em que a lupa está sozinha (sem `closeOrigin` colado):
   - O círculo inteiro da lupa se estica e vira o campo: a borda esquerda vai de
     x 315 a 16 (em p 0–0,7; o passe vem só da mola), a direita de 359 a 307
     (em p 0,15–0,75). O ícone da lupa anda com a borda esquerda (centro em
     `esquerda + 22`) e se troca pela lupa da pílula em p 0,5–0,8.
   - O × nasce como uma gota da ponta direita do campo: começa com 35% do raio,
     colado por dentro da ponta (centro em `direita − 22`), e em p 0,45–1 cresce
     até o raio inteiro e desliza até x 337, separando-se do campo por uma
     cintura que afina (o vão final de 8px). O X acende do desfoque em p
     0,7–1. Com o passe da mola, o × pode ir até ~1px além e voltar.
   - O conteúdo do campo (placeholder, feixe) acende em p 0,55–0,85; o véu e a
     placa seguem como hoje (a placa brota quando o vão abre).
   - A mola de abrir é a `SEPARACAO` (180/22), como na busca com filtro; fechar
     é o mesmo filme ao contrário na `VOLTA_DA_PILULA` (260ms), de onde o gesto
     estiver.
   - A busca **com** filtro colado não muda.

## Não-metas

- O desktop (`md` para cima). Lá os botões do cabeçalho não mudam entre telas.
- O título do meio (a carteira) e o `inset` dele.
- A barra de baixo, as transições de página e o `PageHeader`.
- Mudar destino de botão, rota ou parâmetro. Nada aqui é mudança de jornada:
  `docs/JORNADAS.md` e o Atlas não mudam.

## Anti-metas (falhou mesmo que funcione)

- Um fade ou uma escala simples no lugar da gota (memória do dono: animação
  orgânica sempre a partir do `menu-morph`/`unmorph` e da viagem líquida).
- O vidro piscar, perder o borrão ou o anel aparecer em fatias durante o
  gesto.
- O cabeçalho pular de altura ou de posição, ou o título do meio se mexer.
- Um botão inacessível ou com nome errado durante a troca (o sino e o voltar
  são botões/links diferentes, com nomes diferentes).
- Animar no primeiro carregamento da página (a casca nasce já no estado
  certo; só a troca anima).

## Restrições

- **O vidro tem `backdrop-filter`.** Nenhum `transform`, `filter` ou
  `clip-path` num ancestral dos vidros, senão o borrão se desliga (ver o
  `AGENTS.md`, "O movimento do que se sobrepõe" e a seção do `Command`). O
  filtro "goo" dos protótipos não serve; a forma da gota se faz como a busca
  com filtro já faz: `clip-path` com raios por canto e `transform` escritos
  nos próprios vidros e nos filhos deles, por um progresso só e uma função
  pura de quadro (o modelo é `quadroDasBolhas` + `desenharBolhas` em
  `src/components/ui/command.tsx`). No fim do gesto, nada inline.
- **Movimento reduzido** (`useReducedMotion`): a troca de tela é na hora; a
  busca sem filtro faz o que faz hoje com movimento reduzido (só esmaece).
- **Interrupção:** trocar de tela no meio de um gesto segue da posição atual
  até o novo destino, sem pular (como o `progresso` do `CommandDialog`).
- **O primeiro quadro não anima:** montar a casca (recarregar, entrar no app)
  desenha o estado da tela direto.
- **O design system é a regra.** O movimento mora em `src/components/ui/`
  (`top-bar.tsx`, `command.tsx`), e a tela (`app-header.tsx`) só consome.
  Mudanças em `ui/` pedem o ok do dono: este pedido é o ok para o que está
  descrito aqui; qualquer prop ou componente novo fora disto volta a ele.
- Na mesma mudança: a página do catálogo de quem muda
  (`src/app/designsystem/docs/command.tsx` e a do `TopBar`), a descrição no
  `AGENTS.md` (a frase "sem filtro colado, a lupa vira o × e a pílula brota do
  flanco dela" e a do `TopBarActionGroup`), os testes de versão
  (`command-versions.test.ts`, que hoje tranca o caso `sozinha`, e o do
  `TopBar`) e a rodada no `docs/design/HISTORICO-DESIGN-SYSTEM.md`.
- Verificação: `npx tsc --noEmit && npm run lint && npm run test:unit`, e
  conferir na prévia a 375px (memória: simulador só se algo só o iOS
  reproduz). O dev server já roda em :3000 fora da sessão (`dev-attach`). O
  banco do dev é o de produção: não gravar dados.

## O que o dono decidiu

- B na troca de tela e C na busca sem filtro, com as curvas e fases dos
  protótipos (os números acima). Os protótipos estão em
  [`2026-10-20-animacoes-do-header/`](2026-10-20-animacoes-do-header/)
  (fragmentos do companheiro visual do brainstorming: a função `quadro` de C
  em `prototipo-busca-sem-filtro.html` e a `formas` de B em
  `prototipo-troca-de-tela.html` são a referência das fases).
- Movimento só no telefone; troca na hora com movimento reduzido; interromper
  segue de onde está.
- O movimento mora no design system.
- **Os dois lados do cabeçalho se mexem juntos, no toque.** Hoje o filtro só
  chega quando a página monta (`usePageChromeFilter`, num `useLayoutEffect`,
  depois do esqueleto do `AdiarMontagem`, até ~700ms), e some (`null`) no
  intervalo. Por decisão do dono, **cada rota declara de antemão se tem
  filtro e qual o ícone** (`month` ou `filter`), numa tabela por `pathname`
  na configuração de navegação (ao lado de `getVoceGroups`/`voceBackHref`, em
  `src/config/mobile-navigation.ts`, ou onde quem constrói achar melhor na
  `src/config/`). O cabeçalho desenha a forma (lupa sozinha ou cápsula, e o
  ícone) pela declaração no momento em que o `pathname` muda; a publicação da
  página, quando chega, só preenche o resto (nome, ponto de ativo,
  `onOpen`/`popover`, `disabled`). Até ela chegar o botão do filtro existe
  com o ícone declarado e não faz nada ao toque (`disabled` ou sem ação).
  Hoje publicam filtro: `/dashboard` e `/categories` e `/categories/[id]`
  (mês, `useMonthInHeader`), `/transactions` (`TransactionsToolbar`) e
  `/bills` (`BillsToolbar`); quem constrói confere a lista no código.
  Entre Painel e Transações, então, a cápsula fica e só o ícone troca.

## Decisões de quem escreveu (confira)

- **Se a página publicar algo diferente do que a rota declarou** (um
  `enabled=false`, um filtro que só existe numa aba), vence a publicação, e a
  correção anima com o mesmo gesto. Um teste tranca que a tabela e as telas
  que chamam `usePageChromeFilter` concordam, para isso ser exceção.
- **O primeiro quadro:** o estado que a casca desenha ao montar (recarregar,
  entrar no app) não anima, e a primeira publicação da primeira tela também
  não. Só mudanças depois disso animam.
- **O voltar também se decide pela rota** (`defaultMobileBackHref`, que já é
  por `pathname`). O detalhe do cartão publica `backHref` só depois de
  carregar o cartão; quem constrói faz a rota dele declarar o voltar, para o
  sino não virar voltar no meio do carregamento. Se isso não couber, a troca
  tardia anima, e é aceitável.
- **As fases que faltavam no B** (do protótipo): a lupa corre de 315 a 271
  linear no progresso da cápsula `g` (com o passe da mola até 1,05); a gota
  do filtro cresce de 30% ao raio inteiro em `suave(g, 0, 0,7)`, e o centro
  dela anda do flanco da lupa (`lupaX + 24`) até 337 em `suave(g, 0, 0,8)`.
  `suave` é o smoothstep da `command.tsx`.

## O que fica para quem constrói

- Como a ponta esquerda mantém **um vidro só** entre dois botões diferentes
  (o `NotificationBellButton` é um `TopBarAction` e o `PageHeaderBack` é um
  `Link`): uma peça do `TopBar` que segura o círculo e troca o conteúdo por
  `key`, ou o voltar e o sino passando a vestir a mesma peça. Qualquer que
  seja, é o vidro que fica e o miolo que troca, e a tela não escreve o gesto.
- Como a cápsula da direita sabe que um filho entrou ou saiu (o
  `TopBarActionGroup` com um filho que aparece e some, ou uma peça nova que
  recebe a lupa e o filtro opcional).
- Os nomes, os `data-slot` e a forma da função de quadro, contanto que seja
  pura e testada como a `quadroDasBolhas`.
- O ref do filtro (`filtroRef`) continua sendo a origem do × quando o filtro
  existe; quem constrói garante que a busca com filtro ainda abre dele no meio
  de uma troca de tela.
