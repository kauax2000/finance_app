# Formulário de lançamento — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar o formulário de Despesa, Compra parcelada e Receita (diálogo no desktop, gaveta no telefone, e a edição no painel de detalhe) conforme a spec.

**Architecture:** Só os arquivos do formulário em `src/components/transactions/` mudam. O título vira uma função pura testável; o seletor de tipo passa de cartões de rádio para `ToggleGroup variant="segmented"`; a superfície ganha Cancelar; os campos são reordenados em dois blocos ("essencial" e "Detalhes"). Nada do que é gravado muda.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, Radix (via componentes de `src/components/ui/`), Vitest (testes de leitura de fonte com `@/test/fonte` e unitários puros).

**Spec:** `docs/superpowers/specs/2026-10-15-formulario-de-lancamento-design.md`

## Global Constraints

- Nenhum arquivo de `src/components/ui/` nem `src/app/globals.css` muda (invariante 6 do `AGENTS.md`); nenhum token novo.
- Token-first: nenhum `#hex`, `rgb()`, `style={{ backgroundColor`, classe crua da paleta, nem valor arbitrário de tamanho (`p-[13px]`).
- Ícones: `@heroicons/react/16/solid` para ícone de até 16px (regra G do auditor).
- Textos em português, como no app. Títulos exatos: "Nova despesa", "Nova compra parcelada", "Nova receita", "Editar despesa", "Editar compra parcelada", "Editar receita".
- A opção de ausência da forma de pagamento se chama "Sem forma".
- O que é gravado, a validação e a persistência não mudam.
- O dev usa o Supabase de produção: verificar no navegador **sem salvar nada**.
- Nunca `git add -A`; nunca incluir `src/app/designsystem/docs/showcase.tsx` (é de outra sessão).
- Comandos de checagem: `npx tsc --noEmit` (ignorar erros em `.next/`), `npm run lint`, `npm run test:unit`, `npm run ds:audit -- src/components/transactions`.

## Review Focus

- Trocar de Despesa para Receita com uma forma de pagamento escolhida: a forma e o cartão somem da tela e não ficam gravados como cartão órfão (o estado já zera ao trocar? conferir em `transaction-form-use.tsx`; se não zera, a Receita não mostra o campo e a persistência já ignora — o teste da Task 4 trava que a Receita não renderiza Forma).
- Valor vazio do `Select` de forma: o Radix não aceita `""`, então o valor "nenhum" é o sentinela `PAYMENT_NONE`; escolher "Sem forma" grava `null` e limpa o cartão (Task 4).
- Cancelar com rascunho no diálogo pergunta "Descartar alterações?"; no painel de detalhe, Cancelar volta à visualização em vez de fechar o painel (Task 3).
- Foco ao abrir: o Valor recebe foco só ao criar e só fora do telefone (Task 4).
- Edição de uma parcela com escopo "Plano da compra": título "Editar compra parcelada", fileira de parcelas e aviso em `Alert` (Tasks 1 e 4).

---

### Task 1: O título pelo tipo e pelo modo

**Files:**
- Create: `src/components/transactions/transaction-form-title.ts`
- Create: `src/components/transactions/transaction-form-title.test.ts`
- Modify: `src/components/transactions/transaction-form-use.tsx:575-581`

**Interfaces:**
- Produces: `transactionFormTitle(args: { editing: boolean; formKind: TransactionFormKind; type: "income" | "expense"; hasInstallmentPlan: boolean; installmentEditScope: "slice" | "plan" }): string`

- [ ] **Step 1: Write the failing test** — `src/components/transactions/transaction-form-title.test.ts`

```ts
import { describe, expect, it } from "vitest"
import { transactionFormTitle } from "./transaction-form-title"

const base = {
    editing: false,
    formKind: "expense" as const,
    type: "expense" as const,
    hasInstallmentPlan: false,
    installmentEditScope: "slice" as const,
}

describe("o título do formulário segue o tipo e o modo", () => {
    it("ao criar", () => {
        expect(transactionFormTitle(base)).toBe("Nova despesa")
        expect(transactionFormTitle({ ...base, formKind: "installment" })).toBe("Nova compra parcelada")
        expect(transactionFormTitle({ ...base, formKind: "income", type: "income" })).toBe("Nova receita")
    })

    it("ao editar", () => {
        const editar = { ...base, editing: true }
        expect(transactionFormTitle(editar)).toBe("Editar despesa")
        expect(transactionFormTitle({ ...editar, type: "income" })).toBe("Editar receita")
    })

    it("ao editar uma parcela, o escopo decide", () => {
        const parcela = { ...base, editing: true, hasInstallmentPlan: true }
        expect(transactionFormTitle(parcela)).toBe("Editar despesa")
        expect(transactionFormTitle({ ...parcela, installmentEditScope: "plan" })).toBe("Editar compra parcelada")
    })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/transactions/transaction-form-title.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Write the implementation** — `src/components/transactions/transaction-form-title.ts`

```ts
import type { TransactionFormKind } from "@/components/transactions/transaction-type-segment"

/** O título do formulário de lançamento: o tipo, em criar ou editar. */
export function transactionFormTitle({
    editing,
    formKind,
    type,
    hasInstallmentPlan,
    installmentEditScope,
}: {
    editing: boolean
    formKind: TransactionFormKind
    type: "income" | "expense"
    hasInstallmentPlan: boolean
    installmentEditScope: "slice" | "plan"
}): string {
    if (editing) {
        if (hasInstallmentPlan && installmentEditScope === "plan") return "Editar compra parcelada"
        return type === "income" ? "Editar receita" : "Editar despesa"
    }
    if (formKind === "installment") return "Nova compra parcelada"
    return formKind === "income" ? "Nova receita" : "Nova despesa"
}
```

- [ ] **Step 4: Wire it in `transaction-form-use.tsx`** — replace the `formTitle` ternary (lines 575-581) with:

```ts
    const formTitle = transactionFormTitle({
        editing: Boolean(editingTransaction),
        formKind,
        type,
        hasInstallmentPlan,
        installmentEditScope,
    })
```

and add `import { transactionFormTitle } from "@/components/transactions/transaction-form-title"` with the other imports. Keep `formDescription` as is (it becomes `sr-only` in Task 3). If the local names differ from `formKind`, `type`, `hasInstallmentPlan`, `installmentEditScope`, use the names already in scope at line 575 (read lines 520-575 first).

- [ ] **Step 5: Run tests and type-check**

Run: `npx vitest run src/components/transactions/transaction-form-title.test.ts && npx tsc --noEmit 2>&1 | grep -v "^\.next/"`
Expected: PASS, no type errors outside `.next/`.

- [ ] **Step 6: Commit**

```bash
git add src/components/transactions/transaction-form-title.ts src/components/transactions/transaction-form-title.test.ts src/components/transactions/transaction-form-use.tsx
git commit -m "feat(lançamento): o título segue o tipo e o modo"
```

---

### Task 2: O seletor de tipo vira trilho segmentado

**Files:**
- Modify: `src/components/transactions/transaction-type-segment.tsx` (`TransactionFormKindSegment`, `TransactionFormTypeSegment`; `TransactionTypeSegment` não muda)
- Test: `src/components/transactions/transaction-form-layout.test.ts` (create)

**Interfaces:**
- Produces (assinaturas mantidas, `label` removido): `TransactionFormKindSegment({ value, onChange, className })`, `TransactionFormTypeSegment({ value, onChange, className, disabled })`, e novo `TransactionFormScopeSegment({ value: "slice" | "plan", onChange: (v: "slice" | "plan") => void, className?: string })`.

- [ ] **Step 1: Write the failing test** — create `src/components/transactions/transaction-form-layout.test.ts`

```ts
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const SEGMENTO = semComentarios(lerFonte("src/components/transactions/transaction-type-segment.tsx"))

describe("o seletor de tipo do formulário", () => {
    it("é um trilho segmentado, de largura toda, nomeado", () => {
        expect(SEGMENTO).toMatch(/<ToggleGroup[\s\S]*?type="single"[\s\S]*?variant="segmented"[\s\S]*?stretch/)
        expect(SEGMENTO).toContain('aria-label="Tipo de lançamento"')
        expect(SEGMENTO).toContain('aria-label="O que editar"')
        expect(SEGMENTO).not.toMatch(/FormRadioGroup[\s\S]*?variant="card"/)
    })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/transactions/transaction-form-layout.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement** — in `transaction-type-segment.tsx`, replace `TransactionFormKindSegment` and `TransactionFormTypeSegment` (keep `FORM_KIND_TABS`, `FORM_TYPE_TABS`; change `FORM_TYPE_TABS` labels to "Despesa" and "Receita"), add `TransactionFormScopeSegment`, swap the `FormRadioGroup` import for `ToggleGroup`/`ToggleGroupItem` (keep `FormRadioGroup` import only if still used — it is not). Each item passes its icon by the `icon` prop:

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

// O `ToggleGroupItem` desenha o ícone em 16px, então `16/solid`.
const FORM_TYPE_TABS: { value: "expense" | "income"; label: string; icon: React.ReactNode }[] = [
    { value: "expense", label: "Despesa", icon: <ArrowTrendingDownIcon /> },
    { value: "income", label: "Receita", icon: <ArrowTrendingUpIcon /> },
]

/**
 * O tipo ao criar: despesa simples, compra parcelada ou receita. Escolha de
 * valor num formulário: `ToggleGroup` segmentado, que o Radix anuncia como
 * rádio (`single`). Eram três cartões de rádio que ocupavam o topo; o título
 * do diálogo já diz o tipo, então o grupo não tem rótulo visível.
 */
export function TransactionFormKindSegment({
    value,
    onChange,
    className,
}: {
    value: TransactionFormKind
    onChange: (next: TransactionFormKind) => void
    className?: string
}) {
    return (
        <ToggleGroup
            type="single"
            variant="segmented"
            stretch
            aria-label="Tipo de lançamento"
            value={value}
            onValueChange={(next) => onChange(next as TransactionFormKind)}
            className={className}
        >
            {FORM_KIND_TABS.map((t) => (
                <ToggleGroupItem key={t.value} value={t.value} icon={t.icon}>
                    {t.label}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    )
}

/** O tipo ao editar: despesa ou receita. */
export function TransactionFormTypeSegment({
    value,
    onChange,
    className,
    disabled = false,
}: {
    value: "income" | "expense"
    onChange: (next: "income" | "expense") => void
    className?: string
    disabled?: boolean
}) {
    return (
        <ToggleGroup
            type="single"
            variant="segmented"
            stretch
            aria-label="Tipo de lançamento"
            disabled={disabled}
            value={value}
            onValueChange={(next) => onChange(next as "income" | "expense")}
            className={className}
        >
            {FORM_TYPE_TABS.map((t) => (
                <ToggleGroupItem key={t.value} value={t.value} icon={t.icon}>
                    {t.label}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    )
}

/** Na edição de uma parcela: só ela ou o plano inteiro. */
export function TransactionFormScopeSegment({
    value,
    onChange,
    className,
}: {
    value: "slice" | "plan"
    onChange: (next: "slice" | "plan") => void
    className?: string
}) {
    return (
        <ToggleGroup
            type="single"
            variant="segmented"
            stretch
            aria-label="O que editar"
            value={value}
            onValueChange={(next) => onChange(next as "slice" | "plan")}
            className={className}
        >
            <ToggleGroupItem value="slice">Esta parcela</ToggleGroupItem>
            <ToggleGroupItem value="plan">Plano da compra</ToggleGroupItem>
        </ToggleGroup>
    )
}
```

Grep for other callers of `TransactionFormTypeSegment` / `TransactionFormKindSegment` that pass `label` (`grep -rn "TransactionForm\(Type\|Kind\)Segment" src`) and drop the `label` prop there; if any caller outside the transaction form relies on the visible label, keep it rendering by wrapping it in the caller's `Field` with a `FieldTitle` (report it).

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/transactions/transaction-form-layout.test.ts src/components/ui/tabs-versions.test.ts src/components/ui/toggle-group-versions.test.ts && npx tsc --noEmit 2>&1 | grep -v "^\.next/"`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/transactions/transaction-type-segment.tsx src/components/transactions/transaction-form-layout.test.ts
git commit -m "feat(lançamento): o tipo vira trilho segmentado"
```

---

### Task 3: A superfície — cabeçalho limpo e Cancelar no rodapé

**Files:**
- Modify: `src/components/transactions/transaction-form-surface.tsx`
- Modify: `src/components/transactions/transaction-detail-sheet.tsx:447-456` (passa `onCancel`)
- Test: `src/components/transactions/transaction-form-layout.test.ts` (append)

**Interfaces:**
- Consumes: nothing new.
- Produces: `TransactionFormSurfaceProps` ganha `onCancel?: () => void` (sem ele, o Cancelar fecha o diálogo por `DialogClose`; com ele — o painel de detalhe —, chama `onCancel`).

- [ ] **Step 1: Append the failing test** to `transaction-form-layout.test.ts`

```ts
const SUPERFICIE = semComentarios(lerFonte("src/components/transactions/transaction-form-surface.tsx"))

describe("a superfície do formulário", () => {
    it("a descrição do cabeçalho é só do leitor de tela", () => {
        expect(SUPERFICIE.match(/<DialogDescription className="sr-only">/g)?.length).toBe(3)
        expect(SUPERFICIE).not.toMatch(/<DialogDescription>\{formDescription\}/)
    })

    it("o rodapé tem Cancelar e Salvar", () => {
        expect(SUPERFICIE).toContain("<FormCancel")
        expect(SUPERFICIE).toContain("<DialogClose asChild>")
        expect(SUPERFICIE).toContain("onCancel ?")
        expect(SUPERFICIE).toMatch(/<FormSubmit[^>]*disabled=\{submitDisabled\}/)
        expect(SUPERFICIE).not.toMatch(/<FormSubmit[^>]*size=/)
    })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/transactions/transaction-form-layout.test.ts`
Expected: FAIL on the new `describe`.

- [ ] **Step 3: Implement** — in `transaction-form-surface.tsx`:
  1. Import `FormCancel` from `@/components/ui/form` and `DialogClose` from `@/components/ui/dialog`.
  2. Add `onCancel?: () => void` to `TransactionFormSurfaceProps` (doc comment: "No painel de detalhe, Cancelar volta à visualização; sem ele, fecha o diálogo.") and destructure it.
  3. Replace the `footer` constant with:

```tsx
    const cancel = onCancel ? (
        <FormCancel onClick={onCancel}>Cancelar</FormCancel>
    ) : (
        <DialogClose asChild>
            <FormCancel>Cancelar</FormCancel>
        </DialogClose>
    )
    const footer = showFooter ? (
        <>
            {cancel}
            <FormSubmit disabled={submitDisabled}>Salvar</FormSubmit>
        </>
    ) : null
```

  4. In all three variants, render `{footer}` inside `<DialogFooter>` without `className="flex-col"` (the `DialogFooter` already stacks reversed on the phone and gives the touch height; remove the `w-full` comment and branch together with the old `footer`).
  5. In the `dialog-desktop` variant, move `<DialogDescription>{formDescription}</DialogDescription>` out of the `DialogHeaderRow` and render it as `<DialogDescription className="sr-only">{formDescription}</DialogDescription>` right after `</DialogHeader>`, like the other two variants.

- [ ] **Step 4: Pass `onCancel` from the detail sheet** — in `transaction-detail-sheet.tsx`, on the `<TransactionFormSurface variant="detail-sheet" …>` add `onCancel={() => setDetailMode("view")}`.

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/components/transactions/ && npx tsc --noEmit 2>&1 | grep -v "^\.next/"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/transactions/transaction-form-surface.tsx src/components/transactions/transaction-detail-sheet.tsx src/components/transactions/transaction-form-layout.test.ts
git commit -m "feat(lançamento): cabeçalho sem a descrição repetida e Cancelar no rodapé"
```

---

### Task 4: Os campos em dois blocos

**Files:**
- Modify: `src/components/transactions/transaction-form-fields.tsx` (the JSX returned by `TransactionFormFields`, `CategoryRows`, and imports)
- Modify: `src/components/ui/radio-group-versions.test.ts:77-82` (the payment-method assertion; test file, allowed)
- Test: `src/components/transactions/transaction-form-layout.test.ts` (append)

**Interfaces:**
- Consumes: `TransactionFormKindSegment`, `TransactionFormTypeSegment`, `TransactionFormScopeSegment` (Task 2).
- Produces: nothing new for other tasks.

- [ ] **Step 1: Append the failing tests** to `transaction-form-layout.test.ts`

```ts
const CAMPOS = semComentarios(lerFonte("src/components/transactions/transaction-form-fields.tsx"))

describe("os campos do formulário", () => {
    it("a ordem: valor, categoria, descrição, Detalhes, data e forma, cartão", () => {
        const pos = (marca: string) => {
            const i = CAMPOS.indexOf(marca)
            expect(i, marca).toBeGreaterThan(-1)
            return i
        }
        // As posições são as do JSX devolvido: a Data é o `{dataField}`, montado antes.
        const valor = pos('label="Valor"')
        const categoria = pos('htmlFor="tx-category"')
        const descricao = pos('label="Descrição"')
        const detalhes = pos("<Separator>Detalhes</Separator>")
        const data = pos("{dataField}")
        const forma = pos('id="tx-payment-method"')
        const cartao = pos('id="tx-credit-card"')
        expect([valor, categoria, descricao, detalhes, data, forma, cartao]).toEqual(
            [valor, categoria, descricao, detalhes, data, forma, cartao].slice().sort((a, b) => a - b)
        )
    })

    it("o valor é o campo alto, com foco só ao criar fora do telefone", () => {
        expect(CAMPOS).toMatch(/label="Valor"[\s\S]{0,200}size="xl"/)
        expect(CAMPOS).toContain('autoFocus={segmentMode === "create" && !isMobile}')
    })

    it("data e forma dividem a fileira; a forma é uma lista com Sem forma", () => {
        expect(CAMPOS).toContain("const dataField = (")
        expect(CAMPOS).toMatch(/<FieldRow>\s*\{dataField\}[\s\S]*?id="tx-payment-method"[\s\S]*?<\/FieldRow>/)
        expect(CAMPOS).toMatch(/<SelectItem value=\{PAYMENT_NONE\} variant="none">\s*Sem forma/)
    })

    it("a receita não tem forma de pagamento", () => {
        expect(CAMPOS).toContain('const mostraForma = type === "expense" || showInstallmentFields')
        expect(CAMPOS).toMatch(/\{mostraForma \? \(/)
    })

    it("a categoria veste o ColorTile, sem cor pintada à mão", () => {
        expect(CAMPOS).toContain('<ColorTile size="xs"')
        expect(CAMPOS).not.toMatch(/style=\{\{\s*backgroundColor/)
    })

    it("a parcelada: total ou por parcela num trilho pequeno, e o aviso do plano é um Alert", () => {
        expect(CAMPOS).toMatch(/aria-label="Como informar o valor"[\s\S]{0,200}variant="segmented"|variant="segmented"[\s\S]{0,200}aria-label="Como informar o valor"/)
        expect(CAMPOS).toContain('<Alert tone="warning" size="sm">')
        expect(CAMPOS).not.toMatch(/border-warning\/25/)
    })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/transactions/transaction-form-layout.test.ts`
Expected: FAIL on the new `describe`.

- [ ] **Step 3: Update imports** in `transaction-form-fields.tsx`:
  - add `import { Alert, AlertDescription } from "@/components/ui/alert"`, `import { ColorTile } from "@/components/ui/color-tile"`, `import { Separator } from "@/components/ui/separator"`, `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"`, `import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"`, `import { CategoryIconPreview } from "@/components/categories/category-appearance-fields"`;
  - add `FieldRow` to the `@/components/ui/field` import;
  - add `TransactionFormScopeSegment` to the `transaction-type-segment` import;
  - remove `FormRadioGroup` from the `@/components/ui/form` import when it is no longer used.
  - Add the sentinel next to the other module constants: `const PAYMENT_NONE = "__none__"` with the comment `// O Radix não aceita valor vazio: o "nenhuma" do Select é um sentinela.`

- [ ] **Step 4: `CategoryRows` and the category trigger** — replace each colored dot (`<span className="size-2.5 …" style={{ backgroundColor: … }} />` in `CategoryRows`, and `<span className="size-2 …" style={…} />` in the trigger) with:

```tsx
<ColorTile size="xs" color={c.color} className="shrink-0">
    <CategoryIconPreview name={c.icon} />
</ColorTile>
```

(in the trigger use `selectedCategory.color` / `selectedCategory.icon`). If `Category` has no `icon` field typed, check `src/lib/supabase` for the field name used by `expense-category-card.tsx` (`category.icon`) and use the same.

- [ ] **Step 5: Rewrite the returned JSX** of `TransactionFormFields` in this order (keep every existing handler, id and computed value; only the layout changes). Add `const mostraForma = type === "expense" || showInstallmentFields` before the `return`.

```tsx
    return (
        <div className="space-y-4 py-1 pb-2">
            {showInstallmentEditScopePicker ? (
                <TransactionFormScopeSegment
                    value={installmentEditScope}
                    onChange={(next) => setInstallmentEditScope?.(next)}
                />
            ) : null}

            {segmentMode === "edit" && hasInstallmentPlan ? null : segmentMode === "edit" ? (
                <TransactionFormTypeSegment value={type} onChange={setType} />
            ) : (
                <TransactionFormKindSegment value={formKind} onChange={setFormKind} />
            )}

            {showInstallmentFields && segmentMode === "edit" ? (
                <Alert tone="warning" size="sm">
                    <AlertDescription>
                        Parcelas já lançadas no extrato não mudam automaticamente;
                        só as próximas cobranças usam os novos valores do plano.
                    </AlertDescription>
                </Alert>
            ) : null}

            {showInstallmentFields ? (
                <div className="space-y-2">
                    <ToggleGroup
                        type="single"
                        variant="segmented"
                        size="sm"
                        aria-label="Como informar o valor"
                        value={installmentValueMode}
                        onValueChange={(next) =>
                            setInstallmentValueMode(next as "total" | "per_installment")
                        }
                    >
                        <ToggleGroupItem value="total">Total</ToggleGroupItem>
                        <ToggleGroupItem value="per_installment">Por parcela</ToggleGroupItem>
                    </ToggleGroup>
                    <FieldRow stack={false} className="grid-cols-[minmax(0,1fr)_6rem]">
                        <FormInput
                            money
                            size="xl"
                            fieldSize="sm"
                            label={installmentValueMode === "total" ? "Valor total" : "Valor da parcela"}
                            value={installmentValueMode === "total" ? installmentTotal : installmentPerAmount}
                            onValueChange={installmentValueMode === "total" ? setInstallmentTotal : setInstallmentPerAmount}
                            placeholder={installmentValueMode === "total" ? "1.200,00" : "100,00"}
                            className="text-base"
                            autoFocus={segmentMode === "create" && !isMobile}
                        />
                        <FormInput
                            id="tx-inst-n"
                            size="xl"
                            fieldSize="sm"
                            label="Parcelas"
                            type="number"
                            min={2}
                            step={1}
                            value={installmentCount}
                            onChange={(e) => setInstallmentCount(e.target.value)}
                            placeholder="12"
                            className="text-base tabular-nums"
                        />
                    </FieldRow>
                    {installmentPreview ? (
                        <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
                            {installmentPreview}
                        </p>
                    ) : null}
                </div>
            ) : (
                <FormInput
                    money
                    size="xl"
                    fieldSize="sm"
                    label="Valor"
                    value={amount}
                    onValueChange={setAmount}
                    placeholder="0,00"
                    className="text-base"
                    autoFocus={segmentMode === "create" && !isMobile}
                    required={segmentMode === "edit" || formKind !== "installment"}
                />
            )}

            {/* Categoria: the existing <Field size="sm"> … </Field> with the
                Popover, unchanged except the ColorTile from Step 4. */}

            <FormInput
                id="tx-description"
                fieldSize="sm"
                label="Descrição"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                className="text-sm"
                placeholder="Ex: Supermercado"
            />

            <Separator>Detalhes</Separator>

            <FieldRow>
                {/* Data: the existing <Field size="sm"> … </Field> with the
                    DatePicker (id="tx-date"), unchanged, except the label for
                    the installment create case reads "Primeira cobrança"
                    instead of "Data da primeira cobrança". */}

                {mostraForma ? (
                    <Field size="sm">
                        <FieldLabel optional>
                            Forma de pagamento
                        </FieldLabel>
                        <Select
                            value={paymentMethod ?? PAYMENT_NONE}
                            onValueChange={(v) => {
                                const next = v === PAYMENT_NONE ? null : (v as PaymentMethod)
                                setPaymentMethod(next)
                                if (next !== "credit_card") setPaymentCreditCardId("")
                            }}
                        >
                            <FieldControl>
                                <SelectTrigger id="tx-payment-method" className="w-full min-w-0">
                                    <SelectValue placeholder="Sem forma" />
                                </SelectTrigger>
                            </FieldControl>
                            <SelectContent align="start" sideOffset={6}>
                                <SelectItem value={PAYMENT_NONE} variant="none">
                                    Sem forma
                                </SelectItem>
                                {paymentMethodOptions().map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                ) : null}
            </FieldRow>

            {/* Cartão: the existing `paymentMethod === "credit_card" ? (<Field …>…</Field>)`
                block, unchanged (now outside the old fragment, after the FieldRow,
                and guarded by `mostraForma && paymentMethod === "credit_card"`). */}
        </div>
    )
```

  Notes for this step:
  - The categoria block keeps `id="tx-category"` and `htmlFor="tx-category"`; it moves between Valor and Descrição.
  - Receita: with `mostraForma` false the Data must fill the row. The `FieldRow` is a two-column grid from `sm` up, so render `<FieldRow>` only when `mostraForma` is true and, otherwise, the Data `Field` alone (same JSX, no wrapper). Keep the Data JSX in one `const dataField = (...)` to avoid writing it twice.
  - `FieldLabel` of the Forma has no `htmlFor`: the `FieldControl` around the `SelectTrigger` links label and control (as in `subscription-form-fields.tsx`).
  - If `FieldRow` does not accept `className` for a grid template (read `src/components/ui/field.tsx:158-190`), drop the `className` and let both columns be equal; report it.
  - If `FormInput` does not forward `size` to `Input` (read `src/components/ui/form.tsx:580-605` — it spreads `...props` into `<Input>`), it does; keep `size="xl"`.
  - Remove the old `FormRadioGroup` "Forma de pagamento" chips and the old "Como informar os valores?" `FormRadioGroup`.

- [ ] **Step 6: Update `radio-group-versions.test.ts:77-82`** — the payment-method test becomes:

```ts
  it("a forma de pagamento é uma escolha única com ausência, e não botões de alternar", () => {
    const tela = lerFonte("src/components/transactions/transaction-form-fields.tsx")
    expect(tela).not.toContain("PaymentMethodChips")
    expect(tela).not.toMatch(/aria-pressed/)
    expect(tela).toMatch(/<SelectItem value=\{PAYMENT_NONE\} variant="none">/)
  })
```

- [ ] **Step 7: Run every check**

Run: `npx vitest run src/components/transactions/ src/components/ui/radio-group-versions.test.ts src/components/ui/date-picker-versions.test.ts && npx tsc --noEmit 2>&1 | grep -v "^\.next/" ; npm run lint 2>&1 | grep -E " error " ; npm run ds:audit -- src/components/transactions`
Expected: tests PASS, no type errors, no lint errors, audit "Nenhum achado" (or only findings that existed before in files this task did not touch — report them).

- [ ] **Step 8: Run the whole suite**

Run: `npm run test:unit`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add src/components/transactions/transaction-form-fields.tsx src/components/transactions/transaction-form-layout.test.ts src/components/ui/radio-group-versions.test.ts
git commit -m "feat(lançamento): os campos em dois blocos, valor alto e forma em lista"
```

---

### Task 5: Verificação no navegador e registro (controlador)

Feita pelo controlador, não por subagente (precisa do painel do navegador logado).

- [ ] Abrir `http://localhost:3000/dashboard`, clicar "Adicionar": conferir título "Nova despesa", trilho `Despesa | Parcelada | Receita`, foco no Valor, ordem dos campos, separador "Detalhes", Data e Forma lado a lado, Cancelar + Salvar; trocar para Parcelada (fileira valor + parcelas, prévia ao digitar) e Receita (sem forma). Fechar com Esc, **sem salvar**.
- [ ] Medir: a 1440×900 o diálogo de Despesa cabe sem rolar (`scrollHeight <= clientHeight` no `[data-slot=dialog-body]`).
- [ ] Telefone (375×812): a gaveta na mesma ordem, Data e Forma empilhadas, sem foco no Valor, Salvar na largura toda.
- [ ] Claro e escuro: nada some.
- [ ] Edição: abrir o detalhe de uma transação existente, "Editar": título "Editar despesa", trilho `Despesa | Receita`, Cancelar volta à visualização. **Não salvar.**
- [ ] Registrar uma linha no `AGENTS.md`? Não: nenhum componente do design system mudou. Commit só se a verificação exigir correção.
