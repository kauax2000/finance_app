# Busca global do app (⌘K) — design

Data: 2026-10-16. Arquivo central: `src/components/layout/app-command-palette.tsx`.
As decisões do dono estão marcadas **(dono)**. As outras são do Claude **(Claude)**,
e o dono as revisa ao ler este documento.

## Intenção

Hoje a paleta do app (⌘K e a busca do cabeçalho) acha 10 telas e 4 ações. Para
achar uma categoria ou um cartão, é preciso entrar antes em "Categorias…" ou
"Cartões…". Digitar "Mercado" na raiz devolve "Nada encontrado". O pedido do dono:

> tudo que estiver dentro do app deve ser encontrado pela pesquisa — transações,
> cartões, compras parceladas…

O critério de sucesso: a pessoa digita na raiz o que lembra (um nome, um valor,
um mês) e o item aparece, e a escolha leva ao detalhe dele.

## Metas

1. **A busca acha tudo, direto na raiz (dono)**, numa lista só, agrupada por tipo:

   | Grupo | O que casa | Ao escolher | Fonte |
   |---|---|---|---|
   | Telas | nome + sinônimos | a rota | lista fixa |
   | Ações | nome + sinônimos | o formulário | ganchos da casca |
   | Transações | descrição, valor, data, nome da categoria, nome do cartão | `/transactions?txn=id` (abre o detalhe) | **consulta ao banco** |
   | Cartões | nome, 4 últimos dígitos | `/credit-cards/id` | `useCreditCardsQuery` (cache) |
   | Categorias | nome (+ "receita"/"despesa") | `/categories/id` | `useCategoriesQuery` (cache) |
   | Compras parceladas | descrição, valor da parcela | `/transactions?plan=id` | `useInstallmentPlansQuery` |
   | Assinaturas | nome, valor | `/transactions?sub=id` | `useSubscriptionsQuery` |
   | Contas a pagar | nome, valor | `/bills?detail=id` | consulta leve (abaixo) |
   | Membros | nome, e-mail | `/members` | `useMemberDirectoryQuery` |
   | Carteiras | nome | troca a carteira atual (`setCurrentWorkspaceId`) | `useWorkspacesQuery` |

2. **Transações se acham "por tudo" (dono)**: descrição, valor e data, e também
   pela categoria e pelo cartão delas (Claude). O termo é partido por uma função
   pura, `parseBuscaTransacoes(texto, hoje)` (Claude), em `src/lib/`:
   - **Valor**: `150`, `150,00`, `1.234,56`, `R$ 150`. Com centavos, o valor é
     exato. Sem centavos, vale o intervalo `[150, 151)`. Um número de 4 dígitos
     entre 1900 e 2099 que vem colado a um mês é ano; sozinho, é valor.
   - **Data**: o nome do mês em português, por extenso ou abreviado, com ou sem
     acento (`março`, `marco`, `mar`), com ano opcional (`março 2026`,
     `mar/26`). Também `dd/mm`, `dd/mm/aaaa` (o dia) e `mm/aaaa` (o mês). Um
     mês sem ano é a ocorrência mais recente até o mês atual: em outubro de
     2026, "dezembro" é dezembro de 2025. Um `dd/mm` sem ano segue a mesma
     regra, até hoje (Claude).
   - **O resto é texto**: casa a descrição (`ilike`, com `%` e `_` escapados,
     como em `fetchTransactionsListPage`) **ou** a categoria **ou** o cartão
     cujo nome casa o texto. Os ids das categorias e dos cartões saem do cache
     no cliente (`.or(...)` com `in.(…)`).
   - Os pedaços se somam: "mercado março" são as transações de março com
     "mercado".
   - A consulta acontece só com 2 caracteres ou mais (ou com um valor ou uma
     data reconhecidos), com espera de 250ms depois da última tecla. Traz as **8
     mais recentes** (`date` desc) e só as colunas da linha. Fica no cache do
     React Query pela chave do termo partido, e a requisição antiga é cancelada.
   - Embaixo do grupo, **"Ver todas em Transações"** abre a lista já filtrada,
     com o que o parse achou levado aos parâmetros que ela já lê (`q`, `from`/`to`
     com o `preset` que a lista exigir, `min`/`max`). **A lista não reproduz o
     "ou" da paleta (Claude)**: o `q` dela filtra só a descrição, e `cats`/`card`
     somariam com ele em vez de alternar. O link leva o texto como `q` e aceita a
     diferença: quem achou pela categoria vê, na lista, as transações com aquele
     texto na descrição. Valor sem centavos vai como `min=150&max=150,99`; com
     centavos, `min` e `max` iguais.
   - A linha mostra a descrição, a data curta e o valor com sinal
     (`signedCurrencyBRL`), e o ícone de entrada ou saída.

3. **Organização (Claude)**:
   - **Campo vazio**: Recentes, Ações, Ir para. A tela que já está nos Recentes
     não se repete em "Ir para" (a mesma regra da paleta do catálogo).
   - **Com texto**: os grupos na ordem da tabela acima, e só os que têm
     resultado. Os grupos locais mostram até 5 linhas, escolhidas pela nota do
     `commandFilter`. As transações mostram até 8.
   - **As sub-páginas "Categorias…" e "Cartões…" saem**: a raiz faz o trabalho
     delas. `CommandPages` sai da paleta do app se nada mais o usar.
   - **Sinônimos (Claude)**, como `keywords` do item: Transações ← lançamentos,
     gastos, extrato, movimentações; Cartões ← fatura, crédito; Contas a pagar ←
     boletos, despesas fixas, vencimentos; Assinaturas ← recorrentes, mensalidades;
     Painel ← início, resumo, dashboard; Configurações ← ajustes, preferências;
     Planos e pagamentos ← assinatura do app, cobrança; Membros ← convidar,
     pessoas. Nova despesa ← gasto, saída; Nova receita ← entrada, salário.
   - **Ações novas**: Nova categoria (`openCategoryCreate`) e Novo cartão
     (`openCreditCardCreate`), que a casca já tem.
   - **Telas novas**: Sessões ativas e Atividade da conta. **Notificações não
     tem rota** (`ROUTES.NOTIFICATIONS` existe, mas a página não): é o painel do
     `NotificationsUiProvider`. Ela entra em "Ir para" como item que abre o
     painel (`open`/`toggle` do provider), e não entra nos recentes (Claude).
   - **Trocar de carteira** faz o que o `WorkspaceSwitcher` já faz ao trocar
     (mesma função, mesmo destino depois da troca); a carteira atual não aparece
     na lista (Claude).
   - **Recentes** guardam o `href` de qualquer destino que se resolve pelo cache
     (tela, categoria, cartão, parcela, assinatura, conta). O mapa `destinos`
     passa a incluir parcelas, assinaturas e contas; as consultas delas ligam
     com a paleta aberta (e não só com texto), para o nome do recente se
     resolver. Um recente que não se resolve some, como hoje. Transação não entra
     nos recentes: o nome dela não está em cache.
   - **Uma transação escolhida de outra tela** navega para
     `/transactions?txn=id`; a lista lê o parâmetro, busca a linha se ela não
     estiver na página atual e abre o detalhe (`use-transactions-list-controller`,
     comportamento existente).

4. **Estados (Claude)**:
   - **Carregando**: só o grupo de transações espera, numa linha de
     carregamento dentro do grupo. Os grupos locais aparecem na hora.
   - **Erro ou offline** na consulta: o grupo mostra "Não deu para buscar
     transações agora." numa linha que não se escolhe, e o resto funciona.
   - **Vazio total**: "Nada encontrado para '…'", e a descrição diz que a busca
     cobre telas, ações, transações, cartões, categorias, parcelas, assinaturas,
     contas, membros e carteiras.

## Fora (não-metas)

- **Sem mudança de visual**: as mesmas peças do `Command` (`CommandItem`,
  `CommandItemIcon`, `CommandItemMeta`, `CommandItemDescription`,
  `CommandHighlight`). Nada em `src/components/ui/` nem em `globals.css`.
- Sem busca no servidor para o que já está em cache.
- Trocar o tema e sair da conta ficam fora (Configurações e o menu da conta
  cobrem).
- Sem índice novo no banco nem migração. Se a consulta de transações ficar
  lenta, um índice de trigrama em `description` é o próximo passo, numa mudança
  separada.
- A paleta do catálogo (`ds-search.tsx`) não muda.

## Anti-metas

- **Nunca gravar no banco**: o banco de desenvolvimento é o de produção. A
  busca só lê.
- Uma tecla não pode disparar uma consulta (espera e cancelamento).
- O campo não pode pular de lugar enquanto os resultados chegam (a paleta já
  fixa o topo, e isso fica).
- Um resultado do servidor não pode sumir por causa do filtro de texto do cmdk:
  "150" casa pelo valor, e não pelo nome. As linhas do servidor precisam passar
  pelo filtro (`keywords` com o termo, ou `forceMount`), sem que o cmdk as
  reordene acima das telas.

## Restrições

- Next.js 16 (ler `node_modules/next/dist/docs/` antes de mexer em rota), React
  Query, Supabase JS, cmdk pelo `Command` do design system.
- **É mudança de jornada** (a paleta abre destinos novos): atualizar
  `docs/JORNADAS.md` (a seção da busca, o fluxograma e a tabela de regras),
  `docs/atlas/template.html`, rodar `python3 docs/atlas/build.py` e republicar o
  Atlas em https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL.
- A consulta de contas a pagar é leve: `bills` com `id, name, amount`
  (e o que a linha mostrar), pelo `workspace_id`, só com a paleta aberta. Ela reaproveita o cache do bundle de contas se ele já estiver
  carregado (Claude).
- Os textos são em português, no tom dos atuais.
- Testes: o parse é uma função pura com testes de unidade (valor, data, mês sem
  ano virando o ano anterior, texto que sobra, combinações, termos ambíguos).
  Um teste de fonte confere os grupos, as ações novas e os destinos.
- `npx tsc --noEmit && npm run lint && npm run test:unit` passam.

## Fica com quem constrói

- A forma exata da consulta no PostgREST (`.or` com `ilike` e `in`).
- Como o cmdk ordena os grupos e os itens do servidor (`shouldFilter` por grupo,
  `forceMount`, `keywords`).
- Os ícones de cada grupo, do conjunto `16/solid`.
- Como os ganchos de busca se dividem em arquivos (hook de transações em
  `src/lib/queries/`, o parse em `src/lib/`).
