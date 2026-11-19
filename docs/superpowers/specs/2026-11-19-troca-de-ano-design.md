# Troca de ano na grade de meses (A) — desenho curto

Data: 19/11/2026. Escolha do dono: **A**, "a grade desliza para o lado".

## Por quê

Ao trocar o ano na `MonthGrid` (`src/components/ui/date-picker.tsx`), os doze meses mudam de uma vez, sem movimento. O dono quer uma transição orgânica, igual ao resto do app. Ela deve aparecer ao tocar nas setas do ano, em cima, e também nas setas do mês, no rodapé do seletor de mês de Categorias, quando a passagem cruza o ano (de dezembro para janeiro, por exemplo).

## O que muda

- **A grade.** No troca-ano, a grade antiga sai para o lado da seta tocada, deslocando 24px, perdendo opacidade e ganhando desfoque de 6px, na saída curta do sistema (`SAIDA`, 150ms). A nova chega do lado oposto, partindo de 24px, sem opacidade e com 6px de desfoque, na mola do app (`MOLA` de `lib/spring`). A direção vem do sentido: um ano à frente sai pela esquerda e entra pela direita; um ano para trás, o contrário.
- **O número do ano.** Troca no lugar: o número antigo sai subindo ou descendo, conforme a direção, e o novo entra do desfoque. É o gesto do miolo que troca no app (`TrocaSuave` / `quadroDaTroca`). Reuse o que existe, sem escrever um novo.
- **A grade segue o valor que vem de fora.** Hoje o `ano` é um estado que só é lido ao montar. Quando o valor muda por fora para outro ano (as setas do rodapé, "Este mês"), a grade passa para esse ano e anima na direção certa. Isso corrige o bug de hoje: de dezembro para janeiro pelo rodapé, a grade ficava no ano antigo e o mês escolhido sumia.
- **O mês escolhido viaja (pedido do dono).** A pílula branca do mês escolhido vira um
  marcador só, que viaja de um mês ao outro como o das abas. Usa o `useMarcador`
  (`hooks/use-marcador`) com a viagem líquida (`viajarLiquido`, de `lib/liquid-move`), mexe só
  em `translate` e `scale` e não roda `rAF` em laço.
  - **Quando viaja:** dentro do mesmo ano, pelas setas do rodapé, pelo toque num mês quando o
    painel não fecha e pelo "Este mês".
  - **Quando não viaja:** cruzando o ano, a pílula vai junto com a grade que desliza.
  - **Sem medida:** sem JavaScript, ou antes da primeira medida, o mês escolhido continua
    pintado, como nas abas.
  - **No modo `range`:** as pontas e a faixa continuam como estão; fica fora do escopo.
  - **No seletor de Categorias:** o toque num mês fecha o painel, então ali a viagem só
    aparece pelas setas do rodapé.
- **Movimento reduzido.** Troca na hora, sem deslize nem desfoque.
- **Interrupção.** Tocar duas vezes rápido não pula nem empilha grades. A transição em curso é cortada e a nova parte de onde está, como nas outras peças com `motion`.
- **Acessibilidade.** O `aria-live` do ano continua anunciando o ano novo. A grade que sai fica `inert` e `aria-hidden` enquanto some.

## O que não muda

A escolha de mês, os limites `min` e `max`, o modo `range`, a `caption` e o tamanho no toque. O seletor de mês da Categorias não muda de forma.

## Abordagens

1. **A, escolhida:** a grade desliza para o lado, com desfoque, na mola.
2. **B:** a grade fica parada e os meses brotam em onda a partir da coluna do lado da seta.
3. **C:** deslize curto mais a onda. É a mais orgânica e a mais longa.

## Restrições

- É uma mudança em `src/components/ui/date-picker.tsx`, feita a pedido do dono.
- **Página do catálogo.** A página da `DatePicker` / `MonthGrid` no catálogo diz que a troca de ano anima.
- **AGENTS.md.** A linha do `DatePicker` ganha a nota da troca de ano.
- **Testes.** `date-picker-versions.test.ts` passa a travar o movimento, o movimento reduzido e a grade que segue o valor de fora.
- **Implementação.** O movimento é feito pelo `motion`, que o design system já usa, com as molas de `lib/spring`. Não use `animate-[…]` nem `rAF` em laço.
