/**
 * A régua das superfícies ancoradas num gatilho.
 *
 * # Toda superfície ancorada cabe inteira na janela
 *
 * A regra tem **três cláusulas**, e as três precisam valer juntas:
 *
 * 1. Ela **centra no gatilho** quando cabe.
 * 2. Quando não cabe, **desloca para dentro** — `avoidCollisions` ligado (é o
 *    padrão do Radix, e nenhuma superfície deste projeto o desliga), com a
 *    folga de {@link ANCHORED_COLLISION_PADDING}.
 * 3. Quando é **maior que o espaço disponível**, ela encolhe:
 *    `max-w-(--radix-<primitiva>-content-available-width)` e o `max-h`
 *    correspondente.
 *
 * **A terceira é a que sempre falta, e sem ela as outras duas não fecham.**
 * Deslocar resolve a superfície que *cabe* e está mal posta; não resolve a que
 * é mais larga que a janela — ali não existe posição que a torne visível. Antes
 * desta régua, `max-w-…-available-width` existia em **3 arquivos de 11**.
 *
 * ## A folga é do sistema, não da tela
 *
 * Ela estava escrita em **cinco grafias**: `8` (Popover, HoverCard), `12` e
 * `16` espalhados por 12 chamadas do app, um objeto
 * `{top:16,bottom:16,left:12,right:12}` no `FormPickerPopover`, e —
 * em `quick-actions.tsx` — **`undefined`**, que anulava o default do componente
 * e devolvia a folga a zero justamente no ramo que não era FAB. Uma decisão,
 * um lugar. A regra **K** do `ds:audit` é o que impede a sexta grafia.
 *
 * ## As classes ficam literais em cada arquivo, e isso não é descuido
 *
 * Elas carregam o nome da primitiva, e o Tailwind varre o código como **texto**:
 * uma classe montada em tempo de execução nunca chega ao CSS. A medição está em
 * [`menu-classes`](./menu-classes.ts) — a variável do Radix valia 318,75px, a
 * classe estava no elemento, e o `max-height` computado era `none`. Por isso
 * este arquivo compartilha o **número** e a **lista**, nunca a string.
 */

/**
 * A folga entre uma superfície ancorada e a borda da janela, em pixels.
 *
 * Oito é o que `Popover` e `HoverCard` já usavam, e o que o `NavigationMenu`
 * copiou por prosa num comentário quando ganhou o trilho próprio — ele agora lê
 * daqui.
 */
export const ANCHORED_COLLISION_PADDING = 8

/**
 * As superfícies que a regra alcança: arquivo → nome da primitiva no Radix.
 *
 * Ela é ao mesmo tempo o **alcance declarado** da regra e o que
 * `anchored-surface.test.ts` itera para provar que cada uma escreve os dois
 * tetos por extenso. Uma superfície ancorada nova entra aqui na mesma mudança
 * em que nasce — senão o teste não a vê, e o alcance vira promessa.
 *
 * Fora da lista, com motivo:
 *
 * - **`combobox.tsx`, `date-picker.tsx`** — não têm `Content` próprio; compõem
 *   `PopoverContent` e herdam dele os três.
 * - **`command.tsx`** — não é ancorado. Ele vive dentro de um `Popover` (pelo
 *   `Combobox`) ou de um `Dialog`, e o teto dele é `--command-list-max-h`.
 * - **`navigation-menu.tsx`** — não usa Popper: o Radix não expõe colisão nesta
 *   primitiva, e o trilho é feito à mão em `medir()`. Ele lê a constante, mas
 *   não tem as variáveis `--radix-*-content-available-*` para declarar.
 */
export const ANCHORED_SURFACES = {
  "popover.tsx": "popover",
  "dropdown-menu.tsx": "dropdown-menu",
  "context-menu.tsx": "context-menu",
  "menubar.tsx": "menubar",
  "select.tsx": "select",
  "tooltip.tsx": "tooltip",
  "hover-card.tsx": "hover-card",
} as const
