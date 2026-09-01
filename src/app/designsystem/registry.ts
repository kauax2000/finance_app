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
  "Padrões",
]

const ui = (name: string) => `@/components/ui/${name}`

/**
 * A categoria sai do slug em vez de ser repetida em cada entrada: com 80 itens,
 * a repetição é onde a lista começa a mentir.
 */
const ATOMS = new Set([
  "button", "button-group", "badge", "input", "textarea", "label", "field",
  "checkbox", "radio-group", "switch", "select", "native-select", "slider",
  "progress", "toggle", "toggle-group", "input-group", "input-otp", "kbd",
  "avatar", "separator", "tooltip", "spinner", "skeleton",
  "code", "money-display", "money-input", "color-tile",
])

const MOLECULES = new Set([
  "card", "alert", "alert-dialog", "tabs", "breadcrumb", "dialog", "sheet",
  "popover", "dropdown-menu", "sonner", "calendar", "date-picker", "empty-state",
  "stat-card", "stepper", "accordion", "collapsible", "hover-card", "item",
  "pagination", "context-menu", "menubar", "command", "combobox", "drawer",
  "form", "form-picker-popover", "description-list", "announcement-bar",
  "edge-panel",
  "page-header", "page-section", "container", "toolbar",
])

function categoryForSlug(slug: string): Category {
  if (ATOMS.has(slug)) return "Átomos"
  if (MOLECULES.has(slug)) return "Moléculas"
  return "Organismos"
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
    slug: "espacamento",
    name: "Espaçamento e largura",
    category: "Fundações",
    description: "O ritmo vertical das seções e os quatro degraus de largura de conteúdo.",
    source: "src/components/ui/container.tsx",
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
  entry("field", "Field", "A estrutura de um campo: rótulo, descrição e erro.", ui("field"), "Field, FieldLabel, FieldDescription"),
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
  entry("breadcrumb", "Breadcrumb", "A trilha até a tela atual.", ui("breadcrumb"), "Breadcrumb, BreadcrumbItem"),
  entry("pagination", "Pagination", "Navegação entre páginas de uma lista.", ui("pagination"), "Pagination, PaginationItem"),
  entry("item", "Item", "Linha de lista com mídia, conteúdo e ações.", ui("item"), "Item, ItemContent, ItemActions"),
  entry("description-list", "Description List", "Pares termo/valor para telas de detalhe.", ui("description-list"), "DescriptionList, DescriptionTerm"),
  entry("calendar", "Calendar", "A grade de um mês.", ui("calendar"), "Calendar"),
  entry("date-picker", "Date Picker", "Escolha de data e de intervalo, em popover.", ui("date-picker"), "DatePicker"),
  entry("empty-state", "Empty State", "O que a tela diz quando não há nada nela.", ui("empty-state"), "EmptyState"),
  entry("stat-card", "Stat Card", "Um número que importa, com sua variação.", ui("stat-card"), "StatCard"),
  entry("stepper", "Stepper", "Progresso por etapas de um fluxo.", ui("stepper"), "Stepper, StepperItem"),
  entry("sonner", "Toast", "Confirmação passageira, fora do fluxo.", ui("sonner"), 'import { toast } from "sonner"'),
  entry("announcement-bar", "Announcement Bar", "Aviso de largura total sobre o estado do app.", ui("announcement-bar"), "AnnouncementBar"),
  entry("toolbar", "Toolbar", "A linha de filtros e ações acima de uma lista.", ui("toolbar"), "Toolbar, ToolbarSearch, ToolbarActions"),
  entry("form", "Form", "O formulário do projeto e o contrato do Enter.", ui("form"), "CustomForm"),
  entry("page-header", "Page Header", "Título, descrição e ações de uma tela.", ui("page-header"), "PageHeader"),
  entry("page-section", "Page Section", "O bloco que dá ritmo vertical a uma tela.", ui("page-section"), "PageSection"),
  entry("container", "Container", "A largura máxima do conteúdo.", ui("container"), "Container"),

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
