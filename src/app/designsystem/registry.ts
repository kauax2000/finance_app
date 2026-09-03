import type { Category } from "./ds-doc"

export type RegistryEntry = {
  slug: string
  name: string
  category: Category
  /** Uma linha, usada na navegação e como subtítulo da página. */
  description: string
  /** Caminho do arquivo, mostrado abaixo da linha de import. */
  source?: string
  /** O import que se copia para usar o componente. */
  importLine?: string
}

export const CATEGORY_ORDER: Category[] = [
  "Fundações",
  "Átomos",
  "Moléculas",
  "Organismos",
  "Templates",
  "Padrões",
]

const ui = (name: string) => `@/components/ui/${name}`

/**
 * A camada de cada peça, pelo modelo do atomic design.
 *
 * **Isto era dois `Set` e um *fall-through*.** O que não estivesse em `ATOMS`
 * nem em `MOLECULES` virava Organismo em silêncio — e foi assim que
 * `Typography` (nove átomos de texto que não compõem nada) apareceu ao lado da
 * `Sidebar`, e `Container` (uma `div`) ao lado do `Dialog`. Medido antes da
 * correção: **32 dos 75 componentes estavam na camada errada**, 43% do
 * catálogo. O comentário que vivia aqui já previa a falha — *"com 80 itens, a
 * repetição é onde a lista começa a mentir"* —, e a saída dele (derivar do
 * slug) foi o que produziu a mentira.
 *
 * Agora é um mapa explícito, e ele é **exaustivo por tipo**: um componente novo
 * sem camada não compila. Nascer classificado é a única forma de a lista não
 * voltar a mentir.
 *
 * ## A regra, e ela é a canônica
 *
 * | Camada | A definição | O teste |
 * | --- | --- | --- |
 * | `Fundações` | os átomos abstratos: cor, tipo, forma, movimento, camada | é decisão em `globals.css`, não componente |
 * | `Átomos` | o elemento indivisível — quebrá-lo o faz deixar de funcionar | não compõe componente do sistema, e é **um** elemento |
 * | `Moléculas` | grupos simples de átomos funcionando como unidade | várias peças que só existem juntas, compondo no máximo átomos |
 * | `Organismos` | seções relativamente complexas da interface | compõe duas ou mais moléculas, ou compõe molécula **e** tem estado próprio |
 * | `Templates` | objetos de nível de página, que dispõem componentes num layout | o que estrutura a página, e não o que ela contém |
 * | `Padrões` | decisões que atravessam telas | não é componente |
 *
 * `Container` é **Átomo** e não Template: pelo teste canônico ele é
 * indivisível — uma `div` com largura —, e não dispõe nada. Quem dispõe é o
 * `PageHeader` e o `PageSection`, e por isso os dois são Templates.
 */
type Layer = Exclude<Category, "Fundações" | "Padrões">

/**
 * De onde a peça veio, quando ela mudou de camada na rodada 17.
 *
 * Existe para quem tem o mapa antigo na cabeça não achar que a página sumiu, e
 * é **temporária**: some quando o campo for apagado destas entradas. A regra de
 * remoção está no `AGENTS.md` — a próxima rodada que tocar este arquivo apaga.
 */
const MOVED_FROM: Partial<Record<string, Layer>> = {
  // Compõem outro componente, ou são um grupo de átomos: molécula.
  field: "Átomos",
  "input-group": "Átomos",
  select: "Átomos",
  "native-select": "Átomos",
  "toggle-group": "Átomos",
  "radio-group": "Átomos",
  "button-group": "Átomos",
  "input-otp": "Átomos",
  "money-input": "Átomos",
  "search-input": "Átomos",
  tooltip: "Átomos",
  avatar: "Átomos",
  // Seções complexas: compõem duas moléculas, ou uma mais estado próprio.
  command: "Moléculas",
  combobox: "Moléculas",
  "date-picker": "Moléculas",
  calendar: "Moléculas",
  sheet: "Moléculas",
  drawer: "Moléculas",
  "form-picker-popover": "Moléculas",
  "alert-dialog": "Moléculas",
  // Não compõem nada, e estavam em Organismos por *fall-through*.
  table: "Organismos",
  chart: "Organismos",
  timeline: "Organismos",
  carousel: "Organismos",
  resizable: "Organismos",
  "navigation-menu": "Organismos",
  typography: "Organismos",
  "scroll-area": "Organismos",
  "scroll-fade": "Organismos",
  // Um elemento só.
  container: "Moléculas",
  form: "Moléculas",
  // Dispõem conteúdo numa página.
  "page-header": "Moléculas",
  "page-section": "Moléculas",
}

/**
 * A camada de cada componente. Sem padrão: o tipo obriga a listar todos.
 *
 * Os comentários dizem **por que**, e não o que — a camada já está na chave.
 */
const LAYER: Record<string, Layer> = {
  // ── Átomos: um elemento, e não compõem nada do sistema ──────────────────
  button: "Átomos",
  badge: "Átomos",
  input: "Átomos",
  textarea: "Átomos",
  label: "Átomos",
  checkbox: "Átomos",
  switch: "Átomos",
  slider: "Átomos",
  progress: "Átomos",
  toggle: "Átomos",
  kbd: "Átomos",
  separator: "Átomos",
  spinner: "Átomos",
  skeleton: "Átomos",
  code: "Átomos",
  "color-tile": "Átomos",
  "money-display": "Átomos",
  /** Uma `div` com largura e calha. Indivisível — o teste canônico de átomo. */
  container: "Átomos",
  /** Nove componentes de texto **independentes** no mesmo arquivo. Um arquivo
   *  que empacota átomos não vira molécula por isso: nenhum deles precisa dos
   *  outros para funcionar. */
  typography: "Átomos",
  /** Uma casca rolável, e uma máscara. Nenhum dos dois compõe nada. */
  "scroll-area": "Átomos",
  "scroll-fade": "Átomos",
  /** Um `<form>` com a política de Enter. Comportamento, não composição. */
  form: "Átomos",

  // ── Moléculas: peças que só existem juntas, sobre átomos ────────────────
  /** O exemplo canônico do Frost: rótulo + controle + erro. */
  field: "Moléculas",
  "input-group": "Moléculas",
  "search-input": "Moléculas",
  "money-input": "Moléculas",
  select: "Moléculas",
  "native-select": "Moléculas",
  "radio-group": "Moléculas",
  "toggle-group": "Moléculas",
  "button-group": "Moléculas",
  "input-otp": "Moléculas",
  tooltip: "Moléculas",
  /** Compõe o `Kbd` e resolve a plataforma: um acorde é um grupo de teclas. */
  "kbd-shortcut": "Moléculas",
  avatar: "Moléculas",
  card: "Moléculas",
  alert: "Moléculas",
  "empty-state": "Moléculas",
  "stat-card": "Moléculas",
  "announcement-bar": "Moléculas",
  item: "Moléculas",
  "description-list": "Moléculas",
  pagination: "Moléculas",
  accordion: "Moléculas",
  collapsible: "Moléculas",
  tabs: "Moléculas",
  stepper: "Moléculas",
  timeline: "Moléculas",
  table: "Moléculas",
  chart: "Moléculas",
  carousel: "Moléculas",
  resizable: "Moléculas",
  "navigation-menu": "Moléculas",
  popover: "Moléculas",
  "hover-card": "Moléculas",
  "dropdown-menu": "Moléculas",
  "context-menu": "Moléculas",
  menubar: "Moléculas",
  "edge-panel": "Moléculas",
  sonner: "Moléculas",

  // ── Organismos: seções complexas da interface ───────────────────────────
  /** Compõe o `DropdownMenu` para o miolo dobrado, e carrega contexto de
   *  tamanho: molécula + estado próprio é a definição de organismo. */
  breadcrumb: "Organismos",
  dialog: "Organismos",
  "alert-dialog": "Organismos",
  sheet: "Organismos",
  drawer: "Organismos",
  command: "Organismos",
  combobox: "Organismos",
  calendar: "Organismos",
  "date-picker": "Organismos",
  "form-picker-popover": "Organismos",
  toolbar: "Organismos",
  sidebar: "Organismos",
  "mobile-sheet-form-chrome": "Organismos",
  /** Renderiza `null`, mas consome o contexto do `Sheet` — ele é uma peça do
   *  organismo, e não um componente por conta própria. O *fall-through* o
   *  deixava aqui por acidente; agora está aqui por decisão. */
  "sheet-drag-handle": "Organismos",

  // ── Templates: o que estrutura a página ─────────────────────────────────
  "page-header": "Templates",
  "page-section": "Templates",
}

function categoryForSlug(slug: string): Category {
  const layer = LAYER[slug]
  if (!layer) {
    throw new Error(
      `[registry] "${slug}" não tem camada. Classifique-o em LAYER — ` +
        `nascer sem camada é como 32 componentes foram parar no lugar errado.`
    )
  }
  return layer
}

/** De qual camada a peça veio, para a marca temporária do catálogo. */
export function movedFrom(slug: string): Category | undefined {
  return MOVED_FROM[slug]
}

function sourcePath(source: string): string {
  if (source.startsWith("@/")) return source.replace("@/", "src/") + ".tsx"
  return source
}

function entry(
  slug: string,
  name: string,
  description: string,
  source: string,
  imports: string
): RegistryEntry {
  return {
    slug,
    name,
    category: categoryForSlug(slug),
    description,
    source: sourcePath(source),
    importLine: imports.startsWith("import ")
      ? imports
      : `import { ${imports} } from "${source}"`,
  }
}

export const REGISTRY: RegistryEntry[] = [
  // ── Fundações ───────────────────────────────────────────────────────────
  {
    slug: "cores",
    name: "Cores",
    category: "Fundações",
    description:
      "Tokens de superfície, status, dinheiro, identidade e a rampa de gráficos, nos dois temas.",
    source: "src/app/globals.css",
  },
  {
    slug: "tipografia",
    name: "Tipografia",
    category: "Fundações",
    description: "Inter na interface, Ledger no display, Geist Mono no dinheiro.",
    source: "src/components/ui/typography.tsx",
    importLine: 'import { H1, H2, Lead, P, Muted } from "@/components/ui/typography"',
  },
  {
    slug: "forma-elevacao",
    name: "Forma e elevação",
    category: "Fundações",
    description: "Os sete degraus de raio de canto e os cinco de sombra.",
    source: "src/app/globals.css",
  },
  {
    slug: "movimento",
    name: "Movimento",
    category: "Fundações",
    description: "Durações, curvas e o que acontece quando o sistema pede menos animação.",
    source: "src/app/globals.css",
  },
  {
    slug: "camadas",
    name: "Camadas (z-index)",
    category: "Fundações",
    description: "A ordem de empilhamento nomeada, do conteúdo ao toast.",
    source: "src/app/globals.css",
  },
  {
    slug: "marca",
    name: "Marca",
    category: "Fundações",
    description: "O símbolo, o lockup escrito e onde cada um se apresenta.",
    source: "src/components/layout/app-wordmark.tsx",
    importLine: 'import { AppWordmark } from "@/components/layout/app-wordmark"',
  },
  {
    slug: "iconografia",
    name: "Iconografia",
    category: "Fundações",
    description: "Heroicons, tamanhos por contexto e quando um ícone precisa de rótulo.",
    source: "@heroicons/react/24/outline",
    importLine: 'import { WalletIcon } from "@heroicons/react/24/outline"',
  },

  // ── Átomos ──────────────────────────────────────────────────────────────
  entry("button", "Button", "A ação clicável: variantes, tamanhos e estados.", ui("button"), "Button"),
  entry("button-group", "Button Group", "Botões colados que agem como uma unidade.", ui("button-group"), "ButtonGroup"),
  entry("badge", "Badge", "Rótulo compacto de status, contagem ou metadado.", ui("badge"), "Badge"),
  entry("input", "Input", "Campo de texto de uma linha, com três tamanhos.", ui("input"), "Input"),
  entry("textarea", "Textarea", "Campo de texto multilinha que cresce com o conteúdo.", ui("textarea"), "Textarea"),
  entry("label", "Label", "Rótulo acessível ligado a um controle.", ui("label"), "Label"),
  entry("search-input", "Search Input", "O campo de busca, com o × do navegador já suprimido.", ui("search-input"), "SearchInput"),
  entry("field", "Field", "A estrutura de um campo, e a ligação entre as peças dele.", ui("field"), "Field, FieldControl, FieldLabel, FieldDescription, FieldError, FieldGroup, FieldRow, FieldSet, FieldLegend, FieldSeparator"),
  entry("checkbox", "Checkbox", "Escolha booleana em formulários e listas.", ui("checkbox"), "Checkbox"),
  entry("radio-group", "Radio Group", "Escolha única entre poucas opções visíveis.", ui("radio-group"), "RadioGroup, RadioGroupItem"),
  entry("switch", "Switch", "Alternância que vale no instante em que é tocada.", ui("switch"), "Switch"),
  entry("select", "Select", "Lista suspensa de opções predefinidas.", ui("select"), "Select, SelectTrigger, SelectItem"),
  entry("native-select", "Native Select", "O select do sistema, sem JavaScript.", ui("native-select"), "NativeSelect"),
  entry("slider", "Slider", "Valor ou intervalo numérico contínuo.", ui("slider"), "Slider"),
  entry("progress", "Progress", "Barra de progresso com tons de status.", ui("progress"), "Progress"),
  entry("toggle", "Toggle", "Botão de dois estados.", ui("toggle"), "Toggle"),
  entry("toggle-group", "Toggle Group", "Conjunto de toggles: seleção única ou múltipla.", ui("toggle-group"), "ToggleGroup, ToggleGroupItem"),
  entry("input-group", "Input Group", "Campo com ícones, texto ou botões acoplados.", ui("input-group"), "InputGroup, InputGroupInput"),
  entry("input-otp", "Input OTP", "Entrada de código de verificação.", ui("input-otp"), "InputOTP, InputOTPSlot"),
  entry("kbd", "Kbd", "Uma tecla, um acorde ou uma sequência numa dica de atalho.", ui("kbd"), "Kbd, KbdGroup"),
  entry("kbd-shortcut", "Kbd Shortcut", "O acorde inteiro numa tecla só, e a formatação por sistema operacional.", "@/components/ui/kbd-shortcut", "KbdShortcut, formatShortcut"),
  entry("avatar", "Avatar", "Imagem ou iniciais, em cinco tamanhos.", ui("avatar"), "Avatar, AvatarImage, AvatarFallback"),
  entry("color-tile", "Color Tile", "O ladrilho que carrega uma cor escolhida pela pessoa.", ui("color-tile"), "ColorTile"),
  entry("separator", "Separator", "Divisor entre conteúdos.", ui("separator"), "Separator"),
  entry("tooltip", "Tooltip", "Dica curta ancorada a um gatilho.", ui("tooltip"), "Tooltip, TooltipTrigger, TooltipContent"),
  entry("spinner", "Spinner", "Carregamento sem progresso conhecido.", ui("spinner"), "Spinner"),
  entry("skeleton", "Skeleton", "O osso da tela enquanto o dado não chegou.", ui("skeleton"), "Skeleton"),
  entry("code", "Code", "Identificador literal dentro do texto.", ui("code"), "Code"),
  entry("money-display", "Money Display", "Todo valor em reais que o app mostra.", ui("money-display"), "MoneyDisplay"),
  entry("money-input", "Money Input", "Todo valor em reais que o app recebe.", ui("money-input"), "MoneyInput"),

  // ── Moléculas ───────────────────────────────────────────────────────────
  entry("card", "Card", "Cartão de conteúdo e painel — a superfície, o ritmo e as três tiras.", ui("card"), "Card, CardToolbar, CardContent, CardNote"),
  entry("alert", "Alert", "Aviso dentro do conteúdo — o tom, a forma e o corpo.", ui("alert"), "Alert, AlertTitle, AlertDescription, AlertActions"),
  entry("alert-dialog", "Alert Dialog", "Confirmação de uma ação sem volta, na régua do Dialog.", ui("alert-dialog"), "AlertDialog, AlertDialogAction, AlertDialogCancel"),
  entry("dialog", "Dialog", "Janela modal — a largura, a altura e o corpo que rola.", ui("dialog"), "Dialog, DialogContent, DialogBody, DialogFooter"),
  entry("sheet", "Sheet", "Folha no desktop, gaveta no telefone — uma API só.", ui("sheet"), "Sheet, SheetContent, SheetTrigger, SheetClose"),
  entry("edge-panel", "Edge Panel", "Painel preso a uma borda, em qualquer largura. É a navegação.", ui("edge-panel"), "EdgePanel, EdgePanelContent, EdgePanelTrigger"),
  entry("drawer", "Drawer", "Gaveta arrastável, com física de toque.", ui("drawer"), "Drawer, DrawerContent, DrawerTrigger"),
  entry("popover", "Popover", "Camada flutuante ancorada a um gatilho.", ui("popover"), "Popover, PopoverContent, PopoverTrigger"),
  entry("form-picker-popover", "Form Picker Popover", "O seletor ancorado num campo: busca, lista e pé.", ui("form-picker-popover"), "FormPickerPopover, FormPickerPopoverTrigger, FormPickerPopoverContent, FormPickerPopoverSearch, FormPickerPopoverList, FormPickerPopoverItem, FormPickerPopoverFooter"),
  entry("dropdown-menu", "Dropdown Menu", "Menu de ações, com checkbox, radio e submenu.", ui("dropdown-menu"), "DropdownMenu, DropdownMenuItem"),
  entry("context-menu", "Context Menu", "O mesmo menu, aberto pelo botão direito.", ui("context-menu"), "ContextMenu, ContextMenuItem"),
  entry("menubar", "Menubar", "Fileira de menus percorrida com a seta, em três superfícies.", ui("menubar"), "Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarCheckboxItem, MenubarRadioItem, MenubarSub"),
  entry("command", "Command", "Paleta de comandos com busca.", ui("command"), "Command, CommandInput, CommandItem"),
  entry("combobox", "Combobox", "Select com busca, uma ou várias escolhas.", ui("combobox"), "Combobox, ComboboxField, ComboboxTrigger, ComboboxValue, ComboboxClear, ComboboxContent, ComboboxInput, ComboboxList, ComboboxEmpty, ComboboxGroup, ComboboxItem, ComboboxLoading"),
  entry("tabs", "Tabs", "Alterna entre painéis do mesmo nível, em três superfícies.", ui("tabs"), "Tabs, TabsList, TabsTrigger, TabsContent"),
  entry("accordion", "Accordion", "Seções expansíveis, em três molduras e na escada de controles.", ui("accordion"), "Accordion, AccordionItem, AccordionTrigger, AccordionContent"),
  entry("collapsible", "Collapsible", "Um bloco que expande — e o fechado pode ser uma espiada que dissolve.", ui("collapsible"), "Collapsible, CollapsibleTrigger, CollapsibleMarker, CollapsibleContent"),
  entry("hover-card", "Hover Card", "Prévia ao pousar o cursor, com seta e a superfície do popover. Nunca no telefone.", ui("hover-card"), "HoverCard, HoverCardTrigger, HoverCardContent, HoverCardArrow"),
  entry("breadcrumb", "Breadcrumb", "A trilha até a tela atual, que dobra o miolo em vez de quebrar linha.", ui("breadcrumb"), "Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbMenu"),
  entry("pagination", "Pagination", "A posição numa lista longa, e os dois movimentos.", ui("pagination"), "Pagination, PaginationStatus, PaginationContent, PaginationLink"),
  entry("item", "Item", "Linha de lista com mídia, conteúdo e ações, espaçada ou dividida.", ui("item"), "ItemGroup, Item, ItemContent, ItemActions"),
  entry("description-list", "Description List", "Pares termo/valor para telas de detalhe, em coluna, em linha ou em grade.", ui("description-list"), "DescriptionList, DescriptionListItem, DescriptionTerm, DescriptionDetails"),
  entry("calendar", "Calendar", "A grade de um mês, com a célula na escada.", ui("calendar"), "Calendar, CalendarDayButton"),
  entry("date-picker", "Date Picker", "O campo de data — e de intervalo — em popover.", ui("date-picker"), "DatePicker"),
  entry("empty-state", "Empty State", "O que a tela diz quando não há nada nela, em três molduras.", ui("empty-state"), "EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateActions"),
  entry("stat-card", "Stat Card", "Um número que importa, com sua variação.", ui("stat-card"), "StatCard, StatCardLabel, StatCardValue, StatCardDelta"),
  entry("stepper", "Stepper", "Progresso por etapas de um fluxo, na horizontal ou na vertical.", ui("stepper"), "Stepper, StepperItem"),
  entry("sonner", "Toast", "Confirmação passageira, fora do fluxo.", ui("sonner"), 'import { toastSuccess, toastUndo } from "@/lib/toast"'),
  entry("announcement-bar", "Announcement Bar", "Aviso de largura total sobre o estado do app, com ícone e ação.", ui("announcement-bar"), "AnnouncementBar, AnnouncementBarContent, AnnouncementBarActions"),
  entry("toolbar", "Toolbar", "A linha de filtros e ações acima de uma lista, e a densidade dela.", ui("toolbar"), "Toolbar, ToolbarRow, ToolbarFilters, ToolbarActions, ToolbarFilterIndicator"),
  entry("form", "Form", "O formulário do projeto e o contrato do Enter.", ui("form"), "CustomForm, ENTER_DEFERRAL_RULES"),
  entry("page-header", "Page Header", "O topo de uma tela: trilha, título, fatos e a ação principal.", ui("page-header"), "PageHeader, PageHeaderTitleRow, PageHeaderTitle, PageHeaderDescription, PageHeaderEyebrow, PageHeaderMeta, PageHeaderActions"),
  entry("page-section", "Page Section", "O bloco que dá ritmo vertical a uma tela, com título e ação.", ui("page-section"), "PageSection, PageSectionHeader, PageSectionTitle, PageSectionDescription"),
  entry("container", "Container", "Espaçamento e largura: até onde o conteúdo cresce, a calha e o ritmo dos blocos.", ui("container"), "Container, containerSizes, containerGutters, containerStacks"),

  // ── Organismos ──────────────────────────────────────────────────────────
  entry("table", "Table", "Tabela de dados, e o que ela vira no telefone.", ui("table"), "Table, TableRow, TableCell"),
  entry("chart", "Chart", "Gráficos Recharts ligados aos tokens do tema.", ui("chart"), "ChartContainer, ChartTooltip"),
  entry("sidebar", "Sidebar", "A navegação lateral, com grupos e estado recolhido.", ui("sidebar"), "Sidebar, SidebarMenu, SidebarProvider"),
  entry("timeline", "Timeline", "Feed vertical de histórico.", ui("timeline"), "Timeline, TimelineItem"),
  entry("carousel", "Carousel", "Itens que deslizam horizontalmente.", ui("carousel"), "Carousel, CarouselItem"),
  entry("resizable", "Resizable", "Painéis redimensionáveis por uma alça.", ui("resizable"), "ResizablePanelGroup, ResizablePanel"),
  entry("scroll-area", "Scroll Area", "Área rolável com barra estilizada.", ui("scroll-area"), "ScrollArea, ScrollBar"),
  entry("scroll-fade", "Scroll Fade", "Área rolável que dissolve o conteúdo nas bordas.", ui("scroll-fade"), "ScrollFade"),
  entry("navigation-menu", "Navigation Menu", "Navegação com painéis suspensos.", ui("navigation-menu"), "NavigationMenu, NavigationMenuItem"),
  entry("sheet-drag-handle", "Sheet Drag Handle", "A alça que diz que a folha se arrasta.", ui("sheet-drag-handle"), "SheetDragHandle"),
  entry("mobile-sheet-form-chrome", "Mobile Sheet Form Chrome", "O cabeçalho e o rodapé fixos de um formulário em folha.", ui("mobile-sheet-form-chrome"), "MobileSheetFormChrome"),
  entry("typography", "Typography", "Os componentes de texto: H1 a H4, Lead, P, Muted, Small, Caption.", ui("typography"), "H1, H2, H3, H4, Lead, P, Muted, Small, Caption"),

  // ── Padrões ─────────────────────────────────────────────────────────────
  {
    slug: "dinheiro",
    name: "Dinheiro",
    category: "Padrões",
    description: "Como todo valor em reais é exibido, recebido e colorido.",
    source: "src/lib/formatters.ts",
    importLine: 'import { currencyBRL, signedCurrencyBRL, percentBR } from "@/lib/formatters"',
  },
  {
    slug: "datas",
    name: "Datas",
    category: "Padrões",
    description: "As formas de escrever uma data, e qual usar em cada lugar.",
    source: "src/lib/transaction-date.ts",
    importLine: 'import { formatDatePtBr, formatRelativeDayPtBr } from "@/lib/transaction-date"',
  },
  {
    slug: "formularios",
    name: "Formulários e Enter",
    category: "Padrões",
    description: "Por que todo formulário usa CustomForm e o que o Enter faz em cada campo.",
    source: "src/components/ui/form.tsx",
  },
  {
    slug: "mobile-toque",
    name: "Mobile e toque",
    category: "Padrões",
    description: "As duas portas do alvo de toque, a política de hover e a área segura.",
    source: "src/lib/tailwind-hover-policy.test.ts",
  },
  {
    slug: "vazio-carregando",
    name: "Vazio e carregando",
    category: "Padrões",
    description: "O que a tela mostra antes do dado e quando não há dado.",
    source: "src/components/ui/empty-state.tsx",
  },
  {
    slug: "graficos",
    name: "Gráficos",
    category: "Padrões",
    description: "Quando a série usa a rampa categórica e quando usa a cor do dinheiro.",
    source: "src/components/ui/chart.tsx",
  },
  {
    slug: "chips-status",
    name: "Chips de status",
    category: "Padrões",
    description: "O vocabulário de estados e a classe que corresponde a cada um.",
    source: "src/lib/tag-chip-classes.ts",
    importLine: 'import { tagChipSuccess, tagChipIncome } from "@/lib/tag-chip-classes"',
  },
]

export function getEntry(slug: string): RegistryEntry | undefined {
  return REGISTRY.find((e) => e.slug === slug)
}

export function groupedRegistry(): { category: Category; items: RegistryEntry[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: REGISTRY.filter((e) => e.category === category),
  }))
}

/**
 * A ordem de leitura do catálogo: a mesma da navegação lateral, categoria por
 * categoria. É ela que sustenta o anterior/próximo no pé de cada página — sem
 * isso, a única saída de uma página era voltar à lista e procurar de novo.
 */
export function readingOrder(): RegistryEntry[] {
  return groupedRegistry().flatMap((g) => g.items)
}

export function getNeighbors(slug: string): {
  previous?: RegistryEntry
  next?: RegistryEntry
} {
  const order = readingOrder()
  const i = order.findIndex((e) => e.slug === slug)
  if (i < 0) return {}
  return { previous: order[i - 1], next: order[i + 1] }
}

/** O id de âncora de uma categoria no índice. Usado também pelo breadcrumb. */
export function slugifyCategory(category: string): string {
  return category
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
}
