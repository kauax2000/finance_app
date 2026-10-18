# Notificações: redesenho do painel e revisão da lógica — design

Data: 2026-10-17. O dono pediu: "redesign completo na gaveta de notificações,
com o offset para ficar no mesmo padrão flutuante do app; o resto você pode
ter as ideias". Depois: "melhore design, layout e UX", "revise a lógica da
feature" e "as notificações disparadas". As decisões abaixo são do Claude,
marcadas **(Claude)**, e o dono as revisa ao ler.

A auditoria da lógica (somente leitura) achou defeitos em três lugares:
o painel, o cliente que conta e atualiza, e as funções do Supabase que
disparam as notificações. Este documento cobre **A** (o painel) e **B** (a
lógica no cliente), que vão ao ar com o app. **C** (o servidor) está descrito
no fim e depende de publicar funções e migração no Supabase de produção.

## Intenção

Hoje o painel é uma folha rente à borda (`variant="flush"`), com uma lista
crua (`<ul>` + `divide-y`), um botão vermelho de largura total para "Limpar
todas", um chip verde de "novas", a data em UTC, e nenhum jeito de marcar
tudo como lido. A contagem do sino quebra com mais de 100, o sino só atualiza
quando a aba volta ao foco, um erro de rede vira "Nenhuma notificação", e o
próprio app manda "Você criou a categoria…" para quem acabou de criar — às
vezes duas vezes. O objetivo: o painel conversar com o resto do app (a placa
flutuante, as peças do design system) e mostrar o que importa, na ordem
certa, com as ações à mão.

## A — O painel

1. **A superfície (dono)**: `SheetContent variant="floating"` (a calha de 8px,
   `rounded-modal`, anel), `size="md"` (448). No telefone continua a gaveta
   (`fillMobileViewport`), que o `Sheet` decide sozinho. Sem `className` de
   geometria na tela: some o `h-full max-h-dvh border-l sm:max-w-md`.
2. **A cromagem é a do design system (Claude)**: `DialogHeader` com
   `DialogHeaderRow` (título "Notificações" e, ao lado, a contagem de não
   lidas num `Badge` `soft` `size="xs"` — "3 novas"), `DialogBody` com a lista
   (a rolagem e a dissolução são dele), e o × é o `DialogCloseButton` (último
   filho do `SheetContent`). Sem `DialogFooter`: o "Limpar todas" sai do
   rodapé.
3. **O menu do cabeçalho (Claude)**: um ⋯ (`Button tertiary icon-sm`, nome
   "Mais ações") no `endAdornment` do `DialogHeaderRow`, abrindo um
   `DropdownMenu` com: **Marcar todas como lidas** (desabilitado sem não
   lidas; usa `markAllRead`, que já existe e não tinha botão), **Preferências
   de notificação** (fecha o painel e vai a `ROUTES.SETTINGS`), separador, e
   **Limpar todas…** (`variant="destructive"`, pergunta antes pelo
   `useConfirmDialog` que já existe).
4. **O filtro (Claude)**: abaixo do cabeçalho, um `ToggleGroup
   variant="segmented"` `size="sm"` com **Todas** e **Não lidas** (com a
   contagem). Escolha de valor sobre a mesma lista, por isso não é `Tabs`.
   Some quando não há notificação nenhuma.
5. **A lista agrupada por dia (Claude)**: `groupByLocalDay` +
   `formatDayHeadingPtBr` ("Hoje", "Ontem", "segunda, 13 de out."), cada dia
   com um rótulo pequeno em sobrancelha que gruda no topo da rolagem
   (`sticky top-0`, no fundo da placa). Cada notificação é um `Item`
   `interactive` `size="md"` dentro de um `ItemGroup`:
   - `ItemMedia`: o ícone de 16 (`getNotificationIcon`) num círculo de 32 com
     a tinta do **tom** da notificação: orçamento a 80% e conta para vencer →
     `warning-muted`; orçamento estourado, limite de cartão excedido e conta
     atrasada → `destructive-muted`; cartão e fatura → `info-muted`; lançamento
     de outro membro e convite → `muted`. O tom sai de uma função pura nova,
     `notificationTone(n)`, em `src/lib/notification-visuals.tsx`, ao lado
     do ícone.
   - `ItemTitle` (o título; `font-semibold` quando não lida, `font-medium`
     quando lida) e `ItemDescription` (o corpo, até 2 linhas).
   - À direita, a hora local (`HH:mm`; o dia já está no rótulo do grupo) e,
     se não lida, o ponto `BadgeDot` na cor primária.
   - As ações da linha: no cursor, aparecem no foco e no hover um botão de
     **marcar como lida/não lida** (`CheckIcon`/`EnvelopeIcon`, `icon-xs`,
     com dica) e o ⋯ (`DropdownMenu mobile="sheet"`: "Marcar como lida" ou
     "Marcar como não lida", e "Excluir"). No toque, o ⋯ fica sempre à vista
     e o botão de marcar some.
   - A linha clicada navega na hora (fecha o painel e abre o destino) e marca
     como lida em segundo plano; hoje ela espera o banco antes de navegar.
   - Uma linha sem destino (`getNotificationAction` nulo) só marca como lida,
     sem fechar, e não tem a aparência de link (sem `ItemChevron`).
6. **Excluir desfaz (Claude)**: excluir tira a linha na hora e mostra
   `toastUndo("Notificação excluída", { onUndo })`; o `delete` no banco só
   corre depois que o toast some sem desfazer. Limpar todas continua com a
   pergunta, sem desfazer.
7. **Estados (Claude)**:
   - **Carregando**: o esqueleto com a forma da linha (círculo de 32, duas
     linhas de texto), num `SkeletonGroup`.
   - **Erro**: um `Alert tone="destructive"` `size="sm"` com "Não deu para
     carregar as notificações." e a ação "Tentar de novo" (`AlertAction`), no
     lugar da lista — nunca o vazio. O toast de erro de página sai.
   - **Vazio**: o `NotificationsPanelEmpty` atual, enxuto: sem a lista de
     exemplos em tópicos, com a descrição curta e o botão "Preferências de
     notificação" (`tertiary`).
   - **Filtro "Não lidas" sem nada**: `EmptyStateIcon variant="done"`, "Tudo
     lido", e o botão "Ver todas" que volta ao filtro Todas.
8. **Movimento e toque**: o que o `Sheet` floating e o `Item` já fazem
   (cascata `sheet-reveal`, realce da linha, alvo de 44 no dedo). Nada de
   animação nova.

## B — A lógica no cliente

1. **A contagem do sino é a exata (Claude)**: o painel deixa de sobrescrever
   o número do sino com o tamanho da lista (que vem cortada em 100). Ele
   ajusta por delta (`adjustUnreadCount`) ao marcar, desmarcar e excluir, e
   zera ao "Marcar todas como lidas" e ao limpar. O "Não lidas · N" do filtro
   mostra o número do sino.
2. **Marcar como não lida (Claude)**: `markUnread(userId, workspaceId, id)`
   em `src/lib/notifications.ts` (o `update` de `read_at` para `null`, com os
   mesmos filtros de `markRead`; a política de UPDATE já permite).
3. **O sino se renova (Claude)**: além de montar, trocar de carteira e voltar
   à aba, ele consulta de novo a cada 60s com a aba visível e quando alguém
   chama `invalidateUnreadBadge()` (que já existe no provider e ninguém
   chamava). O painel aberto recarrega a lista quando o sino muda. As
   respostas velhas são descartadas por sequência, como o painel já faz.
   `ponytail:` sondagem de 60s; o caminho de volta é o Realtime do Supabase,
   que exige publicar a tabela (mudança de banco, parte C).
4. **Datas locais (Claude)**: a hora e o dia saem do relógio local
   (`groupByLocalDay`, `formatDayHeadingPtBr`, hora `HH:mm` por
   `toLocaleTimeString("pt-BR")`), não do UTC; a hora relativa caseira do
   painel sai.
5. **Erro não é vazio (Claude)**: o painel guarda o erro e mostra o estado da
   seção A7.
6. **Sem notificação para si mesmo (Claude)**: os três caminhos que disparam
   `category_created` (`categories/page-client.tsx`,
   `category-create-dialog.tsx`, `categories-onboarding-wizard.tsx`) deixam de
   chamar `dispatch-notifications`. O toast de sucesso já avisa quem criou, e
   era a origem das duplicadas. As linhas antigas continuam visíveis até a
   pessoa limpar.
7. **Os alertas que faltavam no cliente (Claude)**: editar uma despesa também
   chama `evaluate-budgets` (hoje só a checagem de cartão corre), e a compra
   parcelada também chama a checagem de cartão — os mesmos ganchos que a
   criação já usa, sem função nova no servidor.
8. **O orçamento volta a avisar (Claude)**: ao mudar o `amount` de um
   orçamento, o `upsert` em `category-budget-ops.ts` zera os
   `threshold_*_sent_at`, para os alertas de 80% e 100% valerem para o novo
   valor.
9. **O destino desconhecido não navega**: `getNotificationAction` continua
   devolvendo nulo para o que não reconhece; o `JORNADAS.md`, que dizia
   `/dashboard`, passa a dizer isso. O `href` vindo do `metadata` também recusa
   tabulação e quebra de linha (`/\t/evil.com` virava `//evil.com`).

## Fora

- **C, o servidor**, fica para depois da decisão do dono sobre publicar no
  Supabase de produção (ver abaixo).
- Página de notificações própria, Realtime, push e e-mail: sem mudança.
- Nada muda em `src/components/ui/` nem em `globals.css`: o painel é composto
  só com as peças que existem. **Se faltar uma peça** (por exemplo, o
  círculo tingido do `ItemMedia` não existir), a tarefa para e pergunta, pela
  invariante 6 do `AGENTS.md`.

## Anti-metas

- Nenhuma gravação no banco durante o desenvolvimento ou a verificação (o
  banco de dev é o de produção): nada de marcar, excluir ou limpar
  notificações reais para testar. A verificação ao vivo só abre o painel e lê.
- O painel não pode mostrar "Nenhuma notificação" quando a busca falhou.
- A contagem do sino não pode diminuir ao abrir o painel.

## Restrições

- É mudança de jornada (a gaveta ganha ações e destinos: "Marcar todas",
  "Preferências", o filtro; e a linha sem destino deixa de fechar): atualizar
  a seção de notificações do `docs/JORNADAS.md`, o `docs/atlas/template.html`,
  rodar `python3 docs/atlas/build.py` e republicar o Atlas
  (https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL).
- Textos em português, no tom do app. Ícones `16/solid` dentro das linhas.
- `npx tsc --noEmit && npm run lint && npm run test:unit` passam.

## Fica com quem constrói

- Como o painel se divide em arquivos (a linha, o grupo do dia e o cabeçalho
  podem sair do `notifications-panel.tsx`, que hoje tem 346 linhas).
- A forma exata do teste de cada função pura (`notificationTone`, a
  sequência do sino, o desfazer da exclusão).

## C — O servidor (proposto; precisa de publicar no Supabase)

O que a auditoria achou nas funções e no banco, para um plano à parte:

1. O interruptor "Cartões: limite e categorias" desliga também os lembretes de
   fatura (fecha/vence): a função do calendário passa pelo filtro de cartões
   além do dela.
2. Textos vagos e incoerentes: "Orçamento chegando ao limite (80%)" com "99%"
   no corpo; nenhum diz a categoria, o mês ou os valores. O texto da captura do
   dono nem está no repositório: a função publicada parece mais velha que o
   código.
3. Conta atrasada avisa todo dia por até 60 dias, a cada membro.
4. Lembretes de fatura saem com fatura zerada ou paga, sem valor, e um dia de
   cron perdido perde o lembrete (a data precisa bater exatamente).
5. O "limite usado" do cartão olha só a fatura aberta.
6. Os crons do calendário de cartão e das contas não estão agendados nas
   migrações.
7. Qualquer membro pode chamar `dispatch-notifications` com título e corpo
   livres e mandar e-mail para si; e o `href` no servidor não recusa `\`.
8. Tipos com ícone e sem quem os produza (convites, papel, saída da carteira,
   promoções): o interruptor de promoções não faz nada.

A auditoria propôs um catálogo de textos (por exemplo, "{Categoria}: 85% do
orçamento de outubro" / "R$ 850 de R$ 1.000 — restam R$ 150"), que entra no
plano de C.
