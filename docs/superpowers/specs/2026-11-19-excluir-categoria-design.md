# Excluir categoria como excluir lançamento — desenho curto

Data: 19/11/2026. Pedido do dono: melhorar o diálogo "Excluir categoria?", deixando-o igual ao de excluir lançamento.

## Hoje

O título é genérico ("Excluir categoria?"). Embaixo vêm o aviso "Esta ação não pode ser desfeita.", a frase "A categoria "Carro" será removida." e uma lista de dois pontos.

## Como fica (espelho do `ExcluirLancamentosDialog`)

```
Excluir Carro?
Sai da carteira e não dá para desfazer.
┌──────────────────────────────────────────┐
│ [ladrilho]  Carro                        │
│             Despesa · limite de R$ 800   │
└──────────────────────────────────────────┘
Os lançamentos com Carro ficam no extrato, sem categoria, até você
escolher outra. O limite dela sai junto.
                                [Cancelar]  [Excluir]
```

- **Título:** "Excluir <nome>?".
- **Descrição:** "Sai da carteira e não dá para desfazer."
- **Cartão:** `Card padding="none"` com um `Item` só, como as linhas do lançamento. Ele tem o `ColorTile` com o ícone, o nome e o detalhe, que é o tipo ("Despesa" ou "Receita") e, quando houver, " · limite de R$ X" do mês.
- **Nota (`Muted`):** "Os lançamentos com <nome> ficam no extrato, sem categoria, até você escolher outra." Quando há limite, acrescenta "O limite dela sai junto."
- **Rodapé:** o de hoje: Cancelar, e Excluir no `destructive` com `pending`.
- **Uma peça só:** a confirmação vira o componente `ExcluirCategoriaDialog` (`src/components/categories/`). A grade e o detalhe da categoria o usam, e o `CategoryDeleteAlertBody` sai.
- **Ao fechar,** o diálogo segura a última categoria até a animação de saída acabar, como o de lançamentos.

## O que não muda

O que a exclusão faz no banco, o menu que abre o diálogo, o toast e a navegação depois de excluir (no detalhe, ele volta à lista).

## Abordagens

1. **Espelhar o diálogo de lançamento (escolhida):** é a forma que o dono apontou, com título com o nome, cartão da linha e nota.
2. Só reescrever o texto, sem o cartão. Ficava diferente do de lançamento.
