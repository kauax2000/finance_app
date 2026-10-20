# O app recua: a abertura do Dialog e da busca no desktop

Data: 2026-10-20. Terceira rodada sobre o mesmo pedido. O dono recusou o gesto
dos menus com balanço ("infantil e bobo", spec
[`2026-10-20-dialogos-design.md`](2026-10-20-dialogos-design.md), revertido em
`2a48222`) e cinco versões contidas de esmaecer, escala, desfoque e subida
(laboratório `/laboratorio/dialogos`). Num protótipo com seis versões
inspiradas em Raycast, Spotlight, Arc, Linear, iOS 26 e macOS, escolheu a
**6, "O app recua"**: a tela de trás dá um passo para trás e o modal chega
na frente quase parado. Protótipo:
[`2026-10-20-app-recua/prototipo-aberturas.html`](2026-10-20-app-recua/prototipo-aberturas.html),
variante `fundo` (referência visual, em DOM simples).

## Intenção

Dar profundidade em vez de enfeite: quem se move de verdade é o app, recuando,
e o modal aparece calmo na frente. Movimento de sistema operacional, adulto,
que combina com o resto do app.

## Metas (só do `md`, 768px, para cima)

1. **O app recua** enquanto um `Dialog`, um `AlertDialog` ou a paleta de busca
   (`CommandDialog`) está aberto: a barra lateral (`[data-slot=sidebar-container]`,
   que é `fixed`) e a área do conteúdo (`[data-slot=sidebar-inset]`, com o
   cabeçalho dentro) encolhem a **98,5%** em direção ao **centro da tela
   visível**, em **300ms** na `--ease-out` (`cubic-bezier(0.16, 1, 0.3, 1)`).
   Ao fechar, voltam a 100% em **200ms**. O escurecimento continua sendo o véu
   de hoje (`overlayClassName`); o recuo só acrescenta a escala.
2. **`Dialog` e `AlertDialog`** chegam na frente quase parados: opacidade 0→1,
   **subindo 6px** e de **99% a 100%**, em **220ms** na `--ease-out`, com
   **30ms** de atraso. Fecham só esmaecendo, em **120ms**. **O conteúdo chega
   junto com o vidro**: no desktop, sem a cascata `dialog-reveal`.
3. **A busca** (`CommandDialog` fora do telefone): a pílula, a placa e as
   cápsulas da legenda sobem **6px** esmaecendo, em **220ms** na `--ease-out`,
   com atrasos de **30ms** (pílula), **60ms** (placa) e **90 + 20·i ms** (cada
   cápsula). Fecham esmaecendo em **120ms**. O app recua como no diálogo.
4. **Movimento reduzido**: sem recuo e sem subida; só esmaece.
5. **Dois modais empilhados** (uma confirmação aberta de dentro de um
   diálogo): o app fica recuado até o último fechar, sem recuar duas vezes.

## Não-metas

- O telefone (abaixo do `md`): o `Dialog` é a gaveta e a busca são as bolhas
  das rodadas 349–351. Nada muda lá.
- `Sheet`, `Drawer`, `Popover`, menus: não recuam o app.
- A altura que anda na mola (`useAlturaAnimada`) segue como está.

## Anti-metas

- Nada pula de lugar com a página rolada: um `transform` num ancestral
  transforma o `position: fixed` dos descendentes; quem tiver filho `fixed`
  dentro do que recua tem de ser tratado (a barra lateral é `fixed` e recua por
  conta própria; o conteúdo pode ter filhos `fixed` — o `Toaster`, a
  `AnnouncementBar fixed`, o que mais houver).
- O véu e o modal não podem recuar junto (eles moram em portais fora do
  `sidebar-inset`; confira).
- O feixe da pílula não pode apagar (a entrada dela mora na primeira animação
  da lista do `command-beam`, `--command-beam-intro`, rodada 323).
- Animar ao montar sem abrir; deixar estilo inline ou atributo no `<html>`
  depois de fechar.

## Restrições

- `transform` num ancestral desliga o `backdrop-filter` dos filhos enquanto
  dura: o cabeçalho (`TopBar surface="edge"`) perde o borrão das camadas com o
  app recuado. Sob o véu isso não se lê; confira que volta ao fechar.
- A barra lateral é `fixed`: o recuo dela é um `transform` nela mesma, com a
  origem no centro da tela; o conteúdo segue a rolagem da janela: a origem
  dele é o centro da tela visível em coordenadas dele (rolagem incluída).
- `src/components/ui/`, `src/app/globals.css`, `src/app/designsystem/` pedem
  confirmação do harness; o dono autorizou.
- Na mesma mudança: `AGENTS.md` (o bullet do `Dialog`, o do `Command` e "O
  movimento do que se sobrepõe"), `overlay-motion.test.ts` e os testes de
  versão do `Dialog`, do `AlertDialog` e do `Command`, as páginas do catálogo
  que descrevem a entrada, e uma rodada no histórico.
- O laboratório `/laboratorio/dialogos` (as versões recusadas) sai na mesma
  mudança.
- Verificação: `npx tsc --noEmit && npm run lint && npm run test:unit`; prévia
  no desktop (`dev-attach`, ≥ 1024px de largura), com a página rolada, abrindo
  um diálogo, um `AlertDialog` de dentro dele, e a busca por ⌘K. O banco é o de
  produção: não gravar nada.

## O que o dono decidiu

- A versão 6 do protótipo, para o diálogo e para a busca, só no desktop.

## Decisões de quem escreveu (confira)

- O conteúdo do diálogo chega junto com o vidro, sem a cascata, como no
  protótipo (hoje a `dialog-reveal` acende cabeçalho, corpo e rodapé em
  degraus).
- O escurecimento é o véu de hoje; o protótipo escurecia a própria tela
  (`brightness`), mas um `filter` no app desligaria o borrão de tudo dentro dele
  e o véu já faz esse papel.
- Dois modais empilhados recuam o app uma vez só.
- O recuo vale também no catálogo (`/designsystem`), que usa a mesma
  `Sidebar`; páginas sem a casca (o laboratório, as telas de acesso) não
  recuam nada.

- **Abaixo do `md` fica a entrada de hoje** também nos modais que continuam
  centrados lá (`AlertDialog`, a confirmação "Descartar alterações?", um
  `Dialog` sem `surface="auto"`): a mola com `zoom-in-95` e a cascata
  `dialog-reveal` passam a valer só em `max-md:`, e a entrada nova e o recuo
  em `md:` — a regra é de mídia (CSS), não de `useIsMobile`. A `dialog-reveal`
  e o `useRevelacao` ficam, servindo ao telefone.
- **A confirmação "Descartar alterações?"** (`ConfirmarDescarte`, no
  `dialog.tsx`) conta como modal empilhado: segura o recuo e veste a entrada
  nova, como o `AlertDialog`.
- **Filhos `fixed` dentro do conteúdo que recua**: hoje, no desktop, não há
  (o `Toaster` e o `OfflineBanner` moram fora do `sidebar-inset`; a `TopBar` e
  a `BottomBar` `fixed` são do telefone). Quem constrói confere a lista; se
  aparecer algum no desktop, ele sai do que recua. A prova é a página rolada.

## O que fica para quem constrói

- Onde mora o "há um modal aberto" (um contador no `Dialog`/`AlertDialog`/
  `CommandDialog`, um atributo no `<html>` que o CSS lê, ou um contexto) e
  como a origem do recuo é medida.
- A técnica de animar a escala (transição de CSS sobre um atributo, ou
  `animate` do `motion`), contanto que interromper siga de onde está e nada
  sobre no fim.
- Como tratar os filhos `fixed` do conteúdo que recua.
