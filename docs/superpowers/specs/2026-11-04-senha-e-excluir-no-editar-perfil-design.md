# Alterar senha e Excluir conta no Editar perfil — design

Data: 2026-11-04. Pedido do dono: "Adicione a opção de alterar senha e excluir conta dentro do dialog no desktop, no drawer e no mobile de editar perfil." Decisões: as duas ações **saem** da página Minha conta e ficam **só** dentro do Editar perfil; layout **A · seção "Segurança"** (escolhido nos mockups).

## O que muda

### Editar perfil (`EditProfileDialog`, `src/components/account/edit-profile-dialog.tsx`)
- Abaixo do campo de e-mail (e da senha atual, quando ela aparece, e antes dos alertas), uma seção com o título **"Segurança"** e um cartão de linhas com:
  - **"Alterar senha"**, com chevron: abre o `ChangePasswordDialog` que já existe.
  - **"Excluir conta"**, em vermelho (`destructive`), com chevron: abre o `DeleteAccountDialog` que já existe.
- Vale nos dois formatos do diálogo: no desktop (`Dialog`) e no telefone (a gaveta do `surface="auto"`).
- Os dois diálogos abrem **por cima** do Editar perfil, que fica aberto embaixo (no telefone, gaveta sobre gaveta, que o `Drawer` já empilha). Fechar o de senha volta ao Editar perfil. *(Do construtor.)*
- As linhas são botões (`type="button"`), nunca submit: o Enter do formulário continua salvando o perfil.
- Enquanto o perfil salva (`saving`), as duas linhas ficam desabilitadas. *(Do construtor.)*

### Minha conta (`src/app/(app)/account/page-client.tsx`)
- Sai a linha **"Senha · Alterar"** da seção "Acesso e plano". Com só o Plano restando, a seção passa a se chamar **"Plano"**. *(Do construtor.)*
- Sai o botão **"Excluir conta"** do pé da página; o **Sair** fica, sozinho.
- O estado e a montagem de `ChangePasswordDialog`/`DeleteAccountDialog` saem da página (passam a morar no Editar perfil).

### Fora
- Cofre aberto (`/cofre`) continua com o "Apagar a conta" dele.
- Os dois diálogos não mudam por dentro.

## Anti-objetivos
- Excluir conta com a mesma cara de uma linha comum (tem que ler como perigo).
- Uma linha de Segurança que envia o formulário do perfil.
- Perder o caminho para alterar a senha ou excluir a conta em algum aparelho.

## Restrições
- Design system do `AGENTS.md` (composição de `Card`, `Item`/`ItemGroup`, `ItemChevron`; nada novo em `ui/`).
- Enter e submit: regras de formulário do `AGENTS.md`.
- Mudança de jornada (abrir um diálogo de outro lugar): `docs/JORNADAS.md` (Minha conta, linhas ~1241, ~1251, ~1319), `docs/atlas/template.html`, `build.py`, republicar o Atlas.
- Testes vitest; verificação no navegador no desktop e a 375px, **sem salvar nada** (o banco de dev é o de produção).
