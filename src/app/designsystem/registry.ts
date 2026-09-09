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
 * **E a régua que substituiu os `Set` media o embrulho, não a peça.** Ela dizia
 * que átomo é o que "não compõe componente do sistema e é **um** elemento" —
 * lido como *importa zero de `ui/` e exporta um*. Medido: `Slider` passava como
 * átomo renderizando **quatro** primitivas Radix por dentro (root, track,
 * range, thumb), enquanto `Select`, com as mesmas peças expostas em dez
 * exports e **zero** imports, tinha ido para Moléculas. A diferença era só onde
 * a composição mora — dentro do arquivo ou na API —, e uma refatoração de
 * assinatura mudaria a camada sem mudar um pixel. Pior: **21 dos 21 átomos
 * importavam zero**, então a cláusula não distinguia nada; e 26 das 38
 * moléculas também importavam zero, então "grupos de átomos" não descrevia
 * dois terços delas.
 *
 * Agora é um mapa explícito, e ele é **exaustivo por tipo**: um componente novo
 * sem camada não compila. Nascer classificado é a única forma de a lista não
 * voltar a mentir.
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
 * | `Padrões` | decisões que atravessam telas | não é componente |
 *
 * `Container` é **Átomo** e não Template: ele é indivisível — uma `div` com
 * largura —, e não dispõe nada. Quem dispõe é o `PageHeader` e o
 * `PageSection`, e por isso os dois são Templates.
 *
 * O `taxonomy.test.ts` tranca a parte mecânica (o grafo de imports) e a ordem
 * alfabética dentro de cada categoria. A parte que o grafo não alcança — a
 * anatomia de um `Select`, a diferença entre especializar e compor — é decisão,
 * e mora nos comentários do mapa abaixo.
 */
type Layer = Exclude<Category, "Fundações" | "Padrões">

/**
 * A camada de cada componente. Sem padrão: o tipo obriga a listar todos.
 *
 * Os comentários dizem **por que**, e não o que — a camada já está na chave.
 */
const LAYER: Record<string, Layer> = {
  // ── Átomos: indivisíveis — anatomia interna e especialização não contam ──
  /** Um objeto. Imagem e fallback são estados dele, não partes. */
  avatar: "Átomos",
  badge: "Átomos",
  button: "Átomos",
  checkbox: "Átomos",
  code: "Átomos",
  "color-tile": "Átomos",
  /** Uma `div` com largura e calha. Indivisível — átomo por decisão do dono. */
  container: "Átomos",
  /** Uma barra e o alvo de acerto dela. O `<span data-vaul-handle-hitarea>` que
   *  o vaul injeta é anatomia interna, e não composição — a mesma régua que faz
   *  o `Slider` átomo com quatro primitivas Radix por dentro. Era Organismo
   *  enquanto consumia o contexto do `Sheet` para devolver `null`; parou de
   *  consumir quando voltou a desenhar. */
  "drag-handle": "Átomos",
  /** Uma superfície e a luz dela. Importa zero componentes e renderiza um
   *  elemento — o mesmo caso do `scroll-fade`, que também é uma casca mais uma
   *  camada de composição. As quatro camadas de `background` são anatomia
   *  interna, não peças que alguém compõe de fora. */
  glass: "Átomos",
  /** **O vidro é modo, e não peça.** Houve cinco entradas aqui —
   *  `glass-button`, `glass-badge`, `glass-avatar`, `glass-checkbox` e
   *  `glass-color-tile` —, cada uma importando **um** átomo e renderizando
   *  **um** elemento. O comentário que morava neste lugar já previa a rodada
   *  que as absorveria: *"no dia em que virarem só uma classe a mais, a
   *  pergunta certa é «componente ou modo?»"*. A previsão se cumpriu, e hoje o
   *  eixo `glass` mora nos próprios átomos.
   *
   *  A régua que sobra, e que vale para a próxima especialização: o que decide
   *  "componente ou modo?" **não é haver tradução** — é a tradução precisar de
   *  uma peça para existir. Aqui ela cabia num eixo, e coube melhor: como
   *  eixo, a superfície que o vidro apagaria simplesmente não é emitida. */
  input: "Átomos",
  "input-otp": "Átomos",
  /** Uma tecla, ou o acorde inteiro numa pastilha só. As partes do acorde são
   *  anatomia dele — a mesma conta pela qual o `Slider` é átomo com quatro
   *  peças por dentro. A **sequência** junta átomos, e é o `kbd-group`. */
  kbd: "Átomos",
  label: "Átomos",
  "money-display": "Átomos",
  /** Um `<select>`. `<option>` e `<optgroup>` são o conteúdo dele. */
  "native-select": "Átomos",
  progress: "Átomos",
  /** O controle inteiro — o anel e o ponto. **Não é especialização de nada**:
   *  ele é a unidade, e quem compõe é o `radio-group`, uma camada acima. É o
   *  par `kbd` / `kbd-group` outra vez. Com uma diferença que fica escrita:
   *  este é o primeiro átomo que **exige contexto para renderizar** — o Radix
   *  não exporta rádio independente, e `RadioGroup.Item` lança fora do `Root`.
   *  Contexto de primitiva não é composição, pela mesma conta que faz o
   *  `Slider` átomo com quatro peças Radix por dentro. */
  radio: "Átomos",
  /** Group, Panel e Separator são a anatomia de **uma** coisa — a mesma conta
   *  que devolveu o `Select` a Átomos, e que faz o `Slider` átomo com quatro
   *  peças Radix por dentro. Ele não compõe nenhum átomo: um painel
   *  redimensionável não é um grupo de peças menores, é um controle de
   *  proporção com regiões dentro. O `Button` do gatilho de colapso é o único
   *  import de `ui/`, e a asserção 2 deixa exatamente um. */
  resizable: "Átomos",
  /** Uma casca rolável, e uma máscara. */
  "scroll-area": "Átomos",
  "scroll-fade": "Átomos",
  /** Um controle. Trigger, content e item são a anatomia dele, não composição
   *  — a mesma conta pela qual o `Slider` é átomo com quatro peças por dentro. */
  select: "Átomos",
  separator: "Átomos",
  skeleton: "Átomos",
  slider: "Átomos",
  spinner: "Átomos",
  switch: "Átomos",
  textarea: "Átomos",
  toggle: "Átomos",
  /** Um rótulo que aparece. Carrega só texto. */
  tooltip: "Átomos",

  // ── Moléculas: feitas de átomos, um grupo pequeno que lê como unidade ───
  /** O aviso e a ação dele. Ele entrou aqui **sem argumento** e por um tempo
   *  não tinha nenhum: importava zero componentes, e as quatro peças eram
   *  quatro `<div>` — a posição em que o `Select` estava quando foi devolvido
   *  a Átomos. O que faltava não era reclassificá-lo, era o `AlertAction`: a
   *  linha de ação alcançava o `Button` por seletor descendente e *pedia* que
   *  quem chamasse escrevesse `variant="tertiary"`. Compondo o átomo de fato,
   *  a camada deixa de ser herdada. */
  alert: "Moléculas",
  /** A faixa de estado global, e as peças dela. Ela sempre compôs o átomo — o
   *  × de dispensar é um `Button` —, então esta camada nunca foi herdada; o que
   *  faltava era a **ação** ser peça também, e não um seletor descendente
   *  pedindo `variant="tertiary"` a quem chamasse. */
  "announcement-bar": "Moléculas",
  "button-group": "Moléculas",
  collapsible: "Moléculas",
  "description-list": "Moléculas",
  "empty-state": "Moléculas",
  /** O exemplo canônico do Frost: rótulo + controle + erro. */
  field: "Moléculas",
  /** Era átomo — só o `<form>` com a política do Enter, sem input e sem botão.
   *  Virou molécula ao ganhar as peças: `FormInput` sobre `Field`, `FormSubmit`
   *  sobre `Button` + `Spinner`. Inversão registrada, e a régua é a mesma. */
  "input-group": "Moléculas",
  item: "Moléculas",
  /** A sequência: um `Kbd` por tecla. É a junção dos átomos, e importa o átomo
   *  de fato — o `keys` existe justamente para isso ser verdade. */
  "kbd-group": "Moléculas",
  pagination: "Moléculas",
  /** A junção: `Radio` + `Label`, e o cartão. Ele importa os átomos de fato — o
   *  `children` da opção existe justamente para isso ser verdade, e não para o
   *  rótulo continuar do lado de fora, escrito à mão por quem chama, como
   *  estava. */
  "radio-group": "Moléculas",
  /** Especializa o `InputGroup` — lupa e ×. Molécula sobre molécula. */
  "search-input": "Moléculas",
  "toggle-group": "Moléculas",

  // ── Organismos: feitos de moléculas — faixas, grupos, submenus, linhas ──
  /** A unidade é um `Collapsible` — uma molécula. */
  /** Ele era Molécula, e a rodada do `RadioGroup` mostrou que já não era.
   *  `form.tsx` compõe `field` **e** `radio-group` — duas moléculas —, e a
   *  régua acima diz que isso é organismo. Ele já estava na fronteira antes:
   *  compunha `field` e tinha estado próprio (a política do Enter, o `id` em
   *  contexto), que é a segunda cláusula do nível. O que mudou foi o limiar
   *  mecânico da asserção 3 ser cruzado, e com ele a classificação deixar de
   *  poder mentir. É a mesma inversão que o próprio `form` já registra uma vez
   *  — de átomo para molécula, quando ganhou as peças. */
  form: "Organismos",
  /** Lista cuja **unidade** é uma molécula, que é a segunda forma do nível.
   *  E não por analogia: `AccordionItem` + `Trigger` + `Content` **é** um
   *  `Collapsible`, que está em Moléculas — os dois arquivos importam a mesma
   *  régua, `lib/disclosure-classes`.
   *
   *  Não é átomo, e a conta é direta: medido, uma raiz renderiza **3 itens, 3
   *  gatilhos focáveis e 3 painéis**, cada um com o próprio `aria-expanded`.
   *  "Um controle, um elemento, uma casca" não descreve isso.
   *
   *  E a cláusula de anatomia não o salva. Ela vale para o `Select`, cujo item
   *  é uma **escolha entre valores** de um controle só; aqui cada item é uma
   *  divulgação **operável sozinha e com estado próprio**. Item que é dado não
   *  é item que tem estado. */
  accordion: "Organismos",
  "alert-dialog": "Organismos",
  /** Contém um `DropdownMenu` no miolo dobrado — quem contém organismo é
   *  organismo. */
  breadcrumb: "Organismos",
  calendar: "Organismos",
  /** Superfície com faixas: barra, cabeçalho, corpo, rodapé, nota. A mesma
   *  anatomia do `Dialog`. */
  card: "Organismos",
  carousel: "Organismos",
  chart: "Organismos",
  combobox: "Organismos",
  command: "Organismos",
  "context-menu": "Organismos",
  "date-picker": "Organismos",
  dialog: "Organismos",
  drawer: "Organismos",
  "dropdown-menu": "Organismos",
  "edge-panel": "Organismos",
  "form-picker-popover": "Organismos",
  "hover-card": "Organismos",
  menubar: "Organismos",
  "navigation-menu": "Organismos",
  popover: "Organismos",
  sheet: "Organismos",
  /** Faixas, grupos, submenus e um estado próprio que atravessa a tela — e ela
   *  contém organismos (o painel de borda no telefone). */
  sidebar: "Organismos",
  /** Especializa o `Card`; especializar mantém o degrau. */
  "stat-card": "Organismos",
  stepper: "Organismos",
  /** A linha (células = átomos) é a molécula; a tabela é feita de linhas. */
  table: "Organismos",
  tabs: "Organismos",
  timeline: "Organismos",
  /** Uma pilha de toasts, cada um ícone + título + texto + ação. */
  sonner: "Organismos",
  toolbar: "Organismos",

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
    slug: "camadas",
    name: "Camadas (z-index)",
    category: "Fundações",
    description: "A ordem de empilhamento nomeada, do conteúdo ao toast.",
    source: "src/app/globals.css",
  },
  {
    slug: "cores",
    name: "Cores",
    category: "Fundações",
    description:
      "Tokens de superfície, status, dinheiro, identidade e a rampa de gráficos, nos dois temas.",
    source: "src/app/globals.css",
  },
  {
    slug: "forma-elevacao",
    name: "Forma e elevação",
    category: "Fundações",
    description: "Os sete degraus de raio de canto e os cinco de sombra.",
    source: "src/app/globals.css",
  },
  {
    slug: "iconografia",
    name: "Iconografia",
    category: "Fundações",
    description: "Heroicons, tamanhos por contexto e quando um ícone precisa de rótulo.",
    source: "@heroicons/react/24/outline",
    importLine: 'import { WalletIcon } from "@heroicons/react/24/outline"',
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
    slug: "movimento",
    name: "Movimento",
    category: "Fundações",
    description: "Durações, curvas e o que acontece quando o sistema pede menos animação.",
    source: "src/app/globals.css",
  },
  {
    // O slug é o do **arquivo**, e não o do nome exibido: a asserção 1 de
    // `taxonomy.test.ts` exige que todo `.tsx` de `ui/` tenha entrada com o
    // slug do arquivo, e o arquivo é `typography.tsx`. É a única Fundação com
    // slug em inglês, e a assimetria é o preço de a taxonomia ser trancada por
    // mecanismo em vez de combinada.
    slug: "typography",
    name: "Tipografia",
    category: "Fundações",
    description:
      "Inter na interface, Ledger no display, Geist Mono no dinheiro — e os nove componentes de texto.",
    source: "src/components/ui/typography.tsx",
    importLine:
      'import { H1, H2, H3, H4, Lead, P, Muted, Small, Caption } from "@/components/ui/typography"',
  },

  // ── Átomos ──────────────────────────────────────────────────────────────
  entry("avatar", "Avatar", "Imagem ou iniciais, em cinco tamanhos.", ui("avatar"), "Avatar, AvatarImage, AvatarFallback"),
  entry("badge", "Badge", "Rótulo compacto de status, contagem ou metadado.", ui("badge"), "Badge"),
  entry("button", "Button", "A ação clicável: variantes, tamanhos e estados.", ui("button"), "Button"),
  entry("checkbox", "Checkbox", "Escolha booleana em formulários e listas.", ui("checkbox"), "Checkbox"),
  entry("code", "Code", "Identificador literal dentro do texto.", ui("code"), "Code"),
  entry("color-tile", "Color Tile", "O ladrilho que carrega uma cor escolhida pela pessoa.", ui("color-tile"), "ColorTile"),
  entry("container", "Container", "Espaçamento e largura: até onde o conteúdo cresce, a calha e o ritmo dos blocos.", ui("container"), "Container, containerSizes, containerGutters, containerStacks"),
  entry("drag-handle", "Drag Handle", "A alça que se agarra para arrastar a gaveta — e o alvo do gesto.", ui("drag-handle"), "DragHandle"),
  entry("glass", "Glass", "A superfície de vidro do sistema — vestível por qualquer peça.", ui("glass"), "Glass"),
  entry("input", "Input", "Campo de uma linha — e, no modo money, o campo de dinheiro.", ui("input"), "Input"),
  entry("input-otp", "Input OTP", "Entrada de código de verificação.", ui("input-otp"), "InputOTP, InputOTPSlot"),
  entry("kbd", "Kbd", "Uma tecla, ou o acorde inteiro numa pastilha só.", ui("kbd"), "Kbd"),
  entry("label", "Label", "Rótulo acessível ligado a um controle.", ui("label"), "Label"),
  entry("money-display", "Money Display", "Todo valor em reais que o app mostra.", ui("money-display"), "MoneyDisplay"),
  entry("native-select", "Native Select", "O select do sistema, sem JavaScript.", ui("native-select"), "NativeSelect"),
  entry("progress", "Progress", "Barra de progresso com tons de status.", ui("progress"), "Progress"),
  entry("radio", "Radio", "O anel e o ponto de uma escolha única. Vive dentro de um Radio Group.", ui("radio"), "Radio"),
  entry("resizable", "Resizable", "Painéis cuja proporção a pessoa decide, com a costura que reage ao arraste.", ui("resizable"), "ResizablePanelGroup, ResizablePanel, ResizableHandle"),
  entry("scroll-area", "Scroll Area", "Área rolável com barra estilizada.", ui("scroll-area"), "ScrollArea, ScrollBar"),
  entry("scroll-fade", "Scroll Fade", "Área rolável que dissolve o conteúdo nas bordas.", ui("scroll-fade"), "ScrollFade"),
  entry("select", "Select", "Lista suspensa de opções predefinidas.", ui("select"), "Select, SelectTrigger, SelectItem"),
  entry("separator", "Separator", "Divisor entre conteúdos.", ui("separator"), "Separator"),
  entry("skeleton", "Skeleton", "O osso da tela enquanto o dado não chegou.", ui("skeleton"), "Skeleton"),
  entry("slider", "Slider", "Valor ou intervalo numérico contínuo.", ui("slider"), "Slider"),
  entry("spinner", "Spinner", "Carregamento sem progresso conhecido.", ui("spinner"), "Spinner"),
  entry("switch", "Switch", "Alternância que vale no instante em que é tocada.", ui("switch"), "Switch"),
  entry("textarea", "Textarea", "Campo de texto multilinha que cresce com o conteúdo.", ui("textarea"), "Textarea"),
  entry("toggle", "Toggle", "Botão de dois estados.", ui("toggle"), "Toggle"),
  entry("tooltip", "Tooltip", "Dica curta ancorada a um gatilho.", ui("tooltip"), "Tooltip, TooltipTrigger, TooltipContent"),

  // ── Moléculas ───────────────────────────────────────────────────────────
  entry("alert", "Alert", "Aviso dentro do conteúdo — o tom, a forma e o corpo.", ui("alert"), "Alert, AlertTitle, AlertDescription, AlertActions"),
  entry("announcement-bar", "Announcement Bar", "Aviso de largura total sobre o estado do app, com ícone e ação.", ui("announcement-bar"), "AnnouncementBar, AnnouncementBarContent, AnnouncementBarActions"),
  entry("button-group", "Button Group", "Botões colados que agem como uma unidade.", ui("button-group"), "ButtonGroup"),
  entry("collapsible", "Collapsible", "Um bloco que expande — e o fechado pode ser uma espiada que dissolve.", ui("collapsible"), "Collapsible, CollapsibleTrigger, CollapsibleMarker, CollapsibleContent"),
  entry("description-list", "Description List", "Pares termo/valor para telas de detalhe, em coluna, em linha ou em grade.", ui("description-list"), "DescriptionList, DescriptionListItem, DescriptionTerm, DescriptionDetails"),
  entry("empty-state", "Empty State", "O que a tela diz quando não há nada nela, em três molduras.", ui("empty-state"), "EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateActions"),
  entry("field", "Field", "A estrutura de um campo, e a ligação entre as peças dele.", ui("field"), "Field, FieldControl, FieldLabel, FieldDescription, FieldError, FieldGroup, FieldRow, FieldSet, FieldLegend, FieldSeparator"),
  entry("input-group", "Input Group", "Campo com ícones, texto ou botões acoplados.", ui("input-group"), "InputGroup, InputGroupInput"),
  entry("item", "Item", "Linha de lista com mídia, conteúdo e ações, espaçada ou dividida.", ui("item"), "ItemGroup, Item, ItemContent, ItemActions"),
  entry("kbd-group", "Kbd Group", "Teclas apertadas uma depois da outra, cada uma na própria pastilha.", ui("kbd-group"), "KbdGroup"),
  entry("pagination", "Pagination", "A posição numa lista longa, e os dois movimentos.", ui("pagination"), "Pagination, PaginationStatus, PaginationContent, PaginationLink"),
  entry("radio-group", "Radio Group", "Escolha única entre poucas opções visíveis — em linha ou em cartão.", ui("radio-group"), "RadioGroup, RadioGroupItem"),
  entry("search-input", "Search Input", "O campo de busca, com o × do navegador já suprimido.", ui("search-input"), "SearchInput"),
  entry("toggle-group", "Toggle Group", "Conjunto de toggles: seleção única ou múltipla.", ui("toggle-group"), "ToggleGroup, ToggleGroupItem"),

  // ── Organismos ──────────────────────────────────────────────────────────
  entry("accordion", "Accordion", "Seções expansíveis, em três molduras e na escada de controles.", ui("accordion"), "Accordion, AccordionItem, AccordionTrigger, AccordionContent"),
  entry("alert-dialog", "Alert Dialog", "Confirmação de uma ação sem volta, na régua do Dialog.", ui("alert-dialog"), "AlertDialog, AlertDialogAction, AlertDialogCancel"),
  entry("breadcrumb", "Breadcrumb", "A trilha até a tela atual, que dobra o miolo em vez de quebrar linha.", ui("breadcrumb"), "Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbMenu"),
  entry("calendar", "Calendar", "A grade de um mês, com a célula na escada.", ui("calendar"), "Calendar, CalendarDayButton"),
  entry("card", "Card", "Cartão de conteúdo e painel — a superfície, o ritmo e as três tiras.", ui("card"), "Card, CardToolbar, CardContent, CardNote"),
  entry("carousel", "Carousel", "Itens que deslizam — superfície, controles dentro da caixa, calha e indicador.", ui("carousel"), "Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, CarouselDots"),
  entry("chart", "Chart", "Cinco formas de gráfico sobre a mesma anatomia, ligadas aos tokens do tema.", ui("chart"), "ChartArea, ChartBars, ChartContainer, ChartDonut, ChartLine, ChartSparkline"),
  entry("combobox", "Combobox", "Select com busca, uma ou várias escolhas.", ui("combobox"), "Combobox, ComboboxField, ComboboxTrigger, ComboboxValue, ComboboxClear, ComboboxContent, ComboboxInput, ComboboxList, ComboboxEmpty, ComboboxGroup, ComboboxItem, ComboboxLoading"),
  entry("command", "Command", "Paleta de comandos com busca.", ui("command"), "Command, CommandInput, CommandItem"),
  entry("context-menu", "Context Menu", "O mesmo menu, aberto pelo botão direito.", ui("context-menu"), "ContextMenu, ContextMenuItem"),
  entry("date-picker", "Date Picker", "O campo de data — e de intervalo — em popover.", ui("date-picker"), "DatePicker"),
  entry("dialog", "Dialog", "Janela modal — a largura, a altura e o corpo que rola.", ui("dialog"), "Dialog, DialogContent, DialogBody, DialogFooter"),
  entry("drawer", "Drawer", "Gaveta arrastável, com física de toque.", ui("drawer"), "Drawer, DrawerContent, DrawerTrigger"),
  entry("dropdown-menu", "Dropdown Menu", "Menu de ações, com checkbox, radio e submenu.", ui("dropdown-menu"), "DropdownMenu, DropdownMenuItem"),
  entry("edge-panel", "Edge Panel", "Painel numa borda — encostado ou flutuante —, em qualquer largura. É a navegação.", ui("edge-panel"), "EdgePanel, EdgePanelContent, EdgePanelTrigger"),
  entry("form", "Form", "O formulário, as peças dele e o contrato do Enter.", ui("form"), "Form, FormInput, FormTextarea, FormRadioGroup, FormError, FormActions, FormCancel, FormSubmit"),
  entry("form-picker-popover", "Form Picker Popover", "O seletor ancorado num campo: busca, lista e pé.", ui("form-picker-popover"), "FormPickerPopover, FormPickerPopoverTrigger, FormPickerPopoverContent, FormPickerPopoverSearch, FormPickerPopoverList, FormPickerPopoverItem, FormPickerPopoverFooter"),
  entry("hover-card", "Hover Card", "Prévia ao pousar o cursor, com seta e a superfície do popover. Nunca no telefone.", ui("hover-card"), "HoverCard, HoverCardTrigger, HoverCardContent, HoverCardArrow"),
  entry("menubar", "Menubar", "Fileira de menus percorrida com a seta, em três superfícies.", ui("menubar"), "Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarCheckboxItem, MenubarRadioItem, MenubarSub"),
  entry("navigation-menu", "Navigation Menu", "A fileira de um cabeçalho público, em três superfícies, com painel e marcador.", ui("navigation-menu"), "NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuPanel, NavigationMenuSectionLabel, NavigationMenuLink, NavigationMenuLinkTitle, NavigationMenuLinkDescription"),
  entry("popover", "Popover", "Camada flutuante ancorada a um gatilho.", ui("popover"), "Popover, PopoverContent, PopoverTrigger"),
  entry("sheet", "Sheet", "Folha no desktop, gaveta no telefone — uma API só.", ui("sheet"), "Sheet, SheetContent, SheetTrigger, SheetClose"),
  entry("sidebar", "Sidebar", "A navegação lateral: recolhível, redimensionável, e um painel de borda no telefone.", ui("sidebar"), "Sidebar, SidebarProvider, SidebarInset, SidebarTrigger, SidebarRail, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuButton, useSidebar"),
  entry("stat-card", "Stat Card", "Um número que importa, com sua variação.", ui("stat-card"), "StatCard, StatCardLabel, StatCardValue, StatCardDelta"),
  entry("stepper", "Stepper", "Progresso por etapas de um fluxo, na horizontal ou na vertical.", ui("stepper"), "Stepper, StepperItem"),
  entry("table", "Table", "Tabela de dados, e o que ela vira no telefone.", ui("table"), "Table, TableRow, TableCell"),
  entry("tabs", "Tabs", "Alterna entre painéis do mesmo nível, em três superfícies.", ui("tabs"), "Tabs, TabsList, TabsTrigger, TabsContent"),
  entry("timeline", "Timeline", "Feed vertical de histórico.", ui("timeline"), "Timeline, TimelineItem"),
  entry("sonner", "Toast", "Confirmação passageira, fora do fluxo.", ui("sonner"), 'import { toastSuccess, toastUndo } from "@/lib/toast"'),
  entry("toolbar", "Toolbar", "A linha de filtros e ações acima de uma lista, e a densidade dela.", ui("toolbar"), "Toolbar, ToolbarRow, ToolbarFilters, ToolbarActions, ToolbarFilterIndicator"),

  // ── Templates ───────────────────────────────────────────────────────────
  entry("page-header", "Page Header", "O topo de uma tela: trilha, título, fatos e a ação principal.", ui("page-header"), "PageHeader, PageHeaderTitleRow, PageHeaderTitle, PageHeaderDescription, PageHeaderEyebrow, PageHeaderMeta, PageHeaderActions"),
  entry("page-section", "Page Section", "O bloco que dá ritmo vertical a uma tela, com título e ação.", ui("page-section"), "PageSection, PageSectionHeader, PageSectionTitle, PageSectionDescription"),

  // ── Padrões ─────────────────────────────────────────────────────────────
  {
    slug: "chips-status",
    name: "Chips de status",
    category: "Padrões",
    description: "O vocabulário de estados e a classe que corresponde a cada um.",
    source: "src/lib/tag-chip-classes.ts",
    importLine: 'import { tagChipSuccess, tagChipIncome } from "@/lib/tag-chip-classes"',
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
    slug: "dinheiro",
    name: "Dinheiro",
    category: "Padrões",
    description: "Como todo valor em reais é exibido, recebido e colorido.",
    source: "src/lib/formatters.ts",
    importLine: 'import { currencyBRL, signedCurrencyBRL, percentBR } from "@/lib/formatters"',
  },
  {
    slug: "formularios",
    name: "Formulários e Enter",
    category: "Padrões",
    description: "Por que todo formulário usa Form e o que o Enter faz em cada campo.",
    source: "src/components/ui/form.tsx",
  },
  {
    slug: "graficos",
    name: "Gráficos",
    category: "Padrões",
    description: "Quando a série usa a rampa categórica e quando usa a cor do dinheiro.",
    source: "src/components/ui/chart.tsx",
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
 * categoria — e, dentro da categoria, alfabética pelo `name` exibido, trancada
 * pela asserção 7 do `taxonomy.test.ts`. A posição no array não carrega
 * decisão. É ela que sustenta o anterior/próximo no pé de cada página — sem
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
