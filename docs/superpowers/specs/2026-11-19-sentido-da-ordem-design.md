# Sentido da ordem: tocar de novo inverte (A) — desenho curto

Data: 19/11/2026. Escolha do dono: **A**.

## Por quê

No menu de ordem de Categorias, o sentido mora numa seção "Sentido" embaixo. Escolher um sentido fecha o menu, e para mudar a ordem é preciso abrir de novo. O dono não gostou do seletor nem do fechamento.

## O que muda

- **A seção "Sentido" sai.** O menu fica só com "Ordenar por" e as três ordens: Gasto (ou Receita), Nome e Variação.
- **A ordem escolhida** acende a linha e mostra, à direita e no lugar do tique, uma **seta** ↓ (`ArrowDownIcon`, Heroicons `16/solid`). Embaixo do nome aparece o sentido em texto pequeno (`text-xs text-muted-foreground`): "Maior primeiro", "A → Z" ou "Mais subiu". Invertida, a seta gira para ↑, com uma rotação de 180° em `--duration-fast` (na hora com movimento reduzido), e o texto troca para "Menor primeiro", "Z → A" ou "Mais caiu".
- **Tocar na ordem já escolhida** inverte o sentido, e o menu **fica aberto**: o `onSelect` chama `preventDefault()`.
- **Tocar em outra ordem** troca a ordem, volta o sentido ao natural e fecha o menu, como hoje.
- **Peça do design system:** o `DropdownMenuRadioItem indicator="check"` ganha uma prop opcional `indicatorIcon?: React.ReactNode`, que troca o `CheckIcon` pelo ícone de quem chama. Sem ela, nada muda. É o mesmo menu cuja mudança o dono já autorizou, e a escolha da A vale como o ok. Precisa de uma linha no AGENTS.md (`DropdownMenu`), uma linha na página do catálogo e um teste.
- **Acessibilidade:** o `aria-label` do gatilho continua dizendo a ordem e o sentido. O texto pequeno do sentido mora dentro da linha, então o leitor o lê com o nome.

## O que não muda

O gatilho ⇅, a largura do menu (`lg`), o telefone, que usa o mesmo menu, e a lógica `invertida` de `ordenarCategorias`.

## Abordagens

1. **A (escolhida):** tocar de novo inverte, com a seta na linha, como no app Arquivos do iOS.
2. **B:** um botão de sentido no título do menu.
3. **C:** manter a seção "Sentido", sem fechar o menu.
