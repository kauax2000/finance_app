<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Forms and Enter-to-submit

- Use **`CustomForm`** from `@/components/ui/form` for any user-facing flow where fields are saved or confirmed with a primary action. It normalizes **Enter** to the primary **`Button type="submit"`** (and skips hijacking for textareas, native selects, contenteditable, Radix select triggers, and combobox/listbox roles).
- Use **`type="submit"`** only for that primary action. Use **`type="button"`** for cancel, dismiss, toggles, and auxiliary actions.
- Avoid raw **`<form>`** for submit flows unless there is a documented exception.
- If you add a control that uses **Enter** for its own behavior (e.g. another Radix primitive), either mark it with a stable **`data-slot`** and extend `shouldDeferEnterToWidget` in `form.tsx`, or document the exception.

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

### Rodapé de diálogo: uma hierarquia só

Todo rodapé de `Dialog` e de `AlertDialog` tem a mesma forma, e ela não se
escolhe por tela:

| Papel | Variant |
| --- | --- |
| Sair sem fazer nada (`AlertDialogCancel`, `DialogClose`) | `ghost` |
| A ação que o diálogo veio propor | `default` |
| A mesma ação, quando não tem volta | `destructive` |

Cancelar vem antes da ação, e leva `type="button"`. Dois botões de contorno lado
a lado pesam igual, e o olho tem que ler os dois para descobrir qual é a saída.

### Par de identidade: sem gap

Nome sobre e-mail, título sobre legenda, rótulo sobre valor — sempre que dois
textos empilhados são **o mesmo dado em duas linhas**, quem os separa é a
entrelinha. Não declare `gap` entre eles, nem `gap-1`. Dois pixels bastam para o
par deixar de ler como uma coisa só. `gap` continua certo entre coisas
**diferentes**: um bloco e o seguinte, um campo e o próximo.

### Tokens e theme

- **Semantic colors** live in [`src/app/globals.css`](src/app/globals.css):
  `success`, `warning`, `info`, `income`, `expense`, e os pares `-muted` de cada
  um. Além deles: `--identity-1..6` (+ `-surface`) para distinguir pessoas,
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
- **Shadows**: `shadow-xs` / `shadow-sm` / `shadow-md` / `shadow-lg` /
  `shadow-xl`, todos com valores próprios no tema escuro.
- **Texto**: além da escala do Tailwind, `text-2xs` (0,6875rem, para contagem
  dentro de controle pequeno) e `text-control-sm` (0,8rem, o texto dos controles
  `size="sm"`).
- **Fonts**: [`src/app/layout.tsx`](src/app/layout.tsx) define `--font-sans`
  (Inter), `--font-heading` (Plus Jakarta Sans), `--font-mono` (Geist Mono).
- **Utilitários**: `.nums` (tabular figures) e `.page-title`.

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
- **Typography**: [`H1`…`H4`, `Lead`, `P`, `Muted`, `Small`, `Caption`](src/components/ui/typography.tsx) instead of ad-hoc `text-3xl font-bold` / arbitrary `text-[10px]`.
- **Empty states**: [`EmptyState`](src/components/ui/empty-state.tsx) (+ title / description / actions slots).
- **Money**: [`MoneyDisplay`](src/components/ui/money-display.tsx) and [`MoneyInput`](src/components/ui/money-input.tsx); formatting helpers in [`src/lib/formatters.ts`](src/lib/formatters.ts) (`currencyBRL`, `signedCurrencyBRL`, `percentBR`).
- **Dates**: [`src/lib/transaction-date.ts`](src/lib/transaction-date.ts) — e.g. `formatDatePtBr`, `formatTransactionDmyPtBr`, `formatDateLongPtBr`, `formatRelativeDayPtBr`.
- **Status chips / filters**: [`src/lib/tag-chip-classes.ts`](src/lib/tag-chip-classes.ts) — token-based classes only.
- **Cor escolhida pela pessoa**: [`ColorTile`](src/components/ui/color-tile.tsx) para o ladrilho que carrega `categories.color`, `bills.color` ou a marca de um workspace. Se a cor vem do tema e não do banco, é o componente errado — use `bg-muted` ou um `Badge`. É o único lugar do app onde `white` e `black` crus são a resposta certa: o fundo é cor de runtime, e o verniz sobre ela é material, não tema. Por isso ele está na lista de exceção do auditor — e nenhuma tela está.
- **Alerts / tabs / forms**: [`Alert`](src/components/ui/alert.tsx), [`Tabs`](src/components/ui/tabs.tsx), [`Textarea`](src/components/ui/textarea.tsx), [`ScrollArea`](src/components/ui/scroll-area.tsx), [`Toggle` / `ToggleGroup`](src/components/ui/toggle.tsx), [`Slider`](src/components/ui/slider.tsx), [`RadioGroup`](src/components/ui/radio-group.tsx), [`Pagination`](src/components/ui/pagination.tsx), [`Collapsible`](src/components/ui/collapsible.tsx), [`Breadcrumb`](src/components/ui/breadcrumb.tsx), [`ChartContainer` + chart helpers](src/components/ui/chart.tsx) for Recharts.
- **Campos**: [`Field`](src/components/ui/field.tsx) para rótulo + descrição + erro já ligados; [`InputGroup`](src/components/ui/input-group.tsx) para campo com ícone ou botão acoplado; [`Combobox`](src/components/ui/combobox.tsx) quando a lista passa de umas dez opções.
- **Listas e detalhe**: [`Item`](src/components/ui/item.tsx) para linha de lista (e para o que a `Table` vira no telefone), [`DescriptionList`](src/components/ui/description-list.tsx) para pares termo/valor, [`Timeline`](src/components/ui/timeline.tsx) para histórico, [`Toolbar`](src/components/ui/toolbar.tsx) para a linha de filtros e ações.
- **Carregando**: [`Skeleton`](src/components/ui/skeleton.tsx) para uma tela esperando dado; [`Spinner`](src/components/ui/spinner.tsx) só para ação curta sem fim conhecido.
- **Busca**: [`Command`](src/components/ui/command.tsx) — a paleta de comandos. O catálogo `/designsystem` é o primeiro consumidor ([`ds-search.tsx`](src/app/designsystem/ds-search.tsx)): gatilho no meio do cabeçalho com o `Kbd` do atalho, `⌘K` e `/` para abrir, e `filter` próprio, porque o padrão do cmdk é difuso e erra em português. O **app** ainda não tem busca global, e é a lacuna que ele preenche.

### Component rules

- **`Badge`**: use semantic `variant` + `size` (`xs` | `sm` | `default`); avoid duplicating chip classes outside `tag-chip-classes` / Badge.
- **`Button`**: includes `success` and `warning` variants; keep primary actions `type="submit"` inside `CustomForm`.
- **`Input` / `SelectTrigger` / `Button`**: os três compartilham a escala de altura
  `sm` = 28px, `default` = 36px, `lg` = 40px, para um botão ao lado de um campo
  alinhar sem ajuste. `xs` e `icon-xs` ficam fora dela: são para dentro de outro
  controle, não para uma linha de formulário.
- **`Progress`**: Radix-based; pass `tone` (`default` | `success` | `warning` | `destructive`) for budget / status bars.
- **`Avatar`**: Radix-based with `size` prop; keep `data-slot` for tests and form deferrals.
- **Overlays**: `Dialog` / `Sheet` / `AlertDialog` use `bg-overlay` (not hardcoded `bg-black/10`).

### Backlog de migração

A rodada 01 entregou tokens, componentes, documentação e o auditor, sem migrar
as telas. A rodada 02 migrou o que quebrava o tema escuro e corrigiu a escala de
camadas, que descrevia números que a produção não usava. O estado atual está em
[`docs/design/CONFORMIDADE-02.md`](docs/design/CONFORMIDADE-02.md): **1.179 →
622 achados**, com ordem sugerida por razão entre impacto e risco.
[`CONFORMIDADE-01.md`](docs/design/CONFORMIDADE-01.md) virou registro histórico —
duas das correções que ele prescrevia estavam erradas, e a 02 diz quais.

O que sobra, do mais barato ao mais caro:

- **86 `hover:` sem par de toque.** No telefone essas superfícies não respondem
  ao toque. A correção é **somar** `active:`, nunca remover o `hover:`.
- **77 formatações fora dos helpers** — `Intl.*` e `toLocaleDateString` na tela,
  cada um livre para divergir. Destino: `@/lib/formatters` e
  `@/lib/transaction-date`.
- **51 primitivos crus** com equivalente no design system, quase todos
  `<button>`. Muda tipos de props: `npx tsc --noEmit` a cada arquivo.
- **357 valores arbitrários**, hoje majoritariamente legítimos: `w-[…]` e `h-[…]`
  de esqueleto, que existem para casar com a largura do conteúdo real.

Reproduza a qualquer momento com `npm run ds:audit`.
