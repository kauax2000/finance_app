import { menuPanelTintClassName } from "@/lib/glass-classes"

/**
 * O campo de busca do sistema — uma receita, três peças (rodada 198).
 *
 * O gatilho do cabeçalho do catálogo, a pílula do `CommandInput` (no
 * `CommandDialog` e no `Combobox`) e o `SearchInput` são o **mesmo desenho**:
 * pílula, lupa quieta à esquerda, texto, × de limpar e, às vezes, a tecla do
 * atalho sem pastilha. Até aqui cada um o escrevia à mão — o cabeçalho e a
 * paleta concordavam por cópia, e o `SearchInput` era outra coisa (caixa
 * `rounded-lg` do `InputGroup`, recuo e lupa de campo de formulário). Quem
 * abria a paleta pelo gatilho encontrava a mesma pílula do outro lado; quem
 * buscava na tabela de transações, não.
 *
 * Nenhuma das três pode ser a outra: o gatilho é um `<button>` (um campo que
 * não aceita texto é a promessa que a paleta cumpre), e o campo da paleta tem
 * de ser o `Command.Input` do cmdk. Por isso o que se divide é a régua, e não
 * o componente — o precedente de `menu-classes` e `field-classes`.
 * `search-field.test.ts` cobra que as três a importem.
 *
 * Nada de `cva` aqui: a regra A2 do auditor o reprova fora de `components/ui/`.
 */

export type SearchFieldSize = "sm" | "md" | "lg" | "xl"

/** Pílula, sempre — a forma que o dono pediu para o gatilho e a paleta. */
export const searchFieldShapeClassName = "flex min-w-0 items-center rounded-full"

/**
 * A escada: os degraus de campo (28 · 32 · 36 · 40), com o respiro e o recuo
 * crescendo junto. `md` e `lg` são, número a número, o gatilho do cabeçalho
 * (32, `gap-2`, `px-3`) e a pílula da paleta (36, `gap-2.5`, `px-3.5`); `sm` e
 * `xl` seguem a mesma progressão. O corpo do texto é do `<input>`, não daqui.
 */
export const searchFieldSizeClassName = {
  sm: "h-7 gap-1.5 px-2.5",
  md: "h-8 gap-2 px-3",
  lg: "h-9 gap-2.5 px-3.5",
  xl: "h-10 gap-2.5 px-4",
} as const satisfies Record<SearchFieldSize, string>

/**
 * O piso de toque dos campos (`pointer-coarse:h-10`, a régua de
 * `fieldControlHeightClassName`). Só o campo **na página** o veste: na pilha do
 * `Command` a pílula é parte de um painel com medidas próprias.
 */
export const searchFieldCoarseClassName = "pointer-coarse:h-10"

/**
 * As duas superfícies.
 *
 * - `field` — o gatilho do cabeçalho: o fio de **separar** (`border-border`, e
 *   não o `border-input` de campo de formulário) sobre o preenchimento a 30%.
 *   Busca na página.
 * - `plate` — a pílula da pilha do `Command`: a tinta da placa flutuante e um
 *   anel de 1px, sem borda. Busca **dentro** de um painel flutuante, onde um
 *   campo preenchido seria uma segunda superfície sobre a placa — o dono quis
 *   a pílula do `Combobox` igual ao fundo do dropdown (rodada 143).
 */
export const searchFieldSurfaceClassName = {
  field: "border border-border bg-input-fill/30",
  plate: `ring-1 ring-foreground/10 ${menuPanelTintClassName}`,
} as const

export type SearchFieldSurface = keyof typeof searchFieldSurfaceClassName

/**
 * O foco: o anel de campo (`ring-3` de `--ring` a 30%, rodada 162), aceso pelo
 * `<input>` de dentro. O `CommandInput` solto usava 45% por cópia anterior à
 * rodada 162; agora os dois falam o mesmo. Na paleta não há anel — o campo
 * nasce focado e quem carrega o foco visível é a linha selecionada.
 */
export const searchFieldFocusClassName =
  "has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/30"

/** A lupa: 16px, quieta — a do cabeçalho e a da paleta. */
export const searchFieldIconClassName = "size-4 shrink-0 text-muted-foreground opacity-70"

/** O `<input>`: sem moldura própria; a pílula é quem desenha. */
export const searchFieldInputClassName =
  "min-w-0 flex-1 bg-transparent outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed"

/**
 * O × de limpar: `Button tertiary icon-xs`, redondo como a pílula e puxado 6px
 * para a borda, para a caixa de 24 não roubar o recuo dela.
 */
export const searchFieldClearClassName = "-me-1.5 shrink-0 rounded-full"

/**
 * A tecla do atalho **sem pastilha**, à direita: dentro de uma pílula a
 * pastilha do `Kbd` era uma caixa dentro de outra caixa (a decisão do
 * cabeçalho, e a das teclas da legenda da paleta).
 */
export const searchFieldShortcutClassName =
  "ms-auto min-w-0 bg-transparent px-0 dark:bg-transparent"
