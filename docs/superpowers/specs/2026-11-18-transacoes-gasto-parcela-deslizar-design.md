# Transações: gasto sem vermelho, parcela embaixo e deslizar a linha

Pedido do dono (18/11/2026): aplicar as melhorias 1, 5 e 6 da revisão da tela de Transações no
telefone. Decisões dele: o gasto sem vermelho vale no celular e no computador; deslizar mostra
Editar e Excluir, sem deslize total.

## Intenção

Deixar a lista mais calma e mais próxima dos apps de iOS (Monzo, Copilot, Revolut), e tornar as
ações da linha fáceis de descobrir no telefone.

## 1. O gasto sem vermelho

- Na lista de Transações (tabela do computador e gêmeo do telefone):
  - o gasto fica na cor do texto (`text-foreground`), com o sinal de menos;
  - a entrada continua verde (`text-income`), com o mais.
- **Como:** um tom novo no `TableCellMoney` / `col.money` do `DataTable`, `tone="income"`: só o
  positivo ganha cor. Os tons de hoje (`sign`, `none`) não mudam, e só Transações usa o novo.
- **Fora:** o resto do app (Painel, Categorias, detalhe do lançamento), que segue com o vermelho
  até alguém pedir.

## 5. A parcela na segunda linha

- **Título no telefone:** sem o "(2/3)" que o banco grava no fim da descrição: "Botox Renata". É a
  mesma regra que a tabela do computador já usa (`descricaoNaTabela`).
- **Segunda linha:** ganha "2 de 3" depois da categoria: "Renata · 2 de 3 · Bradesco Visa Infinity".
  O número sai do mesmo "(n/m)" da descrição.
- **Computador:** não muda, porque o chip "Parcelada 1/2" já diz a parcela.

## 6. Deslizar a linha

- **O gesto:** no telefone, arrastar a linha para a esquerda revela as ações dela à direita:
  - Confirmar, quando o lançamento está a conferir;
  - Editar;
  - Excluir, em vermelho.
  São as mesmas `rowActions` do toque longo, nas mesmas condições: as linhas previstas não deslizam.
- **Abrir e fechar:**
  - passou da metade da largura das ações, a linha abre; menos que isso, volta;
  - tocar fora, rolar a lista ou abrir outra linha fecha a que está aberta;
  - só uma linha fica aberta por vez.
- **Sem deslize total:** puxar até o fim não executa nada. Excluir segue pedindo confirmação.
- **Não briga com a rolagem:** o gesto só vale para o dedo (`pointerType === "touch"`) e só depois
  de o movimento se mostrar horizontal (trava de direção nos primeiros 8px). O toque simples ainda
  abre o lançamento, e o toque longo ainda abre o menu.
- **Movimento:** a linha anda com o dedo e assenta na mola do sistema (`MOLA`). Com movimento
  reduzido, assenta sem mola.
- **Como:** uma prop nova no `DataTable`, `mobileSwipe`, só no gêmeo do telefone. Transações liga.
  O Importar e o catálogo não mudam.
- **Acessibilidade:** os botões revelados só são focáveis com a linha aberta. Quem não desliza
  continua com o toque longo e o menu.

## Abordagens

1. **Escolhida:** os três itens no design system onde já moram (`col.money` e o gêmeo do
   `DataTable`), ligados por prop só em Transações. Cada peça fica reaproveitável e o resto do app
   não muda.
2. Escrever o deslize e a cor só na tela de Transações. Recusada: viola "nenhuma tela escreve o
   gêmeo do telefone à mão".
3. Trocar o vermelho por padrão em todo `col.money`. Recusada: mudaria outras telas sem pedido.

## Restrições

- `src/components/ui/` está autorizado por este pedido. O componente ganha o exemplo na página do
  catálogo (`/designsystem/data-table`), e a mudança é registrada no `AGENTS.md` e no histórico.
- Só tokens. Excluir usa `destructive`. Os botões revelados têm 44px de alvo no mínimo.
- Testar no app real sem gravar: o banco é de produção. Deslizar e abrir o Excluir até a confirmação
  pode, mas confirmar não.
