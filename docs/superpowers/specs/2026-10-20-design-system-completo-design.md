# Design system completo — desenho

Data: 2026-10-20 · Branch: `finance-app-2.0` (423 commits sobre `main`, base `a5845ab`)

## Intenção

O dono pediu: mapear tudo que mudou no branch, conferir e atualizar o design
system, e documentar no `/designsystem` **todas** as animações e tudo o que
falta, para o catálogo ficar 100% completo, "nível Apple". O dono pulou as
perguntas; as decisões abaixo marcadas **(chamada minha)** são do agente.

"Nível Apple" aqui quer dizer o que a Human Interface Guidelines faz: cada
peça tem uma página com a forma fixa, o movimento tem nome, número e
demonstração, nada que a página afirma contradiz o código, e um teste impede
que volte a faltar.

## Metas

1. **A página de Movimento vira o catálogo de todo o movimento** do sistema:
   tokens, molas e curvas de JS, cada `@keyframes`, cada `@utility` que anima,
   cada função de quadro e hook — com o número, quem consome e uma
   demonstração reproduzível por família.
2. **Toda afirmação desatualizada das páginas é corrigida** (inventário
   abaixo). O maior grupo é o piso de toque 40→44 (bc1f2c3, rodadas 332/335).
3. **Toda página de componente ganha a forma fixa** de
   `docs/design/COMPONENTE-NOVO.md` §4: `Usage` → "Na tela" com `Controles`
   (Eixo/Interruptores) → notas → "No telefone" no `IphoneFrame` →
   comportamentos → "Esqueleto" (quando o componente tem peça de esqueleto)
   → `PropsTable`s.
4. **Todo token de `globals.css` aparece numa página de fundação.**
5. **Testes trancam a completude** para o catálogo "sempre estar 100%":
   - todo `@keyframes`, toda `@utility` que anima e todo export de
     `lib/spring.ts`, `lib/liquid-move.ts` e `lib/header-morph.ts` é citado em
     `docs/motion.tsx`;
   - todo token de `:root` é citado numa página de fundação;
   - toda página de componente tem "Na tela", `<Controles`, `IphoneFrame`, e
     "Esqueleto" quando o componente exporta `*Skeleton`.
6. **AGENTS.md e o histórico** registram a rodada (353) e corrigem as
   afirmações desatualizadas que o AGENTS.md tem.

## Não-metas

- **Nenhuma mudança de comportamento ou visual em componente.** É rodada de
  documentação. Em `src/components/ui/` só se corrigem **comentários e JSDoc**
  desatualizados (pedido do dono "atualize se necessário" cobre isso).
- Consolidar as molas locais duplicadas (`MOLA_DO_REALCE` ×3 etc.) em
  `lib/spring.ts` **fica fora** (chamada minha): documentar, e registrar como
  proposta no histórico.
- Nenhuma mudança de jornada → o Atlas não muda.
- Nada em `globals.css` além de nada: tokens não mudam, só são documentados.

## Anti-metas (falha mesmo se "funcionar")

- Página com afirmação nova que não foi medida no código.
- Demonstração com `lorem ipsum` ou conteúdo de mentira (o teste já reprova).
- Animação documentada com número diferente do código.
- Página que redeclara `Eixo`/`Interruptor` (o teste já reprova).
- Literal de cor/medida numa página do catálogo (`ds:audit`).

## Restrições

- **Outra sessão comita no mesmo branch** (top-bar, `ecc6d99` chegou durante
  o levantamento). A execução roda num **worktree isolado** (chamada minha) e
  a `docs/top-bar.tsx` é a última tarefa, rebaseada sobre o que a outra sessão
  tiver feito.
- `src/components/ui/`, `globals.css` e `src/app/designsystem/` pedem
  confirmação do harness (`permissions.ask`).
- Toda tarefa termina com `npx tsc --noEmit && npm run lint && npm run
  test:unit` verdes.
- Tema escuro: toda demonstração nova usa tokens.
- Dev server externo em :3000 (memória `dev-server-externo`); conferência
  visual por amostragem.

## Inventário de lacunas

### A. Movimento (`docs/motion.tsx`, 208 linhas hoje)

A página tem: 5 durações, 3 curvas (desenhadas a partir do CSS vivo), 4 pares
de demonstração e 4 notas. Usa `Usage`, `DocSection`, `DocNote`, `Group`,
`Spec`.

**Erros**: o chip de consumidores de `--duration-instant` lista DropdownMenu,
Select, Popover, HoverCard, NavigationMenu; hoje só `command.tsx`, `item.tsx` e
o CSS de `workspace-switch`/`veil-out` usam.

**Falta**, por família (tudo em `src/app/globals.css` salvo indicação):

| Família | Itens |
|---|---|
| Tokens | `--duration-gentle` (700, :501), `--ease-in-out` (:502); o bloco de movimento reduzido global (:757), o da roda do toast (:1048), o do `stagger-ladder` (:2003); `tw-animate-css` (importado em :2) |
| `@property` animados | `--toast-left` (1017), `--button-bloom` (1413), `--button-hover` (1439), `--brand-lava` (1798), `--command-beam-x/-w/-h/-edge/-on` (3266–3286) |
| Sobreposição (iOS 26) | `menu-morph` 380ms (2859), `menu-unmorph` 210ms (2934), `menu-content-in` (2809), `menu-content-out` 90ms (2844), `overlay-cascade` (2795), `menu-sprout` (2981), `context-menu-burst` (2994), `popover-sprout` (3007), `field-bloom` (3033), `hover-card-unveil` (3046), `date-picker-bloom` (2710), `dialog-reveal` (3136), `veil-out` (2830), `presence-hold` (2838) |
| Cascatas | `rise` (1932), `stagger-ladder` (1964), `menubar-reveal` (2316), `navigation-menu-reveal` (2328), `sheet-reveal` (2347), `stat-card-reveal` (2367), `page-header-reveal` (2386), `page-section-rise`/`-reveal` (2422/2430), `table-reveal` (2625), `timeline-reveal` (2644), `command-reveal` (2687), `showcase-enter` (2504) |
| Divulgação | `disclosure-reveal` (2008), `disclosure-sink` (1946), `calendar-weeks-in/-out`, `calendar-caption-in/-out` (3184–3204), `calendar-month-motion` (3212), `split-shell-step-in`/`split-shell-step` (2460/2467) |
| Botão e marca | `link-sweep` (1362), `button-bloom` (1419), `button-hover` (1445), `button-colorful` (1456), `brand-rainbow-slide`/`brand-rainbow-button` (1499/1524), `brand-glow` (1648), `brand-lava` (1804), `brand-flow` (1894), `spinner-brand` (2196); o afundar de 1px do `Button` (WAAPI 260ms, `button.tsx:145-168`) |
| Laços e estados | `toast-pop` (1003), `toast-countdown` (1022), transições do sonner (824/871/884/1070), `carousel-timer` (2117), `carousel-effect-*` (2040–2101), `empty-state-drift`/`-sheen` (2140/2146), `chart-wave` (2168), `type-caret-blink`/`type-caret` (2481/2487), `showcase-ripple` (2587), `top-bar-progress-run` (2603), `table-flash` (2665), `command-beam-travel/-edge/-breathe` + `command-beam` (3292–3319) |
| Troca de tela | `.theme-reveal` (2219; JS `REVELACAO` 560ms, `theme-toggle.tsx:86`), `.workspace-switch` + `workspace-switch-out`/`workspace-mark-in` (2231–2252), `sidebar-media-sway(-open/-close)` e `sidebar-trigger-sway` (3076–3115) |
| Molas e curvas JS (`lib/spring.ts`) | `MOLA` 300/25 (documentada), `MOLA_PALCO` 220/30, `MOLA_PALCO_LAYOUT`, `SEPARACAO` 140/20, `SAIDA` 150ms in-out, `BALANCO` 300/19 (12,7%) |
| Líquido (`lib/liquid-move.ts`) | `TRAJETO` 400ms, `TRAJETO_MACIO` 480ms, `ESTICAO`/`PICO_EM`/`VIRADA`/`PERFIL`, `ACOPLAMENTO_Y`, `AMPLITUDE_POR_SALTO`, `viajarLiquido`, `redirecionarViagem`; `lib/marcador.ts` `caixaDoAtivo`; `hooks/use-marcador.ts` `useMarcador` |
| Cabeçalho e busca do telefone | `lib/header-morph.ts`: `quadroDaTroca`, `quadroDoVidroQueEstica`, `quandoPintar`, `suave`/`lerp`/`preso`, `TINTA_DO_VOO`/`VIDRO_R`/`VIDRO_H`; `command.tsx`: `quadroDasBolhas` (235), `quadroDaGota` (302), janelas de fase (213–286), `VOLTA_DA_PILULA` 320ms (331); tempos: placa 460/260ms, casca segura 460ms |
| Hooks | `useAlturaAnimada`, `useCountUp` (+ `CONTAGEM_*` do `stat-card.tsx:177`), `useBrandGlow` (`GLOW_DURACAO` 2s), `proximoEscondido`/`alvoDaRolagem` (`lib/hide-on-scroll.ts`) |
| Molas locais (documentar, não mover) | `MOLA_DO_REALCE` 0,28s/0,2 (data-table:570, navigation-menu:221, menubar:188), `MOLA_DO_GATILHO` (sidebar:669), `SUBIDA`/`VIAGEM`/`INSTANTE` (avatar-group:44), `MOLA_LEQUE` e `CURVA_*`/`IRIS_*`/`PULSO` (onboarding:139/1067/1867), `CHART_EASING*` (chart ~244), `CURVA`/`SURGIR` (filter-bar:446) |
| Biblioteca `motion` | quem usa `AnimatePresence`, `LayoutGroup`, `animate`/`useMotionValue`, `useSpring`/layout (lista no relatório; nenhuma página cita `AnimatePresence`) |

### B. Afirmações desatualizadas (corrigir na página)

**Piso de toque 40→44** (bc1f2c3) e "`pointer-coarse:` vale abaixo de 48rem"
(rodada 335): `docs/input.tsx:36,159,163-166,195`, `input-group.tsx:167`,
`filter-bar.tsx:483,503,581`, `navigation-menu.tsx:277,442`,
`page-section.tsx:220`, `onboarding.tsx:805`, `button.tsx:102,221`,
`button-group.tsx:147`, `command.tsx:355`, `radio-group.tsx:208`,
`search-input.tsx:60,151`, `select.tsx:93`, `toolbar.tsx:408,414,440`. Tabs,
ToggleGroup: documentar bandeja 44, item 40, `::after` 44.

**Por componente**:
- `bottom-bar.tsx:173,177,181,189,209`: tinta/tecla/anel (`--bottom-bar-surface`,
  `--bottom-bar-marker`, anel 15%), sem afundar a 88% nem estalo, área segura
  não soma ao `--bottom-bar-pad`. Faltam: ancoragem `100lvh` no iOS instalado
  (rodada 344), tinta cheia em todas as abas (343), lateral e pé de 20 (341),
  largura mínima da coluna com `labels`, demonstração de `accessory` e de
  `BottomBarTab media`, linhas de `BottomBarRow`/`BottomBarTabs`.
- `sheet.tsx:276-278,281`: material é o vidro modal (`modalSurfaceClassName`);
  fecha em 380ms `--ease-in-out` com o véu. Falta o link que fecha antes.
- `sidebar.tsx:582-584,594-596`: gatilho é o vidro da busca sem sombra; a
  pílula do ativo é `useMarcador` e só viaja dentro de um `SidebarMenu`.
  Faltam: linha `SidebarProvider toggle`, `SidebarMenuSkeleton media`, as
  balançadas, trilho 64, caixa 48 `-m-2`, raio 20, `SIDEBAR_TOOLTIP_OFFSET` 6,
  `sideOffset={4}`, espiada aberta com menu.
- `top-bar.tsx:459`: `join="always"` cola também no telefone; `:498` o filtro
  não escala mais (ecc6d99); `:426-428` "primeiro desenho" sai. Faltam: o
  `IphoneFrame` com o cabeçalho real do app (`edge` + `plate` + swap + `morph`),
  demos de `join="desktop"|"phone"`, `TopBarSearch plate/glow/collapse/slash`,
  `TopBarTitle pageTitle`, a bolha da contagem na mola, as três camadas do
  `edge`, o `plate` do telefone na tinta da `BottomBar` (63ee511).
- `drawer.tsx:263`: `repositionInputs` padrão é `false`. `:137,293`: aviso de
  `scaleBackground` no app. Linhas `dismissible`, `dragHandleClassName`,
  `DrawerPortal`, `DrawerOverlay`.
- `dropdown-menu.tsx:104-117,183-186,225`: o ⋯ abre menu no telefone (não
  folha); largura no toque 208…256. Faltam `indicator="dot"|"media"`, `footer`,
  `inset`, `modal`, `Group`/`Shortcut`/`Portal`, escala do toque (44/16/20/384,
  `MENU_ROW_GAP` 4, atalho escondido), realce `--sidebar-accent`, `onClick` da
  tela antes do da linha.
- `empty-state.tsx:259`: `sm`/`md` passam `md` (32).
- `form.tsx:501` e `AGENTS.md:816`: `FormPickerPopoverTrigger` é `lg`. Teto 384
  do conteúdo, `field-bloom`.
- `input-group.tsx:240,245`: `InputGroupSelect` é o `Select` do app;
  `InputGroupInput money` existe. Linhas `align`, `variant/size`,
  `InputGroupText`.
- `hover-card.tsx:360-362`: o viewport rola (título "O corpo não rola" é do
  `HoverCardBody`; deixar claro).
- `breadcrumb.tsx:232-234` e `AGENTS.md:1461`: nenhuma barra do app usa o
  `Breadcrumb` hoje.
- `data-table.tsx:546`: o ⋯ do telefone é `DropdownMenu`, `icon-md` 44.
  Faltam `DataTableFacetFilter`, `DataTableSelectionBar`, `DataTableViewOptions`,
  `TablePanel`/`TablePanelToolbar variant="title"`.
- `description-list.tsx:252`: `columns` implica grade.
- `dialog.tsx:380`: título da nota contradiz o corpo ("não reserva lugar").
  Faltam: abrir na mola + `dialog-reveal`, `useAlturaAnimada`, links que fecham
  antes, `usePedidoDeFechar`, rodapé `flex-col-reverse` e 44 no toque,
  `DialogCloseButton`, `--dialog-body-fade-h`/`-end-h`.
- `alert-dialog`: camada `--z-sheet`, movimento, `size` aceita `full`,
  `AlertDialogConfirmInput placeholder/disabled`.
- `command`: tempos do telefone, teto pelo viewport visual
  (`--command-search-vh`), foco (`onOpenAutoFocus`, devolução), linhas
  `commandProps`, `showCloseButton`, `CommandInput surface`, `CommandSeparator`.
- `context-menu`: escala do toque (+32 por degrau, 44/16/20), atalho escondido,
  `context-menu-burst`, `Group`/`Shortcut`/`Portal`.
- `badge.tsx:301`: `tagChipUnreadCount` é `info` chapado, o mesmo do sino;
  citar `--badge-dot`.
- Menores: accordion (mola/curva/`disclosure-reveal`, 44 no toque), alert (×
  `-inset-3`), avatar-group (movimento reduzido, `resumirNomes`), button
  (afundar, anel interno do primário, realce 50%, `ButtonSizeContext`),
  calendar (troca de mês, `listDays`, dia só é botão com `mode`, escolhido
  `muted`, `CalendarDayButton`), card (`bg-clip-padding`, sombra só com
  hover), carousel (pausa só com cursor, `--scrim-foreground`, `setApi`,
  `plugins`, `useCarousel`), chart (exceção do Showcase, `ChartBarList
  role="figure"`, `ChartDataTable`, `useChart`, `formatChartValue`), checkbox
  (`aria-invalid`, tique na mola), collapsible (`CollapsibleTrigger`,
  `CollapsibleMarker`), combobox (modal no telefone, abertura, `ComboboxChips
  tone`), date-picker (`MonthGrid` no toque, `DATE_RANGE_PRESETS`,
  `popoverClassName`, `disabled`), field (`useFieldSize`, `fieldTextScale`),
  histogram-slider (o `Slider` de dentro é controlado), item (sem
  `flex-nowrap`/`text-left`), kbd (`formatKey`), kbd-group (`joined`), menubar
  (`inset`, `pending`, `textValue`, peças, escala do toque, `ehCursor`),
  navigation-menu (`menu-sprout`, sem hover no toque, folha `flush`),
  page-header (`PageHeaderBack` `icon-lg`, 44/20 no telefone), pagination
  (`PaginationPosition`, `janelaDePaginas`, `paginationSteps`), popover
  (`motion` `sprout|field|none`, `PopoverAnchor`, viewport rolável, larguras
  proibidas), scroll-area (`ScrollBar`, `data-scroll-fade-head`, invariantes
  da dissolução), select (`field-bloom`, `overlay-cascade`, realce), sonner
  (posição sob `--top-bar-bottom` + 12, helpers `toastErrorWithDescription`,
  `dismissToast`, `dismissPageFetchError`), spinner (`SpinnerBlock
  size/variant`), stat-card (`statCardDelta()`, grade 2×2 no telefone), table
  (`TableCaption`, `TableSizeContext`), timeline (`state="skipped"`), toggle
  (`ToggleContent`, `toggleStyle`), toolbar (`useStickyBar`,
  `useOverflowActions`, `OverflowActionsMenu`, `toolbarClassName`,
  `toolbarRowClassName`), tooltip (atalho escondido e sem abrir no toque),
  device-frame/showcase (`MOLA_PALCO_LAYOUT`).

**Comentários desatualizados no código** (só texto): `drawer.tsx:113`,
`form.tsx:951`, `button-group.tsx:~36`, `command.tsx:1059`,
`search-input.tsx:76`, `toolbar.tsx:29,126`, `top-bar.tsx:52,481`,
`bottom-bar.tsx:~25`. **`toolbar.tsx:41` `TOOLBAR_CONTROL_HEIGHTS.coarse =
40`**: verificar quem lê; se for só documental, corrigir para 44; se alimenta
layout, parar e perguntar.

### C. Forma fixa das páginas

Completas hoje: avatar-group, device-frame, filter-bar, onboarding,
page-header, page-section, presence-cursor, showcase, split-shell. Quase:
data-table (falta Esqueleto), sidebar, tabs, top-bar, stat-card, stepper,
table, timeline (faltam `IphoneFrame`), sheet (falta `IphoneFrame` e
Esqueleto), toolbar e bottom-bar (o "Na tela" se chama "A barra"). Todas as
outras ~60 páginas faltam "Na tela" + `Controles` e o `IphoneFrame`.

### D. Tokens sem página de fundação

- colors: `--primary-hover-ring`, `--identity-1…6-soft`, `--identity-1…6-ink`,
  `--bottom-bar-surface`, `--bottom-bar-marker`, a família `--glass-*`
  (`tint`, `cloud`, `rim`, `rim-angle`, `rim-far`, `rim-shade`, `ink-amount`,
  `ink-boost`), `--mobile-glass-bg`, `--mobile-glass-border`, `--device-bezel`,
  `--device-bezel-edge`, `--button-colorful-opacity`.
- brand: `--brand-field-vignette`, `--brand-grain`, `--brand-grain-size`.
- shape-elevation: `--radius-xl`…`--radius-4xl` (dizer que são da escada do
  Tailwind e que `ui/` não os veste — `radius-roles.test.ts`).
- touch-safe-area: `--bottom-bar-offset`, `--top-bar-bottom`.
- container/typography: `--space-block`, `--space-identity`, `--space-inline`,
  `--space-section`; `--tracking-eyebrow`.
- motion: `--duration-gentle`, `--ease-in-out`.
- scroll-area: `--scroll-fade-h`, `--scroll-fade-x-h`, `--scroll-fade-floor`,
  `--scroll-fade-blur-r`, `--scroll-fade-band-h`, `--scroll-fade-top-max`.

## Como (decidido)

- **Motion** (chamada minha): a página é reescrita em seções por família (a
  tabela A), cada uma com: (1) uma demonstração viva com botão "Reproduzir"
  que remonta a peça por `key`, usando o componente real quando existe
  (`DropdownMenu` aberto, `Accordion`, `Tabs`, `ThemeToggle`…) e a `@utility`
  num bloco neutro quando não existe; (2) uma `SpecList` com nome, número
  (duração, curva ou rigidez/amortecimento), consumidores e arquivo. As molas
  de JS ganham o mesmo desenho de curva que as `--ease-*` já têm (amostrar a
  mola em JS). A seção "Movimento reduzido" vira tabela: o que para, o que
  encurta, o que segue. As funções de quadro do cabeçalho e da busca ganham
  uma demonstração com `IphoneFrame` e um controle de progresso (`Slider`)
  que pinta o quadro em `t` — câmera lenta, como o laboratório já faz.
- **Forma fixa**: o template é `docs/avatar-group.tsx`. Componente sem eixo
  natural ganha `Controles` com os interruptores de estado que ele tem
  (`disabled`, `pending`, tema); "No telefone" mostra a peça no
  `IphoneFrame` na escala do toque.
- **Testes novos** em `src/app/designsystem/`: `motion-coverage.test.ts`,
  `token-coverage.test.ts`, e a extensão de `doc-pages.test.ts`. Usam
  `src/test/fonte.ts` (`lerFonte`, `semComentarios`, `blocoCss`). Os testes
  entram **primeiro, falhando**, com uma lista de pendências que encolhe a
  cada tarefa e termina vazia (o teste final não tem lista).
- **Execução** num worktree, tarefas por lote de páginas, `top-bar` por
  último.

## O que fica para quem constrói

- A ordem das seções dentro de cada família da página de movimento.
- Quais eixos cada página de componente simples expõe (o que o componente
  tem).
- O texto das notas, em português, no tom das páginas vizinhas.
