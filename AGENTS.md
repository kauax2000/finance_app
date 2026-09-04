<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Forms and Enter-to-submit

- Use **`Form`** from `@/components/ui/form` for any user-facing flow where fields are saved or confirmed with a primary action. It normalizes **Enter** to the primary **`Button type="submit"`** (and skips hijacking for textareas, native selects, contenteditable, Radix select triggers, and combobox/listbox roles).
- **As peças são a forma curta**, e cada uma compõe um átomo: `FormInput` /
  `FormTextarea` (sobre `Field` — rótulo, ajuda e erro já ligados),
  `FormSubmit` (sobre `Button` + `Spinner` — `pending` desabilita, marca
  `aria-busy` e troca o rótulo), `FormCancel` (`tertiary` + `type="button"`, a
  tabela do rodapé embutida), `FormActions` (`inline` ou `sticky`, o rodapé de
  folha) e `FormError` (o erro que não é de campo). **`CustomForm` é `Form`
  com `layout="none"`** e continua válido — 54 chamadas em 29 arquivos.
- Use **`type="submit"`** only for that primary action. Use **`type="button"`** for cancel, dismiss, toggles, and auxiliary actions.
- Avoid raw **`<form>`** for submit flows unless there is a documented exception.
- If you add a control that uses **Enter** for its own behavior (e.g. another Radix primitive), either mark it with a stable **`data-slot`** and extend `shouldDeferEnterToWidget` in `form.tsx`, or document the exception.
- **Estar fora do `<form>` no DOM não protege ninguém.** Um popover é
  portalizado para o `body`, mas **eventos de portal do React sobem pela árvore
  do React** — e a raiz do seletor é filha do formulário. Medido: o `Enter` no
  campo de busca do `FormPickerPopover` **salvava a transação**, com o conteúdo
  comprovadamente fora do `<form>` no DOM. A regra de
  `form-picker-popover-search` em `shouldDeferEnterToWidget` é o conserto, e a
  lição é geral: todo campo de texto dentro de um portal precisa da regra, mesmo
  parecendo estar longe do formulário.

## Design system

O design system deste projeto tem três partes, e nenhuma delas se presume de
memória:

- **Componentes** em [`src/components/ui/`](src/components/ui) — 75 hoje.
- **Tokens** em [`src/app/globals.css`](src/app/globals.css).
- **Documentação viva** em `/designsystem`, com uma página por componente e por
  padrão. Sempre disponível em desenvolvimento; em produção, atrás de
  `NEXT_PUBLIC_DS_DOCS`.
- **A taxonomia é atomic design canônico**, e mora no mapa `LAYER` de
  [`registry.ts`](src/app/designsystem/registry.ts): Fundações → Átomos →
  Moléculas → Organismos → **Templates** → Padrões. Ele é **exaustivo**: um
  componente novo sem camada não compila. A regra de cada nível está escrita no
  topo do arquivo, e [`taxonomy.test.ts`](src/app/designsystem/taxonomy.test.ts)
  a tranca. **A régua é a hierarquia que cresce**: átomo é indivisível (anatomia
  interna e especialização não contam), molécula é feita de átomos, organismo
  é feito de moléculas — e quem contém organismo é organismo. O teste tranca a
  parte mecânica (um átomo importa no máximo **um** componente de `ui/`, e ele
  é átomo; uma molécula não importa organismo) e a **ordem alfabética pelo
  nome dentro de cada categoria** — a posição no `REGISTRY` não carrega
  decisão.

**Antes de escrever uma tela, saiba o que já existe:**

```bash
npm run ds:catalog                              # componentes, variants e tokens de hoje
npm run ds:audit -- <arquivo-ou-pasta>          # o que a tela violou
```

Rode os scripts em vez de reler os arquivos do design system a olho — eles são
baratos, não cansam e não erram diferente a cada vez. `ds:catalog` também avisa
quando um token existe em `:root` sem par em `.dark`, que é a origem mais comum
de "isso some no tema escuro".

As páginas de **Padrões** (`/designsystem/dinheiro`, `datas`, `formularios`,
`mobile-toque`, `vazio-carregando`, `graficos`, `chips-status`) valem mais que
qualquer página de componente: são as decisões que atravessam telas.

### Invariantes

1. **Componente não nasce em `src/app/`.** Nada de `function StatCard()` nem
   `cva()` dentro de um arquivo de tela — nenhuma outra rota enxerga isso, e a
   próxima tela reescreve o mesmo componente um pouco diferente. Exceção:
   convenção de rota do Next (`loading.tsx`, `error.tsx`) e layout genuinamente
   exclusivo daquela rota, que fica e é dito no relatório.
2. **Token-first, zero literais.** Nenhum `#hex`, nenhum `rgb()`, nenhum
   `bg-white` ou `text-gray-600`, nenhum `p-[13px]`. Cor escolhida na tela não
   acompanha o tema escuro nem troca de marca.
3. **`success`/`destructive` não são `income`/`expense`.** Verde de "deu certo" e
   verde de "entrou dinheiro" são coisas diferentes, e os tokens de dinheiro são
   mais saturados de propósito.
4. **A rampa de gráficos é neutra quanto a estado.** `--chart-1` a `--chart-5`
   são cinco matizes que só identificam séries. Quando verde e vermelho
   realmente significam entrada e saída, a série usa `--chart-income` e
   `--chart-expense`.
5. **Registry do shadcn antes de código autoral.** `input`, `card`, `dialog`,
   `table`, `select`, `tabs`, `badge` e companhia já existem no estilo do
   projeto, sobre Radix, consumindo estes tokens.
6. **`src/components/ui/` e `src/app/globals.css` exigem autorização humana.**
   Criar componente, mudar variant, adicionar token, rodar
   `npx shadcn@latest add` — tudo isso atinge todas as telas presentes e futuras.
   Apresente a proposta e espere o ok. Dentro do arquivo da tela, corrija direto.
7. **Esperar não é dissolver.** Se um componente já está declarado na tela e a
   extração depende de ok, ele fica onde está (com as cores corrigidas para
   token). Apagar a declaração e espalhar o JSX inline é pior que a violação
   original.
8. **Componente novo entra em três lugares na mesma mudança:** o arquivo em
   `src/components/ui/`, a entrada em `src/app/designsystem/registry.ts` e a
   página em `src/app/designsystem/docs/`. Depois, `npm run ds:docs-map`.

### O CLI do shadcn sobrescreve o que já existe

`npx shadcn@latest add <x>` reescreve as **dependências** do componente. Numa
instalação real deste projeto ele reescreveu `button.tsx`, `input.tsx`,
`textarea.tsx` e `dialog.tsx`, e nisso apagou o prop `size` do `Input`. Fotografe
`src/components/ui/` antes e devolva ao estado anterior tudo que já existia — o
procedimento está em `.claude/skills/design-system-guard/SKILL.md`.

### Maiúscula inicial do CTA é do sistema

O rótulo de um botão não depende de quem o escreve: `Button` embrulha texto cru
num `<span data-slot="button-label">` e aplica `::first-letter` nele — `salvar`
sai **Salvar**. O embrulho existe porque `::first-letter` **não vale em
`inline-flex`** (medido, não suposto), e o botão precisa ser flex para alinhar
ícone. Com `asChild` o embrulho desce um nível e envolve o texto do filho, para
`<Button asChild><Link>` continuar coberto.

**Quem passa um elemento em vez de texto assume a caixa alta** — é a saída para
o rótulo raro que precisa mesmo de minúscula (`<Button><span>git
push</span></Button>`). O catálogo não usa essa saída: ele escreve os rótulos em
minúscula e deixa a regra agir, porque uma página que demonstra o componente não
pode mostrá-lo fazendo o contrário do que ele faz.

**A garantia é do `Button`, não do `buttonVariants()`.** `buttonVariants()`
existe para o `Button`; quem precisa de um `<a>` ou de uma primitiva com cara de
botão escreve `<Button asChild>`. Dentro de `ui/` não sobrou nenhum uso por fora
— a rodada da composição tirou os dois últimos (`pagination`, `calendar`); no
app resta `not-found-shell.tsx` (dois `<Link>`), que é migração mecânica.

### ButtonGroup cola; trilho segmentado é outra coisa

`ButtonGroup` junta botões numa peça só — uma ação com seu menu, um par de
navegação. Ele achata os cantos internos e sobrepõe as bordas vizinhas em 1px,
então a emenda é um fio, não uma linha dupla. **Não embrulhe um controle
segmentado nele**: um `role="group"` entre um `role="tablist"` e suas
`role="tab"` quebra a posse ARIA, e o leitor de tela deixa de anunciar "aba 1 de
3". O trilho segmentado do app é `transactionSegmentContainerClassName` +
`transactionSegmentTabClassName`, e as abas são filhas diretas do `tablist`.

### Rodapé de diálogo: uma hierarquia só

Todo rodapé de `Dialog` e de `AlertDialog` tem a mesma forma, e ela não se
escolhe por tela:

| Papel | Variant |
| --- | --- |
| Sair sem fazer nada (`AlertDialogCancel`, `DialogClose`) | `tertiary` |
| A ação que o diálogo veio propor | `primary` |
| A mesma ação, quando não tem volta | `destructive` |

Cancelar vem antes da ação, e leva `type="button"`. Dois botões de contorno lado
a lado pesam igual, e o olho tem que ler os dois para descobrir qual é a saída.

No `AlertDialog` a tabela **já vem aplicada**: `AlertDialogCancel` nasce
`tertiary` e `AlertDialogAction` nasce `destructive`, com `type="button"` nos
dois. Só a terceira linha se escreve — `variant="primary"`, para a confirmação
definitiva que não destrói nada. No `Dialog`, `DialogClose` é um passa-tudo e
recebe `asChild` com um `Button variant="tertiary" type="button"` dentro.

### Par de identidade: sem gap

Nome sobre e-mail, título sobre legenda, rótulo sobre valor — sempre que dois
textos empilhados são **o mesmo dado em duas linhas**, quem os separa é a
entrelinha. Não declare `gap` entre eles, nem `gap-1`. Dois pixels bastam para o
par deixar de ler como uma coisa só. `gap` continua certo entre coisas
**diferentes**: um bloco e o seguinte, um campo e o próximo.

### Tokens e theme

- **Semantic colors** live in [`src/app/globals.css`](src/app/globals.css):
  `success`, `warning`, `info`, `income`, `expense`, e os pares `-muted` de cada
  um. **O verde da marca tem dois tokens, e a escolha é pelo papel**:
  **`--secondary-hover`** existe pela mesma razão que a divisão acima: um alfa
  único não serve os dois temas. `bg-secondary/80` dava 1,03:1 contra a base
  — invisível — e em direções trocadas, clareando no claro e afundando o botão
  na página no escuro. O token puxa a base na direção do próprio texto: escurece
  no claro (1,26:1), clareia no escuro (1,39:1). Sempre na direção do contato.
  `--primary` **preenche** (botão, checkbox, switch, faixa do slider) e é medido
  contra o texto que fica em cima; `--primary-accent` é **marca sobre o fundo**
  — texto, ícone, e todo traço fino: barra lateral de citação, contorno de chip
  selecionado, anel do thumb. Regra prática: se a cor vai carregar texto claro
  por cima, é `--primary`; se ela mesma precisa ser enxergada contra a página,
  é `--primary-accent`. **Traço com alfa é sempre acento** — `--primary` a 60%
  sobre a página escura cai para 2:1 e some, enquanto `--primary-accent` a 60%
  dá 3,07:1. No tema claro
  os dois são a mesma cor; no escuro nenhum valor único atende os dois — 4,5:1
  contra a página exige subir a cor, e aí o texto branco sobre o preenchimento
  reprova. Por isso **`text-primary` é proibido** — compila, porque
  `--color-primary` existe, e é justamente por isso que a regra é escrita: use
  `text-primary-accent`. Além deles: `--identity-1..6` (+ `-surface`) para distinguir pessoas,
  `--skeleton`, `--input-fill`, `--overlay`, a rampa `--chart-1..5` mais
  `--chart-income` / `--chart-expense`, a escala `--z-*` e os tokens de movimento
  `--duration-*` / `--ease-*`. Prefira utilitários como `bg-success-muted`,
  `text-expense-muted-foreground`, `z-(--z-sheet)` — **não** adicione classes
  cruas da paleta do Tailwind (`text-green-600`, `bg-rose-100`).
- **Camadas**: `--z-base` 0, `--z-raised` 10, `--z-sticky` 20, `--z-banner` 30,
  `--z-header` 40, `--z-modal` 50, `--z-sheet` 70, `--z-popover` 80, `--z-toast`
  100. Os números são os que o app usa — a rodada 02 corrigiu a escala, que
  descrevia sheet 50 / popover 60 enquanto a produção rodava 70 / 80. **Escalar
  para vencer é sempre sintoma**: se um popover precisa passar de
  `--z-popover`, o que está errado é quem o contém. Empilhamento local (`z-0`,
  `z-10`, `z-[1]` dentro de um componente) não é camada e fica como número cru.
  **Toda superfície ancorada num gatilho vive em `--z-popover`** — `Popover`,
  `DropdownMenu`, `Select`, `Tooltip`, `HoverCard`, `ContextMenu`, `Menubar` e
  `NavigationMenu`. Os cinco últimos estavam em `--z-modal`, ou seja, **na mesma
  camada do `Dialog`**: um tooltip dentro de um diálogo era decidido por ordem
  de DOM, não pela escala. E o `DatePicker` escalava o próprio popover até
  `--z-toast` para vencer uma disputa que `--z-popover` já ganhava — o sintoma
  de sempre.
- **Shadows**: `shadow-xs` / `shadow-sm` / `shadow-md` / `shadow-lg` /
  `shadow-xl`, todos com valores próprios no tema escuro.
- **Texto**: além da escala do Tailwind, `text-2xs` (0,6875rem, para contagem
  dentro de controle pequeno) e `text-control-sm` (0,8rem, o texto dos controles
  `size="sm"`).
- **Ícones**: **Heroicons, e só** — a regra é fechada, e tem dois guardas.
  **O ESLint é o porteiro**: `no-restricted-imports` reprova `lucide-react`,
  `react-icons`, `@radix-ui/react-icons`, `@tabler`, `phosphor`, `feather`,
  `font-awesome`, `@mui/icons-material` e companhia. Ele nasceu verde — nenhuma
  está instalada —, e existe para o dia em que um `npm i` trouxer a primeira.
  **O auditor é o relatório**: `npm run ds:audit -- --rule G` acha os dois
  furos que dependência nenhuma pega — `<svg>` colado à mão e conjunto errado
  para o tamanho.

  Um conjunto de ícones é uma tipografia: o que faz a interface ler como
  sistema é todos virem do mesmo desenho. Dois conjuntos não empilham — a
  espessura do traço, a grade e o canto são outros, e uma barra com um ícone de
  cada lê como falha de renderização, não como escolha.

  **A exceção não é "ícone bonito de outro lugar", é o que não é ícone:**
  marca (o logo, a marca escrita, as bandeiras de cartão — propriedade de
  outra pessoa, e que não existe em biblioteca de ícone) e primitivo desenhado
  (a roda do `Spinner`, cuja geometria é o comportamento). A lista vive em
  `DRAWN_SVG_FILES`, no auditor, e é curta de propósito: a pergunta para entrar
  nela é se o arquivo desenha uma marca ou um movimento.

  **E o conjunto muda com o tamanho**, porque eles são redesenhos e não
  escalas — o micro tem menos detalhe e traço mais grosso, para sobreviver a
  16px. `size-6`+ usa `@heroicons/react/24/outline`; `size-5`
  usa o mini (`20/solid`); `size-4` e abaixo usam o micro (`16/solid`), o que
  inclui todo ícone sem classe de tamanho, porque o componente que o contém
  aplica `size-4`. Ícone passado como valor (mapa de ícone, config de navegação)
  fica em `24/outline`, já que quem renderiza é que decide o corpo — **e isso
  vale quando quem renderiza não é quem declara**. Com a tabela e o `.map()`
  vizinhos de arquivo, e o corpo cravado no sítio, quem declara **é** quem
  renderiza, e vale a régua do tamanho. A regra G do auditor passou a seguir
  essa indireção, e foi assim que 14 pares errados apareceram de uma vez.
  `components.json` declara `heroicons`.
- **Fonts**: [`src/app/layout.tsx`](src/app/layout.tsx) define `--font-sans`
  (Inter), `--font-display` (Ledger, só em `.page-title` e `.wordmark`),
  `--font-heading` (aponta para a sans), `--font-mono` (Geist Mono).
- **Utilitários**: `.nums` (tabular figures) e `.page-title`.

### Contorno de campo: decisão consciente fora da 1.4.11

`--input` vale o mesmo que `--border`, e o campo ganhou preenchimento
(`bg-input-fill/30`) nos dois temas em vez de só no escuro. Foi escolha de
design, tomada com o custo medido na mesa: **o conjunto identifica o controle a
1,3:1, e a WCAG 1.4.11 pede 3:1.** A página `/designsystem/cores` mantém a régua
acesa no ladrilho `--input` — ele aparece reprovando nos dois temas de
propósito, para a decisão ficar visível em vez de silenciada.

Antes `--input` era `oklch(0.66)` no claro (3,11:1, no piso da norma), porque o
campo era transparente e a borda identificava o controle sozinha. **Sobre
superfície branca não existe meio-termo suave**: qualquer cinza que alcance 3:1
já é um cinza visível. Quem quiser voltar à conformidade troca `--input` de volta
para `oklch(0.66 0 0)` no claro e `oklch(0.55 0 0)` no escuro — uma linha em cada
tema.

### Touch devices and hover (Tailwind v4)

- Utilitários como `hover:*`, `dark:hover:*` e `group-hover:*` compilam para
  **`@media (hover: hover)`**, então não valem em telefone (`hover: none`). **Não
  remova `hover:` do código para "otimizar para mobile".**
- **Decisão**: manter a variante `hover` **padrão** do Tailwind v4 (e não
  `(pointer: fine)`), para iPad com trackpad continuar tendo hover.
  [`src/lib/tailwind-hover-policy.test.ts`](src/lib/tailwind-hover-policy.test.ts)
  falha se alguém redefinir a variante para `:hover` puro.
- Em superfícies tocáveis, **some** `active:` ou `group-active:` para o toque ter
  a mesma resposta. O auditor sinaliza isso como regra **H**.

### Required primitives for new screens

- **Page chrome**: [`PageHeader`](src/components/ui/page-header.tsx) +
  [`PageSection`](src/components/ui/page-section.tsx) +
  [`Container`](src/components/ui/container.tsx). Os três têm `size` (`sm` |
  **`md`** | `lg`) e os dois primeiros têm `variant` — a régua, que no cabeçalho
  é **embaixo** e na seção é **em cima**. O `Container` também tem `full`, e
  **não tem `default`** — a escada dele é 448 · **576** · 672 · 1280 · sem teto,
  e a calha (`gutter`) é **opt-in**, porque quem é dono dela neste app é a casca.
  `PageHeaderTitleRow` recebe `back` e `endAdornment`;
  `PageSectionHeader` recebe `actions` — as três apagam anatomias que o catálogo
  escrevia à mão. Não existe `PageSectionContent`: ver a rodada 15.
- **Cartão e painel**: [`Card`](src/components/ui/card.tsx) e suas peças —
  `CardToolbar`, `CardHeader`, `CardContent`, `CardFooter`, `CardNote`. O
  painel do app é `<Card padding="none">`; nada de `border-b bg-muted/30`
  escrito à mão para fazer uma barra de topo.
- **Typography**: [`H1`…`H4`, `Lead`, `P`, `Muted`, `Small`, `Caption`](src/components/ui/typography.tsx) instead of ad-hoc `text-3xl font-bold` / arbitrary `text-[10px]`.
- **Empty states**: [`EmptyState`](src/components/ui/empty-state.tsx) (+ title / description / actions slots).
- **Money**: [`MoneyDisplay`](src/components/ui/money-display.tsx) e **`<Input money>`** ([`input.tsx`](src/components/ui/input.tsx)), com a forma curta `<FormInput money>`; formatting helpers in [`src/lib/formatters.ts`](src/lib/formatters.ts) (`currencyBRL`, `signedCurrencyBRL`, `percentBR`).
- **Dates**: [`src/lib/transaction-date.ts`](src/lib/transaction-date.ts) — e.g. `formatDatePtBr`, `formatTransactionDmyPtBr`, `formatDateLongPtBr`, `formatRelativeDayPtBr`.
- **Status chips / filters**: [`src/lib/tag-chip-classes.ts`](src/lib/tag-chip-classes.ts) — token-based classes only.
- **Régua compartilhada em `lib/`**: além de
  [`tag-chip-classes`](src/lib/tag-chip-classes.ts),
  [`menu-classes`](src/lib/menu-classes.ts) e
  [`scroll-fade-classes`](src/lib/scroll-fade-classes.ts), agora
  [`field-classes`](src/lib/field-classes.ts) — a superfície de campo que
  `Input`, `Textarea`, `NativeSelect`, `SelectTrigger`, `ComboboxTrigger`,
  `DatePicker`, `FormPickerPopoverTrigger` e, pelas variantes `Group`, o
  `InputGroup` vestem — e
  [`command-filter`](src/lib/command-filter.ts) — a busca por substring sem
  acento, graduada, que a paleta do catálogo e o `Combobox` dividem. **Nada de
  `cva` nesses arquivos**: a regra A2 do auditor o reprova fora de
  `components/ui/`.
- **Cor escolhida pela pessoa**: [`ColorTile`](src/components/ui/color-tile.tsx) para o ladrilho que carrega `categories.color`, `bills.color` ou a marca de um workspace. Se a cor vem do tema e não do banco, é o componente errado — use `bg-muted` ou um `Badge`. É o único lugar do app onde `white` e `black` crus são a resposta certa: o fundo é cor de runtime, e o que se apoia sobre ele — a tinta do ícone e o fio da borda — é material, não tema. Por isso ele está na lista de exceção do auditor — e nenhuma tela está. **O ladrilho é chapado**: o verniz que ele já teve (degradê branco, borda clara, sombra) saiu porque o resto do sistema preenche chapado. E a tinta não é branca por decreto — ela vira escura quando a cor gravada é clara demais para o branco alcançar 3:1.
- **Alerts / tabs / forms**: [`Alert`](src/components/ui/alert.tsx), [`Tabs`](src/components/ui/tabs.tsx), [`Textarea`](src/components/ui/textarea.tsx), [`ScrollArea`](src/components/ui/scroll-area.tsx), [`Toggle` / `ToggleGroup`](src/components/ui/toggle.tsx), [`Slider`](src/components/ui/slider.tsx), [`Radio` / `RadioGroup`](src/components/ui/radio-group.tsx) (a forma curta é `FormRadioGroup`), [`Pagination`](src/components/ui/pagination.tsx), [`Collapsible`](src/components/ui/collapsible.tsx), [`Breadcrumb`](src/components/ui/breadcrumb.tsx), [`ChartContainer` + chart helpers](src/components/ui/chart.tsx) for Recharts.
- **Campos**: [`Field`](src/components/ui/field.tsx) para rótulo + descrição + erro **já ligados — e agora ligados de verdade**: quem escreve `htmlFor`, `id`, `aria-describedby`, `aria-invalid` e `data-invalid` é o `FieldControl`, não a memória de quem escreve a tela. Esta linha afirmava o mesmo antes de o mecanismo existir; ver a rodada 11. [`FieldRow`](src/components/ui/field.tsx) para a linha de dois campos; [`InputGroup`](src/components/ui/input-group.tsx) para campo com ícone ou botão acoplado; [`Combobox`](src/components/ui/combobox.tsx) quando a lista passa de umas dez opções.
- **Seletor ancorado num campo**:
  [`FormPickerPopover`](src/components/ui/form-picker-popover.tsx) e as suas
  faixas — `FormPickerPopoverTrigger` (o gatilho **é** o campo: `outline`,
  `xl`, peso normal, chevron que gira), `FormPickerPopoverSearch` (sobre
  `InputGroup`), `FormPickerPopoverList`, `FormPickerPopoverItem` e
  `FormPickerPopoverFooter` + `FormPickerPopoverFooterAction`. São as mesmas
  três faixas do `Card` e do `Dialog`. Escolha-o quando a lista é longa e pede
  busca; `Select` quando é curta, `Combobox` quando cabe numa palavra.
- **Listas e detalhe**: [`Item`](src/components/ui/item.tsx) para linha de lista (e para o que a `Table` vira no telefone), [`DescriptionList`](src/components/ui/description-list.tsx) para pares termo/valor, [`Timeline`](src/components/ui/timeline.tsx) para histórico, [`Toolbar`](src/components/ui/toolbar.tsx) para a linha de filtros e ações.
- **Carregando**: [`Skeleton`](src/components/ui/skeleton.tsx) para uma tela esperando dado; [`Spinner`](src/components/ui/spinner.tsx) só para ação curta sem fim conhecido.
- **Borda de região rolável**: a dissolução é uma **primitiva do sistema**, não
  um efeito da paleta de comandos. Ela mora em três camadas — as `@utility`
  `scroll-fade-y` / `scroll-fade-x` em [`globals.css`](src/app/globals.css), a
  gramática em [`lib/scroll-fade-classes`](src/lib/scroll-fade-classes.ts) e o
  mecanismo em [`hooks/use-scroll-fade`](src/hooks/use-scroll-fade.ts). O
  [`ScrollFade`](src/components/ui/scroll-fade.tsx) **consome** a primitiva; ele
  não é ela, e serve o caso em que ninguém é dono da casca. Quem já tem casca
  própria compõe as classes direto, porque um `<div>` interposto quebraria o
  contexto do Radix ou do cmdk.
- **Busca**: [`Command`](src/components/ui/command.tsx) — a paleta de comandos. O catálogo `/designsystem` é o primeiro consumidor ([`ds-search.tsx`](src/app/designsystem/ds-search.tsx)): gatilho no meio do cabeçalho com o `Kbd` do atalho, `⌘K` e `/` para abrir, e `filter` próprio, porque o padrão do cmdk é difuso e erra em português. O **app** ainda não tem busca global, e é a lacuna que ele preenche.

### Component rules

- **`Badge`**: use semantic `variant` + `size` (`xs` | `sm` | `default`); avoid duplicating chip classes outside `tag-chip-classes` / Badge.
- **`Button` — a hierarquia é uma escada, e ela desce em peso visual**:
  `primary` preenche de verde, `secondary` preenche de cinza, `tertiary` não
  preenche nada. Uma tela tem um `primary` só. Fora da escada, de propósito:
  `outline` é a exceção para quando o controle precisa de contorno próprio e
  nenhum degrau serve, `destructive` é o que não tem volta, `link` é ação que se
  comporta como texto. **Não existe `variant="default"` nem `variant="ghost"`**
  — viraram `primary` e `tertiary`, para o nome dizer o degrau; os dois saíram
  do tipo, então o compilador acusa quem os escrever. **`success` e `warning`
  também saíram**: nomeavam um estado, não um peso, e nenhuma tela do app
  chegou a usá-los — estado de sucesso e de atenção é trabalho do `Badge` e do
  `Alert`, que mantêm os deles. Ação principal segue `type="submit"` dentro de
  `CustomForm`.
- **Uma escada de controle, para todos**: `xs` 24, `sm` 28, **`md` 32 (o
  padrão)**, `lg` 36, `xl` 40. Falam-na com os mesmos nomes e o mesmo padrão o
  `TabsList` (pela **bandeja**, ver a rodada 13) e o
  `Button`, o `Input`, o `SelectTrigger`, o `NativeSelect` e o
  `ComboboxTrigger` — então botão ao lado de campo alinha **sem ninguém dizer
  `size`**, e mudar um degrau move os dois pelo mesmo nome. Nem todo controle
  oferece todos os degraus (campo não desce a 24), mas nenhum usa um nome para
  uma altura diferente.
- **`Button`** ainda tem a coluna `icon-*`, que espelha a de texto degrau a
  degrau: `icon-xs` 24 … `icon-xl` 40. Botão de ícone ao lado de botão de texto
  usa o par, não o vizinho. `xs` e `icon-xs` são para dentro de outro controle,
  não para uma linha de formulário.
- **Não existe `size="default"`** em `Button`, `Input`, `SelectTrigger` nem
  `NativeSelect`, e não existe `size="icon"` em `Button`. O nome `default` dizia
  *o padrão* e apontava para 36, que deixou de ser o padrão quando `md` assumiu.
  Foram removidos dos tipos, então o compilador acusa quem os escrever — os
  substitutos são `lg` e `icon-lg`.
- **O `Tabs` entrou na escada, e a exceção que ele tinha era uma conta
  errada.** O texto anterior dizia que `TabsList` é contêiner com `p-1` e que
  "a 32 o gatilho interno cairia a 24", logo ficava em 36. A conta faz 36 − 8 =
  28 e para: ela nunca subtraía o `-1px` do `h-[calc(100%-1px)]` que o próprio
  componente escrevia. **O gatilho media 27** — abaixo do piso de 28 —, e a
  altura declarada protegia um piso que ela já violava. A raiz é ancorar a
  escada no **contêiner**, o mesmo defeito que o `Menubar` teve e corrigiu.
  Hoje `size` mede o gatilho (`sm` 28, `md` 32, `lg` 36) e a bandeja deriva
  (`gatilho + 8`); a bandeja padrão passou de 36 para 40, porque `md` é o padrão
  do sistema, e `size="sm"` reproduz os 36 de antes com o gatilho correto.
  [`tabs-size-ladder.test.ts`](src/components/ui/tabs-size-ladder.test.ts) tranca
  isso, e a asserção que vale é a de que **a lista não declara altura nenhuma**.
  `Toggle`, o campo do `Command` e a célula da `Table` já valiam 32 e não se
  mexeram.
- **`Card` tem dois eixos, e eles são independentes**: `variant` decide a
  **superfície** (`outline` chapado — o padrão —, `elevated` levantado, `muted`
  material de segunda ordem, `ghost` sem borda nem preenchimento); `padding`
  decide o **ritmo interno** (`none` | `sm` | **`md`, o padrão** | `lg`), numa
  medida só que o casco usa para separar os blocos e os slots para recuar.
  **`padding="none"` é o painel** — o corpo sangra até a borda e as tiras
  mantêm os seus 16px —, e é a forma mais comum do app. **Não existe
  `size`**: o `size="sm"` de antes era `gap-0 py-0` com o nome errado, saiu do
  tipo, e o substituto é `padding="none"`.
- **As três tiras do `Card` sangram até a borda, e o casco recolhe o próprio
  respiro daquele lado sozinho**: `CardToolbar` (barra de topo — rótulo à
  esquerda, contagem ou ação à direita), `CardFooter` (ações, mesma tinta da
  barra) e `CardNote` (letra miúda que ninguém clica, mais quieta). Não
  escreva `rounded-t-xl`, `pt-0` nem `border-b bg-muted/30` à mão: as 24
  barras e 18 notas inline do app são o invariante 1 sendo violado 42 vezes.
  `CardHeader` **não** é a barra — ele compartilha a superfície do corpo e vive
  dentro do respiro.
- **Cartão clicável é o link, não um link em volta dele**: `interactive`
  (elevação no cursor, par `active:` para o toque, anel de foco) + `asChild`
  com um `<Link>` dentro. **`Card` não tem `tone` de dinheiro** — superfície
  tingida de entrada e saída é o `StatCard`.
- **`Alert` tem três eixos, e o da cor se chama `tone`**: `default` | `info` |
  `success` | `warning` | `destructive`. **Não existe `variant` para a cor** —
  ele saiu do tipo, porque neste projeto as cinco cores semânticas se chamam
  `tone` em `StatCard`, `Progress`, `Timeline` e `AnnouncementBar`, e o `Alert`
  era o único a discordar. `variant` agora é a **forma** (`soft` com moldura —
  o padrão — e `plain` tingido sem borda, para dentro de formulário ou
  diálogo), e `size` é o **corpo** (`sm` | **`md`**), que encolhe texto, respiro
  e ícone juntos.
- **O raio é do componente, e não da variante.** Ele morava dentro do `variant`
  — `soft` trazia `rounded-xl` e `plain` trazia `rounded-lg` —, e o resultado
  era medível: **14px contra 10px**, dois alertas lado a lado com cantos
  diferentes. Canto não é moldura; o que o `variant` decide é ter borda ou não.
  Ele também **não desce com o `size`**, pela mesma razão que o
  `data-[size=sm]:rounded-md` saiu do `NativeSelect`: raio por degrau é desvio,
  e nenhum outro controle do sistema o faz. Medido depois: **um raio só, 14px,
  nos 13 alertas da página**.
- **O deslocamento do ícone é por degrau, e a conta é `(entrelinha − ícone) / 2`.**
  Ele vivia cravado em `translate-y-0.5` na base, o que é certo só no `md`
  (20 − 16) / 2 = 2px. No `sm` a conta dá 1px, e **todo alerta `sm` saía com o
  ícone 1px abaixo do centro da primeira linha** — pouco para nomear a olho,
  suficiente para o olho notar que algo está torto. Medido depois: desalinho
  **zero** nos dois degraus.
- **O tom do `Alert` chega ao texto.** `AlertTitle` e `AlertDescription`
  herdam a tinta do tom — a descrição a 85% —, em vez de carimbar
  `text-foreground` e `text-muted-foreground` por cima. Cinza sobre superfície
  colorida passa na norma (5,1–5,7:1) mas lê como texto que caiu ali por
  acidente; a tinta tonal dá 6,9–10,8:1. O tom `default` é a única exceção, e é
  porque ali a superfície é neutra.
- **A ação do `Alert` é o `AlertAction`, e ele não declara cor.** É um `Button`
  `tertiary` `size="sm"` cuja borda, tinta e realce saem de `currentColor`,
  então a mesma peça serve os cinco tons e o par `active:` vem junto. Escrever
  `border-destructive/40 hover:bg-destructive/10` num botão dentro de um alerta
  é reimportar a paleta para dentro da tela. **`AlertActions` é só a linha** —
  ver a rodada abaixo, e o `dark:hover:` que a peça carrega de propósito.
- **`Dialog` tem dois eixos**: `size` é a largura (`sm` 384 | **`md` 448, o
  padrão** | `lg` 512 | `xl` 576) e `layout` é quem manda na altura — `auto` (o
  conteúdo, com o respiro no casco) ou **`fixed`** (a janela, com o corpo
  rolando em `DialogBody` entre cabeçalho e rodapé parados). `fixed` é a forma
  de 13 das 25 chamadas do app, e era escrita à mão em cinco classes no casco
  mais três em cada corpo rolável. **Não escreva `min-h-0 flex-1
  overflow-y-auto` à mão**: é `DialogBody`, e o `min-h-0` é o que falha calado —
  sem ele o diálogo cresce até sair da tela em vez de rolar.
- **O `AlertDialog` mede pela régua do `Dialog`** (`dialogContentVariants`), e
  não oferece `layout="fixed"`: uma confirmação que precisa de corpo rolável não
  é uma confirmação.
- **`AlertDialogAction` e `AlertDialogCancel` são `Button` de verdade**, com
  `variant`, `size` e `disabled` — e por isso a maiúscula inicial do CTA
  finalmente os alcança. A ação já vem `destructive` (o `AlertDialog` existe
  para o que não tem volta, e foi o que 8 de 8 confirmações pediram); o cancelar
  já vem `tertiary`. **Nunca passe `className={buttonVariants(...)}` nem pinte o
  botão à mão** — as três telas que escreviam `bg-destructive
  text-destructive-foreground` saíam com um fio verde em volta, porque o
  `border-primary` do `primary` sobrevivia embaixo.
- **O cabeçalho do `Dialog` é alinhado à esquerda nas duas larguras.** O
  `text-center sm:text-left` que vinha do shadcn centralizava o título no
  telefone — e dentro de um `DialogHeaderRow`, que é grade de duas colunas, ele
  centralizava numa coluna que termina a 131px da borda: um eixo que não é o de
  nada.
- **O × não reserva lugar** (é `absolute`), então o título e a coluna do adorno
  desviam do território dele por conta própria — e só quando há um × para
  desviar. Sem isso, um título longo ou um `endAdornment` passa por baixo do
  botão em 16px, medidos.
- **O rodapé sangra por variável** (`--dialog-bleed`), não por número: em `auto`
  ela desconta o recuo do casco, em `fixed` não há o que descontar. O `-mx-4
  -mb-4` anterior pressupunha um `p-4` que a forma dominante do app não usa, e
  era por isso que sete telas o anulavam com `mx-0`. (O fio do cabeçalho também
  sangrava por ela; ele deixou de existir — ver a dissolução, mais abaixo.)
- **Duas coisas se chamavam `Sheet`, e elas respondem diferente ao telefone.**
  **Conteúdo** — formulário, detalhe, filtros — é `Sheet`, e vira gaveta.
  **Navegação presa a uma borda** é [`EdgePanel`](src/components/ui/edge-panel.tsx),
  e continua painel lateral em qualquer largura: menu entra pelo lado, não sobe
  do rodapé. A `Sidebar` usa `EdgePanel` — enquanto ela pegava o `Sheet`
  emprestado, herdou a regra do outro e abriu como gaveta de baixo, com alça de
  arraste, para listar seis links. O `Sheet` reusa o `EdgePanel` no desktop, então
  a moldura, a animação e o véu existem uma vez só.
- **Folha é coisa de desktop; no telefone ela é gaveta.** `Sheet` escolhe a
  superfície sozinho: acima de 768px é o painel do Radix deslizando de uma
  borda; abaixo, é uma gaveta do `vaul`, com arraste de verdade. **Não escreva
  `isMobile` para trocar de componente** — a API é uma só, e `side` simplesmente
  não vale no telefone. O que motivou a regra: o app desenhava a alça de gaveta
  com uma `div` `aria-hidden` e nenhum handler, e a "física" eram dois keyframes
  de CSS. Trinta e sete telas prometiam o arraste sem entregá-lo, enquanto o
  `vaul` estava instalado com zero usos.
- **As três superfícies modais são a mesma primitiva.** `Dialog`, `Sheet` e o
  `vaul` se apoiam todos em `@radix-ui/react-dialog`, e há **uma instância só**
  em `node_modules` — verificado em runtime, com o `aria-labelledby` da gaveta
  apontando para o `id` do `DialogTitle`. É o que faz uma cromagem servir os
  três. **Se as versões divergirem e o npm instalar duas cópias, o título passa
  a lançar dentro da gaveta**: é a premissa a olhar antes de mexer em
  dependência.
- **`Sheet` é só a superfície.** Ele tem `Sheet`, `SheetTrigger`, `SheetClose`,
  `SheetPortal`, `SheetOverlay` e `SheetContent` — e nada mais. **Não existem
  `SheetHeader`, `SheetFooter`, `SheetTitle` nem `SheetDescription`**: a
  cromagem vem do `Dialog` (`DialogHeader`, `DialogHeaderRow`, `DialogTitle`,
  `DialogDescription`, `DialogBody`, `DialogFooter`), e funciona porque as duas
  **são a mesma primitiva do Radix** — `Sheet` é `Dialog.Root`, então
  `DialogTitle` encontra o contexto de que precisa dentro de um `SheetContent`.
  A duplicação não era teórica: 18 dos 31 arquivos que usavam a cromagem da
  folha já importavam a do diálogo no mesmo fonte, porque a mesma tela é
  `Dialog` no desktop e `Sheet` no telefone.
- **`SheetContent` declara o mesmo contrato que `DialogContent`** —
  `--dialog-px`, `--dialog-bleed`, `--dialog-close` e `data-layout` —, e é isso
  que faz a cromagem funcionar nos dois. O recuo da folha é **16**, o do diálogo
  é 24: a folha encosta na borda da tela e o dedo já está ali. Um cabeçalho de
  folha costuma querer `hideSeparator` — ali o fio some, porque a alça e o
  contorno da gaveta já dizem onde ela começa.
- **`Drawer` é a gaveta que não muda com a largura.** `Sheet` **troca de
  superfície** (painel acima de 768px, gaveta abaixo); `Drawer` é gaveta sempre.
  Escolha-o quando o gesto é a afordância, e não uma consequência de a tela ser
  estreita. Até a revisão dele o arquivo era o do shadcn intacto, sem nenhuma
  tela, e repetia o defeito que a rodada do `Sheet` tirou de 37: a alça era uma
  `div` decorativa, sem `data-vaul-handle`, sem área de toque, sem gesto —
  **desenhava a promessa do arraste** enquanto a física ficava na documentação.
  Agora é `DrawerPrimitive.Handle`, com os 44px de alvo que o `vaul` injeta.
  Junto vieram as decisões que a folha já tinha: `--z-sheet` em vez de
  `--z-modal`, `bg-background` em vez de `bg-popover`, `dvh` + área segura em
  vez de `80vh`, e `repositionInputs`.
- **A cromagem do `Drawer` também vem do `Dialog`.** `DrawerHeader`,
  `DrawerTitle`, `DrawerDescription` e `DrawerFooter` **saíram do arquivo**,
  pela mesma razão que a folha nunca os teve — e o daqui divergia, centralizando
  o título contra a decisão de que o cabeçalho é alinhado à esquerda em toda
  largura. `direction` aceita só `bottom` e `top`: o `[data-vaul-handle]` do
  `vaul` declara `touch-action: pan-y`, então a alça só arrasta na vertical, e
  uma gaveta lateral teria a alça de enfeite outra vez. Borda lateral é
  `EdgePanel`. A alça é uma constante só (`DRAWER_HANDLE_CLASS`), que a folha
  importa — o `!` nas três marcações é o que troca o cinza literal e as medidas
  que o `vaul` injeta numa folha de estilo própria.
- **A alça é da superfície.** No telefone o `vaul` a desenha e ela **é** a área
  de arraste; no desktop não há alça, porque a folha lateral não se arrasta.
  `SheetDragHandle` não renderiza mais nada — ele sobrevive só porque 16 telas
  ainda o escrevem, e apagá-lo delas é limpeza mecânica pendente.
- **A folha não injeta o ×, e não existe `showCloseButton` nela.** O botão é
  uma peça: `DialogCloseButton`, composta como último filho do `SheetContent`.
  Ele saía de fábrica e **16 das 36 chamadas o desligavam**, porque um ×
  flutuante passa por cima do conteúdo e some atrás de um cabeçalho fixo assim
  que a pessoa rola — dentro de um cabeçalho, o lugar dele é o `endAdornment` de
  um `DialogHeaderRow` (ou o `MobileSheetFormHeaderCloseButton`). A reserva de
  espaço no título vem de **haver** um ×, detectada por
  `has-[>[data-slot=dialog-close-button]]`, não de um prop. O `DialogContent`
  mantém o `showCloseButton`: lá a conta se inverte (só 6 de 25 o desligam),
  porque um diálogo é curto e o conteúdo não rola por baixo do botão.
- **Um `Popover` é um `role="dialog"`, e ele precisa de nome.** O
  `Popover.Content` do Radix carimba o papel e **nunca escreve
  `aria-labelledby`** — um diálogo sem nome é anunciado como "diálogo", e nada
  mais. `PopoverTitle` era uma `<div>` tipada como `h2`, sem `id` e sem ligação
  com o conteúdo; o `MobileAccountMenu` chegou a escrever um
  `<PopoverHeader className="sr-only">` justamente para nomear o popover, e o
  texto não chegava ao papel. Agora `PopoverTitle` e `PopoverDescription` se
  **registram**, e o conteúdo só aponta `aria-labelledby` / `aria-describedby`
  quando eles existem — apontar para um `id` ausente deixa o nome vazio, que era
  o estado anterior. Popover sem rótulo visível leva o par em `sr-only`.
- **O teto e a folga do `Popover` vêm de fábrica**:
  `max-h-(--radix-popover-content-available-height)` com `overflow-y-auto`, e
  `collisionPadding` 8. A variável já era calculada pelo Radix e só o
  `FormPickerPopoverContent` a lia — sem ela um popover alto sai da tela, e sem
  a folga ele encosta na borda. Quem gerencia a própria rolagem declara
  `overflow-hidden` e vence. E título sobre descrição é **par de identidade**:
  `PopoverHeader` não tem `gap`.
- **O seletor devolve o foco ao fechar, e não rouba ao abrir.** Os dois
  `AutoFocus` vinham prevenidos. Com o mouse isso não aparece — o foco nunca sai
  do gatilho —, mas o campo de busca vive **dentro** do popover, então o caminho
  de teclado é o caminho normal, e ali fechar deixava o foco no `<body>`:
  medido, tanto ao escolher quanto no Esc. A justificativa (o salto de rolagem)
  vale para **abrir** e não para fechar, porque o Radix já devolve o foco com
  `element.focus({ preventScroll: true })`. Abrir continua sem roubar o foco: lá
  a razão é o teclado do telefone.
- **`type="search"` traz um × que não é seu.** O WebKit desenha o próprio botão
  de limpar (`::-webkit-search-cancel-button`) em azul do sistema, na medida do
  sistema, sem conhecer o tema escuro nem a escada de controles. A semântica
  fica — é ela que dá a tecla "Buscar" no teclado do iOS —, mas o desenho é
  suprimido com `appearance-none` e o botão é nosso, um `InputGroupButton` no
  addon `inline-end`, que só aparece quando há texto. Vale para qualquer campo
  de busca do app, não só para este.
- **A raiz do seletor é quem sabe do telefone.** `modal={isMobile}` vem de
  fábrica — sem isso, rolar a lista arrasta a folha que a contém, e o dedo não
  distingue as duas. As três telas tomavam essa decisão sozinhas, com a mesma
  resposta.
- **`DropdownMenu`, `ContextMenu` e `Menubar` são a mesma superfície**, e ela
  mora em [`lib/menu-classes`](src/lib/menu-classes.ts) — os três só diferem em
  como são invocados. Antes divergiam em **todas** as medidas: item 32 contra 28,
  raio 8 contra 10, borda contra anel, `bg-muted` contra `bg-border`, e o
  dropdown sem teto de altura nenhum. O `Dropdown` estava em 21 telas e era o
  mais atrasado; o `Context`, em zero, e era o mais moderno — venceu a régua
  dele, que já concordava com `Select`, `Menubar` e `Popover`.
- **A linha do menu cresce no toque, não no telefone.** `pointer-coarse:min-h-11`
  leva o item de 28 para 44px quando o **apontador** é grosso — medido nos dois
  ponteiros. A pergunta é sobre o dispositivo e não sobre a largura, pela mesma
  razão que `hover: hover` é (ver `tailwind-hover-policy.test.ts`): um telefone
  em paisagem continua grosso, um desktop estreito continua fino.
- **Rádio é ponto, caixa é tique.** Os dois menus usavam o mesmo `CheckIcon`
  nos dois indicadores, o que apaga a diferença entre "escolha uma" e "marque
  quantas quiser". O ponto segue a decisão já tomada no `Radio`: um
  círculo não precisa ser SVG, e o Heroicons não traz círculo puro.
- **Variante empilhada é seletor de descendente.** `group-hover/x:group-data-[y]/x:`
  compila para uma **cadeia**, e quando as duas apontam para o mesmo elemento o
  seletor não casa com nada. Quando um valor depende de dois estados ao mesmo
  tempo — no `AppThemeToggle`, de que lado está o polegar **e** se há cursor —,
  a saída é inverter quem carrega o quê: **o estado mora em variável na raiz, e
  o hover só troca qual variável o filho lê**. Cada classe fica com um variante
  só. (`[--theme-blob-rest:0%] [--theme-blob-dest:100%]` mais
  `data-[visual=light]:` invertendo as duas, e no filho
  `translate-x-(--theme-blob-rest)` contra
  `group-hover/theme:translate-x-(--theme-blob-dest)`.)
- **`hover:` e `dark:` empatam em especificidade, e o `dark:` é emitido depois.**
  `&:hover` e `&:is(.dark *)` são ambos 0,2,0, então no tema escuro um
  `dark:bg-*` **anula** o `hover:bg-*` — silenciosamente, e só num tema. Medido no
  `AppThemeToggle`, onde o hover estava morto no escuro havia tempo. Quem pinta
  fundo diferente no escuro precisa do par `dark:hover:`, como o `Button` já faz
  com `dark:hover:bg-muted/50`.
- **Classe montada em tempo de execução não existe.** O Tailwind varre o código
  como **texto**: `` `max-h-(--radix-${prefix}-content-...)` `` nunca chega ao
  CSS, porque a string não aparece em fonte nenhuma. Medido: a variável do Radix
  valia 318,75px, a classe estava no elemento, e o `max-height` computado era
  `none`. Por isso as duas classes que carregam o nome da primitiva ficam
  escritas por extenso em cada menu, e não na superfície compartilhada.
- **`DropdownMenuContent` tem `size` e `variant`, e os dois saem de contagem.**
  `size` é **largura** (como no `Dialog`): `auto` — o padrão — mais `sm` 176,
  `md` 192, `lg` 208, `xl` 224. Das 25 chamadas do app, **18 declaram só uma
  largura**, e sempre uma dessas quatro: `w-44` (8×), `w-48` (5×), `w-56` (3×),
  `w-52` (2×). O eixo não inventou escala nenhuma — deu nome à que já existia.
  `variant="panel"` é o que o `UserMenu` e o `WorkspaceSwitcher` montavam à mão
  (`rounded-xl p-0` mais sombra e anel próprios): ali dentro não há comandos, e
  sim cabeçalho de conta e blocos. A casca cede o recuo, como o `Card` faz em
  `padding="none"`.
- **O painel tem faixas, e quem chama não as desenha.** `DropdownMenuHeader`
  sangra até a borda; `DropdownMenuSection` devolve o recuo
  onde há comandos. A seção não é enfeite — o `-mx-1` do
  `DropdownMenuSeparator` sangra exatamente aquele `p-1`. Sem ela o painel saía
  com **dois traços horizontais de larguras diferentes** (224px o do cabeçalho,
  216px o do meio), que é o mesmo defeito que o `DialogHeader` já tinha
  corrigido com `--dialog-bleed`. A primeira versão do `panel` tentou
  compensar com `[&_[data-slot=…-separator]]:mx-0 my-0` e piorou: matou também
  o respiro vertical do fio. Compensar geometria por seletor é sintoma de que
  falta uma peça.
- **O fio entre a identidade e os comandos é do slot, não da faixa.** A faixa de
  identidade do painel **não rotula** os comandos abaixo dela — ela é um bloco
  de outra natureza empilhado sobre uma lista, e a fronteira entre os dois é a
  mesma que o painel já marca entre grupos com `DropdownMenuSeparator`. Por
  isso ela mantém o fio, no mesmo peso (`border-border`): é o traço que divide
  **itens**, não superfícies — a categoria que nunca o perdeu. A dissolução do
  viewport não disputa com ele, porque diz outra coisa ("há mais conteúdo
  acima"); e o painel do `UserMenu` **não rola**, então sem o fio a identidade
  ficava sem fronteira nenhuma. Medido: fio, separador e painel todos a 224px,
  na mesma cor.
  **Ele mora no slot `header`, e não em `DropdownMenuHeader`**, porque o
  consumidor real do padrão não usa aquela peça — o `UserMenu` passa um
  `DropdownMenuLabel` com um `AccountMenuUserSummary` dentro. Regra escrita na
  faixa alcançaria o catálogo e deixaria o app de fora, que é exatamente como o
  `border-t` do `DialogFooter` já enganou este projeto uma vez.
- **Os três menus ganharam teto horizontal.** `max-w-(--radix-*-content-available-width)`
  entrou junto do teto vertical, que já existia. Sem ele um menu largo perto da
  borda transbordava na horizontal — o Radix já publicava a variável e ninguém
  a lia.
- **`PopoverContent` tem `padding`.** `default` e `none`, e `none` zera o `gap`
  junto, porque as cinco chamadas que anulavam o recuo escreviam `gap-0 p-0` —
  as duas coisas andam juntas quando o popover hospeda um componente inteiro
  (calendário, `Command`, lista).
- **`DrawerContent` tem `variant` e `size`.** `flush` cola nas bordas e
  arredonda só o lado de dentro; `inset` solta a gaveta com margem e cantos
  completos. `size` é o teto de largura acima de 640px — `full` (o padrão, o
  comportamento do telefone), `md` 32rem e `lg` 42rem, as duas centralizando.
  A razão é o desktop: uma gaveta de baixo numa janela de 1900px vira uma linha
  de leitura de 1900px.
- **`FormPickerPopoverEmpty` existe** porque três telas escreviam a lista vazia
  à mão em duas grafias (`px-1 py-6 text-center` e `py-4 text-center`) — e a
  demonstração do catálogo tinha inventado uma terceira. O texto continua de
  quem chama: "nenhuma categoria encontrada" é busca sem resultado, "nenhum
  cartão cadastrado" é ausência de dado.
- **O `Menubar` tem `variant` e `size`, e o `size` mede o gatilho.** `variant`
  é a superfície da fileira (`outline` se sustenta sozinha, `ghost` entra num
  cabeçalho que já tem moldura, `solid` é bandeja da mesma **tinta** que a do
  `TabsList`, e não da mesma medida — `p-0.5` mais borda contra `p-1`, porque o
  `p-1` do `Tabs` é o que mantém um anel de 3px dentro de uma trilha que rola, e
  uma barra de menus nunca rola) e desce
  por contexto até o gatilho, porque o realce depende de sobre o que ele
  acende — na bandeja ele **sobe** para `bg-background` em vez de tingir, já que
  `--accent` e `--muted` são a mesma cor no tema escuro.
  **`size` mede o gatilho (28 | 32 | 36), e não a barra.** Ancorar no contêiner
  foi o que produziu o defeito medido — barra `h-8` com 3px de recuo e uma borda
  deixava **24px** para o gatilho, o degrau `xs`, que é para dentro de outro
  controle. O `TabsList` era citado aqui como a exceção legítima, "porque as
  abas dele esticam" — e a premissa era falsa duas vezes: `flex-1` dentro de um
  `w-fit` distribui sobra **zero**, então as abas nunca esticaram, e o `Tabs`
  hoje mede o gatilho como esta barra. Não há mais exceção: os dois ancoram no
  gatilho.
- **O `Tabs` tem três eixos, e a moldura não é a fileira.** `variant` é a
  superfície (`solid` bandeja — o padrão —, `underline` um fio sob a fileira com
  o marcador pousando nele, `ghost` sem nada); `size` mede o **gatilho**;
  `stretch` divide a linha em partes iguais (ligado só em `solid`, porque uma
  bandeja lê como controle segmentado e uma fileira de abas de página não); e
  `scrollable` faz a fileira rolar dissolvendo nas pontas.
  **Quem pinta é uma moldura `<div>` por fora da `Tabs.List`, e a lista não
  desenha nada** — a dissolução recorta o alfa do elemento inteiro, então uma
  bandeja mascarada sairia com os quatro cantos apagados e os lados opacos. E a
  moldura fica **fora**: um nó entre um `role="tablist"` e as suas `role="tab"`
  mexe na posse ARIA. O `p-1` mora na **lista**, não na moldura: `overflow-x`
  recorta no padding box, e com o recuo na moldura o anel de foco de 3px seria
  cortado nos quatro lados. `underline` sempre ocupa a largura toda, porque o
  fio dele **é** a fronteira com o painel — um fio que para depois da última aba
  lê como sublinhado do grupo. `orientation="vertical"` vale nas três, estilizado
  só por `data-orientation`, que o Radix carimba nos quatro nós (nos dois de
  baixo via `RovingFocusGroup`).
  **`scrollable` é opt-in**, e a razão é medida: `scroll-fade-x` declara 36px de
  `scroll-padding-inline`, e ligá-la sempre mudaria o `scrollIntoView` de toda
  barra de abas do app. Ele vence `stretch`, porque os dois juntos não fazem
  nada — com filhos `flex-1` a trilha nunca transborda, e a prop falharia calada.
  O `pointer-coarse:min-h-11` só entra quando **não** há `stretch`: aba de
  largura total já tem área de alvo grande; aba de largura de rótulo com 28px
  não tem.
- **O marcador do `Tabs` é um objeto só, e ele viaja — menos no `ghost`.** O
  realce saiu do gatilho e virou um nó (`tabs-indicator`) absoluto dentro da
  fileira: a trilha publica a caixa da aba ativa em `--tabs-indicator-x/y/w/h` e
  o marcador transiciona para ela em `--duration-base` com `--ease-out`. Antes,
  cada gatilho acendia e apagava o próprio realce, e isso **teleporta** — três
  marcadores piscando não dizem o que um marcador se movendo diz.
  **O `ghost` não viaja**, e a razão é o trilho: o marcador corre *ao longo de
  alguma coisa*, e a bandeja do `solid` e o fio do `underline` são essa coisa.
  Sem nenhuma das duas, o mesmo movimento vira um bloco preenchido deslizando
  sozinho sobre o fundo — na variante que existe exatamente para não chamar
  atenção. Ali cada gatilho pinta o próprio realce, e a tinta troca com
  `transition-colors`: mudança de cor, não deslocamento.
  **O nó está fora do fluxo**, então animar `width`/`height` nele não reflui
  irmão nenhum; `scaleX` foi rejeitado porque distorce o raio e a borda de 1px
  do `solid`. A medição são dois observadores (`ResizeObserver` na trilha e nos
  gatilhos, `MutationObserver` em `data-state`) — nada de `requestAnimationFrame`
  em laço —, e ela lê `offsetLeft`/`offsetTop` **relativos à trilha**, não
  `getBoundingClientRect`, senão o marcador escorregaria para fora da aba a cada
  pixel rolado em `scrollable`.
  **Sem JavaScript o gatilho ainda se pinta.** Não há caixa para medir antes da
  hidratação, e um marcador sem posição deixaria a aba ativa sem marca na
  primeira pintura — verificado no HTML do servidor: zero nós de marcador, e os
  onze gatilhos ativos com as classes de realce. A troca é um booleano no
  contexto, e **não** um seletor: `in-*` e `group-*` compilam com `:where()`, que
  não soma especificidade, e este projeto já pagou essa medição duas vezes.
  **Movimento reduzido não precisou de regra própria**: o bloco global encurta
  transições para 0,01ms, o marcador salta e o estado final chega igual.
- **O gatilho do `Combobox` é um campo, não um botão.** Ele era
  `Button variant="outline"` — `border-border` + `bg-background` no tema claro —
  enquanto `Select` e `Input` são `border-input` + `bg-input-fill/30`: os dois só
  convergiam sob `dark:`, e no tema claro um combobox ao lado de um select eram
  **duas superfícies visivelmente diferentes** fazendo o mesmo trabalho. Medido
  depois da troca: zero diferença em altura, borda, preenchimento, raio, corpo e
  recuo, nos dois temas. Ele sai do `Button` e, com isso, da garantia de
  maiúscula do CTA — o que é correto, porque placeholder de campo não é rótulo
  de ação.
  **`multiple` é união discriminada**, e por isso `<Combobox multiple={x}>` com
  um booleano não estreita: precisa de literal. A união **nunca desce pelo
  contexto** — o `ComboboxItem` recebe `isSelected` e `toggle`, e não vê
  genérico nenhum.
  **`ComboboxClear` é irmão do gatilho, não filho**, porque `button` não aninha
  em `button`; ele mora no `ComboboxField`, que é um `PopoverAnchor` — sem ele o
  painel sairia com a largura do gatilho e não a do campo. Quem recua para o ×
  é o **rótulo**, não o gatilho: recuar o gatilho empurra o chevron para dentro e
  o empilha sobre o ×, 25px de sobreposição, medidos.
  **O tique não escreve `aria-selected`**: o cmdk usa esse atributo para a linha
  *realçada* pela seta, e sobrescrevê-lo apagaria o cursor de teclado do leitor
  de tela. Quem diz "este é o escolhido" é um rótulo `sr-only`.
- **O `Command` é a quarta superfície de comandos, e o corpo dela é o mesmo.**
  A geometria vem de `menuItemGeometryClassName`; os **estados** ficam no
  arquivo dele porque o cmdk os escreve diferente — a linha ativa é
  `data-selected` e não `:focus`, e `data-disabled="false"` fica **sempre
  presente** no elemento, então a regra por presença dos menus apagaria toda
  linha. **`variant` é a moldura, e são duas.** `bare` (o padrão) não desenha
  borda **nem canto** — ele herda o raio de quem o contém, e é isso que apagou
  uma terceira variante: havia um `dialog` que existia só para cravar
  `rounded-xl` e bater com o casco, ou seja, um número do **contêiner** copiado
  para dentro do componente. Herdando, a paleta acerta o popover (10px), o
  diálogo (14px) e qualquer superfície futura sem saber de nenhuma. `panel` é o
  oposto — borda e sombra próprias, para a paleta solta numa página. Antes
  disso o eixo se chamava `inline | dialog` e decidia só o arredondamento; o
  buraco aparecia na tela, com as quatro demonstrações do catálogo escrevendo
  `border border-border` à mão.
- **O topo da paleta em diálogo não se mexe.** Um `DialogContent` centraliza
  pela altura **real**, e numa paleta isso faz o campo de busca subir e descer
  sob o cursor a cada tecla. O `CommandDialog` fixa o topo onde a caixa cheia
  começaria (`calc(50% - var(--command-dialog-h) / 2)`, com `translate-y-0`) e
  deixa a borda de baixo encolher. Medido: 89, 8, 3, 1 e zero resultados, topo
  constante em 178px, base de 690 a 340. O `top-1/3` do shadcn resolve o mesmo
  sintoma chutando um terço; a conta acerta o centro de verdade.
- **O teto da lista é declarado pela casca, não pela lista.** Ela só lê
  `--command-list-max-h`. Duas armadilhas medidas no caminho: um seletor
  `in-data-[variant=dialog]` que sobreviveu à remoção da variante `dialog` e
  passou a não casar com nada; e o fato de que o `in-*` do Tailwind compila com
  `:where()`, que **não soma especificidade** — uma classe sob esse variante
  perde para a classe base no mesmo elemento. Variável herda e não disputa.
- **A paleta é uma superfície só, e o que separa as faixas é a dissolução.** A
  cor é declarada **uma vez**, na casca (`bg-popover/85` + `backdrop-blur`).
  Houve uma versão com vidro só nas pontas, usando o `bg-background/85` do
  `<header>`, e ela ficava **mais escura que o meio** — `oklch(0.145)` contra
  `oklch(0.205)` no tema escuro. Tom igual só é garantido quando a cor é
  declarada uma vez. O campo de busca repete as medidas do gatilho do cabeçalho
  (`h-8`, `rounded-lg`, `border-border`, `bg-input-fill/30`), porque quem abre a
  paleta vem de clicar nele. E o vidro impôs a sua condição: `backdrop-filter`
  sobre cor opaca não desenha nada, então o casco do `CommandDialog` ficou
  transparente.
- **As tiras de superfície não têm fio nem tinta.** `CardToolbar`, `CardFooter`,
  `CardNote`, `PopoverHeader`, `PopoverFooter`, `DropdownMenuHeader`, o
  cabeçalho da folha e os dois do `Dialog` — nenhum desenha traço nem pinta
  fundo. (O painel do `DropdownMenu` desenha um fio **no slot** que recebe a
  faixa, e é separador de itens, não emenda de superfície — ver acima.) O que separa a tira do corpo é o respiro que ela traz
  (`--card-strip-py`, 12px) e, onde há rolagem, o conteúdo dissolvendo por
  baixo dela. **Uma tira pintada é uma superfície diferente do corpo**, e o fio
  em cima dela é o segundo sinal para a mesma emenda.
  A troca foi aritmeticamente neutra: `py-2.5` mais `min-h-10` davam 40px, e
  12+16+12 dão os mesmos 40 — nenhuma tira mudou de altura, e é isso que tornou
  a migração de **50 cópias** verificável.
  **`CardToolbar` ganhou `variant: label | title`** porque sem tinta o tipo é o
  componente: das 23 barras escritas à mão, 8 eram título e 7 eram rótulo, e
  cravar um só faria as 8 sobrescreverem por `className` no mesmo dia.
- **O que continua tendo fio, e por quê.** Separador de **itens repetidos** —
  `TableRow`, `AccordionItem`, `SelectSeparator`, `ItemSeparator` —, porque ali
  o fio não divide superfície: é o que torna a lista varrível. **Moldura**
  (`border` completo). E `PageHeader`, `TableHeader` e `TableFooter`, que
  ficaram fora do escopo por decisão — o `H2` estava nesta lista, e perdeu a
  régua na rodada da composição.
- **A regra `J` do auditor é o que impede tudo isso de voltar.** Ela acusa fio
  **mais** tinta na mesma classe de uma tira, ignorando moldura. Ela existe
  porque a lição já custou caro: quando o `border-t` saiu do `DialogFooter`, o
  app **não perdeu o fio** — 24 chamadas o repunham à mão, e a mudança do
  componente nunca chegou à tela. Hoje ela está em **zero no app**, com uma
  exceção nomeada no catálogo: o `PreviewCode` desenha fio **e** tinta porque ali
  eles são a emenda entre **duas superfícies** (`card` para conteúdo, `muted`
  para código), e não uma tira. O número que decidiu: o fio dá 1,345:1 contra o
  cartão e a tinta dá 1,053 — **5,5× o trabalho**, e mesmo a 100% a tinta não
  alcança.
- **Quem recebeu a dissolução, e quem não.** `Command`, `ScrollFade`,
  `FormPickerPopover` (com as 3 telas migradas para as peças dele), `Sidebar`,
  `Table` (eixo X) e os viewports de `DropdownMenu` / `ContextMenu` / `Menubar`.
  **E o `Dialog`**: o `DialogBody` dissolve nas duas bordas, e **os fios saíram
  de vez** — o separador do cabeçalho e o `border-t` do rodapé, nos dois
  layouts, no `Dialog` e no `AlertDialog`. Com eles saiu o prop
  `hideSeparator`, que existia para desligar o fio e era usado por 9 chamadas.
  Uma primeira versão manteve o fio em `layout="auto"`, argumentando que ali
  nada rola e o fade nunca apareceria — e isso criava uma costura visível: um
  `fixed` de conteúdo curto também não rola, e ficava **sem** fio nenhum,
  enquanto um `auto` igualmente curto ficava com **dois**. Mesma situação
  visual, dois tratamentos. O diálogo é uma superfície só; o que separa as
  faixas é o respiro, e a dissolução onde há rolagem.
  **Fora, por mecanismo:** o `Select` — em `position="item-aligned"`
  o Radix escreve `viewport.scrollTop` à mão para alinhar o item selecionado, e
  ele abriria dissolvido, sem `scroll-padding` que resolva; o
  `DropdownMenu variant="panel"` — o cabeçalho é filho do viewport e a máscara
  o apagaria; e o `PopoverContent`, porque ele é ao mesmo tempo casca e
  rolável, e um viewport interno quebraria o `FormPickerPopoverContent`, que
  conta com os filhos serem itens de flex diretos. Ali a resposta é compor um
  `ScrollFade` dentro, e a página do catálogo demonstra.
- **Três invariantes que a primitiva carrega, e as três vieram de bug medido.**
  `data-scroll-fade` só alimenta o que **não** é layout (alimentar `pb` foi a
  histerese da rodada anterior); **o elemento mascarado não desenha nada**, e é
  por isso que menu e popover precisam de nó interno — a máscara recorta fundo,
  anel e sombra junto, e os `rounded-lg` de 8px caem inteiros na zona, saindo
  com os quatro cantos apagados e os lados opacos; e **todo `-` binário dentro
  de um `calc()` arbitrário se escreve `_-_`** — o Tailwind normaliza espaço em
  torno de `+`, `*` e `/`, mas não pode com `-`, que seria indistinguível de
  `--var`.
- **Nenhuma das três faixas pinta, e quem marca o limite é o conteúdo sumindo.**
  O `CommandFooter` **não pinta fade nenhum** — ele é transparente e só reserva
  altura para a legenda; quem dissolve é uma `mask-image` na própria
  `CommandList`, um gradiente em preto puro usado como estêncil de alfa. A faixa
  de busca passou a ser igual. **Tirar dela só o `border-b` não bastou, e o
  motivo é aritmético**: ela repintava `bg-popover/85` sobre um casco que já é
  `bg-popover/85`, e dois 85% empilhados dão **97,75%**. No escuro `--popover` é
  mais claro que a página, então a faixa era um retângulo *mais claro* com uma
  aresta na base — o mesmo bloco aceso que o rodapé já registrava ao tentar
  pintar um gradiente. O `backdrop-blur` saiu junto: a borda do borrão desenha a
  linha sozinha. **Quem esconde o conteúdo sob o campo é a rampa, não uma
  tinta** — por isso o topo da máscara não pode voltar a ser opaco até a borda
  da faixa, que foi a primeira tentativa e o que produziu o divisor.
- **Cada ponta dá 44px ao conteúdo, com a mesma curva espelhada e o mesmo piso
  (0,06).** Os 44 têm um nome só, `--command-fade-h`, lido pelos dois lados. A
  curva é **sigmoide** de propósito: uma ease-out sai do chapado com inclinação
  máxima, e descontinuidade de derivada contra superfície lisa é o que o olho
  mais detecta — banda de Mach, numa linha que atravessa a paleta inteira. E o
  piso não desce mais: 0,06 foi escolhido contra o caso mais difícil que existe
  ali (texto do mesmo corpo e peso das linhas, atrás do placeholder), e 0,03 é
  perceptualmente zero, que é o `transparent` já registrado como rejeitado.
- **A zona cresce no passo em que a ponta consome o conteúdo** — em cima com o
  `scrollTop`, embaixo com o que falta rolar —, e nunca liga de uma vez. O item
  da ponta nasce a 4px da faixa e mede 28px, então ele cabe inteiro dentro dela:
  um interruptor o levaria de chapado a um degradê de 15%→80% em 1px de rolagem.
  Nos dois extremos não há zona, e o item da ponta fica nítido.
- **`--command-footer-h` mede só a legenda, e depende da presença do rodapé —
  nunca da rolagem.** Ela já embutiu a pista de dissolução (72 = 28 + 44), e era
  isso que deixava **~44px de branco** entre o último item e a legenda sempre
  que se rolava até o fim: ali não há conteúdo para dissolver. A pista virou
  `--command-foot-fade`, que é máscara e não ocupa espaço.
  **A versão condicionada a `data-scrollable` era um laço**, e um dos sorrateiros:
  `pb` é `footer-h + 4`, então declarar "esta lista rola" *acrescentava 36px ao
  próprio conteúdo* e realimentava a condição que produziu a decisão. Uma lista
  que transbordava 20px virava rolável, ganhava `pb` 76, passava a transbordar
  56, e nunca mais era reavaliada — **histerese**, não divergência, e por isso
  ninguém viu. Medido: uma demo do catálogo com 288 de altura e 297 de conteúdo
  estava marcada como rolável quando, com `pb` de 40, ela não rolaria. **O
  `Combobox` pagava o mesmo sem nunca ter rodapé**: 76px de calha vazia no fim de
  cada popover, e uma lista que só rolava por causa do próprio recuo.
- **`scroll-pb` conta a zona inteira (`footer-h + fade-h + 4` = 84), e isso é
  carga estrutural.** Sem ele o `scrollIntoView` do cmdk deposita o item
  selecionado a 40px do fundo enquanto a zona de baixo chega a 80 — item ativo a
  0,05 de alfa na navegação por seta. A margem já existia antes (76 contra 72),
  mas por acidente.
- **`--command-bottom-y` é a guarda de cruzamento.** As duas zonas somam 172, e
  numa lista mais curta que isso elas se cruzam: o *color-stop fixup* arrasta as
  paradas de baixo para junto das de cima e sobra um degrau em poucos pixels,
  sobre conteúdo real. É alcançável — dentro do `CommandDialog` a lista é
  `flex-1` sob `min(60dvh, 24rem)`, e num telefone deitado ela mede ~144px.
  `max(top-h, calc(100% - bottom-h))` faz a rampa de baixo ceder em vez de
  inverter. **E os `_` da classe arbitrária não são cosméticos**: escrita com
  espaços literais, `calc(100% - …)` encerra o token do Tailwind no meio, a
  variável não é declarada, a rampa vira inválida em cascata e `mask-image` cai
  para `none`. Medido, nesta mesma rodada.
- **A rampa é um gradiente só, com os dois lados dentro dele — nunca duas
  máscaras compostas.** `mask-image: none` é definido como *camada preta
  transparente*, então `none` num `mask-composite: intersect` dá alfa zero e
  **apaga a lista**; e `mask-composite` e `-webkit-mask-composite` são
  propriedades distintas, com valores distintos, cuja ordem de emissão o
  Tailwind não deixa o autor controlar. Com um gradiente só, uma variável
  indefinida derruba a propriedade para `none` — **desliga o fade em vez de
  apagar o componente**. E **a ordem das paradas do topo é o mecanismo**: elas
  são ancoradas por deslocamento *negativo a partir do fim da zona*, com um
  `#000` de bookend antes, e é isso que faz o *color-stop fixup* do CSS
  colapsá-las em opaco quando a zona tem largura zero. Ancoradas ao contrário, o
  mesmo fixup deixaria o fade **ligado e gigante**.
- **O grupo da paleta se separa por respiro e por rótulo, nunca por fio.** Duas
  coisas faziam os grupos lerem como uma fileira só: o cabeçalho era `text-xs
  font-medium`, **o mesmo peso das linhas** e só um degrau menor e mais claro —
  a receita de "linha desabilitada", não de rótulo —, e o `py-1` simétrico o
  deixava equidistante dos dois grupos, pertencendo a nenhum. Agora ele é caixa
  alta com `tracking-wider`, a mesma régua do cabeçalho da `Table`, e o respiro
  é assimétrico: 10px de margem acima do grupo contra 2px abaixo do rótulo.
  **A folga é margem no grupo, não recuo no cabeçalho** — duas propriedades
  diferentes não disputam, enquanto um `pt` base mais um `pt` sob variante
  seriam a mesma propriedade duas vezes, decidida por ordem de emissão do
  Tailwind e não pelo que se escreveu. E o primeiro grupo **visível** não
  recebe a folga por `[cmdk-group]:not([hidden])~&`: o cmdk esconde os grupos
  sem resultado com o atributo `hidden` **sem os tirar do DOM**, então eles
  ficam no meio da fileira — medido buscando "card", `Átomos` sai escondido
  entre `Fundações` e `Moléculas`, e um seletor de adjacência (`+`) perderia o
  segundo grupo visível.
- **A paleta tem três faixas, e a casca não tem recuo.** O campo era um
  `InputGroup` flutuando dentro do `p-1` da casca — uma caixa dentro de outra,
  a 8px de distância, com dois raios concêntricos. Numa paleta o campo **é** o
  cabeçalho: largura toda, rente às bordas, como `DialogHeader` e `CardToolbar`
  — mas sem o fio deles, porque aqui quem marca o limite é a dissolução. O
  recuo saiu da casca e foi para o `CommandList`, que é onde há linhas — e com
  isso o `-mx-1` do separador volta a sangrar exatamente ele.
  `CommandFooter` é a terceira faixa, e ela é **legenda de teclado**: uma
  paleta é interface de teclado, e sem a legenda a pessoa descobre `↑↓` e `↵`
  por tentativa. `CommandHint` não embute o `Kbd` de propósito — quem chama
  escolhe entre desenhar a tecla e escrever o nome dela.
- **`CommandDialog` monta o `Command` raiz, e não montava.** Ele entregava
  `children` direto ao `DialogContent`, então quem chamava tinha de lembrar de
  embrulhar tudo — e das duas chamadas do projeto, **uma esquecia**. O diálogo
  abria e estourava com `Cannot read properties of undefined (reading
  'subscribe')`, o store do cmdk sem raiz; o limite de erro engolia e o botão
  parecia inerte. `commandProps` é a saída para o que a raiz precisa receber.
- **O tique do `CommandItem` nunca acendeu.** Ele era revelado por
  `group-data-[checked=true]`, e **o cmdk não emite `data-checked`** — medido
  no DOM: os atributos de um item são `data-slot`, `data-disabled`,
  `data-selected` e `data-value`. No `Combobox`, que desenha o próprio check,
  cada linha saía com **dois ícones**, um permanentemente invisível. Quem marca
  seleção é quem sabe o que está selecionado, e isso não é a paleta.
- **`Accordion` e `Collapsible` são a mesma interação, e agora dividem uma
  régua.** Ela mora em [`lib/disclosure-classes`](src/lib/disclosure-classes.ts)
  — geometria da linha, marcador, realce, alvo de toque e foco —, pelo mesmo
  precedente de `menu-classes` e `field-classes`. Antes eles divergiam em tudo,
  porque **um desenhava a linha e o outro não desenhava nada**: altura `py-2.5`
  sem nome contra o que o consumidor pusesse, dois ícones se revezando contra
  `rotate-180` e `rotate-90` escritos à mão, `hover:underline` contra nada, alvo
  de toque em nenhum dos dois.
- **A linha de divulgação entrou na escada, e o piso dela é 32.** `md` 32, `lg`
  36, `xl` 40 — os mesmos números que esses nomes têm em `Button`, `Input` e
  `Tabs`. Ela não desce a 28 porque carrega **frase** e não rótulo de botão, e a
  medida é **`min-h`** e nunca `h`: um rótulo que quebra em duas linhas tem que
  fazer a linha crescer, não ser recortado.
  [`disclosure-ladder.test.ts`](src/components/ui/disclosure-ladder.test.ts)
  tranca isso. Era a terceira porta do mesmo defeito — `Menubar` entregou 24px e
  `Tabs` entregou 27, os dois por ancorar a escada no contêiner; aqui a altura
  era um resto de tipografia, que é pior, porque muda sozinha quando o corpo do
  texto muda.
- **Um marcador que gira, e não dois que se revezam.** O `Accordion` trazia um
  `ChevronDown` e um `ChevronUp` alternando por `hidden`/`inline`. É a decisão
  que a rodada do `Tabs` já julgou, e aqui o conserto era de graça: a seta para
  baixo girada em 180° **é** a seta para cima. Atenção ao medir: **o Tailwind v4
  usa a propriedade independente `rotate`**, então `getComputedStyle(x).transform`
  responde `none` mesmo com a rotação ativa — quem responde é `.rotate`. E
  `transition-transform` na v4 já cobre `transform, translate, scale, rotate`.
- **O realce da linha de divulgação não troca a cor de fundo.** Ele chegou a ser
  `hover:bg-accent/60`, a língua do menu e da lateral — e é errado aqui pela
  razão que separa os dois casos: **aqueles sabem sobre o que estão pousados, e
  um acordeão não.** Ele mora dentro de `Card`, de `muted`, de diálogo e direto
  na página; sobre `bg-muted` o `accent` quase some, e sobre `bg-card` num dos
  temas ele é quase o próprio cartão. Realce não pode depender de uma informação
  que o componente não tem. São dois sinais, e nenhum pinta fundo: o **rótulo**
  sublinha e o **marcador** tinge e se desloca.
- **O sublinhado é do rótulo, e nunca da linha.** O `hover:underline` original
  ficava no botão, e `text-decoration` desce para todo descendente em linha — o
  total em dinheiro do slot `trailing` vinha sublinhado junto, e traço sob número
  lê como rasura. Medido depois do conserto: com o cursor na linha, "Mercado" sai
  `underline` e "−R$ 612,40" sai `none`.
- **A seta se desloca no sentido em que o clique vai levar** — 2px para baixo
  quando o bloco vai abrir, 2px para cima quando vai fechar. A direção depende de
  **dois** estados (cursor e aberto), e variante empilhada apontando para o mesmo
  elemento compila uma cadeia de descendente que não casa com nada: é a medição
  do `AppThemeToggle`, e a saída é a mesma — `--disclosure-nudge` na linha,
  `data-[state=open]:` invertendo, e o filho lendo a variável sob um variante só.
  No Tailwind v4 `translate` e `rotate` são propriedades independentes e o
  `translate` resolve **antes** do `rotate`, então os 2px descem na tela mesmo com
  a seta de cabeça para baixo. Por isso a transição nomeia
  `[rotate,translate,color]`: o que se move não é `transform`, e
  `transition-transform` deixaria a tinta trocando de estalo.
- **O anel de foco da linha é interno, e é a única divergência consciente do
  `ring-3` do sistema.** A linha sangra até a borda do bloco: um anel externo ou
  é recortado pelo `overflow-hidden` do `variant="contained"` (nos quatro lados
  da primeira e da última linha), ou cavalga o fio da linha vizinha em `plain` e
  vira um traço duplo de 4px. `focus-visible:inset-ring-3` resolve os dois sem
  exceção por variante — e ele **compila** nesta versão do Tailwind (4.2.2),
  verificado, porque `inset-ring-<número>` não é óbvio que exista.
- **`Accordion` tem três eixos.** `variant` é a moldura (`plain` fio entre itens
  — o padrão —, `contained` uma caixa só com os fios por dentro, `separated` cada
  item solto); `size` é o degrau da linha; `markerSide` põe o marcador antes do
  rótulo, para o acordeão de **estrutura**, onde as setas na mesma coluna deixam
  a hierarquia legível numa varredura vertical. **`separated` não entra num
  `Card`** — cartão dentro de cartão é sempre errado, e aqui tem consequência
  prática: a segunda moldura não desenha fronteira nenhuma que a primeira já não
  tenha. O recuo horizontal é variável (`--accordion-px`, 0 em `plain`, 16 nas
  molduradas), como o `--dialog-px` — e não um número repetido em duas peças.
- **`AccordionTrigger` tem `trailing`, e ele é prop porque a alternativa não
  funciona.** A versão componível exigiria duas margens automáticas na mesma
  linha de flex, e **duas `ml-auto` dividem a sobra em partes iguais** em vez de
  empurrar a segunda para a borda: o valor terminaria flutuando no meio da linha.
- **Nenhum envelope declara como altura a medida que ele próprio produz.** O
  `AccordionContent` trazia `h-(--radix-accordion-content-height)` no nó interno
  — a variável que o Radix escreve a partir do `offsetHeight` **desse mesmo nó**.
  Ela congela na primeira medição, e um parágrafo que reflui (janela estreita,
  tradução longa) passa a ser recortado.
- **`peek` é o "mostrar mais" do `Collapsible`, e o fechado deixa de ser altura
  zero.** Três degraus de leitura (`sm` ~3 linhas, `md` ~5, `lg` ~7), com a base
  **dissolvendo** — a primitiva do sistema, e não um véu pintado. A rampa é
  `min(2.5rem, 40%)`: fixa em 40px ela comia dois terços do degrau curto.
  Ele custa três armadilhas, e as três foram medidas:
  **(a)** `forceMount` é consequência de `peek` e não uma segunda decisão, e o
  `hidden` que o Radix escreve é vencido por `data-closed:block` — o texto
  continua na árvore de acessibilidade, verificado;
  **(b)** os keyframes `collapsible-down/up` saem de cena, senão disputam a
  altura com a transição;
  **(c)** **quem mede não pode ser quem é medido.** O Radix calcula
  `--radix-collapsible-content-height` lendo a caixa da própria `Content`, que em
  `peek` é o nó preso à espiada — ele publicava **100px** como "altura do
  conteúdo" contra um `scrollHeight` de 206, e abrir levava de 100 a 100 com o
  texto recortado. A saída é a da casa: um `ResizeObserver` num envelope interno
  livre escreve `--collapsible-full`, como `useScrollFade` e o marcador do `Tabs`
  já fazem.
- **A espiada abre de uma vez, e é limite medido, não esquecimento.** O mesmo
  recálculo síncrono que o Radix força ao trocar de estado acontece **na mesma
  passagem** em que o `data-state` vira `open`: as duas alturas nunca aparecem em
  recálculos diferentes, então não há transição para começar (medido a 16, 40,
  80, 140 e 260ms — 100px e depois 206px, sem nada no meio). Quatro consertos
  falharam, e estão no cabeçalho de `collapsible.tsx` para ninguém repetir:
  `!important` na duração (vence o inline, e o salto continua), envelope externo
  com `has-data-[state=open]` (o recálculo é do documento inteiro), o
  `data-medido` do `Command` (resolve a primeira pintura, não a disputa), e Web
  Animations API a partir de um `MutationObserver` (funciona ao abrir, não ao
  fechar — e trajeto num sentido só é pior que nenhum). **Não há classe de
  transição no componente**, para o código não prometer o que não faz. Quem for
  fechar isso provavelmente precisa não usar a `Collapsible.Content` do Radix em
  `peek` — sob `forceMount` ela só contribui com o `id` que o `aria-controls` do
  gatilho aponta.
- **`HoverCard` é um popover que abre com o cursor**, e a superfície dele era uma
  cópia **incompleta** da do `PopoverContent`: faltavam o teto
  (`max-h-(--radix-hover-card-content-available-height)`), a rolagem que o teto
  exige, e o `collisionPadding`. Uma prévia alta perto da borda de baixo saía da
  tela, com o Radix já publicando a variável que ninguém lia. Copiar a casca não
  é o defeito — as classes que carregam o nome da primitiva **têm** que ser
  literais em cada arquivo. Ele ganhou `size` (`sm` 224 | **`md` 256** | `lg`
  320, e o teto é de propósito: acima disso a prévia vira a página que ela
  deveria adiar), `padding` (`default` | `none`, o mesmo eixo do `Popover`), as
  tiras `HoverCardHeader` / `Title` / `Description` / `Footer`, e `HoverCardArrow`
  — o único lugar do sistema onde a seta se paga, porque uma prévia dispara sobre
  **uma palavra dentro de um parágrafo**.
- **`HoverCardBody` fecha o vocabulário de faixas, e ele traz o próprio `py`.**
  Com `padding="none"` o casco cede o respiro e **cada faixa passa a ser dona do
  seu** — o meio não era, então a demonstração do catálogo adivinhava
  `<div className="px-3 pb-1">`, dois números soltos onde existe
  `--hover-card-strip-px`. O `py` não é cosmético: sem ele *tudo* fica a 8px e
  identidade, rótulo, número, datas e rodapé leem como cinco linhas soltas.
  Com ele a distância **entre** regiões é 16 e **dentro** do corpo é 8 — a razão
  de 2 para 1 que separa "outro assunto" de "mesmo assunto". **Ele não rola**,
  pela mesma razão que não existe `Close`: uma prévia que precisa rolar ou se
  reter não é prévia, é `Popover`.
- **Um número sem rótulo é ambíguo, e num app de finanças isso custa caro.**
  A prévia de fatura mostrava `−R$ 1.284,60` sozinho no meio do cartão — pode ser
  o total, o mínimo ou o que falta pagar. O par termo/valor do
  `DescriptionList` é o conserto, e ele existe para isto: a documentação dele
  nomeia "a fatura" como caso de uso.
- **Vocabulário e semântica de estado saem do produto, não da demonstração.** A
  página do `HoverCard` escrevia `Em aberto` num `Badge variant="warning"`.
  O app não fala assim: em `credit-card-display.ts` o ciclo aberto se chama
  **`Aberta`** e é **verde** (`tagChipSuccess`), com o âmbar reservado para
  `Fechada` e o vermelho para `Anterior`. Catálogo que inventa palavra e cor
  próprias ensina a divergir do produto.
- **`HoverCardHeader` tem `endAdornment`, com o nome e a forma do
  `DialogHeaderRow`** — grade de duas colunas, `items-start`, para o `Badge` de
  estado no canto superior direito. O `items-start` é o que prende o adorno ao
  **topo** em vez de centralizá-lo quando a descrição quebra em duas linhas, e
  uma prévia de fatura sempre tem duas. A alternativa (um `absolute` no canto,
  escrito pela tela) é pior de dois jeitos: passaria por cima de um título longo,
  e o recuo do canto viraria um número na tela em vez de
  `--hover-card-strip-px`. **Ele diverge do `DialogHeaderRow` num ponto**: não há
  `space-y-1` no par título+descrição, porque ali é o mesmo dado em duas linhas e
  quem separa é a entrelinha — o `space-y-1` de lá continua no backlog.
- **As tiras do `HoverCard` não levam `shrink-0`, e a do `Popover` leva.** Lá a
  faixa é irmã de um `PopoverBody` com `flex-1`, que a espremeria na vertical.
  Aqui não há corpo com `flex-1`, e a faixa é usada **dentro de uma linha**, ao
  lado de um avatar — nesse contexto `shrink-0` impede o encolhimento
  **horizontal**, a descrição para de quebrar, e como `overflow-y: auto` promove
  o eixo X a `auto` junto (regra da spec: um eixo não-`visible` promove o outro),
  o texto sai **recortado**. Medido: "42 transações" saía "42 transaç".
- **Os atrasos do `HoverCard` são decisão, e o padrão do Radix não serve.**
  `openDelay` 400 e `closeDelay` 200. Setecentos milissegundos numa prévia presa
  a um nome em texto corrido lê como componente quebrado; zero dispara em toda
  passagem de cursor. E **o gatilho precisa ser focável** — o Radix abre no foco
  além do cursor, e em volta de um `<span>` a prévia passa a existir só para quem
  tem mouse.
- **`Progress`**: Radix-based; pass `tone` (`default` | `success` | `warning` | `destructive`) for budget / status bars.
- **`Avatar`**: Radix-based with `size` prop; keep `data-slot` for tests and form deferrals.
- **Overlays**: `Dialog` / `Sheet` / `AlertDialog` use `bg-overlay` (not hardcoded `bg-black/10`).
- **`DialogFooter` empilha ao contrário** (`flex-col-reverse`), para a ação
  principal ficar em cima no telefone. O antigo `SheetFooter` empilhava na
  ordem do DOM — então os 17 rodapés que vieram da folha declaram `flex-col`
  explicitamente, e é de propósito.

### A trilha dobra o miolo, e nunca quebra a linha

O `Breadcrumb` era o shadcn intacto, com `flex-wrap`. **Medido a 375px, com
293px disponíveis: uma trilha de quatro níveis saía com 46px de altura, em duas
linhas**, logo acima do título — e a página do catálogo *documentava* isso em
vez de resolvê-lo.

**A `BreadcrumbList` passou a ser dona dos separadores**, e é isso que torna o
colapso possível: não se dobra um miolo que não se possui. Enquanto o
`<BreadcrumbSeparator />` era escrito à mão n−1 vezes, a lista não sabia quais
filhos eram degraus e quais eram enfeite. Hoje ela recebe só `BreadcrumbItem`,
insere os separadores, e `maxItems` (padrão 4, piso 3) mantém a raiz e os dois
últimos.

São **duas defesas, para casos diferentes**. `maxItems` cobre a trilha
profunda; `truncate` nos ancestrais cobre o rótulo único e longo, que contagem
nenhuma resolve. A página atual é `shrink-0` e só cede depois de todos os
outros: **quem cede é o caminho, e nunca o destino** — medido numa caixa de
240px, o ancestral encolhe de 123 para 52px enquanto "Nubank Ultravioleta"
mantém os 132 dele.

**As reticências não são um beco.** `BreadcrumbMenu` abre um `DropdownMenu` com
os degraus dobrados, e a lista o monta sozinha. O que entra ali é o **link**, e
não o `<li>` que o embrulha na trilha: passar o `BreadcrumbItem` inteiro para o
`DropdownMenuItem asChild` produzia `role="menuitem"` num `<li>` sem `href`,
com a âncora aninhada dentro — medido. Junto vem `BreadcrumbLink
variant="menu"`, que tira do link a apresentação da trilha, porque ali a
geometria é do item de menu.

Três correções que não são de layout:

- **`BreadcrumbPage` deixou de ser um link.** `role="link"` mais
  `aria-disabled="true"` é como o shadcn a entrega: um papel de link num
  elemento que não navega faz o leitor anunciar um link e convidar à ativação.
  `aria-current="page"` num `span` é o que a APG prescreve.
- **O `sr-only` dentro do `aria-hidden` saiu.** `BreadcrumbEllipsis` embrulhava
  um `<span class="sr-only">Mais</span>` num elemento `aria-hidden="true"` —
  texto morto, que nunca chegou à árvore de acessibilidade. Um marcador visual
  não precisa de nome; precisa é de não mentir. `PaginationEllipsis` tinha o
  mesmo, e saiu junto.
- **A caixa das reticências era `size-8`.** Numa linha de texto de 20px isso
  fazia a trilha inteira medir 32 — 60% mais alta por causa do marcador.

E o alvo de dedo cresce por **pseudo-elemento**, não por altura: 12px na
vertical (20 + 24 = 44, medido), onde não há nada, e 4px na horizontal, que é
metade do `gap` — dois ancestrais vizinhos encostam sem se sobrepor.

### Paginação é uma posição e dois movimentos

Não é uma fileira de números. Numa lista de transações, "1–20 de 342" responde
a pergunta que a pessoa tem; um link para a página 7 quase nunca. Por isso
**`PaginationStatus` existe como peça** — a documentação antiga já citava esse
texto sem entregá-lo, e toda tela o escreveria à mão. E por isso `align`
(`center` | `between` | `end`) substituiu o `mx-auto … justify-center` cravado,
que impedia a forma mais comum: contagem à esquerda, controles à direita.

**A página atual preenche.** Ela era `variant="outline"`: medido no tema claro,
`oklch(0.985)` de preenchimento contra uma página de `oklch(1)` — 1,03:1, um
contorno de 1px numa fileira de links transparentes. Hoje é `secondary`, que é
a língua de "selecionado" que `Button`, `Toggle` e a bandeja do `Tabs` já
falam.

**`disabled` precisa ser prop porque um `<a>` não desabilita**, e nas duas
pontas da lista os dois extremos precisam disso. Com ele sai um `<span>` sem
`href`, com `aria-disabled` e a opacidade do `Button`.

**Os extremos ficam quadrados no telefone.** Medido antes: com o rótulo
escondido abaixo de `sm`, `PaginationPrevious` saía **40×32**, com 10px de
recuo à esquerda e 12 à direita, ao lado de números de 32×32 — um retângulo
torto numa fileira de quadrados. Depois, a 375px, todos os controles medem
44×44.

E `.nums` em todo link e no status: sem figuras tabulares, 1, 10 e 100 têm
larguras diferentes, e a fileira inteira se reacomoda ao virar a página.

### A escada do `Item`, e o `gap` que a documentação já negava

`size` tinha `default` e `sm` com **a mesma string** (`gap-2.5 px-3 py-2.5`) —
dois nomes, uma medida. É o terceiro parente do mesmo defeito: `Menubar`
entregou 24px e `Tabs` entregou 27, os dois por ancorar a escada no contêiner;
aqui a âncora estava certa e o degrau é que não existia.
[`item-size-ladder.test.ts`](src/components/ui/item-size-ladder.test.ts) tranca
isso, e a asserção que vale é a de que **nenhum par de degraus produz a mesma
string**. `default` e `xs` saíram do tipo; `xs` porque a única coisa que o
distinguia era `in-data-[slot=dropdown-menu-content]:p-0`, um componente
conhecendo o contêiner de outro.

**A escada mede recuo, `gap` e a mídia — nunca altura.** `Button` e `Input`
medem altura porque são controles: a caixa é conhecida antes do conteúdo. Uma
linha de lista cresce com o que carrega.

**`ItemContent` declarava `gap-1`, e a página do catálogo já dizia o
contrário** — "`ItemContent` já entrega a entrelinha". Medidos 4px entre o
título e a descrição, que é exatamente o que o par de identidade proíbe. A
documentação estava certa; o código é que discordava.

**`interactive` substituiu o `[a]:hover:bg-muted` implícito.** Aquilo só valia
quando o próprio `Item` fosse um `<a>`, e não tinha par `active:` — o realce
compila dentro de `@media (hover: hover)`, verificado no CSS emitido, então no
telefone não existia em caso nenhum. Agora é explícito, como o `interactive` do
`Card`, com o par de toque, o anel de foco e `pointer-coarse:min-h-11`.

**`ItemGroup variant="divided"` não usa `divide-y`, e a razão foi medida.**
`divide-*` compila com `:where(& > :not(:last-child))`, que não soma
especificidade, enquanto o `Item` traz `border-transparent` **no próprio
elemento** — a primeira versão saía com os fios transparentes, a lista dividida
sem nenhuma divisão, calada. O seletor
`[&>[data-slot=item]:not(:last-child)]:border-b-border` tem classe + atributo +
pseudo-classe e ganha. **No `DescriptionList` o mesmo `divided` usa `divide-y` e
funciona**, porque lá o item não declara borda nenhuma para disputar: é o par
que mostra que a armadilha não é da utility, e sim da colisão.

**E em `divided` o raio sai.** O fio é a borda de baixo do próprio `Item`, que
traz `rounded-lg` — uma borda de baixo num elemento arredondado curva nas duas
pontas (10px neste tema, medidos), e o traço saía arqueado no meio da lista. A
causa não é o fio: é que **uma linha de lista dividida não é um cartão**, e
cartão é a única coisa que tem canto. `TableRow` desenha `border-b` e o arquivo
inteiro não tem um `rounded`; `AccordionItem` desenha `not-last:border-b` e o
raio mora no contêiner. Em `spaced` o raio fica, porque ali a linha **é** um
cartão. O segundo ganho não é o traço: com `interactive`, o realce de uma linha
dividida vira faixa de largura inteira em vez de pílula flutuando na lista. E o
raio das pontas continua sendo de quem contém — cravar `first:rounded-t-lg`
copiaria para dentro do componente um número do contêiner, que é o defeito que
a variante `bare` do `Command` enterrou.

**Ordem importa no arquivo:** `npm run ds:catalog` lê o **primeiro** `variants:`
de cada fonte. Com `itemGroupVariants` declarado antes, o catálogo reportava
`spaced | divided` como se fossem os eixos do `Item`. `itemVariants` vai no
topo.

### O layout do `DescriptionList` se declara uma vez

Ele precisava ser passado **duas** vezes — na lista e em cada item —, e a
página do catálogo documentava isso como se fosse regra. Não era:
`<DescriptionList layout="inline">` sozinho não fazia nada, calado. Hoje o item
lê o do pai por `in-data-[layout=…]`, e o prop local vira o que devia ser: uma
sobrescrita para a linha que foge do padrão.

**A armadilha que isso custa está escrita no arquivo.** `in-*` compila com
`:where()` e não soma especificidade — funciona aqui porque a base do item é
`min-w-0` e mais nada. Quem acrescentar uma base que colida (um `flex-col`
fixo, um `text-*`) reabre o problema, que é exatamente o que aconteceu com o
`divide-y` do `ItemGroup` nesta mesma rodada.

Três eixos novos, e cada um saiu de um caso do produto: **`layout="grid"`**
(duas colunas a partir de `sm`, para o detalhe de cartão com seis campos, que
empilhado é uma coluna alta com a metade direita vazia); **`divided`** (o fio
entre pares, que é o desenho de extrato e de fatura); e **`DescriptionDetails
size="lg"`** para a linha do total. O eixo do peso mora no `<dd>` e não no
item porque **só o valor pesa — o rótulo do total continua quieto** —, e
porque prop no próprio elemento escapa da armadilha de especificidade acima.

E **`.nums` sai de fábrica** em todo `DescriptionDetails`: dígito em lista de
detalhe é sempre dado, e a própria página do catálogo escrevia
`className="nums"` à mão em três linhas seguidas.

### O campo de data era o quarto gatilho fora da régua

O backlog da rodada do `Tabs` dizia "três gatilhos de campo em duas aparências…
vale reabrir a decisão agora que os outros dois convergiram". **A conta era
quatro.** `Select` e `Combobox` vestiam `field-classes`; `DatePicker` e
`FormPickerPopoverTrigger` continuavam sendo `Button variant="outline"`.

Medido no tema claro, lado a lado com o `Input`: o gatilho do `DatePicker` saía
**32px contra 36**, com preenchimento `oklch(0.985)` **opaco** contra
`oklab(0.9 0 0 / 0.3)` translúcido. Um campo de data ao lado de um campo de
texto era mais baixo e de outra superfície — e a nota do
`FormPickerPopoverTrigger` afirmava que ele "parece um campo e não um botão",
o que só era verdade sob `dark:`, onde `outline` recebe `dark:border-input
dark:bg-input-fill/30`.

Os dois convergiram. Depois: **36px, `oklch(0.9)`, `oklab(0.9 0 0 / 0.3)`** —
idênticos ao `Input`, medidos. O `DatePicker` passa a `lg` (a altura do campo);
o `FormPickerPopover` mantém `xl` (40), porque a conversão ali é de superfície e
não de medida.

**A escada de altura entrou em `field-classes`**, como
`fieldTriggerSizeClassName`. O arquivo argumentava — com razão na época — que
ela não podia entrar porque os três consumidores a aplicavam por três mecânicas
diferentes. O que mudou foi a contagem: com os dois gatilhos novos resolvendo
por `data-size` como o `ComboboxTrigger`, são três escrevendo a mesma linha.
`Input` e `SelectTrigger` seguem de fora, e o argumento original continua valendo
para eles.

Sair do `Button` também tira os dois da garantia de maiúscula inicial do CTA, e
isso é correto: `Selecione a data` é placeholder de campo, não rótulo de ação.

### Três defeitos do `DatePicker` que não se viam

- **O foco ficava no `<body>` ao fechar.** Havia um `onCloseAutoFocus` prevenido
  — exatamente o bug que o `FormPickerPopover` já tinha registrado e consertado.
  A justificativa (o salto de rolagem) vale para **abrir** e não para fechar,
  porque o Radix devolve o foco com `preventScroll`. Medido depois: `Esc` põe o
  foco de volta no gatilho.
- **`modal={false}` cravado.** Sem `modal` no telefone, rolar a grade arrasta a
  folha que contém o formulário. Agora é `modal={isMobile}`, como o
  `FormPickerPopover`.
- **Dois `toLocaleDateString` inline**, a regra **I** do auditor com
  `@/lib/transaction-date` ao lado. O `Calendar` tinha mais dois. Os quatro
  saíram; `formatMonthShortPtBr` entrou no helper para o seletor de mês.

E o ícone media `size-3.5` com um `mr-2` empilhado sobre o `gap-1.5` do próprio
`Button` — 14px de distância e um ícone fora da regra `size-4`. Hoje o `gap` do
campo é o único que decide.

**`mode` é união discriminada**, como o `multiple` do `Combobox`: `<DatePicker
mode={x}>` com uma variável não estreita, e o estreitamento tem de ser por
literal em **cada** ponto de uso — um `const isRange = props.mode === "range"`
não faz nada pelo tipo. O intervalo não é luxo:
`transactions-date-range-form.tsx` monta um período com dois `DatePicker`
independentes, que não sabem um do outro.

**O seletor de ano precisou de limite.** Ligar `captionLayout="dropdown"` sem
`startMonth`/`endMonth` faz o `react-day-picker` oferecer **±100 anos** —
medido: 101 opções começando em 1926. O padrão passou a ser cinco anos para cada
lado, que cobre lançamento retroativo e conta agendada.

### A célula do `Calendar` entra na escada, e o `p-0` é o que a faz valer

O botão de dia declarava `size="icon-lg"` — 36 pela escada — e **media 28**,
porque o `className` do próprio componente o sobrescrevia com `size-auto w-full
min-w-(--cell-size)`. É a terceira porta do mesmo defeito: `Menubar` entregou 24,
`Tabs` entregou 27.

Trocar por `md` só mudaria a mentira de 36 para 32, então o botão deixou de
carimbar `data-size` — **um atributo que não corresponde à caixa é pior que
atributo nenhum**. Quem nomeia a medida é o `size` do `Calendar` (`sm` 28, `md`
32, `lg` 36), e ele é **piso**: a grade é elástica, e em ponteiro grosso a célula
sobe para 44 em qualquer degrau.

**E o `p-0` no dia é carga estrutural, não cosmética.** A raiz é `w-fit`, então a
largura da grade sai do `max-content` das células. Enquanto o botão trouxesse o
`px-3` do degrau `md` do `Button`, era esse recuo que dimensionava a coluna:
medido, **39px em todos os três degraus**, com o `min-w-(--cell-size)` nunca
chegando a valer e o `size` sem efeito nenhum. Foi um defeito **introduzido**
nesta rodada ao remover o `size="icon-lg"`, e só apareceu porque a inspeção mediu
os três degraus em vez de um. Com o recuo em zero: 28 / 32 / 36, medidos.

**A ponte do intervalo passou a derivar da célula.** Era `after:w-4` — 16px fixos
contra uma célula que vai a 44 no toque. Hoje é `calc(var(--cell-size)/2)`:
medido, 16px a 32 e **22px a 44**. E a declaração dupla de `rounded-*` em
`range-start` / `range-end` saiu — a mesma propriedade duas vezes na mesma
string, decidida por ordem de emissão.

### O seletor de mês do calendário é o do sistema, e os rótulos falam português

O `react-day-picker` desenha o salto de mês com um `<select>` **nativo** em
`absolute inset-0 opacity-0` por cima de um rótulo falso — é como o shadcn
entrega. Funciona, e o painel que abre é o do sistema operacional: fonte,
medida, cantos e realce fora do tema, sem tema escuro, e sem nenhuma das
decisões que este projeto tomou sobre superfície de comando. O componente
`Dropdown` passou a ser o `Select` do design system.

**A ponte precisa ficar escrita.** O `onChange` do `react-day-picker` é um
`ChangeEventHandler<HTMLSelectElement>`, e o handler interno lê **só
`e.target.value`** (`DayPicker.js`: `Number(e.target.value)`). O Radix entrega
`onValueChange(valor: string)`, então o adaptador é um objeto com a única
propriedade que o outro lado consulta, com um `as` sobre um evento incompleto —
incompletude **medida**, não esquecida. Verificado ponta a ponta: escolher "dez"
levou a grade de `2026-03-01` para `2026-11-29`.

Com o nativo fora, `dropdown` deixou de receber classe, e `caption_label` perdeu
o ramo que desenhava o rótulo falso.

**Mas o `relative` do `dropdown_root` não era resto, e tirá-lo custou um bug.**
A `nav` do `react-day-picker` é `absolute inset-x-0 w-full` com um botão em cada
ponta — ela cobre **também o meio do cabeçalho**, que é onde vivem os seletores.
Enquanto o `dropdown_root` era posicionado, ele pintava por cima; estático, caiu
para trás da faixa e os seletores pararam de responder ao clique. Medido com
`elementFromPoint` no centro do gatilho: quem respondia era o `<nav>`.

O conserto é de raiz — a faixa recebe `pointer-events-none` e os dois botões
`pointer-events-auto`, porque um contêiner de largura total que só tem conteúdo
nas pontas não deve capturar o vão entre elas — e o `relative z-10` volta ao
`dropdown_root` com o motivo certo escrito.

**E a lição de método é maior que o conserto.** O bug atravessou uma inspeção
inteira porque a verificação usava `dispatchEvent` direto no elemento, e **evento
sintético pula o hit-testing**: o painel abria no teste e não abria para uma
pessoa. Quem foi medir foi o usuário. Empilhamento e área de clique só se
verificam com `elementFromPoint` ou com clique de verdade — nunca com
`dispatchEvent`.

**E o gatilho é compacto de propósito.** A fileira vive num `month_caption` que
já reserva `--cell-size` de cada lado para as setas, e como a raiz é `w-fit`, um
`SelectTrigger` com recuo padrão faria **a grade inteira crescer para caber a
legenda** — o calendário passaria a ser dimensionado pelo cabeçalho. Medido
depois: as três larguras seguem 214 / 242 / 270.

**Os rótulos de acessibilidade estavam todos em inglês.** O `locale` do
`date-fns` traduz **nomes** — meses, dias da semana — e nada mais; as frases
conectivas são strings cravadas no pacote: `"Go to the Previous Month"`,
`"Choose the Month"`, `"Choose the Year"`, e o `"Today, … , selected"` que o
leitor de tela anuncia em **cada uma das 42 células**. A grade parecia traduzida
e a camada de acessibilidade nunca esteve. `ROTULOS_PT_BR` conserta isso pela
mesma razão que o `locale` tem padrão neste arquivo: um idioma que só vale
quando alguém lembra de passar não é o idioma do app. Verificado na árvore de
acessibilidade: `"1 de março de 2026"`, `"Ir para o mês anterior"`.

### O `StatCard` compõe, e o par de identidade voltou a ser um

A superfície era montada à mão: `rounded-xl border border-border/80 bg-card p-4
shadow-xs ring-1 ring-foreground/5`. Cada pedaço é um eixo que o `Card` já
governa — e o `border-border/80` era um **quarto peso de borda** no app, que é
exatamente o que o `tone` do `Separator` existe para não deixar acontecer. Hoje
ele é um `Card padding="none"`, e o que fica sendo dele é o **tom de dinheiro**,
que é justamente o que o `Card` não tem.

**O rótulo e o valor levavam `gap-2`** — 8px medidos. É o par de identidade que
este arquivo nomeia com estas palavras ("rótulo sobre valor"), e o invariante diz
"nem `gap-1`". Mesmo defeito que o `ItemContent` teve na rodada 08. A base virou
`gap-0`, e **o respiro voltou a existir só entre o par e a variação** — declarado
pelo contêiner (`[&>[data-slot=stat-card-delta]]:mt-2`), não carregado pela
variação. Não é compensar geometria por seletor: é o contêiner dizendo qual dos
filhos abre um bloco novo, como o `ItemGroup variant="divided"` faz.

**`StatCardValue` reimplementava `MoneyDisplay size="2xl"`** e divergia num
ponto: `letter-spacing` **−0,6px contra `normal`**, medidos. A face mono está
certa e é decisão registrada do `MoneyDisplay` para figura-herói; o que não podia
era duas definições da mesma figura diferirem por um `tracking-tight`. Ele saiu,
e o corpo passou a vir de `--stat-card-value`, que o `size` declara.

**`StatCardDelta` chamava o neutro de `neutral` enquanto o `StatCard` chamava de
`default`** — e o comentário no topo do mesmo arquivo dizia que renomear tinha
sido feito justamente porque "trocar de componente exigia reabrir o fonte para
lembrar qual das duas palavras valia". O arquivo contradizia o próprio
comentário. Zero telas usavam o delta, então corrigir custou nada.

**`direction` desenha a seta, e não decide o tom.** Em finanças subir não é boa
notícia por si só: despesa caindo é bom, entrada caindo é ruim. Um componente que
pintasse de verde tudo que sobe mentiria em metade dos cartões deste app.

### O respiro do `EmptyState` é do pai

As quatro peças carregavam `mb-4`, `mb-2` e `mb-6`, e o contêiner ficava em
`gap: normal` — medido. O layout era decidido **de baixo para cima**: tirar a
descrição mudava sozinho o respiro entre o ícone e o título, e a última peça da
pilha deixava 24px de margem contra a borda de baixo do bloco. Agora o `gap` é do
`EmptyState` e nenhum filho declara margem — medido, zero `margin-bottom` nos
quatro.

**O título deixou de ser um `<h2>` cravado.** Ele punha um `h2` na página toda
vez que um bloco vazio aparecia, inclusive dentro de seção que já tinha o seu —
o caso de duas das quatro telas. O padrão é um `<p>`; quem precisa de cabeçalho
usa `asChild` com o nível certo.

**`variant` existe porque duas telas já a escreviam.** `not-found-shell` e
`route-error-fallback` abrem com a **mesma string** — `className="w-full
border-border/80 bg-card/40 py-10"`. Duas cópias idênticas de uma sobrescrita são
uma variante faltando. `plain` fecha o terceiro caso: dentro de um `Card`, que já
tem moldura própria.

E `EmptyStateIcon` ganhou `tone`, que é o `bg-destructive-muted
text-destructive-muted-foreground` que o `route-error-fallback` pintava à mão.

### O toast estava na fonte do sistema operacional

As cores dele vieram para os tokens numa rodada anterior — o bloco por tipo em
`globals.css`, com a nota "as únicas cores do produto que não vinham daqui".
**O trabalho parou nas cores.** Medido no toast renderizado:

| | toast | o resto do app |
| --- | --- | --- |
| tipografia | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto…` | `Inter` |
| corpo | 13px | 12 ou 14 |
| raio | 8px | 10 |
| sombra | `0 4px 12px oklch(0 0 0 / .1)`, sem par no escuro | `--shadow-md`, com valor por tema |
| fechar | 20×20 | 44 em ponteiro grosso |

A primeira linha é a que decide: **o toast era a única superfície do app que
trocava de tipografia com o sistema operacional** — SF Pro no Mac, Segoe no
Windows, Roboto no Android —, e são **222 chamadas**.

**Empatar a especificidade não bastou, e a razão vale para qualquer biblioteca
que injete folha própria.** O sonner declara raio e sombra em
`[data-sonner-toast][data-styled=true]` (0,2,0) e injeta o CSS **em tempo de
execução**, ou seja depois da folha do app: com a mesma especificidade, quem vem
depois ganha. Medido duas vezes — com um atributo só, a fonte entrou e o raio
ficou em 8px; com 0,2,0 dos dois lados, o raio **continuou** em 8px. O seletor
daqui é descendente (0,3,0), o mínimo para vencer sem `!important`. (A
tipografia foi a exceção e por um motivo próprio: o sonner a declara no
**contêiner**, então declará-la no próprio toast já ganha — propriedade posta no
elemento vence a que ele herdaria, qualquer que seja a especificidade.)

**Os ícones não eram Heroicons**, e é o único lugar onde a regra **G** vazava
sem nenhum guarda pegar: o ESLint olha imports, o auditor olha o repositório, e
esses SVGs moram em `node_modules`. Medido no DOM: `viewBox="0 0 20 20"` sem
`data-slot` no ícone de tipo, `0 0 24 24` no ×. Hoje entram pelo prop `icons`.

**E as cores só ficaram certas na rodada seguinte.** O bloco afirmava
"espelhando as variantes do `Alert`" e **não espelhava**: o Alert usa o token
`bg-{tom}-muted`, e ali havia `color-mix(--{tom} 10%, --popover)` — segunda
receita para a mesma superfície. Medido no claro, o mesmo aviso em dois cremes:
`255,243,216` no Alert contra `252,243,230` no toast, distância RGB **14** (os
outros três, entre 6 e 9). Nenhum reprovava em contraste, então nunca foi
acessibilidade: era uma medida escrita à mão ao lado de outra que precisava
concordar com ela. Hoje os dois leem os mesmos tokens — **distância 0** nos
quatro tons, nos dois temas.

Junto vieram três superfícies que nunca tinham saído da paleta da biblioteca:

- **O toast sem tipo, e o `loading` do `toastPromise`, estavam em preto puro.**
  Medido no escuro: fundo `0,0,0` contra os `23,23,23` do `--popover`, borda
  `51,51,51` contra `25,26,26`. **Preto puro é uma cor que este design system
  não usa em superfície nenhuma** — a página é `37,37,37`. No claro passou
  batido porque o branco do sonner e o `--popover` coincidem, e é exatamente
  assim que um defeito de tema escuro sobrevive.
- **A descrição saía em cinza** (`rgb(63,63,63)`) sobre a superfície colorida —
  a decisão que o `Alert` documenta e reverteu. Hoje é `currentColor` a 85%.
- **O × e o botão de ação não vestiam o tom**: borda cinza e tinta quase preta
  sobre um toast verde, e o "Desfazer" como preenchido invertido. Hoje são
  contorno e `currentColor`, como o `AlertActions` — **mas o fundo dos dois é
  diferente**, e tratá-los como a mesma peça custou um bug. O botão de ação vive
  *dentro* do toast, então fantasma é o certo; o × é `position: absolute` e
  **cavalga a borda** (medido: 6px para fora em cima e à esquerda), então
  transparente ele lia como um furo no canto, mostrando a página. Ele leva a
  superfície do próprio toast.

  A quebra veio junto com o conserto: os dois estavam numa regra só com
  `background: transparent`, e o × só começou a vazar quando a especificidade
  subiu para 0,4,0 **para consertar o preenchimento do "Desfazer"**. A medição
  de verificação foi feita antes de a mudança valer no ×, e por isso passou.

  E **a borda do botão de ação só apareceu quando ganhou largura**: havia só
  `border-color`, a cor era aplicada e a borda nunca desenhava, porque o sonner
  deixa `border-style: none`. O "Desfazer" era texto pelado. Com os três, ele
  fica **idêntico ao botão da `AnnouncementBar`** em sete medidas — 24 de
  altura, `0 8px`, raio 10, corpo 12, peso 500, `1px solid`, `currentColor/25` —,
  que é o `Button variant="tertiary" size="xs"` que ela usa. Ali não dá para
  usar o componente (quem renderiza é o sonner), dá para chegar na mesma caixa.

  **E chegar na mesma caixa foi mais do que a borda.** Um diff dos 693
  computados contra o botão da barra acusava **14 diferenças** depois dela, e as
  que importavam eram de estado: **nenhum anel de foco** — medido, `box-shadow:
  none` e `outline: none` num controle alcançável por teclado —, sem o
  `active:translate-y-px` que todo botão do app tem, e o realce em **400ms com a
  curva do navegador** contra os 150ms e a curva do Tailwind. Mais
  `white-space: wrap` com `overflow-wrap: anywhere` herdados do sonner, que
  deixam um rótulo de duas palavras quebrar no meio de uma delas.

  A última a cair foi a **entrelinha**: 18px contra os 16 do `text-xs`, porque
  eu tinha declarado `font-size` sem `line-height` — o mesmo erro da borda sem
  largura, um passo adiante. Num botão de 24px isso desloca o centro óptico do
  rótulo. Hoje o diff dá **zero**.

  A lição de método: **um diff de todos os computados acha o que a conferência
  propriedade a propriedade não acha.** Eu tinha conferido sete medidas à mão e
  declarado paridade; faltavam nove.

  **E o realce dos três se alinhou em `current/10`.** O `AlertActions` sempre
  disse "borda, tinta e realce saem de `currentColor`"; a `AnnouncementBar`
  tinha nascido com `foreground/10` — quase igual no escuro, visivelmente
  diferente no claro —, e o toast herdaria a divergência ao copiar dela.

E a exceção do ícone âmbar **saiu**: ela existia para compensar o mix de 15% que
lavava o amarelo, e com `--warning-muted` de verdade a causa desapareceu.
Medido depois: 7,81 no claro e 10,8 no escuro, bem acima dos 3:1 que um ícone
pede.

**A cascata cobrou de novo, e num lugar diferente.** As regras de tipo precisam
ficar acima da base (senão a base apaga as tonais), e os **controles** precisam
de `[data-styled]` no seletor: o sonner os declara em 0,3,0, e com o empate a
cor e a borda pegavam mas o **preenchimento não** — o "Desfazer" continuava um
bloco invertido, medido. Com `[data-styled]` são 0,4,0.

**E a física continua sendo do sonner, de propósito**: empilhamento, arraste,
`promise`, deduplicação por `id` e a largura de 356px. É o mesmo julgamento da
rodada do `vaul` — pega-se o mecanismo emprestado e veste-se a cromagem própria.

`lib/toast.ts` ganhou `toastInfo` (o tipo já estava estilizado no CSS e não
tinha helper), `toastUndo` e `toastPromise`. **O desfazer é o que permite
excluir sem diálogo**: ele troca um clique de confirmação cobrado de todo mundo
por uma janela de arrependimento que só quem errou usa. Por isso a duração dele
é a mais longa da casa (8s) — quem apagou por engano leva alguns segundos para
perceber, e um desfazer que expira antes disso não existe. Ele **não** substitui
o `AlertDialog` no que não tem volta.

### O `Stepper` sabia menos que a lista que o contém

`StepperItem` recebia `step` e `isLast` como props, com `Omit<…, "children">` —
os dois são exatamente o que o **pai** sabe e o filho não. Quem chamava escrevia
`isLast={i === ETAPAS.length - 1}` toda vez, e errar isso desenhava um conector
para lugar nenhum. É a mesma correção que a `BreadcrumbList` recebeu na rodada
08 ao assumir os separadores: o contêiner deriva do índice, e o item volta a
aceitar `children`.

**A trilha parava a 78% da largura.** Todos os itens eram `flex-1`, inclusive o
último — que não desenha conector. Medido: quatro itens de 218px, com o último
ocupando os mesmos 218 para mostrar um marcador de 24, e **~192px de vão morto**
depois dele. Com `flex-none` no último: 278/278/278/**37**, e 13px até a borda.

**O estado existia só em cor e ícone.** `data-state` não é lido por tecnologia
assistiva e o tique é `aria-hidden`, então uma etapa concluída e uma futura
soavam idênticas. Cada item carrega "concluída" / "etapa atual" / "não iniciada"
em `sr-only` — **depois** do rótulo, para o anúncio sair "Conta, concluída".

**E o rótulo não estava centrado no marcador.** O `<span>` era `sm:block` e
ocupava a **célula inteira** — 278px medidos — com o texto rente à esquerda:
flush com a borda do marcador, mas com o centro da caixa a **127px** do centro
dele. O olho lia a palavra pendurada no círculo em vez de presa a ele. Hoje o
rótulo é `w-max` deslocado por meia largura do marcador (que virou variável, para
não ser um número repetido em dois lugares que precisam concordar). Medido
depois: desalinhamento **0** nos degraus 2, 3 e 4.

**A primeira é a exceção, e é geometria e não gosto:** o marcador dela encosta na
borda esquerda da trilha, então centrar a palavra a faria sair para fora — 5px
com "Conta", e proporcional ao comprimento do nome. A última não precisa da
exceção porque a trilha deixa 13px de folga ali, contra os ~6 que ela pede. E a
condição é `step === 1`, **não `first:`**: o rótulo não é o primeiro filho do
corpo — o marcador é —, então o variante não casaria com nada.

**A vertical tinha o mesmo defeito nos dois eixos dela.** O rótulo fica ao lado
do marcador com `items-start`, e o marcador (24) é mais alto que a caixa de uma
linha de texto (20): os topos coincidiam e os **centros ficavam a 2px** um do
outro — igual nos quatro degraus, que é a assinatura de desalinhamento
sistemático e não de acaso. E o conector vertical usava `ms-2.5`/`ms-3`, meia
largura do marcador escrita à mão por degrau, sem descontar a espessura do
próprio fio: o traço de 1px caía com o centro **1px à direita**. Hoje o rótulo
tem `min-h` do marcador com `items-center`, e o conector recua
`calc((var(--stepper-marker) - 1px) / 2)`. Medido depois: **0 e 0**, nos quatro.

**E `asChild` custou dois consertos medidos.** O `Slot` do Radix exige um filho
único, e a linha da etapa tem três nós: a primeira versão lançava
`React.Children.only expected to receive a single React element child` e a
página inteira caía no limite de erro. A saída é a do `Button`: clona-se o
elemento de quem chama e injeta-se o corpo como filhos **dele**. Depois disso,
medido de novo, o nome acessível do botão saía **"concluída"** — porque o rótulo
ainda vivia fora do corpo clicável. O corpo passou a ser tudo: hoje o alvo é
278×46 e o nome é "Conta, concluída".

### A faixa dizia a gravidade só com cor

A `AnnouncementBar` não tinha ícone em **nenhum** dos cinco tons — medido. É
exatamente o que o `Alert` resolve com um, e a mecânica adotada é a de lá: o
ícone entra como filho direto e é medido por variável, com o espaço se
adaptando por `has-[…]`.

**`role="status"` era cravado, inclusive em `destructive`** — um erro bloqueante
anunciado com polidez. Hoje o papel segue o tom: `alert` no destrutivo, `status`
nos outros quatro, e `role` explícito ainda sobrescreve.

**A altura dependia do botão de fechar**: 40px sem, **44px com**, medidos — o
`Button size="xs"` (24) é mais alto que a linha de texto, então era ele quem
mandava, e uma barra que ganha o × ao mudar de estado saltava 4px. A linha passa
a declarar `min-h`, e o alvo do × cresce por **pseudo-elemento** e não por
medida — crescer de verdade devolveria o salto. Medido depois: 44 constante, com
e sem o botão, e alvo efetivo de 44 no telefone.

Ganhou `AnnouncementBarActions` (o caso canônico "você está offline — tentar de
novo" não tinha lugar), `size` e `sticky`, que aplica a camada `--z-banner` que
a escala reservava para isto.

**E o consumidor apareceu.** `offline-banner.tsx` era um `Alert` desfazendo a
própria forma em cinco classes, com `AlertDescription` sem `AlertTitle` — o que
a documentação do `Alert` proíbe. Ele passou a ser uma `AnnouncementBar`, e o
tom deixou de ser `default`: cinza neutro para um estado que é, por definição,
degradado. **O posicionamento continuou `fixed`**, e isso é uma decisão
explícita — a variante `sticky` seria melhor ali, mas a tela exige sessão
autenticada e a troca **não deu para verificar**. Trocar layout sem medir é o
que produziu o bug do calendário nesta mesma série.

### O `Field` prometia uma ligação que não existia

Três lugares afirmavam que ele entregava `htmlFor`, `aria-describedby` e
`aria-invalid` "já ligados": esta linha, o índice de busca do catálogo e a
página do componente. Um quarto — `lib/field-classes.ts` — dizia o contrário, e
era o que estava certo: **não havia `useId`, nem contexto, nem
`aria-describedby` em `field.tsx`**.

A prova mais dura estava na própria página que fazia a promessa: **19 `htmlFor`
escritos à mão, 4 `aria-invalid` e 1 `aria-describedby`** em 313 linhas. No app,
**24 `aria-invalid` contra 5 `aria-describedby`** — campos marcados como
inválidos cujo texto de erro nunca chegava ao leitor de tela. E **zero
consumidores**: nenhum arquivo fora de `src/app/designsystem/` importava o
componente, enquanto 27 arquivos montavam **104 campos à mão** em **5 dialetos
de espaçamento** (`space-y-2` 39, `space-y-1.5` 27, `grid gap-2` 18,
`flex flex-col gap-2` 12, `flex flex-col gap-1.5` 5).

O mecanismo agora é o do `Popover`: `FieldDescription` e `FieldError` **se
registram**, e o `aria-describedby` só é escrito quando existe alvo — apontar
para um `id` ausente deixa a descrição vazia. Renderizar um `FieldError` é o que
torna o campo inválido, então o fato deixa de ser escrito duas vezes.

**`FieldControl` é embrulho explícito, e não um hook dentro do `Input`.** Um
`Field` pode conter mais de um controle — o app tem 8 linhas de dois campos lado
a lado —, e um hook faria os dois reivindicarem o mesmo `id`, com a
reivindicação sendo estado durante o render. **E não é um `Slot`**: o `Slot` do
Radix resolve conflito com `{...slotProps, ...childProps}`, o filho vence, e
para `aria-describedby` isso perderia calado o id da descrição e o do erro. Aqui
os três são compostos.

**Cinco seletores mortos saíram**, todos da família "sobreviveu à remoção":
`data-[invalid=true]` e `group-data-[disabled=true]/field` (ninguém escrevia
nenhum dos dois atributos — agora o componente os carimba),
`has-[>[data-slot=checkbox-group]]` e `data-[slot=checkbox-group]` (não existe
`data-slot="checkbox-group"` neste projeto, e o segundo ainda testava o slot do
**próprio** elemento), e `group-data-[variant=outline]/field-group`
(`FieldGroup` nunca teve prop `variant`).

**`orientation="responsive"` nunca tinha funcionado.** Ela lê
`@md/field-group:`, e o contêiner só existe dentro de `FieldGroup` — que tinha
**zero** usos, inclusive no catálogo, onde só `horizontal` era demonstrada.
Um contêiner **não consulta a si mesmo**: uma *container query* vale para os
descendentes, e a direção do flex é declarada no próprio `Field`, então declarar
`@container/field` ali não resolveria. `FieldSet` e `FieldRow` passaram a
declarar o contêiner também, e a página demonstra a virada. Medido: coluna a
384px, linha a 600, coluna de novo a 380 — **por contêiner, com o viewport
parado**.

**`size` deu nome a um degrau que já existia**: 29 `<Label className="text-xs">`
e 73 textos de ajuda em `text-xs`/`text-2xs` contra um `FieldDescription` que
era `text-sm`. Ele desce **por contexto React**, e não por `data-*` com `in-*` —
esse variante compila com `:where()`, que não soma especificidade. E **ele não
decide a altura do controle**: ancorar a escada no contêiner é o defeito
cometido quatro vezes nesta base, e um `Field` não sabe que controle carrega.
Medido: rótulo e ajuda a 14px com controle de 32 em `md`, 12px com 28 em `sm`.

**O contorno do cartão de escolha estava errado nas duas metades.** Era
`border-primary/30`. No tema claro `--primary` e `--primary-accent` são a mesma
cor; no escuro divergem, e a 30% davam **1,32:1** contra **1,64:1** — os dois
invisíveis. Varrendo os degraus contra o fundo real do cartão, **60% é o
primeiro que alcança 3:1** — 3,01 no claro e 2,99 no escuro, contra 1,35 e 1,32
do não selecionado. E o realce ganhou par `active:`, verificado no CSS emitido:
a regra de `:hover` aninha `@media (hover: hover)` e a de `:active` não tem
media nenhuma.

Mais: `FieldLabel` e `FieldTitle` emitiam **o mesmo `data-slot`**, e nenhum
seletor os distinguia; `FieldContent` separava título e descrição com `gap-0.5`,
que é o par de identidade sendo violado pela terceira vez (depois de
`ItemContent` e `StatCard`); `FieldDescription` compensava geometria de outra
peça com duas margens negativas; e `role="group"` era carimbado em **todo**
campo, **sem nome** — a mesma medição do `Popover`, um papel sem nome é
anunciado como o papel e nada mais. Hoje o papel é opt-in e sai com
`aria-labelledby`.

**`FieldRow` é a única peça nova**, e sai de contagem: 8 linhas de dois campos em
4 grafias, cinco delas **sem empilhar no telefone**. Não entrou um
`FormSection` — as ~50 grafias de cabeçalho de seção já têm peça (`FieldSet` +
`FieldLegend`), que tinha zero usos porque era `text-base`/`text-sm` enquanto o
app escreve `text-xs font-medium`; com o eixo `size` ela passa a servir. Nem um
marcador de obrigatório: existem **zero** no app, e a convenção é **invertida**
— marca-se o opcional, que é o que `FieldLabel optional` codifica.

### O `CustomForm` está pronto, e as três lacunas eram de uma linha

**38 consumidores, 2 `<form>` crus** — os dois dentro do próprio componente.
*(Recontado na rodada em que ele virou molécula: **54 chamadas em 29 arquivos**,
e **um** `<form>` cru, o do próprio componente.)* A
mecânica do Enter está correta, inclusive a parte difícil: o `form.id` para o
botão portalizado num `DialogFooter`, e a regra do
`form-picker-popover-search`. Nada disso mudou, e o layout também não: os 38
consumidores trazem o próprio `gap`.

O que entrou: **guarda de `isComposing`** — a string não aparecia em lugar
nenhum do repositório, e o Enter durante a composição de um acento enviava o
formulário no meio da palavra —, **`⌘/Ctrl+Enter`** para enviar de dentro de um
controle que fica com a tecla, e `data-slot="form"`. Verificado no componente
real: Enter no textarea não envia, `⌘+Enter` envia, `Ctrl+Enter` envia,
`isComposing` **não** envia nem com `⌘`, e Shift+Enter nunca envia.

**A lista de regras virou fonte.** A página `formularios` a redigitava, e já
tinha divergido: mostrava **6** regras enquanto o código checava **7**, e a que
faltava era justamente a do seletor ancorado. Hoje é `ENTER_DEFERRAL_RULES`, e a
página a importa. `shouldDeferEnterToWidget` passou a ser exportada — enquanto
era privada, as sete regras eram promessa sem asserção, e não existia
`form.test.ts`.

### A tese do `Toolbar` era contradita pelas seis barras que ele deveria descrever

Ele dizia "no telefone os itens quebram em linhas em vez de encolher", e a
página repetia. **Nenhuma das 6 barras reais faz isso**: todas renderizam duas
árvores e **trocam o conteúdo** — um botão só de ícone no telefone, o mesmo
comando rotulado no desktop. Ele tinha **zero consumidores** enquanto existiam
`transactions-toolbar` (378 linhas), `bills-toolbar` (412),
`categories-toolbar` (395), `subscriptions-toolbar` (160) e
`dashboard-toolbar` (27), mais **um clone de cada num arquivo de esqueleto**,
com as strings copiadas.

**Ele não ganhou eixo nenhum, e isso é a leitura honesta das contagens.** Não há
`cva` no arquivo, como em `Container` e `PageSection`. `sticky` foi reprovado
(zero barras fixas no app; `--z-sticky` tem um consumidor no projeto inteiro);
`align` foi reprovado porque as 4 grafias (`justify-between`,
`md:justify-between`, `ml-auto`, `md:justify-end`) querem a mesma coisa; e
empilhar no telefone parecia 2 de 6 e é **1**, porque o `flex-col` de
`subscriptions-toolbar` é vestigial — na largura de telefone a raiz tem um filho
visível.

**O que substitui as 4 grafias é uma `ms-auto` em `ToolbarActions`**, e não
`justify-between` na raiz. As duas empatam com dois grupos, e só a margem acerta
os outros dois casos: com **um** grupo, `justify-between` renderiza
`flex-start`; com **três**, o `transactions-toolbar` chega a alternar
`md:justify-between` ↔ `md:justify-end` em tempo de execução. Ela é a **única**
margem automática do arquivo, e o teste tranca a contagem — duas dividem a sobra
em partes iguais.

**A densidade virou variável, e não eixo.** A raiz publica
`--toolbar-control`; `toolbarControlClassName` e `toolbarIconControlClassName`
a leem. Ela chega por `className` e não por seletor descendente porque `in-*` e
`group-*` compilam com `:where()` e empatariam com o `h-8` do próprio `Button`,
perdendo por ordem de emissão; por `className` quem decide é o `twMerge`, que
**remove** o degrau conflitante. Medido no navegador: com a régua, 40px e 56px
quando a variável muda; sem ela, 32px fixos do degrau do `Button`; e o `h-8` de
fato **sai** da lista de classes.

**E a pergunta é o dedo, não a largura.** As 6 barras escrevem `md:h-8` — 19
vezes, mais 6 esqueletos, mais quatro constantes `monthNavDense*` cujo ramo
`false` é código morto. Com `md:`, um desktop de 700px recebe 40px que ninguém
pede e um tablet em paisagem recebe 32px que o dedo não acerta. A regra já
estava escrita no item de menu, e o `Calendar` já a aplica: aqui é
`pointer-coarse:`. Não custou migração nenhuma — o componente não tinha
consumidor. Medido: 32px com ponteiro fino, **40px com ponteiro grosso**, com os
botões sem régua ficando em 32 e mostrando exatamente a lacuna que ela fecha.

`ToolbarSearch` virou **`ToolbarFilters`**: nenhuma barra do app tem campo de
busca — a de transações mora dentro da folha de filtros —, e o que o grupo da
esquerda carrega em 5 das 6 é um trilho segmentado. O nome descrevia a única
demonstração da página, que por sua vez não descrevia tela nenhuma. Entraram
**`ToolbarRow`** (a linha do telefone que se dissolve no `md` — `md:contents`
aparece 5× no app, escrita à mão; medido: `flex` a 375px, `contents` a 1443) e
**`ToolbarFilterIndicator`** (o ponto de filtro ativo, hoje em **4 grafias**;
ficou a que três das quatro compartilham, e a que saiu era a que sangrava para
fora da caixa do botão).

**A decisão de não carimbar `role="toolbar"` fica, e ganhou o contraexemplo**: o
app o escreve à mão em 4 barras de seleção, nenhuma com foco itinerante, e duas
delas são cópia literal das outras duas.

**E o embrulho vai no controle, nunca no invólucro.** Medido nas próprias
demonstrações do catálogo, depois de escritas: `<FieldControl><Select>…` clona
a raiz do Radix, que **não renderiza nó nenhum** — o `id` não chega a lugar
algum e o rótulo aponta para o vazio. E `<FieldControl><InputGroup>…` põe o
`id` na `div` do grupo: o alvo existe, não é rotulável, e o `<label for>` deixa
de fazer qualquer coisa. Os dois são o defeito que esta rodada existe para
eliminar, reproduzido por quem acabara de consertá-lo. A forma certa põe o
embrulho no `SelectTrigger` e no `InputGroupInput`, e a varredura que fecha o
assunto é dura: **todo `[data-slot=field-label][for]` da página tem de apontar
para um elemento que existe e é rotulável** — 16 de 16 na página do `Field`.

### Duas lições de método desta rodada

**`getComputedStyle` pode devolver valor velho no mesmo passo.** A primeira
medição da régua de densidade disse que ela **não governava** — a variável
mudava e a altura não. O componente estava certo; o instrumento não. Lendo dois
quadros depois, a altura acompanha. A prova de que o erro era meu: um
`height: 48px !important` inline também "não valia", o que é impossível.
**Medição de layout se lê depois de um quadro, nunca no mesmo passo da
mutação.**

**Classe montada em tempo de execução não existe — inclusive na sonda.** Ao
varrer os degraus de alfa do contorno, `/70` e `/80` deram contraste *menor* que
`/60`. Não era inversão: essas classes não aparecem em fonte nenhuma, o Tailwind
nunca as emitiu, e a borda caía para o valor padrão. A regra que este arquivo já
registra pegou a própria ferramenta de medição.

### A revisão da barra, e três coisas que ela achou

A rodada 11 entregou a `Toolbar` e a página dela. A revisão apontou três
problemas, e nos três a medição mudou o tamanho do achado.

**A busca tinha sido removida por um argumento meio certo.** Ela saiu porque
nenhuma tela do app tem busca na barra, e a demonstração era a única da página —
ensinar uma forma inexistente é pior que não ensinar. Mas a conclusão estava
errada: o conserto era **somar** as formas reais, não apagar a busca. Este
catálogo nunca foi só espelho do app — `Drawer`, `ContextMenu`, `Menubar`,
`HoverCard` e `Stepper` foram todos documentados sem consumidor, de propósito —
e o `ToolbarFilters` é `min-w-0 flex-1`: ele tem a geometria de um campo que
cresce, e nada usava isso.

**O trilho estava com o componente semanticamente defensável e a aparência
errada.** As seis barras do app desenham um *segmented control* — bandeja
`bg-muted` com realce —, que neste sistema é `Tabs variant="solid"`. A
demonstração usava `ToggleGroup variant="outline"`, uma fileira de botões
contornados: quem copiasse do catálogo construiria algo que não se parece com o
produto. Trocar o componente certo pela aparência errada é o defeito menos
visível de uma página de catálogo, porque ela continua "correta".

### O inventário dos trilhos: não são seis, são onze, e em três grupos

| Grupo | Quantos | O que decide |
| --- | --- | --- |
| **Aba** | 4 | faturas `Contas/Pendentes` troca o card **e reseta o eixo de ordenação**; cartões `Cartões/Histórico` troca uma grade por um gráfico de 12 meses |
| **Filtro** | 3 | transações vira `qb.eq("type", …)` na **mesma** tabela montada; assinaturas é `rows.filter(...)`; histórico de fatura ainda reseta a paginação |
| **Controle de formulário** | 4 | o valor é a coluna que vai ser gravada, ou a pergunta que decide qual grupo de campos aparece |

Dois achados valem mais que a contagem. **`TransactionTypeSegment` é aba numa
tela e filtro na outra**: em `transactions-toolbar` ele filtra a tabela; em
`categories-toolbar` ele troca `IncomeCategoryCard` pela grade de despesa e
esconde o navegador de mês. Mesmo componente, semânticas opostas. E **quatro
`role="tablist"` estão dentro de formulários**, um deles debaixo de um
`<Label>Como informar os valores?</Label>` — rádio vestido de aba, e o pior dos
onze.

Os dez anunciam o padrão ARIA de abas com **zero `tabpanel`**, zero
`aria-controls` e zero foco itinerante.

### `Tabs` para o trilho, e o `ToggleGroup` que não segura o invariante

A escolha foi `Tabs variant="solid"`, e ela custa uma dívida registrada: os 3
filtros ficam com `role="tab"` sem painel. O destino deles é `ToggleGroup`, que
hoje não serve — **medido: clicar no item já ativo de um `type="single"`
desmarca tudo**, os três vão para `off`, zero selecionados. Num filtro que já
tem "Todas" como neutro, isso é um quarto estado que ninguém pediu. Ele ainda
emite `role="radio"` dentro de `role="group"`, e não de `radiogroup`. Tem zero
consumidores, então o conserto é grátis — e é ele que destrava a saída.

**A bandeja é 8px mais alta que o gatilho, e isso é certo.** A régua da barra
mede **controle**, e uma bandeja não é um controle: é o contêiner que segura um.
`Tabs size="md"` põe o gatilho em **32** — exatamente o degrau de ponteiro fino
da barra, medido — e a bandeja em 40. Forçar a bandeja a 32 exigiria um gatilho
de 24, que é o degrau `xs`, reservado para dentro de outro controle. Ancorar
escada em contêiner é o defeito que esta base já cometeu quatro vezes.

### A vertical carregava a altura da bandeja, e isso quebrava três coisas de uma vez

Medido: a moldura vertical saía com **36px para 108px de conteúdo**. Uma causa,
três sintomas — e os três foram relatados como problemas separados:

1. **Dois dos três gatilhos ficavam fora da moldura.** Eles ainda pintavam
   (`overflow: visible`), então o defeito lia como "a lista não está toda
   visível" em vez de "a caixa está errada".
2. **O `border-e` — o fio — percorria só os 36 primeiros pixels.** Ele aparecia
   como um traço parado ao lado da primeira aba que **não se movia** ao trocar
   de aba, e por isso era natural confundi-lo com o marcador. Não era: o
   marcador estava correto o tempo todo, em `y: 74px`, do lado de fora da caixa.
3. A altura declarada não tinha significado nenhum ali.

**Na vertical `size` não nomeia altura.** Ali o eixo cruzado é a **largura**, e
a altura é a soma das linhas. A classe passou a ser escopada —
`data-[orientation=horizontal]:h-9` —, e o teste de régua agora exige as duas
coisas: que a altura exista **e** que ela nunca apareça solta.

**E os rótulos estavam centrados.** Com `justify-center` nas duas orientações,
numa coluna de 105px os três textos começavam a **35, 24 e 10px** — 25px de
borda serrilhada, porque cada aba centrava o próprio rótulo numa largura comum.
Uma coluna de navegação se lê pela margem esquerda:
`data-[orientation=vertical]:justify-start`. Medido depois: 10, 10 e 10, com a
horizontal seguindo centrada.

### As três variantes do `Tabs` eram a mesma coisa pintada de três jeitos

Medido, com as três lado a lado e nenhum `size` declarado: **moldura 32, gatilho
28 e fonte 12,8px nas três**. Elas diferiam só no que a moldura pintava —
bandeja, fio ou nada — e em mais nada. Isso está errado porque elas não são a
mesma coisa:

- **`solid`** é um controle segmentado, e vive numa **linha de controles**: a
  bandeja tem de medir 32 para ficar rente ao `Button` ao lado.
- **`underline` e `ghost`** são **abas de página**. Não dividem linha com
  controle nenhum; dividem a página com título e texto corrido.

Hoje `size` tem padrão **por variante** — `md` no `solid`, `lg` nas outras duas.
E o ganho não é só de altura: **`lg` é o degrau em que o rótulo volta ao corpo
de texto da página**, porque só `sm` e `md` carregam `text-control-sm`. Uma aba
de página em 12,8px era o defeito. Medido depois: `solid` 32/28/**12,8px**,
`underline` e `ghost` 36/32/**14px**.

A forma tem precedente no próprio arquivo — `stretch` resolve assim desde a
rodada do `Tabs` (`stretch ?? variant === "solid"`). Esta é a segunda prop a
usá-la, e é o que faz as três serem três **tipos** em vez de três pinturas. O
padrão mora em `defaultTabsSize(variant)`, exportado, para ser inspecionável em
vez de enterrado numa expressão.

**A regressão que importava não aconteceu**: as 5 `TabsList` da `Toolbar` são
`solid`, e continuam com bandeja 32 rente aos controles. E no ponteiro grosso as
três convergem para 40/36, com o marcador acompanhando.

A página do catálogo passou a ser dividida **pelos três tipos**, com o que é de
cada um dentro dele — a nota de que o `ghost` não viaja agora fica ao lado da
demonstração que ela explica, em vez de vinte seções abaixo. As seções que de
fato atravessam os três (altura, distribuição, excesso horizontal, vertical)
ficaram depois. E saíram os botões de comparação que eu tinha posto ao lado de
cada bandeja: a equivalência com o `Button` já está escrita na dica de cada
degrau, e eles poluíam uma seção que é sobre a escada.

### `--primary-muted`: a marca não tinha tinta suave, e o `Badge` mentia

O `Badge` tem oito variantes e todas são tintas `-muted`. **Nenhuma era a
marca** — e `variant="primary"` renderizava `--info-muted`, ou seja **azul**
(medido: 4/44/67 em RGB), num sistema em que `primary` é o verde em todo o
resto. Havia um consumidor vivo da mentira: o "Beta" de
`bills-toolbar.tsx:189`, que saía azul sem ninguém ter pedido azul.

O par `--primary-muted` / `--primary-muted-foreground` entrou nos dois temas,
com a mesma receita de `success` e `info` no matiz da marca (166): `0.96 0.03` /
`0.32 0.1` no claro, `0.27 0.06` / `0.88 0.06` no escuro.

**O que motivou**: a contagem de filtros na barra. O app já fala verde para
"filtro ativo" — as três grafias da bolinha usam `bg-primary` —, e trocar o
ponto por um badge cinza mantinha a informação e perdia o sinal.

**E a medição corrigiu a minha própria leitura.** A primeira conta olhou a
pílula contra o botão e deu **1,06** no claro, pior que os 1,19 do cinza — o que
parecia reprovar o token. Calibrando contra a família, a pílula é invisível no
claro em **todas** as variantes tonais (`success` 1,06, `warning` 1,06): ali
quem sinaliza é a **tinta**, e nela o verde dá **11,26** contra os **5,76** do
cinza. No escuro a conta se inverte e é a pílula que carrega (14,71). Medir o
componente errado quase enterrou a decisão certa.

### `size` no `Tabs` passa a nomear a bandeja — e a rodada anterior parou no meio

O eixo `padding` da rodada 12 tornou o alinhamento **possível**, mas por opt-in,
e o padrão continuou entregando 40 numa linha de 32. A prova de que o padrão
estava errado é a própria migração: **6 de 6** chamadas pediam `tight`, nenhuma
usava o padrão. Padrão que ninguém escolhe não é padrão.

E o problema era maior que o recuo. A frase **"alinha sem ninguém dizer
`size`"** é a promessa desta casa — está nas páginas do `button`, do `input` e
do `toggle`, e nas três é verdadeira porque ali `size` nomeia **a altura do
elemento que se posiciona** (`h-7 / h-8 / h-9 / h-10`, medido em `Button`,
`Toggle`, `Select` e `NativeSelect`). **O `Tabs` era o único do sistema em que
`size` nomeava uma peça interna**, e herdou a frase sem herdar o comportamento.

Hoje `size` nomeia a bandeja, o gatilho deriva, e o eixo `padding` saiu:

| `size` | bandeja | gatilho |
| --- | --- | --- |
| `sm` | 28 | 24 |
| **`md`** | **32** | 28 |
| `lg` | 36 | 32 |
| `xl` | 40 | 36 |

Os oito números são degraus da escada. Medido nos quatro: **a bandeja é idêntica
ao `Button` de mesmo nome**, com o gatilho em bandeja − 4.

**Isto não repete o defeito das rodadas do `Menubar` e do `Tabs`.** Lá o
`TabsList` era `h-9` com `p-1` e o gatilho saía `h-[calc(100%-1px)]` = **27** —
número que não existe na escada, enquanto a documentação dizia 32. O defeito era
a **mentira**, não o modelo. Aqui os dois números são reais e os dois estão
escritos. O gatilho de `sm` cai a 24, e isso é correto: `xs` é o degrau que a
escada reserva para "dentro de outro controle", e é onde ele está.

**Fechou o defeito do ponteiro grosso** que a rodada 12 deixou aberto (bandeja
48 contra controles de 40): quem cresce no toque passou a ser a bandeja, com
piso de 40 — o mesmo degrau que a `Toolbar` publica —, e o gatilho vai a 36.
Medido a 375px: 40/36, **exatamente a geometria que o app já renderiza no
telefone** (`h-10 … p-0.5 items-stretch`). O `pointer-coarse:min-h-11` saiu do
gatilho: era ele que empurrava a bandeja para 48.

O recuo virou 2px fixo. O custo é medido e aceito: sob `scrollable` o anel de
foco perde **1px** nas pontas, e este arquivo já aceita uma troca maior — em
`underline` ele perde **3px** na base.

### A armadilha que esta rodada pagou: classe montada em runtime

As alturas foram escritas primeiro como template literal
(`` `${ALTURA_CLASS[...]} pointer-coarse:${ALTURA_CLASS[...]}` ``). Medido no CSS
emitido: **`pointer-coarse:h-9` estava no elemento e não existia na folha** — o
gatilho ficou em 28 dentro de uma bandeja de 40, com 6px de faixa morta. A
altura base funcionava, e `pointer-coarse:h-10` funcionava por coincidência
(existe literal em outro arquivo), o que deixou o defeito parcial e mais difícil
de ver.

É a regra que este arquivo já registra — *o Tailwind varre o código como
texto* —, e ela pegou a mesma pessoa que a escreveu. As classes voltaram a ser
literais, e o teste passou a provar que os literais não divergem da tabela.

### O `Tabs` ganhou `padding`, porque quem fica na linha é a bandeja

A revisão apontou o defeito e ele é real: `size="md"` dava **gatilho 32 e
bandeja 40**, e numa barra de controles de 32 o componente inteiro saía 8px mais
alto. Eu tinha defendido isso com um argumento de nomenclatura — "a régua mede
controle, e bandeja não é controle" —, e a nomenclatura estava certa enquanto o
resultado estava errado: **quem fica lado a lado com um `Button` não é o
gatilho, é a bandeja.**

O recuo saiu do `variant` e virou eixo próprio. A bandeja é `gatilho + 2×recuo`:

| `size` | gatilho | `default` | `tight` |
| --- | --- | --- | --- |
| `sm` | 28 | 36 | **32** |
| `md` | 32 | 40 | **36** |
| `lg` | 36 | 44 | **40** |

Com `tight` as três caem nos degraus da escada de controles, e o trilho de uma
barra vira `size="sm" padding="tight"` — 28 dentro de 32. **É a receita que o
app já escreve à mão**: `transaction-type-segment.tsx` usa `p-0.5` com
`md:h-8`. E `size` continua nomeando a caixa real do gatilho, que é a correção
que consertou o `Menubar` (entregava 24) e o próprio `Tabs` (entregava 27) —
o defeito daquelas rodadas era a **mentira**, não o modelo.

`default` segue padrão porque o `p-1` é carga estrutural sob `scrollable`:
`overflow-x` recorta no padding box e o anel de foco de 3px precisa dos 4px.
Por isso `scrollable` **força** `default`, com a mesma precedência explícita com
que já vence `stretch`.

**E não dava para consertar de fora**: o `className` do `TabsList` cai na
moldura (recuo 0), enquanto o `p-1` mora na trilha, sem prop que a alcançasse.

### O que não fechou, e por quê

No ponteiro grosso a bandeja **ainda não fica rente**: medido a 375px, 48 contra
controles de 40. O `stretch={false}` liga `pointer-coarse:min-h-11` (44) no
gatilho, e 44 + 4 dá 48.

E não há combinação que feche, porque **uma bandeja com recuo nunca iguala o
gatilho**. Ficar rente exige que a **bandeja** seja a coisa dimensionada e o
gatilho derive — que é exatamente o que o app faz (`h-10 md:h-8` com
`items-stretch`). O `Tabs` dimensiona o gatilho, e o `h-7` do degrau vence
qualquer `items-stretch`: medido, uma moldura forçada a 40 deixa o gatilho em 28
e sobra uma faixa morta de 6px em cima e embaixo.

Fechar isso é trocar o `h-*` do degrau por `min-h-*` e dar altura à bandeja —
mudança de semântica do `size`, e decisão de uma próxima rodada. Fica registrado
com o número em vez de silenciado.

### `SearchInput`: a regra existia e não tinha casa

O `AGENTS.md` registra desde a rodada do seletor ancorado que `type="search"`
traz um × desenhado pelo WebKit — azul do sistema, fora do tema e fora da
escada — e que ele deve ser suprimido e substituído por um botão nosso, e diz
que *"vale para qualquer campo de busca do app"*. Medido: o
`FormPickerPopoverSearch` acerta sozinho, e as **três** buscas de
`transactions-filters-panel.tsx` (418, 538, 772) são `<Input type="search">`
cru. **Quatro usos, três violações.** Foi a contagem que transformou a regra em
peça; a semântica fica (é ela que dá a tecla "Buscar" no iOS), só o desenho sai.

**E ele custou um defeito de API, achado ao medir.** Na primeira versão o
`className` ia para o `<input>`: um `max-w-xs` encolhia a área de digitação e
deixava a **moldura com a largura toda**, com o botão de limpar **354px** à
direita do texto. `className` passou a dimensionar a superfície — que é quem
desenha a borda e ancora os addons —, e o caso raro virou `inputClassName`.
Medido depois: superfície 320, botão a 5px da borda.

### O indicador: contagem no rótulo, ponto só no ícone

Num botão com rótulo a marca é a **contagem**, num `Badge` dentro do fluxo do
flex: ela diz *quantos* filtros há em vez de só que há, e não sobrepõe nada.
Medido antes: a bolinha absoluta encostava no "s" de "Filtros" em 2px, nos dois
eixos. Depois: **6px de folga**.

**A âncora do ponto passou de `top-1.5` para `top-1`**, e os números são
medidos: a 1.5 ele invadia a caixa do ícone em **3px**; a 1 invade **1**, e a
folga até a curva do canto continua **4,59px** — a mesma, porque a distância ao
centro do arco é simétrica em torno dele. Descer a `top-0.5` zera a invasão do
ícone mas derruba a folga da curva para 1,76, e aí o ponto passa mesmo a ler
como estando na borda. A aritmética está trancada em
[`toolbar-density-ladder.test.ts`](src/components/ui/toolbar-density-ladder.test.ts).

### Duas lições de método, e uma delas é um erro meu

**Confundi folga com sobreposição, e reportei o defeito errado.** A primeira
medição do ponto calculou a distância do vértice ao centro do arco (4,24 contra
raio 10) e eu li aquilo como "5,76px dentro da curva", concluindo que o ponto
cavalgava a borda. **Era o contrário**: a folga entre a borda do ponto e a curva
é de **4,59px** — ele está confortavelmente dentro. O defeito real era o texto,
2px, que a mesma medição já mostrava. Uma métrica cujo *sinal* não é óbvio
precisa ser nomeada pelo que ela mede (`folgaAteACurva`), não pelo que se espera
encontrar.

**E de novo: medição de layout se lê depois de um quadro.** Um botão de 40px
mediu 34,2 logo após um `resize_window`, e daí saiu uma "sobreposição" de 5,89px
que não existia. Com o layout assentado: 40, e 3px. É a terceira vez nesta série
— e na quarta, a leitura estática dos `tabIndex` do `Tabs` (todos `-1`) quase
virou um defeito de acessibilidade inexistente, até um `Tab` de verdade mostrar
o foco entrando na lista e o gatilho ativo virando `0`.

### O cabeçalho de página era uma linha de flex, e a trilha caía dentro dela

`PageHeader`, `PageSection` e `Container` são as três peças que este arquivo
declara **obrigatórias para toda tela nova**. Medido: os três tinham **zero
consumidores no app** — e estavam sendo reescritos à mão dentro do próprio
catálogo, em cinco lugares e em quatro gramáticas.

| Onde | O que era | Contagem |
| --- | --- | --- |
| `DocSection` (`ds-doc.tsx`) | cabeçalho de seção: `border-t pt-8` + `font-heading text-lg font-semibold tracking-tight` | **247 usos** |
| `Group` (`ds-kit.tsx`) | **a mesma string**, no outro arquivo | **22 usos** |
| `PropsTable` (`ds-doc.tsx`) | a mesma string, uma terceira vez | 90 páginas |
| `DocPage` | cabeçalho de página com adorno em `items-baseline justify-between` | 88 páginas |
| índice `/designsystem` | outro cabeçalho, um degrau maior, com sobrancelha e faixa de fatos | 1 |
| `ds-shell.tsx` (×2) | `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8` — o `Container size="lg"` | 2 |

**O defeito de maior consequência estava na demonstração principal.** Medido a
1280px, na seção "Completo" da própria página do componente: `sm:flex-row` sem
`flex-wrap` punha `PageHeaderBreadcrumb` (618px) **à esquerda** do título, o
`PageHeaderTitleRow` saía com **largura 0** e 362px de altura — a descrição
quebrando uma palavra por linha — e o título passava por baixo do botão de ação.

E o `sm:col-span-full` que a trilha carregava não era classe morta por acaso:
**era o fóssil da implementação correta**, escrita para uma grade que nunca
existiu. Hoje o cabeçalho é grade, e a classe finalmente significa alguma coisa.

### As duas escadas saíram de contagem, e descem por variável

`PageHeaderTitle` oferecia **um** corpo (`text-2xl sm:text-3xl`) enquanto o
catálogo renderizava **dois** — `md` na página de componente e `lg` no índice.
O terceiro degrau, `sm`, é a tela de detalhe, que a própria página demonstrava
sem ter como declarar. O mesmo no `PageSection`: `text-base` no componente
contra `text-lg` nas 269 seções.

| | `sm` | `md` | `lg` |
| --- | --- | --- | --- |
| `PageHeader` (título) | 20 → 24 | **24 → 30** | 30 → 36 |
| `PageSection` (título / respiro) | 14/20 · gap 12 | **16/24 · gap 16** | 18/28 · gap 16 |

**A escada desce por variável CSS, e não por contexto React.** Contexto exigiria
`"use client"`, e `PageHeader` é um dos poucos componentes de `ui/` que ainda é
servidor; `in-*` e `group-*` compilam com `:where()`, que não soma
especificidade e perderia para a classe base no mesmo elemento. É o mecanismo de
`--toolbar-control` e `--command-list-max-h`: variável herda e não disputa.

A entrelinha do título de página **não** entra na variável, porque `.page-title`
declara `1.25` e vence — ela está **fora de qualquer `@layer`**
(`globals.css:518`, depois do `@layer base` que fecha em 496), e CSS sem camada
vence CSS em camada. Verificado no navegador: o `font-heading` que três arquivos
escreviam ao lado dela nunca decidiu nada, e a família resolvida é Ledger. No
`PageSection` a entrelinha **é** uma segunda variável, porque ali não há classe
equivalente e `text-(length:…)` declara só o tamanho.

### Peças novas, e cada uma tem a cópia que a prova

- **`PageHeaderEyebrow`** — a sobrancelha em versalete existia em **duas cópias
  da mesma string**. A régua mora agora em `pageEyebrowClassName`, e `ds-doc`
  importa. Ela **não é enfeite acima de todo título**: só se paga quando há um
  pai de verdade a nomear.
- **`PageHeaderMeta`** — a faixa de fatos que o índice escrevia à mão. Ela traz
  8px do próprio respiro em cima porque o espaço **acima** de uma régua tem que
  ser maior que o de baixo (24 contra 16, com o `gap` da grade contando junto).
  `asChild` porque o elemento certo depende do conteúdo: um `<dl>` quando são
  pares termo/valor, que é o caso comum num app de finanças.
- **`endAdornment` em `PageHeaderTitleRow`** — o mesmo nome e a mesma forma que
  `DialogHeaderRow` e `HoverCardHeader` já usam, e é o link de categoria do
  `DocPage`.
- **`back` em `PageHeaderTitleRow`** — apaga o `<div className="flex
  items-center gap-1">` que a demonstração inventava.
- **`actions` em `PageSectionHeader`** — apaga o `<PageSectionHeader
  className="flex-row items-center justify-between">` que a demonstração
  inventava. É o precedente de `FormPickerPopoverEmpty` e `HoverCardBody`:
  quando o catálogo escreve a anatomia, falta uma peça.

**O voltar e o adorno se alinham por mecânicas diferentes, e é de propósito.**
O adorno é texto, e alinha pela linha de base — é o que o prende à primeira
linha do título quando o nome quebra em duas. O voltar é um controle **sem
texto**: numa caixa de `items-baseline` a linha de base dele seria sintetizada
na borda de baixo e a fileira inteira afundaria. Ele sai do alinhamento com
`self-start` e se centra dentro de uma caixa de exatamente uma linha de título
(`--page-title-line`), sem número mágico e acompanhando o degrau. Medido: centro
do botão e centro da primeira linha do título em **439px os dois**, diferença
zero.

O `-me-2` do voltar não é compensação de gosto: o `gap` é a distância mínima
entre **caixas**, e a caixa do botão é 10px mais larga que o glifo desse lado.
Devolvendo 8 deles, a distância seta→título cai nos **18px** que o cabeçalho do
app renderiza — medidos, 18.

### O par de identidade, pela quarta vez

`PageHeaderTitleRow` e `PageSectionHeader` declaravam `gap-1`, e a página do
`PageHeader` **já dizia o contrário**: "Título e descrição não levam gap —
`PageHeaderTitleRow` já entrega a entrelinha certa". Documentação certa, código
discordando: é exatamente como `ItemContent` (rodada 08), `StatCard` (10) e
`FieldContent` (11) foram achados.

O respiro voltou a existir só onde há mudança de assunto, e quem o declara é o
contêiner: `[&>[data-slot=page-header-eyebrow]]:mb-3` diz qual filho abre um
bloco, como o `StatCard` faz com a variação.

Consequência visível: o índice do catálogo **perdeu os 16px** que separavam o
título da frase de abertura. Ele era o único cabeçalho do catálogo com essa
folga; os outros 89 já tinham zero.

### `PageSectionContent` foi apagado pela própria medição

Ele era um `<div>` com string de classe vazia. A primeira versão desta rodada
tentou salvá-lo dando-lhe `min-w-0`, com a justificativa de que "uma tabela
larga estoura a página em vez de rolar" — a mesma família do `min-h-0` do
`DialogBody`.

**Medido, isso é falso.** O tamanho mínimo automático de um item de flex vale no
**eixo principal**, e numa coluna o eixo principal é o vertical: `min-width:
auto` já resolve para zero ali. Com e sem `min-w-0` no conteúdo, os mesmos
400px.

O defeito real está um nível acima: uma seção usada como item de uma **linha**
de flex estoura para o próprio min-content — **5241px dentro de um pai de 400**
—, e leva a rolagem interna junto. Com `min-w-0` na seção: 400px, e a região de
dentro volta a rolar. O `min-w-0` mudou de lugar, e a peça sem trabalho foi
apagada em vez de ganhar uma justificativa inventada.

### A régua da seção é em cima, e a do cabeçalho continua embaixo

`PageSection variant="ruled"` é `border-t pt-8` — é onde as 269 seções do
catálogo já a punham. Um fio em cima diz "começa outro bloco"; um fio embaixo
diz "este bloco tem um rodapé". `PageHeader variant="ruled"` segue **padrão**,
porque um cabeçalho de página é a única fronteira da tela que não tem nada
acima para marcá-la; `plain` é o opt-in, e é o que o `DocPage` usa, porque ali
quem fecha o cabeçalho é o campo de import logo abaixo.

### `Container`: `default` virou `md`, e os degraus viraram `cva`

Pela mesma razão que esse nome saiu de `Button`, `Input`, `SelectTrigger` e
`NativeSelect`: ele dizia *o padrão* em vez de dizer a medida. Saiu do tipo, e o
compilador acusa quem o escrever — eram 3 chamadas, todas no catálogo.

E os três componentes desta rodada saíam com **`—`** na coluna de variantes do
`npm run ds:catalog`, como se não tivessem decisão nenhuma a tomar. A tabela
`containerSizes` continua exportada ao lado do `cva` para as duas páginas que
desenham a régua poderem iterá-la, e
[`page-chrome-ladder.test.ts`](src/components/ui/page-chrome-ladder.test.ts)
falha se as duas divergirem — o Tailwind varre o código como texto, então os
literais têm que ficar no `cva`.

O teste tranca também a asserção que pegou o `Item` na rodada 08: **nenhum par
de degraus pode produzir a mesma string**.

### O alvo do voltar cresce por pseudo-elemento

36 é a medida do controle e 44 é a do dedo. Crescer de verdade mudaria a caixa
que `--page-title-line` centraliza, então o alvo cresce com
`pointer-coarse:after:-inset-1` — a mesma saída do × da `AnnouncementBar` e dos
degraus do `Breadcrumb`. E a pergunta é o **apontador**, não a largura.

O `PageHeaderBack` também era a segunda cópia de um controle que o app já tem:
`MobileHeaderBack` em `app-header.tsx` renderiza `icon-lg` (36) com `-ml-1`, e
este renderizava `icon-md` (32) com `-ml-2`. Ficou a medida do app. Ele ainda
carregava um `group-active:bg-accent` sem `group` ancestral nenhum, e cravava o
`aria-label`.

### O `Container` descrevia um app genérico, e este não é ele

A rodada anterior mexeu nele de raspão: renomeou `default` → `md` e transformou
os degraus em `cva`. **Consertou o nome e deixou o número sem examinar** — o
nome ficou certo apontando para uma largura que nenhuma tela pediu.

**A calha lateral era o que tornava o componente inadotável.** A casca do app
(`sidebar-app-shell.tsx:39`) já é dona dela — `px-4 … md:p-6` —, e uma tela que
somasse a do `Container` a **dobrava**:

| | sem `Container` | com o `Container` de antes |
| --- | --- | --- |
| 375px | 343px de conteúdo | **311px** (−9,3%) |
| 1280px | 1232px | **960px** (56px de calha por lado) |

Era palavra por palavra o defeito que a documentação dele descrevia — *"uma
tela que soma o próprio recuo horizontal acaba com o dobro no telefone, que é
justamente onde cada pixel de largura conta"* — enquanto ele o cometia. E é por
isso que ele passou tanto tempo com zero consumidores: **das nove cascas de
página escritas à mão no app, nenhuma declara calha horizontal.** A única que
tenta escreve `px-1 sm:px-0`, quatro pixels que somem em 640.

Hoje a calha é eixo, e é opt-in:

| `gutter` | classes | quem pediu |
| --- | --- | --- |
| **`none`** | — | **9 de 9 cascas do app** |
| `page` | `px-4 md:px-6` | a casca do catálogo |

`page` fala a gramática que o app **renderiza** — um degrau, quebrando em 768 —
e não a que este arquivo inventava, com dois degraus quebrando em 640 e 1024.
Duas gramáticas para a mesma calha, e a do app é a que 100% das telas mostram.

Medido depois: um `Container` com o padrão de hoje, dentro da casca do app, dá
**343px** — exatamente o mesmo que não ter contêiner nenhum.

### A escada foi recortada por contagem, e 1024 saiu

Ela oferecia 672 / **1024 (o padrão)** / 1280 / none. Contado nas nove cascas
reais: **576px em seis**, 448 em duas, 672 em uma — e **1024 em nenhuma, no
repositório inteiro**. É a lição "padrão que ninguém escolhe não é padrão",
reintroduzida um round depois de ela ter sido registrada.

| `size` | largura | quem pediu |
| --- | --- | --- |
| `sm` | 448 | as duas cascas de erro |
| **`md`** | **576** | **6 usos — o padrão** |
| `lg` | 672 | o detalhe de cartão |
| `xl` | 1280 | a casca do catálogo |
| `full` | sem teto | quem já tem largura de fora |

`max-w-5xl` **saiu**. Devolver um degrau no dia em que uma tela pedir é uma
linha; mantê-lo era manter a ficção. O teste tranca que ele não volte pela
porta dos fundos — a mesma família do `in-data-[variant=dialog]` que sobreviveu
à remoção da variante do `Command` e passou a não casar com nada.

### O primeiro consumidor de produto

`account`, `settings`, `plans` e `members` declaravam **a mesma string** —
`mx-auto w-full min-w-0 max-w-xl` — em quatro `layout.tsx` de dez linhas. Hoje
são `<Container>`.

Elas perderam junto o `min-w-0`, que **não fazia nada**: medido, 400px e a
região de dentro rolando, com e sem. Num flex de **coluna** o tamanho mínimo
automático vale no eixo vertical — a mesma medição que apagou o
`PageSectionContent` na rodada 15. Quatro cópias de uma classe inerte, e outras
quatro cascas que já a omitiam.

### Dois defeitos meus da rodada anterior

- **`Omit<VariantProps<typeof containerVariants>, "size">` era tipo morto.** Com
  uma variante só, omiti-la deixa `{}` — verificado com sonda de tipo, `keyof`
  resolve para `never`. Ele não acrescentava nem restringia nada no tipo das
  props. É o equivalente em tipo da classe morta que esta base já documenta
  três vezes.
- **O padrão estava escrito duas vezes**, na desestruturação e em
  `defaultVariants`. Hoje é uma, e `DEFAULT_CONTAINER_SIZE` existe só para o
  `data-size` não o adivinhar — com o teste impedindo que os dois se separem.

### O que não entrou, e a contagem que decide

- **`asChild`** — zero demanda. As nove cascas são `<div>`, e o `<main>` da
  tela já é o `SidebarInset`. Entra no dia em que uma tela pedir `<section>`.
- **Área segura horizontal.** `env(safe-area-inset-left/right)` não aparece
  **nenhuma vez** no repositório — só a vertical. É lacuna real para um PWA em
  paisagem num telefone com entalhe, mas o dono da calha é a casca do app, e
  somá-la aqui não consertaria tela nenhuma.

### A única mudança visível: o catálogo passou de 32 para 24px de calha

`ds-shell` foi de `size="lg"` para `size="xl" gutter="page"`, e com isso perdeu
o terceiro degrau (`lg:px-8`) que só ele tinha. A alternativa era devolvê-lo por
`className` nas duas chamadas — o que reintroduziria à mão exatamente o número
que esta rodada tirou.

Ficou sem. Vinte e quatro é a margem que o app inteiro usa no desktop, e uma
página de documentação respirar na mesma medida do produto que ela documenta é
resposta melhor que um degrau próprio.

### O catálogo dizia ser atomic design, e 43% dele estava na camada errada

A categoria de cada peça saía de **dois `Set` escritos à mão** no `registry.ts`,
e o que não estivesse em nenhum dos dois caía em **"Organismos" por
*fall-through* silencioso**. Medido: **32 dos 75 componentes na camada errada**.

Foi assim que `Typography` — nove componentes de texto independentes, que não
compõem nada — apareceu ao lado da `Sidebar`; e `Container`, uma `div` com
largura, ao lado do `Dialog`. Na direção oposta, `Field`, `InputGroup` e
`SearchInput` se declaravam **átomos** importando outros componentes (2, 3 e 1).
*(Esta frase listava `Select` também, e estava errada: `select.tsx` importava
zero de `ui/`; ele saiu de Átomos pelos dez exports, e voltou na rodada da
hierarquia.)*

O comentário que vivia no arquivo já previa a falha — *"com 80 itens, a
repetição é onde a lista começa a mentir"* — e a saída que ele propunha (derivar
do slug) **foi o que produziu a mentira**.

Hoje é um mapa explícito, exaustivo por tipo: **um componente novo sem camada
não compila**. E a regra é a canônica, escrita no topo do arquivo:

| Camada | O teste |
| --- | --- |
| Fundações | é decisão em `globals.css`, não componente |
| Átomos | não compõe componente do sistema, e é **um** elemento |
| Moléculas | várias peças que só existem juntas, compondo no máximo átomos |
| Organismos | compõe duas ou mais moléculas, ou compõe molécula **e** tem estado próprio |
| Templates | o que estrutura a página, e não o que ela contém |
| Padrões | não é componente |

**`Templates` é o nível que faltava.** O modelo original tem cinco, e este
catálogo tinha quatro mais duas de casa. `PageHeader` e `PageSection` dispõem
conteúdo numa página — é a definição do nível. `Container` **não** foi com eles:
pelo teste canônico ele é indivisível, e é átomo.

[`taxonomy.test.ts`](src/app/designsystem/taxonomy.test.ts) tranca isso, e a
asserção que vale é a **2** — *nenhum átomo compõe outro componente*. Ela teria
pego os quatro. E pegou dois erros meus nesta mesma rodada: `sheet-drag-handle`
(que consome o contexto do `Sheet`) e `kbd-shortcut` (que compõe o `Kbd`), os
dois classificados como átomo por engano.

**A marca "movido" é temporária.** Trinta e quatro entradas trocaram de lugar de
uma vez, e quem tem o mapa antigo na cabeça procuraria `Table` em Organismos.
Ela sai de `MOVED_FROM` no registry — a frase no índice, um ponto na lateral — e
**desaparece quando aquele campo for apagado. A próxima rodada que tocar o
registry apaga.** Duas marcas nasceram mentindo, apontando para a camada em que
a peça já estava; a asserção 5 do teste é o que as pegou.

### O `Container` absorveu "Espaçamento e largura" — no código

Havia uma Fundação com esse nome cuja **fonte declarada era
`src/components/ui/container.tsx`**. Ela documentava as duas coisas, e o
componente entregava só uma: os três blocos dela eram o `Container`, e a tabela
de props dela era o `size` dele.

A fusão não foi de texto. O componente ganhou o eixo **`stack`**, que declara o
ritmo do que ele contém — o que era escrito à mão em toda chamada:
`flex flex-col gap-8` quatro vezes nas páginas, `flex gap-8` no casco do
catálogo, `flex min-w-0 flex-1 flex-col gap-4` na casca do app.

E entraram quatro tokens semânticos, cada um com consumidor contado:

| Token | Valor | O que nomeia |
| --- | --- | --- |
| `--space-identity` | 0 | o par de identidade — 5 componentes já o aplicam |
| `--space-inline` | 8px | dentro de um bloco |
| `--space-block` | 16px | entre blocos — o `gap` do `PageSection` |
| `--space-section` | 32px | entre seções — o `stack` do `Container` |

**Eles não são a escala.** Redeclarar 4/8/12/16 seria copiar o Tailwind para
dentro de casa; estes nomeiam as quatro distâncias que o sistema já decidiu. A
razão de 2 para 1 entre `inline` e `block` é o que separa "mesmo assunto" de
"outro assunto" — medido na rodada do `HoverCardBody`.

E eles **são consumidos**: `PageSection` e `Container` leem os tokens em vez de
cravar `gap-4`/`gap-8`. Token que ninguém lê nasce morto.

### O verificador de tema escuro não distinguia cor de distância

Ao entrar, os quatro `--space-*` apareceram no aviso *"declarados em `:root` e
ausentes em `.dark`"* — junto de `--scroll-fade-h`, `--scroll-fade-x-h` e
`--scroll-fade-floor`, que **já estavam lá como falso positivo**.

A causa era uma lista de prefixos escrita à mão (`radius|z-|duration|ease|
mobile-|text-`), com o mesmo defeito de toda lista escrita à mão: ela não previu
os tokens que vieram depois. A decisão passou a ser **pelo valor** — função de
cor ou hexadecimal precisam de par; medida não precisa. Um aviso com falso
positivo conhecido é um aviso que as pessoas param de ler.

Custou uma segunda medição: a primeira versão aceitava `var(` como sinal de cor,
e acusou `--mobile-bottom-pad`, que é `calc(var(a) + var(b) + env(c))` — uma
conta de distância. Só o **apelido puro** (`--x: var(--y)`) entra.

### Três palavras para "não desenha nada"

Medido: **`plain` em 5 componentes, `ghost` em 4, `bare` em 1** — um conceito,
três palavras, dez arquivos. Ficou `plain`, que já era maioria.

O `Toggle` tinha uma nota defendendo o nome `ghost`, e ela continua correta no
que dizia: ele não se chama `tertiary` porque não tem escada de três degraus. Só
que a nota defendia `ghost` contra `tertiary` — **não contra `plain`**.

Junto saíram os `default` sobreviventes: `size="default"` do `Badge` e do
`SidebarMenuButton`, e `variant="default"` do `Item`, do `ItemMedia` e do
`SidebarMenuButton`. É o nome que já saiu de `Button`, `Input`,
`SelectTrigger`, `NativeSelect` e `Container` por dizer *o padrão* em vez de
dizer a medida.

### O `Badge` misturava três eixos num nome só

`variant` carregava **peso** (`primary`, `secondary`), **forma** (`outline`) e
**tom** (`success`, `warning`, `income`, `expense`). Tom é o que `Alert`,
`StatCard`, `Timeline`, `Progress`, `Separator` e `AnnouncementBar` chamam de
`tone` — o `Badge` era o único a discordar, que é palavra por palavra a correção
que a rodada do `Alert` fez quando **ele** era o único.

Hoje são dois eixos: `variant` (`soft` | `outline`) e `tone` (sete cores). O
cruzamento criou uma combinação que não existia — **contorno na cor do tom**;
antes o `outline` só sabia ser cinza.

**Foram 71 chamadas reescritas por codemod, e o compilador isolou as que
sobraram.** Elas eram todas do mesmo tipo: ternários que misturavam os dois
eixos, como `variant={bill.is_active ? "success" : "outline"}` — "ativa" é cor e
"inativa" era forma. Um codemod não sabe disso; cada uma virou duas props
explícitas. Mais quatro modelos a montante (`momentumTone`, `statusTone`, o
delta do KPI e o da fatura) que carregavam o nome `variant` para um dado que
sempre foi tom.

### `KbdShortcut` existia sem página e sem entrada

Ele estava em `src/components/ui/` desde a rodada da paleta, **usado pela busca
do próprio catálogo**, e não aparecia nem no registry nem em `docs/`. É o
invariante 8 — *"componente novo entra em três lugares na mesma mudança"* —
violado pelo próprio design system. Ganhou os dois.

**E depois deixou de existir.** O `Kbd` absorveu o acorde em `keys`, e a página
que esta rodada criou virou a do `KbdGroup`. A história fica porque o defeito
que ela mede — o invariante 8 violado pelo próprio design system — não depende
de o arquivo continuar existindo.

### As duas páginas de texto eram uma, e a Fundação absorveu os nove componentes

O catálogo tinha **duas páginas para texto**, e as duas declaravam o **mesmo
`source`** — `src/components/ui/typography.tsx`. A Fundação `tipografia` e o
Átomo `typography` importavam os mesmos nove componentes e os renderizavam com
as **mesmas strings** (`<H1>Suas finanças</H1>`, `<H2>Este mês</H2>`,
`<Muted>Parcelas futuras não entram neste total.</Muted>`), e cada uma tinha a
própria cópia da `PropsTable title="Componentes"`, com as mesmas seis linhas.

**As duas cópias já tinham divergido**, que é o que sempre acontece: a de
`tipografia` tipava a linha "H1 … H4" como `ComponentProps<'h1'>` — afirmando
que `H4` aceita props de `h1` — e as **seis** descrições eram diferentes nas
duas. Não havia mecanismo que as reconciliasse.

**A direção é a inversa da rodada 17, e o critério não é volume.** Lá o
`Container` absorveu a Fundação "Espaçamento e largura", porque a Fundação
**era** o componente e não sobrava nada depois de subtraí-lo. Aqui, subtraindo
os nove componentes, sobram três famílias, oito degraus `--text-*`, `.nums`,
`.page-title`, `.wordmark` e quatro notas — e **tipo é um dos cinco pilares que
a própria régua das Fundações nomeia** (`registry.ts`: "os átomos abstratos:
cor, tipo, forma, movimento, camada"). O critério é qual dos dois nomes é o
assunto.

**Nenhuma das duas estava na camada errada**, e é isso que tornava a confusão
difícil de nomear: os nove componentes são átomos pelo teste do arquivo (nenhum
compõe outro), e as famílias são Fundação pelo teste dela. O defeito não era a
taxonomia — era duas páginas ensinarem a mesma coisa.

**O slug é `typography` e o nome é "Tipografia", e a assimetria é forçada por
mecanismo.** A asserção 1 do `taxonomy.test.ts` exige que todo `.tsx` de `ui/`
tenha entrada com o slug do arquivo. É a primeira Fundação com slug em inglês, e
é o preço de a taxonomia ser trancada por teste em vez de combinada. A posição
no `REGISTRY` não carrega decisão: dentro de cada categoria a ordem é
alfabética pelo nome, trancada pela asserção 7.

**`entry()` não servia, e não por gosto.** `Layer = Exclude<Category,
"Fundações" | "Padrões">`, então a chave não compila em `LAYER`; e sem a chave,
`categoryForSlug` **lança** e derruba todas as rotas `/designsystem/*` no import
do módulo. A entrada voltou a ser literal, como `marca` e `iconografia` — as
outras duas Fundações que apontam para código.

**O que não mudou, e por decisão.** Zero linhas em `src/components/ui/` e zero
em `globals.css`. A sobreposição `H1`↔`PageHeaderTitle` e
`H2`/`H3`↔`PageSectionTitle` continuou no código nesta rodada e passou a ser
**documentada** — a rodada da composição, mais abaixo, a resolveu:
duas notas dizem qual usar e por quê. Consertar significa escolher um dono por
nível de título e apagar o perdedor, e isso é rodada própria — com o candidato
já contado abaixo.

**As medidas que a página passou a carregar**, e que não existiam em lugar
nenhum do catálogo: `.page-title` é aplicada em **exatamente dois lugares**
(`typography.tsx:10` e `page-header.tsx:222`); `.wordmark` como classe, em
**um** (o espécime de Marca — o app escreve o nome com o SVG); `font-heading`
aparece **32 vezes e nenhuma delas muda um pixel**, porque `--font-heading` é
apelido de `--font-sans` — não é token morto, é o gancho para o dia em que os
títulos deixarem de ser Inter, e trocar custa uma linha em vez de 32; e **2 dos
9** componentes têm consumidor no app.

**O teste não pegou nada, e é o achado de método.** Nenhuma das sete asserções
quebrou com esta mudança: `taxonomy.test.ts` tranca a **taxonomia**, não a
duplicação — duas páginas para o mesmo arquivo sempre foram legais. A que
faltava entrou como a **6**: *nenhum arquivo de `ui/` é fonte de duas entradas
fora de Padrões*. Verificado contra o commit anterior, ela falha lá
(`["tipografia","typography"]`) e passa aqui. `Padrões` fica de fora porque
`formularios`, `vazio-carregando` e `graficos` apontam de propósito para
`form.tsx`, `empty-state.tsx` e `chart.tsx`: um Padrão é uma decisão que
atravessa telas cuja casa por acaso é um componente.

**O `MOVED_FROM` saiu inteiro**, cumprindo o prazo que a rodada 17 escreveu
aqui. A marca de `typography` passaria a mentir num segundo eixo — diria "veio
de Organismos" quando a peça agora vem de Átomos —, e a asserção 5 não pegava
isso, porque ela só comparava com a camada atual. Foram seis remoções em quatro
arquivos (`registry.ts`, `ds-shell.tsx`, `page.tsx`, `taxonomy.test.ts`), e com
elas saíram as asserções 5 e 6 antigas.

**A tabela de tamanhos estava quebrada, e ninguém tinha medido.** Ela veio
literal da página antiga: três colunas, duas com largura fixa, dentro de uma
célula de um terço do `Group layout="grid"`. Medido, sobravam **46px** para a
coluna de uso, e "título de tela no desktop" saía em **seis linhas de uma
palavra**. Hoje a tabela ocupa a linha inteira no `md` e dois terços no `xl`
(218px de uso, uma linha), e abaixo de `sm` o uso desce para a própria linha em
vez de espremer — 311px, uma linha, medido a 375px.

**O que ficou de fora, e é dito em vez de silenciado.** As dez contagens
escritas à mão nos comentários de `page.tsx` e `ds-shell.tsx` envelheceram de 90
para 89 páginas — mas elas já divergiam entre si antes desta rodada (87, 88, 89
e 90 para o mesmo número), então o defeito é *contagem à mão em comentário*, e
corrigir dez números o reproduz. E não há redirect de `/designsystem/tipografia`:
são zero links internos no repositório, e a rota é de desenvolvimento.

### A taxonomia media o embrulho, e a régua passou a ser a hierarquia que cresce

A rodada 17 tirou 32 componentes do lugar errado e deixou uma régua escrita:
átomo é o que *"não compõe componente do sistema e é **um** elemento"*. Lida
na prática — importa zero de `ui/`, exporta um —, ela media a **API do
embrulho**, e não a peça. A medição que a derrubou:

| | camada | exports | importa de `ui/` | primitivas Radix por dentro |
| --- | --- | --- | --- | --- |
| `Slider` | Átomo | 1 | 0 | **4** — root, track, range, thumb |
| `Select` | Molécula | 10 | 0 | as mesmas peças, expostas |

A diferença era só onde a composição mora — dentro do arquivo ou na API. Uma
refatoração de assinatura (`<Select options={…} />`) mudaria a camada sem mudar
um pixel. E a cláusula não distinguia nada: **21 dos 21 átomos importavam
zero** — inclusive o `Input`, que importa exatamente o que o `select.tsx`
importa (as réguas de `field-classes`, e nenhum componente). Do outro lado, **26
das 38 moléculas também importavam zero**, então a definição *"grupos de
átomos"* não descrevia dois terços delas.

**A régua nova é a do modelo, nas palavras do dono**: *"os átomos são
indivisíveis, as moléculas são feitas de átomos, os organismos são feitos de
moléculas e os templates são feitos de organismos"*. Três cláusulas fecham as
bordas: **anatomia interna não é composição** (trigger/content/item,
track/thumb, `<option>`); **especializar um átomo sobre outro continua átomo**
(os dois exemplos que ela teve — `KbdShortcut` sobre `Kbd`, `MoneyInput` sobre
`Input` — foram **absorvidos como `prop`** pelas rodadas seguintes, e entre os
átomos ela ficou com **zero** casos; segue valendo uma camada acima, em
`StatCard` sobre `Card`); e
**quem contém organismo é organismo** (`Breadcrumb` carrega um `DropdownMenu`).
`Container` fica átomo — indivisível, uma `div` com largura —, por decisão.

**22 mudaram de camada; 54 ficaram.**

| sobem para Átomos | por quê |
| --- | --- |
| `select`, `native-select` | um controle; `NativeSelect` renderiza **um** `<select>` |
| `radio-group` (hoje cindido: o átomo é o `radio`, e o grupo virou Molécula), `input-otp` | um campo, um valor |
| `avatar`, `tooltip` | um objeto (imagem e fallback são estados); um rótulo que aparece |
| `money-input`, `kbd-shortcut` (os dois hoje absorvidos como `prop` — `money` no `Input`, `keys` no `Kbd`) | especialização |

| sobem para Organismos | por quê |
| --- | --- |
| `card`, `popover`, `hover-card`, `edge-panel` | superfície com **faixas** — a anatomia do `Dialog` |
| `stat-card` | especializa o `Card` |
| `dropdown-menu`, `context-menu`, `menubar`, `navigation-menu` | grupos, separadores, submenus |
| `table`, `accordion`, `tabs`, `timeline`, `stepper` | a **unidade** é uma molécula (linha, `Collapsible`, gatilhos + painel) |
| `chart`, `carousel`, `sonner` | contêiner + legenda + tooltip; trilho + setas; pilha de toasts |

Contagens: **7 · 29 · 13 · 31 · 2 · 7**. Moléculas encolheu para 13 e são
exatamente as que o Frost nomeia — rótulo + campo + erro, campo + botão,
ícone + título + texto + ações, mídia + texto + ações.

**O que o teste tranca, e o que não.** A asserção 2 relaxou para *"um átomo
importa no máximo um componente de `ui/`, e ele é átomo"* — continua barrando
`Field` (2), `InputGroup` (3) e `SearchInput` (molécula), e passa a aceitar a
especialização. A 3 ganhou uma linha: molécula não importa organismo. A **7**
entrou: dentro de cada categoria o `REGISTRY` está em ordem alfabética pelo
`name` exibido (`sonner` é "Toast"), com `localeCompare("pt-BR")` fixo no teste
porque o app não ordena em runtime. Ela reprovava nos seis grupos antes do
reorder. O que o grafo **não** alcança — a anatomia de um `Select`, a diferença
entre especializar e compor — é decisão, e mora nos comentários do `LAYER`.

**Duas inversões da rodada 17, registradas como inversão e não apagadas.** Ela
dizia que a asserção 2 tinha pego `kbd-shortcut` "classificado como átomo por
engano"; ele volta a átomo, porque especializar o `Kbd` não é compor. *(E na
rodada seguinte deixou de ser questão: o `Kbd` absorveu o acorde, e a
especialização que era o exemplo virou a própria peça.)* E dizia
que quem tem o mapa antigo "procuraria `Table` em Organismos"; ele volta para
lá. A história fica; o que mudou foi a régua.

**A ordem alfabética tem um custo, dito.** A primeira página do catálogo passa
a ser **Camadas (z-index)**, e a ordem pedagógica das Fundações (cor → tipo →
forma → movimento → camada) que a rodada da Tipografia acabou de registrar
deixa de existir. O ponto de entrada sobrevive: "Comece aqui" resolve `cores`
por `getEntry`, não por posição. E os comentários `// ── Átomos ──` do array
estavam **desalinhados** — o bloco "Átomos" tinha doze moléculas, o
"Organismos" não tinha organismo nenhum —, porque a categoria vem do `LAYER` e
a posição no array era só a ordem em que cada `entry()` foi escrita.

**O que não foi feito.** 22 páginas trocam de grupo sem marca de "movido" — o
`MOVED_FROM` saiu nesta mesma série, e a busca cobre. As contagens à mão em
comentários de `page.tsx` e `ds-shell.tsx` continuam sem caça, pela decisão
anterior. E a asserção 2 tem um buraco semântico conhecido: um átomo que
importa **um** átomo para compor, e não para especializar, passa — o teste
tranca a mecânica, e a régua escrita tranca o resto.

### Um componente não reimplementa a camada de baixo

A pergunta "o `Form` não devia ser molécula, já que tem input e botão?" tinha
uma resposta curta — o `CustomForm` é só o `<form>` com a política do Enter,
nenhum input, nenhum botão — e uma consequência longa: **o design system
reimplementava a si mesmo por dentro**, e o auditor não via, porque a regra C
tem `if (!isUi)` de propósito (é onde os átomos nascem). Medido nos 76 arquivos:

| O que | Quantos | Exemplo |
| --- | --- | --- |
| `<button>`/`<a>` crus onde `Button` existe | 8 | `pagination.tsx` — `<a className={buttonVariants(…)}>`, o anti-padrão que a rodada do `AlertDialog` documentou ter consertado |
| tipografia à mão | 22 | `page-section.tsx` — `<h2 className="font-heading … font-semibold tracking-tight">`; **nenhum arquivo de `ui/` importava `typography.tsx`** |
| superfície de campo copiada | 5 | `textarea.tsx` — `border border-input bg-input-fill/30` enquanto `Input` veste `field-classes` |
| valores literais em átomos | 13 | `switch.tsx` — `h-[18.4px] w-[32px]` |
| ícone do conjunto errado | 2 | `mobile-sheet-form-chrome.tsx` — renderizava 16px com o glifo de 20 |

**A regra, decidida pelo dono**: cada camada compõe a de baixo — átomo usa
fundação, molécula usa átomo, organismo usa molécula — lida como *"onde existe
a peça de baixo, ela é obrigatória"*. Onde a estrutura é interna (um
`DropdownMenu` é 15 primitivas Radix, não há molécula do sistema dentro dele)
não há o que compor. **O teste que decide cada caso**: a peça de baixo é a
peça de baixo quando dá pelo menos duas das declarações do componente e o que
sobra é adição (`text-pretty`, `max-w-*`, `nums`); quando três de quatro são
anuladas por `className`, vestir é reimplementar ao contrário, e fica cru com
o motivo escrito. **27 mudaram, 49 são conformes.**

**A tipografia virou a base que o sistema veste.** Os nove átomos ganharam
`asChild` (o `Slot` do `Button`) e o `H2` perdeu a régua — `border-b
border-border pb-2`, herança do shadcn, zero consumidores, e o `PageSectionTitle`
é um `<h2>` **sem** régua: um átomo que o template precisa desfazer para vestir
não é a peça de baixo. Dezessete arquivos passaram a importá-lo:
`PageHeaderTitle` sobre `H1` e `PageSectionTitle` sobre `H2` trocam só o corpo
por `className` (verificado: `cn("text-3xl text-(length:--page-title)")` devolve
só a variável), `EmptyStateTitle` sobre `H4`, os títulos de vazio de `Command` e
`Timeline` sobre `P`, e `Muted`/`Caption` em toda descrição, legenda e rótulo —
`Card`, `Dialog`, `AlertDialog`, `Popover`, `HoverCard`, `Field`, `Item`,
`Table`, `Select`, `DescriptionList`, `Pagination`, `FormPickerPopover`. Os
títulos de superfície (`CardTitle`, `PopoverTitle`, `AlertTitle`, os dois
`DialogTitle`) **ficaram**: `H4` daria tamanho, peso e tracking que os quatro
anulam, e o `AlertTitle` ainda perderia a tinta do tom.

**Dois fatos do `twMerge` que a medição corrigiu.** O primeiro estava previsto:
tamanho contra tamanho e entrelinha contra entrelinha se resolvem, então não
houve eixo novo. O segundo não: **`text-*` derruba `leading-*` quando vem
depois**, porque o utilitário de tamanho também escreve `line-height` — e por
isso a sobrancelha (`Caption` + `text-2xs`) e o `TimelineTime` saíram com
**zero** delta, 16px como antes, em vez dos 15,1 que o plano previa. Os deltas
reais, medidos: os títulos de vazio de `Command` e `Timeline` foram de 20 para
**22,75px** de entrelinha (`P` traz `leading-relaxed`), e as legendas `text-xs`
de 16 para **16,5** (`Caption` traz `leading-snug`). Regra escrita no arquivo:
**com `asChild`, a sobrescrita vai no `className` do átomo, nunca no filho** —
o `Slot` concatena sem `twMerge`.

**`Button` onde havia botão cru.** `PaginationLink` e `PaginationEdge` viraram
`<Button asChild><a/></Button>` (o `isActive && "font-medium"` saiu: já era a
base); medido, 32×32 com a ativa `secondary`, o número embrulhado em
`button-label` e `tabular-nums`. O `FormPickerPopoverItem` virou `Button
variant="tertiary"` com `h-auto min-h-11` e **um `<span>` de conteúdo como único
filho direto** — é o que impede a maiúscula inicial do CTA de alcançar "iFood"
—, e sem `data-size`, porque 44 não é degrau. O gatilho do `BreadcrumbMenu`
virou `Button icon-xs` (24×24, medido). As setas do `Calendar` deixaram
`buttonVariants` nas `classNames` e viraram `components.PreviousMonthButton /
NextMonthButton` renderizando `Button` — o `react-day-picker` entrega `type`,
`className`, `tabIndex`, `aria-disabled`, `aria-label`, `onClick` e o `Chevron`
como filho, e **não** entrega `disabled`, por isso o `aria-disabled:opacity-50`
fica. Junto, o objeto `components` entrou num `useMemo`: eram arrows inline
recriadas a cada render, e o React remontava a subárvore. Medido: depois de
clicar "próximo mês", o foco continua na seta, **e é o mesmo nó**.

**A superfície de campo tem uma régua, e agora sete a vestem.** `Textarea`,
`NativeSelect` e `InputGroup` entraram. Medido contra o `Input`: borda, fundo e
raio idênticos nos três. O `NativeSelect` perdeu os dois desvios que o backlog
já nomeava (`data-[size=sm]:rounded-md` e o `dark:hover:` sem par), ganhou `lg`
e `xl` pela `fieldTriggerSizeClassName`, e a rampa de 16px do telefone; a
opacidade do desabilitado saiu da casca (se somaria à do controle) e foi para o
chevron. O `InputGroup` é uma **moldura**, e lê os estados pelo controle de
dentro — por isso entraram três variantes `fieldGroup*ClassName` escritas por
extenso sob `has-…` (classe montada em runtime não existe), com
`field-classes.test.ts` derrubando cada token da régua ao prefixo da moldura;
ele já tinha divergido, faltava o `dark:…border-destructive/50`. O
`InputGroupAddon` virou `Label`: seis das oito classes do átomo já estavam
escritas à mão ali; o que ele acrescenta é `leading-none`, medido em 14px nos
quatro alinhamentos, e ficou. O `InputOTPSlot` **não** veste — é célula de
superfície segmentada, não campo — e a tabela do cabeçalho de `field-classes`
diz isso.

**Os literais.** `Switch` de `h-[18.4px] w-[32px]` para `h-4.5 w-8` (18×32
medidos, polegar centrado com delta 0). O gráfico ganhou `rounded-xs` — e o
token `--radius-xs: calc(var(--radius) * 0.2)` entrou em `globals.css`, porque
sem ele `rounded-xs` caía no 0,125rem do tema padrão do Tailwind; medido, 2px.
`item.value.toLocaleString()` era **sem locale** — formatava na língua do
navegador — e virou `numberBR()` em `formatters.ts`. A sobrancelha ganhou
`--tracking-eyebrow: 0.18em` (1,98px a 11px, medido). `w-[2px]` → `w-0.5`,
`top-[60%]` → `top-3/5`, o `XMarkIcon` do chrome de folha para o conjunto 16
(o `Button icon-sm` já força 16px). O auditor passou a aceitar `inherit` e as
cores de sistema `Canvas`/`CanvasText`, e a pular o conjunto do Heroicons nos
`DRAWN_SVG_FILES` (o `Spinner` gira o mesmo desenho de 16 a 32). **`ds:audit
-- src/components/ui`: 16 → 0.**

**As exceções, e por quê.** `sidebar`: vestir `Button tertiary` no
`sidebarMenuButtonVariants` exigiria sete contra-classes (`justify-start`,
`font-normal`, `border-0`, `focus-visible:ring-sidebar-ring`,
`dark:hover:bg-sidebar-accent`, os `aria-expanded:*`, o `translate-y`) — o cva
é a régua de baixo daquele chrome, e o arquivo já distingue: `SidebarTrigger`,
que é ação, **é** `Button`; `MenuAction` tem 20px de caixa (o menor `Button` é
24); `Rail` é alça com `tabIndex={-1}`. `ComboboxTrigger`: é campo, veste
`field-classes`, e `Button` daria a superfície de que ele saiu. O campo da
paleta (`command.tsx`): imita o gatilho do cabeçalho, decisão anterior. Os
cinco estão escritos nos arquivos.

**A taxonomia precisou de uma linha.** `select.tsx` (Átomo) passou a importar
`typography` (Fundação), e a asserção 2 reprovaria. `camadaNoGrafo` trata
`typography` como Átomo nas asserções 2 e 3: os nove são átomos pelo teste do
arquivo; a **página** é a Fundação de tipo. Vestir a Fundação de tipo não é
compor.

**O que ficou de fora, com nome.** Um `SurfaceTitle` (ou
`surfaceTitleClassName`) para os seis títulos `font-heading font-medium
text-balance`. `Muted` sem a entrelinha de `P` — cinco call sites compensam com
`leading-relaxed`/`leading-normal` à mão, e a doc diz que `Muted` "é o mesmo
corpo de `P`". `Switch` e `SidebarMenuSubButton` ainda dizem `size="default"`.
O `FieldLabel` de cartão de escolha escreve uma sexta grafia do anel. O
`border-[1.5px]` do gráfico não tem token. O `Button tertiary` continua sem
par `active:` — o item do seletor o traz por `className`, mais um consumidor
pedindo o conserto no `Button`. E o **app** não foi tocado: os 51 primitivos
crus das telas são a rodada seguinte, com a regra já escrita.

### O `Form` virou molécula, e a inversão fica registrada

A seção acima respondeu "o `Form` não devia ser molécula, já que tem input e
botão?" com um fato: ele **não** tinha — era o `<form>` e a política do Enter,
mais nada. A resposta certa não era manter a classificação; era **fazer o
componente ser o que o nome promete**. A régua não mudou: um componente compõe a
camada de baixo. O que mudou foi que agora há o que compor.

**O que cada peça fecha, com a contagem que a pediu:**

| Peça | Compõe | A contagem |
| --- | --- | --- |
| `FormInput` / `FormTextarea` | `Field` + `Input`/`Textarea` | **104 campos à mão** em 27 arquivos, 5 dialetos de espaçamento — e `Field` com **zero** consumidores fora do catálogo |
| `FormSubmit` | `Button` + `Spinner` | **46 botões de enviar** escritos à mão; o *pending* em **76 strings**, com três grafias de reticência |
| `FormCancel` | `Button` | **173 `variant="outline"`** contra a tabela do rodapé, que diz `tertiary` |
| `FormActions variant="sticky"` | — | o `MobileSheetFormFooter` que faltava: **5 arquivos** derivavam a classe do rodapé à mão, com três `!important` |
| `FormError` | `P` | **3 contratos de acessibilidade** para a mesma frase |

**O `id`, e até onde o contexto chega.** `Form` gera um `id` com `useId` e o
publica em contexto; `FormSubmit` escreve `form={id}` **sempre**. Dentro do
`<form>` é inócuo — o `submitFrom` acha o botão na primeira busca. Fora dele é o
que faz o Enter funcionar, e **contexto do React atravessa portal**: medido no
catálogo, o Enter num campo do `DialogBody` aciona o botão do `DialogFooter`, com
`form` e `id` iguais. O que ele **não** atravessa é *slot irmão*: quando outro
componente renderiza o rodapé ao lado do formulário — o `footer=` do assistente
de categorias —, não há contexto a herdar, e ali `form="um-id"` explícito
continua sendo a resposta. As quatro constantes de string daquele arquivo ficam.

**`role="alert"` e nada mais.** O papel já implica `aria-live="assertive"`, e um
`aria-live="polite"` explícito **vence** o implícito — `role="alert"
aria-live="polite"`, que o `login-form` escreve, é uma região polida chamada de
alerta. Não é redundância, é contradição. E `FormError` não compõe `Alert`:
seria molécula dentro de molécula, que a asserção 3 reprova — quem quer a caixa
escreve `<Alert tone="destructive" variant="plain">` na tela.

**Dois eixos de tamanho, e é de propósito.** `size` vai ao `Input` (a escada de
altura); `fieldSize` é o degrau do andaime — rótulo, ajuda, erro — e herda do
`FieldGroup`. `field.tsx` proíbe ancorar um no outro, porque um `Field` não sabe
que controle carrega.

**O que a mecânica exigiu, medido.** `FieldDescription` se registra **mesmo
vazia**, então ela é renderizada condicionalmente — senão o `aria-describedby`
apontaria para um parágrafo vazio; `FieldError` devolve `null` e desregistra, e
pode ir incondicional. Em `FormSubmit`, `type` e `variant` vêm **antes** do
espalhamento (uma exclusão pode pedir `destructive`) e `disabled`/`aria-busy`
vêm **depois** (o estado de envio não pode ser sobrescrito). O `sticky` **não**
traz área segura: ela é da superfície, e o casco da folha já a carrega — somar
dobraria; e não desenha fio nem tinta, que é a regra J.

**Um achado do navegador:** dentro de `<DialogClose asChild>`, o `data-slot` do
`FormCancel` vira `dialog-close` — o `Slot` do Radix resolve o atributo a favor
do pai. O que importa sobrevive (`variant="tertiary"`, `type="button"`), e o
nome que fica é o certo: naquele rodapé, aquele botão **é** o fechar do diálogo.
Quem escrever seletor para o cancelar de um diálogo procura `dialog-close`.

**A página ganhou as cinco formas que o app tem**: empilhado (auth e
configurações), em linha (busca), em diálogo (com o botão portalizado), em folha
no telefone (cabeçalho fixo, corpo rolável, rodapé `sticky`) e com estado
(`pending` ligado, `FormError` com causa real). A demonstração da folha passa
`children` ao `MobileSheetFormStickyHeader` em vez de `title`: com `title` a peça
renderiza um `DialogTitle`, que **lança** fora do contexto do `Dialog` — medido,
e é como a página do chrome já fazia.

**O que não migrou.** As 29 telas: `CustomForm` é alias e elas compilam sem
mudar. Trocar o nome sem trocar os campos e os botões seria diff sem ganho — elas
migram quando migrarem o conteúdo, e aí os 104 campos, os 46 botões e as 11
telas que escrevem a área segura à mão saem juntos.

### O `Kbd` absorveu o acorde, e o `KbdGroup` saiu para Moléculas

Eram três peças em dois arquivos, e a pergunta "por que existem `kbd` e
`kbd-shortcut`?" tinha uma resposta boa — uma tecla, um acorde e uma sequência
são **gestos** diferentes — e uma consequência ruim: **duas entradas e duas
páginas para um tópico só**, com duas `PropsTable` da mesma prop `keys` que já
tinham divergido. Uma enumerava o que a prop aceita, a outra explicava o `mod`,
e nenhuma continha a outra. É o defeito que a rodada da Tipografia pagou, na
escala de um componente.

**O `Kbd` ficou com as duas formas**: `<Kbd>Esc</Kbd>` é a tecla,
`<Kbd keys="mod+k" />` é o acorde. O tipo é uma união — `children` e `keys` não
convivem —, porque duas fontes para o mesmo conteúdo deixam uma em silêncio e
quem escreveu não descobre qual. O `KbdShortcut` foi apagado sem alias: tinha
**um** consumidor real, o gatilho da busca do catálogo.

**A guarda que essa fusão exigiu, e o que ela protege.** O `KbdShortcut`
devolvia `null` até montar, porque a escolha entre `⌘` e `Ctrl` depende do
`navigator`. Subir isso para o `Kbd` sem condição faria **toda** tecla da tela
esperar por uma plataforma que não muda nada — e a legenda do rodapé da paleta
são quatro `Kbd` sem acorde (`↑ ↓ ↵ esc`), que pintariam em branco por um
quadro. `useApplePlatform(ativo)` recebe `keys != null` e sai cedo. Medido no
HTML do servidor da página do `Kbd`: **7 pastilhas**, exatamente as sete teclas
soltas; os acordes não emitem nada e entram depois da hidratação.

**O `KbdGroup` virou molécula, e o `keys` é o que torna isso verdade.** A
decisão do dono foi "ele é a junção dos átomos" — e a medição mostrava o
contrário: ele importava **zero** componentes, porque os `<Kbd>` vinham de quem
chamava. Era mais uma das 26 de 38 moléculas que não compunham nada. Agora
`<KbdGroup keys={["g","h"]} />` renderiza um `Kbd` por tecla, e o átomo é
importado de fato. `children` continua para o que a tabela de nomes não escreve.

**Um `"use client"` que não é pelo hook.** `kbd-group.tsx` não tem hook nenhum,
e precisa da diretiva assim mesmo: `kbd.tsx` passou a ser módulo cliente, e
**todo export de um módulo cliente vira *client reference*** quando um componente
de servidor o importa — inclusive o que não é componente. Sem a diretiva, o
`formatKey()` seria chamado no servidor e estouraria. Hoje nenhum consumidor é
servidor, então é prevenção; e custa zero, porque o `Kbd` que ele renderiza já
arrasta o limite.

**Um defeito achado no caminho.** `docs/command.tsx` desenhava o `⌘K` dela como
`<KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>` — um acorde escrito como
sequência, exatamente o que a nota "Acorde e sequência não são a mesma coisa"
chama de errado e afirmava que **só** a página do `kbd` fazia. Ela mentia por
omissão. E carregava um segundo defeito que a nota não cobre: o `⌘` era literal,
então em Windows a demonstração ensinava a tecla errada — na página do
componente que abre com aquele atalho, cujo `useEffect` aceita
`metaKey || ctrlKey`.

**A taxonomia: cinco asserções mudam de entrada, nenhuma muda de resultado.**
Três coisas que isso expôs:

- **A asserção 6 aponta para o mesmo lugar que a decisão do dono.** Manter o
  `KbdGroup` dentro de `kbd.tsx` e dar página a ele produziria duas entradas com
  o mesmo `source`, e ela reprovaria. Decisão e mecanismo concordaram.
- **A asserção 2 não defende a classificação.** `kbd-group` com uma dep átomo
  passaria como Átomo também; quem defende "Molécula" é só o comentário do
  `LAYER` — que é o que o JSDoc dela já avisa.
- **A asserção 1 é unidirecional** (arquivo → entrada). Uma entrada cujo `.tsx`
  sumiu não é pega por nenhuma das sete; o que salva é `categoryForSlug`, que
  **lança no import** e derruba `/designsystem/*`. Por isso `LAYER` e `REGISTRY`
  mudam na mesma edição.

Contagem viva das camadas: **7 · 27 · 15 · 31 · 2 · 7**. O número da seção da
rodada 17 (`29 · 13`) já estava velho antes desta rodada — o `form` virou
molécula no caminho —, e a decisão de não caçar contagem à mão continua valendo:
o número datado fica onde está, e o vivo fica aqui.

E uma nota honesta sobre a lista dos sem-consumidor: **`kbd` nunca esteve nela**,
apesar de nenhum arquivo de produto o importar — porque `kbd-shortcut.tsx` o
importava, e o medidor conta isso como "consumidor fora do catálogo". Depois
desta rodada quem faz esse papel é `kbd-group.tsx`. É consumo **dentro do
sistema**, e a medida por arquivo o esconde — do mesmo jeito que esconde os sete
de nove exports de `typography` sem uso.

### As duas setas do paginador, e a pasta que o auditor nunca olhou

O dono selecionou a navegação "Anterior/Próximo" do catálogo e perguntou por que
os ícones estavam diferentes. Estavam: a seta da esquerda vinha de
`24/outline` (`stroke-width="1.5"`, `fill:none`) e a da direita de `16/solid`
(`fill`), **no mesmo `size-4`**, decididas pela mesma linha —
`const Chevron = isNext ? ChevronRightIcon : ChevronLeftIcon`.

**Por que sobreviveu: o auditor era cego duas vezes.** `designsystem` estava no
`SKIP_DIRS` **sem uma linha de justificativa**, numa lista que de resto só tinha
`node_modules`, `.next` e `.git`. E mesmo apontado para a pasta ele não pegaria:
a regra G resolve o conjunto pelo `import` e casa `<NomeImportado>` no JSX —
**não seguia indireção**. Medido antes: rodando a pasta explicitamente, G
devolvia 2 achados, os dois falsos positivos, e **nenhum dos reais**. Consertar
uma das duas cegueiras não bastaria; foi preciso as duas.

**O corte passou a ser por regra, não por pasta.** `isCatalog` — irmão do
`isUi` — cala **A, D, D2, D3, H e I**, que são exatamente as seis que uma página
de catálogo **precisa** violar para documentar: `docs/camadas.tsx` escreve
`z-[1]` porque é a escala que ela ensina, `docs/typography.tsx` cita
`text-[10px]` porque foi o que os tokens substituíram, `docs/code.tsx` cita
`text-green-600` como o exemplo que o auditor reprova, e cada peça do catálogo
nasce em `app/` de propósito, porque é demonstração e não tela. Todas as outras
regras passaram a valer. **195 → 4**, e os 4 restantes são falsos positivos
conhecidos.

Duas limpezas entraram junto, e valem para o repositório inteiro: **arquivo
gerado sai da varredura** (o que abre com `// GERADO POR` — eram 14 achados, todos
de `search-index.ts`, texto de espécime concatenado pelo gerador), e
**comentário não é código**. A segunda o arquivo já prometia e não cumpria: o
JSDoc de `lineOf` dizia "remove comentários" e a função só contava linhas.

**A regra G passou a seguir indireção**, nos três padrões reais — `const X =
cond ? A : B`, `{ Icon: Foo }` e `{ icon: Foo }` + `<item.icon>`. Ela **erra para
menos**: se qualquer sítio indireto tiver o corpo ilegível (`${…}` sem `size-`
literal), o arquivo inteiro se cala — é o que mantém `docs/iconografia.tsx`, que
escolhe o conjunto por px, fora do relatório.

**Ela achou 14 pares errados, e 6 estavam fora do catálogo.** No catálogo:
`ds-doc.tsx` (a seta), `page.tsx` (os 4 de "Comece aqui" — no mesmo cartão onde o
`ArrowRightIcon` de 16/solid já estava certo, o mesmo desencontro do paginador) e
`docs/sidebar.tsx` (3 de 24/outline misturados com 1 de 16/solid na mesma barra).
No app, que nenhuma regra alcançava: `dashboard-kpi-cards.tsx` (4×, em `size-3` e
`size-3.5`) e `category-detail-summary-section.tsx` (2×, em `size-3`). Os 14
viraram `16/solid`.

**Uma exceção nomeada, com o motivo:** `app-theme-toggle` faz um crossfade
`outline` ↔ `solid` a 16px, e **o Heroicons não tem `16/outline`** — os conjuntos
micro e mini são só sólidos. Mesma classe de lacuna do círculo do `Spinner`, e a
saída é a mesma: `HEROICON_SET_EXCEPTIONS`.

**As três receitas de botão viraram `Button asChild` — e duas delas contra a
medição.** Eu apresentei o custo e o dono reafirmou; o número de cada uma ficou
escrito no arquivo, que é como este projeto registra decisão tomada contra
medida:

| | contra-classes | o que elas desfazem |
| --- | --- | --- |
| `DocPagerLink` | **2** | `shrink` e `dark:hover:bg-accent`. `className` de 23 para 14 tokens — **vale** |
| `DsNavLink` | **7** | `justify-start`, `font-normal`, `min-w-0` + `truncate` no filho, `dark:hover:`, e 3 para neutralizar o hover do `tertiary` no item ativo. É o mesmo 7 que fez o `sidebarMenuButtonVariants` ficar cru |
| linha de sumário | **3** | `h-auto`, `font-normal`, `bg-clip-border`. `className` de 14 para 13 tokens |

Três fatos do `twMerge` que a conversão obrigou a medir: **`shrink-0` não é
derrubado por `min-w-0`** — sem a contra-classe `shrink` o par não encolhe no
`justify-between` e o `truncate` **nunca dispara** (medido a 320px: com ela, as
duas reticenciam e a página não rola na horizontal); **`dark:hover:bg-muted/50`
não é derrubado por `hover:bg-accent`**, porque são variantes diferentes e no
escuro `&:is(.dark *)` vence; e **`group` convive com `group/button`** — são
classes distintas, e `group-hover:` compila para `:is(:where(.group):hover *)`,
que precisa da literal. Sem essa terceira, as setas parariam de animar.

**A regra J acendeu uma vez, e virou exceção nomeada.** Ver a nota dela acima: o
`PreviewCode` não é uma tira, é a segunda superfície — e o fio faz 5,5× o
trabalho da tinta, medido.

**O que ficou fora, e é o próximo buraco.** As regras **H** e **J** só enxergam
`className="literal"`: o regex não casa `className={cn(…)}`. Medido: **694 de
5.753 sítios usam `cn()` — 12% de ponto cego**. É por isso que a H nunca viu o
`DocPagerLink`, que tinha `hover:` e `active:` dentro de um `cn()`. E os 4 falsos
positivos que sobram no catálogo têm duas causas: a heurística "sem classe de
tamanho = `size-4`" da regra G não enxerga o pai (`ColorTile size="lg"` aplica
`size-5`), e `description=`/`title=` ainda não são tratados como espécime.

### O `MoneyInput` virou `<Input money>`, e o defeito estava nas chamadas

A pergunta que abriu a rodada foi se o `MoneyInput` não devia ser Molécula, "já
que é feito de input, rótulo e texto de ajuda". **Ele não era.** Medido: 80
linhas, **um** import de `ui/` (o `Input`), um `<Input>` no `return`, e zero
rótulo, zero ajuda, zero erro, zero prefixo "R$". O tipo era literalmente
`Omit<ComponentProps<typeof Input>, "type"|"value"|"defaultValue"|"onChange">`.

**Mas a intuição apontava para um defeito real, e ele estava um nível fora.** O
rótulo, a ajuda e o erro que a pergunta imaginava dentro do componente estavam
espalhados pelas **17 chamadas**, em 11 arquivos: `<Label htmlFor>` escrito à
mão nas 17, três dialetos de espaçamento (`space-y-1.5`, `space-y-2`,
`grid gap-2`), dois de rótulo, e **zero `aria-invalid`, zero
`aria-describedby`** — um campo de dinheiro inválido não era anunciado por
leitor de tela em lugar nenhum do app.

**A resposta não foi reclassificar; foi fazer o componente ser o que o nome
promete** — a mesma inversão que o `Form` registrou. Só que o nome que promete
não era `MoneyInput`: era o `Input`. Ele absorveu o modo, como o `Kbd` absorveu
o acorde em `keys`.

**A união é discriminada, e os dois ramos declaram as mesmas chaves.** O ramo
base fecha `onValueChange` e `mono` com `?: never`; o de dinheiro fecha `type`,
`defaultValue` e `onChange`. É o idioma do `Kbd`, e a razão é mecânica: com as
chaves presentes dos dois lados, um `const { onValueChange, ...rest }` compila em
qualquer ramo e o `rest` não perde nada calado — com `Omit` puro, `onValueChange`
sumiria do `rest` sem aviso. **E é o que dispensa o estreitamento dentro do
componente**: `onValueChange` colapsa para `Fn | undefined`, então o corpo o
chama com `?.()` e nunca pergunta em que ramo está. Um `<input>` só, com o ramo
no corpo — dois componentes internos desmontariam o nó se `money` alternasse, e o
campo perderia o foco.

**O colapso do rest é real, e foi medido nos quatro consumidores de
`ComponentProps<typeof Input>`.** `FormFieldOwnProps & ComponentProps<typeof
Input>` é uma **interseção com a união aninhada**, e desestruturar o rest dela
colapsa os ramos num objeto com `money?: boolean`, que não é atribuível a
nenhum: `Type 'true' is not assignable to type 'false'`. Em `FormInput` a saída
foi **distribuir a interseção à mão**, pondo a união no topo — e ela compilou de
primeira, sem ternário de estreitamento e **sem nenhum cast**. `InputGroupInput`
e `SidebarInput` foram **fixados no ramo base** (`InputBaseProps`): ali o
colapso ainda comeria `onChange`, `type` e `defaultValue`, e não há dinheiro numa
busca de lateral nem dentro de uma moldura de addon — o que a página do
`InputGroup` já dizia. `SearchInput` e `FormPickerPopoverSearch` derivam do
primeiro e ficaram limpos de graça.

**`data-slot` virou `input`, com `data-money` ao lado.** `data-slot="money-input"`
tinha **zero** consumidores — nada em `globals.css`, no auditor, em `lib/`, em
teste, nem em `ENTER_DEFERRAL_RULES`. E `data-money` sobrevive quando o
`FormInput` sobrescreve o `data-slot` com `form-input`, coisa que `money-input`
não fazia: naquele componente o `data-slot` sempre foi nome de encaixe, não
rótulo de tipo.

**Doze das dezessete chamadas viraram `FormInput`; cinco ficaram cruas, e o
motivo de cada uma está escrito no sítio.** Duas são estruturais —
`credit-card-category-alerts` tem rótulo e controle como **células
independentes** de um `grid` com `sm:contents`, e o `flex-col *:w-full` do
`Field` as colapsaria; o orçamento por linha do `categories-onboarding-wizard`
tem rótulo `sr-only` num controle de largura fixa (`w-[6.75rem] shrink-0`) numa
fileira flex. As outras três são de aparência: os dois campos de valor do
`transactions-filters-panel` têm rótulo `text-2xs text-muted-foreground`, e
`fieldSize` só tem `sm` (`text-xs`) e `md` — eles são **2 de 9 rótulos irmãos**
na mesma grafia, e migrar só os dois deixaria dois rótulos de outro corpo e
outra cor no meio do painel. Migrar o painel inteiro é rodada própria.

**Um conserto que veio junto, e não estava no plano.** Seis dos sítios
escreviam `className="text-sm"` no campo de dinheiro. A superfície é
`text-base md:text-sm`, e essa rampa existe para **impedir o zoom automático do
iOS** em campo com fonte abaixo de 16px — o `text-sm` a anulava, e os seis
campos davam zoom no telefone. Com a migração ele saiu: 16px no telefone, 14
no desktop, que é o que o componente sempre prometeu.

**O catálogo perdeu uma página** (89 → 88): a de dinheiro fundiu na do `Input`,
com as três notas movidas literais e uma nova explicando por que virou modo. A
demonstração passou a usar `<FormInput money>` — uma página que ensina o campo
tem de mostrar a forma que a rodada impôs às telas. Mais cinco menções textuais
em `field`, `input-group`, `slider`, `dinheiro` e `typography`.

**E a cláusula "especializar continua átomo" ficou com zero casos.** Ela tinha
dois exemplos, e os dois morreram pelo mesmo motivo: o especializador importava
**um** componente e renderizava **um** elemento — era o átomo com outro nome,
cobrando do catálogo uma segunda página. É o resultado que se devia esperar, e o
comentário da asserção 2 passou a registrá-lo com a pergunta que sobra: **isto é
um componente ou um modo?** A régua segue válida uma camada acima, onde a
especialização é real (`StatCard` sobre `Card`).

### O rádio não tinha átomo, e o `Form` já não era molécula

A pergunta foi pôr o `RadioGroup` em Moléculas e criar um componente de rádio.
Medido, o componente dava razão a ela: 49 linhas, **zero** imports de `ui/`, e o
`RadioGroupItem` era **o círculo cru** — quem usava escrevia o `<div
className="flex items-center gap-2">`, o `<Label htmlFor>` e o `id` à mão, uma
vez por opção. As duas demonstrações do catálogo faziam isso, em duas grafias, e
o catálogo escrever a anatomia é o sinal que esta casa já nomeia: **falta uma
peça**. "Molécula feita de átomos" seria mentira enquanto o rótulo ficasse do
lado de fora.

**`Radio` é o átomo, e ele não renderiza sozinho.** O Radix **não exporta** rádio
independente — só o `Item`, que chama `useRadioGroupContext` e lança fora do
`Root`. É o primeiro átomo do sistema que exige contexto entre arquivos, e o
custo foi aceito com o motivo escrito: reimplementar o `role="radio"`, o foco
itinerante e o `<input>` espelho à mão para ganhar independência seria trocar uma
primitiva testada por uma cópia pior. Contexto de primitiva não é composição —
a mesma conta que faz o `Slider` átomo com quatro peças Radix por dentro.

**Ele não especializa nada**, e por isso não reabre a cláusula que as duas
rodadas anteriores fecharam: `KbdShortcut` e `MoneyInput` foram absorvidos porque
eram *o átomo com outro nome*; aqui é o inverso — a unidade estava dentro e saiu.
É o par `kbd` / `kbd-group` outra vez.

**Duas correções de conteúdo, com número.** O ponto passou de `bg-primary` para
`bg-current`, o que dá trabalho ao `text-primary-accent` do anel — que era
**declaração morta**, porque nada lia a cor do texto. Medido contra a página: no
claro os dois tokens dão 7,34:1 (ali são a mesma cor); no escuro `--primary` dá
**3,64:1** e `--primary-accent` dá **6,78:1**. Nenhum reprova os 3:1 de traço
não-textual, e é por isso que quem decide é a régua e não a norma: o ponto não
carrega texto por cima, ele é marca sobre o fundo. E o `aria-invalid` ganhou
`ring-3`: ele escrevia a **cor** do anel sem a largura dele, então o estado
inválido trocava só a borda — a família do "Desfazer" do toast, que tinha
`border-color` e nenhum `border-style`.

**O `<label>` embrulha o rádio, e o cartão exige isso.** Não há `useId` nem
`htmlFor`: a associação implícita resolve, e o controle rotulado é o `<button
role="radio">`, que **é** elemento rotulável. O `variant="card"` não teria como
funcionar de outro jeito — a caixa que acende é a mesma que precisa *conter* o
rádio para ler o estado dele com `:has()`. E a `description` vive dentro do
rótulo, entrando no **nome acessível** em vez de num `aria-describedby` que faria
o leitor dizer o texto duas vezes.

**`FormRadioGroup` precisou de um irmão do `FormField`, e o motivo é mecânico.**
`RadioGroupPrimitive.Root` renderiza uma `<div role="radiogroup">`, e `<label
for>` exige um elemento **rotulável** — o navegador ignora sem avisar. O
`FormFieldGroup` rotula por `aria-labelledby` apontando para um `FieldTitle`, que
é a peça que `field.tsx` já reservava para *"o que rotula um grupo, e não um
controle"*. O `Field` fica **sem `role`**: um segundo `radiogroup` em volta
poria um nó entre o grupo e os `role="radio"` dele, que é a regra que este
arquivo já escreve para o `ButtonGroup` em volta de um `tablist`. O
`FieldControl` continua servindo — a raiz é uma `div` de verdade, e os três
atributos que ele injeta são os que um grupo quer.

**Os 4 rádios vestidos de aba voltaram a ser rádio.** Eles anunciavam o padrão
ARIA de abas com zero `tabpanel`, zero `aria-controls` e zero foco itinerante,
para escolher o valor que ia ser gravado. O pior tinha `<Label>Como informar os
valores?</Label>` **solto** — sem `htmlFor`, sem `aria-labelledby` — e o nome
acessível vinha de um `aria-label` que dizia uma terceira coisa. Os
`role="tablist"` do app foram de **10 para 6**, e os 6 que ficam são filtro ou
aba de página, com a chapa (`transactionSegmentContainerClassName`) intacta
porque 8 arquivos ainda a importam.

**E `fullWidth` saiu do `TransactionFormTypeSegment` de propósito.** Dentro de um
`Field` o `fieldVariants` já dá `*:w-full`, então o prop virava no-op — e prop
que não faz nada é a classe morta desta base em forma de API. Removê-lo fez o
compilador apontar os **7** sítios que embrulhavam o componente em `<div
className="space-y-2"><Label>Tipo</Label>`: sete rótulos órfãos que deixaram de
existir, e um oitavo sítio que não tinha rótulo nenhum e passou a ter.

### O `Form` virou organismo, e o teste é que descobriu

Nem eu nem o plano previram: `form.tsx` já importava `field` (Molécula) e passou
a importar `radio-group`, que acabara de virar Molécula. **Duas moléculas**, e a
asserção 3 reprovou.

O achado é maior que o conserto. Pela régua escrita, organismo é quem *"compõe
duas ou mais moléculas, ou compõe molécula **e** tem estado próprio"* — e o
`Form` já satisfazia a segunda cláusula antes desta rodada: ele compunha `field`
e tinha a política do Enter e o `id` em contexto. **Ele estava classificado
errado, e o limiar mecânico da asserção 3 é que expôs.** É a terceira inversão
que este arquivo registra para o mesmo componente: átomo → molécula quando ganhou
as peças, molécula → organismo quando as peças passaram a ser moléculas.

### Três lições de método, e as três são erros meus

**Um agente reportou dois seletores mortos, e os dois estavam vivos.** A
afirmação era que `has-data-checked:` em `field.tsx` nunca acendeu o cartão de
escolha, e que o `Switch` não pintava pelo mesmo motivo. Medido no navegador: o
cartão marcado sai com `oklab(0.66 … / 0.6)` na borda e `oklab(0.5 … / 0.1)` no
fundo; o `Switch` marcado sai `oklch(0.5 0.125 166)`. O Radix de fato **não**
emite `data-checked` — mas o variante do Tailwind 4.2.2 cobre
`[data-state=checked]` também. A "correção" teria mexido em `ui/` sobre premissa
falsa. **Relatório de agente não é medição.**

**Li o DOM no mesmo tique do `.click()`, e "descobri" um defeito que não
existia.** Quatro grupos pareceram não selecionar; com uma espera de quadro, os
quatro selecionam. É a lição que este arquivo já registra três vezes, agora pela
quarta — e desta vez o próprio dado denunciava o erro: a leitura seguinte já
mostrava o estado trocado pelo clique anterior.

**E gastei quatro medições acusando o teclado antes de testar o instrumento.**
As setas não moviam o foco. Instalei um ouvinte de `keydown` e pressionei uma
tecla: **zero eventos recebidos**. O painel do navegador não entrega teclas neste
ambiente, com ele oculto ou à frente. A navegação por setas vem do
`RovingFocusGroup` do Radix e **não foi verificada** — está dito assim, em vez de
afirmada.

**O que ficou medido, e o que não.** Verificados: os quatro grupos selecionam; o
cartão acende nos dois estados; `role="radiogroup"` com `aria-labelledby`
apontando para um `field-title` que existe, e `aria-describedby` para a
descrição. **Não verificados**: as setas (acima) e as telas do app migradas, que
exigem sessão autenticada.

**Uma medida que a previsão errou.** O plano dizia que o cartão horizontal ficaria
em 44px nos dois tamanhos. Medido: **44 no desktop** (220px de largura, uma
linha) e **61 no telefone** a 375px (143px de largura, rótulo em duas linhas),
contra os 40 do trilho que ele substitui. O ganho de acessibilidade é real; o
custo de altura no telefone é maior do que eu previ, e fica escrito.

### A ação do alerta era um pedido, e virou peça — e a da barra também

A pergunta foi se `Alert` e `AnnouncementBar` não deveriam ser átomos. Medido:
`alert.tsx` importava **zero** componentes e as quatro peças eram quatro `<div>`
— a posição exata em que o `Select` estava quando a rodada da taxonomia o
devolveu a Átomos. `announcement-bar.tsx`, ao contrário, importa e renderiza um
`Button` de verdade (o × de dispensar), e por isso é molécula com motivo.

**A leitura melhor foi do dono, e ela inverte a conclusão**: o `Alert` não
compõe nada porque *está errado*, não porque é átomo. A regra da rodada da
composição é *"onde existe a peça de baixo, ela é obrigatória"* — e ela existia.

**O sintoma estava escrito no código.** `AlertActions` alcançava o botão por
**seletor descendente**, cinco regras `[&_[data-slot=button]]:`, e o JSDoc
*pedia* que quem chamasse escrevesse `variant="tertiary"`. Pedir não é garantir,
e este arquivo já registra que *"compensar geometria por seletor é sintoma de
que falta uma peça"*. A contagem confirmou: **6 de 6 chamadas** escreviam a mesma
string — `type="button" variant="tertiary" size="sm"` —, nas três demonstrações
do catálogo, na página da folha e no dashboard.

`AlertAction` é a peça. Com ela, `alert.tsx` passa a importar o átomo e a
classificação de Molécula **deixa de ser herdada** — é a mesma inversão que o
`Form` registrou: a resposta não era mudar a etiqueta, era fazer o componente ser
o que o nome promete.

**O ganho que não estava previsto é do `twMerge`.** Compondo o `Button`, o
`dark:hover:bg-muted/50` do `tertiary` é **removido** da lista de classes —
medido no DOM: sobram `hover:bg-current/10` e `dark:hover:bg-current/10`, e
nenhum `dark:hover:bg-muted`. A versão por seletor tinha de **vencer** aquela
classe por especificidade (0,3,0 contra 0,2,0), deixando a declaração perdedora
no CSS. É a mesma lição que a régua de densidade da `Toolbar` já registra: por
`className` quem decide é o `twMerge`, que remove o degrau conflitante.

**E o `dark:hover:` é obrigatório na peça, não redundante.** `&:hover` e
`&:is(.dark *)` empatam em especificidade e o `dark:` é emitido depois; sem essa
linha, o realce cinza do `tertiary` venceria o tonal no tema escuro — calado, e
só num tema. É a armadilha que o `AppThemeToggle` pagou uma vez.

**A irmã veio na sequência, e trouxe um defeito de tema escuro.**
`AnnouncementBarActions` tinha o mesmo desenho — quatro regras
`[&_[data-slot=button]]:` e um JSDoc descrevendo um botão que ela não renderiza
—, e virou `AnnouncementBarAction`: `Button` `tertiary` `size="xs"`, um degrau
abaixo do alerta porque a barra atravessa o topo e não pode empurrar o conteúdo.

**E medindo as classes apareceu o que o seletor escondia.** O × de dispensar
carregava `hover:bg-current/15` **e** `dark:hover:bg-muted/50`, e a aritmética
que este arquivo já registra decide: `.cls:hover:is(.dark *)` é **(0,3,0)**
contra os **(0,2,0)** de `.cls:hover`. **Os 15% medidos com tanto cuidado nunca
valeram no tema escuro** — o × ficava cinza, calado, e só num tema. O botão de
ação estava um degrau pior: a classe tonal nem existia na lista dele, vinha do
seletor descendente, que empata em (0,3,0) com o `dark:` e era decidido por
ordem de emissão.

Compondo os dois, o `twMerge` **remove** o `dark:hover:bg-muted/50` em vez de
disputar com ele — medido no DOM: sobram `hover:bg-current/15` e
`dark:hover:bg-current/15` no ×, `/10` nos dois na ação, e nenhum `bg-muted`.
A assimetria de 15 contra 10 fica, e o motivo continua sendo **área**: um ícone
de 12px numa caixa de 24 sem contorno tem um quarto da superfície de um botão de
texto.

### A costura era uma borda, e o auditor não tinha como ver

`resizable.tsx` era o único arquivo de `src/components/ui/` fora de toda régua
da casa — e passava **limpo** no `ds:audit`. Não por sorte: `isUi` desliga A2, C
e C', e ele não tinha cor literal, valor arbitrário, `<svg>`, `hover:` sem par
nem `Intl`. Uma pasta calada não é uma pasta conforme, e um arquivo aprovado
também não.

O defeito de fundo cabe numa frase: **a costura era indistinguível de uma
borda.** Mesmo token, mesma espessura, mesma cor, nenhum estado — o desenho de
um `Separator` parado, na única peça do app cujo trabalho inteiro é dizer que
aquela linha se move. E a pega do `withHandle` era **também** `bg-border`: uma
pastilha da cor exata do fio em que ela se apoia. Medido, **1,35 no claro e 1,33
no escuro**, o mesmo número que o contorno de campo tem fora da 1.4.11.

**A `react-resizable-panels` 4.12.3 publicava três mecanismos, e o arquivo lia
zero.** `data-separator` vale `inactive | hover | active | focus | disabled`; a
lib liga `keydown` em cada costura (setas, `Home`, `End`); e o duplo-clique
devolve o painel ao `defaultSize`, ligado de fábrica. Nada disso aparecia na
documentação, e uma afordância que existe e ninguém vê é igual a nenhuma.

**A `className` do grupo era inteiramente inerte.** O `Group` declara `display`,
`flex-direction`, `flex-wrap`, `overflow`, `height` e `width` por **estilo
inline** — o `.d.ts` avisa que as quatro primeiras não podem ser sobrescritas —,
e inline vence classe, então `flex h-full w-full` não fazia nada. Junto ia um
`aria-[orientation=vertical]:flex-col` apontando para um atributo que o grupo
**não emite**: o nó dele carrega `data-group`, `data-testid` e `id`, e mais
nada. Consequência para quem escreve tela: **a caixa do grupo vem do pai**.

Mais duas declarações que não desenhavam nada: `ring-offset-background` sem
nenhuma classe de largura de offset — a família do "Desfazer" do toast, que
tinha `border-color` e nenhum `border-style` —, e `rounded-lg` (10px) numa pega
de 4px, que o navegador clampa para 2.

E o `role="separator"` estava **sem nome acessível**. É a medição do `Popover`
outra vez, e aqui era pior: o teclado funciona, então existia um controle
operável e sem nome. Hoje o `aria-label` tem padrão em pt-BR, pela mesma razão
que o `locale` do `Calendar` tem — verificado na árvore de acessibilidade, as
oito costuras da página saem nomeadas.

**A nota de toque da documentação estava factualmente errada.** Ela dizia que a
alça tinha 4px e era "impossível com o dedo", descrevendo uma versão que não
está instalada: desde a v4 a lib faz o próprio hit-testing, expandindo a
`DOMRect` por `resizeTargetMinimumSize`, cujo padrão é `{ coarse: 20, fine: 10 }`
e é escolhido por `isCoarsePointer()`. O `after:` de 4px não era o alvo de nada
havia uma versão inteira. O que restava de verdadeiro é que **20 é menos que os
44 do sistema**, e a prop que fecha isso nunca tinha sido plugada.

**O realce é pintado fora do fluxo, e é a razão de o `after:` ter virado
`before:`.** Engrossar a alça reflui os dois painéis a cada passagem do cursor;
o acento é um `::before` absoluto de 2px sobre a costura, e só a **cor**
transiciona. Medido: as larguras dos dois painéis idênticas até a terceira casa
decimal com e sem cursor — `303,602 / 455,398` nas duas leituras. `::before` e
não `::after` porque o `after` é o último filho e pintaria por cima da pega, o
que exigiria um `z-index` só para desfazer.

**Três eixos onde havia um booleano.** `variant` é `line | grip | plain`, e ele
decide o que a costura desenha **em repouso** — nunca o que ela faz: as três
acendem igual. `plain` existe para painéis que já têm moldura própria, onde um
fio na calha seria a terceira borda em 8px. O catálogo saiu de `—` na coluna de
variantes.

**A orientação vem do contexto, e não do `aria-orientation`.** O `Separator`
emite esse atributo **invertido** em relação ao grupo, e o arquivo antigo
dependia da inversão sem registrá-la — a armadilha exata que faz a próxima
pessoa "corrigir" para o lado errado. A geometria saiu para uma condicional
sobre o contexto, como o `separator.tsx` já fazia, e com ela sumiram os sete
seletores de atributo.

**Um split é móvel de desktop.** Abaixo de 768px o grupo horizontal vira fluxo
empilhado: os painéis soltam as proporções, e a costura perde o arraste, o papel
e o foco, virando um fio estático `aria-hidden` — duas regiões empilhadas sem
nada entre elas leem como um bloco só. É o par que o `Sheet` já faz entre painel
e gaveta, com o mesmo hook e o mesmo número, e a mesma regra: **nenhuma tela
escreve `isMobile`**. A documentação anterior empurrava esse layout para toda
tela futura em prosa. O padrão é `orientation === "horizontal"`, na forma
`stack ?? …` que o `Tabs` já usa — um grupo vertical num telefone já é uma
coluna. Medido a 375px: **7 dos 8 grupos empilham**, e o único que não é o
vertical, que mantém `role="separator"` e o foco.

**A pega usa a tinta de arraste da folha e da gaveta, num alfa próprio, e a
diferença é área.** A alça da gaveta é 48×6 numa superfície que a pessoa acabou
de abrir; esta pega é 4×32 entre dois painéis de conteúdo — é a medição da
`AnnouncementBar`, onde um ícone de 12px precisou de mais tinta que um botão de
texto pelo mesmo motivo. Varridos os degraus sobre o fundo real, **70% é o
primeiro que alcança 3:1 nos dois temas**: 3,16 no claro e 4,05 no escuro,
contra 1,66 e 1,92 a 35%. O acento dá **3,01 nos dois temas** ao pousar e 7,66 /
6,14 ao arrastar, e a costura em repouso fica em 1,35 / 1,33 — o fio quieto, de
propósito. Ela não importa o `DRAWER_HANDLE_CLASS`: `drawer` é Organismo, e o
orçamento de import deste Átomo vai todo para o `Button`.

**O colapsar não pode morar na alça, e não é escolha de desenho.** A lib liga
`pointerdown`, `dblclick`, `contextmenu` e `pointerup` **no documento, em fase
de captura**, e decide por hit-testing de ponto. Um botão dentro da alça é
impossível: a captura do documento dispara antes do handler dele, e
`stopPropagation` de dentro não alcança um ancestral que já correu. Pior,
qualquer controle a menos de **metade da região de arraste** (22px) tem o
próprio clique engolido. Por isso são `useResizablePanel` + um
`ResizableCollapseTrigger` que mora no cabeçalho do painel vizinho — e a
demonstração do catálogo violou a própria regra na primeira escrita, com o
gatilho a **8px** da costura.

O primeiro conserto errou para o outro lado, e quem viu foi o dono: cravar 24px
deixava o recuo esquerdo **3× maior que os outros três lados**, à vista. A folga
é do **dedo**, não do cursor — a zona é `{ coarse: 44, fine: 10 }`, logo 22px no
toque e **5 no mouse** —, e um grupo horizontal só chega a ponteiro grosso acima
de 768px, porque abaixo disso ele empilha. Hoje é `p-2 pointer-coarse:ps-6`: 8px
simétricos no mouse, 24 só onde o dedo precisa. É a mesma pergunta que o item de
menu e o `Calendar` já fazem.

**Proporção guardada e SSR não convivem sozinhos.** A lib passa **a mesma
função** como `getSnapshot` e como `getServerSnapshot` do `useSyncExternalStore`,
então na hidratação o cliente lê o `localStorage` e discorda do HTML que o
servidor mandou — medido, um diff inteiro de `flexGrow` no console. Nenhuma
guarda de `typeof window` pega isso: na hidratação o `window` existe. **E adiar
sozinho não resolve**: com o `defaultLayout` chegando depois, o grupo o
**ignora** — 25/75 guardado, 40/60 na tela —, porque ele é lido na montagem e só
nela. A saída é o `groupKey`, que troca uma vez e remonta o grupo já com a
proporção certa; ele fica **fora** de `groupProps` porque é `key` e não prop, e
no espalhamento virava atributo desconhecido no DOM. Medido depois: zero erros
de console e a proporção restaurando em 25/75.

**O componente virou Átomo.** `Group`, `Panel` e `Separator` são a anatomia de
uma coisa só — o argumento literal que devolveu o `Select` a Átomos. Ele era a
única entrada do bloco de Moléculas **sem comentário justificando a camada**, e
a justificativa que faltava era fraca: a régua diz "feita de átomos" e ele não
compunha nenhum. A linha de import do registry também omitia `ResizableHandle`,
então quem copiasse do catálogo não montava o exemplo que a página mostra logo
abaixo.

**Fora, de propósito:** um eixo `size` na alça (nenhuma contagem o pede — o
precedente é a `Toolbar`) e um `variant` de moldura no grupo (a moldura que a
doc escreve à mão é um caso só; volta quando forem dois).

### O colapso ganhou movimento, e ele some no gesto

Colapsar era um salto: 238 para 0 num quadro. `flex-grow` transiciona — é um
`<number>`, e é ele que a lib escreve na **raiz** de cada painel —, mas ligar a
transição sem condição estraga as duas outras formas de redimensionar: no
arraste o painel passa a perseguir o cursor com 200ms de sobra, e no teclado
cada seta vira uma interpolação que a repetição de tecla empilha.

Os dois estados já vinham no `data-separator`, e o grupo lê os dois para zerar a
duração. Medido: **0,2s em repouso, 0s arrastando, 0s no teclado**, e
`transitionend` a 0,196s **nos dois painéis** — os dois transicionam juntos, que
é o que faz a razão entre eles interpolar em vez de um saltar enquanto o outro
desliza.

**A régua mora no grupo, e não no painel**, porque a `className` do
`ResizablePanel` cai num `div` **interno** — o `.d.ts` da lib diz isso com todas
as letras. Quem carrega o `flex-grow` é a raiz, e ela só se alcança por seletor
de filho a partir do único nó com `className` na mesma árvore.

**E a duração desce por `--resizable-anim`**, não por um `transition-none`
empilhado sobre a classe base: as duas escreveriam a mesma propriedade no mesmo
elemento, e quem venceria seria a ordem de emissão do Tailwind e não o que se
escreveu. Variável herda e não disputa — é o mecanismo de `--toolbar-control` e
de `--disclosure-nudge`.

O custo fica dito: animar `flex-grow` reflui o conteúdo dos painéis a cada
quadro, e num painel com tabela longa isso é caro. É a razão de o movimento
ficar restrito ao comando em vez de valer para toda mudança de tamanho.
`prefers-reduced-motion` não precisou de regra própria — o bloco global encurta
transições para 0,01ms.

**Uma terceira lição de instrumento, na mesma família das duas abaixo.** Medindo
se o texto vazava do painel durante o encolhimento, `range.getBoundingClientRect()`
acusou 15px de sangria para cada lado. Não havia sangria nenhuma: aquele método
devolve a **caixa de layout** do texto, e não a região pintada — o `div` interno
da lib é `overflow: auto` e clipa (`scrollWidth` 57 contra `clientWidth` 42).
Quem decidiu foi a captura de tela em câmera lenta, com a duração forçada a 8s.

### Duas lições de método, e as duas são erros de instrumento

**Coordenada de painel não é pixel de CSS, e o `hover` e o `left_click_drag` não
usam a mesma escala.** Quatro tentativas de arrastar a costura "falharam" com o
componente correto: o `pointerdown` caía a 260px do alvo. A sonda que resolveu
foi ler `event.defaultPrevented` num ouvinte registrado **depois** do da lib, na
mesma fase — ela chama `preventDefault()` exatamente quando acha região de
acerto, então o booleano diz se o ponto acertou. Com a escala corrigida:
`inactive → active → focus`, larguras 189,8/569,3 → 338,8/420,3, `aria-valuenow`
de 25 para 44,6.

**Medir alfa exige subir a partir do pai.** No tema claro a própria costura é
opaca (`bg-border`), então o compositor que subia a árvore a partir dela
devolvia **a costura como fundo** e reportava 2,67 onde o número é 3,16. É o
parente da lição da `AnnouncementBar` — lá o erro era compor sobre preto, aqui é
compor sobre o próprio elemento.

E uma correção de registro: o painel do navegador **entregou teclas** nesta
sessão, ao contrário da rodada do `Radio`, onde um ouvinte de `keydown` recebeu
zero eventos. `Tab`, `shift+Tab` e as setas chegaram; foi assim que o
`:focus-visible` e o `ring-3` foram verificados de verdade.

### Backlog de migração

A rodada 01 entregou tokens, componentes, documentação e o auditor, sem migrar
as telas. A rodada 02 migrou o que quebrava o tema escuro e corrigiu a escala de
camadas, que descrevia números que a produção não usava. O estado atual está em
[`docs/design/CONFORMIDADE-02.md`](docs/design/CONFORMIDADE-02.md): **1.179 →
622 achados**, com ordem sugerida por razão entre impacto e risco. As rodadas
do `Card`, do `Alert` e dos diálogos levaram a **600**, ao migrar as telas que
os eixos renomeados obrigaram a tocar.
[`CONFORMIDADE-01.md`](docs/design/CONFORMIDADE-01.md) virou registro histórico —
duas das correções que ele prescrevia estavam erradas, e a 02 diz quais.

O que sobra, do mais barato ao mais caro:

- **84 `hover:` sem par de toque.** No telefone essas superfícies não respondem
  ao toque. A correção é **somar** `active:`, nunca remover o `hover:`.
- **77 formatações fora dos helpers** — `Intl.*` e `toLocaleDateString` na tela,
  cada um livre para divergir. Destino: `@/lib/formatters` e
  `@/lib/transaction-date`.
- **51 primitivos crus** com equivalente no design system, quase todos
  `<button>`. Muda tipos de props: `npx tsc --noEmit` a cada arquivo.
- **353 valores arbitrários**, hoje majoritariamente legítimos: `w-[…]` e `h-[…]`
  de esqueleto, que existem para casar com a largura do conteúdo real.

E o que a rodada do `Card` deixou de propósito para uma próxima, porque a
decisão foi mexer só no design system:

- **46 telas abrem com a mesma string** — `className="gap-0 overflow-hidden
  border border-border py-0 shadow-none ring-0"` —, que hoje é `padding="none"`
  e mais nada. `border border-border` virou o padrão, e `shadow-none`/`ring-0`
  nunca desligaram coisa alguma.
- **24 barras de topo e 18 faixas de pé feitas à mão**, em cinco e nove
  grafias. Destino: `CardToolbar` e `CardNote`.
- **`AppAppearanceSettings`** (`src/components/settings/app-appearance-settings.tsx`)
  não é renderizado por nenhuma rota. Foi migrado junto porque o tipo mudou,
  mas o que ele pede é remoção.

E o que a rodada do `Alert` deixou, pela mesma razão:

- **11 avisos tonais feitos à mão** contra 4 que usam o componente —
  `flex items-start gap-2 rounded-lg border border-X/30 bg-X-muted …` em
  `invites/accept`, `ChangePasswordDialog`, `edit-profile-dialog` e
  `credit-card-category-alerts`; e `bg-X-muted p-3 rounded-md` sem borda em
  `signup-form`, `forgot-password-form` (duas vezes) e `reset-password-form`.
  Destino: `<Alert tone size>` e `<Alert variant="plain">`.
- **`offline-banner.tsx` é um `Alert` fingindo de `AnnouncementBar`**:
  `rounded-none border-x-0 border-t-0` fixado no topo da janela, com
  `AlertDescription` sem `AlertTitle` — o que a própria documentação do `Alert`
  proíbe. O componente certo já existe e tem `onDismiss`.

E o que a rodada do `Dialog` deixou:

- **32 corpos roláveis** (`min-h-0 flex-1 overflow-y-auto`) e **16 cabeçalhos**
  com `shrink-0 px-6 …` em cinco grafias continuam escritos à mão. Destino:
  `DialogBody` e o `DialogHeader`, que em `layout="fixed"` já dá as duas
  coisas. Elas são redundantes hoje, não erradas.
- **Os 6 diálogos sem `className`** ficaram 64px mais largos (`sm` → `md`) e com
  24px de recuo em vez de 16 — consequência direta de o padrão passar a
  descrever o app. Vale conferir tela a tela se algum queria mesmo ser `sm`.

Os 16 `DialogContent` que montavam a forma à mão (`flex flex-col gap-0
overflow-hidden p-0 sm:max-w-md` mais o teto de altura) **foram migrados** para
`layout="fixed"`. Não foi cosmética: o fio do cabeçalho passou a sangrar por
`--dialog-bleed`, e a variável descrevia o recuo que a **variante** declara —
não o que a tela sobrescrevia. Com `p-0` na tela e `bleed: 24px` no componente,
o fio saía 24px para fora de cada lado (496px num diálogo de 448), salvo só
pelo `overflow-hidden` que aquelas telas por acaso tinham. Um mecanismo que
depende de coincidência não é mecanismo.

E o que a rodada do `Drawer` e do `Popover` deixou:

- **11 telas escrevem a área segura do rodapé à mão** —
  `pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]` em quatro medidas
  diferentes (1,5rem, 1rem, 0,625rem, 0,5rem), em `mobile-sheet-form-chrome`,
  `notifications-sheet`, `mobile-account-menu`, `mobile-nav-island`,
  `install-pwa-sheet` e nos formulários de transação, fatura, conta e
  assinatura. A área segura é **da superfície**, e o `DrawerContent` já a
  carrega; a folha ainda não, e por isso as 11 não foram tocadas — somar lá
  dobraria o recuo em todas. Destino: mover para o `SheetContent` e apagar as
  11 numa mudança só.
- **`DialogHeaderRow` ainda separa título e descrição com `space-y-1`.** É o
  mesmo par de identidade que saiu do `PopoverHeader` nesta rodada. Um
  `gap-0.5` a menos, e o par volta a ler como uma coisa só.
- **`Drawer` continua sem consumidor.** Ele agora está correto e documentado,
  mas quem prova um componente é uma tela. O primeiro candidato honesto é um
  descarte casual com o polegar — filtros curtos, uma escolha rápida — que hoje
  abre `Sheet` e paga o painel de desktop sem precisar dele.

E o que a rodada do `FormPickerPopover` deixou, porque a decisão foi mexer só
no design system:

- **As 3 telas continuam escrevendo a anatomia à mão** —
  `transaction-form-fields` (duas vezes) e `subscription-form-pickers`. O
  rodapé `shrink-0 border-t border-border/50 bg-muted/25 p-2` aparece 3×
  idêntico, a faixa de busca 2×, o gatilho `Button outline xl w-full
  justify-between px-3 …` 3×, e `modal={isMobile}` 3×. Destino: as faixas.
- **`formPickerListScrollClassName` sobrevive** só porque essas 3 telas a
  importam. Ela não consegue carregar o `onWheel` que cada uma escreve ao lado
  dela, que é justamente o que `FormPickerPopoverList` traz junto.
- **4 achados C do auditor** — os `<button>` crus de `CategoryRows`,
  `CreditCardRows` e o "Nenhuma" do seletor de assinatura, todos com `hover:`
  sem par `active:` numa superfície de toque. Destino:
  `FormPickerPopoverItem`, que já existe com os 44px de alvo e o par completo.

E o que a **regra G** (ícone fora do Heroicons) revelou no dia em que entrou —
60 achados, nenhum deles conserto desta rodada:

- **24 `<svg>` colados à mão**, e não são marca: 20 glifos do **Lucide** (a
  assinatura é `viewBox="0 0 24 24"` com `stroke-width="2"` e cantos redondos)
  em `signup-form` (15), `forgot-password-form` (4) e `login-form` (3) — olho
  aberto/fechado da senha e os check/x dos requisitos —, mais **2 do Radix
  Icons** (`viewBox="0 0 15 15"`) nos indicadores do `dropdown-menu`, que vieram
  de fábrica com o shadcn. Nenhum tem import: entraram por cópia, que é
  exatamente o furo que checar `package.json` não pega.
- **36 usos com o conjunto errado para o tamanho** — em 26 arquivos, quase todos
  um ícone de `20/solid` ou `24/outline` renderizado em `size-4`. Campeão:
  `DeleteAccountDialog` (5). Até `spinner.tsx` e `mobile-sheet-form-chrome.tsx`
  estão na lista. Nada enforçava esse par antes; a regra escrita existia desde a
  rodada 03 e ninguém tinha como medi-la.
- **0 imports de outra biblioteca.** É por isso que o porteiro do ESLint pôde
  entrar como `error` sem quebrar nada.

E o que a rodada dos menus deixou:

- **14 `DropdownMenuItem` escrevem `text-destructive focus:text-destructive` à
  mão**, em 12 arquivos e numa grafia só, enquanto `variant="destructive"`
  existe e só a página do catálogo a usa. A grafia manual é a pior das duas:
  não traz o `focus:bg-destructive/10` nem o par escuro. É uma substituição
  mecânica de uma linha por arquivo.
- **O `ContextMenu` continua sem consumidor.** Ele virou a régua dos dois
  menus, mas quem prova um componente é uma tela — clique-direito numa linha de
  transação é o candidato óbvio.
- **As 18 chamadas de largura do `DropdownMenuContent`** continuam escrevendo
  `w-44` / `w-48` / `w-52` / `w-56` em vez de `size`, e as 2 de painel
  continuam montando `rounded-xl p-0 shadow-lg ring-1 ring-border/10` à mão
  (`user-menu`, `workspace-switcher`). Substituição mecânica de uma classe por
  um prop.
- **Os 3 estados vazios do `FormPickerPopover`** e os `p-0` do `PopoverContent`
  seguem à mão, pelos mesmos motivos.
- **O `Menubar` também não tem, e a conta explica por quê.** A superfície mais
  densa do app tem **4 comandos**; são 47 no total em 18 arquivos, e nenhum
  agrupado por assunto — são ações de um objeto, que é o caso do
  `DropdownMenu`. Uma barra de menus se paga por volta de três grupos e uma
  dúzia de comandos. Medido, não estimado: `grep -c '<DropdownMenuItem'`.

E o que a rodada do `Tabs` e do `Combobox` deixou:

- **10 `role="tablist"` escritos à mão, em 7 arquivos** (hoje **6**: os 4 de
  formulário viraram `FormRadioGroup`), **com 43 referências às
  duas strings de `transaction-type-segment.tsx`** — uma pasta de *feature*
  fazendo o trabalho do design system, que é o invariante 1 no nível do sistema.
  Nenhum deles tem foco itinerante, setas, `aria-controls` ou `role="tabpanel"`:
  eles **anunciam** o padrão ARIA de abas e entregam botões soltos. Destino: seis
  são `Tabs variant="solid" stretch`, e **quatro são filtros e querem
  `ToggleGroup`** — `bills-toolbar`, `subscriptions-toolbar`,
  `bill-detail-history-list` e o `TransactionTypeSegment` de filtro. A página do
  próprio `Tabs` já ensinava essa regra enquanto o app a quebrava quatro vezes.
- **`transactionSegmentTabClassName` tem uma sombra literal** —
  `dark:shadow-[0_1px_2px_0_rgb(0_0_0/0.35)]` — e um `z-[1]`. Saem junto na
  migração.
- **`input-group.tsx:69` reimplementa a superfície de campo em forma `has-[…]`**
  — a quarta ocorrência, e a prova de que a régua era real. Não dá para consumir
  `field-classes` direto porque ali as classes vivem sob `has-`; o destino é uma
  variante do arquivo, não uma cópia.
- **`Input` e `SelectTrigger` discordam em `disabled:pointer-events-none`**: o
  primeiro o tem, o segundo não. Ficou fora de `fieldDisabledClassName` de
  propósito — igualá-los é conserto de comportamento, não extração. O `Input` é
  o que está fora do padrão.
- **Três gatilhos de campo em duas aparências.** `SelectTrigger` e
  `ComboboxTrigger` vestem `field-classes`; `FormPickerPopoverTrigger` continua
  `Button variant="outline" size="xl"` por decisão registrada. Vale reabrir a
  decisão agora que os outros dois convergiram.
- **`Drawer`, `ContextMenu` e `Menubar` continuam sem consumidor**, e agora o
  `Tabs` e o `Combobox` também — a diferença é que estes dois têm um consumidor
  **nomeado** e contado acima.
- **Dois cadáveres de seletor, da família "sobreviveu à remoção" que este
  arquivo já documenta.** Um foi apagado nesta rodada:
  `in-data-[slot=combobox-content]:focus-within:*` em `input-group.tsx`, que só
  casava quando `ComboboxInput` renderizava um `InputGroup` — e hoje o
  `CommandInput` desenha a própria casca. O outro **fica**: **`no-scrollbar` é
  usada em quatro arquivos (`ds-shell` ×2, `command.tsx`, `sidebar.tsx`) e não
  está definida em lugar nenhum** — nem em `globals.css`, nem em `tw-animate-css`.
  Defini-la faria quatro superfícies não relacionadas passarem a esconder a barra
  de rolagem em Windows e Linux, o que é mudança de comportamento fora do escopo
  de uma rodada de componente. O `Tabs` escreve
  `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden` por extenso enquanto
  isso não se decide.

E o que a rodada da divulgação e da prévia deixou:

- **Animar a espiada.** Ela abre de uma vez hoje, pelo limite medido acima. É a
  única promessa desta rodada que não foi entregue, e o caminho está escrito.
- **O `peek` não tem consumidor no app.** Ele está correto, medido e
  documentado, mas quem prova um componente é uma tela. Os candidatos honestos
  são a descrição longa de uma assinatura e o texto de ajuda de fatura em
  `credit-card-form-fields`, que hoje abre de altura zero e some inteiro.
- **`markerSide="start"` também não tem.** O caso é o agrupamento de categorias
  por seção, que hoje não existe como acordeão.
- **O `HoverCard` continua com um consumidor só, e é a página do catálogo.** As
  tiras, a seta e os três degraus foram desenhados contra casos reais do app
  (membro de workspace, fatura), mas nenhuma tela os usa ainda — o par
  identidade + saldo numa lista de membros é o primeiro.
- **`separated` e `contained` do `Accordion` também nascem sem tela.** O app tem
  **zero** usos do `Accordion` hoje; o único consumidor de qualquer um dos três
  é o `Collapsible`, em duas telas.
- **`SheetDragHandle` e companhia continuam onde estavam.** Nada nesta rodada
  tocou a limpeza mecânica pendente das outras.

**A `AnnouncementBar` passou pela mesma régua, e quase toda ela já estava
certa.** Medida a cor resolvida dos cinco tons, `info`, `success`, `warning` e
`destructive` batem com o `Alert` em **distância 0** nos dois temas — ela sempre
leu os tokens `-muted`, ao contrário do toast. Dois pontos saíram:

- **O texto do tom neutro era o mais fraco de todos.** Com
  `text-muted-foreground`, 5,04 no claro e 5,86 no escuro, contra 6,9–10,8 dos
  quatro tonais. O `Alert default` usa o foreground **cheio**
  (`text-card-foreground`), e a barra não seguia: justamente o tom que não tem
  cor para ajudar a ler tinha o texto mais fraco. Depois: **16,61** e **14,50**.
- **O fio do `sticky` era `border-border/50`** — cinza sobre superfície
  colorida, a mesma família do texto cinza que o `Alert` reverteu. Virou
  `current/20`, uma linha para os cinco tons.

**E o realce do × ficou mais forte que o do botão de ação, de propósito.** A
primeira leitura foi que o hover estava fraco; a medição disse outra coisa:
`current/10` dava 1,28–1,35 no escuro, enquanto o hover do `Button tertiary` do
app dá **1,11** e o do menu **1,14** — o delta já era maior que o da casa. O que
faltava era **área**: um ícone de 12px numa caixa de 24 sem contorno tem um
quarto da superfície de um botão de texto, e a mesma diferença de cor lê como
menos. Por isso duas alavancas em vez de uma: 15% de preenchimento **e** o
contorno aparecendo, que é o que delimita o alvo. O botão de ação fica em 10%,
porque ele já tem borda e rótulo.

**E o instrumento de medição errou antes do código.** A primeira leitura do
hover deu contraste 18,78 e um botão "preto" sobre a barra verde — o medidor
compunha a cor sobre `#000`, e `bg-current/15` **tem alfa**. Cor com alfa
precisa ser composta sobre o fundo real, não sobre preto. As medições anteriores
desta série usavam `color-mix(…, bg)` — sem alfa — e por isso estavam certas; a
primeira com `/15` não estava. Vale a regra: **medir alfa exige pintar o fundo
verdadeiro por baixo.**

**O fundo do `default` continua divergindo do `Alert`, e é decisão.** O Alert
fica dentro do conteúdo, onde `--card` já o separa da página; esta faixa
atravessa o topo, e ali `--card` seria quase invisível — medido no escuro, 23 de
distância da página contra os 48 do `--muted`. Uma faixa que não se separa do
fundo não é faixa.

E o que a rodada do toast, do passo e da faixa deixou:

- **`offline-banner.tsx` ainda posiciona à mão.** Ele usa a `AnnouncementBar`,
  mas com `fixed` e o `--mobile-header-offset` no `className`, porque a troca
  para `sticky` não pôde ser verificada sem sessão. Quem abrir o app logado
  fecha isso em duas linhas — e ganha de brinde a barra deixando de cobrir a
  primeira linha do conteúdo.
- **`export { toast } from "sonner"` continua em `lib/toast.ts`**, e é a porta
  que deixa qualquer tela pular os helpers e, com eles, as durações. Hoje só o
  `sync-engine` a usa; fechá-la é decidir se aquele caso vira helper.
- **`Stepper` e `AnnouncementBar` seguem sem consumidor** além do
  `offline-banner`. O candidato honesto do `Stepper` é o onboarding de conta
  nova, que hoje não existe como fluxo numerado.
- **`toastUndo` e `toastPromise` nascem sem tela.** O primeiro cabe na exclusão
  de transação (que hoje abre `AlertDialog`), o segundo na sincronização
  manual — os dois estão nomeados aqui para não virarem código morto.

E o que a rodada do campo de data e dos dois cartões deixou:

- **A aparência de 8 telas mudou sem que nenhuma fosse editada** — 5 do
  `DatePicker` e 3 do `FormPickerPopover`. É o efeito pretendido da convergência
  de superfície, e vale conferir tela a tela se algum campo ficou apertado com os
  4px a mais de altura.
- **As sobrescritas que agora têm variante** continuam à mão: as duas strings
  idênticas do `EmptyState` (`not-found-shell`, `route-error-fallback`), o
  `bg-destructive-muted` do ícone de erro, e os `displayStyle="numeric"` que hoje
  podem vir acompanhados de `size`.
- **`transactions-date-range-form.tsx` reimplementa `parseYmdLocal` e
  `localYmdFromDate`** como `ymdToLocalDate` / `localDateToYmd`, e monta o
  período com dois seletores. Agora ele cabe num `DatePicker mode="range"` só.
- **`StatCardDelta`, `StatCardIcon`, `StatCardValueSkeleton` e o `size` do
  `Calendar` nascem sem tela.** As duas telas de `StatCard` usam rótulo e valor e
  mais nada.
- **`Button variant="tertiary"` não tem par `active:`** — achado colateral desta
  rodada, e vale para o app inteiro: todo botão terciário fica sem resposta ao
  toque. É conserto do `Button`, e ficou fora do escopo de propósito.

E o que a rodada da trilha, da paginação e das duas listas deixou:

- **Os quatro continuam sem consumidor no app**, e agora com os candidatos
  nomeados: linha de transação → `Item variant="divided"`; detalhe de fatura e
  de cartão → `DescriptionList` (`divided` para o extrato, `grid` para os seis
  campos, `size="lg"` na linha do total); as telas de três níveis
  (`/cartoes/[id]/faturas/[mes]`, `/categorias/[id]`) → `Breadcrumb` dentro de
  `PageHeaderBreadcrumb`; a lista de transações → `Pagination align="between"`
  com `PaginationStatus`.
- **A regra H do auditor não enxerga `cva()` nem `cn()`.** Ela varre
  `className="…"`, e os dois `hover:` sem par de toque desta rodada estavam
  dentro das duas — por isso os quatro arquivos saíam "conformes" com o defeito
  dentro. Ampliar o alcance da regra é conserto do auditor, e ficou de fora.
- **`Breadcrumb` virou módulo de cliente.** O `size` desce por contexto até o
  separador e as reticências, o que exige `createContext`. Custou pouco (o
  módulo é pequeno, e quase todo `src/components/ui/` já é `"use client"`), mas
  `PageHeader`, que é servidor, agora atravessa uma fronteira ao renderizá-lo.
- **`BreadcrumbEllipsis` sobrevive sem chamador.** Com `maxItems`, a lista monta
  `BreadcrumbMenu` sozinha, e o marcador estático só serve a quem colapsa à
  mão. Fica exportado porque é o degrau de saída, não porque alguém o use.

E o que a rodada do campo, do formulário e da barra deixou:

- **104 campos à mão**, em 27 arquivos e 5 dialetos de espaçamento. Destino:
  `Field` + `FieldControl`. É a migração mais cara e a de maior retorno — ela é
  que transforma os 24 `aria-invalid` órfãos em campos que o leitor de tela
  explica. Os 2 achados **C'** de `<fieldset>` cru em
  `workspace-appearance-form-fields.tsx` são o auditor apontando a mesma lacuna.
- **A escada dos controles de campo está incompleta**, e é o que obriga os 15
  `h-9` / `className="text-sm"` escritos à mão nos três formulários maiores:
  `Input` e `SelectTrigger` têm `sm md lg xl`; **`NativeSelect` só tinha `sm md`**
  (fechado na rodada da composição), **o campo de dinheiro não tinha nenhum** —
  fechado na rodada do `<Input money>`, que o faz herdar a escada inteira —, e
  **`Textarea` continua sem**. Ficou o `Textarea`, que é conserto de um
  componente que aquela rodada não abriu.
- **`NativeSelect` é a quinta cópia da superfície de campo** — escreve
  `rounded-lg border border-input bg-input-fill/30 … aria-invalid:…` inline em
  vez de consumir `field-classes`. O backlog já chamava `input-group.tsx:69` de
  "a quarta ocorrência". Junto vêm dois desvios só dele:
  `data-[size=sm]:rounded-md` (raio diferente num degrau, que nenhum outro
  controle faz) e `dark:hover:bg-input-fill/50`, um `hover:` sem par `active:` e
  só no tema escuro. *(Pago na rodada da composição: veste `field-classes`, os
  dois desvios saíram, e ganhou `lg` e `xl`.)*
- **6 barras de filtro à mão** (1.372 linhas) mais **6 clones em esqueleto** com
  as strings copiadas, mais `monthNavDense*` (4 constantes, ramo `false` morto),
  `transactionSegment*` e o booleano `dense` costurado por três componentes.
  Destino: `Toolbar` + `ToolbarRow` + as duas réguas. São 19 `md:h-8` em 14
  arquivos.
- **4 barras de seleção com `role="toolbar"` escrito à mão**, nenhuma com foco
  itinerante — e `transactions-table.tsx:260,318` está copiado verbatim em
  `subscriptions/page-client.tsx:545,607`.
- **`bills/page-client.tsx:196`** renderiza o gatilho de filtro em `size-9`
  (**36**) enquanto `bills-toolbar.tsx:211` renderiza o mesmo controle em
  `size-10` (**40**). Um terceiro valor, na mesma tela.
- **3 dialetos de erro de campo** — `text-sm font-normal` (`FieldError`),
  `text-control-sm font-medium` (login, signup, forgot, reset) e
  `text-sm font-medium` (workspace-appearance) — e **4 resumos de erro no topo
  do formulário com 3 contratos de acessibilidade diferentes**: um com
  `role="alert" aria-live="polite"`, um só com `role="alert"`, um sem nada.
  Destino: `FieldError` e `Alert tone="destructive" variant="plain"`.
- **7 alternadores de senha** em 4 arquivos, com dois conjuntos de ícone — e os
  de `login-form.tsx` são `<svg>` do Lucide colados à mão (regra G).
  `InputGroup` cobre.
- **`<select>` cru com 350 caracteres de classe** em
  `wallets/page-client.tsx:277`, com tokens obsoletos (`h-10`, `rounded-md`,
  `focus-visible:ring-2`, `ring-offset-background`). `NativeSelect` existe.
- **`ChangePasswordDialog.tsx:32-36`** deriva à mão a classe do rodapé do
  diálogo **e** a da folha, com três `!important` brigando com as margens do
  `DialogFooter`. *(O rodapé foi pago: é `FormActions variant="sticky"`.)* E
  faltava um `MobileSheetFormFooter`: o chrome cobria cabeçalho e
  corpo, não o rodapé.
- **4 `maxLength` silenciosos**, um deles em 120 caracteres, sem contador. Quatro
  é pouco para uma peça, mas truncar sem avisar é defeito.
- **`field-classes.ts` não está no catálogo.** É régua compartilhada como
  `formatters` (Padrão *dinheiro*) e `transaction-date` (Padrão *datas*), e as
  duas têm página. Ela não.
- **A regra H do auditor não enxerga `cn()` nem `cva()`** — já registrado na
  rodada 08, e continua valendo: o par `active:` do cartão de escolha teve de ser
  verificado no CSS emitido, porque o auditor não o alcança.
- **Uma regra de auditor nova, se alguém quiser fechar a porta**: um campo
  montado à mão (`<Label>` seguido de controle, sem `Field` em volta) é medível,
  e é o que impediria as 104 de voltarem. Foi assim que a regra J nasceu.

E o que a revisão da barra deixou:

- **`ToggleGroup type="single"` desmarca tudo** ao clicar no item ativo, e emite
  `role="radio"` dentro de `role="group"`. **Zero consumidores**, então o
  conserto é grátis — e é ele que tira os 3 filtros de `role="tab"`. Sem isso,
  cada tela migrada precisaria do próprio guarda
  (`onValueChange={(v) => v && setX(v)}`): 6 grafias duplicadas.
- ~~4 `role="tablist"` dentro de formulários~~ — **pagos** na rodada do `Radio`.
  Restam os **6** que são filtro ou aba de página, e esses continuam sendo
  trilho segmentado.
- **`TransactionTypeSegment` é aba numa tela e filtro na outra.** Separar é
  pré-requisito de qualquer migração dos trilhos.
- **A cromagem de seis telas mora numa pasta de *feature*.**
  `transactionSegmentContainerClassName` e `transactionSegmentTabClassName` são
  exportados de `components/transactions/` e importados por faturas, cartões,
  assinaturas e categorias — o invariante 1 no nível do sistema. Levam junto a
  sombra literal `dark:shadow-[0_1px_2px_0_rgb(0_0_0/0.35)]` e um `z-[1]`.
- **3 `<Input type="search">` sem a supressão do ×** em
  `transactions-filters-panel.tsx` (418, 538, 772), e o
  `FormPickerPopoverSearch`, que hoje reimplementa o que o `SearchInput` faz.
  Destino: os quatro passam a consumir a peça.
- **A busca não existe na barra em nenhuma tela.** O catálogo agora mostra a
  forma e diz que o app não a tem; tomar a decisão é trabalho de produto.

E o que a rodada do chrome de página deixou:

- **Os três continuam sem consumidor no app**, e agora com os candidatos
  contados: `wallets/page-client.tsx:243` escreve `font-heading text-3xl
  font-bold tracking-tight` num `<h1>` à mão, e `credit-cards/page-client.tsx`
  e `settings/credit-cards/page-client.tsx` escrevem `text-lg font-semibold
  tracking-tight` em mais três — quatro `<h1>` de tela em três grafias, nenhuma
  igual ao `PageHeaderTitle`. O consumidor de verdade do `PageSection` são os
  **108 cabeçalhos de bloco** escritos à mão em 5 grafias (`text-base
  font-semibold tracking-tight` ×18, mais `text-sm font-semibold`, `text-2xs
  font-medium uppercase` e companhia).
- **`MobileHeaderBack` em `app-header.tsx:69` é a terceira cópia do voltar.**
  Ela ficou porque mexer no chrome do app é fora do escopo de uma rodada de
  design system, mas agora `PageHeaderBack` tem a mesma medida dela — a troca é
  de uma linha.
- **`H2` de `typography.tsx` e `PageSectionTitle` descrevem a mesma coisa
  diferente**: `text-2xl font-semibold` com `border-b` contra `text-base`
  (agora `sm|md|lg`) sem fio. O `H2` é o cabeçalho de prosa e o outro é o de
  tela, mas nada no sistema diz isso. Resolver é escolher um dono para
  "cabeçalho de segundo nível". *(Resolvido na rodada da composição:
  `PageSectionTitle` **é** `H2` por `asChild`, e `H2` perdeu a régua.)*
- **`Container` não tem eixo de calha.** `px-4 sm:px-6 lg:px-8` é fixo, e não há
  divergência medida no app para justificar um eixo — a nota fica para o dia em
  que houver.
- **O índice do catálogo perdeu 16px** entre o título e a frase de abertura,
  por aplicação do par de identidade. Foi a única mudança visível da migração;
  as outras 89 páginas saíram idênticas, verificado por captura.

E o que a rodada do `Container` deixou:

- **As outras 5 cascas de página continuam à mão.** `invites/accept` (×2, sem o
  `min-w-0` que as outras tinham), `credit-cards/[cardId]` (com um
  `px-1 sm:px-0` a decidir — quatro pixels que somem em 640), e os dois shells
  de erro (`not-found-shell`, `route-error-fallback`, os dois em `max-w-md`,
  que é o degrau `sm`). São 5 substituições mecânicas.
- **A área segura horizontal não existe no repositório.**
  `env(safe-area-inset-left/right)` não aparece nenhuma vez; só a vertical. Num
  telefone com entalhe em paisagem, o `px-4` da casca do app deixa o conteúdo
  passar por baixo do entalhe. O dono do conserto é
  `sidebar-app-shell.tsx:39`, não o `Container`.
- **A casca do app declara `md:p-6` e o `Container` declara `md:px-6`.** São a
  mesma calha horizontal, escrita em dois lugares. No dia em que a casca
  consumir o `Container`, uma das duas some — e é a da casca, porque ela também
  carrega o recuo vertical e a área segura.
- **`Container` ainda não tem `asChild`.** Zero demanda hoje: as nove cascas são
  `<div>`. A nota fica para quando uma tela pedir `<section>`.

E o que a rodada da taxonomia deixou:

- **30 componentes seguem sem consumidor fora do catálogo**: `accordion`,
  `breadcrumb`, `button-group`, `carousel`, `code`, `combobox`, `context-menu`,
  `description-list`, `field`, `hover-card`, `input-otp`, `item`,
  `kbd-group`, `menubar`, `native-select`, `navigation-menu`, `page-header`,
  `page-section`, `pagination`, `resizable`, `scroll-area`,
  `scroll-fade`, `search-input`, `slider`, `stepper`, `tabs`, `timeline`,
  `toggle-group`, `toolbar`. Cada um pede a tela que o prove, e isso é trabalho
  de produto — mas a contagem é a medida honesta de quanto do sistema ainda é
  promessa. E ela é por **arquivo**, o que esconde: `typography` conta como
  consumido, e são **2 dos 9** exports — `Muted` (9 usos) e `P` (6), em 6
  arquivos. Os outros sete têm zero no app — mas seis dos nove passaram a ter
  consumidor **dentro do sistema** na rodada da composição.
E o que a rodada do `<Input money>` deixou:

- **Os dois campos de valor do `transactions-filters-panel` continuam crus**, e
  com eles os outros **7 rótulos `text-2xs text-muted-foreground`** do mesmo
  painel. O que destrava é migrar o painel inteiro de uma vez — ou um degrau
  `xs` em `fieldSize`, que hoje não existe e que 9 rótulos pediriam.
- **`credit-card-category-alerts` é uma barra em `grid` com `sm:contents`**, e é
  a única forma do app que o `Field` não veste. Redesenhá-la é o que a tira de
  cru.
- **O orçamento por linha do `categories-onboarding-wizard`** tem rótulo
  `sr-only` num controle de 6,75rem. Um `FormInput` com rótulo invisível é a
  peça que falta — ou a linha vira `Item`, que é onde ela deveria estar.
- **`Textarea` continua sem escada de altura.** Era o par do campo de dinheiro
  na frase do backlog; o dinheiro herdou a do `Input`, e ele ficou sozinho.
- **A regra de auditor que mediria isto ainda não existe**: um campo montado à
  mão (`<Label>` seguido de controle, sem `Field` em volta) é medível, e é o que
  impediria as 17 de voltarem. Os números desta rodada — 12 migrados, 5 crus —
  saíram de leitura, não do auditor, que reportou **os mesmos achados antes e
  depois** nos 11 arquivos.

E o que a rodada do `Radio` deixou:

- **As setas do `radiogroup` não foram verificadas.** O painel do navegador não
  entrega teclas neste ambiente — medido com um ouvinte de `keydown` que recebeu
  zero eventos. Quem tiver teclado de verdade fecha isso em trinta segundos:
  Tab entra no grupo, seta move o foco **e** seleciona.
- **As 4 telas migradas não foram vistas logadas.** `transaction-form-fields` e
  os 7 sítios do `TransactionFormTypeSegment` compilam e o `<div
  className="space-y-2">` que saía carregava o respiro entre o campo de nome e o
  de tipo — o `gap-2` do `Field` **deve** deixar neutro, e "deve" é previsão.
- **No telefone o cartão horizontal mede 61px**, contra os 40 do trilho que ele
  substituiu: a 375px o rótulo quebra em duas linhas. No desktop são 44 contra
  32. Se isso incomodar, a saída é um degrau de corpo menor no item — e é
  decisão de produto, não conserto.
- **O app fala duas línguas de escolha até a próxima rodada.** Os 4 que migraram
  são cartão com contorno de marca; os **6** que ficam (filtro e aba de página)
  seguem com a pastilha levantada sobre bandeja. É temporário por construção,
  mas é real.
- **`ToggleGroup type="single"` continua desmarcando tudo** ao clicar no item
  ativo, e emitindo `role="radio"` dentro de `role="group"`. Zero consumidores;
  o conserto continua grátis, e é ele que destrava os 3 filtros que hoje são
  `role="tab"`.
- **O `Radio` nasce sem consumidor fora do `RadioGroup` e da página do `Field`.**
  O caso que o justifica sozinho é o cartão com conteúdo próprio — uma opção que
  carrega um valor em dinheiro, por exemplo.

- **O vocabulário de superfície ainda tem 14 palavras.** Depois de unificar
  `plain`, sobram `outline`, `solid`, `elevated`, `muted`, `soft`, `panel`,
  `underline`, `dashed`, `card`, `flush`, `inset`, `contained`, `separated` e
  `ruled` espalhadas pelos eixos `variant`. Algumas são genuinamente diferentes;
  outras são a mesma coisa com dois nomes. É uma rodada própria, e a medida para
  começar é cruzar cada palavra com o que ela desenha.

E o que a rodada do `resizable` deixou:

- **Ele continua sem consumidor**, e agora com o candidato nomeado:
  `/transactions` como lista mais detalhe no desktop. A proporção certa entre a
  lista e o detalhe depende de a pessoa estar varrendo ou conferindo, que é
  exatamente quando um split se paga — e, com o empilhamento embutido, a tela
  não precisa escrever nada para o telefone.
- **`resizeTargetMinimumSize` está em 44 no ponteiro grosso, e isso não foi
  medido contra conteúdo real.** São 22px de cada lado da costura em que um
  toque destinado ao painel vizinho é engolido pelo arraste. Na página do
  catálogo os painéis estão vazios; a primeira tela com conteúdo colado à
  costura é que vai dizer se o número desce.
- **O anel de foco da costura é recortado pelo `overflow: hidden` do grupo**,
  que a lib declara inline e não deixa sobrescrever. Ele corre a altura toda, e
  o recorte fica nas pontas — verificado que existe, não julgado como defeito.
  Se incomodar, a saída é o `inset-ring-3` do `disclosure-classes`.
- **`useResizableLayout` custa uma remontagem por carregamento.** Quem não
  quiser pagar guarda a proporção em cookie e a entrega pelo servidor, que é o
  caminho que a própria documentação da lib sugere.
- **A demonstração do modo empilhado não empilha no desktop**, porque
  `useIsMobile` lê o viewport e não o contêiner. A página diz para estreitar a
  janela. Uma *container query* resolveria, e mudaria a semântica de `stack`
  para todo mundo — é decisão de outra rodada.

Reproduza a qualquer momento com `npm run ds:audit`.
