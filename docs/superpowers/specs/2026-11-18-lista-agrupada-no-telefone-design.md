# Lista de transações agrupada no telefone (opção A)

Escolhida pelo dono em 18/11/2026, a partir do artefato "Lista de transações no telefone"
(https://claude.ai/artifact/E3d63TZqMSUtk1iA7TYzbj), opção A.

## Intenção

No telefone, a lista de Transações é um cartão só, com o dia numa faixa cinza dentro dele e cada
linha repetindo o cartão ("Bradesco Visa Infinity"). Ela passa a ser a lista agrupada do iOS
(Ajustes, Carteira):
- cada dia é um cartão próprio;
- o nome do dia e o total do dia ficam por fora, acima do cartão;
- a segunda linha diz a categoria.

## Como fica

- **Cabeçalho do dia**, fora do cartão: à esquerda, o nome do dia (`formatDayHeadingPtBr`, como
  hoje), em sobrancelha (`text-2xs`, maiúsculas, `text-muted-foreground`); à direita, o total do
  dia, na mesma tinta.
- **O total do dia** é a soma das saídas do dia, com o sinal de menos (`signedCurrencyBRL`).
  Num dia sem saída, é a soma das entradas, com o mais. As linhas previstas não entram na soma.
- **O cartão do dia**: `rounded-surface`, a superfície do `Card`, sem borda própria. Os dias
  ficam a 8px um do outro, contando o cabeçalho.
- **O fio entre as linhas** começa depois do ícone (o recuo do iOS). Não atravessa a linha
  inteira.
- **A segunda linha** é a categoria ("Mercado", "Sem categoria"). O pagamento entra depois de
  " · " só quando as linhas da lista não têm todas o mesmo pagamento.
- **No telefone o cartão de fora some.** O `TablePanel` deixa de desenhar a moldura abaixo do
  `md`; quem desenha são os cartões dos dias.
- **No desktop nada muda.**

## Abordagens

1. **Recomendada e escolhida:** uma prop nova no `DataTable`, `mobileGroups="inset"` (o padrão
   segue `"band"`, a faixa de hoje). Com ela, o gêmeo do telefone desenha um `ItemGroup` por
   grupo dentro de um cartão, com o cabeçalho por fora. O `groupBy` ganha um campo opcional
   `aside` (o total). Só Transações liga a prop; o Importar e o catálogo seguem como estão.
2. Ligar o agrupado para todo gêmeo com `groupBy`. Recusada: o Importar mora numa gaveta, onde
   cartões dentro do vidro não fazem sentido.
3. Escrever a lista do telefone à mão em Transações. Recusada: viola o design system ("nenhuma
   tela escreve o gêmeo do telefone à mão").

## Restrições

- `src/components/ui/data-table.tsx` é do design system. A escolha da A pelo dono é a autorização
  desta mudança. A página `src/app/designsystem/docs/data-table.tsx` ganha o exemplo, e o
  `AGENTS.md`, a frase do `DataTable`.
- Só tokens e peças do sistema (`Card`, `ItemGroup`, `Item`).
- O resto do gêmeo continua igual: o toque longo, a seleção, as linhas previstas e o "A conferir".

## Fora do escopo

As variações A2 a A6 (título dentro do cartão, forma de pagar sob o valor, seta, dia preso ao
rolar, entradas e saídas no cabeçalho).
