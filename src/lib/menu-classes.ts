/**
 * A superfície de menu — uma só, para os dois menus do projeto.
 *
 * `DropdownMenu` e `ContextMenu` desenham a mesma coisa e diferem só em como
 * são invocados: um por clique num gatilho, outro pelo botão direito. Mesmo
 * assim eles divergiam em **todas** as medidas, e a divergência foi medida:
 *
 * | | Dropdown | Context |
 * | --- | --- | --- |
 * | altura do item | 32px | 28px |
 * | raio da casca | 8px | 10px |
 * | moldura | borda 1px | anel |
 * | teto de altura | `none` | a janela |
 * | largura mínima | 128px | 144px |
 * | separador | `bg-muted` | `bg-border` |
 *
 * O `Dropdown` estava em 21 telas e era o mais atrasado; o `Context`, em
 * nenhuma, e era o mais moderno — e já concordava com `Select`, `Menubar` e
 * `Popover`. A régua que venceu foi a dele, e agora ela mora aqui: mudar o
 * respiro de um menu passa a mudar o do outro, que é o comportamento que a
 * tabela acima mostra não existir antes.
 *
 * Segue o precedente de [`tag-chip-classes`](./tag-chip-classes.ts): classe
 * compartilhada é `lib/`, não um componente vazio em `ui/`.
 */

/**
 * O alvo de toque.
 *
 * Um item de menu tem 28px, e o dedo pede 44. A altura não é única porque a
 * resposta não é única: no mouse, 44px espalha um menu de seis linhas por meia
 * tela sem ganhar precisão nenhuma; no toque, 28px é um alvo que erra.
 *
 * `(pointer: coarse)` é a pergunta certa — ela descreve o **dispositivo
 * apontador**, não a largura da janela. Um telefone em paisagem continua
 * grosso; um desktop de 800px continua fino. É a mesma família de decisão que
 * o projeto já tomou em `hover: hover` (ver `tailwind-hover-policy.test.ts`):
 * perguntar sobre o ponteiro, e não adivinhar pelo breakpoint.
 *
 * O `Dropdown` é justamente o menu que vive em cartão de categoria, cartão de
 * fatura e barra de ferramentas — tudo tocado no telefone.
 */
const MENU_TOUCH_TARGET = "pointer-coarse:min-h-11"

/**
 * **A superfície, e só ela** — raio, tinta, sombra e fio, sem geometria, sem
 * camada e sem animação.
 *
 * Ela existe porque essa receita estava escrita **quatro vezes** no
 * repositório: aqui, no `popover.tsx`, no `select.tsx` e — duas vezes dentro
 * do mesmo arquivo — no `navigation-menu.tsx`, que ainda por cima divergia,
 * com `shadow` no lugar do `shadow-md` dos outros três.
 *
 * O `menuSurfaceClassName` abaixo passou a compô-la, então **a saída dos três
 * menus é byte a byte a mesma**: isto é extração, não mudança. E quem quer só
 * a superfície — um painel que não é menu, sem `data-[side=…]`, sem
 * `min-w-36`, sem `flex-col` — veste esta em vez de vestir a casca inteira
 * para desfazer três quartos dela por `className`.
 */
export const menuPanelSurfaceClassName =
  "rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10"

/**
 * A casca — tudo menos o teto de altura e a origem da transformação.
 *
 * Aqueles dois ficam de fora por uma razão mecânica, e ela custou uma medição
 * para aparecer: **o Tailwind varre o código como texto.** A primeira versão
 * deste arquivo montava as classes com o nome da primitiva interpolado —
 * `` `max-h-(--radix-${prefix}-content-available-height)` `` —, e o resultado
 * foi que o nome da classe só passava a existir em tempo de execução. Nenhum
 * arquivo continha a string, o scanner não a encontrava, e o CSS nunca era
 * gerado: medido no navegador, a variável do Radix valia 318,75px, a classe
 * estava no elemento, e o `max-height` computado era `none`.
 *
 * Por isso cada menu escreve as duas por extenso, no próprio arquivo. Só o que
 * é literal chega ao CSS.
 */
export const menuSurfaceClassName = [
  /** Acima do véu da Sheet (`z-(--z-sheet)`); abaixo do Toaster (`z-(--z-toast)`). */
  "z-(--z-popover) flex min-w-36 flex-col overflow-hidden",
  menuPanelSurfaceClassName,
  "duration-(--duration-instant)",
  "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
].join(" ")

/**
 * O **viewport** — o nó de dentro que de fato rola, e que recebe a dissolução
 * das bordas.
 *
 * Ele existe porque a máscara recorta o alfa do elemento **inteiro**: fundo,
 * borda e sombra externa junto. Aplicada na casca, ela apagaria o
 * `ring-1 ring-foreground/10` e o `shadow-md` nas duas pontas — e os
 * `rounded-lg` de 8px caem inteiros dentro da zona de dissolução, então os
 * quatro arcos de canto seriam desenhados no piso enquanto os lados continuam
 * opacos. Isso lê como falha de renderização, não como fade. Pior: o
 * `bg-popover` mora na casca, e mascarar ali deixaria as pontas translúcidas
 * contra a página, trocando "a lista continua por baixo da superfície" por "o
 * painel está se dissolvendo".
 *
 * O `p-1` desceu da casca para cá, e o `-mx-1` do `menuSeparatorClassName`
 * continua correto: ele sangra o recuo do **seu pai**, que agora é este nó. É a
 * mesma cirurgia que o `variant="panel"` do `DropdownMenu` já fazia ao ceder o
 * recuo para o `DropdownMenuSection`.
 *
 * O teto de altura **não** desce junto — ele fica na casca, escrito por extenso
 * em cada menu, pela razão do bloco acima.
 */
export const menuViewportClassName =
  "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-1 outline-hidden"

/**
 * O submenu. Ele **é** a casca — antes divergia dela dentro do mesmo arquivo
 * (`border` + `shadow-lg` contra `ring-1` + `shadow-md`), e nenhum submenu
 * flutua mais alto que o menu que o abriu.
 */
export const menuSubSurfaceClassName = `${menuSurfaceClassName} min-w-32`

/**
 * A geometria da linha, sem nenhuma regra de estado.
 *
 * Ela sai daqui porque a **quarta** superfície de comandos do projeto — o
 * `Command` (cmdk) — quer o mesmo corpo e não pode reusar os estados: o cmdk
 * marca a linha ativa com `data-selected`, e não com `:focus`, e mantém
 * `data-disabled="false"` **sempre presente** no elemento, então a regra
 * `data-disabled:` dos menus (que casa por presença) apagaria toda linha.
 * Compartilhar o corpo e deixar cada superfície declarar o próprio realce é o
 * que faz as quatro medirem igual sem uma mentir sobre a outra.
 */
export const menuItemGeometryClassName = [
  "relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none",
  MENU_TOUCH_TARGET,
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
].join(" ")

/**
 * A linha. `group/menu-item` é o nome que o atalho procura para acender junto —
 * um nome só, para as duas superfícies.
 */
export const menuItemClassName = [
  "group/menu-item relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none",
  MENU_TOUCH_TARGET,
  "focus:bg-accent focus:text-accent-foreground",
  "data-inset:pl-7",
  "data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20",
  "data-disabled:pointer-events-none data-disabled:opacity-50",
  // `:not([class*='size-'])` e não `[&_svg]:size-4`: quem passa um `size-5`
  // explícito no ícone tem o direito de ser obedecido.
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  "focus:*:[svg]:text-accent-foreground data-[variant=destructive]:*:[svg]:text-destructive",
].join(" ")

/** O gatilho de submenu: a linha, mais o estado aberto. */
export const menuSubTriggerClassName = [
  "group/menu-item flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none",
  MENU_TOUCH_TARGET,
  "focus:bg-accent focus:text-accent-foreground",
  "data-inset:pl-7 data-open:bg-accent data-open:text-accent-foreground",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
].join(" ")

/**
 * A linha com marca — caixa ou rádio. O indicador fica à **direita**: à
 * esquerda ele empurraria o rótulo para longe do ícone da ação, e as duas
 * colunas de recuo (a do indicador e a do `inset`) brigariam pelo mesmo lugar.
 */
export const menuIndicatorItemClassName = [
  "group/menu-item relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none",
  MENU_TOUCH_TARGET,
  "focus:bg-accent focus:text-accent-foreground",
  "data-inset:pl-7",
  "data-disabled:pointer-events-none data-disabled:opacity-50",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
].join(" ")

/** Onde o indicador de marca é ancorado. */
export const menuIndicatorSlotClassName =
  "pointer-events-none absolute right-2 flex items-center justify-center"

/**
 * O rótulo de grupo. `text-xs` esmaecido, e não `text-sm font-semibold`: um
 * rótulo de grupo é sinalização, não conteúdo — no peso de antes ele competia
 * com as próprias linhas do menu.
 */
export const menuLabelClassName =
  "px-1.5 py-1 text-xs font-medium text-muted-foreground data-inset:pl-7"

/** `bg-border`, o fio do projeto — `bg-muted` é preenchimento, não traço. */
export const menuSeparatorClassName = "-mx-1 my-1 h-px bg-border"

/** O atalho acompanha o realce da linha em vez de ficar cinza sobre o acento. */
export const menuShortcutClassName =
  "ml-auto text-xs tracking-widest text-muted-foreground group-focus/menu-item:text-accent-foreground"
