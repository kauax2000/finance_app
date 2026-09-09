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
  acento, graduada, que a paleta do catálogo e o `Combobox` dividem — e
  [`bar-classes`](src/lib/bar-classes.ts), a superfície de **barra**: a
  terceira régua de vidro da casa, ao lado de `menu-classes` (a flutuante) e
  `modal-classes` (a modal). Só a veste quem tem conteúdo passando por baixo —
  o cabeçalho fixo do catálogo e a fileira `outline` do `Menubar`. **Nada de
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
  preenche nada. **`tertiary` acende no cursor e no toque** — o par
  `active:` entrou na origem na rodada 29b, porque `hover:` compila dentro de
  `@media (hover: hover)` e sem ele o degrau ficava inerte no dedo. Uma tela tem um `primary` só. Fora da escada, de propósito:
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
- **Superfície ancorada é uma só, e é o `Sheet`** — conteúdo e navegação,
  formulário e menu. Ele tem `side` (de qual borda entra) e `variant`
  (`flush` encostado, `floating` com calha de 8px), e **no telefone tudo vira
  gaveta — menos quem pede `surface="panel"`**. Esse eixo fixa o painel em
  qualquer largura, o padrão `auto` é a regra de todas as ~40 folhas do app, e o
  **único** consumidor é a navegação: um menu entra pelo lado, não sobe do
  rodapé com alça para listar seis links. Não há como forçar a gaveta — para
  isso existe o `Drawer`. Na `Sidebar`, `side` reordena o layout de verdade
  desde a rodada 65
  — `order-last` no visual, com a ordem do DOM intacta para os `peer-*` —, e o
  `floating` é a placa de vidro **pintado**: sem borrão, porque ela reserva a
  própria calha e não há o que borrar atrás. Isto **inverte** a rodada que criou o `EdgePanel`: ela separou os
  dois porque a `Sidebar`, pegando a folha emprestada, abria como gaveta de
  baixo com alça de arraste para listar seis links, e a regra passou a ser que
  navegação continua painel em qualquer largura. A rodada 64 aceitou a gaveta de
  volta e dissolveu o componente — sem consumidor que precisasse do painel em
  toda largura, ele era uma segunda API para a mesma moldura.
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
  uma gaveta lateral teria a alça de enfeite outra vez. Borda lateral é o ramo
  desktop do `Sheet`. A alça é uma peça só — o [`DragHandle`](src/components/ui/drag-handle.tsx) —,
  que a folha e a gaveta compõem, e todo `!` dela é o que troca o cinza literal
  e as medidas que o `vaul` injeta numa folha de estilo própria.
- **A alça é da superfície.** No telefone o `vaul` a desenha e ela **é** a área
  de arraste; no desktop não há alça, porque a folha lateral não se arrasta.
  Uma tela nunca a escreve — as **31 chamadas em 27 arquivos** que faziam isso
  saíram na rodada 34, junto com o `MobileSheetFormDragStrip`.
- **A folha não injeta o ×, e não existe `showCloseButton` nela.** O botão é
  uma peça: `DialogCloseButton`, composta como último filho do `SheetContent`.
  Ele saía de fábrica e **16 das 36 chamadas o desligavam**, porque um ×
  flutuante passa por cima do conteúdo e some atrás de um cabeçalho fixo assim
  que a pessoa rola — dentro de um cabeçalho, o lugar dele é o `endAdornment` de
  um `DialogHeaderRow`, e ali ele vai com **`placement="inline"`**: o eixo
  nasceu na rodada 60, quando o `MobileSheetFormHeaderCloseButton` (que existia
  só para isso) foi absorvido junto com o resto do chrome de folha. A reserva de
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
  é a superfície da fileira (`outline` se sustenta sozinha **e é a única de
  vidro** — ela veste `barSurfaceClassName`, a mesma receita do cabeçalho fixo;
  `plain` entra num cabeçalho que já tem moldura, e fica transparente porque
  quem tem o vidro ali é o cabeçalho; `solid` é bandeja da mesma **tinta** que a
  do `TabsList`, e não da mesma medida — `p-0.5` mais borda contra `p-1`, porque o
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
corpo de `P`". `Switch` ainda diz `size="default"` — o `SidebarMenuSubButton`
foi o último de `ui/` a perdê-lo, na rodada 35.
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

Contagem viva das camadas: **7 · 28 · 15 · 30 · 2 · 7**. O número da seção da
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
propósito. Ela não importa a régua do `DragHandle` — a tinta é escrita literal
aqui —, e a rodada 34 mediu o outro lado: a alça, com 2,25× a área desta pega,
reprova no **mesmo** degrau. Área muda como a cor lê, não o que a 1.4.11 exige,
e os dois arraste do sistema estão em 70%.

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

### Rodada 29 — o carrossel pedia a sala emprestada

`carousel.tsx` era o shadcn intacto, com zero consumidores, passando **limpo** no
`ds:audit` e saindo com **`—`** na coluna de variantes do `ds:catalog` — os dois
sinais que a rodada do `resizable` nomeou.

**As setas moravam fora da caixa.** `-left-12` e `-right-12` são 48px **para
fora** da região: o componente não se dimensionava, ele exigia que o pai lhe
cedesse sala. Medido na página do catálogo, num contêiner de 958px — recorte de
297 a 1255, seta anterior de **289 a 317**, seguinte de **1235 a 1263**, 8px
fora de cada lado; `scrollWidth` do pai **966 contra 958** de `clientWidth`, ou
seja o carrossel dava ao contêiner uma barra de rolagem horizontal fantasma; e
`elementsFromPoint` a 90% da largura da seta seguinte devolvia uma `div`, **não
o botão**. Um pedaço da seta não era clicável.

Hoje `controls` é eixo: `inside` (o padrão) pousa a seta sobre a borda do
viewport, e **`outside` reserva a própria calha** — `px-12` na raiz, seta em
`left-0`, mesma distância visual de antes. Nenhuma coordenada é negativa em
nenhum modo, e a asserção 4 do teste é o que impede a volta. Medido depois:
**zero** setas fora da raiz nos 15 carrosséis da página, e **zero** de transbordo
horizontal, contra os 8px de antes.

**A documentação afirmava um comportamento que o código nunca teve.** A página
dizia que *"as setas não existem no telefone"*; medido a 375px, `display: flex`
nas duas, **28×28**, sobre o conteúdo. Mesmo achado da rodada do `resizable`. E
a conclusão inverteu: sumir com elas **violaria a WCAG 2.5.7**, que exige
alternativa sem arraste. Elas ficam, e crescem no toque.

**A lib publicava treze mecanismos e o arquivo lia quatro.** `scrollProgress`,
`scrollSnapList`, `selectedScrollSnap`, `scrollTo`, `slidesInView` e os eventos
`scroll`, `settle`, `slidesInView`, `slideFocus`, `slidesChanged` estavam todos
lá; o arquivo lia `canScrollPrev/Next` e `select`/`reInit`. Daí saíram
`CarouselDots` (`dot | bar`) e `CarouselStatus`.

**Dois papéis sem nome**, a medição que o `Popover` e o `resizable` já pagaram:
`role="region"` sem `aria-label` (medido, `hasAccessibleName: false`) e cada item
`role="group" aria-roledescription="slide"` **sem rótulo** — quatro grupos
anônimos. A posição passou a vir do **contêiner**, como na `BreadcrumbList` e no
`Stepper`. Mais três defeitos reais: o teclado tratava só as setas horizontais
inclusive na vertical, a limpeza não desinscrevia `reInit`, e o
`orientation || (opts?.axis === "y" …)` era inalcançável.

#### Seis coisas que só apareceram medindo

- **A seta se centra no viewport, e não na raiz.** `top-1/2` parece a resposta e
  não é: a raiz também carrega os pontos e a contagem. Medido, com um
  `CarouselDots` no telefone — raiz 131, viewport 75, seta **28px abaixo** do
  centro e com a borda de baixo **fora** do trilho. A âncora virou
  `--carousel-control-y`, com `50%` declarado no `cva` para não haver salto
  antes da medição.
- **E `offsetTop`, não metade da altura.** O bloco que contém um absoluto é a
  **caixa de padding** da raiz — desconta a borda, **não** o recuo. Com o `p-3`
  de `card` e `inset`, a seta saía **11px acima** do centro. `offsetTop` é medido
  a partir dessa mesma caixa; é a escolha que o marcador do `Tabs` registra.
  Medido depois: desalinho **≤1px** nas 14 setas da página.
- **O alvo de dedo por pseudo-elemento não dá 44 — dá 42.** Pela mesma razão: a
  base é a caixa de padding, então um `icon-sm` de 28 com 1px de borda entra na
  conta como **26**, e `-inset-2` fecha em 42. Medido, `::after` reportava
  `42px`. O degrau daqui é `2.5` (26 + 20 = **46**, e 44 é piso). **As três
  ocorrências que a casa já tinha carregam o mesmo desconto e afirmam 44 nos
  comentários** — `PageHeaderBack`, o × da `AnnouncementBar` e os degraus do
  `Breadcrumb`, todos 42. Está no backlog.
- **O ponto apagado reprovava a 1.4.11.** `bg-foreground/25` dava **1,78 no claro
  e 2,22 no escuro**. Varridos os degraus contra o fundo real, **45% é o primeiro
  que passa nos dois** — 3,15 e 4,36. O ativo é `--primary-accent`: 7,66 e 6,14.
- **A seta desabilitada tapava o conteúdo.** Em `inside` ela pousa sobre o
  trilho, e no início a seta anterior ficava por cima do **primeiro item**, que é
  o único inteiro na tela — medido, cobrindo o "R$" de um valor. Ela passou a ser
  `disabled:invisible`, e **só em `inside`**: em `outside` há calha reservada, e
  um botão sumindo faria a moldura piscar a cada ponta.
- **O trilho vertical precisa de `h-full`, e isso é carga estrutural.** O embla
  mede o **contêiner**, não o viewport: com a altura só no viewport o trilho
  crescia até o conteúdo — medido, viewport **160** contra trilho **362** —, o
  embla concluía que tudo cabia e **desabilitava as duas setas** com o conteúdo
  transbordando calado. Com `h-full`, `basis-1/2` também volta a significar
  metade do que se vê.

**A dissolução reusa a rampa e traz motor próprio.** `useScrollFade` **não pode**
dirigi-la: o embla translada o trilho, e medido o viewport fica com
`scrollLeft: 0` enquanto o `scrollWidth` é 1476 contra 730 de `clientWidth` — o
hook reportaria início 0 e fim 746 para sempre, e a ponta esquerda nunca
acenderia. A rampa continua sendo `scroll-fade-x`; só o motor é daqui,
publicando `--scroll-fade-start/end` a partir de `api.scrollProgress()`. As
invariantes valem: a máscara vai no viewport, que não desenha nada, e quem pinta
é a raiz — as setas são **irmãs** do viewport, então a máscara não as alcança.

**O `variant` de superfície entrou contra a contagem.** Nenhuma tela pede uma
superfície para o carrossel, e a régua da casa é que eixo sem contagem é ficção —
o precedente é a `Toolbar`. Ele existe por decisão explícita do dono, tomada com
esse custo na mesa, e fica registrado assim em vez de ser apresentado como se a
medida o tivesse pedido. `card` e `inset` **forçam `controls="inside"`**, com a
precedência que `scrollable` usa sobre `stretch` no `Tabs`, e **nenhuma das duas
declara `overflow-hidden`** — ela cortaria o anel de foco de 3px das setas.

**Sem autoplay, e é decisão.** Nenhum plugin do embla está instalado; todos são
dependência nova. E num app de finanças conteúdo que se move sozinho enquanto a
pessoa lê um valor é hostil, e exigiria pausa no cursor, no foco e em
`prefers-reduced-motion` para não virar defeito de acessibilidade.

**Duas armadilhas conhecidas cobraram de novo, e uma pegou a sonda.** Varrer os
degraus de alfa com `` `bg-foreground/${p}` `` devolveu razão **1 em todos** —
nenhuma daquelas classes existe na folha, porque o Tailwind varre o código como
texto. É a mesma medição que a rodada 16 registra, e desta vez o instrumento é
que estava errado; a sonda passou a usar `color-mix` inline. E medir alfa exige
**compor sobre o fundo real**: a primeira tentativa leu `oklch`/`oklab` com uma
regex de `rgb()` e reportou 1,55 e 1,00 onde os números são 7,66 e 1,78. Quem
converte é o navegador — um pixel num `canvas`.

**E a página do catálogo contradizia a própria nota.** A demonstração de
`variant="card"` renderizava `Card` dentro de `Card`, três centímetros acima da
nota que diz que cartão dentro de cartão é sempre errado. Quem mudou foi a
demonstração, não a nota.

### Rodada 29b — a seta viajava, e ancorar em variável foi o que a fez viajar

A rodada 29 pôs as setas dentro da caixa e ancorou-as no centro do trilho por
`--carousel-control-y`. A geometria ficou certa — desalinho ≤1px nas 14 setas — e
nasceu um defeito de **movimento**, que medir posição não pega. O relato foi *"o
travel da seta está muito alto; eu clico e ela desce lá embaixo"*.

**Duas causas somadas.** `top` passou a sair de uma variável escrita por JS, e a
base do `Button` declara `transition-all`: toda remedição virava **animação** da
seta atravessando o cartão. Prova direta — trocando a variável, a seta ainda
estava na origem um quadro depois e só assentava 300ms adiante. E o `cva` declara
`50%` como palpite pré-medição, mas `top: 50%` resolve contra a **raiz**, que
inclui pontos e contagem: medido, raiz **111px** dá 55 contra os **37,5** do
centro do trilho — **17,5px** percorridos animadamente na primeira pintura.

São **dois consertos independentes**, e nenhum sozinho fecha o caso: o **layout
effect** mata a viagem da primeira pintura (o cliente nunca pinta o palpite), e
`transition-colors` mata a das remedições posteriores, que efeito nenhum alcança.
`transition-colors` e `transition-all` são o mesmo grupo no `twMerge`, então a
classe do controle **substitui** a da base em vez de disputar — o mecanismo da
régua de densidade da `Toolbar`. Medido depois: **12 quadros consecutivos com um
valor só**, contra 420→462 antes.

**A seta perdeu o fundo e o círculo, e isso é convergência.** `tertiary` nos dois
modos, `rounded-lg` pelo próprio `Button`. Das três famílias de seta da casa, o
`Calendar` e a `Pagination` já eram assim; esta era **a única `rounded-full` do
repositório e a única com fundo em repouso**. Com um peso só,
`defaultControlVariant` deixou de existir — uma função que escolhe entre dois
pesos, com um peso, é constante disfarçada —, e `controls` voltou a decidir só a
posição. Medido depois: **um raio só (10px) e um fundo só (transparente)** nas 14
setas.

**`fade` virou padrão**, e as duas mudanças se sustentam: sem preenchimento o
glifo pousa direto sobre o conteúdo, e a rampa é o chão dele. Medido, o glifo sem
fundo dá **18,97 sobre a página e 17,18 sobre o cartão** no escuro, 18,97 e 19,8
no claro — o `foreground` é contraste máximo por definição, então tirar a
pastilha não custou legibilidade. Dissolução ligada em **15 de 15** carrosséis.

**O par `active:` entrou na origem, e o backlog contava menos do que havia.** A
regra é mecânica: `hover:` compila dentro de `@media (hover: hover)`, e está
verificado no CSS emitido — `.hover\:bg-muted` sai **dentro** da media query e
`.active\:bg-muted` **fora** dela. O `AGENTS.md` registrava o defeito só no
`tertiary`; medindo as cinco variantes que pintam fundo, **quatro** estavam
inertes ao toque. Foi consertado o `tertiary` (o que a seta veste, e o que estava
autorizado), e as outras três ficaram numa lista explícita em
`button-touch-response.test.ts` — que **falha se a lista crescer**, em vez de o
teste ser afrouxado para caber no estado atual.

#### O nudge de press roubava a centragem, e a colisão era de propriedade

Restava um terceiro movimento, e ele não era o mesmo defeito: ao **apertar**, a
seta caía 15px. No Tailwind v4 `translate` é propriedade independente, e
`-translate-y-1/2` e o `active:translate-y-px` da base do `Button` escrevem a
**mesma** custom property. Verificado no CSS emitido:

```
.-translate-y-1\/2      { --tw-translate-y: calc(calc(1 / 2 * 100%) * -1) }
.active\:translate-y-px { &:active { --tw-translate-y: 1px } }
```

`.classe:active` é (0,2,0) contra os (0,1,0) da centragem, e vence sempre: no
press a seta ia de **−14px para +1px**, perdendo a centragem inteira. **Um nudge
de press por `translate` é estruturalmente incompatível com centragem por
`translate`** — vale para qualquer controle absoluto centrado assim, não só para
este.

A saída **não é remover o afundamento** — a primeira tentativa fez isso, e o
resultado foi um botão sem resposta de clique. É somar os dois na **mesma
declaração**: `active:translate-y-[calc(-50%_+_1px)]`. O `-50%` é a centragem, o
`1px` é o mesmo degrau do `Button`, e eles compõem em vez de um apagar o outro.

A entrega é pelo **`twMerge`, e não por especificidade**: mesma família de
utilitário sob o mesmo variante, então a classe do controle **remove**
`active:translate-y-px` da lista em vez de disputar com ela por ordem de
emissão — verificado no DOM, a da base não está mais lá. Na vertical a centragem
é em X, o nudge em Y não colide, e ele fica cru.

**E a transição precisou ser enumerada, não escolhida entre dois atalhos.**
`transition-all` traz `top` junto, e é ele que faz a seta viajar a cada
remedição; `transition-colors` não alcança `translate`, e mata o press. A lista é
`[color,background-color,border-color,translate]` — o mesmo idioma de
`transition-[rotate,translate,color]` em `disclosure-classes`. **A âncora medida
salta; o press desliza.**

Medido com press real mantido, amostrando por quadro: repouso **24**, durante
`:active` **25**, e 24 de volta ao soltar — **1px**, contra os 15 de antes.

#### A dissolução vertical dissolvia os lados

O viewport carregava `scroll-fade-x` **cravado**, em qualquer orientação. Num
carrossel vertical isso dissolvia as bordas **laterais** — que não se movem —
enquanto o conteúdo entrava e saía por cima e por baixo, nítido. Achado pelo
dono, olhando a demonstração.

O que torna esse defeito difícil de ver por medição: as duas utilities leem as
**mesmas** `--scroll-fade-start/end`, e o motor já calculava o eixo certo
(`scrollHeight - clientHeight` na vertical). Então `data-scroll-fade` ligava, a
máscara existia, as variáveis se moviam ao arrastar — tudo o que uma sonda
costuma perguntar respondia "certo". A única diferença é o eixo do gradiente, e
isso só o olho pega. Mudou uma linha; o driver não precisou de nada.

**E o teste que devia pegar tinha o mesmo ponto cego.** Ele casava a string
literal da chamada, com o nome da constante horizontal dentro — passava por
acidente, e teria quebrado em qualquer refatoração inocente. Foi reescrito para
olhar o que importa (as classes proibidas no nó mascarado, e a escolha do eixo
ser condicional), e **verificado reintroduzindo o defeito**: reprova.

Fica a régua: *asserção que casa a forma da chamada não testa o comportamento —
ela testa a digitação.*

#### A calha do `outside` era um número herdado, e ela descolava a seta

Fechado o movimento, sobrou o espaçamento. `outside` declarava `px-12` (48),
medida que veio do `-left-12` do shadcn e que eu preservei por fidelidade à
distância antiga — argumentando, na própria rodada 29, que a distância visual era
"a mesma de antes". Preservar o número certo pelo motivo errado: aquele 48 nunca
foi decidido, era o que o shadcn tinha.

Medido: botão de 0 a 28, conteúdo começando em 48 — **20px de fundo puro** entre
os dois. E como a dissolução mora na borda do viewport, ela nascia *depois* desse
vão: a seta lia como solta, e não como parte da tira que ela controla. Em
`inside` o mesmo par se sobrepõe, e é por isso que aquele modo sempre pareceu
melhor.

A calha passou a ser **a seta mais um respiro**: 36 = 28 do botão + 8, que é
`--space-inline`, a distância que esta casa usa *dentro* de um bloco — e a seta e
o trilho são o mesmo bloco. Medido depois: vão de **8px, simétrico nos dois
lados**, com a dissolução encostando na seta.

De brinde, o modo ficou menos caro no telefone: a calha total caiu de 96 para 72,
de **32,8% para 24,6%** da largura útil. Continua caro, e continua sendo a razão
de `inside` ser o padrão.

#### Três leituras erradas do instrumento, e as três são erros meus

A primeira "reprodução" mediu `scrollY` caindo 155 → 137 num quadro, com a seta
descendo 18px na tela — número que batia com o sintoma relatado. **Era a minha
ferramenta.** O registrador mostrou o `scroll` em `t=150632` e o `pointerdown` em
`t=150644`: a página rolou **12ms antes de o clique começar**, porque clicar por
referência rola o alvo para a vista primeiro.

É a parente da lição do calendário — *evento sintético pula o hit-testing* — com
o sinal invertido: ali o instrumento **escondeu** o defeito, aqui ele o
**produziu**. A confirmação real veio de `transitionProperty` e da prova de
animação, que não dependem de clique nenhum. **Corolário para quem vier medir
esta peça: leia a posição da seta relativa à raiz, nunca absoluta na tela.**

Mais duas, no mesmo dia. **Medir `:active` no `pointerdown` lê o início da
transição, não o fim** — com o press animado, o valor computado ali ainda é o de
repouso, e eu quase concluí que o afundamento não existia. Press se mede
**mantido**, amostrando por quadro. E **um regex sobre o CSS emitido precisa
escapar como o Tailwind escapa**: procurando `translate-y-\[calc(` eu li "regra
não emitida" sobre uma regra que estava lá, porque o nome real é
`.active\:translate-y-\[calc\(-50\%_\+_1px\)\]` — com `\%` e `\+`. Duas
vezes seguidas o instrumento inventou o defeito; a régua é sempre a mesma:
**quando a medição contraria o mecanismo, desconfie da medição primeiro.**

### Rodada 30 — o gráfico prometia um sistema e entregava encanamento de cor

`chart.tsx` era o fork do shadcn quase intacto: 363 linhas que faziam **uma**
coisa — ler `config` e emitir `--color-<chave>` num `<style>` escopado por
`[data-chart]`. O resultado é medível: **1 consumidor em 8**. Sete telas
escreviam tudo à mão — 4 tooltips (a mesma casca `rounded-lg border-border/80
bg-popover`, quatro vezes), 3 legendas, 4 `Intl.NumberFormat` redeclarados com
`currencyBRL` ao lado, 4 `tickFormatter` compactos inline e **nenhum** chamando
`currencyCompactBRL`, que é a regra que `/designsystem/graficos` manda seguir.

A raiz do abandono cabia numa linha: o tooltip formatava com `numberBR`, então
**uma série em reais saía `8.432`, sem `R$`**. Quem precisava de dinheiro não
tinha como pedir. É a inversão que `Form`, `MoneyInput` e `Alert` já
registraram — a resposta não é reclassificar, é fazer o componente ser o que o
nome promete.

**Duas camadas.** A anatomia (`ChartContainer`, `ChartGrid`, `ChartXAxis`,
`ChartYAxis`, `ChartTooltip`, `ChartLegend`, `ChartReferenceLine`) é a régua e
continua livre — quem monta um `ComposedChart` compõe ela. As cinco formas
(`ChartArea`, `ChartLine`, `ChartBars`, `ChartDonut`, `ChartSparkline`) são a
forma curta sobre a anatomia, como `FormInput` é sobre `Field` + `Input`, e
**elas cobram `label`**: a forma curta pode cobrar o nome acessível, a
composição livre não pode. Mais `ChartEmpty` / `ChartSkeleton` / `ChartError`
(nenhum dos oito gráficos tinha estado vazio) e `ChartDataTable`, a alternativa
não-visual que não existia em lugar nenhum do app.

#### A rampa reprovava, e o comentário dela afirmava o contrário

`globals.css` dizia "cinco matizes a ~60° de distância". Medidos, os intervalos
entre os matizes ordenados eram **111 · 39 · 57 · 68 · 85** — `--chart-1` e
`--chart-2` estavam a 39°. Por um validador de paleta (ΔE em OKLab ×100, todos
os pares), a rampa antiga reprovava duas vezes em cada tema:

| | claro | escuro |
| --- | --- | --- |
| CVD, todos os pares | **4,9** protanopia (`chart-4 ↔ chart-1`), piso 8 | **2,8** deuteranopia |
| visão normal | **14,6** (`chart-2 ↔ chart-1`), piso 15 | **11,9** |

Numa rosca de cinco fatias, quem não separa vermelho de verde via a série 1 e a
4 **como a mesma cor**. E o diagnóstico estava errado junto com o número: matiz
sozinho nunca separou esta rampa — quem separa é matiz **e** claridade, e é por
isso que o re-passo move as duas. Depois: **8,8 protanopia · 16,8 visão normal**
no claro, com os cinco mantendo ≥3:1 contra `--card`.

**No escuro, a faixa de claridade perde para a separação, e é decisão.** A
faixa que o validador pede (L 0,48–0,67) e a separação CVD brigam sobre
superfície escura: comprimir a claridade tira justamente o canal que separa
magenta de ciano para quem não distingue vermelho de verde. Três candidatos
dentro da faixa foram medidos e os três reprovam em CVD (**4,6 · 3,1 · 2,3**).
A rampa escura fica acima da faixa e passa no resto — 10,6 CVD · 17,1 visão
normal · ≥3:1 —, como o `--input` fora da 1.4.11. A faixa é heurística sobre uma
superfície de referência; a separação é um leitor que não consegue ler o
gráfico.

**Não entrou `--chart-6.`** Uma sexta série não é um matiz novo: ela vira
"Outros", e quem agrega é quem tem os dados. O que o componente garante é não
mentir — `chartSeriesColor` devolve `--muted-foreground` do sexto em diante, em
vez de repetir `--chart-1` como o `BAR_COLORS[idx % 5]` de
`credit-cards-history-chart` faz hoje.

#### O anel de foco estava apagado, e apagá-lo custava o teclado

A versão anterior escrevia `outline-hidden` em `.recharts-layer`,
`.recharts-sector` e `.recharts-surface`. O que isso apagava era o foco de
teclado que o `accessibilityLayer` do Recharts desenha — e a versão instalada é
a **3.8.0**, onde ele vem ligado de fábrica; `bill-history-analytics.tsx:148`
chegava a passar `accessibilityLayer={false}`, o único do repositório.

**Duas armadilhas, as duas medidas com `Tab` de verdade.** `outline-none` e
`outline-2` escrevem **propriedades diferentes** (`outline-style` e
`outline-width`): com a supressão em `:focus` e o anel em `:focus-visible`, os
dois seletores empatam em (0,2,0), as duas declarações valem, e o anel saía com
largura 2px e estilo `none` — invisível. Por isso a supressão é a base **sem
pseudo** e o anel é `:focus-visible`, que vence sempre, com `outline-solid`
escrito. E **foco por script não liga `:focus-visible`**: verificar isto com
`element.focus()` reporta "sem anel" numa implementação correta. Medido depois,
com `Tab`: `solid 2px oklch(0.72 0.13 166)`, offset 2, e o cursor de teclado
abrindo o tooltip.

#### Quatro medidas que só apareceram no navegador

- **O miolo da rosca saía 118px à direita do centro do anel.** Ele era irmão do
  `ChartContainer` dentro de um envelope `relative`, e `inset-0` mede o
  envelope — que estica na coluna enquanto o container tem 176px. Ele passou a
  ser o `overlay` do próprio container, que é **a caixa que tem tamanho**.
  Medido depois: 0 e 0.
- **A escada de corpo do miolo mentia de dois jeitos.** Por não conhecer a
  caixa (`R$ 3.510,00` cabe folgado numa rosca de 300px e transborda numa de
  176) e por supor que o texto quebra: o `Intl` separa `R$` do número com
  espaço **inseparável**, então `text-balance` e `max-width` não faziam nada —
  145px de texto numa linha só dentro de um furo de 109. Hoje é conta:
  `88 / n` por cento da caixa, em `style` e não em classe, porque classe
  montada em tempo de execução não existe.
- **O eixo Y comia o cifrão no telefone.** `width={56}` servia no desktop; a
  375px, `R$ 22 mil` e `R$ 5,5 mil` saíam `$ 22 mil` e `$ 5,5 mil`. Hoje é
  `width="auto"`, que o Recharts 3 calcula a partir dos rótulos. Medido: zero
  rótulos cortados e zero rolagem horizontal.
- **`nameKey` estava servindo de chave do React na legenda.** Ela diz *em que
  campo do payload está o nome*, então as cinco fatias saíam com
  `key="nome"` — React reclamando de chave duplicada, e a identidade dos itens
  perdida entre renders. São duas chaves, e confundi-las é bug.

#### O medidor tinha geometria de rosca, e as duas coisas que isso quebrava

Ele nasceu como um `Pie` de meio arco com o anel e a caixa da rosca, e as duas
heranças cobraram:

- **O arco era grosso demais para o número.** Com o raio interno da rosca (62%
  do máximo), a corda interna **na altura do topo do texto** media 42px — e
  `76%` já ocupava 43. Ele encostava no arco desde o primeiro dia, e `100%`
  invadiria. Um medidor é convencionalmente um arco fino: o miolo dele é o
  número, não uma reserva. Com a espessura própria e o raio a 130% do máximo
  (o Recharts aceita acima de 100), a corda vai a **103px**: `76%` fica com 30
  de folga por lado, `100%` com 22, e `1.284%` ainda cabe.
- **A caixa era quase metade vazia, e era isso que afastava a legenda.** O
  Recharts centraliza o círculo inteiro, então um meio-arco num quadrado
  deixava **68px mortos embaixo** — não era um `gap` grande, era vazio dentro
  do SVG. `cy` a 86% e proporção `standard` por padrão encostam o arco na base:
  o vão até a legenda caiu de 68 para **25px, o mesmo das outras duas formas**,
  medido lado a lado.

O rótulo deixou de se apoiar no centro da caixa e passou a se apoiar na origem
do arco, por `bottom` em porcentagem — que resolve contra a **altura**, e é o
que faz a âncora não depender da proporção. Quem chama escreve
`<ChartDonutCenter value="76%" />` sem saber disso: a variante é do
`ChartDonut`, então é ele que injeta `align="gauge"` por clone, como o `Button`
e o `Stepper` já fazem com `asChild`.

#### E o anel saía 102px fora do centro da própria legenda

O envelope da rosca era `flex w-fit flex-col`, e o alinhamento padrão de uma
coluna flex é `stretch`. Como o `ChartContainer` tem largura própria, ele não
esticava — encostava na esquerda de uma caixa cuja largura quem definia era a
legenda: medido, 208px de anel num envelope de 412. O medidor escondia o
defeito, porque a legenda de dois itens é mais estreita que o anel. `items-center`
resolve, e o `w-fit` fica: ele é `fit-content`, que respeita o espaço
disponível, então a legenda continua quebrando em duas linhas a 375px em vez de
esticar o envelope — trocá-lo por `w-full` teria consertado o centro e
estourado o telefone.

#### A página prometia "sem animação de entrada", e o Recharts animava

A nota de fechamento do catálogo dizia que num app de finanças um valor que se
move enquanto a pessoa o lê é hostil. O componente não fazia isso: o Recharts
anima de fábrica, e **não olha `prefers-reduced-motion`**. É a classe de defeito
que esta base já achou várias vezes — a documentação afirmando o que o código
não faz.

E ela tinha um sintoma que eu tinha classificado como "o Recharts renderiza
tarde": medido na carga da página, 77 barras, 5 áreas e 6 linhas desenhavam, e
**os setores das roscas eram zero** até a pessoa rolar até elas — porque a
animação do `Pie` só começa quando o setor entra em cena. Um gráfico que não
existe até ser olhado não é uma transição, é uma ausência. Com
`isAnimationActive={CHART_ANIMATION}` nas sete marcas: 12 setores presentes sem
rolagem nenhuma.

#### Duas decisões de forma, e o que o eixo comprime

**A ponta da barra arredonda e a base não** (`[4, 4, 0, 0]`, nunca `radius={4}`):
arredondar os quatro cantos levanta a barra da linha do zero, que é onde um
gráfico de barras diz a magnitude. **Os 2px entre segmentos empilhados e entre
fatias são pintados**, com `stroke` em `var(--chart-surface)` — a variável que o
container declara e todo mundo herda; com `transparent` o vão mostraria o
segmento de trás. **A legenda liga sozinha na segunda série e some na primeira**
(`legend ?? series.length >= 2`): com uma série o título já a nomeia.

**O eixo comprime e o tooltip não.** `format="currency"` escreve
`R$ 1.234.567,00` no tooltip e `R$ 1,23 mi` no eixo, porque um rótulo de eixo
precisa caber numa calha e um tooltip precisa dizer o centavo. E `compact` larga
os centavos abaixo de mil — sem isso a base do eixo saía `R$ 0,00`. Nenhum dos
dois caminhos tem `Intl` neste arquivo: os sete formatos resolvem em
`lib/formatters` e `lib/transaction-date`, e a regra **I** do auditor tranca.

#### Duas lições de método, e as duas são erros meus

**A minha sonda de medição inventou uma constante 20% errada.** Ao calcular o
avanço da fonte mono, clonei o `<span>` para fora do contexto de *container
query*: ali `cqw` é inválido, a sonda mediu a fonte herdada e reportou 0,75em
onde o valor é 0,6. O número da rosca encolheu à vista antes de eu desconfiar
do instrumento. Quando a medida contraria o mecanismo, o instrumento é o
primeiro suspeito — é a terceira vez que esta base registra isso.

**Asserção que casa o texto do fonte testa o comentário, não o código.** Duas
asserções do teste novo reprovaram na primeira execução porque o cabeçalho do
componente cita de propósito o que ele deixou de fazer (`outline-hidden`,
`Intl.NumberFormat`). O teste passou a ler o fonte **sem comentários**, que é o
conserto que o auditor já tinha feito em `lineOf`. E ele foi verificado
reintroduzindo os defeitos: com `outline-hidden` de volta e `% 5` no resolvedor
de cor, as asserções 3 e 5 reprovam.

### Rodada 31 — a demo dizia "no telefone" e renderizava o desktop

A seção "Em folha no telefone" enquadrava o chrome de folha numa `<div>` de
384px e o chamava de telefone. **Nenhuma medida de telefone estava ativa.** Os
componentes usam breakpoints de *viewport* (`sm:`, `md:`), não container
queries, e o viewport do catálogo é o da janela — a 1443px, as seis declarações
do chrome resolviam todas no ramo desktop:

| | telefone | o que a demo renderizava |
| --- | --- | --- |
| corpo, recuo lateral | `px-4` = 16px | **20px** (`sm:px-5`) |
| cabeçalho, topo | `pt-2` = 8px | **12px** (`md:pt-3`) |
| rodapé | `flex-col-reverse` | **`row` + `justify-end`** |

Era por isso que o botão saía `justify-end` **e** `w-full` ao mesmo tempo —
duas coisas que nunca acontecem juntas num telefone.

**A saída é um `<iframe>` de 375px**, em `src/app/designsystem/ds-phone.tsx`.
Ele tem viewport próprio, então `@media (min-width: 40rem)` volta a significar
o que diz. Medido depois, com as mesmas classes dentro e fora: **16px, 8px e
`column-reverse`** — os três no ramo certo. Não é `scale()`: escalar daria a
aparência de um telefone com o viewport do desktop, que é o defeito que a peça
existe para não repetir.

A peça mora no catálogo e não em `ui/` — lá cobraria entrada no `registry`,
página própria e o `taxonomy.test.ts`, para um primitivo que só a documentação
usa. É o argumento que o `ds-doc.tsx` escreve sobre si, e o nome segue o `ds-*`
dos vizinhos.

#### A mecânica, e as três coisas que precisaram ser medidas

O CSS do app é **um único `<link>`** mais três `<style>` do dev do Next; os
quatro nós são clonados para o `<head>` do iframe, com um `<base>` antes deles
porque um `about:blank` não tem URL de base e um `url(...)` relativo de
`@font-face` não resolveria. A classe do `<html>` é copiada inteira: ela carrega
as três variáveis de fonte **e** o tema — verificado, a fonte resolve
`Inter, "Inter Fallback"` lá dentro. E `createPortal` mantém **uma árvore React
só**, então contexto, estado e HMR atravessam.

**O tema é espelhado por `MutationObserver`, e não por `useTheme()`**:
`resolvedTheme` é `undefined` até o `next-themes` montar, e o que interessa é a
string inteira do `className`. O observador do `<head>` é o que mantém o HMR
vivo lá dentro — sem ele o iframe congela no CSS de quando montou, justo na
peça que existe para se iterar cromagem de telefone.

#### Três erros meus, os três consertados por medição

**A tela vazia com véu era ficção, e ela custou o contraste.** A primeira versão
reservava 96px acima da folha "para deixar ver a tela atrás". Medido: a folha
`bg-background` sobre o fundo velado dava **1,04:1** no tema escuro —
invisível, um retângulo preto. A causa é que `fillMobileViewport` é
`h-(--sheet-drawer-h)`, ou seja `calc(100dvh - max(0.5rem, env(safe-area-inset-top)))`:
**a folha de formulário do app ocupa quase o viewport inteiro**, e oito
arquivos a abrem assim. O véu tem 8px, não 96. Com a folha preenchendo a tela,
o contraste que importa é contra o `Preview`, e não contra o que está atrás.

**Sem aresta, o telefone não lê como objeto.** A tela é `bg-background` dentro
de um `Preview` `bg-card`: medido, **1,1:1** no escuro. Eu tinha escrito "sem
borda, porque cartão dentro de cartão é errado" — e estava certo sobre o
cartão e errado sobre a aresta. Entrou `ring-1 ring-border`: é a borda do
aparelho, e é `ring` e não `border` porque box-shadow não entra no recorte,
então o raio continua aparando a folha por dentro.

**Eu copiei a área segura em vez de vestir a régua.** A folha escrevia
`pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]` à mão — a segunda cópia da
mesma string. Ela veste `mobileFormSheetContentClassName`, que é o casco que um
`SheetContent` real usa, e é dali que vêm os 24px.

**E eu refazia o `<head>` do iframe inteiro a cada mutação.** O `next-themes`
roda com `disableTransitionOnChange`, que injeta e remove uma `<style>` a
**cada troca de tema** — então trocar o tema derrubava todo o CSS do iframe por
um quadro. O sintoma não foi cosmético: sem estilo o conteúdo colapsa, o
`useScrollFade` mede a folha sem transbordo, e a dissolução ficava **`off` com
50px de rolagem**. A sincronia passou a ser incremental, com um mapa de nó de
origem para clone. Medido através da troca, a 150ms e depois: `fade` em `on`,
transbordo em 50, recuo em 16px e **cinco folhas de estilo o tempo todo**.

#### E os seis defeitos que a mesma demo carregava

- **O botão "Salvar" estava colado na borda de baixo.** `FormActions
  variant="sticky"` não traz `pb` de propósito — o recuo é da superfície. Na
  moldura à mão ninguém o fornecia: `padding-bottom: 0`, medido. Agora 24px.
- **`MobileSheetFormDragStrip` desenhava o vazio.** Ele devolvia um componente
  que **retornava `null` sempre**. Saiu das duas demos — e da base inteira, na
  rodada 34.
- **O `code` divergia da demo em seis pontos**, e um era armadilha: ele mostrava
  `<MobileSheetFormStickyHeader title="…" />`, e `title` renderiza um
  `DialogTitle` que **lança fora de um `Sheet`**. Hoje o `code` mostra o casco
  inteiro, com o `SheetContent`.
- **A folha era `bg-card`, e a real é `bg-background` com `border-t`**
  (`edge-panel.tsx:31,50`). Ela usava `bg-card` porque o `Preview` também é, e
  ali `bg-background` não se separava de nada.
- **A página do chrome desenhava o corpo à mão** — `min-h-0 flex-1
  overflow-y-auto px-4`, a string exata que `MobileSheetFormBody` existe para
  eliminar. Sem ela não havia dissolução nem `overscroll-contain`: rolar a
  folha até o fim rolava a página atrás. Medido depois: `overscroll: contain`.
- **As duas páginas ensinavam o oposto uma da outra sobre o mesmo rodapé.** A do
  chrome desenhava `border-t`; a do `Form` afirmava a regra J. Hoje as duas são
  `FormActions variant="sticky"`, e o fio é `0px`.

**A demo do `Form` passou de três campos para sete.** Não é enfeite: um
formulário curto não precisaria de cabeçalho fixo nem de rodapé fixo — o padrão
que a seção documenta só existe porque o corpo não cabe. Com três, ele
transbordava **17px**, menos que os 44 da rampa de dissolução, e não havia o
que demonstrar. Hoje rola 126 na página do chrome, com `data-scroll-fade="on"`.

#### O que a moldura não conserta, e está escrito na página

Ela troca o viewport do **CSS**, e nada mais. `useIsMobile` lê o `matchMedia`
da janela de fora; os portais do Radix vão para o `body` do documento pai e
escapam do telefone; e `env(safe-area-inset-bottom)` vale zero, porque não há
aparelho — os 24px que se vê são a base, sem os 34 do iPhone. Nenhuma das duas
demonstrações depende dos três, e quem depender precisa saber antes.

### Rodada 32 — o Navigation Menu falava a gramática de outra biblioteca

`navigation-menu.tsx` era o shadcn quase intacto, e trazia os **três sinais** que
as rodadas do `resizable` e do `carousel` já nomearam, os três ao mesmo tempo:
zero consumidores fora do catálogo, **`—`** na coluna de variantes do
`ds:catalog`, e **"Nenhum achado" no `ds:audit`**. Uma pasta calada não é uma
pasta conforme, e um arquivo aprovado também não — as regras que o silenciam
(`A2`, `C`, `C'` sob `isUi`) não olham para nada do que estava errado aqui.

**Metade das declarações era de outra biblioteca.** `data-popup-open:` é
vocabulário do **Base UI**; o Radix escreve `data-state="open"`. Ele aparecia
**quatro vezes** — três no gatilho, uma no chevron —, sempre emparelhado com a
versão que de fato casa, o que tornava o defeito invisível: a interface
funcionava, e metade do CSS emitido não casava com elemento nenhum.

**E o anel de foco era apagado justo onde o teclado é o caminho.** O conteúdo
trazia `**:data-[slot=navigation-menu-link]:focus:ring-0` mais
`focus:outline-none` — um seletor de descendente que removia o anel de **todo**
link dentro do painel. Com o mouse ninguém nota, porque o foco nunca entra ali;
com o `Tab`, a pessoa percorria a lista sem saber em que linha estava.

#### `data-open:` tem especificidade zero, e o realce de aberto perdia para o cursor

O achado que decidiu o desenho. No Tailwind 4.2.2, `data-open:` compila para
`:where([data-open]:not([data-open=false])), :where([data-state=open])` —
**medido no CSS emitido**. Isso é **0,1,0** contra os **0,2,0** de `hover:`, no
mesmo elemento.

O arquivo antigo escondia a consequência escrevendo `data-open:hover:` ao lado
de cada `data-open:`, ou seja compensando por duplicação. Com um `variant`
`solid` — em que aberto é `bg-background` e o realce é `bg-background/60` — a
compensação não bastaria: passar o cursor sobre um gatilho **aberto** o
derrubaria para 60%, apagando o realce exatamente quando a pessoa aponta para
ele.

O gatilho passou a usar **`aria-expanded:`**, que é seletor de atributo de
verdade (0,2,0) — a mesma saída que o `Menubar` já usava, e o Radix carimba o
atributo (verificado em `node_modules`). Pela mesma aritmética, o realce de rota
atual do link é **`aria-[current=page]:`** e não `data-active:`: o Radix escreve
os dois atributos juntos quando o link recebe `active`, e só um deles pontua.
`data-open:` fica onde não há disputa — nas animações da superfície.

#### O marcador já viajava; faltava uma classe

O `Indicator` do Radix se posiciona sozinho a partir de `offsetLeft`/`offsetWidth`
do gatilho ativo, com `ResizeObserver` próprio, e já entende a vertical: **o
mecanismo que a rodada do `Tabs` construiu à mão já estava pago aqui.** O que
faltava era a transição — sem ela, um marcador só pisca de um gatilho para o
outro, que é o mesmo nada que três marcadores acendendo e apagando.

Medido depois, com o menu aberto: `transform, width, height @ 0.2s /
cubic-bezier(0.16, 1, 0.3, 1)` — `--duration-base` e `--ease-out` —, e a caixa
do marcador em **102px contra 102px** de gatilho. Ele deixou de ser peça que o
consumidor lembra de escrever e virou eixo: a fileira o monta quando
`indicator !== "none"`.

**A seta é a ponta do painel, e o defeito antigo não era contraste.** Eu enquadrei
errado na primeira passagem, e a medição me corrigiu: reportei "1,35:1 contra a
página" como o problema, copiando o número que o `resizable` mediu para uma
costura. Mas a seta **não deve** se destacar da página — ela é o bico de um
balão. O número certo é contra o **painel**: o quadrado `bg-border` antigo dava
**1,23:1** ali (pouco para ler como peça, suficiente para ler como emenda) e
ainda lançava um `shadow-md` próprio sobre a sombra que o painel já tem. Hoje é
`bg-popover` com o mesmo `ring-foreground/10`: **1,00**, nenhuma diferença, que é
o número certo para um bico. Quem quer um sinal alto de qual gatilho está aberto
usa `indicator="underline"` — **6,78:1** contra a página.

O recorte tem **2px a mais que a calha**, e isso é estrutural: a base do bico
passa por baixo do painel (que vive em `--z-popover`, acima da fileira) em vez de
encostar nele. Sem isso o `ring` do painel desenharia um fio reto atravessando a
base do bico, e as duas peças voltariam a ler como duas. Medido: sobreposição de
**2,0px**, bico visível de **5,7px**, calha de 8.

#### A escada, e a quinta porta do mesmo defeito

O gatilho era `h-8` cravado — um número sem nome, que nenhuma tela podia pedir
diferente. Entrou a escada da casa: **28 · 32 · 36**, os mesmos nomes e números
do `Button`, do `Input`, do `Tabs` e do `Menubar`, com `pointer-coarse` levando a
40. A fileira **não declara altura**: ela cresce em volta.

É a quinta porta — `Menubar` entregou 24, `Tabs` entregou 27, `Item` teve dois
degraus com a mesma string, `Calendar` entregou 28 onde dizia 36. Medido nos três
degraus: **28/28, 32/32, 36/36**, com a fileira em 34/38/42 (gatilho + 2×2 de
recuo + 2×1 de borda).

**E o link do topo veste a régua do gatilho.** Numa fileira real "Preços" é um
link e "Produto" é um gatilho com painel, e os dois têm de medir igual. Ele
compõe `navigationMenuTriggerVariants` em vez de repetir a escada, então não têm
como divergir no dia em que um degrau mudar — medido, `toplink === trigger` nos
três degraus. Dentro do painel a conta é outra, e ali o link volta a ser linha de
menu.

#### A superfície estava escrita quatro vezes, e uma delas divergia

`rounded-lg bg-popover text-popover-foreground shadow-md ring-1
ring-foreground/10` aparecia em `menu-classes`, em `popover.tsx`, em `select.tsx`
e — **duas vezes dentro do mesmo arquivo** — aqui, com `shadow` no lugar de
`shadow-md`. Saiu **`menuPanelSurfaceClassName`** em
[`lib/menu-classes`](src/lib/menu-classes.ts), e o `menuSurfaceClassName` passou
a compô-la: **a saída dos três menus é byte a byte a mesma**, é extração e não
mudança.

O `navigation-menu` **não** veste a casca inteira, e é decisão: ela traz
`min-w-36`, `flex-col` e as animações por `data-[side=…]`, que aqui não existem.
Vestir para desfazer três quartos por `className` é reimplementar ao contrário.

#### As peças que a tela escrevia à mão

O consumidor escrevia `<ul className="grid w-64 gap-1 p-2">` e **re-estilizava
cada link por dentro** com `block rounded-md p-2 hover:bg-accent`, uma receita
que discordava da do componente em quatro declarações — e quem escrevia isso era
a página deste catálogo. Catálogo escrevendo a anatomia é o sinal de que falta
peça, e o precedente é `FormPickerPopoverEmpty`, `HoverCardBody` e o `actions` do
`PageSectionHeader`.

- **`NavigationMenuPanel`** (`columns: 1 | 2 | 3`) — a grade, o recuo, **o teto e
  a rolagem**. Medido: 274px numa coluna, 570 em duas, dissolução `on` com 126px
  de transbordo.
- **`NavigationMenuLink variant="card"`** mais `LinkTitle` / `LinkDescription` —
  ícone, título e uma linha do que aquilo é. Ele existe sobretudo para **trancar
  o par de identidade**: `gap-y-0`, medido em **0px** entre título e descrição.
  É a quinta vez que esta base persegue o mesmo defeito (`ItemContent`,
  `StatCard`, `FieldContent`, `PageHeaderTitleRow`) e a primeira em que o
  componente o torna impossível de escrever errado.
- **`NavigationMenuSectionLabel`** — `menuLabelClassName` mais `col-span-full`.

**O teto mora no painel, e não no viewport.** O Radix expõe **duas** variáveis
aqui — `--radix-navigation-menu-viewport-height` e `-width` — e nenhuma
`available-height`. Mas ele calcula a primeira a partir do `offsetHeight` do
conteúdo: capar o **conteúdo** devolve a altura já capada, e o viewport anima
para o número certo sem `max-h` nenhum. De brinde, isso satisfaz de graça a
invariante 2 do `scroll-fade` — **o elemento mascarado não desenha nada** —,
porque quem desenha raio, fio e sombra é o viewport.

#### Mais o que estava morto, e o que entrou junto

O `justify-center` do wrapper do viewport era **inerte** (caixa absoluta sem
largura já encolhe até o conteúdo), e o `cn()` dele tinha **um argumento só** e
descartava `className`. Alinhar exige mexer na âncora, e é o que `align` faz — a
tabela é **JavaScript e não seletor**, porque `in-*` compila com `:where()` e o
override da vertical empataria com o `left-1/2` do alinhamento, decidido por
ordem de emissão. Entrou também `orientation="vertical"`, que o Radix já
suportava e o arquivo ignorava por completo (`top-full` e `h-1.5` cravados na
horizontal), mais o par `active:` em tudo que tinha `hover:`, o
`pointer-coarse:min-h-11` no link do painel, o chevron na régua (`size-4` em vez
de `size-3` com `top-px` de calço), `gap-1.5` no lugar do `{" "}` literal, e a
transição enumerada no lugar de `transition-all`.

**Três exports saíram, e os três tinham zero chamadores.**
`navigationMenuTriggerStyle` era um `cva` **sem nenhuma variante** — uma string
só, com um nome que prometia eixos; é a mesma constante disfarçada que
`defaultControlVariant` era antes de sair na 29b. `NavigationMenuIndicator` e
`NavigationMenuViewport` passaram a ser montados pela raiz, como a alça é da
superfície e não de quem abre a gaveta.

#### Três lições de método, e as três são erros de instrumento

**Li a caixa no mesmo quadro da montagem, e "descobri" dois defeitos que não
existiam.** O viewport apareceu 0×0 e o marcador apareceu ausente logo depois de
um `hover` — e a conclusão foi que a abertura por cursor estava quebrada.
Relendo depois de o layout assentar: viewport **288×112** com as duas variáveis
do Radix escritas, marcador presente com `width: 102px`. É a quinta vez que esta
base registra que **medição de layout se lê depois de um quadro**, e a primeira
em que ela quase produziu um conserto para um bug inexistente.

**Coordenada de painel não é pixel de CSS.** Com o viewport emulado em 1440×900,
o quadro de coordenadas do `computer` era **800×553** — hovers no ponto certo do
DOM caíam a centenas de pixels do alvo, e o menu que abria não era o que eu
estava medindo. A saída é hover por `ref`, nunca por coordenada calculada a
partir do `getBoundingClientRect`.

**Evento sintético não abre um Radix.** `dispatchEvent(new PointerEvent(...))`
sobre o gatilho não abriu nada — a mesma lição do calendário, com o sinal
invertido: lá o instrumento escondeu o defeito, aqui ele fabricou um.

#### O que não foi feito, e é dito em vez de silenciado

- **Não há teste de escada** (`navigation-menu-ladder.test.ts`). Foi decisão do
  dono nesta rodada. O que ele trancaria: os degraus serem degraus, nenhum par
  produzir a mesma string, a fileira não declarar altura, zero `data-popup-open`
  no fonte, nenhum `focus:ring-0` apagando anel, e a duração vir de token.
- **`defaultValue` com `viewport` não pinta na primeira montagem.** O Radix mede
  o conteúdo por `ResizeObserver` e, no caminho de `defaultValue`, a medida não
  chega antes da primeira pintura — o painel sai dentro de um viewport de altura
  zero. As três demonstrações que precisam nascer abertas usam
  `viewport={false}`, onde o conteúdo **é** a superfície e não há medida a
  esperar. Não foi investigado a fundo, e não foi contornado no componente.
- **`NavigationMenuSub` continua sem embrulho.** Zero contagem.
- **O app continua sem consumidor**, e isso segue correto: a navegação do produto
  é a `Sidebar` mais a ilha, e o lugar deste componente é a superfície pública
  que o produto ainda não tem. O que mudou é que, no dia em que ela existir, não
  vai precisar inventar a fileira, o painel, o marcador nem o cartão.

#### Rodada 32b — o painel não seguia o gatilho, e a seta nunca saiu do lugar

Relatado pelo dono, olhando a página: *"toda vez que eu clico no segundo
gatilho, ele abre como se fosse do primeiro"*. Eram **dois** defeitos, da mesma
família, e o segundo só apareceu porque o primeiro foi medido.

**O painel ancorava na fileira, não no gatilho.** Com viewport há *um* painel
para a fileira inteira, e o Radix não o desloca — ele nasce onde a casca o
ancorar. Ancorado na fileira, abrir o segundo gatilho punha o painel exatamente
onde o primeiro o pusera. Com `indicator="arrow"` ficava pior: a seta sobre o
gatilho certo e o painel em outro lugar, as duas peças apontando para direções
diferentes.

Entrou **`align="trigger"`**, e ele é o padrão: um `ResizeObserver` na raiz e nos
gatilhos mais um `MutationObserver` em `data-state` — o mecanismo do marcador do
`Tabs` — medem o gatilho aberto e publicam o **centro** dele em
`--navigation-menu-anchor-cx`. Medido depois, nos dois gatilhos: **54,1 e 54,1**,
depois **152,8 e 152,8**, desalinho zero.

**A leitura é por `getBoundingClientRect` e não por `offsetLeft`, e é decisão.**
O `Tabs` faz o contrário, e o comentário dele explica por quê: a trilha dele
rola, e coordenada de tela escorregaria a cada pixel rolado. Esta raiz não rola
por dentro, e aqui `offsetLeft` é que seria errado — pelo motivo do parágrafo
seguinte.

**E a seta nunca tinha saído do lugar.** O `Indicator` do Radix se posiciona com
`translateX(activeTrigger.offsetLeft)`, e `offsetLeft` é medido contra o
**`offsetParent`**. Enquanto o `NavigationMenuItem` era `relative` — herança do
arquivo antigo, que a rodada 32 preservou sem questionar —, esse ancestral era o
próprio `<li>`, e **`offsetLeft` valia 0 para todo gatilho**.

Medido com o segundo gatilho aberto: seta em **45,5**, gatilho em **152,8** —
**107,3px** de desalinho, e a largura travada em 102, a do primeiro. **O
primeiro gatilho acertava por acidente**, porque ali zero é o valor certo, e é
exatamente isso que fez o defeito atravessar a inspeção inteira da rodada 32: eu
medi `translateX(0px)` com `width: 102px` no primeiro gatilho, vi a largura
bater, e declarei o marcador correto. **Uma peça que se move só se verifica em
duas posições.**

O conserto é tirar `relative` do item (e da fileira, que eu tinha acrescentado):
o `offsetParent` volta a ser o `<div style="position:relative">` que o Radix põe
em volta da fileira, que é o mesmo bloco contentor do marcador **e** do painel —
um posicionamento só para as três peças. Medido depois: desalinho **0,1** e
**0,3** (o arredondamento inteiro do `offsetLeft`), com a largura da seta
acompanhando o gatilho, **102 e 91**.

Como o item deixou de ser `relative`, o modo `viewport={false}` passou a usar a
mesma variável medida — antes ele ancorava no `<li>`, o que dava o resultado
certo por outro caminho. Hoje os dois modos falam a mesma âncora.

**E a âncora corre num trilho.** Centrar no gatilho tem um custo que a medição
mostrou: um painel de 600px preso a um gatilho de 91 abre **259px para fora da
raiz**, e num cabeçalho real isso é metade do painel fora da tela. O `medir()`
limita o centro à janela com a mesma folga de 8px do `collisionPadding` do
`Popover`; quando o painel é mais largo que a janela inteira o trilho se inverte,
e aí a conta é descartada em vez de espremer. O painel entra no `ResizeObserver`
na primeira vez que aparece — o Radix o dimensiona **depois** de montá-lo, então
sem isso o clamp rodaria uma vez só, com largura zero. Medido a 700px de janela:
nada para fora em nenhum dos três painéis abertos, com o mais largo deslocado
**22,8px** do centro do gatilho.

### Rodada 34 — a alça era um `null` com 31 chamadas

`sheet-drag-handle.tsx` era, no fonte inteiro, `useSheetSurface(); return null` —
uma chamada de hook cujo valor era descartado, na frente de um `return null`. A
rodada do `Sheet` esvaziou o componente com razão (ele desenhava a promessa do
arraste sem entregá-la) e parou ali. O que ficou tinha cinco defeitos, e os cinco
foram medidos antes de qualquer edição.

**A alça de verdade estava escrita duas vezes, e as cópias já divergiam.**
`sheet.tsx` e `drawer.tsx` escreviam o mesmo `DrawerPrimitive.Handle` mais uma
constante importada de um para o outro, com **dois `data-slot` para o mesmo
elemento** — `sheet-drag-handle` contra `drawer-handle`. Régua compartilhada
morando dentro de um componente é a forma que produziu `menu-classes`,
`field-classes` e `disclosure-classes`; a diferença é que aqui não é só classe —
é elemento, classe e slot —, e nesta casa isso é **peça**.

**E o número do backlog estava errado.** Este arquivo dizia "16 telas ainda o
escrevem", em três lugares. Eram **31 sítios em 27 arquivos** (11
`<SheetDragHandle>` mais 20 `<MobileSheetFormDragStrip>`, que era um embrulho de
uma linha em volta do mesmo `null`), com **11 guardas `{isMobile ? … : null}`**
escolhendo entre dois nadas.

#### A tinta reprovava, e o repositório já tinha o número na mesa

`bg-muted-foreground/35` **por cima da `opacity: .7`** que o vaul declara —
ninguém a desfazia, então o alfa efetivo era **24,5%**, e não 35. Medido contra
`--background`, composto sobre o fundo real: **1,41:1 no claro e 1,46 no
escuro**, contra os 3:1 que a 1.4.11 pede de um componente não-textual. O `/35`
sozinho já daria só 1,64 e 1,85 — números que a rodada do `resizable` **tinha
escrito**, ao rejeitar aquele degrau para a pega dela.

Varridos os degraus, **70% é o primeiro que passa nos dois temas: 3,06 e 4,24**.
É exatamente o degrau a que a pega chegou, por varredura independente e contra
outra superfície — então a tinta de arraste deste sistema tem **um número só**. E
isso derruba o argumento que ficava lá, de que a área explicaria alças mais
claras: a alça tem **2,25× a superfície** da pega e reprova no mesmo degrau. Área
muda como a cor **lê**; não muda o que a norma **exige**. O par de cursor e toque
vai a 90% — **4,61 e 6,36** —, e é um par, porque `hover:` compila dentro de
`@media (hover: hover)` e a superfície que esta peça serve só existe no dedo.

#### O achado que vale mais que o conserto: não é especificidade, é camada

O JSDoc anterior explicava o `!` dizendo que a folha do vaul "entra depois e
empata em especificidade". **A explicação estava errada**, e a rodada só
descobriu porque um conserto falhou.

A regra nova de área de acerto era emitida (verificada na folha), o `matchMedia`
casava, o seletor tinha (0,2,0) contra os (0,1,0) do vaul — e a altura computada
não mudava. A causa: **as utilities do Tailwind v4 vivem em `@layer utilities` e
a folha do vaul é sem camada**, e a cascata resolve a camada **antes** da
especificidade, dando a declaração normal sem camada como vencedora sempre. Quem
inverte isso é `!important`: entre declarações importantes a ordem das camadas se
inverte.

Ou seja: contra uma biblioteca que injeta CSS sem camada, **especificidade não
compra nada** — só `!`. Vale para qualquer dependência que faça isso, e é por isso
que a asserção 1 do teste é uma tabela das propriedades que o vaul declara.

Foi assim que se soube que `rounded-full` estava **sem** `!` e perdia calado:
medido no navegador, o `border-radius` computado da alça era **16px**, o do vaul.
Três classes venciam, a quarta não, e nada apontava a diferença.

#### O alvo, e um bug do vaul que fica documentado em vez de escondido

O vaul quis encolher a área de acerto no ponteiro fino e **errou o seletor**:
`@media (pointer:fine){[data-vaul-handle-hitarea]:{…}}`, com um `:` sobrando
depois do seletor de atributo. A regra é inválida e nunca vale, então os 44px
persistiam no mouse — medido, `document.elementFromPoint` no topo do cabeçalho
devolvia **HITAREA**, com **9px** em que o clique era do arraste.

`pointer-fine:` faz o que a biblioteca pretendia, com um número em vez de `100%`:
**20px**, o dobro dos 10 que o `resizable` reserva para o mouse, e que cabem
inteiros na caixa de margem da alça (6 + 2×10 = 26). Medido depois: **48×20 no
ponteiro fino, com 3px de folga** até o cabeçalho, e **48×44 no grosso**, com os
9px de volta — que ali são corretos, porque não há controle naquela faixa e o
dedo agradece. É por isso que o `my-2.5` da alça é carga estrutural.

#### Duas afirmações falsas, e uma página que demonstrava nada

`drawer.tsx` dizia "o clique nela fecha". O `handleCycleSnapPoints` do vaul só
chama `closeDrawer()` quando `dismissible` é **falso** (`if (!dismissible)`), e
sem `snapPoints` não há o que ciclar — em nenhuma gaveta deste app o clique
fecha. Ela se arrasta, e isso agora está escrito.

E a página do catálogo ensinava um componente que desenha: o `Usage` afirmava
"é a convenção de iOS e Android que diz isto se arrasta", uma `DocNote` atribuía
ao componente um `aria-hidden` que ele não emitia, e a preview renderizava
`<SheetDragHandle />` dentro de um card — **desenhando o vazio**, um
`rounded-t-2xl` de 0px sobre um `border-t`. Ela tinha até uma **exceção nominal**
em `ds-phone.test.ts` para poder continuar assim; a exceção saiu junto, e a
asserção 3 daquele teste ficou mais estrita.

A página nova demonstra o gesto em **gavetas de verdade**, arrastáveis na própria
página (o precedente é `docs/drawer.tsx`), e uma delas desenha o contorno da área
de acerto por seletor local, para o invisível aparecer.

#### A camada mudou porque a implementação mudou

Ela era **Organismo**, justificada por "consome o contexto do `Sheet`". Parou de
consumir quando voltou a desenhar, e virou **Átomo**: indivisível, um elemento,
zero imports de `ui/`. O `<span data-vaul-handle-hitarea>` é anatomia interna do
vaul, não composição — a mesma régua que faz o `Slider` átomo com quatro
primitivas Radix por dentro. É a terceira vez que este arquivo registra a
etiqueta seguindo a implementação, e não o contrário.

**Sem eixo, e a contagem é a razão:** uma geometria, duas superfícies, nenhuma
tela pedindo outra. O `ds:catalog` sai `—` na coluna de variantes, e isso é
sinal para olhar, não mandato para inventar — foi olhando que os cinco defeitos
acima apareceram. O que existe é o `showHandle` do `DrawerContent`, e ele é da
superfície porque a pergunta que responde ("esta gaveta se arrasta?") é dela.

#### Três lições de instrumento, e uma delas é um erro meu

**`git checkout` como desfazer reverte o arquivo inteiro.** Ao testar se o teste
novo pegava o defeito, acrescentei uma linha a `bills-toolbar.tsx` e a desfiz com
`git checkout` — que devolveu o arquivo ao `HEAD` e **apagou a migração que eu já
tinha feito nele**. Só apareceu porque a varredura seguinte contou as
referências. Desfazer edição de teste com `git` num arquivo já editado é apagar
trabalho; a varredura de confirmação é o que salva.

**Ponteiro não persiste entre chamadas do harness.** Medir `:hover` numa chamada
separada da que move o cursor devolve `false` — e quase produziu a conclusão de
que o realce não funcionava. Com o `hover` e a leitura na **mesma** chamada, o
alfa sai em 0,858 no meio da transição de 150ms, e assenta em 0,902.

**E a medição contradizendo o mecanismo é sinal de que o mecanismo está mal
entendido, não de que a medição está errada.** Foi o caso das camadas de cascata:
o instinto foi desconfiar da sonda, e desta vez a sonda estava certa.

#### O que não foi feito, com o motivo

- **O `isMobile && "pt-1"` de `transactions-toolbar.tsx` ficou.** O plano previa
  removê-lo, alegando que ele compensava uma margem fora do fluxo. **A alegação
  era falsa**: a alça é irmã daquela caixa e a margem de 10px é real. Removê-lo
  mudaria o espaçamento daquela folha sem número que peça.
- **O caminho do `Sheet` no telefone não foi visto aberto.** A página do catálogo
  esconde os espécimes abaixo de 768px por decisão própria, e as telas do app
  exigem sessão. O que prova a composição é o `tsc`, a asserção 4 do teste (zero
  `DrawerPrimitive.Handle` fora da peça) e as gavetas reais da página nova, que
  exercitam o mesmo `<DragHandle />`.
- **`Drawer` continua sem consumidor no app.** A gaveta chega às telas por dentro
  do `Sheet`, e isto não mudou.

### Rodada 35 — a barra prometia redimensionar, falava inglês, e o badge caía uma linha

A `Sidebar` é a navegação primária do produto — 763 linhas, 24 exports, montada
sob todas as rotas autenticadas — e chegou nesta rodada com os **três silêncios**
ao mesmo tempo: `ds:audit` dizendo "Nenhum achado", `ds:catalog` mostrando eixos,
e **zero testes** num arquivo com escada de tamanho. Os três eram sinal para
olhar, e nenhum era certificado.

#### O defeito que estava em produção, e visível

`SidebarMenuAction` e `SidebarMenuBadge` liam
`peer-data-[size=default]/menu-button:top-1.5`. O `cva` do botão foi renomeado
para `md | sm | lg` numa rodada anterior, e os dois seletores ficaram apontando
para um degrau que ele **não emite mais**. Nenhuma regra casava, o badge é
`absolute` sem `top` de base, e ele caía para a posição estática.

Medido antes, na própria página do catálogo: **`top: 32px`** — exatamente a
altura do botão —, centro **26px** fora do centro da linha, e **20px de
transbordo** para fora do item, ou seja o badge inteiro renderizando **sobre a
linha seguinte**. Na demonstração, o "42" de Transações aparecia ao lado de
Carteiras e o "3" de Cartões ao lado de Conta. Depois: `top: 6px`, desalinho
**zero**, e 6px de folga dentro do item.

É a família "sobreviveu à remoção" que esta base já registrou quatro vezes — e a
primeira em que ela custou pixel numa tela de produto.

#### O trilho prometia redimensionar, e a quarta mentira da mesma família

`SidebarRail` declarava `cursor-w-resize` / `cursor-e-resize` e desenhava um fio
de 2px que acende no cursor — a gramática inteira de uma costura de arraste —
enquanto o `onClick` só alternava, com `tabIndex={-1}` e um `title="Toggle
Sidebar"` em inglês ao lado de um `aria-label` em português.

Depois do `SheetDragHandle`, da alça do `Drawer` e da do `vaul`, é a quarta
ocorrência; e é a pior, porque **quem mentia era o cursor do sistema
operacional**, que é a promessa mais forte que uma interface consegue fazer.
Hoje ele alterna e diz que alterna. Quem redimensiona é o átomo.

#### A camada de acessibilidade nunca tinha sido traduzida

No ramo do telefone, o nome acessível do menu era `<DialogTitle>Sidebar</DialogTitle>`
— a palavra inglesa — e a descrição era `Displays the mobile sidebar`, uma frase
de desenvolvedor lida por leitor de tela. É exatamente o achado do `Calendar`
("a grade parecia traduzida e a camada de acessibilidade nunca esteve"), agora
na navegação primária. Verificado no navegador depois: o painel abre com o nome
**"Navegação"**.

#### O catálogo reportava os eixos do botão como se fossem os da barra

O `ds:catalog` lê o **primeiro** `cva` do arquivo, e o único era
`sidebarMenuButtonVariants`. Resultado: a linha da `sidebar` mostrava
`variant: plain | outline` e `size: md | sm | lg`, enquanto `side`, `variant` e
`collapsible` — os eixos que alguém de fato escolhe — não apareciam em lugar
nenhum. É o defeito que o `Item` já registrou com `itemGroupVariants`.

`sidebarVariants` entrou **antes**, e não é cerimônia: `variant` decidia a
geometria por ternário em dois lugares, e decisão escrita duas vezes diverge —
foi assim que `floating` ficou com `rounded-lg` e `inset` com `rounded-xl`, dois
raios para a mesma ideia de cartão solto. Medido depois: o catálogo reporta
`side · variant · collapsible`.

#### A moldura de telefone virou moldura de viewport, e duas limitações fecharam

`ds-phone.tsx` virou **`ds-frame.tsx`**: `ViewportFrame` é a primitiva,
`PhoneFrame` um preset de 375×667. O nome antigo passaria a mentir num arquivo
que hospeda uma moldura de desktop.

A página nunca tinha mostrado a barra ligada. Para caber no palco ela
neutralizava três coisas — `collapsible="none"` (um *early return* que devolve
uma `div` comum, e não o caminho do app), `min-h-0` e `w-full` — e o que sobrava
era uma lista de links. Dentro da moldura, medido: viewport de **778px**,
`position: fixed` **relativo ao iframe**, `md` casando, e a barra com os seus
**256px = 32,9%** — a proporção que uma navegação tem numa janela estreita de
laptop.

E as duas limitações que a moldura declarava desde a rodada 31 fecharam, porque
sem elas esta peça não é demonstrável:

- **`useIsMobile` lê a janela da moldura.** Um contexto opcional em
  `use-mobile.tsx`, com `null` por padrão e *fallback* para o `window` real — o
  app não muda. Sem ele, na moldura de 375 a barra tomaria o ramo de desktop
  enquanto o CSS a esconde com `md:`, e não renderizaria **nada**.
- **O portal do `EdgePanel` cai dentro da moldura**, porque ele lê a mesma
  janela e entrega `container` ao `Portal` do Radix — sem prop nova. Medido: o
  painel do telefone abre com 288px (76,8% dos 375) **dentro** do iframe, e não
  vaza para o pai.

A terceira fica: `env(safe-area-inset-*)` vale zero, porque não há aparelho.

E o `⌘B` passou a escutar `ownerDocument.defaultView` em vez de `window` — dentro
de um iframe, `window` é o de fora, e a tecla digitada lá dentro nunca chegaria.

#### O redimensionar é o átomo, e a `react-resizable-panels` mede em pixel

A régua da casa é que um componente não reimplementa a camada de baixo. O
arraste já existia medido no `Resizable` (Átomo, rodada 28), e `Sidebar` é
Organismo — compor um átomo é livre.

**O encaixe é melhor do que eu previa.** A v4.12.3 lê número como **pixel** e
string como porcentagem, e é isso que torna o modo possível: um trilho de
navegação **não pode** variar de largura com a janela, porque ícone, rótulo e
badge têm medida fixa. Com o modo pixel, os `collapsible` viram configuração do
átomo — o modo ícone é literalmente `collapsedSize={48}`, e o offcanvas é zero.

`SidebarProvider resizable` troca a linha de flex por um `ResizablePanelGroup`,
a barra vira o primeiro painel, a costura vira o `ResizableHandle` e o
`SidebarInset` vira o segundo. Medido: `flex-grow` 32,905 para a barra e 67,095
para o conteúdo, `role="separator"` na costura, e um arraste de 82px levando a
barra de **255,7 para 337,7px** — os 82, exatos.

**É opt-in, e o produto não liga.** O `PanelGroup` declara `display`,
`flex-direction`, `overflow` e as medidas por estilo **inline** — o `.d.ts` avisa
que as quatro não se sobrescrevem —, e `useResizableLayout` custa uma remontagem
por carregamento, que é justamente o que o cookie da barra existe para evitar. O
padrão continua sendo o trilho `fixed` com a folga no fluxo.

#### Tokens mortos, uma classe que não existia, e uma cópia que já divergira

- **`--sidebar-primary` e `--sidebar-primary-foreground`** estavam definidos nos
  dois temas, expostos no `@theme` e com **zero** usos. Saíram.
- **`no-scrollbar` era escrita em quatro superfícies e não estava definida em
  lugar nenhum** — nem aqui, nem no `tw-animate-css`. As quatro achavam que
  escondiam a barra e nenhuma escondia; o `tabs.tsx` chegou a escrever
  `[scrollbar-width:none]` por extenso enquanto isso não se decidia. Agora é
  `@utility`, e medido: `scrollbar-width: none` nas três superfícies da página,
  contra `auto` antes. Onde ela vale, quem indica que há mais conteúdo é a
  dissolução da borda — que é a decisão deste sistema, e a razão de as quatro a
  pedirem.
- **`sidebar-user-profile.tsx` copiava o `cva` do botão à mão**, e a cópia já
  tinha divergido: `group-data-[collapsible=icon]:p-0!`, que é a regra do degrau
  `lg`, sobre a geometria do degrau padrão. Hoje ela compõe
  `SidebarMenuButton size="lg"`.
- **`sidebar-logo.tsx` foi apagado** — zero consumidores, e o `AppSidebar` usa o
  `WorkspaceSwitcher`.
- **`setOpen` gravava o cookie mesmo em modo controlado**, sobrescrevendo pelas
  costas a preferência de quem controla.

#### A página, e o que ela passou a ensinar

Reescrita, com quatro molduras: a tela de desktop com colapso pelos três
caminhos; um seletor dos três eixos sobre uma moldura só, porque **combinar** é o
que uma tabela de variantes não mostra; a barra redimensionável; e o telefone com
o painel de borda abrindo dentro do iframe. Mais os tipos de item — badge, ação
no cursor, submenu sobre `Collapsible`, esqueleto, busca, separador — e a escada
do botão, esses dois num palco comum e **em `collapsible="none"`**, porque
demonstrar conteúdo não precisa de moldura e demonstrar comportamento precisa.
A página passou de 9 exports documentados para os 24, com três `PropsTable`.

#### A lista se encostava, e a navegação do produto desfazia isso à mão

`SidebarMenu` declarava **`gap-0`** — as linhas coladas —, e isso não era
decisão: era o padrão do shadcn. A prova é que a navegação do produto o desfazia
escrevendo `className="gap-2"` nos **dois** menus que têm mais de um item; os
outros três do app carregam um item só, onde o `gap` não decide nada. **2 de 2**,
unânime. Padrão que ninguém escolhe não é padrão — é a régua que o `Container`
já aplicou ao devolver `md` como padrão de largura.

**Mas o degrau não é o que a tela pedia.** A primeira versão levou os 8px do
`app-sidebar` para o componente, e o dono olhou e mandou diminuir — com razão: o
realce de um item é a **caixa inteira da linha**, 32px de altura com canto
arredondado, e a 8px de folga as linhas começam a ler como cartões soltos. Uma
navegação é uma lista. Ficaram **4px**, que é o suficiente para dois realces
vizinhos não se tocarem, que era o problema real do `gap-0`.

A hierarquia continua dita, e não pelo respiro: medidos depois, o grupo separa
o conteúdo em **16** (o `p-2` de cada lado), **quatro vezes** o item; e o
submenu fica nos mesmos 4, porque quem diz o aninhamento ali é o recuo e o fio à
esquerda — um segundo sinal seria redundante. As duas compensações à mão saíram
de `app-sidebar.tsx`, e a asserção 11 do teste falha se alguma tela reescrever o
ritmo de novo.

A lição de leitura: **a contagem diz que o padrão estava errado, não qual é o
certo.** Duas telas escreverem `gap-2` provou que `gap-0` não era decisão; o
número final saiu de olhar o realce, que nenhuma contagem mostra.

#### Recolhida, os avatares não estavam no meio

Apontado pelo dono, selecionando os dois botões `size="lg"` — o seletor de
workspace no topo e a conta no rodapé. Medido no modo ícone: caixa de 32, filho
de 24, **0 de folga à esquerda e 8 à direita** — 4px fora do centro, numa coluna
em que todo o resto está no meio.

A causa não é o alinhamento: é que **a centragem era acidente do recuo**. A
conta é `(32 − filho) / 2`, e o degrau padrão calha de acertá-la — ícone de 16,
`p-2!`, 8 de cada lado. O `lg` carrega um avatar de 24 e escrevia `p-0!`, porque
com 8 ele não caberia. Ninguém fez a conta para o outro filho.

**E `justify-center` não conserta — piorou, medido.** Em modo ícone o rótulo
continua no fluxo (o que o esconde é o `overflow-hidden`, não `display`), então
a linha de flex **transborda** a caixa de 32; e centrar uma linha que transborda
empurra o conteúdo para fora nos dois lados. Os degraus que estavam certos foram
de 0 para **−4**. Com o rótulo ocupando espaço, o recuo é a única alavanca que
centra.

`p-1!` no `lg` fecha a conta: 4 + 24 + 4. Medido depois: **desalinho zero nos
oito botões**, nos dois degraus. A asserção 12 tranca a tabela e proíbe as duas
saídas erradas — o `p-0!` e o `justify-center`.

#### A dica do modo ícone era montada sempre, e descrevia o botão com o próprio rótulo

`SidebarMenuButton` passava `hidden={state !== "collapsed" || isMobile}` ao
`TooltipContent`. **`hidden` esconde pixel, e mais nada**: o Radix continua
abrindo a dica, contando os atrasos e — o que importa — ligando o
`aria-describedby` do botão a ela.

Medido com a barra **expandida**, que é o estado padrão do app: passar o cursor
em "Início" montava uma dica invisível escrita "Início", e o botão saía
`aria-describedby` apontando para ela. Quem usa leitor de tela ouvia o rótulo e
depois a descrição, idênticos, **em cada item do menu**. A dica existe para
quando o rótulo *não* está na tela; ela estava lá justamente quando ele está.

O conserto é não montar: a guarda foi para o retorno curto, ao lado da que já
existia para `!tooltip`. Medido depois — expandida: **nada monta, e
`aria-describedby` é `null`**; recolhida: dica presente, à direita, `sideOffset`
de 6 e desalinho vertical **zero**.

E o `TooltipContent` passou a portalizar para a janela ativa, como o
`EdgePanel` — sem isso a dica saía da moldura do catálogo e era desenhada sobre
a página. É a terceira peça a ler o contexto de viewport, e as três pelo mesmo
motivo.

#### E a dica travava entre um ícone e o vizinho — o polígono de graça

Relatado pelo dono: *"o tooltip fica um tempão ali e eu não consigo mover para
outro e fazer o tooltip aparecer."* Não era atraso — o `delayDuration` do
provedor já é **0**.

É a **área de graça** do Radix: ele mantém o conteúdo aberto enquanto o ponteiro
se move dentro de um polígono entre o gatilho e a caixa, para dar tempo de
alcançá-la. Isso serve a conteúdo que se aponta. **Uma dica não é isso** — ela é
um rótulo, e quem tem conteúdo alcançável neste sistema é o `HoverCard`.

No trilho recolhido o custo é estrutural: os ícones ficam a **36px** um do outro
e a dica abre à direita, então o polígono cobre os vizinhos. Medido — passando
por "Início" e indo até "Carteiras", a dica continuava escrita **"Início"** e o
`aria-describedby` continuava no **primeiro** botão. Depois de
`disableHoverableContent` na raiz do `Tooltip`: a dica é a do botão sob o
cursor, uma só aberta, e o `aria-describedby` acompanha.

Continua sendo prop, para quem tiver um caso de dica alcançável — mas o padrão
passou a ser o que a definição do componente já dizia.

#### O espécime ganhou cor, e a peça óbvia era a errada

O workspace e a conta da demonstração eram dois `<div>` desenhados à mão em
`bg-sidebar-accent` — cinza, iguais entre si, e anatomia escrita pelo catálogo,
que é o sinal de que falta peça. Viraram `Avatar size="xs"` (os mesmos 24px, então
a centragem acima continua valendo) com a ficha `--identity-*`: ladrilho de canto
para o espaço, círculo para a pessoa.

**`ColorTile` seria a escolha óbvia e é a errada**, e a régua deste arquivo é que
diz por quê: ele carrega a cor que a pessoa escolheu e que veio do banco. Aqui a
cor vem do tema, e o caso é o da ficha de identidade.

E a primeira versão usou `identityToneFor`, que é o que o app usa — **as duas
sementes caíram no mesmo tom**, medido: `oklch(0.78 0.09 320)` nos dois. O hash
distribui, não garante distinção entre duas strings quaisquer; numa demonstração
o assunto é justamente que duas identidades leiam como diferentes, então os
índices são explícitos. Medido depois: matiz 140 e 20, com a tinta a **6,37 e
6,07** no escuro e **6,73 e 7,33** no claro.

#### Uma lição de instrumento, e ela é um erro meu

Ao verificar o painel do telefone, a sonda procurou
`[data-slot=edge-panel-content]` e voltou vazia três vezes seguidas — o que me
levou a suspeitar de delegação de eventos do React através de portal para outro
documento, que é uma hipótese cara e plausível. **Era a sonda.** O ramo mobile
da `Sidebar` passa `data-slot="sidebar"` ao `EdgePanelContent`, sobrescrevendo o
slot do componente de baixo: o painel estava lá o tempo todo, com véu, título e
botão de fechar. O que resolveu foi parar de procurar um seletor e **listar
todos os `data-slot` antes e depois do clique**.

A régua: **num sistema onde o consumidor pode carimbar o próprio `data-slot`,
uma sonda que procura o slot do componente de baixo mede a chamada, não o
resultado.** É a parente da lição do `resizable` ("coordenada de painel não é
pixel de CSS") e do carrossel ("classe montada em runtime não existe na folha").

#### O que não foi feito, com o motivo

- **`AppSidebar` não adota `resizable` nem `variant="inset"`.** As duas são
  decisão de produto. Fica o registro de que o `peer-data-[variant=inset]:*` do
  `SidebarInset` é **código inalcançável** hoje: a casca usa a variante padrão.
- **O `md:z-10` cru do `AppHeader` fica.** A barra entrou na escala
  (`--z-sticky`), e o cabeçalho é `layout/`, fora do que esta rodada abriu. Hoje
  os dois não se sobrepõem; no dia em que se sobrepuserem, quem ganha é a barra.
- **`Dialog` e `Popover` não leem a janela da moldura** — só o `EdgePanel`, que é
  o que a `Sidebar` usa. Os outros entram quando uma página precisar.
- **A casca do app não foi vista logada.** As telas exigem sessão; o que prova a
  migração é o `tsc`, os 371 testes e as quatro molduras da página. Os dois
  seletores mortos e o `p-0!` da cópia **mudam pixel** na navegação de produção,
  e é o único lugar da rodada onde isso acontece.

### Rodada 36 — vidro não tem borda; tem aresta

Pedido: *"deixe as bordas do floating sidebar com efeito de glass"*. Duas
medições mudaram o que a frase podia significar, e uma delas corrigiu um número
que eu tinha apresentado errado.

**Não há nada atrás da placa para borrar.** Medido com `elementsFromPoint` no
meio do painel: a pilha sob ele é `sidebar` (transparente) → `sidebar-wrapper`
(transparente) → a tela → `body`. O `floating` reserva a folga no fluxo, então o
conteúdo **não passa por baixo**. Um `backdrop-blur` ali borraria cor chapada e
não desenharia nada — a lei que a paleta de comandos escreveu e que nunca tinha
saído da narrativa dela. Vidro aqui não podia ser borrão.

**E o defeito não era o que eu disse.** Afirmei que o anel dava "1,32 no escuro
e 1,01 no claro"; o 1,01 era um **branco hipotético** no claro, não o token. O
anel real é `--sidebar-border`, que já vira de direção sozinho por tema
(`oklch(1 0 0 / 10%)` no escuro, `oklch(0.9)` opaco no claro), e mede **1,32 e
1,23** — consistente e deliberado.

O defeito é de material: **o anel é uniforme**. Um fio de 1px igual nos quatro
lados é uma **borda**. Vidro não tem borda; tem **aresta**, e ela varia ao redor
da placa — pega luz em cima e escurece embaixo. É isso que separa uma placa de
vidro de um retângulo pintado.

#### O par de tokens, e por que ele é par

Varrido sobre `--sidebar`: branco a 20% dá **1,87** no escuro e **1,02** no
claro; preto a 20% dá **1,60** no claro e **1,04** no escuro. Sobre uma placa
quase branca a luz não aparece; sobre uma placa escura a sombra não aparece. É a
mesma aritmética que obrigou `--secondary-hover` a existir.

`--sidebar-rim` e `--sidebar-rim-shade`, nos dois temas. Em cada um **exatamente
um dos dois carrega**, e o outro fica no zero perceptual — o que é a física, e
não desperdício: o topo de uma placa branca não tem como pegar luz visível.
Medido depois: **1,76 pelo topo no escuro, 1,69 pela base no claro** — peso
equivalente —, com 1,06 e 1,03 do lado que não lê. Os dois são declarados para a
geometria ser a mesma nos dois temas, em vez de um `dark:` dentro do componente.

**O anel fica, e é exceção consciente.** A página de elevação enuncia que "a
sombra não se acumula com a borda", e aqui elas se acumulam. O número que força:
a placa e a página estão a **1,04** uma da outra no tema claro — praticamente a
mesma cor —, e uma sombra de `0 1px 2px` a 6% não define uma placa de 240px. Sem
o anel ela deixa de existir como objeto.

#### O fio do cabeçalho nascia no ar

Apontado pelo dono. Medido com `floating` ligado: a placa termina em **x=248** e
o fio do cabeçalho vai de **x=256 a 778** — uma régua de 522px que começa a 8px
de nada. Em `variant="sidebar"` ela encosta no `border-r` da barra (folga
medida: **1px**) e as duas leem como uma cromagem só; o `floating` tira esse
`border-r` e o fio fica pendurado.

A regra que resolve já estava escrita para as tiras de superfície: elas não têm
fio nem tinta, e quem marca o limite é o respiro — mais a dissolução onde há
rolagem, que no `AppHeader` é o vidro que ele acende ao rolar.

**O mecanismo é variável publicada, e não seletor de grupo.**
`--sidebar-inset-rule` nasce no `SidebarInset`, que é **peer** da barra — a mesma
relação que a variante `inset` já usa —, e vale `1px` por padrão e `0px` sob
`floating`. Quem desenha o cabeçalho lê `var(--sidebar-inset-rule,1px)`. É o
mecanismo de `--dialog-px`, `--dialog-bleed` e `--toolbar-control`, e a razão é a
de sempre: `in-*` e `group-*` compilam com `:where()`, que não soma
especificidade; variável herda e não disputa. A alternativa —
`[&>header]:border-b-0` no `SidebarInset` — seria compensar geometria por
seletor, que esta casa nomeia como sintoma de peça faltando.

Medido nas três variantes: fio de **1px** em `sidebar` e `inset`, **0px** em
`floating`. O `inset` mantém o dele com razão: ali o cabeçalho vive *dentro* do
cartão, que tem canto próprio, e o fio não sobra para lugar nenhum.

#### O que eu olhei e decidi não mexer

- **O desalinho de topo de 8px** entre a placa (`y=8`) e o cabeçalho (`y=0`).
  Dar a mesma margem ao conteúdo é literalmente o que a variante `inset` faz, e
  faria as duas colapsarem numa só. No `floating` **só a barra flutua**.
- **O `SidebarRail` na calha de 8px** — continua sendo o alvo de alternar e não
  colide com nada.
- **A calha esquerda do cabeçalho.** São duas colunas diferentes; forçá-las a
  concordar amarraria o recuo do conteúdo ao da barra.

#### O que a rodada achou e não consertou

- **O sistema já tem um vidro inteiro, e ele não está documentado.**
  `.mobile-glass-surface` em `globals.css`, com tokens `--mobile-glass-*` nos
  dois temas, `blur(24px) saturate(1.5)`, três consumidores no telefone e — o
  único do repositório — um fallback de `prefers-reduced-transparency`. Zero
  linhas aqui e zero páginas no catálogo.
- **`--mobile-glass-border` é branco nos dois temas** (10% claro, 5% escuro).
  Pela varredura acima, branco sobre superfície clara é invisível; é candidato a
  declaração morta no tema claro, e merece a própria medição.
- **`registered-credit-card-face.tsx` mantém as quatro camadas de vidro** que o
  `ColorTile` documentadamente removeu de si — borda clara, anel, sombra e blur,
  mais um degradê e um `shadow-inner`. É a contradição mais visível do
  vocabulário de vidro do repositório.
- **Duas sintaxes de suporte a blur** (`supports-backdrop-filter:` nos três
  overlays contra `supports-[backdrop-filter]:` no `app-header`) e **duas de
  anel interno** (`inset-ring-3` contra `ring-1 ring-inset`, em quatro arquivos).

#### Uma lição de instrumento

A asserção da aresta cortava o fonte entre `const miolo` e `if (resizable)` — e
falhou devolvendo **string vazia**, porque `if (resizable)` também aparece no
`SidebarProvider`, que vem antes no arquivo. Um `indexOf` solto pegava aquele. O
detalhe que importa: a fatia vazia **passava** na primeira asserção do bloco e só
caía na segunda. **Corte por `indexOf` sem posição inicial é uma asserção que
pode acertar por vazio.**

### Rodada 37 — reflexo é gradiente, e a luz vem de cima

A rodada 36 trocou a borda uniforme da placa flutuante por duas arestas internas
de alfa **constante**. Media bem — 1,76 no escuro, 1,69 no claro — e, ao lado de
três referências de vidro, ainda lia como borda: **num reflexo o brilho varia ao
longo do perímetro**.

O vocabulário já existia aqui, num arquivo só. `registered-credit-card-face.tsx`
tem florão de canto, brilho diagonal em `soft-light` e dois aros em gradiente com
`maskComposite` — oito camadas. É o arquivo que este documento chama de *"o único
vidro fora do sistema"*; com a ilha do telefone eram **três vidros e nenhum
vocabulário comum**. Esta rodada não inventou o quarto: promoveu a `@utility`.

#### Duas camadas de fundo, e nenhuma máscara

`background-clip: padding-box` para a superfície e `border-box` para o aro, com a
borda transparente. Verificado: o raio de 14px sobrevive e **nenhuma máscara
entra** — a armadilha registrada aqui (`mask-image: none` num composite apaga o
elemento; a ordem de emissão de `mask-composite` e `-webkit-mask-composite` não
se controla pelo Tailwind) fica de fora por construção. A face do cartão usa a
versão com máscara e consegue porque escreve inline, em objeto de estilo.

#### A luz é vertical, e isso levou três tentativas

O aro nasceu em **158°**, um eixo diagonal, com o pico no canto superior-esquerdo.
Fisicamente defensável e errado aqui: numa coluna alta e estreita a luz que
convence vem de **cima**, reta. Em `180deg` o topo pega o pico, os dois lados
pegam o vale no mesmo ponto do gradiente, e a base recebe o vestígio.

Antes disso, uma versão pior: com o **mesmo** token em 0% e 100%, a projeção na
caixa real (240×424) dava **19% no topo e 19% na base** — variava, e tinha dois
picos. Luz vem de uma direção só. O canto oposto virou
`color-mix(… 45%, transparent)` em vez de um sexto token, porque ele não tem luz
própria: tem menos da mesma.

Os números finais:

| | aro no topo | aro nos lados | queda de luz |
| --- | --- | --- | --- |
| escuro | **2,36** | 1,27 | **1,13** |
| claro | **2,24** | 1,25 | 1,09 |

#### Três camadas, e não quatro

Houve um **brilho diagonal** em `soft-light`, atravessando a placa. Ele saiu ao
ver: numa superfície de navegação a faixa cruza a lista de links e compete com
ela. Vidro aqui é aro mais volume, e não cenografia. Com ele saiu o
`background-blend-mode`, que existia só para essa camada.

#### O florão perdeu a cor, e a medição não bastou para decidir

Ele nasceu no matiz da barra a 14%, e eu tinha levantado a ressalva de que
**verde neste app significa "entrou dinheiro"**. A medição parecia liberar:
`--income` é hue 152, o florão composto ficava a **ΔE 43** dele e clareava o
painel 2,7×; não são cores confundíveis.

**E ainda assim estava errado.** ΔE mede confusão entre duas amostras lado a
lado; não mede que uma navegação esverdeada compete com o significado que a cor
carrega na interface inteira. Hoje o florão é **branco a 7%** — leva o canto de
`rgb(28,28,28)` a `rgb(44,44,44)`, 1,57×, com R=G=B. **No tema claro ele não
existe** (`transparent`), pela mesma física do aro: sobre `oklch(0.97)` não há
para onde clarear, e um florão escuro é mancha, não florão.

#### Um critério meu que a primeira medida não passou

O anel uniforme saiu, e o plano dizia que o vale do aro precisava segurar os
lados. Medido no claro: **1,16**, contra os **1,23** do anel — regressão pequena
e real. O vale subiu de 5% para 10% e bateu 1,25. Foi o **critério escrito no
plano** que pegou isso, e não a captura.

#### A régua que sobrou

**Contraste diz se aparece; não diz se convence** — e nesta rodada isso apareceu
quatro vezes. No florão verde (ΔE bom, leitura errada), no eixo do aro (158°
defensável, 180° certo), na faixa diagonal (bonita isolada, ruidosa sobre uma
lista) e numa reversão inteira que precisou ser desfeita: a rodada chegou a
voltar ao estado da 36 antes de o ponto certo aparecer, **entre** os dois.
Nenhuma dessas quatro saiu de um número. Todas saíram de olhar.

### Rodada 38 — o realce pintava cor fixa sobre uma superfície que virou degradê

A rodada 37 deu volume à placa: a superfície corre de `oklch(0.242)` no topo a
`oklch(0.192)` na base. **O realce dos itens não acompanhou** — ele continuou
pintando `--sidebar-accent`, um valor opaco. Um retângulo de cor fixa em cima
de um degradê faz duas coisas erradas de uma vez: apaga o degradê dentro do
próprio realce, e muda de força conforme a altura do item.

E a geometria agrava. O botão do workspace fica a **8%** da altura do painel e
o da conta a **92%** — os dois extremos da rampa —, e a assimetria **inverte**
entre os temas:

| | workspace (8%) | conta (92%) |
| --- | --- | --- |
| hover opaco, escuro | **1,09** | 1,21 |
| hover opaco, claro | 1,20 | **1,11** |

O pior caso é justamente o que o dono apontou: **1,09 no escuro**, porque o
workspace fica onde a superfície é mais clara e o opaco quase empata com ela.

**A tinta certa já existia neste sistema, e não é `white/N`:** é
`bg-current/N`, que `AlertAction` e `AnnouncementBarAction` usam para "ação
dentro de superfície tingida, quando o componente não sabe o tom". Dentro do
painel `currentColor` é `--sidebar-foreground` — quase-branco no escuro,
quase-preto no claro. **A tinta vira de direção sozinha, sem token novo e sem
par `dark:`.** Medido: `[250,250,250]` no escuro contra `[10,10,10]` no claro.

Os três estados eram **o mesmo** `--sidebar-accent`, com só o `font-medium`
separando o ativo. Viraram escada:

| Estado | Tinta | escuro | claro |
| --- | --- | --- | --- |
| hover | `bg-current/6` | 1,18 | 1,14 |
| pressionado | `bg-current/9` | 1,30 | 1,21 |
| ativo | `bg-current/12` | 1,43 | 1,30 |

**O critério de aceite não era o valor absoluto, era a constância.** Variação
entre os dois extremos do painel: **0,040 no escuro e 0,003 no claro**, contra
os 0,12 do opaco. E os degraus se distinguem entre si por 0,116 / 0,134 no
escuro e 0,077 / 0,085 no claro.

**O escopo é `floating`, por decisão do dono**, e a dívida fica: o mesmo
`SidebarMenuButton` passa a ter duas gramáticas de realce conforme a variante.
O argumento sistêmico para unificar — a régua do `Accordion`, *"um realce não
pode depender de uma informação que o componente não tem"* — continua de pé.

**Um acoplamento que fica escrito porque quebra calado:**
`hover:text-sidebar-accent-foreground` mexeria em `currentColor`, e portanto na
própria tinta. Verificado que nos dois temas `--sidebar-accent-foreground`
**iguala** `--sidebar-foreground`, então a tinta não se move. No dia em que um
dos dois mudar, a escada muda junto sem ninguém pedir.

#### O degradê: mesma amplitude, distribuição eased

"Mais suave" aqui não era menos delta — o dono acabara de pedir mais volume. A
rampa era linear de duas paradas: 32→20 de canal em 424px, um passo a cada
~35px, que é onde a banda de Mach aparece. Ela passou a ter cinco paradas
derivadas em `color-mix`, sem token novo, com as pontas achatadas e a mudança
no meio. Medido no computado: `0,242 → 0,237 → 0,217 → 0,197 → 0,192`, ou seja
**0,005 / 0,020 / 0,020 / 0,005** por quarto, contra os 0,0125 uniformes de uma
rampa linear. É o mesmo raciocínio que a dissolução do `Command` registrou —
*"uma ease-out sai do chapado com inclinação máxima, e descontinuidade de
derivada contra superfície lisa é o que o olho mais detecta"*.

#### O aro: mais alto e mais curto

Brilho polido é especular, não lavado. O pico subiu de 26% para **34%** e a
queda ao vale encurtou de 42% para **16%** do eixo — medido no computado:
`0,34 (0%) → 0,08 (16%) → 0,08 (80%) → 0,153 (100%)`, uma razão de **4,25×**
entre pico e vale. O vestígio da base continua sendo `color-mix(… 45%,
transparent)`, e não o token puro: com o mesmo valor nas duas pontas o aro
saía com **dois picos**, que é a costura da rodada 37.

#### Três defeitos achados no caminho

- **`SidebarMenuSkeleton` sorteava a largura com `Math.random()`** dentro de um
  `useState`. É o original do shadcn, e produzia **dez erros de hidratação numa
  página só** — o único erro de console de `/designsystem/sidebar`. A largura
  passou a sair de um hash do `useId`, que é estável entre servidor e cliente
  por contrato do React. Medido depois: duas requisições ao servidor devolvem
  `62%` e `80%`, o DOM do cliente devolve os mesmos dois, e eles continuam
  diferentes entre si — a variedade existia para a pilha não ler como tabela, e
  ela ficou.
- **A variante `outline` acendia a sombra só no cursor.** Ela tem
  `hover:shadow-[0_0_0_1px_var(--sidebar-accent)]` e nenhum par `active:`; o
  fundo estava coberto pela base do `cva`, o anel não. Quarto lugar do mesmo
  defeito nesta rodada.
- **`SidebarGroupAction` e `SidebarMenuAction` não tinham par nenhum.** Sete
  `hover:bg-sidebar-accent` contra dois `active:` no arquivo. Isto **é conserto,
  não desenho**: vale em todas as variantes, e é o único ponto da rodada que
  muda pixel em produção.

#### O ladrilho morto da página de Cores

Ela desenhava `<TokenTile token="--sidebar-primary">`, e esse token **não existe
mais** — eu o removi na rodada 35 por ter zero usos e não conferi quem o
referenciava. Regressão minha. **E ele já mentia antes disso:** nenhum
componente jamais usou `--sidebar-primary`; quem marca o item ativo sempre foi
`--sidebar-accent`, que é o ladrilho ao lado. A página mostrava dois ladrilhos
para dois estados e um deles apontava para o vazio. Ele saiu, e o vizinho passou
a dizer o que faz.

#### As duas asserções novas, e por que a 20 precisou existir

**20 — nenhum realce acende no cursor e fica inerte no dedo.** A regra **H** do
auditor varre `className="…"` e não alcança este arquivo, onde tudo mora em
`cva()` e `cn()`. É o ponto cego que o `AGENTS.md` já registra três vezes, e foi
ele que deixou a `outline` passar. A asserção varre cada string de classe e
exige o par por família (`bg` e `shadow`).

**21 — sob `floating` o realce é alfa, e não token.** Os três degraus existem,
são diferentes entre si, sobem em ordem, nenhum é `--sidebar-accent`, e todos
são escopados na variante que tem degradê.

As duas foram verificadas reintroduzindo o defeito: sem o `active:shadow-` a 20
reprova nomeando a string; com um degrau de volta a `bg-sidebar-accent` a 21
reprova. `SIDEBAR_GLASS_STATES` deixou de ser um array com `.join(" ")` e virou
uma literal única — não por gosto: a asserção 20 checa **por string de classe**,
e três literais separadas fariam cada degrau parecer um `hover:` órfão.

#### Duas lições de instrumento, e as duas são erros meus

**Meu regex de split quebrou dentro dos parênteses.** Separando as camadas do
`background-image` com `/,(?![^()]*\))/`, as vírgulas de dentro de `color-mix()`
e `radial-gradient()` caíram como separadores, e a "camada 1" virou um fragmento
do florão — reportando zero paradas numa rampa que tinha cinco. Quem separa
camadas de CSS é um contador de parênteses, nunca um regex.

**E li `oklch(0.985 0 0)` como se fosse rgb.** `getComputedStyle(...).color`
devolve a função autorada, e o meu `match(/[\d.]+/g)` transformou o quase-branco
num vermelho quase-preto — a escada inteira saiu com contraste 1,01. **Quem
converte cor é o navegador**, e a sonda passou a pintar num `<canvas>` de 1px e
ler o pixel. É a mesma correção que a rodada 29 já tinha feito para o mesmo
erro, com a mesma regex.

**E a escada não foi medida com cursor, de propósito.** O quadro de coordenadas
do painel era 800×612 contra um viewport CSS de 1132×396 — a armadilha que a
rodada 32 registra —, e a moldura de 440px não cabia na janela. O contraste de
um alfa sobre um degradê conhecido é conta, não observação: composição inline
sobre o fundo verdadeiro, que é o que o `AGENTS.md` já prescreve.

### Rodada 39 — nuvem atrás de uma frente preta

O pedido foi que a luz parecesse vir **de trás**, com a referência sendo o
cabeçalho do app — *"transparente, e só parece transparente quando há algo
passando atrás"* — e a lâmina puxando mais para o preto.

**A referência é subtrativa, e a placa era aditiva.** O cabeçalho é
`md:bg-background/60 md:backdrop-blur` (`app-header.tsx:110`): ele não pinta
nada, ele **deixa passar menos**. A placa fazia o contrário:

| | página | placa (topo → base) |
| --- | --- | --- |
| escuro | `oklch(0.145)` = rgb 10 | `0.242 → 0.192` = rgb **32 → 20** |
| claro | `oklch(0.985)` = rgb 250 | `0.978 → 0.948` = rgb 248 → 238 |

No escuro ela era **mais clara que a página em toda a extensão**. Isso é o
desenho de uma superfície levantada e iluminada de frente.

#### A primeira tentativa estava errada, e fica registrada

Eu troquei a rampa por um **radial de altura inteira** vindo de cima, chegando a
**rgb 62** no topo, e baixei o aro de 34% para 18% argumentando que "contraluz
não tem especular". As duas decisões foram reprovadas na tela, e as duas por
bons motivos:

- **A queda de altura inteira é uma lavagem.** Forte demais, branca demais, com
  o eixo à vista — lê como degradê de fundo dos anos 2000. Trocar linear por
  radial não resolve nada se o radial cobre a placa toda: o que importa não é a
  família da curva, é a **escala**. Luz que ocupa a peça inteira é fundo, não é
  luz.
- **O brilho da borda não descreve de onde vem a luz do corpo.** Ele é a aresta
  da lâmina pegando luz, e é o que faz a peça ler como **vidro** em vez de
  retângulo escuro. Baixá-lo por coerência com uma teoria sobre o corpo foi
  aplicar um raciocínio ao componente errado.

#### O modelo certo: nuvem atrás, frente preta

A frente é escura e chapada, como o cabeçalho, e o que existe são **focos de luz
difusos atrás dela**.

**A ordem das camadas é o mecanismo, e não um detalhe.** A lâmina é pintada *por
cima* das nuvens, então elas chegam ao olho filtradas por 55% de preto: 30% de
branco sobre a página dá rgb 84, e a lâmina o leva a **37** contra um corpo de
**5**. Pintadas por cima, as mesmas nuvens dariam 84 e leriam como manchas **na**
placa. **Alfa alto, resultado baixo: é a atenuação que constrói o "atrás".**

Medido na placa inteira, no escuro:

| | valor |
| --- | --- |
| corpo (mínimo · médio · máximo) | **2 · 4 · 23** |
| página | 10 |
| picos das duas nuvens | 23 (canto superior-esquerdo) · 23 (inferior-direito) |
| razão corpo↔página | 1,049 — de um teto absoluto de **1,061** |

#### "Meio cinza" não era a lâmina; era a página

O corpo esteve em 55% de preto, o que dá **rgb 5**, e ainda assim lia como
cinza. A causa não é a lâmina ser clara: **a página atrás é rgb 10**, e 5 contra
10 é imperceptível — a placa herdava a leitura de "cinza escuro" do próprio
fundo.

Isso foi verificado **empiricamente e não por conta**, porque a aritmética já
dizia rgb 5 e contradizia o que se via. Amostras de valor conhecido sobrepostas
à placa: a 55%, **0, 3, 5 e 8 somem dentro dela** e só a partir de 12 se
distingue; a 82%, **0 e 2 somem** e 5, 8 e 12 aparecem visivelmente mais claras.
A inversão de quem some é a medida.

A 82% o corpo vai a **rgb 2** — o mais escuro possível sem ser preto —, e o
limite é duro: preto puro daria 0, com a razão contra a página indo de 1,03 para
1,05 num teto de **1,061**. Não há mais para onde ir, e é exatamente por isso
que a peça é definida pelo aro e pela nuvem, e não pelo corpo.

**E o alfa da nuvem sobe junto, que não é ajuste fino.** A lâmina está *em
cima*, então escurecê-la apaga a nuvem na mesma proporção: 17% de branco atrás
de 55% de preto e 48% atrás de 82% rendem **o mesmo pico de 23**, medido. Os dois
números andam juntos, e quem mexer num sem o outro apaga a luz sem perceber.

O corpo é **mais escuro que a página na média**, que é o "puxando para o preto"
do pedido, e a luz é local em vez de ser um banho.

**São dois focos, nos cantos opostos da diagonal.** O centro de cada um fica
**no canto**, então só um quarto da elipse entra na placa, e é isso que os faz
ler como fontes que estão atrás *e fora* em vez de focos pousados sobre a
superfície. O teste proíbe centro em `50%`, porque um foco no eixo voltaria a
desenhar a rampa.

#### O foco do topo saiu e voltou, e a medição é que reenquadrou a pergunta

Ele foi removido com a régua *luz vai onde não há conteúdo* — o topo da barra é
onde vivem o seletor de workspace e o primeiro grupo de links. Com um foco só, a
base passou a ler como mais forte que o topo, e a pergunta virou "qual dos dois
igualar".

**A medição mostrou que elas já eram iguais em luz, e diferiam em tipo:**

| | pico | área | luz total |
| --- | --- | --- | --- |
| aro, canto superior-esquerdo | **94** | 1.324px² | 35,7 |
| nuvem, canto inferior-direito | 23 | **14.188px²** | 31,6 |

Razão de luz **0,9**; razão de área **10,7×**. O aro concentra a luz num fio de
1px; a nuvem espalha a mesma luz por dez vezes a área com um quarto do pico. Uma
massa difusa lê como **fonte**, um fio lê como **aresta** — e era essa diferença
de categoria, não de intensidade, que fazia a base parecer mais pesada.

Com isso na mesa, a decisão do dono foi **dar massa ao topo também**, e o custo
foi aceito explicitamente: o topo da placa deixa de ser preto plano (o corpo vai
de médio 2 para médio 4, com 23 nos dois cantos), e a luz volta a dividir espaço
com o seletor de workspace. Fica registrado como decisão tomada contra a régua,
não como a régua tendo mudado.

**Um ganho que não estava previsto:** a variação do realce ao longo do painel
voltou a **0** nos dois estados. Os dois botões medidos ficam em posições
espelhadas (7,8% e 92,2% da altura) e as nuvens são reflexo por ponto, então a
placa sob cada um mede exatamente o mesmo — 9.

**A pegada dele é o espelho por ponto da do aro**, e os dois números saem de
medir a caixa real (240×424), não de estimativa. O aro corre em 165° e chega ao
vale em 16% de um eixo de **471,7px**, ou seja 75,5px — com isso a zona clara
dele cobre **a largura toda do topo** (o canto superior-direito ainda está a
13,2%, dentro do vale) e desce **78,1px, 18,4% da altura**, pela borda esquerda.
Refletido pelo centro: a largura toda de baixo, subindo 18,4% pela borda direita.
Daí `100% 18%`, medido depois em **240×76px** contra os 240×78 do aro.

**O que não dá para espelhar é a inclinação.** `radial-gradient` **não rotaciona
os eixos da elipse** em CSS — não há sintaxe para isso. O que se iguala é a
pegada; o tombo de 15° fica só no aro, e é ele que carrega a direção da peça.

**Ele foi a três e a dois antes de ser um, e os dois cortes têm a mesma razão.**
A versão de três tinha um foco no meio da borda direita, e ele disputava com a
lista de links. A de dois era um par na diagonal, e o do canto superior-esquerdo
disputava com o seletor de workspace e o primeiro grupo de links. A régua que
sobra é **luz vai onde não há conteúdo** — a mesma que tirou a faixa diagonal na
rodada 37 —, e o canto inferior-direito é o único vão real da placa.

A cada corte o corpo ficou mais preto: máximo **36** com três focos, **33** com
dois, e agora **23** apenas no canto, com o resto plano em 5 contra uma página
de 10.

**E o alfa voltou para o token.** Enquanto eram duas, a de baixo era derivada em
`color-mix(… 55%)` para o par ler como principal + eco. Com uma só, essa conta
seria uma derivação cujo motivo não existe mais — a família "sobreviveu à
remoção" que este projeto já pagou cinco vezes. Ela foi dobrada no valor do
token (30% → 17%), e a troca é **neutra na tela**: medido, o pico continua em
23.

**Alargar produz névoa, não nuvem.** A primeira versão dos focos tinha raios de
`58%`/`66%` e virava uma neblina uniforme sem forma. Apertar o raio e subir o
alfa (22% → 30%) é o que dá contorno a cada um — e é o oposto de alargar a
lavagem, apesar de o alfa subir.

#### A lâmina puxa para o chão do **próprio tema**, e não para o preto

A leitura ingênua de "puxando mais para o preto" — preto com alfa nos dois temas
— introduziria no claro um cinza que ele **não tem em lugar nenhum**. Medido: o
tema claro é inteiramente acromático (croma 0 em `--background`, `--card`,
`--muted`, `--border`, `--sidebar`) e a página é `oklch(0.985)`, com o branco de
verdade morando no `--card` e no `--popover`.

A regra: **a lâmina afunda um passo além da página, na direção do chão daquele
tema.** No escuro esse chão é o preto; no claro é a família neutra própria dele.
É a mecânica de `--secondary-hover`, que puxa a base na direção do próprio
contato em vez de usar um alfa único para os dois.

#### O eixo do aro voltou a se inclinar, e isso reverte a rodada 37

Ela tirou o aro de **158°** e o pôs em **180°**, com o argumento — registrado
aqui — de que *"numa coluna alta e estreita a luz que convence vem de cima,
reta"*. Hoje ele está em **165° no escuro**, e a reversão é legítima porque **a
peça mudou**, não o gosto.

Na rodada 37 o corpo era uma superfície iluminada de frente, com uma **rampa
vertical** descendo a placa inteira. Um aro diagonal brigava com esse eixo, e
tirá-lo foi certo. Hoje o corpo é preto plano e a única luz mora num canto: não
há eixo vertical com que concordar, e o aro reto passou a ser a única coisa
simétrica numa peça que não é.

**A conta na caixa real** (240×424): a 165° o eixo tomba 15° da vertical, e a
projeção horizontal é **13,2% do comprimento do gradiente**. Como o vale do aro
começa em 16%, na aresta de cima a esquerda fica no **pico (0%)** e a direita já
chega a 13,2% — quase no vale. O brilho se concentra no canto superior-esquerdo
em vez de correr a largura toda.

**E o ângulo é um token, porque vale só no escuro.** `--sidebar-rim-angle` é
165° no `.dark` e 180° no `:root` — inclinar concentra brilho, e no tema claro
não há brilho para concentrar (o aro ali é sombra, a 12%). É o mecanismo de
`--toolbar-control` e `--command-list-max-h`: variável herda e não disputa, e um
número na receita não teria como diferir por tema sem um `dark:` dentro do
componente.

As duas asserções que trancavam o eixo reto mudaram junto, e é o tipo de coisa
que precisa ser dita: **elas codificavam a decisão da rodada 37, não uma
invariante do sistema.** Hoje a 19 exige que o eixo venha de token (nenhum
`deg` literal na receita), que o claro seja 180 e que o escuro tombe sem virar
diagonal de 45°; e o guarda da 22 contra a lavagem deixou de contar `180deg` e
passou a exigir que **um único** gradiente carregue eixo, e que ele feche em
`border-box` — ou seja, que a direção viva no fio de 1px e não no corpo.

#### O claro passou a ser a mesma especificação do escuro, com a polaridade virada

O pedido foi *"use as mesmas especificações do dark no light, porém tentando
deixá-lo mais claro"*, com dois pontos: **a barra não pode ficar mais escura** e
o brilho tem de ser maior.

**Copiar as cores não é traduzir; copiar a estrutura é.** O que o escuro faz:

| | escuro | claro, traduzido |
| --- | --- | --- |
| lâmina | preto 82% → rgb **2**, razão 1,049 da página | branco 92% → rgb **255**, razão **1,040** |
| direção | afasta-se da página **para baixo** | afasta-se **para cima** |
| eixo do aro | 165° | **345°** — o mesmo eixo, girado 180° |
| pico do aro | luz, no canto superior-esquerdo | sombra, no canto **oposto** |

A mesma distância da página, no único sentido que cada tema tem. A versão
anterior punha a lâmina em 244, **abaixo** da página, e isso fazia a navegação
recuar num tema em que ela deve avançar. Hoje ela é o branco de verdade — o
mesmo `oklch(1 0 0)` do `--card` —, então a barra flutuante lê como cartão, que
é como este sistema já apresenta superfície elevada no claro.

**O eixo é um só, e o teste tranca isso.** 345° é 165° pela outra ponta: a
geometria é idêntica e só a polaridade inverte, porque sombra de uma placa acesa
por cima-à-esquerda mora no canto oposto ao brilho. A asserção deixou de fixar
`180` no claro e passou a exigir `claro === (escuro + 180) % 360` — com dois
valores soltos, os dois biséis podiam apontar para direções diferentes sem
ninguém perceber. Medido: sombra de **1,51** no canto inferior-direito,
dissolvendo para 1,22 no superior-esquerdo.

**E o "shine maior" tem um teto que não é do desenho.** A página clara é rgb
**250 de 255**, e a lâmina já a levou a 255: não sobra **nenhuma** unidade acima
do corpo. Um realce precisa de espaço acima, e o corpo não pode descer — descer
é justamente o que este tema não deve fazer. As nuvens ficam declaradas em
branco opaco e não registram, e isso está escrito no token com a saída: **quem
quiser luz de verdade no claro precisa baixar `--background`** (de `oklch(0.985)`
para algo como `0.96`), o que é decisão de sistema porque atinge toda tela.

#### O tema claro é quieto, e o erro nele era de magnitude

A gramática se inverte — no escuro o aro é brilho branco, no claro é sombra —, e
isso é a física que as rodadas 36 e 37 já mediram: sobre uma página quase branca
não há para onde clarear. **O que estava errado não era a direção, era a
magnitude.** O aro claro estava em 40% de preto, que compõe para rgb 150 contra
uma página de 250 e dá razão **2,84**: um traço duro, não a aresta de uma placa
de vidro — e lia como "luz escura" ao lado do brilho do tema escuro.

| | antes | depois | referência |
| --- | --- | --- | --- |
| aro claro | 40% → rgb 150 → **2,84** | 12% → rgb 220 → **1,32** | `--sidebar-border` = 1,29 |
| corpo claro | 242, razão 1,075 | 244, razão **1,05** | — |

Ele agora tem praticamente o peso da própria borda do sistema, que é o que uma
placa deve ter num tema em que ela não pode brilhar.

**E as nuvens não registram no claro — por aritmética, não por timidez.** A
página é rgb **250 de 255**: existem cinco unidades entre ela e o branco puro, e
a lâmina por cima consome parte disso. Medido com a nuvem em branco **opaco**, o
teto é ~2 unidades. "Luzes brancas atrás" é um efeito que só o tema escuro
comporta, e ele fica declarado do mesmo jeito para a receita ser uma só — quem
define a placa no claro é o corpo (1,05) com o aro (1,32).

#### O par de identidade sumia no claro, e agora ele inverte

Os avatares do workspace e da conta, medidos sobre a placa flutuante:

| | superfície | tinta sobre superfície | **superfície sobre a placa** |
| --- | --- | --- | --- |
| escuro | `[46,55,45]` | 6,37 | **1,65** |
| claro, antes | `[230,235,229]` | 6,73 | **1,10** |
| claro, depois | `[68,120,56]` | 5,14 | **4,79** |

No claro a pastilha **sumia**: sobrava a letra escura flutuando sozinha, sem
chip. A causa é que `--identity-N-surface` era `color-mix(… 12%, var(--card))`,
calibrado contra `--card` (255) — sobre a placa flutuante (244) ele perde metade
da separação.

**A saída foi inverter o par no tema claro**: a superfície passa a ser a cor e a
tinta passa a ser quase branca, que é como um avatar preenchido se comporta em
toda interface clara. O escuro fica como estava. `--identity-N` é a tinta e
`--identity-N-surface` é a pastilha **nos dois temas** — os nomes já descreviam
o papel, e é o papel que se inverte, não o nome.

A alternativa era só empurrar a mistura (12% → ~28%), e ela foi medida: dá
**1,28** contra a placa. Melhor que 1,10 e ainda tímido, além de caminhar para
um cinza sujo.

**E a inversão tem um custo, que fica dito.** Não existe mais um token único que
seja "o matiz" nos dois temas: no escuro ele é `--identity-N`, no claro é
`--identity-N-surface`. A página de Cores tinha uma rampa **"Os matizes"**
apontando para o primeiro, e ela passou a sair como **seis barras brancas** no
claro. Um espécime que só funciona num tema é pior que espécime nenhum, então
ela saiu — os discos acima dela já mostram as seis identidades como elas de fato
renderizam.

**O `ColorTile` divergiu de propósito.** O comentário dele afirmava ter "as
mesmas proporções de `--identity-N-surface`", e isso deixou de ser verdade. A
divergência é correta pela régua que o próprio arquivo escreve: o ladrilho
carrega uma cor **de runtime**, escolhida pela pessoa e vinda do banco, e não
pode virar uma pastilha preenchida numa cor que ninguém calibrou. O avatar
carrega uma das seis identidades do sistema.

Blast radius: **9 arquivos de produção**, todos avatar. Verificado antes de
mexer que `text-identity-N` nunca aparece fora do par com
`bg-identity-N-surface`, e que `--identity-N` só é referenciado no `@theme` e na
própria mistura — o que torna a troca de papéis segura.

#### A escada de realce voltou sozinha para dentro do critério

`bg-current/6·9·12` não mudou. O que mudou foi a superfície: com a lavagem, a
placa ia de rgb 47 a rgb 7 e a variação do realce ao longo do painel era
**0,09 / 0,12 / 0,15** — fora do teto de 0,05 que a rodada 38 fixou. Com o corpo
uniforme e a luz **nos cantos**, ela é **0** — os botões vivem no eixo central,
e nuvem de canto não o alcança. No claro também é 0.

O ponto fraco continua sendo medido de duas formas, porque uma engana:

| | placa | razão WCAG | salto de luminância |
| --- | --- | --- | --- |
| workspace | 5 | 1,102 | **4,84×** |
| conta | 5 | 1,102 | **4,84×** |

**Perto do preto a razão WCAG comprime**, porque o `+0,05` do denominador
domina. O defeito que a rodada 38 consertou era 1,09 com salto de **1,4×** —
quase invisível. Aqui 1,10 é um salto de 4,84×.

#### Duas lições de instrumento, e as duas são erros meus

**O preâmbulo de geometria de um radial não é uma parada de cor.**
`radial-gradient(140% 105% at 50% -8%, …)` termina o primeiro token em `-8%`, e
o regex `/([\d.]+)%\s*$/` casou nele — a sonda tratou a geometria como "uma cor
na posição 8%", e **o radial contribuía zero em todas as medições**. O sintoma
foi uma queda de 30 pontos de canal num quarto de painel que a captura não
mostrava; a captura estava certa e a sonda não.

**E uma camada `border-box` não pinta o corpo.** Medindo a placa em 2D, eu
compus o aro — 34% de branco — sobre a área inteira, e o corpo saiu com mínimo
15 onde ele é 5. Quem diz qual camada é qual é `background-clip`, que o
computado publica por camada e que a sonda ignorava.

São a terceira e a quarta leitura errada desta série pelo mesmo motivo — antes
foram as vírgulas dentro de `color-mix()` e o `oklch()` lido como `rgb()`. A
regra que as quatro desenham: **um regex não parseia CSS.** Quem separa camadas
é um contador de parênteses, quem converte cor é o navegador, quem diz onde uma
camada pinta é o `background-clip`, e um preâmbulo de função precisa ser
reconhecido antes de qualquer coisa ser lida como valor.

E o que salva é sempre a mesma coisa: **um ponto de controle previsível** — a
sonda calcula a placa onde as camadas de luz são transparentes e compara com
lâmina-sobre-página, que se computa sem gradiente nenhum.

#### As duas asserções

**18 ganhou um piso, e ele nasceu invertido.** A primeira versão desta rodada
escreveu um **teto** de 20% no aro, codificando a inferência errada de que
contraluz não tem especular. Hoje é um **piso de 28%**: sem o brilho a peça vira
um retângulo escuro.

**22 tranca o modelo:** no escuro a lâmina é preto com alfa, no claro a
claridade dela é > 0,8 (o guarda é o valor, não a ausência do literal); as
nuvens são brancas nos dois; **a lâmina é declarada antes delas**, que é o que
as põe atrás; há pelo menos dois focos e **nenhum com centro em 50%**; existe um
único gradiente com ângulo e ele é o aro, no `border-box`; e os quatro tokens de
desenhos anteriores — `--sidebar-surface-top`, `-bottom`, `--sidebar-bloom`,
`--sidebar-backlight` — não voltaram pela porta dos fundos.

Verificadas reintroduzindo três defeitos: o aro sem brilho, a lâmina indo para
baixo das nuvens, e a lavagem vertical de volta.

`variant="sidebar"` e `variant="inset"` seguem em `oklch(0.205)` chapado, sem
gradiente — a `@utility` é escopada em `floating`, que **nenhuma tela do app
usa**, então esta rodada não muda pixel em produção.

### Rodada 40 — o vidro sai da barra

As rodadas 36 a 39 construíram uma superfície de vidro **dentro** da barra
lateral: a receita numa `@utility sidebar-glass`, cinco tokens `--sidebar-*`, e a
geometria calibrada contra uma caixa de 240×424. Ela virou peça.

**O achado que enquadrou a rodada: já existiam dois vidros, e nenhum sabia do
outro.**

| | `.mobile-glass-surface` | o pintado (agora `glass`) |
| --- | --- | --- |
| técnica | `backdrop-filter: blur(24px) saturate(1.5)` | pintado, sem blur |
| premissa | **há** conteúdo passando por baixo | **não há** nada atrás |
| fallback | `prefers-reduced-transparency` — o único do repo | não se aplica |
| consumidores | 4, todos no telefone | 1 |

A régua de escolha passou a estar escrita nos dois lugares, e é pela premissa:
borrar cor chapada não desenha nada, e pintar luz onde há conteúdo real atrás
seria inventar o que já existe. A fusão fica no backlog.

#### Três camadas, e o componente é a de cima

É o modelo que o `scroll-fade` registra — *"ele é conveniência, não a
primitiva"*:

| Camada | Onde | Dona de |
| --- | --- | --- |
| CSS | `@utility glass` + `glass-control` | a matemática das quatro camadas e o contrato de variáveis |
| Gramática | [`lib/glass-classes.ts`](src/lib/glass-classes.ts) | as composições nomeadas e as três armadilhas |
| Componente | [`ui/glass.tsx`](src/components/ui/glass.tsx) | `asChild` para vestir uma peça, ou uma casca quando ninguém é dono dela |

Sem hook: ao contrário do `scroll-fade`, o vidro não mede nada em runtime.

**Os cinco tokens foram renomeados** de `--sidebar-*` para `--glass-*`. Manter os
dois nomes seria a mesma *"duas receitas para a mesma borda"* que a rodada 36
removeu. Custo: 14 referências em `sidebar-ladder.test.ts`, nas asserções 18, 19
e 22.

**A extração é renomeação, e foi medida como tal.** Depois: corpo **2**, pico da
nuvem **23**, pico do aro **94**, ângulo **165deg**, quatro gradientes — os
mesmos números de antes, na mesma caixa de 240×424.

#### As três armadilhas de vestir vidro numa peça existente

As três foram medidas, e as três estão escritas na régua porque quem vestir a
peça vai bater nelas:

1. **O shorthand `background` apaga o `background-color`.** Medido: o
   `bg-sidebar` que continuava na string do miolo resolve `rgba(0,0,0,0)` sob a
   utility. Vestir vidro **substitui** o preenchimento; não soma.
2. **`border: 1px solid transparent` toma a borda**, porque o aro é pintado no
   `border-box`. Com `box-sizing: border-box` a caixa não cresce — o conteúdo
   encolhe 2px, e num controle com filho absoluto calibrado isso desloca 1px.
3. **O raio é herdado, e é isso que torna a peça portátil.** A utility não
   declara `border-radius`. Medido nos espécimes: 14px num `rounded-xl` e o
   valor de `rounded-full` num controle, sem eixo nenhum.

#### O eixo `size`, e a única razão de ele existir

**Porcentagem escala; percepção não.** A nuvem é `100% 18%` — numa placa de
424px são 76px de luz difusa, e num controle de 32px são **5,7px**, que lê como
aresta dura. A fração óptica é idêntica e o resultado não é.

O preset move **só a variável**, e nunca a propriedade: `glass` lê
`var(--glass-cloud-ry, 18%)` e não a declara em lugar nenhum; `glass-control`
declara. Duas utilities escrevendo `background` seriam decididas por ordem de
emissão do Tailwind e não pelo que se escreveu.

#### `asChild` só funciona se o filho repassar props, e o defeito é calado

O `Slot` entrega `className`; quem a aplica no elemento certo é o filho. Um
componente que aceita só `children` recebe a classe e a descarta — **nada
quebra, a peça simplesmente sai sem vidro**. Aconteceu na primeira escrita da
página do catálogo: quatro espécimes declarados, três com vidro, e a sonda que
contou `[data-slot=glass]` foi o que pegou.

Verificado que o `AppThemeToggle` repassa nos dois ramos, então
`<Glass asChild><AppThemeToggle /></Glass>` funciona. E o `data-slot` do filho
**vence** o da peça — dentro do `Glass` o toggle continua se anunciando como
`app-theme-toggle`, que é o nome certo: ali aquilo é um toggle que por acaso está
de vidro.

#### Dois erros meus, os dois pegos pela verificação seguinte

**Escrevi a classe montada em runtime.** `` `group-data-[variant=floating]:${glassSurfaceClassName}` ``
— o Tailwind varre o código como **texto**, e um nome interpolado nunca chega ao
CSS. É a regra que este arquivo já registra três vezes, e ela pegou a mesma
pessoa que a escreveu, pela quarta. A classe é literal, e a asserção 10 do teste
novo tranca que a régua não interpole.

**Deixei um export morto com um consumidor inventado.** `GLASS_SURFACES` era um
mapa `{ panel, control }` com um comentário dizendo que o catálogo iterava a
régua com ele — e o catálogo não iterava. Ele saiu; o eixo mora no `cva` de
`glass.tsx`, que é onde `cva` pode morar (a regra A2 do auditor o reprova fora
de `components/ui/`), e é o que faz o `ds:catalog` reportar
`size: panel | control` em vez de `—`.

#### O tema claro não tinha lado aceso, e isso era o defeito

Relatado como *"o glass no light mode não está com shiny"*, e a medição nomeou a
causa: **os quatro cantos do aro saíam abaixo da placa** — 210, 232, 232 e 235
contra 255. Um contorno, não um bisel.

A raiz é que o extremo `100%` do aro era **derivado do pico**:
`color-mix(--glass-rim 45%, transparent)`. Isso vale enquanto os dois extremos
são da mesma natureza — e no escuro são, os dois são luz. **No claro não são**:
ali o pico é sombra, e derivado o outro extremo só podia ser uma sombra mais
fraca. Não havia como o aro passar acima da placa.

`--glass-rim-far` virou token próprio, e a lâmina clara cedeu três unidades:

| | antes | depois |
| --- | --- | --- |
| lâmina | 255 (o teto) | **252** — ainda acima da página, em 250 |
| canto superior-esquerdo | 235, abaixo da placa | **255, acima dela** |
| canto inferior-direito | 210 | 205 |
| amplitude do bisel | 25 | **50** |
| realce ↔ sombra | — | **1,591** |

**O realce sozinho é fraco (1,027 contra a placa), e não é ele que lê — é o
par.** Num tema em que a página é rgb 250 de 255, cada lado do bisel mal se
separa da placa; o que o olho usa é a amplitude entre eles.

No escuro nada mudou: `oklch(1 0 0 / 15%)` reproduz os 45% de 34% que o derivado
valia, e a medição depois devolveu corpo **2**, aro **94**, vestígio **47**.

**A lição de forma:** derivar um extremo do outro é correto quando os dois são a
mesma coisa em intensidades diferentes, e vira armadilha quando eles trocam de
natureza entre temas. É a mesma família do `--secondary-hover` — um valor único
não serve os dois lados quando a direção que lê se inverte.

#### A peça é Átomo, e a página é o inventário

`glass.tsx` importa zero componentes de `ui/` e renderiza um elemento — o mesmo
caso do `scroll-fade`. As quatro camadas de `background` são anatomia interna,
não peças que alguém compõe de fora.

`/designsystem/glass` é onde o histórico desta série virou documentação: a ordem
das camadas e por que ela é o mecanismo, a inversão de polaridade entre os temas
com as duas razões (1,049 e 1,040), o eixo do aro girado 180°, a pegada das
nuvens espelhada da do aro, as três armadilhas, e **as versões rejeitadas** — a
lavagem de altura inteira, o aro sem brilho, os três focos, a placa clara em 244.

### Rodada 41 — as versões de vidro, e o que a cor custa

Quatro peças novas — `GlassButton`, `GlassBadge`, `GlassAvatar`,
`GlassCheckbox` —, cada uma em arquivo próprio.

**O que as define não é a superfície, é a tradução de cor.** O vidro apaga o
`background-color` de quem o veste (armadilha nº 1 da régua), e isso colide com
o eixo de cor dos quatro: um botão `primary` perderia o verde, um badge perderia
os sete tons, um checkbox marcado ficaria igual ao desmarcado. A saída é o tom
migrar para **`--glass-tone`**, uma camada nova acima da lâmina.

É o mecanismo do `ColorTile`, que já deriva superfície e tinta de uma cor com
percentual por tema — não foi preciso inventar nada. E a cor vem dos pares
`-muted` que já existem: `bg-{tom}-muted` com `text-{tom}-muted-foreground` é o
que o `Badge soft` usa, e o par já é calibrado nos dois temas.

#### O achado que obrigou uma segunda camada: `hover:bg-*` falha calado sobre vidro

As classes de estado declaram **só `background-color`**, então o shorthand da
utility **não as apaga** — elas passam a pintar *atrás* das quatro camadas de
gradiente, e com a lâmina a 82% o realce simplesmente não aparece. Nada quebra,
nada avisa.

Daí `--glass-sheen`, a camada mais de cima. Ela é **branca neutra e não o tom**,
e é isso que faz **uma** variável servir os sete tons e os dois temas: realce
sobre vidro é o material pegando mais luz, não mudando de cor. As `hover:bg-*`
das bases são anuladas com `hover:bg-transparent` — escrito como classe para o
`twMerge` **remover**, e não para disputar por ordem de emissão.

#### As quatro, e o que cada uma custou

| | o problema | a saída |
| --- | --- | --- |
| **Button** | a hierarquia é preenchimento | vira tom; texto **5,24 a 13,14** nos dois temas |
| **Badge** | 14–22px de altura | a nuvem não cabe; **quem carrega é o aro** |
| **Avatar** | o vidro não tinha onde morar | a identidade vira tom, o fallback fica transparente |
| **Checkbox** | 16px, e o marcado pinta em três propriedades | tom + contorno; o vidro quase não lê |

**Um botão de vidro `primary` não é um botão verde.** É uma lâmina verde
translúcida com tinta verde — escura no claro, clara no escuro; mais perto de um
`Badge soft` que de um `Button primary`. Isso é consequência e não escolha:
sobre lâmina translúcida não há preenchimento para o texto branco parear. **Vidro
é um peso próprio**, e uma tela continua tendo um `primary` só.

**O `Avatar` era o caso sem saída, e os dois caminhos óbvios falham.** Medido: a
raiz não pinta fundo nenhum e o `AvatarFallback` é `h-full w-full` **opaco**.
Vidro na raiz fica escondido; vidro no fallback apaga a identidade. O terceiro
caminho — superfície de identidade translúcida — está **rejeitado por escrito**
no sistema, porque avatares empilhados mostrariam o de baixo. A tradução resolve,
e a objeção não se aplica **porque a peça é separada**: o `GlassAvatar` é opt-in
e o `Avatar` segue opaco. Custo medido: a foto encolhe 2px, que é onde o aro mora.

**O `Checkbox` é a que menos se paga, e o número está na página.** A nuvem do
preset `control` dá 11px numa caixa de 16, e a zona clara do aro, 3px. Medido:
`placaVsPagina` **1,02** na desmarcada — o vidro em si quase não existe nessa
escala, e quem torna o estado legível é o contorno (7,34 contra a página) com o
tique (10,63 sobre a lâmina).

#### A tensão da forma fica registrada

Cada uma importa **um** componente de `ui/` e renderiza **um** elemento — a
mesma estrutura de `MoneyInput` e `KbdShortcut`, que este projeto **absorveu
como `prop`** por serem *o átomo com outro nome, cobrando do catálogo uma
segunda página*. O que as mantém do lado certo é a tradução de cor, que é
anatomia. **A asserção 13 tranca exatamente isso**: se alguma virar só
`<Glass asChild><Base /></Glass>`, o teste reprova — e a pergunta certa volta a
ser "componente ou modo?".

São **Átomos** pela régua ("especializar um átomo continua átomo"), e o
`ds:catalog` reporta `—` na coluna de variantes das quatro: o eixo delas é
`tone`, que é `prop` e não `cva`.

#### Três erros meus, e os três pegos pelos próprios testes

**A asserção 10 pegou um helper que eu escrevi.** Pus em `glass-classes.ts` um
`tomEm(cor, claro, escuro)` que montava a string por interpolação, com um
comentário dizendo que era "só documentação da forma". O teste reprovou, e com
razão: um helper desses é um convite a alguém usá-lo, e aí as classes somem do
CSS sem nada quebrar. **Quinta vez** que este projeto paga essa medição.

**A asserção 13 testou o comentário, não o código** — na primeira escrita. Com a
tradução removida do `GlassButton` ela **passava**, porque o doc-comment da peça
cita `--glass-tone` por extenso. É a mesma lição que a rodada 40 já tinha
registrado, uma rodada depois.

**E medi o tema claro em estado misto.** Trocar a classe do `<html>` à mão não
segura: o `next-themes` reverte, e a leitura saiu com a página já clara e os
tokens do botão ainda escuros — texto a **1,17**, que eu quase reportei como
reprovação. Fixando o tema no `localStorage` e recarregando: **5,24 a 11,04**.
Tema se troca pelo mecanismo do app, nunca pela classe.

### Rodada 42 — a primeira cor de runtime

As quatro peças de vidro da rodada 41 traduzem **token**: o tom de cada uma é
uma linha de `GLASS_TONES` ou de `GLASS_IDENTITY_TONES`, escrita por extenso na
régua. O `ColorTile` é o próximo caso e o primeiro em que **a cor vem do banco**
— `categories.color`, `bills.color`, a marca de um workspace —, então não há
tabela que a preveja. `GlassColorTile` lê a `--tile-color` que o próprio
`ColorTile` já publica no `style`.

A forma é a da `GlassCheckbox` — duas classes **literais** com `--glass-tone`
dentro —, e o motivo é o mesmo de sempre: o Tailwind varre o código como texto,
e um percentual interpolado num `color-mix` nunca chegaria ao CSS.

#### As três camadas do ladrilho se comportam de três jeitos

O `ColorTile` deriva véu, tinta e fio da mesma variável. Sob o vidro:

| camada | o que acontece | o que se escreve |
| --- | --- | --- |
| véu (`bg-[color-mix…]`) | o shorthand `background` da utility o apagaria calado | `bg-transparent dark:bg-transparent` |
| tinta (`oklch(from … 0.42 c h)`) | **atravessa intacta** | nada |
| fio (`ring-1` na cor) | vira a segunda aresta ao lado do aro | `ring-0 ring-transparent dark:ring-transparent` |

**A tinta atravessar é o que faz a peça ser um embrulho de 20 linhas em vez de
uma reescrita.** Ela fixa a claridade e deixa só matiz e croma virem da pessoa;
a lâmina clara é quase branca (rgb 252 sobre o cartão) e a escura quase preta
(rgb 4), então 0,42 e 0,78 continuam do lado certo dos dois.

**O fio custa três classes, e a contagem foi medida no `twMerge`.** `ring-0`
derruba só a **largura**: sem `ring-transparent dark:ring-transparent`, as duas
classes de **cor** ficam na lista sem pintar nada — a classe morta que este
projeto caça. Verificado no DOM depois: `background-color` transparente, `border`
1px transparente (onde o aro mora) e `box-shadow` com as cinco entradas em
largura zero.

E ele sai por **doutrina**, não por gosto: a régua diz que **o tom não tinge o
aro** — um aro colorido faz a peça ler como plástico pintado — e um `ring`
colorido ao lado do aro é a segunda receita para a mesma borda, que a rodada 36
removeu da barra.

#### Os dois percentuais, e o critério que os escolheu

O véu chapado é 12% no claro e 18% no escuro, **opaco sobre `--card`**. Aqui o
tom é translúcido sobre a lâmina, e a lâmina escura (`oklch(0 0 0 / 82%)`) é bem
mais escura que o cartão — com um percentual só, o ladrilho sairia mais apagado
num tema que no outro.

Varredura com os **dez presets** de `CATEGORY_COLORS` mais os três extremos da
paleta livre, compondo tom sobre lâmina sobre cartão num `canvas` de 1px. O que
se minimiza **não é o contraste**, é o **desvio contra o véu do ladrilho
chapado** — os dois precisam ler como a mesma família:

| | escolhido | desvio médio | tinta, pior caso |
| --- | --- | --- | --- |
| claro | **10%** | 0,011 (12% dá 0,033) | 6,48 — chapado 6,55 |
| escuro | **26%** | 0,086 (18% dá 0,146) | 4,78 — chapado 5,09 |

Os dois ficam bem acima dos 3:1 da WCAG 1.4.11, que é a norma de que este
componente já saiu reprovando em 4 dos 10 presets. No escuro o teto é a tinta:
35% ainda dá 3,33 e **40% reprova, com 2,78**.

**E um caso o vidro conserta.** Um `#111827` quase preto no tema escuro dá
**1,00** contra o cartão no ladrilho chapado — véu perfeitamente invisível, e só
o fio o salvava. Sob vidro ele dá 1,12, porque a lâmina afunda a base antes de o
tom entrar. É a única das treze cores em que as duas superfícies discordam a
favor desta.

#### O que a asserção 13 passou a exigir

Ela ganhou o quinto nome e uma cláusula própria: o fonte do `GlassColorTile`
precisa conter `bg-transparent dark:bg-transparent` **e** `ring-0
ring-transparent dark:ring-transparent`. Nenhum dos dois quebra nada visível de
imediato — o véu morto e o fio duplo são exatamente o perfil de defeito calado
que aquele arquivo existe para pegar.

#### Isto não é o verniz que o ladrilho perdeu

A página do `ColorTile` registra que ele **já teve** degradê branco na diagonal,
borda clara, sombra e um `backdrop-blur`, e que os quatro saíram porque *o resto
do sistema preenche chapado*. O argumento continua válido, e é ele que mantém o
`ColorTile` como o padrão.

O que mudou não foi o gosto: **o sistema passou a ter uma receita de vidro só**,
medida e trancada por teste. Aquilo eram quatro camadas escritas à mão num
arquivo; isto é a mesma `@utility glass` que a barra flutuante e as outras
quatro peças vestem.

#### O que não foi feito, com o motivo

- **Nenhuma das 8 chamadas do app migrou**, por decisão. Zero pixel alterado em
  produção, como as outras quatro peças de vidro nasceram. O candidato mais
  honesto é `category-detail-hero.tsx`, que tem dois ladrilhos `sm` no topo de
  uma tela e nenhuma lista em volta para desalinhar.
- **A regra G acusa a página**, e é o falso positivo já nomeado: a heurística
  "sem classe de tamanho = `size-4`" não enxerga que `size="lg"` aplica
  `size-5`. A página do `ColorTile` carrega os mesmos dois achados, e o par
  `20/solid` a 20px está certo.
- **Sem eixo novo.** `size` e `color` passam direto, e o raio é herdado — a
  utility não declara `border-radius`, que é o que torna a peça portátil. O
  `ds:catalog` reporta `—` na coluna de variantes, como nas outras quatro.


### Rodada 43 — o vidro vira modo, e a rodada 41 se inverte

A 41 criou quatro peças de vidro e a 42 acrescentou a quinta. A pergunta que as
julgava estava escrita no `registry.ts` desde o primeiro dia: *"no dia em que
virarem só uma classe a mais, a pergunta certa é «componente ou modo?»"*. A
resposta chegou — **as cinco viraram o eixo `glass` dos próprios átomos**, e os
cinco arquivos, as cinco entradas e as cinco páginas saíram.

É a terceira absorção desta base, pelo mesmo motivo das duas anteriores
(`MoneyInput` → `<Input money>`, `KbdShortcut` → `<Kbd keys>`): **um
especializador que importa um componente e renderiza um elemento é o átomo com
outro nome**, cobrando do catálogo uma segunda página.

**A régua que sobra**, e que é a correção da tese da 41: o que decide
"componente ou modo?" **não é haver tradução de cor** — a 41 argumentou que a
tradução era anatomia, e ela é. É a tradução **precisar de uma peça para
existir**. Aqui ela cabia num eixo.

#### E como eixo ela ficou melhor — três defeitos que a forma antiga escondia

Não é arrumação. Um embrulho empilha classes por fora e conta com o `twMerge`
para apagar o que a base emitiu; isso funciona quando a base emite uma utility
**conflitante**, e falha calado quando não emite.

- **O `GlassBadge` deixava uma classe morta viva.** Ele renderizava um `Badge`
  com o `variant` padrão, cuja linha de `compoundVariants` traz
  `bg-primary-muted text-primary-muted-foreground hover:bg-primary-muted/80`, e
  anulava **só o `hover:`**. O `bg-primary-muted` continuava na lista e perdia
  calado para o shorthand `background` da utility — a armadilha 1 da régua,
  dentro da peça de vidro. Medido no DOM depois: as classes de um
  `<Badge glass>` são a base, a superfície, o degrau, o tom e a tinta, e mais
  nada.
- **O `GlassButton` podia ser quebrado por quem o chamasse.** O
  `variant="tertiary"` vinha escrito **antes** do espalhamento, então um
  `variant="primary"` do consumidor desfazia a tradução sem aviso. Hoje
  `variant?: never` fecha a porta no tipo.
- **O `GlassAvatar` prometia o que não entregava.** O JSDoc dizia que `seed` era
  *"o mesmo argumento de `identityToneFor`"*, e não era: aquela função recebe
  duas **strings** e faz hash, enquanto ali era um `number` com módulo. As duas
  não davam a mesma cor para a mesma pessoa. O prop virou `identity`, e o nome
  passou a dizer o que ele é — o índice de `IDENTITY_TONES`.

#### A régua da absorção: o que o vidro apagaria não é anulado, é não escrito

O eixo entra no `cva` como variante booleana, e **o que a superfície de vidro
precisaria desfazer passa a ser condicional a ele**. Medido no DOM das quatro
páginas:

| | como fica condicional | neutralizadores |
| --- | --- | --- |
| `Badge` | as 14 linhas de tom ganham `glass: false`; 7 novas com `glass: true` | **0** |
| `ColorTile` | véu e fio saem da base do `cva` para o ramo `glass: false` | **0** |
| `Checkbox` | os dois ramos são exclusivos (não há `cva` no arquivo) | **0** |
| `Avatar` | contexto, para o `AvatarFallback` | **0** |
| `Button` | eixo `tone` novo + compostos sob `glass: true` | **7** |

**O `Button` é a exceção, e o motivo é honesto**: por dentro o modo apoia-se em
`tertiary`, que é base de verdade, e o realce cinza dele precisa sair para o
`--glass-sheen` entrar. Sete classes, removidas da lista pelo `twMerge` e não
disputadas por ordem de emissão.

**O `Avatar` precisou de contexto, e não de seletor.** A superfície opaca mora
no `AvatarFallback`, não na raiz, e um `in-data-glass:bg-transparent` compila
com `:where()` — que **não soma especificidade** — e perderia para o `bg-muted`
declarado no próprio elemento. É a armadilha que o `DescriptionList` já pagou. O
mecanismo é o do `Field`/`FieldControl`, e sai de graça porque o `Avatar` já é
módulo cliente.

#### A união colapsa nos wrappers, e o `FormInput` já tinha escrito isso

Fechar `variant` no ramo de vidro do `Button` torna as props uma união
discriminada — e **11 wrappers de `ui/` quebraram de uma vez**
(`AlertAction`, `AlertDialogAction`, `AnnouncementBarAction`, `DialogClose`, o
gatilho do `Combobox`, a seta do `Carousel`, o `SidebarTrigger` e outros), todos
com a mesma mensagem: `Type '"tertiary"' is not assignable to type 'undefined'`.

A causa está escrita em `form.tsx` desde a rodada do dinheiro: desestruturar o
rest de uma **interseção com união aninhada** colapsa os ramos num objeto
atribuível a nenhum. A saída é a de lá — **fixar o wrapper num ramo**, como
`InputGroupInput` e `SidebarInput` fazem com `InputBaseProps`. Os 11 passaram a
usar `ButtonSolidProps`, e nenhum deles quer vidro.

#### Duas limpezas que apareceram no caminho

- **`soft: "border-transparent"` no `Badge` era a mesma classe duas vezes** — a
  base do `cva` já declara `border border-transparent`. E ela vazava para o
  modo de vidro, porque `defaultVariants` aplica `soft` sempre que `variant`
  chega `undefined`, o que no ramo de vidro é sempre.
- **O `aria-expanded:bg-muted` do `tertiary` sobrevivia no botão de vidro**, e é
  exatamente a dead class que esta rodada tirou do `Badge`: num gatilho de menu
  aberto ele pintaria atrás das camadas e morreria calado. Medido depois: zero
  `bg-muted` nos sete botões de vidro da página.
- **A `PropsTable` do `Badge` documentava o eixo antigo** — `variant` com os sete
  tons dentro e um `size="default"` que já tinha saído do tipo. Estava assim
  desde a rodada que separou `variant` de `tone`.

#### O catálogo, e o que o teste passou a trancar

Cinco páginas saíram e o conteúdo delas dobrou nas páginas-base, que é o
precedente de `dinheiro` → `input` e `tipografia` → `typography`. **95 → 90
páginas.** O gerador lê o diretório `docs/` e não o registry, então
`npm run ds:docs-map` resolve os dois arquivos gerados sozinho — e como o índice
de busca é extraído do fonte das páginas, a prosa movida continua encontrável.

A asserção 13 lia `glass-${nome}.tsx` por string montada: com os arquivos
apagados ela **lançava ENOENT** em vez de reprovar. Reescrita contra os cinco
átomos, ela exige a tradução, que o eixo seja eixo (a palavra como prop, não só
a classe), e — a cláusula que importa — **que não sobre neutralizador onde o
eixo o dispensa**. Ela distingue o neutralizador da superfície legítima pelo
prefixo: um `bg-transparent` cru é o que o `outline` do `Badge` declara; um com
variante (`hover:`, `data-[state=checked]:`) ou com par `dark:` só existe para
desfazer o que outra regra emitiu. Mais um guarda de que **nenhum
`glass-*.tsx` além de `glass.tsx`** volta para `ui/`.

Verificada reintroduzindo três defeitos: um `hover:bg-transparent` no `Badge`,
a tradução removida do `ColorTile`, e uma peça separada recriada. Os três
reprovam.

**E o `taxonomy.test.ts` melhorou sozinho.** As cinco peças eram exatamente os
casos-limite da asserção 2 — "um átomo importa no máximo um átomo" —, e sem elas
a cláusula volta a ter **zero** casos entre os átomos, que é o que o comentário
dela já dizia que se devia esperar. Os "dois exemplos mortos" que ele nomeava
passaram a ser sete.

#### O que não foi feito

- **Nenhuma tela de produto mudou**, porque nenhuma usava as cinco peças —
  verificado por grep antes de começar. O modo continua opt-in, e o `ColorTile`
  chapado segue sendo o que as oito chamadas do app renderizam.
- **As rotas antigas dão 404**, e isso só se descobre em runtime: entry sem
  página cai em `notFound()` sem `tsc` nem teste acusarem, apesar de o
  comentário em `[slug]/page.tsx` prometer erro de build. Conferido à mão.
  Chave órfã em `LAYER` também não é coberta por teste nenhum — as duas
  lacunas ficam registradas.
- **As seções 41 e 42 ficam como estão.** Este projeto registra inversão; não
  reescreve o passado.


### Rodada 44 — o vidro puxa a cor da peça, e o "plástico" era o alfa

O aro e as nuvens eram brancos em toda peça, qualquer que fosse a cor dela. A
régua proibia mudar isso: *"o tom não tinge o aro nem as nuvens — um aro verde
faria a peça ler como plástico pintado"*.

**A objeção estava certa sobre a mistura ingênua e errada sobre o tingimento.**
Medido, misturando verde num aro de `oklch(1 0 0 / 34%)`:

| a 45% | cor | alfa |
| --- | --- | --- |
| mistura crua | 83,159,131 | **0,635** |
| com o alfa preso | 147,193,173 | **0,341** |

Misturar uma tinta **opaca** sobe o alfa junto com o matiz — a 45% a aresta fica
86% mais presente. **É isso que lê como plástico: não a cor, a peça ficar mais
pesada.** A régua nova: *tingir vidro é mover matiz; mover o alfa é engrossar o
vidro.*

#### E a versão "correta" foi medida, e reprovou

Prender o alfa (`oklch(from var(--glass-ink) l c h / var(--glass-rim-a))`) é a
resposta defensável no papel, e foi implementada primeiro. Medida, ela quase não
entrega: o aro composto sobre a página ia de `94,94,94` para no máximo
`94,84,94` — **10 unidades** de espalhamento, num traço de 1px, mesmo forçando
claridade 1 e triplicando o croma. Num painel de 180×240 as quatro doses eram
indistinguíveis a olho.

A causa é estrutural, e ficou escrita: **as nuvens são pintadas atrás da
lâmina**, que é 82% preta, então elas chegam ao olho com ~18% da força — é a
atenuação que a rodada 39 criou de propósito para elas lerem como luz *por
trás*. Quem pode carregar cor é o aro, e ele tem 1px.

Com o alfa livre a 20%: espalhamento **16,5** e alfa 0,471.

#### E 16,5 ainda era pouco — o que faltava era croma, não dose

Duas vezes seguidas a leitura foi "as bordas continuam brancas", e o número dava
razão a ela: `--identity-N` tem croma **0,09**, e 20% de uma cor quase cinza
misturados em branco continuam brancos.

A varredura separou as duas alavancas, e elas não custam a mesma coisa:

| | alfa | espalhamento |
| --- | --- | --- |
| croma 1×, 20% | 0,471 | 16,5 |
| croma **4×**, 20% | **0,471** | **56,7** |
| croma 1×, 55% | 0,702 | ~48 |

**O alfa depende só da quantidade** (`p × 1 + (1−p) × 0,341`); **o matiz depende
só do croma**. Subir o croma dá 3,4× a cor **de graça** — a aresta não fica mais
presente —, enquanto chegar ao mesmo lugar pela dose custaria alfa 0,702, ou
seja o dobro da presença do neutro.

Daí `--glass-ink-boost: 4`, aplicado **na receita** e não nas peças. Ele
multiplica em vez de fixar um alvo porque **0 × 4 continua 0**: o fallback de
cada camada é o próprio neutro, que é croma 0, e é isso que mantém o no-op
intacto. Fixar `oklch(from … l 0.2 h)` tingiria o vidro sem cor.

Acima do gamute o navegador limita, e o limite é o resultado desejado: a versão
mais saturada daquele matiz naquela claridade. É o que faz um tom já vivo
(`--destructive`, croma 0,245) e um discreto (`--identity-N`, 0,09) chegarem ao
aro com a mesma presença.

Medido depois, no escuro: alfa **constante em 0,471** nas seis identidades,
espalhamento médio **56,8**, e os picos do aro em `125,90,91` (rosa),
`125,105,48` (âmbar), `84,122,76` (verde), `15,125,125` (ciano), `82,111,125`
(azul), `125,95,125` (violeta). No claro os dois extremos do bisel tingem, com
espalhamento de 50 a 98.

#### E o corpo continuava preto — o tom era translúcido sobre uma lâmina preta

A leitura seguinte foi outra: *"por que o fundo das versões glass está em preto e
o das outras em cinza?"*. Medido, procedente — o avatar de vidro saía **20% mais
escuro** que o opaco da mesma identidade:

| identidade | opaco | vidro | queda |
| --- | --- | --- | --- |
| verde | `46,55,45` | `37,44,36` | −9,7 |
| ciano | `38,55,56` | `30,44,45` | −10,0 |
| rosa | `61,48,48` | `49,38,38` | −10,7 |

A causa: o tom era **80% opaco** (75%/65% nos semânticos) e fica *acima* da
lâmina, que compõe para **rgb 2** sobre a página. Os 20% que atravessavam eram
preto puro. **A mesma pessoa lia com duas cores conforme o material.**

**Clarear a lâmina não resolvia**, e a medição descartou a saída óbvia: de 82%
para 20% de preto o corpo só ia de 41,2 para 42,4, porque a página atrás já é
`rgb 10`. A alavanca era o alfa do tom — 88% dá 45,3, 92% dá 47,6, e **100% dá
51,3, que é exatamente o opaco**.

Com o tom opaco, o corpo das duas versões é **idêntico nas seis identidades**,
medido no elemento renderizado. Só o material muda; a cor nunca.

**O que se perde é a translucidez do corpo, e ela não valia nada**: o que
deixava passar era a lâmina preta. E isto expôs um fato que reenquadra a rodada
inteira — **numa peça com tom as nuvens já chegavam a 3,6%**. Os "pontos de luz"
vivem no vidro *sem* cor, como a barra lateral; numa peça tingida, quem faz o
material é o aro, sozinho.

De brinde, o par `dark:` do tom sumiu das treze entradas: `-muted` e `-surface`
já são cientes de tema, e sem o `color-mix` sobra uma declaração só.

**O `ColorTile` é a exceção, e o motivo é que ali o percentual não é alfa.** Nas
outras a fonte é um token já na cor certa; nele a fonte é o **hex cru do banco**,
e os 12%/18% são a receita que vira véu. O tom dele passou a ser literalmente o
véu do chapado, opaco — um `100%` pintaria a cor cheia, que é o desenho que
reprovava em 4 dos 10 presets.

#### E a caixa do catálogo era mais escura que o resto dele

A última leitura foi sobre o **fundo do preview**, não sobre a peça: as oito
seções de vidro que escrevi passavam `previewClassName="bg-background p-6"`, ou
seja `rgb 10` dentro de uma moldura que é `bg-card`, `rgb 23`. Ao lado de
qualquer outra seção da mesma página aquilo lia como um buraco preto.

Duas coisas na correção. O `p-6` era **redundante** — já é o padrão do
`Preview` —, então a linha inteira só acrescentava o fundo; e o `bg-background`
tinha vindo por herança das páginas de vidro apagadas na rodada 43, sem motivo
próprio. Removidos — os oito, mais os **três** da página do
`Glass` —, as caixas medem `23,23,23`, a mesma superfície das outras.

**Sobra uma exceção, e ela tem motivo próprio:** `docs/card.tsx`, onde cartão
dentro de cartão não desenha fronteira nenhuma. A página do `Glass` chegou a ser
defendida com o argumento de que o consumidor do degrau `panel` é a placa
flutuante, que mora sobre a página — mas o palco do catálogo não é a tela do
app, e uma superfície escura demonstra melhor sobre o cartão, onde a lâmina
(`rgb 4`) tem mais distância do fundo do que teria sobre a página (`rgb 10`).

#### E o `Badge` perdeu o modo

Decisão do dono, no fim da rodada: **o `Badge` não tem mais `glass`**. Saíram o
eixo do `cva`, as sete linhas de `compoundVariants`, a união que fechava
`variant`, o `data-glass` e as duas seções do catálogo. As catorze linhas de tom
voltaram a não ter porta (`{ glass: false, variant: … }` → `{ variant: … }`), e
`BadgeProps` voltou a ser a interface simples.

Ficam **quatro** peças com o modo — `Button`, `Avatar`, `Checkbox`, `ColorTile`
—, e `GLASS_TONES` / `GLASS_TONE_INKS` continuam vivos porque o `Button` os usa.

Duas coisas **não** saíram junto, e é de propósito. O `soft: ""` do `cva`
continua vazio: ele era a mesma classe que a base já declara, e essa razão não
tinha nada a ver com vidro — só a segunda metade do comentário (o vazamento
para o ramo de vidro) deixou de existir. E a `PropsTable` da página segue
corrigida: ela documentava o eixo `variant` antigo, com os sete tons dentro e um
`size="default"` que já tinha saído do tipo.

**A lição de método:** eu tratei "quanto de cor" como um eixo só e ofereci doses.
São dois eixos com preços diferentes, e a pergunta certa — *o que custa alfa e o
que não custa?* — só apareceu depois de a terceira leitura a olho continuar
dizendo branco. **Quando a percepção discorda do número duas vezes, o errado é o
modelo, não o olho.**

**E fica registrado um erro meu de método.** A amostra em que baseei a pergunta
sobre intensidade tinha o alfa em **0,471**, não 0,341 — era a mistura crua. Ou
seja: apresentei uma opção descrevendo um resultado que a regra que eu propunha
no mesmo texto tornava inalcançável. A medição pegou; a pergunta teve de ser
refeita com os números certos. **Amostra usada para escolher uma dose tem de
sair da mesma fórmula que vai ser implementada.**

#### O no-op é estrutural, e isso custou duas tentativas

`--glass-ink` **não é declarada em tema nenhum**. Cada camada a lê com o próprio
neutro como fallback — `var(--glass-ink, var(--glass-rim))` —, então sem tinta a
mistura é o neutro consigo mesmo, que é o neutro em **qualquer** quantidade.

A primeira versão declarava `--glass-ink: oklch(1 0 0)` no `:root` e apoiava o
no-op em croma 0 mais `--glass-ink-amount: 0%`. Funcionava, e o `ds:catalog`
acusou com razão: **uma cor sem par no `.dark`**. Silenciar teria custado uma
linha redundante; tirar o token custou nada e deixou a garantia mais forte — de
"o padrão é uma cor que não tinge" para "sem tinta não há mistura".

**A prova é a barra lateral**, o único consumidor de produto da utility e o que
não tem cor de elemento. Extraídas as 14 cores da receita e comparadas **uma a
uma como cor** (não como string — `oklab(1 0 0 / 0.34)` e `oklch(1 0 0 / 0.34)`
são a mesma cor em notações diferentes, e essa comparação me enganou uma vez
hoje): **idênticas nos dois temas**, antes e depois.

#### Por que `--glass-ink` e não `--glass-tone`

São coisas diferentes: o **tom** é uma camada com alfa próprio que pinta o
**corpo**; a **tinta** é só um matiz de onde o aro e as nuvens puxam. Manter as
duas separadas é o que deixa a asserção **12** — *o aro e as nuvens não leem
`--glass-tone`* — continuar verdadeira **e** continuar certa. A separação entre
corpo e material não mudou; o que mudou foi o material passar a ter cor.

#### As fontes de matiz, e o tom que não precisou de exceção

| peça | fonte | nota |
| --- | --- | --- |
| `Badge` / `Button` | `var(--{tom})` | **um valor, sem `dark:`** — o matiz é idêntico nos dois temas (166, 152, 78, 27) |
| `Avatar` | `-surface` no claro, `--identity-N` no escuro | é o par que inverte, e o saturado é o outro em cada tema |
| `ColorTile` | `var(--tile-color)` | a cor crua do banco |
| `Checkbox` | `var(--primary)`, só marcado | uma caixa vazia é vidro sem cor |

**`neutral` não precisou de exceção**: `--muted` é croma **0** nos dois temas, e
misturar cinza num branco não move matiz nenhum. Ele sai neutro por construção,
e não por um `if`.

**E o tema claro saiu melhor do que a previsão.** Eu esperava que tingir o aro
lá — onde ele é **sombra**, não luz — o lavasse. Medido, o contrário: a fonte
ali é o `-surface`, que no claro é o saturado **escuro**, então a sombra
escurece e ganha cor (contraste de 1,53 para ~2,03 contra o cartão), e o lado
aceso vai de branco puro a um branco tingido visível. O bisel das peças
coloridas fica mais presente no claro — consequência do alfa livre, e dita em
vez de descoberta depois.

#### O escopo, e o que ficou de fora

Tingem: os **dois extremos do aro** e as **duas nuvens**. Não tingem:

- **`--glass-rim-shade`**, o vale do bisel — a 5% e 10% de alfa não carrega
  matiz que se enxergue.
- **`--glass-sheen`**, o realce de cursor — realce é a cor da **fonte de luz**,
  não do material.

A asserção **15** tranca as duas listas, para a decisão ficar escrita em vez de
combinada.

#### Um guarda que passava por sorte

A asserção **11** proibia `color-mix` tocando `--glass-rim`, com
`not.toMatch(/color-mix[^)]*--glass-rim/)` sobre a receita. Com o tingimento ela
continuou **verde** — e não por estar certa: o `[^)]*` não atravessa o `)` de
`var(--glass-ink)`. O que ela quer proibir é **derivar um extremo do bisel do
outro na declaração do token**, que é onde o defeito da rodada 40 morava; ela
passou a olhar os blocos de tema, e verificada reintroduzindo a derivação,
reprova.


### Rodada 45 — o vidro do botão vira acabamento, e não paleta

O modo de vidro do `Button` nasceu como **peso próprio**: fechava `variant`,
abria um eixo `tone` de sete cores e pintava com os pares `-muted`. A leitura do
dono foi direta — *"as cores estão diferentes, a forma de aplicá-las está
diferente, e deixou o botão mais apagado"* —, e a medição no escuro deu razão:

| | corpo | tinta | contraste |
| --- | --- | --- | --- |
| `variant="primary"` | `0,121,82` | branco `250,250,250` | 5,22 |
| `glass tone="primary"` | `0,47,32` | verde pálido `179,229,206` | 10,52 |

**2,6× mais escuro** no canal principal, com a tinta trocada. A página do
catálogo documentava isso como decisão — *"um botão de vidro primary não é um
botão verde"* —, e essa nota cai.

**A régua nova: o vidro é acabamento sobre a cor da peça, e não uma paleta
paralela.** O corpo vai para `--glass-tone` com a cor do próprio variant, opaco;
a tinta e o anel de foco do variant sobrevivem; o vidro acrescenta aresta, halo
e aro aceso.

Medido depois, corpo do vidro contra corpo do chapado:

| | escuro | claro |
| --- | --- | --- |
| `primary` | Δ **0** (`0,121,82`) | Δ **0** (`0,96,61`) |
| `secondary` | Δ **0** | Δ **0** |
| `destructive` | Δ1 | Δ2,4 |

E o contraste do texto volta ao do botão padrão: **5,22** no `primary` escuro,
7,34 no claro — contra os 10,52 de antes, que eram texto pálido sobre corpo
escuro.

#### Não foi preciso forçar `tertiary`, e é o que salva a tinta

A versão anterior cravava `variantEfetivo = "tertiary"` por dentro e reconstruía
tudo por `tone`. Mantendo o **variant real**, o que precisa sair é só o que a
`@utility` apagaria de qualquer jeito, e em três famílias:

- **o preenchimento**, que o shorthand `background` apaga calado (armadilha 1);
- **a borda**, porque a utility declara `border: 1px solid transparent` e é ali
  que o aro mora;
- **o recorte**, e este é o sorrateiro: o `secondary` traz `bg-clip-border`, e
  `background-clip` é uma propriedade **só** — ela sobrescreveria o recorte das
  **cinco camadas** de uma vez, levando as de `padding-box` para fora da borda.

O que **não** sai é a tinta nem o `focus-visible:ring-destructive/20`. É isso
que faz "as mesmas cores" ser verdade em vez de aproximação.

#### O `destructive` é a exceção, e ela foi medida

Ele é o único dos três que **não preenche**: o botão padrão é um véu
(`bg-destructive/10` no claro, `/20` no escuro). Como `--glass-tone` tem de ser
opaco — senão a lâmina quase preta atravessa, que é o defeito da rodada 44 —,
foi preciso achar o opaco equivalente:

| candidato | Δ contra o véu |
| --- | --- |
| `color-mix(--destructive 20%, --card)` | **0** sobre a página, **1** sobre o cartão |
| `--destructive-muted` | **21** |

O óbvio errava por 21. A referência é `--card` porque é onde um botão mora, e
**é a única das três que não acompanha o fundo** — o preço de o tom ser opaco,
dito em vez de descoberto.

#### O glow: halo por fora, aro aceso por dentro

Nada no repositório se chamava glow, e **nenhum `box-shadow` do sistema tinha
cor semântica** — os cinco `--shadow-*` são preto puro nos dois temas. O idioma
mais próximo era o `slider.tsx`, com `hover:ring-4 ring-primary-accent/15`.

- **Halo**: `shadow-[0_0_16px_-4px_var(--glass-glow)]`, com `--glass-glow`
  declarado por variant. **Verificado que ele não come o anel de foco**: medido,
  `shadow-md ring-1` emite as duas na mesma cadeia, porque no Tailwind v4
  `--tw-shadow` e `--tw-ring-shadow` são variáveis distintas somadas em
  `box-shadow`.
- **Aro aceso**: `--glass-ink-amount` sobe de 20% para **45%** na linha do
  variant. É variável, então não custou uma linha na `@utility`.

**`secondary` não tinge, e está certo** — `--secondary` é croma 0 nos dois
temas, e multiplicar zero pelo `--glass-ink-boost` continua zero. Sai neutro por
construção, e não por exceção.

#### A limpeza que a mudança obrigou

Com o `Button` fora do eixo de sete tons — e o `Badge` já sem o modo —,
`GLASS_TONES`, `GLASS_TONE_INKS` e o tipo `GlassTone` ficaram com **zero
consumidores**. Os três saíram de `glass-classes.ts`, e no lugar ficou a nota
que explica por quê. `glassInteractiveClassName` fica: o `Checkbox` o usa.

#### E o modo saiu do `Button`

Vista na tela, a peça foi reprovada pelo dono — *"ficou péssimo"* —, e o modo
foi **removido inteiro**. Saíram o eixo do `cva`, as três linhas de
`compoundVariants`, a união de props, o `data-glass` e a seção do catálogo com
as duas notas.

**A união levou junto uma dívida que ela mesma tinha criado.** Fechar `variant`
no ramo de vidro obrigou 11 wrappers de `ui/` a se fixarem em
`ButtonSolidProps`, porque desestruturar o rest de uma interseção com união
aninhada colapsa os ramos. Sem a união, os 11 voltaram a
`React.ComponentProps<typeof Button>` — que é o que tinham antes, e é mais
simples.

Ficam **três** peças com o modo: `Avatar`, `Checkbox` e `ColorTile`.
`glassInteractiveClassName` sobrevive com um consumidor só, o `Checkbox`.

**O que esta rodada deixa de saldo, mesmo tendo sido revertida na peça:** os
números que explicam por que a versão anterior estava errada (2,6× mais escura,
tinta pálida), a medição do `destructive` (o `-muted` erra por Δ21 contra o véu
que o botão pinta), e o fato de que `background-clip` é uma propriedade só —
ela sobrescreveria o recorte das cinco camadas de uma vez. Os três continuam
valendo para qualquer peça que venha a vestir vidro.

#### E o `Checkbox` saiu junto

Removido logo depois, pela mesma decisão. Saíram o prop, os dois ramos do
ternário e a seção do catálogo com as duas notas — a caixa voltou a ser a lista
de classes chapada que era antes.

**Com ele foi-se o último consumidor de `glassInteractiveClassName`**, que
publicava `--glass-sheen` no `hover` e no `active`. O export saiu; **a camada
fica na `@utility`**, lida com fallback `transparent`. Ela é ponto de contrato e
não código morto: hoje não há produtor, e a primeira peça de vidro **clicável**
volta a precisar dela.

Sobram **duas** peças com o modo — `Avatar` e `ColorTile` —, e as duas têm em
comum não serem clicáveis. É o resumo honesto de onde o vidro se paga neste
sistema: superfícies de **identidade**, não controles.

#### Uma lição de instrumento, e é a terceira desta série

Ao conferir o halo, a sonda cortava `boxShadow` em 80 caracteres e devolvia
`rgba(0, 0, 0, 0) 0px 0px 0px 0px` três vezes — e eu quase reportei que o glow
não estava aplicando. **As entradas zeradas são o começo da cadeia composta do
Tailwind**; a camada real era a última. Truncar um valor composto esconde
justamente a parte que interessa.


### Rodada 46 — o borrão não cabe no elemento mascarado

O pedido foi uma versão do `ScrollFade` que, além do fade, borrasse levemente a
borda — vidro. **Ela não cabe no nó que já existe, e não é questão de gosto.** A
invariante 2 diz que o rolável não desenha nada, e um `backdrop-filter` nele
seria recortado **pela própria rampa**: forte onde a máscara é opaca, ausente
justo na ponta. Exatamente ao contrário do que se quer, e filho dele herdaria o
mesmo recorte.

As camadas são **irmãs** do rolável, e a casca hospeda as duas coisas.

**E a escolha do mecanismo já estava escrita.** A régua dos dois vidros, em
`globals.css`: *há algo passando por baixo* → `backdrop-filter`; *não há* → a
`@utility glass`, que é luz pintada porque borrar cor chapada não desenha nada.
Numa borda de rolagem há conteúdo passando por baixo — é o lado do
`backdrop-filter`, e com ele veio o `prefers-reduced-transparency` que um blur
de verdade obriga. É o segundo consumidor dele no repositório.

#### Irmão não lê custom property de irmão

O `useScrollFade` escreve `--scroll-fade-start` / `--scroll-fade-end` **no
próprio rolável**, com `el.style.setProperty`. Custom property herda para
descendente, nunca para o lado — as camadas não enxergariam nada.

A casca é o host certo, e já era: é ela que publica `--scroll-fade-band-h` /
`--scroll-fade-foot-h`, justamente por ser *"o único elemento que enxerga as
faixas como irmãs do rolável"*. Publicando ali, as duas variáveis descem por
herança para o rolável **e** para as camadas, e o recuo das faixas fixas sai de
graça. Medido: `--scroll-fade-start: 152px` e `--scroll-fade-end: 252px`,
idênticos nos dois nós.

A opção `shell` é **opt-in**, e é o que mantém os **13 consumidores** de hoje
sem uma linha de diferença — nenhuma casca do Radix ou do cmdk recebe mutação de
atributo que não pediu.

#### Uma camada é crossfade; três são um gradiente

Com uma só, o raio é **constante** e só a opacidade varia — nítido dissolvendo
em borrado, não borrão que cresce. São três, e cada uma borra o que a de baixo
já compôs, então a variância soma. O índice faz duas coisas ao mesmo tempo:
multiplica o raio **e** encurta a extensão para `100% / i`, então a que mais
borra é a que menos avança para dentro. Medido: `blur(2px)`, `blur(4px)`,
`blur(6px)`, ~7px de raio efetivo na ponta.

A rampa de cada camada leva degrau intermediário pela razão da rampa principal:
queda linear sai do chapado com inclinação máxima, e descontinuidade de derivada
contra superfície lisa é banda de Mach — aqui, numa linha que atravessa a caixa
inteira.

#### O que foi medido

| | resultado |
| --- | --- |
| altura da faixa, rolando 0 → 20 → 201 → fim | **0 · 20 · 44 · 0** — cresce no mesmo passo da dissolução, e não existe nos extremos |
| eixo X | **32px**, que é `--scroll-fade-x-h`, e não os 44 do Y |
| `data-scroll-fade="off"` | `display: none` — nenhuma camada de composição parada |
| o clique | `elementFromPoint` na camada devolve **o conteúdo**, não ela |
| guardas no CSS emitido | os quatro, **duas vezes** (uma por eixo) |
| `mask-composite` no CSS emitido | **0** — a invariante 3 de pé |
| popover assentado | `transform: none`, e a camada com `blur(8px)` na geometria certa |

**O risco que a inspeção fechou:** um ancestral com `transform` / `opacity` /
`will-change` troca a raiz de backdrop, e é o que o Radix faz ao abrir. Medido,
o popover **assentado** não tem transform nenhum — a exposição fica restrita aos
~150ms da animação de abertura.

#### `sem eixo de intensidade`, e o que mais não entrou

Quem quiser mais ou menos vidro sobrescreve `--scroll-fade-blur-r` no próprio
elemento: variável herda, e eixo sem caso medido é ficção — este projeto já
removeu dois. **Nenhum dos 13 consumidores migrou**, por decisão: a utility fica
disponível para `Command`, `Sidebar`, `Table` e os menus, e ligá-la em qualquer
um é decisão de produto. **Zero pixel alterado em produção.**

#### O `scroll-fade` ganhou o teste que nunca teve

As quatro invariantes dele só eram cobradas de raspão por
`carousel-ladder.test.ts`, contra **um** consumidor.
[`scroll-fade.test.ts`](src/components/ui/scroll-fade.test.ts) tranca as nove:
o borrão irmão e nunca o próprio, um gradiente por elemento, o empilhamento, os
quatro guardas, o clique, a faixa não poder divergir da que dissolve, a régua
não montar classe em runtime, o espelho ser opt-in e limpar o que escreveu — e
a **invariante 2 aplicada ao próprio componente**, que era a lacuna antiga.

Quatro delas foram verificadas **reintroduzindo o defeito**, e as quatro
reprovam.

#### Rodada 46b — o material do iOS, e o `blur` booleano durou uma hora

A pergunta foi se aquilo parecia iOS. **O mecanismo era; a aparência não** — e a
medição nomeou as quatro lacunas: raio de 7px contra os ~24 de lá, `saturate`
nenhum, tinta nenhuma, e — a que decide — o conteúdo **dissolvendo até 6% de
alfa** enquanto um material do iOS borra e não apaga.

O dono escolheu o material de verdade. Ele **contraria a regra que enterrou o
`ScrollFade` de gradiente pintado** (*dissolver, e não pintar um véu*), a
contradição foi apresentada antes, e ele reafirmou.

**O eixo passou a ser `edge`, e os três valores não são graus do mesmo efeito.**
`fade` é só a máscara, `blur` soma borrão a ela, e `material` **substitui**: ali
`--scroll-fade-mask` sai e o conteúdo passa por baixo nítido. O `blur` booleano
que a rodada anterior entregou durou uma hora e tinha **zero consumidores** —
trocá-lo custou nada, e um booleano nunca ia expressar "substitui" ao lado de
"soma".

#### A tinta é `transparent` de fábrica, e o número é que decidiu

O caminho óbvio era herdar `--mobile-glass-bg`, que é o material do telefone.
Medido, ele **não serve**:

| | `--mobile-glass-bg` | o que ele iguala |
| --- | --- | --- |
| claro | `oklch(0.985 / 55%)` | **`--background`** (0.985) |
| escuro | `oklch(0.205 / 45%)` | **`--card`** (0.205) — a página é 0.145 |

Ele segue **superfícies diferentes em cada tema**, porque é calibrado para uma
folha sobre a página. Uma faixa de borda vive sobre card, popover, página ou
`muted` — herdá-lo seria cravar a cor de novo, que é literalmente o defeito que
matou a versão pintada (`from-card` dentro de um popover pintava faixa clara).

A tinta nasce `transparent` e é opt-in por `--scroll-fade-blur-tint`. É o
mecanismo do `--glass-tone`, que também nasce transparente e por isso é no-op.

**O que foi herdado são o raio e a vibrância:** `saturate(1.5)` é o número de
`.mobile-glass-surface`, para a casa ter **uma** vibrância — e o teste falha se
os dois divergirem. As três camadas somam para ~26px efetivos contra os 24 de
lá. Não é um terceiro vidro: é a mesma receita, numa faixa em vez de numa
superfície.

#### Preset de variável, e nunca uma segunda propriedade

`scroll-fade-material` declara **duas variáveis e mais nada**. A tinta e a
vibrância entraram nas camadas como no-op (`transparent` e `1`), então o modo
`blur` não mudou um pixel. É o precedente do `glass-control`: *sobrescrever a
variável, nunca a propriedade* — duas utilities escrevendo `backdrop-filter`
seriam decididas pela ordem de emissão do Tailwind, e não pelo que se escreveu.

**A máscara sai por uma regra que empata em especificidade e vem depois.**
`&[data-scroll-fade-mode="material"]` fica logo abaixo de `&[data-scroll-fade="on"]`
dentro da mesma utility; as duas são (0,2,0) e ali quem decide é a ordem. A
folga de rolagem **fica** — medido, 48px nos três modos —, senão um
`scrollIntoView` depositaria o item ativo debaixo da faixa.

#### O que foi medido

| | resultado |
| --- | --- |
| `fade` | máscara **rampa**, 0 camadas |
| `blur` | máscara **rampa**, 6 camadas |
| `material` | máscara **nenhuma**, 6 camadas, `blur(7/14/21px) saturate(1.5)` |
| folga de rolagem | **48px nos três** |
| os dois temas | o conteúdo sob o material continua legível; sob `fade` e `blur`, não |

**A lição de instrumento:** as três primeiras capturas do material pareciam
"pouco borradas", e não estavam — o painel entregava 800px para um viewport de
1443, e o downscale de 0,55 apaga justamente o detalhe que se está medindo.
Com `resize_window` a 800 e captura 1:1, a diferença entre os três modos fica
óbvia. **Captura escalada não serve para julgar nitidez.**

#### Rodada 46c — a camada era um retângulo reto dentro de uma casca curva

Relatado pelo dono, com o canto superior-direito circulado na captura: *"as
bordas dos fades estão quebrando"*. Medido: a casca tem **raio 10px e
`overflow: visible`**, e cada camada de borrão é `border-radius: 0` preenchendo
o padding box inteiro (`top: 1`, `left: 1`, largura 290,7 contra 292,7 da
casca — os 2px das bordas).

**A camada é filha, então ela pinta depois da borda da casca.** De canto reto
ela avança sobre a curva, cobre o fio nos quatro cantos, e — o que se vê — o
`backdrop-filter` espalha o conteúdo de dentro para fora do arredondamento. O
sintoma some no modo `fade`, que não tem camada nenhuma, e é mais forte no
`material`, que não tem máscara para atenuá-lo.

**O conserto é a camada herdar o raio, e não a casca recortar.** `overflow-hidden`
na casca seria exato e resolveria só o componente: o eixo escolhido na 46 foi
*utility + régua para qualquer casca*, e uma utility que depende de o consumidor
lembrar de recortar não serve. Herdando, ela é auto-contida.

**E só os dois cantos que encostam.** `border-radius: inherit` arredondaria os
quatro, e a aresta de dentro da faixa corre no **meio** da caixa — ali não há
canto a acompanhar. Por ponta:

| eixo | ponta `start` | ponta `end` |
| --- | --- | --- |
| Y | os dois de **cima** | os dois de **baixo** |
| X | os dois do lado de **início** | os dois do lado de **fim** |

Medido depois: `10px 10px 0 0` e `0 0 10px 10px` no eixo Y; `10px 0 0 10px` e
`0 10px 10px 0` no X.

**O que sobra, e é dito:** herdar dá o raio do *border box* aplicado ao *padding
box*, ou seja **1px de sobra** onde a casca tem borda — o raio interno correto
seria `10 − 1`. Não há como ler a borda do pai em CSS, e a 1px o resto é o
borrão passando de leve sobre o fio em vez de um canto reto inteiro. Quem
precisar de exatidão põe `overflow-hidden` na própria casca.

A asserção 10 tranca as duas metades — que os cantos da ponta herdem, que os
outros **não** herdem, e que ninguém use o atalho `border-radius`. Verificada
reintroduzindo três defeitos: o canto reto (o relatado), os quatro cantos de
uma vez, e o eixo X pegando o lado errado. Os três reprovam.

#### Rodada 46d — o material vira superfície, e o cabeçalho do catálogo veste

Pedido: *"aplique esse mesmo estilo no header para que o fundo fique mais
glass"*, com o esclarecimento de que **não é o fade** — é o material como fundo.

Medido, o cabeçalho tinha três lacunas contra a receita da casa:

| | cabeçalho do catálogo | `.mobile-glass-surface` |
| --- | --- | --- |
| raio | **`blur(8px)`** | `blur(24px)` |
| vibrância | **nenhuma** | `saturate(1.5)` |
| tinta | `bg-background/85` | 45%/55% |

Mais uma quarta, que só aparece lendo: ele tinha `backdrop-filter` **sem o
`prefers-reduced-transparency`** que o próprio `globals.css` diz que um blur de
verdade obriga.

**Escrever os números no `className` seria a terceira cópia da mesma receita**,
e a casa já reclama de ter dois vidros. Em vez disso o mecanismo saiu para uma
`@utility glass-surface`, e `.mobile-glass-surface` passou a **consumi-la** com
`@apply` em vez de repeti-la — extração, não mudança. Medido antes e depois na
folha do telefone: `blur(24px) saturate(1.5)`, `oklch(0.205 0 0 / 0.45)`,
borda `oklch(1 0 0 / 0.05)` — **idênticos**.

**Ela declara o material e nunca a cor.** A tinta depende da superfície, e
cravá-la aqui é o defeito que enterrou o `ScrollFade` pintado. Quem veste traz
o próprio `bg-*`; os dois números são variáveis, pelo mecanismo do
`glass-control`.

**O par opaco/translúcido é de quem veste, e não da utility.**
`bg-background/95 supports-backdrop-filter:bg-background/60` — sem borrão, os
60% deixariam o conteúdo passar por trás do título. É o que `app-header.tsx` já
escrevia, e agora as duas cascas concordam.

Medido depois, nos dois temas: `blur(24px) saturate(1.5)`, fundo a 60%, e o
guarda de transparência reduzida emitido **duas vezes** no CSS — uma pela
utility, outra pela folha que a herda.

**A asserção 9 media a coisa certa por acidente, e isso só apareceu agora.** Ela
lia a vibrância a partir de `indexOf(".mobile-glass-surface")` — e a **primeira**
ocorrência dessa string no arquivo é um comentário, quarenta linhas acima do
bloco. Com a receita extraída, o número que ela achava passou a vir da utility
nova; ela continuou verde sem estar certa. Hoje lê da `@utility glass-surface`
e tranca que a folha **herde** em vez de declarar os próprios números.
Verificada reintroduzindo os dois defeitos: a vibrância divergindo e a folha
repetindo a receita. Os dois reprovam.

É a segunda vez que este arquivo registra a mesma família: *corte por `indexOf`
sem posição inicial é uma asserção que pode acertar por vazio* — e agora também
**por comentário**.

#### Três lições de instrumento, e as três são erros meus

**`requestAnimationFrame` não dispara com o painel oculto.** Um `await` de dois
quadros dentro da sonda pendurou a chamada por 45s, e o diagnóstico natural
seria "a página travou". A leitura de layout continua tendo de ser um quadro
depois da mutação — mas o quadro tem de vir de **outra chamada**, e não de um
`await` dentro da mesma.

**A minha varredura do CSSOM reportou zero guardas** enquanto o `getComputedStyle`
já tinha mostrado `display: none` funcionando. Ela descia para os filhos de cada
regra **antes** de testar o texto do pai, e com CSS aninhado os guardas moram
lá. É a quarta vez que este arquivo registra a mesma régua: **quando a medição
contraria o mecanismo, desconfie da medição primeiro.**

**E um efeito sutil e correto é indistinguível de um quebrado.** A 2px o
`backdrop-filter` computava certo e a captura não provava nada. O que resolveu
foi **amplificar o token** para 8px: aí o borrão fica inegável, e só então baixá-lo
de volta. Verificar "leve" exige medir o mesmo mecanismo em intensidade alta.

### Rodada 47 — o vidro ganha o modo material, e um guarda meu tinha caído

O pedido foi o vidro no estilo iOS, como o `scroll-fade`. É o item que a 46d
deixou escrito: *"unificar é decidir se a premissa vira eixo ou se os dois nomes
ficam."* Decisões do dono: **eixo**, **escada de espessura** — contra a minha
recomendação de um material só, e fica registrado que ela nasce sem caso
medido — e **zero pixel em produção**.

#### O item zero: uma regressão minha, achada pela exploração

A 46d fez `.mobile-glass-surface` consumir a `@utility glass-surface` com
`@apply`. Medido no CSSOM, o emitido era:

```css
.mobile-glass-surface {
  backdrop-filter: …;
  @media (prefers-reduced-transparency: reduce) { background-color: …; }
  background-color: var(--mobile-glass-bg);   /* ← depois, e vence */
}
```

**O `@apply` insere as declarações no lugar da diretiva**, então o guarda ficava
*antes* das cores e a declaração literal seguinte vencia: sob `reduce` a folha
ficava **translúcida sem blur** — o pior dos dois estados, e o que a própria doc
da utility diz que não pode acontecer. Ela está viva em toda tela do telefone.

**A asserção que escrevi provou a forma e não o resultado.** Ela exigia `@apply
glass-surface` e a ausência de números repetidos, e passava com o guarda
perdendo. Família da 29b: *asserção que casa a forma da chamada testa a
digitação.*

**O conserto não foi mover a linha.** Uma utility não pode ser dona de
`background-color` se quem a veste também é: contra `@apply` ela perde por
ordem de inserção, e contra classes utilitárias perde por ordem de emissão do
Tailwind. Hoje ela é dona de **uma** propriedade — `backdrop-filter` —, e a cor
sólida do guarda voltou para quem veste, escrevível por um
`@custom-variant reduced-transparency` novo. O cabeçalho do catálogo diz as
duas cores no mesmo lugar: `bg-background/95`,
`supports-backdrop-filter:bg-background/60` e `reduced-transparency:bg-background`.

#### Não dava para "só acrescentar blur"

A lâmina é quase opaca de propósito — 82% no escuro, que compõe para **rgb 2**
sobre a página. Um `backdrop-filter` atrás dela é invisível, que é o defeito que
a rodada 44 mediu quando o tom opaco a tapava. **O modo abre a lâmina, e é essa
abertura que é o material.**

**E as nuvens saem.** Elas existem para simular luz atrás de uma placa que não
tem nada atrás; com conteúdo real e borrado ali, o simulacro disputa com a
coisa. É a mesma conclusão a que a rodada 44 chegou por outro caminho — *"numa
peça com tom as nuvens já chegavam a 3,6%: quem faz o material é o aro"*. O aro
fica, e medido ele não se move: **34% nos quatro** espécimes.

#### A mecânica: só uma utility declara a lâmina

Os degraus movem `--glass-material-step`, uma intermediária; **nenhum deles
toca `--glass-tint`**. Se cada um a escrevesse direto, quem venceria seria a
ordem de emissão do Tailwind — e os dois guardas, que moram na regra do meio,
perderiam para o degrau. É o mecanismo do `glass-control`.

Os guardas restauram com **`inherit`**, que numa custom property devolve o valor
computado do pai — o token do tema, que é exatamente o pintado. Sem alias e sem
token novo.

A intermediária chegou a se chamar `--glass-material-tint`, ao lado de
`--glass-material-thin`: uma letra de diferença entre duas variáveis vizinhas é
um erro de leitura esperando acontecer, e ela virou `-step`.

#### O que foi medido, e o número que decide a régua de uso

Contraste do texto do sistema sobre a placa, composto sobre o fundo real:

| | alfa (escuro) | pior caso | sobre a página |
| --- | --- | --- | --- |
| pintado | 82% | 13,03 | 19,90 |
| `thick` | 70% | 8,16 | 19,76 |
| `regular` | 55% | **4,56** | 19,58 |
| `thin` | 40% | **2,73** | 19,41 |

**`thin` reprova os 4,5:1 sobre conteúdo claro, e isso não é conserto — é o que
um material fino é.** Fechá-lo até passar exigiria ~54%, praticamente o
`regular`, e a escada colapsaria. A régua que sai daí: **onde há texto sobre o
material, o piso é `regular`**; `thin` é para superfície sem texto crítico ou
sobre conteúdo escuro. É por isso que o iOS tem os degraus.

**No claro os três passam** (6,79 · 9,70 · 13,31), e a assimetria tem causa: lá
a lâmina é branca e o texto é escuro, então abrir a lâmina sobre conteúdo escuro
ainda deixa a superfície clara. No escuro os dois vão em direções opostas.

E o teto do claro que a rodada 40 mediu continua valendo: sobre a página os
quatro degraus compõem **251/252 contra 250** — indistinguíveis. Eles se separam
sobre **conteúdo**, que é onde o modo material vive.

#### A asserção 7 tinha duas armadilhas, e as duas eram minhas

Ela varria `RECEITA` — o texto **cru, com comentários** —, então um comentário
que apenas *mencionasse* `backdrop-filter` já a reprovava, sem mudança nenhuma
de código. Passava só porque a seção que fala disso está acima da linha
`@utility glass {`. E a fatia ia até `@utility glass-control`, **engolindo o
doc-comment inteiro do vizinho** — 17 linhas de prosa varridas como se fossem
código.

Hoje ela varre `RECEITA_CODIGO`, o corte para no próximo doc-comment de topo, e
ela diz as duas metades: **a receita base nunca borra; o material sempre**.

Quatro asserções novas (16 a 19), e **seis sabotagens verificadas**. Duas delas
acharam buracos no próprio teste antes de passarem: a 17 aceitava quem cravasse
o raio no `backdrop-filter` e deixasse o par `-webkit-` com a variável — ela
passou a exigir **duas** ocorrências —, e depois acusou a si mesma, porque a
condição `@supports not (backdrop-filter: blur(1px))` carrega de propósito a
string que a asserção proíbe. A condição sai antes da varredura.

**A régua de método que sobra:** uma asserção que varre um bloco de CSS precisa
saber onde o bloco acaba **e** que a condição de um `@supports` não é código.

#### O que não entrou

Nenhum consumidor. O modo é opt-in, e `Avatar` / `ColorTile` seguem pintados —
os dois são superfícies de identidade sem nada atrás, que é a premissa do
pintado. **Zero pixel alterado em produção**, verificado por `git diff`.

### Rodada 48 — o avatar de vidro era um disco chapado, e as duas causas eram da receita

O pedido foi o `<Avatar glass>` no estilo iOS. Ampliado 6×, ele era um disco
fosco quase indistinguível do opaco ao lado. **Nenhuma das duas causas estava no
`avatar.tsx`.**

#### 1. Quatro das seis camadas não pintavam nada

O tom é a **camada 0** — acima da lâmina e das nuvens — e a rodada 44 o tornou
**opaco** por uma razão medida (translúcido, o avatar saía 20% mais escuro que o
opaco da mesma identidade). Ela anotou o efeito colateral pela metade: *"as
nuvens já chegavam a 3,6%"*. Com alfa 1 elas chegam a **zero**.

| camada | no avatar |
| --- | --- |
| −1 realce | `transparent`, sem produtor |
| 0 **tom** | **opaco — cobre tudo abaixo** |
| 1 lâmina · 2–3 nuvens | invisíveis |
| 4 aro | 1px |

#### 2. O pico do aro caía fora do círculo

O aro é `linear-gradient(165deg, …)`, calibrado numa placa de 240×424. Numa
caixa de 40×40 o eixo dele mede **49px**: as duas pontas — o pico e o extremo
aceso — caem nos **cantos** do quadrado, e num círculo os cantos não existem.

Amostrando 720 pontos do perímetro: **0%** via o pico de 34%, **0%** via o
extremo aceso, **57,5%** via só o vale de 10%. **O avatar de vidro nunca teve
brilho** — tinha uma borda cinza quase uniforme.

#### O conserto: duas camadas viram contrato, e um preset por forma

O aro e o realce passaram a ser `var(--glass-rim-image | --glass-sheen-image,
<o valor de hoje>)`. Provado que é extração e não mudança: o painel e o
`ColorTile` saem **byte a byte iguais** — hash `5347fc9d` e `387df95d`, 581
caracteres, antes e depois.

`@utility glass-round` troca o aro por um **`conic-gradient`**: num cônico cada
ponto do perímetro mapeia para um ângulo, e não há canto a perder. Medido
depois: **14%** do perímetro no pico contra os 0% de antes, e o vale de 57,5%
para 8,5%.

**Ele não entra no `glass-control`**, e o motivo é o `ColorTile`: aquele preset
serve as duas peças pequenas, e o ladrilho é `rounded-md` — um bisel polar num
quadrado arredondado põe as transições nos cantos errados. O `Avatar` o veste
por **forma**, e em `shape="rounded"` o linear continua certo.

O especular entra por `--glass-sheen-image`, a camada mais de cima — **a única
que sobrevive a um tom opaco**. Ela estava sem produtor desde que `Button` e
`Checkbox` perderam o modo de vidro, e era exatamente o encaixe que faltava.

#### Os números, e o que cada um decidiu

| | escuro | claro |
| --- | --- | --- |
| abertura do tom | **92%** | **98%** |
| contraste onde há letra | 5,93 – 6,34 | 4,61 – 5,14 |
| desvio contra o opaco | 4,5 | 4,9 |

**A abertura é diferente por tema porque a lâmina troca de polaridade.** No
escuro ela é preta e o corpo afunda; no claro é branca e ele **sobe**, empurrando
as iniciais para o piso — a 92% dois tons reprovavam (4,48 e **4,37**), e 98% é a
abertura máxima que passa. No claro ela quase não se paga, e isso fica dito.

#### A medição do especular quase produziu o conserto errado

A sonda acusou o reflexo derrubando o contraste para **3,36** em todos os seis
tons. O número estava certo e a **pergunta** estava errada: ele media a letra sob
o **pico** do reflexo, e o pico fica a 16% da altura enquanto a letra começa a
37%. No centro da caixa o gradiente já resolveu para `transparent`; no ponto onde
a letra de fato está ele vale **16,7%** do pico.

O especular ficou em **14%** e não em 20 por robustez — a geometria é estável nos
cinco degraus (topo da letra a 37,4% no `md` e 38,4% no `xl`, porque caixa e
fonte escalam juntas), mas uma inicial só ou uma fonte maior aproximam o texto
do pico.

#### Um erro meu de instrumento, e ele invalidou uma rodada de medições

A sonda de cor pintava `#000` **antes** da cor, então todo alfa lido voltava
**1** e a lâmina branca do tema claro era medida já composta sobre preto. Ela
reportou `alfa: 1` para um tom que o CSS declarava a 97% — a contradição entre a
medição e o mecanismo é que denunciou.

Com ela corrigida (`clearRect` e nada de preto), as conclusões do tema claro
mudaram e a abertura teve de ser remedida do zero. **Quatro erros de instrumento
nesta série, todos meus, e a régua é sempre a mesma:** quando a medição contraria
o mecanismo, o instrumento é o primeiro suspeito.

#### Três asserções novas, e a sexta sabotagem achou um buraco

As 20, 21 e 22 trancam: as duas camadas serem contrato com fallback e nenhum tema
as declarar; o preset ser de imagem e o cônico **não** vazar para o
`glass-control`; e as paradas serem angulares e fecharem o ciclo — um `%` num
cônico mede o **raio**, não o arco, e o bisel deixaria de acompanhar a borda.

As três falharam na primeira escrita, e as três por erro do instrumento:
`ESCURO` vai de `.dark {` até o **fim do arquivo** e engolia as utilities; a
fatia do `glass-control` atravessava o `glass-round`, que mora entre ele e o
vizinho seguinte; e o regex das paradas capturava o `45` de `from -45deg`.

E a sabotagem que **passou** achou o buraco real: nada garantia que o preset
chegasse à peça. Tirar `glass-round` da régua devolvia o avatar ao aro linear em
silêncio. Hoje a 22 exige que a régua o contenha e que o `Avatar` o vista por
forma.

#### Zero pixel em produção

Os dois consumidores reais — `sidebar-user-profile.tsx` e
`members/page-client.tsx` — passam só `size`, `shape` e `className`. Nenhum usa
`glass`, e o modo segue sem consumidor de produto.

### Rodada 49 — o vidro volta ao botão primário, e o número explica a reprovação

O pedido foi trazer o vidro do iOS ao `Button variant="primary"` **sem tirar a
cor primary**. Isto reabre a rodada 45, em que este mesmo botão ganhou vidro,
foi visto na tela e reprovado — *"ficou péssimo"*.

**A medição desta rodada explica por quê, e o número é duro:**

| | |
| --- | --- |
| contraste do rótulo hoje (branco sobre o verde), escuro | **5,22** |
| margem até o piso de 4,5 | **0,72** |
| véu branco a 8% sobre o corpo | **4,49 — reprova** |
| os 14% que o `glass-round` usa | **4,01 — reprova** |

**Um botão preenchido com texto branco quase não tem margem para brilho
branco.** A versão de quatro rodadas atrás punha o brilho no corpo inteiro:
ou reprovava o contraste, ou era fraca demais para se ver. Não havia saída —
o vocabulário que a permite (`--glass-sheen-image` e `--glass-rim-image` como
contrato) só nasceu nas rodadas 47 e 48.

#### A faixa livre é o que torna isto possível

Medida a caixa do glifo nos cinco degraus, o texto **nunca começa antes de 32%**
da altura:

| degrau | altura | topo do glifo | livre |
| --- | --- | --- | --- |
| `xs` | 24 | **32,0%** | 7,7px |
| `md` | 32 | 34,2% | 11,0px |
| `xl` | 40 | 37,4% | 15,0px |

O gloss se esvai em **28%** e não alcança o rótulo em degrau nenhum — medido, o
alfa dele na altura do glifo é **0%**. Fora da caixa do texto o alfa deixa de ser
refém do contraste, e é isso que permite um brilho que se vê.

Medido depois: **5,22 com e sem vidro** no escuro e **7,34** nos dois no claro.
O contraste do rótulo não se mexeu um centésimo.

#### A cor é de quem veste, e o preset não a conhece

`--glass-fill-tone` é publicado pelo **compound do variant**, não pelo preset.
Cravar `var(--primary)` na utility faria toda peça de vidro ser verde — e o
shorthand `background` da receita já apaga o `bg-*` do consumidor, que é a
armadilha nº 1 da régua. Medido: o tom resolve para `oklch(0.5 0.125 166)`, que
é o `--primary` byte a byte.

#### O estado move variável, e é isso que conserta o defeito calado

**`hover:bg-*` morre sob vidro.** Ele declara só `background-color`, e o
shorthand o apaga — foi assim que o `hover:bg-primary/90` do variant sumiu na
primeira versão. Aqui o par move `--glass-gloss` (16% → 24% no cursor, 8% no
toque), e o botão **acende** ao apontar em vez de escurecer, que é o
comportamento do iOS.

**De brinde, o botão de vidro responde ao toque.** Verificado no CSS emitido: o
`hover:` compila dentro de `@media (hover: hover)` e o `active:` **fora** dela.
O `primary` sem vidro segue na lista de inertes do
`button-touch-response.test.ts` — o de vidro não está.

#### Sem união de props, e é o que evita a dívida da 45

O vidro **soma** à cor do variant em vez de substituí-la, então `variant` não é
fechado e não há união discriminada. A rodada 45 fechou, e 11 wrappers de `ui/`
quebraram de uma vez — desestruturar o rest de uma interseção com união aninhada
colapsa os ramos. Nenhum wrapper se mexe aqui.

**E os 70 botões primários de produção não mudam**: o eixo é opt-in, e a
asserção 26 tranca a string do variant literal — se ela ganhar um caractere, o
teste cai.

#### O corte largo cobrou pela terceira vez

A asserção 8 fatiava de `@utility glass-control` até `@utility no-scrollbar`, e
entre os dois moram hoje **três** presets. O comentário do `glass-fill` cita o
shorthand `background` por extenso, e ela acusou a **prosa**. É o mesmo defeito
que a 7 tinha (varrer texto cru) e que a 21 já havia consertado no próprio corte.
Hoje ela corta no fechamento da utility e remove comentários.

**A régua que sobra:** uma fatia de CSS que termina no *vizinho seguinte*
envelhece toda vez que alguém escreve uma utility no meio. Ela precisa terminar
no próprio `}`.

#### O que não entrou

`secondary` e `destructive` seguem sem vidro: cada preenchido tem margem de
contraste própria, e o `destructive` é um **véu** no tema claro em vez de um
preenchimento. Cada um entra quando for medido. E nenhuma tela adota o modo —
**zero pixel em produção**.

### Rodada 50 — o vidro do botão, segunda passagem: a luz sai do corpo

A 49 foi vista e reprovada — *"ficou muito feio"*. A direção que veio junto era
precisa: **sem degradê dentro**, luz **só na borda**, a borda **interna**, e na
**própria cor primary**, mais clara ou mais escura.

O que a 49 tinha de errado não era o mecanismo — era o desenho: gloss branco no
terço superior mais um bisel branco/preto. Ficaram de pé o eixo opt-in, o
compound do primary, a cor em `--glass-tone` (verde byte a byte), o estado por
variável e a asserção 26 que tranca os 70 botões de produção. Saíram inteiros o
gloss e o bisel.

#### A aresta é a própria cor, e o deslocamento saiu de medição

Varrido o `--primary` por *relative color* (`oklch(from … calc(l + ΔL) c h)`),
compondo sobre o fundo real:

| ΔL | escuro: vs corpo / vs página | claro: vs corpo / vs página |
| --- | --- | --- |
| −0.12 | 1,64 / 2,21 | 1,60 / 11,77 |
| **+0.12** | **1,58 / 5,76** | **1,63 / 4,51** |
| +0.20 | 2,16 / 7,87 | 2,24 / 3,27 |

**+0.12**: a aresta se separa do corpo em ~1,6 nos dois temas — o peso dos aros
da casa (1,29 a 1,76) — e no claro ainda dá 4,51 contra a página branca, ou seja
continua parte do botão. A +0.20 cai para 3,27 e começa a se soltar como halo.

**Clarear nos dois temas, contra a polaridade da casa.** A régua do `glass`
inverte o aro por tema (luz no escuro, sombra no claro), e −0.12 mede igual
(1,60). Mas o pedido é *shiny*, e uma aresta mais escura lê como recesso — afunda
o botão em vez de acendê-lo. Fica dito que o recesso mede igual e que quem
decidiu foi a tela.

**O aro do `glass` já era a borda interna.** `border: 1px solid transparent`
pintado no `border-box` é exatamente o anel que o pedido descreve — nada de
`inset-ring` nem `box-shadow`, e o `focus-visible:ring-3` da base não é tocado.

#### O preset não conhece a cor, só a desloca

`--glass-tone` e `--glass-rim-image` derivam de `--glass-fill-tone` por relative
color, que o `ColorTile` já usa. O estado move `--glass-fill-shift` (−0.03 no
cursor, −0.05 no toque) — escurece como o `bg-primary/90` do primário sem vidro,
sem nunca escrever `bg-*`, que morre calado sob o shorthand.

Medido depois: corpo idêntico ao `--primary`; rótulo em **5,22 / 7,34** com e
sem vidro; sheen e nuvens em `transparent`; três tons de estado distintos
(121 → 112 → 106 no canal verde).

#### Uma sonda minha acusou o aro transparente — e era o regex

A leitura do aro voltou `[0,0,0,0]`. O CSS estava certo: o regex
`oklch\([^)]*\)` parava no primeiro `)` — o de `var(--glass-fill-tone, …)` — e
recortava uma cor inválida. O computado de uma custom property é o texto **não
substituído**, então o `var()` ainda estava lá. A leitura certa é dar a um
**filho** do botão `background-color` com a mesma expressão e ler o resultado: o
navegador resolve com as variáveis herdadas. *Um regex não parseia CSS* — quinta
ocorrência nesta série.

#### As asserções 23–25 mudaram de assunto

A 23 passou a proibir `--glass-sheen-image` no preset (o gloss não volta pela
porta dos fundos); a 24 exige que o aro derive da cor da peça, com deslocamento
**positivo e ≤ 0.16** e uniforme (duas paradas, 0% e 100% — um gradiente de
direção seria o degradê que saiu); a 25 troca `--glass-gloss` por
`--glass-fill-shift`. Quatro sabotagens, quatro reprovações — incluindo a aresta
escurecida e a forte demais.

**Zero pixel em produção**, e nenhuma tela adota o modo.

#### Rodada 50b — o anel estava na borda errada, e o botão inteiro lia mais claro

Relatado com o botão original selecionado: *"a cor do glass está mais clara do
que o button original"*. O corpo era idêntico — medido, `[0,121,82]` nos dois —
e ainda assim ele tinha razão.

A 50 pintou o anel claro **no aro**, que é o `border-box`: a borda **externa** de
1px. A silhueta inteira do botão ficava um pixel mais clara, e o olho não separa
"o contorno clareou" de "o botão clareou". A frase da 50 — *"o aro do `glass` já
era a borda interna, nada de `inset-ring`"* — estava **errada**: o aro é a borda
externa. "Borda interna" é um pixel para dentro dela.

**Conserto:** o aro volta a ser o próprio tom (silhueta byte a byte igual à do
botão sem vidro — medido, borda `[0,121,82]` nos dois), e o anel claro vai para
dentro por `inset-ring-1 inset-ring-(--glass-fill-edge-color)`. A cor é
publicada pela utility como variável e **não** como `box-shadow`: os dois vivem
na mesma propriedade, e só o utilitário do Tailwind compõe com o
`focus-visible:ring-3` da base — verificado no emitido, `--tw-inset-ring-shadow`
e `--tw-ring-shadow` são entradas distintas da cadeia.

A asserção 24 passou a exigir que o aro seja `var(--glass-tone)` sem
deslocamento, que o deslocamento viva em `--glass-fill-edge-color`, e que o
botão o vista por `inset-ring`. Três sabotagens — o anel de volta à borda
externa, o botão sem anel, o anel escurecido — reprovam.

**A lição:** "interno" e "externo" numa borda de 1px são um pixel de diferença e
uma leitura inteira de diferença. Eu medi o corpo e declarei igual; o que
mudava era a **silhueta**, e silhueta se mede na borda, não no centro.

#### Rodada 50c — o vidro sai do botão, pela segunda vez

Removido inteiro por decisão do dono. Saíram o eixo `glass` do `cva`, o
compound do primary, a prop, o `data-glass`, a `@utility glass-fill`,
`glassFillSurfaceClassName`, as quatro asserções (23–26) e a seção do catálogo
com as duas notas. **`git diff` de `button.tsx` está vazio** — o arquivo voltou
byte a byte ao que era antes da 49.

Foram **três desenhos em três rodadas**, e os três reprovados na tela: gloss
branco no corpo (49), anel claro na borda externa (50), anel um pixel para
dentro (50b). Nenhum caiu por número — os números fechavam nos três.

**O que a medição deixa registrado, e é o que a próxima tentativa herda:**

- um botão preenchido com rótulo branco tem **0,72** de margem sobre o piso de
  4,5, então brilho branco no corpo reprova a partir de **8%**;
- a luz cabe na faixa acima da linha do texto, que nunca começa antes de **32%**
  da altura nos cinco degraus;
- a aresta na própria cor a **+0.12** de L mede ~1,6 contra o corpo nos dois
  temas — o peso dos aros da casa;
- pintá-la na borda **externa** deixa a silhueta 1px mais clara, e isso se lê
  como o botão inteiro mais claro. *Silhueta se mede na borda, não no centro.*

É a **segunda** vez que o vidro sai deste botão — a primeira foi na 45, quando
ele era peso próprio com eixo de sete tons. As duas terminaram na tela.

**O que fica de saldo para o resto do sistema:** a `@utility glass-fill` era o
único consumidor de `--glass-sheen-image` como produtor, e ela sai; a camada
volta a ser contrato sem produtor, como era. `glass-round` e `glass-material`
não são tocados, e `Avatar` e `ColorTile` seguem com o modo.

### Rodada 51 — as superfícies flutuantes ganham o material do cabeçalho

O pedido foi o dropdown do `Select` com o fundo do cabeçalho — borrão de
verdade — mas na cor **cinza** (`--popover`) e não no preto da página. Decidido
junto: vale para **todas** as superfícies flutuantes, e a paleta se alinha.

#### O risco técnico morreu na medição

O `SelectContent` é posicionado por um wrapper com `transform` **permanente** e
`will-change: transform`, e carrega `translate-*` estáticos no próprio nó. Pela
spec, `transform` cria um *backdrop root* e o borrão não veria a página.

**Medido, funciona.** Com `blur(16px)` injetado e uma grade de quadrados
coloridos atrás, os de dentro do dropdown saem borrados e os de fora nítidos. A
teoria dizia que não; a tela disse que sim. **Quando as duas discordam sobre o
que se vê, quem decide é a tela.**

#### O alfa é diferente por tema, e o número é o contraste

O texto que aperta não é o do item (`--popover-foreground`, folgado em qualquer
alfa) e sim o **`--muted-foreground`**, dos rótulos de grupo e atalhos. Composto
sobre o que de fato **preenche área** atrás de um menu:

| | escuro | claro |
| --- | --- | --- |
| pior fundo | `primary` | `primary` |
| 60% | **4,64 — passa** | 3,00 — reprova |
| 85% | — | **4,72 — passa** |

No claro o `--popover` é **branco** e o pior fundo é o verde escuro do
`primary`: um branco a 60% sobre ele vira cinza-esverdeado e o texto secundário
morre. Daí a base ser 85% — que serve o claro **e** é o fallback de quem não tem
`backdrop-filter` — e o escuro abrir para 60% só sob `supports-backdrop-filter:`.

Repete o teto que a 47 já mediu: **no claro o vidro quase não se paga.** Sobre a
página o contraste é o mesmo em qualquer alfa (5,91 a 6,01); o que a
translucidez custa só aparece sobre cor cheia.

#### Dois erros meus de sonda, e os dois inflavam o pior caso

Incluí `--foreground` e `--destructive` no conjunto de fundos. O primeiro é cor
de **texto** — glifos finos sob blur de 24px se diluem, não formam bloco; o
segundo é um **véu** no tema claro (`bg-destructive/10`), nunca um
preenchimento. Com eles, nenhum alfa até 95% passava.

**A régua: o pior caso de um fundo é o que preenche área, não o que tem a cor
mais forte.**

#### A receita estava em quatro lugares, e agora é uma

O doc de `menu-classes` afirmava ter extraído as quatro cópias — e três tinham
ficado: `Select`, `Popover` e `HoverCard` carregavam a string à mão. A paleta
tinha uma **quarta receita de vidro** (`bg-popover/85` com `backdrop-blur` de
8px, contra os 24 e o `saturate(1.5)` do material). Os quatro passaram a vestir
`menuPanelSurfaceClassName`, que alcança **11 superfícies**.

**Os dois `ScrollButton` do `Select` repintavam `bg-popover` opaco.** Com a
casca translúcida eles viravam duas faixas sólidas no topo e na base — o tipo de
defeito que só aparece com o menu rolando. Foram a transparente.

#### O primeiro teste sobre `menu-classes`

Não havia nenhum. As asserções 23–25 trancam: a régua veste `glass-surface` e
não escreve borrão próprio; o guarda de transparência reduzida existe; o escuro
abre mais que o claro e só sob `supports-`; e as quatro cópias não voltam — nem
a superfície à mão, nem o repinte nos botões de rolagem. Cinco sabotagens, cinco
reprovações.

**Uma armadilha de regex, a sétima desta série:** proibir `/backdrop-filter/` na
régua acusa a **própria receita**, porque o variante `supports-backdrop-filter:`
contém a string. A asserção ancora em `\bbackdrop-blur`, que é a classe.

#### O vidro é invisível sobre um card, e o número explica

Visto na tela, o dropdown continuava lendo como opaco. **O CSS estava certo** —
medido: `blur(24px) saturate(1.5)` e fundo em `oklab(0.205 0 0 / 0.6)`. O que
falta não é o material.

`--popover` e `--card` são **exatamente a mesma cor** nos dois temas
(`oklch(0.205)` no escuro). Um popover translúcido sobre um card é
aritmeticamente idêntico a um opaco:

| o que está atrás | delta RGB com o vidro |
| --- | --- |
| **card** | **0** |
| página | 5 |
| muted | 6 |
| algo colorido | 79 |

As superfícies do app vivem entre rgb 10 e 38 — misturar duas delas devolve
deltas de 0 a 6. É a mesma lei que a `@utility glass` já escreve: **borrar cor
chapada não desenha nada.** O vidro aparece quando há conteúdo com contraste por
baixo, e some quando não há.

O dono viu o diagnóstico e decidiu **não mexer**: as saídas eram uma aresta
luminosa (independente do fundo, como o avatar e o botão usam) ou separar
`--popover` de `--card`, que é decisão de sistema. Fica registrado para quem
vier — o defeito não é o material, é a distância entre as superfícies.

#### O que muda em produção

Diferente das rodadas de vidro anteriores, **esta não é zero-pixel**: 11
superfícies mudam de aparência, e `DropdownMenu`, `Popover` e `Select` estão em
telas do app. Foi pedido.

**E o `app-header` fica como a única superfície de vidro fora da receita** — 8px
de borrão cru, só quando rolado, na outra grafia de `supports-` e sem guarda de
transparência reduzida.

#### Rodada 51b — o tooltip era a quinta cópia, e ela divergia

A rodada 51 disse que a receita estava escrita em **quatro** lugares. Eram
cinco: o `Tooltip` também a escrevia por extenso, e era o único que **divergia
da régua** em vez de repeti-la:

| | a régua | o tooltip |
| --- | --- | --- |
| raio | `rounded-lg` (10px) | `rounded-md` (8px) |
| moldura | `ring-1 ring-foreground/10` | `border border-border` |

Ele já falava a língua certa — `--popover`, o conserto da rodada em que a
superfície dele era emprestada da `Sidebar` — e por isso passou por conforme.
**Falar a língua não é vestir a régua**, e a cópia divergente é exatamente a que
o teste da 51 existia para pegar: ela só não entrou na lista.

Vestindo `menuPanelSurfaceClassName` ele ganha o material do cabeçalho, e as
duas divergências caem junto. **Isso é mudança visível e deliberada**, dita em
vez de passada de contrabando dentro do pedido de vidro.

**O alfa da régua serviu sem revisão, e o motivo é a tinta.** Os 60%/85% foram
calibrados contra o `--muted-foreground` dos rótulos de grupo, que é o texto que
mais aperta numa superfície de menu; o tooltip é inteiro `--popover-foreground`,
a tinta cheia. Medido sobre o pior fundo real (o preenchimento do `primary`):
**11,5 no escuro e 15,54 no claro**.

Verificado com a grade de quadrados atrás: `backdrop-filter: blur(24px)
saturate(1.5)` computado, `oklab(0.205 0 0 / 0.6)` no escuro e
`oklab(1 0 0 / 0.85)` no claro, raio 10, borda 0 — e o xadrez dissolvido dentro
da caixa enquanto continua nítido em volta.

A asserção 25 do `glass.test.ts` passou a iterar **cinco** arquivos, e foi
sabotada: com a cópia de volta, ela reprova nomeando o tooltip.

#### Rodada 51c — o vidro chega ao diálogo, e o véu é o teto dele

O pedido foi o material do cabeçalho nos diálogos. A primeira leitura foi que
quem devia borrar era o **véu** — e ela foi recusada pelo dono, com a frase que
define o escopo: *"eu não queria que mexesse no que está atrás do dialog, e sim
no dialog"*. O `--overlay` fica como estava, e a placa é que veste.

**A placa recebe a mesma receita das 11 superfícies flutuantes** —
`bg-background/85 glass-surface`, abrindo para 60% sob
`supports-backdrop-filter:dark:` e caindo para o opaco sob
`reduced-transparency:`. Uma receita só na casa, e o `AlertDialog` vem junto
porque mede pelo `dialogContentVariants`.

**E o teto está medido, porque ele não é o material.** Entre a placa e o
conteúdo há um véu de 60% de preto, e borrar cor chapada não desenha nada — a
lei que a rodada 51 já tinha escrito para o dropdown sobre um card, aqui
agravada, porque o véu **destrói** o contraste que o borrão precisaria ver:

| atrás | placa a 60%, escuro | delta vs. opaco |
| --- | --- | --- |
| card | 10 | **0** |
| página | 8 | 2 |
| muted | 12 | 2 |
| botão `primary` | 6,25,19 | **15** |

No tema escuro o vidro só aparece quando há **cor cheia** atrás. Verificado na
tela com uma grade de quadrados coloridos entre o conteúdo e o véu: o xadrez sai
dissolvido dentro da caixa e continua legível fora dela.

**No claro ele se paga, e é lá que o alfa aperta.** A placa desce de 250 para
**236** sobre um card, com o `--muted-foreground` em 5,09 — e 4,38 sobre o pior
fundo real, o preenchimento do `primary`. É por isso que o alfa aberto ficou
escopado no escuro: a 60% no claro o mesmo texto cai a **4,09** e reprova.
Medido depois: `blur(24px) saturate(1.5)` nos dois temas, com
`oklab(0.145 0 0 / 0.6)` no escuro e `oklab(0.985 0 0 / 0.85)` no claro.

#### O casco da paleta precisou de dois neutralizadores, e o `twMerge` explica

`CommandDialog` passa `bg-transparent` ao `DialogContent` de propósito — quem
pinta é o `Command` de dentro, e dois 85% empilhados dariam 97,75%, que é o
bloco aceso que este arquivo já registra. **O `twMerge` derruba a `bg-*` base e
não as que vivem sob variante**: sem `supports-backdrop-filter:dark:bg-transparent`
e `reduced-transparency:bg-transparent`, a paleta sairia com duas superfícies
empilhadas no tema escuro. Medido depois: casco em `rgba(0,0,0,0)` e o `Command`
em `oklab(0.205 0 0 / 0.6)` — uma superfície só.

#### O que não muda, e por quê

O véu segue em `blur(4px)` sem `saturate` e **sem o guarda de transparência
reduzida** — a sexta grafia de vidro do repositório, escrita à mão em três
arquivos (`dialog.tsx`, `alert-dialog.tsx` e o `EDGE_PANEL_OVERLAY_CLASS`, que
serve `Sheet`, `Drawer` e o painel da `Sidebar`). Foi decisão explícita não
tocá-lo. Fica no backlog, com o número que o justifica: **é ele que limita o
efeito no tema escuro**, e quem quiser o vidro visível ali mexe no `--overlay`,
não na placa.

E `Sheet`, `Drawer` e `EdgePanel` ficaram com placa opaca **nesta rodada** —
a rodada 53 os vestiu, junto com a extração da receita para `lib/`.

#### Um erro meu que quase custou uma rodada inteira

Ao desfazer a primeira direção, rodei **`git checkout` no arquivo de teste** —
e ele **não** estava limpo: as rodadas 46 a 51 tinham +335 linhas ali sem
commit. Dez asserções (16 a 25), a reescrita da 7 e três constantes de fatia
foram apagadas de uma vez.

É literalmente a lição que a rodada 34 registrou — *desfazer edição de teste com
`git` num arquivo já editado é apagar trabalho* —, e eu andei direto nela um mês
depois de escrevê-la. **A régua ganha um corolário: antes de `git checkout`,
`git diff --stat` no arquivo.** Um `M` no `git status` do início da sessão não
diz de quem é a modificação.

A recuperação foi pelo **transcrito da sessão**: os `python3 - <<'PY'` que
escreveram cada asserção estão lá, e replayá-los na ordem contra o arquivo do
`HEAD` reconstruiu os 25 testes. Restam ~21 linhas de prosa de comentário que
não bateram exatamente com o estado anterior; o comportamento é idêntico e está
provado pela suíte e pelas sabotagens.

**E o mesmo dia teve o parente do defeito:** um corte `s[:i] + novo + s[j:]`
entre duas âncoras `indexOf`, supondo que a numeração das asserções seguia a
ordem do arquivo. Não seguia — a 10 mora no fim —, e a fatia comeu dez blocos
que viviam no meio. **Fatia entre duas âncoras apaga o que estiver entre elas**,
e a forma segura é ancorar no fechamento do bloco que se quer suceder.

### Rodada 52 — a zona do carrossel é o triplo, porque o item tem borda

Relatado com o print anotado: *"o fade está fraco — aparece a borda do lado
direito desse segundo card"*. Antes de mexer, a conferência que a rodada
anterior transformou em régua: `carousel.tsx` estava byte a byte no `HEAD` e o
`git diff` do `globals.css` **não toca a rampa** — só acrescenta o modo material
e as utilities de borrão. Nada tinha regredido; o que existia era o número.

**`--scroll-fade-x-h` vale 2rem, e ele foi calibrado para glifo.** Uma trilha de
abas, uma célula de tabela: ali a rampa só precisa apagar letra. Um `Card` tem
**borda**, e um fio de 1px é o que mais resiste — ele corre a altura toda e não
tem contrafundo que o dissolva. Medido o alfa desse fio a 15px da ponta:

| zona | alfa do fio |
| --- | --- |
| 2rem (o sistema) | **31%** — legível, e é o "fade fraco" |
| 4rem | 13% |
| **6rem** (o carrossel) | **9,5%** |

**O piso não é a alavanca, e isso foi medido ao vivo.** `--scroll-fade-floor` é
0,06 de propósito, para a ponta dizer que há mais e não que acabou. Baixá-lo a
zero num A/B na página é **indistinguível**: 6% de uma borda de 1px dá ~1
unidade de RGB. Quem decide é a **largura** da zona.

E é variável e não propriedade: ela herda para a rampa sem disputar com nada, e
os outros consumidores da dissolução horizontal ficam nos 2rem.

#### A asserção reprovou código correto por sete caracteres

A 10 do `carousel-ladder.test.ts` — *quem carrega a máscara não desenha nada* —
fatiava os últimos **900** caracteres antes do `data-slot="carousel-content"`.
Bastou o viewport ganhar uma classe com um comentário de uma linha para o
`overflow-hidden` sair da janela por **7 caracteres** e o teste cair.

Novecentos é um número mágico. O corte passou a ser pelo `className={cn(`, que é
o bloco de verdade — **mais estrito, e não mais frouxo**, e não envelhece a cada
linha que alguém escreve ali. Sabotada: com um `bg-card rounded-lg` no viewport,
reprova. É parente da lição que o `glass.test.ts` já registra duas vezes: *corte
por âncora larga é asserção que erra sozinha.*

#### Duas tentativas que a tela reprovou, e ficam registradas

**O material do iOS no carrossel** (`edge="material"`: máscara fora, borrão de
7/14/21px no lugar) foi implementado e reprovado a olho. O que ele deixou
medido, para quem tentar de novo:

- **O viewport não é bloco de contenção.** As camadas absolutas escapavam para a
  raiz — 111px de altura contra os 75 do viewport, cobrindo os pontos —, e um
  absoluto cujo bloco de contenção está acima **não** é recortado pelo
  `overflow-hidden` de quem está no meio. Sem `relative` no viewport, não há
  material no carrossel.
- **Ali a camada pode ser filha do rolável**, ao contrário do `ScrollFade`. A
  invariante existe por causa da máscara; em `material` não há máscara, e ser
  filha resolve a herança das variáveis — irmão não lê custom property de irmão.
- **A raiz não serve de casca**: ela carrega as setas, os pontos e a contagem.

### Rodada 52b — a página do `Command` abria no meio, e quem rolava era o cmdk

Relatado como *"por que essa página vem por padrão no meio?"*. Medido ao entrar
em `/designsystem/command`: `scrollY` **1754** numa janela de 998.

**Não é a coluna da esquerda.** Ela já rola só o próprio contêiner — o
`revelarAtivo` de `ds-shell.tsx` escreve `scrollTo` no elemento e o comentário
dele registra por quê: *"`scrollIntoView` rola todos os ancestrais roláveis, e
levaria a janela junto"*.

**É o cmdk, e pelo mesmo mecanismo.** Ele marca a primeira linha assim que os
itens se registram e chama `scrollIntoView({block:"nearest"})` nela
(`node_modules/cmdk/dist/index.mjs`), e isso rola **todos** os ancestrais —
inclusive o documento. A página monta **cinco** `Command` inline; três ficavam
com item selecionado, e o último estava em `topoNaPagina: 2528`:

| item selecionado | topo na página |
| --- | --- |
| Carteiras (Inline) | 565 |
| Nova transação | 1210 |
| **Carteiras (As três faixas)** | **2528** — o que puxou |

**O componente não tem defeito nos usos reais**, e é por isso que o conserto é
no catálogo: a paleta vive num `CommandDialog` (que já liga
`autoSelectFirst={false}`) e o `Combobox` num popover — nos dois a página não
rola por baixo. O catálogo é o **único** lugar que monta `Command` inline no
fluxo da página, e cinco vezes.

As três demos com itens passaram a `autoSelectFirst={false}` — o prop que o
próprio componente já expõe e que aquela página documenta. Medido depois:
`scrollY` **0**, zero itens selecionados, os cinco `Command` intactos.

**E `value` controlado não seria saída**: o `ne()` do cmdk roda a cada mudança
de seleção, não só no registro. Verificado no fonte antes de escolher o
caminho — a alternativa que eu tinha oferecido estava errada.

### Rodada 52c — o véu clareia no escuro, e é o que faz o vidro dos modais existir

As rodadas 51c e 51d puseram o material na placa do `Dialog` e deixaram o
diagnóstico escrito: **o teto não é o material, é o véu.** Um `backdrop-filter`
atrás de 60% de preto borra cor chapada, e borrar cor chapada não desenha nada.
Com a paleta a pergunta voltou — *"mude o fundo desse Command para o
transparente com blur"* —, e ela **já estava** com a receita desde a rodada 51.
O que faltava era o que ela tinha para mostrar.

`--overlay` do `.dark` vai de `oklch(0 0 0 / 0.6)` para **`/ 0.4`**. Medido:

| | 0.6 | **0.4** |
| --- | --- | --- |
| estrutura card↔página (o que o borrão mostra) | 9 | **14** |
| estrutura primary↔card | 47 | **70** |
| paleta sobre o `primary` | 14,33,27 | **14,43,33** |
| placa do diálogo vs. card velado | 1,006 | **1,026** |
| texto fraco na paleta | 6,49 | **5,86** |

**Clarear não custou separação — melhorou.** Varridos os alfas, a placa de um
diálogo contra o fundo velado mede 1,01 a 1,08 em **toda** a faixa: o véu nunca
separou um diálogo no escuro, e quem separa é o `shadow-lg` com o `ring-1
ring-foreground/10`. E o texto secundário da paleta continua em 5,86, acima dos
4,5 da norma.

**No claro ele não desce, e isso é medido, não simetria.** Ali o véu **é** a
única coisa que separa uma placa branca de uma página branca: 0.4 dá 2,60 contra
o card velado, 0.3 dá 1,94 e 0.2 dá 1,51. E clarear não compraria estrutura,
porque as superfícies do tema claro já são todas quase-brancas — não é o véu que
as achata. Os dois temas passam a dizer 0.4 por caminhos opostos.

**O que muda em produção:** todo modal do app. O conteúdo atrás passa a ler como
forma borrada em vez de mingau preto, que era o ponto do pedido — e é a primeira
coisa que se nota ao abrir um diálogo.

**E o véu segue em `blur(4px)` sem `saturate` e sem guarda de transparência
reduzida**, escrito à mão em três arquivos (`dialog.tsx`, `alert-dialog.tsx` e o
`EDGE_PANEL_OVERLAY_CLASS`, que serve `Sheet`, `Drawer` e o painel da
`Sidebar`). Continua sendo a única superfície de vidro do repositório fora da
receita, junto do `app-header`. Fica no backlog.

### Rodada 52d — o material do iOS nas duas pontas da paleta, somado à rampa

O pedido foi o efeito do iOS no topo e no fim do `Command`. A rodada 46b já
tinha construído as peças — `scroll-fade-blur-y` e o preset
`scroll-fade-material` —, e a paleta era um consumidor natural que ficou de
fora.

**Mas aqui o material `soma`, e não substitui**, ao contrário do que o
`edge="material"` do `ScrollFade` faz. A razão é estrutural e já estava
escrita: **as três faixas desta paleta não pintam nada**, então é a rampa quem
esconde o conteúdo sob o campo de busca. Desligar `--scroll-fade-mask` — que é
o que o modo material faz — deixaria o texto aparecer atrás do input. O que
entra do material é só o **borrão**: `scroll-fade-material` é preset de
variável e move o raio (7px × índice) e a vibrância (1,5), os mesmos números de
`.mobile-glass-surface`.

Três coisas que a composição exigiu, e as três são mecânicas:

- **`useScrollFade({ shell: true })`.** As camadas são **irmãs** da lista, e
  irmão não lê custom property de irmão. Com `shell` as duas variáveis também
  vão para a casca, de onde descem por herança para os dois lados. Medido:
  `--scroll-fade-start: 140px` na casca **e** na lista.
- **`relative` na casca.** Sem bloco de contenção o absoluto resolve contra um
  ancestral qualquer — é o defeito que o `Carousel` mediu nesta mesma série
  (111px de camada contra 75 de viewport, cobrindo os pontos).
- **A geometria saiu de graça.** A camada é ancorada em `--scroll-fade-band-h`
  / `--scroll-fade-foot-h`, que esta casca já publicava desde a rodada das três
  faixas, e a altura é a mesma zona que a rampa dissolve. Medido com a lista
  rolada em 140: **44px nas duas pontas**, `blur(7/14/21px) saturate(1.5)`, e a
  máscara da lista intacta.

A asserção **14** de `scroll-fade.test.ts` tranca as cinco: o borrão entra, a
máscara **não** sai (`data-scroll-fade-mode` proibido no arquivo), a camada é
declarada entre a casca e a lista (irmã, nunca filha do mascarado), o `shell` e
o `relative`. Sabotada duas vezes — tirando o `shell` e ligando o modo material.

**Uma nota de instrumento:** o `CommandDialog` fecha entre chamadas do harness,
então a verificação visual foi feita numa demo inline com o teto forçado a
200px. A instrumentada — alturas, raio, vibrância, máscara — vale para os dois,
porque o nó é o mesmo.

### Rodada 52e — a camada cobria depois da faixa, e a rampa cobria atrás dela

A rodada 52d entregou o material nas duas pontas da paleta e deixou uma costura
que o dono circulou: o conteúdo atrás do campo de busca aparecia **fantasma e
nítido**, com o borrão começando só abaixo dele.

**Medido, com a lista rolada:**

| | posição relativa à casca |
| --- | --- |
| campo de busca | 1 → **49** |
| camada de borrão, antes | **49** → 77 |
| camada de borrão, agora | **1** → 77 |

**A causa é que rampa e camada tinham geometrias opostas para a mesma
variável.** A rampa **soma** a faixa na origem — `--scroll-fade-top-h` é
`band-h + clamp(…)` — e por isso a região atrás do campo já sai dissolvida no
piso. A camada **subtraía**: `top: var(--scroll-fade-band-h)` deslocava a caixa
para depois da faixa. Mesma variável, semânticas opostas, e o preço estava na
tela: a 6% de alfa o texto ainda lê (canal 29 contra 15, ~1,3:1), então o olho
via um fantasma legível colado a um borrão, com uma aresta entre os dois.

Hoje as quatro pontas ancoram em `0` e **somam** a faixa à medida — a mesma
conta da rampa. O comentário do CSS que dizia *"o borrão começa **depois** dela,
como a rampa"* saiu: **a rampa nunca começou depois da faixa.**

**A faixa não é borrada**, e isso foi verificado por hit-testing e não por
leitura de `z-index`: `elementFromPoint` no centro do campo devolve o `input`.
Ele é `relative z-10` e a camada é `absolute` sem `z-index`.

**E é no-op para quem não tem faixa.** `scrollFadeBandsClassName` declara as
duas em `0px`, então `calc(0px + clamp(…))` é a geometria de sempre. Medido no
`ScrollFade`: camada de 44px na mesma posição de antes. `Carousel` idem.

#### O efeito colateral, com os números

`--scroll-fade-blur-e` é `calc(100% / i)` — relativo à caixa da própria camada.
Com a caixa crescendo em `band-h`, a extensão de cada índice cresce junto:

| índice | raio | antes | agora |
| --- | --- | --- | --- |
| 1 | 7px | 44px | 92px |
| 2 | 14px | 22px | 46px |
| 3 | 21px | 15px | **31px** |

O borrão mais forte passa a viver **atrás da faixa**, e a zona da rampa recebe
os dois mais leves — que é o material do iOS lido certo: o pico do desfoque
encostado no cabeçalho, caindo para dentro do conteúdo. Se um dia ficar forte
demais ali, a manopla é prender a extensão à zona
(`calc((100% - var(--scroll-fade-band-h,0px)) / i)`) em vez de à caixa.

#### A asserção passou sozinha, e isso era o defeito dela

A **6** — *"a faixa do borrão não pode divergir da faixa que dissolve"* — era
por substring: exigia que `var(--scroll-fade-band-h, 0px)` **aparecesse**, não
**onde**. Ela passava com a camada deslocada e passava com ela somada; ou seja,
não provava nada. Terceira vez que este projeto registra a mesma lição —
*asserção que casa a forma do texto testa a digitação*.

Hoje ela exige a estrutura, nas quatro pontas dos dois eixos: âncora em `0`,
proibição explícita de ancorar na faixa, e a medida como
`calc(var(--faixa, 0px) + clamp(…))` — com o fallback `, 0px`, que é o que
mantém o no-op. Sabotada de três jeitos (âncora de volta, soma numa ponta só,
fallback removido), e os três reprovam.

### Rodada 53 — o vidro chega às três de borda, e a receita sai para `lib/`

Pedido: dar às superfícies de borda o material que o `Dialog` ganhou na 51c.
**E o argumento que eu tinha dado contra a gaveta estava errado** — eu disse que
sobraria pouca coisa para borrar porque ela ocupa quase a tela. O borrão não vê
o que sobra **à volta** dela; vê a página que está **atrás**, e essa está
inteira ali.

Medido, com o véu já em 40% (placa a 60% no escuro, 85% no claro):

| atrás da placa | escuro | claro a 85% |
| --- | --- | --- |
| página | 3 | 24 |
| muted | 9 | 28 |
| botão `primary` | **30** | 56 |

É ~2× o que o `Dialog` consegue nos mesmos fundos (0 · 2 · 2 · 15), porque a
placa aqui é `--background` — mais escura que o fundo velado, então o composto
anda na direção do conteúdo em vez de empatar.

**A receita saiu para [`lib/modal-classes`](src/lib/modal-classes.ts).** Somando
as três, ela ficaria escrita em quatro arquivos — a trajetória que levou a
superfície flutuante a cinco cópias antes da 51. As cinco peças modais vestem
`modalSurfaceClassName`, e para o `Dialog` isso é **extração**: o computado sai
byte a byte igual.

#### A alça da gaveta reprovava, e o defeito era do método antigo

`!bg-muted-foreground/70` é tinta com alfa, então ela se compõe sobre o fundo da
gaveta — e os **3,06 (claro) / 4,24 (escuro)** que a justificavam foram medidos
contra `--background` **opaco**. Com a placa de vidro:

| | placa opaca | placa de vidro |
| --- | --- | --- |
| escuro | 4,24 | 4,22 |
| **claro** | 3,06 | **2,85 — reprova** |

A folga sempre foi de 0,06 sobre o piso de 3:1, e o vidro a consumiu. Varridos
os degraus, **75% é o primeiro que passa: 3,12 e 4,73**. O `resizable` fica em
70 e está certo — a pega dele vive entre dois painéis **opacos**. A régua que
sobra: **alfa medido contra um fundo não sobrevive à troca do fundo.**

#### O arrasto foi medido, e não custou

A gaveta é a única das três que se arrasta, e um `backdrop-filter` sobre 85dvh
sendo transformado a cada quadro era o risco declarado. Dirigindo o `transform`
num laço de `requestAnimationFrame` (evento sintético não dirige o vaul), com a
gaveta forçada a **848px (85dvh)**:

| | mediana | p95 | quadros > 16,7ms |
| --- | --- | --- | --- |
| com `backdrop-filter` | **13,3ms** | 13,9 | 0 |
| sem | **13,3ms** | 13,9 | 0 |

Idênticos. **A ressalva fica dita: isto é a máquina de desenvolvimento, não um
aparelho.** O que a medição descarta é um custo grosseiro; ela não prova o
telefone.

#### Os fades internos viraram o material do iOS, e a camada virou peça

`DialogBody` e `MobileSheetFormBody` ganharam o borrão das duas pontas, com a
rampa **mantida** — mesma decisão da paleta: sem a máscara o conteúdo passaria
nítido pela borda. Os dois eram um elemento só, e passaram a ser casca
`relative` + rolável, que é a forma do `ScrollFade`; o `className` de quem chama
continua indo para o rolável, porque as chamadas passam ritmo de conteúdo e não
layout.

Com isso o bloco de JSX das camadas estaria em **três** lugares, e virou
`ScrollFadeBlurLayers`, exportado de `scroll-fade.tsx`. Ela nasce `material`,
que é o raio e a vibrância do iOS, e carrega no doc as três exigências
mecânicas: irmã do rolável, casca `relative`, e `shell: true` no hook.

#### O que ficou de fora, com o motivo

**Oito telas pintam uma tira opaca dentro da folha** — `border-t border-border
bg-background` em 14 sítios, e os gêmeos `dialogFooterClass` já estão hoje
opacos sobre a placa translúcida do `Dialog`. É o defeito dos `ScrollButton` do
`Select`, na escala do app.

**Tirar a tinta agora seria pior**: esses arquivos escrevem o corpo rolável à
mão e **não têm fade** — verificado, zero `DialogBody` / `scrollFade` neles —,
então o conteúdo correria por baixo dos botões sem nada que o escondesse. O
conserto é a migração que o backlog já nomeia (os 32 corpos à mão viram
`DialogBody`), e ela agora compra o material do iOS de brinde. Fica anotado
abaixo.

**E o `bg-clip-padding` do `edge-panel` fica sob suspeita.** Ele é herança do
shadcn, sem decisão registrada; com placa opaca era inerte, e com placa
translúcida ele recorta o fundo no *padding box* e pode reabrir a fresta de 1px
que o catálogo descreve. Não foi medido nesta rodada.

### Rodada 59 — o material do iOS chega à fileira do `Menubar`

Metade do pedido já estava feita e a outra metade nunca esteve. Medido na página
do catálogo: o `MenubarContent` veste `menuSurfaceClassName` e sai com
`blur(24px) saturate(1.5)` sobre `oklab(0.205 0 0 / 0.6)` desde a rodada 51; a
**fileira** saía com `backdrop-filter: none` nas oito barras da página, com a
tinta escrita à mão no `cva`. O painel era vidro e a barra que o abre era chapa.

**A receita não é nova — ela estava escrita à mão no cabeçalho do catálogo.**
`bg-background/95 glass-surface supports-backdrop-filter:bg-background/60
reduced-transparency:bg-background` saiu para
[`lib/bar-classes`](src/lib/bar-classes.ts), e o `ds-shell` passou a vesti-la.
É extração e não mudança, e isso foi provado em vez de suposto: o `className`
do `<header>` sai **byte a byte igual** (`h.className === a string de antes`,
verificado no navegador), com o mesmo `blur(24px) saturate(1.5)` e o mesmo
`oklab(0.145 0 0 / 0.6)`.

**Ela é a terceira régua, e diverge das outras duas em três pontos, cada um com
motivo:**

| | flutuante | modal | **barra** |
| --- | --- | --- | --- |
| token | `--popover` | `--background` | `--background` |
| base | 85% | 85% | **95%** |
| abre em | `dark:` a 60% | `dark:` a 40% | **nos dois temas**, a 60% |

`--background` e não `--popover` porque no escuro `--popover` e `--card` são a
mesma cor (`oklch(0.205)`): uma barra `--popover` pousada num cartão sumiria —
quem define uma barra é o contraste contra a superfície em que ela pousa. 95 de
base porque sem `backdrop-filter` os 60% deixariam o conteúdo passar por trás do
rótulo. E sem `dark:` porque uma barra tem conteúdo real por baixo nos dois
temas, ainda que no claro o efeito seja quase nulo (250 sobre 255 dá Δ2).

**Só a `outline`, e as outras duas ficam com o número escrito.** `solid` é
bandeja: medida a 60% no escuro ela cai de rgb **38 para 27** sobre a página —
enfraquece, deixa de ler como bandeja e divergiria da `TabsList solid`, com quem
é idêntica hoje. `plain` mora dentro de um cabeçalho que **já é** o vidro, e uma
segunda placa sobre a primeira empilha borrão sem desenhar nada. Na `outline`,
sobre o cartão, o composto vai de rgb 10 para 15, com o texto em 18,36 e o
secundário em 7,42 — folgado.

**A demonstração é parte do conserto, não enfeite.** `backdrop-filter` sobre cor
chapada não desenha nada, e as oito fileiras da página pousam num `Preview`
liso: ali o material sai idêntico ao opaco, e a mudança seria inverificável. A
seção nova gruda a fileira no topo de um rolável e passa texto por baixo — a
forma do cabeçalho fixo, e a única em que há o que borrar. **O `sticky` é da
demonstração, e não um eixo**: o da `Toolbar` já foi reprovado por contagem
zero, e o `Menubar` tem zero consumidores.

**Zero pixel em produção**, pelo mesmo motivo: o componente só existe no
catálogo. Quem de fato renderiza a receita em tela é o cabeçalho do catálogo — e
ele não mudou, porque a extração é byte a byte.

A asserção **27** de `glass.test.ts` tranca as duas metades: a régua (material,
os dois alfas com o de baixo menor, o guarda, o token certo, e **sem** `dark:` —
é o que a separa da 23) e a fileira (a `outline` veste, `barSurfaceClassName`
aparece **uma vez só** no `cva`, `solid` continua `bg-muted`, `plain` continua
transparente, e o cabeçalho não volta a escrever a cópia). Dez sabotagens, dez
reprovações.

Uma correção de deriva veio junto: este arquivo dizia que o eixo do `Menubar`
era `outline | ghost | solid`. O código diz `plain` desde a rodada que unificou
as três palavras para "não desenha nada", e o bullet nunca foi corrigido.

### Rodada 60 — o quarto chrome morre, e a área segura volta a ser da superfície

O pedido foi apagar o `MobileSheetFormChrome`. Ele **não** estava sem uso: 26
telas de produto o importavam. Posto o número, a direção veio em três
respostas — *"migrar quem usa para drawer"*, *"folha no desktop e gaveta no
telefone, e isso é regra de todo o app"*, *"o que for dialog mantém dialog por
enquanto"* —, e juntas elas desenharam uma rodada menor do que parecia.

**A regra já estava implementada, e é o `Sheet`.** Medido em `sheet.tsx`: ele
monta `DrawerPrimitive.Root` do `vaul` abaixo de 768px e o painel de borda
acima, propagando a escolha por contexto. As telas que escrevem `<Sheet>` **já
renderizavam a gaveta no telefone** — não havia o que migrar na camada de
superfície, e nenhuma virou `<Drawer>`. O trabalho real era o do pedido
original: matar o quarto chrome.

**Três medições mudaram o desenho.** `MobileSheetFormBody` tinha **zero**
consumidores de produto (as 26 telas escrevem o corpo à mão, 38 ocorrências);
`FormActions variant="sticky"` também; e `mobileFormSheetContentClassName` era
quase todo inerte — `w-full`, `rounded-t-2xl`, `flex flex-col` e `gap-0` o
`SheetContent` já dava, e `px-0 pt-0` não anulava nada. O que sobrava de real
eram **duas** coisas: `overflow-hidden` e a **área segura**.

Essa era o nó. O `DrawerContent` carregava a área segura e o ramo gaveta do
`SheetContent` **não** — era por isso que a classe existia, e por isso 19
folhas a tinham e 7 não, com o botão de salvar sob a barra de gestos do iPhone
nessas 7. As duas foram para a superfície, com os 24px preservados:
`pb-(--sheet-drawer-safe)` e a fórmula do `env()` na variável.

**A cromagem passou a ser uma só.** `MobileSheetFormStickyHeader` virou
`DialogHeader` (+ `DialogHeaderRow` quando há adorno), o corpo virou
`DialogBody`, e `mobileSheetChromeBelowHeaderClassName` — que era a string
`"mb-3"` com nome de sistema — virou o literal onde ele de fato era usado, uma
margem num divisor. É a regra que este arquivo já escrevia ("a cromagem da
folha vem do `Dialog`"), e o chrome era o quarto, anterior a ela.

**O × ganhou lugar em vez de peça.** `DialogCloseButton` passou a ter
`placement`: `floating` (o padrão, o canto da superfície) e `inline` (dentro do
cabeçalho). Ele absorveu o `MobileSheetFormHeaderCloseButton` (5 chamadas) e as
4 que montavam `Close` + `Button` + ícone à mão — inclusive uma que renderizava
um glifo do conjunto 20 em 16px, que o auditor acusava.

**Os deltas de métrica, ditos:** a cromagem do `Dialog` não tem a mesma medida
do chrome — **+8px acima do título** (`pt-4` contra `pt-2`), **−8px abaixo do
cabeçalho** (`pb-4` contra `pb-3` + `mb-3`) e **−4px de recuo lateral acima de
640px** (o `sm:px-5` do chrome não existe no `--dialog-px`). É o preço de a
folha usar o cabeçalho do sistema, e é ajustável numa linha, porque
`--dialog-px` é variável.

**Verificação, e o seu limite.** `tsc` limpo, 441 testes, auditor sem achado
novo, catálogo de 90 para **89** páginas. No navegador, o espécime da página do
`Form`: casco com `padding-bottom: 24px` e `overflow: hidden`, cabeçalho em
16/16/16, o × com `position: static` e `margin-right: -4px`, corpo dissolvendo
nas duas pontas. **Nenhuma das 26 telas de produto foi vista logada** — o que
prova a migração é o compilador, a suíte e esse espécime, e está dito.

O que ficou de fora, com o número: os **38** corpos roláveis à mão não viraram
`DialogBody` (eles não passavam pelo chrome, e trocá-los acrescentaria a
dissolução em 19 telas que hoje não a têm), o `FormActions variant="sticky"`
segue sem consumidor, e as 16 telas que mostram `Dialog` no desktop ficaram
como estão, por decisão explícita.

### Rodada 61 — o bico do `NavigationMenu` sai, e ele estava certo pelos números

O pedido foi remover a "perna" do dropdown: o `indicator="arrow"`, um `<span>`
de 8px rotacionado 45° na calha entre a fileira e o painel, ligado **sozinho**
sempre que havia viewport.

**Ele não caiu por contraste, e é isso que torna a decisão registrável.** A
rodada 32 mediu e acertou: `bg-popover` com o mesmo `ring-foreground/10` do
painel dá **1,00 contra ele**, que é o valor exato de uma ponta de balão, e o
recorte de 2px a mais que a calha existe para o `ring` do painel não desenhar um
fio atravessando a base do bico. Os números continuam certos. O que a rodada 32
não perguntou é se a peça se paga: **1,10 contra a página** é um objeto que
ocupa a calha e não diz nada que a posição do painel já não diga — e quem liga o
painel ao gatilho é a âncora (`align="trigger"`), não um desenho. Vista na tela,
foi reprovada.

Custo zero de migração: o componente tem **zero consumidores no app**, e o
`mt-2` da folga é do viewport, não do bico. Medido depois, o painel continua a
**8px** exatos da fileira.

**A derivação saiu junto, e não por arrumação.**
`defaultNavigationMenuIndicator(viewport)` existia para escolher entre `arrow` e
`none`; sem o `arrow` ela devolve `none` nos dois ramos, ou seja uma função que
escolhe entre dois valores, com um valor. É a **constante disfarçada** que a
rodada 29b já enterrou em `defaultControlVariant`. O padrão passou a ser `none`
cravado, e `indicator` ficou `"none" | "underline"` — quem quer sinal alto de
qual gatilho está aberto usa o traço, que dá **6,78:1** contra a página.

**O `group/navigation-menu-indicator` foi embora com ele**: o único leitor
daquele `group` era o `<span>` do bico, e um `group` sem leitor é a família
"sobreviveu à remoção" que esta base já pagou cinco vezes.

**O teste é o `tsc`, e ele já existe.** Com `arrow` fora do tipo, qualquer sobra
deixa de compilar — foi assim que a linha 271 do catálogo apareceu. Não entrou
`navigation-menu-ladder.test.ts`: a ausência dele é decisão registrada da rodada
32, e uma asserção que varresse a string `arrow` no fonte testaria a digitação, e
não o comportamento.

#### O que esta rodada tornou invisível, e por isso está escrito no componente

O bico era o **sinal visual mais alto** de que `align="trigger"` funcionava. Foi
um marcador desalinhado que denunciou o defeito da 32b — o `relative` no item
zerando o `offsetLeft` de todo gatilho, com o primeiro acertando por acidente
porque ali zero é o valor certo. Sem ele, esse defeito voltaria calado.

Por isso a verificação ficou escrita no doc-comment do `align`, e foi feita nas
**duas** posições:

| gatilho | `--navigation-menu-anchor-cx` | centro do gatilho | centro do painel |
| --- | --- | --- | --- |
| Finanças | 54,14 | 54,14 | 54,14 |
| Análise | **152,84** | **152,84** | 152,83 |

Desalinho **−0,01px** no segundo, que é o único que prova alguma coisa. *Uma
peça que se move só se verifica em duas posições.*

E o `underline` continua viajando: com Finanças aberto ele mede 101,7 contra um
gatilho de 102,3; com Análise, **91,0 contra 91,1**, deslocado para 509,5 contra
509,8. Ele acompanha e redimensiona.

#### Duas lições de instrumento, e as duas já estavam escritas aqui

**O ponteiro não persiste entre chamadas do harness** — a rodada 34 registrou
isso, e eu andei nela de novo: medir o marcador numa chamada separada da que
move o cursor devolveu `aberto: null`, e por um momento pareceu que o `underline`
não montava. Hover e medição têm de ir no mesmo lote.

**E coordenada de painel não é pixel de CSS.** O quadro era 800×553 contra um
viewport de 1443 — a armadilha da rodada 32. Três hovers por `ref` caíram todos
no mesmo menu errado antes de a escala aparecer; o que resolveu foi rolar o alvo
para o centro, tirar uma captura e usar as coordenadas **dela**.

### Rodada 62 — o painel abria com a curva do navegador, e a troca era um whoosh

O pedido foi uma animação melhor para os dropdowns do `NavigationMenu` — ao
aparecer e ao trocar de um gatilho para outro. Medido no catálogo com o menu
aberto, antes de mexer:

| | antes |
| --- | --- |
| abrir | `animation: enter 0.1s ease` + `zoom-95` |
| trocar | o conteúdo novo nascia a **208px** (`slide-in-from-right-52`) e atravessava em 100ms |
| morph | `transition: all 0.1s ease` |

**A curva da casa nunca chegava a esta superfície.** O `animate-in` do
tw-animate-css é `enter var(--tw-duration, .15s) var(--tw-ease, ease)`, e quem
escreve `--tw-ease` é a classe `ease-*` do Tailwind — o viewport não tinha
nenhuma, e `--tw-ease` estava **vazio**. Medido no chevron do mesmo componente,
que tem `ease-(--ease-out)`: `cubic-bezier(0.16, 1, 0.3, 1)`. Dois nós do mesmo
arquivo, um com a curva do projeto e outro com a do navegador.

**E o morph já existia, escondido num defeito.** O viewport tinha
`duration-(--duration-instant)` sem nenhum `transition-*`, e um `duration-*`
sozinho deixa `transition-property: all` — largura e altura transicionavam, a
100ms, com `ease`. Tremor, não trajeto. É uma armadilha geral: **`duration-*`
sem `transition-*` transiciona tudo a essa duração**, calado.

#### O que mudou, e a forma que não mudou

A decisão foi delegada ("a mais bonita e que combina com o design system"), e a
resposta veio da contagem: a **forma** da abertura é a de toda superfície
ancorada da casa — fade, 8px de subida e `zoom-95` —, e um desdobrar (a altura
crescendo da fileira) seria o único mecanismo do tipo no app, com `@keyframes`
em `globals.css`. A forma ficou; mudaram o tempo e a curva:

- **abrir**: `--duration-base` com `ease-(--ease-out)` — e o `ease-*` é o que
  faz `--tw-ease` chegar ao `animate-in`;
- **fechar**: só fade, em `--duration-instant`. Saída não se move, e um menu
  que fecha ao tirar o cursor não pode demorar 200ms;
- **morph**: `transition-[width,height]` explícito, base, curva da casa. O
  Radix já escreve a caixa do conteúdo ativo nas duas variáveis; a `transition`
  é o que transforma o salto em trajeto;
- **trocar**: o drift caiu de 208 para **16px** (`-4`) e passou a seguir a
  `orientation` — num menu vertical os painéis trocam de cima para baixo, e o
  deslize era horizontal.

**A primeira abertura não cresce do zero, e isso é mecanismo e não sorte.** As
variáveis do Radix nascem indefinidas (`size: null`), a altura computa `auto`,
e `auto → px` não interpola. Na troca é `px → px`, e aí interpola.

#### Medido depois

| | resultado |
| --- | --- |
| abrir | `enter 0.2s cubic-bezier(0.16, 1, 0.3, 1)`; `transition: width, height 0.2s` na mesma curva; `--tw-ease` preenchido |
| trocar (Finanças → Tudo) | conteúdo novo nasce em **x16**; viewport 224 → 450 → 542 → 577 → 592 → **600** em 184ms; o que sai vai a −16 e some aos ~200ms |
| trocar (Tudo → Finanças) | 600×296 → 464 → 373 → … → 224×96 — o morph nos dois sentidos |
| vertical | conteúdo novo nasce em **y16**, o velho vai a y−13 — eixo certo |
| fechar (Escape) | `exit 0.1s`, `--tw-exit-scale: 1`, translate 0; opacidade 0,02 aos 85ms; desmontado aos 205ms |

**A demo "Padrão" tinha os dois painéis em 224×96** — um morph entre iguais não
tem o que mostrar. Entrou "A troca é um morph": Finanças (uma coluna, 224) contra
Tudo (`columns={2}` com cartões, 600×296).

#### Duas lições de instrumento

**Ponteiro parado não gera `pointerenter`.** Depois de um `navigate`, o hover na
mesma coordenada em que o cursor já estava não abriu nada — o Radix precisa de
movimento. Afastar antes resolve. É a parente da lição "o ponteiro não persiste
entre chamadas" da rodada 34.

**E afastar o cursor dentro de um lote não fecha o menu** — nem antes nem depois
da mudança —, enquanto entre chamadas ele fecha sozinho. É o ponteiro do painel,
não o componente; fechar para medir a saída é `Escape`, que o `DismissableLayer`
trata na hora.

### Rodada 63 — a mesma animação no `Popover`, e a saída dele nunca tinha rodado

O pedido foi levar ao `Popover` a animação da rodada 62. Duas das quatro peças
de lá não têm equivalente aqui — não há viewport compartilhado, então não há
morph, e não há troca de painel —, e o que se transportava era a entrada e a
saída. **A saída não existia.**

#### O que a medição achou

A entrada tinha o defeito idêntico: `animation: enter 0.1s ease`, com
`--tw-ease` **vazio**, e `transition-property: all` com `0.1s` — o mesmo
`transition: all` implícito que um `duration-*` sem `transition-*` deixa.

A saída era pior que curta: **ela não rodava**. Um `MutationObserver` lendo
`getComputedStyle` de forma síncrona no instante do `data-state="closed"`
devolveu **vazio** em `animationName`, `animationDuration` e `opacity` — e
estilo computado vazio é o que se obtém de um nó **já destacado do documento**.
Nenhum `animationstart` de `exit` disparava. As três classes `data-closed:*`
eram código morto desde sempre.

#### A causa, isolada por comparação

O `Portal` do Radix é `<Presence>` em volta de um `PortalPrimitive asChild`, e
o `Presence` decide se espera a animação lendo `getComputedStyle` do **ref do
filho** (`getAnimationName(styles)`, com `styles?.animationName || "none"`).

Havia um `PopoverLabelContext.Provider` **entre o Portal e o Content**. O `Slot`
do `asChild` tenta pôr o ref num context provider — que não é elemento —, o ref
se perde, a leitura devolve `"none"`, e o Radix manda `UNMOUNT` no mesmo commit
em que escreve `data-state="closed"`.

**Não é da portalização, e foi o `DropdownMenu` que provou.** Ele é portalizado
igual e tem `Portal → Content` direto: medido, `state=closed name=exit @17ms`,
`animationstart exit @18ms`, nó ainda no DOM. Um par onde só um lado falha é o
que transforma suspeita em causa.

Uma previsão testável fechou o caso: se o `Slot` estava largando as props no
Provider, então o `data-slot="popover-portal"` do arquivo também não existia.
Medido com um popover aberto: `[data-slot=popover-portal]` **não casava nada**.
Ele saiu junto.

#### O conserto, e o que ele custou

O Provider foi para **fora** do Portal — o contexto continua alcançando o título
e a descrição, porque ele está acima na árvore do React e contexto atravessa
portal. Verificado: `aria-labelledby` e `aria-describedby` apontam para
elementos que existem, com o nome acessível certo.

| | antes | depois |
| --- | --- | --- |
| entrada | `enter 0.1s ease` | `enter 0.2s cubic-bezier(0.16, 1, 0.3, 1)` |
| `--tw-ease` | **vazio** | preenchido |
| transição | `all 0.1s` | `0s` |
| saída | não rodava | `animationstart exit @21ms`, `animationend @116ms`, desmonta limpo |

**`animation-duration-*` e não `duration-*`.** O segundo escreve
`transition-duration` junto, e numa superfície que só anima isso é o
`transition: all` de novo. A rodada 62 resolveu o mesmo problema no
`NavigationMenu` declarando `transition-[width,height]`, porque lá havia um
morph a declarar; aqui não há transição nenhuma a querer, e o utilitário que
mexe só na animação é o certo. Medido: `--tw-animation-duration: 200ms` e
`transition-duration: 0s`.

**Isto não é zero-pixel.** `PopoverContent` está em **7 telas de produção**
(`transactions-filters-panel`, `transaction-form-fields`,
`transactions-active-filters-chips`, `categories-toolbar`,
`subscription-form-pickers`, `dashboard-payments-calendar`,
`mobile-account-menu`) e é vestido por `Combobox`, `DatePicker` e
`FormPickerPopover`. Onde o popover sumia, ele agora esmaece em 100ms.
Verificado no `Combobox`, o consumidor mais complexo: `enter 0.2s` na curva da
casa, 8 itens, 224px, e a saída rodando.

**O `HoverCard` ficou de fora, e por dois motivos.** Ele tem `Portal → Content`
direto, então a saída dele sempre funcionou; e ele abre **por cursor**, que é
exatamente o caso que a nota do `--duration-instant` em `globals.css` protege.
`DropdownMenu`, `Select`, `Menubar`, `ContextMenu` e `Tooltip` seguem com
`--tw-ease` vazio — a curva da casa não chega a nenhum deles, e é a mesma
correção de uma linha. Fica no backlog.

#### Duas lições de instrumento, e as duas são erros meus

**Medir uma saída com `sleep` entre o `Escape` e a leitura não mede nada.** A
latência do harness entre as duas ações já passa dos 100ms da animação, e a
primeira leitura disse "desmontou aos 20ms" sobre algo que eu não tinha como
observar. O que serve é **instalar o ouvinte antes** e ler o registro depois —
e foi o registro que mostrou os três eventos na ordem certa.

**E a sonda procurou o `data-slot` do componente de baixo.** O `ComboboxContent`
carimba `combobox-content` por cima do `popover-content`, e a busca voltou vazia
com o componente funcionando. É literalmente a lição que a rodada 35 registrou
com estas palavras — *uma sonda que procura o slot do componente de baixo mede a
chamada, não o resultado* —, e eu andei nela um arquivo depois de escrevê-la.

### Rodada 64 — o `EdgePanel` dissolve no `Sheet`, e a inversão fica escrita

Pedido: juntar os dois, e a navegação também virar gaveta no telefone. **Isto
reverte uma decisão registrada**, e a ressalva foi apresentada antes: o
`EdgePanel` nasceu para consertar exatamente isto — a `Sidebar` pegava a folha
emprestada e abria como gaveta de baixo, com alça de arraste e canto
arredondado no topo, para listar seis links. A decisão nova é que **a superfície
do telefone é uma só**, e ela vale para navegação também.

**O que sustentava a separação deixou de existir.** O `EdgePanel` tinha três
consumidores, e num deles ele já *era* o `Sheet`: o ramo desktop do
`SheetContent` renderizava `EdgePanelContent`, e o `SheetContent` já expunha os
dois eixos por `VariantProps<typeof edgePanelContentVariants>`. Os outros dois
— a `Sidebar` e a navegação do catálogo — são justamente os que passaram a ser
gaveta. Sem ninguém que precisasse do painel em toda largura, o arquivo era uma
segunda API para a mesma moldura.

O `cva` mudou de casa e de nome (`sheetContentVariants`, com `--edge-panel-gap*`
→ `--sheet-gap*`) sem mudar por dentro: os dois eixos, as quatro
`compoundVariants` do gume e a área segura das verticais vieram inteiros. O véu
virou `SHEET_OVERLAY_CLASS`, e o `Drawer` o importa daqui. **Sem alias**: três
consumidores, todos migrados na mesma mudança, e alias seria a porta dos fundos
que o `tsc` existe para fechar.

#### O `p-0` que teria matado a área segura

A chamada da `Sidebar` passava `p-0` ao painel. Ali era **no-op** — a base do
`cva` não declara recuo nenhum. Na gaveta ele deixa de ser: o `twMerge` o faria
derrubar o `pb-(--sheet-drawer-safe)`, e o rodapé de conta cairia sob o
indicador de home do iPhone. É a mesma família do `mobileFormSheetContentClassName`
da rodada 60 — uma classe que não fazia nada num ramo e fazia estrago no outro.
Medido depois, na moldura de 375px: rodapé terminando a **24px** da base da
gaveta.

Saiu junto o `SIDEBAR_WIDTH_MOBILE` (18rem), que ficou órfão: no telefone a
gaveta é a largura da tela.

**E eu introduzi o mesmo defeito no catálogo, com outra classe.** A navegação
dele passava `w-72`, que no painel é a largura certa e na gaveta briga com o
`inset-x-0`: com `left`, `right` e `width` declarados, a largura vence e a
gaveta sairia com 288px ancorada à esquerda. Virou `md:w-72` — o mesmo 768 de
`useIsMobile`, então a largura só existe onde existe o painel.

#### Medido depois

| | resultado |
| --- | --- |
| `flush left` (desktop) | `l0 t0 w384`, raio 0, **só** `border-right` — o gume de dentro |
| `floating bottom` | 8px nos quatro lados, raio 14px, as quatro bordas, `blur(24px) saturate(1.5)` |
| `Sidebar` a 375px | gaveta do `vaul` **dentro do iframe**, `data-surface="drawer"`, alça com `data-vaul-handle-hitarea`, raio `18px 18px 0 0`, `padding-bottom` 24px, nome acessível **"Navegação"** |
| catálogo a 375px | gaveta de largura 375, 89 links rolando no `div` de dentro, × a 13px do topo |
| catálogo a 800px | painel `l0 t0 w288 h812`, `border-right`, raio 0, **sem alça** |

A cromagem do `Dialog` atravessa a gaveta como sempre atravessou — o
`DialogHeader sr-only` da `Sidebar` continua nomeando o painel, porque `vaul` e
Radix são a mesma primitiva.

#### O que o teste ganhou de graça

`edge-panel.test.ts` virou `sheet.test.ts`. A asserção **8** — *o `cva` é único
no arquivo, e o `ds:catalog` lê este* — era verdadeira num arquivo que só tinha
aquele `cva`; agora ela vale sobre o `sheet.tsx`, e com isso o catálogo **passou
a reportar os eixos da folha**: `side · variant` onde antes saía `—`. A asserção
**7** foi reescrita: já não há delegação a verificar, e o que ela tranca é que
`side` e `variant` são destruturados, não chegam ao ramo gaveta, e chegam ao
`sheetContentVariants({ side, variant })` do ramo painel.

Sai a linha `edge-panel` da lista de portais em `ds-frame.test.ts` e da lista de
superfícies modais em `glass.test.ts` (que passa de quatro nomes para três).

#### Uma lição de instrumento, e é um erro meu

**A guarda que eu escrevi contra sobras reprovou o registro que eu queria
manter.** O script assertava que a string `EdgePanel` não sobrasse no
`sheet.tsx` — e o doc-comment novo diz, de propósito, *"Ele nasceu `EdgePanel`"*.
A guarda passou a ignorar comentário, como os testes da casa já fazem com
`semComentarios`. Numa base que registra inversão em vez de apagar o passado,
uma varredura de sobra **tem** que distinguir código de prosa.

### Rodada 65 — o `side` não reordenava, e a placa flutuante passou a falar iOS

Dois pedidos: o `variant="floating"` da `Sidebar` parecer mais com os efeitos
iOS que o app já usa, e consertar o `side`, que "quebra o layout". Os dois foram
medidos no seletor de três eixos do catálogo, a 926px.

#### O bug é do `right`, e o `left` só parecia certo porque zero é o valor dele

Com `side="right"` o trilho `fixed` ia para `l670 r926` — e a folga que reserva
o lugar dele **ficava onde estava**, em `l0 r256`. Resultado: **256px vazios** à
esquerda e a placa cobrindo **240px do conteúdo** à direita (255 em `sidebar`).
Nada no wrapper reordenava pelo eixo. O `inset` agravava: a margem que o
conteúdo perde do lado da barra existia **só para a esquerda**, e com a barra à
direita ele saía `m:0px/8px`.

O conserto é `data-[side=right]:order-last` na raiz. **A ordem no DOM não muda**,
e é ela que mantém válidos os `peer-*` do `SidebarInset`; quem inverte é a ordem
visual do flex. As margens de `inset` viraram par espelhado. Saiu junto o
`group-data-[side=right]:rotate-180` da folga — herança do shadcn sobre uma
`div` vazia e transparente, inerte desde sempre.

Medido depois, nas três variantes: sobreposição **zero**, e o cabeçalho
começando em `x=0` com a barra à direita.

#### O vidro fica pintado, e o que mudou foi tudo em volta

A rodada 36 mediu que o `floating` **reserva a própria calha no fluxo** — nada
passa por trás dele, borrar cor chapada não desenha nada, e a asserção 15 tranca
`backdrop-filter` fora do arquivo. Isso não mudou, e foi reafirmado com o motivo
na mesa. O que separava a placa da língua iOS do app era o resto:

| | antes | depois |
| --- | --- | --- |
| curva do recolher | `ease-linear` em **quatro** nós | `--ease-emphasized`, 300ms, nos quatro |
| item ativo | fundo que acende e apaga | pílula que **viaja** |
| raio | 14 (`rounded-xl`) | **18** (`rounded-2xl`), o das placas modais |
| elevação | `shadow-sm` | `shadow-lg` — `oklch(0 0 0 / 0.6)` no escuro, `/ 0.1` no claro |

Os quatro nós da curva são a folga, o trilho, o rótulo de grupo e **a altura do
cabeçalho** (`app-header.tsx`, a única linha tocada fora de `ui/`): ele encolhe
*porque* a barra recolheu, e duas curvas no mesmo gesto leem como duas animações
que por acaso começaram juntas.

**O reflexo da placa virou repouso.** O `--glass-sheen` é a camada mais de cima
do vidro e nunca tinha tido produtor; a primeira versão o acendia **sob o
cursor**, e o defeito era de alvo, não de medida: a superfície é do tamanho da
coluna, então apontar para **um item** acendia a barra **inteira**. A decisão do
dono foi levar o valor do hover ao repouso — a placa fica permanentemente no tom
que só tinha ao ser apontada, e não reage a nada. Estático, então o `@property`
que eu tinha registrado para o interpolar saiu: sem transição, é peso morto. Só
no escuro, pelo teto que a rodada 40 mediu no claro. **Quem responde ao cursor é
o item**, e a escada de três alfas dele ficou intacta — depois de eu tê-la
mexido duas vezes por ler o pedido como se fosse sobre os itens, e não sobre a
placa.

O item ativo **não** ganhou um segundo sinal. O ícone chegou a tingir de
`--primary-accent` — medido em **7,11:1** no escuro e **7,46:1** no claro contra
a placa, números que passam com folga — e foi reprovado na tela: numa coluna de
navegação o verde puxa o olho para um item que a pílula já marcou, e o mesmo
verde significa "entrou dinheiro" no resto do app. Quem marca o ativo é a pílula
mais o `font-medium`. **Contraste diz se aparece; não diz se convence** — é a
régua que a rodada 37 escreveu, e ela decidiu de novo aqui.

#### A pílula, e a armadilha do `offsetParent`

É o mecanismo do marcador do `Tabs`: `ResizeObserver` na trilha e nos botões,
`MutationObserver` em `data-active`, zero laço por quadro, leitura em coordenada
de **conteúdo** — o `SidebarContent` rola, e uma caixa de viewport faria a pílula
escorregar a cada pixel.

**Mas a leitura não pode ser um `offsetTop` só.** O `<li>` do menu é `relative`,
então ele — e não a trilha — é o `offsetParent` do botão: lido direto,
`offsetLeft` valeria zero para todos, e o primeiro item acertaria por acidente.
É exatamente o defeito da rodada 32b, e a razão de `caixaRelativa` somar a
cadeia inteira e devolver `null` quando ela não chega ao alvo. Verificado no
**quarto** item: desalinho zero nos quatro eixos.

#### Três defeitos que eu mesmo introduzi, e como cada um apareceu

**A variante era lida uma vez, na montagem.** O efeito tinha deps `[]` e um
retorno cedo se `data-variant !== "floating"`; indo de `sidebar` para `floating`
no seletor, o marcador ficava desligado para sempre. E o `MutationObserver`
vigiava a **subárvore da trilha**, enquanto `data-variant` mora num **ancestral**
— ele nunca a veria mudar. Hoje a variante é lida a cada medição, e a raiz tem
observador próprio.

**Ceder o fundo é apagá-lo, não deixar de declará-lo.** Ao mover o alfa do ativo
para o marcador, o botão caiu na classe **base** do `cva` —
`data-active:bg-sidebar-accent`, o token **opaco**, que não é escopado por
variante. Medido: `oklch(0.269 0 0)` pintando um retângulo por baixo da pílula.
`twMerge` não resolve, porque as duas moram sob variantes diferentes e as duas
sobrevivem à mesclagem.

**O `-z-10` do marcador teria feito o oposto do que parece.** `relative` com
`z-index: auto` **não** cria contexto de empilhamento, então o marcador escaparia
para trás da própria placa. Quem o põe atrás dos itens é a ordem no documento:
ele é o primeiro filho, e todos são posicionados com `z-index: auto`.

#### Duas lições de instrumento, e as duas são erros meus

**Li a transição e chamei de atraso.** O marcador parecia estar sempre um passo
atrás — item 1 mostrando a posição do item 0. As variáveis na trilha estavam
**sempre certas**; o que eu media era o `translate` a meio caminho dos 200ms.
Com a troca numa chamada do harness e a leitura na seguinte, em repouso:
desalinho zero. *Valor em transição não é valor final* — é a parente da lição do
press da rodada 29b.

**E truncar um valor composto esconde a parte que interessa.** Cortei
`boxShadow` em 60 caracteres e reportei que a sombra era transparente; as
entradas zeradas são o começo da cadeia do Tailwind, e a camada real era a
última. A rodada 45 registrou isto com estas palavras, e eu andei nela de novo.

Fica anotado que `useIsomorphicLayoutEffect` está agora em **quatro** cópias
(`tabs`, `navigation-menu`, `carousel`, `sidebar`) — o arquivo seguiu o padrão
local do vizinho, e extrair alcançaria três arquivos fora do escopo.

### Rodada 66 — a navegação volta a ser painel no telefone, e só ela

Pedido: no telefone a barra sai como folha lateral esquerda, **sem mexer na
regra** de que toda outra folha vira gaveta.

Isto é uma **meia-volta na rodada 64**, e o argumento dela continua de pé. Ela
dissolveu o `EdgePanel` no `Sheet` dizendo que, *sem um consumidor que
precisasse do painel em toda largura, o componente separado era uma segunda API
para a mesma moldura*. O que mudou não foi o argumento: foi que o consumidor
voltou — e um consumidor pede **uma prop**, não um arquivo. O `EdgePanel` não
volta; o comportamento dele volta como eixo.

Medido antes, na moldura de 375px: a navegação abria `data-surface="drawer"`,
`data-side="bottom"`, `l0 t8 w375 h659`, com `[data-vaul-handle]`.

#### O eixo, e o que ele não faz

`Sheet` ganhou `surface: "auto" | "panel"`, padrão **`auto`** — a regra de hoje,
e o que mantém as ~40 folhas do app inalteradas. `panel` fixa o painel em
qualquer largura. **Não existe forçar a gaveta**: uma superfície que é gaveta em
toda largura já tem nome e arquivo, e é o `Drawer`.

O valor interno do painel se chamava `"sheet"` — circular dentro de um
componente chamado `Sheet`, e impossível de usar como valor de prop. Virou
`"panel"`, no tipo e no `data-surface`. A troca é contida: `useSheetSurface` é
exportado e tem **zero** consumidores fora do arquivo, e o único leitor de
`data-surface` no repositório testa **existência**, não valor
(`ds-shell.tsx:331`). O `tsc` achou a única sobra — um `surface === "sheet"` no
`SheetOverlay`.

#### O × estava escondido, e num painel isso deixa de passar

`[&>button]:hidden` na chamada da `Sidebar` é herança do shadcn, de quando o
`SheetContent` injetava o próprio ×. Desde a rodada 60 ele não injeta, então a
classe só escondia **o nosso** — medido, `display: none`. Na gaveta passava:
fecha-se arrastando ou tocando o véu. **Num painel não há arraste**, e o × passa
a ser a única afordância visível de fechar. Saiu.

Saiu junto o `fillMobileViewport`, que é a altura **da gaveta** — no painel ela
vem do par `top`/`bottom` do `cva`, e passá-lo seria prop inerte. E voltou o
`SIDEBAR_WIDTH_MOBILE` (18rem), que a 64 tinha removido porque "no telefone a
gaveta é a tela".

#### Medido depois

| | resultado |
| --- | --- |
| navegação a 375px | `panel` / `left`, `l0 t0 w288 h667` — altura cheia, **zero** alça, × em `display: flex`, nome "Navegação" |
| **folha comum a 375px** | segue `drawer`: `l0 t8 w375 h659`, alça presente, raio `18px 18px 0 0` |
| desktop a 926px | as três variantes com sobreposição **zero**, `inset · right` em `m:8px/0px` — a rodada 65 não regrediu |

A segunda linha é o guarda do pedido, e é a que prova que a regra global não
mudou.

Duas asserções novas, e as **sete** sabotagens reprovam: o padrão do eixo virando
`panel`, o eixo passando a aceitar `"drawer"`, a derivação deixando de olhar a
largura, a barra voltando a ser gaveta, o painel deixando de seguir o `side`, o
`fillMobileViewport` de volta, e a classe que escondia o ×.

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

- ~~**11 telas escrevem a área segura do rodapé à mão**~~ — **pago na rodada
  60**, do lado que importava: o ramo gaveta do `SheetContent` passou a
  declarar `pb-(--sheet-drawer-safe)`, e a classe que 19 telas importavam do
  chrome de folha para receber o `env()` deixou de existir junto com ele. O que
  fica são as superfícies que **não** são folha e escrevem o próprio recuo —
  `mobile-account-menu`, `mobile-nav-island`, `install-pwa-sheet` e
  `notifications-sheet` —, e um caso solto: `bills-toolbar.tsx`, que reescrevia
  a classe inteira à mão em vez de importá-la.
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
  estava definida em lugar nenhum** *(paga na rodada 35: virou `@utility`)* — nem em `globals.css`, nem em `tw-animate-css`.
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
  tocou a limpeza mecânica pendente das outras. *(Paga na rodada 34: as 31
  chamadas saíram e o componente virou o `DragHandle`.)*

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
- ~~**`Button variant="tertiary"` não tem par `active:`**~~ — **pago na rodada
  29b**, na origem. E a contagem estava errada para menos: medindo as cinco
  variantes que pintam fundo, **quatro** ficavam inertes ao toque, não uma.
  `primary`, `secondary`, `outline` e `destructive` continuam pendentes, e
  agora com mecanismo: a lista vive em
  [`button-touch-response.test.ts`](src/components/ui/button-touch-response.test.ts),
  que **falha se ela crescer**.

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

E o que a rodada do `carousel` deixou (com o que a **29b** já fechou marcado):

- **A seta não viaja mais, e o padrão mudou de aparência.** `tertiary` sem fundo,
  `rounded-lg`, `fade` ligado por padrão. Quem tinha o mapa antigo na cabeça
  procura uma pastilha preenchida e circular; ela não existe mais.
- **Três variantes do `Button` seguem inertes ao toque** — `primary`,
  `secondary`, `outline` e `destructive` — com a lista trancada por teste. É
  conserto de uma linha em cada, e vale para o app inteiro.

- **Os três alvos de dedo por pseudo-elemento da casa medem 42, e dizem 44.**
  `PageHeaderBack` (36), o × da `AnnouncementBar` (24) e os degraus do
  `Breadcrumb` (20) — os três somam o `inset` à caixa de **borda** na conta do
  comentário, quando o bloco que contém um absoluto é a caixa de **padding**, e
  os três controles têm 1px de borda. Medido no `::after` do carrossel antes do
  conserto: `42px`. É uma linha em cada um (subir um degrau de `inset`), e o
  número certo no comentário — mas mexe em três componentes com consumidor, e
  por isso não entrou aqui.
- **O carrossel continua sem tela**, e agora com os candidatos contados:
  `dashboard-kpi-cards.tsx:139` (`grid grid-cols-2 gap-2 lg:grid-cols-4` — quatro
  KPIs que viram 2×2 no telefone) e `credit-cards/page-client.tsx:337`
  (`grid grid-cols-1 gap-3 md:grid-cols-2`). Nos dois o carrossel só se paga
  **abaixo de 768px**; acima, a grade mostra tudo de uma vez e é melhor.
- **Autoplay é dependência nova.** `embla-carousel-autoplay` não está instalado,
  como nenhum outro plugin. Se um dia entrar, entra com pausa no cursor, no foco
  e em `prefers-reduced-motion` — e a pergunta anterior é se um app de finanças
  deve mover conteúdo sozinho.
- **`gap` não aparece no `ds:catalog`.** O script lê o **primeiro** `variants:`
  do fonte, e as classes de calha vivem numa tabela literal fora do `cva` —
  elas vão para o trilho e para o item, não para a raiz. Os outros três eixos
  aparecem. Ou o catálogo passa a ler mais de uma fonte de eixos, ou o eixo
  continua documentado só na `PropsTable`.
- **`slidesInView` e `slideFocus` seguem sem leitor**, e o custo disso é medido:
  o último item da demonstração fica em `x: 1472` com o viewport terminando em
  **1083** — inteiramente fora de vista —, e um botão injetado dentro dele
  **recebe foco**, sem `inert` e sem `aria-hidden`. É o defeito de
  acessibilidade clássico de carrossel: quem navega por `Tab` entra em conteúdo
  que não está na tela. `slidesInView` é exatamente o mecanismo que resolve, com
  `inert` no que saiu. Ficou de fora porque `inert` muda o comportamento de foco
  de toda tela que use a peça, e merece a própria medição — as demonstrações de
  hoje não têm conteúdo focável dentro dos itens, então o defeito não é
  alcançável pelo catálogo.

E o que a rodada do gráfico deixou — as sete telas que não migraram, contadas:

- **4 tooltips escritas à mão**, todas repetindo `min-w-[10rem] rounded-lg
  border-border/80 bg-popover px-3 py-2 text-xs shadow-md`
  (`dashboard-cashflow-chart`, `dashboard-expense-categories`,
  `credit-cards-history-chart`, `credit-card-invoice-category-spend-section`).
  Destino: `ChartTooltipContent format="currency"`.
- **2 telas usam o `<Tooltip>` cru do Recharts**, que renderiza **sem tema
  nenhum** (`dashboard-installments-projection`, `category-detail-trends`).
- **3 legendas à mão**, com `LegendStrip` sendo a mesma peça em 2 arquivos.
  Destino: `ChartLegendContent`, e a de `dashboard-expense-categories` é
  `interactive`.
- **4 `new Intl.NumberFormat(… "BRL")` redeclarados** nos gráficos (10 no resto
  do app) e **4 `tickFormatter` compactos inline**, nenhum chamando
  `currencyCompactBRL`. Destino: `format` no eixo e no tooltip.
- **2 `chartReady` + `ResizeObserver`** duplicados (30 linhas cada), **2 escadas
  de corpo do centro da rosca** e **2 cópias de `alpha(color, pct)`**.
- **Cores fora do sistema**: `#1f6a59` em
  `dashboard-installments-projection.tsx:27` sob o comentário falso *"Bar fill
  cannot use var() in SVG"* — a página `/graficos` agora aponta para o arquivo
  certo, porque o que ela nomeava (`dashboard-cashflow-chart`) já foi
  consertado; dois `oklch()` literais e **sem par no escuro** em
  `credit-card-invoice-analytics-panel.tsx:256`; e cinco `oklch()` crus como
  `FALLBACK_FILLS` em `dashboard-expense-categories.tsx:31`, para o mesmo
  trabalho que o arquivo vizinho faz com `var(--chart-N)`.
- **3 alturas em pixel** (`height={300}` ×2, `240`, `200`) contra o eixo
  `aspect`, e **1 `accessibilityLayer={false}`**.
- **`credit-cards-history-chart` repete a rampa** com `BAR_COLORS[idx % 5]`:
  seis cartões dão duas barras da mesma cor.

E o que a rodada do `NavigationMenu` deixou:

- **Ele continua sem tela**, e o candidato tem nome: a superfície pública
  (landing, preços, institucional) que o produto ainda não tem. As peças estão
  medidas para o dia em que ela existir.
- **Sem teste de escada.** Foi decisão desta rodada, e o que ele trancaria está
  escrito acima. É o único componente com cinco eixos e nenhuma asserção — e a
  32b mostrou o preço: o `relative` do item zerava o `offsetLeft` de todo
  gatilho, e nenhuma asserção olhava para isso. O que pegaria é uma que proíba
  `relative` no item e na fileira, com o motivo escrito.
- **`defaultValue` com `viewport` nasce dentro de um viewport de altura zero** —
  o Radix mede o conteúdo por `ResizeObserver` e a medida não chega à primeira
  pintura. Contornado nas demonstrações com `viewport={false}`; não investigado
  no componente.
- **`NavigationMenuSub` segue sem embrulho** (zero contagem), e o `Menubar`
  continua a única fileira de menus com submenu.
- **A regra H do auditor não alcança `cva()`.** Ela varre `className="…"`, e
  todo `hover:` deste componente mora dentro de um `cva` — foi por isso que o
  arquivo antigo saía "conforme" com `hover:` sem par de toque em duas peças. É
  o mesmo ponto cego que as rodadas 08 e 11 registraram, e continua aberto.
- **`popover.tsx` e `select.tsx` ainda escrevem a superfície à mão.** O
  `menuPanelSurfaceClassName` existe agora; são duas substituições mecânicas, e
  ficaram de fora porque a rodada não abriu aqueles arquivos.

E o que a rodada 40 deixou, ao extrair o vidro:

- **Os dois vidros viraram um, com dois modos** (rodada 47): a `@utility glass`
  ganhou `glass-material`, e a premissa passou a ser eixo em vez de nome. O que
  sobra é adoção — **nenhum consumidor usa o modo**, e o candidato honesto é uma
  superfície com conteúdo rolando por baixo, que o pintado nunca serviu.
- **`app-header.tsx` ainda escreve o material à mão**, em `blur(8px)` sem
  vibrância, sem vestir `glass-surface` e sem o `reduced-transparency:` que o
  cabeçalho do catálogo passou a ter. Depois da rodada 51 ele é a **única**
  superfície de vidro do repositório fora da receita — as outras 11 e a folha do
  telefone já a vestem. **E agora o destino tem nome**: `barSurfaceClassName`,
  em `lib/bar-classes` (rodada 59), que é exatamente a receita que ele tenta
  escrever. Ele ficou de fora por decisão: é `layout/`, tem consumidores reais,
  e o vidro dele só existe rolado — é medição própria.
- **`thin` reprova o contraste de texto sobre conteúdo claro no escuro** (2,73
  contra os 4,5 da norma). É a natureza de um material fino e está documentado,
  mas não há guarda mecânico: uma tela pode pôr texto ali sem nada avisar.
- **O `ColorTile` de vidro ainda tem as quatro camadas apagadas.** A rodada 48
  consertou a causa para peças **redondas**; o ladrilho é `rounded-md`, então ele
  fica com o aro linear (onde os cantos existem e ele está certo) mas continua
  com lâmina e nuvens cobertas pelo tom. O que falta ali é decidir se ele também
  ganha um especular.
- **O `Button` não tem vidro, e não é por falta de tentativa** — três desenhos,
  três reprovações na tela (rodadas 49, 50, 50b), mais a da 45. Os números que
  qualquer nova tentativa herda estão na lápide de `lib/glass-classes.ts`. Se
  voltar, a régua é a mesma das duas peças que ficaram: `Avatar` e `ColorTile`
  não são clicáveis e não carregam texto sobre a superfície — o botão faz as
  duas coisas, e é aí que a margem some.
- **O especular não sobrevive a uma foto.** `AvatarImage` é `h-full w-full
  object-cover` e cobre as camadas de fundo inteiras: num avatar com foto sobra
  só o aro, que é `border-box`. Se o reflexo tiver de valer sobre a foto, ele
  precisa sair do `background` e virar pseudo-elemento.
- **`registered-credit-card-face.tsx` segue fora dos dois.** Oito camadas com
  `mix-blend-mode` e `mask-composite` — as duas técnicas que `glass.test.ts` e
  `scroll-fade-classes.ts` proíbem no resto da casa. É o arquivo que mais
  ganharia com a fusão, e o mais caro de tocar.
- **O `Glass` nasce com o degrau `control` sem consumidor de produto.** O toggle
  de tema foi verificado como vestível (`<Glass asChild>` funciona, o `className`
  é repassado nos dois ramos) e **não** foi migrado — decisão do dono. O
  catálogo o demonstra em espécime.

E o que a rodada 53 deixou, ao dar vidro às superfícies de borda:

- **8 telas pintam uma tira opaca dentro da folha** — `border-t border-border
  bg-background` em 14 sítios (`workspace-delete-dialog`,
  `workspace-appearance-edit-dialog`, `ChangePasswordDialog`,
  `DeleteAccountDialog`, `project-form-dialog`, `edit-profile-dialog`,
  `bill-detail-sheet`, `transactions-toolbar`), mais os gêmeos
  `dialogFooterClass`, que **já estão hoje opacos** sobre a placa translúcida do
  `Dialog`. É o defeito dos `ScrollButton` do `Select` na escala do app.
  **Tirar a tinta sozinha piora**: esses arquivos escrevem o corpo rolável à mão
  e não têm fade — verificado, zero `DialogBody` / `scrollFade` neles —, então o
  conteúdo correria por baixo dos botões. O conserto é a migração dos 32 corpos
  à mão para `DialogBody`, que agora traz a rampa **e** o material do iOS; a
  tinta sai junto, e a regra J deixa de acender ali.
- **O `bg-clip-padding` do `edge-panel.tsx:32` nunca foi decidido.** É herança do
  shadcn (rastreado até o commit de baseline), sem comentário e sem registro.
  Com placa opaca era inerte; com placa translúcida ele recorta o fundo no
  *padding box* e pode reabrir a fresta de 1px que `designsystem/page.tsx`
  descreve. Merece uma medição própria.
- **O custo do vidro na gaveta não foi medido num aparelho.** Na máquina de
  desenvolvimento o arrasto sai idêntico com e sem o filtro (mediana 13,3ms, p95
  13,9, zero quadros perdidos, a 848px de altura). Isso descarta um custo
  grosseiro, não prova o telefone.

Reproduza a qualquer momento com `npm run ds:audit`.
