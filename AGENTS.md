<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Forms and Enter-to-submit

- Use **`CustomForm`** from `@/components/ui/form` for any user-facing flow where fields are saved or confirmed with a primary action. It normalizes **Enter** to the primary **`Button type="submit"`** (and skips hijacking for textareas, native selects, contenteditable, Radix select triggers, and combobox/listbox roles).
- Use **`type="submit"`** only for that primary action. Use **`type="button"`** for cancel, dismiss, toggles, and auxiliary actions.
- Avoid raw **`<form>`** for submit flows unless there is a documented exception.
- If you add a control that uses **Enter** for its own behavior (e.g. another Radix primitive), either mark it with a stable **`data-slot`** and extend `shouldDeferEnterToWidget` in `form.tsx`, or document the exception.

## Design system (foundation)

### Tokens and theme

- **Semantic colors** live in [`src/app/globals.css`](src/app/globals.css): `success`, `warning`, `info`, `income`, `expense` (aliases), `destructive-muted`, `overlay`, and chart tokens `chart-1`…`chart-5`. Prefer utilities such as `bg-success-muted`, `text-expense-muted-foreground`, `bg-overlay` — **do not** add new raw Tailwind palette classes (`text-green-600`, `bg-rose-100`, etc.) except inside narrowly scoped migrations.
- **Shadows**: use `shadow-xs` / `shadow-sm` / `shadow-md` / `shadow-lg` (mapped to CSS variables in `@theme inline`).
- **Fonts**: [`src/app/layout.tsx`](src/app/layout.tsx) sets `--font-sans` (Inter), `--font-heading` (Plus Jakarta Sans), `--font-mono` (Geist Mono). Body uses `font-sans`; headings use `font-heading` via primitives.

### Touch devices and hover (Tailwind v4)

- Utilities like `hover:*`, `dark:hover:*`, and `group-hover:*` compile to **`@media (hover: hover) { ... }`**, so they do not apply on typical **touch-primary** phones (`hover: none`). Do not strip `hover:` across the codebase for “mobile optimization.”
- **Decision**: keep the **default** Tailwind v4 hover variant (not `(pointer: fine)`), so **iPad + trackpad** users still get hover affordances. Tightening to `@media (hover: hover) and (pointer: fine)` would require a single `@variant hover (...)` override in [`src/app/globals.css`](src/app/globals.css) and would reduce hover on hybrid devices — only do that if product explicitly wants it.
- For surfaces that only used `group-hover:` for motion or emphasis, add **`group-active:`** (or `active:` on the interactive root) so **tap** gets similar feedback without duplicating styles behind `max-md:`.

### Required primitives for new screens

- **Page chrome**: [`PageHeader`](src/components/ui/page-header.tsx) + [`PageSection`](src/components/ui/page-section.tsx) + [`Container`](src/components/ui/container.tsx) for titles, descriptions, actions, and section spacing.
- **Typography**: [`H1`…`H4`, `Lead`, `P`, `Muted`, `Small`, `Caption`](src/components/ui/typography.tsx) instead of ad-hoc `text-3xl font-bold` / arbitrary `text-[10px]`.
- **Empty states**: [`EmptyState`](src/components/ui/empty-state.tsx) (+ title / description / actions slots).
- **Money**: [`MoneyDisplay`](src/components/ui/money-display.tsx) and [`MoneyInput`](src/components/ui/money-input.tsx); formatting helpers in [`src/lib/formatters.ts`](src/lib/formatters.ts) (`currencyBRL`, `signedCurrencyBRL`, `percentBR`).
- **Dates**: [`src/lib/transaction-date.ts`](src/lib/transaction-date.ts) — e.g. `formatDatePtBr`, `formatTransactionDmyPtBr`, `formatDateLongPtBr`, `formatRelativeDayPtBr`.
- **Status chips / filters**: [`src/lib/tag-chip-classes.ts`](src/lib/tag-chip-classes.ts) — token-based classes only.
- **Alerts / tabs / forms**: [`Alert`](src/components/ui/alert.tsx), [`Tabs`](src/components/ui/tabs.tsx), [`Textarea`](src/components/ui/textarea.tsx), [`ScrollArea`](src/components/ui/scroll-area.tsx), [`Toggle` / `ToggleGroup`](src/components/ui/toggle.tsx), [`Slider`](src/components/ui/slider.tsx), [`RadioGroup`](src/components/ui/radio-group.tsx), [`Pagination`](src/components/ui/pagination.tsx), [`Collapsible`](src/components/ui/collapsible.tsx), [`Breadcrumb`](src/components/ui/breadcrumb.tsx), [`ChartContainer` + chart helpers](src/components/ui/chart.tsx) for Recharts.

### Component rules

- **`Badge`**: use semantic `variant` + `size` (`xs` | `sm` | `default`); avoid duplicating chip classes outside `tag-chip-classes` / Badge.
- **`Button`**: includes `success` and `warning` variants; keep primary actions `type="submit"` inside `CustomForm`.
- **`Input` / `SelectTrigger`**: support `size="sm" | "default" | "lg"` for alignment with buttons.
- **`Progress`**: Radix-based; pass `tone` (`default` | `success` | `warning` | `destructive`) for budget / status bars.
- **`Avatar`**: Radix-based with `size` prop; keep `data-slot` for tests and form deferrals.
- **Overlays**: `Dialog` / `Sheet` / `AlertDialog` use `bg-overlay` (not hardcoded `bg-black/10`).

### Migration checklist (features — do in small PRs)

- **Wave A — color hotspots**: replace raw greens/reds/amber in filters, KPIs, analytics, `dashboard-cashflow-chart`, with tokens / `MoneyDisplay` / `tag-chip-*`.
- **Wave B — page headers + empty states**: adopt `PageHeader` + `EmptyState` across `page-client.tsx` files.
- **Wave C — money / dates**: replace inline `Intl.NumberFormat` / `toLocaleString` with `formatters` + `transaction-date`.
- **Wave D — segments → `Tabs` or `ToggleGroup`**: unify `transaction-type-segment`, `credit-cards-view-segment`, etc.
- **Wave E — skeletons**: align feature skeletons with `Skeleton` + `PageSection` patterns.
- **Wave F — auth shells**: replace manual `rounded-xl border bg-card` wrappers with `Card` + tokens.
- **Wave G — charts**: adopt `ChartContainer` / `ChartTooltipContent` where Recharts is used.
