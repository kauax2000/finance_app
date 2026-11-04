# Você sem Configurações no celular — design

Data: 2026-11-04. Pedido do dono: no celular, as seções que no desktop moram em Configurações viram páginas próprias — Lançar pelo iPhone, IAs conectadas e Notificações —, e a tela de Configurações some no celular. Depois: "as IAs conectadas pode deixar um card para fora na tela Você mesmo para chamar a atenção da pessoa e incentivar ela a conectar, e a parte do telefone e no PWA também [...] Não deixe escondido em uma subpágina." E: "Depois de conectados e as coisas instaladas podem virar páginas sim." Layout escolhido nos mockups: **B · cada cartão no seu grupo**.

**Nome:** a funcionalidade é **Lançar pelo iPhone** (Siri, botão de ação, toque nas costas, tela bloqueada, ícone). Nunca chamá-la só de "Siri" em título, cartão ou linha.

## Intenção

Configurações no celular era um depósito de três coisas que a pessoa precisa **descobrir** (lançar pelo iPhone, conectar uma IA) e uma que ela só **ajusta** (notificações). Escondidas atrás de "Configurações", as duas primeiras não vendem. Na aba Você elas ficam à vista enquanto a pessoa não usa, e viram uma linha discreta depois que usa.

## O que muda (só abaixo de 768px, `useIsMobile`)

### A aba Você (`/me`)
- **Grupo "Neste celular"** (o que já existe, `NesteCelularGrupo`, no mesmo lugar: entre Carteira e Conta, com a âncora `#no-celular`). O cartão mora **acima** do cartão de linhas do grupo, solto, abaixo do título do grupo:
  - iPhone com o app instalado (`useAparelhoDeLancar() === "iphone-instalado"`) e **nenhum aparelho conectado** (`useAparelhosDeCaptura` vazio): o **cartão de incentivo de Lançar pelo iPhone** — título e texto falando das formas de lançar, não só da Siri; botão que abre o guia de conectar o aparelho (o mesmo `GuiaDoAtalho` de hoje).
  - iPhone instalado **com** aparelho conectado: uma **linha** "Lançar pelo iPhone" (descrição: o nome do aparelho, ou "N aparelhos"), que abre a página `/settings/lancar-pelo-iphone`.
  - iPhone pelo navegador (`"navegador-iphone"`): o cartão "Instale o app" (`ConviteDeInstalar`, como hoje em Configurações), no mesmo lugar. *(Do construtor: com o cartão à vista, a linha "Instalar o app" do grupo sai, para não repetir.)*
  - Enquanto a lista de aparelhos carrega ou com erro: a linha, sem descrição (nunca o cartão piscando).
  - Android e demais: nada novo (o Android não tem o recurso).
- **Grupo "Conta"**, o cartão solto acima do cartão de linhas:
  - **Nenhuma IA conectada** (grants vazios e a lista carregou sem erro): o **cartão de incentivo da IA** — o empty state atual (`IasVazio`: capas Claude/Finance/ChatGPT, sugestões, garantias, "Conectar minha IA"), abrindo o `ConectarIaDialog`.
  - **Com IA conectada**: uma **linha** "IAs conectadas" (descrição: os nomes, ou "N IAs"), que abre `/settings/ias`.
  - Enquanto carrega ou com erro na leitura: a linha (sem descrição), nunca o cartão piscando.
- **Grupo "Conta"**: a linha **"Configurações" sai** e entra a linha **"Notificações"**, que abre `/settings/notificacoes`. Ordem final de Conta: Minha conta, Cofre aberto, IAs conectadas (quando é linha), Notificações, Sair.

### As três páginas novas
- `/settings/lancar-pelo-iphone` — a `AtalhoSecao` sozinha (lista de aparelhos, conectar, desconectar, guia).
- `/settings/ias` — a `IasSecao` sozinha (lista, desconectar, conectar outra).
- `/settings/notificacoes` — as `NotificationPreferences` sozinhas.
- São subpáginas: voltar leva a `/me`, título da casca (`TituloDaTela`), transição de subpágina, `loading.tsx` com esqueleto e `AdiarMontagem`, como toda rota.
- Desconectar a última IA ou o último aparelho na página: a pessoa continua na página, que mostra o vazio dela; ao voltar a Você, o cartão de incentivo reaparece.

### Configurações no celular
- Nenhum lugar do celular leva a `/settings`. Quem abre `/settings` no celular (link velho, histórico) vai para `/me` (`replace`).
- O link "Configurar notificações" do painel de notificações leva a `/settings/notificacoes` no celular e continua em `/settings#notificacoes` no desktop.

### Desktop
- Nada muda: `/settings` continua com todas as seções. As três rotas novas abertas no desktop mostram a seção sozinha com o `PageHeader` (não redirecionam).

### Respostas da revisão (do construtor)
1. **Os cartões entram no `page-client` de `/me`**, não no `VoceGroup` (que segue só com links). `getVoceGroups` troca Configurações por IAs conectadas e Notificações em Conta; a página esconde a linha de IAs quando o cartão aparece.
2. **Configurações no celular não perde nada**: o `ThemeSettings` já devolve `null` abaixo de 768px (tema e busca do cabeçalho moram em Neste celular).
3. **Você acesa e voltar**: um mapa explícito das três rotas novas → `/me` em `voceBackHref` e `isVoceTabActive`, independente do que os grupos listam.
4. **A leitura das IAs vira um hook** (`useIasConectadas`, a mesma chave `["oauth_grants", uid]`), usado pela `IasSecao` e por `/me`; os aparelhos já têm o `useAparelhosDeCaptura`.
5. **As páginas novas não filtram por aparelho**: mostram a seção como está. Só o iPhone instalado chega a `/settings/lancar-pelo-iphone` pela Você.

## Não-objetivos
- Mudar o desktop.
- Mudar o conteúdo das seções (guia, empty state da IA, preferências).
- Cartão de incentivo para notificações.

## Anti-objetivos
- Os cartões de incentivo escondidos em subpágina.
- Cartão de venda para quem já usa o recurso.
- Cartão que pisca enquanto a lista carrega.
- Chamar Lançar pelo iPhone de "Siri".

## Restrições
- Design system do `AGENTS.md` (os cartões são composição de componentes que já existem; nada novo em `ui/`).
- Mudança de jornada: `docs/JORNADAS.md`, `docs/atlas/template.html`, `build.py`, republicar o Atlas.
- Rotas novas em `voceBackHref`/`isVoceTabActive` (Você acesa nas três) e no `rotas-do-convidado` se couber.
- Testes vitest; verificação no navegador a 375px.

## Do construtor
- Texto final do cartão de Lançar pelo iPhone, dentro da ideia acima.
- Onde mora o cartão (componente em `components/me/` ou `components/account/`), nomes.
- Se a página nova reusa o `SettingsSection` com ou sem o título dele.
