<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Forms and Enter-to-submit

- Use **`CustomForm`** from `@/components/ui/form` for any user-facing flow where fields are saved or confirmed with a primary action. It normalizes **Enter** to the primary **`Button type="submit"`** (and skips hijacking for textareas, native selects, contenteditable, Radix select triggers, and combobox/listbox roles).
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

- **Componentes** em [`src/components/ui/`](src/components/ui) — 74 hoje.
- **Tokens** em [`src/app/globals.css`](src/app/globals.css).
- **Documentação viva** em `/designsystem`, com uma página por componente e por
  padrão. Sempre disponível em desenvolvimento; em produção, atrás de
  `NEXT_PUBLIC_DS_DOCS`.

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

**A garantia é do `Button`, não do `buttonVariants()`.** Nove arquivos aplicam
as classes direto num `<a>` ou num primitivo do Radix; ali não há `span`, e a
regra não alcança. Hoje todos esses rótulos já começam em maiúscula, então não
há defeito visível — mas quem quiser a garantia de verdade nesses pontos troca
`className={buttonVariants(...)}` por `<Button asChild>`.

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
  reprova. Por isso **`text-primary` não existe**: use `text-primary-accent`. Além deles: `--identity-1..6` (+ `-surface`) para distinguir pessoas,
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
  fica em `24/outline`, já que quem renderiza é que decide o corpo.
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

- **Page chrome**: [`PageHeader`](src/components/ui/page-header.tsx) + [`PageSection`](src/components/ui/page-section.tsx) + [`Container`](src/components/ui/container.tsx) for titles, descriptions, actions, and section spacing.
- **Cartão e painel**: [`Card`](src/components/ui/card.tsx) e suas peças —
  `CardToolbar`, `CardHeader`, `CardContent`, `CardFooter`, `CardNote`. O
  painel do app é `<Card padding="none">`; nada de `border-b bg-muted/30`
  escrito à mão para fazer uma barra de topo.
- **Typography**: [`H1`…`H4`, `Lead`, `P`, `Muted`, `Small`, `Caption`](src/components/ui/typography.tsx) instead of ad-hoc `text-3xl font-bold` / arbitrary `text-[10px]`.
- **Empty states**: [`EmptyState`](src/components/ui/empty-state.tsx) (+ title / description / actions slots).
- **Money**: [`MoneyDisplay`](src/components/ui/money-display.tsx) and [`MoneyInput`](src/components/ui/money-input.tsx); formatting helpers in [`src/lib/formatters.ts`](src/lib/formatters.ts) (`currencyBRL`, `signedCurrencyBRL`, `percentBR`).
- **Dates**: [`src/lib/transaction-date.ts`](src/lib/transaction-date.ts) — e.g. `formatDatePtBr`, `formatTransactionDmyPtBr`, `formatDateLongPtBr`, `formatRelativeDayPtBr`.
- **Status chips / filters**: [`src/lib/tag-chip-classes.ts`](src/lib/tag-chip-classes.ts) — token-based classes only.
- **Régua compartilhada em `lib/`**: além de
  [`tag-chip-classes`](src/lib/tag-chip-classes.ts),
  [`menu-classes`](src/lib/menu-classes.ts) e
  [`scroll-fade-classes`](src/lib/scroll-fade-classes.ts), agora
  [`field-classes`](src/lib/field-classes.ts) — a superfície de campo que
  `Input`, `SelectTrigger` e `ComboboxTrigger` vestem — e
  [`command-filter`](src/lib/command-filter.ts) — a busca por substring sem
  acento, graduada, que a paleta do catálogo e o `Combobox` dividem. **Nada de
  `cva` nesses arquivos**: a regra A2 do auditor o reprova fora de
  `components/ui/`.
- **Cor escolhida pela pessoa**: [`ColorTile`](src/components/ui/color-tile.tsx) para o ladrilho que carrega `categories.color`, `bills.color` ou a marca de um workspace. Se a cor vem do tema e não do banco, é o componente errado — use `bg-muted` ou um `Badge`. É o único lugar do app onde `white` e `black` crus são a resposta certa: o fundo é cor de runtime, e o que se apoia sobre ele — a tinta do ícone e o fio da borda — é material, não tema. Por isso ele está na lista de exceção do auditor — e nenhuma tela está. **O ladrilho é chapado**: o verniz que ele já teve (degradê branco, borda clara, sombra) saiu porque o resto do sistema preenche chapado. E a tinta não é branca por decreto — ela vira escura quando a cor gravada é clara demais para o branco alcançar 3:1.
- **Alerts / tabs / forms**: [`Alert`](src/components/ui/alert.tsx), [`Tabs`](src/components/ui/tabs.tsx), [`Textarea`](src/components/ui/textarea.tsx), [`ScrollArea`](src/components/ui/scroll-area.tsx), [`Toggle` / `ToggleGroup`](src/components/ui/toggle.tsx), [`Slider`](src/components/ui/slider.tsx), [`RadioGroup`](src/components/ui/radio-group.tsx), [`Pagination`](src/components/ui/pagination.tsx), [`Collapsible`](src/components/ui/collapsible.tsx), [`Breadcrumb`](src/components/ui/breadcrumb.tsx), [`ChartContainer` + chart helpers](src/components/ui/chart.tsx) for Recharts.
- **Campos**: [`Field`](src/components/ui/field.tsx) para rótulo + descrição + erro já ligados; [`InputGroup`](src/components/ui/input-group.tsx) para campo com ícone ou botão acoplado; [`Combobox`](src/components/ui/combobox.tsx) quando a lista passa de umas dez opções.
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
- **O tom do `Alert` chega ao texto.** `AlertTitle` e `AlertDescription`
  herdam a tinta do tom — a descrição a 85% —, em vez de carimbar
  `text-foreground` e `text-muted-foreground` por cima. Cinza sobre superfície
  colorida passa na norma (5,1–5,7:1) mas lê como texto que caiu ali por
  acidente; a tinta tonal dá 6,9–10,8:1. O tom `default` é a única exceção, e é
  porque ali a superfície é neutra.
- **A ação do `Alert` mora em `AlertActions`, e não declara cor.** O botão de
  dentro é `variant="tertiary"` e nada mais: borda, tinta e realce saem de
  `currentColor`, então a mesma linha serve os cinco tons e o par `active:` vem
  junto. Escrever `border-destructive/40 hover:bg-destructive/10` num botão
  dentro de um alerta é reimportar a paleta para dentro da tela.
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
  quantas quiser". O ponto segue a decisão já tomada no `RadioGroup`: um
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
  (`border` completo). E `PageHeader`, `H2`, `TableHeader` e `TableFooter`, que
  ficaram fora do escopo por decisão.
- **A regra `J` do auditor é o que impede tudo isso de voltar.** Ela acusa fio
  **mais** tinta na mesma classe de uma tira, ignorando moldura. Ela existe
  porque a lição já custou caro: quando o `border-t` saiu do `DialogFooter`, o
  app **não perdeu o fio** — 24 chamadas o repunham à mão, e a mudança do
  componente nunca chegou à tela. Hoje ela está em **zero**.
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
- **`Progress`**: Radix-based; pass `tone` (`default` | `success` | `warning` | `destructive`) for budget / status bars.
- **`Avatar`**: Radix-based with `size` prop; keep `data-slot` for tests and form deferrals.
- **Overlays**: `Dialog` / `Sheet` / `AlertDialog` use `bg-overlay` (not hardcoded `bg-black/10`).
- **`DialogFooter` empilha ao contrário** (`flex-col-reverse`), para a ação
  principal ficar em cima no telefone. O antigo `SheetFooter` empilhava na
  ordem do DOM — então os 17 rodapés que vieram da folha declaram `flex-col`
  explicitamente, e é de propósito.

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

- **10 `role="tablist"` escritos à mão, em 7 arquivos, com 43 referências às
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

Reproduza a qualquer momento com `npm run ds:audit`.
