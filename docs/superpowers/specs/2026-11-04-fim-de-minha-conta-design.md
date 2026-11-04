# O fim da página Minha conta — design

Data: 2026-11-04. Pedido do dono: "O intuito de tudo isso foi pra gente eliminar a página 'Minha conta'. No desktop ela deve ser substituída por um botão que vai abrir o editar perfil, editar conta. E no mobile crie duas novas páginas. Uma para a política de privacidade e outra para a de planos. No desktop, as de planos já existem e a política de privacidade no desktop não precisa." A privacidade no celular **faz parte do app** (cabeçalho, voltar, barra de baixo).

## Por quê
Tudo o que Minha conta tinha já mora em outro lugar: a foto, o lápis e o selo no topo da Você; senha e excluir conta no Editar perfil (Segurança); Sair no fim do grupo Conta da Você. A página sobrou como um desvio.

## O que muda

### Desktop
- No menu do usuário (o rodapé da barra lateral, `user-menu.tsx`), o item **"Minha conta" vira "Editar perfil"**: abre o `EditProfileDialog` (com Segurança: Alterar senha, Excluir conta), montado no próprio menu. Os outros itens (Planos e pagamentos, Cofre aberto) ficam.
- Nenhum outro lugar do desktop leva a `/account`.

### Celular (aba Você › Conta)
- A linha "Minha conta" sai. Entram, nesta ordem, no começo do grupo: **"Planos e pagamentos"** → `/plans` (a página que já existe) e **"Política de privacidade"** → a rota nova. O resto do grupo segue: Cofre aberto, IAs conectadas, Notificações, Sair.
- **`/plans`** no celular volta a Você (hoje volta a `/account`).
- **Política de privacidade, nova, dentro do app**: `/settings/privacidade`, como as outras telas de configuração da Você — o nome já nasce na barra, voltar a Você, a aba Você acesa, `loading.tsx`, `AdiarMontagem`. O conteúdo é o mesmo da página pública (`PrivacidadeWireframe`), que continua existindo em `/privacidade` para quem não entrou. No desktop a rota abre também (sem link para ela), com o `PageHeader`.

### A rota `/account`
- Deixa de ter conteúdo: redireciona (`replace`) para `/me` no celular e para o Painel no desktop. O esqueleto e o cliente dela saem.
- Os links internos que apontavam para ela mudam:
  - a jornada de começar (`lib/jornada/jornada.ts`, canal do iPhone: "Crie o token em Minha conta") → `/settings/lancar-pelo-iphone`, texto "Conecte o iPhone em Lançar pelo iPhone";
  - o link "Abrir Minha conta" do `PrivacidadeWireframe` sai (o "Abrir o Cofre aberto" fica);
  - listas de rotas (`sidebar-app-shell.tsx`, `rotas-do-convidado.ts`, `navigation.ts`, `mobile-navigation.ts`, `account-menu-links.ts`) deixam de citar `/account`, e o convidado ganha `/settings/privacidade` (já coberto por `/settings/*`).

## Fica de fora
- O selo "Membro desde" no desktop: morava só em Minha conta. No desktop ele some (no celular continua na Você). *(Do construtor: aceito, por não ter lugar natural no menu; se o dono quiser, ele entra no Editar perfil depois.)*
- Mudar a página de Planos ou a política em si.

## Restrições
- Design system do `AGENTS.md`; nada novo em `ui/`.
- Mudança de jornada grande (rota removida, item de menu, rota nova): `docs/JORNADAS.md`, template do Atlas, `build.py`, republicar; o `AGENTS.md` (os trechos que citam Minha conta: o voltar a Você, a página `/me`, o `Avatar onEdit` "Minha conta edita o perfil por ele", o `Seal` "Minha conta o usa").
- Testes vitest; verificação no desktop e a 375px, sem salvar nada.
