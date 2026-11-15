# Telefone: telas de aba sem título — design curto

**Pedido (15/11/2026):** o dono não gosta do título grande (Ledger, 34px) que
abre as telas de aba no telefone. Pesquisa no Mobbin
(https://claude.ai/artifact/7h9zKndtHUhuujV3tPUHX6) trouxe três caminhos.

## Abordagens

- **A · título na barra, carteira embaixo dele** (Lloyds, Starling, Monarch).
- **B · título grande menor, sem serifa** (Mercury, Coinbase).
- **C · sem título** (Wise, Vivid, Cash App) — **escolhida pelo dono**: a aba
  acesa na barra de baixo já diz onde a pessoa está, e o conteúdo começa logo
  abaixo da barra.

## O que muda

- Abaixo de 768px, as telas sem voltar (Painel, Transações, Categorias e as
  demais de aba) não desenham o título grande. A barra de cima fica igual, com a
  carteira no centro, e ao rolar nada sobe para ela.
- **Não muda:** a subpágina (toda rota com voltar) segue com o nome na barra
  depois de rolar; Membros e as telas de configuração da Você seguem com o nome
  fixo na barra (`ROTAS_COM_TITULO_NA_BARRA`); `/me`; o desktop; o `<h1>`
  escondido da barra para o leitor de tela.
- **Como:** `TituloDaTela` (`src/components/layout/titulo-da-tela.tsx`) devolve
  `null` fora da subpágina; o efeito que publica o nome da subpágina na barra
  fica. Os testes `titulo-da-tela.test.ts` e `settings-rotas.test.ts` passam a
  trancar a ausência do título nas telas de aba.
- **Docs:** `AGENTS.md` (Page chrome), `docs/JORNADAS.md` ("Nome da tela e
  voltar"), Atlas, a memória "header em toda tela revisada" e a regra do
  `CLAUDE.md` sobre o título grande, que o dono autorizou trocar.

## Não metas

- Mudar a barra de cima, a `BottomBar` ou o `PageHeader` do design system.
- Mudar o desktop.

## Conferir

A 375px, em cada aba (Painel, Transações, Categorias): sem título, o primeiro
bloco com respiro certo abaixo da barra, a carteira parada ao rolar. Uma
subpágina (detalhe da categoria) ainda mostra o nome na barra ao rolar.
