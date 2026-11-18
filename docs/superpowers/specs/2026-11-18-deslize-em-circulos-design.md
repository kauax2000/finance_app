# Botões do deslize em círculos

Pedido do dono (18/11/2026): os botões que aparecem ao deslizar uma linha de Transações no telefone
ficam redondos, como no iOS. Ele escolheu a opção A do artefato "Botões do deslize"
(https://claude.ai/artifact/6VHtQb6B9XLVgH1zaCfsKC): círculos só com ícone.

## Como fica

- **O círculo:** cada ação é um círculo de 44px, com o ícone de 20 no centro e sem texto. O nome
  vai para o `aria-label` ("Editar Mercado, 17/11").
- **Distâncias:** os círculos ficam a 8px um do outro e a 8px da borda direita, centrados na
  altura da linha. A faixa das ações mede `n × 44 + (n + 1) × 8`: 104px com duas ações, 156px com
  três.
- **Cores:** Excluir em `bg-destructive` com `text-destructive-foreground`. Editar e Confirmar em
  `bg-secondary` com `text-secondary-foreground`. O fundo atrás dos círculos é o do cartão,
  nunca colorido.
- **Crescer com o arraste:** o círculo cresce com o arraste, de `scale(0.4)` com opacidade 0,
  quando a linha começa a andar, até `scale(1)` com opacidade 1, quando a faixa está toda à vista.
  Ele segue a posição da linha (`-x / larguraDaFaixa`) e não tem animação própria. Com a linha
  aberta, fica inteiro.
- **Toque:** escurece ao pressionar (`active:brightness-90`). O alvo de toque é o próprio círculo
  de 44.
- **O resto do deslize não muda:** abre além da metade, uma linha aberta por vez, sem deslize
  total, Excluir com confirmação.

## Abordagens

1. **Escolhida:** mudar a forma dentro do deslize que já existe (`mobileSwipe`), no
   `data-table.tsx`. O crescimento é escrito pelo mesmo `mover` que já move a linha, numa
   variável `--deslize` (de 0 a 1) na faixa.
2. Uma animação por CSS ao abrir. Recusada: o iOS acompanha o dedo, e a animação chegaria
   atrasada em relação ao arraste.

## Restrições

- `src/components/ui/` está autorizado por este pedido. Só tokens.
- Na mesma mudança: o `AGENTS.md`, o histórico (rodada 402) e o exemplo do catálogo.
