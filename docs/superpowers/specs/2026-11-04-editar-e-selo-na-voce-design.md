# Editar e selo no topo da Você — design

Data: 2026-11-04. Pedido do dono: "adicione de alguma forma o botão editar e o selo na tela Você do mobile lá na parte de cima onde já tem as informações do usuário." Layout escolhido nos mockups: **B · lápis na foto e selo sob o e-mail**.

## O que muda (topo de `/me`)

- **A foto edita**: o `VoceAvatar` `xl` do topo ganha o lápis no canto (`Avatar onEdit`, `editLabel="Editar perfil"`), como em Minha conta. Tocar abre o `EditProfileDialog` (com a seção Segurança), montado na página `/me`.
- **O selo sob o e-mail**: abaixo do par nome/e-mail, centrada, uma fileira com o `Seal` (o mesmo de Minha conta: anel "MEMBRO DESDE · …", ícone `AppLogo`) e, ao lado, o texto `Membro desde <mês> de <ano>` em `Muted`. Tocar no selo abre ele grande, como já faz.
- Sem `user.created_at`, a fileira do selo não aparece.
- Vale no celular e na `/me` larga também (a página é a mesma).

## Do construtor
- O selo de Minha conta e o da Você são a mesma composição: ela vira um componente só, `SeloDeMembro({ desde }: { desde: string })` em `src/components/account/selo-de-membro.tsx`, usado nas duas páginas (Minha conta continua igual na tela).
- `VoceAvatar` ganha `onEdit?: () => void`, repassado ao `Avatar` só no `xl`.
- O texto ao lado do selo usa o `formatTransactionMonthYearPtBr` que o `label` do selo já usa.

## Fora
- O selo e o Editar perfil não mudam por dentro.

## Restrições
- Design system do `AGENTS.md`; o `Seal` é a peça de marca da tela (a `/me` não tem outra).
- Mudança de jornada (o Editar perfil passa a abrir também da Você): `docs/JORNADAS.md`, o template do Atlas, `build.py`, republicar.
- Verificação a 375px sem salvar nada.
