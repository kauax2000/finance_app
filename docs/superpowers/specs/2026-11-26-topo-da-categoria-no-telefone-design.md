# Topo da categoria no telefone — design

## Intenção

No telefone, o detalhe da categoria abre direto em "Este mês" com o ⋯, sem dizer qual categoria é. O dono quer o
cabeçalho do desktop também no telefone, **como a gaveta do lançamento**: um topo que mostra qual é a categoria e
que, ao rolar, sobe para a barra de cima. Opção escolhida (mockup `public/topo-da-categoria.html`, opção **A**):

```
 [←]   ⌂ Carteira de Kauã ⌄   [⌕|▦|⋯]        rolada:  [←]  [🚗] Carro  R$ 4.114  [⌕|▦|⋯]
            [🚗]  (ladrilho 2xl)
             Carro
          R$ 4.114,39
 Gasto em novembro · ↑10% que no mesmo dia de outubro
 Deve fechar em R$ 4.114 · nada mais previsto até o dia 30
 ──────────────●─────── (régua da média)
 [ Leitura do mês … ]
```

## Objetivos

- Abaixo de 768px, o detalhe da categoria abre com o topo centralizado da gaveta: ladrilho grande, nome, o valor do
  mês grande e a legenda ("Gasto em <mês> · <variação>").
- Quando o nome sai de vista sob a barra, a barra mostra no centro o ladrilho pequeno, o nome e o valor curto, como o
  cabeçalho da gaveta (`DialogHeaderRow center`, `transaction-detail-sheet.tsx`). Voltando ao topo, ele desce.
- O resumo do telefone perde o título "Este mês" e o valor (estão no topo) e fica com "Deve fechar" e a régua.
- O ⋯ da categoria (Editar, Excluir…) vai para a barra, na cápsula junto da lupa e do calendário do mês.

## Fora do escopo

- O desktop não muda: o `PageHeader` à esquerda com ‹, ladrilho, nome, a pílula do mês e o ⋯, e a faixa do mês abaixo.
- Outras subpáginas (Cartões, Contas a pagar…) não adotam agora; a peça fica pronta para elas.
- Nenhuma rota, link ou destino muda (não é mudança de jornada).

## Anti-objetivos

- O nome e o valor não podem aparecer duas vezes ao mesmo tempo na tela (no topo e na barra).
- A barra rolada não pode empurrar a lupa e o calendário para fora: nome longo corta com "…".
- Nada de vidro novo nem View Transitions; a subida usa o mecanismo que já existe.

## Abordagens consideradas

1. **Escolhida: o `PageHeader` ganha a forma centralizada no telefone** (`phone="hero"`). É o mesmo cabeçalho do
   desktop; abaixo de 768px vira o topo da gaveta e sobe para a barra pelo que o `collapse` já faz
   (`useTituloQueSobe` → `publishPageTitle` → `TopBarTitle pageTitle`). Reaproveitável pelas outras subpáginas.
   Mexe no design system — coberto pela autorização permanente do dono (invariante 6), com o registro completo
   (invariante 8).
2. Peça só desta tela em `components/categories/detail/`, com a subida à barra feita à mão: duplica o `collapse`.
3. Hero escrito na tela e a barra só com o nome em texto: não entrega a barra da opção A.

## Como funciona (decidido)

- **`PageHeader`** (`src/components/ui/page-header.tsx`) ganha `phone?: "default" | "hero"`. Com `"hero"`, abaixo do
  `md`: a linha do título vira coluna centralizada; a `media` do `PageHeaderTitleRow` aparece acima do nome no degrau
  grande (`ColorTile size="2xl"`, o da gaveta — a tela passa o ladrilho, e o tamanho no telefone é da peça); o
  `back` e o `PageHeaderActions` não aparecem no telefone (o ← já está na barra; o mês e o ⋯ também).
  O título no telefone segue a gaveta (texto de título da folha, não a serifa de 34 do `collapse`).
- **Valor e legenda do topo**: uma peça nova `PageHeaderHero` (filha do `PageHeader`) que só aparece na forma hero
  do telefone e some do `md` para cima, onde esse conteúdo já mora na faixa do mês. A tela passa o
  `MoneyDisplay` e a legenda.
- **A subida à barra no telefone**: a loja `PageTitleDock` (`src/hooks/use-page-title-dock.ts`) ganha
  `trailing?: React.ReactNode` (o valor curto). O `TopBarTitle pageTitle` passa a mostrar `media` e `trailing`
  também no telefone **quando quem publicou é um hero** (as outras telas seguem só com o texto no telefone).
  O momento de subir é o do `collapse`: o nome sai de vista sob a barra.
- **O ⋯ na barra**: a tela publica o menu da categoria para o cabeçalho do telefone, que o desenha na cápsula depois
  da lupa e do calendário (hoje o `TopBarActionGroup` leva até dois; passa a aceitar três). Mesmo menu
  (Editar, Excluir…), mesma escala de toque. Some quando a tela desmonta.
- **Detalhe da categoria** (`src/app/(app)/categories/[categoryId]/page-client.tsx`): o `PageHeader` passa a ser
  desenhado também no telefone, com `phone="hero"`, o ladrilho, o nome e o `PageHeaderHero` com o valor do mês e a
  legenda que hoje o `ResumoDoMes` mostra. O `ResumoDoMes` no telefone deixa de mostrar o título "Este mês", o ⋯ e
  o valor; fica com "Deve fechar", a régua e o que mais já tem abaixo.
- **Esqueleto**: o `CategoryDetailSkeleton` no telefone ganha o topo centralizado (ladrilho, nome, valor, legenda) no
  lugar do título "Este mês" e do valor.

## Restrições

- Tokens e escala do design system (raio do ladrilho pelo degrau, cores por token, `--duration-*`/`--ease-*`).
- Componente novo ou prop nova entra completo (invariante 8): `registry.ts`, página do `PageHeader` no
  `/designsystem` (a forma hero no `IphoneFrame`), `page-header-versions.test.ts`/teste próprio, `ds:docs-map`,
  bullet no `AGENTS.md`, rodada no histórico.
- Toque: alvos de 44 na barra; a cápsula de três mede o mesmo degrau das de dois.
- `npx tsc --noEmit && npm run lint && npm run test:unit` e `npm run ds:audit` na tela e nas peças.
- A regra "subpágina sem título no telefone" (CLAUDE.md) ganha uma exceção nomeada: a forma hero.

## Decisões tomadas na revisão (minhas, para o dono conferir)

- **Quando sobe**: o mesmo gatilho da gaveta (`useDialogHeaderDock` → `nomeSubiu`): quando o **nome** passa sob a
  barra. O valor ainda pode estar à vista embaixo por alguns pixels, como acontece na gaveta hoje.
- **O ⋯ chega à barra** por um slot novo no `page-chrome-provider`, no molde do `usePageChromeFilter`:
  `usePageChromeMenu(node)`, em que a tela publica o `DropdownMenu` já montado (memorizado). O cabeçalho o desenha
  como terceiro filho da cápsula, depois da lupa e do calendário, **parado**: ele nasce com a rota, sem o gesto de
  pingar da lupa. O calendário do mês (`useMonthInHeader`/`mobileHeaderFilterFor`) não muda.
- **Os dados do topo**: a tela já calcula o lançado e a comparação para o `ResumoDoMes`; ela mesma passa o valor e a
  legenda ao `PageHeaderHero`. A faixa do desktop não muda.
- **A loja**: `trailing` é **texto** (`string`, o valor curto), para a comparação por igualdade não republicar a cada
  render; a `media` segue nó memorizado por quem publica, como hoje. A loja ganha `form?: "hero"` para o
  `TopBarTitle` saber que mostra ladrilho e valor no telefone.
- **`TituloDaTela`**: com um hero na tela, ele não publica o nome em texto (senão a barra mostraria o nome antes do
  topo subir). Quem publica é o `PageHeader`.
- **Ladrilho**: `2xl` (44), o mesmo da gaveta.
- **Jornadas**: o ⋯ só muda de lugar na tela; os destinos (Editar, Excluir) são os mesmos. Não é mudança de jornada.
- **Transição**: o topo é conteúdo da página real, então o `TransicaoDeSubpagina` já o espera sem mudança.

## Fica para quem constrói

- O nome exato da peça do valor (`PageHeaderHero`) e da prop (`phone`), se outro encaixar melhor no catálogo.
- O texto curto do valor na barra (sem centavos, como "R$ 4.114").
- Como o `TopBarTitle` reconhece que veio de um hero (um campo na loja, por exemplo `form: "hero"`).
- O respiro entre a barra e o ladrilho e entre o topo e o "Deve fechar", medidos contra a gaveta.
