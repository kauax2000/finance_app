"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase, type Category } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { CustomForm } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    MobileSheetFormDragStrip,
    MobileSheetFormStickyHeader,
    mobileFormSheetContentClassName,
} from "@/components/ui/mobile-sheet-form-chrome"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    CATEGORY_COLORS,
    CategoryAppearanceFields,
    CategoryIconPreview,
    normalizeCategoryIcon,
    type CategoryIconId,
} from "@/components/categories/category-appearance-fields"
import { formatYearMonth, periodBoundsFromYearMonth } from "@/lib/budget-month"
import { formatMoneyBrlInput, formatMoneyBrlTyping, parseMoneyBrl } from "@/lib/money-brl"
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
import { Pencil, Plus, Trash2 } from "lucide-react"

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

function StepDots({ step, total }: { step: number; total: number }) {
    return (
        <div className="flex items-center gap-1.5" aria-hidden>
            {Array.from({ length: total }, (_, i) => (
                <span
                    key={i}
                    className={cn(
                        "h-1.5 rounded-full transition-all duration-200",
                        i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/25",
                    )}
                />
            ))}
        </div>
    )
}

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
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/80 px-4 py-2.5 sm:px-5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {stepIndex + 1}/{stepCount}
                </span>
                <StepDots step={stepIndex} total={stepCount} />
            </div>

            <div className="shrink-0 space-y-1 border-b border-border/80 px-4 py-3 sm:px-5">
                <h2 id={titleId} className="text-base font-semibold leading-snug tracking-tight">
                    {title}
                </h2>
                {description ? (
                    <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
                ) : null}
            </div>

            <div className={bodyClassName}>{children}</div>

            <div className="w-full shrink-0 border-t border-border/80 bg-muted/25">
                <div className="px-4 py-3 sm:px-5">{footer}</div>
            </div>
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
    const isMobile = useIsMobile()
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
    const [addColor, setAddColor] = useState<string>(CATEGORY_COLORS[3])
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
    const yearInt = useMemo(() => Number(ym.slice(0, 4)), [ym])
    const monthOfYearInt = useMemo(() => Number(ym.slice(5, 7)), [ym])

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
        setAddColor(CATEGORY_COLORS[3])
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
                "Adicione pelo menos uma categoria de despesa para sugerir limites."
            setError(msg)
            toastWarning(msg)
            return
        }
        const income = parseMoneyBrl(monthlyIncome)
        if (income === null || income <= 0) {
            const msg =
                "Informe uma renda mensal válida em reais para gerar sugestões. Use o passo anterior ou volte com Voltar."
            setError(msg)
            toastError(msg)
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
        toastSuccess("Limites sugeridos com base na renda.")
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

                    const { error: upErr } = await supabase.from("budgets").upsert(
                        {
                            user_id: user.id,
                            workspace_id: workspaceId,
                            category_id: c.id,
                            year: yearInt,
                            month: monthOfYearInt,
                            period_start,
                            period_end,
                            amount: amt,
                        },
                        { onConflict: "user_id,category_id,period_start" },
                    )
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
                .select("*")

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

    const handleDeleteCategory = async (c: Category) => {
        if (!confirm(`Excluir a categoria “${c.name}”?`)) return
        setCrudBusy(true)
        setError(null)
        const { error: delErr } = await supabase.from("categories").delete().eq("id", c.id)
        setCrudBusy(false)
        if (delErr) {
            setError(formatSupabasePostgrestError(delErr) ?? "Não foi possível excluir a categoria.")
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
        <button
            type="button"
            className={cn(
                "text-center text-xs text-muted-foreground underline-offset-4",
                "hover:text-foreground hover:underline",
                "disabled:pointer-events-none disabled:opacity-50",
            )}
            disabled={busy}
            onClick={() => void completeOnboarding(false)}
        >
            Configurar depois
        </button>
    )

    const renderCategoryRow = (c: Category) => {
        const bg = c.color || CATEGORY_COLORS[3]
        return (
            <div
                key={c.id}
                className="flex flex-col gap-2 rounded-lg border border-border/80 bg-background/80 px-2 py-2 sm:flex-row sm:items-center"
            >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 text-white shadow-sm"
                        style={{ backgroundColor: bg }}
                    >
                        <CategoryIconPreview name={c.icon ?? ""} className="h-4 w-4" />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">{c.name}</span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        disabled={crudBusy}
                        aria-label={`Editar ${c.name}`}
                        onClick={() => openEditDialog(c)}
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                </div>
                <div className="flex items-center justify-end gap-2 sm:justify-end">
                    {c.type === "expense" ? (
                        <>
                            <Label htmlFor={`bud-${c.id}`} className="sr-only">
                                Limite {c.name}
                            </Label>
                            <Input
                                id={`bud-${c.id}`}
                                inputMode="decimal"
                                placeholder="0,00"
                                title="Valor em reais (ex.: 1.500,00)"
                                value={amountByCategoryId[c.id] ?? ""}
                                onChange={(e) =>
                                    setAmountByCategoryId((prev) => ({
                                        ...prev,
                                        [c.id]: formatMoneyBrlTyping(e.target.value),
                                    }))
                                }
                                className="h-8 min-w-[6.75rem] w-[6.75rem] shrink-0 text-right text-xs tabular-nums sm:min-w-[7.25rem] sm:w-[7.25rem]"
                            />
                        </>
                    ) : (
                        <span className="text-[11px] text-muted-foreground">Sem orçamento</span>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                        disabled={crudBusy}
                        onClick={() => void handleDeleteCategory(c)}
                        aria-label={`Excluir ${c.name}`}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className={CATEGORIES_ONBOARDING_OUTER_CLASS}>
            {isMobile ? (
                <Sheet open={addOpen} onOpenChange={handleAddOpenChange}>
                    <SheetContent
                        side="bottom"
                        fillMobileViewport
                        showCloseButton
                        className={mobileFormSheetContentClassName}
                    >
                        <MobileSheetFormDragStrip />
                        <MobileSheetFormStickyHeader
                            title="Nova categoria"
                            description="Defina nome, tipo, cor e ícone. Orçamentos ficam no passo seguinte para despesas."
                        />
                        <CustomForm
                            id={ADD_CATEGORY_FORM_ID}
                            className="flex min-h-0 flex-1 flex-col"
                            onSubmit={(ev) => void handleAddSubmit(ev)}
                        >
                            <div className="min-h-0 flex-1 overflow-y-auto px-4">
                                <div className="space-y-4 py-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="onb-add-name">Nome</Label>
                                        <Input
                                            id="onb-add-name"
                                            value={addName}
                                            onChange={(e) => setAddName(e.target.value)}
                                            placeholder="Ex: Alimentação"
                                            required
                                            disabled={crudBusy}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tipo</Label>
                                        <TransactionFormTypeSegment
                                            value={addType}
                                            onChange={setAddType}
                                            disabled={crudBusy}
                                            fullWidth
                                        />
                                    </div>
                                    <CategoryAppearanceFields
                                        color={addColor}
                                        onColorChange={setAddColor}
                                        icon={addIcon}
                                        onIconChange={setAddIcon}
                                    />
                                </div>
                            </div>
                            <SheetFooter className="mt-0 shrink-0 gap-2 border-t border-border/60 px-4 pt-4">
                                <Button type="submit" disabled={crudBusy} className="h-10 w-full">
                                    {crudBusy ? "Salvando…" : "Criar"}
                                </Button>
                            </SheetFooter>
                        </CustomForm>
                    </SheetContent>
                </Sheet>
            ) : (
                <Dialog open={addOpen} onOpenChange={handleAddOpenChange}>
                    <DialogContent className="sm:max-w-md">
                        <CustomForm id={ADD_CATEGORY_FORM_ID} onSubmit={(ev) => void handleAddSubmit(ev)}>
                            <DialogHeader>
                                <DialogTitle>Nova categoria</DialogTitle>
                                <DialogDescription>
                                    Defina nome, tipo, cor e ícone. Orçamentos ficam no passo seguinte para
                                    despesas.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label htmlFor="onb-add-name">Nome</Label>
                                    <Input
                                        id="onb-add-name"
                                        value={addName}
                                        onChange={(e) => setAddName(e.target.value)}
                                        placeholder="Ex: Alimentação"
                                        required
                                        disabled={crudBusy}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <TransactionFormTypeSegment
                                        value={addType}
                                        onChange={setAddType}
                                        disabled={crudBusy}
                                        fullWidth
                                    />
                                </div>
                                <CategoryAppearanceFields
                                    color={addColor}
                                    onColorChange={setAddColor}
                                    icon={addIcon}
                                    onIconChange={setAddIcon}
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={crudBusy}
                                    onClick={() => setAddOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={crudBusy}>
                                    {crudBusy ? "Salvando…" : "Criar"}
                                </Button>
                            </DialogFooter>
                        </CustomForm>
                    </DialogContent>
                </Dialog>
            )}

            {isMobile ? (
                <Sheet
                    open={editOpen && Boolean(editCategoryId)}
                    onOpenChange={handleEditSheetOpenChange}
                >
                    <SheetContent
                        side="bottom"
                        fillMobileViewport
                        showCloseButton
                        className={mobileFormSheetContentClassName}
                    >
                        <MobileSheetFormDragStrip />
                        <MobileSheetFormStickyHeader
                            title="Editar categoria"
                            description="Ajuste nome, tipo, cor e ícone. Para despesas, defina também o limite deste mês."
                        />
                        {editCategoryId ? (
                            <CustomForm
                                id={EDIT_CATEGORY_FORM_ID}
                                onSubmit={(ev) => void handleEditSubmit(ev)}
                                className="flex min-h-0 flex-1 flex-col"
                            >
                                <div className="min-h-0 flex-1 overflow-y-auto px-4">
                                    <div className="space-y-3 py-1">
                                        <div className="space-y-2">
                                            <Label htmlFor="onb-edit-name">Nome</Label>
                                            <Input
                                                id="onb-edit-name"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="text-sm"
                                                required
                                                disabled={crudBusy}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tipo</Label>
                                            <TransactionFormTypeSegment
                                                value={editType}
                                                onChange={setEditType}
                                                disabled={crudBusy}
                                                fullWidth
                                            />
                                        </div>
                                        <CategoryAppearanceFields
                                            color={editColor}
                                            onColorChange={setEditColor}
                                            icon={editIcon}
                                            onIconChange={setEditIcon}
                                        />
                                        {editType === "expense" ? (
                                            <div className="space-y-2">
                                                <Label htmlFor={`onb-edit-bud-${editCategoryId}`}>
                                                    Limite no mês (R$)
                                                </Label>
                                                <Input
                                                    id={`onb-edit-bud-${editCategoryId}`}
                                                    inputMode="decimal"
                                                    placeholder="0,00"
                                                    title="Valor em reais (ex.: 1.500,00)"
                                                    value={amountByCategoryId[editCategoryId] ?? ""}
                                                    onChange={(e) =>
                                                        setAmountByCategoryId((prev) => ({
                                                            ...prev,
                                                            [editCategoryId]: formatMoneyBrlTyping(
                                                                e.target.value,
                                                            ),
                                                        }))
                                                    }
                                                    className="text-sm tabular-nums"
                                                    disabled={crudBusy}
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <SheetFooter className="mt-0 shrink-0 gap-2 border-t border-border/60 px-4 pt-4">
                                    <Button type="submit" disabled={crudBusy} className="h-10 w-full">
                                        {crudBusy ? "Salvando…" : "Salvar"}
                                    </Button>
                                </SheetFooter>
                            </CustomForm>
                        ) : null}
                    </SheetContent>
                </Sheet>
            ) : (
                <Dialog
                    open={editOpen && Boolean(editCategoryId)}
                    onOpenChange={handleEditSheetOpenChange}
                >
                    <DialogContent className="sm:max-w-md">
                        {editCategoryId ? (
                            <CustomForm
                                id={EDIT_CATEGORY_FORM_ID}
                                onSubmit={(ev) => void handleEditSubmit(ev)}
                                className="space-y-4"
                            >
                                <DialogHeader>
                                    <DialogTitle>Editar categoria</DialogTitle>
                                    <DialogDescription>
                                        Ajuste nome, tipo, cor e ícone. Para despesas, defina também o limite
                                        deste mês.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3 py-1">
                                    <div className="space-y-2">
                                        <Label htmlFor="onb-edit-name">Nome</Label>
                                        <Input
                                            id="onb-edit-name"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="text-sm"
                                            required
                                            disabled={crudBusy}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tipo</Label>
                                        <TransactionFormTypeSegment
                                            value={editType}
                                            onChange={setEditType}
                                            disabled={crudBusy}
                                            fullWidth
                                        />
                                    </div>
                                    <CategoryAppearanceFields
                                        color={editColor}
                                        onColorChange={setEditColor}
                                        icon={editIcon}
                                        onIconChange={setEditIcon}
                                    />
                                    {editType === "expense" ? (
                                        <div className="space-y-2">
                                            <Label htmlFor={`onb-edit-bud-${editCategoryId}`}>
                                                Limite no mês (R$)
                                            </Label>
                                            <Input
                                                id={`onb-edit-bud-${editCategoryId}`}
                                                inputMode="decimal"
                                                placeholder="0,00"
                                                title="Valor em reais (ex.: 1.500,00)"
                                                value={amountByCategoryId[editCategoryId] ?? ""}
                                                onChange={(e) =>
                                                    setAmountByCategoryId((prev) => ({
                                                        ...prev,
                                                        [editCategoryId]: formatMoneyBrlTyping(
                                                            e.target.value,
                                                        ),
                                                    }))
                                                }
                                                className="text-sm tabular-nums"
                                                disabled={crudBusy}
                                            />
                                        </div>
                                    ) : null}
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={crudBusy}
                                        onClick={() => closeEditDialog()}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={crudBusy}>
                                        {crudBusy ? "Salvando…" : "Salvar"}
                                    </Button>
                                </DialogFooter>
                            </CustomForm>
                        ) : null}
                    </DialogContent>
                </Dialog>
            )}

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
                        {error && step !== 1 ? (
                            <p className="text-center text-xs text-destructive">{error}</p>
                        ) : null}
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
                                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full sm:w-auto"
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
                                    variant="outline"
                                    size="sm"
                                    className="w-full sm:w-auto"
                                    disabled={busy}
                                    onClick={() => setStep(1)}
                                >
                                    Voltar
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="w-full sm:w-auto"
                                    disabled={busy}
                                    onClick={() =>
                                        void completeOnboarding(
                                            expenseCategories.some((c) => {
                                                const raw = (amountByCategoryId[c.id] ?? "").trim()
                                                const amt =
                                                    raw === "" ? null : parseMoneyBrl(raw)
                                                return amt !== null && amt > 0
                                            }),
                                        )
                                    }
                                >
                                    {busy ? "Salvando…" : "Concluir"}
                                </Button>
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
                        className="space-y-2"
                    >
                        <Label htmlFor="income" className="text-xs">
                            Estimativa mensal (R$)
                        </Label>
                        <Input
                            id="income"
                            inputMode="decimal"
                            placeholder="Ex: 5.000 ou 5000"
                            value={monthlyIncome}
                            onChange={(e) => setMonthlyIncome(formatMoneyBrlTyping(e.target.value))}
                            className="text-sm"
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
                                    <Plus className="mr-1 h-3.5 w-3.5" />
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
                            {error ? (
                                <p className="pt-2 text-center text-xs text-destructive">{error}</p>
                            ) : null}
                        </div>

                        {localCategories.length === 0 ? (
                            <p className="shrink-0 rounded-lg border border-dashed border-border/80 bg-muted/15 px-3 py-4 text-center text-xs text-muted-foreground">
                                Nenhuma categoria. Use &quot;Adicionar categoria&quot; para criar receitas e
                                despesas.
                            </p>
                        ) : (
                            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5">
                                <div className="space-y-4 pb-1">
                                    {incomeCategories.length > 0 ? (
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                Receitas
                                            </p>
                                            <div className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-2">
                                                {incomeCategories.map((c) => renderCategoryRow(c))}
                                            </div>
                                        </div>
                                    ) : null}
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            Despesas
                                        </p>
                                        {expenseCategories.length === 0 ? (
                                            <p className="rounded-lg border border-dashed border-border/80 bg-muted/15 px-3 py-4 text-center text-xs text-muted-foreground">
                                                Nenhuma categoria de despesa. Adicione ao menos uma para
                                                continuar.
                                            </p>
                                        ) : (
                                            <div className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-2">
                                                {expenseCategories.map((c) => renderCategoryRow(c))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CustomForm>
                ) : null}

                {step === 2 ? (
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain rounded-xl border border-border/50 bg-muted/10 p-2">
                        {expenseCategories.map((c) => {
                            const raw = (amountByCategoryId[c.id] ?? "").trim()
                            const amt = raw === "" ? null : parseMoneyBrl(raw)
                            if (amt === null || amt <= 0) return null
                            const formatted = amt.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                            })
                            const bg = c.color || CATEGORY_COLORS[3]
                            return (
                                <div
                                    key={c.id}
                                    className={cn(
                                        "flex flex-col gap-2 rounded-lg border border-border/80 bg-background/80 px-3 py-2.5",
                                        "sm:flex-row sm:items-center sm:justify-between sm:gap-3",
                                    )}
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                        <div
                                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/50 text-white"
                                            style={{ backgroundColor: bg }}
                                            aria-hidden
                                        >
                                            <CategoryIconPreview
                                                name={c.icon ?? ""}
                                                className="h-3.5 w-3.5"
                                            />
                                        </div>
                                        <span className="min-w-0 truncate text-sm font-medium text-foreground">
                                            {c.name}
                                        </span>
                                    </div>
                                    <div className="flex shrink-0 flex-col gap-0.5 sm:items-end">
                                        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
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
                            <p className="rounded-lg border border-dashed border-border/80 bg-background/40 px-3 py-4 text-center text-xs leading-relaxed text-muted-foreground">
                                Nenhum orçamento neste passo — você pode definir depois.
                            </p>
                        ) : null}
                        </div>
                    </div>
                ) : null}
            </OnboardingDialogPanel>

            {step === 2 ? (
                <div className="mt-4 flex justify-center">{skipLink}</div>
            ) : null}
        </div>
    )
}
