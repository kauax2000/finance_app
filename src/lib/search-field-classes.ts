import { menuPanelTintClassName, modalSurfaceClassName } from "@/lib/glass-classes"

/**
 * O campo de busca do sistema: uma receita, três peças (o gatilho do cabeçalho
 * do catálogo, o `CommandInput` e o `SearchInput`). Nenhuma pode ser a outra —
 * o gatilho é um `<button>` e o campo da paleta é o `Command.Input` do cmdk —,
 * então o que se divide é a régua. `search-field.test.ts` cobra que as três a
 * importem. Sem `cva` (regra A2 do auditor).
 */

export type SearchFieldSize = "sm" | "md" | "lg" | "xl"

/** Pílula, sempre. */
export const searchFieldShapeClassName = "flex min-w-0 items-center rounded-full"

/**
 * A escada de campo (28 · 32 · 36 · 40), com respiro e recuo crescendo junto;
 * `md` e `lg` são, número a número, o gatilho do cabeçalho e a pílula da
 * paleta. O corpo do texto é do `<input>`.
 */
export const searchFieldSizeClassName = {
  sm: "h-7 gap-1.5 px-2.5",
  md: "h-8 gap-2 px-3",
  lg: "h-9 gap-2.5 px-3.5",
  xl: "h-10 gap-2.5 px-4",
} as const satisfies Record<SearchFieldSize, string>

/** O piso de toque (`pointer-coarse:h-10`, a régua de `fieldControlHeightClassName`); só o campo na página o veste, não a pílula da pilha do `Command`. */
export const searchFieldCoarseClassName = "pointer-coarse:h-10"

/**
 * As duas superfícies. `field` é a busca na página: o fio de separar
 * (`border-border`, não o `border-input` de formulário) sobre o preenchimento a
 * 30%. `plate` é a busca dentro de um painel flutuante: a tinta da placa e um
 * anel de 1px, sem borda, para não pôr um campo preenchido sobre a placa.
 * `modal` é a mesma pílula na tinta das peças modais: a do `CommandDialog`, que
 * veste o fundo do `Dialog` e da `Sheet`.
 */
export const searchFieldSurfaceClassName = {
  field: "border border-border bg-input-fill/30",
  plate: `ring-1 ring-foreground/10 ${menuPanelTintClassName}`,
  modal: `ring-1 ring-foreground/10 ${modalSurfaceClassName}`,
} as const

export type SearchFieldSurface = keyof typeof searchFieldSurfaceClassName

/**
 * O foco: o anel de campo (`ring-3` de `--ring` a 30%), aceso pelo `<input>` de
 * dentro. Na paleta não há anel: o campo nasce focado e quem carrega o foco
 * visível é a linha selecionada.
 */
export const searchFieldFocusClassName =
  "has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/30"

/** A lupa: 16px, quieta. */
export const searchFieldIconClassName = "size-4 shrink-0 text-muted-foreground opacity-70"

/** O `<input>`: sem moldura própria; a pílula é quem desenha. */
export const searchFieldInputClassName =
  "min-w-0 flex-1 bg-transparent outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed"

/** O × de limpar: `Button tertiary icon-xs`, redondo e puxado 6px para a borda, para a caixa de 24 não roubar o recuo. */
export const searchFieldClearClassName = "-me-1.5 shrink-0 rounded-full"

/** A tecla do atalho sem pastilha (dentro de uma pílula seria caixa dentro de caixa); some no toque, onde a tecla não diz nada. */
export const searchFieldShortcutClassName =
  "ms-auto min-w-0 bg-transparent px-0 dark:bg-transparent pointer-coarse:hidden"
