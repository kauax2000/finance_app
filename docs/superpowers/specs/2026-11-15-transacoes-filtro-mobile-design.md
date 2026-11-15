# Transações: a linha de filtros sai do telefone — design curto

**Pedido (15/11/2026):** no telefone, tirar da tela de Transações a linha do
`FilterBar` ("+ Filtro", as pílulas e a contagem "N lançamentos"), porque o
botão de filtro do canto de cima à direita do cabeçalho já abre os filtros.

**Por quê:** a linha repete o que o cabeçalho já oferece e ocupa a altura da
tela antes da lista.

## Decisões do dono

- **Opção A:** abaixo de 768px a linha some **sempre**, mesmo com filtro ativo.
  O botão do cabeçalho já mostra o ponto de ativo (`ToolbarFilterIndicator`,
  `app-header.tsx`), e ver ou remover um filtro se faz na gaveta "Filtrar por…".
- A contagem "N lançamentos" deixa de aparecer no telefone (aceito).

## Abordagens

- **Esconder por CSS, montado** (escolhida): `max-md:hidden` no invólucro
  `raizDosFiltros` de `transacoes-toolbar.tsx`. O `FilterBar` continua no DOM,
  e o atalho do cabeçalho (`usePageChromeFilter` → `onOpen` clica no
  `[data-slot=filter-bar-add]` de dentro dele) segue abrindo a gaveta, que no
  telefone é o `Popover mobile="sheet"` e não precisa de âncora visível.
- **Desmontar no telefone:** exigiria o `FilterBar` abrir a gaveta por uma prop
  `open` controlada, mudança em `src/components/ui/` (invariante 6) maior e sem
  ganho para o pedido.

## O que muda

1. `transacoes-toolbar.tsx`: o invólucro do `FilterBar` ganha `max-md:hidden`
   (o mesmo corte de `useIsMobile`, 48rem). No desktop nada muda.
2. `transactions-page-skeleton.tsx`: o osso do `FilterBarSkeleton` some no
   telefone (o mesmo `max-md:hidden`), continuando no arquivo.
3. Teste de fonte em `page-client.test.ts`: tranca o `max-md:hidden` no
   invólucro com `ref={raizDosFiltros}`, o `FilterBar` ainda montado dentro dele
   e o clique em `[data-slot=filter-bar-add]`; e o osso escondido no telefone.
4. `docs/JORNADAS.md` ("Filtros da lista") e `docs/atlas/template.html`
   ("Lista"): no telefone a linha fica escondida e o filtro mora só no botão do
   cabeçalho; build e republicação do Atlas.

## Não metas

- Mudar o `FilterBar`, o cabeçalho, o indicador ou a gaveta.
- Mostrar os filtros ativos em outro lugar no telefone.

## Conferir

A 375px: a linha não aparece; o botão do cabeçalho abre "Filtrar por…";
escolher um filtro acende o ponto no botão e filtra a lista; no desktop a linha
segue igual.
