# Guia do atalho: passo 1 com o celular no palco — desenho

Data: 19/11/2026 · Branch `finance-app-2.0` · Mockup aprovado pelo dono:
`scratchpad/mock/passo1f.html` (opção "C, versão 3", sem o Cancelar).

## Por quê

O passo 1 do `GuiaDoAtalho` ("Como você vai usar?") tinha dois cartões pequenos e um
vão grande embaixo (a caixa do guia mede o maior passo). O dono quer que a tela
mostre o que cada modo faz, com o celular em destaque.

## Decidido com o dono (no mockup)

- **Ordem, de cima para baixo**: título "1 · Como você vai usar?" → o celular
  flutuante → a legenda de vidro → o seletor Voz | Toque → uma frase → os pontos e
  o botão.
- **O celular**: grande, sem caixa nem moldura de cartão, solto no topo, com mais
  respiro abaixo do título; a parte de baixo some num degradê. Só o que ele mostra
  troca com a escolha.
- **A legenda de vidro, numa linha só**:
  - Voz: o orbe da Siri à esquerda e "E aí Siri, Lançar gasto".
  - Toque: o ladrilho do lugar escolhido, o nome do lugar e, à direita, quatro
    ícones (Botão de Ação, Costas, Bloqueio, Ícone) que trocam o lugar e a tela.
- **O seletor Voz | Toque** embaixo da legenda; nada muda de altura entre os dois.
- **A frase** diz o que acontece e o atalho instalado ("… Instala Lançar gasto
  rápido.").
- **Sem Cancelar** embaixo (o ✕ do topo basta). O botão diz "Continuar com Voz" ou
  "Continuar com Toque".
- **Passo 2**: o nome sugerido termina com o modo ("iPhone de Kauã · Voz"), e uma
  linha diz o atalho que vai ser instalado ("O atalho se chama Lançar gasto rápido").

## Decisões minhas

- **Seletor**: `ToggleGroup variant="segmented"` do design system, que já tem o
  marcador que viaja. Nenhuma peça nova em `src/components/ui/`.
- **Ícones dos lugares**: `ToggleGroup` com itens só de ícone (`16/solid`, cada um
  com `aria-label`), dentro da legenda.
- **Legenda de vidro**: composição no próprio guia com a tinta flutuante do sistema
  (`menuPanelTintClassName` de `lib/glass-classes`) e `rounded-surface`; ladrilho do
  lugar em `rounded-row` com `bg-foreground text-background`.
- **O celular**: um tamanho novo, `palco`, na `JanelaDoAparelho`
  (`components/account/passo-a-passo.tsx`): mais alto, âncora no topo, degradê na
  base, sem o alvo pulsando. Os fantasmas da `CaixaDoPasso` reservam o mesmo lugar.
- **Orbe da Siri**: um SVG desenhado (não o logo da Apple), num arquivo próprio em
  `components/account/`, com `aria-hidden`; entra em `DRAWN_SVG_FILES` do auditor
  como pictograma pedido pelo dono.
- **"Continuar com …"**: o rótulo do botão do passo 1 segue o modo; nos outros passos
  continua "Próximo".
- **Lista de aparelhos**: se o nome já termina em " · Voz" ou " · Toque", a legenda
  não repete o rótulo do gatilho.
- **Nome sugerido**: muda com o modo enquanto a pessoa não editou o nome e o código
  não foi criado; "Baixar de novo" mantém o nome do aparelho.
- O caminho em Ajustes de cada lugar continua no último passo.

## Fora

- Mudança de banco, Edge ou arquivos `.shortcut`.
- Mudar componentes em `src/components/ui/` ou tokens.

## Verificação

`conta.test.ts`, `tsc`, `lint`, `ds:audit` do guia e de `passo-a-passo.tsx`; no
iPhone, o dono confere o passo 1 nas duas escolhas.
