/**
 * A superfície das peças modais — uma só, para as cinco.
 *
 * `Dialog`, `AlertDialog`, `EdgePanel`, `Sheet` e `Drawer` pintam a mesma
 * placa, e ela estava escrita no `cva` do `dialog.tsx` mais `bg-background`
 * cru nos outros três arquivos. Somar o vidro sem extrair produziria a
 * **quarta** cópia da receita — a mesma trajetória que levou a superfície
 * flutuante a cinco antes de virar
 * [`menuPanelSurfaceClassName`](./menu-classes.ts), que é o precedente daqui:
 * classe compartilhada é `lib/`, e sem `cva` (a regra A2 do auditor o reprova
 * fora de `components/ui/`).
 *
 * ## O material é o do cabeçalho, e o alfa difere por tema
 *
 * É a mesma `@utility glass-surface` das 11 superfícies flutuantes — 24px de
 * borrão e `saturate(1.5)`, com o guarda de `prefers-reduced-transparency`
 * embutido. Muda o token: aqui a placa é `--background`, e não `--popover`.
 *
 * **O que uma peça modal borra não é a página: é o `--overlay`.** Um popover
 * borra conteúdo real; entre esta placa e a tela há o véu. Ele clareou para 40%
 * no escuro na rodada do véu, e é isso que dá ao borrão algo para mostrar —
 * medido, o delta contra a placa opaca:
 *
 * | atrás | escuro | claro a 85% |
 * | --- | --- | --- |
 * | página | 3 | 24 |
 * | muted | 9 | 28 |
 * | botão `primary` | **30** | 56 |
 *
 * As de borda conseguem ~2× o que o `Dialog` consegue nos mesmos fundos
 * (0 · 2 · 2 · 15), porque a placa delas é `--background` — mais escura que o
 * fundo velado, então o composto anda na direção do conteúdo em vez de
 * empatar.
 *
 * **O alfa aberto é escopado no escuro, e o número é o contraste.** A 85% no
 * claro o `--muted-foreground` fica em 4,38 sobre o pior fundo real (o
 * preenchimento do `primary`); a 60% ele cai a **2,58** e reprova. No escuro
 * 60% dá 6,44. Daí a base servir o claro **e** ser o fallback de quem não tem
 * `backdrop-filter`, com o escuro abrindo só onde o borrão existe.
 */
export const modalSurfaceClassName = [
  "bg-background/85 glass-surface",
  "supports-backdrop-filter:dark:bg-background/60",
  /** A cor sólida é de quem veste — a utility é dona de uma propriedade só. */
  "reduced-transparency:bg-background",
].join(" ")
