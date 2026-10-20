# Abertura e fechamento do Dialog e da busca no desktop

Data: 2026-10-20. Saiu de uma conversa com o dono e de um protótipo com cinco
versões do `Dialog` e quatro da busca, comparadas lado a lado
([`2026-10-20-dialogos/prototipo-dialogos.html`](2026-10-20-dialogos/prototipo-dialogos.html):
a variante **`d-b`** do `Dialog` e a **`b-a`** da busca são as escolhidas; o
protótipo é referência visual, em SVG/DOM simples, não código).

## Intenção

Trazer para os dois modais do desktop o mesmo estilo de movimento desta
sessão: formas que crescem como vidro (o gesto dos menus do app, a cápsula do
cabeçalho que estica com balanço), inspiradas no iOS 26, no lugar do
"esmaece e cresce de 95%" de hoje.

## Metas

1. **`Dialog` no desktop (B, "brota como os menus").** Abre com o gesto
   `menu-morph` do app, com a origem no **centro** do diálogo: nasce pequeno
   (20%, quase elipse), cresce primeiro na altura, passa do tamanho e volta; o
   raio chega ao `--radius-modal` (`--morph-radius`). O conteúdo (cabeçalho,
   linhas do corpo, rodapé) continua chegando do desfoque pela `dialog-reveal`
   que já existe, depois que a forma chega (o atraso da cascata pode crescer
   para casar com o morph: é de quem constrói, medindo). Fecha com o
   `menu-unmorph` (o mesmo gesto ao contrário, curto), também do centro.
   - O **`AlertDialog`** veste o mesmo gesto (ele já mede pela régua do
     `Dialog` e veste a cromagem dele) — decisão de quem escreveu, ver abaixo.
   - **Isso desfaz a decisão das rodadas 291 e 293** ("o que é modal e
     centrado não brota"); o dono escolheu agora. O `AGENTS.md` e
     `overlay-motion.test.ts` dizem e trancam o contrário hoje: mudam juntos.
2. **Busca no desktop (A, "a lupa estica").** No `CommandDialog` fora do
   telefone:
   - A **pílula** (`search-input`) nasce como o círculo da lupa (a altura
     dela, 36–44, de largura), centrada no lugar dela, e **estica na
     horizontal** até a largura toda, na mola `BALANCO` (`src/lib/spring.ts`,
     300/19: passa ~12,7% e volta). O texto e os controles de dentro dela
     (placeholder, lupa, tecla) acendem quando ela está quase aberta (no
     protótipo, de 0,45 a 0,8 do progresso). O feixe da pílula (`command-beam`)
     segue funcionando.
   - A **placa** (`command-dialog-panel`) brota da pílula para baixo com o
     `menu-morph` de origem no topo, começando quando a pílula já esticou um
     pouco (no protótipo, a partir de 0,3 do progresso).
   - As **cápsulas da legenda** (`command-dock-item`) aparecem por último, uma
     a uma (no protótipo, de 0,55 com 0,08 de passo), crescendo de 60%.
   - Fechar é o mesmo filme ao contrário, curto (o protótipo usa 240ms de
     `--ease-out`; a casca segura o fechamento pelo `presence-hold`, que já
     existe).
3. **Em comum.** Com movimento reduzido, só esmaece (como hoje). Fechar no
   meio da abertura segue de onde está. Nenhum `transform`, `filter`,
   `opacity` animado ou `clip-path` num **ancestral** de um vidro: cada vidro
   anima a si mesmo (a regra já escrita no `CommandDialog`). Nada inline no fim.

## Não-metas

- O telefone: o `Dialog` lá é a gaveta (`surface="auto"`), e a busca segue as
  bolhas (rodadas 349–351). Nada muda abaixo de 768px.
- `Sheet`, `Drawer`, `Popover` e os menus.
- A altura que anda na mola (`useAlturaAnimada`) ao trocar o conteúdo.

## Anti-metas

- A busca perder o borrão dos vidros durante o gesto (a pílula, a placa e as
  cápsulas são vidros irmãos; animar a coluna em volta deles desliga o
  `backdrop-filter`).
- O arco-íris do feixe sumir na abertura (já aconteceu na rodada 323: um
  `animate-in` na pílula apagava o feixe; a entrada da pílula mora na primeira
  animação da lista do feixe, `--command-beam-intro`).
- O diálogo nascer do ponto do clique (rodada 293: aberto pela barra lateral,
  ele surgia da esquerda). A origem é o centro.
- Animar no primeiro render sem abrir, ou deixar estilos inline depois.

## Restrições

- O `Dialog` usa `-translate-x-1/2 -translate-y-1/2` (a propriedade
  `translate` do Tailwind v4) para centrar; os keyframes do morph animam
  `transform`, e os dois convivem — não troque o centramento por `transform`.
- `src/components/ui/`, `src/app/globals.css` e `src/app/designsystem/` pedem
  confirmação do harness; o dono autorizou esta mudança.
- Tokens e utilities existentes primeiro (`menu-morph`, `menu-unmorph`,
  `--morph-radius`, `BALANCO`, `--duration-*`); um keyframe ou utility novo,
  se preciso, no `globals.css` no padrão dos vizinhos (fora da faixa que o
  `glass.test.ts` reserva).
- Na mesma mudança: `AGENTS.md` (as seções do `Dialog`, do `Command` e "O
  movimento do que se sobrepõe"), `overlay-motion.test.ts` e os testes de
  versão do `Dialog`, do `AlertDialog` e do `Command`, as páginas do catálogo
  que descrevem a entrada, e uma rodada no `HISTORICO-DESIGN-SYSTEM.md`.
- Verificação: `npx tsc --noEmit && npm run lint && npm run test:unit`; prévia
  no desktop pelo `dev-attach` (o `next dev` já roda em :3000), abrindo um
  diálogo do catálogo (`/designsystem/dialog`, `/designsystem/alert-dialog`) e
  a paleta (⌘K). O banco é o de produção: não gravar nada.

## O que o dono decidiu

- B no `Dialog`, A na busca, só no desktop.
- Fechar é o mesmo gesto ao contrário, curto; movimento reduzido só esmaece;
  fechar no meio segue de onde está.

## Decisões de quem escreveu (confira)

- O `AlertDialog` veste o gesto do `Dialog` (mesma régua e cromagem).
- O `Dialog` usa os keyframes `menu-morph`/`menu-unmorph` de CSS, como os
  menus (380ms/210ms), e não uma mola em JS: o gesto é exatamente o dos menus.
  A busca, que estica uma largura, anda em JS na `BALANCO`, como a cápsula do
  cabeçalho.

- **"Desktop" é `md:` para cima, pela classe**, e não pelo `useIsMobile`: o
  `AlertDialog` e os `Dialog` sem `surface="auto"` são placas centradas também
  no telefone, e lá ficam como hoje (o dono falou do desktop). As classes do
  morph vão com `md:` (e as de hoje com `max-md:`), nos dois sentidos.
- **Fechar no meio da abertura, no `Dialog`, é o comportamento dos menus**: o
  `menu-unmorph` parte do tamanho cheio (um salto curto, o mesmo dos menus
  hoje). O "segue de onde está" vale para a busca, que anda em JS. Se o salto
  incomodar no aparelho, o caminho é um controle em JS que lê o quadro atual.
- **O conteúdo só acende com a forma quase cheia**, como no protótipo (a
  cascata começa na metade do morph, ~190ms, com passo de ~25ms): texto e
  campos não aparecem achatados. Vale também para o `layout="fixed"` e o
  `size="full"`. O `useAlturaAnimada` lê `offsetHeight`, que ignora
  `transform`: não muda.
- **Movimento reduzido na busca** é o caminho de hoje: só esmaece, sem esticar
  a pílula nem brotar a placa.
- O véu segue como está.

## O que fica para quem constrói

- Como a pílula estica sem mexer no layout do `cmdk`: recorte (`clip-path`)
  no próprio vidro, centrado, com o conteúdo de dentro acendendo depois, ou
  outra técnica que respeite os vidros.
- Se a placa usa o `menu-morph` de CSS (pausado até a pílula esticar, como o
  telefone já faz) ou acompanha o progresso da pílula em JS.
- O atraso exato da cascata do conteúdo do diálogo, medido contra o morph.
