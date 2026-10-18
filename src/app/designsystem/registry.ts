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
  "Foundations",
  "Atoms",
  "Molecules",
  "Organisms",
  "Templates",
]

const ui = (name: string) => `@/components/ui/${name}`

/**
 * A camada de cada peça, pelo modelo do atomic design. Cada `entry()` mora dentro do `layer()` da sua camada,
 * e isso é exaustivo por tipo: um componente novo sem camada não compila (derivar do slug classificava errado
 * em silêncio). A régua mede a composição que a API expõe, não o embrulho: um `Slider` com quatro primitivas
 * Radix por dentro é átomo.
 *
 * ## A regra: a hierarquia é de composição, e cresce
 *
 * | Camada | A definição | O teste |
 * | --- | --- | --- |
 * | `Fundações` | os átomos abstratos: cor, tipo, forma, movimento, camada | é decisão que atravessa o sistema — família, token, ativo —, e não uma peça que se compõe |
 * | `Átomos` | indivisível | um controle, um elemento, uma casca. **Anatomia interna** (trigger/content/item, track/thumb, `<option>`) não é composição. **Especializar** outro átomo continua átomo — hoje sem caso vivo, ver o teste |
 * | `Moléculas` | feita de átomos | grupo pequeno de átomos que resolve uma tarefa e lê como uma unidade. Título + descrição é texto, não molécula. Lista cuja **unidade é um átomo** é molécula |
 * | `Organismos` | feita de moléculas | seção com estrutura própria — **faixas** (cabeçalho/corpo/rodapé), grupos, submenus, linhas. Superfície com faixas é organismo. Lista cuja **unidade é uma molécula** é organismo. **Quem contém organismo é organismo** |
 * | `Templates` | objetos de nível de página, que dispõem componentes num layout | o que estrutura a página, e não o que ela contém |
 *
 * `Container` é Átomo (uma `div` com largura, não dispõe nada); quem dispõe é o `PageHeader`, o `PageSection`
 * e o `TopBar`, que por isso são Templates. Não existe uma sexta gaveta: uma decisão sem dono é um componente
 * ou um token faltando, e não uma página.
 *
 * O `taxonomy.test.ts` tranca a parte mecânica (o grafo de imports) e a ordem alfabética dentro de cada
 * categoria. O que o grafo não alcança mora nos comentários sobre cada `entry()`.
 */
type Layer = Exclude<Category, "Foundations">

function sourcePath(source: string): string {
  if (source.startsWith("@/")) return source.replace("@/", "src/") + ".tsx"
  return source
}

/** Uma entrada sem camada: só vira `RegistryEntry` dentro de {@link layer}. */
type Unlayered = Omit<RegistryEntry, "category">

function entry(
  slug: string,
  name: string,
  description: string,
  source: string,
  imports: string
): Unlayered {
  return {
    slug,
    name,
    description,
    source: sourcePath(source),
    importLine: imports.startsWith("import ")
      ? imports
      : `import { ${imports} } from "${source}"`,
  }
}

/**
 * A camada de um bloco de componentes. Sem padrão: um `entry()` fora de um `layer()` não tem `category` e não
 * compila dentro do `REGISTRY`. Os comentários sobre cada `entry()` dizem por que ele está na camada.
 */
function layer(category: Layer, entries: Unlayered[]): RegistryEntry[] {
  return entries.map(({ slug, name, ...rest }) => ({ slug, name, category, ...rest }))
}

export const REGISTRY: RegistryEntry[] = [
  // ── Foundations ───────────────────────────────────────────────────────────
  {
    slug: "brand",
    name: "Brand",
    category: "Foundations",
    description: "O símbolo, o lockup e onde usar cada um.",
    source: "src/components/layout/app-wordmark.tsx",
    importLine: 'import { AppWordmark } from "@/components/layout/app-wordmark"',
  },
  {
    slug: "colors",
    name: "Colors",
    category: "Foundations",
    description: "Tokens de superfície, status, dinheiro e gráficos.",
    source: "src/app/globals.css",
  },
  {
    slug: "iconography",
    name: "Iconography",
    category: "Foundations",
    description: "Heroicons: conjunto, tamanho e rótulo.",
    source: "@heroicons/react/24/outline",
    importLine: 'import { WalletIcon } from "@heroicons/react/24/outline"',
  },
  {
    slug: "layers",
    name: "Layers (z-index)",
    category: "Foundations",
    description: "A ordem de empilhamento, do conteúdo ao toast.",
    source: "src/app/globals.css",
  },
  {
    slug: "motion",
    name: "Motion",
    category: "Foundations",
    description: "Durações, curvas e movimento reduzido.",
    source: "src/app/globals.css",
  },
  {
    slug: "shape-elevation",
    name: "Shape & elevation",
    category: "Foundations",
    description: "Degraus de raio de canto e de sombra.",
    source: "src/app/globals.css",
  },
  {
    // Token e política de variante (`--mobile-*`, `@custom-variant` de hover), todos em `globals.css`.
    slug: "touch-safe-area",
    name: "Touch & safe area",
    category: "Foundations",
    description: "Alvo de 44px, hover e área segura.",
    source: "src/app/globals.css",
  },
  {
    // O slug é o do arquivo (`typography.tsx`): a asserção 1 de `taxonomy.test.ts` o exige.
    slug: "typography",
    name: "Typography",
    category: "Foundations",
    description: "Famílias, componentes de texto e formatos de data.",
    source: "src/components/ui/typography.tsx",
    importLine:
      'import { H1, H2, H3, H4, Lead, P, Muted, Small, Caption } from "@/components/ui/typography"',
  },

  // ── Atoms ──────────────────────────────────────────────────────────────
  ...layer("Atoms", [
    /** Um objeto. Imagem e fallback são estados dele, não partes. */
    entry("avatar", "Avatar", "Imagem ou iniciais, em cinco tamanhos.", ui("avatar"), "Avatar, AvatarImage, AvatarFallback"),
    entry("badge", "Badge", "Rótulo compacto de status ou contagem.", ui("badge"), "Badge, BadgeDot"),
    entry("button", "Button", "A ação clicável, em degraus de peso e tamanho.", ui("button"), "Button"),
    entry("checkbox", "Checkbox", "Escolha booleana em formulários e listas.", ui("checkbox"), "Checkbox"),
    entry("code", "Code", "Identificador literal dentro do texto.", ui("code"), "Code"),
    entry("color-tile", "Color Tile", "Ladrilho com a cor escolhida pela pessoa.", ui("color-tile"), "ColorTile"),
    /** Uma `div` com largura e calha. Indivisível — átomo por decisão do dono. */
    entry("container", "Container", "Largura, calha e ritmo do conteúdo.", ui("container"), "Container, containerSizes, containerGutters, containerStacks"),
    /**
     * Uma casca desenhada: barra, ilha, trilho, abas e barra de status são anatomia da moldura (são partes
     * dela, não peças do sistema). O único import de `ui/` é o `Skeleton` do esqueleto.
     */
    entry("device-frame", "Device Frame", "Navegador, tablet ou celular desenhado com tokens, que muda de forma animando.", ui("device-frame"), "DeviceFrame, DeviceFrameScreen, DeviceFrameSkeleton, useDeviceFrame"),
    /** O vidro é modo, e não peça: a tradução cabe num eixo `glass` dos próprios átomos. O que decide "componente ou modo?" é a tradução precisar de uma peça para existir. */
    entry("input", "Input", "Campo de uma linha, inclusive de dinheiro.", ui("input"), "Input"),
    entry("input-otp", "Input OTP", "Entrada de código de verificação.", ui("input-otp"), "InputOTP, InputOTPSlot"),
    /** Uma tecla, ou o acorde inteiro numa pastilha só (as partes do acorde são anatomia). A sequência junta átomos, e é o `kbd-group`. */
    entry("kbd", "Kbd", "Uma tecla ou um atalho.", ui("kbd"), "Kbd"),
    entry("label", "Label", "Rótulo acessível ligado a um controle.", ui("label"), "Label"),
    entry("money-display", "Money Display", "Todo valor em reais que o app mostra.", ui("money-display"), "MoneyDisplay"),
    /** A seta desenhada e a pílula do nome são anatomia de um ponteiro só; nenhum import de `ui/`. */
    entry("presence-cursor", "Presence Cursor", "O ponteiro de outra pessoa: a seta e o nome na cor de identidade.", ui("presence-cursor"), "PresenceCursor"),
    entry("progress", "Progress", "Quanto de um total foi consumido: barra, segmentada ou anel.", ui("progress"), "Progress, ProgressHeader, ProgressLabel, ProgressValue, ProgressFooter, ProgressRing"),
    /** O controle inteiro — o anel e o ponto; quem compõe é o `radio-group`. Exige contexto para renderizar, e contexto de primitiva não é composição. */
    entry("radio", "Radio", "Uma opção de escolha única.", ui("radio"), "Radio"),
    /** Group, Panel e Separator são a anatomia de uma coisa (um controle de proporção). O `Button` do gatilho de colapso é o único import de `ui/`, e a asserção 2 deixa exatamente um. */
    entry("resizable", "Resizable", "Painéis e colunas de tabela redimensionáveis por arraste.", ui("resizable"), "ResizablePanelGroup, ResizablePanel, ResizableHandle, ResizableColumnHandle"),
    /** Uma casca rolável, e uma máscara. */
    entry("scroll-area", "Scroll Area", "Região rolável: a barra desenhada, e as bordas que dissolvem.", ui("scroll-area"), "ScrollArea, ScrollBar"),
    entry("separator", "Separator", "Divisor entre conteúdos.", ui("separator"), "Separator"),
    entry("skeleton", "Skeleton", "Placeholder enquanto o dado carrega.", ui("skeleton"), "Skeleton"),
    entry("slider", "Slider", "Valor ou intervalo numérico contínuo.", ui("slider"), "Slider"),
    entry("spinner", "Spinner", "Carregamento sem progresso conhecido.", ui("spinner"), "Spinner"),
    entry("switch", "Switch", "Liga e desliga com efeito imediato.", ui("switch"), "Switch"),
    entry("textarea", "Textarea", "Campo de texto multilinha.", ui("textarea"), "Textarea"),
    /**
     * Um controle. Trilho, polegar e as duas faces são anatomia de um `Switch`
     * do Radix, e o único import de `ui/` é o `Skeleton` do gate de montagem.
     */
    entry("theme-toggle", "Theme Toggle", "Escolhe entre sistema, claro e escuro.", ui("theme-toggle"), "ThemeToggle"),
    entry("toggle", "Toggle", "Botão de dois estados.", ui("toggle"), "Toggle"),
    /** Um rótulo que aparece. Carrega só texto. */
    entry("tooltip", "Tooltip", "Dica curta ancorada a um gatilho.", ui("tooltip"), "Tooltip, TooltipTrigger, TooltipContent"),
  ]),

  // ── Molecules ───────────────────────────────────────────────────────────
  ...layer("Molecules", [
    /** O aviso e a ação dele: `AlertAction` compõe o `Button`, em vez de a tela escrever `variant="tertiary"`. */
    entry("alert", "Alert", "Aviso dentro do conteúdo.", ui("alert"), "Alert, AlertTitle, AlertDescription, AlertActions, AlertAction"),
    /** A faixa de estado global e as peças dela; o × de dispensar é um `Button`, e a ação também é peça. */
    entry("announcement-bar", "Announcement Bar", "Aviso de largura total sobre o app.", ui("announcement-bar"), "AnnouncementBar, AnnouncementBarContent, AnnouncementBarActions, AnnouncementBarAction"),
    entry("button-group", "Button Group", "Botões colados que agem como uma unidade.", ui("button-group"), "ButtonGroup, ButtonGroupText"),
    entry("collapsible", "Collapsible", "Bloco que expande e recolhe.", ui("collapsible"), "Collapsible, CollapsibleTrigger, CollapsibleRow, CollapsibleMarker, CollapsibleLabel, CollapsibleContent"),
    entry("description-list", "Description List", "Pares termo e valor em telas de detalhe.", ui("description-list"), "DescriptionList, DescriptionListItem, DescriptionTerm, DescriptionDetails, DescriptionHint"),
    entry("empty-state", "Empty State", "O que a tela mostra quando está vazia — e a forma diz a situação.", ui("empty-state"), "EmptyState, EmptyStateIcon, EmptyStateGhost, EmptyStateCode, EmptyStateTitle, EmptyStateActions"),
    /** O exemplo canônico do Frost: rótulo + controle + erro. */
    entry("field", "Field", "Rótulo, controle, ajuda e erro ligados.", ui("field"), "Field, FieldControl, FieldLabel, FieldHeader, FieldCounter, FieldDescription, FieldChecklist, FieldError, FieldGroup, FieldRow, FieldSet, FieldLegend, FieldSeparator"),
    entry("input-group", "Input Group", "Campo com ícones, texto ou botões acoplados.", ui("input-group"), "InputGroup, InputGroupInput, InputGroupTextarea, InputGroupAddon, InputGroupText, InputGroupButton, InputGroupPasswordToggle, InputGroupSelect"),
    entry("item", "Item", "Linha de lista com mídia, conteúdo e ações.", ui("item"), "ItemGroup, Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions, ItemChevron, ItemLink, ItemHeader, ItemFooter, ItemSeparator, ItemGroupLabel"),
    /** A sequência: um `Kbd` por tecla. Importa o átomo de fato (`keys`). */
    entry("kbd-group", "Kbd Group", "Sequência de teclas.", ui("kbd-group"), "KbdGroup"),
    entry("pagination", "Pagination", "Navegação entre páginas de uma lista.", ui("pagination"), "Pagination, PaginationStatus, PaginationContent, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis, PaginationMore"),
    /** A junção: `Radio` + `Label`, e o cartão. Importa os átomos de fato (`children` da opção). */
    entry("radio-group", "Radio Group", "Escolha única entre poucas opções — em linha, em cartão, em ladrilho ou em fichas.", ui("radio-group"), "RadioGroup, RadioGroupItem"),
    /** A pílula de busca: `Button` (o ×), `Kbd` (o atalho) e `Spinner` (`pending`); não é o grupo de campo. */
    entry("search-input", "Search Input", "O campo de busca — a pílula do cabeçalho e da paleta.", ui("search-input"), "SearchInput"),
    /** Um controle. Trigger, content e item são a anatomia dele, não composição. */
    entry("select", "Select", "Lista suspensa de opções predefinidas, desenhada ou do sistema.", ui("select"), "Select, SelectTrigger, SelectItem, NativeSelect"),
    entry("toggle-group", "Toggle Group", "Conjunto de toggles: seleção única ou múltipla, em fichas, numa bandeja segmentada ou na pílula das Tabs.", ui("toggle-group"), "ToggleGroup, ToggleGroupItem"),
  ]),

  // ── Organisms ──────────────────────────────────────────────────────────
  ...layer("Organisms", [
    /** A unidade é um `Collapsible` — uma molécula. */
    /** Lista cuja unidade é uma molécula: `AccordionItem` + `Trigger` + `Content` é um `Collapsible`, e cada item tem estado próprio, o que a anatomia de um `Select` (escolha entre valores) não tem. */
    entry("accordion", "Accordion", "Seções expansíveis.", ui("accordion"), "Accordion, AccordionItem, AccordionTrigger, AccordionContent, AccordionToggleAll"),
    entry("alert-dialog", "Alert Dialog", "Confirmação de uma ação sem volta.", ui("alert-dialog"), "AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogMedia, AlertDialogList, AlertDialogError, AlertDialogConfirmInput"),
    /** Uma pilha de `Avatar`s seria molécula; a lista do +N é um `Popover` (e,
     *  no telefone, a gaveta), e quem contém organismo é organismo. */
    entry("avatar-group", "Avatar Group", "Pessoas empilhadas: o rosto sobe, a dica viaja, o +N abre a lista.", ui("avatar-group"), "AvatarGroup, AvatarGroupItem, AvatarGroupAdd, AvatarGroupSkeleton"),
    /** Contém um `DropdownMenu` no miolo dobrado — quem contém organismo é
     *  organismo. */
    entry("breadcrumb", "Breadcrumb", "A trilha até a tela atual.", ui("breadcrumb"), "Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbMenu, BreadcrumbSwitcher, BreadcrumbSwitcherItem"),
    entry("calendar", "Calendar", "A grade de um mês — escolha, intervalo com atalhos, marcadores e a agenda de fios.", ui("calendar"), "Calendar, CalendarDayButton, CalendarEvent, CalendarEvents, CalendarSkeleton"),
    /** Superfície com faixas: barra, cabeçalho, corpo, rodapé, nota. A mesma
     *  anatomia do `Dialog`. */
    entry("card", "Card", "Cartão de conteúdo e painel.", ui("card"), "Card, CardHeader, CardTitle, CardDescription, CardAction, CardToolbar, CardContent, CardBody, CardField, CardLink, CardMedia, CardMessage, CardNote, CardFooter, CardSkeleton"),
    entry("carousel", "Carousel", "Itens que deslizam na horizontal ou na vertical — uma biblioteca de versões sobre um motor só.", ui("carousel"), "Carousel, CarouselContent, CarouselItem, CarouselMore, CarouselPrevious, CarouselNext, CarouselDots, CarouselProgress, CarouselStatus, CarouselToolbar, CarouselCaption, CarouselPlayPause, CarouselSteps, CarouselStep, CarouselThumbs, CarouselThumb, CarouselFullscreen, CarouselSkeleton"),
    entry("chart", "Chart", "Gráficos ligados aos tokens do tema.", ui("chart"), "ChartAnnotation, ChartArea, ChartBarList, ChartBars, ChartContainer, ChartDonut, ChartHeatmap, ChartLine, ChartRadar, ChartRadial, ChartSparkline, ChartSplit, ChartWaterfall"),
    entry("combobox", "Combobox", "Select com busca, uma ou várias escolhas.", ui("combobox"), "Combobox, ComboboxField, ComboboxTrigger, ComboboxTextField, ComboboxValue, ComboboxClear, ComboboxChips, ComboboxContent, ComboboxInput, ComboboxActions, ComboboxList, ComboboxEmpty, ComboboxGroup, ComboboxItem, ComboboxCreate, ComboboxLoading"),
    entry("command", "Command", "Paleta de comandos com busca.", ui("command"), "Command, CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem, CommandHighlight, CommandPages, CommandPage, CommandSplit, CommandPreview, CommandDock"),
    entry("context-menu", "Context Menu", "O mesmo menu, aberto pelo botão direito, pelo toque longo e por Shift+F10.", ui("context-menu"), "ContextMenu, ContextMenuContent, ContextMenuHeader, ContextMenuItem, contextMenuTargets"),
    entry("date-picker", "Date Picker", "Campo de data, intervalo ou mês — popover no desktop, gaveta no telefone.", ui("date-picker"), "DatePicker, MonthGrid"),
    entry("dialog", "Dialog", "Janela modal — e gaveta no telefone, com surface=\"auto\".", ui("dialog"), "Dialog, DialogContent, DialogHeader, DialogMedia, DialogSteps, DialogBody, DialogFooter"),
    entry("drawer", "Drawer", "Gaveta arrastável, com física de toque — e a folha de ações.", ui("drawer"), "Drawer, DrawerContent, DrawerTrigger, DrawerActions, DrawerAction, DrawerCancel"),
    entry("dropdown-menu", "Dropdown Menu", "Menu de ações, com busca, confirmação e a folha de ações no telefone.", ui("dropdown-menu"), "DropdownMenu, DropdownMenuContent, DropdownMenuHeader, DropdownMenuItem"),
    /** Compõe `Popover`, `Command`, `DropdownMenu` e `Calendar` — quem contém
     *  organismo é organismo. */
    entry("filter-bar", "Filter Bar", "Os filtros aplicados em tokens campo · operador · valor, editáveis no lugar — com o E/OU, a contagem, a URL e o teclado de toolbar.", ui("filter-bar"), "FilterBar, FilterBarSkeleton, serializeFilters, parseFilters, filterPeriodRange"),
    /** Compõe `field` e `radio-group` (duas moléculas) e tem estado próprio (a política do Enter, o `id` em contexto): organismo. */
    entry("form", "Form", "Formulário com as peças, o Enter, a validação em português e o envio que espera sozinho.", ui("form"), "Form, FormInput, FormField, FormSwitch, FormPickerPopover, FormSubmit"),
    /** Compõe o StatCard, e quem contém organismo é organismo. */
    entry("histogram-slider", "Histogram Slider", "Faixa de valor sobre uma distribuição, com atalhos, contagem, eixo e referência.", ui("histogram-slider"), "HistogramSlider"),
    entry("hover-card", "Hover Card", "Prévia ao pousar o cursor — e no toque longo, com o grupo e o carregando.", ui("hover-card"), "HoverCard, HoverCardGroup, HoverCardTrigger, HoverCardContent, HoverCardHeader, HoverCardLink"),
    entry("menubar", "Menubar", "Fileira de menus com o realce que viaja, a busca de comandos e a folha no telefone.", ui("menubar"), "Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarRadioGroup"),
    entry("navigation-menu", "Navigation Menu", "Navegação de um cabeçalho público, com o realce que viaja e o painel que aprofunda.", ui("navigation-menu"), "NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuPanel, NavigationMenuGroup, NavigationMenuLink"),
    /** Compõe `Dialog`, `Popover`, `Carousel`, `Card` e `Accordion` — quem
     *  contém organismo é organismo. */
    entry("onboarding", "Onboarding", "Apresentar o produto: as boas-vindas em passos, os primeiros passos, a novidade na barra, o tour com foco num botão real e o ponto que pulsa.", ui("onboarding"), "OnboardingDialog, OnboardingChecklist, OnboardingCard, OnboardingTour, OnboardingHotspot, OnboardingMedia, OnboardingSkeleton"),
    entry("popover", "Popover", "Camada flutuante ancorada a um gatilho — com a confirmação curta e a gaveta no telefone.", ui("popover"), "Popover, PopoverContent, PopoverTrigger, PopoverHeader, PopoverConfirm"),
    entry("sheet", "Sheet", "Painel de borda no desktop, gaveta no telefone.", ui("sheet"), "Sheet, SheetContent, SheetTrigger, SheetClose"),
    /** Compõe o `DeviceFrame`, o `PresenceCursor` e o `Card` (organismo) — quem contém organismo é organismo. */
    entry("showcase", "Showcase", "O palco decorativo onde o app se apresenta: o herói que muda de forma, a colagem nas bordas, a paleta que voa, os cursores e a legenda.", ui("showcase"), "ShowcaseStage, ShowcaseHero, ShowcaseScatter, ShowcaseScatterItem, ShowcaseFloat, ShowcaseFlight, ShowcasePiece, ShowcaseSwap, ShowcaseCursor, ShowcaseDots, ShowcaseCaption, ShowcaseSkeleton, SHOWCASE_SLOTS, useShowcase"),
    /** Especializa o `Card`; especializar mantém o degrau. */
    entry("stat-card", "Stat Card", "Um número que importa, com sua variação.", ui("stat-card"), "StatCard, StatCardGroup, StatCardHeader, StatCardLabel, StatCardIcon, StatCardValue, StatCardDelta"),
    entry("stepper", "Stepper", "Progresso por etapas de um fluxo.", ui("stepper"), "Stepper, StepperItem, StepperContent, StepperActions, StepperPrevious, StepperNext"),
    /** A linha (células = átomos) é a molécula; a tabela é feita de linhas. */
    entry("table", "Table", "Tabela de dados: cinco densidades, coluna fixa, grupo com total, detalhe, esqueleto e erro.", ui("table"), "Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableGroupRow, TableRowDetail, TableSkeleton, TableCellIdentity, TableCellMoney"),
    entry("tabs", "Tabs", "Alterna entre painéis do mesmo nível — a pílula flutuante, o marcador que corre, a contagem, o Mais e a navegação.", ui("tabs"), "Tabs, TabsList, TabsTrigger, TabsContent, TabsAdd, TabsNav, TabsNavLink"),
    entry("timeline", "Timeline", "Feed cronológico de eventos: estado na trilha, coluna de data, linha compacta, faixa de dia presa, recolhidos, detalhe, link, tempo relativo, feed ao vivo e o fio que se desenha.", ui("timeline"), "Timeline, TimelineItem, TimelineHeader, TimelineTitle, TimelineDescription, TimelineTime, TimelineSeparator, TimelineGroup, TimelineActions, TimelineCard, TimelineDetail, TimelineLink, TimelineCollapsed, TimelineSkeleton"),
    /** Uma pilha de toasts, cada um ícone + título + texto + ação. */
    entry("sonner", "Toast", "Confirmação passageira, fora do fluxo: a placa flutuante de vidro com o tom no ícone, o Desfazer com contagem, o Ver, o progresso, a pílula e os repetidos.", ui("sonner"), 'import { toastSuccess, toastError, toastUndo, toastPromise, toastProgress, toastPill } from "@/lib/toast"'),
  ]),

  // ── Templates ───────────────────────────────────────────────────────────
  ...layer("Templates", [
    /** A barra de baixo do telefone, irmã do `top-bar`: dispõe onde as abas, o slot de conta e a ação primária vão. */
    entry("bottom-bar", "Bottom Bar", "A barra de abas do telefone — o marcador do Tabs, o arraste, a contagem, o rótulo só na ativa e o some-ao-rolar.", ui("bottom-bar"), "BottomBar, BottomBarTab, BottomBarSlot, BottomBarAction, BottomBarSkeleton, BottomBarRow, BottomBarTabs, bottomBarActionClassName"),
    /** O motor da TanStack Table por baixo do `TablePanel`, que mora no mesmo arquivo e na mesma página. */
    entry("data-table", "Data Table", "A tabela com o estado — ordenar, filtrar, marcar, agrupar, expandir, exportar e editar — e a moldura dela.", ui("data-table"), "DataTable, TablePanel, TablePanelToolbar, TablePanelFooter, dataTableColumns, DataTableSelectionBar, DataTableFacetFilter, DataTableViewOptions"),
    entry("page-header", "Page Header", "O topo de uma tela: título, identidade, ações, números e navegação — compacto no telefone, e o título sobe para a barra.", ui("page-header"), "PageHeader, PageHeaderTitleRow, PageHeaderTitle, PageHeaderDescription, PageHeaderEyebrow, PageHeaderMedia, PageHeaderMeta, PageHeaderStat, PageHeaderNav, PageHeaderActions, PageHeaderBack, PageHeaderBreadcrumb, PageHeaderSkeleton"),
    entry("page-section", "Page Section", "Bloco de uma tela, com título e ação — uma região nomeada pelo título, que recolhe e prende o cabeçalho sob a barra.", ui("page-section"), "PageSection, PageSectionHeader, PageSectionTitle, PageSectionDescription, PageSectionLink, PageSectionMeta, PageSectionFooter, PageSectionSkeleton"),
    /**
         * A casca da página com navegação, irmã do `top-bar` e do `bottom-bar`. Conter organismos diz o piso, não a
         * camada: o que decide é dispor a página (a barra de um lado, o conteúdo do outro, o estado entre as duas).
         */
    entry("sidebar", "Sidebar", "A navegação lateral do app — e, sem placa (plain), a do catálogo.", ui("sidebar"), "Sidebar, SidebarProvider, SidebarInset, SidebarTrigger, SidebarRail, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuButton, useSidebar"),
    /** A página dividida: campo de um lado, coluna do outro. Recebe o campo por slot, porque conteúdo de produto não mora em `ui/`. */
    entry("split-shell", "Split Shell", "Campo de um lado, coluna de conteúdo do outro — quebra pelo casco, com o voltar, o pé e os passos.", ui("split-shell"), "SplitShell, SplitShellRoot, SplitShellMain, SplitShellAside, SplitShellBack, SplitShellFooter, SplitShellSkeleton"),
    /**
         * A barra de uma lista: dispõe onde os filtros, as ações e as fichas vão. Conter organismos diz o piso, não a
         * camada; ela prende sob o `TopBar`, como as barras da página.
         */
    entry("toolbar", "Toolbar", "Filtros e ações acima de uma lista — presa sob a barra do topo, com o botão de filtros, as fichas, a busca, o ⋯ e o teclado de toolbar.", ui("toolbar"), "Toolbar, ToolbarFilters, ToolbarActions, ToolbarRow, ToolbarButton, ToolbarFilterButton, ToolbarSearch, ToolbarCount, ToolbarChips, ToolbarFilterIndicator"),
    /** A barra do topo da janela: dispõe onde o voltar, o título e as ações vão. */
    entry("top-bar", "Top Bar", "A barra do topo da janela — barra ou pílula, com a ação, a busca e o fio de progresso, e uma árvore para o telefone.", ui("top-bar"), "TopBar, TopBarStart, TopBarTitle, TopBarContent, TopBarActions, TopBarAction, TopBarSearch, TopBarProgress, TopBarSkeleton"),
  ]),
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

/** A ordem de leitura do catálogo: a da navegação lateral, e alfabética pelo `name` dentro da categoria (asserção 7 do `taxonomy.test.ts`). Sustenta o anterior/próximo no pé de cada página. */
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
