/**
 * # O realce que viaja
 *
 * Numa lista de opções, a linha ativa não pinta o próprio fundo: **um nó só**
 * anda por trás das linhas, seguindo o ponteiro e as setas. Antes cada linha
 * acendia e apagava o seu, e o realce piscava de uma para a outra — é a mesma
 * decisão que o marcador do `Tabs` já tomou ("três marcadores piscando não
 * dizem o que um marcador se movendo diz").
 *
 * Quem mede e escreve é o `useListHighlight` (`hooks/use-list-highlight.ts`);
 * isto é só a pintura. Sem `cva`, pela regra A2 do auditor.
 *
 * ## O movimento é a mola da casa
 *
 * `--ease-spring` em `--duration-spring`: o realce chega um pouco depois do
 * cursor, passa ~3,8% do alvo e assenta. O "atraso orgânico" é a física da
 * mola, e não um `transition-delay` — um atraso fixo travaria a navegação por
 * setas, onde a linha já mudou e o realce ficaria parado esperando.
 *
 * ## O estado mora no próprio indicador
 *
 * `data-state` e `data-tone` são escritos **neste** nó, e não lidos de um
 * ancestral: `in-*` e `group-*` compilam com `:where()`, que não soma
 * especificidade, e a disputa com o `opacity-0` da base seria decidida pela
 * ordem de emissão. Aqui `data-[state=on]` é (0,2,0) contra (0,1,0).
 *
 * - `jump`: a posição é escrita **sem** transição. É o primeiro quadro depois
 *   de apagado — o realce nasce na linha nova, nunca desliza de onde apagou.
 * - `on`: aceso, e viajando na mola.
 * - `off`: apaga no ritmo curto, sem se mover. Sem `data-state` nenhum (antes
 *   da primeira medida) ele é invisível pela base.
 *
 * O indicador é o **primeiro filho** do contêiner posicionado: as linhas são
 * `relative` e vêm depois no DOM, então pintam por cima sem `z-index` negativo.
 */
export const listHighlightClassName = [
  "pointer-events-none absolute top-0 left-0 rounded-md bg-accent opacity-0",
  "translate-x-(--list-highlight-x) translate-y-(--list-highlight-y) w-(--list-highlight-w) h-(--list-highlight-h)",
  "transition-[translate,width,height,opacity] duration-(--duration-spring) ease-(--ease-spring)",
  "data-[state=on]:opacity-100",
  "data-[state=jump]:transition-none",
  "data-[state=off]:transition-opacity data-[state=off]:duration-(--duration-fast) data-[state=off]:ease-(--ease-out)",
  "data-[tone=destructive]:bg-destructive/10 dark:data-[tone=destructive]:bg-destructive/20",
].join(" ")
