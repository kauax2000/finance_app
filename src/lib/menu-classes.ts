/**
 * A superfície de menu: uma só, para os três menus do projeto e o `Command`.
 * Classe compartilhada entre componentes é `lib/`, não um componente vazio em
 * `ui/`; mudar o respiro de um menu muda o dos outros.
 */
import { menuPanelTintClassName } from "./glass-classes"

/** A tinta da placa mora em `glass-classes`; é reexportada porque `command.tsx` a importa daqui. */
export { menuPanelTintClassName }

/**
 * O alvo de toque cresce de 36 para 44 só com ponteiro grosso (`pointer:
 * coarse`): a pergunta é sobre o dispositivo, não sobre a largura da janela.
 */
const MENU_TOUCH_TARGET = "pointer-coarse:min-h-11"

/**
 * A superfície, e só ela: raio, tinta, sombra e fio, sem geometria, camada nem
 * animação. Uma placa só por superfície: duas aninhadas com esta receita (um
 * `Popover` e um `Command` dentro) somam 84% no escuro e saem mais claras que o
 * `DatePicker`; quem hospeda pinta, e o `Command` hospedado é transparente.
 * `text-foreground` e não `text-popover-foreground`: mesmo valor nos dois temas.
 */
export const menuPanelSurfaceClassName = [
  // O canto é a superfície (22); as listas recuam 8 (`p-2`), então as linhas
  // concêntricas ficam em 22 − 8 = 14.
  "rounded-surface text-foreground shadow-md ring-1 ring-foreground/10 [--radius-parent:var(--radius-surface)] [--radius-inset:--spacing(2)]",
  // O teto de uma lista suspensa: 288px, lido por cada primitiva dentro de um
  // `min()` com a altura disponível do Radix. Quem não é lista (o
  // `DropdownMenu variant="panel"`) o devolve à altura disponível.
  "[--menu-max-h:--spacing(72)]",
  menuPanelTintClassName,
].join(" ")

/**
 * A casca, menos o teto de altura e a origem da transformação: o Tailwind varre
 * o código como texto, então uma classe montada com o nome da primitiva
 * interpolado nunca chega ao CSS. Cada menu escreve as duas por extenso.
 */
export const menuSurfaceClassName = [
  /** Acima do véu da Sheet (`z-(--z-sheet)`); abaixo do Toaster (`z-(--z-toast)`). */
  "relative z-(--z-popover) flex min-w-36 flex-col overflow-hidden",
  menuPanelSurfaceClassName,
].join(" ")

/** O movimento não é da superfície, é de cada menu: este é só o zoom genérico do `Menubar`; os outros têm o seu. */
export const menuMotionClassName = [
  "animation-duration-(--duration-instant) ease-(--ease-out)",
  "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
].join(" ")

/**
 * O viewport: o nó de dentro que rola e recebe a dissolução das bordas. A
 * máscara recorta o alfa do elemento inteiro (fundo, anel, sombra), então
 * aplicada na casca ela apagaria os cantos; o recuo mora aqui, e o `-mx-2` do
 * separador sangra o recuo do pai. O teto de altura fica na casca.
 */
export const menuViewportClassName =
  "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-2 outline-hidden [--radius-inset:--spacing(2)]"

/** O submenu é a casca, nenhum flutua mais alto que o menu que o abriu. */
export const menuSubSurfaceClassName = `${menuSurfaceClassName} min-w-32`

/**
 * A geometria da linha, sem regra de estado: o `Command` (cmdk) quer o mesmo
 * corpo mas marca a ativa com `data-selected` e mantém `data-disabled="false"`
 * sempre presente, então a regra `data-disabled:` dos menus apagaria toda linha.
 */
// A linha mede 36 (`py-2`): com a placa em 22 e o recuo de 8, o canto
// concêntrico é 14, e numa linha de 28 isso era a metade e o realce saía pílula.
export const menuItemGeometryClassName = [
  "concentric relative flex cursor-default items-center gap-1.5 px-2 py-2 text-sm outline-hidden select-none",
  MENU_TOUCH_TARGET,
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
].join(" ")

/**
 * O realce é uma tinta, não uma cor: `--foreground` a 9% por cima do que
 * estiver atrás, para a linha acesa não matar a transparência da placa. A cor
 * esmaece em 300ms na entrada e na saída; nada segue o ponteiro (o realce que
 * viaja entre as linhas está recusado).
 */
export const menuItemFadeClassName =
  "transition-colors duration-(--duration-slow) ease-(--ease-emphasized)"

/** A linha. `group/menu-item` é o nome que o atalho procura para acender junto. */
export const menuItemClassName = [
  "group/menu-item",
  menuItemGeometryClassName,
  menuItemFadeClassName,
  "focus:bg-foreground/9 focus:text-accent-foreground",
  "data-inset:pl-7.5",
  "data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20",
  "data-disabled:pointer-events-none data-disabled:opacity-50",
  "focus:*:[svg]:text-accent-foreground data-[variant=destructive]:*:[svg]:text-destructive",
].join(" ")

/** O gatilho de submenu: a linha, mais o estado aberto. */
export const menuSubTriggerClassName = [
  "group/menu-item",
  menuItemGeometryClassName,
  menuItemFadeClassName,
  "focus:bg-foreground/9 focus:text-accent-foreground",
  "data-inset:pl-7.5 data-open:bg-foreground/9 data-open:text-accent-foreground",
  // Sem o desabilitado um submenu desabilitado sai igual ao ativo.
  "data-disabled:pointer-events-none data-disabled:opacity-50",
].join(" ")

/** A linha com marca (caixa ou rádio): o indicador fica à direita, para não brigar com a coluna de recuo do `inset`. */
export const menuIndicatorItemClassName = [
  "group/menu-item",
  menuItemGeometryClassName,
  // O recuo do lado do indicador cresce; o `twMerge` guarda o `px-2` com o `pr-8` por cima.
  "pr-8",
  menuItemFadeClassName,
  "focus:bg-foreground/9 focus:text-accent-foreground",
  "data-inset:pl-7.5",
  "data-disabled:pointer-events-none data-disabled:opacity-50",
].join(" ")

/** Onde o indicador de marca é ancorado. */
export const menuIndicatorSlotClassName =
  "pointer-events-none absolute right-2 flex items-center justify-center"

/** O rótulo de grupo é sinalização, não conteúdo: `text-xs` esmaecido para não competir com as linhas. */
export const menuLabelClassName =
  "px-2 py-1 text-xs font-medium text-muted-foreground data-inset:pl-7.5"

/** `bg-border`, o fio do projeto — `bg-muted` é preenchimento, não traço. */
export const menuSeparatorClassName = "-mx-2 my-1 h-px bg-border"

/** O atalho acompanha o realce da linha e some no toque: sem teclado físico, a tecla não diz nada. */
export const menuShortcutClassName =
  "ml-auto text-xs tracking-widest text-muted-foreground group-focus/menu-item:text-accent-foreground pointer-coarse:hidden"
