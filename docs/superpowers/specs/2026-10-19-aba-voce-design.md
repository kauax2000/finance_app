# A aba "Você" — design

**Pedido do dono (2026-10-19):** a barra de baixo do telefone o mais perto
possível do iOS. Como no WhatsApp, a aba "Mais" vira **"Você"**, com o avatar,
e em vez de abrir um menu suspenso ela abre **uma página** que leva às telas que
hoje estão no menu "Mais", reorganizadas como na referência (grupos de linhas
num cartão, ícone, nome e chevron). O dono deixou os detalhes comigo: tudo
abaixo que não é o pedido acima é decisão minha, marcada **(minha)**.

## Por quê

O menu suspenso que brota do "Mais" é uma gramática de desktop. No iOS a última
aba é um lugar (Você, Ajustes, Perfil): tocar nela troca de tela, a aba fica
ativa, e as telas que se abrem de lá ganham o voltar. É o modelo mental que a
pessoa já tem do WhatsApp, do Instagram e dos Ajustes.

## O que muda

### 1. A aba

- O `MobileAccountMenu` (o `DropdownMenu variant="panel"` da rodada 278) sai. A
  quarta aba deixa de ser um `BottomBarSlot` que abre menu e vira um
  `BottomBarTab` com `href="/me"` e `label="Você"`.
- **O glifo é o avatar** da pessoa (`Avatar size="xs"`, 24px, a foto ou as
  iniciais no tom de `identityToneFor`, como no Minha conta). Enquanto o perfil
  não chegou, o círculo neutro do `AvatarFallback` sem letras — **sem
  esqueleto e sem trocar de ícone** (a rodada 278 tirou o avatar justamente pelo
  esqueleto que piscava) **(minha)**.
- O `BottomBarTab` ganha a prop **`media?: React.ReactNode`**, que ocupa o lugar
  do glifo (`icon` passa a ser opcional quando há `media`). É a única mudança em
  `src/components/ui/`, coberta pelo pedido do dono. A aba ativa continua sendo
  a tecla do marcador por trás; o avatar não tem versão "sólida".
- **A aba "Você" fica ativa** em `/me` e em toda tela que se abre da página
  "Você" (as linhas da página e as subpáginas delas que já apontam para elas,
  como `/account/sessions`, `/credit-cards/<id>`, `/settings/*`) **(minha)** —
  no iOS, o que foi empurrado de uma aba continua debaixo dela.
- A regra da rodada 342 (a aba que não cabe sai para o fim) continua: a última
  da fileira passa a ser "Você" no lugar de "Mais", e quem sai aparece no topo
  da página "Você" (abaixo).

### 2. A página `/me`

Rota nova **`/me`** (`ROUTES.ME`; as rotas do app são em inglês), título
**"Você"** em `APP_PAGE_TITLES` **(minha)**. Página raiz no telefone: o sino à
esquerda, a lupa à direita, sem voltar.

De cima para baixo **(minha, seguindo a referência)**:

1. **Identidade**, centrada: o avatar grande (`Avatar size="xl"`, 56), o nome
   (`H2` ou o degrau de título que o catálogo tiver para isso) e o e-mail em
   `Muted`. Não é link — a conta tem a linha dela.
2. **Grupo "Carteira"**: primeiro as abas que saíram da barra (rodada 342; em
   telefone comum, nenhuma), depois Assinaturas, Contas a pagar (com o `Badge`
   "Beta"), Cartões e Membros e convidados.
3. **Grupo "Conta"**: Minha conta e Configurações. Planos e pagamentos continua
   morando dentro de Minha conta no telefone (rodada 278), e o sair também.

Cada grupo é um cartão de linhas, como o WhatsApp: `Card padding="none"` com um
`ItemGroup` de `Item` (link de verdade, `Item asChild` + `Link`), o ícone à
esquerda, o nome, o `ItemChevron` à direita. Linhas no alvo de toque (44 ou
mais), ícone de 20 do conjunto mini (`miniIconFor`, rodada 345), texto de 16.
Nada escrito à mão: se o catálogo não tiver a linha de lista agrupada desse
jeito, a página compõe as peças que existem e **não** cria componente novo.

As linhas acendem (`aria-current="page"`) pela mesma regra de hoje
(`isMobileAccountMenuNavItemActive`), útil no desktop, onde `/me` também
renderiza — ninguém chega lá pela barra lateral, e não há redirecionamento
**(minha)**.

`page.tsx` + `page-client.tsx` + `loading.tsx` com o esqueleto da página, e o
`page.tsx` embrulha o cliente em `AdiarMontagem` (a regra de "A troca de tela é
no clique").

### 3. O voltar das telas da página "Você"

No telefone, as telas abertas pelas linhas da página "Você" (Assinaturas,
Contas a pagar, Cartões, Membros e convidados, Minha conta, Configurações)
passam a ser subpáginas dela: o voltar toma o lugar do sino e leva a `/me`
**(minha)**. É o `defaultMobileBackHref` do `app-header.tsx`, que só vale no
telefone; o breadcrumb e o desktop não mudam. As subpáginas que já têm pai
(sessões e atividade → Minha conta; detalhe do cartão → Cartões) continuam com
o pai delas. As abas que saíram da barra (Categorias a 320px) **não** ganham o
voltar: na largura comum elas são raiz.

### 4. As abas que saem

A página precisa saber quais abas saíram, e quem sabe é a barra (mede no
canvas, rodada 342). Um armazém pequeno no módulo (`useSyncExternalStore`) que
a barra publica (os `href` que saíram) e a página lê **(minha)**. Sem estado
global de biblioteca, sem contexto novo na casca.

## Fora do escopo

- Desktop: a barra lateral e o menu do usuário não mudam.
- O "+" e as três abas de tela não mudam.
- Nenhuma tela nova além de `/me`; nada muda dentro das telas de destino.
- Busca, QR e edição de perfil no topo da página (o WhatsApp tem): não.

## O que precisa andar junto

- **Jornada:** rota nova e destino de navegação global mudam. `docs/JORNADAS.md`
  (a linha "Menus do telefone" e o mapa da casca), `docs/atlas/template.html`,
  `python3 docs/atlas/build.py` e republicar o Atlas no mesmo URL.
- **AGENTS.md:** o bullet da `BottomBar` (`media`, a aba "Você"), o do `Drawer`
  que cita o painel da aba "Mais", e o da rodada 342 ("quem saiu entra no topo
  do menu").
- **Catálogo:** a `PropsTable` do `BottomBarTab` em
  `src/app/designsystem/docs/bottom-bar.tsx` ganha `media`.
- **Histórico:** rodada 346 em `docs/design/HISTORICO-DESIGN-SYSTEM.md`.
- **Testes:** `bottom-bar-versions.test.ts` (a prop `media`),
  `mobile-bottom-nav.test.ts` (a aba "Você", o armazém), e um teste de fonte da
  página `/me` (os grupos e os destinos).

## Restrições que valem

- O dev usa o banco de produção: nenhuma escrita de dado para testar.
- Sem push, deploy ou `db push`.
- Tokens, nunca literais; Heroicons pela régua do tamanho.
- Conferir a 375px e a 320px na prévia, e no simulador o que só o iOS mostra.
