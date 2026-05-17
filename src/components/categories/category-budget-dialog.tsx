"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import type { Budget, Category } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { CustomForm } from "@/components/ui/form"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { periodBoundsFromYearMonth } from "@/lib/budget-month"
import { upsertCategoryBudget, deleteCategoryBudgetById } from "@/lib/category-budget-ops"
import { formatMoneyBrlInput, formatMoneyBrlTyping, parseMoneyBrl } from "@/lib/money-brl"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"

type Props = {
    user: User
    workspaceId: string
    category: Category
    yearMonth: string
    existing: Budget | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaved: () => void
}

export function CategoryBudgetDialog({
    user,
    workspaceId,
    category,
    yearMonth,
    existing,
    open,
    onOpenChange,
    onSaved,
}: Props) {
    const isMobile = useIsMobile()
    const [amount, setAmount] = useState("")
    const [saving, setSaving] = useState(false)
    const [removing, setRemoving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { period_start, period_end } = periodBoundsFromYearMonth(yearMonth)
    useEffect(() => {
        if (!open) return
        // Defer state updates to avoid synchronous setState in effects.
        queueMicrotask(() => {
            setError(null)
            if (existing) setAmount(formatMoneyBrlInput(Number(existing.amount)))
            else setAmount("")
        })
    }, [open, existing])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        const amt = parseMoneyBrl(amount)
        if (amt === null || amt <= 0) {
            setError("Informe um valor válido em reais, maior que zero.")
            setSaving(false)
            return
        }

        const { error: upErr } = await upsertCategoryBudget({
            userId: user.id,
            workspaceId,
            categoryId: category.id,
            yearMonth,
            amount: amt,
        })

        setSaving(false)
        if (upErr) {
            setError(formatSupabasePostgrestError(upErr) ?? "Não foi possível salvar o orçamento.")
            return
        }
        onOpenChange(false)
        onSaved()
    }

    const handleRemove = async () => {
        if (!existing) return
        if (!confirm("Remover o orçamento desta categoria para este período?")) return
        setRemoving(true)
        setError(null)
        const { error: delErr } = await deleteCategoryBudgetById(existing.id, workspaceId)
        setRemoving(false)
        if (delErr) {
            setError(formatSupabasePostgrestError(delErr) ?? "Não foi possível remover.")
            return
        }
        onOpenChange(false)
        onSaved()
    }

    const handleOpenChange = (next: boolean) => {
        if (!next && (saving || removing)) return
        onOpenChange(next)
    }

    const fieldsBlock = (
        <div className="space-y-4 py-2">
            <div className="space-y-2">
                <Label htmlFor="budget-amount">Valor limite (R$)</Label>
                <Input
                    id="budget-amount"
                    inputMode="decimal"
                    placeholder="Ex: 1.500,00"
                    value={amount}
                    onChange={(e) => setAmount(formatMoneyBrlTyping(e.target.value))}
                    required
                />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
    )

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={handleOpenChange}>
                <SheetContent
                    side="bottom"
                    fillMobileViewport
                    showCloseButton
                    className={mobileFormSheetContentClassName}
                >
                    <MobileSheetFormDragStrip />
                    <MobileSheetFormStickyHeader
                        title={`Orçamento — ${category.name}`}
                        description={`Limite de despesas para ${period_start} a ${period_end}.`}
                    />
                    <CustomForm onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 overflow-y-auto px-4">{fieldsBlock}</div>
                        <SheetFooter className="mt-0 shrink-0 flex-col gap-2 border-t border-border/60 px-4 pt-4">
                            {existing ? (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    className="w-full"
                                    disabled={saving || removing}
                                    onClick={() => void handleRemove()}
                                >
                                    {removing ? "Removendo…" : "Remover"}
                                </Button>
                            ) : null}
                            <Button
                                type="submit"
                                disabled={saving || removing}
                                className="h-10 w-full"
                            >
                                {saving ? "Salvando…" : "Salvar"}
                            </Button>
                        </SheetFooter>
                    </CustomForm>
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <CustomForm onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Orçamento — {category.name}</DialogTitle>
                        <DialogDescription>
                            Limite de despesas para {period_start} a {period_end}.
                        </DialogDescription>
                    </DialogHeader>
                    {fieldsBlock}
                    <DialogFooter>
                        {existing ? (
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={saving || removing}
                                onClick={() => void handleRemove()}
                            >
                                {removing ? "Removendo…" : "Remover"}
                            </Button>
                        ) : null}
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={saving || removing}>
                            {saving ? "Salvando…" : "Salvar"}
                        </Button>
                    </DialogFooter>
                </CustomForm>
            </DialogContent>
        </Dialog>
    )
}
