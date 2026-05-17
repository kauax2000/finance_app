"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import {
    CATEGORY_COLORS,
    CATEGORY_ICONS,
    CategoryAppearanceFields,
    type CategoryIconId,
} from "@/components/categories/category-appearance-fields"
import {
    TransactionFormTypeSegment,
} from "@/components/transactions/transaction-type-segment"
import { CustomForm } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
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
import { supabase } from "@/lib/supabase"
import { upsertCategoryBudget } from "@/lib/category-budget-ops"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import {
    formatYearMonth,
    periodBoundsFromYearMonth,
} from "@/lib/budget-month"
import { parseMoneyBrl, formatMoneyBrlTyping } from "@/lib/money-brl"
import { toastError } from "@/lib/toast"
import { invokeEdgeJson } from "@/lib/edge-invoke"
import {
    dispatchFinanceCategoriesMutated,
} from "@/lib/workspace-data-events"
import { useIsMobile } from "@/hooks/use-mobile"

export type CategoryCreateDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: User | null
    workspaceId: string | null
}

export function CategoryCreateDialog({
    open,
    onOpenChange,
    user,
    workspaceId,
}: CategoryCreateDialogProps) {
    const router = useRouter()
    const budgetMonthYm = React.useMemo(() => formatYearMonth(new Date()), [])
    const dialogBudgetPeriod = React.useMemo(
        () => periodBoundsFromYearMonth(budgetMonthYm),
        [budgetMonthYm]
    )

    const [name, setName] = React.useState("")
    const [type, setType] = React.useState<"income" | "expense">("expense")
    const [color, setColor] = React.useState<string>(CATEGORY_COLORS[0])
    const [icon, setIcon] = React.useState<CategoryIconId>(CATEGORY_ICONS[0])
    const [editBudgetAmount, setEditBudgetAmount] = React.useState("")
    const [saving, setSaving] = React.useState(false)
    const isMobile = useIsMobile()

    const resetForm = React.useCallback(() => {
        setName("")
        setType("expense")
        setColor(CATEGORY_COLORS[0])
        setIcon(CATEGORY_ICONS[0])
        setEditBudgetAmount("")
    }, [])

    React.useEffect(() => {
        if (!open) resetForm()
    }, [open, resetForm])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !workspaceId) return

        setSaving(true)

        const categoryData = {
            user_id: user.id,
            workspace_id: workspaceId,
            name,
            type,
            color,
            icon,
        }

        const saveExpenseBudgetForCategory = async (
            categoryId: string
        ): Promise<boolean> => {
            if (type !== "expense") return true
            const raw = editBudgetAmount.trim()
            if (raw.length === 0) return true
            const amt = parseMoneyBrl(editBudgetAmount)
            if (amt === null || amt <= 0) {
                toastError("Informe um valor válido em reais, maior que zero.")
                return false
            }
            const { error: budErr } = await upsertCategoryBudget({
                userId: user.id,
                workspaceId,
                categoryId,
                yearMonth: budgetMonthYm,
                amount: amt,
            })
            if (budErr) {
                toastError(
                    formatSupabasePostgrestError(budErr) ??
                        "Não foi possível salvar o orçamento.",
                )
                return false
            }
            return true
        }

        const { data: inserted, error: insErr } = await supabase
            .from("categories")
            .insert(categoryData)
            .select("id")
            .single()

        if (insErr) {
            setSaving(false)
            toastError(
                formatSupabasePostgrestError(insErr) ??
                    "Não foi possível criar a categoria. Tente novamente.",
            )
            return
        }

        const budgetOk = await saveExpenseBudgetForCategory(inserted.id)
        if (!budgetOk) {
            setSaving(false)
            dispatchFinanceCategoriesMutated()
            router.refresh()
            return
        }

        void invokeEdgeJson("dispatch-notifications", {
            body: {
                workspace_id: workspaceId,
                type: "system",
                title: "Categoria criada",
                body: `Você criou a categoria “${name}”.`,
                metadata: {
                    kind: "category_created",
                    critical: false,
                },
            },
        }).catch(() => {
            /* non-blocking */
        })

        setSaving(false)
        onOpenChange(false)
        resetForm()
        dispatchFinanceCategoriesMutated()
        router.refresh()
    }

    if (!user || !workspaceId) return null

    const description =
        type === "expense"
            ? "Adicione uma categoria. Se for despesa, você pode definir o limite do mês atual."
            : "Adicione uma nova categoria"

    const fieldsBlock = (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="global-cat-name">Nome</Label>
                <Input
                    id="global-cat-name"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setName(e.target.value)
                    }
                    placeholder="Ex: Alimentação"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>Tipo</Label>
                <TransactionFormTypeSegment
                    value={type}
                    onChange={setType}
                    fullWidth
                />
            </div>

            <CategoryAppearanceFields
                color={color}
                onColorChange={setColor}
                icon={icon}
                onIconChange={setIcon}
            />

            {type === "expense" ? (
                <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">
                        Limite de despesas para {dialogBudgetPeriod.period_start} a{" "}
                        {dialogBudgetPeriod.period_end}.
                    </p>
                    <div className="space-y-2">
                        <Label htmlFor="global-cat-budget">Valor limite (R$)</Label>
                        <Input
                            id="global-cat-budget"
                            inputMode="decimal"
                            placeholder="Ex: 1.500,00"
                            value={editBudgetAmount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setEditBudgetAmount(formatMoneyBrlTyping(e.target.value))
                            }
                        />
                    </div>
                </div>
            ) : null}
        </div>
    )

    const onSheetOpenChange = (next: boolean) => {
        if (!next && saving) return
        onOpenChange(next)
    }

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onSheetOpenChange}>
                <SheetContent
                    side="bottom"
                    fillMobileViewport
                    showCloseButton
                    className={mobileFormSheetContentClassName}
                >
                    <MobileSheetFormDragStrip />
                    <MobileSheetFormStickyHeader
                        title="Nova categoria"
                        description={description}
                    />
                    <CustomForm
                        onSubmit={handleSubmit}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <div className="min-h-0 flex-1 overflow-y-auto px-4">
                            {fieldsBlock}
                        </div>
                        <SheetFooter className="mt-0 shrink-0 gap-2 border-t border-border/60 px-4 pt-4">
                            <Button
                                type="submit"
                                disabled={saving}
                                className="h-10 w-full"
                            >
                                {saving ? "Salvando..." : "Salvar"}
                            </Button>
                        </SheetFooter>
                    </CustomForm>
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onSheetOpenChange}>
            <DialogContent className="flex max-h-[min(90dvh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
                <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
                    <DialogTitle>Nova categoria</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <CustomForm
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2">
                        {fieldsBlock}
                    </div>
                    <DialogFooter className="mx-0 mb-0 mt-0 shrink-0 flex-row flex-wrap justify-end gap-2 rounded-b-xl border-t border-border/60 bg-background px-6 pt-4 pb-5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            disabled={saving}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" size="sm" disabled={saving}>
                            {saving ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </CustomForm>
            </DialogContent>
        </Dialog>
    )
}
