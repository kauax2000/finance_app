# Filtro ao vivo, com pausa na consulta

Data: 16/11/2026. Pedido do dono: no filtro de Descrição, cada letra "atualizava e fechava" a gaveta.

## Causa

- A gaveta fechava porque a barra de filtros remontava. Em `transacoes-tabela.tsx` o embrulho `max-md:hidden` entrava e saía conforme o vazio. Corrigido em df861084: o embrulho agora é sempre o mesmo nó.
- Cada letra também dispara uma consulta ao banco, porque o filtro grava na URL a cada tecla.

## Abordagens

- **A. Ao vivo, com pausa (escolhida pelo dono).** O filtro continua gravando na hora, igual à regra do `FilterBar` no desktop. A consulta espera a pessoa parar de digitar. O "Pronto" só fecha a gaveta.
- **B. Aplicar no Pronto.** Recusada: o telefone passaria a funcionar diferente do desktop, e seria preciso definir o que fazer ao arrastar a gaveta para fechar.

## Design

- Usar o padrão que o app já tem na paleta de comandos (`app-command-palette.tsx`): `useDebouncedValue(termoAgora, 250)`, de `src/hooks/use-debounced-value.ts`. O campo responde na hora, e só a consulta espera.
- Em `use-transacoes-da-tela.ts`, a chave da consulta (`estadoDaChave`) passa a usar `filtros` e `q` atrasados em 250ms. `type`, `sort` e `page` continuam imediatos.
- Continuam iguais: a URL (gravada ao vivo), o `FilterBar`, a gaveta, o desktop e a contagem no cabeçalho.
- Nada muda em `src/components/ui/`.

## Restrições

- Se a pessoa limpar o filtro, a consulta já atrasada não pode trazer de volta um resultado antigo. Quem garante isso é a chave atrasada, que sempre converge para o último valor.
- A página volta a 1 quando o filtro muda, como hoje (`volta` em `use-transacoes-da-tela.ts`).
