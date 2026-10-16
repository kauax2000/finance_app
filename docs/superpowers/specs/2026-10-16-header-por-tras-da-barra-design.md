# Header por trás da barra lateral, com a busca no centro — design

Data: 2026-10-16. O dono pediu o brainstorm feito pelo Claude: as decisões
abaixo são do Claude, marcadas assim, e o dono revisa no plano.

## Intenção

O app ganhou a barra lateral `floating` (rodada 261) e as sobreposições
ganharam o vidro e o gesto do menu (rodadas 283–287). O cabeçalho ficou para
trás: começa onde a placa termina, a busca é uma pílula de 224px encostada no
sino, e ao rolar o vidro para na borda da coluna. O pedido do dono:

1. o header **passa por trás da barra lateral**;
2. a busca é **o mesmo componente do design system**, **no centro** do header;
3. o resto conversa com o que foi feito nos diálogos e na barra lateral.

## Decisões (do Claude)

- **A barra do topo corre a tela inteira, por baixo da placa.** No desktop, ao
  lado de uma `Sidebar floating` (não redimensionável), o `TopBar` filho do
  `SidebarInset` recua pela folga da barra (`--sidebar-gap`) e devolve o
  recuo como `padding`: o conteúdo dele fica onde está, e a superfície vai à
  borda esquerda da janela. A placa (`--z-sticky`) fica por cima porque o
  `SidebarInset` vira contexto de empilhamento (`isolate`) — a barra continua
  `--z-sticky` dentro dele, acima do conteúdo da página.
- **Em repouso nada muda à vista** (a barra é transparente ao lado do
  `floating`, regra que já existe). **Ao rolar**, o vidro da barra
  (`barSurfaceClassName`) e o fio de 1px correm a largura toda, por baixo da
  placa. O fio volta: ele estava a 0 porque "ficaria pendurado" na borda da
  placa; agora segue por baixo dela até a borda da tela. No redimensionável a
  barra não passa por trás (o painel recorta), e lá o fio continua a 0.
- **A folga é variável do invólucro**: `--sidebar-gap` vale a largura da barra
  aberta, a do trilho mais a calha recolhida em ícone (e espiando), e 0 em
  offcanvas. O recuo e o `padding` da barra transicionam na mesma curva da
  folga (`--duration-slow`, `--ease-emphasized`), para o título andar junto
  com a página ao recolher.
  Não se usa `100vw`: dentro das prévias do catálogo `vw` é a janela inteira.
- **A busca é o `TopBarSearch` do catálogo**: `collapse="lg"` (ícone abaixo de
  1024px, pílula a partir dele), `glow` (o brilho de marca — a única peça de
  marca das telas do app; nenhuma tela tem outra), numa coluna de até 384px
  (`max-w-sm`) **centrada na área visível** — título à esquerda e ações à
  direita com o mesmo peso (`flex-1 basis-0`), como no `DsTopBar`. O texto é
  "Buscar telas e ações…" (a paleta do app busca telas, ações do "+ Adicionar"
  e sub-páginas). A frase que rola do catálogo fica no catálogo.
- **Ficam**: a altura de 48 (decisão anterior do dono), o título/trilha à
  esquerda, o sino à direita, a paleta e o ⌘K como estão, e o telefone inteiro
  (a mesma ordem: título, recorte de tempo, lupa, sino).

## Fora

O telefone, a `TopBar variant="floating"` (recusada na rodada 261), a frase
rolante, a altura, a placa da barra lateral e o redimensionável. Não é mudança
de jornada (nenhuma rota, destino ou paleta muda).

## Mudanças em `ui/` (autorizadas pelo pedido do dono)

`src/components/ui/sidebar.tsx` (a variável da folga, o `isolate` e a barra
por trás no `SidebarInset`). O `TopBar` não muda: quem o reposiciona é o
`SidebarInset`, como já faz com o fundo transparente.
