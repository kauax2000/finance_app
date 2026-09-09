/**
 * A superfície das peças modais — uma só, para as cinco, **e a mesma da
 * superfície flutuante**.
 *
 * `Dialog`, `AlertDialog`, `EdgePanel`, `Sheet` e `Drawer` pintam a mesma
 * placa. Ela já esteve escrita no `cva` do `dialog.tsx` mais `bg-background`
 * cru nos outros três arquivos, e extrair é o precedente de
 * [`menuPanelSurfaceClassName`](./menu-classes.ts): classe compartilhada é
 * `lib/`, sem `cva` (a regra A2 do auditor).
 *
 * ## `--background`, e não `--popover` — e a tela é que decidiu
 *
 * A flutuante é `--popover` (0.205); esta é `--background` (0.145). Uma rodada
 * as igualou em `--popover` para "todas ficarem iguais ao DatePicker", e o
 * resultado foi visto e reprovado: **a placa passou a ler como opaca**. A
 * conta explica — `--popover` a 60% sobre a página velada (~0.10) compõe para
 * ~0.16, bem acima de tudo que está atrás, então nada atravessa e o vidro some.
 * `--background` a 60% compõe para ~0.13, quase o próprio fundo velado: a placa
 * afunda no véu e o borrão é o que a distingue. Para um modal, que cobre a
 * página inteira, é este o tom que lê como material; o `--popover` é da
 * superfície pequena sobre conteúdo. A paleta (`CommandDialog`) é a exceção e
 * veste o tom do popover por cima — ela é uma superfície de comandos, não um
 * diálogo.
 *
 * ## O material é o do iOS, e aqui ele tem o véu atrás
 *
 * E a placa abre mais que a flutuante no escuro — 40% contra 60%. A 60% ela
 * lia como fosca sobre a página; a tela decidiu, com a sonda a 40% ao lado.
 *
 * O `backdrop-filter` renderiza na placa modal (não há wrapper transformado
 * acima dela), e o que ele vê é o `--overlay` a 40% mais a página: medido,
 * delta 0 sobre um card, 2 sobre a página, 15 sobre um botão `primary` no
 * escuro. Quem quiser o efeito mais visível mexe no véu (rodada 52c), não aqui.
 *
 * **E nenhuma tira pinta por cima dela.** Cor com alfa não tem "cor cheia"
 * pintável: um degradê opaco numa tira era mais claro que a
 * placa a 60% e saía como banda no topo da gaveta — medido. As tiras são
 * irmãs do corpo, que se mascara sozinho; o fundo delas já é a placa.
 */
export const modalSurfaceClassName = [
  "bg-background/85 glass-surface",
  // 40% no escuro, e não os 60% da flutuante: a placa modal cobre página quase
  // uniforme, e a 60% ela lia como fosca — visto na tela, e escolhido contra a
  // sonda a 40% lado a lado. Medido a 40%: `--muted-foreground` sobre a placa
  // sobre um botão `primary` dá 5,61, sobre um card 7,57. O claro fica em 85%,
  // onde 4,38 já é o teto (rodada 51c).
  "supports-backdrop-filter:dark:bg-background/40",
  /** A cor sólida é de quem veste — a utility é dona de uma propriedade só. */
  "reduced-transparency:bg-background",
].join(" ")
