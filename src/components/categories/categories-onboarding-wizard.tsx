"use client"

import { deleteCategoryById } from "@/lib/categories/mutations"
import {
    EmptyState,
    EmptyStateDescription,
} from "@/components/ui/empty-state"
import {
    Field,
    FieldControl,
    FieldLabel,
} from "@/components/ui/field"
import { useConfirmDialog } from "@/components/use-confirm-dialog"
import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/16/solid"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase, type Category } from "@/lib/supabase"
import { Card, CardMessage, CardNote } from "@/components/ui/card"
import { ColorTile } from "@/components/ui/color-tile"
import { Button } from "@/components/ui/button"
import { CustomForm, FormCancel, FormError, FormInput, FormSubmit } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSteps,
  DialogTitle,
} from "@/components/ui/dialog"
import {
    CATEGORY_COLORS,
    CategoryAppearanceFields,
    CategoryIconPreview,
    normalizeCategoryIcon,
    type CategoryIconId,
} from "@/components/categories/category-appearance-fields"
import { formatYearMonth, periodBoundsFromYearMonth } from "@/lib/budget-month"
import { upsertCategoryBudget } from "@/lib/category-budget-ops"
import { formatMoneyBrlInput, parseMoneyBrl } from "@/lib/money-brl"
import {
    formatSupabasePostgrestError,
    isPostgrestRpcFunctionNotFoundError,
} from "@/lib/supabase-errors"
import { toastError, toastSuccess, toastWarning } from "@/lib/toast"
import { TransactionFormTypeSegment } from "@/components/transactions/transaction-type-segment"
import { invokeEdgeJson } from "@/lib/edge-invoke"
import {
    CATEGORIES_ONBOARDING_OUTER_CLASS,
    CATEGORIES_ONBOARDING_PANEL_CARD_CLASS,
    categoriesOnboardingPanelShellClass,
} from "@/components/categories/categories-onboarding-panel-styles"
import { cn } from "@/lib/utils"
import { currencyBRL } from "@/lib/formatters"
import { TILE_EXPENSE_DEFAULT } from "@/lib/tile-palette"
type Props = {
    user: User
    workspaceId: string
    categories: Category[]
    onFinished: () => void
    /** Refetch categories in parent after insert/update/delete during onboarding. */
    onCategoriesUpdated?: () => void | Promise<void>
}

const STEP0_FORM_ID = "categories-onboarding-income-form"
const STEP_FORM_ID = "categories-onboarding-budgets-form"
const ADD_CATEGORY_FORM_ID = "categories-onboarding-add-category-form"
const EDIT_CATEGORY_FORM_ID = "categories-onboarding-edit-category-form"
const REVIEW_FORM_ID = "categories-onboarding-review-form"

const DEFAULT_EXPENSE_SHARES: Record<string, number> = {
    Alimentação: 0.22,
    Transporte: 0.12,
    Moradia: 0.35,
    Lazer: 0.08,
    Saúde: 0.1,
    Educação: 0.08,
    Outros: 0.05,
}

function sortCategories(a: Category, b: Category): number {
    const t = a.type.localeCompare(b.type)
    if (t !== 0) return t
    return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
}

/** O nome de cada passo, na contagem do `DialogSteps`. */
const STEP_LABELS = ["Renda", "Categorias", "Revisão"]

type PanelProps = {
    stepIndex: number
    stepCount: number
    title: string
    description?: string
    children: React.ReactNode
    footer: React.ReactNode
    titleId: string
}

function OnboardingDialogPanel({
    stepIndex,
    stepCount,
    title,
    description,
    children,
    footer,
    titleId,
}: PanelProps) {
    const bodyClassName =
        stepIndex === 0
            ? "shrink-0 px-4 py-3 sm:px-5"
            : "flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3 sm:px-5"
    return (
        <div
            className={cn(
                categoriesOnboardingPanelShellClass(stepIndex),
                CATEGORIES_ONBOARDING_PANEL_CARD_CLASS,
            )}
            role="dialog"
            aria-modal="false"
            aria-labelledby={titleId}
        >
            <div className="shrink-0 space-y-1 border-b border-border/80 px-4 py-3 sm:px-5">
                {/* A contagem e a barra segmentada do diálogo, no lugar do "1/3"
                    com os pontos escritos à mão. O painel não é um `Dialog` (mora
                    na página), mas a peça é só marcação e serve igual. */}
                <DialogSteps current={stepIndex} total={stepCount} labels={STEP_LABELS} />
                <h2 id={titleId} className="text-base font-semibold leading-snug tracking-tight">
                    {title}
                </h2>
                {description ? (
                    <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
                ) : null}
            </div>

            <div className={bodyClassName}>{children}</div>

            <CardNote>
                <div className="px-4 py-3 sm:px-5">{footer}</div>
            </CardNote>
        </div>
    )
}

function nextUniqueCategoryName(existing: Category[]): string {
    const base = "Nova categoria"
    if (!existing.some((c) => c.name === base)) return base
    let n = 2
    while (existing.some((c) => c.name === `${base} (${n})`)) {
        n += 1
    }
    return `${base} (${n})`
}

export function CategoriesOnboardingWizard({
    user,
    workspaceId,
    categories,
    onFinished,
    onCategoriesUpdated,
}: Props) {
    const [step, setStep] = useState(0)
    const [monthlyIncome, setMonthlyIncome] = useState("")
    const [amountByCategoryId, setAmountByCategoryId] = useState<Record<string, string>>({})
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [localCategories, setLocalCategories] = useState<Category[]>(categories)
    const [crudBusy, setCrudBusy] = useState(false)

    const [addOpen, setAddOpen] = useState(false)
    const [addName, setAddName] = useState("")
    const [addType, setAddType] = useState<"income" | "expense">("expense")
    const [addColor, setAddColor] = useState<string>(TILE_EXPENSE_DEFAULT)
    const [addIcon, setAddIcon] = useState<CategoryIconId>(normalizeCategoryIcon("utensils"))

    const [editOpen, setEditOpen] = useState(false)
    const [editCategoryId, setEditCategoryId] = useState<string | null>(null)
    const [editName, setEditName] = useState("")
    const [editType, setEditType] = useState<"income" | "expense">("expense")
    const [editColor, setEditColor] = useState<string>(CATEGORY_COLORS[0])
    const [editIcon, setEditIcon] = useState<CategoryIconId>(normalizeCategoryIcon(null))

    useEffect(() => {
        setLocalCategories([...categories].sort(sortCategories))
    }, [categories])

    const ym = useMemo(() => formatYearMonth(new Date()), [])
    const { period_start, period_end } = useMemo(() => periodBoundsFromYearMonth(ym), [ym])

    const expenseCategories = useMemo(
        () => localCategories.filter((c) => c.type === "expense"),
        [localCategories],
    )
    const incomeCategories = useMemo(
        () => localCategories.filter((c) => c.type === "income"),
        [localCategories],
    )

    const notifyCategoriesUpdated = useCallback(async () => {
        await onCategoriesUpdated?.()
    }, [onCategoriesUpdated])

    const openAddDialog = () => {
        setError(null)
        setAddName(nextUniqueCategoryName(localCategories))
        setAddType("expense")
        setAddColor(TILE_EXPENSE_DEFAULT)
        setAddIcon(normalizeCategoryIcon("utensils"))
        setAddOpen(true)
    }

    const openEditDialog = (c: Category) => {
        setError(null)
        setEditCategoryId(c.id)
        setEditName(c.name)
        setEditType(c.type)
        setEditColor(c.color || CATEGORY_COLORS[0])
        setEditIcon(normalizeCategoryIcon(c.icon))
        setEditOpen(true)
    }

    const closeEditDialog = () => {
        setEditOpen(false)
        setEditCategoryId(null)
    }

    const handleAddOpenChange = (next: boolean) => {
        if (!next && crudBusy) return
        setAddOpen(next)
    }

    const handleEditSheetOpenChange = (open: boolean) => {
        if (!open && crudBusy) return
        if (!open) closeEditDialog()
    }

    const applyIncomeSuggestions = () => {
        if (expenseCategories.length === 0) {
            const msg =
                "Adicione pelo menos uma categoria de despesa para sugerir limites"
            setError(msg)
            toastWarning(msg, { id: "sugerir-limites" })
            return
        }
        const income = parseMoneyBrl(monthlyIncome)
        if (income === null || income <= 0) {
            const msg =
                "Informe uma renda mensal válida em reais para gerar sugestões. Use o passo anterior ou volte com Voltar."
            setError(msg)
            toastError(msg, { id: "sugerir-limites" })
            return
        }
        setError(null)
        const next: Record<string, string> = { ...amountByCategoryId }
        for (const c of expenseCategories) {
            const share = DEFAULT_EXPENSE_SHARES[c.name] ?? 0.08
            const suggested = Math.round(income * share * 100) / 100
            next[c.id] = formatMoneyBrlInput(suggested)
        }
        setAmountByCategoryId(next)
        toastSuccess("Limites sugeridos com base na renda", { id: "sugerir-limites" })
    }

    const completeOnboarding = async (saveBudgets: boolean) => {
        setBusy(true)
        setError(null)
        try {
            if (saveBudgets) {
                for (const c of expenseCategories) {
                    const raw = (amountByCategoryId[c.id] ?? "").trim()
                    const amt = raw === "" ? null : parseMoneyBrl(raw)
                    if (amt === null || amt <= 0) continue

                    // Caminho único de escrita de orçamento (gateway offline +
                    // conflito por workspace/categoria/mês).
                    const { error: upErr } = await upsertCategoryBudget({
                        userId: user.id,
                        workspaceId,
                        categoryId: c.id,
                        yearMonth: ym,
                        amount: amt,
                    })
                    if (upErr) {
                        setError(
                            formatSupabasePostgrestError(upErr) ??
                                "Não foi possível salvar um dos orçamentos.",
                        )
                        setBusy(false)
                        return
                    }
                }
            }

            const { error: rpcErr } = await supabase.rpc(
                "complete_workspace_categories_onboarding",
                { p_workspace_id: workspaceId },
            )
            if (rpcErr) {
                if (isPostgrestRpcFunctionNotFoundError(rpcErr)) {
                    // Fallback: try direct update (may fail under RLS depending on your policies).
                    const nowIso = new Date().toISOString()
                    const { error: updErr } = await supabase
                        .from("workspaces")
                        .update({ categories_onboarding_completed_at: nowIso, updated_at: nowIso })
                        .eq("id", workspaceId)

                    if (!updErr) {
                        onFinished()
                        return
                    }

                    setError(
                        "Seu projeto Supabase está desatualizado em relação ao app: faltam a coluna `workspaces.categories_onboarding_completed_at` e a função `complete_workspace_categories_onboarding` (PostgREST não as enxerga no schema cache). Aplique a migration `supabase/migrations/20260409120000_workspace_categories_onboarding.sql` nesse projeto e, em seguida, recarregue o schema da API (Settings → API → Reload schema).",
                    )
                    setBusy(false)
                    return
                }
                setError(
                    formatSupabasePostgrestError(rpcErr) ??
                        "Não foi possível concluir a configuração. Tente novamente.",
                )
                setBusy(false)
                return
            }

            onFinished()
        } finally {
            setBusy(false)
        }
    }

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = addName.trim()
        if (!trimmed) {
            setError("Informe um nome para a categoria.")
            return
        }
        setCrudBusy(true)
        setError(null)
        try {
            const { data, error: insErr } = await supabase
                .from("categories")
                .insert({
                    user_id: user.id,
                    workspace_id: workspaceId,
                    name: trimmed,
                    type: addType,
                    color: addColor,
                    icon: addIcon,
                })
                .select("color, created_at, icon, id, name, type, updated_at, user_id, workspace_id")

            const row = data?.[0] as Category | undefined

            if (insErr) {
                setError(
                    formatSupabasePostgrestError(insErr) ??
                        "Não foi possível criar a categoria.",
                )
                return
            }

            if (row) {
                setLocalCategories((prev) => [...prev, row].sort(sortCategories))
                void invokeEdgeJson("dispatch-notifications", {
                    body: {
                        workspace_id: workspaceId,
                        type: "system",
                        title: "Categoria criada",
                        body: `Você criou a categoria “${trimmed}”.`,
                        metadata: {
                            kind: "category_created",
                            critical: false,
                        },
                    },
                }).catch(() => {
                    /* non-blocking */
                })
            }

            setAddOpen(false)
            await notifyCategoriesUpdated()
        } finally {
            setCrudBusy(false)
        }
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editCategoryId) return
        const original = localCategories.find((c) => c.id === editCategoryId)
        if (!original) return

        const trimmed = editName.trim()
        if (!trimmed) {
            setError("Informe um nome para a categoria.")
            return
        }

        setCrudBusy(true)
        setError(null)
        try {
            const { error: upErr } = await supabase
                .from("categories")
                .update({
                    name: trimmed,
                    type: editType,
                    color: editColor,
                    icon: editIcon,
                })
                .eq("id", editCategoryId)

            if (upErr) {
                setError(
                    formatSupabasePostgrestError(upErr) ??
                        "Não foi possível atualizar a categoria.",
                )
                return
            }

            if (original.type === "expense" && editType === "income") {
                setAmountByCategoryId((prev) => {
                    const next = { ...prev }
                    delete next[editCategoryId]
                    return next
                })
            }

            setLocalCategories((prev) =>
                prev
                    .map((c) =>
                        c.id === editCategoryId
                            ? {
                                  ...c,
                                  name: trimmed,
                                  type: editType,
                                  color: editColor,
                                  icon: editIcon,
                              }
                            : c,
                    )
                    .sort(sortCategories),
            )
            closeEditDialog()
            await notifyCategoriesUpdated()
        } finally {
            setCrudBusy(false)
        }
    }

    const { confirm: confirmAction, dialog: confirmDialog } = useConfirmDialog()
    const handleDeleteCategory = async (c: Category) => {
        const ok = await confirmAction({
            title: `Excluir a categoria “${c.name}”?`,
            actionLabel: "Excluir",
        })
        if (!ok) return
        setCrudBusy(true)
        setError(null)
        // Pela mutação do app: ela passa pela fila offline e pela carteira, e a
        // exclusão direta pelo client não passava por nenhuma das duas.
        const res = await deleteCategoryById(c.id, workspaceId)
        setCrudBusy(false)
        if (!res.ok) {
            setError(res.errorMessage)
            return
        }
        setLocalCategories((prev) => prev.filter((x) => x.id !== c.id))
        setAmountByCategoryId((prev) => {
            const next = { ...prev }
            delete next[c.id]
            return next
        })
        if (editCategoryId === c.id) closeEditDialog()
        void notifyCategoriesUpdated()
    }

    const skipLink = (
        <Button
            type="button"
            variant="link"
            size="xs"
            className="text-muted-foreground hover:text-foreground active:text-foreground"
            disabled={busy}
            onClick={() => void completeOnboarding(false)}
        >
            Configurar depois
        </Button>
    )

    const renderCategoryRow = (c: Category) => {
        const bg = c.color || TILE_EXPENSE_DEFAULT
        return (
            <div
                key={c.id}
                className="flex flex-col gap-2 rounded-row border border-border/80 bg-background/80 px-2 py-2 sm:flex-row sm:items-center"
            >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <ColorTile color={bg} className="shrink-0">
                        <CategoryIconPreview name={c.icon ?? ""} />
                    </ColorTile>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">{c.name}</span>
                    <Button
                        type="button"
                        variant="tertiary"
                        size="icon-lg"
                        className="h-8 w-8 shrink-0"
                        disabled={crudBusy}
                        aria-label={`Editar ${c.name}`}
                        onClick={() => openEditDialog(c)}
                    >
                        <PencilIcon className="h-3.5 w-3.5" />
                    </Button>
                </div>
                <div className="flex items-center justify-end gap-2 sm:justify-end">
                    {c.type === "expense" ? (
                        // Horizontal, e não vertical: o vertical dá `w-full` aos filhos, e o
                        // campo tem largura fixa na linha.
                        <Field orientation="horizontal" className="w-auto shrink-0 gap-0">
                            <FieldLabel className="sr-only">Limite {c.name}</FieldLabel>
                            <FieldControl>
                            <Input
                                money
                                id={`bud-${c.id}`}
                                placeholder="0,00"
                                title="Valor em reais (ex.: 1.500,00)"
                                value={amountByCategoryId[c.id] ?? ""}
                                onValueChange={(masked) =>
                                    setAmountByCategoryId((prev) => ({
                                        ...prev,
                                        [c.id]: masked,
                                    }))
                                }
                                className="min-w-[6.75rem] w-[6.75rem] shrink-0 text-right sm:min-w-[7.25rem] sm:w-[7.25rem]"
                            />
                            </FieldControl>
                        </Field>
                    ) : (
                        <span className="text-2xs text-muted-foreground">Sem orçamento</span>
                    )}
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon-lg"
                        className="h-8 w-8 shrink-0"
                        disabled={crudBusy}
                        onClick={() => void handleDeleteCategory(c)}
                        aria-label={`Excluir ${c.name}`}
                    >
                        <TrashIcon className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className={CATEGORIES_ONBOARDING_OUTER_CLASS}>
            {confirmDialog}
            {/* Um diálogo só: `surface="auto"` faz dele a gaveta do telefone, e
                `pending` segura o fechar enquanto a categoria é gravada. */}
            <Dialog surface="auto" open={addOpen} onOpenChange={handleAddOpenChange} pending={crudBusy}>
                <DialogContent layout="fixed">
                    <DialogHeader>
                        <DialogTitle>Nova categoria</DialogTitle>
                        <DialogDescription>
                            Defina nome, tipo, cor e ícone. Orçamentos ficam no passo seguinte para
                            despesas.
                        </DialogDescription>
                    </DialogHeader>
                    <CustomForm
                        id={ADD_CATEGORY_FORM_ID}
                        pending={crudBusy}
                        className="flex min-h-0 flex-1 flex-col"
                        onSubmit={(ev) => void handleAddSubmit(ev)}
                    >
                        <DialogBody>
                            <div className="space-y-4">
                                <FormInput
                                    id="onb-add-name"
                                    label="Nome"
                                    value={addName}
                                    onChange={(e) => setAddName(e.target.value)}
                                    placeholder="Ex: Alimentação"
                                    required
                                    disabled={crudBusy}
                                />
                                <TransactionFormTypeSegment
                                    value={addType}
                                    onChange={setAddType}
                                    disabled={crudBusy}
                                />
                                <CategoryAppearanceFields
                                    color={addColor}
                                    onColorChange={setAddColor}
                                    icon={addIcon}
                                    onIconChange={setAddIcon}
                                />
                            </div>
                        </DialogBody>
                        <DialogFooter>
                            <FormCancel onClick={() => setAddOpen(false)}>Cancelar</FormCancel>
                            <FormSubmit pendingLabel="Salvando…">Criar</FormSubmit>
                        </DialogFooter>
                    </CustomForm>
                </DialogContent>
            </Dialog>

            <Dialog
                surface="auto"
                open={editOpen && Boolean(editCategoryId)}
                onOpenChange={handleEditSheetOpenChange}
                pending={crudBusy}
            >
                <DialogContent layout="fixed">
                    <DialogHeader>
                        <DialogTitle>Editar categoria</DialogTitle>
                        <DialogDescription>
                            Ajuste nome, tipo, cor e ícone. Para despesas, defina também o limite
                            deste mês.
                        </DialogDescription>
                    </DialogHeader>
                    {editCategoryId ? (
                        <CustomForm
                            id={EDIT_CATEGORY_FORM_ID}
                            pending={crudBusy}
                            onSubmit={(ev) => void handleEditSubmit(ev)}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <DialogBody>
                                <div className="space-y-3">
                                    <FormInput
                                        id="onb-edit-name"
                                        label="Nome"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="text-sm"
                                        required
                                        disabled={crudBusy}
                                    />
                                    <TransactionFormTypeSegment
                                        value={editType}
                                        onChange={setEditType}
                                        disabled={crudBusy}
                                    />
                                    <CategoryAppearanceFields
                                        color={editColor}
                                        onColorChange={setEditColor}
                                        icon={editIcon}
                                        onIconChange={setEditIcon}
                                    />
                                    {editType === "expense" ? (
                                        <FormInput
                                            money
                                            label="Limite no mês (R$)"
                                            placeholder="0,00"
                                            title="Valor em reais (ex.: 1.500,00)"
                                            value={amountByCategoryId[editCategoryId] ?? ""}
                                            onValueChange={(masked) =>
                                                setAmountByCategoryId((prev) => ({
                                                    ...prev,
                                                    [editCategoryId]: masked,
                                                }))
                                            }
                                            disabled={crudBusy}
                                        />
                                    ) : null}
                                </div>
                            </DialogBody>
                            <DialogFooter>
                                <FormCancel onClick={() => closeEditDialog()}>Cancelar</FormCancel>
                                <FormSubmit pendingLabel="Salvando…">Salvar</FormSubmit>
                            </DialogFooter>
                        </CustomForm>
                    ) : null}
                </DialogContent>
            </Dialog>

            <OnboardingDialogPanel
                stepIndex={step}
                stepCount={3}
                title={
                    step === 0
                        ? "Renda mensal"
                        : step === 1
                          ? "Categorias e limites"
                          : "Confirmar"
                }
                description={
                    step === 0
                        ? "Opcional. Usamos só para sugerir valores de orçamento no próximo passo."
                        : step === 1
                          ? `Mês ${ym}. Ajuste tipo, cor e ícone, limites para despesas, ou adicione categorias.`
                          : `Período ${period_start} — ${period_end}. Você pode editar depois em Categorias.`
                }
                titleId="onboarding-step-title"
                footer={
                    <div className="flex flex-col gap-3">
                        <FormError className="text-center text-xs">
                            {step !== 1 ? error : null}
                        </FormError>
                        {step === 0 ? (
                            <div className="flex flex-col gap-2">
                                <Button
                                    type="submit"
                                    form={STEP0_FORM_ID}
                                    className="w-full"
                                    disabled={busy}
                                >
                                    Continuar
                                </Button>
                                <div className="flex justify-center">{skipLink}</div>
                            </div>
                        ) : null}
                        {step === 1 ? (
                            <>
                                {/* A forma do `DialogFooter start`: "Voltar" encostado à
                                    esquerda no desktop e embaixo no telefone. */}
                                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="tertiary"
                                        size="sm"
                                        className="w-full sm:me-auto sm:w-auto"
                                        disabled={busy || crudBusy}
                                        onClick={() => setStep(0)}
                                    >
                                        Voltar
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="w-full sm:w-auto"
                                        disabled={
                                            busy || crudBusy || expenseCategories.length === 0
                                        }
                                        form={STEP_FORM_ID}
                                    >
                                        Revisar
                                    </Button>
                                </div>
                                <div className="flex justify-center border-t border-border/60 pt-2">
                                    {skipLink}
                                </div>
                            </>
                        ) : null}
                        {step === 2 ? (
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="tertiary"
                                    size="sm"
                                    className="w-full sm:me-auto sm:w-auto"
                                    disabled={busy}
                                    onClick={() => setStep(1)}
                                >
                                    Voltar
                                </Button>
                                <FormSubmit
                                    form={REVIEW_FORM_ID}
                                    pending={busy}
                                    pendingLabel="Salvando…"
                                    size="sm"
                                    className="w-full sm:w-auto"
                                >
                                    Concluir
                                </FormSubmit>
                            </div>
                        ) : null}
                    </div>
                }
            >
                {step === 0 ? (
                    <CustomForm
                        id={STEP0_FORM_ID}
                        onSubmit={(e) => {
                            e.preventDefault()
                            setError(null)
                            setStep(1)
                        }}
                    >
                        <FormInput
                            money
                            fieldSize="sm"
                            label="Estimativa mensal (R$)"
                            placeholder="Ex: 5.000 ou 5000"
                            value={monthlyIncome}
                            onValueChange={setMonthlyIncome}
                        />
                    </CustomForm>
                ) : null}

                {step === 1 ? (
                    <CustomForm
                        id={STEP_FORM_ID}
                        onSubmit={(e) => {
                            e.preventDefault()
                            if (expenseCategories.length === 0) {
                                setError("Adicione pelo menos uma categoria de despesa.")
                                return
                            }
                            setError(null)
                            setStep(2)
                        }}
                        className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
                    >
                        <div className="shrink-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 flex-1 text-xs sm:flex-none"
                                    disabled={busy || crudBusy}
                                    onClick={() => openAddDialog()}
                                >
                                    <PlusIcon className="mr-1 h-3.5 w-3.5" />
                                    Adicionar categoria
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 flex-1 text-xs sm:flex-none"
                                    disabled={busy || crudBusy}
                                    onClick={applyIncomeSuggestions}
                                >
                                    Sugerir pela renda
                                </Button>
                            </div>
                            <FormError className="pt-2 text-center text-xs">{error}</FormError>
                        </div>

                        {localCategories.length === 0 ? (
                            <EmptyState size="sm" className="shrink-0">
                                <EmptyStateDescription>
                                    Nenhuma categoria. Use &quot;Adicionar categoria&quot; para criar receitas e
                                    despesas.
                                </EmptyStateDescription>
                            </EmptyState>
                        ) : (
                            <DialogBody className="pr-0.5">
                                <div className="space-y-4 pb-1">
                                    {incomeCategories.length > 0 ? (
                                        <div className="space-y-2">
                                            <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Receitas
                                            </p>
                                            <div className="space-y-2 rounded-row-lg border border-border/50 bg-muted/10 p-2">
                                                {incomeCategories.map((c) => renderCategoryRow(c))}
                                            </div>
                                        </div>
                                    ) : null}
                                    <div className="space-y-2">
                                        <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Despesas
                                        </p>
                                        {expenseCategories.length === 0 ? (
                                            <EmptyState size="sm">
                                                <EmptyStateDescription>
                                                    Nenhuma categoria de despesa. Adicione ao menos uma para
                                                    continuar.
                                                </EmptyStateDescription>
                                            </EmptyState>
                                        ) : (
                                            <div className="space-y-2 rounded-row-lg border border-border/50 bg-muted/10 p-2">
                                                {expenseCategories.map((c) => renderCategoryRow(c))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </DialogBody>
                        )}
                    </CustomForm>
                ) : null}

                {step === 2 ? (
                    // Um formulário para o "Concluir" ser o `FormSubmit` do rodapé,
                    // com o andamento dele; não há campo aqui.
                    <CustomForm
                        id={REVIEW_FORM_ID}
                        pending={busy}
                        onSubmit={(e) => {
                            e.preventDefault()
                            void completeOnboarding(
                                expenseCategories.some((c) => {
                                    const raw = (amountByCategoryId[c.id] ?? "").trim()
                                    const amt = raw === "" ? null : parseMoneyBrl(raw)
                                    return amt !== null && amt > 0
                                }),
                            )
                        }}
                        className="flex min-h-0 flex-1 flex-col overflow-hidden"
                    >
                        {/* Poço de rolagem à mão de propósito, como as duas listas do
                            passo 1: o `overflow-hidden` do `Card` recortaria a rolagem. */}
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain rounded-row-lg border border-border/50 bg-muted/10 p-2">
                        {expenseCategories.map((c) => {
                            const raw = (amountByCategoryId[c.id] ?? "").trim()
                            const amt = raw === "" ? null : parseMoneyBrl(raw)
                            if (amt === null || amt <= 0) return null
                            const formatted = currencyBRL(amt)
                            const bg = c.color || TILE_EXPENSE_DEFAULT
                            return (
                                <div
                                    key={c.id}
                                    className={cn(
                                        "flex flex-col gap-2 rounded-row border border-border/80 bg-background/80 px-3 py-2.5",
                                        "sm:flex-row sm:items-center sm:justify-between sm:gap-3",
                                    )}
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                        <ColorTile
                                            color={bg}
                                            className="shrink-0"
                                        >
                                            <CategoryIconPreview name={c.icon ?? ""} />
                                        </ColorTile>
                                        <span className="min-w-0 truncate text-sm font-medium text-foreground">
                                            {c.name}
                                        </span>
                                    </div>
                                    <div className="flex shrink-0 flex-col gap-0.5 sm:items-end">
                                        <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Limite
                                        </span>
                                        <span className="tabular-nums text-sm font-semibold text-foreground">
                                            {formatted}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                        {expenseCategories.every((c) => {
                            const raw = (amountByCategoryId[c.id] ?? "").trim()
                            const amt = raw === "" ? null : parseMoneyBrl(raw)
                            return amt === null || amt <= 0
                        }) ? (
                            <Card variant="dashed" padding="none">
                                <CardMessage className="py-4 text-center text-xs leading-relaxed">
                                    Nenhum orçamento neste passo — você pode definir depois.
                                </CardMessage>
                            </Card>
                        ) : null}
                        </div>
                    </CustomForm>
                ) : null}
            </OnboardingDialogPanel>

            {step === 2 ? (
                <div className="mt-4 flex justify-center">{skipLink}</div>
            ) : null}
        </div>
    )
}
