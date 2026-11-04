# Reativação: o app como hábito — design

Data: 2026-11-04. Pedido do dono: a seção "No celular" do computador some quando a pessoa usa o app instalado e volta quando ela para; "se a pessoa ficar 10 dias sem acessar o app, de duas, uma: ou ela não entendeu a importância do app, então é bom reforçar, ou ela desinstalou. Esse aplicativo, na teoria, é para ser usado diariamente; se a pessoa gasta diariamente, no máximo a cada dois dias." E: "crie todo um fluxo detalhado de reativação": um diálogo no primeiro acesso depois de muito tempo, no computador e no celular (navegador ou app), e uma notificação nativa se o app ainda estiver instalado.

## Intenção

O Finance é de uso diário: quem gasta todo dia lança todo dia, ou no máximo a cada dois dias. Dez dias sem abrir quer dizer que a pessoa não entendeu o valor do app ou o apagou. Nos dois casos, o Finance reforça o porquê e puxa de volta, sem virar chateação.

## Decisões do dono

1. **Prazo: 10 dias**, para tudo: a seção do computador volta e o diálogo de volta aparece.
2. **A seção "No celular" do computador** some enquanto houver uso do app instalado nos últimos 10 dias e volta depois; o texto não muda.
3. **O diálogo de volta** aparece no primeiro acesso depois de 10 dias sem acessar, em qualquer lugar (computador, celular pelo navegador, app instalado), reforçando o app.
4. **Notificação nativa de reativação** para quem ainda tem o app (ou o push ligado).

## O que muda

### O sinal (conta)
- `user_settings.ultimo_acesso_em timestamptz` — o último acesso, de qualquer lugar.
- `user_settings.app_aberto_em timestamptz` — a última abertura pelo app instalado (`useDisplayMode().isStandalone`).
- O front grava no máximo **uma vez por dia por aparelho** (uma marca local com a data, em `localStorage`; sem ela, grava na primeira carga com sessão). Grava as duas colunas quando aberto como app; só a primeira no navegador.
- **Antes de gravar**, o front lê o `ultimo_acesso_em` anterior: é ele que decide o diálogo de volta.
- Migração nova; as políticas de `user_settings` (cada um lê e atualiza a própria linha) já cobrem.

### A seção "No celular" no computador (`ThemeSettings`)
- Hoje aparece quando `useAparelhoDeLancar() === "computador"`. Passa a exigir também que `app_aberto_em` seja nulo **ou** mais velho que 10 dias.
- Enquanto a conta carrega, nada aparece (como o `"sabendo"` de hoje: nada pisca).

### O push recusado
- Em `_shared/web-push-send.ts`, quando uma inscrição volta 404/410 e é apagada (já acontece), e a pessoa fica **sem nenhuma** inscrição, o `app_aberto_em` dela vira nulo: a seção volta no computador na hora. *(Do construtor: com outra inscrição ainda viva, não mexe, porque pode ser o app.)*
- Vale para todas as Edges que mandam push (o envio é uma função só).

### O diálogo de volta (novo)
- Aparece uma vez, no primeiro carregamento com sessão em que o `ultimo_acesso_em` anterior tem **10 dias ou mais**. Quem nunca teve acesso registrado (a coluna nasce nula) **não** vê: o primeiro registro não é volta.
- Conteúdo pelo aparelho (`useAparelhoDeLancar`):
  - **app instalado** (iPhone ou Android): "Que bom te ver de volta" · "Põe os gastos em dia: quem lança todo dia sabe para onde o dinheiro vai." · ação principal **"Lançar um gasto"** (abre o lançamento, como o "+ Adicionar"), secundária **"Ver o que está a conferir"** (`/transactions?conferir=1`), e "Agora não".
  - **celular pelo navegador**: o mesmo título · "No app instalado você lança em segundos, direto da tela de início." · iPhone: **"Como instalar"** (abre o `InstallPwaSheet`); Android: o caminho pelo menu do navegador · "Agora não".
  - **computador**: o mesmo título · "O dia a dia do Finance é no celular: lá você lança na hora da compra." · o QR para abrir no celular (o mesmo de "No celular") · "Agora não".
- *(Do construtor: em componentes do design system, no estilo dos guias de Configurações, e não em wireframe: é um diálogo de reforço de telas que já existem, não uma funcionalidade nova da proposta funcional. O dono pode mandar para wireframe.)*

### A notificação de reativação (nova)
- Uma Edge nova, `reativacao`, chamada uma vez por dia pelo `pg_cron` às **12h de Brasília** (15h UTC), como o lembrete das 20h.
- Manda push para quem tem inscrição e está há **3 dias** sem acesso (`ultimo_acesso_em`) e, de novo, aos **7 dias**; depois para. *(Do construtor: o ritmo diário do dono — "no máximo a cada dois dias" — faz o 3º dia o primeiro sinal; o 7º, o último antes do diálogo dos 10.)*
- Textos: dia 3 — "Seus gastos estão esperando" / "Leva 10 segundos lançar o que você gastou desde terça."; dia 7 — "Uma semana sem lançar" / "Abra o Finance e ponha o mês em dia." (o dia da semana sai do `ultimo_acesso_em`, em pt-BR). Tocar abre o app no Painel.
- Dedupe: uma tabela `reativacao_envios (user_id, marco smallint, referente date)`, chave nos três, onde `referente` é a data do `ultimo_acesso_em`: um novo acesso muda a referência e rearma os dois avisos. Só a service role lê e grava.
- Respeita o interruptor de notificações da pessoa (as preferências que o lembrete das 20h já lê). *(Do construtor: usa a mesma chave do lembrete das 20h, `notify_review`, por ser o aviso de "pôr em dia"; uma chave própria fica para depois.)*

## Fora
- E-mail de reativação.
- Medir quantos voltaram (fica para o Bloco de métricas).
- Mudar o lembrete das 20h.

## Anti-objetivos
- Diálogo de volta para quem acabou de criar a conta, ou em todo acesso.
- Mais de dois pushes de reativação por ausência.
- Uma escrita no banco a cada navegação.
- A seção do computador piscar enquanto a conta carrega.

## Restrições
- O banco de desenvolvimento é o de produção: a migração e o deploy das Edges (`reativacao`, e as que usam `web-push-send.ts`) só vão ao ar com o pedido do dono na hora; a Supabase CLI roda fora do sandbox; nunca `supabase config push`.
- Design system do `AGENTS.md`; jornadas: `docs/JORNADAS.md`, o template do Atlas, o `build.py` e a republicação.
- Testes: vitest para o front e Deno (`npm run test:edge`) para a Edge.

## Respostas da revisão (do construtor, para o dono conferir)

1. **Interruptor e carteira do push:** o aviso vai se a pessoa tem `notify_review` ligado em **qualquer** carteira de que é membro; o `workspace_id` do aviso (e do link do Painel) é o `user_settings.current_workspace_id`, ou a primeira carteira dela se estiver vazio.
2. **A linha de `user_settings` pode não existir:** a gravação diária chama o `ensureUserSettingsRow` (`src/lib/settings.ts`, o mesmo do Lançar ao pagar) antes do `update`. O diálogo só aparece com um `ultimo_acesso_em` anterior **não nulo**; sem linha ou sem data, é o primeiro registro e não há diálogo.
3. **Sem push, só o prazo decide:** quem nunca ligou as notificações não tem 410; para essa pessoa, a seção volta depois dos 10 dias sem abrir o app. Aceito.
4. **Onde o diálogo mora:** na casca do app (`(app)/layout`), depois do login, uma vez por sessão, em qualquer rota. Se outro diálogo estiver aberto quando ele for aparecer (o tour, o assistente de categorias, um guia), ele não aparece nesta sessão; a gravação do acesso acontece igual, então ele não volta a tentar até a próxima ausência de 10 dias.
5. **Dias em Brasília e o cron perdido:** os dias contam pela data de Brasília (`America/Sao_Paulo`). O aviso do 3º dia vai para quem está entre 3 e 6 dias sem acesso e ainda não o recebeu nesta ausência; o do 7º, para quem está entre 7 e 9. Um dia de cron perdido só atrasa o aviso, sem duplicar.

## Do construtor
- Nomes de componentes, hooks e funções; o texto final dos botões dentro das ideias acima; a forma exata do dedupe e do cron.
