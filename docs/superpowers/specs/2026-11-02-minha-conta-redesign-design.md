# Minha conta: redesign e fim de sessões e atividades

Data: 2026-11-02. Branch: `finance-app-2.0`. Jornada 10 (Conta e segurança).

## Por quê

Minha conta hoje esconde o essencial num menu ⋯ (editar perfil, senha, sair,
excluir), mostra dois wireframes tracejados no meio da página e aponta para duas
subpáginas que saem. O dono pediu o redesign completo, com design, layout, UX e
usabilidade melhores, e a remoção de sessões ativas e do histórico de atividades.

## Objetivos

- Tela nova em `/account`, no layout **B, tudo à vista**, escolhido pelo dono nos
  mockups: uma coluna longa, com aparelhos e IAs já listados.
- Tudo o que fica continua funcionando: Perfil, Planos, Sair, Excluir conta,
  tokens do Atalho, IAs conectadas e Política de privacidade.
- Os dois wireframes viram design system, e os arquivos deles são apagados.
- Sessões ativas e atividades somem por inteiro do front.
- `tsc`, `lint`, `test:unit` e `ds:audit` da tela passam.
- `docs/JORNADAS.md` e o Atlas atualizados e republicados na mesma mudança.

## Fora do escopo

- **Nenhuma mudança em `src/components/ui/` nem em `globals.css`.** Tudo cabe em
  componentes que já existem. Se aparecer falta real, pare e pergunte.
- **Backend intacto**: nenhuma Edge, migração ou publicação. Ver "Backend".
- Linha "Sair de todos os aparelhos": o dono recusou, e Sair já é global.
- E-mail em diálogo próprio: o dono recusou. A folha Editar perfil segue com nome,
  foto e e-mail.
- Confirmação no Sair desta tela: o `AGENTS.md` registra que ele segue sem
  confirmação, com erro em toast.
- Cofre aberto nesta tela: continua no menu do usuário e em `/me`.

## A tela

Coluna de 576 (`Container`, no layout que já existe). A ordem, de cima para baixo:

1. **Título.** No desktop, `PageHeader collapse` como em Configurações, com
   `PageHeaderTitle asChild` e `<p aria-hidden="true">`, escondido quando
   `useIsMobile()`. No telefone a rota é subpágina: sem título grande, e a casca
   cuida do nome no centro da barra ao rolar.
2. **Identidade.** `Avatar`, nome, e-mail e "Membro desde …" (par sem `gap`), com o
   botão "Editar perfil" à direita, que abre o `EditProfileDialog`.
3. **Acesso e plano.** Seção com `Card padding="none"`, no padrão de Configurações
   (`SettingsSection`, `SettingsLink`):
   - **E-mail**, com o e-mail atual, abre o `EditProfileDialog`;
   - **Senha**, com "Alterar", abre o `ChangePasswordDialog`;
   - **Plano**, com o nome do plano de hoje (`usePlano` e `resumoDoPlano`), leva a
     `ROUTES.PLANS`. Passa a aparecer também no desktop, sem `md:hidden`.
4. **Lançar sem abrir o app.** O `SettingsSection` leva "Novo aparelho" em
   `actions`. No cartão, uma linha por token ativo: nome, carteira · último uso e
   "Revogar". Fecha com a linha "Como configurar", que abre um `Dialog` com o
   endereço de captura para copiar e o link do guia.
5. **IAs conectadas.** O `SettingsSection` leva "Conectar" em `actions`. Uma linha
   por grant: nome, "desde …" e "Desconectar".
6. **Privacidade.** A linha "Política de privacidade", para `ROUTES.PRIVACY`.
7. **Fim da página.** "Sair" à esquerda e "Excluir conta" à direita, em texto
   destrutivo, abrindo o `DeleteAccountDialog`.

O menu ⋯ sai.

### Atalho (tokens)

- "Novo aparelho" abre `Dialog surface="auto"` com `Form`: `FormInput` Nome do
  aparelho (1 a 60), `Select` Carteira padrão (a atual já escolhida), `FormCancel`
  e `FormSubmit`.
- Ao criar, **o mesmo diálogo** troca para "Guarde agora: ele não aparece de novo",
  com o token, Copiar, o endereço de captura e "Já guardei". O token só vive no
  estado desse diálogo. Fechar por qualquer caminho o descarta.
- Revogar usa `AlertDialog` com `variant="destructive"` e `pending`, não
  `window.confirm`. A frase é a de hoje: o aparelho para de lançar.
- As mensagens de erro de `mensagemDoErroDeToken` mudam de casa sem mudar o texto.
- As regras seguem: colunas `COLUNAS` (nunca `*`), RPCs `create_capture_token` e
  `revoke_capture_token`, limite de 10 ativos.
- O guia `docs/captura/atalho-iphone.md` cita o caminho "Minha conta › Captura sem
  abrir o app › Endereço". Atualize para o nome novo.

### IAs conectadas

- "Conectar" abre `Dialog surface="auto"` com a URL do MCP para copiar
  (`urlDoMcp`) e as três instruções de hoje: Claude, ChatGPT e `claude mcp add`.
- Desconectar usa `AlertDialog`, como Revogar, com `listGrants` e `revokeGrant`.

### Estados

- Cada lista tem carregando (`Skeleton` na forma da linha), vazia (uma frase curta
  no cartão, a ação segue no título da seção) e erro (`CardMessage`, ou `Alert`).
- Copiar confirma no próprio botão. A recusa da área de transferência não pode
  sumir em silêncio: o valor segue selecionável, com a mensagem de hoje.
- Falha ao revogar ou desconectar: `toastError`, ou `AlertDialogError` com o
  diálogo aberto.
- `AccountPageSkeleton` é reescrito na forma nova, com `PageHeaderSkeleton` no
  desktop.

### Telefone (375px)

Mesma ordem. Linhas com alvo de 44, sem rolagem horizontal, e `Dialog surface="auto"`
vira gaveta. Token e URL longos quebram (`break-all`) ou rolam dentro do campo,
nunca alargam a tela. Só `Button` e `Item` padrão: o que o DS já faz no dedo vale.

## Arquivos

- Reescrever `src/app/(app)/account/page-client.tsx`: só compõe, sem componente
  declarado (invariante 1).
- Criar em `src/components/account/`: a seção do Atalho e a das IAs, cada uma com
  seus diálogos. O campo de copiar é `InputGroup` com `InputGroupInput readOnly` e
  `InputGroupButton`.
- Mover `urlDoMcp` e `mensagemDoErroDeToken` para eles, com seus testes.
- Apagar `captura-tokens-wireframe.tsx` e `ias-conectadas-wireframe.tsx`, e tirar
  deles os casos de `wireframe.test.ts`. `wireframe-box.tsx` fica se outro wireframe
  ainda o usar.

## Remoção

Apagar:

- `src/app/(app)/account/sessions/` e `src/app/(app)/account/activity/`;
- `src/components/account/sessions-page-skeleton.tsx` e `activity-page-skeleton.tsx`;
- `src/lib/sessions.ts`, `src/lib/sessions-once.test.ts`, `src/lib/activity.ts` e
  `src/lib/family.ts`, que não tem quem importe.

Tirar:

- de `src/config/navigation.ts`: `ACCOUNT_SESSIONS`, `ACCOUNT_ACTIVITY`,
  `isAccountSessionsPath`, `isAccountActivityPath` e os títulos das duas rotas;
- de `src/config/mobile-navigation.ts` e `sidebar-app-shell.tsx`: os usos e o
  comentário que cita `/account/sessions`;
- de `src/components/providers.tsx`: `createSession`, `sessionRegisteredRecently`,
  `validateCurrentSession`, `clearCurrentSession` e o `sessaoRegistradaRef`;
- de `src/lib/edge-invoke.ts`: `getAppSessionIdHeader` e o header
  `x-app-session-id`;
- de `ChangePasswordDialog.tsx` e `edit-profile-dialog.tsx`: `createActivity`.

Ajustar testes:

- `mobile-navigation.test.ts`, `direcao-da-tela.test.ts`,
  `rotas-do-convidado.test.ts`, `app-command-palette.test.ts`, `me-page.test.ts`:
  usar outra rota, ou tirar a expectativa;
- `toggle-group-versions.test.ts` e `timeline-versions.test.ts`: as páginas que
  liam saíram. Tirar a verificação de consumidor, e manter o comentário de medida
  sem citar a rota, se ele ainda fizer sentido.

**O "sessão expirada" sai junto.** Sem `validateCurrentSession`, nada mais chama
`setAuthSignOutReason`. Saem:

- `src/lib/auth-signout-reason.ts`, e o uso dele em `auth-guard.tsx`;
- a mensagem `session-expired` em `login-form.tsx`;
- a cena `login.session-expired`, o chip `session-expired` e o roteiro
  `palette-session`: `scenes.ts`, `scene-context.tsx`, `auth-showcase.tsx`,
  `lib/scene-script.ts`, os testes deles e a entrada em
  `src/app/designsystem/docs/showcase.tsx`;
- as linhas "Sessões ativas" e "sessões encerradas" de `palette-demo.tsx`. Se
  `phone-screens.tsx` citar sessões encerradas, a frase troca.

**Texto de exemplo no catálogo.** `docs/breadcrumb.tsx` afirma que o app usa
"Minha conta › Sessões ativas": troque por uma subpágina que existe, junto com
`breadcrumb-versions.test.ts`. Os outros exemplos com "sessões" nas páginas do
catálogo (`empty-state`, `item`, `spinner`, `skeleton`) trocam por outro assunto.
Tudo em `src/app/designsystem/` pede a confirmação do harness.

**Sair segue global.** `signOut()` em `providers.tsx` não passa `scope`, e o padrão
do Supabase é `global`: Sair já encerra a conta em todos os aparelhos. Esse é o
caminho para um aparelho perdido, e o código não muda. Os outros aparelhos só caem
quando o token deles vence, sem aviso, e vão ao login. Diga isso no `JORNADAS.md`
e no Atlas. Trocar a senha também encerra os outros aparelhos quando o token deles
vence, e este aparelho continua.

As chaves de sessão no `localStorage` ficam órfãs e não atrapalham: sem limpeza.

## Privacidade

Decisão do dono: as linhas antigas serão apagadas quando o 2.0 subir para a `main`.
Por isso os textos já descrevem o estado final:

- `privacidade-wireframe.tsx`: sai "As sessões e os aparelhos conectados…". O
  registro de atividade passa a falar só do que resta, os convites da carteira.
  Confira nas Edges de convite o que elas gravam (IP e aparelho) antes de escrever.
- `cofre-aberto-wireframe.tsx`: a linha "Sessões, aparelhos e registro de atividade
  da conta (com IP)" vira a dos convites, com finalidade e quem vê verdadeiros
  (limite de convites). Hoje ela diz "mostrar onde a conta está aberta".
- Testes que travem esses textos acompanham.
- Se a Política tiver data de atualização, ela muda.

## Backend

Nada roda agora. **Pendência para a subida do 2.0 à `main`**, registrada em
`docs/JORNADAS.md` e no ledger do plano:

- migração que apaga `user_sessions` e os logs de `user_activity_logs` que não são
  de convite nem de mudança de papel (`family_role_changed`, de `papeis.sql`);
- antes de apagar, remover de `auth.sessions` os `auth_session_id` das linhas com
  `is_active=false`: a revogação feita pelo front de `main` só era cumprida pelo
  `validateCurrentSession`, que saiu;
- `cleanup_expired_sessions()` lê `user_sessions`: sai com ela, e confira se há cron;
- apagar as Edges `sessions` e `activity-logs` e `_shared/session-guard.ts`.

Até lá elas seguem, porque o front de `main` ainda as chama. `user_activity_logs`
**fica**: as Edges de convite gravam nela, e `_shared/invite-rate-limit.ts` lê dela
o limite de convites.

## Jornadas e Atlas

Mudam rotas, destinos e a Edge chamada. Na mesma mudança:

1. `docs/JORNADAS.md`: fluxograma e regras técnicas da seção 10; o motivo de saída
   na seção 1 (~221, ~267, ~268, ~289); as linhas que citam as rotas, o log e os
   wireframes (hoje ~483, ~1249, ~2089); e a lacuna 3 (~2103), que deixa de existir.
2. `docs/atlas/template.html`: "Como funciona", apêndice de rotas (~1505), Edges,
   lacunas, data e contagens da capa.
3. `python3 docs/atlas/build.py`.
4. Republicar `docs/atlas/atlas-jornadas.html` em
   https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL.

Também: `AGENTS.md`, se alguma regra citar as peças que saem, e
`graphify update .` no fim.

## Conferência

- Dev em :3000 pela config `dev-attach`. O banco é o de produção: **não crie, revogue
  nem desconecte nada**. Confira a tela, abra os diálogos e cancele.
- Desktop e 375px, tema claro e escuro, console sem erro. `/account/sessions` e
  `/account/activity` caem no 404.

## Decisões de quem escreveu o spec (para o dono conferir)

- O "sessão expirada" e a cena dele saem do login.

- "Membro desde" fica na identidade, embora o mockup B não o mostrasse.
- Tokens revogados somem da lista, que mostra só os ativos. Hoje aparecem como
  "revogado".
- O endereço de captura sai da página e fica em "Como configurar" e na tela do token
  novo.
- O Plano passa a aparecer no desktop.
- Revogar e Desconectar trocam `window.confirm` por `AlertDialog`.
